/* import { ChatOpenAI } from "@langchain/openai"
import { loadQAStuffChain } from "langchain/chains"
import { OpenAI } from "@langchain/openai"
import { getVectorStore } from "../utils/pincone.js"
import dotenv from "dotenv"

dotenv.config()

export async function getWineAnswer(question) { 
    const store = await getVectorStore()
    const model = new ChatOpenAI ({
        openAIApiKey: process.env.OPENAI_API_KEY,
        modelName: 'gpt-4',
        temperature: 0.3
    })

    const llm = new OpenAI({})

    const chain = loadQAStuffChain(llm, {
        returnSourceDocuments: true,
    })

    const res = await chain.call({ question: question })

    return {
        answer: res.rext,
        sources: res.sourceDocuments?.map(doc => doc.metadata.title)
    }

} */


// rag.js
import { OpenAIEmbeddings } from "@langchain/openai";
import { ChatOpenAI } from "@langchain/openai"
import { loadQAStuffChain } from "langchain/chains";
import { Document } from "langchain/document";

export const queryPineconeVectorStoreAndQueryLLM = async (
    client,
    indexName,
    question
) => {
    const index = client.Index(indexName);
    const queryEmbedding = await new OpenAIEmbeddings().embedQuery(question);

    const queryResponse = await index.query({
        topK: 10,
        vector: queryEmbedding,
        includeMetadata: true,
        includeValues: true,

    });

    if (queryResponse.matches.length) {
        const llm = new ChatOpenAI({
            temperature: 0.3,
            modelName: "gpt-3.5-turbo", // or gpt-4
            openAIApiKey: process.env.OPENAI_API_KEY,
        });

        const chain = loadQAStuffChain(llm);

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
`;
            })
            .join("\n");

        console.log("🧪 GPT context preview:\n", concatenatedPageContent.slice(0, 1000));

        const result = await chain.invoke({
            input_documents: [new Document({ pageContent: concatenatedPageContent })],
            question: question,
        });

        console.log(result);


        return {
            answer: result.text,
            sources: queryResponse.matches.map(m => m.metadata.title || m.id),
        };
    } else {
        return {
            answer: "Sorry, I couldn't find relevant wine reviews.",
            sources: [],
        };
    }
};