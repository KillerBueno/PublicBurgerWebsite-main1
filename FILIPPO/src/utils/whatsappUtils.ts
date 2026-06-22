import type { ElementoCarrello, DatiUtente } from '../types';

export const generateWhatsAppLink = (phoneNumber: string, items: ElementoCarrello[], total: number, details: DatiUtente) => {
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');

    let message = `*ORDINE PUBLIC BURGER*\n`;
    message += `--------------------------------\n`;

    items.forEach(item => {
        message += `• ${item.quantita}x ${item.nome} (€ ${(item.prezzo * item.quantita).toFixed(2)})\n`;
        if (item.ingredientiAggiunti.length > 0) {
            message += `  + Extra: ${item.ingredientiAggiunti.join(', ')}\n`;
        }
        if (item.ingredientiRimossi.length > 0) {
            message += `  - No: ${item.ingredientiRimossi.join(', ')}\n`;
        }
        if (item.isMenu) {
            message += `  (MENU con Patatine e ${item.bibitaMenu})\n`;
        }
        message += `\n`;
    });

    message += `--------------------------------\n`;
    message += `*TOTALE: € ${total.toFixed(2)}*\n\n`;

    message += `*DATI CLIENTE*\n`;
    message += `Nome: ${details.nome} ${details.cognome}\n`;
    message += `Telefono: ${details.telefono}\n`;
    message += `Modalità: ${details.tipoOrdine === 'domicilio' ? 'CONSEGNA A DOMICILIO' : 'ASPORTO'}\n`;
    message += `Orario Richiesto: ${details.orarioOrdine || 'Non specificato'}\n`;

    if (details.tipoOrdine === 'domicilio') {
        message += `Indirizzo: ${details.indirizzo}\n`;
        if (details.linkMappa) {
            message += `Posizione: ${details.linkMappa}\n`;
        }
    }

    message += `Pagamento: ${details.metodoPagamento === 'contanti' ? 'Contanti' : 'Carta'}\n`;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
};
