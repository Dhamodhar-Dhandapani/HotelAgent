import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { formatTime } from '../utils/helpers';
import { Bot, User } from 'lucide-react';

function TypingIndicator() {
    return (
        <div className="flex items-end gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                    background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(212,168,83,0.1))',
                    border: '1px solid rgba(0,212,255,0.2)',
                }}>
                <Bot size={14} className="text-cyan-400" />
            </div>
            <div className="chat-bubble-ai px-4 py-3 flex gap-1.5 items-center">
                {[0, 0.2, 0.4].map((d, i) => (
                    <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full"
                        style={{ background: i === 1 ? '#d4a853' : '#00d4ff' }}
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 0.9, delay: d, repeat: Infinity }}
                    />
                ))}
            </div>
        </div>
    );
}

export default function ChatWindow({ isTyping }) {
    const { messages, avatarState } = useApp();
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    return (
        <div className="flex flex-col h-full overflow-y-auto px-4 py-4 gap-1.5"
            role="log" aria-label="Conversation history" aria-live="polite">
            <AnimatePresence initial={false}>
                {messages.map((msg, idx) => {
                    const isUser = msg.role === 'user';
                    return (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 14, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.35, ease: 'easeOut' }}
                            className={`flex items-end gap-2.5 mb-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                            {/* Avatar icon */}
                            <div
                                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                                style={isUser
                                    ? {
                                        background: 'linear-gradient(135deg, #1a5276, #0e6b8a)',
                                        border: '1px solid rgba(0,212,255,0.2)',
                                    }
                                    : {
                                        background: 'linear-gradient(135deg, rgba(212,168,83,0.15), rgba(0,212,255,0.08))',
                                        border: '1px solid rgba(212,168,83,0.2)',
                                    }
                                }
                            >
                                {isUser
                                    ? <User size={12} className="text-cyan-300" />
                                    : <Bot size={12} style={{ color: '#d4a853' }} />
                                }
                            </div>

                            <div className={`flex flex-col gap-1 max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
                                {/* Sender label */}
                                {!isUser && (idx === 0 || messages[idx - 1]?.role !== 'assistant') && (
                                    <span className="text-[10px] font-medium px-1 tracking-wide"
                                        style={{ color: '#d4a853' }}>ARIA</span>
                                )}
                                <div className={`px-4 py-2.5 text-sm leading-relaxed ${isUser
                                    ? 'chat-bubble-user text-cyan-50'
                                    : 'chat-bubble-ai text-slate-200'
                                    }`}>
                                    {msg.content}
                                </div>
                                <span className="text-[10px] text-slate-600 px-1">{formatTime(msg.timestamp)}</span>
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>

            <AnimatePresence>
                {(avatarState === 'thinking' || isTyping) && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                    >
                        <TypingIndicator />
                    </motion.div>
                )}
            </AnimatePresence>

            <div ref={bottomRef} />
        </div>
    );
}
