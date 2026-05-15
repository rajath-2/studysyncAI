import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_get_user_requires_auth():
    response = client.get("/v1/users/some-uuid")
    assert response.status_code == 403