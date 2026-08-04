import { BURGERS, FRIES } from './menuData';

const PINK = '#CF6990';
const DARK = '#1a0a10';
const MUTED = 'rgba(26,10,16,0.55)';
const BORDER = '1px solid rgba(26,10,16,0.07)';

const SALSE_LIST = ['Ketchup', 'Maionese', 'BBQ', 'Salsa Smokey', 'Salsa Public', 'Senape', 'Salsa Piccante'];

const SALSE_ALLERGENS: Record<string, number[]> = {
  'Ketchup':        [12],
  'Maionese':       [3, 10],
  'BBQ':            [10, 12],
  'Salsa Smokey':   [10, 12],
  'Salsa Public':   [3, 10, 12],
  'Senape':         [10, 12],
  'Salsa Piccante': [12],
};

const DRINKS = [
  'Coca-Cola', 'Coca-Cola Zero', 'Fanta', 'Sprite',
  'Fuze Tea Limone', 'Fuze Tea Pesca', 'Acqua Liscia', 'Acqua Frizzante',
];

const ALLERGENS: Record<string, number[]> = {
  'Cheeseburger':          [1, 3, 7, 12],
  'NY Style':              [1, 3, 7, 10, 12],
  'Oklahoma':              [1, 3, 7, 10, 12],
  'Jalapeño Popper':       [1, 3, 7],
  'Pulled Pork':           [1, 3, 7, 10, 12],
  'American Burger':       [1, 3, 7, 10, 12],
  'Hot Chicken Sandwich':  [1, 3, 6, 10, 12],
  'Lime Chicken Sandwich': [1, 3, 6, 10],
  'Ingordo':               [1, 3, 7, 10, 12],
  'Fake Burger':           [1, 3, 7, 10, 12],
};

const ALLERGEN_LABELS: Record<number, string> = {
  1: 'Glutine', 3: 'Uova', 6: 'Soia', 7: 'Latte',
  9: 'Sedano', 10: 'Senape', 11: 'Semi di sesamo', 12: 'Solfiti',
};

const FRIES_ALLERGENS: Record<string, number[]> = {
  'Patatine':           [],
  'Onion Rings':        [1],
  'Cheese Bacon Fries': [7],
  'Sweet Potatoes':     [],
  'Nuggets':            [1, 3, 6, 7, 9, 10, 11],
  'Chicken Tenders':    [1, 3, 6, 10],
};

// ── Typography constants ───────────────────────────────────────────────────────
// item name (burger / fry / salsa / drink):  26px 700 UPPERCASE
// ingredients / description:                 13px 400 normal
// allergen numbers:                          11px 500
// price value:                               32px 700
// price label:                                9px 700 UPPERCASE letter-spaced

function AllergenNums({ nums }: { nums: number[] }) {
  if (!nums.length) return null;
  return (
    <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
      {nums.map(n => (
        <span key={n} style={{ fontSize: 11, color: 'rgba(26,10,16,0.38)', fontWeight: 500 }}>{n}.</span>
      ))}
    </div>
  );
}

// ── BurgerItem ────────────────────────────────────────────────────────────────

