# 🚀 BlockVerify – Blockchain-Based Document Authentication & Verification System

> **A Production-Ready Decentralized Document Authentication and Tamper-Proof Verification Platform Powered by Ethereum Sepolia, Python FastAPI, IPFS & React.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![Ethereum Sepolia](https://img.shields.io/badge/Ethereum-Sepolia_Testnet-627EEA.svg?logo=ethereum)](https://sepolia.etherscan.io)
[![Solidity](https://img.shields.io/badge/Solidity-^0.8.20-363636.svg?logo=solidity)](https://soliditylang.org/)
[![React 18](https://img.shields.io/badge/React-18+-61DAFB.svg?logo=react)](https://react.dev)
[![IPFS](https://img.shields.io/badge/IPFS-Pinata_Cloud-65C2CB.svg?logo=ipfs)](https://pinata.cloud)

---

## 📌 Executive Summary

Document fraud, credential forgery, and altered degrees are rampant issues for universities, employers, and government institutions. 

**BlockVerify** eliminates document tampering through the **Off-Chain Storage / On-Chain Hash Paradigm**:
1. **Issuer** (e.g., ABC Engineering College) logs in and issues a degree certificate or uploads an official document.
2. The backend generates a **256-bit SHA-256 cryptographic digest** of the exact binary content.
3. The actual PDF file is mirrored off-chain to **IPFS (InterPlanetary File System)** via **Pinata Cloud**, generating an immutable **CID**.
4. The **SHA-256 hash**, **IPFS CID**, **Document ID**, and **Issuer Wallet Address** are committed to the **Ethereum Sepolia Smart Contract (`BlockVerify.sol`)**.
5. An official **QR Code** is synthesized and embedded directly into the generated certificate.
6. **Anyone (Employers, Universities, Embassies)** can verify the credential via public URL, drag-and-drop file comparison, or QR code scan—**without creating an account!**

---

## 🏛️ System Architecture

```
   ┌────────────────────────────────┐
   │         Admin / Issuer         │
   │    ABC Engineering College     │
   └───────────────┬────────────────┘
                   │
                   │ 1. Upload or Auto-Generate Degree
                   ▼
   ┌────────────────────────────────┐
   │  Web Frontend (React + Vite)   │
   │     Deployed on Vercel         │
   └───────────────┬────────────────┘
                   │
                   │ HTTPS REST API
                   ▼
   ┌────────────────────────────────┐
   │   Backend API (Python FastAPI) │
   │     Deployed on Render/Railway │
   └───────┬───────────────┬────────┘
           │               │
  2. Store │               │ 3. Cryptographic Hash
  Off-Chain│               │    Anchor On-Chain
           ▼               ▼
┌──────────────────┐  ┌──────────────────────────────────┐
│   IPFS Mirror    │  │       Ethereum Blockchain        │
│  Pinata Cloud    │  │   Sepolia Testnet Smart Contract │
└──────────────────┘  └─────────────────┬────────────────┘
                                        │
                                        │ 4. Transaction Hash & Block Mined
                                        ▼
                              ┌───────────────────┐
                              │ Embedded QR Code  │
                              └─────────┬─────────┘
                                        │
                                        │ 5. Public Verification Scan
                                        ▼
                              ┌───────────────────┐
                              │  Verify Portal    │
                              │ Upload Hash vs Tx │
                              └─────────┬─────────┘
                                        │
                         ┌──────────────┴──────────────┐
                         ▼                             ▼
                  ✅ VALID AUTHENTIC           🚨 FORGED / TAMPERED
```

---

## 🌟 Highlight Features

| Feature | Description |
| :--- | :--- |
| **🛡️ Cryptographic Tampering Lab** | Demonstrates the **SHA-256 Avalanche Effect**. Altering even 1 byte (marks from 85 to 95) mutates the hash and flags `TAMPERING DETECTED / FORGED` with side-by-side hash diff! |
| **📱 Mobile QR Verification** | Real-time camera scanner + drag-and-drop QR image decoder using `jsQR`. Scans directly into the verification view. |
| **🚫 On-Chain Revocation** | Issuers can invoke `revokeDocument()` on Ethereum. Immutability preserves historical evidence while updating status to `REVOKED`. |
| **📜 Automated PDF Synthesis** | Generates formal landscape university certificates with embedded high-resolution verification QR codes using ReportLab. |
| **🔍 Sepolia EVM Explorer** | Live ledger of mined blocks, transactions, gas consumption, and direct Sepolia Etherscan transaction links. |
| **🎓 Defense & Viva Guide** | Complete viva examination preparation guide located in `security/DEFENSE_VIVA_QA.md`. |

---

## 💻 Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Axios, React Router v6, jsQR.
- **Backend**: Python 3.12, FastAPI, Uvicorn, SQLAlchemy, PostgreSQL, Pydantic, SlowAPI (rate limiting), ReportLab.
- **Blockchain**: Solidity `^0.8.20`, Ethereum Sepolia Testnet, Hardhat, Web3.py.
- **Storage**: IPFS (Pinata Cloud API + Base58 Multihash CIDv0 engine).
- **Security**: JWT tokens, PBKDF2 SHA-256 password hashing, CORS protection, File MIME validation, Rate limiting.

---

## 🚀 Live Testing & Local Setup

### 1. Prerequisites
- Python 3.10+
- Node.js v18+ & npm

### 2. Start Backend Server
```bash
# Windows: Double-click run_backend.bat OR run in shell:
.\venv\Scripts\python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be live at: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 3. Start Frontend Dashboard
```bash
# Windows: Double-click run_frontend.bat OR run in shell:
cd frontend
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) in Google Chrome.

### 4. Run Automated Test Suite
```bash
.\venv\Scripts\pytest backend\tests\test_all.py
```
*(All 6 integration tests cover login, verification, tamper detection, revocation, and stats)*

---

## 🧪 Pre-Seeded Demonstration Accounts

| Role | Email | Password | Organization |
| :--- | :--- | :--- | :--- |
| **Issuer** | `issuer@abccollege.edu` | `issuer123` | ABC Engineering College |
| **Admin** | `admin@blockverify.eth` | `admin123` | Ethereum Root Governance |
| **Verifier**| `verifier@techcorp.com` | `verifier123` | TechCorp Global Recruiting |

### Sample Credentials in Registry:
- `CERT-2026-000001`: **Valid** Bachelor of Engineering for *Anil M*
- `CERT-2026-000002`: **Valid** Marks Card for *Sarah Jenkins*
- `CERT-2026-000003`: **Revoked** Experience Certificate for *Robert Smith*

---

## 🌐 Public Deployment Guide (Step-by-Step)

### Step 1: Deploy Smart Contract to Sepolia Testnet
1. Get free Sepolia ETH from [Google Cloud Sepolia Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia) or [Sepolia Faucet](https://sepoliafaucet.com/).
2. Set your environment variables in `.env`:
   ```env
   SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
   DEPLOYER_PRIVATE_KEY=your_metamask_private_key
   ETHERSCAN_API_KEY=your_etherscan_api_key
   ```
3. Deploy the contract:
   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
   ```
4. Copy the deployed contract address and update `CONTRACT_ADDRESS` in `.env`.

---

### Step 2: Deploy Backend to Render.com / Railway
1. Push this repository to GitHub.
2. Sign in to [Render.com](https://render.com/).
3. Click **New +** $\rightarrow$ **Blueprint** and connect your GitHub repo.
4. Render will automatically read [`render.yaml`](file:///c:/Users/Anil%20M/Downloads/blockchain%20project/render.yaml) and provision:
   - **PostgreSQL Database** (`blockverify_db`)
   - **FastAPI Web Service** (`blockverify-api`)
5. In Render Environment Settings, add:
   - `ETHEREUM_RPC_URL`: `https://rpc.sepolia.org`
   - `CONTRACT_ADDRESS`: Your deployed Sepolia contract address
   - `DEPLOYER_PRIVATE_KEY`: Your wallet private key
   - `PINATA_API_KEY` & `PINATA_SECRET_API_KEY`: From [Pinata Cloud](https://pinata.cloud)
   - `FRONTEND_URL`: Your Vercel domain

---

### Step 3: Deploy Frontend to Vercel
1. Sign in to [Vercel](https://vercel.com/) and click **Add New Project**.
2. Select your repository and choose the `frontend` root directory.
3. Add the environment variable:
   - `VITE_API_BASE_URL`: `https://your-backend-name.onrender.com/api`
4. Deploy! Vercel uses [`frontend/vercel.json`](file:///c:/Users/Anil%20M/Downloads/blockchain%20project/frontend/vercel.json) to handle clean SPA routing.
5. Open your public URL in Google Chrome (Desktop or Mobile) to verify!

---

## 📂 Repository Structure

```
blockchain-project/
├── contracts/
│   └── BlockVerify.sol           # Solidity smart contract (OpenZeppelin patterns)
├── scripts/
│   └── deploy.js                 # Hardhat deployment script to Sepolia
├── hardhat.config.js             # Hardhat network configuration
├── backend/
│   ├── app/
│   │   ├── main.py               # FastAPI entrypoint, rate limiter, seed data
│   │   ├── config.py             # Sepolia & Pinata IPFS settings
│   │   ├── database.py           # PostgreSQL/SQLite session manager
│   │   ├── models.py             # 7 SQLAlchemy tables (users, docs, txs, audit...)
│   │   ├── schemas.py            # Pydantic schemas
│   │   ├── blockchain.py         # Web3.py & Sepolia EVM state engine
│   │   ├── ipfs.py               # Pinata Cloud pinning & CIDv0 hasher
│   │   ├── qr_service.py         # High-resolution QR generator
│   │   └── routes/               # Modular API routes (auth, doc, verify, admin)
│   ├── tests/
│   │   └── test_all.py           # Automated integration test suite
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/           # Navbar, Footer
│   │   ├── context/              # AuthContext
│   │   ├── pages/                # Home, Dashboard, Verify, QR, Upload, Details...
│   │   ├── services/api.ts       # Production Axios/Fetch client
│   │   └── App.tsx               # Full React Router mapping
│   ├── vercel.json               # Vercel SPA rewrite config
│   └── package.json
├── security/
│   └── DEFENSE_VIVA_QA.md        # Comprehensive Examination & Viva Q&A
├── Dockerfile                    # Production containerization
├── docker-compose.yml            # PostgreSQL + Backend orchestrator
├── render.yaml                   # 1-Click Render cloud blueprint
└── README.md
```
