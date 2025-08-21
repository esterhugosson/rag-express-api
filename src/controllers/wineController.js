/**
 * @file This module contains the controller for WINE-actions.
 * @module controllers/WineController
 * @author Ester Hugosson
 * @version 1.0.0
 */

import { WineModel } from '../models/WineModel.js'
import { logger } from '../config/winston.js'
import createError from 'http-errors'

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

            // Check if ID is a number
            if (isNaN(id)) {
                logger.warn(`Invalid wine ID: ${id}`)
                return res.status(400).json({ message: 'Invalid wine ID. Must be a number.' })
            }
            const wineDoc = await WineModel.findOne({ id })
            if (!movieDoc) {
                logger.warn('No wine found for the given query.')
                return res.status(404).json({ message: 'Wine for this id not found.' })
            }
            req.doc = wineDoc
            next()

        } catch (error) {
            logger.error('Could not get wine', error)
            next(error)
        }
    }


    /**
     * Returns the average wine score per country.
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     */
    async getAverageWineScore(req, res) {

        // Aggregate average points per country
        const result = await WineModel.aggregate([
            { $match: { country: { $ne: null }, points: { $gt: 0 } } },
            {
                $group: {
                    _id: "$country",
                    avgPoints: { $avg: "$points" }
                }
            },
            { $sort: { avgPoints: -1 } }
        ])

        // Format response
        const response = result.map(item => ({
            country: item._id,
            avgPoints: +item.avgPoints.toFixed(1)
        }))

        res.json(response)

    }

    /**
     * Returns wines filtered by price and points, with optional country and variety filters.
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     */
    async getPriceVsPoints(req, res) {

        const { country, variety, maxPrice, minPoints } = req.query;
        const filter = {}

        // Apply filters if present
        if (country) filter.country = country
        if (variety) filter.variety = variety
        if (maxPrice) filter.price = { $lte: Number(maxPrice), $gt: 0 }
        else filter.price = { $gt: 0 }

        if (minPoints) filter.points = { $gte: Number(minPoints), $ne: null }
        else filter.points = { $ne: null }

        // Ensure price and points are valid
        filter.price = { ...filter.price, $gt: 0 }
        filter.points = { ...filter.points, $ne: null }

        // Query wines with selected fields, limit for performance
        const result = await WineModel.find(
            filter,
            { price: 1, points: 1, country: 1, variety: 1, title: 1 }
        ).limit(150) // Limit to 150 results for performance

        res.json(result)

    }

    /**
     * Returns the top N wine varieties by count.
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     */
    async getTopVarieties(req, res) {

        const limit = parseInt(req.query.limit) || 10

        // Aggregate top varieties
        const result = await WineModel.aggregate([
            { $match: { variety: { $ne: null } } },
            {
                $group: {
                    _id: "$variety",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: limit }
        ])

        const response = result.map(item => ({
            variety: item._id,
            count: item.count
        }))

        res.json(response)

    }

    /**
     * Returns the top N wines by points, optionally filtered by variety.
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     */
    async getTopWines(req, res) {

        const variety = req.query.variety // optional
        const limit = parseInt(req.query.limit) || 10

        // Build match stage for aggregation
        const matchStage = variety ? { $match: { variety: variety } } : { $match: {} }

        // Aggregate top wines
        const result = await WineModel.aggregate([
            matchStage,
            { $sort: { points: -1 } },   // sort by highest points
            { $limit: limit },
            {
                $project: {
                    _id: 0,
                    title: 1,
                    variety: 1,
                    country: 1,
                    points: 1,
                    price: 1
                }
            }
        ])

        res.json(result)



    }

    /**
     * Returns wine count per region, filtered by country.
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     */
    async getCountByRegion(req, res) {
        const { country } = req.query
        if (!country) return res.status(400).json({ message: 'country query param is required' })

        const result = await WineModel.aggregate([
            { $match: { country: country, region_1: { $ne: null } } },
            {
                $group: {
                    _id: "$region_1",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ])

        const response = result.map(item => ({
            region: item._id,
            count: item.count
        }))

        res.json(response)
    }


    /**
     * Returns all distinct countries in the wine collection.
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     */
    async getCountries(req, res) {
        const countries = await WineModel.distinct("country")
        res.json(countries.filter(Boolean))
    }

    /**
     * Returns all distinct wine varieties in the wine collection.
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     */
    async getVarieties(req, res) {
        const varieties = await WineModel.distinct("variety")
        res.json(varieties.filter(Boolean))
    }


}