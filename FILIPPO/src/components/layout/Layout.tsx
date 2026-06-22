import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen flex flex-col bg-white text-brand-dark">
            <Header />
            <main className="flex-grow pt-20">
                {children}
            </main>
            <Footer />
        </div>
    );
};
