/**
 * @file Defines the main application.
 * @module src/server
 * @author Ester Hugosson
 * @version 1.0.0
 */

import dotenv from "dotenv";
dotenv.config();

import httpContext from "express-http-context"; // Must be first!
import express from "express";
import "@lnu/json-js-cycle";
import cors from "cors";
import helmet from "helmet";
import { generalLimiter } from "./middleware/rateLimits.js";
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

  // Set the base URL to use for all relative URLs in a document.
  const baseURL = process.env.BASE_Url || "/";

  //Required for render
  app.set("trust proxy", 1);

  app.use(helmet());

  // Enable Cross Origin Resource Sharing (CORS) (https://www.npmjs.com/package/cors).
  const allowedOrigins = (process.env.CORS_ORIGINS ?? "")
    .split(",")
    .filter(Boolean);
  app.use(
    cors({
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      exposedHeaders: ["X-Demo-Remaining"],
    }),
  );

  // Parse requests of the content type application/json.
  app.use(express.json({ limit: '10kb' }))
  
  // Health check: before the rate limiter, so Render's pings never count
  app.get('/health', (req, res) => res.json({ status: 'ok' }))

  app.use(generalLimiter)

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
      // Ensure a valid status code is set for the error.
      // If the status code is not provided, default to 500 (Internal Server Error).
      // This prevents leakage of sensitive error details to the client.
      if (!err.status) {
        err.status = 500;
        err.message = http.STATUS_CODES[err.status];
      }

      // Send only the error message and status code to prevent leakage of
      // sensitive information.
      res.status(err.status).json({
        status: err.status,
        message: err.message,
      });

      return;
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
    logger.info(
      `Server running at http://localhost:${server.address().port}${baseURL}`,
    );
    logger.info("Press Ctrl-C to terminate...");
  });
} catch (err) {
  logger.error(err.message, { error: err });
  process.exitCode = 1;
}
