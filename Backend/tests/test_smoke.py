import sys
import os

sys.path.append(
    os.path.abspath(
        os.path.join(
            os.path.dirname(__file__),
            ".."
        )
    )
)

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_application_starts():
    response = client.get("/")
    assert response.status_code == 200


def test_swagger_exists():
    response = client.get("/docs")
    assert response.status_code == 200


def test_openapi_exists():
    response = client.get("/openapi.json")
    assert response.status_code == 200


def test_health():
    response = client.get("/health")
    assert response.status_code == 200


def test_hotel_info():
    response = client.get("/hotel-info")
    assert response.status_code == 200


def test_delete_session():
    response = client.delete("/sessions/test")
    assert response.status_code == 200