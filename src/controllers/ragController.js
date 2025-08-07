import { Pinecone } from '@pinecone-database/pinecone'
import { queryPineconeVectorStoreAndQueryLLM } from '../utils/ragChain.js'
import dotenv from 'dotenv'

dotenv.config()

const pc = new Pinecone({   
     apiKey: process.env.PINECONE_API_KEY 
})
const indexName = process.env.PINECONE_INDEX_NAME || 'wine-index'

export class RagController {
  async query(req, res) {
    try {
        const { question } = req.body
        if (!question) {
            return res.status(400).json({ message: 'Question is required' })
        }

        const result = await queryPineconeVectorStoreAndQueryLLM(pc, indexName, question)

        if (!result || !result.answer) {
            return res.status(404).json({ message: 'No answer found for the question' })
        }

        res.json({
            answer: result.answer,
            sources: result.sources || []
        })

    } catch (error) {
      console.error('RAG query error:', error)
      res.status(500).json({ message: 'Failed to answer query' })
    }
  }
}

