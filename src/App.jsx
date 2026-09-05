import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  Plus, X, Pencil, Check, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  ArrowUp, ArrowDown, Minus, ListChecks, BarChart3, TrendingUp, CreditCard,
} from "lucide-react";

// ---------- almacenamiento: funciona en el artifact (window.storage) y deployado (localStorage) ----------
const storageAdapter = {
  async get(key) {
    if (typeof window !== "undefined" && window.storage) {
      const r = await window.storage.get(key).catch(() => null);
      return r?.value ?? null;
    }
    try { return localStorage.getItem(key); } catch { return null; }
  },
  async set(key, value) {
    if (typeof window !== "undefined" && window.storage) {
      return window.storage.set(key, value).catch(() => null);
    }
    try { localStorage.setItem(key, value); } catch { /* noop */ }
    return true;
  },
};

// ---------- diseño ----------
const BG = "#f1f2f5";
const SURFACE = "#ffffff";
const HEADER = "#1c1e26";
const LINE_C = "#e4e5ea";
const ACCENT = "#4a55c9";
const GOOD = "#1f9d5c";
const BAD = "#dc3d3d";
const MUTED = "#767a87";
const TEXT = "#1a1c23";
const PALETTE = ["#4a55c9", "#1f9d5c", "#dc3d3d", "#c98a2e", "#2ea3a3", "#8a4ac9", "#c92e78", "#5c7ac9"];

const FONT_UI = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const MESES_CORTO = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const TARJETAS = ["Santander", "CDLC"];

const money = (n) => {
  const v = Math.round(n || 0);
  const sign = v < 0 ? "-" : "";
  return `${sign}$${Math.abs(v).toLocaleString("es-UY")}`;
};

function monthKeyNow() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function shiftMonth(key, delta) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function monthLabel(key) {
  const [y, m] = key.split("-").map(Number);
  return `${MESES[m - 1]} ${y}`;
}
function monthLabelCorto(key) {
  const [y, m] = key.split("-").map(Number);
  return `${MESES_CORTO[m - 1]}-${String(y).slice(2)}`;
}

const DEFAULT_CONCEPTS = [
  { id: "c1", name: "Alquiler", defaultAmount: 20599 },
  { id: "c2", name: "Gastos comunes", defaultAmount: 4783 },
  { id: "c3", name: "Cuota del auto", defaultAmount: 13180 },
  { id: "c4", name: "UTE", defaultAmount: 2705 },
  { id: "c5", name: "Antel", defaultAmount: 1702 },
  { id: "c6", name: "Ancel", defaultAmount: 625 },
  { id: "c7", name: "Fondo de Solidaridad", defaultAmount: 1059 },
  { id: "c8", name: "Psicóloga", defaultAmount: 3000 },
  { id: "c10", name: "Tarjeta Santander (pago)", defaultAmount: 23352 },
  { id: "c11", name: "Tarjeta CDLC (pago)", defaultAmount: 6573 },
];

const DEFAULT_RULES = {
  "Supermercado": ["tienda inglesa", "supermercado", "devoto", "macromercado", "disco", "geant", "almacen"],
  "Delivery": ["pedidosya", "dlo.", "empanadas", "rappi"],
  "Combustible": ["ancap", "esso", "axion", "disa", "servicentro"],
  "Bares/Restoranes": ["carmesi", "jackson", "frog", "sultanes", "la cigale", "burger", "berretin"],
  "Suscripciones": ["spotify", "apple", "netflix", "hbo", "icloud", "claude"],
  "Transporte": ["uber", "cabify"],
  "Otros": [],
};

// ---------- semilla: agosto 2026 ya cargado ----------
const DEFAULT_ENTRIES = [
  { id: "seed1", conceptId: "c1", month: "2026-08", amount: 24837.90 },
  { id: "seed2", conceptId: "c2", month: "2026-08", amount: 4783.00 },
  { id: "seed3", conceptId: "c3", month: "2026-08", amount: 13167.36 },
  { id: "seed4", conceptId: "c4", month: "2026-08", amount: 2705.05 },
  { id: "seed5", conceptId: "c5", month: "2026-08", amount: 1701.64 },
  { id: "seed6", conceptId: "c6", month: "2026-08", amount: 624.59 },
  { id: "seed7", conceptId: "c7", month: "2026-08", amount: 1059.00 },
  { id: "seed8", conceptId: "c8", month: "2026-08", amount: 3000.00 },
  { id: "seed9", conceptId: "c10", month: "2026-08", amount: 23351.84 },
  { id: "seed10", conceptId: "c11", month: "2026-08", amount: 6573.00 },
];

