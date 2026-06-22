interface Props {
  page: 'privacy' | 'cookie';
}

export default function LegalPage({ page }: Props) {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <a
          href="/"
          className="inline-block text-[10px] uppercase tracking-[0.3em] text-black/30 hover:text-[#CF6990] transition-colors mb-12"
        >
          ← Torna al sito
        </a>

        {page === 'privacy' ? <PrivacyPolicy /> : <CookiePolicy />}

        <p className="mt-16 text-[10px] text-black/25 uppercase tracking-widest text-center">
          © {new Date().getFullYear()} Public Burger — P.IVA 02854710601
        </p>
      </div>
    </div>
  );
}

function PrivacyPolicy() {
  return (
    <div className="prose prose-sm max-w-none">
      <h1 className="text-2xl font-semibold uppercase tracking-tight mb-2">Informativa sulla Privacy</h1>
      <p className="text-[11px] text-black/30 uppercase tracking-widest mb-10">
        Ai sensi del Regolamento UE 2016/679 (GDPR)
      </p>

      <Section title="1. Titolare del trattamento">
        <p>
          Graziella Parravano<br />
          Public Burger<br />
          Piazza De Boncompagni 18, 03036 Isola del Liri (FR)<br />
          P.IVA: 02854710601<br />
          Email: <a href="mailto:public.isoladelliri@gmail.com" className="text-[#CF6990]">public.isoladelliri@gmail.com</a><br />
          Tel: <a href="tel:+393420006928" className="text-[#CF6990]">+39 342 000 6928</a>
        </p>
      </Section>

      <Section title="2. Dati raccolti e finalità">
        <p>Il presente sito web raccoglie i seguenti dati:</p>
        <ul>
          <li><strong>Dati di navigazione:</strong> indirizzo IP, tipo di browser, pagine visitate, orari di accesso. Raccolti automaticamente dai server per garantire il corretto funzionamento del sito. Base giuridica: legittimo interesse (art. 6.1.f GDPR).</li>
          <li><strong>Dati dell'ordine:</strong> nome, orario richiesto e dettagli dell'ordine inseriti volontariamente nell'apposito modulo. Trasmessi tramite WhatsApp esclusivamente per l'elaborazione dell'ordine. Base giuridica: esecuzione di un contratto (art. 6.1.b GDPR).</li>
        </ul>
        <p>I dati non vengono utilizzati per finalità di marketing, né ceduti a terzi.</p>
      </Section>

      <Section title="3. Conservazione dei dati">
        <p>
          I dati di navigazione vengono conservati per il tempo strettamente necessario alle finalità tecniche (max 12 mesi). I dati degli ordini trasmessi via WhatsApp sono gestiti secondo la <a href="https://www.whatsapp.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-[#CF6990]">Privacy Policy di WhatsApp LLC</a>.
        </p>
      </Section>

      <Section title="4. Diritti dell'interessato">
        <p>
          Ai sensi degli artt. 15–22 GDPR, l'utente ha diritto di accedere, rettificare, cancellare i propri dati, opporsi al trattamento, richiedere la portabilità e proporre reclamo al Garante per la Protezione dei Dati Personali (<a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer" className="text-[#CF6990]">www.garanteprivacy.it</a>).
        </p>
        <p>
          Per esercitare tali diritti scrivere a: <a href="mailto:public.isoladelliri@gmail.com" className="text-[#CF6990]">public.isoladelliri@gmail.com</a>
        </p>
      </Section>

      <Section title="5. Trasferimento dati extra-UE">
        <p>
          Il sito è ospitato su Vercel Inc. (USA). Il trasferimento è coperto da Standard Contractual Clauses ai sensi dell'art. 46 GDPR.
        </p>
      </Section>

      <Section title="6. Modifiche">
        <p>
          La presente informativa può essere aggiornata. La versione aggiornata è sempre disponibile a questo indirizzo.
          Ultimo aggiornamento: {new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}.
        </p>
      </Section>
    </div>
  );
}

function CookiePolicy() {
  return (
    <div className="prose prose-sm max-w-none">
      <h1 className="text-2xl font-semibold uppercase tracking-tight mb-2">Cookie Policy</h1>
      <p className="text-[11px] text-black/30 uppercase tracking-widest mb-10">
        Ai sensi del Provvedimento Garante Privacy 8 maggio 2014 e del GDPR
      </p>

      <Section title="1. Cosa sono i cookie">
        <p>
          I cookie sono piccoli file di testo salvati sul dispositivo dell'utente durante la navigazione. Questo sito utilizza esclusivamente cookie tecnici necessari al funzionamento.
        </p>
      </Section>

      <Section title="2. Cookie utilizzati da questo sito">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-black/10">
              <th className="text-left py-2 pr-4 font-semibold uppercase tracking-wider text-[10px]">Nome</th>
              <th className="text-left py-2 pr-4 font-semibold uppercase tracking-wider text-[10px]">Tipo</th>
              <th className="text-left py-2 font-semibold uppercase tracking-wider text-[10px]">Finalità</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-black/5">
              <td className="py-2 pr-4 font-mono">pb_auth</td>
              <td className="py-2 pr-4">Tecnico (sessionStorage)</td>
              <td className="py-2">Mantiene la sessione di accesso durante la navigazione. Si cancella alla chiusura del browser.</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-4">
          Non vengono utilizzati cookie di profilazione, analytics o di terze parti a fini pubblicitari.
        </p>
      </Section>

      <Section title="3. Cookie di terze parti">
        <p>
          Il sito non installa cookie di terze parti. Il pulsante WhatsApp reindirizza a un servizio esterno soggetto alla propria <a href="https://www.whatsapp.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-[#CF6990]">Privacy Policy</a>.
        </p>
      </Section>

      <Section title="4. Come disabilitare i cookie">
        <p>
          È possibile disabilitare i cookie tecnici dalle impostazioni del browser, ma questo potrebbe compromettere il corretto funzionamento del sito.
        </p>
      </Section>

      <Section title="5. Contatti">
        <p>
          Per informazioni: <a href="mailto:public.isoladelliri@gmail.com" className="text-[#CF6990]">public.isoladelliri@gmail.com</a>
        </p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-sm font-semibold uppercase tracking-widest mb-3 text-black/70">{title}</h2>
      <div className="text-sm text-black/60 leading-relaxed space-y-3">{children}</div>
    </div>
  );
}
