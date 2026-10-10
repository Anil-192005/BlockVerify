# 🎓 BlockVerify – Final Year Project Viva & Defense Guide

Comprehensive technical questions and rock-solid answers for external examiners, project guides, and viva panel reviews.

---

## 📌 Section 1: Core Architecture & Blockchain Fundamentals

### Q1: Why do we need Blockchain for document verification? Can't a centralized database (like SQL) do this?
**Answer:**
A centralized database has a single point of trust and failure:
1. **Insider Tampering:** A database administrator (DBA) or an unauthorized attacker with SQL access can update records (`UPDATE certificates SET grade = 'A+' WHERE id = 101;`) without leaving any cryptographic audit trail.
2. **Immutability:** Blockchain enforces an immutable, append-only distributed ledger secured by cryptographic hash chaining (SHA-256) and consensus algorithms. Once a transaction is mined into a block, modifying it requires rewriting all subsequent blocks, which is computationally infeasible.
3. **Decentralized Trust:** Verifiers (employers, foreign universities) do not need to trust the college's internal server uptime or private database; they verify against the public, tamper-resistant smart contract on Ethereum.

---

### Q2: Why don't you store the entire PDF certificate directly on the Ethereum blockchain?
**Answer:**
1. **Gas Cost & Block Size Limits:** Ethereum is designed for state transition computations, not large data storage. The Ethereum block gas limit is ~30 million gas. Storing 1 MB of data on Ethereum would cost tens of thousands of dollars in gas fees and severely bloat node storage.
2. **Scalability:** By following the **Off-Chain Storage / On-Chain Hash** paradigm:
   - The document's **cryptographic fingerprint (SHA-256 hash)** and **IPFS CID** are stored on Ethereum (costing minimal gas for a 32-byte hash).
   - The actual document is stored in decentralized storage (**IPFS** - InterPlanetary File System) or cloud storage.
   - Any 1-bit change in the document creates an avalanche effect, producing a completely mismatched SHA-256 hash.

---

### Q3: What is the Avalanche Effect in SHA-256?
**Answer:**
The avalanche effect is a fundamental property of cryptographic hash functions where a minor change in the input (such as flipping a single bit, altering a letter from 'B' to 'A', or changing marks from '85' to '95') causes a drastically different, seemingly random output digest.
- Original text: `"Student: Anil M, Marks: 85"` $\rightarrow$ Hash: `0x7c4a8d09ca...`
- Tampered text: `"Student: Anil M, Marks: 95"` $\rightarrow$ Hash: `0x91f2e8ab12...`
- The smart contract evaluates `uploaded_hash == stored_hash`. Because of the avalanche effect, tampering is detected with 100% mathematical certainty.

---

## 📌 Section 2: Smart Contract & Solidity Implementation

### Q4: Walk through your Solidity smart contract structure and key methods.
**Answer:**
Our smart contract is `BlockVerify.sol`:
- **State Data:**
  - `struct Document`: stores `bytes32 documentHash`, `string documentCID`, `string documentId`, `string documentType`, `string recipientName`, `string organizationName`, `address issuer`, `uint256 issuedAt`, `bool isRevoked`, `string revocationReason`.
  - `mapping(bytes32 => Document) public documentsByHash`: provides $O(1)$ constant-time lookup for hash verification.
  - `mapping(string => bytes32) public documentIdToHash`: maps human-readable IDs (`CERT-2026-0001`) to hashes.
- **Core Functions:**
  1. `registerDocument(...)`: Called by authorized issuer wallets to anchor a new document on-chain. Emits `DocumentRegistered` event.
  2. `verifyDocument(bytes32 _documentHash)`: `view` function (costs 0 gas for read queries) returning existence, validity, revocation flag, issuer, and timestamp.
  3. `revokeDocument(string _documentId, string _reason)`: Restricted to the original issuer or contract owner. Sets `isRevoked = true` and records the reason.
  4. `authorizeIssuer(address _issuer, string _orgName)`: Role-based access control managed by the contract owner.

---

### Q5: If blockchain is immutable, how can a document be revoked?
**Answer:**
Immutability does **not** mean the state cannot be updated; it means historical state transitions cannot be erased or rewritten.
In our system:
1. When a degree is revoked (e.g., student expelled or certificate misprinted), the transaction `revokeDocument("CERT-2026-0001", "Misprinted CGPA")` is submitted.
2. The smart contract updates `doc.isRevoked = true`.
3. The original issuance block still exists permanently in blockchain history as proof that ABC College originally issued it, but the current state reflects `REVOKED`.
4. Anyone verifying the document will see:
   `❌ STATUS: REVOKED (Reason: Misprinted CGPA, Revoked at: 2026-10-07)`.

