import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { useConfig } from '../context/ConfigContext';

export const MaintenanceGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { config, loading: configLoading } = useConfig();
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Check if already unlocked in this browser
        const token = localStorage.getItem('site_access_token');
        if (token === 'unlocked_publicburger') {
            setIsUnlocked(true);
        }
    }, []);

    // If config dictates no maintenance mode, we are unlocked by default (unless hard override needed)
    if (!configLoading && config && !config.isMaintenanceMode) {
        return <>{children}</>;
    }

    if (configLoading) {
        return (
            <div className="fixed inset-0 z-[9999] bg-slate-900 flex items-center justify-center">
                <Loader2 className="animate-spin text-brand-yellow" size={40} />
            </div>
        );
    }

    const handleUnlock = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.verifyMaintenancePassword(password);

            // If successful (no error thrown)
            localStorage.setItem('site_access_token', 'unlocked_publicburger');
            setIsUnlocked(true);
            setError(false);
        } catch (err) {
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    if (isUnlocked) {
        return <>{children}</>;
    }

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-900 flex flex-col items-center justify-center p-4">
            <div className="bg-slate-800 p-8 rounded-2xl border border-white/10 shadow-2xl max-w-md w-full text-center">
                <div className="w-20 h-20 bg-brand-yellow rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-brand-yellow/20">
                    <Lock size={40} className="text-black" />
                </div>

                <h1 className="text-2xl font-black text-white mb-2 uppercase tracking-wide">
                    Sito in Manutenzione
                </h1>
                <p className="text-slate-400 mb-8">
                    L'accesso è temporaneamente limitato.
                </p>

                <form onSubmit={handleUnlock} className="space-y-4">
                    <div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Inserisci password"
                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white text-center tracking-widest focus:outline-none focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow transition-all"
                            autoFocus
                        />
                    </div>

                    {error && (
                        <p className="text-red-500 text-sm font-bold animate-pulse">
                            Password errata
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-brand-yellow text-black font-black uppercase py-4 rounded-xl hover:bg-white transition-all transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Verifica...' : (
                            <>
                                <Unlock size={20} />
                                Sblocca Accesso
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};
