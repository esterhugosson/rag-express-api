/**
 * @file rag router.
 * @module routes/ragRouter
 * @author Ester Hugosson
 * @version 1.0.0
 */

import express from 'express'
import { RagController } from '../../../controllers/ragController.js'


export const router = express.Router()
const controller = new RagController()

ragRouter.post('/query', ragLimiter, dailyBudget, tryCatch(controller.query))