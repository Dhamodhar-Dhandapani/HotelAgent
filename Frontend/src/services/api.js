import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: { 'Content-Type': 'application/json' },
    timeout: 60000, // 60s — agent may take time to respond
});

api.interceptors.response.use(
    (res) => res,
    (err) => {
        console.error('API Error:', err.response?.data || err.message);
        return Promise.reject(err);
    }
);

// ─── Main AI Chat ───
export const sendMessage = (message, session_id) =>
    api.post('/chat', { message, session_id }).then((r) => r.data);

// ─── Bookings ───
export const bookRoom = (payload) =>
    api.post('/bookings', payload).then((r) => r.data);

export const getBookingStatus = (bookingId) =>
    api.get(`/bookings/${bookingId}`).then((r) => r.data);

export const cancelBooking = (bookingId) =>
    api.delete(`/bookings/${bookingId}`).then((r) => r.data);

// ─── Rooms ───
export const checkAvailability = () =>
    api.get('/rooms/availability').then((r) => r.data);

// ─── Service Requests ───
export const serviceRequest = (payload) =>
    api.post('/service-requests', payload).then((r) => r.data);

// ─── Food Orders ───
export const foodOrdering = (payload) =>
    api.post('/food-orders', payload).then((r) => r.data);

// ─── Hotel Info ───
export const hotelInformation = (category) =>
    api.get('/hotel-info', { params: category ? { category } : {} }).then((r) => r.data);

// ─── Health ───
export const healthCheck = () =>
    api.get('/health').then((r) => r.data);

export default api;
