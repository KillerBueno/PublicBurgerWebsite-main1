import React, { useEffect, useState, useCallback, useRef } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Bike, Navigation, MapPin, CheckCircle2, Loader2, Package, ArrowRight } from 'lucide-react';
import clsx from 'clsx';


export const RiderScanner: React.FC = () => {
    const { } = useAuth();
    const [assignedOrders, setAssignedOrders] = useState<any[]>([]);
    const [availableOrders, setAvailableOrders] = useState<any[]>([]);
    const [isTracking, setIsTracking] = useState(false);
    const [loading, setLoading] = useState(true);
    const [watchId, setWatchId] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'available' | 'assigned'>('available');

    const fetchOrders = useCallback(async () => {
        try {
            const [assigned, available] = await Promise.all([
                api.getRiderOrders(),
                api.getAvailableOrders()
            ]);
            setAssignedOrders(assigned);
            setAvailableOrders(available);
        } catch (err) {
            console.error('Failed to fetch orders:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 20000);
        return () => clearInterval(interval);
    }, [fetchOrders]);

    // Auto-tracking enforcement
    // Auto-tracking lifecycle
    // Auto-tracking lifecycle
    const [backgroundMode, setBackgroundMode] = useState(false);
    const [activating, setActivating] = useState(false);

    // DEBUG LOGS - Must be at top level
    const [logs, setLogs] = useState<string[]>([]);
    const addLog = (msg: string) => {
        setLogs(prev => [`${new Date().toLocaleTimeString().split(' ')[0]} ${msg}`, ...prev].slice(0, 5));
    };

    // Refs for background tracking
    const geoWatchIdRef = useRef<number | null>(null);
    const wakeLockRef = useRef<any>(null);
    const updateIntervalRef = useRef<number | null>(null);
    const lastPositionRef = useRef<GeolocationPosition | null>(null);

    // Aggressive background tracking activation
    const enableBackgroundTracking = async () => {
        setActivating(true);
        addLog("Activating...");

        try {
            // 1. Request Wake Lock (Android)
            if ('wakeLock' in navigator) {
                try {
                    wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
                    console.log("Wake Lock acquired");
                    addLog("Wake Lock OK");
                } catch (e) {
                    console.warn("Wake Lock failed:", e);
                }
            }

            // 2. Start continuous GPS tracking
            if (!navigator.geolocation) {
                throw new Error("Geolocation not supported");
            }

            console.log("Starting GPS watch...");

            // watchPosition to get updates when position changes
            geoWatchIdRef.current = navigator.geolocation.watchPosition(
                (position) => {
                    lastPositionRef.current = position;
                    console.log("GPS position updated:", position.coords.latitude, position.coords.longitude);
                },
                (err) => {
                    console.error("GPS error:", err);
                    addLog(`GPS Err: ${err.code}`);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 30000,
                    maximumAge: 0
                }
            );


            // Active updates using recursive setTimeout (harder for browsers to throttle)
            const sendLocationUpdate = async () => {
                try {
                    if (!lastPositionRef.current) {
                        // Get current position if we don't have one yet
                        navigator.geolocation.getCurrentPosition(
                            async (position) => {
                                lastPositionRef.current = position;
                                await sendUpdate(position);
                                scheduleNextUpdate();
                            },
                            (err) => {
                                console.error("getCurrentPosition error:", err);
                                addLog(`GPS Err: ${err.code}`);
                                scheduleNextUpdate();
                            },
                            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                        );
                    } else {
                        await sendUpdate(lastPositionRef.current);
                        scheduleNextUpdate();
                    }
                } catch (err) {
                    console.error("Error in sendLocationUpdate:", err);
                    scheduleNextUpdate();
                }
            };

            const scheduleNextUpdate = () => {
                updateIntervalRef.current = setTimeout(sendLocationUpdate, 5000) as unknown as number;
            };

            const sendUpdate = async (position: GeolocationPosition) => {
                const now = Date.now();
                const timeSinceLastUpdate = now - lastLocationTimeRef.current;

                if (timeSinceLastUpdate > 4500) { // Prevent duplicates within 4.5s
                    lastLocationTimeRef.current = now;
                    addLog(`GPS: ${position.coords.latitude.toFixed(4)}`);

                    // Try to get battery level
                    let batteryLevel: number | null = null;
                    try {
                        if ('getBattery' in navigator) {
                            const battery: any = await (navigator as any).getBattery();
                            batteryLevel = battery.level * 100;
                        }
                    } catch (e) { }

                    try {
                        await api.updateRiderLocation({
                            lat: position.coords.latitude,
                            lng: position.coords.longitude,
                            speed: position.coords.speed,
                            heading: position.coords.heading,
                            battery: batteryLevel
                        });
                        addLog("Synced ✓");
                    } catch (err) {
                        console.error("Sync error:", err);
                        addLog("Sync Error");
                    }
                }
            };

            // Start recursive setTimeout loop
            sendLocationUpdate();

            addLog("GPS Active");

            // 3. Setup Media Session (iOS)
            if ('mediaSession' in navigator) {
                try {
                    navigator.mediaSession.metadata = new MediaMetadata({
                        title: 'PublicBurger - Tracking Attivo',
                        artist: 'Rider GPS',
                        album: 'Background Service'
                    });
                } catch (e) {
                    console.warn("Media Session failed:", e);
                }
            }

            setIsTracking(true);
            setBackgroundMode(true);
            addLog("Ready!");
        } catch (e: any) {
            console.error("Activation error:", e);
            addLog(`Error: ${e.message}`);
            alert("Errore attivazione: " + (e.message || "Sconosciuto"));
        } finally {
            setActivating(false);
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            // Clear update timeout
            if (updateIntervalRef.current !== null) {
                clearTimeout(updateIntervalRef.current);
            }

            // Clear geolocation watch
            if (geoWatchIdRef.current !== null) {
                navigator.geolocation.clearWatch(geoWatchIdRef.current);
            }

            // Release wake lock
            if (wakeLockRef.current) {
                wakeLockRef.current.release().catch(() => { });
            }

            // Stop sharing location
            if (watchId !== null) navigator.geolocation.clearWatch(watchId);
            api.stopSharingLocation().catch(console.error);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [backgroundMode, watchId]);

    const lastLocationTimeRef = React.useRef<number>(0);

    const startTracking = () => {
        if (!navigator.geolocation) return;

        // Evita duplicati
        if (isTracking || watchId !== null) return;

        setIsTracking(true);
        const id = navigator.geolocation.watchPosition(
            async (position) => {
                lastLocationTimeRef.current = Date.now();
                try {
                    await api.updateRiderLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                } catch (err) {
                    console.error('Failed to update location:', err);
                }
            },
            (err) => {
                console.error('Geolocation error:', err);
                // Non disattiviamo subito, proviamo col fallback
            },
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
        );
        setWatchId(id);
    };

    // Fallback polling per garantire aggiornamenti in background
    useEffect(() => {
        let interval: any;
        if (isTracking) {
            interval = setInterval(() => {
                const now = Date.now();
                // Se non riceviamo aggiornamenti da > 15 secondi, forziamo un check
                if (now - lastLocationTimeRef.current > 15000) {
                    console.log("Force location update (fallback)");
                    navigator.geolocation.getCurrentPosition(
                        async (position) => {
                            lastLocationTimeRef.current = now;
                            try {
                                await api.updateRiderLocation({
                                    lat: position.coords.latitude,
                                    lng: position.coords.longitude
                                });
                            } catch (err) {
                                console.error('Failed to force update location:', err);
                            }
                        },
                        (err) => console.error("Force update error", err),
                        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                    );
                }
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [isTracking]);



    const claimOrder = async (orderId: string) => {
        try {
            // 1. Avvia tracking immediatamente (dentro evento utente per permessi)
            startTracking();

            // 2. Claim ordine
            await api.claimOrder(orderId);
            fetchOrders();
            setActiveTab('assigned');
        } catch (err: any) {
            alert(err.message || 'Errore nell\'assegnazione dell\'ordine');
        }
    };

    const completeOrder = async (orderId: string) => {
        try {
            await api.updateOrderStatus(orderId, 'completed');
            fetchOrders();
            // Non fermiamo tracking automaticamente, rider potrebbe averne altri o volerne prendere altri
        } catch (err) {
            alert('Errore nel completamento dell\'ordine');
        }
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-400" size={40} /></div>;




    return (
        <div className="max-w-[1200px] mx-auto space-y-8 animate-in fade-in duration-500 pb-20 px-4 md:px-0">

            {/* FORCE USER INTERACTION MODAL */}
            {!backgroundMode && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl max-w-sm w-full text-center space-y-6 shadow-2xl">
                        <div className="w-20 h-20 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mx-auto ring-4 ring-blue-500/20 animate-pulse">
                            <Navigation size={40} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold text-white">Attiva GPS Rider</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Clicca per attivare la modalità Background sicura per iOS/Android.
                            </p>
                        </div>
                        <button
                            onClick={enableBackgroundTracking}
                            disabled={activating}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-3 text-lg"
                        >
                            {activating ? (
                                <>
                                    <Loader2 className="animate-spin" size={24} />
                                    <span>ATTIVAZIONE...</span>
                                </>
                            ) : (
                                <>
                                    <span>ATTIVA ORA</span>
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}


            <div className={clsx(
                "flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 rounded-2xl border transition-all",
                isTracking
                    ? "bg-emerald-500/10 border-emerald-500/20"
                    : "bg-slate-800/50 border-slate-700/50"
            )}>
                <div className="flex items-center gap-4">
                    <div className={clsx(
                        "w-12 h-12 rounded-full flex items-center justify-center",
                        isTracking ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-700/50 text-slate-400"
                    )}>
                        <Navigation size={24} className={isTracking ? "animate-pulse" : ""} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                            GPS: <span className={isTracking ? "text-emerald-400" : "text-slate-400"}>{isTracking ? 'ATTIVO' : 'INATTIVO'}</span>
                            {isTracking && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />}
                        </h2>
                        <div className="flex flex-col gap-1 mt-1">
                            <p className="text-slate-400 text-xs font-medium">
                                Modalità Background ON 🎵
                            </p>
                        </div>
                    </div>
                </div>

                <div>
                    {/* Status Indicator Only */}
                    <div className={clsx(
                        "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 border transition-all",
                        backgroundMode
                            ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                            : "bg-slate-700/30 text-slate-500 border-slate-700/30"
                    )}>
                        {backgroundMode ? (
                            <>
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                </span>
                                BG READY
                            </>
                        ) : (
                            <>
                                <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                                BG OFF
                            </>
                        )}
                    </div>
                    {/* Log Display */}
                    {logs.length > 0 && (
                        <div className="mt-2 text-[10px] font-mono text-slate-500 max-w-[200px] overflow-hidden">
                            {logs.map((log, i) => (
                                <div key={i} className="truncate">{log}</div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-slate-800/50 p-1.5 rounded-xl border border-slate-700/50">
                <button
                    onClick={() => setActiveTab('available')}
                    className={clsx(
                        "flex-1 px-6 py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2",
                        activeTab === 'available'
                            ? "bg-slate-100 text-slate-900 shadow-sm"
                            : "text-slate-400 hover:text-slate-200"
                    )}
                >
                    <Package size={16} />
                    Ordini Disponibili ({availableOrders.length})
                </button>
                <button
                    onClick={() => setActiveTab('assigned')}
                    className={clsx(
                        "flex-1 px-6 py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2",
                        activeTab === 'assigned'
                            ? "bg-slate-100 text-slate-900 shadow-sm"
                            : "text-slate-400 hover:text-slate-200"
                    )}
                >
                    <Bike size={16} />
                    Le Mie Consegne ({assignedOrders.length})
                </button>
            </div>

            {/* Available Orders Tab */}
            {activeTab === 'available' && (
                <div className="space-y-4">
                    {availableOrders.length > 0 ? availableOrders.map(order => (
                        <div key={order.id} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 hover:border-slate-600/50 transition-all">
                            <div className="flex flex-col md:flex-row justify-between gap-6">
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h4 className="text-xl font-bold text-slate-100 capitalize">{order.customer_name}</h4>
                                            <p className="text-sm font-medium text-slate-400">{order.customer_phone}</p>
                                        </div>
                                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs font-bold border border-emerald-500/20">
                                            PRONTO
                                        </span>
                                    </div>

                                    <div className="flex items-start gap-3 p-4 bg-slate-900/50 rounded-xl border border-slate-700/30">
                                        <MapPin size={18} className="text-blue-400 shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-slate-200">{order.delivery_address}</p>
                                            <a
                                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.delivery_address || '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-blue-400 hover:text-blue-300 font-semibold mt-1 inline-block"
                                            >
                                                Apri in Maps →
                                            </a>
                                        </div>
                                    </div>

                                    {order.note && (
                                        <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                                            <p className="text-xs text-amber-300 italic">"{order.note}"</p>
                                        </div>
                                    )}
                                </div>

                                <div className="md:w-48 flex flex-col justify-between gap-4">
                                    <div className="text-right">
                                        <p className="text-xs font-medium text-slate-500">Totale</p>
                                        <p className="text-2xl font-bold text-slate-100">€ {order.total.toFixed(2)}</p>
                                    </div>
                                    <button
                                        onClick={() => claimOrder(order.id)}
                                        className="w-full py-3 bg-slate-100 hover:bg-white text-slate-900 font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-md"
                                    >
                                        Prendi in Carico
                                        <ArrowRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="py-20 text-center bg-slate-800/40 border border-slate-700/50 border-dashed rounded-xl">
                            <Package size={48} className="text-slate-700 mx-auto mb-4" />
                            <p className="text-slate-500 font-medium">Nessun ordine pronto per la consegna</p>
                        </div>
                    )}
                </div>
            )}

            {/* Assigned Orders Tab */}
            {activeTab === 'assigned' && (
                <div className="space-y-4">
                    {assignedOrders.length > 0 ? assignedOrders.map(order => (
                        <div key={order.id} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 hover:border-slate-600/50 transition-all">
                            <div className="flex flex-col md:flex-row justify-between gap-6">
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h4 className="text-xl font-bold text-slate-100 capitalize">{order.customer_name}</h4>
                                            <p className="text-sm font-medium text-slate-400">{order.customer_phone}</p>
                                        </div>
                                        <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-lg text-xs font-bold border border-indigo-500/20">
                                            IN CONSEGNA
                                        </span>
                                    </div>

                                    <div className="flex items-start gap-3 p-4 bg-slate-900/50 rounded-xl border border-slate-700/30">
                                        <MapPin size={18} className="text-blue-400 shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-slate-200">{order.delivery_address}</p>
                                            <a
                                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.delivery_address || '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-blue-400 hover:text-blue-300 font-semibold mt-1 inline-block"
                                            >
                                                Apri in Maps →
                                            </a>
                                        </div>
                                    </div>

                                    {order.note && (
                                        <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                                            <p className="text-xs text-amber-300 italic">"{order.note}"</p>
                                        </div>
                                    )}
                                </div>

                                <div className="md:w-48 flex flex-col justify-between gap-4">
                                    <div className="text-right">
                                        <p className="text-xs font-medium text-slate-500">Totale</p>
                                        <p className="text-2xl font-bold text-slate-100">€ {order.total.toFixed(2)}</p>
                                    </div>
                                    <button
                                        onClick={() => completeOrder(order.id)}
                                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-md"
                                    >
                                        <CheckCircle2 size={18} />
                                        Consegna Completata
                                    </button>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="py-20 text-center bg-slate-800/40 border border-slate-700/50 border-dashed rounded-xl">
                            <Bike size={48} className="text-slate-700 mx-auto mb-4" />
                            <p className="text-slate-500 font-medium">Nessuna consegna assegnata</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
