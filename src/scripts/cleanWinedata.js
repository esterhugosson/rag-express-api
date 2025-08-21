/**
 * @file Cleans raw wine data and writes a filtered, normalized JSON file.
 * @module scripts/cleanWinedata
 * @author Ester Hugosson
 * @version 1.0.0
 */

import fs from 'fs'
import { logger } from '../config/winston.js'

// Read raw wine data from file
const rawData = fs.readFileSync('src/data/winemag-data-130k-v2.json', 'utf8')

// Parse JSON data
const rawWines = JSON.parse(rawData)

/**
 * Filters and normalizes wine data.
 * - Only includes entries with description, points, country, and variety.
 * - Limits to first 5000 entries.
 * - Normalizes missing fields with defaults.
 */
const cleaned = rawWines
.filter(w => w.description && w.points && w.country && w.variety)
.slice(0, 5000)
.map((wine, index) => ({
    id: `wine-${index}`,
    description: wine.description,
    points: wine.points,
    title: wine.title,
    country: wine.country,
    designation: wine.designation || 'Unknown',
    winery: wine.winery,
    variety: wine.variety,
    province: wine.province || 'Unknown',
    region_1: wine.region_1 || 'Unknown',
    region_2: wine.region_2 || 'Unknown',
    price: wine.price || 0,
    taster_name: wine.taster_name || 'Unknown'
}))

// Write cleaned data to new file
fs.writeFileSync('src/data/cleaned-wines.json', JSON.stringify(cleaned, null, 2))

logger.info(`Cleaned ${cleaned.length} wine entries and saved to cleaned-wines.json`);
