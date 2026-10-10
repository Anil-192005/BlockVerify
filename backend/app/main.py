import os
from datetime import datetime
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.models import User, Document, Organization, VerificationLog, BlockchainTransaction, AuditLog
from app.auth import hash_password
from app.routes import auth_routes, doc_routes, verify_routes, admin_routes
from app.blockchain import blockchain_service
from app.qr_service import qr_service
from app.pdf_generator import generate_certificate_pdf
from app.ipfs import ipfs_service

# Create database tables helper (invoked on startup with retry)
def init_db_tables():
    import time
    for attempt in range(10):
        try:
            Base.metadata.create_all(bind=engine)
            return True
        except Exception as e:
            if attempt == 9:
                print(f"Warning: Database tables could not be initialized: {e}")
                return False
            time.sleep(2)
    return False

# Rate limiter
limiter = Limiter(key_func=get_remote_address, default_limits=["120/minute"])

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Production-Ready Blockchain-Based Document Authentication and Verification System Using Ethereum Sepolia",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "https://blockverify.vercel.app",
        settings.FRONTEND_URL,
    ],
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static file directories for generated certs and QR codes
app.mount("/certs", StaticFiles(directory=str(settings.CERT_DIR)), name="certs")
app.mount("/qrs", StaticFiles(directory=str(settings.QR_DIR)), name="qrs")

# Mount API routes
app.include_router(auth_routes.router, prefix=settings.API_PREFIX)
app.include_router(doc_routes.router, prefix=settings.API_PREFIX)
app.include_router(verify_routes.router, prefix=settings.API_PREFIX)
app.include_router(admin_routes.router, prefix=settings.API_PREFIX)

@app.get("/health")
@app.get("/api/health")
def health_check():
    db_status = "healthy"
    try:
        db = SessionLocal()
        db.execute(Base.metadata.tables["users"].select().limit(1))
        db.close()
    except Exception as e:
        db_status = f"unhealthy: {str(e)[:50]}"

    return {
        "status": "healthy" if "unhealthy" not in db_status else "degraded",
        "timestamp": datetime.utcnow().isoformat(),
        "version": settings.VERSION,
        "database": db_status,
        "blockchain_network": "Ethereum Sepolia",
        "smart_contract": settings.CONTRACT_ADDRESS,
        "simulated_chain": settings.USE_SIMULATED_CHAIN
    }

@app.get("/")
def root():
    return {
        "project": "BlockVerify",
        "tagline": "Verify Documents. Trust the Blockchain.",
        "description": "Blockchain-Based Document Authentication and Verification System",
        "network": "Ethereum Sepolia Testnet",
        "status": "online",
        "docs": "/docs",
        "health": "/health",
        "smart_contract": settings.CONTRACT_ADDRESS,
        "etherscan_contract": blockchain_service.get_etherscan_contract_url()
    }

@app.get("/api/blockchain/transaction/{tx_hash}")
def get_blockchain_tx(tx_hash: str):
    from app.routes.admin_routes import get_transaction_by_hash
    db = SessionLocal()
    try:
        return get_transaction_by_hash(tx_hash, db)
    finally:
        db.close()

