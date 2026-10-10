from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Document, VerificationLog, User, Organization, BlockchainTransaction, AuditLog
from app.schemas import DashboardStats, DocumentResponse, UserResponse, AuditLogResponse, BlockchainTxResponse
from app.auth import require_role
from app.blockchain import blockchain_service
from app.config import settings

router = APIRouter(prefix="/admin", tags=["Admin & Governance"])

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_docs = db.query(Document).count()
    verified_docs = db.query(Document).filter(Document.status == "VALID").count()
    revoked_docs = db.query(Document).filter(Document.status == "REVOKED").count()
    verification_reqs = db.query(VerificationLog).count()
    total_issuers = db.query(User).filter(User.role == "issuer").count()
    total_users = db.query(User).count()

    recent_docs = db.query(Document).order_by(Document.issued_at.desc()).limit(8).all()

    return DashboardStats(
        total_documents=total_docs,
        verified_documents=verified_docs,
        revoked_documents=revoked_docs,
        verification_requests=verification_reqs,
        total_issuers=max(total_issuers, 1),
        total_users=total_users,
        recent_documents=[DocumentResponse.model_validate(d) for d in recent_docs]
    )

@router.get("/users", response_model=List[UserResponse])
def get_all_users(
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    return db.query(User).order_by(User.created_at.desc()).all()

@router.post("/users/{user_id}/status")
def update_user_status(
    user_id: int,
    is_active: bool,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    target.is_active = is_active
    db.commit()
    return {"message": f"User {target.email} active status updated to {is_active}"}

@router.get("/documents", response_model=List[DocumentResponse])
def get_all_documents(
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    return db.query(Document).order_by(Document.issued_at.desc()).all()

@router.get("/verifications")
def get_all_verifications(
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    return db.query(VerificationLog).order_by(VerificationLog.timestamp.desc()).limit(100).all()

@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    return db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(100).all()

@router.get("/transactions")
def get_blockchain_transactions(limit: int = 25, db: Session = Depends(get_db)):
    """
    Returns mined transactions recorded in database or blockchain service
    """
    db_txs = db.query(BlockchainTransaction).order_by(BlockchainTransaction.timestamp.desc()).limit(limit).all()
    if db_txs:
        return [
            {
                "tx_hash": tx.tx_hash,
                "block_number": tx.block_number,
                "from_address": tx.from_address,
                "to_address": tx.to_address,
                "action": tx.action,
                "document_id": tx.document_id,
                "document_hash": tx.document_hash,
                "gas_used": tx.gas_used,
                "status": tx.status,
                "network": tx.network,
                "etherscan_url": blockchain_service.get_etherscan_tx_url(tx.tx_hash),
                "timestamp": tx.timestamp.isoformat()
            }
            for tx in db_txs
        ]
    return blockchain_service.get_recent_transactions(limit=limit)

@router.get("/transaction/{tx_hash}")
def get_transaction_by_hash(tx_hash: str, db: Session = Depends(get_db)):
    tx = db.query(BlockchainTransaction).filter(BlockchainTransaction.tx_hash == tx_hash).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {
        "tx_hash": tx.tx_hash,
        "block_number": tx.block_number,
        "from_address": tx.from_address,
        "to_address": tx.to_address,
        "action": tx.action,
        "document_id": tx.document_id,
        "document_hash": tx.document_hash,
        "gas_used": tx.gas_used,
        "status": tx.status,
        "network": tx.network,
        "contract_address": settings.CONTRACT_ADDRESS,
        "etherscan_url": blockchain_service.get_etherscan_tx_url(tx.tx_hash),
        "timestamp": tx.timestamp.isoformat()
    }

@router.get("/organizations")
def get_organizations(db: Session = Depends(get_db)):
    return db.query(Organization).all()
