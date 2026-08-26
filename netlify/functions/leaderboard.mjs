// netlify/functions/leaderboard.js
import { MongoClient } from 'mongodb';
let cachedClient = null;

async function getClient() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_KEY || process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGO_URI / MONGODB_KEY not set');
  if (cachedClient) return cachedClient;
  const client = new MongoClient(uri);
  await client.connect();
  cachedClient = client;
  return client;
}

// Parse compact suffixes used by the client (e.g. "1.2K", "3M", etc.)
function parseScoreText(s) {
  if (s === undefined || s === null) return NaN;
  let str = String(s).trim();
  if (!str) return NaN;
  str = str.replace(/,/g, '');
  const m = str.match(/^([+-]?[0-9]*\.?[0-9]+)\s*([A-Za-z]+)?$/);
  if (!m) return NaN;
  const num = parseFloat(m[1]);
  const suffix = (m[2] || '').trim();
  const suffixes = [
    "",
    "K",
    "M",
    "B",
    "T",
    "Qd",
    "Qi",
    "Sx",
    "Sp",
    "Oc",
    "No",
    "Dc",
    "UDc",
    "DDc",
    "TDc",
    "QaD",
    "QiD",
    "SxD",
    "SpD",
    "OcD",
    "NoD",
    "Vg",
    "UVg",
    "DVg",
    "TVg",
    "Qag",
    "Qig",
    "Sxg",
    "Spg",
    "Ocg",
    "Nog",
    "Dcg",
    "UDcg",
    "DDcg",
    "TDcg",
    "Qadcg",
    "Qidcg",
    "Sxdcg",
    "Spdcg",
    "Odcg",
    "Nodcg",
  ];
  const idx = suffixes.findIndex((x) => x.toLowerCase() === suffix.toLowerCase());
  if (idx === -1) {
    // unknown suffix — try to parse plain number
    return num;
  }
  const value = num * Math.pow(1000, idx);
  return value;
}

export async function handler(event) {
  try {
    const client = await getClient().catch((e) => {
      console.error('Mongo connect error:', e);
      throw e;
    });
    const dbName = rice;
    const collName = leaderboard;
    const db = client.db(dbName);
    const col = db.collection(collName);

    if (event.httpMethod === 'GET') {
      const qs = event.queryStringParameters || {};
      const limit = Math.min(parseInt(qs.limit) || 10, 100);
      const top = await col.find().sort({ score: -1, createdAt: 1 }).limit(limit).toArray();
      return { statusCode: 200, body: JSON.stringify(top) };
    }

    if (event.httpMethod === 'POST') {
      let body;
      try { body = JSON.parse(event.body); } catch { return { statusCode: 400, body: 'invalid json' }; }
      const { name } = body || {};
      if (!name) return { statusCode: 400, body: 'invalid payload: missing name' };

      // Accept either numeric `score` or textual `scoreText` (compact suffixes)
      let numericScore = null;
      let scoreText = null;
      if (body.score !== undefined && typeof body.score === 'number' && Number.isFinite(body.score)) {
        numericScore = body.score;
        scoreText = String(body.score);
      } else if (body.scoreText) {
        scoreText = String(body.scoreText);
        // try to parse compact suffixes like 1.2K, 3M, etc.
        const parsed = parseScoreText(scoreText);
        if (Number.isFinite(parsed)) numericScore = parsed;
      }

      const doc = { name: String(name).slice(0, 64), score: numericScore, scoreText, createdAt: new Date() };
      await col.insertOne(doc);
      return { statusCode: 201, body: JSON.stringify({ ok: true }) };
    }


    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (err) {
    console.error('Function error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}