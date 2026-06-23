import { BURGERS, FRIES } from './menuData';

const PINK = '#CF6990';
const DARK = '#1a0a10';

const SALSE_LIST = ['Ketchup', 'Maionese', 'BBQ', 'Salsa Smokey', 'Salsa Public', 'Senape', 'Salsa Piccante'];

const SALSE_ALLERGENS: Record<string, number[]> = {
  'Ketchup':       [12],
  'Maionese':      [3, 10],
  'BBQ':           [10, 12],
  'Salsa Smokey':  [10, 12],
  'Salsa Public':  [3, 10, 12],
  'Senape':        [10, 12],
  'Salsa Piccante':[12],
};
const DRINKS = ['Coca-Cola', 'Coca-Cola Zero', 'Fanta', 'Sprite', 'Fuze Tea Limone', 'Fuze Tea Pesca', 'Acqua Liscia', 'Acqua Frizzante'];

// Allergeni EU Reg. 1169/2011: 1=Glutine 2=Crostacei 3=Uova 4=Pesce 5=Arachidi
// 6=Soia 7=Latte 8=Frutta a guscio 9=Sedano 10=Senape 11=Sesamo 12=Solfiti 13=Lupini 14=Molluschi
const ALLERGENS: Record<string, number[]> = {
  // 1=Glutine 3=Uova 6=Soia 7=Latte 10=Senape 12=Solfiti
  'Cheeseburger':     [1, 3, 7, 12],         // brioche(1,3,7) + cheddar(7) + pickles/ketchup(12)
  'NY Style':         [1, 3, 7, 10, 12],      // brioche(1,3,7) + mayo(3,10) + ketchup(12)
  'Oklahoma':         [1, 3, 7, 10, 12],      // brioche(1,3,7) + cheddar(7) + pickles(12) + salsa public(3,10,12)
  'Jalapeño Popper':  [1, 3, 7],              // brioche(1,3,7) + cheddar(7) + creamy sauce philadelphia(7)
  'Pulled Pork':      [1, 3, 7, 10, 12],     // brioche(1,3,7) + coleslaw panna+mayo(3,7,10) + BBQ develey(10,12)
  'American Burger':  [1, 3, 7, 10, 12],     // bun(1,3,7) + cheddar(7) + uovo fritto(3) + BBQ(10,12)
  'Chicken Burger':   [1, 3, 6, 7, 10],      // bun(1,3,7) + cotoletta(1,tracce6) + mayo(3,10) + senape cotoletta(10)
  'Chicken Wrap':     [1, 3, 6, 10],         // piadina(1) + cotoletta(1,tracce6) + mayo(3,10)
  'Ingordo':          [1, 3, 7, 10, 12],     // bun(1,3,7) + scamorza(7) + anelli fritti(1,3) + mayo(3,10) + BBQ(10,12)
  'Fake Burger':      [1, 3, 7, 10, 12],     // brioche(1,3,7) + cheddar(7) + mayo(3,10) + ketchup(12)
};

const ALLERGEN_LABELS: Record<number, string> = {
  1: 'Glutine', 2: 'Crostacei', 3: 'Uova', 4: 'Pesce', 6: 'Soia',
  7: 'Latte', 10: 'Senape', 12: 'Solfiti', 14: 'Molluschi',
};

const FRIES_ALLERGENS: Record<string, number[]> = {
  'Patatine':       [],
  'Onion Rings':    [1, 2, 4, 6, 7, 10, 14], // glutine(farina+birra orzo) + tracce crostacei/pesce/soia/latte/senape/molluschi
  'Cheese Bacon':   [7],            // cheddar = latte
  'Sweet Potatoes': [],
  'Nuggets':        [1, 3, 6, 10], // stessa cotoletta: glutine + tracce uova/soia/senape
};

// ── BurgerItem ────────────────────────────────────────────────────────────────

