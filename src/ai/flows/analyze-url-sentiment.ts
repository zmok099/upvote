'use server';

/**
 * @fileOverview An AI agent that analyzes the sentiment of a URL.
 *
 * - analyzeUrlSentiment - A function that handles the sentiment analysis process.
 * - AnalyzeUrlSentimentInput - The input type for the analyzeUrlSentiment function.
 * - AnalyzeUrlSentimentOutput - The return type for the analyzeUrlSentiment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeUrlSentimentInputSchema = z.object({
  url: z.string().url().describe('The URL to analyze.'),
});
export type AnalyzeUrlSentimentInput = z.infer<typeof AnalyzeUrlSentimentInputSchema>;

const AnalyzeUrlSentimentOutputSchema = z.object({
  sentiment: z.string().describe('The sentiment of the URL content (e.g., positive, negative, neutral).'),
  confidence: z.number().describe('The confidence level of the sentiment analysis (0 to 1).'),
  reason: z.string().describe('The reason for the identified sentiment.'),
});
export type AnalyzeUrlSentimentOutput = z.infer<typeof AnalyzeUrlSentimentOutputSchema>;

export async function analyzeUrlSentiment(input: AnalyzeUrlSentimentInput): Promise<AnalyzeUrlSentimentOutput> {
  return analyzeUrlSentimentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeUrlSentimentPrompt',
  input: {schema: AnalyzeUrlSentimentInputSchema},
  output: {schema: AnalyzeUrlSentimentOutputSchema},
  prompt: `You are an AI sentiment analyzer. Analyze the sentiment of the content at the given URL and provide a sentiment, confidence level, and reason for the sentiment.

URL: {{{url}}}

Analyze the content at the URL and determine its sentiment.
`,
});

const analyzeUrlSentimentFlow = ai.defineFlow(
  {
    name: 'analyzeUrlSentimentFlow',
    inputSchema: AnalyzeUrlSentimentInputSchema,
    outputSchema: AnalyzeUrlSentimentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
