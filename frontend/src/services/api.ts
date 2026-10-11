import {
  User,
  DocumentItem,
  VerificationResult,
  DashboardStats,
  VerificationLog,
  BlockchainTransaction
} from '../types';
import { clientBlockchain } from './clientBlockchain';

const isTunnel = typeof window !== 'undefined' && window.location.hostname.includes('loca.lt');

const getApiBase = (): string => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof window !== 'undefined') {
    return '/api';
  }
  return 'http://localhost:8000/api';
};

const API_BASE = getApiBase();

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

async function safeFetchJson<T>(url: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && !contentType.includes('text/html')) {
      return (await res.json()) as T;
    }
  } catch {
    // network error, cors, or offline
  }
  return null;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 300);
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ access_token: string; user: User }> {
    const remote = await safeFetchJson<{ access_token: string; user: User }>(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { ...getBaseHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (remote && remote.access_token) {
      return remote;
    }

    // Client-side Autonomous Blockchain Auth (e.g. on Netlify or when backend is offline)
    return clientBlockchain.login(email, password);
  },

  async register(data: { name: string; email: string; password: string; role: string; organization?: string }): Promise<{ access_token: string; user: User }> {
    const remote = await safeFetchJson<{ access_token: string; user: User }>(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { ...getBaseHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (remote && remote.access_token) {
      return remote;
    }

    return clientBlockchain.register(data);
  },

  async getProfile(): Promise<User> {
    const remote = await safeFetchJson<User>(`${API_BASE}/auth/me`, {
      headers: getAuthHeader(),
    });

    if (remote && remote.id) {
      return remote;
    }

    return clientBlockchain.getProfile();
  },

  // Verification
  async verifyFile(file: File, claimedDocId?: string): Promise<VerificationResult> {
    const formData = new FormData();
    formData.append('file', file);
    if (claimedDocId) {
      formData.append('claimed_doc_id', claimedDocId);
    }

    try {
      const res = await fetch(`${API_BASE}/verify/file`, {
        method: 'POST',
        headers: getBaseHeaders(),
        body: formData,
      });
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('text/html')) {
        const json = await res.json();
        if (json && json.status) {
          return json;
        }
      }
    } catch {
      // fallback to client verification engine
    }

    // Client-side Autonomous Verification (computes SHA-256 and verifies on-chain record / embedded proof)
    return await clientBlockchain.verifyFile(file, claimedDocId);
  },

  async verifyById(documentId: string): Promise<VerificationResult> {
    const remote = await safeFetchJson<VerificationResult>(`${API_BASE}/verify/id/${encodeURIComponent(documentId)}`, {
      headers: getBaseHeaders(),
    });

    if (remote && remote.status) {
      return remote;
    }

    return clientBlockchain.verifyById(documentId);
  },

  getDocumentDownloadUrl(documentId: string): string {
    return clientBlockchain.getDocumentDownloadUrl(documentId);
  },

  async downloadDocumentBlob(documentId: string): Promise<Blob | null> {
    try {
      const res = await fetch(`${API_BASE}/documents/${encodeURIComponent(documentId)}/download`, {
        headers: getAuthHeader(),
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && !contentType.includes('text/html')) {
        return await res.blob();
      }
    } catch {
      // remote server offline or Netlify SPA
    }
    return null;
  },

  async downloadOfficialPdf(doc: DocumentItem): Promise<void> {
    try {
      const remoteBlob = await this.downloadDocumentBlob(doc.document_id);
      if (remoteBlob && remoteBlob.size > 200) {
        downloadBlob(remoteBlob, doc.file_name || `cert_${doc.document_id}.pdf`);
        return;
      }
    } catch {
      // fallback
    }

    const clientBlob = await clientBlockchain.generateOfficialPdfBlob(doc);
    downloadBlob(clientBlob, doc.file_name || `cert_${doc.document_id}.pdf`);
  },

  async downloadVerificationReport(result: VerificationResult): Promise<void> {
    const reportBlob = await clientBlockchain.generateVerificationReportBlob(result);
    const docId = result.document?.document_id || 'AUDIT';
    downloadBlob(reportBlob, `Verification_Report_${docId}.pdf`);
  },

  getQrCodeUrl(documentId: string): string {
    return clientBlockchain.getQrCodeUrl(documentId);
  },

  async getVerificationHistory(): Promise<VerificationLog[]> {
    const remote = await safeFetchJson<VerificationLog[]>(`${API_BASE}/verify/history`);
    if (remote && Array.isArray(remote)) {
      return remote;
    }
    return clientBlockchain.getVerificationHistory();
  },

  // Documents
  async issueCertificateAuto(formData: FormData): Promise<DocumentItem> {
    try {
      const res = await fetch(`${API_BASE}/documents/issue-auto`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: formData,
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && !contentType.includes('text/html')) {
        return await res.json();
      }
    } catch {
      // fallback
    }

    // Client-side Official Certificate + QR + Proof Generator
    return await clientBlockchain.issueCertificateAuto(formData);
  },

  async uploadCustomDocument(formData: FormData): Promise<DocumentItem> {
    try {
      const res = await fetch(`${API_BASE}/documents/upload`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: formData,
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && !contentType.includes('text/html')) {
        return await res.json();
      }
    } catch {
      // fallback
    }

    return await clientBlockchain.uploadCustomDocument(formData);
  },

  async getMyDocuments(): Promise<DocumentItem[]> {
    const remote = await safeFetchJson<DocumentItem[]>(`${API_BASE}/documents/my`, {
      headers: getAuthHeader(),
    });
    if (remote && Array.isArray(remote)) {
      return remote;
    }
    return clientBlockchain.getDocuments();
  },

  async revokeDocument(documentId: string, reason: string): Promise<{ message: string; blockchain_transaction: string }> {
    const remote = await safeFetchJson<{ message: string; blockchain_transaction: string }>(`${API_BASE}/documents/revoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ document_id: documentId, reason }),
    });

    if (remote && remote.blockchain_transaction) {
      return remote;
    }

    return clientBlockchain.revokeDocument(documentId, reason);
  },

  // Admin & Analytics
  async getDashboardStats(): Promise<DashboardStats> {
    const remote = await safeFetchJson<DashboardStats>(`${API_BASE}/admin/stats`);
    if (remote && remote.total_documents !== undefined) {
      return remote;
    }
    return clientBlockchain.getDashboardStats();
  },

  async getBlockchainTransactions(): Promise<BlockchainTransaction[]> {
    const remote = await safeFetchJson<BlockchainTransaction[]>(`${API_BASE}/admin/transactions`);
    if (remote && Array.isArray(remote)) {
      return remote;
    }
    return clientBlockchain.getBlockchainTransactions();
  },

  async getUsers(): Promise<User[]> {
    const remote = await safeFetchJson<User[]>(`${API_BASE}/admin/users`, {
      headers: getAuthHeader(),
    });
    if (remote && Array.isArray(remote)) {
      return remote;
    }
    return clientBlockchain.getUsers();
  },

  async toggleUserStatus(userId: number, currentStatus: boolean): Promise<{ message: string }> {
    const remote = await safeFetchJson<{ message: string }>(`${API_BASE}/admin/users/${userId}/status?is_active=${!currentStatus}`, {
      method: 'POST',
      headers: getAuthHeader(),
    });
    if (remote && remote.message) {
      return remote;
    }
    return clientBlockchain.toggleUserStatus(userId, currentStatus);
  },
};
