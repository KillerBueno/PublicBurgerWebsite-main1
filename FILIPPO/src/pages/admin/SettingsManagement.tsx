import React, { useState, useEffect } from 'react';
import { useConfig } from '../../context/ConfigContext';
import { api } from '../../services/api';
import { Save, Loader2, MapPin, Phone, MessageSquare, Instagram, Facebook, Clock, Settings, Lock, Euro } from 'lucide-react';

export const SettingsManagement: React.FC = () => {
    const { config, refreshConfig } = useConfig();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<any>(null);

    useEffect(() => {
        if (config) {
            const initialData = {
                restaurant_name: config.restaurantName,
                phone: config.phone,
                google_maps_api_key: config.googleMapsApiKey,
                location: config.location,
                description: config.description,
                opening_hours: JSON.stringify(config.openingHours, null, 2),
                social_instagram: config.socials.instagram,
                social_facebook: config.socials.facebook,
                is_manual_closed: config.isManualClosed || false,
                is_maintenance_mode: config.isMaintenanceMode || false,
                maintenance_password: '', // Default empty
                addon_price_double: config.addonPriceDouble ?? 3.00,
                addon_price_triple: config.addonPriceTriple ?? 5.00,
                addon_price_menu: config.addonPriceMenu ?? 3.50,
                addon_price_alcohol: config.addonPriceAlcohol ?? 1.00
            };
            setFormData(initialData);

            // Fetch password separately
            api.getMaintenancePassword().then(data => {
                setFormData((prev: any) => ({ ...prev, maintenance_password: data.password }));
            }).catch(console.error);
        }
    }, [config]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData((prev: any) => ({
            ...prev,
            [name]: type === 'checkbox'
                ? (e.target as HTMLInputElement).checked
                : type === 'number'
                    ? parseFloat(value) || 0
                    : value
        }));
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Validazione JSON orari
            try {
                JSON.parse(formData.opening_hours);
            } catch {
                alert("Errore nel formato JSON degli orari di apertura!");
                setLoading(false);
                return;
            }

            await api.updateConfig(formData);
            alert("Impostazioni salvate con successo!");

            // Refresh config after a delay to avoid form reset
            setTimeout(() => {
                refreshConfig();
            }, 500);
        } catch (err) {
            console.error("Failed to update config:", err);
            alert("Errore nel salvataggio!");
        } finally {
            setLoading(false);
        }
    };

    if (!formData) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-yellow" size={40} /></div>;

    return (
        <div className="max-w-4xl space-y-10 animate-in fade-in duration-500 pb-20">
            <div>
                <h1 className="text-4xl font-black uppercase italic tracking-tighter">
                    Impostazioni <span className="text-brand-pink">Sito</span>
                </h1>
                <p className="text-white/40 font-bold uppercase tracking-widest text-xs mt-2">
                    Gestisci le informazioni del locale e i parametri di sistema
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-12">
                {/* Info Principali */}
                <section className="space-y-6">
                    <h3 className="text-xl font-black uppercase italic tracking-tighter border-b border-white/5 pb-2 flex items-center gap-2">
                        <MapPin size={20} className="text-brand-yellow" />
                        Informazioni Base
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-1">Nome Ristorante</label>
                            <input
                                name="restaurant_name"
                                value={formData.restaurant_name}
                                onChange={handleChange}
                                className="w-full bg-white/5 border border-white/10 p-3 outline-none focus:border-brand-yellow transition-all font-bold uppercase italic text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-1">Telefono (WhatsApp)</label>
                            <div className="relative">
                                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                                <input
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full bg-white/5 border border-white/10 p-3 pl-10 outline-none focus:border-brand-yellow transition-all font-bold uppercase italic text-sm"
                                />
                            </div>
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-1">Indirizzo Completo</label>
                            <input
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                className="w-full bg-white/5 border border-white/10 p-3 outline-none focus:border-brand-yellow transition-all font-bold uppercase italic text-sm"
                            />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-1">Descrizione Locale</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={3}
                                className="w-full bg-white/5 border border-white/10 p-3 outline-none focus:border-brand-yellow transition-all font-bold uppercase italic text-sm resize-none"
                            />
                        </div>
                    </div>
                </section>

                {/* API & System */}
                <section className="space-y-6">
                    <h3 className="text-xl font-black uppercase italic tracking-tighter border-b border-white/5 pb-2 flex items-center gap-2">
                        <Settings size={20} className="text-brand-blue" />
                        Sistema & API
                    </h3>
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-1">Google Maps API Key</label>
                        <input
                            name="google_maps_api_key"
                            type="password"
                            value={formData.google_maps_api_key}
                            onChange={handleChange}
                            className="w-full bg-white/5 border border-white/10 p-3 outline-none focus:border-brand-yellow transition-all font-mono text-xs"
                        />
                    </div>
                </section>

                {/* Prezzi Globali */}
                <section className="space-y-6">
                    <h3 className="text-xl font-black uppercase italic tracking-tighter border-b border-white/5 pb-2 flex items-center gap-2">
                        <Euro size={20} className="text-brand-yellow" />
                        Prezzi Globali Menu
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-1">Sovrapprezzo Doppio (€)</label>
                            <input
                                name="addon_price_double"
                                type="number"
                                step="0.50"
                                min="0"
                                value={formData.addon_price_double}
                                onChange={handleChange}
                                className="w-full bg-white/5 border border-white/10 p-3 outline-none focus:border-brand-yellow transition-all font-bold text-brand-yellow text-lg"
                            />
                            <p className="text-[9px] text-white/30 uppercase tracking-wider">Costo aggiuntivo per doppio hamburger</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-1">Sovrapprezzo Triplo (€)</label>
                            <input
                                name="addon_price_triple"
                                type="number"
                                step="0.50"
                                min="0"
                                value={formData.addon_price_triple}
                                onChange={handleChange}
                                className="w-full bg-white/5 border border-white/10 p-3 outline-none focus:border-brand-yellow transition-all font-bold text-brand-yellow text-lg"
                            />
                            <p className="text-[9px] text-white/30 uppercase tracking-wider">Costo aggiuntivo per triplo hamburger</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-1">Prezzo Aggiunta Menu (€)</label>
                            <input
                                name="addon_price_menu"
                                type="number"
                                step="0.50"
                                min="0"
                                value={formData.addon_price_menu}
                                onChange={handleChange}
                                className="w-full bg-white/5 border border-white/10 p-3 outline-none focus:border-brand-yellow transition-all font-bold text-brand-yellow text-lg"
                            />
                            <p className="text-[9px] text-white/30 uppercase tracking-wider">Costo per trasformare in menu (fritti + bibita)</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-1">Supplemento Alcolici (€)</label>
                            <input
                                name="addon_price_alcohol"
                                type="number"
                                step="0.50"
                                min="0"
                                value={formData.addon_price_alcohol}
                                onChange={handleChange}
                                className="w-full bg-white/5 border border-white/10 p-3 outline-none focus:border-brand-yellow transition-all font-bold text-brand-yellow text-lg"
                            />
                            <p className="text-[9px] text-white/30 uppercase tracking-wider">Costo extra per bibita alcolica nel menu</p>
                        </div>
                    </div>
                </section>

                {/* Socials */}
                <section className="space-y-6">
                    <h3 className="text-xl font-black uppercase italic tracking-tighter border-b border-white/5 pb-2 flex items-center gap-2">
                        <MessageSquare size={20} className="text-brand-pink" />
                        Social Link
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-1 flex items-center gap-1">
                                <Instagram size={12} /> Instagram URL
                            </label>
                            <input
                                name="social_instagram"
                                value={formData.social_instagram}
                                onChange={handleChange}
                                className="w-full bg-white/5 border border-white/10 p-3 outline-none focus:border-brand-yellow transition-all text-xs"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-1 flex items-center gap-1">
                                <Facebook size={12} /> Facebook URL
                            </label>
                            <input
                                name="social_facebook"
                                value={formData.social_facebook}
                                onChange={handleChange}
                                className="w-full bg-white/5 border border-white/10 p-3 outline-none focus:border-brand-yellow transition-all text-xs"
                            />
                        </div>
                    </div>
                </section>

                {/* Stato Locale */}
                <section className="space-y-6">
                    <h3 className="text-xl font-black uppercase italic tracking-tighter border-b border-white/5 pb-2 flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full animate-pulse ${formData.is_manual_closed ? 'bg-red-500' : 'bg-green-500'}`}></div>
                        Stato Operativo Locale
                    </h3>

                    <div className={`p-6 border rounded-xl flex items-center justify-between transition-all ${formData.is_manual_closed ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
                        <div>
                            <h4 className={`text-lg font-black uppercase italic ${formData.is_manual_closed ? 'text-red-500' : 'text-green-500'}`}>
                                {formData.is_manual_closed ? 'CHIUSURA FORZATA ATTIVA' : 'OPERATIVO SECONDO ORARI'}
                            </h4>
                            <p className="text-xs text-white/50 mt-1 max-w-md">
                                {formData.is_manual_closed
                                    ? "Il locale risulterà CHIUSO indipendentemente dagli orari. I clienti non potranno ordinare."
                                    : "Il locale seguirà gli orari di apertura configurati qui sotto."}
                            </p>
                        </div>

                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                name="is_manual_closed"
                                checked={formData.is_manual_closed}
                                onChange={handleChange}
                                className="sr-only peer"
                            />
                            <div className="w-14 h-7 bg-green-500/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-green-500 after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-500/20 peer-checked:after:bg-red-500"></div>
                        </label>
                    </div>
                </section>

                {/* Sicurezza (Maintenance) */}
                <section className="space-y-6">
                    <h3 className="text-xl font-black uppercase italic tracking-tighter border-b border-white/5 pb-2 flex items-center gap-2">
                        <Lock size={20} className="text-red-500" />
                        Sicurezza & Accesso
                    </h3>
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-1">Password Modalità Manutenzione</label>
                        <div className="relative">
                            <input
                                name="maintenance_password"
                                type="text"
                                value={formData.maintenance_password || ''}
                                onChange={handleChange}
                                placeholder="admin"
                                className="w-full bg-white/5 border border-white/10 p-3 outline-none focus:border-brand-yellow transition-all font-mono text-sm tracking-widest text-brand-yellow"
                            />
                            <p className="text-[10px] text-white/30 mt-1 uppercase tracking-wider">
                                Usata per accedere al sito quando è bloccato.
                            </p>
                        </div>
                    </div>

                    <div className={`p-6 border rounded-xl flex items-center justify-between transition-all ${formData.is_maintenance_mode ? 'bg-red-500/10 border-red-500/30' : 'bg-white/5 border-white/10'}`}>
                        <div>
                            <h4 className={`text-lg font-black uppercase italic ${formData.is_maintenance_mode ? 'text-red-500' : 'text-white'}`}>
                                {formData.is_maintenance_mode ? 'SITO BLOCCATO (MANUTENZIONE)' : 'SITO ATTIVO'}
                            </h4>
                            <p className="text-xs text-white/50 mt-1 max-w-md">
                                {formData.is_maintenance_mode
                                    ? "Il sito è accessibile SOLO tramite password. I clienti vedranno la schermata di blocco."
                                    : "Il sito è visibile a tutti normalmente."}
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                name="is_maintenance_mode"
                                checked={formData.is_maintenance_mode}
                                onChange={handleChange}
                                className="sr-only peer"
                            />
                            <div className="w-14 h-7 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-500 peer-checked:after:bg-white"></div>
                        </label>
                    </div>
                </section>

                {/* Orari Apertura */}
                <section className="space-y-6">
                    <h3 className="text-xl font-black uppercase italic tracking-tighter border-b border-white/5 pb-2 flex items-center gap-2">
                        <Clock size={20} className="text-white" />
                        Orari di Apertura (JSON Raw)
                    </h3>
                    <div className="space-y-2 text-xs text-white/40 bg-white/5 p-4 border-l-2 border-brand-yellow">
                        <p>Format: "giorno": [&#123;"open": "HH:MM", "close": "HH:MM"&#125;]</p>
                        <p>0=Dom, 1=Lun, 2=Mar, 3=Mer, 4=Gio, 5=Ven, 6=Sab</p>
                    </div>
                    <textarea
                        name="opening_hours"
                        value={formData.opening_hours}
                        onChange={handleChange}
                        rows={10}
                        className="w-full bg-black border border-white/10 p-4 outline-none focus:border-brand-yellow transition-all font-mono text-xs leading-relaxed"
                    />
                </section>

                {/* Floating Save Button */}
                <div className="fixed bottom-10 right-10 z-50">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-brand-yellow text-black px-10 py-5 font-black uppercase italic tracking-tighter flex items-center gap-3 shadow-[10px_10px_0px_rgba(255,193,7,0.2)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                    >
                        {loading ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
                        SALVA TUTTO
                    </button>
                </div>
            </form>
        </div>
    );
};

