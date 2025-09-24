// src/components/AnimalCard.jsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * AnimalCard (flex-based layout to avoid overflow)
 *
 * Props:
 *  - animal (object)
 *  - lang (string) "en" | "hi"
 *  - onOpen(animal)
 *  - onSimulateFever(animal) -> async
 *  - onSync(animal)
 */

/* -------------------------
   Sparkline util (inline SVG)
   ------------------------- */
function Sparkline({ history = [], width = 88, height = 28, color = "#F87171", idSuffix = "spark" }) {
  const vals = (history || []).slice(-8).map((v) => (typeof v.temp === "number" ? v.temp : null)).filter(v => v !== null);
  if (!vals.length) {
    return (
      <div className="inline-block ml-3 text-xs text-gray-400" style={{ width, height, lineHeight: `${height}px` }}>
        — no data
      </div>
    );
  }

  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const pad = 4;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;

  const points = vals.map((v, i) => {
    const x = pad + (i / Math.max(1, vals.length - 1)) * innerW;
    const y = pad + innerH - ((v - min) / range) * innerH;
    return [x, y];
  });

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(" ");
  const areaD =
    points.length > 0
      ? `${pathD} L ${points[points.length - 1][0].toFixed(2)} ${height - pad} L ${points[0][0].toFixed(2)} ${height - pad} Z`
      : "";
  const gradId = `g-${idSuffix}`;

  return (
    <svg width={width} height={height} className="inline-block ml-3 align-middle" role="img" aria-hidden>
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.12" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      <path d={areaD} fill={`url(#${gradId})`} stroke="none" />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {points.length > 0 && (
        <circle cx={points[points.length - 1][0]} cy={points[points.length - 1][1]} r="2.5" fill={color} />
      )}
    </svg>
  );
}

/* -------------------------
   Full Component
   ------------------------- */
