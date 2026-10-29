import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, Integer, String, Date, Numeric, Text, ForeignKey, TIMESTAMP
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from datetime import datetime

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class RoomType(Base):
    __tablename__ = "room_types"
    __table_args__ = {'schema': 'HotelAgentSchema'}

    room_type_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    description = Column(Text)
    price_per_night = Column(Numeric(10, 2), nullable=False)
    max_occupancy = Column(Integer, nullable=False)
    total_rooms = Column(Integer, nullable=False)


class Guest(Base):
    __tablename__ = "guests"
    __table_args__ = {'schema': 'HotelAgentSchema'}

    guest_id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    phone = Column(String(20), nullable=False)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)


class Booking(Base):
    __tablename__ = "booking"
    __table_args__ = {'schema': 'HotelAgentSchema'}

    booking_id = Column(Integer, primary_key=True, index=True)
    guest_id = Column(Integer, ForeignKey("HotelAgentSchema.guests.guest_id"), nullable=False)
    room_type_id = Column(Integer, ForeignKey("HotelAgentSchema.room_types.room_type_id"), nullable=False)
    check_in_date = Column(Date, nullable=False)
    check_out_date = Column(Date, nullable=False)
    total_price = Column(Numeric(10, 2), nullable=False)
    status = Column(String(20), default="confirmed")
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    phone_number = Column(String(20), nullable=False)

    guest = relationship("Guest")
    room_type = relationship("RoomType")


class ServiceRequest(Base):
    __tablename__ = "service_requests"
    __table_args__ = {'schema': 'HotelAgentSchema'}

    request_id = Column(Integer, primary_key=True, index=True,autoincrement=True)
    guest_id = Column(Integer, ForeignKey("HotelAgentSchema.guests.guest_id"), nullable=False)
    request_details = Column(Text, nullable=False)
    status = Column(String(20), default="pending")
    created_at = Column(TIMESTAMP, default=datetime.utcnow)