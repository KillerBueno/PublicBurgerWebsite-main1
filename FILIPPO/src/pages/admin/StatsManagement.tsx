import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { TrendingUp, ShoppingBag, Euro, Award, Calendar, Loader2, ArrowUpRight, BarChart3, PieChart, Users, Zap } from 'lucide-react';
import clsx from 'clsx';

export const StatsManagement: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await api.getStats();
                setStats(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
            <Loader2 className="animate-spin text-brand-yellow" size={48} />
            <p className="text-white/20 font-black uppercase italic tracking-widest text-xs">Caricamento Analisi...</p>
        </div>
    );

    const cards = [
        {
            label: 'Totale Ordini (Storico)',
            value: stats.totalOrders || '0',
            icon: ShoppingBag,
            color: 'text-brand-blue',
            bg: 'bg-brand-blue/10',
            subValue: `${stats.todayOrders || 0} oggi`
        },
        {
            label: 'Fatturato Totale',
            value: `€ ${stats.totalRevenue?.toFixed(2) || '0.00'}`,
            icon: Euro,
            color: 'text-brand-yellow',
            bg: 'bg-brand-yellow/10',
            subValue: `€ ${stats.todayRevenue?.toFixed(2) || '0.00'} oggi`
        },
        {
            label: 'Media per Ordine',
            value: `€ ${stats.avgOrderValue?.toFixed(2) || '0.00'}`,
            icon: TrendingUp,
            color: 'text-brand-pink',
            bg: 'bg-brand-pink/10',
            subValue: 'Ordini completati'
        },
        {
            label: 'Base Clienti',
            value: stats.totalCustomers || '0',
            icon: Users,
            color: 'text-white',
            bg: 'bg-white/10',
            subValue: 'Contatti unici'
        },
    ];

    return (
        <div className="space-y-12 animate-in fade-in duration-700 pb-20">
            {/* Page Title */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter leading-none">
                        Analisi <span className="text-brand-yellow">Performance</span>
                    </h1>
                    <p className="text-white/40 font-bold uppercase tracking-widest text-[10px] mt-3 max-w-md tracking-[0.2em]">
                        Monitoraggio approfondito dell'andamento operativo e preferenze dei clienti.
                    </p>
                </div>
                <div className="flex items-center gap-4 bg-black/40 p-2 rounded-2xl border border-white/5 backdrop-blur-md">
                    <div className="px-4 py-2 bg-brand-yellow/10 text-brand-yellow rounded-xl flex items-center gap-2 border border-brand-yellow/10">
                        <Zap size={14} className="animate-pulse" />
                        <span className="text-[10px] font-black uppercase italic">Dati Real-time</span>
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, i) => {
                    const Icon = card.icon;
                    return (
                        <div key={i} className="bg-black/40 border border-white/5 p-8 rounded-3xl backdrop-blur-md group hover:border-white/10 transition-all relative overflow-hidden">
                            <div className="flex justify-between items-start mb-8">
                                <div className={clsx("w-12 h-12 flex items-center justify-center rounded-2xl shadow-inner", card.bg)}>
                                    <Icon className={card.color} size={24} />
                                </div>
                                <ArrowUpRight className="text-white/5 group-hover:text-white/40 transition-colors" size={20} />
                            </div>
                            <div className="relative z-10">
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 mb-1">{card.label}</p>
                                <p className="text-3xl font-black italic tracking-tighter text-white mb-2">{card.value}</p>
                                <p className="text-[10px] font-bold text-white/40 uppercase italic">{card.subValue}</p>
                            </div>
                            {/* Decorative background icon */}
                            <Icon size={80} className={clsx("absolute -right-4 -bottom-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-700", card.color)} />
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Last 7 Days Activity Chart */}
                <div className="bg-black/40 border border-white/5 rounded-[2.5rem] backdrop-blur-md p-6 md:p-12 space-y-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-brand-blue/10 rounded-2xl">
                                <BarChart3 className="text-brand-blue" size={24} />
                            </div>
                            <h3 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter text-white">Vendite 7 Giorni</h3>
                        </div>
                        <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] italic">Ultima Settimana</span>
                    </div>

                    <div className="space-y-4">
                        {stats.dailyStats?.length > 0 ? stats.dailyStats.map((day: any) => (
                            <div key={day.date} className="group flex items-center justify-between p-4 md:p-5 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-brand-blue/30 transition-all cursor-default relative overflow-hidden">
                                <div className="flex items-center gap-3 md:gap-6 min-w-0">
                                    <div className="w-10 h-10 md:w-14 md:h-14 bg-black rounded-xl md:rounded-2xl flex-shrink-0 flex items-center justify-center text-xs md:text-sm font-black italic text-brand-blue border border-brand-blue/20 shadow-2xl">
                                        {new Date(day.date).getDate()}
                                    </div>
                                    <div className="space-y-0.5 md:space-y-1 min-w-0">
                                        <p className="text-sm md:text-base font-black uppercase italic text-white group-hover:text-brand-blue transition-colors truncate">
                                            {new Date(day.date).toLocaleDateString('it-IT', { weekday: 'long' })}
                                        </p>
                                        <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
                                            <p className="text-[9px] md:text-[10px] text-white/30 font-bold uppercase tracking-widest whitespace-nowrap">{day.count} Ordini</p>
                                            <span className="hidden md:block w-1 h-1 rounded-full bg-white/10"></span>
                                            <p className="hidden md:block text-[10px] text-brand-blue/60 font-black uppercase italic">Trend Stabile</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right pl-2">
                                    <p className="font-mono font-black text-brand-yellow text-lg md:text-xl">€ {day.revenue.toFixed(2)}</p>
                                </div>
                            </div>
                        )) : (
                            <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[2rem] flex flex-col items-center">
                                <Calendar size={48} className="text-white/5 mb-4" />
                                <p className="text-white/20 font-black uppercase italic tracking-widest text-sm">Nessun dato negli ultimi 7 giorni</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Top Products Rankings */}
                <div className="bg-black/40 border border-white/5 rounded-[2.5rem] backdrop-blur-md p-8 md:p-12 space-y-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-brand-pink/10 rounded-2xl">
                                <PieChart className="text-brand-pink" size={24} />
                            </div>
                            <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Classifica Prodotti</h3>
                        </div>
                        <Award className="text-brand-yellow/20" size={32} />
                    </div>

                    <div className="space-y-5">
                        {stats.topProducts?.length > 0 ? stats.topProducts.map((prod: any, i: number) => (
                            <div key={i} className="flex items-center gap-5 p-6 bg-gradient-to-r from-white/5 to-transparent border border-white/5 rounded-3xl group hover:from-brand-pink/10 hover:border-brand-pink/20 transition-all">
                                <div className={clsx(
                                    "w-12 h-12 flex items-center justify-center rounded-2xl font-black italic text-base border-2 shadow-2xl transition-all group-hover:scale-110",
                                    i === 0 ? "bg-brand-yellow text-black border-brand-yellow" : "bg-black text-white/40 border-white/10"
                                )}>
                                    #{i + 1}
                                </div>
                                <div className="flex-1">
                                    <p className="text-lg font-black uppercase italic text-white tracking-tight group-hover:text-brand-pink transition-colors">{prod.name}</p>
                                    <div className="flex items-center gap-5 mt-2">
                                        <div className="flex items-center gap-1.5">
                                            <ShoppingBag size={12} className="text-white/20" />
                                            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{prod.sold} Venduti</p>
                                        </div>
                                        <div className="h-1 w-1 rounded-full bg-white/10"></div>
                                        <p className="text-[10px] text-brand-pink font-black uppercase italic">€ {prod.revenue.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[2rem] flex flex-col items-center">
                                <Award size={48} className="text-white/5 mb-4" />
                                <p className="text-white/20 font-black uppercase italic tracking-widest text-sm">Classifica in attesa di vendite</p>
                            </div>
                        )}
                    </div>

                    <button className="w-full py-5 bg-white/5 border border-white/10 rounded-2xl font-black uppercase italic text-[10px] tracking-[0.3em] text-white/40 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-3">
                        Scarica Analitiche Mensili (.CSV)
                    </button>
                </div>
            </div>
        </div>
    );
};
