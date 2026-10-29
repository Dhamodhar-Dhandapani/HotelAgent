import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Send, Keyboard, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useVoice } from '../hooks/useVoice';
import AudioWaveform from './AudioWaveform';

export default function VoiceAssistant() {
    const { isListening, transcript, avatarState } = useApp();
    const { startListening, stopListening, sendText } = useVoice();
    const [textMode, setTextMode] = useState(false);
    const [textInput, setTextInput] = useState('');
    const inputRef = useRef(null);

    const handleMicClick = () => {
        if (isListening) stopListening();
        else startListening();
    };

    const handleSend = async () => {
        const msg = textInput.trim();
        if (!msg) return;
        setTextInput('');
        await sendText(msg);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const micActive = isListening;
    const isBusy = avatarState === 'thinking' || avatarState === 'speaking';

    return (
        <div className="flex flex-col items-center gap-3 w-full max-w-sm mx-auto">
            {/* Waveform */}
            <div className="w-full px-4">
                <AudioWaveform />
            </div>

            {/* Transcript */}
            <AnimatePresence>
                {transcript && (
                    <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="w-full px-4 py-2.5 glass-gold rounded-xl text-center text-sm italic"
                        style={{ color: '#00d4ff' }}
                    >
                        "{transcript}"
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Text input mode */}
            <AnimatePresence>
                {textMode && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="w-full overflow-hidden"
                    >
                        <div className="flex items-center gap-2 rounded-2xl px-4 py-2.5"
                            style={{
                                background: 'rgba(17,24,39,0.8)',
                                border: '1px solid rgba(212,168,83,0.15)',
                                backdropFilter: 'blur(20px)',
                            }}>
                            <input
                                ref={inputRef}
                                type="text"
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type your message to ARIA..."
                                className="flex-1 bg-transparent text-sm outline-none"
                                style={{ color: '#e8e2d6', fontFamily: "'Inter', sans-serif" }}
                                aria-label="Type your message"
                            />
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleSend}
                                disabled={!textInput.trim() || isBusy}
                                className="w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-30 transition-all"
                                style={{
                                    background: 'linear-gradient(135deg, #d4a853, #c9973e)',
                                    boxShadow: '0 0 12px rgba(212,168,83,0.3)',
                                }}
                                aria-label="Send message"
                            >
                                <Send size={13} className="text-white" />
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Controls row */}
            <div className="flex items-center gap-5">
                {/* Keyboard toggle */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setTextMode((v) => !v); setTimeout(() => inputRef.current?.focus(), 100); }}
                    className="w-11 h-11 rounded-full flex items-center justify-center transition-all"
                    style={{
                        background: 'rgba(17,24,39,0.8)',
                        border: '1px solid rgba(212,168,83,0.12)',
                        color: textMode ? '#00d4ff' : '#64748b',
                    }}
                    aria-label={textMode ? 'Switch to voice' : 'Switch to keyboard input'}
                >
                    {textMode ? <X size={16} /> : <Keyboard size={16} />}
                </motion.button>

                {/* Main Mic Button */}
                <motion.button
                    whileHover={{ scale: 1.07 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={handleMicClick}
                    disabled={isBusy}
                    className="relative w-[68px] h-[68px] rounded-full flex items-center justify-center disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-transparent"
                    style={{
                        background: micActive
                            ? 'linear-gradient(135deg, #0891b2, #06b6d4)'
                            : 'linear-gradient(135deg, #1a2540, #111827)',
                        boxShadow: micActive
                            ? '0 0 40px rgba(0,212,255,0.5), 0 0 80px rgba(0,212,255,0.2)'
                            : '0 0 20px rgba(212,168,83,0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
                        border: micActive ? '2px solid rgba(0,212,255,0.5)' : '1px solid rgba(212,168,83,0.15)',
                    }}
                    aria-label={micActive ? 'Stop listening' : 'Start listening'}
                    aria-pressed={micActive}
                >
                    {/* Pulse ring when active */}
                    {micActive && (
                        <>
                            <motion.div
                                className="absolute inset-0 rounded-full"
                                style={{ border: '2px solid rgba(0,212,255,0.5)' }}
                                animate={{ scale: [1, 1.8], opacity: [0.8, 0] }}
                                transition={{ duration: 1.4, repeat: Infinity }}
                            />
                            <motion.div
                                className="absolute inset-0 rounded-full"
                                style={{ border: '1px solid rgba(0,212,255,0.3)' }}
                                animate={{ scale: [1, 2.2], opacity: [0.5, 0] }}
                                transition={{ duration: 1.4, delay: 0.3, repeat: Infinity }}
                            />
                        </>
                    )}
                    {micActive
                        ? <MicOff size={24} className="text-white" />
                        : <Mic size={24} style={{ color: '#d4a853' }} />
                    }
                </motion.button>

                {/* Status dot when busy */}
                <div className="w-11 h-11 flex items-center justify-center">
                    {isBusy && (
                        <motion.div
                            className="w-3 h-3 rounded-full"
                            style={{
                                background: '#d4a853',
                                boxShadow: '0 0 10px rgba(212,168,83,0.5)',
                            }}
                            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                        />
                    )}
                </div>
            </div>

            <p className="text-[11px] mt-1" style={{ color: '#4a5568' }}>
                {micActive ? 'Tap to stop listening' : isBusy ? 'ARIA is processing...' : 'Tap the mic to speak with ARIA'}
            </p>
        </div>
    );
}
