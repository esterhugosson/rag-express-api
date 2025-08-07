/**
 * @file API version 1 router.
 * @module routes/router
 * @author Ester Hugosson
 * @version 1.0.0
 */

import express from 'express'
import { router as wineRouter } from './wineRouter.js'
import { router as ragRouter } from './ragRouter.js'

export const router = express.Router()

router.get('/', (req, res) => res.json({ message: 'Welcome to the version 1 of this wine api!'}))

router.use('/wines', wineRouter)
router.use('/rag', ragRouter)