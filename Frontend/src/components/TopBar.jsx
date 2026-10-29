import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wifi, Sparkles } from 'lucide-react';
import { formatDateTime, formatTime } from '../utils/helpers';

export default function TopBar() {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(id);
    }, []);

    return (
        <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="relative flex items-center justify-between px-6 py-4 glass-dark z-20"
            style={{
                borderBottom: '1px solid rgba(212,168,83,0.12)',
            }}
        >
            {/* Shimmer overlay */}
            <div className="absolute inset-0 shimmer pointer-events-none rounded-none" />

            {/* Logo + Hotel Name */}
            <div className="flex items-center gap-3 relative z-10">
                <motion.div
                    className="w-11 h-11 rounded-full flex items-center justify-center relative"
                    style={{
                        background: 'linear-gradient(135deg, #d4a853, #c9973e)',
                        boxShadow: '0 0 20px rgba(212,168,83,0.3)',
                    }}
                    animate={{ boxShadow: ['0 0 15px rgba(212,168,83,0.2)', '0 0 30px rgba(212,168,83,0.4)', '0 0 15px rgba(212,168,83,0.2)'] }}
                    transition={{ duration: 3, repeat: Infinity }}
                >
                    <Sparkles size={18} className="text-white" />
                </motion.div>
                <div>
                    <h1
                        className="text-lg font-bold text-gold-gradient leading-tight tracking-wide"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                        Grand Metropolitan
                    </h1>
                    <div className="flex items-center gap-1.5">
                        <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                                <motion.span
                                    key={i}
                                    className="text-[8px]"
                                    style={{ color: '#d4a853' }}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 + i * 0.1 }}
                                >★</motion.span>
                            ))}
                        </div>
                        <p className="text-[10px] text-slate-500 tracking-[0.2em] uppercase">Hotel & Resorts</p>
                    </div>
                </div>
            </div>

            {/* Center – ARIA Status */}
            <div className="hidden md:flex items-center gap-2.5 px-5 py-2 glass-gold rounded-full relative z-10">
                <motion.div
                    className="w-2 h-2 rounded-full bg-emerald-400"
                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{ boxShadow: '0 0 8px rgba(52,211,153,0.6)' }}
                />
                <span className="text-xs font-medium tracking-wide"
                    style={{ color: '#d4a853' }}>
                    ARIA Online
                </span>
                <Wifi size={12} className="text-cyan-400" />
            </div>

            {/* Date & Time */}
            <div className="text-right relative z-10">
                <p className="text-base font-semibold tabular-nums" style={{ color: '#f0d48a', fontFamily: "'Outfit', sans-serif" }}>
                    {formatTime(now)}
                </p>
                <p className="text-[10px] text-slate-500 hidden sm:block tracking-wide">
                    {formatDateTime(now)}
                </p>
            </div>
        </motion.header>
    );
}
