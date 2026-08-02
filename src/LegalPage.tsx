interface Props {
  page: 'privacy' | 'cookie' | 'terms';
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

        {page === 'privacy' ? <PrivacyPolicy /> : page === 'cookie' ? <CookiePolicy /> : <TermsPage />}

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
          <li><strong>Dati dell'ordine:</strong> nome, orario richiesto e dettagli dell'ordine inseriti volontariamente nell'apposito modulo. Trasmessi tramite WhatsApp ed archiviati su database per l'elaborazione e la gestione degli ordini. Base giuridica: esecuzione di un contratto (art. 6.1.b GDPR).</li>
          <li><strong>Dati di autenticazione (opzionale):</strong> se l'utente sceglie di accedere tramite Google o Facebook, vengono raccolti nome, indirizzo email e immagine del profilo forniti dal provider OAuth. Base giuridica: consenso (art. 6.1.a GDPR).</li>
        </ul>
        <p>I dati non vengono utilizzati per finalità di marketing, né ceduti a terzi.</p>
      </Section>

      <Section title="3. Sub-responsabili del trattamento">
        <p>Il sito si avvale dei seguenti fornitori terzi che trattano dati per conto del Titolare:</p>
        <ul>
          <li><strong>Vercel Inc.</strong> (USA) — hosting e distribuzione del sito. <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-[#CF6990]">Privacy Policy</a></li>
          <li><strong>Supabase Inc.</strong> (USA) — database per la gestione di ordini e profili utente. <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#CF6990]">Privacy Policy</a></li>
          <li><strong>Google LLC</strong> (USA) — autenticazione OAuth tramite account Google. <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#CF6990]">Privacy Policy</a></li>
          <li><strong>Meta Platforms Ireland Ltd.</strong> — autenticazione OAuth tramite account Facebook. <a href="https://www.facebook.com/privacy/policy/" target="_blank" rel="noopener noreferrer" className="text-[#CF6990]">Privacy Policy</a></li>
          <li><strong>WhatsApp LLC</strong> (USA) — trasmissione degli ordini. <a href="https://www.whatsapp.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-[#CF6990]">Privacy Policy</a></li>
        </ul>
      </Section>

      <Section title="4. Conservazione dei dati">
        <p>
          I dati di navigazione vengono conservati per il tempo strettamente necessario alle finalità tecniche (max 12 mesi).
          I profili utente e lo storico degli ordini archiviati su Supabase vengono conservati fino alla richiesta di cancellazione da parte dell'interessato, o comunque non oltre 3 anni dall'ultima interazione.
          I dati degli ordini trasmessi via WhatsApp sono gestiti secondo la <a href="https://www.whatsapp.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-[#CF6990]">Privacy Policy di WhatsApp LLC</a>.
        </p>
      </Section>

      <Section title="5. Diritti dell'interessato">
        <p>
          Ai sensi degli artt. 15–22 GDPR, l'utente ha diritto di accedere, rettificare, cancellare i propri dati, opporsi al trattamento, richiedere la portabilità e proporre reclamo al Garante per la Protezione dei Dati Personali (<a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer" className="text-[#CF6990]">www.garanteprivacy.it</a>).
        </p>
        <p>
          Per esercitare tali diritti scrivere a: <a href="mailto:public.isoladelliri@gmail.com" className="text-[#CF6990]">public.isoladelliri@gmail.com</a>
        </p>
      </Section>

      <Section title="6. Trasferimento dati extra-UE">
        <p>
          Alcuni fornitori (Vercel, Supabase, Google, WhatsApp) hanno sede negli USA. I trasferimenti sono coperti da Standard Contractual Clauses (SCC) ai sensi dell'art. 46 GDPR o da altre garanzie adeguate previste dalla normativa vigente.
        </p>
      </Section>

      <Section title="7. Modifiche">
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

      <Section title="2. Storage locale utilizzato da questo sito">
        <p className="mb-3">Il sito non utilizza cookie propriamente detti, ma fa uso di <strong>localStorage</strong> e <strong>sessionStorage</strong> del browser per le seguenti finalità tecniche:</p>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-black/10">
              <th className="text-left py-2 pr-3 font-semibold uppercase tracking-wider text-[10px]">Chiave</th>
              <th className="text-left py-2 pr-3 font-semibold uppercase tracking-wider text-[10px]">Storage</th>
              <th className="text-left py-2 pr-3 font-semibold uppercase tracking-wider text-[10px]">Durata</th>
              <th className="text-left py-2 font-semibold uppercase tracking-wider text-[10px]">Finalità</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-black/5">
              <td className="py-2 pr-3 font-mono">pb_auth</td>
              <td className="py-2 pr-3">localStorage</td>
              <td className="py-2 pr-3">Persistente</td>
              <td className="py-2">Accesso al sito durante il periodo di pre-apertura. Si cancella manualmente o tramite logout.</td>
            </tr>
            <tr className="border-b border-black/5">
              <td className="py-2 pr-3 font-mono">pb_user</td>
              <td className="py-2 pr-3">sessionStorage</td>
              <td className="py-2 pr-3">Sessione</td>
              <td className="py-2">Dati del profilo OAuth (nome, email, avatar, token di sessione). Si cancella alla chiusura del browser.</td>
            </tr>
            <tr className="border-b border-black/5">
              <td className="py-2 pr-3 font-mono">pb_order_count</td>
              <td className="py-2 pr-3">localStorage</td>
              <td className="py-2 pr-3">Persistente</td>
              <td className="py-2">Contatore ordini per il sistema di livelli/gamification. Richiede account attivo.</td>
            </tr>
            <tr className="border-b border-black/5">
              <td className="py-2 pr-3 font-mono">pb_oauth_hash</td>
              <td className="py-2 pr-3">sessionStorage</td>
              <td className="py-2 pr-3">Sessione</td>
              <td className="py-2">Token OAuth temporaneo durante il redirect di autenticazione. Eliminato immediatamente dopo l'uso.</td>
            </tr>
            <tr className="border-b border-black/5">
              <td className="py-2 pr-3 font-mono">pb_splash_done</td>
              <td className="py-2 pr-3">sessionStorage</td>
              <td className="py-2 pr-3">Sessione</td>
              <td className="py-2">Evita di ripetere l'animazione di caricamento nella stessa sessione di navigazione.</td>
            </tr>
            <tr className="border-b border-black/5">
              <td className="py-2 pr-3 font-mono">pb_swipe_hint_seen</td>
              <td className="py-2 pr-3">localStorage</td>
              <td className="py-2 pr-3">Persistente</td>
              <td className="py-2">Ricorda che l'utente ha già visto il suggerimento di swipe sul carrello. Nessun dato personale.</td>
            </tr>
            <tr className="border-b border-black/5">
              <td className="py-2 pr-3 font-mono">pb_cookie_consent</td>
              <td className="py-2 pr-3">localStorage</td>
              <td className="py-2 pr-3">Persistente</td>
              <td className="py-2">Memorizza la scelta espressa nel banner cookie (accettazione o rifiuto), per non riproporlo a ogni visita.</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-4">
          Non vengono utilizzati cookie di profilazione, analytics o di terze parti a fini pubblicitari.
        </p>
      </Section>

      <Section title="3. Cookie di terze parti">
        <p>
          Previo consenso espresso tramite il banner cookie, il sito carica lo script di autenticazione di <strong>Google LLC</strong> (Google Sign-In), che può installare cookie di terze parti soggetti alla <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#CF6990]">Privacy Policy di Google</a>. In caso di rifiuto, lo script non viene caricato e il login tramite Google non è disponibile; tutte le altre funzionalità del sito restano pienamente utilizzabili.
        </p>
        <p>
          Il pulsante WhatsApp reindirizza a un servizio esterno soggetto alla propria <a href="https://www.whatsapp.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-[#CF6990]">Privacy Policy</a>.
        </p>
      </Section>

      <Section title="4. Gestione del consenso">
        <p>
          Alla prima visita viene mostrato un banner che consente di accettare o rifiutare i cookie di terze parti. La scelta può essere modificata in qualsiasi momento cancellando i dati di navigazione del browser per questo sito: al successivo accesso il banner verrà riproposto.
        </p>
      </Section>

      <Section title="5. Come disabilitare i cookie">
        <p>
          È possibile disabilitare i cookie tecnici dalle impostazioni del browser, ma questo potrebbe compromettere il corretto funzionamento del sito.
        </p>
      </Section>

      <Section title="6. Contatti">
        <p>
          Per informazioni: <a href="mailto:public.isoladelliri@gmail.com" className="text-[#CF6990]">public.isoladelliri@gmail.com</a>
        </p>
      </Section>
    </div>
  );
}

