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

async function seed() {
  try {
    await connectToDatabase(process.env.DB_CONNECTION_STRING)

    const filePath = path.join(__dirname, '../data/cleaned-wines.json')
    const rawData = fs.readFileSync(filePath, 'utf-8')
    const wines = JSON.parse(rawData)

    logger.info(`Read ${wines.length} wines from JSON`)

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

seed()
