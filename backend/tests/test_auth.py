import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_register_missing_fields():
    response = client.post("/v1/auth/register", json={})
    assert response.status_code == 422

def test_login_invalid_email():
    response = client.post("/v1/auth/login", json={"email": "notanemail", "password": "test"})
    assert response.status_code == 422