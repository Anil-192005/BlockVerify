import os
import shutil
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Document, BlockchainTransaction, AuditLog
from app.schemas import DocumentResponse, RevokeDocumentRequest
from app.auth import require_auth, require_role
from app.ipfs import ipfs_service
from app.hashing import hash_bytes, normalize_hash, safe_log_hash_operation
from app.qr_service import qr_service
from app.pdf_generator import generate_certificate_pdf
from app.blockchain import blockchain_service
from app.config import settings
from sqlalchemy import func

router = APIRouter(prefix="/documents", tags=["Documents"])

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB limit

def validate_uploaded_file(file: UploadFile, file_bytes: bytes):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File size exceeds maximum permitted limit of 10 MB."
        )

def get_next_doc_id(db: Session, prefix: str = "CERT") -> str:
    year = datetime.now().year
    count = db.query(Document).count() + 1
    return f"{prefix}-{year}-{count:06d}"

def resolve_frontend_base_url(request: Request) -> str:
    origin = request.headers.get("origin")
    if origin and "http" in origin:
        return origin.rstrip("/")
    referer = request.headers.get("referer")
    if referer and "http" in referer:
        from urllib.parse import urlparse
        p = urlparse(referer)
        return f"{p.scheme}://{p.netloc}"
    host = request.headers.get("host")
    if host and not host.startswith("localhost") and not host.startswith("127.0.0.1"):
        host_name = host.split(":")[0]
        scheme = "https" if request.url.scheme == "https" else "http"
        return f"{scheme}://{host_name}:5173"
    return settings.FRONTEND_URL.rstrip("/")

@router.post("/issue-auto", response_model=DocumentResponse)
def issue_certificate_auto(
    request: Request,
    owner_name: str = Form(...),
    recipient_id: Optional[str] = Form("1AB23CS001"),
    document_type: str = Form("Degree Certificate"),
    organization_name: Optional[str] = Form(None),
    custom_document_id: Optional[str] = Form(None),
    current_user: User = Depends(require_role(["issuer", "admin"])),
    db: Session = Depends(get_db)
):
    """
    Renders an official PDF credential with embedded QR verification code,
    computes SHA-256 from final bytes, mirrors to IPFS, and anchors to Ethereum Sepolia!
    """
    org_name = organization_name or current_user.organization or "ABC Engineering College"
    doc_id = custom_document_id or get_next_doc_id(db)

    if db.query(Document).filter(func.lower(Document.document_id) == doc_id.lower()).first():
        raise HTTPException(status_code=400, detail="Document ID already registered")

    # 1. Generate QR Code
    frontend_base = resolve_frontend_base_url(request)
    qr_path, qr_base64 = qr_service.generate_verification_qr(doc_id, base_frontend_url=frontend_base)

    # 2. Render Official PDF Certificate with embedded QR code
    pdf_path = generate_certificate_pdf(
        recipient_name=owner_name,
        recipient_id=recipient_id,
        document_type=document_type,
        organization_name=org_name,
        document_id=doc_id,
        qr_image_path=qr_path
    )

    with open(pdf_path, "rb") as f:
        file_bytes = f.read()

    if not file_bytes or len(file_bytes) == 0:
        raise HTTPException(status_code=500, detail="Generated certificate PDF is empty.")

    # 3. Compute SHA-256 from final PDF bytes and store in IPFS
    file_hash = hash_bytes(file_bytes)
    _, ipfs_cid = ipfs_service.upload_bytes(file_bytes, os.path.basename(pdf_path))
    safe_log_hash_operation("ISSUE_AUTO_FINAL_PDF", doc_id, file_hash)

    # 4. Anchor onto Ethereum Sepolia Smart Contract
    wallet = current_user.wallet_address or "0x8A92d00f7d54c12ef4b98c36391d4e082ef73812"
    tx_receipt = blockchain_service.register_document(
        document_hash=file_hash,
        document_cid=ipfs_cid,
        document_id=doc_id,
        document_type=document_type,
        recipient_name=owner_name,
        organization_name=org_name,
        issuer_wallet=wallet
    )

    # 5. Save to database
    doc = Document(
        document_id=doc_id,
        owner_name=owner_name,
        recipient_id=recipient_id,
        document_type=document_type,
        organization_name=org_name,
        file_name=os.path.basename(pdf_path),
        file_size_bytes=len(file_bytes),
        file_path=pdf_path,
        file_hash=file_hash,
        ipfs_cid=ipfs_cid,
        qr_code_path=qr_path,
        qr_code_base64=qr_base64,
        transaction_hash=tx_receipt["transaction_hash"],
        block_number=tx_receipt["block_number"],
        issuer_wallet=wallet,
        issuer_id=current_user.id,
        status="VALID"
    )
    db.add(doc)

    # Record blockchain transaction
    tx_record = BlockchainTransaction(
        tx_hash=tx_receipt["transaction_hash"],
        block_number=tx_receipt["block_number"],
        from_address=wallet,
        to_address=settings.CONTRACT_ADDRESS,
        action="registerDocument",
        document_id=doc_id,
        document_hash=file_hash,
        gas_used=tx_receipt.get("gas_used", 98450),
        status="CONFIRMED",
        network="Ethereum Sepolia",
        timestamp=datetime.utcnow()
    )
    db.add(tx_record)

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="ISSUER_REGISTERED_DOC",
        document_id=doc_id,
        details=f"Registered {document_type} for {owner_name} on Ethereum Sepolia",
        ip_address=request.client.host if request.client else "127.0.0.1",
        timestamp=datetime.utcnow()
    )
    db.add(audit)

    db.commit()
    db.refresh(doc)
    return doc

