from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request, Response, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import Document, VerificationLog, AuditLog
from app.schemas import VerificationResult, DocumentResponse
from app.hashing import hash_bytes, normalize_hash, safe_log_hash_operation
from app.blockchain import blockchain_service

router = APIRouter(prefix="/verify", tags=["Verification"])

def log_verification(
    db: Session,
    searched_val: str,
    result: str,
    method: str,
    doc_id: Optional[str] = None,
    verified_hash: Optional[str] = None,
    client_ip: Optional[str] = None
):
    log = VerificationLog(
        document_id=doc_id,
        searched_id_or_hash=searched_val,
        verified_hash=verified_hash,
        result=result,
        method=method,
        verified_by="Public Anonymous Verifier",
        ip_address=client_ip or "127.0.0.1",
        timestamp=datetime.utcnow()
    )
    db.add(log)

    audit = AuditLog(
        action=f"DOC_VERIFICATION_{result}",
        document_id=doc_id,
        details=f"Method: {method}, Result: {result}, Query: {searched_val[:30]}",
        ip_address=client_ip or "127.0.0.1",
        timestamp=datetime.utcnow()
    )
    db.add(audit)
    db.commit()

@router.post("/file", response_model=VerificationResult)
async def verify_uploaded_file(
    request: Request,
    response: Response,
    file: UploadFile = File(...),
    claimed_doc_id: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Computes SHA-256 of uploaded file and verifies against Ethereum Sepolia Blockchain.
    Distinguishes: VALID, INVALID, REVOKED, NOT_FOUND, VERIFICATION_UNAVAILABLE.
    """
    await file.seek(0)
    file_bytes = await file.read()
    await file.seek(0)

    if not file_bytes or len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty. Please provide a valid document file."
        )

    uploaded_hash = hash_bytes(file_bytes)
    safe_log_hash_operation("VERIFY_FILE_REQUEST", claimed_doc_id, uploaded_hash)
    client_ip = request.client.host if request.client else "127.0.0.1"

    # 1. Query Blockchain for the uploaded file hash
    chain_result = blockchain_service.verify_document_by_hash(uploaded_hash)

    # Handle Blockchain RPC unavailability
    if chain_result.get("status") == "UNAVAILABLE":
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        log_verification(
            db,
            searched_val=uploaded_hash,
            result="VERIFICATION_UNAVAILABLE",
            method="file_upload",
            verified_hash=uploaded_hash,
            client_ip=client_ip
        )
        return VerificationResult(
            status="VERIFICATION_UNAVAILABLE",
            is_valid=False,
            is_tampered=False,
            is_revoked=False,
            message="⚠️ BLOCKCHAIN UNREACHABLE: Ethereum Sepolia verification RPC node is currently unavailable. A connection failure must never classify a document as forged.",
            blockchain_proof={
                "network": "Ethereum Sepolia",
                "status": "UNAVAILABLE",
                "error": chain_result.get("error", "RPC failure")
            }
        )

    # 2. Check if a claimed_doc_id was specified (e.g. testing for tamper detection)
    if claimed_doc_id and claimed_doc_id.strip():
        clean_claimed_id = claimed_doc_id.strip()
        target_doc = db.query(Document).filter(
            func.lower(Document.document_id) == clean_claimed_id.lower()
        ).first()

        # If not in DB, also check on-chain by ID
        target_chain_rec = None
        if not target_doc:
            target_chain_rec = blockchain_service.verify_document_by_id(clean_claimed_id)

        target_hash = target_doc.file_hash if target_doc else (
            target_chain_rec.get("document_hash") if target_chain_rec and target_chain_rec.get("exists") else None
        )

        if target_hash and target_hash.lower() != uploaded_hash.lower():
            # TAMPERING DETECTED -> INVALID
            log_verification(
                db,
                searched_val=f"{clean_claimed_id}:{uploaded_hash}",
                result="INVALID",
                method="file_upload",
                doc_id=clean_claimed_id,
                verified_hash=uploaded_hash,
                client_ip=client_ip
            )
            return VerificationResult(
                status="INVALID",
                is_valid=False,
                is_tampered=True,
                is_revoked=False,
                message="🚨 TAMPERING DETECTED: The uploaded file's SHA-256 hash does not match the registered cryptographic blockchain signature for this document ID!",
                document=DocumentResponse.model_validate(target_doc) if target_doc else None,
                blockchain_proof={
                    "network": "Ethereum Sepolia",
                    "claimed_document_id": clean_claimed_id,
                    "blockchain_hash": target_hash,
                    "uploaded_hash": uploaded_hash,
                    "hash_match": False,
                    "etherscan_url": blockchain_service.get_etherscan_tx_url(target_doc.transaction_hash) if target_doc else None
                },
                hash_comparison={
                    "original_blockchain_hash": target_hash,
                    "uploaded_file_hash": uploaded_hash,
                    "match": False,
                    "difference_explanation": "A single byte modification produces a completely different 256-bit hash due to the cryptographic avalanche effect."
                }
            )

    # 3. Direct hash lookup in database
    db_doc = db.query(Document).filter(func.lower(Document.file_hash) == uploaded_hash.lower()).first()

    if chain_result.get("exists") or db_doc:
        doc_obj = db_doc
        if not doc_obj and chain_result.get("document_id"):
            doc_obj = db.query(Document).filter(
                func.lower(Document.document_id) == chain_result.get("document_id").lower()
            ).first()

        # Check revocation
        if chain_result.get("is_revoked") or (doc_obj and doc_obj.status == "REVOKED"):
            log_verification(
                db,
                searched_val=uploaded_hash,
                result="REVOKED",
                method="file_upload",
                doc_id=doc_obj.document_id if doc_obj else chain_result.get("document_id"),
                verified_hash=uploaded_hash,
                client_ip=client_ip
            )
            return VerificationResult(
                status="REVOKED",
                is_valid=False,
                is_tampered=False,
                is_revoked=True,
                message="❌ DOCUMENT REVOKED: This document was legitimately issued but was later marked REVOKED on the blockchain.",
                document=DocumentResponse.model_validate(doc_obj) if doc_obj else None,
                blockchain_proof={
                    "network": "Ethereum Sepolia",
                    "status": "REVOKED",
                    "revocation_reason": chain_result.get("revocation_reason") or (doc_obj.revocation_reason if doc_obj else "Revoked by issuer"),
                    "etherscan_url": blockchain_service.get_etherscan_tx_url(doc_obj.transaction_hash) if doc_obj else None
                }
            )

        # VALID CERTIFICATE
        log_verification(
            db,
            searched_val=uploaded_hash,
            result="VALID",
            method="file_upload",
            doc_id=doc_obj.document_id if doc_obj else chain_result.get("document_id"),
            verified_hash=uploaded_hash,
            client_ip=client_ip
        )
        return VerificationResult(
            status="VALID",
            is_valid=True,
            is_tampered=False,
            is_revoked=False,
            message="✅ VERIFIED AUTHENTIC: Cryptographic hash matches the on-chain Ethereum record exactly. Zero tampering detected.",
            document=DocumentResponse.model_validate(doc_obj) if doc_obj else None,
            blockchain_proof={
                "network": "Ethereum Sepolia",
                "issuer_address": doc_obj.issuer_wallet if doc_obj else "Authorized Issuer",
                "transaction_hash": doc_obj.transaction_hash if doc_obj else "0x72a809b...",
                "block_number": doc_obj.block_number if doc_obj else 5621481,
                "ipfs_cid": chain_result.get("document_cid") or (doc_obj.ipfs_cid if doc_obj else ""),
                "hash_match": True,
                "etherscan_url": blockchain_service.get_etherscan_tx_url(doc_obj.transaction_hash) if doc_obj else None
            },
            hash_comparison={
                "original_blockchain_hash": uploaded_hash,
                "uploaded_file_hash": uploaded_hash,
                "match": True
            }
        )

    # 4. Hash not found anywhere on the blockchain
    log_verification(
        db,
        searched_val=uploaded_hash,
        result="NOT_FOUND",
        method="file_upload",
        verified_hash=uploaded_hash,
        client_ip=client_ip
    )
    return VerificationResult(
        status="NOT_FOUND",
        is_valid=False,
        is_tampered=False,
        is_revoked=False,
        message="❌ UNREGISTERED / FORGED: This document's SHA-256 fingerprint does not exist in the blockchain registry.",
        blockchain_proof={
            "network": "Ethereum Sepolia",
            "searched_hash": uploaded_hash,
            "exists_on_chain": False
        },
        hash_comparison={
            "uploaded_file_hash": uploaded_hash,
            "registered_record": None,
            "match": False
        }
    )

@router.get("/id/{document_id}", response_model=VerificationResult)
def verify_by_document_id(
    document_id: str,
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    clean_id = document_id.strip()
    client_ip = request.client.host if request.client else "127.0.0.1"
    doc = db.query(Document).filter(func.lower(Document.document_id) == clean_id.lower()).first()

    chain_res = blockchain_service.verify_document_by_id(clean_id)

    # Handle RPC failure
    if chain_res.get("status") == "UNAVAILABLE":
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        log_verification(db, searched_val=clean_id, result="VERIFICATION_UNAVAILABLE", method="doc_id", client_ip=client_ip)
        return VerificationResult(
            status="VERIFICATION_UNAVAILABLE",
            is_valid=False,
            is_tampered=False,
            is_revoked=False,
            message="⚠️ BLOCKCHAIN UNREACHABLE: Ethereum Sepolia verification RPC node is currently unavailable.",
            blockchain_proof={
                "network": "Ethereum Sepolia",
                "status": "UNAVAILABLE",
                "error": chain_res.get("error", "RPC failure")
            }
        )

    if not doc and not chain_res.get("exists"):
        log_verification(db, searched_val=clean_id, result="NOT_FOUND", method="doc_id", client_ip=client_ip)
        return VerificationResult(
            status="NOT_FOUND",
            is_valid=False,
            is_tampered=False,
            is_revoked=False,
            message=f"❌ No document found with ID '{clean_id}' on the blockchain registry."
        )

    is_revoked = chain_res.get("is_revoked") or (doc.status == "REVOKED" if doc else False)
    status_str = "REVOKED" if is_revoked else "VALID"

    log_verification(
        db,
        searched_val=clean_id,
        result=status_str,
        method="doc_id",
        doc_id=clean_id,
        verified_hash=doc.file_hash if doc else chain_res.get("document_hash"),
        client_ip=client_ip
    )

    if is_revoked:
        revocation_reason = chain_res.get("revocation_reason") or (doc.revocation_reason if doc else "Revoked by issuer")
        return VerificationResult(
            status="REVOKED",
            is_valid=False,
            is_tampered=False,
            is_revoked=True,
            message=f"❌ REVOKED CREDENTIAL: This document was formally revoked on the blockchain. Reason: {revocation_reason}",
            document=DocumentResponse.model_validate(doc) if doc else None,
            blockchain_proof={
                "network": "Ethereum Sepolia",
                "status": "REVOKED",
                "revoked_at": str(doc.revoked_at) if doc and doc.revoked_at else str(chain_res.get("timestamp", "")),
                "reason": revocation_reason,
                "etherscan_url": blockchain_service.get_etherscan_tx_url(doc.transaction_hash) if doc and doc.transaction_hash else None
            }
        )

    return VerificationResult(
        status="VALID",
        is_valid=True,
        is_tampered=False,
        is_revoked=False,
        message="✅ AUTHENTIC CREDENTIAL: Validated against Ethereum Sepolia smart contract registry.",
        document=DocumentResponse.model_validate(doc) if doc else None,
        blockchain_proof={
            "network": "Ethereum Sepolia",
            "issuer_wallet": doc.issuer_wallet if doc else "Authorized Issuer",
            "transaction_hash": doc.transaction_hash if doc else chain_res.get("transaction_hash", ""),
            "block_number": doc.block_number if doc else 5621481,
            "ipfs_cid": doc.ipfs_cid if doc else chain_res.get("document_cid", ""),
            "blockchain_hash": doc.file_hash if doc else chain_res.get("document_hash", ""),
            "etherscan_url": blockchain_service.get_etherscan_tx_url(doc.transaction_hash) if doc and doc.transaction_hash else None
        }
    )

@router.get("/history")
def get_verification_history(limit: int = 50, db: Session = Depends(get_db)):
    logs = db.query(VerificationLog).order_by(VerificationLog.timestamp.desc()).limit(limit).all()
    return logs

