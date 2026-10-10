import hashlib
import os
import requests
import logging
from pathlib import Path
from typing import Tuple
from app.config import settings

logger = logging.getLogger(__name__)

from app.hashing import hash_bytes, normalize_hash

# Base58 character alphabet for IPFS CIDv0
ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"

def base58_encode(b: bytes) -> str:
    """Base58 encoding implementation for CIDv0 generation"""
    n = int.from_bytes(b, 'big')
    res = []
    while n > 0:
        n, r = divmod(n, 58)
        res.append(ALPHABET[r])
    pad = 0
    for byte in b:
        if byte == 0:
            pad += 1
        else:
            break
    return (ALPHABET[0] * pad) + "".join(reversed(res))

def compute_sha256(content: bytes) -> str:
    """Computes standard 0x-prefixed SHA-256 digest via unified hashing module"""
    return hash_bytes(content)

def compute_ipfs_cid(content: bytes) -> str:
    """
    Computes standard IPFS CIDv0 (Qm...) using SHA-256 multihash
    Multihash format: <0x12 (sha2-256)><0x20 (32 bytes)><digest>
    """
    digest = hashlib.sha256(content).digest()
    multihash = bytes([0x12, 0x20]) + digest
    return base58_encode(multihash)

class IPFSService:
    def __init__(self):
        self.ipfs_storage_dir = settings.UPLOAD_DIR / "ipfs_node"
        self.ipfs_storage_dir.mkdir(parents=True, exist_ok=True)

    def upload_bytes(self, content: bytes, file_name: str) -> Tuple[str, str]:
        """
        Calculates SHA-256, mirrors locally, and pins to Pinata IPFS if configured.
        Returns: (file_hash, ipfs_cid)
        """
        file_hash = compute_sha256(content)
        cid = compute_ipfs_cid(content)
        
        # 1. Save to local IPFS decentralized mirror
        cid_path = self.ipfs_storage_dir / cid
        with open(cid_path, "wb") as f:
            f.write(content)

        # 2. If Pinata Cloud credentials are provided, pin to real global IPFS swarm
        if settings.PINATA_JWT or (settings.PINATA_API_KEY and settings.PINATA_SECRET_API_KEY):
            try:
                headers = {}
                if settings.PINATA_JWT:
                    headers["Authorization"] = f"Bearer {settings.PINATA_JWT}"
                else:
                    headers["pinata_api_key"] = settings.PINATA_API_KEY
                    headers["pinata_secret_api_key"] = settings.PINATA_SECRET_API_KEY

                files = {
                    'file': (file_name, content)
                }
                response = requests.post(
                    "https://api.pinata.cloud/pinning/pinFileToIPFS",
                    files=files,
                    headers=headers,
                    timeout=15
                )
                if response.status_code == 200:
                    pinata_res = response.json()
                    cid = pinata_res.get("IpfsHash", cid)
                    logger.info("Successfully pinned file to Pinata Cloud IPFS: %s", cid)
                else:
                    logger.warning(f"Pinata IPFS returned status {response.status_code}: {response.text}")
            except Exception as e:
                logger.warning(f"Pinata IPFS upload exception: {e}. Using local IPFS CID: {cid}")

        return file_hash, cid

    def get_gateway_url(self, cid: str) -> str:
        return f"{settings.IPFS_GATEWAY_URL}/{cid}"

ipfs_service = IPFSService()