let uid = 1;
const nextId = () => `x${Date.now()}_${uid++}`;

function autoCategory(desc, rules) {
  const d = desc.toLowerCase();
  for (const [cat, keywords] of Object.entries(rules)) {
    if (keywords.some((k) => k && d.includes(k.toLowerCase()))) return cat;
  }
  return "Otros";
}

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("mes");
  const [concepts, setConcepts] = useState(DEFAULT_CONCEPTS);
  const [entries, setEntries] = useState(DEFAULT_ENTRIES);
  const [cardTxns, setCardTxns] = useState([]);
  const [rules, setRules] = useState(DEFAULT_RULES);
  const [month, setMonth] = useState(monthKeyNow());
  const [editingConcepts, setEditingConcepts] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [c, e, t, r] = await Promise.all([
          storageAdapter.get("cdg_concepts"),
          storageAdapter.get("cdg_entries"),
          storageAdapter.get("cdg_cardtxns"),
          storageAdapter.get("cdg_rules"),
        ]);
        if (c) setConcepts(JSON.parse(c));
        if (e) setEntries(JSON.parse(e));
        if (t) setCardTxns(JSON.parse(t));
        if (r) setRules(JSON.parse(r));
      } catch (err) {
        console.error(err);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => { if (loaded) storageAdapter.set("cdg_concepts", JSON.stringify(concepts)); }, [concepts, loaded]);
  useEffect(() => { if (loaded) storageAdapter.set("cdg_entries", JSON.stringify(entries)); }, [entries, loaded]);
  useEffect(() => { if (loaded) storageAdapter.set("cdg_cardtxns", JSON.stringify(cardTxns)); }, [cardTxns, loaded]);
  useEffect(() => { if (loaded) storageAdapter.set("cdg_rules", JSON.stringify(rules)); }, [rules, loaded]);

  const entryFor = useCallback(
    (conceptId) => entries.find((e) => e.conceptId === conceptId && e.month === month),
    [entries, month]
  );

  function toggleConcept(concept) {
    const existing = entryFor(concept.id);
    if (existing) {
      setEntries((prev) => prev.filter((e) => e.id !== existing.id));
    } else {
      setEntries((prev) => [...prev, { id: nextId(), conceptId: concept.id, month, amount: concept.defaultAmount || 0 }]);
    }
  }
  function updateAmount(concept, amount) {
    const existing = entryFor(concept.id);
    if (existing) setEntries((prev) => prev.map((e) => (e.id === existing.id ? { ...e, amount: Number(amount) || 0 } : e)));
  }
  function addConcept(name) {
    if (!name.trim()) return;
    setConcepts((prev) => [...prev, { id: nextId(), name: name.trim(), defaultAmount: 0 }]);
  }
  function removeConcept(id) {
    setConcepts((prev) => prev.filter((c) => c.id !== id));
    setEntries((prev) => prev.filter((e) => e.conceptId !== id));
  }
  function updateConcept(id, field, value) {
    setConcepts((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: field === "defaultAmount" ? Number(value) || 0 : value } : c)));
  }

  function addCardTxn(card, description, amount, category) {
    if (!description.trim() || !amount) return;
    setCardTxns((prev) => [...prev, { id: nextId(), card, month, description: description.trim(), amount: Number(amount), category }]);
  }
  function removeCardTxn(id) {
    setCardTxns((prev) => prev.filter((t) => t.id !== id));
  }
  function updateCardTxnCategory(id, category) {
    setCardTxns((prev) => prev.map((t) => (t.id === id ? { ...t, category } : t)));
  }

  const fijosTotal = concepts.reduce((a, c) => a + (entryFor(c.id)?.amount || 0), 0);
  const fijosPresupuestado = concepts.reduce((a, c) => a + (c.defaultAmount || 0), 0);
  const countPagados = concepts.filter((c) => entryFor(c.id)).length;
  const cardTotalMes = cardTxns.filter((t) => t.month === month).reduce((a, t) => a + t.amount, 0);

  const HEADER_H = 96;
  const SUMMARY_H = 148;

  if (!loaded) return <div style={shellLoading}>Cargando…</div>;

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: FONT_UI, color: TEXT, paddingBottom: "calc(74px + env(safe-area-inset-bottom))" }}>
      <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 20, background: HEADER, color: "#fff", padding: "18px 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
        <div style={{ fontSize: 18, fontWeight: 600, textAlign: "center", letterSpacing: 0.2 }}>Control de gastos</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
          <button onClick={() => setMonth((m) => shiftMonth(m, -1))} style={navBtn}><ChevronLeft size={18} /></button>
          <div style={{ fontSize: 14, fontWeight: 500, opacity: 0.9 }}>{monthLabel(month)}</div>
          <button onClick={() => setMonth((m) => shiftMonth(m, 1))} style={navBtn}><ChevronRight size={18} /></button>
        </div>
      </header>

      {tab === "mes" && (
        <div style={{ position: "fixed", top: HEADER_H, left: 0, right: 0, zIndex: 15, background: BG, padding: "12px 16px 8px", boxShadow: "0 4px 6px -4px rgba(0,0,0,0.06)" }}>
          <div style={{ maxWidth: 560, margin: "0 auto" }}>
            <FijosSummaryBar
              countPagados={countPagados} totalConceptos={concepts.length}
              fijosTotal={fijosTotal} fijosPresupuestado={fijosPresupuestado} cardTotalMes={cardTotalMes}
            />
          </div>
        </div>
      )}

      <main style={{ padding: 16, paddingTop: tab === "mes" ? `${HEADER_H + SUMMARY_H + 12}px` : `${HEADER_H + 16}px`, maxWidth: 560, margin: "0 auto" }}>
        {tab === "mes" && (
          <MesTab
            concepts={concepts} entryFor={entryFor} toggleConcept={toggleConcept} updateAmount={updateAmount}
            editingConcepts={editingConcepts} setEditingConcepts={setEditingConcepts}
            addConcept={addConcept} removeConcept={removeConcept} updateConcept={updateConcept}
          />
        )}
        {tab === "tarjetas" && (
          <TarjetasTab
            cardTxns={cardTxns} month={month} rules={rules} setRules={setRules}
            addCardTxn={addCardTxn} removeCardTxn={removeCardTxn} updateCardTxnCategory={updateCardTxnCategory}
          />
        )}
        {tab === "resumen" && (
          <ResumenTab concepts={concepts} entries={entries} cardTxns={cardTxns} month={month} />
        )}
        {tab === "evolucion" && (
          <EvolucionTab concepts={concepts} entries={entries} cardTxns={cardTxns} />
        )}
      </main>

      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0, background: SURFACE, borderTop: `1px solid ${LINE_C}`,
        display: "flex", boxShadow: "0 -2px 8px rgba(0,0,0,0.05)",
        paddingBottom: "calc(14px + env(safe-area-inset-bottom))", zIndex: 20,
      }}>
        {[
          { id: "mes", label: "Fijos", icon: ListChecks },
          { id: "tarjetas", label: "Tarjetas", icon: CreditCard },
          { id: "resumen", label: "Resumen", icon: BarChart3 },
          { id: "evolucion", label: "Evolución", icon: TrendingUp },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              flex: 1, padding: "12px 4px 4px", border: "none", background: "transparent",
              color: tab === id ? ACCENT : MUTED, fontFamily: FONT_UI,
              fontSize: 11, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer",
            }}
          >
            <Icon size={19} strokeWidth={tab === id ? 2.4 : 1.8} />
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}

