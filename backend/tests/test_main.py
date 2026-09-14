import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_login_success():
    response = client.post("/api/auth/login", json={
        "email": "admin@siges.local",
        "password": "Admin123!"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["rol"] == "ADMIN"

def test_login_failure():
    response = client.post("/api/auth/login", json={
        "email": "admin@siges.local",
        "password": "WrongPassword!"
    })
    assert response.status_code == 401