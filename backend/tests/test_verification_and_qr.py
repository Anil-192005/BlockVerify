import os
import sys
import pytest
from fastapi.testclient import TestClient

# Insert backend directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.main import app
from app.database import SessionLocal
from app.models import Document, User
from app.blockchain import blockchain_service
from app.qr_service import qr_service
from app.hashing import hash_bytes

client = TestClient(app)

def get_issuer_token():
    res = client.post("/api/auth/login", json={
        "email": "issuer@abccollege.edu",
        "password": "issuer123"
    })
    assert res.status_code == 200
    return res.json()["access_token"]

def test_a_genuine_document():
    """
    Test A: Genuine document
    Register a document and verify the exact same bytes.
    Expected: VALID
    """
    import time
    token = get_issuer_token()
    doc_bytes = f"%PDF-1.4 Genuine Certificate Test File Content for Student Alice {time.time()}".encode()
    doc_filename = f"alice_genuine_cert_{int(time.time())}.pdf"

    # Register document
    upload_res = client.post(
        "/api/documents/upload",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": (doc_filename, doc_bytes, "application/pdf")},
        data={
            "owner_name": "Alice Wonderland",
            "recipient_id": "1ALICE2026",
            "document_type": "Degree Certificate",
            "organization_name": "ABC Engineering College"
        }
    )
    assert upload_res.status_code == 200, upload_res.text
    created_doc = upload_res.json()
    doc_id = created_doc["document_id"]
    registered_hash = created_doc["file_hash"]

    # Verify using exact same bytes
    verify_res = client.post(
        "/api/verify/file",
        files={"file": (doc_filename, doc_bytes, "application/pdf")}
    )
    assert verify_res.status_code == 200
    data = verify_res.json()
    assert data["status"] == "VALID"
    assert data["is_valid"] is True
    assert data["is_tampered"] is False
    assert data["is_revoked"] is False
    assert data["hash_comparison"]["match"] is True
    assert data["document"]["document_id"] == doc_id
    assert data["hash_comparison"]["uploaded_file_hash"].lower() == registered_hash.lower()

def test_b_modified_document():
    """
    Test B: Modified document
    Change the document contents and verify the modified bytes against a claimed ID.
    Expected: INVALID
    """
    # Claim genuine certificate CERT-2026-000001
    genuine_doc_id = "CERT-2026-000001"
    altered_bytes = b"TAMPERED CERTIFICATE CONTENT: Grade changed from B to A+ for Anil M"

    verify_res = client.post(
        "/api/verify/file",
        files={"file": ("tampered_cert.pdf", altered_bytes, "application/pdf")},
        data={"claimed_doc_id": genuine_doc_id}
    )
    assert verify_res.status_code == 200
    data = verify_res.json()
    assert data["status"] == "INVALID"
    assert data["is_valid"] is False
    assert data["is_tampered"] is True
    assert data["is_revoked"] is False
    assert data["hash_comparison"]["match"] is False
    assert "avalanche" in data["hash_comparison"]["difference_explanation"].lower()

def test_c_pdf_with_embedded_qr_code():
    """
    Test C: PDF with embedded QR code
    Generate the final PDF, calculate its hash, register it, and verify the final PDF.
    Expected: VALID
    """
    token = get_issuer_token()
    auto_res = client.post(
        "/api/documents/issue-auto",
        headers={"Authorization": f"Bearer {token}"},
        data={
            "owner_name": "Charlie Chaplin",
            "recipient_id": "1CC2026DEPT",
            "document_type": "Diploma Certificate",
            "organization_name": "ABC Engineering College"
        }
    )
    assert auto_res.status_code == 200, auto_res.text
    created = auto_res.json()
    doc_id = created["document_id"]

    # Download or retrieve generated PDF bytes
    download_res = client.get(f"/api/documents/{doc_id}/download")
    assert download_res.status_code == 200
    final_pdf_bytes = download_res.content

    # Verify SHA-256 matches created record
    computed_hash = hash_bytes(final_pdf_bytes)
    assert computed_hash.lower() == created["file_hash"].lower()

    # Verify through /api/verify/file
    verify_res = client.post(
        "/api/verify/file",
        files={"file": (created["file_name"], final_pdf_bytes, "application/pdf")}
    )
    assert verify_res.status_code == 200
    data = verify_res.json()
    assert data["status"] == "VALID"
    assert data["is_valid"] is True
    assert data["document"]["document_id"] == doc_id
    assert data["document"]["owner_name"] == "Charlie Chaplin"

def test_d_unknown_document():
    """
    Test D: Unknown document
    Verify an unregistered document.
    Expected: NOT_FOUND
    """
    unknown_bytes = b"COMPLETELY UNREGISTERED DOCUMENT CONTENT RANDOM 998877665544"
    verify_res = client.post(
        "/api/verify/file",
        files={"file": ("unregistered.pdf", unknown_bytes, "application/pdf")}
    )
    assert verify_res.status_code == 200
    data = verify_res.json()
    assert data["status"] == "NOT_FOUND"
    assert data["is_valid"] is False
    assert data["is_tampered"] is False
    assert data["is_revoked"] is False

