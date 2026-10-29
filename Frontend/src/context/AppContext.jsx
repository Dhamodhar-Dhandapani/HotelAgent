import { createContext, useContext, useReducer, useCallback } from 'react';

const initialState = {
    avatarState: 'idle',
    messages: [
        {
            id: '1',
            role: 'assistant',
            content: "Welcome to Grand Metropolitan. I'm ARIA, your AI concierge. How may I assist you today?",
            timestamp: new Date(),
        },
    ],
    lastResponse: "Welcome to Grand Metropolitan. I'm ARIA, your AI concierge. How may I assist you today?",
    transcript: '',
    isListening: false,
    isSpeaking: false,
    activeModal: null,
    sessionId: `session_${Date.now()}`,
};

function reducer(state, action) {
    switch (action.type) {
        case 'SET_AVATAR_STATE':
            return { ...state, avatarState: action.payload };
        case 'ADD_MESSAGE':
            return {
                ...state,
                messages: [...state.messages, action.payload],
                lastResponse: action.payload.role === 'assistant' ? action.payload.content : state.lastResponse,
            };
        case 'SET_TRANSCRIPT':
            return { ...state, transcript: action.payload };
        case 'SET_LISTENING':
            return { ...state, isListening: action.payload };
        case 'SET_SPEAKING':
            return { ...state, isSpeaking: action.payload };
        case 'OPEN_MODAL':
            return { ...state, activeModal: action.payload };
        case 'CLOSE_MODAL':
            return { ...state, activeModal: null };
        default:
            return state;
    }
}

const AppContext = createContext(null);

export function AppProvider({ children }) {
    const [state, dispatch] = useReducer(reducer, initialState);

    const setAvatarState = useCallback((s) => dispatch({ type: 'SET_AVATAR_STATE', payload: s }), []);

    const addMessage = useCallback((role, content) => {
        dispatch({
            type: 'ADD_MESSAGE',
            payload: { id: `msg_${Date.now()}_${Math.random()}`, role, content, timestamp: new Date() },
        });
    }, []);

    const setTranscript = useCallback((t) => dispatch({ type: 'SET_TRANSCRIPT', payload: t }), []);
    const setListening = useCallback((v) => dispatch({ type: 'SET_LISTENING', payload: v }), []);
    const setSpeaking = useCallback((v) => dispatch({ type: 'SET_SPEAKING', payload: v }), []);
    const openModal = useCallback((m) => dispatch({ type: 'OPEN_MODAL', payload: m }), []);
    const closeModal = useCallback(() => dispatch({ type: 'CLOSE_MODAL' }), []);

    return (
        <AppContext.Provider value={{
            ...state,
            setAvatarState,
            addMessage,
            setTranscript,
            setListening,
            setSpeaking,
            openModal,
            closeModal,
        }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be used inside AppProvider');
    return ctx;
}
