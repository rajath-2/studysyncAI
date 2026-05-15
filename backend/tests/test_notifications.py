import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_list_notifications_requires_auth():
    response = client.get("/v1/notifications/")
    assert response.status_code == 403
