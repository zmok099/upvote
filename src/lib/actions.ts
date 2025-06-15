'use server';

import { analyzeUrlSentiment, type AnalyzeUrlSentimentInput, type AnalyzeUrlSentimentOutput } from '@/ai/flows/analyze-url-sentiment';
import { z } from 'zod';

const schema = z.object({ 
  url: z.string().url({ message: "Invalid URL format. Please include http:// or https://" }) 
});

export async function analyzeUrlSentimentAction(input: AnalyzeUrlSentimentInput): Promise<AnalyzeUrlSentimentOutput | { error: string }> {
  try {
    const validatedInput = schema.parse(input);
    const result = await analyzeUrlSentiment(validatedInput);
    // Ensure the result structure matches AnalyzeUrlSentimentOutput, not nested under 'output'
    if (result && typeof result.sentiment === 'string' && typeof result.confidence === 'number' && typeof result.reason === 'string') {
      return result;
    }
    // This case should ideally not be hit if analyzeUrlSentiment correctly returns AnalyzeUrlSentimentOutput
    return { error: "Unexpected response structure from sentiment analysis." };
  } catch (error) {
    console.error("Sentiment analysis error:", error);
    if (error instanceof z.ZodError) {
      return { error: error.errors.map(e => e.message).join(', ') };
    }
    // Check if error is an object and has a message property
    const errorMessage = (error instanceof Error) ? error.message : "An unknown error occurred during sentiment analysis.";
    return { error: `Failed to analyze sentiment. ${errorMessage}` };
  }
}
