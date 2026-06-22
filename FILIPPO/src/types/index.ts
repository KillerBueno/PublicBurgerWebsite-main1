export type GiornoSettimana = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Domenica

export interface FasciaOraria {
    open: string;
    close: string;
}

export interface OrariApertura {
    [key: number]: FasciaOraria[];
}

export interface Ingrediente {
    id: string;
    nome: string; // Mapped from 'name'
    prezzo: number; // Mapped from 'price' (DB column price)
    category?: string;
}

export type CategoriaProdotto = 'hamburger' | 'fritti' | 'bibite' | 'alcolici' | 'dolci';
export type Allergene = 'glutine' | 'lattosio' | 'uova' | 'frutta_guscio' | 'soia' | 'pesce' | 'arachidi' | 'sedano' | 'senape' | 'sesamo' | 'solfiti';

export interface Prodotto {
    id: string;
    nome: string;
    descrizione: string;
    prezzo: number;
    categoria: CategoriaProdotto;
    immagine: string;
    ingredienti: string[];
    allergeni: Allergene[];
    personalizzabile: boolean;
    opzioniCarne: boolean;
    opzioneMenu: boolean;
    is_available?: boolean;
    category_id?: string;
}

export interface ApiCategory {
    id: string;
    name: string;
    sort_order?: number;
    items: Prodotto[];
}

export interface MenuResponse {
    categories: ApiCategory[];
    ingredients: any[];
}

export interface ElementoCarrello {
    cartId: string;
    prodottoId: string;
    nome: string;
    prezzo: number;
    quantita: number;
    ingredientiAggiunti: string[];
    ingredientiRimossi: string[];
    isMenu: boolean;
    bibitaMenu?: string;
}

export interface DatiUtente {
    nome: string;
    cognome: string;
    telefono: string;
    tipoOrdine: 'asporto' | 'domicilio';
    indirizzo?: string;
    linkMappa?: string;
    orarioOrdine: string;
    metodoPagamento: 'contanti' | 'carta';
}

export type UserRole = 'user' | 'staff' | 'rider' | 'owner' | 'dev';

export interface User {
    id: string;
    email: string;
    name: string;
    surname?: string;
    phone?: string;
    role: UserRole;
    latitude?: number;
    longitude?: number;
    created_at?: string;
}

export interface AppConfig {
    restaurantName: string;
    phone: string;
    googleMapsApiKey: string;
    location: string;
    description: string;
    openingHours: OrariApertura;
    socials: {
        instagram: string;
        facebook: string;
    };
    isManualClosed?: boolean;
    isMaintenanceMode?: boolean;
    addonPriceDouble?: number;
    addonPriceTriple?: number;
    addonPriceMenu?: number;
    addonPriceAlcohol?: number;
}

