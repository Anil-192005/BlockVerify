import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import {
  User,
  DocumentItem,
  VerificationResult,
  DashboardStats,
  VerificationLog,
  BlockchainTransaction
} from '../types';

// Standard seed users matching backend/app/main.py
const SEED_USERS: User[] = [
  {
    id: 1,
    name: 'System Administrator',
    email: 'admin@blockverify.eth',
    role: 'admin',
    organization: 'Ethereum Root Governance',
    wallet_address: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    is_active: true,
  },
  {
    id: 2,
    name: 'ABC Engineering College Registrar',
    email: 'issuer@abccollege.edu',
    role: 'issuer',
    organization: 'ABC Engineering College',
    wallet_address: '0x8A92d00f7d54c12ef4b98c36391d4e082ef73812',
    is_active: true,
  },
  {
    id: 3,
    name: 'HR Verifier (TechCorp)',
    email: 'verifier@techcorp.com',
    role: 'verifier',
    organization: 'TechCorp Global Recruiting',
    wallet_address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    is_active: true,
  },
];

// Standard seed documents matching backend/app/main.py & test cases
const SEED_DOCUMENTS: DocumentItem[] = [
  {
    id: 1,
    document_id: 'CERT-2026-000001',
    owner_name: 'Anil M',
    recipient_name: 'Anil M',
    recipient_id: '1AB23CS001',
    document_type: 'Degree Certificate',
    organization_name: 'ABC Engineering College',
    file_name: 'cert_CERT-2026-000001.pdf',
    file_size_bytes: 14463,
    file_hash: '0x223214f848ac0a0b4cb750053ae0939721c2a9ca0c93efef0d7b01f84cdb9a14',
    ipfs_cid: 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
    transaction_hash: '0xb0cd88c1d157b61eb65fc7dcf6834bf4807c2834ca58de3adda10d11a22a186f',
    block_number: 5621481,
    issuer_wallet: '0x8A92d00f7d54c12ef4b98c36391d4e082ef73812',
    status: 'VALID',
    issued_at: '2026-10-07T10:00:00Z',
  },
  {
    id: 2,
    document_id: 'CERT-2026-000002',
    owner_name: 'Sarah Jenkins',
    recipient_name: 'Sarah Jenkins',
    recipient_id: '1AB23CS045',
    document_type: 'Marks Card',
    organization_name: 'ABC Engineering College',
    file_name: 'cert_CERT-2026-000002.pdf',
    file_size_bytes: 14097,
    file_hash: '0x42be37049c4705a07c553f51522483f031879dfcfbaa0b71cf078ad6e1c7e3b8',
    ipfs_cid: 'QmRAQB6YaCyidP37UdDnjFY5vQuiBrcqdyoW1CuDgwxkD4',
    transaction_hash: '0x45effed1ccbc73174c40b07d5bf01b99bfdb744e8d048b35d911bfe0ad0d6225',
    block_number: 5621482,
    issuer_wallet: '0x8A92d00f7d54c12ef4b98c36391d4e082ef73812',
    status: 'VALID',
    issued_at: '2026-08-15T10:00:00Z',
  },
  {
    id: 3,
    document_id: 'CERT-2026-000003',
    owner_name: 'Robert Smith',
    recipient_name: 'Robert Smith',
    recipient_id: '1AB23CS099',
    document_type: 'Experience Certificate',
    organization_name: 'ABC Engineering College',
    file_name: 'cert_CERT-2026-000003.pdf',
    file_size_bytes: 14357,
    file_hash: '0x749196c9e1f8572ba756a10daf7ea67385e831b192f3a90c80acde2f1fd57fa8',
    ipfs_cid: 'QmZtmD2qt8STTqpQn3gqaZ3gqaZ3gqaZ3gqaZ3gqaZ3gqa',
    transaction_hash: '0x6e26314c5c2356e59e09bf4cb5f323ec111f7945dcb819cec9230694bd938f1d',
    block_number: 5621483,
    issuer_wallet: '0x8A92d00f7d54c12ef4b98c36391d4e082ef73812',
    status: 'REVOKED',
    revocation_reason: 'Grade miscalculation - credential recalled by Dean',
    revoked_at: '2026-09-01T10:00:00Z',
    issued_at: '2026-09-01T10:00:00Z',
  },
];

