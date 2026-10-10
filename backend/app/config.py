import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "BlockVerify"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Security & Auth
    SECRET_KEY: str = os.getenv("JWT_SECRET", os.getenv("SECRET_KEY", "blockverify-super-secure-production-jwt-secret-key-2026"))
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database (PostgreSQL in production, SQLite fallback for local test)
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/blockverify.db")
    
    # Blockchain settings - Ethereum Sepolia Testnet
    ETHEREUM_RPC_URL: str = os.getenv("ETHEREUM_RPC_URL", os.getenv("BLOCKCHAIN_RPC_URL", "https://rpc.sepolia.org"))
    CONTRACT_ADDRESS: str = os.getenv("CONTRACT_ADDRESS", "0x5FbDB2315678afecb367f032d93F642f64180aa3")
    DEPLOYER_PRIVATE_KEY: str = os.getenv("DEPLOYER_PRIVATE_KEY", "")
    SEPOLIA_CHAIN_ID: int = 11155111
    SEPOLIA_EXPLORER_URL: str = "https://sepolia.etherscan.io"
    USE_SIMULATED_CHAIN: bool = os.getenv("USE_SIMULATED_CHAIN", "false" if os.getenv("DEPLOYER_PRIVATE_KEY") else "true").lower() in ("true", "1", "t")
    
    # IPFS & Pinata credentials
    PINATA_API_KEY: str = os.getenv("PINATA_API_KEY", os.getenv("IPFS_API_KEY", ""))
    PINATA_SECRET_API_KEY: str = os.getenv("PINATA_SECRET_API_KEY", os.getenv("IPFS_API_SECRET", ""))
    PINATA_JWT: str = os.getenv("PINATA_JWT", "")
    IPFS_GATEWAY_URL: str = os.getenv("IPFS_GATEWAY_URL", "https://gateway.pinata.cloud/ipfs")
    
    # Storage directories
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    CERT_DIR: Path = BASE_DIR / "generated_certs"
    QR_DIR: Path = BASE_DIR / "generated_qrs"
    
    # Public URLs
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()

# Ensure directories exist
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.CERT_DIR.mkdir(parents=True, exist_ok=True)
settings.QR_DIR.mkdir(parents=True, exist_ok=True)
