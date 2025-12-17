'use server';

/**
 * @fileOverview Anomaly detection flow for lead generation data.
 *
 * - detectAnomalies - A function that detects anomalies in lead generation data.
 * - DetectAnomaliesInput - The input type for the detectAnomalies function.
 * - DetectAnomaliesOutput - The return type for the detectAnomalies function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectAnomaliesInputSchema = z.object({
  leadData: z.string().describe('Lead generation data in JSON format.'),
});
export type DetectAnomaliesInput = z.infer<typeof DetectAnomaliesInputSchema>;

const DetectAnomaliesOutputSchema = z.object({
  anomalies: z
    .string()
    .describe(
      'A description of any anomalies detected in the lead generation data.'
    ),
});
export type DetectAnomaliesOutput = z.infer<typeof DetectAnomaliesOutputSchema>;

export async function detectAnomalies(input: DetectAnomaliesInput): Promise<DetectAnomaliesOutput> {
  return detectAnomaliesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectAnomaliesPrompt',
  input: {schema: DetectAnomaliesInputSchema},
  output: {schema: DetectAnomaliesOutputSchema},
  prompt: `You are an expert in data analysis, specializing in identifying anomalies in lead generation data.

You will analyze the provided lead generation data and identify any unusual patterns, outliers, or anomalies.

Provide a clear and concise description of the anomalies detected, including the specific data points that deviate from the norm.

Lead Generation Data:
{{{leadData}}}`,
});

const detectAnomaliesFlow = ai.defineFlow(
  {
    name: 'detectAnomaliesFlow',
    inputSchema: DetectAnomaliesInputSchema,
    outputSchema: DetectAnomaliesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
