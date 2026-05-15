import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_recommend_requires_auth():
    response = client.post("/v1/matching/recommend", json={"user_id": "test"})
    assert response.status_code == 403
