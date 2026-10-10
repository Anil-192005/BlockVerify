export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'issuer' | 'verifier';
  organization?: string;
  wallet_address?: string;
  is_active?: boolean;
}

export interface DocumentItem {
  id: number;
  document_id: string;
  owner_name: string;
  recipient_name?: string;
  recipient_id?: string;
  document_type: string;
  organization_name: string;
  file_name: string;
  file_size_bytes: number;
  file_hash: string;
  ipfs_cid: string;
  qr_code_base64?: string;
  transaction_hash: string;
  block_number: number;
  issuer_wallet: string;
  status: 'VALID' | 'REVOKED';
  revocation_reason?: string;
  revoked_at?: string;
  issued_at: string;
}

export interface BlockchainProof {
  network: string;
  issuer_address?: string;
  transaction_hash?: string;
  block_number?: number;
  ipfs_cid?: string;
  hash_match?: boolean;
  blockchain_hash?: string;
  uploaded_hash?: string;
  status?: string;
  revocation_reason?: string;
  revoked_at?: string;
  claimed_document_id?: string;
  etherscan_url?: string;
}

export interface HashComparison {
  original_blockchain_hash?: string;
  uploaded_file_hash?: string;
  match: boolean;
  difference_explanation?: string;
}

export interface VerificationResult {
  status: 'VALID' | 'INVALID' | 'TAMPERED' | 'REVOKED' | 'NOT_FOUND' | 'VERIFICATION_UNAVAILABLE';
  is_valid: boolean;
  is_tampered: boolean;
  is_revoked: boolean;
  message: string;
  document?: DocumentItem;
  blockchain_proof?: BlockchainProof;
  hash_comparison?: HashComparison;
}

export interface VerificationLog {
  id: number;
  document_id?: string;
  searched_id_or_hash: string;
  verified_hash?: string;
  result: string;
  method: string;
  verified_by: string;
  timestamp: string;
}

export interface DashboardStats {
  total_documents: number;
  verified_documents: number;
  revoked_documents: number;
  verification_requests: number;
  total_issuers: number;
  total_users?: number;
  recent_documents: DocumentItem[];
}

export interface BlockchainTransaction {
  tx_hash: string;
  block_number: number;
  from_address?: string;
  to_address?: string;
  action: string;
  document_id: string;
  document_hash: string;
  gas_used: number;
  status?: string;
  network?: string;
  etherscan_url?: string;
  timestamp: any;
}
