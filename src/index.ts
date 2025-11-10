import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { mkdirSync, existsSync, readdirSync, statSync } from "fs";
import { join } from "path";

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

// Debug endpoint: list all files in images directory
app.get("/debug/files", (c) => {
  try {
    const files: string[] = [];
    const walkDir = (dir: string, prefix = "") => {
      const items = readdirSync(dir);
      items.forEach((item) => {
        const fullPath = join(dir, item);
        const relativePath = prefix ? `${prefix}/${item}` : item;
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          walkDir(fullPath, relativePath);
        } else {
          files.push(relativePath);
        }
      });
    };
    
    if (existsSync("images")) {
      walkDir("images");
    }
    
    return c.json({
      total: files.length,
      files: files,
      cwd: process.cwd(),
      imagesExists: existsSync("images"),
    });
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

// Debug endpoint: environment info
app.get("/debug/env", (c) => {
  return c.json({
    PORT: process.env.PORT,
    HOST: process.env.HOST,
    NODE_ENV: process.env.NODE_ENV,
    cwd: process.cwd(),
    __dirname: import.meta.url,
  });
});

// Debug endpoint: check if specific file exists
app.get("/debug/check/:filename", (c) => {
  const filename = c.req.param("filename");
  const path = join("images", filename);
  return c.json({
    filename,
    path,
    exists: existsSync(path),
    cwd: process.cwd(),
  });
});

// Serve static files from the 'images' directory
app.use("/images/*", serveStatic({ root: "./" }));

const port = parseInt(process.env.PORT || "3000", 10);
const host = process.env.HOST || "0.0.0.0";

console.log(`Server is running on http://${host}:${port}`);
console.log(`Serving static files from: ./images/`);
console.log(`Current working directory: ${process.cwd()}`);

serve({
  fetch: app.fetch,
  port,
  hostname: host,
});
