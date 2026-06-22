import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star } from 'lucide-react';

const testimonials = [
    {
        text: "I burger migliori che abbia mai mangiato a Roma. Ingredienti freschissimi e un sapore unico. Ci torno ogni settimana.",
        author: "Marco R.",
        rating: 5,
    },
    {
        text: "Finalmente un posto dove si capisce la differenza tra un hamburger vero e uno qualunque. Consigliatissimo.",
        author: "Sofia L.",
        rating: 5,
    },
    {
        text: "Patatine croccantissime, panino morbido, carne perfetta. Il servizio è gentilissimo. Semplicemente perfetto.",
        author: "Davide M.",
        rating: 5,
    },
    {
        text: "Qualità degli ingredienti fuori dal comune. Si sente che usano solo il meglio. Il mio posto preferito in assoluto.",
        author: "Alessia T.",
        rating: 5,
    },
    {
        text: "Non sapevo che un burger potesse essere così buono. Ci sono tornato tre volte in due settimane.",
        author: "Luca F.",
        rating: 5,
    },
];

export const HomePage: React.FC = () => {
    return (
        <div className="flex flex-col">
            {/* Hero */}
            <section className="min-h-[85vh] flex flex-col items-center justify-center text-center px-6 py-24 bg-white">
                <p className="text-sm font-semibold tracking-widest text-brand-muted uppercase mb-6">
                    Hamburger Gourmet
                </p>
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-brand-dark leading-tight max-w-4xl mb-8">
                    La formula magica<br />è la semplicità.
                </h1>
                <p className="text-lg md:text-xl text-brand-muted max-w-xl mx-auto mb-12 leading-relaxed font-normal">
                    Dentro ogni panino, solo quello che serve davvero.
                    Ingredienti di alta qualità, niente di più, niente di meno.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <Link to="/menu" className="btn-primary flex items-center gap-2 group">
                        Scopri il Menu
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <a href="#filosofia" className="btn-outline">
                        Chi Siamo
                    </a>
                </div>
            </section>

            {/* Divider line */}
            <div className="w-full h-px bg-brand-border" />

            {/* Burger Showcase */}
            <section className="py-24 px-6 bg-brand-cream">
                <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
                    <div>
                        <p className="text-xs font-bold tracking-widest text-brand-red uppercase mb-4">Il Nostro Signature</p>
                        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-brand-dark leading-tight mb-6">
                            Smash Burger.<br />Nient'altro.
                        </h2>
                        <p className="text-brand-muted leading-relaxed mb-8">
                            Carne schiacciata al momento su piastra caldissima, una crosta croccante fuori e
                            succosa dentro. Il pane è morbido, gli ingredienti freschi.
                            Nessun fronzolo, solo il gusto che conta.
                        </p>
                        <Link to="/menu" className="btn-primary inline-flex items-center gap-2 group">
                            Vedi il Menu Completo
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                    <div className="aspect-square bg-brand-border/30 flex items-center justify-center rounded-sm overflow-hidden">
                        <div className="text-9xl select-none">🍔</div>
                    </div>
                </div>
            </section>

            {/* Philosophy */}
            <section id="filosofia" className="py-24 px-6 bg-white">
                <div className="max-w-3xl mx-auto text-center">
                    <p className="text-xs font-bold tracking-widest text-brand-red uppercase mb-6">La Nostra Filosofia</p>
                    <blockquote className="text-3xl md:text-4xl font-bold tracking-tight text-brand-dark leading-snug mb-8">
                        "Niente di più di quello che è necessario."
                    </blockquote>
                    <p className="text-brand-muted text-lg leading-relaxed">
                        Crediamo che la qualità si veda nella semplicità. Ogni ingrediente nel nostro burger è lì
                        per un motivo. Nessun riempitivo, nessuna scorciatoia. Solo prodotti scelti con cura
                        e passione per quello che facciamo ogni giorno.
                    </p>
                </div>
            </section>

            {/* Divider */}
            <div className="w-full h-px bg-brand-border" />

            {/* Testimonials */}
            <section className="py-24 px-6 bg-brand-cream">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <p className="text-xs font-bold tracking-widest text-brand-red uppercase mb-4">Recensioni</p>
                        <h2 className="text-4xl font-bold tracking-tight text-brand-dark">Cosa dicono di noi</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {testimonials.slice(0, 3).map((t, i) => (
                            <div key={i} className="bg-white p-8 border border-brand-border">
                                <div className="flex gap-1 mb-4">
                                    {Array.from({ length: t.rating }).map((_, j) => (
                                        <Star key={j} size={14} className="fill-brand-red text-brand-red" />
                                    ))}
                                </div>
                                <p className="text-brand-dark leading-relaxed mb-6 text-[15px]">"{t.text}"</p>
                                <p className="text-sm font-semibold text-brand-muted">{t.author}</p>
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 max-w-2xl mx-auto">
                        {testimonials.slice(3).map((t, i) => (
                            <div key={i} className="bg-white p-8 border border-brand-border">
                                <div className="flex gap-1 mb-4">
                                    {Array.from({ length: t.rating }).map((_, j) => (
                                        <Star key={j} size={14} className="fill-brand-red text-brand-red" />
                                    ))}
                                </div>
                                <p className="text-brand-dark leading-relaxed mb-6 text-[15px]">"{t.text}"</p>
                                <p className="text-sm font-semibold text-brand-muted">{t.author}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Bottom */}
            <section className="py-24 px-6 bg-brand-dark text-white text-center">
                <p className="text-xs font-bold tracking-widest text-white/40 uppercase mb-6">Ordina Adesso</p>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-8">
                    Pronto per il tuo<br />burger perfetto?
                </h2>
                <Link to="/menu" className="inline-flex items-center gap-2 bg-white text-brand-dark px-8 py-4 font-semibold hover:bg-brand-red hover:text-white transition-colors duration-300 group">
                    Ordina Ora
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
            </section>
        </div>
    );
};
