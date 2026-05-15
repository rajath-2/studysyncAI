import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_get_messages_requires_auth():
    response = client.get("/v1/messages/some-group-id")
    assert response.status_code == 403

def test_send_message_requires_auth():
    response = client.post("/v1/messages/some-group-id", json={"content": "Hello"})
    assert response.status_code == 403