function BurgerItem({ burger }: { burger: typeof BURGERS[0] }) {
  const single = burger.fixedPrice ?? burger.prices?.single ?? 0;
  const fmt = (v: number | null | undefined) =>
    v == null ? '—' : v % 1 === 0 ? String(v) : v.toFixed(1);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 24,
      flex: 1,
    }}>
      {/* Left: name / ingredients / allergens */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Name row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
          <span style={{
            fontSize: 35, fontWeight: 700, color: PINK,
            textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 1,
          }}>
            {burger.name}
          </span>
          {burger.popular && (
            <span style={{
              fontSize: 9, fontWeight: 700, color: '#fff', background: PINK,
              borderRadius: 4, padding: '3px 7px', letterSpacing: '0.1em',
              textTransform: 'uppercase', lineHeight: 1, flexShrink: 0,
            }}>
              🔥 Il più ordinato
            </span>
          )}
          {burger.spicy && <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0 }}>🌶️</span>}
        </div>
        {/* Ingredients */}
        <div style={{ fontSize: 20, color: MUTED, lineHeight: 1.5, fontWeight: 400 }}>
          {burger.ingredients.join(', ')}
        </div>
        {/* Allergens below ingredients */}
        <AllergenNums nums={ALLERGENS[burger.name] ?? []} />
      </div>

      {/* Right: prices */}
      <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        {[
          { label: 'Singolo', value: single },
          { label: 'Doppio',  value: burger.prices?.double ?? null },
          { label: 'Triplo',  value: burger.prices?.triple ?? null },
        ].map(({ label, value }, i) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
            {i > 0 && (
              <div style={{ width: 1, height: 38, background: 'rgba(26,10,16,0.1)', margin: '0 14px' }} />
            )}
            <div style={{ textAlign: 'center', width: 68 }}>
              <div style={{
                fontSize: 9, letterSpacing: '0.22em', color: 'rgba(26,10,16,0.3)',
                textTransform: 'uppercase', marginBottom: 3, fontWeight: 600,
              }}>
                {label}
              </div>
              <div style={{
                fontSize: 36, fontWeight: 700,
                color: value == null ? 'rgba(26,10,16,0.18)' : DARK,
                letterSpacing: '-0.02em', lineHeight: 1,
              }}>
                {fmt(value)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Shared header ─────────────────────────────────────────────────────────────

function Header({ title }: { title: string }) {
  return (
    <div style={{
      position: 'relative', height: 200, flexShrink: 0,
      borderBottom: '1px solid rgba(26,10,16,0.08)',
    }}>
      <div style={{ position: 'absolute', left: 72, top: '50%', transform: 'translateY(-50%)' }}>
        <div style={{
          fontSize: 11, letterSpacing: '0.4em', color: PINK,
          fontWeight: 700, textTransform: 'uppercase', marginBottom: 4,
        }}>Menu</div>
        <span style={{
          fontSize: 60, fontWeight: 800, color: DARK,
          letterSpacing: '-0.04em', lineHeight: 1,
          textTransform: 'uppercase', display: 'block',
        }}>{title}</span>
        <span style={{
          fontSize: 14, fontWeight: 500, color: 'rgba(26,10,16,0.3)',
          letterSpacing: '0.15em', textTransform: 'uppercase',
          display: 'block', marginTop: 6,
        }}>Summer 2026</span>
      </div>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        <img src="/logo-public-burger.png" alt="Public Burger" style={{ height: 168 }} />
      </div>
    </div>
  );
}

// ── Allergen legend ───────────────────────────────────────────────────────────

function AllergenBar() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 28, padding: '10px 72px',
      borderTop: '1px solid rgba(26,10,16,0.08)',
      background: 'rgba(26,10,16,0.02)',
    }}>
      <span style={{
        fontSize: 9, letterSpacing: '0.3em', color: 'rgba(26,10,16,0.5)',
        textTransform: 'uppercase', fontWeight: 700,
      }}>Allergeni:</span>
      {Object.entries(ALLERGEN_LABELS).map(([num, label]) => (
        <span key={num} style={{ fontSize: 12, color: MUTED, fontWeight: 400 }}>
          <strong style={{ fontWeight: 700, color: DARK }}>{num}.</strong> {label}
        </span>
      ))}
      <span style={{ fontSize: 10, color: 'rgba(26,10,16,0.35)', fontStyle: 'italic' }}>
        Reg. UE 1169/2011
      </span>
    </div>
  );
}

// ── Screen 1: Burgers ─────────────────────────────────────────────────────────

