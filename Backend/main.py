"""
FastAPI server for HotelAgentAI.
Wraps the LangGraph agent and exposes REST endpoints for the frontend.

All heavy imports (LangChain, database, etc.) are done LAZILY inside
endpoint functions so the server starts instantly even if those
packages aren't installed yet.

Run with: uvicorn main:app --reload --port 8000
"""

import os
import uuid
import traceback
from datetime import datetime
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pydantic import EmailStr

load_dotenv()

# ──────────────────────────────────────────────
# FastAPI App
# ──────────────────────────────────────────────
app = FastAPI(
    title="HotelAgentAI API",
    description="AI-powered hotel concierge API powered by LangGraph",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──────────────────────────────────────────────
# Lazy Loaders
# ──────────────────────────────────────────────
_agent_executor = None
_db_available = None


def _check_db():
    """Try to import database module. Returns True if available."""
    global _db_available
    if _db_available is not None:
        return _db_available
    try:
        import database  # noqa: F401
        _db_available = True
    except Exception:
        _db_available = False
    return _db_available


def _get_db_session():
    """Get a DB session if database is available."""
    from database import SessionLocal
    return SessionLocal()


def _get_models():
    """Import database models lazily."""
    from database import Booking, Guest, RoomType, ServiceRequest
    return Booking, Guest, RoomType, ServiceRequest


def get_agent():
    """Lazy-init the LangGraph agent."""
    global _agent_executor
    if _agent_executor is not None:
        return _agent_executor

    from langchain_openai import ChatOpenAI
    from langchain.agents import create_agent
    from agent_tools import (
        ask_hotel_policy,
        get_booking_details,
        execute_checkout,
        create_service_request,
        escalate_to_human,
    )

    llm = ChatOpenAI(
        base_url=os.environ.get("LLM_BASE_URL"),
        api_key=os.environ.get("LLM_API_KEY"),
        model=os.environ.get("LLM_MODEL_NAME", "openai/gpt-oss-20b"),
        temperature=0.0,
        max_tokens=512,
        top_p=0.9,
        frequency_penalty=0.2,
        presence_penalty=0.1,
        streaming=False,
    )

    system_prompt = """
You are the Virtual Receptionist for the Grand Metropolitan Hotel.

Rules:
1. Always require Booking ID + Phone Number before checkout or service requests.
2. Use 'ask_hotel_policy' for hotel questions.
3. Use 'get_booking_details' to look up booking details.
4. Escalate to human if guest is angry, requests refund, or personal data changes.
5. Never modify guest names, emails, or pricing.
6. Be polite, professional, and helpful at all times.
"""

    tools = [
        ask_hotel_policy,
        get_booking_details,
        execute_checkout,
        create_service_request,
        escalate_to_human,
    ]

    _agent_executor = create_agent(llm, tools=tools, system_prompt=system_prompt)
    return _agent_executor


# ──────────────────────────────────────────────
# In-memory session store
# ──────────────────────────────────────────────
MAX_HISTORY = 10
_sessions: dict[str, list] = {}


def get_session_history(session_id: str) -> list:
    if session_id not in _sessions:
        _sessions[session_id] = []
    return _sessions[session_id]


# ──────────────────────────────────────────────
# Pydantic Models
# ──────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    session_id: str
    timestamp: str


class BookingRequest(BaseModel):
    guest_name: str
    email: EmailStr
    phone: str
    room_type: str
    check_in: str
    check_out: str


class ServiceRequestBody(BaseModel):
    booking_id: Optional[int] = None
    type: str = ""
    note: Optional[str] = ""


class FoodOrderRequest(BaseModel):
    booking_id: Optional[int] = None
    items: dict = {}


# ──────────────────────────────────────────────
# Health & Root
# ──────────────────────────────────────────────
@app.get("/")
async def root():
    return {
        "service": "HotelAgentAI",
        "status": "online",
        "version": "1.0.0",
        "db_available": _check_db(),
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy", "db_available": _check_db()}


# ──────────────────────────────────────────────
# CHAT — Main AI Agent Endpoint
# ──────────────────────────────────────────────
@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    session_id = req.session_id or str(uuid.uuid4())
    history = get_session_history(session_id)

    try:
        from langchain_core.messages import HumanMessage, AIMessage
    except ImportError:
        return ChatResponse(
            response="The AI agent dependencies are not installed. Please run: pip install -r requirements.txt",
            session_id=session_id,
            timestamp=datetime.utcnow().isoformat(),
        )

    history.append(HumanMessage(content=req.message))
    if len(history) > MAX_HISTORY:
        history[:] = history[-MAX_HISTORY:]

    try:
        agent = get_agent()
        result = agent.invoke({"messages": history})
        agent_reply = result["messages"][-1]
        reply_text = agent_reply.content
        history.append(agent_reply)

        return ChatResponse(
            response=reply_text,
            session_id=session_id,
            timestamp=datetime.utcnow().isoformat(),
        )
    except Exception as e:
        fallback = f"I apologize, I'm experiencing a technical issue. Error: {str(e)[:150]}"
        try:
            history.append(AIMessage(content=fallback))
        except Exception:
            pass
        return ChatResponse(
            response=fallback,
            session_id=session_id,
            timestamp=datetime.utcnow().isoformat(),
        )


# ──────────────────────────────────────────────
# BOOKING Endpoints
# ──────────────────────────────────────────────
@app.post("/bookings")
async def create_booking(req: BookingRequest):

    if not _check_db():
        raise HTTPException(
            status_code=503,
            detail="Database unavailable"
        )

    Booking, Guest, RoomType, _ = _get_models()
    db = _get_db_session()

    try:

        if not req.guest_name.strip():
            raise HTTPException(
                status_code=400,
                detail="Guest name is required"
            )

        if not req.phone.strip():
            raise HTTPException(
                status_code=400,
                detail="Phone number is required"
            )

        guest = (
            db.query(Guest)
            .filter(Guest.email == req.email)
            .first()
        )

        if not guest:
            guest = Guest(
                full_name=req.guest_name,
                email=req.email,
                phone=req.phone
            )

            db.add(guest)
            db.commit()
            db.refresh(guest)

        room_type = (
            db.query(RoomType)
            .filter(RoomType.name == req.room_type)
            .first()
        )

        if not room_type:
            raise HTTPException(
                status_code=404,
                detail=f"Room type '{req.room_type}' not found"
            )

        check_in = datetime.strptime(
            req.check_in,
            "%Y-%m-%d"
        ).date()

        check_out = datetime.strptime(
            req.check_out,
            "%Y-%m-%d"
        ).date()

        nights = (check_out - check_in).days

        if nights <= 0:
            raise HTTPException(
                status_code=400,
                detail="Check-out date must be after check-in date"
            )

        total_price = float(
            room_type.price_per_night
        ) * nights

        booking = Booking(
            guest_id=guest.guest_id,
            room_type_id=room_type.room_type_id,
            check_in_date=check_in,
            check_out_date=check_out,
            total_price=total_price,
            status="confirmed",
            phone_number=req.phone
        )

        db.add(booking)
        db.commit()
        db.refresh(booking)

        return {
            "booking_id": booking.booking_id,
            "guest_id": guest.guest_id,
            "status": booking.status,
            "total_price": float(booking.total_price)
        }

    except HTTPException:
        raise

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    finally:
        db.close()

@app.get("/bookings/{booking_id}")
async def get_booking(booking_id: int):
    if not _check_db():
        raise HTTPException(status_code=503, detail="Database not available")

    Booking, Guest, RoomType, _ = _get_models()
    db = _get_db_session()
    try:
        booking = db.query(Booking).filter(Booking.booking_id == booking_id).first()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        guest = db.query(Guest).filter(Guest.guest_id == booking.guest_id).first()
        room = db.query(RoomType).filter(RoomType.room_type_id == booking.room_type_id).first()
        return {
            "booking_id": booking.booking_id,
            "guest_name": guest.full_name if guest else "Unknown",
            "room_type": room.name if room else "Unknown",
            "check_in": str(booking.check_in_date),
            "check_out": str(booking.check_out_date),
            "total_price": float(booking.total_price),
            "status": booking.status,
        }
    finally:
        db.close()


@app.delete("/bookings/{booking_id}")
async def cancel_booking(booking_id: int):
    if not _check_db():
        raise HTTPException(status_code=503, detail="Database not available")

    Booking, _, _, _ = _get_models()
    db = _get_db_session()
    try:
        booking = db.query(Booking).filter(Booking.booking_id == booking_id).first()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        if booking.status == "cancelled":
            return {"message": "Already cancelled", "status": "cancelled"}
        booking.status = "cancelled"
        db.commit()
        return {"message": f"Booking #{booking_id} cancelled", "status": "cancelled"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


# ──────────────────────────────────────────────
# ROOM AVAILABILITY
# ──────────────────────────────────────────────
@app.get("/rooms/availability")
async def check_room_availability():
    if not _check_db():
        # Return sample data when DB isn't available
        return {
            "rooms": [
                {"room_type_id": 1, "name": "Standard Single", "description": "Cozy single room", "price_per_night": 120.0, "max_occupancy": 1, "total_rooms": 50},
                {"room_type_id": 2, "name": "Standard Double", "description": "Comfortable double room", "price_per_night": 180.0, "max_occupancy": 2, "total_rooms": 40},
                {"room_type_id": 3, "name": "Deluxe King", "description": "Spacious king room with city view", "price_per_night": 280.0, "max_occupancy": 3, "total_rooms": 25},
                {"room_type_id": 4, "name": "Suite", "description": "Luxury suite with living area", "price_per_night": 450.0, "max_occupancy": 4, "total_rooms": 10},
                {"room_type_id": 5, "name": "Presidential Suite", "description": "The finest suite with panoramic views", "price_per_night": 850.0, "max_occupancy": 6, "total_rooms": 3},
            ]
        }

    _, _, RoomType, _ = _get_models()
    db = _get_db_session()
    try:
        rooms = db.query(RoomType).all()
        return {
            "rooms": [
                {
                    "room_type_id": r.room_type_id,
                    "name": r.name,
                    "description": r.description,
                    "price_per_night": float(r.price_per_night),
                    "max_occupancy": r.max_occupancy,
                    "total_rooms": r.total_rooms,
                }
                for r in rooms
            ]
        }
    finally:
        db.close()


# ──────────────────────────────────────────────
# SERVICE REQUESTS
# ──────────────────────────────────────────────
@app.post("/service-requests")
async def create_service_req(req: ServiceRequestBody):
    if not _check_db():
        return {
            "request_id": 0,
            "type": req.type,
            "status": "noted",
            "message": f"{req.type} request noted. Database not connected."
        }

    Booking, _, _, ServiceRequestModel = _get_models()
    db = _get_db_session()

    try:
        if not req.booking_id:
            raise HTTPException(
                status_code=400,
                detail="Booking ID is required"
            )

        booking = (
            db.query(Booking)
            .filter(Booking.booking_id == req.booking_id)
            .first()
        )

        if not booking:
            raise HTTPException(
                status_code=404,
                detail="Booking not found"
            )

        if not req.type.strip():
            raise HTTPException(
                status_code=400,
                detail="Service request type is required"
            )

        guest_id = booking.guest_id

        details = (
            f"{req.type}: {req.note}"
            if req.note
            else req.type
        )

        ticket = ServiceRequestModel(
            guest_id=guest_id,
            request_details=details,
            status="pending"
        )

        db.add(ticket)
        db.commit()
        db.refresh(ticket)

        return {
            "request_id": ticket.request_id,
            "type": req.type,
            "status": "pending",
            "message": f"Service request #{ticket.request_id} created."
        }

    except HTTPException:
        raise

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    finally:
        db.close()

# ──────────────────────────────────────────────
# FOOD ORDERS
# ──────────────────────────────────────────────
@app.post("/food-orders")
async def place_food_order(req: FoodOrderRequest):

    if not _check_db():
        items_str = ", ".join(
            [f"{qty}x {name}" for name, qty in req.items.items()]
        )

        return {
            "order_id": 0,
            "items": req.items,
            "status": "noted",
            "message": f"Food order noted: {items_str}. Database not connected."
        }

    Booking, _, _, ServiceRequestModel = _get_models()
    db = _get_db_session()

    try:

        if not req.booking_id:
            raise HTTPException(
                status_code=400,
                detail="Booking ID is required"
            )

        booking = (
            db.query(Booking)
            .filter(Booking.booking_id == req.booking_id)
            .first()
        )

        if not booking:
            raise HTTPException(
                status_code=404,
                detail="Booking not found"
            )

        if not req.items:
            raise HTTPException(
                status_code=400,
                detail="At least one food item must be ordered"
            )

        guest_id = booking.guest_id

        items_str = ", ".join(
            [f"{qty}x {name}" for name, qty in req.items.items()]
        )

        ticket = ServiceRequestModel(
            guest_id=guest_id,
            request_details=f"FOOD ORDER: {items_str}",
            status="pending"
        )

        db.add(ticket)
        db.commit()
        db.refresh(ticket)

        return {
            "order_id": ticket.request_id,
            "items": req.items,
            "status": "pending",
            "message": f"Food order #{ticket.request_id} placed."
        }

    except HTTPException:
        raise

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    finally:
        db.close()

# ──────────────────────────────────────────────
# HOTEL INFORMATION
# ──────────────────────────────────────────────
HOTEL_INFO = {
    "amenities": {
        "pool": "Rooftop infinity pool, open 7AM–10PM",
        "spa": "Full-service spa & wellness center, 9AM–9PM",
        "gym": "24/7 fitness center, floor 3",
        "parking": "Valet & self-park available",
        "wifi": "Complimentary high-speed Wi-Fi",
        "restaurant": "The Grand Brasserie — 6AM–11PM",
        "lounge": "Skyline Lounge — 5PM–1AM",
        "business": "Business center, 24/7",
    },
    "policies": {
        "check_in": "3:00 PM",
        "check_out": "12:00 PM (Noon)",
        "late_checkout": "Subject to availability, fee may apply",
        "cancellation": "Free cancellation up to 24 hours before check-in",
        "pets": "Not permitted (service animals welcome)",
        "smoking": "No smoking indoors",
        "children": "Children under 12 stay free in parents' room",
    },
    "facilities": {
        "rooms": "350+ premium rooms across 30 floors",
        "restaurants": "3 dining venues + 24/7 room service",
        "conference": "Grand Ballroom + 8 meeting rooms",
        "concierge": "24/7 concierge service",
    },
}


@app.get("/hotel-info")
async def get_hotel_info(category: Optional[str] = None):
    if category and category in HOTEL_INFO:
        return {"category": category, "data": HOTEL_INFO[category]}
    return {"data": HOTEL_INFO}


# ──────────────────────────────────────────────
# Session Management
# ──────────────────────────────────────────────
@app.delete("/sessions/{session_id}")
async def clear_session(session_id: str):
    if session_id in _sessions:
        del _sessions[session_id]
    return {"message": "Session cleared"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
