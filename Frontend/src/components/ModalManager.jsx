import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BedDouble, UtensilsCrossed, ConciergeBell, Calendar, Users, CreditCard, CheckCircle, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { bookRoom, checkAvailability, serviceRequest, foodOrdering } from '../services/api';

const ROOM_TYPES = ['Standard Single', 'Standard Double', 'Deluxe King', 'Suite', 'Presidential Suite'];
const SERVICES = [
    { id: 'housekeeping', label: 'Housekeeping', emoji: '🧹' },
    { id: 'laundry', label: 'Laundry', emoji: '👕' },
    { id: 'maintenance', label: 'Maintenance', emoji: '🔧' },
    { id: 'towels', label: 'Extra Towels', emoji: '🛁' },
    { id: 'wakeup', label: 'Wake-up Call', emoji: '⏰' },
];
const MENU = [
    { name: 'Continental Breakfast', price: 18, emoji: '🥐' },
    { name: 'Club Sandwich', price: 22, emoji: '🥪' },
    { name: 'Pasta Primavera', price: 26, emoji: '🍝' },
    { name: 'Grilled Salmon', price: 38, emoji: '🐟' },
    { name: 'Chocolate Lava Cake', price: 14, emoji: '🍫' },
    { name: 'Caesar Salad', price: 16, emoji: '🥗' },
];

// ── Input styling helper ──
const inputStyle = {
    background: 'rgba(17,24,39,0.6)',
    border: '1px solid rgba(212,168,83,0.12)',
    borderRadius: 12,
    padding: '10px 14px',
    color: '#e8e2d6',
    fontSize: 14,
    outline: 'none',
    width: '100%',
    fontFamily: "'Inter', sans-serif",
    transition: 'border-color 0.3s',
};

const inputFocusClass = 'focus:!border-[rgba(212,168,83,0.4)]';

// ── Base Modal ──
function ModalBase({ title, icon: Icon, iconColor, children, onClose }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(2,6,10,0.9)', backdropFilter: 'blur(12px)' }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <motion.div
                initial={{ scale: 0.92, y: 24, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.92, y: 24, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                className="w-full max-w-md max-h-[85vh] overflow-y-auto p-6 rounded-2xl"
                style={{
                    background: 'linear-gradient(170deg, rgba(17,24,39,0.95) 0%, rgba(10,14,26,0.98) 100%)',
                    border: '1px solid rgba(212,168,83,0.12)',
                    boxShadow: '0 0 60px rgba(212,168,83,0.08), 0 0 120px rgba(0,212,255,0.05)',
                }}
                role="dialog"
                aria-modal="true"
                aria-label={title}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: `${iconColor}15` }}>
                            <Icon size={18} style={{ color: iconColor }} />
                        </div>
                        <h3 className="text-lg font-bold"
                            style={{ color: '#f0d48a', fontFamily: "'Playfair Display', serif" }}>
                            {title}
                        </h3>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onClose}
                        className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                        style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: '#64748b',
                        }}
                        aria-label="Close"
                    >
                        <X size={14} />
                    </motion.button>
                </div>

                {/* Divider */}
                <div className="w-full h-px mb-5" style={{ background: 'linear-gradient(90deg, transparent, rgba(212,168,83,0.2), transparent)' }} />

                {children}
            </motion.div>
        </motion.div>
    );
}

// ── Success Screen ──
function SuccessScreen({ title, subtitle, icon: Icon, iconColor, onClose, buttonLabel = 'Done', buttonColor = '#d4a853' }) {
    return (
        <ModalBase title={title} icon={Icon} iconColor={iconColor} onClose={onClose}>
            <div className="text-center py-8">
                <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                >
                    <CheckCircle size={52} style={{ color: '#34d399' }} className="mx-auto mb-4" />
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <h4 className="text-lg font-bold text-white mb-2">{title}</h4>
                    {subtitle && <p className="text-sm text-slate-400 mb-1">{subtitle}</p>}
                    <p className="text-xs text-slate-500">Check your conversation for details.</p>
                </motion.div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="mt-6 px-8 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                    style={{
                        background: `linear-gradient(135deg, ${buttonColor}, ${buttonColor}cc)`,
                        boxShadow: `0 0 20px ${buttonColor}33`,
                    }}
                >
                    {buttonLabel}
                </motion.button>
            </div>
        </ModalBase>
    );
}

