import { getStore } from "@netlify/blobs";

const STORE_NAME = "floorplan";
const KEY = "state";
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default async (req, context) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  const store = getStore({ name: STORE_NAME, consistency: "strong" });

  // GET — return saved state (or null if none)
  if (req.method === "GET") {
    try {
      const data = await store.get(KEY);
      return new Response(data || "null", {
        status: 200,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    } catch {
      return new Response("null", {
        status: 200,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }
  }

  // POST — save state
  if (req.method === "POST") {
    try {
      const body = await req.text();
      JSON.parse(body); // validate JSON
      await store.set(KEY, body);
      return new Response('{"ok":true}', {
        status: 200,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }
  }

  return new Response("Method not allowed", { status: 405, headers: CORS });
};
