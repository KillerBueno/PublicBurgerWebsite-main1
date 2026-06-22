import React, { useEffect, useState, useRef } from 'react';
import { GoogleMap, Marker, InfoWindow, Polyline, TrafficLayer } from '@react-google-maps/api';
import { api } from '../../services/api';
import { Loader2, Bike, RefreshCw, Battery, Gauge, MapPin, Navigation, Zap, Home, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import clsx from 'clsx';
import { useConfig } from '../../context/ConfigContext';

interface RiderLocation {
    id: string;
    name: string;
    surname?: string;
    latitude: number;
    longitude: number;
    updated_at: string;
    speed?: number | null;
    heading?: number | null;
    battery?: number | null;
    assigned_orders?: any[]; // To track distance
}

interface RiderHistory {
    [riderId: string]: { lat: number, lng: number }[];
}

const mapContainerStyle = {
    width: '100%',
    height: '100%',
};

const defaultCenter = {
    lat: 41.902782, // Roma (fallback)
    lng: 12.496366,
};
// Try to center near Isola del Liri if possible, or use user settings
const ISOLA_DEL_LIRI = { lat: 41.678, lng: 13.575 };

export const RiderTracker: React.FC = () => {
    const { config } = useConfig();
    const [riders, setRiders] = useState<RiderLocation[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRider, setSelectedRider] = useState<RiderLocation | null>(null);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [timeAgo, setTimeAgo] = useState<string>('ora');
    const [riderHistory, setRiderHistory] = useState<RiderHistory>({});
    const [showPaths, setShowPaths] = useState(true);
    const [showTraffic, setShowTraffic] = useState(false);
    const [autoFollow, setAutoFollow] = useState(true);
    const mapRef = useRef<google.maps.Map | null>(null);

    // Haversine distance calculation in km
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Rayon de la terre en km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    // Update "time ago" every second
    useEffect(() => {
        const updateTimeAgo = () => {
            const seconds = Math.floor((Date.now() - lastUpdate.getTime()) / 1000);
            if (seconds < 5) setTimeAgo('ora');
            else if (seconds < 60) setTimeAgo(`${seconds}s fa`);
            else setTimeAgo(`${Math.floor(seconds / 60)}m fa`);
        };

        updateTimeAgo();
        const timer = setInterval(updateTimeAgo, 1000);
        return () => clearInterval(timer);
    }, [lastUpdate]);

    // Initial fetch and polling
    useEffect(() => {
        fetchRiders();

        if (!autoRefresh) return;
        const interval = setInterval(fetchRiders, 3000); // 3 seconds live refresh
        return () => clearInterval(interval);
    }, [autoRefresh]);

    const fetchRiders = async () => {
        try {
            const [data, allOrders] = await Promise.all([
                api.getRidersLocations(),
                api.getAdminOrders()
            ]);

            // Combine riders with their assigned orders
            const ridersWithOrders = data.map((rider: RiderLocation) => ({
                ...rider,
                assigned_orders: allOrders.filter((order: any) =>
                    order.assigned_rider_id === rider.id &&
                    (order.status === 'delivering' || order.status === 'delivery' || order.status === 'on_the_way')
                )
            }));

            setRiders(ridersWithOrders);
            setLastUpdate(new Date());

            // Update history for breadcrumbs
            setRiderHistory(prev => {
                const newHistory = { ...prev };
                ridersWithOrders.forEach((r: RiderLocation) => {
                    const currentPath = newHistory[r.id] || [];
                    const lastPoint = currentPath[currentPath.length - 1];

                    if (!lastPoint || calculateDistance(lastPoint.lat, lastPoint.lng, r.latitude, r.longitude) > 0.005) {
                        newHistory[r.id] = [...currentPath, { lat: r.latitude, lng: r.longitude }].slice(-50);
                    }
                });
                return newHistory;
            });

            // Update selected rider position if active
            setSelectedRider(prev => {
                if (!prev) return null;
                const updated = ridersWithOrders.find((r: RiderLocation) => r.id === prev.id);

                // Auto-follow logic
                if (updated && autoFollow && mapRef.current) {
                    mapRef.current.panTo({ lat: updated.latitude, lng: updated.longitude });
                }

                return updated || null;
            });
        } catch (err) {
            console.error("Failed to fetch riders:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleMapLoad = (map: google.maps.Map) => {
        mapRef.current = map;
    };

    const panToRider = (rider: RiderLocation) => {
        setSelectedRider(rider);
        mapRef.current?.panTo({ lat: rider.latitude, lng: rider.longitude });
        mapRef.current?.setZoom(16);
    };

    // Calculate center
    const center = config?.location ? ISOLA_DEL_LIRI : defaultCenter;

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col md:flex-row gap-4 animate-in fade-in">
            {/* Sidebar List */}
            <div className="md:w-80 w-full bg-slate-900 border border-white/10 rounded-xl overflow-hidden flex flex-col shrink-0 h-[300px] md:h-auto">
                <div className="p-4 bg-slate-950 border-b border-white/10 flex justify-between items-center">
                    <div>
                        <h2 className="font-black uppercase italic text-white flex items-center gap-2">
                            <Bike size={20} className="text-brand-yellow" />
                            Rider Attivi
                        </h2>
                        <p className="text-[10px] text-white/40 uppercase font-bold mt-1 flex items-center gap-1">
                            {autoRefresh && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>}
                            Aggiornato {timeAgo}
                        </p>
                    </div>
                    <div className="flex gap-1.5">
                        <button
                            onClick={() => setShowTraffic(!showTraffic)}
                            className={clsx(
                                "p-1.5 rounded-lg transition-colors",
                                showTraffic ? "bg-amber-500/20 text-amber-500" : "bg-white/5 text-white/30"
                            )}
                            title="Traffico"
                        >
                            <Zap size={16} className={clsx(showTraffic ? "fill-current" : "")} />
                        </button>
                        <button
                            onClick={() => setAutoFollow(!autoFollow)}
                            className={clsx(
                                "p-1.5 rounded-lg transition-colors",
                                autoFollow ? "bg-blue-500/20 text-blue-500" : "bg-white/5 text-white/30"
                            )}
                            title="Auto-Follow"
                        >
                            <MapPin size={16} className={clsx(autoFollow ? "fill-current" : "")} />
                        </button>
                        <button
                            onClick={() => setShowPaths(!showPaths)}
                            className={clsx(
                                "p-1.5 rounded-lg transition-colors",
                                showPaths ? "bg-indigo-500/20 text-indigo-500" : "bg-white/5 text-white/30"
                            )}
                            title="Percorsi"
                        >
                            <Navigation size={16} className={clsx(showPaths ? "fill-current" : "")} />
                        </button>
                        <button
                            onClick={() => setAutoRefresh(!autoRefresh)}
                            className={clsx(
                                "p-1.5 rounded-lg transition-colors",
                                autoRefresh ? "bg-green-500/20 text-green-500" : "bg-white/5 text-white/30"
                            )}
                            title="Refresh"
                        >
                            <RefreshCw size={16} className={autoRefresh ? "animate-spin-slow" : ""} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {loading ? (
                        <div className="flex justify-center p-10"><Loader2 className="animate-spin text-white/30" /></div>
                    ) : riders.length === 0 ? (
                        <div className="text-center p-8 text-white/30">
                            <Bike size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="text-xs uppercase font-bold">Nessun rider online</p>
                        </div>
                    ) : (
                        riders.map(rider => (
                            <div
                                key={rider.id}
                                onClick={() => panToRider(rider)}
                                className={clsx(
                                    "p-3 rounded-lg border cursor-pointer transition-all hover:bg-white/5",
                                    selectedRider?.id === rider.id
                                        ? "bg-brand-yellow/10 border-brand-yellow/50 shadow-[0_0_15px_rgba(255,193,7,0.1)]"
                                        : "bg-slate-800/50 border-white/5"
                                )}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-brand-yellow text-black flex items-center justify-center font-black text-xs">
                                            {rider.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white leading-tight">
                                                {rider.name} {rider.surname}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                                <p className="text-[10px] text-white/60 font-mono font-bold whitespace-nowrap">
                                                    {formatDistanceToNow(new Date(rider.updated_at + (rider.updated_at.includes('Z') ? '' : 'Z')), { addSuffix: true, locale: it })}
                                                </p>

                                                <div className="flex items-center gap-1.5">
                                                    <div className="flex items-center gap-0.5 text-[10px] text-white/50 bg-white/5 px-1.5 py-0.5 rounded whitespace-nowrap border border-white/5">
                                                        <Battery size={10} className={clsx(
                                                            !rider.battery ? "text-gray-500" :
                                                                rider.battery < 20 ? "text-red-500" :
                                                                    "text-green-500 fill-green-500/20"
                                                        )} />
                                                        {rider.battery !== null && rider.battery !== undefined
                                                            ? `${Math.round(rider.battery)}%`
                                                            : <span className="text-[8px] uppercase tracking-wider opacity-70">iOS</span>}
                                                    </div>

                                                    <div className="text-[10px] font-black text-brand-yellow flex items-center gap-0.5 bg-brand-yellow/10 px-1.5 py-0.5 rounded whitespace-nowrap border border-brand-yellow/20">
                                                        <Gauge size={10} />
                                                        {Math.round((rider.speed || 0) * 3.6)} <span className="text-[8px] opacity-70 font-normal">km/h</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5">
                                        {(() => {
                                            const diff = Date.now() - new Date(rider.updated_at + (rider.updated_at.includes('Z') ? '' : 'Z')).getTime();
                                            const isStale = diff > 60000; // 1 minute
                                            const isCritical = diff > 300000; // 5 minutes

                                            return (
                                                <div
                                                    className={clsx(
                                                        "w-2.5 h-2.5 rounded-full transition-all duration-500",
                                                        isCritical ? "bg-red-500 shadow-[0_0_8px_#ef4444]" :
                                                            isStale ? "bg-orange-500 shadow-[0_0_8px_#f97316]" :
                                                                "bg-green-500 shadow-[0_0_8px_#22c55e] animate-pulse"
                                                    )}
                                                    title={isStale ? "Rider inattivo" : "Rider attivo"}
                                                />
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Map Area */}
            <div className="flex-1 bg-slate-900 border border-white/10 rounded-xl overflow-hidden relative">
                <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    zoom={14}
                    center={center}
                    onLoad={handleMapLoad}
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
                        mapTypeControl: false,
                        streetViewControl: false
                    }}
                >
                    {showTraffic && <TrafficLayer />}
                    {/* Breadcrumbs (Paths) */}
                    {showPaths && Object.entries(riderHistory).map(([riderId, path]) => (
                        <Polyline
                            key={`path-${riderId}`}
                            path={path}
                            options={{
                                strokeColor: "#3B82F6",
                                strokeOpacity: 0.4,
                                strokeWeight: 4,
                            }}
                        />
                    ))}

                    {riders.map(rider => (
                        <React.Fragment key={`rider-group-${rider.id}`}>
                            <Marker
                                position={{ lat: rider.latitude, lng: rider.longitude }}
                                onClick={() => setSelectedRider(rider)}
                                icon={{
                                    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                                        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24">
                                            <defs>
                                                <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                                                    <feDropShadow dx="0" dy="2" stdDeviation="1" flood-color="#000000" flood-opacity="0.3"/>
                                                </filter>
                                            </defs>
                                            <circle cx="12" cy="12" r="10" fill="#3B82F6" stroke="#ffffff" stroke-width="1.5" filter="url(#shadow)" />
                                            ${rider.heading !== null && rider.heading !== undefined ? `
                                                <path d="M12 2 L15 8 L12 6 L9 8 Z" fill="#ffffff" transform="rotate(${rider.heading}, 12, 12)" />
                                            ` : `
                                                <circle cx="12" cy="12" r="4" fill="#ffffff" />
                                            `}
                                        </svg>
                                    `)}`,
                                    scaledSize: new window.google.maps.Size(40, 40),
                                    anchor: new window.google.maps.Point(20, 20)
                                }}
                            />
                            {/* Order Destinations for this rider */}
                            {rider.assigned_orders?.map((order: any) => (
                                <Marker
                                    key={`order-${order.id}`}
                                    position={{ lat: order.latitude, lng: order.longitude }}
                                    icon={{
                                        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                                                <polyline points="9 22 9 12 15 12 15 22"/>
                                            </svg>
                                        `)}`,
                                        scaledSize: new window.google.maps.Size(32, 32),
                                        anchor: new window.google.maps.Point(16, 16)
                                    }}
                                    title={`Ordine #${order.id}`}
                                />
                            ))}
                        </React.Fragment>
                    ))}

                    {selectedRider && (
                        <InfoWindow
                            position={{ lat: selectedRider.latitude, lng: selectedRider.longitude }}
                            onCloseClick={() => setSelectedRider(null)}
                            options={{
                                pixelOffset: new window.google.maps.Size(0, -20)
                            }}
                        >
                            <div className="p-3 min-w-[200px]">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-black text-sm">
                                        {selectedRider.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm text-gray-900">
                                            {selectedRider.name} {selectedRider.surname}
                                        </h3>
                                        <p className="text-[10px] text-gray-500 font-mono">
                                            {new Date(selectedRider.updated_at + (selectedRider.updated_at.includes('Z') ? '' : 'Z')).toLocaleTimeString('it-IT')}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-1 text-xs text-gray-600 border-t pt-2">
                                    <div className="flex justify-between items-center py-0.5">
                                        <span className="font-semibold flex items-center gap-1"><Battery size={12} /> Batteria:</span>
                                        <span className={clsx("font-mono font-bold",
                                            !selectedRider.battery ? "text-gray-400" :
                                                selectedRider.battery < 20 ? "text-red-500" :
                                                    "text-green-600"
                                        )}>
                                            {selectedRider.battery !== null && selectedRider.battery !== undefined
                                                ? `${Math.round(selectedRider.battery)}%`
                                                : "N/A (iOS)"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-0.5">
                                        <span className="font-semibold flex items-center gap-1"><Gauge size={12} /> Velocità:</span>
                                        <span className="font-mono font-bold text-blue-600">
                                            {Math.round((selectedRider.speed || 0) * 3.6)} km/h
                                        </span>
                                    </div>
                                    {selectedRider.assigned_orders?.[0] && (
                                        <div className="mt-2 pt-2 border-t border-blue-50">
                                            <p className="text-[10px] uppercase font-bold text-blue-500 mb-1">Destinazione Consegna</p>
                                            <div className="flex justify-between items-center py-0.5">
                                                <span className="font-semibold flex items-center gap-1"><Home size={12} /> Distanza:</span>
                                                <span className="font-mono">
                                                    {calculateDistance(
                                                        selectedRider.latitude,
                                                        selectedRider.longitude,
                                                        selectedRider.assigned_orders[0].latitude,
                                                        selectedRider.assigned_orders[0].longitude
                                                    ).toFixed(1)} km
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center py-0.5">
                                                <span className="font-semibold flex items-center gap-1"><Clock size={12} /> Stima (ETA):</span>
                                                <span className="font-bold text-blue-600">
                                                    {(() => {
                                                        const dist = calculateDistance(
                                                            selectedRider.latitude,
                                                            selectedRider.longitude,
                                                            selectedRider.assigned_orders[0].latitude,
                                                            selectedRider.assigned_orders[0].longitude
                                                        );
                                                        // Assume 25km/h average in city for estimate
                                                        const minutes = Math.round((dist / 25) * 60) + 2;
                                                        return minutes < 1 ? "< 1 min" : `${minutes} min`;
                                                    })()}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex justify-between mt-1 pt-1 border-t border-gray-100">
                                        <span className="font-semibold">Lat:</span>
                                        <span className="font-mono">{selectedRider.latitude.toFixed(6)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-semibold">Lng:</span>
                                        <span className="font-mono">{selectedRider.longitude.toFixed(6)}</span>
                                    </div>
                                </div>

                                <a
                                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedRider.latitude},${selectedRider.longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-3 block w-full bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold py-2 px-3 rounded text-center transition-colors"
                                >
                                    Apri in Google Maps
                                </a>
                            </div>
                        </InfoWindow>
                    )}
                </GoogleMap>

                {/* Overlay Status */}
                <div className="absolute top-4 right-4 bg-black/80 backdrop-blur border border-white/10 p-3 rounded-xl flex items-center gap-3">
                    <div className="flex items-center gap-2 mr-2 border-r border-white/10 pr-3">
                        <MapPin size={16} className="text-brand-yellow" />
                        <span className="text-[10px] uppercase font-black text-white">{riders.length} Live</span>
                    </div>
                    <div className="flex -space-x-2">
                        {riders.slice(0, 3).map(r => (
                            <div key={r.id} className="w-8 h-8 rounded-full border-2 border-black bg-brand-yellow flex items-center justify-center text-[10px] font-black text-black">
                                {r.name.charAt(0)}
                            </div>
                        ))}
                        {riders.length > 3 && (
                            <div className="w-8 h-8 rounded-full border-2 border-black bg-white flex items-center justify-center text-[10px] font-black text-black">
                                +{riders.length - 3}
                            </div>
                        )}
                    </div>
                    <div className="text-xs font-bold text-white pr-2">
                        {riders.length} Rider Online
                    </div>
                </div>
            </div>
        </div>
    );
};
