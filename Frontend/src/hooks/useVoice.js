import { useCallback, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { sendMessage as apiSendMessage } from '../services/api';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export function useVoice() {
    const { setAvatarState, addMessage, setTranscript, setListening, setSpeaking, sessionId } = useApp();
    const recognitionRef = useRef(null);
    const synthRef = useRef(window.speechSynthesis);

    const speak = useCallback((text) => {
        synthRef.current.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1;
        utterance.pitch = 1.1;
        utterance.volume = 1;

        // Pick a good female voice if available
        const voices = synthRef.current.getVoices();
        const preferred = voices.find(
            (v) => v.lang.startsWith('en') && v.name.toLowerCase().includes('female')
        ) || voices.find((v) => v.lang.startsWith('en')) || voices[0];
        if (preferred) utterance.voice = preferred;

        utterance.onstart = () => { setAvatarState('speaking'); setSpeaking(true); };
        utterance.onend = () => { setAvatarState('idle'); setSpeaking(false); };
        synthRef.current.speak(utterance);
    }, [setAvatarState, setSpeaking]);

    const stopListening = useCallback(() => {
        recognitionRef.current?.stop();
        setListening(false);
    }, [setListening]);

    const sendText = useCallback(async (text) => {
        addMessage('user', text);
        setAvatarState('thinking');
        setTranscript('');
        try {
            const data = await apiSendMessage(text, sessionId);
            const reply = data.response || data.message || 'I understand. Let me help you with that.';
            addMessage('assistant', reply);
            setAvatarState('speaking');
            speak(reply);
        } catch {
            const fallback = "I'm having trouble connecting right now. Please try again.";
            addMessage('assistant', fallback);
            speak(fallback);
        }
    }, [addMessage, setAvatarState, setTranscript, sessionId, speak]);

    const startListening = useCallback(() => {
        if (!SpeechRecognition) {
            alert('Speech recognition is not supported in this browser. Please use Chrome.');
            return;
        }
        synthRef.current.cancel();
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.lang = 'en-US';
        recognition.interimResults = true;
        recognition.continuous = false;

        recognition.onstart = () => { setAvatarState('listening'); setListening(true); };
        recognition.onresult = (e) => {
            const interim = Array.from(e.results).map((r) => r[0].transcript).join('');
            setTranscript(interim);
        };
        recognition.onend = async () => {
            setListening(false);
            const finalTranscript = recognitionRef.current?._lastTranscript;
            if (finalTranscript?.trim()) {
                await sendText(finalTranscript.trim());
            } else {
                setAvatarState('idle');
            }
        };
        recognition.addEventListener('result', (e) => {
            if (e.results[e.results.length - 1].isFinal) {
                recognitionRef.current._lastTranscript = e.results[e.results.length - 1][0].transcript;
            }
        });
        recognition.onerror = () => { setListening(false); setAvatarState('idle'); };
        recognition.start();
    }, [setAvatarState, setListening, setTranscript, sendText]);

    return { startListening, stopListening, sendText, speak };
}
