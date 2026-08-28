
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
        const client = await getClient().catch((e) => {
            console.error('Mongo connect error:', e);
            throw e;
        });
        const dbName = 'rice';
        const collName = 'leaderboard';
        const db = client.db(dbName);
        const col = db.collection(collName);
        await col.deleteOne({name: body.name})
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
