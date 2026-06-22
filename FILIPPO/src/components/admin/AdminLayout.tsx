import React from 'react';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard,
    ShoppingBag,
    Settings,
    Menu as MenuIcon,
    X,
    TrendingUp,
    ChefHat,
    Bike,
    User as UserIcon,
    Globe,
    Map as MapIcon,
    UtensilsCrossed
} from 'lucide-react';
import clsx from 'clsx';

export const AdminLayout: React.FC = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    // Protection: only staff, rider, owner or dev
    if (!user || (user.role === 'user')) {
        return <Navigate to="/" replace />;
    }

    const navigation = [
        { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, roles: ['owner', 'dev', 'staff'] },
        { name: 'Ordini', href: '/admin/orders', icon: ShoppingBag, roles: ['owner', 'dev', 'staff', 'rider'] },
        { name: 'Menu', href: '/admin/menu', icon: ChefHat, roles: ['owner', 'dev'] },
        { name: 'Statistiche', href: '/admin/stats', icon: TrendingUp, roles: ['owner', 'dev'] },
        { name: 'Rider Maps', href: '/admin/rider', icon: Bike, roles: ['rider', 'dev'] },
        { name: 'Rider Tracker', href: '/admin/tracker', icon: MapIcon, roles: ['owner', 'staff', 'dev'] },
        { name: 'Cucina', href: '/admin/kitchen', icon: UtensilsCrossed, roles: ['owner', 'staff', 'dev'] },
        { name: 'Impostazioni', href: '/admin/settings', icon: Settings, roles: ['owner', 'dev'] },
    ];

    const filteredNav = navigation.filter(item => item.roles.includes(user.role));

    return (
        <div className="min-h-screen bg-neutral-950 text-white flex flex-col md:flex-row relative overflow-x-hidden">
            {/* Background Glow */}
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,242,0,0.05),transparent_50%)] pointer-events-none"></div>

            {/* Sidebar Desktop */}
            <aside className="hidden md:flex flex-col w-72 border-r border-white/5 space-y-8 h-screen sticky top-0 bg-black/40 backdrop-blur-xl z-20">
                <div className="p-8 pb-4">
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="w-12 h-12 bg-brand-yellow flex items-center justify-center text-black font-black italic text-xl shadow-[4px_4px_0px_0px_#ed3895] group-hover:shadow-[2px_2px_0px_0px_#ed3895] transition-all">PB</div>
                        <div>
                            <span className="block font-black uppercase italic tracking-tighter text-2xl leading-none">PUBLIC</span>
                            <span className="block text-[10px] font-bold uppercase tracking-[0.3em] text-brand-yellow">PORTALE STAFF</span>
                        </div>
                    </Link>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    {filteredNav.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={clsx(
                                    "flex items-center gap-3 px-6 py-4 font-black uppercase italic text-sm transition-all relative group",
                                    isActive
                                        ? "text-brand-yellow translate-x-2"
                                        : "text-white/40 hover:text-white hover:translate-x-1"
                                )}
                            >
                                {isActive && <div className="absolute left-0 w-1 h-6 bg-brand-yellow shadow-[0_0_15px_rgba(255,242,0,0.5)]"></div>}
                                <Icon size={20} className={clsx("transition-transform", isActive ? "scale-110" : "group-hover:scale-110")} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-6 border-t border-white/5 bg-black/20">
                    <div className="flex items-center gap-4 mb-6 px-2">
                        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-brand-pink">
                            <UserIcon size={20} />
                        </div>
                        <div className="min-w-0">
                            <p className="font-black italic text-sm truncate uppercase tracking-tighter text-white">{user.name}</p>
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{user.role}</span>
                            </div>
                        </div>
                    </div>
                    <Link
                        to="/"
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-yellow/10 border border-brand-yellow/20 text-brand-yellow font-black uppercase italic text-xs tracking-widest hover:bg-brand-yellow hover:text-black transition-all"
                    >
                        <Globe size={16} />
                        Torna al Sito
                    </Link>
                </div>
            </aside>

            {/* Mobile Header - FIXED */}
            <div className="md:hidden fixed top-0 left-0 w-full flex items-center justify-between p-4 border-b border-white/5 bg-black/90 backdrop-blur-xl z-40 shadow-2xl">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-yellow flex items-center justify-center text-black font-black italic text-sm">PB</div>
                    <span className="font-black uppercase italic tracking-tighter text-lg">Staff Area</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-white/60">
                    {isMobileMenuOpen ? <X size={28} /> : <MenuIcon size={28} />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-50 bg-black/95 backdrop-blur-xl p-8 flex flex-col space-y-12 animate-in fade-in slide-in-from-top duration-300">
                    <div className="flex justify-between items-center">
                        <div className="w-12 h-12 bg-brand-yellow flex items-center justify-center text-black font-black italic text-xl">PB</div>
                        <button onClick={() => setIsMobileMenuOpen(false)} className="text-white/40 hover:text-white"><X size={40} /></button>
                    </div>
                    <nav className="flex-1 space-y-6">
                        {filteredNav.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={clsx(
                                        "flex items-center gap-6 text-3xl font-black uppercase italic tracking-tighter",
                                        isActive ? "text-brand-yellow" : "text-white/40"
                                    )}
                                >
                                    <Icon size={32} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                    <Link
                        to="/"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-4 text-2xl font-black uppercase italic text-brand-yellow"
                    >
                        <Globe size={32} />
                        Torna al Sito
                    </Link>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 p-6 pt-24 md:p-12 md:pt-12 lg:p-16 relative z-10 max-h-screen overflow-y-auto custom-scrollbar overflow-x-hidden">
                <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
