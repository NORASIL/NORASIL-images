import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { config } from "dotenv";
import { mkdirSync, existsSync } from "fs";
import buildsRouter from "./routes/builds";
import imagesRouter from "./routes/images";
import uploadRouter from "./routes/upload";

config(); // Load environment variables

// Ensure required directories exist
["uploads", "images"].forEach((dir) => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Serve static files from the 'uploads' directory
app.use("/uploads/*", serveStatic({ root: "./" }));

// Serve static files from the 'images' directory
app.use("/images/*", serveStatic({ root: "./" }));

// Use regex router for better performance
app.route("/images", uploadRouter);
app.route("/images", buildsRouter);
app.route("/images", imagesRouter);

const port = parseInt(process.env.PORT || "3000", 10);
const host = process.env.HOST || "0.0.0.0";

console.log(`Server is running on http://${host}:${port}`);

serve({
  fetch: app.fetch,
  port,
  hostname: host,
});