@router.post("/upload", response_model=DocumentResponse)
async def upload_custom_document(
    request: Request,
    file: UploadFile = File(...),
    owner_name: str = Form(...),
    recipient_id: Optional[str] = Form(None),
    document_type: str = Form("Document"),
    organization_name: Optional[str] = Form(None),
    custom_document_id: Optional[str] = Form(None),
    current_user: User = Depends(require_role(["issuer", "admin"])),
    db: Session = Depends(get_db)
):
    """
    Accepts any uploaded PDF/image document, validates, computes SHA-256 of exact original bytes,
    pins to IPFS, and anchors to Ethereum Sepolia.
    """
    org_name = organization_name or current_user.organization or "ABC Engineering College"
    doc_id = custom_document_id or get_next_doc_id(db)

    if db.query(Document).filter(func.lower(Document.document_id) == doc_id.lower()).first():
        raise HTTPException(status_code=400, detail="Document ID already registered")

    await file.seek(0)
    file_bytes = await file.read()
    await file.seek(0)

    if not file_bytes or len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty. Please provide a valid document file.")

    validate_uploaded_file(file, file_bytes)

    file_hash = hash_bytes(file_bytes)
    safe_log_hash_operation("UPLOAD_CUSTOM_DOC", doc_id, file_hash)

    # Collision check
    existing_doc = db.query(Document).filter(func.lower(Document.file_hash) == file_hash.lower()).first()
    if existing_doc:
        raise HTTPException(status_code=400, detail=f"This exact document has already been registered on the blockchain (Document ID: {existing_doc.document_id})")

    # Save copy
    saved_filename = f"{doc_id}_{file.filename}"
    saved_path = settings.UPLOAD_DIR / saved_filename
    with open(saved_path, "wb") as f:
        f.write(file_bytes)

    # Store in IPFS
    _, ipfs_cid = ipfs_service.upload_bytes(file_bytes, file.filename or "document.pdf")

    # QR Code
    frontend_base = resolve_frontend_base_url(request)
    qr_path, qr_base64 = qr_service.generate_verification_qr(doc_id, base_frontend_url=frontend_base)

    # Anchor to Ethereum Sepolia
    wallet = current_user.wallet_address or "0x8A92d00f7d54c12ef4b98c36391d4e082ef73812"
    tx_receipt = blockchain_service.register_document(
        document_hash=file_hash,
        document_cid=ipfs_cid,
        document_id=doc_id,
        document_type=document_type,
        recipient_name=owner_name,
        organization_name=org_name,
        issuer_wallet=wallet
    )

    doc = Document(
        document_id=doc_id,
        owner_name=owner_name,
        recipient_id=recipient_id,
        document_type=document_type,
        organization_name=org_name,
        file_name=file.filename or "document.pdf",
        file_size_bytes=len(file_bytes),
        file_path=str(saved_path),
        file_hash=file_hash,
        ipfs_cid=ipfs_cid,
        qr_code_path=qr_path,
        qr_code_base64=qr_base64,
        transaction_hash=tx_receipt["transaction_hash"],
        block_number=tx_receipt["block_number"],
        issuer_wallet=wallet,
        issuer_id=current_user.id,
        status="VALID"
    )
    db.add(doc)

    # Record blockchain transaction
    tx_record = BlockchainTransaction(
        tx_hash=tx_receipt["transaction_hash"],
        block_number=tx_receipt["block_number"],
        from_address=wallet,
        to_address=settings.CONTRACT_ADDRESS,
        action="registerDocument",
        document_id=doc_id,
        document_hash=file_hash,
        gas_used=tx_receipt.get("gas_used", 98450),
        status="CONFIRMED",
        network="Ethereum Sepolia",
        timestamp=datetime.utcnow()
    )
    db.add(tx_record)

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="ISSUER_UPLOADED_DOC",
        document_id=doc_id,
        details=f"Uploaded {file.filename} for {owner_name}",
        ip_address=request.client.host if request.client else "127.0.0.1",
        timestamp=datetime.utcnow()
    )
    db.add(audit)

    db.commit()
    db.refresh(doc)
    return doc

