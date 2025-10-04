import mongoose from 'mongoose';

// Cached connection for the Apostas database to avoid creating a new
// connection per request/team. Mirrors the pattern used in lib/mongodb.js
// but returns a createConnection instance so models can be created dynamically.
let cachedApostas = global.apostasConnection;

if (!cachedApostas) {
  cachedApostas = global.apostasConnection = { conn: null, promise: null };
}

export async function getApostasConnection() {
  if (cachedApostas.conn) return cachedApostas.conn;

  if (!cachedApostas.promise) {
    const APOSTAS_URI = process.env.MONGODB_URI.replace('/Empates', '/Apostas');
    const opts = {
      bufferCommands: false,
      // use unified topology defaults
    };
    cachedApostas.promise = mongoose.createConnection(APOSTAS_URI, opts).asPromise().then(conn => conn);
  }

  try {
    cachedApostas.conn = await cachedApostas.promise;
  } catch (e) {
    cachedApostas.promise = null;
    throw e;
  }

  return cachedApostas.conn;
}

// Simple in-memory cache for mapping teamName -> collectionName
// Stored on the global to persist across module reloads in dev
if (!global.apostasCache) global.apostasCache = { teamToCollection: null };

export function getCachedTeamCollectionMap() {
  return global.apostasCache.teamToCollection || null;
}

export function setCachedTeamCollectionMap(map) {
  global.apostasCache.teamToCollection = map;
}

export function clearApostasCache() {
  global.apostasCache.teamToCollection = null;
}
