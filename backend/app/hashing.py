import hashlib
import logging
from typing import BinaryIO

logger = logging.getLogger(__name__)

def normalize_hash(h: str) -> str:
    """
    Ensures consistent lowercase '0x'-prefixed 64-hex-character SHA-256 representation.
    """
    clean = h.strip().lower()
    if not clean.startswith("0x"):
        clean = "0x" + clean
    return clean

def hash_bytes(data: bytes) -> str:
    """
    Computes standard SHA-256 digest from raw byte array.
    Guarantees consistent 0x-prefixed lowercase hexadecimal digest.
    Rejects empty byte sequences.
    """
    if not data or len(data) == 0:
        raise ValueError("Cannot calculate SHA-256 hash of empty document bytes.")
    digest = hashlib.sha256(data).hexdigest().lower()
    return f"0x{digest}"

def hash_file_stream(file_stream: BinaryIO) -> str:
    """
    Reads a file stream completely, computes SHA-256, and rewinds stream to position 0.
    """
    try:
        file_stream.seek(0)
    except Exception:
        pass
    content = file_stream.read()
    try:
        file_stream.seek(0)
    except Exception:
        pass
    return hash_bytes(content)

def hash_to_bytes32(h: str) -> bytes:
    """
    Converts a normalized 0x-prefixed SHA-256 hash string into Solidity bytes32.
    """
    clean = normalize_hash(h)[2:]
    if len(clean) != 64:
        raise ValueError(f"Invalid SHA-256 hash length for bytes32: expected 64 hex chars, got {len(clean)}")
    return bytes.fromhex(clean)

def bytes32_to_hash(b: bytes) -> str:
    """
    Converts a Solidity bytes32 byte sequence into normalized 0x-prefixed lowercase hex string.
    """
    return f"0x{b.hex().lower()}"

def safe_log_hash_operation(action: str, doc_id: str | None, file_hash: str | None):
    """
    Logs document ID and cryptographic hash for debugging without logging sensitive contents or secrets.
    """
    logger.info("HASH_OP [%s] doc_id=%s, hash=%s", action, doc_id or "N/A", file_hash or "N/A")
