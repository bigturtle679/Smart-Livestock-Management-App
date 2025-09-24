// src/App.jsx
import React, { useEffect, useRef, useState } from "react";
import db, { seedIfEmpty } from "./db";
import seedData from "./seed.json";
import AnimalCard from "./components/AnimalCard";
import { simulateFever } from "./simulate";
import "./index.css";

// framer-motion utilities
import { motion, AnimatePresence, useMotionValue, animate } from "framer-motion";

// Recharts for charts in modal
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

/* -----------------------
   AnimatedStat (for dashboard numbers)
   ----------------------- */
function AnimatedStat({ value = 0, label }) {
  const motionVal = useMotionValue(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(motionVal, value, {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
    });

    const unsubscribe = motionVal.onChange((v) => setDisplay(Math.round(v)));

    return () => {
      unsubscribe();
      controls.stop();
    };
  }, [value, motionVal]);

  return (
    <div>
      <div className="text-2xl font-bold">{display}</div>
      <div className="text-sm opacity-80">{label}</div>
    </div>
  );
}

/* -----------------------
   DetailsModal (dark + chart)
   ----------------------- */
function DetailsModal({ selected, onClose, lang }) {
  const closeRef = useRef(null);

  useEffect(() => {
    closeRef.current?.focus?.();

    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function panelClick(e) {
    e.stopPropagation();
  }

  const vitals = (selected.vitals_history || []).slice(-10).map((v) => ({
    time: new Date(v.ts).toLocaleTimeString(),
    temp: v.temp,
  }));

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={() => onClose()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="w-full max-w-3xl shadow-2xl rounded-lg p-6"
          onClick={panelClick}
          style={{ backgroundColor: "black", color: "white" }}
          tabIndex={-1}
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 id="modal-title" className="text-xl font-bold text-white">
                {selected.tag} — {selected.species}
              </h3>
              <div className="text-sm text-gray-300 mt-1">
                {lang === "en" ? "Age" : "उम्र"}: {selected.age_months}{" "}
                {lang === "en" ? "months" : "महीने"} · {selected.gender}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                ref={closeRef}
                onClick={onClose}
                className="px-3 py-1 rounded-md bg-gray-700 hover:bg-gray-600 text-white text-sm"
              >
                {lang === "en" ? "Close" : "बंद करें"}
              </button>
            </div>
          </div>

          {/* Chart */}
          <div className="mt-6">
            <h4 className="font-semibold mb-2 text-white">
              {lang === "en" ? "Temperature Trend" : "तापमान प्रवृत्ति"}
            </h4>
            {vitals.length > 0 ? (
              <div className="bg-gray-900 p-3 rounded-lg">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={vitals}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="time" stroke="#aaa" />
                    <YAxis domain={["dataMin-1", "dataMax+1"]} stroke="#aaa" />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="temp"
                      stroke="#f87171"
                      strokeWidth={2}
                      dot={{ fill: "#f87171" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-sm text-gray-400">
                {lang === "en" ? "No vitals data yet." : "अभी तक कोई डेटा नहीं।"}
              </div>
            )}
          </div>

          {/* Table */}
          <div className="mt-6">
            <h4 className="font-semibold mb-2 text-white">
              {lang === "en" ? "Vitals History" : "स्वास्थ्य इतिहास"}
            </h4>
            <div className="overflow-x-auto border border-gray-700 rounded-md">
              <table className="w-full text-sm">
                <thead className="bg-gray-800 text-gray-200">
                  <tr>
                    <th className="p-2 text-left">{lang === "en" ? "Time" : "समय"}</th>
                    <th className="p-2 text-center">{lang === "en" ? "Temp (°C)" : "तापमान (°C)"}</th>
                    <th className="p-2 text-center">{lang === "en" ? "HR (bpm)" : "हृदय गति (bpm)"}</th>
                    <th className="p-2 text-center">{lang === "en" ? "Weight (kg)" : "वज़न (kg)"}</th>
                    <th className="p-2 text-center">{lang === "en" ? "Feed (kg)" : "चारा (kg)"}</th>
                  </tr>
                </thead>
                <tbody>
                  {(selected.vitals_history || []).slice(-8).reverse().map((v, i) => (
                    <tr key={i} className="border-b border-gray-700 last:border-0">
                      <td className="p-2">{new Date(v.ts).toLocaleString()}</td>
                      <td className="p-2 text-center">{v.temp != null ? v.temp.toFixed(1) : "—"}</td>
                      <td className="p-2 text-center">{v.hr ?? "—"}</td>
                      <td className="p-2 text-center">{v.weight ?? "—"}</td>
                      <td className="p-2 text-center">{v.feed_intake ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Alerts */}
          <div className="mt-6">
            <h4 className="font-semibold mb-2 text-white">
              {lang === "en" ? "Alerts" : "चेतावनी"}
            </h4>
            {selected.alerts && selected.alerts.length ? (
              <ul className="list-disc ml-5 text-gray-300">
                {selected.alerts.map((al, i) => (
                  <li key={i} className="mb-1">
                    {al.message} <span className="text-xs text-gray-400">({al.severity})</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-gray-400">
                {lang === "en" ? "No alerts" : "कोई चेतावनी नहीं"}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* -----------------------
   Main App
   ----------------------- */
export default function App() {
  const [animals, setAnimals] = useState([]);
  const [selected, setSelected] = useState(null);
  const [lang, setLang] = useState("en");

  // safe loader
  async function loadAllAnimals() {
    try {
      const docs = await db.allDocs({ include_docs: true });
      const rows = Array.isArray(docs.rows) ? docs.rows : [];
      const goodDocs = rows.map((r) => r && r.doc).filter(Boolean);
      goodDocs.sort((a, b) => (a.tag || "").localeCompare(b.tag || ""));
      setAnimals(goodDocs);
      return goodDocs;
    } catch (e) {
      console.error("loadAllAnimals failed", e);
      setAnimals([]);
      return [];
    }
  }

  useEffect(() => {
    let changesFeed;
    (async () => {
      try {
        await seedIfEmpty(seedData);
        await loadAllAnimals();

        const feed = db.changes({ live: true, since: "now", include_docs: true });
        if (feed && typeof feed.on === "function") {
          feed.on("change", (c) => {
            try {
              if (!c || !c.doc || !c.doc._id) return;
              setAnimals((prev) => {
                const found = prev.find((x) => x._id === c.doc._id);
                if (found) return prev.map((x) => (x._id === c.doc._id ? c.doc : x));
                return [...prev, c.doc];
              });
            } catch (err) {
              console.error("change handler error", err);
            }
          });
          changesFeed = feed;
        }
      } catch (err) {
        console.error("init error", err);
      }
    })();

    return () => {
      try {
        changesFeed?.cancel?.();
      } catch {}
    };
  }, []);

  const openDetails = (animal) => setSelected(animal);
  const closeDetails = () => setSelected(null);

  async function handleSimulate(id) {
    try {
      await simulateFever(id);
      await loadAllAnimals();
    } catch (e) {
      console.error("simulate error", e);
    }
  }

  async function handleSync(animal) {
    try {
      const doc = await db.get(animal._id);
      doc.synced = true;
      await db.put(doc);
      await loadAllAnimals();
    } catch (e) {
      console.error("sync error", e);
    }
  }

  // computed stats
  const total = animals.length;
  const healthy = animals.filter((a) => !(a.alerts || []).length).length;
  const alertsCount = animals.filter((a) => (a.alerts || []).length).length;

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* === Dashboard Header (animated stats) === */}
      <header className="bg-gradient-to-r from-primary-600 to-indigo-700 text-white shadow-lg">
        <div className="container py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            {/* Title */}
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                Smart Livestock <span className="font-light">Dashboard</span>
              </h1>
              <p className="mt-1 text-sm text-white/80">
                {lang === "en"
                  ? "Predictive health monitoring · Offline-first · Multilingual"
                  : "पूर्वानुमान स्वास्थ्य निगरानी · ऑफ़लाइन-पहला · बहुभाषी"}
              </p>
            </div>
          </div>

          {/* Animated Stats row */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white/10 rounded-xl p-4 flex items-center gap-4 shadow-inner">
              <div className="bg-white/20 rounded-lg p-3 text-2xl">🐄</div>
              <AnimatedStat value={total} label={lang === "en" ? "Total Animals" : "कुल पशु"} />
            </div>

            <div className="bg-white/10 rounded-xl p-4 flex items-center gap-4 shadow-inner">
              <div className="bg-white/20 rounded-lg p-3 text-2xl">✅</div>
              <AnimatedStat value={healthy} label={lang === "en" ? "Healthy" : "स्वस्थ"} />
            </div>

            <div className="bg-white/10 rounded-xl p-4 flex items-center gap-4 shadow-inner">
              <div className="bg-white/20 rounded-lg p-3 text-2xl">⚠️</div>
              <AnimatedStat value={alertsCount} label={lang === "en" ? "Alerts" : "चेतावनी"} />
            </div>
          </div>
        </div>
      </header>

      {/* === Main Content === */}
      <main className="container mt-8">
        {animals.length === 0 ? (
          <div className="mt-12 text-center py-16 card">
            <div className="text-5xl">🐄</div>
            <h2 className="mt-4 text-xl font-semibold">
              {lang === "en" ? "No animals yet" : "अभी कोई पशु नहीं"}
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              {lang === "en"
                ? "Seed some animals or press simulate to create sample vitals."
                : "कुछ पशु जोड़ें या सैंपल vitals बनाने के लिए सिमुलेट दबाएँ।"}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-4">
            {animals.map((a) => (
              <AnimalCard
                key={a._id}
                animal={a}
                lang={lang}
                onOpen={() => openDetails(a)}
                onSimulateFever={() => handleSimulate(a._id)}
                onSync={() => handleSync(a)}
              />
            ))}
          </div>
        )}
      </main>

      {/* === Details Modal === */}
      {selected && <DetailsModal selected={selected} onClose={closeDetails} lang={lang} />}

      {/* === Floating Language Toggle === */}
      <button
        onClick={() => setLang(lang === "en" ? "hi" : "en")}
        className="fixed bottom-6 right-6 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg transition text-sm font-semibold z-50"
      >
        🌐 {lang === "en" ? "हिंदी" : "English"}
      </button>
    </div>
  );
}