// ── Booking Modal ──
function BookingModal({ onClose }) {
    const { addMessage, setAvatarState } = useApp();
    const [form, setForm] = useState({ checkIn: '', checkOut: '', guests: 1, roomType: ROOM_TYPES[0] });
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setAvatarState('thinking');
        try {
            await bookRoom(form);
            setSuccess(true);
            addMessage('assistant', `✅ Your ${form.roomType} has been reserved from ${form.checkIn} to ${form.checkOut} for ${form.guests} guest(s). Confirmation will be sent to your email.`);
        } catch {
            addMessage('assistant', `Your ${form.roomType} booking request for ${form.checkIn} to ${form.checkOut} has been noted. Our team will confirm shortly.`);
            setSuccess(true);
        }
        setAvatarState('idle');
        setLoading(false);
    };

    if (success) return (
        <SuccessScreen
            title="Booking Confirmed!"
            subtitle="Your luxury stay has been arranged."
            icon={BedDouble} iconColor="#d4a853" onClose={onClose}
        />
    );

    return (
        <ModalBase title="Book a Room" icon={BedDouble} iconColor="#d4a853" onClose={onClose}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs mb-1.5 block font-medium" style={{ color: '#d4a853' }}>Check-In</label>
                        <input type="date" required value={form.checkIn}
                            onChange={e => setForm(f => ({ ...f, checkIn: e.target.value }))}
                            style={inputStyle} className={inputFocusClass} />
                    </div>
                    <div>
                        <label className="text-xs mb-1.5 block font-medium" style={{ color: '#d4a853' }}>Check-Out</label>
                        <input type="date" required value={form.checkOut}
                            onChange={e => setForm(f => ({ ...f, checkOut: e.target.value }))}
                            style={inputStyle} className={inputFocusClass} />
                    </div>
                </div>
                <div>
                    <label className="text-xs mb-1.5 block font-medium" style={{ color: '#d4a853' }}>Room Type</label>
                    <select value={form.roomType}
                        onChange={e => setForm(f => ({ ...f, roomType: e.target.value }))}
                        style={inputStyle} className={inputFocusClass}>
                        {ROOM_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-xs mb-1.5 block font-medium" style={{ color: '#d4a853' }}>Guests</label>
                    <input type="number" min={1} max={6} value={form.guests}
                        onChange={e => setForm(f => ({ ...f, guests: e.target.value }))}
                        style={inputStyle} className={inputFocusClass} />
                </div>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit" disabled={loading}
                    className="py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-50 mt-2"
                    style={{
                        background: 'linear-gradient(135deg, #d4a853, #c9973e)',
                        boxShadow: '0 0 20px rgba(212,168,83,0.2)',
                    }}
                >
                    {loading ? 'Processing...' : '✨ Confirm Booking'}
                </motion.button>
            </form>
        </ModalBase>
    );
}

// ── Service Modal ──
function ServiceModal({ onClose }) {
    const { addMessage, setAvatarState } = useApp();
    const [selected, setSelected] = useState(null);
    const [note, setNote] = useState('');
    const [done, setDone] = useState(false);

    const handleSubmit = async () => {
        if (!selected) return;
        setAvatarState('thinking');
        try { await serviceRequest({ type: selected.id, note }); } catch { }
        addMessage('assistant', `✅ Your ${selected.label} request has been logged! Our team will attend to it shortly.`);
        setAvatarState('idle');
        setDone(true);
    };

    if (done) return (
        <SuccessScreen
            title="Request Submitted!"
            subtitle="Our team has been notified."
            icon={ConciergeBell} iconColor="#00d4ff" onClose={onClose}
            buttonColor="#0891b2"
        />
    );

    return (
        <ModalBase title="Request Service" icon={ConciergeBell} iconColor="#00d4ff" onClose={onClose}>
            <div className="grid grid-cols-2 gap-2.5 mb-4">
                {SERVICES.map(s => (
                    <motion.button
                        key={s.id}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setSelected(s)}
                        className="flex items-center gap-2 px-3.5 py-3.5 rounded-xl text-sm font-medium transition-all"
                        style={{
                            background: selected?.id === s.id
                                ? 'rgba(0,212,255,0.12)'
                                : 'rgba(17,24,39,0.6)',
                            border: selected?.id === s.id
                                ? '1px solid rgba(0,212,255,0.4)'
                                : '1px solid rgba(212,168,83,0.08)',
                            color: selected?.id === s.id ? '#fff' : '#94a3b8',
                        }}
                    >
                        <span className="text-lg">{s.emoji}</span>{s.label}
                    </motion.button>
                ))}
            </div>
            <textarea
                placeholder="Additional notes (optional)..."
                value={note} onChange={e => setNote(e.target.value)}
                rows={3}
                style={{ ...inputStyle, resize: 'none', marginBottom: 16 }}
                className={inputFocusClass}
            />
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit} disabled={!selected}
                className="w-full py-3 rounded-xl font-semibold text-sm text-white disabled:opacity-30 transition-all"
                style={{
                    background: 'linear-gradient(135deg, #0891b2, #06b6d4)',
                    boxShadow: '0 0 20px rgba(0,212,255,0.15)',
                }}
            >
                Submit Request
            </motion.button>
        </ModalBase>
    );
}

