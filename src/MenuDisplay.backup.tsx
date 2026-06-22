import { BURGERS, FRIES } from './menuData';

const PINK = '#CF6990';
const DARK = '#1a0a10';

const SALSE_LIST = ['Ketchup', 'Maionese', 'BBQ', 'Salsa Burger', 'Salsa Smokey', 'Salsa Public', 'Senape', 'Salsa Piccante'];
const DRINKS = ['Coca-Cola', 'Coca-Cola Zero', 'Fanta', 'Sprite', 'Fuze Tea Limone', 'Fuze Tea Pesca', 'Acqua Liscia', 'Acqua Frizzante'];

// Allergeni EU Reg. 1169/2011: 1=Glutine 2=Crostacei 3=Uova 4=Pesce 5=Arachidi
// 6=Soia 7=Latte 8=Frutta a guscio 9=Sedano 10=Senape 11=Sesamo 12=Solfiti 13=Lupini 14=Molluschi
const ALLERGENS: Record<string, number[]> = {
  'Cheeseburger':     [1, 7, 12],
  'NY Style':         [1, 3, 7],
  'Oklahoma':         [1, 7, 12],
  'Jalapeño Popper':  [1, 7],
  'Pulled Pork':      [1, 7, 12],
  'American Burger':  [1, 3, 7],
  'Chicken Burger':   [1, 3],
  'Chicken Wrap':     [1, 3],
  'Ingordo':          [1, 3, 7],
  'Fake Burger':      [1, 3, 6, 7],
};

