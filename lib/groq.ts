import { createGroq } from "@ai-sdk/groq";

export const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
export const model = groq("moonshotai/kimi-k2-instruct");

// Fallback: groq('meta-llama/llama-4-scout-17b-16e-instruct')
