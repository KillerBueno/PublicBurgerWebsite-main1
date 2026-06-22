import React, { useState, useRef, useEffect } from 'react';
import { ProductCard } from '../components/menu/ProductCard';
import { useCart } from '../context/CartContext';
import { Wheat, Milk, Egg, Nut, Flame, Info, ChevronLeft, ChevronRight, MoveHorizontal } from 'lucide-react';
import clsx from 'clsx';
import { api } from '../services/api';
import type { CategoriaProdotto, Ingrediente, ApiCategory } from '../types';

const AllergensLegend = () => (
    <div className="mt-12 pt-12 border-t border-brand-border">
        <h4 className="text-sm font-semibold text-brand-muted uppercase tracking-widest mb-8 text-center">Legenda Allergeni</h4>
        <div className="flex flex-wrap justify-center gap-3 md:gap-6">
            <div className="flex items-center gap-2 text-brand-muted bg-brand-cream px-4 py-2 border border-brand-border">
                <Wheat size={15} />
                <span className="text-xs font-medium uppercase tracking-wider">Glutine</span>
            </div>
            <div className="flex items-center gap-2 text-brand-muted bg-brand-cream px-4 py-2 border border-brand-border">
                <Milk size={15} />
                <span className="text-xs font-medium uppercase tracking-wider">Lattosio</span>
            </div>
            <div className="flex items-center gap-2 text-brand-muted bg-brand-cream px-4 py-2 border border-brand-border">
                <Egg size={15} />
                <span className="text-xs font-medium uppercase tracking-wider">Uova</span>
            </div>
            <div className="flex items-center gap-2 text-brand-muted bg-brand-cream px-4 py-2 border border-brand-border">
                <Nut size={15} />
                <span className="text-xs font-medium uppercase tracking-wider">Frutta a guscio</span>
            </div>
            <div className="flex items-center gap-2 text-brand-muted bg-brand-cream px-4 py-2 border border-brand-border">
                <Flame size={15} />
                <span className="text-xs font-medium uppercase tracking-wider">Senape</span>
            </div>
        </div>
    </div>
);

