/**
 * @file Defines the wine controller class.
 * @module WineController
 * @author Ester Hugosson
 */

import { WineModel } from '../models/WineModel.js'
import { logger } from '../config/winston.js'
import createError from 'http-errors'

export class WineController {

    //Provice movie to req if id is present.
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


    // Get average wine score per country.
    async getAverageWineScore(req, res) {

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

        const response = result.map(item => ({
            country: item._id,
            avgPoints: +item.avgPoints.toFixed(1)
        }))

        res.json(response)

    }

    // Get price vs points with optional filters.
    async getPriceVsPoints(req, res) {

        const { country, variety, maxPrice, minPoints } = req.query;
        const filter = {}

        if (country) filter.country = country
        if (variety) filter.variety = variety
        if (maxPrice) filter.price = { $lte: Number(maxPrice), $gt: 0 }
        else filter.price = { $gt: 0 }

        if (minPoints) filter.points = { $gte: Number(minPoints), $ne: null }
        else filter.points = { $ne: null }

        // Add check: price must exist and be > 0
        filter.price = { ...filter.price, $gt: 0 }
        filter.points = { ...filter.points, $ne: null }

        const result = await WineModel.find(
            filter,
            { price: 1, points: 1, country: 1, variety: 1, title: 1 }
        ).limit(150) // Limit to 150 results for performance

        res.json(result)

    }

    // Get top N wine varieties by country
    async getTopVarieties(req, res) {

        const limit = parseInt(req.query.limit) || 10

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

    async getTopWines(req, res) {

        const variety = req.query.variety // optional
        const limit = parseInt(req.query.limit) || 10

        const matchStage = variety ? { $match: { variety: variety } } : { $match: {} }

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

    // Get wine count per region, filtered by country
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


    //Helper for price vs points

    async getCountries(req, res) {
        const countries = await WineModel.distinct("country")
        res.json(countries.filter(Boolean))
    }

    async getVarieties(req, res) {
        const varieties = await WineModel.distinct("variety")
        res.json(varieties.filter(Boolean))
    }


}