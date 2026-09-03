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

function buildCompactSuffixes() {
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
  const illionUnitPrefixes = ["", "U", "D", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No"];
  const illionTensPrefixes = { 4: "Qag", 5: "Qig", 6: "Sxg", 7: "Spg", 8: "Ocg", 9: "Nog" };

  for (let group = suffixes.length; group <= 111; group += 1) {
    let suffix;
    if (group < 100) {
      const tens = Math.floor(group / 10);
      const units = group % 10;
      suffix = `${illionUnitPrefixes[units]}${illionTensPrefixes[tens]}`;
    } else if (group < 110) {
      suffix = `${illionUnitPrefixes[group - 100]}Ce`;
    } else {
      suffix = `${group === 110 ? 'De' : 'UDe'}Ce`;
    }
    suffixes.push(suffix);
  }

  return suffixes;
}

const compactSuffixes = buildCompactSuffixes();

// Parse compact suffixes used by the client (e.g. "1.2K", "3M", etc.) and scientific notation.
function parseScoreText(s) {
  if (s === undefined || s === null) return NaN;
  const str = String(s).replace(/,/g, '').trim();
  if (!str) return NaN;

  const scientific = str.match(/^([+-]?(?:\d+\.?\d*|\.\d+))(?:[eE]([+-]?\d+))$/);
  if (scientific) {
    const mantissa = Number(scientific[1]);
    const exponent = Number(scientific[2] || '0');
    if (!Number.isFinite(mantissa) || !Number.isFinite(exponent)) return NaN;
    return mantissa * 10 ** exponent;
  }

  const m = str.match(/^([+-]?(?:\d+\.?\d*|\.\d+))\s*([A-Za-z]+)?$/);
  if (!m) return NaN;

  const num = Number(m[1]);
  const suffix = (m[2] || '').trim();
  const idx = compactSuffixes.findIndex((x) => x.toLowerCase() === suffix.toLowerCase());
  if (idx < 0) return num;
  return num * 1000 ** idx;
}

function scoreOrder(scoreText) {
  if (scoreText === undefined || scoreText === null) return -Infinity;
  const str = String(scoreText).replace(/,/g, '').trim();
  if (!str) return -Infinity;

  const scientific = str.match(/^([+-]?(?:\d+\.?\d*|\.\d+))(?:[eE]([+-]?\d+))$/);
  if (scientific) {
    const mantissa = Number(scientific[1]);
    const exponent = Number(scientific[2] || '0');
    if (!Number.isFinite(mantissa) || !Number.isFinite(exponent)) return -Infinity;
    return Math.log10(Math.abs(mantissa)) + exponent;
  }

  const match = str.match(/^([+-]?(?:\d+\.?\d*|\.\d+))\s*([A-Za-z]+)?$/);
  if (!match) return -Infinity;

  const value = Number(match[1]);
  if (!Number.isFinite(value)) return -Infinity;
  const suffix = (match[2] || '').trim();
  const idx = compactSuffixes.findIndex((x) => x.toLowerCase() === suffix.toLowerCase());
  if (idx < 0) return Math.log10(Math.abs(value));
  return Math.log10(Math.abs(value)) + idx * 3;
}

export async function handler(event) {
  try {
    const client = await getClient().catch((e) => {
      console.error('Mongo connect error:', e);
      throw e;
    });
    const dbName = process.env.MONGO_DB_NAME || 'rice';
    const collName = process.env.MONGO_COLLECTION || 'leaderboard';
    const db = client.db(dbName);
    const col = db.collection(collName);

    if (event.httpMethod === 'GET') {
      const qs = event.queryStringParameters || {};
      const limit = Math.min(parseInt(qs.limit) || 10, 100);
      const top = await col.find().limit(limit).toArray();
      top.sort((a, b) => {
        const aOrder = scoreOrder(a.scoreText ?? a.score ?? 0);
        const bOrder = scoreOrder(b.scoreText ?? b.score ?? 0);
        if (bOrder !== aOrder) return bOrder - aOrder;

        const aScore = Number.isFinite(Number(a.score)) ? Number(a.score) : 0;
        const bScore = Number.isFinite(Number(b.score)) ? Number(b.score) : 0;
        if (bScore !== aScore) return bScore - aScore;

        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      });
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
      let order = -Infinity;
      if (body.score !== undefined && typeof body.score === 'number' && Number.isFinite(body.score)) {
        numericScore = body.score;
        scoreText = String(body.score);
        order = Math.log10(Math.abs(body.score));
      } else if (body.scoreText) {
        scoreText = String(body.scoreText);
        // try to parse compact suffixes like 1.2K, 3M, scientific notation, and the game's custom long-suffix format.
        const parsed = parseScoreText(scoreText);
        if (Number.isFinite(parsed)) numericScore = parsed;
        order = scoreOrder(scoreText);
      }

      const normalizedName = String(name).trim().slice(0, 64);
      if (!normalizedName) return { statusCode: 400, body: 'invalid payload: missing name' };

      await col.updateOne(
        { name: normalizedName },
        {
          $set: { score: numericScore, scoreText, scoreOrder: order },
          $setOnInsert: { name: normalizedName, createdAt: new Date() },
        },
        { upsert: true },
      );
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    }


    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (err) {
    console.error('Function error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}