# Seed default accounts and demonstration certificates on startup
@app.on_event("startup")
def seed_demo_data():
    init_db_tables()
    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            admin_user = User(
                name="System Administrator",
                email="admin@blockverify.eth",
                password_hash=hash_password("admin123"),
                role="admin",
                organization="Ethereum Root Governance",
                wallet_address="0x5FbDB2315678afecb367f032d93F642f64180aa3"
            )
            issuer_user = User(
                name="ABC Engineering College Registrar",
                email="issuer@abccollege.edu",
                password_hash=hash_password("issuer123"),
                role="issuer",
                organization="ABC Engineering College",
                wallet_address="0x8A92d00f7d54c12ef4b98c36391d4e082ef73812"
            )
            verifier_user = User(
                name="HR Verifier (TechCorp)",
                email="verifier@techcorp.com",
                password_hash=hash_password("verifier123"),
                role="verifier",
                organization="TechCorp Global Recruiting",
                wallet_address="0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
            )
            db.add_all([admin_user, issuer_user, verifier_user])
            db.commit()

            # Seed organizations
            org1 = Organization(
                name="ABC Engineering College",
                org_type="University",
                wallet_address="0x8A92d00f7d54c12ef4b98c36391d4e082ef73812",
                is_approved=True,
                contact_email="registrar@abccollege.edu"
            )
            org2 = Organization(
                name="XYZ University",
                org_type="University",
                wallet_address="0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
                is_approved=True,
                contact_email="credentials@xyz.edu"
            )
            org3 = Organization(
                name="Global Tech Solutions",
                org_type="Company",
                wallet_address="0x90F79bf6EB2c4f870365E785982E1f101E93b906",
                is_approved=True,
                contact_email="hr@globaltech.com"
            )
            org4 = Organization(
                name="City Hospital",
                org_type="Hospital",
                wallet_address="0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
                is_approved=True,
                contact_email="records@cityhospital.org"
            )
            db.add_all([org1, org2, org3, org4])
            db.commit()

            # Certificate 1: Anil M (Valid Degree)
            doc_id = "CERT-2026-000001"
            qr_path, qr_base64 = qr_service.generate_verification_qr(doc_id)
            pdf_path = generate_certificate_pdf(
                recipient_name="Anil M",
                recipient_id="1AB23CS001",
                document_type="Degree Certificate",
                organization_name="ABC Engineering College",
                document_id=doc_id,
                qr_image_path=qr_path,
                issued_date_str="October 07, 2026"
            )

            with open(pdf_path, "rb") as f:
                pdf_bytes = f.read()

            file_hash, ipfs_cid = ipfs_service.upload_bytes(pdf_bytes, os.path.basename(pdf_path))
            tx_res = blockchain_service.register_document(
                document_hash=file_hash,
                document_cid=ipfs_cid,
                document_id=doc_id,
                document_type="Degree Certificate",
                recipient_name="Anil M",
                organization_name="ABC Engineering College",
                issuer_wallet=issuer_user.wallet_address
            )

            cert_doc = Document(
                document_id=doc_id,
                owner_name="Anil M",
                recipient_id="1AB23CS001",
                document_type="Degree Certificate",
                organization_name="ABC Engineering College",
                file_name=os.path.basename(pdf_path),
                file_size_bytes=len(pdf_bytes),
                file_path=pdf_path,
                file_hash=file_hash,
                ipfs_cid=ipfs_cid,
                qr_code_path=qr_path,
                qr_code_base64=qr_base64,
                transaction_hash=tx_res["transaction_hash"],
                block_number=tx_res["block_number"],
                issuer_wallet=issuer_user.wallet_address,
                issuer_id=issuer_user.id,
                status="VALID"
            )
            db.add(cert_doc)

            tx1 = BlockchainTransaction(
                tx_hash=tx_res["transaction_hash"],
                block_number=tx_res["block_number"],
                from_address=issuer_user.wallet_address,
                to_address=settings.CONTRACT_ADDRESS,
                action="registerDocument",
                document_id=doc_id,
                document_hash=file_hash,
                gas_used=tx_res.get("gas_used", 98450),
                status="CONFIRMED",
                network="Ethereum Sepolia",
                timestamp=datetime.utcnow()
            )
            db.add(tx1)

            # Certificate 2: Sarah Jenkins (Diploma)
            doc_id2 = "CERT-2026-000002"
            qr_path2, qr_base64_2 = qr_service.generate_verification_qr(doc_id2)
            pdf_path2 = generate_certificate_pdf(
                recipient_name="Sarah Jenkins",
                recipient_id="1AB23CS045",
                document_type="Marks Card",
                organization_name="ABC Engineering College",
                document_id=doc_id2,
                qr_image_path=qr_path2,
                issued_date_str="August 15, 2026"
            )
            with open(pdf_path2, "rb") as f:
                pdf_bytes2 = f.read()
            file_hash2, ipfs_cid2 = ipfs_service.upload_bytes(pdf_bytes2, os.path.basename(pdf_path2))
            tx_res2 = blockchain_service.register_document(
                document_hash=file_hash2,
                document_cid=ipfs_cid2,
                document_id=doc_id2,
                document_type="Marks Card",
                recipient_name="Sarah Jenkins",
                organization_name="ABC Engineering College",
                issuer_wallet=issuer_user.wallet_address
            )
            cert_doc2 = Document(
                document_id=doc_id2,
                owner_name="Sarah Jenkins",
                recipient_id="1AB23CS045",
                document_type="Marks Card",
                organization_name="ABC Engineering College",
                file_name=os.path.basename(pdf_path2),
                file_size_bytes=len(pdf_bytes2),
                file_path=pdf_path2,
                file_hash=file_hash2,
                ipfs_cid=ipfs_cid2,
                qr_code_path=qr_path2,
                qr_code_base64=qr_base64_2,
                transaction_hash=tx_res2["transaction_hash"],
                block_number=tx_res2["block_number"],
                issuer_wallet=issuer_user.wallet_address,
                issuer_id=issuer_user.id,
                status="VALID"
            )
            db.add(cert_doc2)

            tx2 = BlockchainTransaction(
                tx_hash=tx_res2["transaction_hash"],
                block_number=tx_res2["block_number"],
                from_address=issuer_user.wallet_address,
                to_address=settings.CONTRACT_ADDRESS,
                action="registerDocument",
                document_id=doc_id2,
                document_hash=file_hash2,
                gas_used=tx_res2.get("gas_used", 98450),
                status="CONFIRMED",
                network="Ethereum Sepolia",
                timestamp=datetime.utcnow()
            )
            db.add(tx2)

            # Certificate 3: Robert Smith (Revoked)
            doc_id3 = "CERT-2026-000003"
            qr_path3, qr_base64_3 = qr_service.generate_verification_qr(doc_id3)
            pdf_path3 = generate_certificate_pdf(
                recipient_name="Robert Smith",
                recipient_id="1AB23CS099",
                document_type="Experience Certificate",
                organization_name="ABC Engineering College",
                document_id=doc_id3,
                qr_image_path=qr_path3,
                issued_date_str="September 01, 2026"
            )
            with open(pdf_path3, "rb") as f:
                pdf_bytes3 = f.read()
            file_hash3, ipfs_cid3 = ipfs_service.upload_bytes(pdf_bytes3, os.path.basename(pdf_path3))
            tx_res3 = blockchain_service.register_document(
                document_hash=file_hash3,
                document_cid=ipfs_cid3,
                document_id=doc_id3,
                document_type="Experience Certificate",
                recipient_name="Robert Smith",
                organization_name="ABC Engineering College",
                issuer_wallet=issuer_user.wallet_address
            )
            cert_doc3 = Document(
                document_id=doc_id3,
                owner_name="Robert Smith",
                recipient_id="1AB23CS099",
                document_type="Experience Certificate",
                organization_name="ABC Engineering College",
                file_name=os.path.basename(pdf_path3),
                file_size_bytes=len(pdf_bytes3),
                file_path=pdf_path3,
                file_hash=file_hash3,
                ipfs_cid=ipfs_cid3,
                qr_code_path=qr_path3,
                qr_code_base64=qr_base64_3,
                transaction_hash=tx_res3["transaction_hash"],
                block_number=tx_res3["block_number"],
                issuer_wallet=issuer_user.wallet_address,
                issuer_id=issuer_user.id,
                status="REVOKED",
                revocation_reason="Grade miscalculation - credential recalled by Dean",
                revoked_by="ABC Engineering College Registrar",
                revoked_at=datetime.utcnow()
            )
            db.add(cert_doc3)

            blockchain_service.revoke_document(doc_id3, "Grade miscalculation", issuer_user.wallet_address)
            db.commit()

        # Synchronize all documents in DB into blockchain service simulation state
        for d in db.query(Document).all():
            clean_h = d.file_hash.lower() if d.file_hash.startswith("0x") else "0x" + d.file_hash.lower()
            blockchain_service.simulated_state[clean_h] = {
                "document_hash": clean_h,
                "document_cid": d.ipfs_cid or "",
                "document_id": d.document_id,
                "document_type": d.document_type,
                "recipient_name": d.owner_name,
                "organization_name": d.organization_name,
                "issuer_wallet": d.issuer_wallet,
                "timestamp": int(d.issued_at.timestamp()) if d.issued_at else int(datetime.utcnow().timestamp()),
                "revoked": d.status == "REVOKED",
                "revocation_reason": d.revocation_reason or "",
                "revoked_at": int(d.revoked_at.timestamp()) if d.revoked_at else 0,
                "transaction_hash": d.transaction_hash or "",
                "block_number": d.block_number or 5621481
            }
            blockchain_service.id_to_hash[d.document_id.lower()] = clean_h
    finally:
        db.close()

