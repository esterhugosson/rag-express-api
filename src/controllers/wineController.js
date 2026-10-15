// --- helpers ---
const str = (v) =>
  typeof v === "string" && v.length > 0 && v.length <= 100 ? v : undefined;
const num = (v) =>
  v !== undefined && Number.isFinite(Number(v)) ? Number(v) : undefined;
const clampInt = (v, def, min, max) => {
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? def : Math.min(max, Math.max(min, n));
};

const cache = new Map();
const cached = async (key, fn, ttlMs = 60 * 60 * 1000) => {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;
  const value = await fn();
  cache.set(key, { value, expires: Date.now() + ttlMs });
  return value;
};

/**
 * @file This module contains the controller for WINE-actions.
 * @module controllers/WineController
 * @author Ester Hugosson
 * @version 1.0.0
 */

import { WineModel } from "../models/WineModel.js";
import { logger } from "../config/winston.js";
import createError from "http-errors";

/**
 * Controller for handling wine-related actions.
 */
export class WineController {
  /**
   * Loads a wine document by ID and attaches it to the request object.
   * @param {import('express').Request} req - Express request object.
   * @param {import('express').Response} res - Express response object.
   * @param {Function} next - Express next middleware function.
   * @param {number|string} id - Wine document ID.
   */
  async loadWineDoc(req, res, next, id) {
    try {
      const wineId = Number(id);
      if (!Number.isInteger(wineId)) {
        return res
          .status(400)
          .json({ message: "Invalid wine ID. Must be a number." });
      }
      const wineDoc = await WineModel.findOne({ id: wineId });
      if (!wineDoc)
        return res.status(404).json({ message: "Wine for this id not found." });
      req.doc = wineDoc;
      next();
    } catch (error) {
      logger.error("Could not get wine", error);
      next(error);
    }
  }

  /**
   * Returns the average wine score per country.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async getAverageWineScore(req, res) {
    const response = await cached("avgScore", async () => {
      // Aggregate average points per country
      const result = await WineModel.aggregate([
        { $match: { country: { $ne: null }, points: { $gt: 0 } } },
        {
          $group: {
            _id: "$country",
            avgPoints: { $avg: "$points" },
          },
        },
        { $sort: { avgPoints: -1 } },
      ]);

      // Format response
      return result.map((item) => ({
        country: item._id,
        avgPoints: +item.avgPoints.toFixed(1),
      }));
    });

    res.json(response);
  }

  /**
   * Returns wines filtered by price and points, with optional country and variety filters.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */

  async getPriceVsPoints(req, res) {
    const country = str(req.query.country);
    const variety = str(req.query.variety);
    const maxPrice = num(req.query.maxPrice);
    const minPoints = num(req.query.minPoints);

    const filter = {
      price: { $gt: 0, ...(maxPrice !== undefined && { $lte: maxPrice }) },
      points: {
        $ne: null,
        ...(minPoints !== undefined && { $gte: minPoints }),
      },
    };
    if (country) filter.country = country;
    if (variety) filter.variety = variety;

    const result = await WineModel.find(filter, {
      price: 1,
      points: 1,
      country: 1,
      variety: 1,
      title: 1,
    })
      .limit(150)
      .lean();
    res.json(result);
  }

  /**
   * Returns the top N wine varieties by count.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async getTopVarieties(req, res) {
    const limit = clampInt(req.query.limit, 10, 1, 50);
    const response = await cached(`topVarieties:${limit}`, async () => {
      const result = await WineModel.aggregate([
        { $match: { variety: { $ne: null } } },
        {
          $group: {
            _id: "$variety",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: limit },
      ]);
      return result.map((i) => ({ variety: i._id, count: i.count }));
    });
    res.json(response);
  }

  async getTopWines(req, res) {
    const variety = str(req.query.variety);
    const limit = clampInt(req.query.limit, 10, 1, 50);
    const result = await WineModel.aggregate([
      { $match: variety ? { variety } : {} },
      { $sort: { points: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          title: 1,
          variety: 1,
          country: 1,
          points: 1,
          price: 1,
        },
      },
    ]);
    res.json(result);
  }

  /**
   * Returns wine count per region, filtered by country.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async getCountByRegion(req, res) {
    const country = str(req.query.country);
    if (!country)
      return res
        .status(400)
        .json({ message: "country query param is required" });

    const result = await WineModel.aggregate([
      { $match: { country: country, region_1: { $ne: null } } },
      {
        $group: {
          _id: "$region_1",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const response = result.map((item) => ({
      region: item._id,
      count: item.count,
    }));

    res.json(response);
  }

  /**
   * Returns all distinct countries in the wine collection.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async getCountries(req, res) {
    res.json(await cached('countries', async () => (await WineModel.distinct('country')).filter(Boolean)))
  }

  /**
   * Returns all distinct wine varieties in the wine collection.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async getVarieties(req, res) {
    res.json(await cached('variety', async () => (await WineModel.distinct('variety')).filter(Boolean)))
  }
}