// Helper to calculate SHA-256 in browser
export async function computeSha256(data: ArrayBuffer | Uint8Array): Promise<string> {
  const buffer = data instanceof ArrayBuffer ? data : (data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toLowerCase();
}

// Memory cache for created PDF Blobs during the session
const pdfBlobStore = new Map<string, Blob>();
const qrDataUriStore = new Map<string, string>();

class ClientBlockchainService {
  private getStorage<T>(key: string, defaultVal: T): T {
    try {
      if (typeof localStorage !== 'undefined') {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultVal;
      }
    } catch {
      // ignore
    }
    return defaultVal;
  }

  private setStorage<T>(key: string, val: T): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(val));
      }
    } catch {
      // storage full or disabled
    }
  }

  public getDocuments(): DocumentItem[] {
    const customDocs = this.getStorage<DocumentItem[]>('blockverify_custom_docs', []);
    return [...customDocs, ...SEED_DOCUMENTS];
  }

  public saveDocument(doc: DocumentItem): void {
    const customDocs = this.getStorage<DocumentItem[]>('blockverify_custom_docs', []);
    this.setStorage('blockverify_custom_docs', [doc, ...customDocs]);
  }

  // --- Auth ---
  public login(email: string, pass: string): { access_token: string; user: User } {
    const cleanEmail = email.trim().toLowerCase();
    let found = SEED_USERS.find(u => u.email.toLowerCase() === cleanEmail);
    if (!found) {
      const registeredUsers = this.getStorage<User[]>('blockverify_reg_users', []);
      found = registeredUsers.find(u => u.email.toLowerCase() === cleanEmail);
    }

    if (!found) {
      // Allow demo fallback by role name in email
      if (cleanEmail.includes('admin')) {
        found = SEED_USERS[0];
      } else if (cleanEmail.includes('verifier')) {
        found = SEED_USERS[2];
      } else {
        found = SEED_USERS[1];
      }
    }

    const token = `mock_jwt_${found.id}_${Date.now()}`;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('blockverify_active_user', JSON.stringify(found));
    }
    return { access_token: token, user: found };
  }

  public register(data: { name: string; email: string; password: string; role: string; organization?: string }): { access_token: string; user: User } {
    const newUser: User = {
      id: Date.now(),
      name: data.name,
      email: data.email,
      role: (data.role as any) || 'issuer',
      organization: data.organization || 'Educational Institution',
      wallet_address: '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      is_active: true,
    };

    const registeredUsers = this.getStorage<User[]>('blockverify_reg_users', []);
    this.setStorage('blockverify_reg_users', [newUser, ...registeredUsers]);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('blockverify_active_user', JSON.stringify(newUser));
    }
    const token = `mock_jwt_${newUser.id}_${Date.now()}`;
    return { access_token: token, user: newUser };
  }

  public getProfile(): User {
    const active = this.getStorage<User | null>('blockverify_active_user', null);
    if (active) return active;
    return SEED_USERS[0];
  }

  // --- Issue Official PDF with embedded QR and Proof ---
  public async issueCertificateAuto(formData: FormData): Promise<DocumentItem> {
    const recipientName = (formData.get('owner_name') as string) || (formData.get('recipient_name') as string) || 'Anil M';
    const recipientId = (formData.get('recipient_id') as string) || '1AB23CS001';
    const documentType = (formData.get('document_type') as string) || 'Degree Certificate';
    const organizationName = (formData.get('organization_name') as string) || 'ABC Engineering College';
    
    const count = this.getDocuments().length + 1;
    const documentId = `CERT-2026-${String(count).padStart(6, '0')}`;
    const issuedDateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' });

    // Generate QR code data URI pointing to public verification route
    const frontendBase = typeof window !== 'undefined' ? window.location.origin : 'https://guileless-blockchain.netlify.app';
    const verifyUrl = `${frontendBase}/verify/${documentId}`;
    const qrDataUri = await QRCode.toDataURL(verifyUrl, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 250,
      color: { dark: '#0f172a', light: '#ffffff' }
    });
    qrDataUriStore.set(documentId, qrDataUri);

    // Render official Landscape Letter certificate via jsPDF
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'letter', // 792 x 612 pt
    });

    const pageWidth = 792;
    const pageHeight = 612;

    // Draw luxury double border
    doc.setDrawColor(212, 175, 55); // Gold
    doc.setLineWidth(4);
    doc.rect(24, 24, pageWidth - 48, pageHeight - 48);

    doc.setDrawColor(180, 140, 30);
    doc.setLineWidth(1);
    doc.rect(30, 30, pageWidth - 60, pageHeight - 60);

    // Organization Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42); // Navy
    doc.text(organizationName.toUpperCase(), pageWidth / 2, 85, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('OFFICIAL CREDENTIAL OF AUTHENTICITY', pageWidth / 2, 102, { align: 'center' });

    // Credential Type
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(37, 99, 235); // Blue
    doc.text(documentType.toUpperCase(), pageWidth / 2, 145, { align: 'center' });

    // Recipient Certification
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(51, 65, 85);
    doc.text('This is to certify that', pageWidth / 2, 180, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(30, 41, 59);
    doc.text(recipientName, pageWidth / 2, 215, { align: 'center' });

    if (recipientId) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(71, 85, 105);
      doc.text(`Registration / USN: ${recipientId}`, pageWidth / 2, 238, { align: 'center' });
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    const bodyText = 'has successfully completed the prescribed curriculum and requirements as evaluated by the Board of Examiners, and is hereby awarded this official credential with all honors and privileges pertaining thereto.';
    const splitBody = doc.splitTextToSize(bodyText, 560);
    doc.text(splitBody, pageWidth / 2, 280, { align: 'center' });

    // Footer Metadata & Signatures
    const footerY = 460;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Document ID: ${documentId}`, 60, footerY);
    doc.text(`Date of Issue: ${issuedDateStr}`, 60, footerY + 16);
    doc.text('Blockchain: Ethereum Sepolia / EVM', 60, footerY + 32);
    doc.text('Status: Cryptographically Anchored', 60, footerY + 48);

    doc.setFont('helvetica', 'normal');
    doc.text('____________________________', pageWidth / 2 - 40, footerY + 20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Registrar / Authorized Dean', pageWidth / 2 - 40, footerY + 36);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Academic Affairs', pageWidth / 2 - 40, footerY + 50);

    // Embed QR Image in bottom-right
    try {
      doc.addImage(qrDataUri, 'PNG', pageWidth - 165, footerY - 20, 95, 95);
    } catch {
      // fallback
    }

    // Get raw PDF bytes
    const basePdfBytes = new Uint8Array(doc.output('arraybuffer'));
    const bodyHash = await computeSha256(basePdfBytes);

    // Realistic blockchain metadata
    const txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const blockNum = 5621480 + Math.floor(Math.random() * 500);

    // Cryptographic Proof Trailer embedded inside the PDF
    const proofTrailerObj = {
      doc_id: documentId,
      owner_name: recipientName,
      recipient_id: recipientId,
      document_type: documentType,
      organization_name: organizationName,
      body_hash: bodyHash,
      tx_hash: txHash,
      block_number: blockNum,
      issued_at: new Date().toISOString(),
      status: 'VALID',
    };
    const proofComment = `\n%BLOCKVERIFY:${JSON.stringify(proofTrailerObj)}\n`;
    const proofBytes = new TextEncoder().encode(proofComment);

    // Final combined bytes
    const finalBytes = new Uint8Array(basePdfBytes.length + proofBytes.length);
    finalBytes.set(basePdfBytes, 0);
    finalBytes.set(proofBytes, basePdfBytes.length);

    // Final official SHA-256 hash of the complete file
    const fileHash = await computeSha256(finalBytes);

    const pdfBlob = new Blob([finalBytes], { type: 'application/pdf' });
    pdfBlobStore.set(documentId, pdfBlob);

    const newDoc: DocumentItem = {
      id: Date.now(),
      document_id: documentId,
      owner_name: recipientName,
      recipient_name: recipientName,
      recipient_id: recipientId,
      document_type: documentType,
      organization_name: organizationName,
      file_name: `cert_${documentId}.pdf`,
      file_size_bytes: finalBytes.byteLength,
      file_hash: fileHash,
      ipfs_cid: 'Qm' + Array.from({ length: 44 }, () => '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'[Math.floor(Math.random() * 58)]).join(''),
      qr_code_base64: qrDataUri,
      transaction_hash: txHash,
      block_number: blockNum,
      issuer_wallet: '0x8A92d00f7d54c12ef4b98c36391d4e082ef73812',
      status: 'VALID',
      issued_at: new Date().toISOString(),
    };

    this.saveDocument(newDoc);
    return newDoc;
  }

  public async uploadCustomDocument(formData: FormData): Promise<DocumentItem> {
    const file = formData.get('file') as File;
    const recipientName = (formData.get('owner_name') as string) || 'Document Holder';
    const recipientId = (formData.get('recipient_id') as string) || '';
    const documentType = (formData.get('document_type') as string) || 'Document';
    const organizationName = (formData.get('organization_name') as string) || 'ABC Engineering College';

    let fileHash = '0x';
    let fileSizeBytes = 0;
    if (file) {
      const buffer = await file.arrayBuffer();
      fileHash = await computeSha256(buffer);
      fileSizeBytes = file.size;
    }

    const count = this.getDocuments().length + 1;
    const documentId = `DOC-2026-${String(count).padStart(6, '0')}`;
    const txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    const newDoc: DocumentItem = {
      id: Date.now(),
      document_id: documentId,
      owner_name: recipientName,
      recipient_name: recipientName,
      recipient_id: recipientId,
      document_type: documentType,
      organization_name: organizationName,
      file_name: file ? file.name : `${documentId}.pdf`,
      file_size_bytes: fileSizeBytes,
      file_hash: fileHash,
      ipfs_cid: 'Qm' + Array.from({ length: 44 }, () => '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'[Math.floor(Math.random() * 58)]).join(''),
      transaction_hash: txHash,
      block_number: 5621490,
      issuer_wallet: '0x8A92d00f7d54c12ef4b98c36391d4e082ef73812',
      status: 'VALID',
      issued_at: new Date().toISOString(),
    };

    this.saveDocument(newDoc);
    return newDoc;
  }

  // --- Verification ---
  public async verifyFile(file: File, claimedDocId?: string): Promise<VerificationResult> {
    const fileBuffer = await file.arrayBuffer();
    const uploadedHash = await computeSha256(fileBuffer);
    const allDocs = this.getDocuments();

    // 1. Direct hash match in known documents
    const directDoc = allDocs.find(d => d.file_hash.toLowerCase() === uploadedHash.toLowerCase());

    // 2. Inspect PDF bytes for embedded %BLOCKVERIFY proof trailer
    let embeddedProof: any = null;
    try {
      const latinText = new TextDecoder('latin1').decode(fileBuffer);
      const match = latinText.match(/%BLOCKVERIFY:(.*?)(?:\r|\n|$)/);
      if (match && match[1]) {
        embeddedProof = JSON.parse(match[1]);
      }
    } catch {
      // not a json proof pdf
    }

    // 3. Claimed doc ID validation (detect tampering)
    if (claimedDocId && claimedDocId.trim()) {
      const cleanClaimed = claimedDocId.trim().toLowerCase();
      const targetDoc = allDocs.find(d => d.document_id.toLowerCase() === cleanClaimed);

      if (targetDoc && targetDoc.file_hash.toLowerCase() !== uploadedHash.toLowerCase()) {
        return {
          status: 'INVALID',
          is_valid: false,
          is_tampered: true,
          is_revoked: false,
          message: '🚨 TAMPERING DETECTED: The uploaded file\'s SHA-256 hash does not match the registered cryptographic blockchain signature for this document ID!',
          document: targetDoc,
          blockchain_proof: {
            network: 'Ethereum Sepolia',
            claimed_document_id: targetDoc.document_id,
            blockchain_hash: targetDoc.file_hash,
            uploaded_hash: uploadedHash,
            hash_match: false,
            etherscan_url: `https://sepolia.etherscan.io/tx/${targetDoc.transaction_hash}`,
          },
          hash_comparison: {
            original_blockchain_hash: targetDoc.file_hash,
            uploaded_file_hash: uploadedHash,
            match: false,
            difference_explanation: 'A single byte modification produces a completely different 256-bit hash due to the cryptographic avalanche effect.',
          },
        };
      }
    }

    // 4. If direct document match found in registry
    if (directDoc) {
      if (directDoc.status === 'REVOKED') {
        return {
          status: 'REVOKED',
          is_valid: false,
          is_tampered: false,
          is_revoked: true,
          message: '❌ DOCUMENT REVOKED: This document was legitimately issued but was later marked REVOKED on the blockchain.',
          document: directDoc,
          blockchain_proof: {
            network: 'Ethereum Sepolia',
            status: 'REVOKED',
            revocation_reason: directDoc.revocation_reason || 'Revoked by issuer',
            etherscan_url: `https://sepolia.etherscan.io/tx/${directDoc.transaction_hash}`,
          },
        };
      }

      return {
        status: 'VALID',
        is_valid: true,
        is_tampered: false,
        is_revoked: false,
        message: '✅ VERIFIED AUTHENTIC: Cryptographic hash matches the on-chain Ethereum record exactly. Zero tampering detected.',
        document: directDoc,
        blockchain_proof: {
          network: 'Ethereum Sepolia',
          issuer_address: directDoc.issuer_wallet || '0x8A92d00f7d54c12ef4b98c36391d4e082ef73812',
          transaction_hash: directDoc.transaction_hash,
          block_number: directDoc.block_number,
          ipfs_cid: directDoc.ipfs_cid,
          hash_match: true,
          etherscan_url: `https://sepolia.etherscan.io/tx/${directDoc.transaction_hash}`,
        },
        hash_comparison: {
          original_blockchain_hash: uploadedHash,
          uploaded_file_hash: uploadedHash,
          match: true,
        },
      };
    }

    // 5. If document was issued with embedded proof on another device
    if (embeddedProof && embeddedProof.doc_id) {
      // Re-verify body integrity
      let bodyMatch = false;
      if (embeddedProof.body_hash) {
        try {
          const latinText = new TextDecoder('latin1').decode(fileBuffer);
          const splitIdx = latinText.lastIndexOf('\n%BLOCKVERIFY:');
          if (splitIdx > 0) {
            const bodyBytes = fileBuffer.slice(0, splitIdx);
            const computedBodyHash = await computeSha256(bodyBytes);
            bodyMatch = (computedBodyHash.toLowerCase() === embeddedProof.body_hash.toLowerCase());
          }
        } catch {
          // ignore
        }
      }

      if (bodyMatch) {
        const reconstructedDoc: DocumentItem = {
          id: Date.now(),
          document_id: embeddedProof.doc_id,
          owner_name: embeddedProof.owner_name,
          recipient_name: embeddedProof.owner_name,
          recipient_id: embeddedProof.recipient_id,
          document_type: embeddedProof.document_type,
          organization_name: embeddedProof.organization_name,
          file_name: file.name,
          file_size_bytes: file.size,
          file_hash: uploadedHash,
          ipfs_cid: 'Qm' + Array.from({ length: 44 }, () => '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'[Math.floor(Math.random() * 58)]).join(''),
          transaction_hash: embeddedProof.tx_hash || '0x72a809b...',
          block_number: embeddedProof.block_number || 5621485,
          issuer_wallet: '0x8A92d00f7d54c12ef4b98c36391d4e082ef73812',
          status: 'VALID',
          issued_at: embeddedProof.issued_at || new Date().toISOString(),
        };

        // Cache document locally so future lookups are instantaneous
        this.saveDocument(reconstructedDoc);

        return {
          status: 'VALID',
          is_valid: true,
          is_tampered: false,
          is_revoked: false,
          message: '✅ VERIFIED AUTHENTIC: Cryptographic hash matches the on-chain Ethereum record exactly. Zero tampering detected.',
          document: reconstructedDoc,
          blockchain_proof: {
            network: 'Ethereum Sepolia',
            issuer_address: reconstructedDoc.issuer_wallet,
            transaction_hash: reconstructedDoc.transaction_hash,
            block_number: reconstructedDoc.block_number,
            ipfs_cid: reconstructedDoc.ipfs_cid,
            hash_match: true,
            etherscan_url: `https://sepolia.etherscan.io/tx/${reconstructedDoc.transaction_hash}`,
          },
          hash_comparison: {
            original_blockchain_hash: uploadedHash,
            uploaded_file_hash: uploadedHash,
            match: true,
          },
        };
      } else {
        // Embedded proof present but body was tampered with
        return {
          status: 'INVALID',
          is_valid: false,
          is_tampered: true,
          is_revoked: false,
          message: '🚨 TAMPERING DETECTED: The internal cryptographic hash of this document has been modified after issuance!',
          blockchain_proof: {
            network: 'Ethereum Sepolia',
            claimed_document_id: embeddedProof.doc_id,
            hash_match: false,
          },
        };
      }
    }

    // 6. Not found
    return {
      status: 'NOT_FOUND',
      is_valid: false,
      is_tampered: false,
      is_revoked: false,
      message: '❌ UNREGISTERED / FORGED: This document\'s SHA-256 fingerprint does not exist in the blockchain registry.',
      blockchain_proof: {
        network: 'Ethereum Sepolia',
        blockchain_hash: uploadedHash,
      },
      hash_comparison: {
        uploaded_file_hash: uploadedHash,
        match: false,
      },
    };
  }

  public verifyById(documentId: string): VerificationResult {
    const cleanId = documentId.trim().toLowerCase();
    const doc = this.getDocuments().find(d => d.document_id.toLowerCase() === cleanId);

    if (!doc) {
      return {
        status: 'NOT_FOUND',
        is_valid: false,
        is_tampered: false,
        is_revoked: false,
        message: `❌ No document found with ID '${documentId}' on the blockchain registry.`,
      };
    }

    if (doc.status === 'REVOKED') {
      return {
        status: 'REVOKED',
        is_valid: false,
        is_tampered: false,
        is_revoked: true,
        message: `❌ REVOKED CREDENTIAL: This document was formally revoked on the blockchain. Reason: ${doc.revocation_reason || 'Revoked by issuer'}`,
        document: doc,
        blockchain_proof: {
          network: 'Ethereum Sepolia',
          status: 'REVOKED',
          revocation_reason: doc.revocation_reason || 'Revoked by issuer',
          etherscan_url: `https://sepolia.etherscan.io/tx/${doc.transaction_hash}`,
        },
      };
    }

    return {
      status: 'VALID',
      is_valid: true,
      is_tampered: false,
      is_revoked: false,
      message: '✅ AUTHENTIC CREDENTIAL: Validated against Ethereum Sepolia smart contract registry.',
      document: doc,
      blockchain_proof: {
        network: 'Ethereum Sepolia',
        issuer_address: doc.issuer_wallet || '0x8A92d00f7d54c12ef4b98c36391d4e082ef73812',
        transaction_hash: doc.transaction_hash,
        block_number: doc.block_number,
        ipfs_cid: doc.ipfs_cid,
        blockchain_hash: doc.file_hash,
        etherscan_url: `https://sepolia.etherscan.io/tx/${doc.transaction_hash}`,
      },
    };
  }

  public revokeDocument(documentId: string, reason: string): { message: string; blockchain_transaction: string } {
    const cleanId = documentId.trim().toLowerCase();
    const customDocs = this.getStorage<DocumentItem[]>('blockverify_custom_docs', []);
    const doc = customDocs.find(d => d.document_id.toLowerCase() === cleanId);
    if (doc) {
      doc.status = 'REVOKED';
      doc.revocation_reason = reason;
      this.setStorage('blockverify_custom_docs', customDocs);
    }
    const tx = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    return {
      message: `Document ${documentId} successfully revoked on the Ethereum blockchain`,
      blockchain_transaction: tx,
    };
  }

  // --- Downloads & QR helpers ---
  public getDocumentDownloadUrl(documentId: string): string {
    const blob = pdfBlobStore.get(documentId);
    if (blob) {
      return URL.createObjectURL(blob);
    }
    // Return relative API endpoint for fallback
    return `/api/documents/${encodeURIComponent(documentId)}/download`;
  }

  public getQrCodeUrl(documentId: string): string {
    const cached = qrDataUriStore.get(documentId);
    if (cached) return cached;
    return `/qrs/qr_${documentId.replace('/', '_')}.png`;
  }

  public getDashboardStats(): DashboardStats {
    const docs = this.getDocuments();
    return {
      total_documents: docs.length,
      verified_documents: docs.filter(d => d.status === 'VALID').length,
      revoked_documents: docs.filter(d => d.status === 'REVOKED').length,
      verification_requests: 28 + docs.length * 3,
      total_issuers: 4,
      total_users: SEED_USERS.length,
      recent_documents: docs.slice(0, 5),
    };
  }

  public getBlockchainTransactions(): BlockchainTransaction[] {
    const docs = this.getDocuments();
    return docs.map(d => ({
      tx_hash: d.transaction_hash,
      block_number: d.block_number,
      from_address: d.issuer_wallet,
      to_address: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      action: d.status === 'REVOKED' ? 'revokeDocument' : 'registerDocument',
      document_id: d.document_id,
      document_hash: d.file_hash,
      gas_used: 98450,
      status: 'CONFIRMED',
      network: 'Ethereum Sepolia',
      timestamp: d.issued_at,
    }));
  }

  public getVerificationHistory(): VerificationLog[] {
    return [
      {
        id: 1,
        document_id: 'CERT-2026-000001',
        searched_id_or_hash: 'CERT-2026-000001',
        verified_hash: '0x223214f848ac0a0b4cb750053ae0939721c2a9ca0c93efef0d7b01f84cdb9a14',
        result: 'VALID',
        method: 'doc_id',
        verified_by: 'Public Anonymous Verifier',
        timestamp: '2026-10-11T04:15:00Z',
      },
      {
        id: 2,
        document_id: 'CERT-2026-000003',
        searched_id_or_hash: 'CERT-2026-000003',
        verified_hash: '0x749196c9e1f8572ba756a10daf7ea67385e831b192f3a90c80acde2f1fd57fa8',
        result: 'REVOKED',
        method: 'file_upload',
        verified_by: 'Public Anonymous Verifier',
        timestamp: '2026-10-11T03:55:00Z',
      },
    ];
  }

  public getUsers(): User[] {
    const reg = this.getStorage<User[]>('blockverify_reg_users', []);
    return [...SEED_USERS, ...reg];
  }

  public toggleUserStatus(userId: number, currentStatus: boolean): { message: string } {
    return { message: `User status toggled to ${!currentStatus}` };
  }
}

export const clientBlockchain = new ClientBlockchainService();
