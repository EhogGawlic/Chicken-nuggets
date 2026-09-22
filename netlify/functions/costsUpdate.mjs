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

export async function handler(event) {
	if (event.httpMethod !== "POST") {
		return { statusCode: 405, body: "Method Not Allowed" };
	}

	try {
        const body = JSON.parse(event.body || "{}");
        const auth = event.headers.authorization || event.headers.Authorization
        const supplied = auth?.startsWith("Bearer ") ? auth.slice(7) : ""

        if (supplied !== process.env.ADMIN_PASSWORD) {
            return { statusCode: 401, body: "Unauthorized" }
        }

        const values = body.values
        if (!values || typeof values !== "object" || Array.isArray(values)) {
            return { statusCode: 400, body: 'Expected { "values": { ... } }' }
        }
        // Keep the stored doc to plain strings/numbers only, so a bad
        // request can't jam something the game's Decimal parsing chokes on.
        for (const [key, val] of Object.entries(values)) {
            if (typeof val !== "string" && typeof val !== "number") {
                return { statusCode: 400, body: `Invalid value for "${key}"` }
            }
        }

        const client = await getClient().catch((e) => {
            console.error('Mongo connect error:', e);
            throw e;
        });
        const dbName = 'rice';
        const collName = 'config';
        const db = client.db(dbName);
        const col = db.collection(collName);
        await col.updateOne({ _id: 'prices' }, { $set: { values } }, { upsert: true })

		return {
			statusCode: 200,
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ error: "Success" }),
		};
	} catch {
		return {
			statusCode: 400,
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ error: "Invalid JSON" }),
		};
	}
}
