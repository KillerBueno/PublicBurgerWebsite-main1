import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../../services/api';
import { useConfig } from '../../context/ConfigContext';
import { MapPin, ChefHat, Timer, CheckCircle2, Flame, Navigation, AlertCircle, Bike, RefreshCw, Maximize2, Minimize2, Clock } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';
// Removed unused 'it' locale

declare global {
    interface Window {
        google: any;
    }
}

// Interface update to match API response
interface OrderItem {
    id: string;
    product_id?: string;
    name?: string;
    product_name?: string;
    quantity: number;
    ingredients?: string[];
    removed_ingredients?: string[];
    options?: string;
}

interface Order {
    id: string;
    customer_name: string;
    customer_phone: string;
    delivery_address: string;
    delivery_method: string;
    created_at: string;
    updated_at?: string;
    status: string;
    total: number;
    items: OrderItem[];
    order_items?: OrderItem[]; // Support DB property
    notes?: string;
    note?: string;
    requested_time?: string;
}

export const KitchenDisplay: React.FC = () => {
    const { config } = useConfig();
    const [orders, setOrders] = useState<Order[]>([]);
    const [menuItems, setMenuItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [travelTimes, setTravelTimes] = useState<Record<string, string>>({});
    const [filterType, setFilterType] = useState<'all' | 'domicilio' | 'asporto'>('all');

    // Fallback location if config is missing
    const RESTAURANT_LOCATION = config?.location || "Via Lungoliri Pirandello, 03036 Isola del Liri FR";

    // === NEW: Additional state for improvements ===
    const [now, setNow] = useState(Date.now());
    const [refreshing, setRefreshing] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const prevOrderIdsRef = useRef<Set<string>>(new Set());

    // Live timer - updates every second
    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Fullscreen change listener
    useEffect(() => {
        const handler = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    // Toggle body class for fullscreen mode (hides sidebar)
    useEffect(() => {
        if (isFullscreen) {
            document.body.classList.add('kitchen-fullscreen');
        } else {
            document.body.classList.remove('kitchen-fullscreen');
        }
        return () => document.body.classList.remove('kitchen-fullscreen');
    }, [isFullscreen]);

    // New order sound using Web Audio API
    const playNewOrderSound = useCallback(() => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const playBeep = (delay: number, freq: number) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = freq;
                osc.type = 'square';
                gain.gain.value = 0.25;
                osc.start(ctx.currentTime + delay);
                osc.stop(ctx.currentTime + delay + 0.15);
            };
            playBeep(0, 880);
            playBeep(0.25, 1100);
        } catch (e) {
            console.warn('Could not play sound', e);
        }
    }, []);

    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => { });
        } else {
            document.exitFullscreen().catch(() => { });
        }
    }, []);

    // Helper to get sorting weight for an order
    const getOrderWeight = (o: Order) => {
        const timeStr = o.requested_time ? o.requested_time.toLowerCase() : '';

        // Priority 1: "Appena possibile" or empty (assumed urgent)
        if (!timeStr || timeStr.includes('appena') || timeStr.includes('asap')) {
            return -1; // Highest priority
        }

        // Priority 2: Specific Time (HH:mm)
        // Convert to minutes from midnight for easy comparison
        const match = timeStr.match(/(\d{1,2})[:.](\d{2})/);
        if (match) {
            const h = parseInt(match[1]);
            const m = parseInt(match[2]);
            return h * 60 + m;
        }

        return 9999; // Fallback for unmatched formats (bottom of list)
    };

    const sortOrders = (ordersList: Order[]) => {
        return [...ordersList].sort((a, b) => {
            const weightA = getOrderWeight(a);
            const weightB = getOrderWeight(b);

            if (weightA !== weightB) {
                return weightA - weightB;
            }

            // Secondary Sort: Delivery > Takeaway
            // If timestamps match, prioritizing delivery ensures travel time is accounted for
            if (a.delivery_method === 'domicilio' && b.delivery_method !== 'domicilio') return -1;
            if (b.delivery_method === 'domicilio' && a.delivery_method !== 'domicilio') return 1;

            // Tertiary Sort: Creation time (Oldest first)
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });
    };

    const fetchData = async () => {
        try {
            const [ordersData, menuData] = await Promise.all([
                api.getAdminOrders(),
                api.getMenu()
            ]);

            const activeOrdersRaw = ordersData.filter((o: Order) =>
                ['confirmed', 'preparing'].includes(o.status)
            );

            const detailedOrders = await Promise.all(activeOrdersRaw.map(async (o: Order) => {
                if ((o.items && o.items.length > 0) || (o.order_items && o.order_items.length > 0)) {
                    return o;
                }
                try {
                    const details = await api.getOrder(o.id);
                    return details || o;
                } catch (err) {
                    console.warn(`Could not fetch details for order ${o.id}`, err);
                    return o;
                }
            }));

            const categories = menuData?.categories || [];
            const allProducts = categories.flatMap((cat: any) =>
                (cat.items || []).map((p: any) => ({ ...p, category: cat.name, categoryId: cat.id }))
            );
            setMenuItems(allProducts);

            // Initialize order IDs ref (no sound on first load)
            prevOrderIdsRef.current = new Set(detailedOrders.map((o: Order) => o.id));
            setOrders(detailedOrders);
        } catch (error) {
            console.error("Failed to fetch kitchen data:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchOrdersOnly = async () => {
        try {
            const allOrders = await api.getAdminOrders();
            const activeOrdersRaw = allOrders.filter((o: Order) =>
                ['confirmed', 'preparing'].includes(o.status)
            );

            const detailedOrders = await Promise.all(activeOrdersRaw.map(async (o: Order) => {
                if ((o.items && o.items.length > 0) || (o.order_items && o.order_items.length > 0)) {
                    return o;
                }
                try {
                    const details = await api.getOrder(o.id);
                    return details || o;
                } catch (err) {
                    console.warn(`Could not fetch details for order ${o.id}`, err);
                    return o;
                }
            }));

            // Detect new orders and play sound
            const currentIds = new Set(detailedOrders.map((o: Order) => o.id));
            const hasNew = detailedOrders.some((o: Order) => !prevOrderIdsRef.current.has(o.id));
            if (hasNew && prevOrderIdsRef.current.size > 0) {
                playNewOrderSound();
            }
            prevOrderIdsRef.current = currentIds;

            setOrders(detailedOrders);
        } catch (error) {
            console.error("Failed to update orders:", error);
        }
    };

    const handleManualRefresh = async () => {
        setRefreshing(true);
        await fetchOrdersOnly();
        setRefreshing(false);
    };

    const calculateTravelTimes = async (ordersList: Order[]) => {
        const apiKey = config?.googleMapsApiKey;
        if (!apiKey) return;

        const deliveryOrders = ordersList.filter(o => o.delivery_method === 'domicilio' && o.delivery_address);
        if (deliveryOrders.length === 0) return;

        const newTimes: Record<string, string> = {};

        // Use Routes API (computeRoutes) for each delivery order
        await Promise.all(deliveryOrders.map(async (order) => {
            try {
                const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Goog-Api-Key': apiKey,
                        'X-Goog-FieldMask': 'routes.duration',
                    },
                    body: JSON.stringify({
                        origin: { address: RESTAURANT_LOCATION },
                        destination: { address: order.delivery_address },
                        travelMode: 'DRIVE',
                        routingPreference: 'TRAFFIC_AWARE',
                    }),
                });

                if (!res.ok) return;
                const data = await res.json();

                if (data.routes && data.routes.length > 0) {
                    const durationSeconds = parseInt(data.routes[0].duration.replace('s', ''));
                    const mins = Math.round(durationSeconds / 60);
                    newTimes[order.id] = mins < 60
                        ? `${mins} min`
                        : `${Math.floor(mins / 60)}h ${mins % 60} min`;
                }
            } catch (err) {
                console.warn(`Travel time calc failed for order ${order.id}`, err);
            }
        }));

        if (Object.keys(newTimes).length > 0) {
            setTravelTimes(prev => ({ ...prev, ...newTimes }));
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchOrdersOnly, 5000); // 5s fast refresh
        return () => clearInterval(interval);
    }, []);

    // Recalculate travel times when orders change
    useEffect(() => {
        if (orders.length > 0) {
            calculateTravelTimes(orders);
        }
    }, [orders]);

    const updateStatus = async (orderId: string, newStatus: string) => {
        try {
            await api.updateOrderStatus(orderId, newStatus);
            fetchOrdersOnly();
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const getPreparationDetails = (items: OrderItem[]) => {
        let burgerCount = 0;
        const friedTypes = new Set<string>();

        if (!items || !Array.isArray(items)) {
            return { totalTime: 0, burgerCount: 0, friedTypesCount: 0 };
        }

        items.forEach(item => {
            const itemName = item.product_name || item.name || '';
            // Match by product_id first, then fallback to name match
            const product = menuItems.find((p: any) =>
                p.id === item.product_id ||
                p.name?.toLowerCase() === itemName.toLowerCase()
            );
            const catId = (product?.categoryId || product?.category_id || '').toLowerCase();

            if (catId.includes('burger')) {
                burgerCount += item.quantity;
            } else if (catId.includes('side') || catId.includes('frit')) {
                friedTypes.add(itemName);
            }
        });

        const grillBatches = Math.ceil(burgerCount / 6);
        const grillTime = grillBatches * 6;

        const fryerBatches = Math.ceil(friedTypes.size / 4);
        const fryerTime = fryerBatches * 4;

        const cookingTime = Math.max(grillTime, fryerTime);
        const totalTime = cookingTime > 0 ? cookingTime + 2 : 2;

        return { totalTime, burgerCount, friedTypesCount: friedTypes.size };
    };

    // Filtered and Sorted Orders
    const visibleOrders = sortOrders(orders.filter(o => {
        if (filterType === 'all') return true;
        return o.delivery_method === filterType;
    }));

    if (loading) {
        return <div className="text-white p-8 animate-pulse font-black italic">CARICAMENTO CUCINA INTELLIGENTE...</div>;
    }

    return (
        <div className="space-y-6 pb-20">
            <div className="space-y-4">
                {/* Row 1: Title + LIVE badge + action buttons */}
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-3xl lg:text-4xl font-black italic uppercase text-white tracking-tighter">
                            Cucina <span className="text-brand-yellow">Smart Display</span>
                        </h1>
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700">
                            <div className={clsx("w-2 h-2 rounded-full", loading ? "bg-brand-yellow animate-pulse" : "bg-green-500")}></div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{loading ? "SYNC..." : "LIVE"}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={handleManualRefresh}
                            className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-white/50 hover:text-white"
                            title="Aggiorna"
                        >
                            <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
                        </button>
                        <button
                            onClick={toggleFullscreen}
                            className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-white/50 hover:text-white"
                            title={isFullscreen ? "Esci fullscreen" : "Fullscreen"}
                        >
                            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                        </button>
                    </div>
                </div>

                {/* Row 2: Location */}
                <div className="flex items-center gap-2">
                    <MapPin size={12} className="text-brand-pink shrink-0" />
                    <p className="text-white/40 font-bold uppercase tracking-widest text-xs">
                        {RESTAURANT_LOCATION}
                    </p>
                </div>

                {/* Row 3: Filters + Stats */}
                <div className="flex items-center justify-between gap-3">
                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                        <button
                            onClick={() => setFilterType('all')}
                            className={clsx(
                                "px-3 lg:px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all",
                                filterType === 'all' ? "bg-white text-black" : "text-white/60 hover:text-white"
                            )}
                        >
                            Tutti
                        </button>
                        <button
                            onClick={() => setFilterType('domicilio')}
                            className={clsx(
                                "px-3 lg:px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1.5",
                                filterType === 'domicilio' ? "bg-brand-blue text-white" : "text-white/60 hover:text-white"
                            )}
                        >
                            <Bike size={14} /> Domicilio
                        </button>
                        <button
                            onClick={() => setFilterType('asporto')}
                            className={clsx(
                                "px-3 lg:px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1.5",
                                filterType === 'asporto' ? "bg-brand-pink text-white" : "text-white/60 hover:text-white"
                            )}
                        >
                            <ChefHat size={14} /> Asporto
                        </button>
                    </div>

                    <div className="flex gap-1.5 shrink-0">
                        <div className="bg-brand-blue/10 px-2.5 py-1.5 rounded-lg border border-brand-blue/20 text-center">
                            <span className="text-brand-blue font-black text-lg leading-none block">{orders.filter(o => o.status === 'pending').length}</span>
                            <span className="text-brand-blue/60 text-[7px] font-bold uppercase">Coda</span>
                        </div>
                        <div className="bg-brand-yellow/10 px-2.5 py-1.5 rounded-lg border border-brand-yellow/20 text-center">
                            <span className="text-brand-yellow font-black text-lg leading-none block">{orders.filter(o => o.status === 'preparing').length}</span>
                            <span className="text-brand-yellow/60 text-[7px] font-bold uppercase">Fuoco</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                {visibleOrders.length === 0 ? (
                    <div className="col-span-full py-20 text-center border-2 border-dashed border-white/10 rounded-3xl">
                        <ChefHat size={48} className="mx-auto text-white/20 mb-4" />
                        <h3 className="text-white/40 font-black uppercase italic">Nessun ordine trovato</h3>
                        <p className="text-white/20 text-sm">Modifica i filtri o attendi nuovi ordini.</p>
                    </div>
                ) : (
                    visibleOrders.map(order => {
                        const isDelivery = order.delivery_method === 'domicilio';
                        const travelTime = travelTimes[order.id];
                        // Safety check: ensure items is an array (check both properties)
                        const rawItems = order.items || order.order_items || [];
                        const safeItems = Array.isArray(rawItems) ? rawItems : [];
                        const { totalTime, burgerCount, friedTypesCount } = getPreparationDetails(safeItems);

                        // Live timer for preparing orders
                        // Append 'Z' to force UTC parsing (SQLite CURRENT_TIMESTAMP is UTC without suffix)
                        const tsRaw = order.updated_at || order.created_at;
                        const ts = tsRaw && !tsRaw.endsWith('Z') ? tsRaw + 'Z' : tsRaw;
                        const elapsedMs = order.status === 'preparing'
                            ? now - new Date(ts).getTime()
                            : 0;
                        const elapsedMin = Math.floor(elapsedMs / 60000);
                        const isLate = order.status === 'preparing' && elapsedMin > totalTime;
                        const isWarning = order.status === 'preparing' && !isLate && elapsedMin > totalTime * 0.75;

                        return (
                            <div key={order.id} className={clsx(
                                "relative overflow-hidden rounded-3xl border transition-all duration-300",
                                isLate
                                    ? "bg-red-500/10 border-red-500/60 shadow-[0_0_30px_rgba(239,68,68,0.2)] animate-pulse"
                                    : order.status === 'preparing'
                                        ? "bg-brand-yellow/5 border-brand-yellow/50 shadow-[0_0_30px_rgba(255,242,0,0.1)]"
                                        : "bg-white/5 border-white/10 hover:border-white/20"
                            )}>
                                <div className={clsx(
                                    "h-1 w-full",
                                    isLate ? "bg-red-500 animate-pulse"
                                        : order.status === 'preparing' ? "bg-brand-yellow animate-pulse"
                                            : "bg-brand-blue"
                                )}></div>

                                <div className="p-4 space-y-3">
                                    {/* Row 1: ID + Badge */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-white/40 font-bold text-xs uppercase tracking-widest">#{order.id.slice(0, 8)}</span>
                                        <span className={clsx(
                                            "text-[10px] font-black uppercase px-2 py-0.5 rounded border",
                                            isDelivery ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/30" : "bg-pink-500/20 text-pink-400 border-pink-500/30"
                                        )}>
                                            {isDelivery ? "Domicilio" : "Asporto"}
                                        </span>
                                    </div>

                                    {/* Row 2: Customer name - full width */}
                                    <h3 className="text-2xl font-black text-white italic uppercase leading-tight tracking-tight">
                                        {order.customer_name}
                                    </h3>

                                    {/* Row 3: Prep badges (left) + Orario richiesto (right) */}
                                    <div className="flex items-end justify-between gap-3">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <div className="inline-flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-md border border-white/10">
                                                <Timer size={12} className="text-white/60" />
                                                <span className="text-xs font-bold text-white/80">~{totalTime} MIN</span>
                                            </div>
                                            {order.status === 'preparing' && (
                                                <div className={clsx(
                                                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border",
                                                    isLate
                                                        ? "bg-red-500/20 border-red-500/30"
                                                        : isWarning
                                                            ? "bg-amber-500/20 border-amber-500/30"
                                                            : "bg-green-500/20 border-green-500/30"
                                                )}>
                                                    <Clock size={12} className={clsx(
                                                        isLate ? "text-red-400" : isWarning ? "text-amber-400" : "text-green-400"
                                                    )} />
                                                    <span className={clsx(
                                                        "text-xs font-bold",
                                                        isLate ? "text-red-400" : isWarning ? "text-amber-400" : "text-green-400"
                                                    )}>
                                                        {elapsedMin} MIN
                                                    </span>
                                                </div>
                                            )}
                                            {burgerCount > 0 && (
                                                <div className="inline-flex items-center gap-1.5 bg-brand-yellow/10 px-2.5 py-1 rounded-md border border-brand-yellow/20">
                                                    <Flame size={12} className="text-brand-yellow" />
                                                    <span className="text-xs font-bold text-brand-yellow">{burgerCount} BURGER</span>
                                                </div>
                                            )}
                                            {friedTypesCount > 0 && (
                                                <div className="inline-flex items-center gap-1.5 bg-pink-500/10 px-2.5 py-1 rounded-md border border-pink-500/20">
                                                    <ChefHat size={12} className="text-pink-400" />
                                                    <span className="text-xs font-bold text-pink-400">{friedTypesCount} FRITTI</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest block mb-0.5">Orario</span>
                                            <span className="text-lg font-black text-white leading-none whitespace-nowrap">
                                                {order.requested_time || format(new Date(order.created_at), "HH:mm")}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Travel Time for Delivery */}
                                    {isDelivery && (
                                        <div className="flex items-center gap-2 lg:gap-3 bg-white/5 p-2.5 lg:p-3 rounded-xl border border-white/5">
                                            <MapPin size={16} className="text-indigo-400 shrink-0" />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-bold text-white truncate">{order.delivery_address}</p>
                                                {travelTime && (
                                                    <p className="text-sm text-white/60 mt-1 font-bold">
                                                        Stima viaggio: <span className="text-indigo-300">{travelTime}</span>
                                                    </p>
                                                )}
                                            </div>
                                            {order.id && (
                                                <a
                                                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.delivery_address)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1.5 lg:p-2 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white shrink-0"
                                                >
                                                    <Navigation size={14} />
                                                </a>
                                            )}
                                        </div>
                                    )}

                                    <div className="space-y-3 bg-white/5 rounded-xl p-3 lg:p-4 border border-white/5">
                                        {safeItems.length > 0 ? (
                                            safeItems.map((item: any, idx: number) => {
                                                const itemName = item.product_name || item.name || 'Prodotto sconosciuto';
                                                // Parse options JSON to extract aggiunti/rimossi
                                                let aggiunti: string[] = [];
                                                let rimossi: string[] = [];
                                                let menuInfo: any = null;
                                                if (item.options) {
                                                    try {
                                                        const opts = typeof item.options === 'string' ? JSON.parse(item.options) : item.options;
                                                        aggiunti = opts.aggiunti || [];
                                                        rimossi = opts.rimossi || [];
                                                        menuInfo = opts.menu || null;
                                                    } catch (e) { /* ignore parse errors */ }
                                                }
                                                // Also support direct properties as fallback
                                                if (aggiunti.length === 0 && item.ingredients && Array.isArray(item.ingredients)) {
                                                    aggiunti = item.ingredients;
                                                }
                                                if (rimossi.length === 0 && item.removed_ingredients && Array.isArray(item.removed_ingredients)) {
                                                    rimossi = item.removed_ingredients;
                                                }
                                                return (
                                                    <div key={idx} className="flex items-start text-sm">
                                                        <span className="font-bold text-brand-yellow min-w-[20px]">{item.quantity}x</span>
                                                        <div className="flex-1">
                                                            <span className="text-white font-bold uppercase">{itemName}</span>
                                                            {menuInfo && menuInfo.bibita && (
                                                                <p className="text-xs text-brand-blue mt-0.5 font-medium">
                                                                    Menu con {menuInfo.bibita}
                                                                </p>
                                                            )}
                                                            {aggiunti.length > 0 && (
                                                                <p className="text-xs text-green-400 mt-0.5 font-medium">
                                                                    + {aggiunti.join(', ')}
                                                                </p>
                                                            )}
                                                            {rimossi.length > 0 && (
                                                                <p className="text-xs text-red-400 mt-0.5 font-medium">
                                                                    - {rimossi.join(', ')}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="text-center py-4 text-white/20 text-xs italic">
                                                Nessun prodotto nell'ordine (Verificare gestione items)
                                            </div>
                                        )}
                                    </div>

                                    {(order.notes || order.note) && (
                                        <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex gap-3 items-start">
                                            <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                                            <p className="text-xs font-bold text-amber-500 italic uppercase">
                                                "{order.notes || order.note}"
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Actions Footer */}
                                <div className="p-3 lg:p-4 bg-white/5 border-t border-white/5">
                                    {order.status === 'confirmed' ? (
                                        <button
                                            onClick={() => updateStatus(order.id, 'preparing')}
                                            className="w-full bg-brand-yellow text-black font-black uppercase italic py-3 lg:py-4 rounded-xl hover:bg-white transition-colors flex items-center justify-center gap-2"
                                        >
                                            <ChefHat size={20} /> Inizia Cottura
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => updateStatus(order.id, 'ready')}
                                            className="w-full bg-green-500 text-white font-black uppercase italic py-3 lg:py-4 rounded-xl hover:bg-green-400 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle2 size={20} /> Segna Pronto
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div >
    );
};
