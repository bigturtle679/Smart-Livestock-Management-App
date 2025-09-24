// src/utils/alerts.js

// Very basic rules: fever if temp > 39.5, weight loss >10%
export function detectAnomalies(doc) {
  const alerts = [];

  const vitals = doc.vitals_history || [];
  if (vitals.length === 0) return [];

  const latest = vitals[vitals.length - 1] || {};

  // Fever check
  if (latest.temp && latest.temp > 39.5) {
    alerts.push({
      type: "fever",
      severity: "critical",
      message: `High temperature detected: ${latest.temp.toFixed(1)} °C`,
    });
  }

  // Weight trend check
  if (vitals.length > 1) {
    const firstWeight = vitals[0].weight ?? latest.weight ?? 0;
    const latestWeight = latest.weight ?? firstWeight;

    if (firstWeight > 0) {
      const change = ((latestWeight - firstWeight) / firstWeight) * 100;
      if (change < -10) {
        alerts.push({
          type: "weight-loss",
          severity: "warning",
          message: `Weight drop of ${Math.abs(change).toFixed(1)}% detected`,
        });
      }
    }
  }

  return alerts;
}