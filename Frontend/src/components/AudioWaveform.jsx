import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';

const BAR_COUNT = 28;

export default function AudioWaveform() {
    const { avatarState } = useApp();
    const isActive = avatarState === 'listening' || avatarState === 'speaking';
    const isListening = avatarState === 'listening';

    const bars = useMemo(() =>
        Array.from({ length: BAR_COUNT }).map((_, i) => ({
            id: i,
            delay: (i / BAR_COUNT) * 0.8,
            maxH: 14 + Math.random() * 22,
            rand: Math.random() * 0.5,
        })), []);

    return (
        <div className="flex items-center justify-center gap-[3px]" style={{ height: 44 }}>
            {bars.map((bar, i) => {
                // Gradient from cyan → gold across the bars
                const t = i / (BAR_COUNT - 1);
                const barColor = isActive
                    ? isListening
                        ? `hsl(${185 + t * 30}, 80%, ${55 + t * 15}%)`
                        : `hsl(${270 - t * 40}, ${60 + t * 20}%, ${60 + t * 10}%)`
                    : 'rgba(100,116,139,0.3)';

                return (
                    <motion.div
                        key={bar.id}
                        className="rounded-full"
                        style={{
                            width: 2.5,
                            backgroundColor: barColor,
                            opacity: isActive ? 1 : 0.2,
                        }}
                        animate={
                            isActive
                                ? {
                                    height: [3, bar.maxH + 10, 3, bar.maxH, 3],
                                    opacity: [0.6, 1, 0.6, 1, 0.6],
                                }
                                : { height: 3, opacity: 0.15 }
                        }
                        transition={
                            isActive
                                ? {
                                    duration: 0.7 + bar.rand,
                                    delay: bar.delay,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                }
                                : { duration: 0.4 }
                        }
                    />
                );
            })}
        </div>
    );
}
