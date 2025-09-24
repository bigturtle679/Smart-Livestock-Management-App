// src/simulate.js
import db from "./db";
import { detectAnomalies } from "./utils/alerts";

export async function simulateFever(animalId) {
  try {
    const doc = await db.get(animalId);

    // get last known vitals or fall back to safe defaults
    const last = (doc.vitals_history || []).slice(-1)[0] || {
      weight: 300,
      feed_intake: 5,
      temp: 38.5,
      hr: 75,
    };

    // generate new vitals with fever-like values
    const newVitals = {
      ts: Date.now(),
      temp: 40 + Math.random(), // feverish temp
      hr: 90 + Math.floor(Math.random() * 20),
      weight: last.weight,
      feed_intake: Math.max(0, last.feed_intake - 0.5),
    };

    // append vitals history safely
    doc.vitals_history = [...(doc.vitals_history || []), newVitals];
    doc.synced = false;

    // run anomaly detection
    doc.alerts = detectAnomalies(doc);

    // save updated doc
    await db.put(doc);
    return doc;
  } catch (err) {
    console.error("simulateFever failed:", err);
    return null;
  }
}