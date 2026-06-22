import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Prodotto, ElementoCarrello, Allergene, Ingrediente } from '../../types';
import { Plus, Minus, Check, X, ArrowLeft, Wheat, Milk, Egg, Nut, Fish, Bean, Flame, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import { v4 as uuidv4 } from 'uuid';
import { useConfig } from '../../context/ConfigContext';

const AllergenIcon = ({ type }: { type: Allergene }) => {
    switch (type) {
        case 'glutine': return <Wheat size={14} />;
        case 'lattosio': return <Milk size={14} />;
        case 'uova': return <Egg size={14} />;
        case 'frutta_guscio': return <Nut size={14} />;
        case 'pesce': return <Fish size={14} />;
        case 'soia': return <Bean size={14} />;
        case 'senape': return <Flame size={14} />;
        default: return <AlertCircle size={14} />;
    }
};

interface ProductCardProps {
    product: Prodotto;
    onAdd: (item: ElementoCarrello) => void;
    availableIngredients: Record<string, Ingrediente>;
    availableDrinks?: Prodotto[];
}

type Step = 'initial' | 'patty_selection' | 'meal_selection' | 'base_ingredients' | 'extra_ingredients' | 'sauces' | 'drink_selection' | 'quantity_selection' | 'completed';

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAdd, availableIngredients, availableDrinks = [] }) => {
    const { config } = useConfig();
    const [step, setStep] = useState<Step>('initial');
    const [isInView, setIsInView] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    // Burger State
    const [numeroPatty, setNumeroPatty] = useState(1);
    const [isMenu, setIsMenu] = useState(false);

    // Customization State
    const [ingredientiRimossi, setIngredientiRimossi] = useState<string[]>([]);
    const [ingredientiAggiunti, setIngredientiAggiunti] = useState<string[]>([]);
    const [bibitaMenu, setBibitaMenu] = useState<string>('');
    const [quantita, setQuantita] = useState(1);

    const ingredientiBase = useMemo(() => product.ingredienti || [], [product]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                // Check if device supports hover (desktop) or not (mobile)
                const isMobile = window.matchMedia('(hover: none)').matches;
                if (isMobile) {
                    setIsInView(entry.isIntersecting);
                }
            },
            { threshold: 0.8 } // Attiva quando l'80% della card è visibile
        );

        if (cardRef.current) {
            observer.observe(cardRef.current);
        }

        return () => {
            if (cardRef.current) {
                observer.unobserve(cardRef.current);
            }
        };
    }, []);

    // Reset state when entering initial step
    const resetState = () => {
        setStep('initial');
        setNumeroPatty(1);
        setIsMenu(false);
        setIngredientiRimossi([]);
        setIngredientiAggiunti([]);
        setBibitaMenu('');
        setQuantita(1);
    };

    const prezzoAttuale = useMemo(() => {
        let prezzo = product.prezzo;

        // Use global pricing from config for patty upgrades
        if (numeroPatty === 2) {
            prezzo += (config?.addonPriceDouble ?? 3.00);
        }
        if (numeroPatty === 3) {
            prezzo += (config?.addonPriceTriple ?? 5.00);
        }

        ingredientiAggiunti.forEach(id => {
            const ing = availableIngredients[id];
            if (ing) prezzo += ing.prezzo;
        });

        if (isMenu) {
            prezzo += (config?.addonPriceMenu ?? 3.50);
            const selectedDrink = availableDrinks.find(d => d.nome === bibitaMenu);
            if (selectedDrink?.category_id === 'cat_alcohol') {
                prezzo += (config?.addonPriceAlcohol ?? 1.00);
            }
        }
        return prezzo;
    }, [product, numeroPatty, ingredientiAggiunti, isMenu, availableIngredients, bibitaMenu, availableDrinks, config]);

    const nomeFinale = useMemo(() => {
        let nome = product.nome;
        if (numeroPatty === 2) nome = "Double " + nome;
        if (numeroPatty === 3) nome = "Triple " + nome;
        return nome;
    }, [product.nome, numeroPatty]);

    const handleAddToCart = (e: React.MouseEvent) => {
        e.stopPropagation();
        // Resolve ingredient IDs to display names
        const nomiAggiunti = ingredientiAggiunti.map(id => availableIngredients[id]?.nome || id);
        const nomiRimossi = ingredientiRimossi.map(id => availableIngredients[id]?.nome || id);
        const item: ElementoCarrello = {
            cartId: uuidv4(),
            prodottoId: product.id,
            nome: nomeFinale,
            prezzo: prezzoAttuale,
            quantita: quantita,
            ingredientiAggiunti: nomiAggiunti,
            ingredientiRimossi: nomiRimossi,
            isMenu,
            bibitaMenu
        };
        onAdd(item);
        setStep('completed');
        setTimeout(() => {
            resetState();
        }, 1500);
    };

    const toggleRimuoviIngrediente = (id: string) => {
        if (ingredientiRimossi.includes(id)) {
            setIngredientiRimossi(prev => prev.filter(i => i !== id));
        } else {
            setIngredientiRimossi(prev => [...prev, id]);
        }
    };

    const toggleAggiungiIngrediente = (id: string) => {
        if (ingredientiAggiunti.includes(id)) {
            setIngredientiAggiunti(prev => prev.filter(i => i !== id));
        } else {
            setIngredientiAggiunti(prev => [...prev, id]);
        }
    };

    const handleStartOrder = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (product.categoria === 'hamburger' && product.personalizzabile) {
            // Start customization flow
            if (product.opzioniCarne) {
                setStep('patty_selection');
            } else {
                setStep('meal_selection');
            }
        } else {
            // Direct quantity selection for simple items
            setStep('quantity_selection');
        }
    };

    const handlePattySelection = (size: number) => {
        setNumeroPatty(size);
        setStep('meal_selection');
    };

    const handleMealSelection = (menu: boolean) => {
        setIsMenu(menu);
        // If it's a burger and has base ingredients, step removal. Otherwise extra step.
        // Also check if customization is allowed.
        if (product.personalizzabile && ingredientiBase.length > 0) {
            setStep('base_ingredients');
        } else if (product.personalizzabile) {
            setStep('extra_ingredients');
        } else {
            // Should not really happen if logic above is correct, but safe fallback
            setStep('quantity_selection');
        }
    };


    // Render Logic
    const renderContent = () => {
        switch (step) {
            case 'initial':
                return (
                    <>
                        <div className="aspect-video w-full overflow-hidden relative border-b-2 border-white/10 group-hover:border-brand-yellow transition-colors shrink-0">
                            <img
                                src={product.immagine}
                                alt={product.nome}
                                className={clsx(
                                    "w-full h-full object-cover transition-transform duration-500",
                                    isInView ? "grayscale-0 scale-110" : "grayscale group-hover:grayscale-0 group-hover:scale-110"
                                )}
                            />
                            <div className={clsx(
                                "absolute inset-0 transition-colors",
                                isInView ? "bg-transparent" : "bg-premium-dark/40 group-hover:bg-transparent"
                            )}></div>
                            <div className="absolute bottom-4 right-4 bg-brand-pink text-white font-black px-3 py-1 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
                                € {product.prezzo.toFixed(2)}
                            </div>
                        </div>
                        <div className="p-6 flex flex-col flex-1">
                            <div className="flex justify-between items-center mb-2 gap-2">
                                <h3 className={clsx(
                                    "text-lg md:text-2xl font-black uppercase italic transition-colors leading-tight flex-1 min-w-0 pr-2",
                                    isInView ? "text-brand-yellow" : "text-white group-hover:text-brand-yellow"
                                )}>{product.nome}</h3>
                                {product.allergeni && product.allergeni.length > 0 && (
                                    <div className="flex gap-1.5 flex-wrap justify-end shrink-0 -mr-2">
                                        {product.allergeni.map(a => (
                                            <div key={a} className="bg-white/10 p-1 rounded-full text-white/80 hover:bg-white/20 hover:text-white transition-colors" title={a}>
                                                <AllergenIcon type={a} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <p className="text-white/60 text-sm line-clamp-2 mb-6 font-medium">{product.descrizione}</p>
                            <div className="mt-auto">
                                {product.is_available !== false ? (
                                    <button
                                        onClick={handleStartOrder}
                                        className={clsx(
                                            "w-full py-3 border-2 font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer",
                                            isInView
                                                ? "bg-brand-yellow text-black border-brand-yellow"
                                                : "border-white/20 text-white group-hover:bg-brand-yellow group-hover:text-black group-hover:border-brand-yellow hover:!bg-white hover:!text-black hover:!border-white"
                                        )}
                                    >
                                        <Plus size={18} />
                                        Ordina
                                    </button>
                                ) : (
                                    <div className="w-full py-3 border-2 border-red-500/30 bg-red-500/10 text-red-500 font-black uppercase italic text-center text-xs tracking-widest flex items-center justify-center gap-2">
                                        <X size={16} />
                                        Momentaneamente non disponibile
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                );

            case 'patty_selection':
                return (
                    <div className="p-6 flex flex-col h-full animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex items-center justify-between mb-4">
                            <button onClick={() => setStep('initial')} className="text-white/50 hover:text-white transition-colors">
                                <ArrowLeft size={24} />
                            </button>
                            <h3 className="text-xl font-black uppercase italic text-brand-yellow truncate">{product.nome}</h3>
                            <div className="w-6"></div>
                        </div>

                        <div className="flex-1 flex flex-col justify-center gap-3">
                            <h4 className="text-center text-white/80 font-bold uppercase tracking-widest text-sm mb-2">QUANTITÀ DI HAMBURGER</h4>
                            <div className="grid grid-cols-1 gap-2">
                                <button
                                    onClick={() => handlePattySelection(1)}
                                    className="p-4 border-2 border-white/20 hover:border-brand-yellow hover:bg-brand-yellow/10 hover:text-brand-yellow text-white font-black uppercase italic transition-all flex justify-between items-center group/btn"
                                >
                                    <span>Singolo (120g)</span>
                                    <span className="text-xs text-white/40 group-hover/btn:text-brand-yellow/60">Base</span>
                                </button>
                                <button
                                    onClick={() => handlePattySelection(2)}
                                    className="p-4 border-2 border-white/20 hover:border-brand-yellow hover:bg-brand-yellow/10 hover:text-brand-yellow text-white font-black uppercase italic transition-all flex justify-between items-center"
                                >
                                    <span>Doppio (240g)</span>
                                    <span className="text-brand-yellow text-sm">+ € {(config?.addonPriceDouble ?? 3.00).toFixed(2)}</span>
                                </button>
                                <button
                                    onClick={() => handlePattySelection(3)}
                                    className="p-4 border-2 border-white/20 hover:border-brand-yellow hover:bg-brand-yellow/10 hover:text-brand-yellow text-white font-black uppercase italic transition-all flex justify-between items-center"
                                >
                                    <span>Triplo (360g)</span>
                                    <span className="text-brand-yellow text-sm">+ € {(config?.addonPriceTriple ?? 5.00).toFixed(2)}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                );

            case 'meal_selection':
                if (!product.opzioneMenu) {
                    // Skip if no menu option, technically should have forwarded already but handling here too
                    // handleMealSelection(false) -> goes to extra
                    return <div className="p-6">Skipping... {setTimeout(() => handleMealSelection(false), 0) && ""}</div>
                }

                return (
                    <div className="p-6 flex flex-col h-full animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex items-center justify-between mb-4">
                            <button onClick={() => setStep(product.opzioniCarne ? 'patty_selection' : 'initial')} className="text-white/50 hover:text-white transition-colors">
                                <ArrowLeft size={24} />
                            </button>
                            <h3 className="text-xl font-black uppercase italic text-white truncate">{nomeFinale}</h3>
                            <div className="w-6"></div>
                        </div>

                        <div className="flex-1 flex flex-col justify-center gap-3">
                            <button
                                onClick={() => handleMealSelection(false)}
                                className="flex-1 border-2 border-white/20 hover:border-brand-pink hover:bg-brand-pink hover:text-white p-4 flex flex-col items-center justify-center gap-2 transition-all group/btn"
                            >
                                <span className="text-xl font-black uppercase italic">Solo Panino</span>
                                <span className="text-xs font-bold opacity-60 group-hover/btn:opacity-100">Solo il burger</span>
                            </button>

                            <button
                                onClick={() => handleMealSelection(true)}
                                className="flex-1 border-2 border-brand-blue bg-brand-blue/10 hover:bg-brand-blue hover:text-black p-4 flex flex-col items-center justify-center gap-2 transition-all group/btn shadow-[0px_0px_20px_rgba(91,203,245,0.2)]"
                            >
                                <span className="text-xl font-black uppercase italic">Fai Menù?</span>
                                <span className="text-xs font-bold opacity-80 group-hover/btn:opacity-100">+ Patatine e Bibita (€ {(config?.addonPriceMenu ?? 3.50).toFixed(2)})</span>
                            </button>
                        </div>
                    </div>
                );

            case 'base_ingredients':
                return (
                    <div className="p-6 flex flex-col h-full animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                            <button onClick={() => setStep(product.opzioneMenu ? 'meal_selection' : (product.opzioniCarne ? 'patty_selection' : 'initial'))} className="text-white/50 hover:text-white transition-colors">
                                <ArrowLeft size={24} />
                            </button>
                            <h3 className="text-sm font-black uppercase text-white/80">Rimuovi Ingredienti</h3>
                            <div className="w-6"></div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                            <div className="grid grid-cols-1 gap-2">
                                {ingredientiBase.map(id => {
                                    const ing = availableIngredients[id];
                                    if (!ing) return null;
                                    const rimosso = ingredientiRimossi.includes(id);
                                    return (
                                        <button
                                            key={id}
                                            onClick={() => toggleRimuoviIngrediente(id)}
                                            className={clsx(
                                                "flex items-center justify-between px-3 py-3 text-sm font-bold uppercase transition-all border",
                                                rimosso
                                                    ? "bg-red-500/10 text-red-500 border-red-500 opacity-60 decoration-line-through"
                                                    : "bg-transparent text-white border-white/20 hover:border-red-500 hover:text-red-500"
                                            )}
                                        >
                                            <span>{ing.nome}</span>
                                            {rimosso ? <X size={16} /> : <Check size={16} />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <button onClick={() => setStep('extra_ingredients')} className="mt-4 w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold uppercase transition-colors">
                            Avanti
                        </button>
                    </div>
                );

            case 'extra_ingredients':
                return (
                    <div className="p-6 flex flex-col h-full animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                            <button
                                onClick={() => setStep(product.categoria === 'hamburger' && ingredientiBase.length > 0 ? 'base_ingredients' : (product.opzioneMenu ? 'meal_selection' : 'initial'))}
                                className="text-white/50 hover:text-white transition-colors"
                            >
                                <ArrowLeft size={24} />
                            </button>
                            <h3 className="text-sm font-black uppercase text-brand-pink">Aggiungi Extra</h3>
                            <div className="w-6"></div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                            <div className="grid grid-cols-1 gap-2">
                                {Object.values(availableIngredients)
                                    .filter(ing =>
                                        !ingredientiBase.includes(ing.id) &&
                                        ing.category !== 'sauce' // Exclude sauces here
                                    )
                                    .map(ing => {
                                        const aggiunto = ingredientiAggiunti.includes(ing.id);
                                        return (
                                            <button
                                                key={ing.id}
                                                onClick={() => toggleAggiungiIngrediente(ing.id)}
                                                className={clsx(
                                                    "flex items-center justify-between px-3 py-3 text-sm font-bold uppercase transition-all border",
                                                    aggiunto
                                                        ? "bg-brand-pink text-white border-brand-pink"
                                                        : "bg-transparent text-white/50 border-white/10 hover:border-brand-pink hover:text-brand-pink"
                                                )}
                                            >
                                                <span>{ing.nome}</span>
                                                <span>+€{ing.prezzo.toFixed(2)}</span>
                                            </button>
                                        );
                                    })}
                            </div>
                        </div>
                        <button onClick={() => setStep('sauces')} className="mt-4 w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold uppercase transition-colors">
                            Avanti
                        </button>
                    </div>
                );

            case 'sauces':
                return (
                    <div className="p-6 flex flex-col h-full animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                            <button onClick={() => setStep('extra_ingredients')} className="text-white/50 hover:text-white transition-colors">
                                <ArrowLeft size={24} />
                            </button>
                            <h3 className="text-sm font-black uppercase text-brand-yellow">Salse Extra</h3>
                            <div className="w-6"></div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                            <div className="grid grid-cols-1 gap-2">
                                {Object.values(availableIngredients)
                                    .filter(ing =>
                                        !ingredientiBase.includes(ing.id) &&
                                        ing.category === 'sauce' // Only sauces
                                    )
                                    .map(ing => {
                                        const aggiunto = ingredientiAggiunti.includes(ing.id);
                                        return (
                                            <button
                                                key={ing.id}
                                                onClick={() => toggleAggiungiIngrediente(ing.id)}
                                                className={clsx(
                                                    "flex items-center justify-between px-3 py-3 text-sm font-bold uppercase transition-all border",
                                                    aggiunto
                                                        ? "bg-brand-yellow text-black border-brand-yellow"
                                                        : "bg-transparent text-white/50 border-white/10 hover:border-brand-yellow hover:text-brand-yellow"
                                                )}
                                            >
                                                <span>{ing.nome}</span>
                                                <span>+€{ing.prezzo.toFixed(2)}</span>
                                            </button>
                                        );
                                    })}
                            </div>
                        </div>

                        {/* If it's a menu, NEXT goes to drinks. If not, this is the end. */}
                        {isMenu ? (
                            <button onClick={() => setStep('drink_selection')} className="mt-4 w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold uppercase transition-colors">
                                Avanti
                            </button>
                        ) : (
                            /* Final Add to Cart for non-menu items */
                            <div className="mt-4 pt-4 border-t border-white/10">
                                <div className="flex items-center justify-between gap-4 mb-3">
                                    <span className="text-xs font-bold text-white/50 uppercase">Quantità</span>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => setQuantita(Math.max(1, quantita - 1))} className="p-1 bg-white/10 hover:bg-white/20 rounded text-white"><Minus size={16} /></button>
                                        <span className="text-lg font-black text-white w-6 text-center">{quantita}</span>
                                        <button onClick={() => setQuantita(quantita + 1)} className="p-1 bg-white/10 hover:bg-white/20 rounded text-white"><Plus size={16} /></button>
                                    </div>
                                </div>
                                <button
                                    onClick={handleAddToCart}
                                    className="w-full bg-brand-yellow text-premium-dark py-4 font-black uppercase tracking-wide hover:bg-white transition-all shadow-[4px_4px_0px_0px_#ed3895] flex items-center justify-between px-4"
                                >
                                    <span>AGGIUNGI</span>
                                    <span>€ {(prezzoAttuale * quantita).toFixed(2)}</span>
                                </button>
                            </div>
                        )}
                    </div>
                );

            case 'drink_selection':
                return (
                    <div className="p-6 flex flex-col h-full animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                            <button onClick={() => setStep('sauces')} className="text-white/50 hover:text-white transition-colors">
                                <ArrowLeft size={24} />
                            </button>
                            <h3 className="text-sm font-black uppercase text-brand-blue">Bibita Menù</h3>
                            <div className="w-6"></div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                            <div className="grid grid-cols-1 gap-2">
                                {availableDrinks.map(d => (
                                    <button
                                        key={d.id}
                                        onClick={() => setBibitaMenu(d.nome)}
                                        className={clsx(
                                            "flex items-center justify-between px-3 py-3 text-xs font-bold uppercase transition-all border text-left",
                                            bibitaMenu === d.nome
                                                ? "bg-brand-blue text-black border-brand-blue shadow-[2px_2px_0px_0px_#fff]"
                                                : "bg-transparent text-white/60 border-white/10 hover:border-brand-blue hover:text-brand-blue"
                                        )}
                                    >
                                        <span>{d.nome}</span>
                                        {d.category_id === 'cat_alcohol' && <span className="text-[10px] opacity-80">+ € 1.00</span>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Final Add to Cart for Menu items */}
                        <div className="mt-4 pt-4 border-t border-white/10">
                            {!bibitaMenu && <p className="text-[10px] text-brand-blue font-bold animate-pulse text-center mb-2">* Seleziona una bibita</p>}
                            <button
                                onClick={handleAddToCart}
                                disabled={!bibitaMenu}
                                className="w-full bg-brand-yellow text-premium-dark py-4 font-black uppercase tracking-wide hover:bg-white transition-all shadow-[4px_4px_0px_0px_#ed3895] flex items-center justify-between px-4 disabled:opacity-50 disabled:grayscale disabled:shadow-none"
                            >
                                <span>AGGIUNGI</span>
                                <span>€ {(prezzoAttuale * quantita).toFixed(2)}</span>
                            </button>
                        </div>
                    </div>
                );

            case 'quantity_selection':
                return (
                    <div className="p-6 flex flex-col h-full animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex items-center justify-between mb-4">
                            <button onClick={() => setStep('initial')} className="text-white/50 hover:text-white transition-colors">
                                <ArrowLeft size={24} />
                            </button>
                            <h3 className="text-xl font-black uppercase italic text-brand-yellow truncate">{product.nome}</h3>
                            <div className="w-6"></div>
                        </div>

                        <div className="flex-1 flex flex-col justify-center items-center gap-6">
                            <span className="text-sm font-bold text-white/50 uppercase">Quantità</span>
                            <div className="flex items-center gap-6">
                                <button onClick={() => setQuantita(Math.max(1, quantita - 1))} className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all active:scale-95"><Minus size={24} /></button>
                                <span className="text-4xl font-black text-white w-12 text-center">{quantita}</span>
                                <button onClick={() => setQuantita(quantita + 1)} className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all active:scale-95"><Plus size={24} /></button>
                            </div>
                        </div>

                        <div className="mt-auto pt-4 border-t border-white/10">
                            <button
                                onClick={handleAddToCart}
                                className="w-full bg-brand-yellow text-premium-dark py-4 font-black uppercase tracking-wide hover:bg-white transition-all shadow-[4px_4px_0px_0px_#ed3895] flex items-center justify-between px-4"
                            >
                                <span>AGGIUNGI</span>
                                <span>€ {(prezzoAttuale * quantita).toFixed(2)}</span>
                            </button>
                        </div>
                    </div>
                );

            case 'completed':
                return (
                    <div className="h-full flex flex-col items-center justify-center animate-in zoom-in fade-in duration-300 p-6 text-center bg-green-500/10">
                        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-[0px_0px_30px_rgba(34,197,94,0.4)] animate-bounce">
                            <Check size={48} className="text-black" strokeWidth={4} />
                        </div>
                        <h3 className="text-3xl font-black uppercase italic text-white mb-2 drop-shadow-md">Aggiunto!</h3>
                        <p className="text-white/80 font-bold text-lg">Il tuo ordine prende gusto!</p>
                    </div>
                );
        }
    };

    return (
        <div ref={cardRef} className="card-pop group cursor-default flex flex-col h-[480px] transition-all duration-300">
            {renderContent()}
        </div>
    );
};
