// src/App.jsx
import React, { useEffect, useState } from 'react';
import db, { seedIfEmpty } from './db';        // localStorage DB shim
import seedData from './seed.json';
import AnimalCard from './components/AnimalCard';
import { simulateFever } from './simulate';
import './index.css';

export default function App() {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  // load all animals from DB
  async function loadAnimals() {
    try {
      const res = await db.allDocs({ include_docs: true });
      const docs = res.rows.map(r => r.doc).sort((a, b) => (a.tag || '').localeCompare(b.tag || ''));
      setAnimals(docs);
    } catch (err) {
      console.error('loadAnimals err', err);
    }
  }

  // on mount: seed DB (from seed.json) and subscribe to changes
  useEffect(() => {
    let changesFeed;
    (async () => {
      await seedIfEmpty(seedData); // seeds only if empty
      await loadAnimals();

      // subscribe to change events emitted by the shim
      changesFeed = db.changes({ live: true, since: 'now', include_docs: true })
        .on('change', () => {
          // simple reload when change happens
          loadAnimals();
        });
    })();

    return () => {
      // cleanup change feed
      try { changesFeed?.cancel?.(); } catch (e) {}
    };
  }, []);

  // simulate fever on an animal
  async function handleSimulate(id) {
    try {
      await simulateFever(id);
      // loadAnimals will be triggered by change feed, but ensure state updates
      await loadAnimals();
    } catch (err) {
      console.error('simulate err', err);
    }
  }

  // mark a doc as synced (demo sync)
  async function handleSync(id) {
    try {
      const doc = await db.get(id);
      doc.synced = true;
      await db.put(doc);
      await loadAnimals();
    } catch (err) {
      console.error('sync err', err);
    }
  }

  function openDetails(doc) {
    setSelected(doc);
  }
  function closeDetails() {
    setSelected(null);
  }

  if (loading && animals.length === 0) {
    // small delay - ensure we show nothing while loading
    // after seed/load, animals will render
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <header className="max-w-5xl mx-auto mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Smart Livestock — Prototype</h1>
          <div className="text-sm text-gray-600">Offline-first demo · Simulate alerts · Sync</div>
        </div>
        <div className="text-sm text-gray-700">
          <span className="mr-4">Animals: <strong>{animals.length}</strong></span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {animals.map(a => (
          <AnimalCard
            key={a._id}
            animal={a}
            onOpen={() => openDetails(a)}
            onSimulateFever={() => handleSimulate(a._id)}
            onSync={() => handleSync(a._id)}
          />
        ))}
      </main>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white rounded-lg w-11/12 md:w-2/3 p-6 shadow-lg">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold">{selected.tag} — {selected.species}</h2>
                <div className="text-sm text-gray-600">Age: {selected.age_months} months · {selected.gender}</div>
              </div>
              <button onClick={closeDetails} className="text-sm px-3 py-1 border rounded">Close</button>
            </div>

            <div className="mt-4">
              <h3 className="font-semibold">Latest Vitals</h3>
              <pre className="bg-slate-50 p-3 rounded mt-2 text-sm overflow-auto">
                {JSON.stringify((selected.vitals_history || []).slice(-8), null, 2)}
              </pre>

              <h3 className="font-semibold mt-4">Alerts</h3>
              {selected.alerts && selected.alerts.length ? (
                <ul className="list-disc ml-5 text-sm mt-2">
                  {selected.alerts.map((al, i) => (
                    <li key={i}>
                      {al.message || al.type} <span className="text-xs text-gray-400">({al.severity})</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-gray-500 mt-2">No alerts</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
