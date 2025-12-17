'use server';

/**
 * @fileOverview An AI agent for identifying lead generation trends.
 *
 * - analyzeLeadGenerationTrends - A function that analyzes lead generation data and identifies trends.
 * - AnalyzeLeadGenerationTrendsInput - The input type for the analyzeLeadGenerationTrends function.
 * - AnalyzeLeadGenerationTrendsOutput - The return type for the analyzeLeadGenerationTrends function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeLeadGenerationTrendsInputSchema = z.object({
  leadData: z.string().describe('Lead generation data in JSON format.'),
});
export type AnalyzeLeadGenerationTrendsInput = z.infer<typeof AnalyzeLeadGenerationTrendsInputSchema>;

const AnalyzeLeadGenerationTrendsOutputSchema = z.object({
  trends: z.string().describe('Key trends in lead generation data.'),
});
export type AnalyzeLeadGenerationTrendsOutput = z.infer<typeof AnalyzeLeadGenerationTrendsOutputSchema>;

export async function analyzeLeadGenerationTrends(input: AnalyzeLeadGenerationTrendsInput): Promise<AnalyzeLeadGenerationTrendsOutput> {
  return analyzeLeadGenerationTrendsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeLeadGenerationTrendsPrompt',
  input: {schema: AnalyzeLeadGenerationTrendsInputSchema},
  output: {schema: AnalyzeLeadGenerationTrendsOutputSchema},
  prompt: `You are an expert data analyst specializing in lead generation. Analyze the following lead generation data and identify key trends, such as peak days or locations. Present the trends in a concise and easy-to-understand format.\n\nLead Generation Data:\n{{{leadData}}}`,
});

const analyzeLeadGenerationTrendsFlow = ai.defineFlow(
  {
    name: 'analyzeLeadGenerationTrendsFlow',
    inputSchema: AnalyzeLeadGenerationTrendsInputSchema,
    outputSchema: AnalyzeLeadGenerationTrendsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
