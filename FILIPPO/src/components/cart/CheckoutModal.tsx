import React, { useState, useRef, useCallback } from 'react';
import { useCart } from '../../context/CartContext';
import { useConfig } from '../../context/ConfigContext';
import type { DatiUtente } from '../../types';
import { generateWhatsAppLink } from '../../utils/whatsappUtils';
import { X, MapPin, ChevronDown, Clock } from 'lucide-react';
import clsx from 'clsx';
import { GoogleMap, Marker, Autocomplete } from '@react-google-maps/api';
import { useOpeningHours } from '../../hooks/useOpeningHours';

const DEFAULT_MAP_CENTER = { lat: 41.678, lng: 13.575 };

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose }) => {
    const { items, total } = useCart();
    const { validSlots } = useOpeningHours();
    const { config } = useConfig();

    // Blocca scroll quando modale aperto
    React.useEffect(() => {
        if (isOpen) {
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
    }, [isOpen]);

    const [step, setStep] = useState(1);
    const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [markerPos, setMarkerPos] = useState<google.maps.LatLngLiteral | null>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

    const [details, setDetails] = useState<DatiUtente>({
        nome: '',
        cognome: '',
        telefono: '',
        tipoOrdine: 'asporto',
        indirizzo: '',
        linkMappa: '',
        orarioOrdine: '',
        metodoPagamento: 'contanti'
    });

    const handleInputChange = (field: keyof DatiUtente, value: string) => {
        let finalValue = value;
        if (field === 'nome' || field === 'cognome') {
            finalValue = value.replace(/\b\w/g, c => c.toUpperCase());
        }
        setDetails(prev => ({ ...prev, [field]: finalValue }));
    };

    const handleLocateMe = useCallback((mapInstance: google.maps.Map, button: HTMLButtonElement) => {
        if (!navigator.geolocation) {
            alert("Geolocalizzazione non supportata.");
            return;
        }

        button.textContent = "⌛";
        navigator.geolocation.getCurrentPosition(
            (position) => {
                button.textContent = "📍";
                const pos = { lat: position.coords.latitude, lng: position.coords.longitude };

                setMarkerPos(pos);
                mapInstance.panTo(pos);
                mapInstance.setZoom(17);

                const geocoder = new google.maps.Geocoder();
                geocoder.geocode({ location: pos }, (results, status) => {
                    const address = (status === 'OK' && results?.[0])
                        ? results[0].formatted_address
                        : `${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`;

                    setDetails(prev => ({
                        ...prev,
                        indirizzo: address,
                        linkMappa: `https://www.google.com/maps/search/?api=1&query=${pos.lat},${pos.lng}`
                    }));
                });
            },
            () => {
                button.textContent = "❌";
                setTimeout(() => button.textContent = "📍", 2000);
                alert("Impossibile recuperare la posizione.");
            }
        );
    }, []);

    const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
        setMap(mapInstance);
        const controls = mapInstance.controls[google.maps.ControlPosition.RIGHT_BOTTOM];
        if (Array.from(controls.getArray()).some(node => (node as HTMLElement).id === "locate-me-control")) return;

        const button = document.createElement("button");
        button.id = "locate-me-control";
        button.textContent = "📍";
        button.title = "Usa la mia posizione";
        Object.assign(button.style, {
            backgroundColor: "#fff",
            border: "2px solid #fff",
            borderRadius: "0px",
            boxShadow: "4px 4px 0px 0px #ed3895",
            cursor: "pointer",
            margin: "10px 10px 22px 0",
            height: "40px",
            width: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px"
        });

        button.onclick = (e) => {
            e.preventDefault();
            handleLocateMe(mapInstance, button);
        };
        controls.push(button);
    }, [handleLocateMe]);

    const onPlaceChanged = () => {
        const place = autocompleteRef.current?.getPlace();
        if (place?.geometry?.location) {
            const loc = place.geometry.location;
            const pos = { lat: loc.lat(), lng: loc.lng() };
            setMarkerPos(pos);
            map?.panTo(pos);
            map?.setZoom(17);
            setDetails(prev => ({
                ...prev,
                indirizzo: place.formatted_address || '',
                linkMappa: `https://www.google.com/maps/search/?api=1&query=${pos.lat},${pos.lng}`
            }));
        }
    };

    const handleMapClick = (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return;
        const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        setMarkerPos(pos);
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: pos }, (results, status) => {
            const address = (status === 'OK' && results?.[0])
                ? results[0].formatted_address
                : `${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`;
            setDetails(prev => ({
                ...prev,
                indirizzo: address,
                linkMappa: `https://www.google.com/maps/search/?api=1&query=${pos.lat},${pos.lng}`
            }));
        });
    };

    const handleSubmit = () => {
        if (!config) return;
        window.open(generateWhatsAppLink(config.phone, items, total, details), '_blank');
        onClose();
    };

    if (!isOpen || !config) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-zinc-900 rounded-none shadow-2xl p-8 border-2 border-white/10 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 text-white hover:text-brand-pink">
                    <X size={24} />
                </button>

                {step === 1 ? (
                    <div className="space-y-6">
                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Come vuoi l'ordine?</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {(['asporto', 'domicilio'] as const).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => handleInputChange('tipoOrdine', type)}
                                    className={clsx(
                                        "p-6 rounded-none border-2 transition-all flex flex-col items-center gap-2 uppercase font-black tracking-tight",
                                        details.tipoOrdine === type
                                            ? "border-brand-yellow bg-brand-yellow text-black shadow-[4px_4px_0px_0px_#ed3895]"
                                            : "border-white/10 bg-white/5 text-white hover:border-brand-yellow"
                                    )}
                                >
                                    <span className="text-lg">{type === 'asporto' ? 'Asporto' : 'Domicilio'}</span>
                                </button>
                            ))}
                        </div>

                        <div>
                            <label className="block text-xs font-black text-white mb-2 uppercase tracking-widest">Orario Desiderato</label>
                            <button
                                onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
                                className={clsx(
                                    "w-full bg-black/30 border-2 rounded-none px-4 py-4 flex items-center justify-between transition-all font-bold",
                                    isTimeDropdownOpen ? "border-brand-pink text-brand-pink" : "border-white/10 text-white hover:border-brand-pink"
                                )}
                            >
                                <span className={clsx(details.orarioOrdine ? "text-white" : "text-white/50")}>
                                    {details.orarioOrdine || "Seleziona orario..."}
                                </span>
                                <ChevronDown size={20} className={clsx("transition-transform", isTimeDropdownOpen && "rotate-180")} />
                            </button>

                            {isTimeDropdownOpen && (
                                <div className="mt-2 bg-zinc-800 border-2 border-white/10 rounded-none p-3 animate-in fade-in slide-in-from-top-2">
                                    {validSlots.length > 0 ? (
                                        <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                                            {validSlots.map(slot => (
                                                <button
                                                    key={slot.label}
                                                    onClick={() => {
                                                        handleInputChange('orarioOrdine', slot.label);
                                                        setIsTimeDropdownOpen(false);
                                                    }}
                                                    className={clsx(
                                                        "py-3 rounded-none text-xs font-black border-2 flex flex-col items-center justify-center transition-all",
                                                        details.orarioOrdine === slot.label
                                                            ? "bg-brand-pink text-white border-brand-pink shadow-[2px_2px_0px_0px_#fff]"
                                                            : "bg-black/40 text-gray-300 border-white/5 hover:border-brand-pink"
                                                    )}
                                                >
                                                    <span>{slot.label}</span>
                                                    {slot.sortValue >= 1440 && <span className="text-[8px] uppercase opacity-70">Domani</span>}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-red-400 text-sm flex items-center gap-2 font-bold"><Clock size={16} /> Chiuso oggi</div>
                                    )}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setStep(2)}
                            disabled={!details.orarioOrdine}
                            className="w-full btn-primary disabled:opacity-50 disabled:grayscale"
                        >
                            Continua
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">I tuoi dati</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                placeholder="Nome"
                                className="bg-black/30 border-2 border-white/10 rounded-none px-4 py-3 text-white focus:border-brand-yellow outline-none font-bold"
                                value={details.nome}
                                onChange={(e) => handleInputChange('nome', e.target.value)}
                            />
                            <input
                                placeholder="Cognome"
                                className="bg-black/30 border-2 border-white/10 rounded-none px-4 py-3 text-white focus:border-brand-yellow outline-none font-bold"
                                value={details.cognome}
                                onChange={(e) => handleInputChange('cognome', e.target.value)}
                            />
                        </div>
                        <input
                            placeholder="Telefono"
                            className="w-full bg-black/30 border-2 border-white/10 rounded-none px-4 py-3 text-white focus:border-brand-yellow outline-none font-bold"
                            value={details.telefono}
                            onChange={(e) => handleInputChange('telefono', e.target.value)}
                        />

                        {details.tipoOrdine === 'domicilio' && (
                            <div className="space-y-4 p-4 bg-white/5 rounded-none border-2 border-brand-blue">
                                <div className="flex items-center gap-2 text-brand-blue mb-2">
                                    <MapPin size={18} />
                                    <span className="font-black uppercase italic tracking-tighter">Indirizzo Consegna</span>
                                </div>

                                {config.googleMapsApiKey ? (
                                    <>
                                        <Autocomplete onLoad={ref => autocompleteRef.current = ref} onPlaceChanged={onPlaceChanged}>
                                            <input
                                                placeholder="Cerca il tuo indirizzo..."
                                                className="w-full bg-black/80 border-2 border-white/30 rounded-none px-4 py-3 text-white focus:border-brand-blue shadow-lg font-bold"
                                                value={details.indirizzo}
                                                onChange={(e) => handleInputChange('indirizzo', e.target.value)}
                                            />
                                        </Autocomplete>
                                        <div className="h-64 mt-2 rounded-none overflow-hidden border-2 border-white/10">
                                            <GoogleMap
                                                mapContainerStyle={{ width: '100%', height: '100%' }}
                                                center={DEFAULT_MAP_CENTER}
                                                zoom={15}
                                                onLoad={onMapLoad}
                                                onClick={handleMapClick}
                                                options={{ streetViewControl: false, mapTypeControl: false }}
                                            >
                                                {markerPos && <Marker position={markerPos} />}
                                            </GoogleMap>
                                        </div>
                                    </>
                                ) : (
                                    <input
                                        placeholder="Via, Civico, Città"
                                        className="w-full bg-black/30 border-2 border-white/10 rounded-none px-4 py-3 text-white font-bold"
                                        value={details.indirizzo}
                                        onChange={(e) => handleInputChange('indirizzo', e.target.value)}
                                    />
                                )}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-black text-white/50 uppercase tracking-widest pl-1">Metodo di Pagamento</label>
                            <select
                                className="w-full bg-black/30 border-2 border-white/10 rounded-none px-4 py-3 text-white font-bold outline-none focus:border-brand-yellow appearance-none"
                                value={details.metodoPagamento}
                                onChange={(e) => handleInputChange('metodoPagamento', e.target.value as any)}
                            >
                                <option value="contanti">Contanti alla consegna</option>
                                <option value="carta">POS/Carta</option>
                            </select>
                        </div>

                        <div className="flex gap-4 mt-8">
                            <button onClick={() => setStep(1)} className="px-6 py-3 border-2 border-white/10 text-white font-black uppercase italic tracking-tighter hover:bg-white/5">Indietro</button>
                            <button
                                onClick={handleSubmit}
                                disabled={!details.nome || !details.telefono || (details.tipoOrdine === 'domicilio' && !details.indirizzo)}
                                className="flex-1 btn-primary disabled:opacity-50 disabled:grayscale"
                            >
                                Conferma su WhatsApp
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
