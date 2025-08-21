/**
 * @file Seeds the MongoDB database with cleaned wine data.
 * @module scripts/seed
 * @author Ester Hugosson
 * @version 1.0.0
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import { connectToDatabase } from '../config/mongoose.js'
import { WineModel } from '../models/WineModel.js'
import { logger } from '../config/winston.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Seeds the database with wine data from cleaned-wines.json.
 * - Connects to MongoDB.
 * - Reads cleaned wine data from file.
 * - Removes old wine documents.
 * - Inserts new wine documents.
 */
async function seed() {
  try {

    // Connect to MongoDB using connection string from environment
    await connectToDatabase(process.env.DB_CONNECTION_STRING)

    // Resolve path to cleaned wine data
    const filePath = path.join(__dirname, '../data/cleaned-wines.json')

    // Read and parse wine data
    const rawData = fs.readFileSync(filePath, 'utf-8')
    const wines = JSON.parse(rawData)

    logger.info(`Read ${wines.length} wines from JSON`)

    // Remove all existing wine documents
    await WineModel.deleteMany({})
    logger.info('Old wine documents removed')

    // Insert new data
    await WineModel.insertMany(wines)
    logger.info(`Inserted ${wines.length} wines into MongoDB`)

    process.exit(0)
  } catch (err) {
    logger.error('Error seeding database:', err)
    process.exit(1)
  }
}

// Run the seed function
seed()