function Screen1() {
  const half = Math.ceil(BURGERS.length / 2);
  const col1 = BURGERS.slice(0, half);
  const col2 = BURGERS.slice(half);

  const colStyle = (side: 'left' | 'right'): React.CSSProperties => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingLeft: side === 'right' ? 40 : 0,
    paddingRight: side === 'left' ? 40 : 0,
  });

  const rowWrapper = (last: boolean): React.CSSProperties => ({
    borderBottom: last ? 'none' : BORDER,
    display: 'flex',
    alignItems: 'stretch',
    paddingTop: 10,
    paddingBottom: 10,
  });

  return (
    <div style={{
      width: 1920, height: 1080, background: '#ffffff',
      fontFamily: 'Inter, system-ui, sans-serif', color: DARK,
      overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column',
    }}>
      {/* Watermark */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none', userSelect: 'none', overflow: 'hidden',
      }}>
        <span style={{
          fontSize: 600, fontWeight: 800, color: 'rgba(26,10,16,0.022)',
          letterSpacing: '-0.06em', lineHeight: 1, whiteSpace: 'nowrap',
        }}>PUBLIC</span>
      </div>

      <Header title="Burgers" />

      {/* Two flex columns */}
      <div style={{
        position: 'relative', flex: 1,
        display: 'flex', padding: '0 72px', overflow: 'hidden',
      }}>
        {/* Col 1 */}
        <div style={colStyle('left')}>
          {col1.map((b, i) => (
            <div key={b.name} style={rowWrapper(i === col1.length - 1)}>
              <BurgerItem burger={b} />
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ width: 1, background: 'rgba(26,10,16,0.07)', flexShrink: 0 }} />

        {/* Col 2 */}
        <div style={colStyle('right')}>
          {col2.map((b, i) => (
            <div key={b.name} style={rowWrapper(i === col2.length - 1)}>
              <BurgerItem burger={b} />
            </div>
          ))}
        </div>
      </div>

      <AllergenBar />

      {/* Combo banner */}
      <div style={{
        background: PINK, display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: 48, padding: '22px 72px',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: 10, letterSpacing: '0.45em', color: 'rgba(255,255,255,0.7)',
            textTransform: 'uppercase', fontWeight: 700, marginBottom: 5,
          }}>🍟 Il modo migliore per ordinare</div>
          <div style={{
            fontSize: 38, fontWeight: 800, color: '#ffffff',
            letterSpacing: '-0.03em', lineHeight: 1,
          }}>Panino + Patatine + Bibita</div>
        </div>
        <div style={{ width: 1, height: 50, background: 'rgba(255,255,255,0.3)' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: 10, letterSpacing: '0.45em', color: 'rgba(255,255,255,0.7)',
            textTransform: 'uppercase', fontWeight: 700, marginBottom: 5,
          }}>Aggiungi solo</div>
          <div style={{
            fontSize: 48, fontWeight: 900, color: '#ffffff',
            letterSpacing: '-0.04em', lineHeight: 1,
          }}>+€ 3,00</div>
        </div>
      </div>
    </div>
  );
}

// ── Screen 2: Fries / Salse / Drinks ─────────────────────────────────────────

