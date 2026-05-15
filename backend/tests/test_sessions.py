import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_list_sessions_requires_auth():
    response = client.get("/v1/sessions/")
    assert response.status_code == 403
