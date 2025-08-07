import { PineconeStore } from "@langchain/pinecone"
import { OpenAIEmbeddings } from "langchain/embeddings/openai"
import { Pinecone } from "@pinecone-database/pinecone"
import dotenv from "dotenv"


dotenv.config()

const pincone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY
})

// Load index name from environment variable or default to 'wine-index'
const indexName = process.env.PINECONE_INDEX_NAME || 'wine-index'

const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
    model: 'text-embedding-3-small'
})

export async function getVectorStore() {
    try {
        const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
            pinconeIndex: indexName,
            textKey: 'description',
        })
        return vectorStore

    } catch (error) {
        console.error('Error getting vector store:', error)
        throw new Error('Failed to get vector store')
    }
}