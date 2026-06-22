import React, { useEffect, useState } from 'react';
import { Download, Share, PlusSquare, X } from 'lucide-react';

export const InstallPWA: React.FC = () => {
    const [promptInstall, setPromptInstall] = useState<any>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(isIosDevice);

        // Check if app is already installed (standalone mode)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

        if (isStandalone) {
            return;
        }

        // Android / Desktop Chrome Install Prompt
        const handler = (e: any) => {
            e.preventDefault();
            setPromptInstall(e);
            // Show prompt after a short delay
            setTimeout(() => setIsVisible(true), 3000);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // iOS Instructions (show after delay if not installed)
        if (isIosDevice && !isStandalone) {
            setTimeout(() => setIsVisible(true), 3000);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const onClickInstall = (evt: React.MouseEvent) => {
        evt.preventDefault();
        if (!promptInstall) {
            return;
        }
        promptInstall.prompt();
    };



    return (
        <div className={`fixed bottom-4 left-4 right-4 z-[100] transition-all duration-500 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
            <div className="bg-slate-900/95 backdrop-blur-md border border-brand-yellow/30 p-4 rounded-xl shadow-2xl relative max-w-sm mx-auto">
                <button
                    onClick={() => setIsVisible(false)}
                    className="absolute top-2 right-2 text-white/40 hover:text-white transition-colors"
                >
                    <X size={16} />
                </button>

                <div className="flex gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl shrink-0 overflow-hidden shadow-lg border border-white/10">
                        <img src="/logo-public-512.png" alt="App Icon" className="w-full h-full object-cover" />
                    </div>

                    <div className="flex-1">
                        <h3 className="font-bold text-white text-sm leading-tight mb-1">
                            Installa Public Burger
                        </h3>

                        {isIOS ? (
                            <div className="text-xs text-slate-300 space-y-2 mt-2">
                                <p>Aggiungi alla Home per ordinare velocemente:</p>
                                <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded border border-white/5">
                                    <span className="font-bold text-brand-yellow">1.</span>
                                    <span>Premi</span>
                                    <Share size={14} className="text-blue-400" />
                                    <span>Condividi</span>
                                </div>
                                <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded border border-white/5">
                                    <span className="font-bold text-brand-yellow">2.</span>
                                    <span>Scorri su</span>
                                    <PlusSquare size={14} className="text-white" />
                                    <span>Aggiungi alla Home</span>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-2">
                                <p className="text-xs text-slate-300 mb-3">
                                    Migliore esperienza, ordini veloci e notifiche!
                                </p>
                                <button
                                    onClick={onClickInstall}
                                    className="w-full bg-brand-yellow text-black font-bold text-sm py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-brand-yellow/90 transition-all active:scale-95 shadow-lg shadow-brand-yellow/20"
                                >
                                    <Download size={16} />
                                    Installa App
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