function FijosSummaryBar({ countPagados, totalConceptos, fijosTotal, fijosPresupuestado, cardTotalMes }) {
  const pendiente = fijosPresupuestado - fijosTotal;
  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: MUTED, marginBottom: 8 }}>
        <span>{countPagados} de {totalConceptos} pagados</span>
        <span>{money(fijosTotal)} / {money(fijosPresupuestado)}</span>
      </div>
      <div style={{ height: 8, background: LINE_C, borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${fijosPresupuestado ? Math.min(100, (fijosTotal / fijosPresupuestado) * 100) : 0}%`, background: ACCENT, transition: "width .2s" }} />
      </div>
      <div style={{ marginTop: 10, fontSize: 15, fontWeight: 600, color: pendiente > 0 ? BAD : GOOD }}>
        {pendiente > 0 ? `Faltan ${money(pendiente)}` : "Todo pagado ✓"}
      </div>
      <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${LINE_C}`, display: "flex", justifyContent: "space-between", fontSize: 13, color: MUTED }}>
        <span>Gastado en tarjeta este mes</span>
        <span style={{ color: TEXT, fontWeight: 600 }}>{money(cardTotalMes)}</span>
      </div>
    </div>
  );
}

// ================= FIJOS =================
function MesTab({
  concepts, entryFor, toggleConcept, updateAmount,
  editingConcepts, setEditingConcepts, addConcept, removeConcept, updateConcept,
}) {
  const [newName, setNewName] = useState("");

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 1, background: LINE_C, borderRadius: 10, overflow: "hidden", marginBottom: 16 }}>
        {concepts.map((c) => {
          const entry = entryFor(c.id);
          const checked = !!entry;
          return (
            <div key={c.id} style={{ background: SURFACE, padding: "13px 14px", display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={() => toggleConcept(c)} style={{ ...circleBtn, borderColor: checked ? GOOD : "#d5d6dc", background: checked ? GOOD : "transparent" }}>
                {checked && <Check size={14} color="#fff" strokeWidth={3} />}
              </button>
              {editingConcepts ? (
                <>
                  <input value={c.name} onChange={(e) => updateConcept(c.id, "name", e.target.value)} style={inputSm} />
                  <input type="number" value={c.defaultAmount} onChange={(e) => updateConcept(c.id, "defaultAmount", e.target.value)} style={{ ...inputSm, width: 80, textAlign: "right" }} />
                  <button onClick={() => removeConcept(c.id)} style={iconBtn}><X size={16} color={MUTED} /></button>
                </>
              ) : (
                <>
                  <div style={{ flex: 1, fontSize: 14, textDecoration: checked ? "line-through" : "none", color: checked ? MUTED : TEXT }}>
                    {c.name}
                  </div>
                  {checked ? (
                    <input
                      type="number"
                      value={entry.amount}
                      onChange={(e) => updateAmount(c, e.target.value)}
                      style={{ width: 78, border: "none", background: "transparent", fontFamily: FONT_UI, fontSize: 14, textAlign: "right", color: MUTED, fontWeight: 500 }}
                    />
                  ) : (
                    <div style={{ fontSize: 14, color: MUTED }}>{money(c.defaultAmount)}</div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {editingConcepts && (
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nuevo gasto fijo…" style={{ ...inputSm, flex: 1 }} onKeyDown={(e) => { if (e.key === "Enter") { addConcept(newName); setNewName(""); } }} />
          <button onClick={() => { addConcept(newName); setNewName(""); }} style={iconBtnFilled}><Plus size={15} color="#fff" /></button>
        </div>
      )}

      <button onClick={() => setEditingConcepts((v) => !v)} style={editBtn}>
        <Pencil size={13} /> {editingConcepts ? "Listo" : "Editar fijos"}
      </button>
    </div>
  );
}

// ================= TARJETAS =================
function TarjetasTab({ cardTxns, month, rules, setRules, addCardTxn, removeCardTxn, updateCardTxnCategory }) {
  const [card, setCard] = useState(TARJETAS[0]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [showRules, setShowRules] = useState(false);

  const txnsMonth = useMemo(() => cardTxns.filter((t) => t.month === month), [cardTxns, month]);
  const allCategories = useMemo(() => Object.keys(rules), [rules]);

  function submit() {
    if (!description.trim() || !amount) return;
    const cat = autoCategory(description, rules);
    addCardTxn(card, description, amount, cat);
    setDescription(""); setAmount("");
  }

  return (
    <div>
      <div style={cardStyle}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: TEXT }}>Cargar gasto</div>
        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
          {TARJETAS.map((t) => (
            <button
              key={t}
              onClick={() => setCard(t)}
              style={{
                flex: 1, padding: "8px", borderRadius: 8, border: `1.5px solid ${card === t ? ACCENT : LINE_C}`,
                background: card === t ? ACCENT : "transparent", color: card === t ? "#fff" : TEXT,
                fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}
            >
              {t}
            </button>
          ))}
        </div>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descripción (ej: Tienda Inglesa)"
          style={{ ...inputSm, width: "100%", marginBottom: 8, boxSizing: "border-box" }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        <div style={{ display: "flex", gap: 6 }}>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Monto"
            style={{ ...inputSm, flex: 1 }}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
          <button onClick={submit} style={iconBtnFilled}><Plus size={16} color="#fff" /></button>
        </div>
      </div>

      {TARJETAS.map((t) => {
        const txns = txnsMonth.filter((x) => x.card === t);
        const total = txns.reduce((a, x) => a + x.amount, 0);
        const byCat = {};
        txns.forEach((x) => { byCat[x.category] = (byCat[x.category] || 0) + x.amount; });
        const catRows = Object.entries(byCat).sort((a, b) => b[1] - a[1]);

        return (
          <div key={t} style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{t}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: ACCENT }}>{money(total)}</div>
            </div>

            {catRows.length === 0 ? (
              <div style={{ ...cardStyle, textAlign: "center", color: MUTED, fontSize: 13, padding: "20px 14px" }}>
                Sin gastos cargados este mes.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 1, background: LINE_C, borderRadius: 10, overflow: "hidden", marginBottom: 8 }}>
                {catRows.map(([cat, amt]) => (
                  <div key={cat} style={{ background: SURFACE, padding: "9px 14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span>{cat}</span>
                      <span style={{ fontWeight: 600 }}>{money(amt)}</span>
                    </div>
                    <div style={{ height: 5, background: LINE_C, borderRadius: 3, marginTop: 5, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${total ? (amt / total) * 100 : 0}%`, background: ACCENT, borderRadius: 3 }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {txns.length > 0 && (
              <details>
                <summary style={{ fontSize: 12, color: MUTED, cursor: "pointer", padding: "4px 2px" }}>Ver {txns.length} movimientos</summary>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
                  {txns.map((x) => (
                    <div key={x.id} style={{ background: SURFACE, border: `1px solid ${LINE_C}`, borderRadius: 8, padding: "8px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{x.description}</div>
                        <select value={x.category} onChange={(e) => updateCardTxnCategory(x.id, e.target.value)} style={{ ...inputSm, fontSize: 11, padding: "2px 4px", marginTop: 3 }}>
                          {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{money(x.amount)}</span>
                        <button onClick={() => removeCardTxn(x.id)} style={iconBtn}><X size={13} color={MUTED} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        );
      })}

      <button onClick={() => setShowRules((v) => !v)} style={editBtn}>
        <Pencil size={13} /> {showRules ? "Listo" : "Editar categorías"}
      </button>
      {showRules && <ReglasEditor rules={rules} setRules={setRules} />}
    </div>
  );
}

function ReglasEditor({ rules, setRules }) {
  const [newCat, setNewCat] = useState("");
  function addCat() {
    const name = newCat.trim();
    if (!name || rules[name]) return;
    setRules((prev) => ({ ...prev, [name]: [] }));
    setNewCat("");
  }
  function removeCat(cat) {
    setRules((prev) => { const n = { ...prev }; delete n[cat]; return n; });
  }
  function addKw(cat, kw) {
    kw = kw.trim().toLowerCase();
    if (!kw) return;
    setRules((prev) => ({ ...prev, [cat]: [...prev[cat], kw] }));
  }
  function removeKw(cat, i) {
    setRules((prev) => ({ ...prev, [cat]: prev[cat].filter((_, idx) => idx !== i) }));
  }
  return (
    <div style={{ ...cardStyle, marginTop: 10 }}>
      {Object.entries(rules).map(([cat, kws]) => (
        <div key={cat} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: `1px solid ${LINE_C}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{cat}</span>
            <button onClick={() => removeCat(cat)} style={iconBtn}><X size={13} color={MUTED} /></button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 6 }}>
            {kws.map((kw, i) => (
              <span key={i} style={chip}>{kw}<button onClick={() => removeKw(cat, i)} style={{ border: "none", background: "none", cursor: "pointer", marginLeft: 4, padding: 0 }}><X size={9} /></button></span>
            ))}
          </div>
          <KwInput onAdd={(kw) => addKw(cat, kw)} />
        </div>
      ))}
      <div style={{ display: "flex", gap: 6 }}>
        <input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="Nueva categoría…" style={{ ...inputSm, flex: 1 }} onKeyDown={(e) => e.key === "Enter" && addCat()} />
        <button onClick={addCat} style={iconBtn}><Plus size={16} /></button>
      </div>
    </div>
  );
}
function KwInput({ onAdd }) {
  const [v, setV] = useState("");
  return (
    <div style={{ display: "flex", gap: 6 }}>
      <input value={v} onChange={(e) => setV(e.target.value)} placeholder="palabra clave…" style={{ ...inputSm, flex: 1, fontSize: 12 }} onKeyDown={(e) => { if (e.key === "Enter") { onAdd(v); setV(""); } }} />
      <button onClick={() => { onAdd(v); setV(""); }} style={iconBtn}><Plus size={13} /></button>
    </div>
  );
}

// ================= RESUMEN =================
function ResumenTab({ concepts, entries, cardTxns, month }) {
  const prevMonth = shiftMonth(month, -1);

  function fijoTotal(m) {
    return concepts.map((c) => entries.find((e) => e.conceptId === c.id && e.month === m)?.amount || 0).reduce((a, b) => a + b, 0);
  }
  function cardCatTotals(m) {
    const map = {};
    cardTxns.filter((t) => t.month === m).forEach((t) => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return map;
  }

  const actualCat = cardCatTotals(month);
  const prevCat = cardCatTotals(prevMonth);
  const allCats = new Set([...Object.keys(actualCat), ...Object.keys(prevCat)]);

  const rows = Array.from(allCats).map((cat) => ({
    name: cat, actual: actualCat[cat] || 0, anterior: prevCat[cat] || 0, delta: (actualCat[cat] || 0) - (prevCat[cat] || 0),
  })).sort((a, b) => b.actual - a.actual);

  const fijosActual = fijoTotal(month);
  const fijosAnterior = fijoTotal(prevMonth);
  const cardActual = cardTxns.filter((t) => t.month === month).reduce((a, t) => a + t.amount, 0);
  const cardAnterior = cardTxns.filter((t) => t.month === prevMonth).reduce((a, t) => a + t.amount, 0);
  const totalActual = fijosActual + cardActual;
  const totalAnterior = fijosAnterior + cardAnterior;

  return (
    <div>
      <div style={{ fontSize: 13, color: MUTED, marginBottom: 12 }}>
        Comparando {monthLabel(month)} contra {monthLabel(prevMonth)}
      </div>

      <div style={{ background: HEADER, borderRadius: 12, padding: "16px 18px", marginBottom: 16, color: "#fff" }}>
        <div style={{ fontSize: 12, opacity: 0.75 }}>Total del mes (fijos + tarjeta)</div>
        <div style={{ fontSize: 24, fontWeight: 700, marginTop: 2 }}>{money(totalActual)}</div>
        <DeltaTag delta={totalActual - totalAnterior} anterior={totalAnterior} light />
      </div>

      <SectionTitle>Fijos</SectionTitle>
      <div style={{ ...cardStyle, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>{money(fijosActual)}</span>
        <DeltaTag delta={fijosActual - fijosAnterior} anterior={fijosAnterior} small />
      </div>

      <SectionTitle>Tarjeta por categoría</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 1, background: LINE_C, borderRadius: 10, overflow: "hidden" }}>
        {rows.length === 0 && (
          <div style={{ background: SURFACE, padding: "24px 14px", textAlign: "center", color: MUTED, fontSize: 13 }}>Sin gastos de tarjeta este mes.</div>
        )}
        {rows.map((r) => (
          <div key={r.name} style={{ background: SURFACE, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13 }}>{r.name}</span>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{money(r.actual)}</div>
              <DeltaTag delta={r.delta} anterior={r.anterior} small />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DeltaTag({ delta, anterior, small, light }) {
  if (anterior === 0 && delta === 0) return null;
  const pct = anterior > 0 ? Math.round((delta / anterior) * 100) : null;
  const up = delta > 0;
  const flat = delta === 0;
  const color = light ? (flat ? "#c7c9d6" : up ? "#ff8080" : "#6fe3a3") : (flat ? MUTED : up ? BAD : GOOD);
  const Icon = flat ? Minus : up ? ArrowUp : ArrowDown;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3, justifyContent: small ? "flex-end" : "flex-start", fontSize: small ? 11 : 13, color, marginTop: small ? 2 : 8 }}>
      <Icon size={small ? 11 : 14} color={color} />
      <span>{money(Math.abs(delta))}{pct !== null && ` (${pct > 0 ? "+" : ""}${pct}%)`}</span>
    </div>
  );
}

// ================= EVOLUCIÓN =================
function EvolucionTab({ concepts, entries, cardTxns }) {
  const monthKeys = useMemo(() => {
    const set = new Set([...entries.map((e) => e.month), ...cardTxns.map((t) => t.month)]);
    return Array.from(set).sort();
  }, [entries, cardTxns]);

  const categories = useMemo(() => {
    const set = new Set(cardTxns.map((t) => t.category));
    return Array.from(set);
  }, [cardTxns]);

  const [selected, setSelected] = useState([]);
  useEffect(() => {
    if (selected.length === 0 && categories.length) setSelected(categories.slice(0, 4));
  }, [categories, selected.length]);

  const chartData = useMemo(() => monthKeys.map((m) => {
    const row = { mes: monthLabelCorto(m) };
    let fijosM = 0;
    concepts.forEach((c) => { fijosM += entries.find((e) => e.conceptId === c.id && e.month === m)?.amount || 0; });
    row["Fijos"] = fijosM;
    let cardM = 0;
    categories.forEach((cat) => {
      const v = cardTxns.filter((t) => t.month === m && t.category === cat).reduce((a, t) => a + t.amount, 0);
      row[cat] = v;
      cardM += v;
    });
    row.__total = fijosM + cardM;
    return row;
  }), [monthKeys, concepts, entries, categories, cardTxns]);

  function toggle(cat) {
    setSelected((prev) => (prev.includes(cat) ? prev.filter((x) => x !== cat) : [...prev, cat]));
  }

  if (monthKeys.length < 2) {
    return <div style={{ textAlign: "center", color: MUTED, fontSize: 14, padding: "40px 20px" }}>Necesitás al menos 2 meses cargados para ver la evolución.</div>;
  }

  return (
    <div>
      <SectionTitle>Total mensual</SectionTitle>
      <div style={{ height: 200, marginBottom: 20, ...cardStyle, padding: "8px 4px 4px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ left: 4, right: 12, top: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={LINE_C} />
            <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} width={50} />
            <Tooltip formatter={(v) => money(v)} contentStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="__total" name="Total" stroke={HEADER} strokeWidth={2.5} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <SectionTitle>Por categoría de tarjeta</SectionTitle>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
        {categories.map((cat, i) => (
          <button
            key={cat}
            onClick={() => toggle(cat)}
            style={{
              ...chip, cursor: "pointer",
              background: selected.includes(cat) ? PALETTE[i % PALETTE.length] : SURFACE,
              color: selected.includes(cat) ? "#fff" : TEXT,
              borderColor: selected.includes(cat) ? PALETTE[i % PALETTE.length] : LINE_C,
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div style={{ height: 240, ...cardStyle, padding: "8px 4px 4px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ left: 4, right: 12, top: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={LINE_C} />
            <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} width={50} />
            <Tooltip formatter={(v) => money(v)} contentStyle={{ fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {categories.map((cat, i) => selected.includes(cat) && (
              <Line key={cat} type="monotone" dataKey={cat} stroke={PALETTE[i % PALETTE.length]} strokeWidth={2} dot={{ r: 2.5 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ---------- piezas compartidas ----------
function SectionTitle({ children }) {
  return <div style={{ fontSize: 12, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>{children}</div>;
}

const shellLoading = { minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_UI, color: MUTED };
const navBtn = { border: "none", background: "rgba(255,255,255,0.12)", borderRadius: 8, padding: 6, color: "#fff", cursor: "pointer", display: "flex" };
const iconBtn = { border: "none", background: "transparent", cursor: "pointer", padding: 4, display: "flex", alignItems: "center" };
const iconBtnFilled = { border: "none", background: ACCENT, borderRadius: 8, cursor: "pointer", padding: "9px 11px", display: "flex", alignItems: "center" };
const circleBtn = { width: 24, height: 24, borderRadius: "50%", border: "2px solid", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 };
const inputSm = { border: `1px solid ${LINE_C}`, borderRadius: 6, padding: "8px 10px", fontSize: 13, fontFamily: FONT_UI, background: SURFACE, color: TEXT };
const editBtn = { width: "100%", padding: "11px", background: SURFACE, border: `1px solid ${LINE_C}`, borderRadius: 8, fontSize: 13, fontFamily: FONT_UI, color: TEXT, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer", fontWeight: 500 };
const chip = { display: "inline-flex", alignItems: "center", padding: "6px 11px", border: "1px solid", borderRadius: 16, fontSize: 12, fontWeight: 500 };
const cardStyle = { background: SURFACE, border: `1px solid ${LINE_C}`, borderRadius: 12, padding: "14px 16px", marginBottom: 14 };
