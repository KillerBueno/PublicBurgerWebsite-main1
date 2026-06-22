import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { X, Trash2, ArrowRight, Plus, Minus } from 'lucide-react';
import clsx from 'clsx';
import type { ElementoCarrello } from '../../types';

interface CartDrawerProps {
    onCheckout: () => void;
}

const CartItem = ({
    item,
    updateQuantity,
    removeFromCart
}: {
    item: ElementoCarrello,
    updateQuantity: (id: string, q: number) => void,
    removeFromCart: (id: string) => void
}) => {
    const [isExiting, setIsExiting] = useState(false);

    const handleRemove = () => {
        setIsExiting(true);
        setTimeout(() => {
            removeFromCart(item.cartId);
        }, 500);
    };

    const handleQuantityChange = (newQuantity: number) => {
        if (newQuantity < 1) {
            handleRemove();
        } else {
            updateQuantity(item.cartId, newQuantity);
        }
    };

    return (
        <div className={clsx(
            "bg-white/5 rounded-xl p-4 border border-white/10 relative group hover:border-brand-yellow/50 transition-all hover:bg-white/10",
            isExiting ? "translate-x-full opacity-0 pointer-events-none duration-500" : "translate-x-0 opacity-100 duration-500"
        )}>
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-black/30 rounded-lg p-1 border border-white/5">
                        <button
                            onClick={() => handleQuantityChange(item.quantita - 1)}
                            className="p-1 hover:text-red-500 hover:bg-white/10 rounded transition-colors cursor-pointer"
                        >
                            <Minus size={14} strokeWidth={3} />
                        </button>
                        <span className="font-bold text-white w-8 text-center text-sm">{item.quantita}</span>
                        <button
                            onClick={() => handleQuantityChange(item.quantita + 1)}
                            className="p-1 hover:text-green-500 hover:bg-white/10 rounded transition-colors cursor-pointer"
                        >
                            <Plus size={14} strokeWidth={3} />
                        </button>
                    </div>
                    <h3 className="font-black text-white text-lg italic tracking-tighter leading-tight">{item.nome}</h3>
                </div>
                <button
                    onClick={handleRemove}
                    className="text-red-500 hover:text-red-400 transition-colors p-1 cursor-pointer"
                >
                    <Trash2 size={18} />
                </button>
            </div>

            <div className="space-y-1">
                {item.ingredientiAggiunti.length > 0 && (
                    <div className="text-[10px] font-bold text-brand-pink uppercase tracking-widest">
                        + {item.ingredientiAggiunti.join(', ')}
                    </div>
                )}
                {item.ingredientiRimossi.length > 0 && (
                    <div className="text-[10px] font-bold text-red-500/60 uppercase tracking-widest line-through">
                        - {item.ingredientiRimossi.join(', ')}
                    </div>
                )}
                {item.isMenu && (
                    <div className="text-[10px] text-brand-blue font-black uppercase italic tracking-wider">
                        MENU ( Patatine + {item.bibitaMenu} )
                    </div>
                )}
            </div>

            <div className="text-right font-black text-2xl text-white mt-4 italic tracking-tighter">
                € {(item.prezzo * item.quantita).toFixed(2)}
            </div>
        </div>
    );
};

export const CartDrawer: React.FC<CartDrawerProps> = ({ onCheckout }) => {
    const { items, removeFromCart, updateQuantity, total, isOpen, toggleCart } = useCart();

    useEffect(() => {
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex justify-end">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={toggleCart}></div>

            {/* Drawer */}
            <div className="relative w-full max-w-md h-full bg-zinc-900 shadow-2xl flex flex-col border-l-4 border-brand-pink animate-in slide-in-from-right duration-300">
                <div className="p-6 border-b-2 border-white/10 flex items-center justify-between bg-black/20">
                    <h2 className="text-3xl font-black text-white italic tracking-tighter">CARRELLO</h2>
                    <button onClick={toggleCart} className="p-2 text-white/60 hover:text-brand-pink transition-colors cursor-pointer">
                        <X size={28} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar overflow-x-hidden">
                    {items.length === 0 ? (
                        <div className="text-center text-white/40 py-20 flex flex-col items-center">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                <Trash2 size={32} />
                            </div>
                            <p className="text-xl font-black italic uppercase">Vuoto!</p>
                            <p className="text-sm mt-2 font-medium">Aggiungi degli articoli!</p>
                        </div>
                    ) : (
                        items.map(item => (
                            <CartItem
                                key={item.cartId}
                                item={item}
                                updateQuantity={updateQuantity}
                                removeFromCart={removeFromCart}
                            />
                        ))
                    )}
                </div>

                <div className="p-6 bg-black/40 border-t-2 border-white/10">
                    <div className="flex justify-between items-center mb-8">
                        <span className="text-xl font-black text-white/60 uppercase italic">Totale</span>
                        <span className="text-4xl font-black text-brand-yellow italic tracking-tighter drop-shadow-[2px_2px_0px_#ed3895]">€ {total.toFixed(2)}</span>
                    </div>
                    <button
                        onClick={() => { toggleCart(); onCheckout(); }}
                        disabled={items.length === 0}
                        className="w-full btn-primary flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale"
                    >
                        <span className="text-lg">VAI AL CHECKOUT</span>
                        <ArrowRight size={24} />
                    </button>
                </div>
            </div>
        </div>
    );
};