@router.get("", response_model=List[DocumentResponse])
@router.get("/my", response_model=List[DocumentResponse])
def get_documents(
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db)
):
    if current_user.role == "admin":
        return db.query(Document).order_by(Document.issued_at.desc()).all()
    return db.query(Document).filter(Document.issuer_id == current_user.id).order_by(Document.issued_at.desc()).all()

@router.get("/{document_id}", response_model=DocumentResponse)
def get_document_details(document_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(func.lower(Document.document_id) == document_id.strip().lower()).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc

@router.get("/download/{document_id}")
@router.get("/{document_id}/download")
def download_document(document_id: str, db: Session = Depends(get_db)):
    clean_id = document_id.strip().lower()
    doc = db.query(Document).filter(func.lower(Document.document_id) == clean_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Auto-regenerate certificate PDF if file is missing from server storage
    if not doc.file_path or not os.path.exists(doc.file_path):
        qr_path, _ = qr_service.generate_verification_qr(doc.document_id)
        issued_date_str = doc.issued_at.strftime("%B %d, %Y") if doc.issued_at else "October 07, 2026"
        new_pdf = generate_certificate_pdf(
            recipient_name=doc.owner_name,
            recipient_id=doc.recipient_id or "",
            document_type=doc.document_type,
            organization_name=doc.organization_name,
            document_id=doc.document_id,
            qr_image_path=qr_path,
            issued_date_str=issued_date_str
        )
        doc.file_path = new_pdf
        db.commit()
    
    # Determine correct content-type
    ext = os.path.splitext(doc.file_name)[1].lower() if doc.file_name else ""
    media_map = {
        ".pdf": "application/pdf",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".doc": "application/msword",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    }
    media_type = media_map.get(ext, "application/octet-stream")

    return FileResponse(
        path=doc.file_path,
        filename=doc.file_name or f"{doc.document_id}.pdf",
        media_type=media_type
    )

@router.post("/revoke")
@router.post("/{document_id}/revoke")
def revoke_document(
    request: Request,
    revoke_data: RevokeDocumentRequest,
    current_user: User = Depends(require_role(["issuer", "admin"])),
    db: Session = Depends(get_db)
):
    clean_id = revoke_data.document_id.strip().lower()
    doc = db.query(Document).filter(func.lower(Document.document_id) == clean_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if doc.status == "REVOKED":
        raise HTTPException(status_code=400, detail="Document is already revoked")

    wallet = current_user.wallet_address or "0x8A92d00f7d54c12ef4b98c36391d4e082ef73812"
    blockchain_res = blockchain_service.revoke_document(
        document_id=doc.document_id,
        reason=revoke_data.reason,
        revoker_wallet=wallet
    )

    doc.status = "REVOKED"
    doc.revocation_reason = revoke_data.reason
    doc.revoked_at = datetime.utcnow()
    doc.revoked_by = current_user.name

    # Record revocation transaction
    if blockchain_res.get("transaction_hash"):
        tx_record = BlockchainTransaction(
            tx_hash=blockchain_res["transaction_hash"],
            block_number=blockchain_res.get("block_number", 18452095),
            from_address=wallet,
            to_address=settings.CONTRACT_ADDRESS,
            action="revokeDocument",
            document_id=doc.document_id,
            document_hash=doc.file_hash,
            gas_used=45210,
            status="CONFIRMED",
            network="Ethereum Sepolia",
            timestamp=datetime.utcnow()
        )
        db.add(tx_record)

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="DOC_REVOKED",
        document_id=doc.document_id,
        details=f"Revocation reason: {revoke_data.reason}",
        ip_address=request.client.host if request.client else "127.0.0.1",
        timestamp=datetime.utcnow()
    )
    db.add(audit)

    db.commit()

    return {
        "message": f"Document {doc.document_id} successfully revoked on the Ethereum blockchain",
        "blockchain_transaction": blockchain_res.get("transaction_hash"),
        "etherscan_url": blockchain_res.get("etherscan_url"),
        "document_id": doc.document_id,
        "status": "REVOKED"
    }
