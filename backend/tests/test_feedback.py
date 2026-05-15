import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_feedback_requires_auth():
    response = client.post("/v1/feedback/", json={"group_id": "test", "rating": 5})
    assert response.status_code == 403

def test_get_feedback_requires_auth():
    response = client.get("/v1/feedback/some-group-id")
    assert response.status_code == 403