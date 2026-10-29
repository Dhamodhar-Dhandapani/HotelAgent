import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { MessageCircle } from 'lucide-react';
import ChatWindow from './ChatWindow';

export default function LeftPanel() {
    const { messages } = useApp();

    return (
        <motion.aside
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="flex flex-col h-full rounded-2xl overflow-hidden"
            style={{
                background: 'linear-gradient(180deg, rgba(10,14,26,0.85) 0%, rgba(17,24,39,0.75) 100%)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(212,168,83,0.1)',
            }}
        >
            {/* Header */}
            <div className="flex items-center gap-2.5 px-5 py-4"
                style={{ borderBottom: '1px solid rgba(212,168,83,0.08)' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(0,212,255,0.1)' }}>
                    <MessageCircle size={13} className="text-cyan-400" />
                </div>
                <h2 className="text-xs font-semibold uppercase tracking-[0.2em]"
                    style={{ color: '#d4a853' }}>
                    Conversation
                </h2>
                <span className="ml-auto text-xs text-slate-600">{messages.length}</span>
            </div>

            {/* Chat scroll area */}
            <div className="flex-1 overflow-hidden">
                <ChatWindow />
            </div>
        </motion.aside>
    );
}
