import os
import sys
import pytest
from fastapi.testclient import TestClient

# Insert backend directory
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.main import app
from app.database import SessionLocal
from app.models import Document, User

client = TestClient(app)

def test_api_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["project"] == "BlockVerify"
    assert "Sepolia" in data["network"]

def test_auth_login():
    response = client.post("/api/auth/login", json={
        "email": "issuer@abccollege.edu",
        "password": "issuer123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "issuer"

def test_verify_valid_document():
    # Verify pre-seeded valid certificate for Anil M
    response = client.get("/api/verify/id/CERT-2026-000001")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "VALID"
    assert data["is_valid"] is True
    assert data["document"]["owner_name"] == "Anil M"
    assert "Ethereum Sepolia" in data["blockchain_proof"]["network"]

def test_verify_revoked_document():
    # Verify pre-seeded revoked certificate for Robert Smith
    response = client.get("/api/verify/id/CERT-2026-000003")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "REVOKED"
    assert data["is_revoked"] is True
    assert "Grade miscalculation" in data["blockchain_proof"]["reason"]

def test_tamper_detection():
    # Upload an altered dummy file claiming to be CERT-2026-000001
    altered_content = b"TAMPERED CERTIFICATE CONTENT: Student: Anil M, Marks: 99"
    response = client.post(
        "/api/verify/file",
        files={"file": ("altered_degree.pdf", altered_content, "application/pdf")},
        data={"claimed_doc_id": "CERT-2026-000001"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ("INVALID", "TAMPERED")
    assert data["is_tampered"] is True
    assert data["hash_comparison"]["match"] is False
    assert "avalanche" in data["hash_comparison"]["difference_explanation"].lower()

def test_dashboard_stats():
    response = client.get("/api/admin/stats")
    assert response.status_code == 200
    data = response.json()
    assert data["total_documents"] >= 3
    assert data["verified_documents"] >= 2
    assert data["revoked_documents"] >= 1
