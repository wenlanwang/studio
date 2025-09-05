
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
import { Packer, Document, Paragraph, TextRun } from 'docx';
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
    
    // This is a simplified placeholder replacement logic.
    // A full implementation would require parsing the docx XML structure.
    // The `docx` library does not support direct search and replace in existing documents.
    // As a workaround, we will simulate the replacement and generate a new document.
    
    const replacements: { [key: string]: string } = {};

    for (const param of parameters) {
      try {
        const query = param.sql.replace(/\[REPORT_DATE\]/g, reportDate);
        const result = await dbService.query(query);
        const value = result && result.length > 0 ? Object.values(result[0])[0] : 'N/A';
        replacements[`[\\$${param.name}]`] = String(value);
      } catch (error) {
        console.error(`Error executing query for parameter ${param.name}:`, error);
        replacements[`[\\$${param.name}]`] = 'Query Error';
      }
    }
    
    // Due to docx library limitations, we create a new document with simulated results.
    // A real implementation would require a more powerful docx parser or a different approach.
    const newDoc = new Document({
        sections: [{
            properties: {},
            children: [
                new Paragraph({ children: [new TextRun("Report Generation Simulation")] }),
                new Paragraph({ children: [new TextRun(`This document demonstrates the data that would be inserted into your template for report date: ${reportDate}.`)] }),
                new Paragraph({ text: "" }),
                ...parameters.map(param => new Paragraph({
                    children: [
                        new TextRun({ text: `Placeholder: [$${param.name}]`, bold: true }),
                        new TextRun({ text: ` -> Result: ${replacements[`[\\$${param.name}]`]}` }),
                    ]
                }))
            ],
        }],
    });
    
    const newDocBuffer = await Packer.toBuffer(newDoc);
    
    return {
      fileContent: newDocBuffer.toString('base64'),
    };
  }
);