---

## 📌 Section 3: Storage & IPFS Architecture

### Q6: What is IPFS and why is it preferred over Google Drive or AWS S3?
**Answer:**
1. **Content Addressing vs Location Addressing:**
   - Traditional web uses URLs pointing to locations (e.g. `s3.amazonaws.com/college/cert1.pdf`). If the server goes down or the file at that path is replaced, the link fails or serves a modified file.
   - IPFS uses Content Identifiers (**CID**), which are cryptographic multihashes of the file content itself. If the file changes by even one byte, its CID changes completely.
2. **Decentralized Permanence:** Files in IPFS can be retrieved from any peer in the IPFS swarm hosting the CID, eliminating vendor lock-in.

---

## 📌 Section 4: Security, Access Control & Edge Cases

### Q7: What prevents an attacker from issuing a fake certificate under a college's name?
**Answer:**
1. **Cryptographic Digital Signatures (ECDSA):** Every transaction sent to the Ethereum smart contract is signed by the caller's private key (`msg.sender`).
2. **Access Control Modifiers:** The smart contract has an `onlyAuthorizedIssuer` modifier. Only wallet addresses whitelisted by the super-admin (such as ABC Engineering College's verified public address `0x8A...92F`) are allowed to call `registerDocument()`.
3. If an unauthorized wallet attempts to call `registerDocument()`, the EVM reverts the transaction with:
   `"BlockVerify: Only authorized issuers can perform this action"`.

---

### Q8: What if someone uploads an identical certificate twice?
**Answer:**
The smart contract includes collision protection:
`require(documentsByHash[_documentHash].issuedAt == 0, "Document hash is already registered");`
`require(documentIdToHash[_documentId] == bytes32(0), "Document ID is already registered");`
If an issuer attempts to register a duplicate hash or duplicate ID, the EVM transaction reverts, preventing double-registration.

---

### Q9: What happens if an employer uploads a PDF that is slightly compressed or scanned?
**Answer:**
Because SHA-256 operates on the binary byte stream:
- If an employer uploads the original electronic PDF, the file hashes match bit-for-bit.
- If an employer scans a printed paper copy, the scan produces slightly different pixel noise and compression artifacts, leading to a different hash.
- **Solution in BlockVerify:** BlockVerify supports dual-mode verification:
  1. **Primary mode:** Upload original digital PDF $\rightarrow$ instant SHA-256 hash match against blockchain.
  2. **QR Code / Document ID mode:** For printed certificates, the user scans the printed QR code or types `CERT-2026-0001`. The system queries the blockchain using `verifyDocumentById()` and displays the official registered metadata, issuer credentials, and the original document preview from IPFS for visual side-by-side comparison!

---

## 📌 Section 5: Real-World Deployment & Cost Estimation

### Q10: How much does it cost to issue a certificate on Ethereum?
**Answer:**
- On **Ethereum Mainnet**, gas prices fluctuate. A `registerDocument` transaction consumes ~85,000 to 110,000 gas. At 15 Gwei and $3,000 ETH, that is approximately $3 to $5 per certificate.
- For institutional scale, the contract is deployed on **Ethereum Layer-2 Rollups** (such as Polygon, Arbitrum, or Optimism) or **Ethereum Sepolia Testnet** for zero/sub-cent cost ($0.001 per certificate) while retaining the full cryptographic security of Ethereum.

---

## 📌 Section 6: Summary of Viva Key Terms

| Term | Definition in BlockVerify |
| :--- | :--- |
| **SHA-256** | Secure Hash Algorithm producing a 256-bit (32-byte) unique mathematical fingerprint. |
| **IPFS CID** | Content Identifier based on cryptographic multihash representing file storage in IPFS. |
| **Smart Contract** | Self-executing code stored on the Ethereum Virtual Machine (EVM) managing registries and rules. |
| **Gas** | Computational fee required to execute transactions and state modifications on Ethereum. |
| **Web3.py** | Python library that interfaces FastAPI with the Ethereum blockchain via JSON-RPC. |
| **ECDSA** | Elliptic Curve Digital Signature Algorithm used by Ethereum to authenticate transaction senders. |
| **Non-Repudiation** | An issuer cannot deny having issued a certificate because their digital signature is permanently recorded in the block. |
