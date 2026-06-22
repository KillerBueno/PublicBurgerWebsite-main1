import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

import type { User } from '../types';

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (credentials: any) => Promise<void>;
    register: (userData: any) => Promise<void>;
    googleLogin: (idToken: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Carica l'utente iniziale dal localStorage se presente (per persistenza istantanea)
const getInitialUser = (): User | null => {
    try {
        const savedUser = localStorage.getItem('auth_user');
        return savedUser ? JSON.parse(savedUser) : null;
    } catch {
        return null;
    }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(getInitialUser);
    const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const savedToken = localStorage.getItem('auth_token');
            if (!savedToken) {
                setUser(null);
                setLoading(false);
                return;
            }

            try {
                const data = await api.getMe();
                setUser(data.user);
                setToken(savedToken);
                // Aggiorna i dati utente salvati
                localStorage.setItem('auth_user', JSON.stringify(data.user));
            } catch (err: any) {
                console.error('Auth Init Error:', err.message);
                // Logout solo se il token è esplicitamente non valido (401 o 404)
                if (err.status === 401 || err.status === 404) {
                    logout();
                }
            } finally {
                setLoading(false);
            }
        };
        initAuth();
    }, []);

    const login = async (credentials: any) => {
        const data = await api.login(credentials);
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
    };

    const register = async (userData: any) => {
        const data = await api.register(userData);
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
    };

    const googleLogin = async (idToken: string) => {
        const data = await api.googleLogin(idToken);
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, googleLogin, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
