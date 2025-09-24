// src/components/AnimalCard.jsx
import React from 'react';

export default function AnimalCard({ animal, onOpen, onSimulateFever, onSync }) {
  const latestVitals = (animal.vitals_history || []).slice(-1)[0] || {};
  const alerts = animal.alerts || [];

  // Decide health status
  const status = () => {
    if (alerts.some(a => a.severity === 'critical'))
      return { text: 'CRITICAL', color: 'bg-red-600' };
    if (alerts.length > 0)
      return { text: 'WARNING', color: 'bg-yellow-500' };
    return { text: 'Healthy', color: 'bg-green-600' };
  };

  return (
    <div className="border rounded-lg p-4 shadow-sm bg-white flex flex-col justify-between w-full">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xl font-bold">
            {animal.tag}{' '}
            <span className="text-sm text-gray-500">· {animal.species}</span>
          </div>
          <div className="text-sm text-gray-600">
            Age: {animal.age_months} mo · {animal.gender}
          </div>
        </div>

        <div className="flex flex-col items-end space-y-2">
          <div
            className={`px-3 py-1 text-white rounded-full text-sm ${status().color}`}
          >
            {status().text}
          </div>
          {animal.synced === false && (
            <div className="px-2 py-0.5 bg-gray-800 text-white text-xs rounded">
              Unsynced
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 text-sm text-gray-700">
        <div>
          Temp: <span className="font-medium">{latestVitals.temp ?? '—'} °C</span>
        </div>
        <div>
          HR: <span className="font-medium">{latestVitals.hr ?? '—'} bpm</span>
        </div>
        <div>
          Weight:{' '}
          <span className="font-medium">
            {latestVitals.weight ??
              (animal.weight_history?.slice(-1)[0]?.weight ?? '—')}{' '}
            kg
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={onOpen}
            className="px-3 py-1 bg-blue-600 text-white rounded"
          >
            Details
          </button>
          <button
            onClick={onSimulateFever}
            className="px-3 py-1 bg-orange-500 text-white rounded text-sm"
          >
            Simulate Fever
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onSync}
            className="text-xs px-2 py-1 border rounded"
          >
            Sync
          </button>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="mt-3">
          <div className="text-xs font-semibold text-red-700">Alerts</div>
          <ul className="text-xs text-gray-700 list-disc ml-4">
            {alerts.slice(0, 3).map((a, i) => (
              <li key={i}>
                {a.message || a.type}{' '}
                <span className="text-gray-400">({a.severity})</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
