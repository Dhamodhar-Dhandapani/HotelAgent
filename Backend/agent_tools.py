from langchain_core.tools import tool
from database import SessionLocal, Booking, Guest, ServiceRequest
from rag_engine import get_retriever


@tool
def ask_hotel_policy(query: str) -> str:
    """
    ALWAYS use this tool to answer general questions about hotel policies, check-in/check-out times,
    amenities, cancellations, Wi-Fi, or pet rules.
    """
    retriever = get_retriever()
    docs = retriever.invoke(query)
    return "\n".join([doc.page_content for doc in docs])


@tool
def get_booking_details(booking_id: int) -> str:
    """
    READ ONLY: Retrieves the status and dates of a guest's booking.
    Requires booking_id.
    """
    db = SessionLocal()
    try:
        booking = db.query(Booking).join(Guest).filter(
            Booking.booking_id == booking_id
        ).first()
        if not booking:
            return "Error: No matching booking found. Verification failed."
        return f"Booking {booking_id} status: '{booking.status}'. Check-in: {booking.check_in_date}, Check-out: {booking.check_out_date}."
    finally:
        db.close()


@tool
def execute_checkout(booking_id: int) -> str:
    """
    WRITE: Processes a guest checkout.
    You MUST verify the booking_id with the guest before calling this.
    """
    db = SessionLocal()
    try:
        booking = db.query(Booking).join(Guest).filter(
            Booking.booking_id == booking_id
        ).first()
        if not booking:
            return "Checkout failed: Identity verification failed."
        if booking.status == "checked-out":
            return "This reservation is already checked out."

        booking.status = "checked-out"
        db.commit()
        return "Success: Booking successfully checked-out."
    except Exception as e:
        db.rollback()
        return f"Database error: {str(e)}"
    finally:
        db.close()


@tool
def create_service_request(booking_id: int,  request_details: str) -> str:
    """
    WRITE: Creates a housekeeping or concierge ticket (e.g., "Extra towels", "Fix AC").
    Requires booking_id verification.
    """
    db = SessionLocal()
    try:
        booking = db.query(Booking).join(Guest).filter(
            Booking.booking_id == booking_id,
        ).first()
        if not booking:
            return "Request failed: Identity verification failed."

        ticket = ServiceRequest(guest_id=booking.guest_id, request_details=request_details, status="pending")
        db.add(ticket)
        db.commit()
        return f"Success: Service ticket #{ticket.request_id} created."
    finally:
        db.close()


@tool
def escalate_to_human(booking_id: int, reason_for_escalation: str) -> str:
    """
    CRITICAL: Use this IMMEDIATELY if the user is angry, asks for a human manager,
    requests a refund, or if you cannot solve their problem.
    """
    db = SessionLocal()
    try:
        booking = db.query(Booking).join(Guest).filter(
            Booking.booking_id == booking_id
        ).first()

        guest_id = booking.guest_id if booking else 1
        ticket = ServiceRequest(
            guest_id=guest_id,
            request_details=f"URGENT HUMAN ESCALATION: {reason_for_escalation}",
            status="requires_human"
        )
        db.add(ticket)
        db.commit()
        return "Escalation logged. Inform the user a human manager has been paged."
    finally:
        db.close()