import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useConfig } from '../context/ConfigContext';
import { api } from '../services/api';
import { ArrowLeft, MapPin, CreditCard, Banknote, CheckCircle2, ShoppingBag, Loader2, Store, Truck, Clock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleMap, Marker, Autocomplete } from '@react-google-maps/api';


const mapContainerStyle = {
    width: '100%',
    height: '300px',
    borderRadius: '0.5rem',
    marginTop: '1rem'
};

// Coordinate di default (Isola del Liri)
const defaultCenter = {
    lat: 41.678,
    lng: 13.575
};

export const CheckoutPage: React.FC = () => {
    const { items, total, clearCart } = useCart();
    const { user, loading: authLoading } = useAuth();
    const { config } = useConfig();
    const navigate = useNavigate();

    const isLoaded = true; // Caricato globalmente in App.tsx

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [markerPosition, setMarkerPosition] = useState(defaultCenter);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        nome: '',
        telefono: '',
        indirizzo: '',
        note: ''
    });

    const [deliveryMethod, setDeliveryMethod] = useState<'domicilio' | 'asporto'>('asporto');
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [nowKey, setNowKey] = useState(0);

    // Refresh slots every minute
    useEffect(() => {
        const interval = setInterval(() => setNowKey(prev => prev + 1), 60000);
        return () => clearInterval(interval);
    }, []);

    // Generazione orari disponibili
    useEffect(() => {
        if (!config) return;

        const generateSlots = () => {
            const now = new Date();
            const day = now.getDay(); // 0 = Domenica
            const todayConfig = config.openingHours[day as unknown as number];

            if (!todayConfig || todayConfig.length === 0) return [];

            const slots: string[] = ['Appena possibile'];
            const allPossibleSlots: { time: string, sortValue: number }[] = [];

            todayConfig.forEach(slot => {
                const [openHour, openMinute] = slot.open.split(':').map(Number);
                let [closeHour, closeMinute] = slot.close.split(':').map(Number);

                if (closeHour <= openHour) {
                    closeHour += 24;
                }

                let currentSlotTime = new Date();
                currentSlotTime.setHours(openHour, openMinute, 0, 0);

                const endTime = new Date();
                endTime.setHours(closeHour, closeMinute, 0, 0);

                while (currentSlotTime <= endTime) {
                    const h = currentSlotTime.getHours() % 24;
                    const m = currentSlotTime.getMinutes();
                    const timeString = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                    const sortValue = currentSlotTime.getHours() * 60 + currentSlotTime.getMinutes();

                    if (!allPossibleSlots.some(s => s.time === timeString)) {
                        allPossibleSlots.push({ time: timeString, sortValue });
                    }
                    currentSlotTime.setMinutes(currentSlotTime.getMinutes() + 15);
                }
            });

            // Filtra con preavviso ridotto a 20 minuti
            const MARGIN = 20;
            const nowMinutes = now.getHours() * 60 + now.getMinutes();

            const filtered = allPossibleSlots
                .filter(s => s.sortValue > (nowMinutes + MARGIN))
                .map(s => s.time);

            return [...slots, ...filtered];
        };

        const slots = generateSlots();
        setAvailableSlots(slots);

        // Se l'orario selezionato non è più disponibile, resettalo al primo (Appena possibile)
        if (!slots.includes(selectedTime)) {
            setSelectedTime(slots[0] || '');
        }
    }, [config, nowKey]);

    // Update form when user is loaded
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                nome: prev.nome || `${user.name} ${user.surname || ''}`.trim(),
                telefono: prev.telefono || user.phone || ''
            }));
        }
    }, [user]);

    // Handlers Maps
    const onLoadMap = React.useCallback(function callback(map: google.maps.Map) {
        setMap(map);
    }, []);

    const onUnmountMap = React.useCallback(function callback(_map: google.maps.Map) {
        setMap(null);
    }, []);

    const onPlaceChanged = () => {
        if (autocompleteRef.current) {
            const place = autocompleteRef.current.getPlace();
            if (place.geometry && place.geometry.location) {
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                setMarkerPosition({ lat, lng });
                map?.panTo({ lat, lng });
                map?.setZoom(17);
                setFormData(prev => ({ ...prev, indirizzo: place.formatted_address || '' }));
            }
        }
    };

    const onMapClick = async (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            setMarkerPosition({ lat, lng });

            // Reverse Geocoding
            const geocoder = new google.maps.Geocoder();
            try {
                const response = await geocoder.geocode({ location: { lat, lng } });
                if (response.results[0]) {
                    setFormData(prev => ({ ...prev, indirizzo: response.results[0].formatted_address }));
                }
            } catch (error) {
                console.error("Geocoding failed", error);
            }
        }
    };

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [orderId, setOrderId] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        // Validazione base
        if (deliveryMethod === 'domicilio' && !formData.indirizzo.trim()) {
            setError('L\'indirizzo è obbligatorio per la consegna a domicilio.');
            setIsSubmitting(false);
            return;
        }

        try {
            const finalAddress = deliveryMethod === 'domicilio' ? formData.indirizzo : '';

            let googleMapsLink = null;
            if (deliveryMethod === 'domicilio') {
                googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${markerPosition.lat},${markerPosition.lng}`;
            }

            const orderData = {
                userId: user?.id || null,
                items: items.map(item => ({
                    id: item.prodottoId,
                    name: item.nome,
                    price: item.prezzo,
                    quantity: item.quantita,
                    options: {
                        aggiunti: item.ingredientiAggiunti,
                        rimossi: item.ingredientiRimossi,
                        menu: item.isMenu ? { bibita: item.bibitaMenu } : null
                    }
                })),
                total: total,
                address: finalAddress,
                note: formData.note,
                googleMapsLink: googleMapsLink,
                deliveryMethod: deliveryMethod,
                requestedTime: selectedTime,
                customerName: formData.nome,
                customerPhone: formData.telefono,
                latitude: deliveryMethod === 'domicilio' ? markerPosition.lat : null,
                longitude: deliveryMethod === 'domicilio' ? markerPosition.lng : null
            };

            const result = await api.createOrder(orderData);

            if (result.success) {
                clearCart();
                setOrderId(result.orderId);
            } else {
                setError('Errore durante la creazione dell\'ordine.');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Si è verificato un errore durante l\'invio dell\'ordine.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (orderId) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-black">
                <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
                    <div className="relative inline-block">
                        <div className="absolute inset-0 bg-brand-yellow blur-2xl opacity-20 animate-pulse"></div>
                        <CheckCircle2 size={120} className="text-brand-yellow relative z-10" />
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-5xl font-black uppercase italic tracking-tighter text-white">
                            ORDINE <span className="text-brand-pink">RICEVUTO!</span>
                        </h2>
                        <p className="text-white/60 font-medium text-lg leading-tight">
                            Grazie per aver scelto Public Burger.<br />
                            Il tuo ordine è in fase di preparazione.
                        </p>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-6 rounded-none space-y-2 text-left">
                        <p className="text-xs uppercase tracking-widest text-white/40">ID Ordine</p>
                        <p className="font-mono text-brand-blue truncate text-sm">{orderId}</p>
                    </div>

                    <div className="flex flex-col gap-4">
                        <button
                            onClick={() => navigate('/')}
                            className="btn-primary w-full py-5 text-xl flex items-center justify-center gap-3"
                        >
                            <ShoppingBag size={24} />
                            TORNA ALLA HOME
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (authLoading && !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <Loader2 size={48} className="text-brand-yellow animate-spin" />
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-white p-4">
                <h2 className="text-3xl font-black uppercase italic mb-4">Il carrello è vuoto</h2>
                <Link to="/" className="btn-primary">Torna al Menu</Link>
            </div>
        );
    }

    if (!config) return <div className="min-h-screen bg-black" />;

    return (
        <div className="py-12 px-4 max-w-2xl mx-auto min-h-screen text-white">
            <div className="flex items-center gap-4 mb-8">
                <Link to="/" className="text-white/50 hover:text-white transition-colors">
                    <ArrowLeft size={24} />
                </Link>
                <h1 className="text-3xl font-black uppercase italic tracking-tighter">Checkout</h1>
            </div>

            <div className="bg-white/5 p-6 rounded-none border border-white/10 mb-8">
                <h3 className="text-xl font-black uppercase italic mb-4 text-brand-yellow">Riepilogo Ordine</h3>
                <div className="space-y-4 mb-4">
                    {items.map(item => (
                        <div key={item.cartId} className="flex justify-between items-start text-sm">
                            <div>
                                <span className="font-bold">{item.quantita}x {item.nome}</span>
                                {item.ingredientiAggiunti.length > 0 && <p className="text-xs text-white/50">+ {item.ingredientiAggiunti.length} extra</p>}
                            </div>
                            <span>€ {(item.prezzo * item.quantita).toFixed(2)}</span>
                        </div>
                    ))}
                </div>
                <div className="border-t border-white/10 pt-4 flex justify-between items-center text-xl font-black">
                    <span>TOTALE</span>
                    <span>€ {total.toFixed(2)}</span>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">

                {/* Metodo di Consegna */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold uppercase tracking-widest flex items-center gap-2">
                        <Truck size={18} className="text-brand-yellow" />
                        Modalità
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => setDeliveryMethod('asporto')}
                            className={`p-4 border-2 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group ${deliveryMethod === 'asporto'
                                ? 'border-brand-yellow bg-brand-yellow/10 text-brand-yellow'
                                : 'border-white/10 text-white/50 hover:border-white/30 hover:bg-white/5'
                                }`}
                        >
                            <Store size={32} className="mb-1" />
                            <div className="text-center">
                                <span className="block font-black uppercase italic text-lg leading-none">Asporto</span>
                                <span className="text-xs font-medium opacity-70">Vieni a ritirare in sede</span>
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => setDeliveryMethod('domicilio')}
                            className={`p-4 border-2 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group ${deliveryMethod === 'domicilio'
                                ? 'border-brand-yellow bg-brand-yellow/10 text-brand-yellow'
                                : 'border-white/10 text-white/50 hover:border-white/30 hover:bg-white/5'
                                }`}
                        >
                            <Truck size={32} className="mb-1" />
                            <div className="text-center">
                                <span className="block font-black uppercase italic text-lg leading-none">Domicilio</span>
                                <span className="text-xs font-medium opacity-70">Te lo portiamo noi</span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Orario */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold uppercase tracking-widest flex items-center gap-2">
                        <Clock size={18} className="text-brand-pink" />
                        Orario Preferito
                    </h3>
                    {availableSlots.length > 0 ? (
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                            {availableSlots.map(time => (
                                <button
                                    key={time}
                                    type="button"
                                    onClick={() => setSelectedTime(time)}
                                    className={`py-3 px-2 border text-sm font-bold transition-all cursor-pointer ${selectedTime === time
                                        ? 'bg-brand-pink border-brand-pink text-white shadow-[0_0_15px_rgba(237,56,149,0.4)]'
                                        : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    {time}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-bold uppercase italic flex items-center gap-3">
                            <Store size={20} />
                            <div>
                                <p>Siamo chiusi in questo momento.</p>
                                <p className="text-[10px] opacity-70 font-normal">Controlla gli orari di apertura.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Dati Cliente */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold uppercase tracking-widest flex items-center gap-2">
                        <MapPin size={18} className="text-brand-blue" />
                        Dati {deliveryMethod === 'domicilio' ? 'di Consegna' : 'Cliente'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            type="text"
                            placeholder="Nome Completo"
                            required
                            className="bg-transparent border-2 border-white/20 p-3 text-white placeholder-white/40 focus:border-brand-yellow outline-none transition-colors"
                            value={formData.nome}
                            onChange={e => setFormData({ ...formData, nome: e.target.value })}
                        />
                        <input
                            type="tel"
                            placeholder="Telefono"
                            required
                            className="bg-transparent border-2 border-white/20 p-3 text-white placeholder-white/40 focus:border-brand-yellow outline-none transition-colors"
                            value={formData.telefono}
                            onChange={e => setFormData({ ...formData, telefono: e.target.value })}
                        />

                        {deliveryMethod === 'domicilio' && (
                            <div className="md:col-span-2 space-y-2 animate-in fade-in slide-in-from-top-2">
                                {isLoaded ? (
                                    <>
                                        <Autocomplete
                                            onLoad={ref => autocompleteRef.current = ref}
                                            onPlaceChanged={onPlaceChanged}
                                        >
                                            <input
                                                type="text"
                                                placeholder="Cerca il tuo indirizzo..."
                                                required
                                                className="w-full bg-transparent border-2 border-white/20 p-3 text-white placeholder-white/40 focus:border-brand-yellow outline-none transition-colors"
                                                value={formData.indirizzo}
                                                onChange={e => setFormData({ ...formData, indirizzo: e.target.value })}
                                            />
                                        </Autocomplete>

                                        <GoogleMap
                                            mapContainerStyle={mapContainerStyle}
                                            center={markerPosition}
                                            zoom={15}
                                            onLoad={onLoadMap}
                                            onUnmount={onUnmountMap}
                                            onClick={onMapClick}
                                            options={{
                                                streetViewControl: false,
                                                mapTypeControl: false,
                                                styles: [
                                                    { featureType: "poi", stylers: [{ visibility: "off" }] },
                                                    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                                                    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                                                    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                                                    {
                                                        featureType: "administrative.locality",
                                                        elementType: "labels.text.fill",
                                                        stylers: [{ color: "#d59563" }],
                                                    },
                                                    {
                                                        featureType: "poi",
                                                        elementType: "labels.text.fill",
                                                        stylers: [{ color: "#d59563" }],
                                                    },
                                                    {
                                                        featureType: "poi.park",
                                                        elementType: "geometry",
                                                        stylers: [{ color: "#263c3f" }],
                                                    },
                                                    {
                                                        featureType: "poi.park",
                                                        elementType: "labels.text.fill",
                                                        stylers: [{ color: "#6b9a76" }],
                                                    },
                                                    {
                                                        featureType: "road",
                                                        elementType: "geometry",
                                                        stylers: [{ color: "#38414e" }],
                                                    },
                                                    {
                                                        featureType: "road",
                                                        elementType: "geometry.stroke",
                                                        stylers: [{ color: "#212a37" }],
                                                    },
                                                    {
                                                        featureType: "road",
                                                        elementType: "labels.text.fill",
                                                        stylers: [{ color: "#9ca5b3" }],
                                                    },
                                                    {
                                                        featureType: "road.highway",
                                                        elementType: "geometry",
                                                        stylers: [{ color: "#746855" }],
                                                    },
                                                    {
                                                        featureType: "road.highway",
                                                        elementType: "geometry.stroke",
                                                        stylers: [{ color: "#1f2835" }],
                                                    },
                                                    {
                                                        featureType: "road.highway",
                                                        elementType: "labels.text.fill",
                                                        stylers: [{ color: "#f3d19c" }],
                                                    },
                                                    {
                                                        featureType: "transit",
                                                        elementType: "geometry",
                                                        stylers: [{ color: "#2f3948" }],
                                                    },
                                                    {
                                                        featureType: "transit.station",
                                                        elementType: "labels.text.fill",
                                                        stylers: [{ color: "#d59563" }],
                                                    },
                                                    {
                                                        featureType: "water",
                                                        elementType: "geometry",
                                                        stylers: [{ color: "#17263c" }],
                                                    },
                                                    {
                                                        featureType: "water",
                                                        elementType: "labels.text.fill",
                                                        stylers: [{ color: "#515c6d" }],
                                                    },
                                                    {
                                                        featureType: "water",
                                                        elementType: "labels.text.stroke",
                                                        stylers: [{ color: "#17263c" }],
                                                    },
                                                ]
                                            }}
                                        >
                                            <Marker position={markerPosition} />
                                        </GoogleMap>
                                        <p className="text-xs text-white/50 italic mt-2 flex items-center gap-1">
                                            <MapPin size={12} />
                                            Clicca sulla mappa per impostare la posizione precisa
                                        </p>
                                    </>
                                ) : (
                                    <div className="h-[300px] w-full bg-white/5 animate-pulse flex items-center justify-center text-white/30 rounded-lg border border-white/10">
                                        Caricamento mappa...
                                    </div>
                                )}
                            </div>
                        )}

                        <textarea
                            placeholder={deliveryMethod === 'domicilio' ? "Note per il rider (es. Citofono, scala...)" : "Eventuali note aggiuntive..."}
                            className="bg-transparent border-2 border-white/20 p-3 text-white placeholder-white/40 focus:border-brand-yellow outline-none transition-colors md:col-span-2 h-24 resize-none"
                            value={formData.note}
                            onChange={e => setFormData({ ...formData, note: e.target.value })}
                        />
                    </div>
                </div>

                {/* Pagamento */}
                <div className="space-y-4 pt-4 border-t border-white/10">
                    <h3 className="text-lg font-bold uppercase tracking-widest flex items-center gap-2">
                        <CreditCard size={18} className="text-white/60" />
                        Pagamento
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <button type="button" className="p-4 border-2 border-brand-yellow bg-brand-yellow/10 text-brand-yellow flex flex-col items-center gap-2 font-bold uppercase transition-all">
                            <Banknote size={24} />
                            {deliveryMethod === 'domicilio' ? 'Contanti alla consegna' : 'Paga al Ritiro'}
                        </button>
                        <button type="button" disabled className="p-4 border-2 border-white/10 text-white/30 flex flex-col items-center gap-2 font-bold uppercase cursor-not-allowed">
                            <CreditCard size={24} />
                            Carta (Presto)
                        </button>
                    </div>
                </div>

                {error && <div className="p-4 bg-red-500/20 border border-red-500 text-red-100 text-center font-bold">{error}</div>}

                <button
                    type="submit"
                    disabled={isSubmitting || (availableSlots.length === 0)}
                    className="w-full btn-primary py-4 text-xl mt-8 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center"
                >
                    {isSubmitting ? 'Invio ordine...' : 'CONFERMA ORDINE'}
                    {availableSlots.length === 0 && <span className="text-xs font-normal opacity-70 mt-1">(Ristorante Chiuso)</span>}
                </button>
            </form>
        </div>
    );
};
