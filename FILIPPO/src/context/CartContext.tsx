import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ElementoCarrello } from '../types';

interface CartContextType {
    items: ElementoCarrello[];
    addToCart: (item: ElementoCarrello) => void;
    removeFromCart: (cartId: string) => void;
    updateQuantity: (cartId: string, quantity: number) => void;
    clearCart: () => void;
    total: number;
    isOpen: boolean;
    toggleCart: () => void;
    validateCart: (menuData: any[]) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [items, setItems] = useState<ElementoCarrello[]>(() => {
        try {
            const saved = localStorage.getItem('cart');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error("Failed to load cart from local storage", error);
            return [];
        }
    });
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(items));
    }, [items]);

    const addToCart = (item: ElementoCarrello) => {
        setItems(prev => [...prev, item]);
        // setIsOpen(true); // Removed auto-open
    };

    const removeFromCart = (cartId: string) => {
        setItems(prev => prev.filter(i => i.cartId !== cartId));
    };

    const updateQuantity = (cartId: string, quantity: number) => {
        if (quantity < 1) {
            removeFromCart(cartId);
            return;
        }
        setItems(prev => prev.map(item =>
            item.cartId === cartId ? { ...item, quantita: quantity } : item
        ));
    };

    const toggleCart = () => setIsOpen(!isOpen);

    const clearCart = () => setItems([]);

    const validateCart = (menuData: any[]) => {
        const allProducts = menuData.flatMap(cat => cat.items || []);
        const unavailableIds = allProducts
            .filter(p => p.is_available === false)
            .map(p => p.id);

        if (unavailableIds.length > 0) {
            setItems(prev => prev.filter(item => !unavailableIds.includes(item.prodottoId)));
        }
    };

    const total = items.reduce((sum, item) => sum + (item.prezzo * item.quantita), 0);

    return (
        <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, total, isOpen, toggleCart, validateCart }}>

            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used within a CartProvider');
    return context;
};
