import React from 'react';
import { MapPin, Phone, Instagram, Facebook } from 'lucide-react';
import { useConfig } from '../../context/ConfigContext';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
    const { config } = useConfig();

    if (!config) return null;

    return (
        <footer className="bg-white border-t border-brand-border">
            <div className="container mx-auto px-6 py-16">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                    {/* Brand */}
                    <div className="md:col-span-1">
                        <img
                            src="/logo-public-burger.png"
                            alt={config.restaurantName}
                            className="h-12 w-auto object-contain mb-4"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                if (target.parentElement) {
                                    target.parentElement.innerHTML = `<div class="text-xl font-bold text-brand-dark mb-4">PUBLIC<span class="text-brand-red">BURGER</span></div>`;
                                }
                            }}
                        />
                        <p className="text-brand-muted text-sm leading-relaxed">
                            {config.description}
                        </p>
                    </div>

                    {/* Gusto */}
                    <div>
                        <h4 className="text-xs font-bold tracking-widest uppercase text-brand-dark mb-6">Gusto</h4>
                        <ul className="space-y-3">
                            <li>
                                <Link to="/menu" className="text-sm text-brand-muted hover:text-brand-dark transition-colors">
                                    Menu
                                </Link>
                            </li>
                            <li>
                                <a href="#" className="text-sm text-brand-border cursor-not-allowed">
                                    Specialità del giorno
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-sm text-brand-border cursor-not-allowed">
                                    Allergeni
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Nostro Mondo */}
                    <div>
                        <h4 className="text-xs font-bold tracking-widest uppercase text-brand-dark mb-6">Nostro Mondo</h4>
                        <ul className="space-y-3">
                            <li>
                                <a href="#filosofia" className="text-sm text-brand-muted hover:text-brand-dark transition-colors">
                                    Chi Siamo
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-sm text-brand-border cursor-not-allowed">
                                    Dove Siamo
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-sm text-brand-border cursor-not-allowed">
                                    Press
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Contatti */}
                    <div>
                        <h4 className="text-xs font-bold tracking-widest uppercase text-brand-dark mb-6">Contatti</h4>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-2">
                                <MapPin size={14} className="text-brand-muted mt-0.5 shrink-0" />
                                <span className="text-sm text-brand-muted">{config.location}</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Phone size={14} className="text-brand-muted shrink-0" />
                                <span className="text-sm text-brand-muted">{config.phone}</span>
                            </li>
                        </ul>
                        <div className="flex gap-3 mt-6">
                            {config.socials.instagram && (
                                <a
                                    href={config.socials.instagram}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 border border-brand-border hover:border-brand-dark hover:text-brand-dark text-brand-muted transition-colors"
                                >
                                    <Instagram size={16} />
                                </a>
                            )}
                            {config.socials.facebook && (
                                <a
                                    href={config.socials.facebook}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 border border-brand-border hover:border-brand-dark hover:text-brand-dark text-brand-muted transition-colors"
                                >
                                    <Facebook size={16} />
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="border-t border-brand-border">
                <div className="container mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-brand-muted">
                        © {new Date().getFullYear()} {config.restaurantName}. Tutti i diritti riservati.
                    </p>
                    <div className="flex gap-6">
                        <a href="#" className="text-xs text-brand-muted hover:text-brand-dark transition-colors">Privacy Policy</a>
                        <a href="#" className="text-xs text-brand-muted hover:text-brand-dark transition-colors">Cookie Policy</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};
