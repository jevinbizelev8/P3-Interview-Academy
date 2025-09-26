import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use((req, res, next) => {
    if (req.path.includes("..") || /(^|\/)\./.test(req.path)) {
      return res.status(404).json({ message: "Not found" });
    }
    next();
  });

  app.use(express.static(distPath, { index: false, extensions: [] }));

  app.use("*", (req, res) => {
    if (req.method !== "GET") {
      return res.status(404).json({ message: "Not found" });
    }

    const acceptsHtml = req.headers.accept?.includes("text/html");
    const pathname = req.originalUrl.split("?")[0];
    const hasExtension = path.extname(pathname) !== "";

    if (!acceptsHtml || hasExtension) {
      return res.status(404).json({ message: "Not found" });
    }

    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
