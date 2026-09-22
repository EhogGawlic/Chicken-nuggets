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
	if (event.httpMethod !== "GET") {
		return { statusCode: 405, body: "Method Not Allowed" };
	}

	try {
        const client = await getClient().catch((e) => {
            console.error('Mongo connect error:', e);
            throw e;
        });
        const dbName = 'rice';
        const collName = 'config';
        const db = client.db(dbName);
        const col = db.collection(collName);
        const doc = await col.findOne({ _id: 'prices' });

		return {
			statusCode: 200,
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify((doc && doc.values) || {}),
		};
	} catch (e) {
		console.error('costs handler error:', e);
		return {
			statusCode: 500,
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ error: "Failed to load prices" }),
		};
	}
}
