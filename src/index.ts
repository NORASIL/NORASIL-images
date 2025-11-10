import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { mkdirSync, existsSync } from "fs";

// Ensure images directory exists
if (!existsSync("images")) {
  mkdirSync("images", { recursive: true });
  console.log("Created directory: images");
}

const app = new Hono();

app.get("/", (c) => {
  return c.text("Static Image Server");
});

app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Serve static files from the 'images' directory
app.use("/images/*", serveStatic({ root: "./" }));

const port = parseInt(process.env.PORT || "3000", 10);
const host = process.env.HOST || "0.0.0.0";

console.log(`Server is running on http://${host}:${port}`);
console.log(`Serving static files from: ./images/`);

serve({
  fetch: app.fetch,
  port,
  hostname: host,
});
