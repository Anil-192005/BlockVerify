from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, BigInteger
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(30), default="verifier")  # admin, issuer, verifier
    organization = Column(String(150), nullable=True)
    wallet_address = Column(String(66), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    documents = relationship("Document", back_populates="issuer")
    audit_logs = relationship("AuditLog", back_populates="user")
    sessions = relationship("Session", back_populates="user")


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), unique=True, nullable=False)
    org_type = Column(String(80), default="University") # University, College, Hospital, Government
    wallet_address = Column(String(66), unique=True, nullable=False)
    is_approved = Column(Boolean, default=True)
    contact_email = Column(String(150), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(String(80), unique=True, index=True, nullable=False) # e.g. CERT-2026-000001
    owner_name = Column(String(150), nullable=False) # Name of recipient / owner (e.g. Anil M)
    recipient_id = Column(String(80), nullable=True) # Student USN or Registration ID
    document_type = Column(String(80), nullable=False) # Degree Certificate, Marks Card, etc.
    organization_name = Column(String(150), nullable=False)
    
    file_name = Column(String(255), nullable=False)
    file_size_bytes = Column(Integer, default=0)
    file_path = Column(String(500), nullable=True)
    
    # Cryptographic & Storage Identifiers
    file_hash = Column(String(66), unique=True, index=True, nullable=False) # SHA-256 (0x...)
    ipfs_cid = Column(String(120), nullable=False)
    qr_code_path = Column(String(500), nullable=True)
    qr_code_base64 = Column(Text, nullable=True)
    
    # Blockchain Details
    issuer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    issuer = relationship("User", back_populates="documents")
    issuer_wallet = Column(String(66), nullable=False)
    transaction_hash = Column(String(66), nullable=False)
    block_number = Column(Integer, default=1)
    
    issued_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(30), default="VALID") # VALID, REVOKED
    revocation_reason = Column(Text, nullable=True)
    revoked_at = Column(DateTime, nullable=True)
    revoked_by = Column(String(150), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship to verification logs
    logs = relationship("VerificationLog", back_populates="document", cascade="all, delete-orphan")


class VerificationLog(Base):
    __tablename__ = "verification_logs"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(String(80), ForeignKey("documents.document_id"), nullable=True)
    searched_id_or_hash = Column(String(255), nullable=False)
    verified_hash = Column(String(66), nullable=True)
    result = Column(String(30), nullable=False) # VALID, TAMPERED, REVOKED, NOT_FOUND
    method = Column(String(30), default="file_upload") # file_upload, doc_id, qr_scan
    verified_by = Column(String(100), default="Public Anonymous Verifier")
    ip_address = Column(String(50), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    document = relationship("Document", back_populates="logs")


class BlockchainTransaction(Base):
    __tablename__ = "blockchain_transactions"

    id = Column(Integer, primary_key=True, index=True)
    tx_hash = Column(String(66), unique=True, index=True, nullable=False)
    block_number = Column(Integer, nullable=False)
    from_address = Column(String(66), nullable=False)
    to_address = Column(String(66), nullable=False)
    action = Column(String(50), nullable=False) # registerDocument, revokeDocument, authorizeIssuer
    document_id = Column(String(80), nullable=True)
    document_hash = Column(String(66), nullable=True)
    gas_used = Column(Integer, default=95000)
    status = Column(String(30), default="CONFIRMED")
    network = Column(String(50), default="Ethereum Sepolia")
    timestamp = Column(DateTime, default=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(80), nullable=False) # e.g. "ISSUER_REGISTERED_DOC", "DOC_VERIFIED", "DOC_REVOKED"
    document_id = Column(String(80), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="audit_logs")


class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token = Column(String(500), unique=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="sessions")
