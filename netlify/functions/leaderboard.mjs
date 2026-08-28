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

function scoreOrder(scoreText) {
  if (scoreText === undefined || scoreText === null) return -Infinity;
  const match = String(scoreText).replace(/,/g, '').trim().match(/^([+-]?[0-9]*\.?[0-9]+)\s*([A-Za-z]+)?$/);
  if (!match) return -Infinity;
  const suffixes = ["", "K", "M", "B", "T", "Qd", "Qi", "Sx", "Sp", "Oc", "No", "Dc", "UDc", "DDc", "TDc", "QaD", "QiD", "SxD", "SpD", "OcD", "NoD", "Vg", "UVg", "DVg", "TVg", "Qag", "Qig", "Sxg", "Spg", "Ocg", "Nog", "Dcg", "UDcg", "DDcg", "TDcg", "Qadcg", "Qidcg", "Sxdcg", "Spdcg", "Odcg", "Nodcg"];
  const units = ["", "U", "D", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No"];
  const tens = { 4: "Qag", 5: "Qig", 6: "Sxg", 7: "Spg", 8: "Ocg", 9: "Nog" };
  for (let group = suffixes.length; group <= 111; group += 1) {
    if (group < 100) {
      suffixes.push(`${units[group % 10]}${tens[Math.floor(group / 10)]}`);
    } else if (group < 110) {
      suffixes.push(`${units[group - 100]}Ce`);
    } else {
      suffixes.push(`${group === 110 ? "De" : "UDe"}Ce`);
    }
  }
  const suffixIndex = suffixes.findIndex((suffix) => suffix.toLowerCase() === (match[2] || '').toLowerCase());
  if (suffixIndex < 0) return -Infinity;
  return Math.log10(Number(match[1])) + suffixIndex * 3;
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
      const top = await col.find().sort({ scoreOrder: -1, score: -1, createdAt: 1 }).limit(limit).toArray();
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
        order = Math.log10(body.score);
      } else if (body.scoreText) {
        scoreText = String(body.scoreText);
        // try to parse compact suffixes like 1.2K, 3M, etc.
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