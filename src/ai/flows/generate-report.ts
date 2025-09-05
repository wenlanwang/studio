
'use server';

/**
 * @fileOverview A flow to generate a report by replacing placeholders in a .docx file with data from a SQLite database.
 * 
 * - generateReport - A function that generates the report.
 * - GenerateReportInput - The input type for the generateReport function.
 * - GenerateReportOutput - The return type for the generateReport function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { Packer, patchDocument, TextRun, PatchType } from 'docx';
import { dbService } from '@/services/database-service';
import type { Parameter } from '@/lib/types';

const GenerateReportInputSchema = z.object({
  fileContent: z.string().describe('Base64 encoded content of the .docx file.'),
  parameters: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    sql: z.string(),
  })).describe('The parameters and their SQL queries.'),
  reportDate: z.string().describe('The report date in yyyy-MM format.'),
});
export type GenerateReportInput = z.infer<typeof GenerateReportInputSchema>;

const GenerateReportOutputSchema = z.object({
  fileContent: z.string().describe('Base64 encoded content of the generated .docx file.'),
});
export type GenerateReportOutput = z.infer<typeof GenerateReportOutputSchema>;

export async function generateReport(input: GenerateReportInput): Promise<GenerateReportOutput> {
  return generateReportFlow(input);
}

const generateReportFlow = ai.defineFlow(
  {
    name: 'generateReportFlow',
    inputSchema: GenerateReportInputSchema,
    outputSchema: GenerateReportOutputSchema,
  },
  async (input) => {
    const { fileContent, parameters, reportDate } = input;
    const docBuffer = Buffer.from(fileContent, 'base64');
    
    const patches: { [key: string]: { type: PatchType.PARAGRAPH; children: TextRun[] } } = {};

    for (const param of parameters) {
      const placeholder = `[$${param.name}]`;
      try {
        const query = param.sql.replace(/\[REPORT_DATE\]/g, `'${reportDate}'`);
        const result = await dbService.query(query);
        const value = result && result.length > 0 ? Object.values(result[0])[0] : 'N/A';
        
        patches[placeholder] = {
            type: PatchType.PARAGRAPH,
            children: [new TextRun(String(value))],
        };
      } catch (error) {
        console.error(`Error executing query for parameter ${param.name}:`, error);
        patches[placeholder] = {
            type: PatchType.PARAGRAPH,
            children: [new TextRun({ text: 'Query Error', color: 'FF0000' })],
        };
      }
    }
    
    const newDocUint8Array = await patchDocument(docBuffer, {
        patches: patches,
    });
    
    const newDocBuffer = Buffer.from(newDocUint8Array);

    return {
      fileContent: newDocBuffer.toString('base64'),
    };
  }
);
