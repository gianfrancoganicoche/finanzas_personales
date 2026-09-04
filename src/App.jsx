import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, X, Pencil, Check, ChevronLeft, ChevronRight } from "lucide-react";

const INK = "#1c2b3a";
const PAPER = "#f6f3ec";
const LINE = "#ded8c8";
const RUST = "#b3543f";
const TEAL = "#3f7d6d";
const MUTED = "#6b6558";
const TEXT = "#2a2a28";

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const money = (n) => `$${Math.round(n || 0).toLocaleString("es-UY")}`;

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

const DEFAULT_ITEMS = [
  { id: "1", name: "Alquiler", amount: 20599 },
  { id: "2", name: "Gastos comunes", amount: 4783 },
  { id: "3", name: "Cuota del auto", amount: 13180 },
  { id: "4", name: "UTE", amount: 2705 },
  { id: "5", name: "Antel", amount: 1702 },
  { id: "6", name: "Ancel", amount: 625 },
  { id: "7", name: "Fondo de Solidaridad", amount: 1059 },
  { id: "8", name: "Psicóloga", amount: 3000 },
  { id: "9", name: "Club (Nacional)", amount: 1112 },
];

let uid = 1;
const nextId = () => `i${Date.now()}_${uid++}`;

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [items, setItems] = useState(DEFAULT_ITEMS);
  const [checkedByMonth, setCheckedByMonth] = useState({});
  const [month, setMonth] = useState(monthKeyNow());
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("");

  useEffect(() => {
    try {
      const i = localStorage.getItem("fijosDelMes_items");
      const c = localStorage.getItem("fijosDelMes_checked");
      if (i) setItems(JSON.parse(i));
      if (c) setCheckedByMonth(JSON.parse(c));
    } catch (e) {
      console.error(e);
    } finally {
      setLoaded(true);
    }
  }, []);

  const persist = useCallback((key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { if (loaded) persist("fijosDelMes_items", items); }, [items, loaded, persist]);
  useEffect(() => { if (loaded) persist("fijosDelMes_checked", checkedByMonth); }, [checkedByMonth, loaded, persist]);

  const checkedIds = useMemo(() => new Set(checkedByMonth[month] || []), [checkedByMonth, month]);

  function toggle(id) {
    setCheckedByMonth((prev) => {
      const current = new Set(prev[month] || []);
      if (current.has(id)) current.delete(id); else current.add(id);
      return { ...prev, [month]: Array.from(current) };
    });
  }

  function addItem() {
    const name = newName.trim();
    if (!name) return;
    setItems((prev) => [...prev, { id: nextId(), name, amount: Number(newAmount) || 0 }]);
    setNewName(""); setNewAmount("");
  }
  function removeItem(id) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }
  function updateItem(id, field, value) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: field === "amount" ? Number(value) || 0 : value } : i)));
  }

  const total = items.reduce((a, i) => a + i.amount, 0);
  const pagado = items.filter((i) => checkedIds.has(i.id)).reduce((a, i) => a + i.amount, 0);
  const pendiente = total - pagado;
  const countPagado = items.filter((i) => checkedIds.has(i.id)).length;

  if (!loaded) {
    return <div style={{ minHeight: "100vh", background: PAPER, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", color: MUTED }}>Cargando…</div>;
  }

  return (
    <div style={{ minHeight: "100vh", background: PAPER, fontFamily: "'Iowan Old Style', Georgia, serif", color: TEXT }}>
      <header style={{ background: INK, color: "#f0ece0", padding: "20px 16px" }}>
        <div style={{ fontSize: 20, fontWeight: 600 }}>Fijos del mes</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, fontFamily: "system-ui, sans-serif" }}>
          <button onClick={() => setMonth((m) => shiftMonth(m, -1))} style={navBtn}><ChevronLeft size={18} /></button>
          <div style={{ fontSize: 15 }}>{monthLabel(month)}</div>
          <button onClick={() => setMonth((m) => shiftMonth(m, 1))} style={navBtn}><ChevronRight size={18} /></button>
        </div>
      </header>

      <main style={{ padding: 16, maxWidth: 520, margin: "0 auto" }}>
        <div style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 8, padding: "14px 16px", marginBottom: 16, fontFamily: "system-ui, sans-serif" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: MUTED, marginBottom: 6 }}>
            <span>{countPagado} de {items.length} pagados</span>
            <span>{money(pagado)} / {money(total)}</span>
          </div>
          <div style={{ height: 8, background: LINE, borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${total ? (pagado / total) * 100 : 0}%`, background: TEAL, transition: "width .2s" }} />
          </div>
          <div style={{ marginTop: 10, fontSize: 15, fontWeight: 600, color: pendiente > 0 ? RUST : TEAL }}>
            {pendiente > 0 ? `Falta pagar ${money(pendiente)}` : "Todo pagado este mes ✓"}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 1, background: LINE, borderRadius: 8, overflow: "hidden", marginBottom: 16 }}>
          {items.map((item) => {
            const checked = checkedIds.has(item.id);
            return (
              <div key={item.id} style={{ background: "#fff", padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                <button
                  onClick={() => toggle(item.id)}
                  style={{
                    width: 24, height: 24, borderRadius: "50%", border: `2px solid ${checked ? TEAL : LINE}`,
                    background: checked ? TEAL : "transparent", display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", flexShrink: 0,
                  }}
                >
                  {checked && <Check size={14} color="#fff" />}
                </button>

                {editing ? (
                  <>
                    <input
                      value={item.name}
                      onChange={(e) => updateItem(item.id, "name", e.target.value)}
                      style={{ flex: 1, border: `1px solid ${LINE}`, borderRadius: 4, padding: "6px 8px", fontSize: 13, fontFamily: "system-ui, sans-serif" }}
                    />
                    <input
                      type="number"
                      value={item.amount}
                      onChange={(e) => updateItem(item.id, "amount", e.target.value)}
                      style={{ width: 80, border: `1px solid ${LINE}`, borderRadius: 4, padding: "6px 8px", fontSize: 13, fontFamily: "ui-monospace, monospace", textAlign: "right" }}
                    />
                    <button onClick={() => removeItem(item.id)} style={iconBtn}><X size={16} color={MUTED} /></button>
                  </>
                ) : (
                  <>
                    <div style={{ flex: 1, fontFamily: "system-ui, sans-serif", fontSize: 14, textDecoration: checked ? "line-through" : "none", color: checked ? MUTED : TEXT }}>
                      {item.name}
                    </div>
                    <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 14, color: checked ? MUTED : TEXT }}>
                      {money(item.amount)}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {editing && (
          <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nuevo gasto fijo…"
              style={{ flex: 1, border: `1px solid ${LINE}`, borderRadius: 4, padding: "8px 10px", fontSize: 13, fontFamily: "system-ui, sans-serif" }}
              onKeyDown={(e) => e.key === "Enter" && addItem()}
            />
            <input
              type="number"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              placeholder="Monto"
              style={{ width: 90, border: `1px solid ${LINE}`, borderRadius: 4, padding: "8px 10px", fontSize: 13, fontFamily: "ui-monospace, monospace" }}
              onKeyDown={(e) => e.key === "Enter" && addItem()}
            />
            <button onClick={addItem} style={iconBtn}><Plus size={18} /></button>
          </div>
        )}

        <button
          onClick={() => setEditing((v) => !v)}
          style={{
            width: "100%", padding: "10px", background: "transparent", border: `1px solid ${LINE}`, borderRadius: 6,
            fontSize: 13, fontFamily: "system-ui, sans-serif", color: TEXT, display: "flex", alignItems: "center",
            justifyContent: "center", gap: 6, cursor: "pointer",
          }}
        >
          <Pencil size={13} /> {editing ? "Listo" : "Editar lista de fijos"}
        </button>
      </main>
    </div>
  );
}

const navBtn = { border: "none", background: "rgba(255,255,255,0.1)", borderRadius: 6, padding: 6, color: "#f0ece0", cursor: "pointer", display: "flex" };
const iconBtn = { border: "none", background: "transparent", cursor: "pointer", padding: 4, display: "flex", alignItems: "center" };