export default function AnimalCard({ animal, lang = "en", onOpen, onSimulateFever, onSync }) {
  const [animating, setAnimating] = useState(false);
  const [busy, setBusy] = useState(false);

  const hasAlerts = Array.isArray(animal.alerts) && animal.alerts.length > 0;
  const highestSeverity = hasAlerts ? (animal.alerts[0].severity || "").toLowerCase() : null;

  const status =
    highestSeverity === "critical"
      ? "critical"
      : highestSeverity === "warning"
      ? "warning"
      : hasAlerts
      ? "warning"
      : "healthy";

  const badge = {
    critical: { label: lang === "en" ? "CRITICAL" : "गंभीर", color: "bg-red-600", text: "text-red-50" },
    warning: { label: lang === "en" ? "WARNING" : "चेतावनी", color: "bg-amber-500", text: "text-900" },
    healthy: { label: lang === "en" ? "Healthy" : "स्वस्थ", color: "bg-emerald-500", text: "text-900" },
  }[status];

  async function handleSimulate() {
    if (busy) return;
    setBusy(true);
    setAnimating(true);
    try {
      if (onSimulateFever) await onSimulateFever(animal._id || animal);
      else await new Promise((r) => setTimeout(r, 400));
    } catch (err) {
      console.error("simulate failed", err);
    } finally {
      setTimeout(() => {
        setAnimating(false);
        setBusy(false);
      }, 900);
    }
  }

  const sparkColor = status === "critical" ? "#ef4444" : status === "warning" ? "#f59e0b" : "#10b981";
  const last = (animal.vitals_history || []).slice(-1)[0] || {};
  const tempDisplay = typeof last.temp === "number" ? last.temp.toFixed(1) : "—";
  const hrDisplay = last.hr ?? "—";
  const weightDisplay = last.weight ?? "—";

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="relative bg-white rounded-lg p-6 shadow-sm border border-gray-100 overflow-visible"
    >
      {/* top: tag + status */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-baseline gap-3">
            <h3 className="text-lg font-semibold">{animal.tag}</h3>
            <span className="text-sm text-gray-500 ml-1">· {animal.species?.toLowerCase()}</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {lang === "en" ? "Age" : "उम्र"}: {animal.age_months} {lang === "en" ? "mo" : "महीने"} · {animal.gender}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.color} ${badge.text} shadow-sm`}>
            {badge.label}
          </div>
          <div className="text-xs text-gray-400">
            {animal.synced ? (lang === "en" ? "Synced" : "सिंक्ड") : (lang === "en" ? "Unsynced" : "अनसिंक")}
          </div>
        </div>
      </div>

      {/* main: avatar + content */}
      <div className="mt-4 flex flex-col sm:flex-row gap-4 items-start">
        {/* avatar area */}
        <div className="flex-shrink-0 w-28 flex items-center justify-center">
          <div className="relative">
            <AnimatePresence>
              {animating && (
                <motion.div
                  key="pulse"
                  initial={{ scale: 1, opacity: 0.9 }}
                  animate={{ scale: 1.45, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                  className="absolute inset-0 rounded-full border-2 border-red-400/50"
                />
              )}
            </AnimatePresence>

            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center bg-white shadow-md ${
                status === "critical" ? "ring-4 ring-red-200" : status === "warning" ? "ring-4 ring-amber-100" : "ring-4 ring-emerald-100"
              }`}
            >
              <div className="text-3xl">{animal.species?.toLowerCase().startsWith("cow") ? "🐄" : "🐐"}</div>
            </div>
          </div>
        </div>

        {/* content area */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            {/* left vitals + sparkline */}
            <div className="flex items-center gap-6 min-w-0 flex-wrap">
              <div className="flex items-center gap-3 text-sm text-gray-600 min-w-[120px]">
                <span className="inline-flex items-center text-red-600 mr-1">🌡️</span>
                <div>
                  <div className="text-sm text-gray-800 font-semibold">{tempDisplay} °C</div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm text-gray-600 min-w-[100px]">
                <span className="inline-flex items-center text-pink-500 mr-1">💓</span>
                <div className="text-sm text-gray-800 font-semibold">{hrDisplay} bpm</div>
              </div>

              <div className="flex items-center gap-3 text-sm text-gray-600 min-w-[110px]">
                <span className="inline-flex items-center text-sky-500 mr-1">⚖️</span>
                <div className="text-sm text-gray-800 font-semibold">{weightDisplay} kg</div>
              </div>

              <div className="flex items-center">
                <Sparkline history={animal.vitals_history} width={96} height={34} color={sparkColor} idSuffix={animal._id || Math.random()} />
              </div>
            </div>

            {/* actions area (keeps inside card) */}
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <button
                onClick={() => onOpen && onOpen(animal)}
                className="text-sm text-indigo-600 hover:underline"
                aria-label="Details"
              >
                {lang === "en" ? "Details" : "विवरण"}
              </button>

              <button
                onClick={handleSimulate}
                className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm text-white ${
                  busy ? "bg-gray-400 cursor-not-allowed" : "bg-amber-500 hover:bg-amber-600"
                }`}
                title={lang === "en" ? "Simulate fever" : "बुखार सिमुलेट करें"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0010 1H6a1 1 0 00-.8 1.6L8.2 8H4a1 1 0 00-.8 1.6l6 9A1 1 0 0010 19h4a1 1 0 00.8-1.6L11.3 1.046z" clipRule="evenodd" />
                </svg>
                {lang === "en" ? "Simulate" : "सिमुलेट"}
              </button>

              <button
                onClick={() => onSync && onSync(animal)}
                className="flex items-center gap-2 px-3 py-1 rounded-md text-sm bg-gray-200 text-gray-700 hover:bg-gray-300"
                title={lang === "en" ? "Mark as synced" : "सिंक चिह्नित करें"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                  <path fillRule="evenodd" d="M4 4a1 1 0 011-1h3a1 1 0 010 2H6.414l2.293 2.293A1 1 0 018.293 8.707L4 4.414V7a1 1 0 01-2 0V5a1 1 0 011-1zm12 12a1 1 0 01-1 1h-3a1 1 0 110-2h2.586l-2.293-2.293a1 1 0 011.414-1.414L16 15.586V13a1 1 0 112 0v2z" clipRule="evenodd" />
                </svg>
                {lang === "en" ? "Sync" : "सिंक"}
              </button>
            </div>
          </div>

          {/* alerts preview */}
          <div className="mt-4">
            {hasAlerts ? (
              <div className="text-sm text-red-600 flex items-start gap-2">
                <span className="mt-0.5">🔔</span>
                <div>
                  <div className="font-semibold">{lang === "en" ? "Alerts" : "चेतावनी"}</div>
                  <ul className="text-xs text-gray-600">
                    {animal.alerts.slice(0, 2).map((a, i) => (
                      <li key={i}>
                        {a.message} <span className="text-xs text-gray-400">({a.severity?.toLowerCase()})</span>
                      </li>
                    ))}
                    {animal.alerts.length > 2 && <li className="text-xs text-gray-400">+ more</li>}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-400">{lang === "en" ? "No alerts" : "कोई चेतावनी नहीं"}</div>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
}