/**
 * @file This module contains the controller for RAG-actions.
 * @module controllers/ragController
 * @author Ester Hugosson
 * @version 1.0.0
 */


import { queryWineRag } from '../utils/ragChain.js'
import { logger } from '../config/winston.js'

/**
 * Controller for handling RAG (Retrieval-Augmented Generation) actions.
 */
export class RagController {
  /**
   * Answers a wine question (input already validated by middleware).
   */
  async query(req, res) {
    try {
      const result = await queryWineRag(req.body.question)
      res.json(result)
    } catch (error) {
      // Log details server-side only; never send provider errors to the client
      logger.error('RAG query failed', { message: error.message, status: error.status })
      const status = error.status === 429 ? 503 : 502
      res.status(status).json({
        message: 'The wine assistant is temporarily unavailable. Please try again later.',
      })
    }
  }
}