// Legenda completa
const ALLERGEN_LABELS: Record<number, string> = {
  1: 'Glutine', 3: 'Uova', 6: 'Soia', 7: 'Latte', 12: 'Solfiti',
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
      padding: '30px 0',
      borderBottom: last ? 'none' : '1px solid rgba(26,10,16,0.07)',
    }}>
      {/* Left: name + ingredients */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 7 }}>
          <span style={{ fontSize: 34, fontWeight: 700, color: PINK, textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 1 }}>
            {burger.name}
          </span>
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
      <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexShrink: 0 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.25em', color: 'rgba(26,10,16,0.3)', textTransform: 'uppercase', marginBottom: 4 }}>Singolo</div>
          <div style={{ fontSize: 36, fontWeight: 700, color: DARK, letterSpacing: '-0.02em', lineHeight: 1 }}>€{singlePrice % 1 === 0 ? singlePrice : singlePrice.toFixed(1)}</div>
        </div>
        <div style={{ width: 1, height: 50, background: 'rgba(26,10,16,0.1)' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.25em', color: PINK, textTransform: 'uppercase', marginBottom: 4, fontWeight: 600 }}>Menu</div>
          <div style={{ fontSize: 36, fontWeight: 700, color: PINK, letterSpacing: '-0.02em', lineHeight: 1 }}>€{menuPrice % 1 === 0 ? menuPrice : menuPrice.toFixed(1)}</div>
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
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 40, padding: '16px 72px', borderBottom: '1px solid rgba(26,10,16,0.08)' }}>
        {/* Title — left */}
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.4em', color: PINK, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Menu</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 20 }}>
            <span style={{ fontSize: 64, fontWeight: 800, color: DARK, letterSpacing: '-0.04em', lineHeight: 1, textTransform: 'uppercase' }}>Burgers</span>
            <span style={{ fontSize: 18, fontWeight: 500, color: 'rgba(26,10,16,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Summer 2026</span>
          </div>
        </div>

        {/* Logo — centered */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <img src="/logo-public-burger.png" alt="Public Burger" style={{ height: 160 }} />
        </div>

        <div style={{ width: 1 }} />
      </div>

      {/* Two columns of burgers */}
      <div style={{ position: 'relative', flex: 1, display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gap: 0, padding: '0 72px', overflow: 'hidden' }}>
        {/* Col 1 */}
        <div style={{ padding: '0 40px 0 0' }}>
          {col1.map((b, i) => <BurgerItem key={b.name} burger={b} last={i === col1.length - 1} />)}
        </div>

        {/* Divider */}
        <div style={{ background: 'rgba(26,10,16,0.07)', margin: '20px 0' }} />

        {/* Col 2 */}
        <div style={{ padding: '0 0 0 40px' }}>
          {col2.map((b, i) => <BurgerItem key={b.name} burger={b} last={i === col2.length - 1} />)}
        </div>
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
            <div style={{ fontSize: 22, fontWeight: 700, color: i === 0 ? 'rgba(26,10,16,0.3)' : PINK, letterSpacing: '-0.01em' }}>{extra}</div>
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
      <div style={{ position: 'relative', background: PINK, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 48, padding: '22px 72px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.4em', color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Menu Combo</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em', lineHeight: 1 }}>
            Panino + Patatine + Bibita
          </div>
        </div>
        <div style={{ width: 1, height: 48, background: 'rgba(255,255,255,0.25)' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.4em', color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Aggiungi solo</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em', lineHeight: 1 }}>+ € 3,00</div>
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
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 40, padding: '16px 72px', borderBottom: '1px solid rgba(26,10,16,0.08)' }}>
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.4em', color: PINK, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Menu</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 20 }}>
            <span style={{ fontSize: 64, fontWeight: 800, color: DARK, letterSpacing: '-0.04em', lineHeight: 1, textTransform: 'uppercase' }}>Fries &amp; Drinks</span>
            <span style={{ fontSize: 18, fontWeight: 500, color: 'rgba(26,10,16,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Summer 2026</span>
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <img src="/logo-public-burger.png" alt="Public Burger" style={{ height: 160 }} />
        </div>
        <div style={{ fontSize: 10, letterSpacing: '0.2em', color: 'rgba(26,10,16,0.18)', textTransform: 'uppercase', flexShrink: 0 }}>2 / 2</div>
      </div>

      {/* Three columns */}
      <div style={{ position: 'relative', flex: 1, display: 'grid', gridTemplateColumns: '1fr 1px 1fr 1px 1fr', gap: 0, padding: '28px 72px 20px', overflow: 'hidden' }}>

        {/* Fries */}
        <div style={{ paddingRight: 48 }}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.35em', color: PINK, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Fries / Appetizer</div>
            <div style={{ height: 2, background: PINK, width: 40 }} />
          </div>
          {FRIES.map((f, i) => (
            <div key={f.name} style={{ borderBottom: i < FRIES.length - 1 ? '1px solid rgba(26,10,16,0.07)' : 'none', padding: '18px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
              <div>
                <div style={{ fontSize: 26, fontWeight: 700, color: PINK, textTransform: 'uppercase', letterSpacing: '-0.01em', lineHeight: 1, marginBottom: 6 }}>{f.name}</div>
                <div style={{ fontSize: 13, color: 'rgba(26,10,16,0.62)', fontWeight: 450 }}>{f.desc}</div>
                {f.name === 'Nuggets' && (
                  <div style={{ fontSize: 12, color: 'rgba(26,10,16,0.55)', marginTop: 4, letterSpacing: '0.04em', fontWeight: 450 }}>6pz €6 · 12pz €8.5 · 20pz €15</div>
                )}
              </div>
              {f.name !== 'Nuggets' && (
                <span style={{ fontSize: 28, fontWeight: 700, color: DARK, flexShrink: 0, lineHeight: 1 }}>€{f.price % 1 === 0 ? f.price : f.price.toFixed(1)}</span>
              )}
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ background: 'rgba(26,10,16,0.07)' }} />

        {/* Salse */}
        <div style={{ padding: '0 48px' }}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.35em', color: PINK, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Salse</div>
            <div style={{ height: 2, background: PINK, width: 40 }} />
          </div>
          {SALSE_LIST.map((s, i) => (
            <div key={s} style={{ borderBottom: i < SALSE_LIST.length - 1 ? '1px solid rgba(26,10,16,0.07)' : 'none', padding: '15px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 22, fontWeight: 600, color: PINK, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>{s}</span>
              <span style={{ fontSize: 22, fontWeight: 700, color: DARK }}>€0.5</span>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ background: 'rgba(26,10,16,0.07)' }} />

        {/* Drinks */}
        <div style={{ paddingLeft: 48 }}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.35em', color: PINK, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Drinks</div>
            <div style={{ height: 2, background: PINK, width: 40 }} />
          </div>
          {DRINKS.map((d, i) => {
            const price = (d === 'Acqua Liscia' || d === 'Acqua Frizzante') ? 1 : 2.5;
            return (
              <div key={d} style={{ borderBottom: i < DRINKS.length - 1 ? '1px solid rgba(26,10,16,0.07)' : 'none', padding: '15px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 22, fontWeight: 600, color: PINK, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>{d}</span>
                <span style={{ fontSize: 22, fontWeight: 700, color: DARK }}>€{price % 1 === 0 ? price : price.toFixed(1)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', padding: '14px 72px', borderTop: '1px solid rgba(26,10,16,0.06)' }}>
        <span style={{ fontSize: 11, color: 'rgba(26,10,16,0.25)' }}>Public Burger — Isola del Liri (FR) · +39 342 000 6928</span>
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
