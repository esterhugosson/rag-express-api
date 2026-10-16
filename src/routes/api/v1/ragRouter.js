/**
 * @file rag router.
 * @module routes/ragRouter
 * @author Ester Hugosson
 * @version 1.0.0
 */

import express from 'express'
import { RagController } from '../../../controllers/ragController.js'
import { ragLimiter } from '../../../middleware/rateLimit.js'
import { validateQuestion } from '../../../middleware/validateQuestion.js'
import { dailyBudget } from '../../../middleware/dailyBudget.js'
import { tryCatch } from '../../../utils/tryCatch.js'


export const router = express.Router()
const controller = new RagController()

router.post('/query', ragLimiter, validateQuestion, dailyBudget, tryCatch(controller.query))