/**
 * @file This module contains the controller for RAG-actions.
 * @module controllers/ragController
 * @author Ester Hugosson
 * @version 1.0.0
 */


import { Pinecone } from '@pinecone-database/pinecone'
import { queryPineconeVectorStoreAndQueryLLM } from '../utils/ragChain.js'
import { logger } from '../config/winston.js'
import dotenv from 'dotenv'


dotenv.config()

// Initialize Pinecone client with API key from environment variables
const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY
})
const indexName = process.env.PINECONE_INDEX_NAME || 'wine-index'

/**
 * Controller for handling RAG (Retrieval-Augmented Generation) actions.
 */
export class RagController {

  /**
   * Handles a query request to the RAG system.
   * @param {import('express').Request} req - Express request object.
   * @param {import('express').Response} res - Express response object.
   * @returns {Promise<void>}
   */
  async query(req, res) {
    try {

      // Extract question from request body
      const { question } = req.body
      if (!question || typeof question !== 'string') {
        return res.status(400).json({ message: 'Question is required and must be a string' })
      }

      // Basic sanitization
      const sanitizedQuestion = question.trim().replace(/[\x00-\x1F\x7F]/g, '')
      if (sanitizedQuestion.length === 0 || sanitizedQuestion.length > 500) {
        return res.status(400).json({ message: 'Question must be a non-empty string under 500 characters' })
      }

      // Query Pinecone vector store and LLM for an answer
      const result = await queryPineconeVectorStoreAndQueryLLM(pc, indexName, sanitizedQuestion)

      if (!result || !result.answer) {
        return res.status(404).json({ message: 'No answer found for the question' })
      }

      // Respond with the answer and sources
      res.json({
        answer: result.answer,
        sources: result.sources || []
      })

    } catch (error) {
      logger.error('RAG query error:', error)
      res.status(500).json({ message: 'Failed to answer query' })
    }
  }
}

