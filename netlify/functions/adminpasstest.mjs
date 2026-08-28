export async function handler(event) {
	if (event.httpMethod !== "POST") {
		return { statusCode: 405, body: "Method Not Allowed" };
	}

	try {
		const { value } = JSON.parse(event.body || "{}");
		const agreed = typeof value === "string" && value === process.env.ADMIN_PASSWORD;

		return {
			statusCode: agreed ? 200 : 401,
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ agreed }),
		};
	} catch {
		return {
			statusCode: 400,
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ error: "Invalid JSON" }),
		};
	}
}
