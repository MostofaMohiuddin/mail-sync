from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_status_route():
    response = client.get("/api/status")
    assert response.status_code == 200
    assert response.json() == {"detail": "Healthy!"}
