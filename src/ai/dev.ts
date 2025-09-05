import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-sql-query.ts';
import '@/ai/flows/verify-sql-query.ts';
import '@/ai/flows/generate-report.ts';
