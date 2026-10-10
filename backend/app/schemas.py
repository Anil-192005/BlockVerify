from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr

# --- Auth Schemas ---
class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "verifier"  # admin, issuer, verifier
    organization: Optional[str] = None
    wallet_address: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    organization: Optional[str]
    wallet_address: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- Document Schemas ---
class DocumentCreate(BaseModel):
    owner_name: str
    recipient_id: Optional[str] = None
    document_type: str = "Degree Certificate"
    organization_name: str
    custom_document_id: Optional[str] = None

class DocumentResponse(BaseModel):
    id: int
    document_id: str
    owner_name: str
    recipient_id: Optional[str] = None
    document_type: str
    organization_name: str
    file_name: str
    file_size_bytes: int
    file_hash: str
    ipfs_cid: str
    qr_code_base64: Optional[str] = None
    transaction_hash: str
    block_number: int
    issuer_wallet: str
    status: str
    revocation_reason: Optional[str] = None
    revoked_at: Optional[datetime] = None
    issued_at: datetime
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- Verification Schemas ---
class VerifyHashRequest(BaseModel):
    file_hash: str

class VerifyIdRequest(BaseModel):
    document_id: str

class VerificationResult(BaseModel):
    status: str  # VALID, TAMPERED, REVOKED, NOT_FOUND
    is_valid: bool
    is_tampered: bool
    is_revoked: bool
    message: str
    document: Optional[DocumentResponse] = None
    blockchain_proof: Optional[dict] = None
    hash_comparison: Optional[dict] = None

class RevokeDocumentRequest(BaseModel):
    document_id: str
    reason: str

# --- Stats Schema ---
class DashboardStats(BaseModel):
    total_documents: int
    verified_documents: int
    revoked_documents: int
    verification_requests: int
    total_issuers: int
    total_users: int = 3
    recent_documents: List[DocumentResponse]

# --- Audit & Transactions ---
class AuditLogResponse(BaseModel):
    id: int
    action: str
    document_id: Optional[str]
    details: Optional[str]
    ip_address: Optional[str]
    timestamp: datetime

    class Config:
        from_attributes = True

class BlockchainTxResponse(BaseModel):
    tx_hash: str
    block_number: int
    from_address: str
    to_address: str
    action: str
    document_id: Optional[str]
    document_hash: Optional[str]
    gas_used: int
    status: str
    network: str
    timestamp: datetime

    class Config:
        from_attributes = True
