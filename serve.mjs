// Local preview of dist/ that mimics Vercel's cleanUrls and 404 handling.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".xml": "application/xml", ".txt": "text/plain", ".mp4": "video/mp4", ".json": "application/json" };
const port = Number(process.env.PORT) || 4321;

createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^([/\\])+/, "");
  const candidates = path === "" || path === "." ? ["index.html"] : extname(path) ? [path] : [`${path}.html`, join(path, "index.html")];
  for (const c of candidates) {
    try {
      const body = await readFile(join("dist", c));
      res.writeHead(200, { "Content-Type": TYPES[extname(c)] || "application/octet-stream" });
      return res.end(body);
    } catch {}
  }
  res.writeHead(404, { "Content-Type": TYPES[".html"] });
  res.end(await readFile("dist/404.html"));
}).listen(port, () => console.log(`http://localhost:${port}`));