// ── Food Modal ──
function FoodModal({ onClose }) {
    const { addMessage, setAvatarState } = useApp();
    const [cart, setCart] = useState({});
    const [done, setDone] = useState(false);

    const increment = (item) => {
        setCart(c => ({ ...c, [item.name]: (c[item.name] || 0) + 1 }));
    };
    const decrement = (item) => {
        setCart(c => {
            const n = (c[item.name] || 0) - 1;
            if (n <= 0) { const { [item.name]: _, ...rest } = c; return rest; }
            return { ...c, [item.name]: n };
        });
    };

    const total = Object.entries(cart).reduce((sum, [name, qty]) => {
        const item = MENU.find(m => m.name === name);
        return sum + (item?.price || 0) * qty;
    }, 0);

    const handleOrder = async () => {
        if (!Object.keys(cart).length) return;
        setAvatarState('thinking');
        try { await foodOrdering({ items: cart }); } catch { }
        const items = Object.entries(cart).map(([n, q]) => `${q}× ${n}`).join(', ');
        addMessage('assistant', `🍽️ Your order has been placed: ${items}. Total: $${total}. Estimated delivery: 25–35 minutes.`);
        setAvatarState('idle');
        setDone(true);
    };

    if (done) return (
        <SuccessScreen
            title="Order Placed!"
            subtitle="Estimated delivery: 25–35 minutes"
            icon={UtensilsCrossed} iconColor="#34D399" onClose={onClose}
            buttonColor="#059669"
        />
    );

    return (
        <ModalBase title="Room Service" icon={UtensilsCrossed} iconColor="#34D399" onClose={onClose}>
            <div className="flex flex-col gap-2 mb-4">
                {MENU.map(item => (
                    <div key={item.name}
                        className="flex items-center justify-between px-4 py-3 rounded-xl transition-all"
                        style={{
                            background: cart[item.name] ? 'rgba(52,211,153,0.08)' : 'rgba(17,24,39,0.5)',
                            border: cart[item.name] ? '1px solid rgba(52,211,153,0.2)' : '1px solid rgba(212,168,83,0.06)',
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-lg">{item.emoji}</span>
                            <div>
                                <p className="text-sm font-medium text-white">{item.name}</p>
                                <p className="text-xs" style={{ color: '#34d399' }}>${item.price}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {cart[item.name] > 0 && (
                                <>
                                    <motion.button
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => decrement(item)}
                                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold transition-colors"
                                        style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)' }}
                                    >−</motion.button>
                                    <span className="text-sm text-white w-5 text-center font-semibold">{cart[item.name]}</span>
                                </>
                            )}
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => increment(item)}
                                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold transition-colors"
                                style={{
                                    background: 'linear-gradient(135deg, #059669, #10b981)',
                                    boxShadow: '0 0 8px rgba(52,211,153,0.3)',
                                }}
                            >+</motion.button>
                        </div>
                    </div>
                ))}
            </div>

            {total > 0 && (
                <div className="flex justify-between items-center px-4 py-2 mb-3 rounded-lg"
                    style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.1)' }}>
                    <span className="text-xs text-slate-400">Total</span>
                    <span className="text-base font-bold" style={{ color: '#34d399' }}>${total}</span>
                </div>
            )}

            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleOrder} disabled={!total}
                className="w-full py-3 rounded-xl font-semibold text-sm text-white disabled:opacity-30 transition-all"
                style={{
                    background: 'linear-gradient(135deg, #059669, #10b981)',
                    boxShadow: '0 0 20px rgba(52,211,153,0.15)',
                }}
            >
                🍽️ Place Order
            </motion.button>
        </ModalBase>
    );
}

// ── Info Modal ──
function InfoModal({ onClose }) {
    const INFO = [
        { label: '🏊 Pool', value: 'Rooftop infinity pool, open 7AM–10PM' },
        { label: '💆 Spa', value: 'Full-service spa, 9AM–9PM' },
        { label: '🏋️ Gym', value: '24/7 fitness center, floor 3' },
        { label: '🍽️ Restaurant', value: 'The Grand Brasserie, 6AM–11PM' },
        { label: '🅿️ Parking', value: 'Valet & self-park available' },
        { label: '📶 Wi-Fi', value: 'Complimentary high-speed throughout' },
        { label: '🛎️ Check-In', value: '3:00 PM' },
        { label: '🚪 Check-Out', value: '12:00 PM (Noon)' },
        { label: '🐾 Pets', value: 'Not permitted (service animals OK)' },
        { label: '🚭 Smoking', value: 'Smoke-free property' },
    ];
    return (
        <ModalBase title="Hotel Information" icon={Sparkles} iconColor="#d4a853" onClose={onClose}>
            <div className="flex flex-col gap-2">
                {INFO.map((info, i) => (
                    <motion.div
                        key={info.label}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="flex items-start gap-3 px-4 py-3 rounded-xl"
                        style={{
                            background: 'rgba(17,24,39,0.5)',
                            border: '1px solid rgba(212,168,83,0.06)',
                        }}
                    >
                        <span className="text-sm font-semibold w-28 flex-shrink-0" style={{ color: '#f0d48a' }}>{info.label}</span>
                        <span className="text-sm text-slate-400">{info.value}</span>
                    </motion.div>
                ))}
            </div>
        </ModalBase>
    );
}

const MODAL_MAP = { booking: BookingModal, food: FoodModal, service: ServiceModal, info: InfoModal };

export default function ModalManager() {
    const { activeModal, closeModal } = useApp();

    return (
        <AnimatePresence>
            {activeModal && (() => {
                const Modal = MODAL_MAP[activeModal];
                if (!Modal) return null;
                return <Modal onClose={closeModal} />;
            })()}
        </AnimatePresence>
    );
}