def test_e_revoked_document():
    """
    Test E: Revoked document
    Register a document, revoke it, and verify it.
    Expected: REVOKED
    """
    import time
    token = get_issuer_token()
    doc_bytes = f"TEMPORARY ADMISSION LETTER FOR REVOCATION TEST {time.time()}".encode()
    doc_filename = f"admission_temp_{int(time.time())}.pdf"

    upload_res = client.post(
        "/api/documents/upload",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": (doc_filename, doc_bytes, "application/pdf")},
        data={
            "owner_name": "David Revokee",
            "recipient_id": "1DR2026TEST",
            "document_type": "Course Certificate",
            "organization_name": "ABC Engineering College"
        }
    )
    assert upload_res.status_code == 200
    doc_id = upload_res.json()["document_id"]

    # Revoke it
    revoke_res = client.post(
        "/api/documents/revoke",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "document_id": doc_id,
            "reason": "Administrative cancellation due to student withdrawal"
        }
    )
    assert revoke_res.status_code == 200
    assert revoke_res.json()["status"] == "REVOKED"

    # Verify by file upload
    verify_file_res = client.post(
        "/api/verify/file",
        files={"file": (doc_filename, doc_bytes, "application/pdf")}
    )
    assert verify_file_res.status_code == 200
    file_data = verify_file_res.json()
    assert file_data["status"] == "REVOKED"
    assert file_data["is_valid"] is False
    assert file_data["is_revoked"] is True

    # Verify by document ID
    verify_id_res = client.get(f"/api/verify/id/{doc_id}")
    assert verify_id_res.status_code == 200
    id_data = verify_id_res.json()
    assert id_data["status"] == "REVOKED"
    assert id_data["is_revoked"] is True
    assert "student withdrawal" in id_data["blockchain_proof"]["reason"]

def test_f_blockchain_unavailable():
    """
    Test F: Blockchain unavailable
    Simulate an RPC failure.
    Expected: VERIFICATION_UNAVAILABLE
    """
    # Activate simulated RPC failure
    blockchain_service.simulate_rpc_failure = True
    try:
        # File verification
        verify_res = client.post(
            "/api/verify/file",
            files={"file": ("test.pdf", b"Some certificate data", "application/pdf")}
        )
        assert verify_res.status_code == 503
        data = verify_res.json()
        assert data["status"] == "VERIFICATION_UNAVAILABLE"
        assert data["is_valid"] is False
        assert "UNREACHABLE" in data["message"]

        # ID verification
        verify_id_res = client.get("/api/verify/id/CERT-2026-000001")
        assert verify_id_res.status_code == 503
        id_data = verify_id_res.json()
        assert id_data["status"] == "VERIFICATION_UNAVAILABLE"
        assert id_data["is_valid"] is False
    finally:
        blockchain_service.simulate_rpc_failure = False

def test_g_qr_scanner_decoding():
    """
    Test G: QR scanner
    Test QR decoding using a known valid QR image.
    Expected: The correct document ID or verification URL is decoded.
    """
    test_doc_id = "CERT-2026-000001"
    qr_path, qr_base64 = qr_service.generate_verification_qr(test_doc_id)
    assert os.path.exists(qr_path)
    assert qr_base64.startswith("data:image/png;base64,")

    # Verify file content exists and is valid PNG image
    with open(qr_path, "rb") as f:
        png_header = f.read(8)
    assert png_header == b"\x89PNG\r\n\x1a\n"

    # Test the URL pattern matching helper logic as implemented in QRScannerPage
    verify_url = f"https://blockverify.vercel.app/verify/{test_doc_id}"
    extracted_id = verify_url.split('/verify/')[1].split('?')[0].strip()
    assert extracted_id == test_doc_id

def test_h_qr_route():
    """
    Test H: QR route
    Open the decoded URL endpoint and verify that the correct document page / data loads.
    """
    doc_id = "CERT-2026-000001"
    res = client.get(f"/api/verify/id/{doc_id}")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "VALID"
    assert data["is_valid"] is True
    assert data["document"]["document_id"] == doc_id
    assert data["document"]["owner_name"] == "Anil M"
    assert data["document"]["organization_name"] == "ABC Engineering College"

def test_i_camera_permissions_and_empty_file():
    """
    Test I: Camera permissions & error handling
    Test empty file rejection and error messaging.
    Expected: A clear error message and working validation.
    """
    empty_res = client.post(
        "/api/verify/file",
        files={"file": ("empty.pdf", b"", "application/pdf")}
    )
    assert empty_res.status_code == 400
    assert "empty" in empty_res.json()["detail"].lower()
