'use server';

/**
 * @fileOverview A flow to verify if a SQL query is suitable for a given report parameter.
 *
 * - verifySqlQuery - A function that verifies the SQL query.
 * - VerifySqlQueryInput - The input type for the verifySqlQuery function.
 * - VerifySqlQueryOutput - The return type for the verifySqlQuery function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VerifySqlQueryInputSchema = z.object({
  sqlQuery: z
    .string()
    .describe('The SQL query to verify.'),
  expectedDataDescription: z.string().describe('The description of the expected data for the parameter.'),
});
export type VerifySqlQueryInput = z.infer<typeof VerifySqlQueryInputSchema>;

const VerifySqlQueryOutputSchema = z.object({
  isSuitable: z.boolean().describe('Whether the SQL query is suitable for the expected data.'),
  reason: z.string().describe('The reason for the suitability or unsuitability.'),
});
export type VerifySqlQueryOutput = z.infer<typeof VerifySqlQueryOutputSchema>;

export async function verifySqlQuery(input: VerifySqlQueryInput): Promise<VerifySqlQueryOutput> {
  return verifySqlQueryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'verifySqlQueryPrompt',
  input: {schema: VerifySqlQueryInputSchema},
  output: {schema: VerifySqlQueryOutputSchema},
  prompt: `You are an expert SQL query verifier.

You will receive a SQL query and a description of the expected data for a report parameter.
Your task is to determine if the SQL query is suitable for retrieving the expected data.

SQL Query: {{{sqlQuery}}}
Expected Data Description: {{{expectedDataDescription}}}

Consider the following:
- Does the query retrieve the type of data described in the data description?
- Does the query return the data in a format that is usable for the report parameter?
- Are there any potential issues with the query that could cause it to fail or return incorrect data?

Based on your analysis, determine if the SQL query is suitable for the expected data and provide a reason for your determination.
`,
});

const verifySqlQueryFlow = ai.defineFlow(
  {
    name: 'verifySqlQueryFlow',
    inputSchema: VerifySqlQueryInputSchema,
    outputSchema: VerifySqlQueryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
