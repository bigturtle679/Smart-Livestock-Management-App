// src/components/AnimalCard.jsx
import React from "react";
import { Thermometer, HeartPulse, Scale, Bell } from "lucide-react";
import { motion } from "framer-motion";

export default function AnimalCard({ animal, lang, onOpen, onSimulateFever, onSync }) {
  const latestVitals = (animal.vitals_history || []).slice(-1)[0] || {};
  const alerts = animal.alerts || [];

  // determine health status
  const status = () => {
    if (alerts.some((a) => a.severity === "critical")) {
      return { text: lang === "en" ? "CRITICAL" : "गंभीर", cls: "badge-critical", ring: "ring-red-500" };
    }
    if (alerts.length > 0) {
      return { text: lang === "en" ? "WARNING" : "चेतावनी", cls: "badge-warning", ring: "ring-amber-500" };
    }
    return { text: lang === "en" ? "Healthy" : "स्वस्थ", cls: "badge-healthy", ring: "ring-emerald-500" };
  };

  const state = status();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.03, boxShadow: "0 8px 30px rgba(0,0,0,0.2)" }}
      transition={{ type: "spring", stiffness: 250, damping: 20 }}
      className={`card border-t-4 ${state.ring}`}
    >
      {/* Top row */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-bold">{animal.tag}</div>
          <div className="text-xs text-gray-500">{animal.species}</div>
        </div>
        <div className={`badge ${state.cls}`}>{state.text}</div>
      </div>

      {/* Avatar + vitals */}
      <div className="mt-4 flex items-center gap-4">
        {/* Avatar with health ring */}
        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl bg-white shadow-inner ring-4 ${state.ring}`}>
          {animal.species?.toLowerCase().includes("cow") ? "🐄" : "🐐"}
        </div>

        {/* Vitals */}
        <div className="flex-1 text-sm space-y-2">
          <div className="flex items-center gap-2">
            <Thermometer size={16} className="text-red-500" />
            <span>
              {lang === "en" ? "Temp" : "तापमान"}:{" "}
              <strong>{latestVitals.temp != null ? latestVitals.temp.toFixed(1) : "—"} °C</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <HeartPulse size={16} className="text-pink-500" />
            <span>
              {lang === "en" ? "HR" : "हृदय"}: <strong>{latestVitals.hr ?? "—"} bpm</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Scale size={16} className="text-blue-500" />
            <span>
              {lang === "en" ? "Weight" : "वज़न"}: <strong>{latestVitals.weight ?? "—"} kg</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex gap-2">
          <button onClick={onOpen} className="btn-primary">
            {lang === "en" ? "Details" : "विवरण"}
          </button>
          <button onClick={onSimulateFever} className="btn-accent text-sm">
            {lang === "en" ? "Simulate Fever" : "बुखार सिमुलेट करें"}
          </button>
        </div>
        <button onClick={onSync} className="btn-ghost text-xs">
          {lang === "en" ? "Sync" : "सिंक"}
        </button>
      </div>

      {/* Alerts preview */}
      {alerts.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-red-700">
            <Bell size={14} /> {lang === "en" ? "Alerts" : "चेतावनी"}
          </div>
          <ul className="mt-2 text-xs text-gray-700 list-disc ml-5">
            {alerts.slice(0, 2).map((a, i) => (
              <li key={i}>
                {a.message || a.type}{" "}
                <span className="text-gray-400 text-xs">({a.severity})</span>
              </li>
            ))}
            {alerts.length > 2 && <li className="text-gray-400">+{alerts.length - 2} more</li>}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
