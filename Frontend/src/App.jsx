import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppProvider } from './context/AppContext';
import TopBar from './components/TopBar';
import LeftPanel from './components/LeftPanel';
import RightPanel from './components/RightPanel';
import AvatarSystem from './components/AvatarSystem';
import VoiceAssistant from './components/VoiceAssistant';
import ModalManager from './components/ModalManager';
import './App.css';

const queryClient = new QueryClient();

// Ambient floating particles — gold & cyan
function AmbientParticles() {
  const particles = useMemo(() =>
    Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      size: Math.random() * 3 + 1,
      left: Math.random() * 100,
      top: Math.random() * 100,
      color: i % 4 === 0
        ? 'rgba(212,168,83,0.5)'
        : i % 4 === 1
          ? 'rgba(0,212,255,0.4)'
          : i % 4 === 2
            ? 'rgba(139,92,246,0.3)'
            : 'rgba(212,168,83,0.3)',
      duration: 6 + Math.random() * 6,
      delay: Math.random() * 4,
      yRange: -40 - Math.random() * 60,
    })), []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.left}%`,
            top: `${p.top}%`,
            background: p.color,
          }}
          animate={{
            y: [0, p.yRange, 0],
            opacity: [0, 0.8, 0],
            scale: [0.5, 1.5, 0.5],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Gold ambient orb */}
      <div className="ambient-orb ambient-orb--gold"
        style={{ top: '15%', left: '25%', width: 500, height: 500 }} />
      {/* Cyan ambient orb */}
      <div className="ambient-orb ambient-orb--cyan"
        style={{ bottom: '10%', right: '20%', width: 450, height: 450 }} />
      {/* Purple ambient orb */}
      <div className="ambient-orb ambient-orb--purple"
        style={{ top: '60%', left: '60%', width: 350, height: 350 }} />
    </div>
  );
}

// Digital rain characters — subtle sci-fi background
function DigitalRain() {
  const chars = useMemo(() =>
    Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      char: ['0', '1', 'Λ', 'Σ', 'Ω', '∞', '⬡', '◇'][Math.floor(Math.random() * 8)],
      left: Math.random() * 100,
      duration: 8 + Math.random() * 12,
      delay: Math.random() * 8,
      size: 8 + Math.random() * 4,
    })), []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {chars.map((c) => (
        <span
          key={c.id}
          className="digital-rain-char"
          style={{
            left: `${c.left}%`,
            fontSize: c.size,
            animationDuration: `${c.duration}s`,
            animationDelay: `${c.delay}s`,
          }}
        >
          {c.char}
        </span>
      ))}
    </div>
  );
}

function AppLayout() {
  return (
    <div className="relative flex flex-col h-screen w-screen overflow-hidden hotel-lobby-bg">
      {/* Background layers */}
      <div className="grid-overlay" />
      <AmbientParticles />
      <DigitalRain />
      <div className="vignette" />

      {/* Top Bar */}
      <TopBar />

      {/* Main Content Area */}
      <main className="flex flex-1 overflow-hidden gap-4 p-4 relative z-10">

        {/* Left Panel - Conversation */}
        <div className="hidden lg:flex w-80 xl:w-[340px] flex-shrink-0 min-h-0">
          <div className="w-full h-full">
            <LeftPanel />
          </div>
        </div>

        {/* Center - Avatar + Voice */}
        <div className="flex-1 flex flex-col items-center justify-between min-w-0 py-2 gap-3">

          {/* Avatar */}
          <div className="flex-1 flex items-center justify-center">
            <AvatarSystem />
          </div>

          {/* Voice Controls */}
          <div className="w-full flex flex-col items-center gap-2 flex-shrink-0">
            <VoiceAssistant />
          </div>

          {/* Mobile Quick Actions */}
          <div className="lg:hidden flex gap-2 flex-wrap justify-center mt-1">
            {['🛏️ Book', '🍽️ Food', '🛎️ Service', 'ℹ️ Info'].map((label) => (
              <button key={label} className="px-3 py-1.5 glass-gold rounded-full text-xs text-champagne/70 hover:text-white transition-colors">
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Right Panel - Quick Actions */}
        <div className="hidden md:flex w-56 xl:w-64 flex-shrink-0 flex-col py-2">
          <RightPanel />
        </div>
      </main>

      {/* Mobile Conversation Sheet */}
      <div className="lg:hidden glass-dark border-t border-gold-warm/10" style={{ height: 150 }}>
        <LeftPanel />
      </div>

      {/* Reception desk glow */}
      <div className="reception-glow" />

      {/* Modal Overlay */}
      <ModalManager />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <AppLayout />
      </AppProvider>
    </QueryClientProvider>
  );
}
