import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  Plus, X, Pencil, Check, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  ArrowUp, ArrowDown, Minus, Trash2, Calendar, ListChecks, BarChart3, TrendingUp,
} from "lucide-react";

// ---------- almacenamiento: funciona tanto en el artifact (window.storage) como deployado (localStorage) ----------
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

// ---------- constantes visuales (paleta pastel) ----------
const INK = "#7d8cae";       // header: azul pastel apagado
const PAPER = "#faf8f6";     // fondo general
const LINE_C = "#e7e1e8";    // bordes suaves
const RUST = "#e29a9a";      // negativo / por encima del presupuesto
const TEAL = "#95c9ac";      // positivo / al día
const AMBER = "#e9c896";
const MUTED = "#9b94a3";
const TEXT = "#4e4a57";
const PALETTE = ["#95c9ac", "#e29a9a", "#a9c0e4", "#e9c896", "#c6a9db", "#a9dbc6", "#e4a9c0", "#a9d3db"];

const FONT_UI = "'Roboto', -apple-system, sans-serif";

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const MESES_CORTO = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

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
  { id: "c1", name: "Alquiler", type: "fijo", defaultAmount: 20599 },
  { id: "c2", name: "Gastos comunes", type: "fijo", defaultAmount: 4783 },
  { id: "c3", name: "Cuota del auto", type: "fijo", defaultAmount: 13180 },
  { id: "c4", name: "UTE", type: "fijo", defaultAmount: 2705 },
  { id: "c5", name: "Antel", type: "fijo", defaultAmount: 1702 },
  { id: "c6", name: "Ancel", type: "fijo", defaultAmount: 625 },
  { id: "c7", name: "Fondo de Solidaridad", type: "fijo", defaultAmount: 1059 },
  { id: "c8", name: "Psicóloga", type: "fijo", defaultAmount: 3000 },
  { id: "c10", name: "Tarjeta Santander", type: "fijo", defaultAmount: 23352 },
  { id: "c11", name: "Tarjeta CDLC", type: "fijo", defaultAmount: 6573 },
  { id: "v1", name: "Nafta", type: "variable" },
  { id: "v2", name: "Delivery", type: "variable" },
  { id: "v3", name: "Supermercado", type: "variable" },
  { id: "v4", name: "Bares/Restoranes", type: "variable" },
];

// ---------- datos de agosto 2026, ya cargados con lo que confirmamos en la conversación ----------
const DEFAULT_ENTRIES = [
  // fijos de agosto
  { id: "seed1", conceptId: "c1", month: "2026-08", amount: 24837.90, paid: true },
  { id: "seed2", conceptId: "c2", month: "2026-08", amount: 4783.00, paid: true },
  { id: "seed3", conceptId: "c3", month: "2026-08", amount: 13167.36, paid: true },
  { id: "seed4", conceptId: "c4", month: "2026-08", amount: 2705.05, paid: true },
  { id: "seed5", conceptId: "c5", month: "2026-08", amount: 1701.64, paid: true },
  { id: "seed6", conceptId: "c6", month: "2026-08", amount: 624.59, paid: true },
  { id: "seed7", conceptId: "c7", month: "2026-08", amount: 1059.00, paid: true },
  { id: "seed8", conceptId: "c8", month: "2026-08", amount: 3000.00, paid: true },
  { id: "seed9", conceptId: "c10", month: "2026-08", amount: 23351.84, paid: true },
  { id: "seed10", conceptId: "c11", month: "2026-08", amount: 6573.00, paid: true },
  // supermercado
  { id: "seed11", conceptId: "v3", month: "2026-08", amount: 283.28, date: "2026-08-27", note: "Tienda Inglesa" },
  { id: "seed12", conceptId: "v3", month: "2026-08", amount: 690.48, date: "2026-08-20", note: "Geant" },
  { id: "seed13", conceptId: "v3", month: "2026-08", amount: 470.95, date: "2026-08-17", note: "Tienda Inglesa" },
  { id: "seed14", conceptId: "v3", month: "2026-08", amount: 1274.40, date: "2026-08-17", note: "Macromercado" },
  { id: "seed15", conceptId: "v3", month: "2026-08", amount: 59.02, date: "2026-08-12", note: "Tienda Inglesa" },
  { id: "seed16", conceptId: "v3", month: "2026-08", amount: 188.92, date: "2026-08-03", note: "Macromercado" },
  { id: "seed17", conceptId: "v3", month: "2026-08", amount: 419.00, date: "2026-08-18", note: "Tienda Inglesa (tarjeta)" },
  // bares/restoranes
  { id: "seed18", conceptId: "v4", month: "2026-08", amount: 305.00, date: "2026-08-21", note: "Carmesi" },
  { id: "seed19", conceptId: "v4", month: "2026-08", amount: 200.00, date: "2026-08-19", note: "Carmesi" },
  { id: "seed20", conceptId: "v4", month: "2026-08", amount: 370.49, date: "2026-08-17", note: "Jackson Bar" },
  { id: "seed21", conceptId: "v4", month: "2026-08", amount: 1118.85, date: "2026-08-15", note: "Jackson Bar (tarjeta)" },
  // delivery
  { id: "seed22", conceptId: "v2", month: "2026-08", amount: 727.09, date: "2026-08-08", note: "Empanadas Calentitas" },
];

