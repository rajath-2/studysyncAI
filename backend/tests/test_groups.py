import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_list_groups_requires_auth():
    response = client.get("/v1/groups/")
    assert response.status_code == 403

def test_create_group_requires_auth():
    response = client.post("/v1/groups/", json={"name": "Test", "subject": "Math"})
    assert response.status_code == 403
