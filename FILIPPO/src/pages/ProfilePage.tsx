import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, Package, LogOut, ChevronRight, ShoppingBag, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface Order {
    id: string;
    total: number;
    status: string;
    created_at: string;
    delivery_address: string;
    delivery_method?: string;
}

export const ProfilePage: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            navigate('/auth');
            return;
        }

        const fetchOrders = async () => {
            try {
                const data = await api.getUserOrders();
                setOrders(data);
            } catch (err) {
                console.error('Failed to fetch orders:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [user, navigate]);

    if (!user) return null;

    return (
        <div className="min-h-screen py-10 px-4 max-w-4xl mx-auto space-y-10">
            {/* Header Profilo */}
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-brand-yellow to-brand-pink blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                <div className="relative bg-black border border-white/10 p-8 flex flex-col md:flex-row items-center gap-8">
                    <div className="w-24 h-24 bg-brand-yellow flex items-center justify-center text-black text-4xl font-black italic">
                        {user.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 text-center md:text-left space-y-2">
                        <h1 className="text-4xl font-black uppercase italic tracking-tighter">
                            {user.name} <span className="text-brand-pink">{user.surname}</span>
                        </h1>
                        <div className="flex flex-wrap justify-center md:justify-start gap-4 text-white/50 text-sm">
                            <div className="flex items-center gap-2">
                                <Mail size={14} className="text-brand-yellow" />
                                {user.email}
                            </div>
                            {user.phone && (
                                <div className="flex items-center gap-2">
                                    <Phone size={14} className="text-brand-blue" />
                                    {user.phone}
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={() => { logout(); navigate('/'); }}
                        className="flex items-center gap-2 px-6 py-3 border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white transition-all font-bold uppercase italic text-sm cursor-pointer"
                    >
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
            </div>

            {/* Storico Ordini */}
            <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <h2 className="text-2xl font-black uppercase italic flex items-center gap-3">
                        <Package className="text-brand-yellow" />
                        I Miei Ordini
                    </h2>
                    <span className="bg-white/5 px-3 py-1 text-xs font-bold text-white/40 uppercase tracking-widest border border-white/10">
                        {orders.length} Ordini Totali
                    </span>
                </div>

                {loading ? (
                    <div className="py-20 text-center animate-pulse text-white/20 font-black uppercase italic text-xl">
                        Caricamento storico...
                    </div>
                ) : orders.length === 0 ? (
                    <div className="bg-white/5 border border-white/10 p-12 text-center space-y-6">
                        <ShoppingBag size={48} className="mx-auto text-white/20" />
                        <div className="space-y-2">
                            <p className="text-xl font-bold uppercase italic">Non hai ancora effettuato ordini</p>
                            <p className="text-white/40">Cosa aspetti? Il tuo prossimo burger preferito ti aspetta!</p>
                        </div>
                        <button
                            onClick={() => navigate('/menu')}
                            className="btn-primary px-8 py-3"
                        >
                            VAI AL MENU
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {orders.map((order) => (
                            <div
                                key={order.id}
                                className="bg-white/5 border border-white/10 hover:border-brand-yellow/50 transition-all p-6 group cursor-pointer"
                                onClick={() => navigate(`/orders/${order.id}`)}
                            >
                                <div className="flex flex-col md:flex-row justify-between gap-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <span className="bg-brand-blue/20 text-brand-blue px-2 py-1 text-[10px] font-black uppercase border border-brand-blue/30">
                                                ID: {order.id.split('-')[0]}
                                            </span>
                                            <span className={`px-2 py-1 text-[10px] font-black uppercase border ${order.status === 'completed' ? 'bg-green-500/20 text-green-500 border-green-500/30' :
                                                order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' :
                                                    order.status === 'confirmed' ? 'bg-sky-500/20 text-sky-500 border-sky-500/30' :
                                                        'bg-white/10 text-white/40 border-white/20'
                                                }`}>
                                                {order.status === 'pending' ? 'IN ATTESA' :
                                                    order.status === 'confirmed' ? 'CONFERMATO' :
                                                        order.status === 'on_the_way' ? 'IN CONSEGNA' :
                                                            order.status === 'completed' ? 'COMPLETATO' : order.status.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-white/30 text-xs">
                                            <Clock size={12} />
                                            {format(new Date(order.created_at + (order.created_at.includes('Z') ? '' : 'Z')), "d MMMM yyyy 'alle' HH:mm", { locale: it })}
                                        </div>
                                        <p className="text-sm text-white/60 line-clamp-1 italic">
                                            {order.delivery_method === 'domicilio'
                                                ? `Consegna a: ${order.delivery_address}`
                                                : order.delivery_method === 'asporto'
                                                    ? 'RITIRO IN SEDE'
                                                    : order.delivery_address
                                                        ? `Consegna a: ${order.delivery_address}`
                                                        : 'RITIRO IN SEDE'
                                            }
                                        </p>
                                    </div>

                                    <div className="flex flex-row md:flex-col justify-between items-end gap-2">
                                        <div className="text-2xl font-black italic items-baseline">
                                            <span className="text-xs mr-1 italic text-white/40">€</span>
                                            {order.total.toFixed(2)}
                                        </div>
                                        <div className="text-brand-yellow font-black italic text-xs flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                            DETTAGLI <ChevronRight size={14} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
