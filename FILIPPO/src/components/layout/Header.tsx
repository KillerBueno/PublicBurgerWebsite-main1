import React, { useState, useEffect } from 'react';
import { ShoppingBag, Menu as MenuIcon, User, X, Home, UtensilsCrossed, Info, MapPin, LogOut, Shield } from 'lucide-react';
import { OpenStatus } from './OpenStatus';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useConfig } from '../../context/ConfigContext';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

export const Header: React.FC = () => {
    const { items, toggleCart } = useCart();
    const { user, logout, loading } = useAuth();
    const { config } = useConfig();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    const isStaff = user && ['staff', 'owner', 'dev', 'rider'].includes(user.role);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const navLinkClass = ({ isActive }: { isActive: boolean }) =>
        clsx(
            "text-sm font-medium transition-colors duration-200 relative py-1",
            isActive
                ? "text-brand-dark after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-brand-red"
                : "text-brand-muted hover:text-brand-dark"
        );

    const closeMenu = () => setIsMenuOpen(false);

    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        };
    }, [isMenuOpen]);

    const mobileMenuLinks = [
        { to: '/', label: 'Home', icon: Home },
        { to: '/menu', label: 'Menu', icon: UtensilsCrossed },
        { to: '#', label: 'Chi Siamo', icon: Info, disabled: true },
        { to: '#', label: 'Dove Siamo', icon: MapPin, disabled: true },
    ];

    if (!config) return null;

    return (
        <>
            <header className={clsx(
                "fixed top-0 left-0 right-0 z-50 bg-white transition-shadow duration-300",
                scrolled ? "shadow-sm border-b border-brand-border" : "border-b border-transparent"
            )}>
                <OpenStatus />
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsMenuOpen(true)}
                            className="md:hidden p-1 text-brand-dark hover:text-brand-red transition-colors cursor-pointer"
                        >
                            <MenuIcon size={22} />
                        </button>

                        <Link to="/" className="flex items-center">
                            <img
                                src="/logo-public-burger.png"
                                alt={config.restaurantName}
                                className="h-12 md:h-14 w-auto object-contain"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    if (target.parentElement) {
                                        target.parentElement.innerHTML = `<div class="text-xl font-bold tracking-tight text-brand-dark">PUBLIC<span class="text-brand-red">BURGER</span></div>`;
                                    }
                                }}
                            />
                        </Link>
                    </div>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-10 text-sm">
                        <NavLink to="/" className={navLinkClass}>Home</NavLink>
                        <NavLink to="/menu" className={navLinkClass}>Menu</NavLink>
                        {isStaff && (
                            <NavLink to="/admin" className={({ isActive }) =>
                                clsx("flex items-center gap-1.5 text-brand-red hover:text-brand-dark transition-colors text-sm font-medium", isActive && "text-brand-dark")
                            }>
                                <Shield size={14} /> Admin
                            </NavLink>
                        )}
                        <a href="#" className="text-brand-border cursor-not-allowed text-sm">Chi Siamo</a>
                        <a href="#" className="text-brand-border cursor-not-allowed text-sm">Dove Siamo</a>
                    </nav>

                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex items-center gap-3">
                            {loading ? (
                                <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse" />
                            ) : user ? (
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => navigate('/profile')}
                                        className="w-9 h-9 rounded-full bg-brand-cream border border-brand-border flex items-center justify-center font-semibold text-brand-dark hover:border-brand-dark transition-colors text-sm cursor-pointer"
                                    >
                                        {user.name.charAt(0).toUpperCase()}
                                    </button>
                                    <button onClick={logout} className="text-xs text-brand-muted hover:text-brand-red transition-colors cursor-pointer">Esci</button>
                                </div>
                            ) : (
                                <Link to="/auth" className="p-1.5 text-brand-muted hover:text-brand-dark transition-colors">
                                    <User size={20} />
                                </Link>
                            )}
                        </div>

                        <div className="md:hidden">
                            {user && (
                                <button
                                    onClick={() => navigate('/profile')}
                                    className="w-8 h-8 rounded-full bg-brand-cream border border-brand-border flex items-center justify-center font-semibold text-brand-dark text-xs cursor-pointer"
                                >
                                    {user.name.charAt(0).toUpperCase()}
                                </button>
                            )}
                        </div>

                        <Link
                            to="/menu"
                            className="hidden md:flex items-center gap-2 bg-brand-dark text-white px-5 py-2.5 text-sm font-semibold hover:bg-brand-red transition-colors duration-200"
                        >
                            Ordina Ora
                        </Link>

                        <button
                            className="relative p-1.5 text-brand-dark hover:text-brand-red transition-colors cursor-pointer"
                            onClick={toggleCart}
                        >
                            <ShoppingBag size={22} />
                            {items.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-brand-red text-white text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center min-w-[18px] min-h-[18px]">
                                    {items.length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeMenu}
                            className="fixed inset-0 bg-black/40 z-[100] md:hidden"
                        />
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 left-0 bottom-0 w-[80%] max-w-xs bg-white border-r border-brand-border z-[101] md:hidden flex flex-col"
                        >
                            <div className="p-6 flex justify-between items-center border-b border-brand-border">
                                <div className="text-lg font-bold text-brand-dark tracking-tight">Menu</div>
                                <button onClick={closeMenu} className="p-1 text-brand-muted hover:text-brand-dark cursor-pointer">
                                    <X size={22} />
                                </button>
                            </div>

                            <nav className="flex-1 p-6 space-y-1">
                                {mobileMenuLinks.map((link) => (
                                    <NavLink
                                        key={link.label}
                                        to={link.to}
                                        onClick={link.disabled ? undefined : closeMenu}
                                        className={({ isActive }) => clsx(
                                            "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors rounded-sm",
                                            (isActive && !link.disabled)
                                                ? "bg-brand-cream text-brand-dark"
                                                : link.disabled
                                                    ? "text-brand-border cursor-not-allowed"
                                                    : "text-brand-muted hover:text-brand-dark hover:bg-brand-cream"
                                        )}
                                    >
                                        <link.icon size={16} />
                                        {link.label}
                                    </NavLink>
                                ))}

                                {isStaff && (
                                    <NavLink
                                        to="/admin"
                                        onClick={closeMenu}
                                        className={({ isActive }) => clsx(
                                            "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors rounded-sm",
                                            isActive
                                                ? "bg-brand-cream text-brand-red"
                                                : "text-brand-red hover:bg-brand-cream"
                                        )}
                                    >
                                        <Shield size={16} />
                                        Area Staff
                                    </NavLink>
                                )}

                                {user ? (
                                    <NavLink
                                        to="/profile"
                                        onClick={closeMenu}
                                        className={({ isActive }) => clsx(
                                            "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors rounded-sm",
                                            isActive ? "bg-brand-cream text-brand-dark" : "text-brand-muted hover:text-brand-dark hover:bg-brand-cream"
                                        )}
                                    >
                                        <User size={16} />
                                        Il Mio Profilo
                                    </NavLink>
                                ) : (
                                    <NavLink
                                        to="/auth"
                                        onClick={closeMenu}
                                        className={({ isActive }) => clsx(
                                            "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors rounded-sm cursor-pointer",
                                            isActive ? "bg-brand-cream text-brand-dark" : "text-brand-muted hover:text-brand-dark hover:bg-brand-cream"
                                        )}
                                    >
                                        <User size={16} />
                                        Accedi / Registrati
                                    </NavLink>
                                )}
                            </nav>

                            <div className="p-6 border-t border-brand-border">
                                {user ? (
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 overflow-hidden pr-4">
                                            <p className="text-brand-dark font-semibold truncate text-sm">{user.name}</p>
                                            <p className="text-brand-muted text-xs truncate">{user.email}</p>
                                        </div>
                                        <button
                                            onClick={() => { closeMenu(); logout(); navigate('/'); }}
                                            className="p-2.5 text-brand-muted hover:text-brand-red transition-colors cursor-pointer"
                                            title="Logout"
                                        >
                                            <LogOut size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <Link
                                        to="/menu"
                                        onClick={closeMenu}
                                        className="block w-full text-center bg-brand-dark text-white py-3 text-sm font-semibold hover:bg-brand-red transition-colors"
                                    >
                                        Ordina Ora
                                    </Link>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};
