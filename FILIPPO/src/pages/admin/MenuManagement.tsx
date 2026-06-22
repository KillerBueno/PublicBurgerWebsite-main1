import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Plus, Edit2, Trash2, Check, X, Loader2, Image as ImageIcon, Search, Save, Info, Package, ChevronRight, Eye, EyeOff } from 'lucide-react';
import clsx from 'clsx';

const ALLERGENS_LIST = ['Glutine', 'Lattosio', 'Uova', 'Frutta a guscio', 'Senape'];

export const MenuManagement: React.FC = () => {
    const [menu, setMenu] = useState<any[]>([]);
    const [allIngredients, setAllIngredients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [formLoading, setFormLoading] = useState(false);

    const initialFormState = {
        name: '',
        description: '',
        price: 0,
        category_id: '',
        image_url: '',
        is_available: 1,
        ingredients: [] as string[],
        allergens: [] as string[]
    };

    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        if (editingProduct || isCreating) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [editingProduct, isCreating]);

    const fetchMenu = async () => {
        try {
            const data = await api.getMenu();
            setMenu(Array.isArray(data.categories) ? data.categories : []);
            setAllIngredients(Array.isArray(data.ingredients) ? data.ingredients : []);

            if (data.categories?.length > 0 && !formData.category_id) {
                setFormData(prev => ({ ...prev, category_id: data.categories[0].id }));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMenu();
    }, []);

    const handleEditClick = (product: any) => {
        setEditingProduct(product);
        setFormData({
            name: product.name || product.nome || '',
            description: product.description || product.descrizione || '',
            price: product.price || 0,
            category_id: product.category_id,
            image_url: product.image_url || product.immagine || '',
            is_available: product.is_available ? 1 : 0,
            ingredients: product.ingredienti || [],
            allergens: product.allergeni || []
        });
    };

    const handleCreateClick = () => {
        setIsCreating(true);
        setFormData({ ...initialFormState, category_id: menu[0]?.id || '' });
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            if (isCreating) {
                await api.createProduct(formData);
            } else {
                await api.updateProduct(editingProduct.id, formData);
            }
            await fetchMenu();
            setEditingProduct(null);
            setIsCreating(false);
        } catch (err) {
            alert("Errore nel salvataggio");
        } finally {
            setFormLoading(false);
        }
    };

    const toggleAvailability = async (product: any) => {
        try {
            await api.updateProduct(product.id, {
                ...product,
                name: product.name || product.nome,
                description: product.description || product.descrizione,
                is_available: !product.is_available,
                ingredients: product.ingredienti,
                allergens: product.allergeni
            });
            fetchMenu();
        } catch (err) {
            alert("Errore nell'aggiornamento");
        }
    };

    const deleteProduct = async (id: string) => {
        if (!confirm("Sei sicuro di voler eliminare questo prodotto?")) return;
        try {
            await api.deleteProduct(id);
            fetchMenu();
        } catch (err) {
            alert("Errore nell'eliminazione");
        }
    };

    const toggleIngredient = (id: string) => {
        setFormData(prev => {
            const ingredients = prev.ingredients.includes(id)
                ? prev.ingredients.filter(i => i !== id)
                : [...prev.ingredients, id];
            return { ...prev, ingredients };
        });
    };

    const toggleAllergen = (name: string) => {
        setFormData(prev => {
            const exists = prev.allergens.some(a => a.toLowerCase() === name.toLowerCase());
            const allergens = exists
                ? prev.allergens.filter(a => a.toLowerCase() !== name.toLowerCase())
                : [...prev.allergens, name];
            return { ...prev, allergens };
        });
    };

    if (loading) return <div className="flex justify-center py-40"><Loader2 className="animate-spin text-brand-yellow" size={48} /></div>;

    const filteredMenu = menu.map(cat => ({
        ...cat,
        items: (Array.isArray(cat.items) ? cat.items : []).filter((p: any) =>
            (p.name || p.nome || '').toLowerCase().includes(search.toLowerCase()) ||
            cat.name.toLowerCase().includes(search.toLowerCase())
        )
    })).filter(cat => cat.items.length > 0 || search === '');

    return (
        <div className="space-y-12 animate-in fade-in duration-700 pb-20">
            {/* Header section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter">
                        Archivio <span className="text-brand-yellow">Menu</span>
                    </h1>
                    <p className="text-white/40 font-bold uppercase tracking-widest text-[10px] mt-2 tracking-[0.2em]">
                        Controllo catalogo prodotti, ingredienti e disponibilità
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-brand-yellow/5 blur rounded-xl"></div>
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                        <input
                            type="text"
                            placeholder="CERCA PRODOTTO..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="relative bg-black/40 border border-white/5 p-4 pl-10 outline-none focus:border-brand-yellow transition-all font-black uppercase italic text-xs w-full sm:w-64 backdrop-blur-md rounded-xl"
                        />
                    </div>
                    <button
                        onClick={handleCreateClick}
                        className="bg-brand-yellow text-black px-8 py-4 font-black uppercase italic tracking-widest flex items-center justify-center gap-3 hover:bg-white hover:scale-105 active:scale-95 transition-all text-xs rounded-xl shadow-[0_0_20px_rgba(255,242,0,0.2)]"
                    >
                        <Plus size={18} />
                        Nuovo Prodotto
                    </button>
                </div>
            </div>

            {/* Menu Grid by Category */}
            <div className="space-y-20">
                {filteredMenu.map((category) => (
                    <section key={category.id} className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-4 group">
                            <div className="h-8 w-2 bg-brand-pink shadow-[0_0_15px_rgba(237,56,149,0.5)]"></div>
                            <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">
                                {category.name}
                            </h2>
                            <div className="h-px flex-1 bg-white/5"></div>
                            <span className="text-[10px] font-black uppercase text-white/20 tracking-widest">
                                {category.items?.length || 0} ITEMS
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                            {category.items?.map((product: any) => (
                                <div key={product.id} className={clsx(
                                    "bg-black/40 border transition-all group overflow-hidden rounded-3xl backdrop-blur-md flex flex-col h-full",
                                    product.is_available ? "border-white/5 hover:border-white/20 shadow-xl" : "border-red-900/20 opacity-60 grayscale-[0.5]"
                                )}>
                                    {/* Product Image Stage */}
                                    <div className="h-48 bg-neutral-900 relative overflow-hidden flex items-center justify-center border-b border-white/5">
                                        {(product.image_url || product.immagine) ? (
                                            <img src={product.image_url || product.immagine} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                        ) : (
                                            <div className="flex flex-col items-center gap-3 text-white/10 italic">
                                                <ImageIcon size={48} />
                                                <span className="text-[10px] uppercase font-black">No Image</span>
                                            </div>
                                        )}
                                        {/* Availability Overlays */}
                                        <div className="absolute top-4 left-4">
                                            {!product.is_available && (
                                                <div className="bg-red-500 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 shadow-2xl">
                                                    <EyeOff size={12} /> Offline
                                                </div>
                                            )}
                                        </div>
                                        <div className="absolute top-4 right-4 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                            <button
                                                onClick={() => toggleAvailability(product)}
                                                className={clsx(
                                                    "w-10 h-10 rounded-xl shadow-2xl flex items-center justify-center transition-all border",
                                                    product.is_available ? "bg-black/80 text-brand-yellow border-white/10 hover:bg-brand-yellow hover:text-black" : "bg-red-600 text-white border-red-400"
                                                )}
                                            >
                                                {product.is_available ? <Eye size={20} /> : <EyeOff size={20} />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Product Content */}
                                    <div className="p-8 flex flex-col flex-1">
                                        <div className="flex justify-between items-start gap-4 mb-4">
                                            <div className="min-w-0">
                                                <h4 className="text-xl font-black uppercase italic tracking-tighter text-white truncate group-hover:text-brand-yellow transition-colors">{product.name || product.nome}</h4>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {(product.ingredienti || []).slice(0, 3).map((ingId: string) => (
                                                        <span key={ingId} className="text-[9px] bg-white/5 px-2 py-0.5 text-white/40 uppercase font-black border border-white/5">
                                                            {allIngredients.find(i => i.id === ingId)?.name || ingId}
                                                        </span>
                                                    ))}
                                                    {(product.ingredienti?.length > 3) && <span className="text-[10px] text-white/20 font-black">...</span>}
                                                </div>
                                            </div>
                                            <div className="bg-brand-yellow/10 border border-brand-yellow/20 px-3 py-1 rounded-lg">
                                                <span className="font-mono text-brand-yellow font-black text-sm">€{Number(product.price || product.prezzo || 0).toFixed(2)}</span>
                                            </div>
                                        </div>

                                        <p className="text-white/30 text-xs italic line-clamp-2 mb-6 flex-1">
                                            {product.description || product.descrizione || "Nessuna descrizione disponibile per questo prodotto."}
                                        </p>

                                        {/* Actions */}
                                        <div className="flex justify-between items-center pt-6 border-t border-white/5">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleEditClick(product)}
                                                    className="w-10 h-10 flex items-center justify-center text-white/40 hover:text-brand-blue hover:bg-brand-blue/10 rounded-xl transition-all"
                                                    title="Modifica"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => deleteProduct(product.id)}
                                                    className="w-10 h-10 flex items-center justify-center text-white/40 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                                    title="Elimina"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[8px] font-black uppercase text-white/10 tracking-widest">{product.id.split('-')[0]}</span>
                                                <ChevronRight size={14} className="text-white/10" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                ))}
            </div>

            {/* Modal Edit/Create - Refined for premium look */}
            {(editingProduct || isCreating) && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[100] flex items-center justify-center p-4">
                    <div className="bg-neutral-950 border border-white/5 w-full max-w-5xl rounded-[2rem] p-8 md:p-12 space-y-10 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar relative overflow-x-hidden">
                        {/* Background Glow in Modal */}
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-yellow/10 blur-[100px] rounded-full pointer-events-none"></div>

                        <div className="flex justify-between items-center relative z-10">
                            <div>
                                <h3 className="text-4xl font-black uppercase italic tracking-tighter">
                                    {isCreating ? 'Nuovo' : 'Scheda'} <span className="text-brand-yellow">Prodotto</span>
                                </h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mt-1 italic">Inserisci i dettagli del prodotto per il menu</p>
                            </div>
                            <button onClick={() => { setEditingProduct(null); setIsCreating(false); }} className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-2xl hover:bg-white/10 transition-all text-white/40 hover:text-white">
                                <X size={32} />
                            </button>
                        </div>

                        <form onSubmit={handleFormSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
                            {/* Left: General Info */}
                            <div className="lg:col-span-8 space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] uppercase font-black tracking-widest text-white/30 flex items-center gap-2">
                                        <Package size={12} className="text-brand-pink" /> Nome del Prodotto
                                    </label>
                                    <input
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none focus:border-brand-yellow focus:bg-white/10 transition-all font-black uppercase italic text-lg"
                                        placeholder="ES: CHEESEBURGER ROYAL"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] uppercase font-black tracking-widest text-white/30">Prezzo di Listino (€)</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                step="0.01"
                                                required
                                                value={formData.price}
                                                onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                                                className="w-full bg-white/5 border border-white/10 p-5 pl-12 rounded-2xl outline-none focus:border-brand-yellow transition-all font-mono font-black text-xl"
                                            />
                                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-yellow font-black">€</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] uppercase font-black tracking-widest text-white/30">Categoria Appartenenza</label>
                                        <select
                                            value={formData.category_id}
                                            onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none focus:border-brand-yellow transition-all font-black uppercase italic appearance-none cursor-pointer"
                                        >
                                            {menu.map(cat => (
                                                <option key={cat.id} value={cat.id} className="bg-neutral-900 text-white">{cat.name.toUpperCase()}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] uppercase font-black tracking-widest text-white/30">URL Immagine (CDN/S3)</label>
                                    <input
                                        value={formData.image_url}
                                        onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                                        placeholder="https://images.unsplash.com/..."
                                        className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none focus:border-brand-yellow transition-all font-mono text-xs text-white/60"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] uppercase font-black tracking-widest text-white/30">Descrizione del Gusto</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        rows={4}
                                        className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none focus:border-brand-yellow transition-all font-bold uppercase italic text-sm resize-none"
                                        placeholder="RACCONTA IL PRODOTTO AI CLIENTI..."
                                    />
                                </div>
                            </div>

                            {/* Right: Options & Logic */}
                            <div className="lg:col-span-4 space-y-8">
                                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6">
                                    {/* Ingredients - Only for BURGERS */}
                                    {(() => {
                                        const selectedCategory = menu.find(cat => cat.id === formData.category_id);
                                        const isBurgerCategory = selectedCategory?.name?.toUpperCase() === 'BURGERS';
                                        const categoryName = selectedCategory?.name?.toUpperCase();
                                        const needsAllergens = categoryName === 'BURGERS' || categoryName === 'FRITTI' || categoryName === 'ALCOLICI';

                                        return (
                                            <>
                                                {isBurgerCategory && (
                                                    <div className="space-y-4">
                                                        <label className="text-[10px] uppercase font-black tracking-widest text-white/30 flex items-center gap-2">
                                                            <Info size={12} className="text-brand-blue" /> Componi Ingredienti
                                                        </label>
                                                        <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                                            {allIngredients.map(ing => (
                                                                <button
                                                                    key={ing.id}
                                                                    type="button"
                                                                    onClick={() => toggleIngredient(ing.id)}
                                                                    className={clsx(
                                                                        "p-3 text-[10px] font-black uppercase text-left transition-all rounded-xl border flex items-center justify-between group",
                                                                        formData.ingredients.includes(ing.id)
                                                                            ? "bg-brand-blue/20 text-brand-blue border-brand-blue/50"
                                                                            : "bg-black/40 text-white/40 border-white/5 hover:border-white/20"
                                                                    )}
                                                                >
                                                                    {ing.name}
                                                                    {formData.ingredients.includes(ing.id) ? <Check size={14} /> : <Plus size={14} className="opacity-0 group-hover:opacity-100" />}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Allergens - For BURGERS and FRITTI */}
                                                {needsAllergens && (
                                                    <div className={clsx("space-y-4", isBurgerCategory && "pt-6 border-t border-white/10")}>
                                                        <label className="text-[10px] uppercase font-black tracking-widest text-white/30 flex items-center gap-2">
                                                            <Info size={12} className="text-brand-pink" /> Allergeni
                                                        </label>
                                                        <div className="flex flex-wrap gap-2">
                                                            {ALLERGENS_LIST.map(allergen => (
                                                                <button
                                                                    key={allergen}
                                                                    type="button"
                                                                    onClick={() => toggleAllergen(allergen)}
                                                                    className={clsx(
                                                                        "px-4 py-2 text-[9px] font-black uppercase transition-all border rounded-full",
                                                                        formData.allergens.some(a => a.toLowerCase() === allergen.toLowerCase())
                                                                            ? "bg-brand-pink text-white border-brand-pink shadow-[0_0_10px_rgba(237,56,149,0.3)]"
                                                                            : "bg-white/5 text-white/20 border-white/5 hover:border-white/20"
                                                                    )}
                                                                >
                                                                    {allergen}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>

                                {/* Status Switch */}
                                <div className="bg-black/40 border border-white/10 rounded-3xl p-6 flex flex-col gap-4">
                                    <label className="text-[10px] uppercase font-black tracking-widest text-white/30">Visibilità Menu</label>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(p => ({ ...p, is_available: p.is_available ? 0 : 1 }))}
                                        className={clsx(
                                            "w-full py-4 rounded-2xl font-black uppercase italic text-xs tracking-widest transition-all flex items-center justify-center gap-3",
                                            formData.is_available ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
                                        )}
                                    >
                                        {formData.is_available ? <><Eye size={16} /> Online sul sito</> : <><EyeOff size={16} /> Nascosto / Esaurito</>}
                                    </button>
                                </div>
                            </div>

                            {/* Sticky Footer for Modal */}
                            <div className="lg:col-span-12 flex flex-col sm:flex-row justify-end gap-4 pt-10 border-t border-white/5">
                                <button
                                    type="button"
                                    onClick={() => { setEditingProduct(null); setIsCreating(false); }}
                                    className="px-8 py-5 rounded-2xl font-black uppercase italic hover:bg-white/5 text-white/40 hover:text-white transition-all text-xs tracking-widest"
                                >
                                    Esci senza salvare
                                </button>
                                <button
                                    type="submit"
                                    disabled={formLoading}
                                    className="px-16 py-5 bg-brand-yellow text-black font-black uppercase italic tracking-widest rounded-2xl shadow-[0_0_30px_rgba(255,242,0,0.3)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 text-base flex items-center justify-center gap-4"
                                >
                                    {formLoading ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
                                    {isCreating ? 'PUBBLICA PRODOTTO' : 'SALVA MODIFICHE'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