function BurgerItem({ burger, last }: { burger: typeof BURGERS[0]; last?: boolean }) {
  const singlePrice = burger.fixedPrice ?? burger.prices?.single ?? 0;
  const menuPrice = singlePrice + 3;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 32,
      padding: '18px 0',
      borderBottom: last ? 'none' : '1px solid rgba(26,10,16,0.07)',
    }}>
      {/* Left: name + ingredients */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 7 }}>
          <span style={{ fontSize: 34, fontWeight: 700, color: PINK, textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 1 }}>
            {burger.name}
          </span>
          {burger.popular && (
            <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: PINK, borderRadius: 4, padding: '3px 8px', letterSpacing: '0.12em', textTransform: 'uppercase', lineHeight: 1 }}>
              🔥 Il più ordinato
            </span>
          )}
          {burger.spicy && <span style={{ fontSize: 20, lineHeight: 1 }}>🌶️</span>}
          <span style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            {(ALLERGENS[burger.name] ?? []).map((n) => (
              <span key={n} style={{ fontSize: 11, color: 'rgba(26,10,16,0.4)', fontWeight: 500, lineHeight: 1 }}>{n}.</span>
            ))}
          </span>
        </div>
        <div style={{ fontSize: 14, color: 'rgba(26,10,16,0.62)', lineHeight: 1.6, fontWeight: 450 }}>
          {burger.ingredients.join(', ')}
        </div>
      </div>

      {/* Right: prices */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexShrink: 0, width: 200 }}>
        <div style={{ textAlign: 'center', width: 90 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.25em', color: 'rgba(26,10,16,0.3)', textTransform: 'uppercase', marginBottom: 4 }}>Singolo</div>
          <div style={{ fontSize: 36, fontWeight: 700, color: DARK, letterSpacing: '-0.02em', lineHeight: 1 }}>{singlePrice % 1 === 0 ? singlePrice : singlePrice.toFixed(1)}</div>
        </div>
        <div style={{ width: 1, height: 50, background: 'rgba(26,10,16,0.1)', flexShrink: 0 }} />
        <div style={{ textAlign: 'center', width: 90 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.25em', color: PINK, textTransform: 'uppercase', marginBottom: 4, fontWeight: 600 }}>Menu</div>
          <div style={{ fontSize: 36, fontWeight: 700, color: PINK, letterSpacing: '-0.02em', lineHeight: 1 }}>{menuPrice % 1 === 0 ? menuPrice : menuPrice.toFixed(1)}</div>
        </div>
      </div>
    </div>
  );
}

// ── Screen 1: Burgers ─────────────────────────────────────────────────────────

function Screen1() {
  const half = Math.ceil(BURGERS.length / 2);
  const col1 = BURGERS.slice(0, half);
  const col2 = BURGERS.slice(half);

  return (
    <div style={{
      width: 1920, height: 1080,
      background: '#ffffff',
      fontFamily: 'Inter, system-ui, sans-serif',
      color: DARK,
      overflow: 'hidden',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Watermark */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', userSelect: 'none', overflow: 'hidden' }}>
        <span style={{ fontSize: 600, fontWeight: 800, color: 'rgba(26,10,16,0.022)', letterSpacing: '-0.06em', lineHeight: 1, whiteSpace: 'nowrap' }}>PUBLIC</span>
      </div>

      {/* Header */}
      <div style={{ position: 'relative', height: 280, borderBottom: '1px solid rgba(26,10,16,0.08)', flexShrink: 0 }}>
        {/* Title — left, vertically centered */}
        <div style={{ position: 'absolute', left: 72, top: '50%', transform: 'translateY(-50%)' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.4em', color: PINK, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Menu</div>
          <span style={{ fontSize: 64, fontWeight: 800, color: DARK, letterSpacing: '-0.04em', lineHeight: 1, textTransform: 'uppercase', display: 'block' }}>Burgers</span>
          <span style={{ fontSize: 16, fontWeight: 500, color: 'rgba(26,10,16,0.3)', letterSpacing: '0.15em', textTransform: 'uppercase', display: 'block', marginTop: 6 }}>Summer 2026</span>
        </div>
        {/* Logo — perfectly centered */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <img src="/logo-public-burger.png" alt="Public Burger" style={{ height: 220 }} />
        </div>
      </div>

      {/* Two columns of burgers — row-aligned */}
      <div style={{ position: 'relative', flex: 1, display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gridTemplateRows: `repeat(${col1.length}, 1fr)`, padding: '0 72px', overflow: 'hidden' }}>
        {col1.map((b, i) => (
          <div key={b.name} style={{ gridColumn: 1, gridRow: i + 1, padding: '0 40px 0 0', borderBottom: i < col1.length - 1 ? '1px solid rgba(26,10,16,0.07)' : 'none', overflow: 'hidden' }}>
            <BurgerItem burger={b} last />
          </div>
        ))}
        <div style={{ gridColumn: 2, gridRow: `1 / ${col1.length + 1}`, background: 'rgba(26,10,16,0.07)' }} />
        {col2.map((b, i) => (
          <div key={b.name} style={{ gridColumn: 3, gridRow: i + 1, padding: '0 40px', borderBottom: i < col2.length - 1 ? '1px solid rgba(26,10,16,0.07)' : 'none', overflow: 'hidden' }}>
            <BurgerItem burger={b} last />
          </div>
        ))}
      </div>

      {/* Size upsell strip */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'stretch', borderTop: '1px solid rgba(26,10,16,0.07)', borderBottom: '1px solid rgba(26,10,16,0.07)' }}>
        {[
          { label: 'Doppio', desc: '2 hamburger', extra: '+€ 4,00' },
          { label: 'Triplo', desc: '3 hamburger', extra: '+€ 7,50' },
        ].map(({ label, desc, extra }, i, arr) => (
          <div key={label} style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 20,
            padding: '16px 0',
            borderRight: i < arr.length - 1 ? '1px solid rgba(26,10,16,0.07)' : 'none',
            background: i === 0 ? 'rgba(26,10,16,0.015)' : 'white',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, letterSpacing: '0.3em', color: 'rgba(26,10,16,0.3)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 3 }}>{desc}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: DARK, letterSpacing: '-0.02em', lineHeight: 1, textTransform: 'uppercase' }}>{label}</div>
            </div>
            <div style={{ width: 1, height: 32, background: 'rgba(26,10,16,0.1)' }} />
            <div style={{ fontSize: 22, fontWeight: 700, color: PINK, letterSpacing: '-0.01em' }}>{extra}</div>
          </div>
        ))}
      </div>

      {/* Allergen legend */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32, padding: '12px 72px', borderTop: '1px solid rgba(26,10,16,0.08)', background: 'rgba(26,10,16,0.02)' }}>
        <span style={{ fontSize: 10, letterSpacing: '0.3em', color: 'rgba(26,10,16,0.55)', textTransform: 'uppercase', fontWeight: 700 }}>Allergeni:</span>
        {Object.entries(ALLERGEN_LABELS).map(([num, label]) => (
          <span key={num} style={{ fontSize: 13, color: 'rgba(26,10,16,0.62)', fontWeight: 450 }}>
            <strong style={{ fontWeight: 700, color: DARK }}>{num}.</strong> {label}
          </span>
        ))}
        <span style={{ fontSize: 11, color: 'rgba(26,10,16,0.4)', fontStyle: 'italic' }}>Reg. UE 1169/2011</span>
      </div>

      {/* Combo banner */}
      <div style={{ position: 'relative', background: PINK, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 56, padding: '26px 72px' }}>
        {/* Left: label + headline */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.45em', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>🍟 Il modo migliore per ordinare</div>
          <div style={{ fontSize: 40, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em', lineHeight: 1 }}>
            Panino + Patatine + Bibita
          </div>
        </div>
        <div style={{ width: 1, height: 56, background: 'rgba(255,255,255,0.3)' }} />
        {/* Right: price */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.45em', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>Aggiungi solo</div>
          <div style={{ fontSize: 52, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.04em', lineHeight: 1 }}>+€ 3,00</div>
        </div>
      </div>
    </div>
  );
}

// ── Screen 2: Fries / Salse / Drinks ─────────────────────────────────────────

function Screen2() {
  return (
    <div style={{
      width: 1920, height: 1080,
      background: '#ffffff',
      fontFamily: 'Inter, system-ui, sans-serif',
      color: DARK,
      overflow: 'hidden',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Watermark */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', userSelect: 'none', overflow: 'hidden' }}>
        <span style={{ fontSize: 600, fontWeight: 800, color: 'rgba(26,10,16,0.022)', letterSpacing: '-0.06em', lineHeight: 1, whiteSpace: 'nowrap' }}>PUBLIC</span>
      </div>

      {/* Header — stesso stile Screen1 */}
      <div style={{ position: 'relative', height: 280, borderBottom: '1px solid rgba(26,10,16,0.08)', flexShrink: 0 }}>
        <div style={{ position: 'absolute', left: 72, top: '50%', transform: 'translateY(-50%)' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.4em', color: PINK, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Menu</div>
          <span style={{ fontSize: 64, fontWeight: 800, color: DARK, letterSpacing: '-0.04em', lineHeight: 1, textTransform: 'uppercase', display: 'block' }}>Fries &amp; Drinks</span>
          <span style={{ fontSize: 16, fontWeight: 500, color: 'rgba(26,10,16,0.3)', letterSpacing: '0.15em', textTransform: 'uppercase', display: 'block', marginTop: 6 }}>Summer 2026</span>
        </div>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <img src="/logo-public-burger.png" alt="Public Burger" style={{ height: 220 }} />
        </div>
      </div>

      {/* Three columns */}
      <div style={{ position: 'relative', flex: 1, display: 'grid', gridTemplateColumns: '1fr 1px 1fr 1px 1fr', gap: 0, padding: '36px 72px 28px', overflow: 'hidden' }}>

        {/* Fries */}
        <div style={{ padding: '0 48px 0 0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 18, letterSpacing: '0.2em', color: DARK, fontWeight: 700, textTransform: 'uppercase', marginBottom: 10 }}>Fries / Appetizer</div>
            <div style={{ height: 2, background: PINK, width: 40 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
          {FRIES.map((f, i) => (
            <div key={f.name} style={{ borderBottom: i < FRIES.length - 1 ? '1px solid rgba(26,10,16,0.07)' : 'none', padding: '10px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
              {f.name === 'Nuggets' ? (
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <div style={{ fontSize: 30, fontWeight: 700, color: PINK, textTransform: 'uppercase', letterSpacing: '-0.01em', lineHeight: 1 }}>{f.name}</div>
                    <span style={{ display: 'flex', gap: 4 }}>{(FRIES_ALLERGENS[f.name] ?? []).map(n => <span key={n} style={{ fontSize: 11, color: 'rgba(26,10,16,0.4)', fontWeight: 500 }}>{n}.</span>)}</span>
                  </div>
                  <div style={{ fontSize: 14, color: 'rgba(26,10,16,0.62)', fontWeight: 450, marginBottom: 12 }}>{f.desc}</div>
                  {[{ label: '6 pz', price: '6' }, { label: '12 pz', price: '8.5' }, { label: '20 pz', price: '15' }].map(({ label, price }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(26,10,16,0.06)', padding: '7px 0' }}>
                      <span style={{ fontSize: 14, color: 'rgba(26,10,16,0.55)', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</span>
                      <span style={{ fontSize: 30, fontWeight: 700, color: DARK, lineHeight: 1 }}>{price}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <div style={{ fontSize: 30, fontWeight: 700, color: PINK, textTransform: 'uppercase', letterSpacing: '-0.01em', lineHeight: 1 }}>{f.name}</div>
                      <span style={{ display: 'flex', gap: 4 }}>{(FRIES_ALLERGENS[f.name] ?? []).map(n => <span key={n} style={{ fontSize: 11, color: 'rgba(26,10,16,0.4)', fontWeight: 500 }}>{n}.</span>)}</span>
                    </div>
                    <div style={{ fontSize: 14, color: 'rgba(26,10,16,0.62)', fontWeight: 450 }}>{f.desc}</div>
                  </div>
                  <span style={{ fontSize: 32, fontWeight: 700, color: DARK, flexShrink: 0, lineHeight: 1 }}>{f.price % 1 === 0 ? f.price : f.price.toFixed(1)}</span>
                </>
              )}
            </div>
          ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ background: 'rgba(26,10,16,0.07)' }} />

        {/* Salse */}
        <div style={{ padding: '0 48px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 18, letterSpacing: '0.2em', color: DARK, fontWeight: 700, textTransform: 'uppercase', marginBottom: 10 }}>Salse</div>
            <div style={{ height: 2, background: PINK, width: 40 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
          {SALSE_LIST.map((s, i) => (
            <div key={s} style={{ borderBottom: i < SALSE_LIST.length - 1 ? '1px solid rgba(26,10,16,0.07)' : 'none', padding: '10px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 26, fontWeight: 600, color: PINK, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>{s}</span>
                <span style={{ display: 'flex', gap: 3 }}>{(SALSE_ALLERGENS[s] ?? []).map(n => <span key={n} style={{ fontSize: 11, color: 'rgba(26,10,16,0.4)', fontWeight: 500 }}>{n}.</span>)}</span>
              </div>
              <span style={{ fontSize: 26, fontWeight: 700, color: DARK }}>0.5</span>
            </div>
          ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ background: 'rgba(26,10,16,0.07)' }} />

        {/* Drinks */}
        <div style={{ padding: '0 0 0 48px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 18, letterSpacing: '0.2em', color: DARK, fontWeight: 700, textTransform: 'uppercase', marginBottom: 10 }}>Drinks</div>
            <div style={{ height: 2, background: PINK, width: 40 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
          {DRINKS.map((d, i) => {
            const price = (d === 'Acqua Liscia' || d === 'Acqua Frizzante') ? 1 : 2.5;
            return (
              <div key={d} style={{ borderBottom: i < DRINKS.length - 1 ? '1px solid rgba(26,10,16,0.07)' : 'none', padding: '10px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 26, fontWeight: 600, color: PINK, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>{d}</span>
                <span style={{ fontSize: 26, fontWeight: 700, color: DARK }}>{price % 1 === 0 ? price : price.toFixed(1)}</span>
              </div>
            );
          })}
          </div>
        </div>
      </div>

      {/* Allergen legend */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32, padding: '12px 72px', borderTop: '1px solid rgba(26,10,16,0.08)', background: 'rgba(26,10,16,0.02)' }}>
        <span style={{ fontSize: 10, letterSpacing: '0.3em', color: 'rgba(26,10,16,0.55)', textTransform: 'uppercase', fontWeight: 700 }}>Allergeni:</span>
        {Object.entries(ALLERGEN_LABELS).map(([num, label]) => (
          <span key={num} style={{ fontSize: 13, color: 'rgba(26,10,16,0.62)', fontWeight: 450 }}>
            <strong style={{ fontWeight: 700, color: DARK }}>{num}.</strong> {label}
          </span>
        ))}
        <span style={{ fontSize: 11, color: 'rgba(26,10,16,0.4)', fontStyle: 'italic' }}>Reg. UE 1169/2011</span>
      </div>

      {/* Footer */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', padding: '14px 72px', borderTop: '1px solid rgba(26,10,16,0.06)' }}>
        <span style={{ fontSize: 11, color: 'rgba(26,10,16,0.25)' }}>Public Burger · Piazza de Boncompagni 18, 03036 Isola del Liri (FR) · +39 342 000 6928</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 10, letterSpacing: '0.2em', color: 'rgba(26,10,16,0.18)', textTransform: 'uppercase' }}>Reg. UE 1169/2011 — i prezzi potrebbero subire variazioni</span>
      </div>
    </div>
  );
}

// ── Display selector ──────────────────────────────────────────────────────────

export default function MenuDisplay() {
  const params = new URLSearchParams(window.location.search);
  const screen = params.get('screen');

  if (screen === '1') return <Screen1 />;
  if (screen === '2') return <Screen2 />;

  return (
    <div style={{ background: '#e8e8e8', display: 'flex', flexDirection: 'column', gap: 32, padding: 32, alignItems: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)', marginBottom: 4 }}>
        Anteprima — apri <code style={{ color: PINK }}>?screen=1</code> o <code style={{ color: PINK }}>?screen=2</code> su ciascun monitor a schermo intero (F11)
      </div>
      <div style={{ transform: 'scale(0.44)', transformOrigin: 'top center', marginBottom: -605 }}>
        <Screen1 />
      </div>
      <div style={{ transform: 'scale(0.44)', transformOrigin: 'top center', marginBottom: -605 }}>
        <Screen2 />
      </div>
    </div>
  );
}