let uid = 1;
const nextId = () => `x${Date.now()}_${uid++}`;

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("mes");
  const [concepts, setConcepts] = useState(DEFAULT_CONCEPTS);
  const [entries, setEntries] = useState(DEFAULT_ENTRIES);
  const [month, setMonth] = useState(monthKeyNow());
  const [editingConcepts, setEditingConcepts] = useState(false);

  useEffect(() => {
    const id = "roboto-font-link";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [c, e] = await Promise.all([
          storageAdapter.get("fdm_concepts"),
          storageAdapter.get("fdm_entries"),
        ]);
        if (c) setConcepts(JSON.parse(c));
        if (e) setEntries(JSON.parse(e));
      } catch (err) {
        console.error(err);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => { if (loaded) storageAdapter.set("fdm_concepts", JSON.stringify(concepts)); }, [concepts, loaded]);
  useEffect(() => { if (loaded) storageAdapter.set("fdm_entries", JSON.stringify(entries)); }, [entries, loaded]);

  // ---------- helpers de datos ----------
  const fijos = useMemo(() => concepts.filter((c) => c.type === "fijo"), [concepts]);
  const variables = useMemo(() => concepts.filter((c) => c.type === "variable"), [concepts]);

  const entriesThisMonth = useCallback(
    (conceptId) => entries.filter((e) => e.conceptId === conceptId && e.month === month),
    [entries, month]
  );

  const fijoEntry = useCallback(
    (conceptId) => entries.find((e) => e.conceptId === conceptId && e.month === month),
    [entries, month]
  );

  function toggleFijo(concept) {
    const existing = fijoEntry(concept.id);
    if (existing) {
      setEntries((prev) => prev.filter((e) => e.id !== existing.id));
    } else {
      setEntries((prev) => [...prev, {
        id: nextId(), conceptId: concept.id, month, amount: concept.defaultAmount || 0, paid: true,
      }]);
    }
  }

  function updateFijoAmount(concept, amount) {
    const existing = fijoEntry(concept.id);
    if (existing) {
      setEntries((prev) => prev.map((e) => (e.id === existing.id ? { ...e, amount: Number(amount) || 0 } : e)));
    }
  }

  function addVariableEntry(conceptId, amount, date, note) {
    if (!amount) return;
    setEntries((prev) => [...prev, {
      id: nextId(), conceptId, month, amount: Number(amount), date: date || "", note: note || "",
    }]);
  }

  function removeEntry(id) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  function addConcept(name, type) {
    const id = nextId();
    setConcepts((prev) => [...prev, { id, name, type, defaultAmount: type === "fijo" ? 0 : undefined }]);
  }
  function removeConcept(id) {
    setConcepts((prev) => prev.filter((c) => c.id !== id));
    setEntries((prev) => prev.filter((e) => e.conceptId !== id));
  }
  function updateConcept(id, field, value) {
    setConcepts((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: field === "defaultAmount" ? Number(value) || 0 : value } : c)));
  }

  // ---------- totales del mes ----------
  const fijosTotalMes = fijos.reduce((a, c) => a + (fijoEntry(c.id)?.amount || 0), 0);
  const fijosPagadoMes = fijos.reduce((a, c) => a + (fijoEntry(c.id) ? fijoEntry(c.id).amount : 0), 0);
  const fijosPresupuestado = fijos.reduce((a, c) => a + (c.defaultAmount || 0), 0);
  const variablesTotalMes = variables.reduce((a, c) => a + entriesThisMonth(c.id).reduce((s, e) => s + e.amount, 0), 0);
  const totalMes = fijosPagadoMes + variablesTotalMes;
  const countFijosPagados = fijos.filter((c) => fijoEntry(c.id)).length;

  if (!loaded) {
    return <div style={shellLoading}>Cargando tu libro de gastos…</div>;
  }

  return (
    <div style={{ minHeight: "100vh", background: PAPER, fontFamily: FONT_UI, color: TEXT, paddingBottom: 70 }}>
      <header style={{ background: INK, color: "#f0ece0", padding: "18px 16px" }}>
        <div style={{ fontSize: 19, fontWeight: 600 }}>Libro de gastos</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, fontFamily: FONT_UI }}>
          <button onClick={() => setMonth((m) => shiftMonth(m, -1))} style={navBtn}><ChevronLeft size={18} /></button>
          <div style={{ fontSize: 15 }}>{monthLabel(month)}</div>
          <button onClick={() => setMonth((m) => shiftMonth(m, 1))} style={navBtn}><ChevronRight size={18} /></button>
        </div>
      </header>

      <main style={{ padding: 16, maxWidth: 560, margin: "0 auto" }}>
        {tab === "mes" && (
          <MesTab
            fijos={fijos} variables={variables} concepts={concepts}
            fijoEntry={fijoEntry} toggleFijo={toggleFijo} updateFijoAmount={updateFijoAmount}
            entriesThisMonth={entriesThisMonth} addVariableEntry={addVariableEntry} removeEntry={removeEntry}
            fijosTotalMes={fijosTotalMes} fijosPresupuestado={fijosPresupuestado} countFijosPagados={countFijosPagados}
            variablesTotalMes={variablesTotalMes} totalMes={totalMes}
            editingConcepts={editingConcepts} setEditingConcepts={setEditingConcepts}
            addConcept={addConcept} removeConcept={removeConcept} updateConcept={updateConcept}
          />
        )}
        {tab === "resumen" && (
          <ResumenTab concepts={concepts} entries={entries} month={month} />
        )}
        {tab === "evolucion" && (
          <EvolucionTab concepts={concepts} entries={entries} />
        )}
      </main>

      <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: `1px solid ${LINE_C}`, display: "flex" }}>
        {[
          { id: "mes", label: "Este mes", icon: ListChecks },
          { id: "resumen", label: "Resumen", icon: BarChart3 },
          { id: "evolucion", label: "Evolución", icon: TrendingUp },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              flex: 1, padding: "10px 4px", border: "none", background: "transparent",
              color: tab === id ? INK : MUTED, fontFamily: FONT_UI,
              fontSize: 11, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer",
            }}
          >
            <Icon size={18} strokeWidth={tab === id ? 2.4 : 1.8} />
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}

