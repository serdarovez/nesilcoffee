import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PORT = 9225;
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "public");

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });
    res.end();
    return;
  }
  if (req.method !== "POST") {
    res.writeHead(405, { "Access-Control-Allow-Origin": "*" });
    res.end("only POST");
    return;
  }
  try {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const body = Buffer.concat(chunks);
    const rel = decodeURIComponent(req.url.replace(/^\/+/, ""));
    if (!rel || rel.includes("..")) throw new Error("bad path");
    const dest = path.join(ROOT, rel);
    if (!dest.startsWith(ROOT)) throw new Error("escape");
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, body);
    console.log(`wrote ${rel} (${body.length} bytes)`);
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    });
    res.end(JSON.stringify({ ok: true, path: rel, bytes: body.length }));
  } catch (e) {
    res.writeHead(500, { "Access-Control-Allow-Origin": "*" });
    res.end(String(e));
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`figma receiver on http://127.0.0.1:${PORT}, saving under ${ROOT}`);
});