export const MenuPage: React.FC = () => {
    const { addToCart, validateCart } = useCart();

    // Data State
    const [menuData, setMenuData] = useState<ApiCategory[]>([]);
    const [ingredientsMap, setIngredientsMap] = useState<Record<string, Ingrediente>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // UI State
    const [activeIndex, setActiveIndex] = useState(0);
    const touchStart = useRef<number | null>(null);

    // Helper to map API category ID to Frontend types
    const mapCategory = (apiCatId: string): CategoriaProdotto => {
        switch (apiCatId) {
            case 'cat_burgers': return 'hamburger';
            case 'cat_sides': return 'fritti';
            case 'cat_drinks': return 'bibite';
            default: return 'hamburger'; // fallback
        }
    };

    // Fetch Data
    useEffect(() => {
        api.getMenu()
            .then((data: any) => {
                let categoriesRaw = data.categories || data;
                const ingredientsRaw = Array.isArray(data.ingredients) ? data.ingredients : [];

                if (!Array.isArray(categoriesRaw)) {
                    console.error("Invalid menu data:", categoriesRaw);
                    categoriesRaw = [];
                }

                // Map raw ingredients
                const iMap: Record<string, Ingrediente> = {};
                ingredientsRaw.forEach((i: any) => {
                    iMap[i.id] = {
                        id: i.id,
                        nome: i.name || i.nome,
                        prezzo: i.price || i.prezzo || 0,
                        category: i.category
                    };
                });
                setIngredientsMap(iMap);

                // Map raw products
                const mappedCategories = categoriesRaw.map((cat: any) => ({
                    ...cat,
                    items: (Array.isArray(cat.items) ? cat.items : []).map((p: any) => ({
                        ...p,
                        nome: p.name || p.nome,
                        descrizione: p.description || p.descrizione,
                        prezzo: Number(p.price || p.prezzo),
                        categoria: mapCategory(p.category_id),
                        immagine: p.image_url || p.immagine || 'https://via.placeholder.com/300',
                        ingredienti: p.ingredienti || [],
                        allergeni: p.allergeni || [],
                        personalizzabile: p.personalizzabile || false,
                        opzioniCarne: p.opzioniCarne || false,
                        opzioneMenu: p.opzioneMenu || false,
                        is_available: p.is_available === undefined ? true : !!p.is_available
                    }))
                }));

                setMenuData(mappedCategories);
                validateCart(mappedCategories);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch menu:", err);
                setError("Impossibile caricare il menu. Riprova più tardi.");
                setLoading(false);
            });
    }, []);

    // Derived Categories for Navigation
    const navCategories = [
        { id: 'all', label: 'TUTTO' },
        ...menuData.map(cat => ({ id: cat.id, label: cat.name.toUpperCase() }))
    ];

    const activeCategory = navCategories[activeIndex] || navCategories[0];

    const onTouchStart = (e: React.TouchEvent) => {
        touchStart.current = e.touches[0].clientX;
    };

    const onTouchEnd = (e: React.TouchEvent) => {
        if (!touchStart.current) return;
        const diff = touchStart.current - e.changedTouches[0].clientX;
        if (diff > 50) handleNext();
        if (diff < -50) handlePrev();
        touchStart.current = null;
    };

    const handleNext = () => setActiveIndex((prev) => (prev + 1) % navCategories.length);
    const handlePrev = () => setActiveIndex((prev) => (prev - 1 + navCategories.length) % navCategories.length);

    useEffect(() => {
        window.scrollTo(0, 0);
        const html = document.documentElement;

        if (activeCategory?.id === 'all') {
            html.classList.add('snap-page');
            return () => {
                html.classList.remove('snap-page');
            };
        } else {
            html.classList.remove('snap-page');
        }
    }, [activeCategory?.id]);

    if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Caricamento menu...</div>;
    if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;

    return (
        <div className="py-12 px-4 max-w-7xl mx-auto min-h-screen">
            {/* Header */}
            <div className="mb-8 text-center snap-start scroll-mt-4">
                <div className="flex flex-col items-center gap-2">
                    <p className="text-brand-muted font-medium tracking-widest text-sm">
                        Scegli la tua combinazione perfetta
                    </p>
                    <p className="text-brand-muted/50 text-[10px] font-medium tracking-widest flex items-center gap-1.5">
                        <Info size={12} />
                        Legenda allergeni a fondo pagina
                    </p>
                </div>
            </div>

            {/* Category Carousel */}
            <div
                className="relative h-24 mb-2 md:mb-12 flex items-center justify-center overflow-hidden touch-pan-y snap-start"
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
            >
                <button onClick={handlePrev} className="absolute left-0 z-20 text-white/20 hover:text-white p-2 hidden md:block cursor-pointer transition-colors">
                    <ChevronLeft size={40} />
                </button>
                <button onClick={handleNext} className="absolute right-0 z-20 text-white/20 hover:text-white p-2 hidden md:block cursor-pointer transition-colors">
                    <ChevronRight size={40} />
                </button>

                <div className="relative w-full h-full flex items-center justify-center">
                    {navCategories.map((cat, index) => {
                        let diff = index - activeIndex;
                        if (diff < -Math.floor(navCategories.length / 2)) diff += navCategories.length;
                        if (diff > Math.floor(navCategories.length / 2)) diff -= navCategories.length;

                        const isActive = diff === 0;
                        const isPrev = diff === -1;
                        const isNext = diff === 1;
                        const isVisible = Math.abs(diff) <= 1;

                        return (
                            <div
                                key={cat.id}
                                className={clsx(
                                    "absolute transition-all duration-500 ease-in-out whitespace-nowrap cursor-pointer px-4",
                                    // Centrale Attivo
                                    isActive && "opacity-100 z-30 scale-100 left-1/2 -translate-x-1/2",
                                    // Sinistra (Precedente)
                                    isPrev && "opacity-40 z-10 scale-75 left-0 -translate-x-[30%] md:left-[15%] md:-translate-x-1/2",
                                    // Destra (Successivo)
                                    isNext && "opacity-40 z-10 scale-75 right-0 translate-x-[30%] md:right-[15%] md:translate-x-1/2",
                                    // Nascosti (tutti gli altri)
                                    (!isVisible) && "opacity-0 z-0 scale-50 pointer-events-none left-1/2 -translate-x-1/2"
                                )}
                                onClick={() => setActiveIndex(index)}
                            >
                                <div className="flex items-center gap-4">
                                    {isActive && <div className="h-8 w-1.5 bg-brand-red animate-in fade-in duration-500"></div>}
                                    <h2 className={clsx(
                                        "font-bold tracking-tight transition-colors",
                                        isActive ? "text-3xl md:text-6xl text-brand-dark" : "text-xl md:text-4xl text-brand-muted"
                                    )}>
                                        {cat.label}
                                    </h2>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Hint Navigation */}
            <div className="text-center mb-12 -mt-4 md:-mt-8 animate-in fade-in duration-1000">
                <div className="flex items-center justify-center gap-3 opacity-20">
                    <MoveHorizontal size={14} className="text-brand-pink" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em]">Scorri o clicca per navigare</span>
                    <MoveHorizontal size={14} className="text-brand-pink" />
                </div>
            </div>

            {/* Content */}
            <div className="min-h-[500px]">
                {activeCategory?.id === 'all' ? (
                    <div className="space-y-24 pb-24 animate-in fade-in slide-in-from-bottom-8 duration-500">
                        {menuData.map(cat => (
                            <div key={cat.id} id={cat.id} className="relative">
                                <div className="flex items-center gap-4 mb-10 snap-start" style={{ scrollSnapStop: 'always' }}>
                                    <div className="h-10 w-1 bg-brand-red"></div>
                                    <h2 className="text-4xl font-bold text-brand-dark tracking-tight">
                                        {cat.name}
                                    </h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                    {cat.items.map(product => (
                                        <ProductCard
                                            key={product.id}
                                            product={product}
                                            onAdd={addToCart}
                                            availableIngredients={ingredientsMap}
                                            availableDrinks={[
                                                ...(menuData.find(c => c.id === 'cat_drinks')?.items || []),
                                                ...(menuData.find(c => c.id === 'cat_alcohol')?.items || [])
                                            ]}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 pb-24 animate-in fade-in slide-in-from-bottom-8 duration-500" key={activeCategory?.id}>
                        {(() => {
                            const category = menuData.find(c => c.id === activeCategory.id);
                            if (!category || category.items.length === 0) {
                                return (
                                    <div className="col-span-full text-center py-20 text-white/40">
                                        <p className="text-2xl font-black italic">NESSUN PRODOTTO DISPONIBILE</p>
                                    </div>
                                );
                            }
                            return category.items.map(product => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onAdd={addToCart}
                                    availableIngredients={ingredientsMap}
                                    availableDrinks={[
                                        ...(menuData.find(c => c.id === 'cat_drinks')?.items || []),
                                        ...(menuData.find(c => c.id === 'cat_alcohol')?.items || [])
                                    ]}
                                />
                            ));
                        })()}
                    </div>
                )}
            </div>

            <AllergensLegend />
        </div>
    );
};