// ================= ESTE MES =================
function MesTab({
  fijos, variables, fijoEntry, toggleFijo, updateFijoAmount, entriesThisMonth, addVariableEntry, removeEntry,
  fijosTotalMes, fijosPresupuestado, countFijosPagados, variablesTotalMes, totalMes,
  editingConcepts, setEditingConcepts, addConcept, removeConcept, updateConcept,
}) {
  const [expandedVar, setExpandedVar] = useState(null);
  const pendienteFijos = fijosPresupuestado - fijosTotalMes;

  return (
    <div>
      <div style={{ background: "#fff", border: `1px solid ${LINE_C}`, borderRadius: 8, padding: "14px 16px", marginBottom: 16, fontFamily: FONT_UI }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: MUTED, marginBottom: 6 }}>
          <span>{countFijosPagados} de {fijos.length} fijos pagados</span>
          <span>{money(fijosTotalMes)} / {money(fijosPresupuestado)}</span>
        </div>
        <div style={{ height: 8, background: LINE_C, borderRadius: 4, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${fijosPresupuestado ? Math.min(100, (fijosTotalMes / fijosPresupuestado) * 100) : 0}%`, background: TEAL, transition: "width .2s" }} />
        </div>
        <div style={{ marginTop: 10, fontSize: 14, fontWeight: 600, color: pendienteFijos > 0 ? RUST : TEAL }}>
          {pendienteFijos > 0 ? `Faltan ${money(pendienteFijos)} de fijos` : "Fijos al día ✓"}
        </div>
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${LINE_C}`, display: "flex", justifyContent: "space-between", fontSize: 13, color: MUTED }}>
          <span>Total del mes (fijos + variables)</span>
          <span style={{ fontFamily: FONT_UI, color: TEXT, fontWeight: 600 }}>{money(totalMes)}</span>
        </div>
      </div>

      <SectionTitle>Fijos</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 1, background: LINE_C, borderRadius: 8, overflow: "hidden", marginBottom: 20 }}>
        {fijos.map((c) => {
          const entry = fijoEntry(c.id);
          const checked = !!entry;
          return (
            <div key={c.id} style={{ background: "#fff", padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={() => toggleFijo(c)} style={{ ...circleBtn, borderColor: checked ? TEAL : LINE_C, background: checked ? TEAL : "transparent" }}>
                {checked && <Check size={14} color="#fff" />}
              </button>
              {editingConcepts ? (
                <>
                  <input value={c.name} onChange={(e) => updateConcept(c.id, "name", e.target.value)} style={inputSm} />
                  <input type="number" value={c.defaultAmount} onChange={(e) => updateConcept(c.id, "defaultAmount", e.target.value)} style={{ ...inputSm, width: 80, textAlign: "right", fontFamily: FONT_UI }} />
                  <button onClick={() => removeConcept(c.id)} style={iconBtn}><X size={16} color={MUTED} /></button>
                </>
              ) : (
                <>
                  <div style={{ flex: 1, fontFamily: FONT_UI, fontSize: 14, textDecoration: checked ? "line-through" : "none", color: checked ? MUTED : TEXT }}>
                    {c.name}
                  </div>
                  {checked ? (
                    <input
                      type="number"
                      value={entry.amount}
                      onChange={(e) => updateFijoAmount(c, e.target.value)}
                      style={{ width: 76, border: "none", background: "transparent", fontFamily: FONT_UI, fontSize: 13, textAlign: "right", color: MUTED }}
                    />
                  ) : (
                    <div style={{ fontFamily: FONT_UI, fontSize: 13, color: MUTED }}>{money(c.defaultAmount)}</div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      <SectionTitle>Variables</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
        {variables.map((c) => {
          const items = entriesThisMonth(c.id);
          const subtotal = items.reduce((a, e) => a + e.amount, 0);
          const isOpen = expandedVar === c.id;
          return (
            <div key={c.id} style={{ background: "#fff", border: `1px solid ${LINE_C}`, borderRadius: 8, overflow: "hidden" }}>
              <button
                onClick={() => setExpandedVar(isOpen ? null : c.id)}
                style={{ width: "100%", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "none", background: "transparent", cursor: "pointer", fontFamily: FONT_UI }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {isOpen ? <ChevronUp size={15} color={MUTED} /> : <ChevronDown size={15} color={MUTED} />}
                  <span style={{ fontSize: 14, color: TEXT }}>{c.name}</span>
                  <span style={{ fontSize: 11, color: MUTED }}>({items.length})</span>
                </div>
                <span style={{ fontFamily: FONT_UI, fontSize: 14, fontWeight: 600 }}>{money(subtotal)}</span>
              </button>
              {isOpen && (
                <div style={{ borderTop: `1px solid ${LINE_C}`, padding: "8px 14px 12px" }}>
                  {items.map((e) => (
                    <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", fontFamily: FONT_UI, fontSize: 13 }}>
                      <span style={{ color: MUTED }}>{e.date || "—"} {e.note && `· ${e.note}`}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontFamily: FONT_UI }}>{money(e.amount)}</span>
                        <button onClick={() => removeEntry(e.id)} style={iconBtn}><X size={13} color={MUTED} /></button>
                      </div>
                    </div>
                  ))}
                  <AddVariableForm onAdd={(amount, date, note) => addVariableEntry(c.id, amount, date, note)} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editingConcepts && <NuevoConceptoForm addConcept={addConcept} />}

      <button onClick={() => setEditingConcepts((v) => !v)} style={editBtn}>
        <Pencil size={13} /> {editingConcepts ? "Listo" : "Editar conceptos"}
      </button>
    </div>
  );
}

function AddVariableForm({ onAdd }) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  function submit() {
    if (!amount) return;
    onAdd(amount, date, note);
    setAmount(""); setDate(""); setNote("");
  }
  return (
    <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
      <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Monto" style={{ ...inputSm, width: 80 }} onKeyDown={(e) => e.key === "Enter" && submit()} />
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ ...inputSm, width: 130 }} />
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Nota (opcional)" style={{ ...inputSm, flex: 1, minWidth: 90 }} onKeyDown={(e) => e.key === "Enter" && submit()} />
      <button onClick={submit} style={iconBtnFilled}><Plus size={15} color="#fff" /></button>
    </div>
  );
}

function NuevoConceptoForm({ addConcept }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("variable");
  function submit() {
    if (!name.trim()) return;
    addConcept(name.trim(), type);
    setName("");
  }
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nuevo concepto…" style={{ ...inputSm, flex: 1 }} onKeyDown={(e) => e.key === "Enter" && submit()} />
      <select value={type} onChange={(e) => setType(e.target.value)} style={inputSm}>
        <option value="fijo">Fijo</option>
        <option value="variable">Variable</option>
      </select>
      <button onClick={submit} style={iconBtnFilled}><Plus size={15} color="#fff" /></button>
    </div>
  );
}

// ================= RESUMEN =================
function ResumenTab({ concepts, entries, month }) {
  const prevMonth = shiftMonth(month, -1);

  const totalByConceptMonth = useCallback(
    (conceptId, m) => entries.filter((e) => e.conceptId === conceptId && e.month === m).reduce((a, e) => a + e.amount, 0),
    [entries]
  );

  const rows = concepts.map((c) => {
    const actual = totalByConceptMonth(c.id, month);
    const anterior = totalByConceptMonth(c.id, prevMonth);
    return { ...c, actual, anterior, delta: actual - anterior };
  }).filter((r) => r.actual > 0 || r.anterior > 0);

  const totalActual = rows.reduce((a, r) => a + r.actual, 0);
  const totalAnterior = rows.reduce((a, r) => a + r.anterior, 0);

  return (
    <div>
      <div style={{ fontFamily: FONT_UI, fontSize: 13, color: MUTED, marginBottom: 12 }}>
        Comparando {monthLabel(month)} contra {monthLabel(prevMonth)}
      </div>

      <div style={{ background: INK, borderRadius: 8, padding: "16px 18px", marginBottom: 16, color: "#f0ece0" }}>
        <div style={{ fontFamily: FONT_UI, fontSize: 12, color: "#b9c2cc" }}>Total del mes</div>
        <div style={{ fontFamily: FONT_UI, fontSize: 24, marginTop: 2 }}>{money(totalActual)}</div>
        <DeltaTag delta={totalActual - totalAnterior} anterior={totalAnterior} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 1, background: LINE_C, borderRadius: 8, overflow: "hidden" }}>
        {rows.sort((a, b) => b.actual - a.actual).map((r) => (
          <div key={r.id} style={{ background: "#fff", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontFamily: FONT_UI, fontSize: 13 }}>
              {r.name}
              <span style={{ fontSize: 10, color: MUTED, marginLeft: 6 }}>{r.type === "fijo" ? "fijo" : "variable"}</span>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: FONT_UI, fontSize: 13 }}>{money(r.actual)}</div>
              <DeltaTag delta={r.delta} anterior={r.anterior} small />
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <div style={{ background: "#fff", padding: "30px 14px", textAlign: "center", color: MUTED, fontFamily: FONT_UI, fontSize: 13 }}>
            Sin movimientos cargados este mes.
          </div>
        )}
      </div>
    </div>
  );
}

function DeltaTag({ delta, anterior, small }) {
  if (anterior === 0 && delta === 0) return null;
  const pct = anterior > 0 ? Math.round((delta / anterior) * 100) : null;
  const up = delta > 0;
  const flat = delta === 0;
  const color = flat ? MUTED : up ? RUST : TEAL;
  const Icon = flat ? Minus : up ? ArrowUp : ArrowDown;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3, justifyContent: small ? "flex-end" : "flex-start", fontFamily: FONT_UI, fontSize: small ? 10 : 12, color: small ? color : "#dcd6c6", marginTop: small ? 1 : 6 }}>
      <Icon size={small ? 10 : 13} color={color} />
      <span style={{ color }}>{money(Math.abs(delta))}{pct !== null && ` (${pct > 0 ? "+" : ""}${pct}%)`}</span>
    </div>
  );
}

// ================= EVOLUCIÓN =================
function EvolucionTab({ concepts, entries }) {
  const monthKeys = useMemo(() => {
    const set = new Set(entries.map((e) => e.month));
    return Array.from(set).sort();
  }, [entries]);

  const conceptsWithData = useMemo(
    () => concepts.filter((c) => entries.some((e) => e.conceptId === c.id)),
    [concepts, entries]
  );

  const [selected, setSelected] = useState([]);

  useEffect(() => {
    if (selected.length === 0 && conceptsWithData.length) {
      setSelected(conceptsWithData.slice(0, 3).map((c) => c.id));
    }
  }, [conceptsWithData, selected.length]);

  const chartData = useMemo(() => {
    return monthKeys.map((m) => {
      const row = { mes: monthLabelCorto(m) };
      concepts.forEach((c) => {
        row[c.name] = entries.filter((e) => e.conceptId === c.id && e.month === m).reduce((a, e) => a + e.amount, 0);
      });
      row.__total = concepts.reduce((a, c) => a + row[c.name], 0);
      return row;
    });
  }, [monthKeys, concepts, entries]);

  function toggleSelected(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  if (monthKeys.length < 2) {
    return (
      <div style={{ textAlign: "center", color: MUTED, fontFamily: FONT_UI, fontSize: 14, padding: "40px 20px" }}>
        Necesitás al menos 2 meses cargados para ver la evolución. Seguí registrando y volvé por acá.
      </div>
    );
  }

  return (
    <div>
      <SectionTitle>Total mensual</SectionTitle>
      <div style={{ height: 200, marginBottom: 20, background: "#fff", border: `1px solid ${LINE_C}`, borderRadius: 8, padding: "8px 4px 4px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ left: 4, right: 12, top: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={LINE_C} />
            <XAxis dataKey="mes" tick={{ fontSize: 10, fontFamily: FONT_UI }} />
            <YAxis tick={{ fontSize: 10, fontFamily: FONT_UI }} width={50} />
            <Tooltip formatter={(v) => money(v)} contentStyle={{ fontFamily: FONT_UI, fontSize: 12 }} />
            <Line type="monotone" dataKey="__total" name="Total" stroke={INK} strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <SectionTitle>Por concepto</SectionTitle>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
        {conceptsWithData.map((c, i) => (
          <button
            key={c.id}
            onClick={() => toggleSelected(c.id)}
            style={{
              ...chip, cursor: "pointer",
              background: selected.includes(c.id) ? PALETTE[i % PALETTE.length] : "#fff",
              color: selected.includes(c.id) ? "#fff" : TEXT,
              borderColor: selected.includes(c.id) ? PALETTE[i % PALETTE.length] : LINE_C,
            }}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div style={{ height: 240, background: "#fff", border: `1px solid ${LINE_C}`, borderRadius: 8, padding: "8px 4px 4px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ left: 4, right: 12, top: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={LINE_C} />
            <XAxis dataKey="mes" tick={{ fontSize: 10, fontFamily: FONT_UI }} />
            <YAxis tick={{ fontSize: 10, fontFamily: FONT_UI }} width={50} />
            <Tooltip formatter={(v) => money(v)} contentStyle={{ fontFamily: FONT_UI, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: FONT_UI }} />
            {conceptsWithData.map((c, i) => (
              selected.includes(c.id) && (
                <Line key={c.id} type="monotone" dataKey={c.name} stroke={PALETTE[i % PALETTE.length]} strokeWidth={2} dot={{ r: 2.5 }} />
              )
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ---------- piezas compartidas ----------
function SectionTitle({ children }) {
  return <div style={{ fontFamily: FONT_UI, fontSize: 12, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8 }}>{children}</div>;
}

const shellLoading = { minHeight: "100vh", background: PAPER, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_UI, color: MUTED };
const navBtn = { border: "none", background: "rgba(255,255,255,0.1)", borderRadius: 6, padding: 6, color: "#f0ece0", cursor: "pointer", display: "flex" };
const iconBtn = { border: "none", background: "transparent", cursor: "pointer", padding: 4, display: "flex", alignItems: "center" };
const iconBtnFilled = { border: "none", background: INK, borderRadius: 6, cursor: "pointer", padding: "7px 9px", display: "flex", alignItems: "center" };
const circleBtn = { width: 24, height: 24, borderRadius: "50%", border: "2px solid", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 };
const inputSm = { border: `1px solid ${LINE_C}`, borderRadius: 4, padding: "6px 8px", fontSize: 13, fontFamily: FONT_UI };
const editBtn = { width: "100%", padding: "10px", background: "transparent", border: `1px solid ${LINE_C}`, borderRadius: 6, fontSize: 13, fontFamily: FONT_UI, color: TEXT, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" };
const chip = { display: "inline-flex", alignItems: "center", padding: "5px 10px", border: "1px solid", borderRadius: 14, fontSize: 12, fontFamily: FONT_UI };
