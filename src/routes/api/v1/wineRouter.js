/**
 * @file wine router.
 * @module routes/movieRouter
 * @author Ester Hugosson
 * @version 1.0.0
 */

import express from 'express'
import { WineController } from '../../../controllers/wineController.js'
import { tryCatch } from '../../../utils/tryCatch.js'

export const router = express.Router()
const controller = new WineController()

router.get('/avg-score-by-country', tryCatch(controller.getAverageWineScore.bind(controller)))

router.get('/price-vs-points', tryCatch(controller.getPriceVsPoints.bind(controller)))

router.get('/top-varieties', tryCatch(controller.getTopVarieties.bind(controller)))

router.get('/count-by-region', tryCatch(controller.getCountByRegion.bind(controller)))

router.get('/top-wines', tryCatch(controller.getTopWines.bind(controller)))


router.get('/countries', tryCatch(controller.getCountries.bind(controller)))
router.get('/varieties', tryCatch(controller.getVarieties.bind(controller)))