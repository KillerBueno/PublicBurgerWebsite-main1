import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Clock, MapPin, Package, CheckCircle2, Loader2, Truck } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { GoogleMap, Marker } from '@react-google-maps/api';

interface OrderItem {
    id: string;
    product_name: string;
    quantity: number;
    price: number;
    options: string; // JSON
}

interface Order {
    id: string;
    total: number;
    status: string;
    delivery_address: string;
    created_at: string;
    note: string | null;
    items?: OrderItem[];
    delivery_method: string | null;
    requested_time: string | null;
    google_maps_link: string | null;
}

export const OrderDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [riderLocation, setRiderLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [canTrack, setCanTrack] = useState(false);
    const [deliveryLocation, setDeliveryLocation] = useState<{ lat: number, lng: number } | null>(null);

    const fetchOrder = async () => {
        try {
            if (!id) return;
            const data = await api.getOrder(id);
            setOrder(data);
        } catch (err: any) {
            console.error('Failed to fetch order:', err);
            setError('Impossibile caricare i dettagli dell\'ordine.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user) {
            navigate('/auth');
            return;
        }
        fetchOrder();
    }, [id, user, navigate]);

    // Polling per posizione rider E stato ordine
    useEffect(() => {
        const fetchUpdates = async () => {
            if (!id) return;

            // 1. Aggiorna stato ordine
            try {
                const refreshedOrder = await api.getOrder(id);
                // Aggiorna solo se lo stato cambia per evitare re-render inutili se identico (React lo gestisce ma meglio essere safe)
                if (refreshedOrder.status !== order?.status) {
                    setOrder(prev => prev ? { ...prev, status: refreshedOrder.status } : refreshedOrder);
                }
            } catch (e) { console.error("Order update error", e); }

            // 2. Aggiorna posizione rider se 'on_the_way'
            if (activeOrderRunning) {
                try {
                    const data = await api.getOrderTracking(id);
                    if (data.tracking && data.location) {
                        setRiderLocation(data.location);
                        setCanTrack(true);
                    } else {
                        setCanTrack(false);
                    }
                } catch (err) {
                    console.error('Tracking error:', err);
                }
            }
        };

        const activeOrderRunning = order?.status === 'on_the_way';

        // Prima esecuzione
        if (activeOrderRunning) fetchUpdates();

        const interval = setInterval(fetchUpdates, 5000); // Più veloce: ogni 5 secondi
        return () => clearInterval(interval);
    }, [id, order?.status]);

    // Geocoding indirizzo consegna
    useEffect(() => {
        if (order?.delivery_address && window.google && !deliveryLocation) {
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ address: order.delivery_address }, (results: any, status: any) => {
                if (status === 'OK' && results && results[0]) {
                    const location = results[0].geometry.location;
                    setDeliveryLocation({ lat: location.lat(), lng: location.lng() });
                }
            });
        }
    }, [order?.delivery_address]);

    // ... (rest of render until Map)

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <Loader2 size={48} className="text-brand-yellow animate-spin" />
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-black p-4 text-center">
                <h2 className="text-2xl font-black uppercase italic mb-4">{error || 'Ordine non trovato'}</h2>
                <button onClick={() => navigate('/profile')} className="btn-primary">Torna al Profilo</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-10 px-4 max-w-3xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="text-white/50 hover:text-white transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="text-3xl font-black uppercase italic tracking-tighter">
                        Ordine <span className="text-brand-yellow">#{order.id.split('-')[0]}</span>
                    </h1>
                    <div className="flex items-center gap-2 text-white/30 text-xs font-bold uppercase tracking-widest">
                        <Clock size={12} />
                        {format(new Date(order.created_at + (order.created_at.includes('Z') ? '' : 'Z')), "d MMMM yyyy 'alle' HH:mm", { locale: it })}
                    </div>
                </div>
            </div>

            {/* Live Tracking Map */}
            {canTrack && riderLocation && (
                <div className="space-y-4 animate-in slide-in-from-bottom duration-700">
                    <h3 className="text-lg font-black uppercase italic flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                        Tracking <span className="text-brand-yellow">Live</span> Rider
                    </h3>
                    <div className="h-[400px] w-full border border-white/10 rounded-xl overflow-hidden shadow-2xl relative">
                        <GoogleMap
                            mapContainerStyle={{ width: '100%', height: '100%' }}
                            center={riderLocation}
                            zoom={16}
                            options={{
                                styles: [
                                    { featureType: "poi", stylers: [{ visibility: "off" }] },
                                    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                                    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                                    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                                    { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
                                    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
                                    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
                                    { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
                                ] as google.maps.MapTypeStyle[],
                                disableDefaultUI: true,
                                zoomControl: true,
                                streetViewControl: false,
                                mapTypeControl: false,
                            }}
                        >
                            {/* Rider Marker (Car) */}
                            <Marker
                                position={riderLocation}
                                icon={{
                                    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                                        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24">
                                            <defs>
                                                <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                                                    <feDropShadow dx="0" dy="2" stdDeviation="1" flood-color="#000000" flood-opacity="0.3"/>
                                                </filter>
                                            </defs>
                                            <circle cx="12" cy="12" r="11" fill="#3B82F6" stroke="#ffffff" stroke-width="1.5" filter="url(#shadow)" />
                                            <g transform="translate(3.5, 3.5) scale(0.7)">
                                                <path fill="#ffffff" d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
                                            </g>
                                        </svg>
                                    `)}`,
                                    scaledSize: new window.google.maps.Size(48, 48),
                                    anchor: new window.google.maps.Point(24, 24)
                                }}
                                zIndex={2}
                            />

                            {/* Delivery Location Marker (Home) */}
                            {deliveryLocation && (
                                <Marker
                                    position={deliveryLocation}
                                    icon={{
                                        url: 'https://cdn-icons-png.flaticon.com/512/1077/1077114.png', // Home/Pin Icon
                                        scaledSize: new window.google.maps.Size(40, 40),
                                        anchor: new window.google.maps.Point(20, 20)
                                    }}
                                    zIndex={1}
                                />
                            )}
                        </GoogleMap>

                        {/* Overlay info */}
                        <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-md p-4 rounded-xl border border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-500/20 rounded-lg">
                                    <Truck size={20} className="text-green-500" />
                                </div>
                                <div>
                                    <p className="text-white text-sm font-bold">Rider in movimento</p>
                                    <p className="text-white/50 text-xs">Aggiornato in tempo reale</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Status Card */}
            <div className="bg-white/5 border border-white/10 p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-yellow blur-[80px] opacity-10"></div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-1">
                        <p className="text-[10px] uppercase font-black text-white/40 tracking-widest ml-1">Stato Attuale</p>
                        <div className="flex items-center gap-3">
                            <div className={clsx(
                                "h-3 w-3 rounded-full animate-pulse",
                                order.status === 'completed' ? "bg-green-500" : "bg-brand-yellow"
                            )}></div>
                            <h2 className="text-2xl font-black uppercase italic">
                                {order.status === 'pending' ? 'Ricevuto' :
                                    order.status === 'confirmed' ? 'Confermato' :
                                        order.status === 'preparing' ? 'In Preparazione' :
                                            order.status === 'on_the_way' ? 'In consegna' :
                                                order.status === 'completed' ? 'Consegnato' : order.status.toUpperCase()}
                            </h2>
                        </div>
                    </div>

                    <div className="text-right flex-1 md:flex-none">
                        <div className="text-3xl font-black italic text-white flex items-baseline justify-end">
                            <span className="text-sm mr-2 text-white/40 not-italic">Totale</span>
                            <span className="text-brand-pink mr-1 text-xl">€</span>
                            {order.total.toFixed(2)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid md:grid-cols-3 gap-8">
                {/* Items List */}
                <div className="md:col-span-2 space-y-4">
                    <h3 className="text-lg font-black uppercase italic flex items-center gap-2">
                        <Package size={20} className="text-brand-blue" />
                        Prodotti
                    </h3>
                    <div className="space-y-4">
                        {order.items?.map((item) => {
                            const options = JSON.parse(item.options || '{}');
                            return (
                                <div key={item.id} className="bg-white/5 border border-white/10 p-4 space-y-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="text-brand-yellow font-black italic mr-2">{item.quantity}x</span>
                                            <span className="font-bold uppercase text-sm tracking-tight">{item.product_name}</span>
                                        </div>
                                        <span className="font-mono text-sm tracking-tighter italic">€ {(item.price * item.quantity).toFixed(2)}</span>
                                    </div>

                                    {(options.aggiunti?.length > 0 || options.rimossi?.length > 0) && (
                                        <div className="pl-6 border-l border-white/10 space-y-1">
                                            {options.aggiunti?.map((opt: string) => (
                                                <p key={opt} className="text-[10px] text-brand-pink uppercase font-bold">+ {opt}</p>
                                            ))}
                                            {options.rimossi?.map((opt: string) => (
                                                <p key={opt} className="text-[10px] text-white/30 uppercase font-bold line-through">- {opt}</p>
                                            ))}
                                        </div>
                                    )}
                                    {options.menu?.bibita && (
                                        <div className="pl-6 border-l border-white/10">
                                            <p className="text-[10px] text-brand-blue uppercase font-bold italic">Menu: {options.menu.bibita}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Delivery Info */}
                <div className="space-y-6">
                    <div className="space-y-4">
                        <h3 className="text-lg font-black uppercase italic flex items-center gap-2">
                            <MapPin size={20} className="text-brand-pink" />
                            {order.delivery_method === 'asporto' ? 'Dettagli Ritiro' : 'Dettagli Consegna'}
                        </h3>
                        <div className="bg-white/5 border border-white/10 p-4 space-y-4">

                            {/* Metodo e Orario */}
                            <div className="grid grid-cols-2 gap-2 pb-4 border-b border-white/5">
                                <div>
                                    <p className="text-[10px] uppercase font-black text-white/40 tracking-widest mb-1">Metodo</p>
                                    <p className="font-bold uppercase italic text-brand-yellow">
                                        {order.delivery_method || (order.delivery_address ? 'Domicilio' : 'Asporto')}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-black text-white/40 tracking-widest mb-1">Orario</p>
                                    <p className="font-mono font-bold">
                                        {order.requested_time || '-'}
                                    </p>
                                </div>
                            </div>

                            {/* Indirizzo e Mappa (Solo Domicilio) */}
                            {order.delivery_method === 'domicilio' && (
                                <div>
                                    <p className="text-[10px] uppercase font-black text-white/40 mb-1 ml-1 tracking-widest">Indirizzo</p>
                                    <p className="text-sm italic text-white/80 leading-relaxed font-medium mb-2">
                                        {order.delivery_address}
                                    </p>
                                    {order.google_maps_link && (
                                        <a
                                            href={order.google_maps_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-[10px] uppercase font-bold text-brand-blue hover:underline"
                                        >
                                            <MapPin size={12} />
                                            Vedi posizione su Maps
                                        </a>
                                    )}
                                </div>
                            )}

                            {order.note && (
                                <div>
                                    <p className="text-[10px] uppercase font-black text-white/40 mb-1 ml-1 tracking-widest">Note</p>
                                    <p className="text-xs italic text-white/50 bg-white/5 p-2 border border-white/5">
                                        "{order.note}"
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-brand-yellow/5 border border-brand-yellow/20 p-6 space-y-4 text-center">
                        <CheckCircle2 size={32} className="mx-auto text-brand-yellow" />
                        <div className="space-y-1">
                            <p className="text-xs font-black uppercase italic tracking-tighter">Hai fame?</p>
                            <p className="text-[10px] text-brand-yellow/60 uppercase font-bold leading-none">Rifallo uguale!</p>
                        </div>
                        <button
                            onClick={() => navigate('/menu')}
                            className="w-full text-[10px] py-3 bg-brand-yellow text-black font-black uppercase italic hover:bg-white transition-colors"
                        >
                            NUOVO ORDINE
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper function to avoid repetition if not globally available
function clsx(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
