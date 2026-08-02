import type { VatLine } from './gestionale';

/** Fattura estratta da un file XML FatturaPA. */
export interface ParsedInvoice {
  fileName: string;
  supplier_name: string;
  supplier_vat: string | null;
  date: string;
  doc_number: string;
  doc_type: string;
  /** Nota di credito: importi registrati in negativo. */
  is_credit_note: boolean;
  taxable: number;
  vat_amount: number;
  total: number;
  vat_lines: VatLine[];
  due_date: string | null;
  payment_method: string | null;
}

export interface ParseError {
  fileName: string;
  message: string;
}

export interface ParseResult {
  invoices: ParsedInvoice[];
  errors: ParseError[];
}

// ─── Helper di lettura XML ────────────────────────────────────────────────────
// FatturaPA usa prefissi di namespace variabili (p:, ns2:, nessuno…):
// getElementsByTagNameNS('*', …) li ignora e cerca per nome locale.

const tags = (root: Element | Document, name: string): Element[] =>
  Array.from(root.getElementsByTagNameNS('*', name));

const text = (root: Element | Document | null, name: string): string | null => {
  if (!root) return null;
  const v = tags(root, name)[0]?.textContent?.trim();
  return v || null;
};

const decimal = (root: Element | null, name: string): number => {
  const raw = text(root, name);
  if (!raw) return 0;
  const n = parseFloat(raw.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

/** Codici ModalitaPagamento del tracciato → metodi usati nel gestionale. */
const PAYMENT_CODES: Record<string, string> = {
  MP01: 'Contanti',
  MP02: 'Assegno',
  MP03: 'Assegno',
  MP04: 'Contanti',
  MP05: 'Bonifico',
  MP08: 'POS',
  MP12: 'RiBa',
  MP19: 'Bonifico',
  MP20: 'Bonifico',
  MP21: 'Bonifico',
  MP23: 'Bonifico',
};

/** TD04/TD08 sono note di credito: riducono il costo, quindi vanno in negativo. */
const CREDIT_NOTE_TYPES = new Set(['TD04', 'TD08']);

function parseDocument(xml: string, fileName: string): ParsedInvoice[] {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');

  if (doc.getElementsByTagName('parsererror').length > 0) {
    throw new Error('XML non valido o illeggibile');
  }

  const header = tags(doc, 'FatturaElettronicaHeader')[0];
  if (!header) throw new Error('Non sembra una fattura elettronica (manca l\'intestazione)');

  const cedente = tags(header, 'CedentePrestatore')[0];
  const anagrafica = cedente ? tags(cedente, 'Anagrafica')[0] : null;

  // Ditta individuale: nome e cognome al posto della denominazione
  const supplier_name =
    text(anagrafica, 'Denominazione') ??
    [text(anagrafica, 'Nome'), text(anagrafica, 'Cognome')].filter(Boolean).join(' ') ??
    '';
  if (!supplier_name) throw new Error('Fornitore non trovato nel documento');

  const idFiscale = cedente ? tags(cedente, 'IdFiscaleIVA')[0] : null;
  const supplier_vat = idFiscale
    ? [text(idFiscale, 'IdPaese'), text(idFiscale, 'IdCodice')].filter(Boolean).join('')
    : text(cedente ?? null, 'CodiceFiscale');

  // Un file può contenere più fatture dello stesso fornitore (lotto)
  const bodies = tags(doc, 'FatturaElettronicaBody');
  if (bodies.length === 0) throw new Error('Nessuna fattura trovata nel file');

  return bodies.map(body => {
    const dgd = tags(body, 'DatiGeneraliDocumento')[0];
    if (!dgd) throw new Error('Dati generali del documento mancanti');

    const doc_type = text(dgd, 'TipoDocumento') ?? 'TD01';
    const isCredit = CREDIT_NOTE_TYPES.has(doc_type);
    const sign = isCredit ? -1 : 1;

    // Un riepilogo per aliquota: è già la scomposizione che ci serve
    const vat_lines: VatLine[] = tags(body, 'DatiRiepilogo').map(r => ({
      rate: decimal(r, 'AliquotaIVA'),
      taxable: round2(decimal(r, 'ImponibileImporto') * sign),
      vat: round2(decimal(r, 'Imposta') * sign),
    })).filter(l => l.taxable !== 0 || l.vat !== 0);

    const taxable = round2(vat_lines.reduce((s, l) => s + l.taxable, 0));
    const vat_amount = round2(vat_lines.reduce((s, l) => s + l.vat, 0));

    const pagamento = tags(body, 'DatiPagamento')[0] ?? null;
    const dettaglio = pagamento ? tags(pagamento, 'DettaglioPagamento')[0] ?? null : null;
    const code = text(dettaglio, 'ModalitaPagamento');

    return {
      fileName,
      supplier_name,
      supplier_vat,
      date: text(dgd, 'Data') ?? '',
      doc_number: text(dgd, 'Numero') ?? '',
      doc_type,
      is_credit_note: isCredit,
      taxable,
      vat_amount,
      total: round2(taxable + vat_amount),
      vat_lines,
      due_date: text(dettaglio, 'DataScadenzaPagamento'),
      payment_method: code ? PAYMENT_CODES[code] ?? 'Altro' : null,
    };
  });
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Legge un gruppo di file XML restituendo fatture valide ed errori separati. */
export async function parseInvoiceFiles(files: File[]): Promise<ParseResult> {
  const invoices: ParsedInvoice[] = [];
  const errors: ParseError[] = [];

  for (const file of files) {
    try {
      const content = await file.text();
      if (content.trimStart().startsWith('%PDF') || /\.p7m$/i.test(file.name)) {
        throw new Error('File firmato o PDF: serve l\'XML non firmato');
      }
      invoices.push(...parseDocument(content, file.name));
    } catch (e) {
      errors.push({
        fileName: file.name,
        message: e instanceof Error ? e.message : 'Errore di lettura',
      });
    }
  }

  return { invoices, errors };
}
