/**
 * @file Utility functions for querying Pinecone and generating answers with LLM.
 * @module utils/ragChain
 * @author Ester Hugosson
 * @version 1.0.0
 */

import { OpenAIEmbeddings } from '@langchain/openai'
import { ChatOpenAI } from '@langchain/openai'
import { loadQAStuffChain } from 'langchain/chains'
import { Document } from 'langchain/document'
import { logger } from '../config/winston.js'

/**
 * Queries Pinecone vector store for relevant wine documents and generates an answer using LLM.
 * @param {object} client - Pinecone client instance.
 * @param {string} indexName - Name of the Pinecone index.
 * @param {string} question - The user's question.
 * @returns {Promise<{answer: string, sources: string[]}>}
 */
export const queryPineconeVectorStoreAndQueryLLM = async (
    client,
    indexName,
    question
) => {
    // Get Pinecone index
    const index = client.Index(indexName)

    // Create embedding for the question
    const queryEmbedding = await new OpenAIEmbeddings().embedQuery(question)

    // Query Pinecone for top matches
    const queryResponse = await index.query({
        topK: 10,
        vector: queryEmbedding,
        includeMetadata: true,
        includeValues: true,

    })

    // If matches found, generate answer using LLM
    if (queryResponse.matches.length) {
        const llm = new ChatOpenAI({
            temperature: 0.3,
            modelName: "gpt-3.5-turbo",
            openAIApiKey: process.env.OPENAI_API_KEY,
        })

        // Load QA chain
        const chain = loadQAStuffChain(llm)

         // Concatenate matched wine metadata for LLM context
        const concatenatedPageContent = queryResponse.matches
            .map((match) => {
                const md = match.metadata;
                return `
                        Title: ${md.title}
                        Variety: ${md.variety}
                        Country: ${md.country}
                        Points: ${md.points}
                        Price: ${md.price}
                        Description: ${md.description}
                        `
            })
            .join("\n")

        logger.info("GPT context preview:\n", concatenatedPageContent.slice(0, 1000))

        // Invoke LLM chain with context and question
        const result = await chain.invoke({
            input_documents: [new Document({ pageContent: concatenatedPageContent })],
            question: question,
        })

        logger.info(result)


        //return answers and sources
        return {
            answer: result.text,
            sources: queryResponse.matches.map(m => m.metadata.title || m.id),
        }

    } else {
        //No matches found.
        return {
            answer: "Sorry, I couldn't find relevant wine reviews.",
            sources: [],
        }
    }
}