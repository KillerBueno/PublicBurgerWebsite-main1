import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import {
    ShoppingBag, Clock, Truck, Loader2,
    Search, X, ChevronRight, Phone, MessageSquare, AlertCircle,
    User, ClipboardList, ArrowLeft,
    Navigation, ExternalLink, RefreshCcw
} from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import clsx from 'clsx';

interface OrderItem {
    id: string;
    product_name: string;
    quantity: number;
    price: number;
    options: string; // JSON string
}

interface Order {
    id: string;
    customer_name: string;
    customer_phone: string;
    total: number;
    status: string;
    created_at: string;
    delivery_method: string;
    delivery_address?: string;
    requested_time?: string;
    note?: string;
    assigned_rider_id?: string;
    items?: OrderItem[];
    google_maps_link?: string;
}

export const OrderManagement: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const fetchOrders = async () => {
        try {
            const data = await api.getAdminOrders();
            setOrders(data);
        } catch (err) {
            console.error('Failed to fetch orders:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 30000);
        return () => clearInterval(interval);
    }, []);

    const updateStatus = async (orderId: string, newStatus: string) => {
        try {
            await api.updateOrderStatus(orderId, newStatus);
            fetchOrders();
            if (selectedOrder?.id === orderId) {
                const refreshed = await api.getOrder(orderId);
                setSelectedOrder(refreshed);
            }
        } catch (err) {
            alert('Errore nell\'aggiornamento dello stato');
        }
    };

    const handleViewDetails = async (order: Order) => {
        try {
            const fullOrder = await api.getOrder(order.id);
            setSelectedOrder(fullOrder);
            setIsDetailsOpen(true);
        } catch (err) {
            console.error("Failed to fetch order items:", err);
            setSelectedOrder(order);
            setIsDetailsOpen(true);
        }
    };

    const parseOptions = (optionsJson: string) => {
        if (!optionsJson) return null;
        try {
            return JSON.parse(optionsJson);
        } catch (e) {
            return null;
        }
    };

    const filteredOrders = orders
        .filter(order => filterStatus === 'all' || order.status === filterStatus)
        .filter(order =>
            order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.id.includes(searchTerm)
        )
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const statusOptions = [
        { value: 'pending', label: 'In Attesa', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
        { value: 'confirmed', label: 'Accettato', color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
        { value: 'preparing', label: 'In Preparazione', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
        { value: 'ready', label: 'Pronto', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
        { value: 'on_the_way', label: 'In Consegna', color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
        { value: 'completed', label: 'Completato', color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' },
        { value: 'cancelled', label: 'Annullato', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
    ];

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center py-40">
                <Loader2 size={40} className="text-slate-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500 pb-20 px-4 md:px-0">
            {/* Header + Filters */}
            <div className="flex flex-col gap-6 pt-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-100 tracking-tight flex items-center gap-3">
                            Gestione Ordini
                            <span className="text-xs font-medium bg-blue-500/10 text-blue-400 px-2 py-1 rounded-md border border-blue-500/20">
                                {orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length} Attivi
                            </span>
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">Monitora e gestisci gli ordini in tempo reale.</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {['all', 'pending', 'confirmed', 'preparing', 'ready', 'on_the_way'].map(s => (
                            <button
                                key={s}
                                onClick={() => setFilterStatus(s)}
                                className={clsx(
                                    "px-4 py-2 text-xs font-semibold rounded-lg transition-all border",
                                    filterStatus === s
                                        ? "bg-slate-100 text-slate-900 border-slate-100 shadow-sm"
                                        : "bg-slate-800/50 text-slate-300 border-slate-700/50 hover:border-slate-600 hover:bg-slate-800"
                                )}
                            >
                                {s === 'all' ? 'Tutti' : statusOptions.find(opt => opt.value === s)?.label || s}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Cerca ordine per nome o ID..."
                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-3 pl-12 pr-4 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Orders Grid */}
            <div className="grid grid-cols-1 gap-4">
                {filteredOrders.length > 0 ? filteredOrders.map((order) => {
                    const status = statusOptions.find(opt => opt.value === order.status);
                    return (
                        <div key={order.id} className="bg-slate-800/40 border border-slate-700/50 rounded-xl overflow-hidden hover:border-slate-600/50 hover:bg-slate-800/60 transition-all">
                            <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-700/30">
                                {/* Order Status Section */}
                                <div className="lg:w-48 p-6 flex flex-col justify-between bg-slate-900/30">
                                    <div className="space-y-4">
                                        <div className={clsx("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border uppercase", status?.bg, status?.color, status?.border)}>
                                            <div className={clsx("w-1.5 h-1.5 rounded-full", status?.color.replace('text-', 'bg-'))}></div>
                                            {status?.label}
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ordine ID</p>
                                            <p className="text-sm font-bold text-slate-200 tracking-tight">#{order.id.split('-')[0].toUpperCase()}</p>
                                        </div>
                                    </div>
                                    <div className="pt-4 flex items-center gap-2 text-slate-400">
                                        <Clock size={14} />
                                        <span className="text-xs font-medium">{format(new Date(order.created_at), "HH:mm", { locale: it })}</span>
                                    </div>
                                </div>

                                {/* Customer & Logistics Section */}
                                <div className="flex-1 p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cliente</p>
                                                <h3 className="text-xl font-bold text-slate-100 capitalize">{order.customer_name}</h3>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <a href={`tel:${order.customer_phone}`} className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors border border-slate-600/50">
                                                    <Phone size={14} />
                                                    Chiama
                                                </a>
                                                <a href={`https://wa.me/${order.customer_phone.replace(/\D/g, '')}`} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-semibold transition-colors border border-emerald-500/20">
                                                    <MessageSquare size={14} />
                                                    WhatsApp
                                                </a>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Metodo & Orario</p>
                                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                                                    {order.delivery_method === 'domicilio' ? (
                                                        <Truck size={16} className="text-indigo-400" />
                                                    ) : (
                                                        <ShoppingBag size={16} className="text-blue-400" />
                                                    )}
                                                    {order.requested_time}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Indirizzo</p>
                                                <p className="text-xs font-medium text-slate-400 truncate max-w-[200px]">
                                                    {order.delivery_address || 'Ritiro in sede'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {order.note && (
                                        <div className="mt-6 flex items-start gap-3 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                                            <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                                            <p className="text-[11px] font-medium text-amber-300 italic">"{order.note}"</p>
                                        </div>
                                    )}
                                </div>

                                {/* Order Value & Actions Section */}
                                <div className="lg:w-72 p-6 flex flex-col justify-between bg-slate-900/20">
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Totale</p>
                                        <p className="text-3xl font-bold text-slate-100">€ {order.total.toFixed(2)}</p>
                                    </div>
                                    <div className="pt-6 space-y-2">
                                        <button
                                            onClick={() => handleViewDetails(order)}
                                            className="w-full h-10 bg-slate-700/50 hover:bg-slate-700 text-slate-200 border border-slate-600/50 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2"
                                        >
                                            <ClipboardList size={14} />
                                            Dettagli Comanda
                                        </button>

                                        {order.status === 'pending' && (
                                            <button
                                                onClick={() => updateStatus(order.id, 'confirmed')}
                                                className="w-full h-10 bg-slate-100 hover:bg-white text-slate-900 rounded-lg text-xs font-bold transition-all shadow-sm"
                                            >
                                                Accetta Ordine
                                            </button>
                                        )}
                                        {order.status === 'confirmed' && (
                                            <button
                                                onClick={() => updateStatus(order.id, 'preparing')}
                                                className="w-full h-10 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                                            >
                                                Inizia Preparazione
                                            </button>
                                        )}
                                        {order.status === 'preparing' && (
                                            <button
                                                onClick={() => updateStatus(order.id, 'ready')}
                                                className="w-full h-10 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                                            >
                                                Segna Pronto
                                            </button>
                                        )}
                                        {order.status === 'ready' && (
                                            <button
                                                onClick={() => updateStatus(order.id, order.delivery_method === 'domicilio' ? 'on_the_way' : 'completed')}
                                                className="w-full h-10 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                                            >
                                                {order.delivery_method === 'domicilio' ? 'In Consegna' : 'Consegnato'}
                                            </button>
                                        )}
                                        {order.status === 'on_the_way' && (
                                            <button
                                                onClick={() => updateStatus(order.id, 'completed')}
                                                className="w-full h-10 bg-slate-100 hover:bg-white text-slate-900 rounded-lg text-xs font-bold transition-all shadow-sm"
                                            >
                                                Completa Consegna
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="py-32 flex flex-col items-center justify-center bg-slate-800/40 border border-slate-700/50 rounded-xl">
                        <ShoppingBag size={48} className="text-slate-700 mb-4" />
                        <p className="text-slate-500 font-medium">Nessun ordine trovato.</p>
                    </div>
                )}
            </div>

            {/* Modal Order Details - Dark Mode */}
            {isDetailsOpen && selectedOrder && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsDetailsOpen(false)}></div>
                    <div className="relative bg-slate-900 w-full max-w-4xl h-full md:h-auto md:max-h-[85vh] md:rounded-2xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-5 duration-300 border border-slate-700/50">
                        {/* Header */}
                        <div className="px-8 py-6 border-b border-slate-700/50 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setIsDetailsOpen(false)}
                                    className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-100 tracking-tight">
                                        Ordine #{selectedOrder.id.split('-')[0].toUpperCase()}
                                    </h2>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <div className={clsx("w-1.5 h-1.5 rounded-full", statusOptions.find(o => o.value === selectedOrder.status)?.color.replace('text-', 'bg-'))}></div>
                                        <span className={clsx("text-[10px] font-bold uppercase tracking-wider", statusOptions.find(o => o.value === selectedOrder.status)?.color)}>
                                            {statusOptions.find(o => o.value === selectedOrder.status)?.label}
                                        </span>
                                        <span className="text-slate-600">•</span>
                                        <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">{format(new Date(selectedOrder.created_at), "dd MMM yyyy, HH:mm", { locale: it })}</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setIsDetailsOpen(false)} className="text-slate-500 hover:text-slate-300 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Body scrollable */}
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                {/* Left Side: Items */}
                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                            <ClipboardList size={14} /> Contenuto Comanda
                                        </h3>
                                        <div className="divide-y divide-slate-700/30 border-y border-slate-700/30">
                                            {selectedOrder.items?.map((item, idx) => {
                                                const opts = parseOptions(item.options);
                                                return (
                                                    <div key={idx} className="py-5 flex items-start justify-between gap-4">
                                                        <div className="flex gap-4">
                                                            <div className="shrink-0 w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center font-bold text-slate-400 border border-slate-700/50">
                                                                {item.quantity}x
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <p className="text-sm font-bold text-slate-200 uppercase leading-tight">{item.product_name}</p>
                                                                {opts && (
                                                                    <div className="flex flex-wrap gap-1.5">
                                                                        {opts.size && <span className="text-[9px] font-bold px-2 py-0.5 bg-slate-700/50 text-slate-400 rounded border border-slate-600/50">MISURA: {opts.size.toUpperCase()}</span>}
                                                                        {opts.meat && <span className="text-[9px] font-bold px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded border border-blue-500/20">COTTURA: {opts.meat.toUpperCase()}</span>}
                                                                        {opts.menu?.bibita && <span className="text-[9px] font-bold px-2 py-0.5 bg-sky-500/10 text-sky-400 rounded border border-sky-500/20">MENU: {opts.menu.bibita.toUpperCase()}</span>}
                                                                        {opts.aggiunti?.map((name: string, k: number) => (
                                                                            <span key={k} className="text-[9px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20">+ {name.toUpperCase()}</span>
                                                                        ))}
                                                                        {opts.rimossi?.map((name: string, k: number) => (
                                                                            <span key={k} className="text-[9px] font-bold px-2 py-0.5 bg-rose-500/10 text-rose-400 rounded border border-rose-500/20">NO {name.toUpperCase()}</span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <p className="text-sm font-bold text-slate-200">€ {(item.price * item.quantity).toFixed(2)}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {selectedOrder.note && (
                                        <div className="space-y-3">
                                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                <AlertCircle size={14} /> Note Aggiuntive
                                            </h3>
                                            <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20 text-sm italic text-amber-300">
                                                "{selectedOrder.note}"
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Right Side: Info & Actions */}
                                <div className="space-y-10">
                                    {/* Client info */}
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                            <User size={14} /> Informazioni Cliente
                                        </h3>
                                        <div className="p-5 bg-slate-800/50 rounded-xl border border-slate-700/50 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <p className="text-base font-bold text-slate-100 capitalize">{selectedOrder.customer_name}</p>
                                                    <p className="text-xs font-medium text-slate-400">{selectedOrder.customer_phone}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <a href={`tel:${selectedOrder.customer_phone}`} className="p-2 bg-slate-700/50 text-slate-300 border border-slate-600/50 rounded-lg hover:bg-slate-700 transition-colors"><Phone size={16} /></a>
                                                    <a href={`https://wa.me/${selectedOrder.customer_phone.replace(/\D/g, '')}`} className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-colors"><MessageSquare size={16} /></a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Logistics */}
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                            <Navigation size={14} /> Logistica Consegna
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="flex justify-between p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl">
                                                <span className="text-xs font-medium text-slate-500">Modalità</span>
                                                <span className="text-xs font-bold text-slate-200 uppercase">{selectedOrder.delivery_method === 'domicilio' ? 'Consegna' : 'Asporto'}</span>
                                            </div>
                                            <div className="flex justify-between p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl">
                                                <span className="text-xs font-medium text-slate-500">Orario Consegna</span>
                                                <span className="text-xs font-bold text-indigo-400 uppercase">{selectedOrder.requested_time}</span>
                                            </div>
                                            <div className="flex flex-col gap-2 p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl">
                                                <span className="text-xs font-medium text-slate-500">Indirizzo</span>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-slate-200 uppercase leading-snug">{selectedOrder.delivery_address || 'Ritiro in sede'}</span>
                                                    {selectedOrder.google_maps_link && (
                                                        <a href={selectedOrder.google_maps_link} target="_blank" className="text-blue-400"><ExternalLink size={14} /></a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Summary Price */}
                                    <div className="bg-slate-800 p-8 rounded-2xl flex items-center justify-between border border-slate-700/50">
                                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Totale Ricevuto</span>
                                        <span className="text-3xl font-bold text-slate-100">€ {selectedOrder.total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer sticky */}
                        <div className="px-8 py-6 bg-slate-800/50 border-t border-slate-700/50 flex flex-wrap gap-3 justify-end shrink-0">
                            {selectedOrder.status !== 'pending' && selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && (
                                <button
                                    onClick={() => { if (confirm('Riportare ordine in attesa?')) { updateStatus(selectedOrder.id, 'pending'); } }}
                                    className="px-5 h-12 border border-blue-500/20 bg-blue-500/10 text-blue-400 font-bold rounded-xl text-xs flex items-center gap-2 hover:bg-blue-500/20 transition-colors"
                                >
                                    <RefreshCcw size={16} /> Ripristina Attesa
                                </button>
                            )}

                            {selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && (
                                <button
                                    onClick={() => { if (confirm('Annullare l\'ordine definitivamente?')) { updateStatus(selectedOrder.id, 'cancelled'); setIsDetailsOpen(false); } }}
                                    className="px-5 h-12 border border-rose-500/20 bg-rose-500/10 text-rose-400 font-bold rounded-xl text-xs flex items-center gap-2 hover:bg-rose-500/20 transition-colors"
                                >
                                    <X size={16} /> Annulla Ordine
                                </button>
                            )}

                            <button
                                onClick={() => {
                                    const statuses = ['pending', 'confirmed', 'preparing', 'ready', 'on_the_way', 'completed'];
                                    const currentIndex = statuses.indexOf(selectedOrder.status);
                                    if (currentIndex < statuses.length - 1) {
                                        updateStatus(selectedOrder.id, statuses[currentIndex + 1]);
                                    }
                                }}
                                className="px-8 h-12 bg-slate-100 text-slate-900 font-bold rounded-xl text-xs flex items-center gap-2 hover:bg-white transition-all shadow-md active:scale-[0.98]"
                            >
                                {selectedOrder.status === 'pending' ? 'Accetta Ordine' :
                                    selectedOrder.status === 'confirmed' ? 'Inizia Preparazione' :
                                        selectedOrder.status === 'preparing' ? 'Segna Pronto' :
                                            selectedOrder.status === 'ready' ? (selectedOrder.delivery_method === 'domicilio' ? 'Parti per la Consegna' : 'Consegna Completata') :
                                                'Completa Ordine'}
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
