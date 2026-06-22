import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import type { AppConfig } from '../types';

interface ConfigContextType {
    config: AppConfig | null;
    loading: boolean;
    error: string | null;
    refreshConfig: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextType>({
    config: null,
    loading: true,
    error: null,
    refreshConfig: async () => { }
});

export const useConfig = () => useContext(ConfigContext);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [config, setConfig] = useState<AppConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fallbackConfig: AppConfig = {
        restaurantName: "Public Burger",
        phone: "+39 06 0000000",
        googleMapsApiKey: "",
        location: "Roma, Italia",
        description: "Hamburger gourmet fatti con ingredienti freschi e selezionati. Niente di più di quello che serve davvero.",
        openingHours: {
            1: [{ open: "12:00", close: "23:00" }],
            2: [{ open: "12:00", close: "23:00" }],
            3: [{ open: "12:00", close: "23:00" }],
            4: [{ open: "12:00", close: "23:00" }],
            5: [{ open: "12:00", close: "24:00" }],
            6: [{ open: "12:00", close: "24:00" }],
            0: [{ open: "12:00", close: "22:00" }],
        },
        socials: { instagram: "", facebook: "" },
    };

    const fetchConfig = async () => {
        try {
            const data = await api.getConfig();
            setConfig(data);
            setLoading(false);
        } catch (err) {
            console.warn("API non disponibile, uso config locale");
            setConfig(fallbackConfig);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    const refreshConfig = async () => {
        const data = await api.getConfig();
        setConfig(data);
    };

    if (loading) {
        return <div className="min-h-screen bg-black text-white flex items-center justify-center font-bold font-black italic">PUBBLIC BURGER...</div>;
    }

    return (
        <ConfigContext.Provider value={{ config, loading, error, refreshConfig }}>
            {children}
        </ConfigContext.Provider>
    );
};

