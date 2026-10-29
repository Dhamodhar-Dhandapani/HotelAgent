import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import robotImg from '../assets/ai_robot_concierge.png';

const stateConfig = {
    idle: {
        label: 'Ready to assist you',
        labelColor: 'text-emerald-400',
        dotColor: 'bg-emerald-400',
        glowColor: 'rgba(212, 168, 83, 0.2)',
        ringColor: 'rgba(212, 168, 83, 0.1)',
        eyeColor: 'rgba(0, 212, 255, 0.6)',
    },
    listening: {
        label: 'Listening to you...',
        labelColor: 'text-cyan-400',
        dotColor: 'bg-cyan-400',
        glowColor: 'rgba(0, 212, 255, 0.35)',
        ringColor: 'rgba(0, 212, 255, 0.15)',
        eyeColor: 'rgba(0, 212, 255, 0.9)',
    },
    thinking: {
        label: 'Processing your request...',
        labelColor: 'text-amber-400',
        dotColor: 'bg-amber-400',
        glowColor: 'rgba(212, 168, 83, 0.3)',
        ringColor: 'rgba(212, 168, 83, 0.12)',
        eyeColor: 'rgba(212, 168, 83, 0.8)',
    },
    speaking: {
        label: 'ARIA is responding...',
        labelColor: 'text-violet-400',
        dotColor: 'bg-violet-400',
        glowColor: 'rgba(139, 92, 246, 0.3)',
        ringColor: 'rgba(139, 92, 246, 0.12)',
        eyeColor: 'rgba(139, 92, 246, 0.8)',
    },
};

// Animated ripple rings around the avatar
function RippleRings({ color, count = 3 }) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute inset-0 rounded-full"
                    style={{ border: `1.5px solid ${color}` }}
                    initial={{ scale: 1, opacity: 0.7 }}
                    animate={{ scale: 2.4 + i * 0.5, opacity: 0 }}
                    transition={{ duration: 2, delay: i * 0.6, repeat: Infinity, ease: 'easeOut' }}
                />
            ))}
        </>
    );
}

// Orbiting particles during "thinking" state
function OrbitParticles() {
    const orbits = useMemo(() => [0, 60, 120, 180, 240, 300].map((deg, i) => ({
        deg, i,
        color: i % 2 === 0 ? '#d4a853' : '#00d4ff',
        size: 5 - i * 0.3,
    })), []);

    return (
        <>
            {orbits.map(({ deg, i, color, size }) => (
                <motion.div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                        top: '50%', left: '50%',
                        marginTop: -size / 2, marginLeft: -size / 2,
                        width: size, height: size,
                        background: color,
                        boxShadow: `0 0 8px ${color}`,
                    }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2.5 + i * 0.2, repeat: Infinity, ease: 'linear', delay: i * 0.15 }}
                    initial={{ rotate: deg, x: 100 }}
                />
            ))}
        </>
    );
}

// Holographic ring around the avatar
function HolographicRing({ color }) {
    return (
        <motion.div
            className="absolute inset-[-20px] rounded-full pointer-events-none"
            style={{
                border: `1px solid ${color}`,
                transformStyle: 'preserve-3d',
            }}
            animate={{ rotateZ: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
        >
            {/* Node dots on the ring */}
            {[0, 90, 180, 270].map((deg) => (
                <div
                    key={deg}
                    className="absolute w-1.5 h-1.5 rounded-full"
                    style={{
                        background: color,
                        boxShadow: `0 0 6px ${color}`,
                        top: '50%',
                        left: '50%',
                        transform: `rotate(${deg}deg) translateX(130px) translateY(-50%)`,
                    }}
                />
            ))}
        </motion.div>
    );
}

export default function AvatarSystem() {
    const { avatarState } = useApp();
    const cfg = stateConfig[avatarState] || stateConfig.idle;

    return (
        <div className="flex flex-col items-center gap-5 select-none">
            {/* Avatar Container */}
            <div className="relative flex items-center justify-center" style={{ width: 280, height: 280 }}>

                {/* Outer ambient glow */}
                <motion.div
                    className="absolute inset-[-30px] rounded-full"
                    animate={{
                        boxShadow: `0 0 80px ${cfg.glowColor}, 0 0 160px ${cfg.ringColor}`,
                    }}
                    transition={{ duration: 0.8 }}
                />

                {/* Holographic outer ring */}
                <HolographicRing color={cfg.eyeColor} />

                {/* Ripple rings for listening/speaking */}
                <AnimatePresence>
                    {avatarState === 'listening' && (
                        <RippleRings color="rgba(0, 212, 255, 0.4)" count={3} />
                    )}
                    {avatarState === 'speaking' && (
                        <RippleRings color="rgba(139, 92, 246, 0.35)" count={2} />
                    )}
                </AnimatePresence>

                {/* Spinning dashed ring for thinking */}
                <AnimatePresence>
                    {avatarState === 'thinking' && (
                        <motion.div
                            className="absolute inset-[-10px] rounded-full"
                            style={{ border: '2px dashed rgba(212,168,83,0.4)' }}
                            initial={{ opacity: 0, rotate: 0 }}
                            animate={{ opacity: 1, rotate: 360 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                        />
                    )}
                </AnimatePresence>

                {/* Robot Avatar Image */}
                <motion.div
                    className="relative z-10 rounded-full overflow-hidden"
                    style={{
                        width: 220,
                        height: 220,
                        boxShadow: `0 0 50px ${cfg.glowColor}, 0 0 100px ${cfg.ringColor}`,
                    }}
                    animate={
                        avatarState === 'idle'
                            ? { y: [0, -12, 0], scale: [1, 1.02, 1] }
                            : avatarState === 'listening'
                                ? { scale: [1, 1.04, 1] }
                                : avatarState === 'speaking'
                                    ? { scale: [1, 1.05, 1, 1.03, 1] }
                                    : { scale: 1 }
                    }
                    transition={{
                        duration: avatarState === 'idle' ? 4 : 1.2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                >
                    <img
                        src={robotImg}
                        alt="ARIA — AI Robot Concierge"
                        className="w-full h-full object-cover"
                        draggable={false}
                    />

                    {/* Gold halo overlay */}
                    <div className="absolute inset-0 rounded-full" style={{
                        background: `linear-gradient(135deg, ${cfg.eyeColor.replace(')', ',0.1)')} 0%, transparent 60%)`,
                    }} />

                    {/* Scan-line overlay */}
                    <div className="scan-line-overlay" />
                </motion.div>

                {/* Orbit particles for thinking */}
                <AnimatePresence>
                    {avatarState === 'thinking' && <OrbitParticles />}
                </AnimatePresence>
            </div>

            {/* Robot Name Plate */}
            <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold hologram-text tracking-wide" style={{ fontFamily: "'Playfair Display', serif" }}>
                        A R I A
                    </h2>
                </div>
                <p className="text-[11px] text-slate-500 uppercase tracking-[0.25em]">AI Concierge • Grand Metropolitan</p>
            </div>

            {/* Status badge */}
            <motion.div
                key={avatarState}
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="flex items-center gap-2.5 px-5 py-2.5 rounded-full glass-gold"
            >
                <motion.div
                    className={`w-2 h-2 rounded-full ${cfg.dotColor}`}
                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                    style={{ boxShadow: `0 0 8px currentColor` }}
                />
                <span className={`text-sm font-medium ${cfg.labelColor}`}>{cfg.label}</span>
            </motion.div>
        </div>
    );
}