function TermsPage() {
  return (
    <div className="prose prose-sm max-w-none">
      <h1 className="text-2xl font-semibold uppercase tracking-tight mb-2">Termini e Condizioni</h1>
      <p className="text-[11px] text-black/30 uppercase tracking-widest mb-10">
        Condizioni d'uso del sito publicburger.it
      </p>

      <Section title="1. Accettazione dei termini">
        <p>
          Utilizzando il sito publicburger.it, l'utente accetta integralmente i presenti Termini e Condizioni. In caso di mancata accettazione, è necessario cessare immediatamente l'uso del sito.
        </p>
      </Section>

      <Section title="2. Titolare del servizio">
        <p>
          Graziella Parravano<br />
          Public Burger<br />
          Piazza De Boncompagni 18, 03036 Isola del Liri (FR)<br />
          P.IVA: 02854710601<br />
          Email: <a href="mailto:public.isoladelliri@gmail.com" className="text-[#CF6990]">public.isoladelliri@gmail.com</a>
        </p>
      </Section>

      <Section title="3. Descrizione del servizio">
        <p>
          Il sito consente agli utenti di visualizzare il menu di Public Burger e inviare ordini tramite WhatsApp. Il servizio è offerto a titolo gratuito ed è destinato esclusivamente a persone fisiche maggiorenni residenti in Italia.
        </p>
      </Section>

      <Section title="4. Ordini e pagamenti">
        <p>
          Gli ordini effettuati tramite il sito sono da considerarsi proposte d'acquisto e acquistano validità solo alla conferma da parte del personale del locale. I prezzi indicati sono espressi in Euro (€) e includono IVA. Public Burger si riserva il diritto di modificare i prezzi senza preavviso. Il pagamento avviene direttamente in loco al ritiro o alla consegna.
        </p>
      </Section>

      <Section title="5. Limitazione di responsabilità">
        <p>
          Public Burger non è responsabile per eventuali disservizi tecnici, interruzioni del sito o errori nella trasmissione degli ordini derivanti da cause esterne (malfunzionamenti di WhatsApp, connessione internet dell'utente, ecc.). In ogni caso, la responsabilità massima del Titolare è limitata all'importo dell'ordine interessato.
        </p>
      </Section>

      <Section title="6. Proprietà intellettuale">
        <p>
          Tutti i contenuti del sito (loghi, immagini, testi, grafica) sono di proprietà di Public Burger o dei rispettivi aventi diritto. È vietata la riproduzione, distribuzione o utilizzo commerciale senza autorizzazione scritta.
        </p>
      </Section>

      <Section title="7. Legge applicabile e foro competente">
        <p>
          I presenti Termini sono regolati dalla legge italiana. Per qualsiasi controversia è competente in via esclusiva il Tribunale di Frosinone, salvo i casi in cui l'utente rivesta la qualità di consumatore ai sensi del D.Lgs. 206/2005 (Codice del Consumo).
        </p>
      </Section>

      <Section title="8. Modifiche">
        <p>
          Il Titolare si riserva il diritto di modificare i presenti Termini in qualsiasi momento. Le modifiche sono efficaci dalla pubblicazione sul sito. L'uso continuato del servizio dopo la pubblicazione costituisce accettazione delle modifiche.<br />
          Ultimo aggiornamento: {new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}.
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
