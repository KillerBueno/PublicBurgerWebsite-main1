import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, User, Phone, ArrowRight } from 'lucide-react';

export const AuthPage: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const { login, register, googleLogin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as any)?.from?.pathname || '/';

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        surname: '',
        phone: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Google Identity Services Init
    useEffect(() => {
        // @ts-ignore
        if (window.google) {
            // @ts-ignore
            window.google.accounts.id.initialize({
                client_id: 'TUO_GOOGLE_CLIENT_ID.apps.googleusercontent.com', // User will need to replace this
                callback: handleGoogleCallback
            });
            // @ts-ignore
            window.google.accounts.id.renderButton(
                document.getElementById('googleBtn'),
                { theme: 'outline', size: 'large', width: '100%' }
            );
        }
    }, [isLogin]);

    const handleGoogleCallback = async (response: any) => {
        setLoading(true);
        setError(null);
        try {
            await googleLogin(response.credential);
            navigate(from, { replace: true });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                await login({ email: formData.email, password: formData.password });
            } else {
                await register(formData);
            }
            navigate(from, { replace: true });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 py-20 relative overflow-hidden bg-black">
            {/* Background elements - optimized for performance */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-yellow blur-[60px] md:blur-[150px] opacity-10 -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-pink blur-[60px] md:blur-[150px] opacity-10 translate-y-1/2 -translate-x-1/2"></div>

            <div className="w-full max-w-md space-y-8 relative z-10 transition-all duration-500 animate-in fade-in slide-in-from-bottom-5">
                <div className="text-center space-y-2">
                    <h1 className="text-5xl font-black uppercase italic tracking-tighter text-white">
                        {isLogin ? 'BENTORNATO A' : 'UNISCITI A'} <br />
                        <span className="text-brand-yellow">PUBLIC</span><span className="text-brand-pink">BURGER</span>
                    </h1>
                    <p className="text-white/50 font-medium">
                        {isLogin ? 'Accedi per gestire i tuoi ordini' : 'Crea un account per poter ordinare'}
                    </p>
                </div>

                <div className="bg-white/5 backdrop-blur-md md:backdrop-blur-xl border border-white/10 p-8 rounded-none space-y-6">
                    <div className="flex gap-4 p-1 bg-white/5 rounded-none border border-white/10">
                        <button
                            onClick={() => setIsLogin(true)}
                            className={`flex-1 py-2 font-bold uppercase italic text-sm transition-all cursor-pointer ${isLogin ? 'bg-brand-yellow text-black' : 'text-white/40 hover:text-white'}`}
                        >
                            LOGIN
                        </button>
                        <button
                            onClick={() => setIsLogin(false)}
                            className={`flex-1 py-2 font-bold uppercase italic text-sm transition-all cursor-pointer ${!isLogin ? 'bg-brand-yellow text-black' : 'text-white/40 hover:text-white'}`}
                        >
                            REGISTRATI
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest text-white/40 ml-1">Nome</label>
                                    <div className="relative">
                                        <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                                        <input
                                            type="text"
                                            required
                                            placeholder="Mario"
                                            className="w-full bg-white/5 border border-white/10 p-3 pl-10 text-white placeholder-white/20 outline-none focus:border-brand-yellow transition-colors"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest text-white/40 ml-1">Cognome</label>
                                    <div className="relative">
                                        <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                                        <input
                                            type="text"
                                            required
                                            placeholder="Rossi"
                                            className="w-full bg-white/5 border border-white/10 p-3 pl-10 text-white placeholder-white/20 outline-none focus:border-brand-yellow transition-colors"
                                            value={formData.surname}
                                            onChange={e => setFormData({ ...formData, surname: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {!isLogin && (
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest text-white/40 ml-1">Telefono</label>
                                <div className="relative">
                                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                                    <input
                                        type="tel"
                                        required
                                        placeholder="333 1234567"
                                        className="w-full bg-white/5 border border-white/10 p-3 pl-10 text-white placeholder-white/20 outline-none focus:border-brand-yellow transition-colors"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-white/40 ml-1">Email</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                                <input
                                    type="email"
                                    required
                                    placeholder="mario@esempio.it"
                                    className="w-full bg-white/5 border border-white/10 p-3 pl-10 text-white placeholder-white/20 outline-none focus:border-brand-yellow transition-colors"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-white/40 ml-1">Password</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                                <input
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    className="w-full bg-white/5 border border-white/10 p-3 pl-10 text-white placeholder-white/20 outline-none focus:border-brand-yellow transition-colors"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>

                        {error && (
                            <p className="text-red-500 text-xs font-bold uppercase animate-shake">{error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {loading ? 'ELABORAZIONE...' : (isLogin ? 'ACCEDI' : 'REGISTRATI')}
                            <ArrowRight size={20} />
                        </button>
                    </form>

                    <div className="relative py-4">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                        <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em]"><span className="bg-black/80 px-4 text-white/30 backdrop-blur-sm">Oppure continua con</span></div>
                    </div>

                    <div id="googleBtn" className="w-full overflow-hidden rounded-none grayscale hover:grayscale-0 transition-all"></div>
                </div>

                <p className="text-center text-xs text-white/30">
                    Effettuando l'accesso accetti i nostri <br />
                    <span className="text-white/60 underline cursor-pointer">Termini di Servizio</span> e la <span className="text-white/60 underline cursor-pointer">Privacy Policy</span>
                </p>
            </div>
        </div>
    );
};
