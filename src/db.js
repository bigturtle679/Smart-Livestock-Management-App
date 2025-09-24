// src/db.js
// Minimal localStorage-backed "DB shim" with a Pouch-like API used for the hackathon.
// Simple, synchronous-ish, and emits change events so the UI can react.

const KEY = 'livestock_db_docs_v1';

// Basic in-memory cache loaded from localStorage
let docs = {};
try {
  const raw = localStorage.getItem(KEY);
  docs = raw ? JSON.parse(raw) : {};
} catch (e) {
  docs = {};
}

function persist() {
  localStorage.setItem(KEY, JSON.stringify(docs));
  // emit change event for listeners
  const ev = new CustomEvent('localdb:change', { detail: { docs } });
  window.dispatchEvent(ev);
}

function toDocArray() {
  return Object.values(docs);
}

export async function seedIfEmpty(seedData = []) {
  // seedData should be array of docs
  if (toDocArray().length === 0 && seedData.length) {
    seedData.forEach((d, i) => {
      const id = d._id || `animal_${i + 1}`;
      docs[id] = { ...d, _id: id };
    });
    persist();
    console.log('Local DB seeded:', Object.keys(docs).length);
  } else {
    // nothing to do
    // console.log('Local DB already has docs');
  }
}

// API: allDocs({include_docs:true})
export default {
  async allDocs({ include_docs = true } = {}) {
    const rows = toDocArray().map(doc => ({ id: doc._id, key: doc._id, doc }));
    return { total_rows: rows.length, rows };
  },

  // get doc by id
  async get(id) {
    if (!docs[id]) throw new Error('not_found');
    return JSON.parse(JSON.stringify(docs[id]));
  },

  // put doc (create or update)
  async put(doc) {
    if (!doc._id) {
      doc._id = `animal_${Date.now()}`;
    }
    // save shallow copy
    docs[doc._id] = JSON.parse(JSON.stringify(doc));
    persist();
    return { ok: true, id: doc._id };
  },

  // bulk insert
  async bulkDocs(array) {
    array.forEach(d => {
      const id = d._id || `animal_${Date.now()}_${Math.floor(Math.random()*1000)}`;
      docs[id] = { ...d, _id: id };
    });
    persist();
    return { ok: true };
  },

  // minimal changes feed: returns an object with on('change', cb) and cancel()
  changes(opts = {}) {
    const listeners = [];
    function on(event, cb) {
      if (event === 'change') {
        const wrapper = (e) => cb(e.detail);
        listeners.push({ cb, wrapper });
        window.addEventListener('localdb:change', wrapper);
      }
      return this;
    }
    function cancel() {
      listeners.forEach(l => window.removeEventListener('localdb:change', l.wrapper));
    }
    return { on, cancel };
  },

  // helper to expose underlying docs for debugging
  _raw() {
    return docs;
  },

  // convenience: allow injecting seed data programmatically
  async _seedFromData(seedData) {
    await seedIfEmpty(seedData);
  }
};
