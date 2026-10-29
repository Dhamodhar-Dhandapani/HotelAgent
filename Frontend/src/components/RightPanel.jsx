import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { BedDouble, UtensilsCrossed, ConciergeBell, Search, Info, LogIn } from 'lucide-react';

const ACTIONS = [
    {
        id: 'booking', icon: BedDouble, label: 'Book Room', desc: 'Reserve your luxury stay',
        color: '#d4a853', bg: 'rgba(212,168,83,0.1)', hoverBorder: 'rgba(212,168,83,0.4)',
    },
    {
        id: 'food', icon: UtensilsCrossed, label: 'Room Service', desc: 'Fine dining & cuisine',
        color: '#34D399', bg: 'rgba(52,211,153,0.08)', hoverBorder: 'rgba(52,211,153,0.4)',
    },
    {
        id: 'service', icon: ConciergeBell, label: 'Request Service', desc: 'Concierge & housekeeping',
        color: '#00d4ff', bg: 'rgba(0,212,255,0.08)', hoverBorder: 'rgba(0,212,255,0.4)',
    },
    {
        id: 'status', icon: Search, label: 'Check Booking', desc: 'View your reservation',
        color: '#A78BFA', bg: 'rgba(167,139,250,0.08)', hoverBorder: 'rgba(167,139,250,0.4)',
    },
    {
        id: 'info', icon: Info, label: 'Hotel Info', desc: 'Amenities & policies',
        color: '#F472B6', bg: 'rgba(244,114,182,0.08)', hoverBorder: 'rgba(244,114,182,0.4)',
    },
    {
        id: 'checkin', icon: LogIn, label: 'Check In/Out', desc: 'Manage your visit',
        color: '#FB923C', bg: 'rgba(251,146,60,0.08)', hoverBorder: 'rgba(251,146,60,0.4)',
    },
];

function ActionCard({ action, onSelect }) {
    const Icon = action.icon;
    return (
        <motion.button
            whileHover={{ scale: 1.03, y: -3 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(action)}
            className="w-full flex items-center gap-3 px-3.5 py-3.5 rounded-xl text-left transition-all focus:outline-none group"
            style={{
                background: 'linear-gradient(145deg, rgba(17,24,39,0.8), rgba(10,14,26,0.9))',
                border: '1px solid rgba(212,168,83,0.08)',
            }}
            aria-label={action.label}
        >
            <motion.div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300"
                style={{ background: action.bg }}
                whileHover={{
                    boxShadow: `0 0 16px ${action.bg}`,
                }}
            >
                <Icon size={17} style={{ color: action.color }} />
            </motion.div>
            <div className="min-w-0">
                <p className="text-[13px] font-semibold text-slate-200 truncate group-hover:text-white transition-colors">
                    {action.label}
                </p>
                <p className="text-[10px] text-slate-500 truncate group-hover:text-slate-400 transition-colors">
                    {action.desc}
                </p>
            </div>
            {/* Hover accent line */}
            <div className="ml-auto w-0.5 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: action.color }} />
        </motion.button>
    );
}

export default function RightPanel() {
    const { openModal, addMessage, setAvatarState } = useApp();

    const handleSelect = (action) => {
        openModal(action.id);
        const greetings = {
            booking: "I'd like to book a room.",
            food: "I'd like to order food.",
            service: "I need a service request.",
            status: "I want to check my booking status.",
            info: "Tell me about the hotel amenities.",
            checkin: "I need help with check-in or check-out.",
        };
        addMessage('user', greetings[action.id]);
        setAvatarState('thinking');
        setTimeout(() => {
            const replies = {
                booking: "Wonderful! I'd be delighted to help you book a room. Please select your dates and preferred room type.",
                food: "Of course! Our award-winning kitchen is at your service. What would you like to order?",
                service: "Absolutely! What can I arrange for you — housekeeping, laundry, maintenance, or something else?",
                status: "Please share your Booking ID and I'll retrieve your reservation details immediately.",
                info: "Grand Metropolitan offers a world-class spa, infinity pool, fine dining, fitness center, and full concierge services. What interests you?",
                checkin: "Check-in is available from 3:00 PM and check-out by 12:00 PM. Shall I arrange early check-in or late check-out?",
            };
            addMessage('assistant', replies[action.id]);
            setAvatarState('idle');
        }, 1200);
    };

    return (
        <motion.aside
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col gap-2.5 h-full"
        >
            <div className="px-1 mb-1">
                <h2 className="text-xs font-semibold uppercase tracking-[0.2em]"
                    style={{ color: '#d4a853' }}>
                    Quick Actions
                </h2>
            </div>
            {ACTIONS.map((a, i) => (
                <motion.div
                    key={a.id}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.15 + i * 0.07 }}
                >
                    <ActionCard action={a} onSelect={handleSelect} />
                </motion.div>
            ))}
        </motion.aside>
    );
}
