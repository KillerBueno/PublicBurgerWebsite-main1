import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShoppingBag, TrendingUp, Users, Package, Activity, Globe, Database, Zap, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import clsx from 'clsx';

export const AdminDashboard: React.FC = () => {
    const { user } = useAuth();
    const [statsData, setStatsData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await api.getStats();
                setStatsData(data);
                setError(null);
            } catch (err: any) {
                console.error("Failed to fetch dashboard stats:", err);
                setError(err.message || "Errore sconosciuto nel caricamento dati");
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const getStatusLabel = (status: string): string => {
        const statusMap: Record<string, string> = {
            'pending': 'In attesa',
            'confirmed': 'Confermato',
            'preparing': 'In preparazione',
            'ready': 'Pronto',
            'on_the_way': 'In consegna',
            'completed': 'Completato',
            'cancelled': 'Annullato'
        };
        return statusMap[status] || status;
    };

    const stats = [
        {
            label: 'Ordini Oggi',
            value: statsData?.todayOrders?.toString() || '0',
            icon: ShoppingBag,
            color: 'text-brand-blue',
            bg: 'bg-brand-blue/10'
        },
        {
            label: 'Vendite Oggi',
            value: `€ ${statsData?.todayRevenue?.toFixed(2) || '0.00'}`,
            icon: TrendingUp,
            color: 'text-brand-yellow',
            bg: 'bg-brand-yellow/10'
        },
        {
            label: 'Clienti Totali',
            value: statsData?.totalCustomers?.toString() || '0',
            icon: Users,
            color: 'text-brand-pink',
            bg: 'bg-brand-pink/10'
        },
        {
            label: 'Prodotti Attivi',
            value: statsData?.activeProducts?.toString() || '0',
            icon: Package,
            color: 'text-white',
            bg: 'bg-white/10'
        },
    ];

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center py-40">
                <Loader2 size={48} className="text-brand-yellow animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            {/* Header section with glass effect */}
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-brand-yellow to-brand-pink rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative bg-black/40 border border-white/5 p-8 md:p-12 rounded-2xl backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden">
                    <div className="relative z-10 w-full">
                        <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-none mb-4">
                            Benvenuto, <span className="text-brand-yellow drop-shadow-[0_0_15px_rgba(255,242,0,0.3)]">{user?.name}</span>
                        </h1>
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="px-3 py-1 bg-brand-pink text-white text-[10px] font-black uppercase tracking-widest italic rounded-full shadow-[0_0_10px_rgba(237,56,149,0.3)]">
                                {user?.role}
                            </span>
                            <span className="h-1 w-1 rounded-full bg-white/20"></span>
                            <p className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Pannello di controllo centrale operativo</p>
                        </div>

                        {error && (
                            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                <div className="p-2 bg-red-500/20 rounded-lg text-red-500">
                                    <Database size={20} />
                                </div>
                                <div>
                                    <p className="text-red-500 font-black uppercase italic text-sm">Errore di Connessione</p>
                                    <p className="text-red-400 text-xs font-mono">{error}</p>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="hidden md:flex items-center gap-4 text-brand-yellow/20">
                        <Zap size={80} className="animate-pulse" />
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <div key={i} className="bg-black/40 border border-white/5 p-8 rounded-2xl backdrop-blur-md group hover:border-brand-yellow/20 transition-all relative overflow-hidden">
                            <div className={clsx("absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity", stat.color)}>
                                <Icon size={120} />
                            </div>
                            <div className="relative z-10 space-y-4">
                                <div className={clsx("w-12 h-12 flex items-center justify-center rounded-xl", stat.bg)}>
                                    <Icon className={stat.color} size={24} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">{stat.label}</p>
                                    <p className="text-4xl font-black italic tracking-tighter text-white">
                                        {stat.value.split(' ')[0]}
                                        <span className="text-brand-yellow text-2xl ml-1">{stat.value.split(' ').slice(1).join(' ')}</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Bottom Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Activity Feed */}
                <div className="lg:col-span-2 bg-black/40 border border-white/5 rounded-2xl backdrop-blur-md p-8 space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Activity className="text-brand-pink" size={24} />
                            <h3 className="text-2xl font-black uppercase italic tracking-tighter">Attività Recente</h3>
                        </div>
                        <button className="text-[10px] font-black uppercase tracking-widest text-brand-blue hover:text-white transition-colors">Vedi tutto</button>
                    </div>

                    <div className="space-y-4">
                        {statsData?.recentOrders?.length > 0 ? (
                            statsData.recentOrders.map((order: any) => (
                                <div key={order.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className={clsx(
                                            "w-10 h-10 rounded-full flex items-center justify-center",
                                            order.status === 'pending' ? "bg-brand-blue/20 text-brand-blue" :
                                                order.status === 'completed' ? "bg-green-500/20 text-green-500" :
                                                    "bg-brand-yellow/20 text-brand-yellow"
                                        )}>
                                            <ShoppingBag size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black uppercase italic text-white tracking-tight">{order.customer_name}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{order.delivery_method === 'domicilio' ? 'Consegna' : 'Asporto'}</span>
                                                <span className="w-1 h-1 rounded-full bg-white/10"></span>
                                                <span className="text-[10px] text-brand-pink font-black uppercase italic">€ {order.total.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={clsx(
                                            "text-[9px] font-black uppercase italic px-2 py-1 rounded border",
                                            order.status === 'pending' ? "bg-brand-blue/10 text-brand-blue border-brand-blue/20" :
                                                order.status === 'completed' ? "bg-green-500/10 text-green-500 border-green-500/20" :
                                                    "bg-brand-yellow/10 text-brand-yellow border-brand-yellow/20"
                                        )}>
                                            {getStatusLabel(order.status)}
                                        </span>
                                        <div className="text-white/10 group-hover:text-white/40 transition-colors">
                                            <Activity size={16} />
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-2xl">
                                <p className="text-white/20 font-black uppercase italic tracking-widest text-sm">Nessuna attività registrata</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* System Health */}
                <div className="bg-brand-pink/5 border border-brand-pink/10 rounded-2xl backdrop-blur-md p-8 space-y-8">
                    <div className="flex items-center gap-3">
                        <Globe className="text-brand-yellow" size={24} />
                        <h3 className="text-2xl font-black uppercase italic tracking-tighter">System Health</h3>
                    </div>

                    <div className="space-y-6">
                        {[
                            { name: 'Database Engine', status: statsData?.systemStatus?.db || 'Offline', icon: Database, color: statsData?.systemStatus?.db === 'Online' ? 'text-green-500' : 'text-red-500' },
                            { name: 'Cloudflare Worker', status: statsData?.systemStatus?.worker || 'Inactive', icon: Globe, color: statsData?.systemStatus?.worker === 'Active' ? 'text-green-500' : 'text-orange-500' },
                            { name: 'GPS Satellite', status: statsData?.systemStatus?.gps || 'Ready', icon: Zap, color: 'text-brand-yellow' }
                        ].map((sys, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                                <div className="flex items-center gap-3">
                                    <sys.icon size={18} className="text-white/40" />
                                    <span className="text-xs font-bold uppercase tracking-widest text-white/60">{sys.name}</span>
                                </div>
                                <span className={clsx("text-xs font-black uppercase italic px-2 py-1 rounded", sys.color)}>
                                    {sys.status}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 pt-8 border-t border-white/5">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest opacity-20">
                            <span>Versione Sistema</span>
                            <span>v2.4.0-prod</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
