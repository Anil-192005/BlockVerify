import {
  User,
  DocumentItem,
  VerificationResult,
  DashboardStats,
  VerificationLog,
  BlockchainTransaction
} from '../types';

const isTunnel = typeof window !== 'undefined' && window.location.hostname.includes('loca.lt');
const API_BASE = import.meta.env.VITE_API_BASE_URL ||
  (isTunnel ? 'https://good-emus-laugh.loca.lt/api' : 'http://localhost:8000/api');

function getBaseHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  if (isTunnel) {
    headers['bypass-tunnel-reminder'] = '1';
  }
  return headers;
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('blockverify_token');
  const headers = getBaseHeaders();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ access_token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { ...getBaseHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to login');
    }
    return res.json();
  },

  async register(data: { name: string; email: string; password: string; role: string; organization?: string }): Promise<{ access_token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { ...getBaseHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to register');
    }
    return res.json();
  },

  async getProfile(): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Unauthorized');
    return res.json();
  },

  // Verification
  async verifyFile(file: File, claimedDocId?: string): Promise<VerificationResult> {
    const formData = new FormData();
    formData.append('file', file);
    if (claimedDocId) {
      formData.append('claimed_doc_id', claimedDocId);
    }

    const res = await fetch(`${API_BASE}/verify/file`, {
      method: 'POST',
      headers: getBaseHeaders(),
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (err.status) {
        return err;
      }
      throw new Error(err.detail || 'Verification request failed');
    }
    return res.json();
  },

  async verifyById(documentId: string): Promise<VerificationResult> {
    const res = await fetch(`${API_BASE}/verify/id/${encodeURIComponent(documentId)}`, {
      headers: getBaseHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (err.status) {
        return err;
      }
      throw new Error(err.detail || 'Document lookup failed');
    }
    return res.json();
  },

  getDocumentDownloadUrl(documentId: string): string {
    return `${API_BASE}/documents/${encodeURIComponent(documentId)}/download`;
  },

  getQrCodeUrl(documentId: string): string {
    const base = API_BASE.endsWith('/api') ? API_BASE.slice(0, -4) : API_BASE;
    return `${base}/qrs/qr_${documentId.replace('/', '_')}.png`;
  },

  async getVerificationHistory(): Promise<VerificationLog[]> {
    const res = await fetch(`${API_BASE}/verify/history`);
    if (!res.ok) throw new Error('Failed to fetch verification logs');
    return res.json();
  },

  // Documents
  async issueCertificateAuto(formData: FormData): Promise<DocumentItem> {
    const res = await fetch(`${API_BASE}/documents/issue-auto`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to issue document');
    }
    return res.json();
  },

  async uploadCustomDocument(formData: FormData): Promise<DocumentItem> {
    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to upload document');
    }
    return res.json();
  },

  async getMyDocuments(): Promise<DocumentItem[]> {
    const res = await fetch(`${API_BASE}/documents/my`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to fetch documents');
    return res.json();
  },

  async revokeDocument(documentId: string, reason: string): Promise<{ message: string; blockchain_transaction: string }> {
    const res = await fetch(`${API_BASE}/documents/revoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ document_id: documentId, reason }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to revoke document');
    }
    return res.json();
  },

  // Admin & Analytics
  async getDashboardStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE}/admin/stats`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  async getBlockchainTransactions(): Promise<BlockchainTransaction[]> {
    const res = await fetch(`${API_BASE}/admin/transactions`);
    if (!res.ok) throw new Error('Failed to fetch blockchain transactions');
    return res.json();
  },

  async getUsers(): Promise<User[]> {
    const res = await fetch(`${API_BASE}/admin/users`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  async toggleUserStatus(userId: number, currentStatus: boolean): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/status?is_active=${!currentStatus}`, {
      method: 'POST',
      headers: getAuthHeader(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to update user status');
    }
    return res.json();
  },
};
