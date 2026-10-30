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


def test_rooms_availability():
    response = client.get("/rooms/availability")

    assert response.status_code == 200

    body = response.json()

    assert "rooms" in body


def test_booking_invalid_email():

    payload = {
        "guest_name": "Test User",
        "email": "invalid-email",
        "phone": "9876543210",
        "room_type": "Standard Single",
        "check_in": "2026-12-01",
        "check_out": "2026-12-03"
    }

    response = client.post(
        "/bookings",
        json=payload
    )

    assert response.status_code == 422


def test_booking_invalid_date():

    payload = {
        "guest_name": "Test User",
        "email": "test@test.com",
        "phone": "9876543210",
        "room_type": "Standard Single",
        "check_in": "2026-12-10",
        "check_out": "2026-12-05"
    }

    response = client.post(
        "/bookings",
        json=payload
    )

    assert response.status_code in [400, 404]


def test_service_request_without_booking():

    payload = {
        "type": "Housekeeping",
        "note": "Need Towels"
    }

    response = client.post(
        "/service-requests",
        json=payload
    )

    assert response.status_code == 400


def test_service_request_invalid_booking():

    payload = {
        "booking_id": 999999,
        "type": "Housekeeping",
        "note": "Need Towels"
    }

    response = client.post(
        "/service-requests",
        json=payload
    )

    assert response.status_code == 404


def test_food_order_without_booking():

    payload = {
        "items": {
            "Pizza": 1
        }
    }

    response = client.post(
        "/food-orders",
        json=payload
    )

    assert response.status_code == 400


def test_food_order_empty_items():

    payload = {
        "booking_id": 1,
        "items": {}
    }

    response = client.post(
        "/food-orders",
        json=payload
    )

    assert response.status_code in [400, 404]


def test_food_order_invalid_booking():

    payload = {
        "booking_id": 999999,
        "items": {
            "Pizza": 1
        }
    }

    response = client.post(
        "/food-orders",
        json=payload
    )

    assert response.status_code == 404


def test_chat_api():

    payload = {
        "message": "Hello"
    }

    response = client.post(
        "/chat",
        json=payload
    )

    assert response.status_code == 200

    body = response.json()

    assert "response" in body