function Screen2() {
  const drinkPrice = (name: string) =>
    name === 'Acqua Liscia' || name === 'Acqua Frizzante' ? 1 : 2.5;

  const sectionTitle = (label: string) => (
    <div style={{ marginBottom: 18, flexShrink: 0 }}>
      <div style={{
        fontSize: 16, letterSpacing: '0.22em', color: DARK,
        fontWeight: 700, textTransform: 'uppercase', marginBottom: 8,
      }}>{label}</div>
      <div style={{ height: 2, background: PINK, width: 36 }} />
    </div>
  );

  return (
    <div style={{
      width: 1920, height: 1080, background: '#ffffff',
      fontFamily: 'Inter, system-ui, sans-serif', color: DARK,
      overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column',
    }}>
      {/* Watermark */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none', userSelect: 'none', overflow: 'hidden',
      }}>
        <span style={{
          fontSize: 600, fontWeight: 800, color: 'rgba(26,10,16,0.022)',
          letterSpacing: '-0.06em', lineHeight: 1, whiteSpace: 'nowrap',
        }}>PUBLIC</span>
      </div>

      <Header title="Fries &amp; Drinks" />

      {/* Three columns */}
      <div style={{
        position: 'relative', flex: 1,
        display: 'grid', gridTemplateColumns: '1fr 1px 1fr 1px 1fr',
        padding: '28px 72px 20px', overflow: 'hidden',
      }}>

        {/* ── Fries ── */}
        <div style={{ display: 'flex', flexDirection: 'column', paddingRight: 48, overflow: 'hidden' }}>
          {sectionTitle('Fries / Appetizer')}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
            {FRIES.map((f, i) => (
              <div key={f.name} style={{
                borderBottom: i < FRIES.length - 1 ? BORDER : 'none',
                padding: '8px 0',
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'flex-start', gap: 12,
              }}>
                {f.name === 'Nuggets' ? (
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: 35, fontWeight: 700, color: PINK,
                      textTransform: 'uppercase', letterSpacing: '-0.01em',
                      lineHeight: 1, marginBottom: 4,
                    }}>{f.name}</div>
                    <div style={{ fontSize: 20, color: MUTED, marginBottom: 6 }}>{f.desc}</div>
                    <AllergenNums nums={FRIES_ALLERGENS[f.name] ?? []} />
                    {[
                      { label: '6 pz', price: '5' },
                      { label: '12 pz', price: '8.5' },
                      { label: '20 pz', price: '15' },
                    ].map(({ label, price }) => (
                      <div key={label} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        borderTop: '1px solid rgba(26,10,16,0.06)', padding: '3px 0',
                      }}>
                        <span style={{
                          fontSize: 13, color: MUTED, fontWeight: 500,
                          letterSpacing: '0.05em', textTransform: 'uppercase',
                        }}>{label}</span>
                        <span style={{ fontSize: 30, fontWeight: 700, color: DARK, lineHeight: 1 }}>{price}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 35, fontWeight: 700, color: PINK,
                        textTransform: 'uppercase', letterSpacing: '-0.01em',
                        lineHeight: 1, marginBottom: 4,
                      }}>{f.name}</div>
                      <div style={{ fontSize: 20, color: MUTED }}>{f.desc}</div>
                      <AllergenNums nums={FRIES_ALLERGENS[f.name] ?? []} />
                    </div>
                    <span style={{
                      fontSize: 36, fontWeight: 700, color: DARK,
                      flexShrink: 0, lineHeight: 1, paddingTop: 2,
                    }}>
                      {f.price % 1 === 0 ? f.price : f.price.toFixed(1)}
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ background: 'rgba(26,10,16,0.07)' }} />

        {/* ── Salse ── */}
        <div style={{ display: 'flex', flexDirection: 'column', padding: '0 48px', overflow: 'hidden' }}>
          {sectionTitle('Salse')}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
            {SALSE_LIST.map((s, i) => (
              <div key={s} style={{
                borderBottom: i < SALSE_LIST.length - 1 ? BORDER : 'none',
                padding: '8px 0',
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              }}>
                <div>
                  <span style={{
                    fontSize: 35, fontWeight: 700, color: PINK,
                    textTransform: 'uppercase', letterSpacing: '-0.01em', display: 'block', lineHeight: 1,
                    marginBottom: 4,
                  }}>{s}</span>
                  <AllergenNums nums={SALSE_ALLERGENS[s] ?? []} />
                </div>
                <span style={{ fontSize: 30, fontWeight: 700, color: DARK, lineHeight: 1, paddingTop: 2 }}>0.5</span>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ background: 'rgba(26,10,16,0.07)' }} />

        {/* ── Drinks ── */}
        <div style={{ display: 'flex', flexDirection: 'column', paddingLeft: 48, overflow: 'hidden' }}>
          {sectionTitle('Drinks')}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
            {DRINKS.map((d, i) => {
              const price = drinkPrice(d);
              return (
                <div key={d} style={{
                  borderBottom: i < DRINKS.length - 1 ? BORDER : 'none',
                  padding: '8px 0',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span style={{
                    fontSize: 35, fontWeight: 700, color: PINK,
                    textTransform: 'uppercase', letterSpacing: '-0.01em',
                  }}>{d}</span>
                  <span style={{ fontSize: 30, fontWeight: 700, color: DARK }}>
                    {price % 1 === 0 ? price : price.toFixed(1)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <AllergenBar />

      {/* Footer */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '11px 72px', borderTop: '1px solid rgba(26,10,16,0.06)',
      }}>
        <span style={{ fontSize: 11, color: 'rgba(26,10,16,0.25)' }}>
          Public Burger · Piazza de Boncompagni 18, 03036 Isola del Liri (FR) · +39 342 000 6928
        </span>
        <div style={{ flex: 1 }} />
        <span style={{
          fontSize: 9, letterSpacing: '0.2em',
          color: 'rgba(26,10,16,0.18)', textTransform: 'uppercase',
        }}>Reg. UE 1169/2011 — i prezzi potrebbero subire variazioni</span>
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
    <div style={{
      background: '#e8e8e8', display: 'flex', flexDirection: 'column',
      gap: 32, padding: 32, alignItems: 'center', fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)', marginBottom: 4 }}>
        Anteprima — apri <code style={{ color: PINK }}>?screen=1</code> o{' '}
        <code style={{ color: PINK }}>?screen=2</code> su ciascun monitor a schermo intero (F11)
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
