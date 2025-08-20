// Vercel Serverless Function
// This function acts as a secure proxy to the Google Gemini API.
// It reads the API_KEY from server-side environment variables.

import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

// This is a placeholder for a real request type from your frontend
interface ApiRequest {
  systemInstruction?: string;
  transcript: { role: 'user' | 'model'; parts: { text: string }[] }[]; // Matches Gemini history format
  prompt?: string; // For one-off generation like suggestions
  type: 'chat' | 'suggestion';
}

// Ensure the API_KEY is available in the environment
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body: ApiRequest = await request.json();
    let responseText = "";

    if (body.type === 'chat' && body.systemInstruction) {
        // The entire transcript is coming in, including the latest user message.
        // We need to separate the history from the last message.
        const history = body.transcript.slice(0, -1);
        const lastMessagePart = body.transcript[body.transcript.length - 1];

        // The last message should be from the 'user' (the agent)
        if (!lastMessagePart || lastMessagePart.role !== 'user') {
             throw new Error("No valid user message found to send.");
        }
        const lastMessage = lastMessagePart.parts[0]?.text || "";
        
        if (!lastMessage) {
            throw new Error("The last message is empty.");
        }

        const chat: Chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: { systemInstruction: body.systemInstruction },
            history: history,
        });
        
        const result: GenerateContentResponse = await chat.sendMessage({ message: lastMessage });
        responseText = result.text;

    } else if (body.type === 'suggestion' && body.prompt) {
        const result = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: body.prompt });
        responseText = result.text;
    } else {
        throw new Error("Invalid request type or missing parameters.");
    }
    
    return new Response(JSON.stringify({ text: responseText }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(JSON.stringify({ error: "Failed to get response from AI", details: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
