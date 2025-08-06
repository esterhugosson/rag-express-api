import fs from 'fs/promises'
import dotenv from 'dotenv'
import { OpenAI } from 'openai'
import { Pinecone } from '@pinecone-database/pinecone'

dotenv.config()

//Initialize OpenAI and Pinecone clients
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY
})

// Load index name from environment variable or default to 'wine-index'
const indexName = process.env.PINECONE_INDEX_NAME || 'wine-index'




const BATCH_SIZE = 10

async function embed() {

    //Create index if it doesn't exist
    const index = pc.index(indexName)

    //await pc.waitUntilReady(indexName)



    const raw = await fs.readFile('src/data/cleaned-wines.json', 'utf8')
    const wines = JSON.parse(raw)


    for (let i = 0; i < wines.length; i += BATCH_SIZE) {
        const batch = wines.slice(i, i + BATCH_SIZE)

        const descriptions = batch.map(wine => wine.description)

        // Create embeddings for the batch
        const embeddingResponse = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: descriptions
        })

        // Prepare vectors for Pinecone
        const vectors = batch.map((wine, index) => ({
            id: wine.id,
            values: embeddingResponse.data[index].embedding,
            metadata: {
                title: wine.title,
                description: wine.description,
                points: wine.points,
                country: wine.country,
                variety: wine.variety,
                winery: wine.winery,
                designation: wine.designation || 'Unknown',
                province: wine.province || 'Unknown',
                region_1: wine.region_1 || 'Unknown',
                region_2: wine.region_2 || 'Unknown',
                price: wine.price || 0,
                taster_name: wine.taster_name || 'Unknown'
            }
        }))

        await index.upsert(vectors)

        console.log(`Upserted batch ${i / BATCH_SIZE + 1} of ${Math.ceil(wines.length / BATCH_SIZE)}`)

    }

    console.log('All wines embedded and upserted successfully!')



}

embed().catch(console.error)