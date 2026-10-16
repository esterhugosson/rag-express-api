/**
 * @file Defines the main application.
 * @module src/server
 * @author Ester Hugosson
 * @version 1.0.0
 */

import "dotenv/config";
import httpContext from "express-http-context"; // Must be first!
import express from "express";
import "@lnu/json-js-cycle";
import cors from "cors";
import helmet from "helmet";
import { generalLimiter } from "./middleware/rateLimit.js";
import { randomUUID } from "node:crypto";
import http from "node:http";
import { connectToDatabase } from "./config/mongoose.js";
import { morganLogger } from "./config/morgan.js";
import { logger } from "./config/winston.js";
import { router } from "./routes/router.js";

try {
  // Connect to MongoDB.
  await connectToDatabase(process.env.DB_CONNECTION_STRING);

  // Create an Express application.
  const app = express();

  app.use(helmet());

  // Enable Cross Origin Resource Sharing (CORS) (https://www.npmjs.com/package/cors).
  const allowedOrigins = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map((o) => o.trim().replace(/\/+$/, ''))
  .filter(Boolean)
  
  // Set the base URL to use for all relative URLs in a document.
  const baseURL = process.env.BASE_Url || "/";

  //Required for render
  app.set("trust proxy", 1);

  // Health check: before the rate limiter, so Render's pings never count
  app.get("/health", (req, res) => res.json({ status: "ok" }));

  app.use(generalLimiter);

  // Parse requests of the content type application/json.
  app.use(express.json({ limit: "10kb" }));

  // Add the request-scoped context.
  app.use(httpContext.middleware);

  // Use a morgan logger.
  app.use(morganLogger);

  // Middleware to be executed before the routes.
  app.use((req, res, next) => {
    // Add a request UUID to each request and store information about
    // each request in the request-scoped context.
    req.requestUuid = randomUUID();
    httpContext.set("request", req);

    next();
  });

  // Register routes.
  app.use(baseURL, router);

  // Error handler.
  app.use((err, req, res, next) => {
    logger.error(err.message, { error: err });

    if (process.env.NODE_ENV === "production") {
      const status = err.status && err.status < 500 ? err.status : 500;
      return res.status(status).json({
        status,
        message: status < 500 ? err.message : http.STATUS_CODES[500],
      });
    }

    // ---------------------------------------------------
    // ⚠️ WARNING: Development Environment Only!
    //             Detailed error information is provided.
    // ---------------------------------------------------

    // Deep copies the error object and returns a new object with
    // enumerable and non-enumrele properties (cyclical structures are handled).
    const copy = JSON.decycle(err, { includeNonEnumerableProperties: true });

    return res.status(err.status || 500).json({
      status: err.status,
      message: err.message,
    });
    //.json(copy)
  });

  // Starts the HTTP server listening for connections.
  const server = app.listen(process.env.PORT, () => {
    logger.info(`Server running on port ${server.address().port}`)
  });

  // Graceful shutdown: Render sends SIGTERM on every deploy/restart
  process.on("SIGTERM", () => {
    logger.info("SIGTERM received, shutting down gracefully");
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref()
  });
} catch (err) {
  logger.error(err.message, { error: err });
  process.exit(1);
}
