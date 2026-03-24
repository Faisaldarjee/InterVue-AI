import { useEffect, useState } from 'react';
import { setCurrentUser } from '../utils/historyManager';
import { supabase, signOut, onAuthStateChange } from '../utils/supabaseClient';

export default function useIntervueAuth({ onSignedOut }) {
    const [session, setSession] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authMessage, setAuthMessage] = useState('');

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
            setSession(currentSession);
            if (currentSession?.user?.id) setCurrentUser(currentSession.user.id);
            setAuthLoading(false);
        });

        const { data: { subscription } } = onAuthStateChange((event, nextSession) => {
            setSession(nextSession);
            if (nextSession?.user?.id) setCurrentUser(nextSession.user.id);
            if (event === 'SIGNED_OUT') {
                setCurrentUser(null);
                onSignedOut?.();
            }
        });

        return () => subscription.unsubscribe();
    }, [onSignedOut]);

    useEffect(() => {
        const handleRequireAuth = (e) => {
            const message = e?.detail?.message;
            if (!session) {
                setAuthMessage(message || 'Please log in to continue.');
                setShowAuthModal(true);
            } else {
                window.dispatchEvent(new CustomEvent('auth-success'));
            }
        };

        window.addEventListener('require-auth', handleRequireAuth);
        return () => window.removeEventListener('require-auth', handleRequireAuth);
    }, [session]);

    const requireAuth = (message) => {
        if (!session) {
            setAuthMessage(message);
            setShowAuthModal(true);
            return false;
        }
        return true;
    };

    const openAuthModal = (message = 'Welcome to InterVue AI') => {
        setAuthMessage(message);
        setShowAuthModal(true);
    };

    const closeAuthModal = () => setShowAuthModal(false);

    const handleAuthSuccess = (nextSession) => {
        setSession(nextSession);
        setShowAuthModal(false);
    };

    const handleLogout = async () => {
        await signOut();
        setSession(null);
        onSignedOut?.();
    };

    return {
        session,
        authLoading,
        showAuthModal,
        authMessage,
        requireAuth,
        openAuthModal,
        closeAuthModal,
        handleAuthSuccess,
        handleLogout,
    };
}
