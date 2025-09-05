
'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  UploadCloud,
  FileText,
  X,
  Calendar,
  Settings,
  Download,
  Loader2,
  FileWarning,
} from 'lucide-react';
import type { Parameter } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { SettingsDialog } from '@/components/settings-dialog';
import { Progress } from '@/components/ui/progress';
import { generateReport } from '@/ai/flows/generate-report';

const initialParameters: Parameter[] = [
  {
    id: '1',
    name: 'total_sales',
    description: 'Calculates the total sales amount for the specified month.',
    sql: "SELECT SUM(amount) FROM sales WHERE strftime('%Y-%m', sale_date) = '[REPORT_DATE]';",
  },
  {
    id: '2',
    name: 'new_customers',
    description: 'Counts the number of new customers who signed up in the specified month.',
    sql: "SELECT COUNT(id) FROM customers WHERE strftime('%Y-%m', signup_date) = '[REPORT_DATE]';",
  },
  {
    id: '3',
    name: 'top_product',
    description: 'Finds the name of the product with the highest sales in the month.',
    sql: "SELECT p.name FROM products p JOIN sales_items si ON p.id = si.product_id JOIN sales s ON si.sale_id = s.id WHERE strftime('%Y-%m', s.sale_date) = '[REPORT_DATE]' GROUP BY p.name ORDER BY SUM(si.quantity) DESC LIMIT 1;",
  },
];

type GenerationStatus = 'idle' | 'loading' | 'success' | 'error';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = (reader.result as string).split(',')[1];
      resolve(result);
    };
    reader.onerror = (error) => reject(error);
  });
};

export function ReportForgeApp() {
  const [reportDate, setReportDate] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parameters, setParameters] = useState<Parameter[]>(initialParameters);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>('idle');
  const [generatedFileContent, setGeneratedFileContent] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    setReportDate(format(new Date(), 'yyyy-MM'));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.name.endsWith('.docx')) {
        setUploadedFile(file);
        setGenerationStatus('idle');
        setGeneratedFileContent(null);
        toast({
          title: 'File uploaded',
          description: `${file.name} is ready.`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Invalid file type',
          description: 'Please upload a .docx file.',
        });
      }
    }
  };

  const handleGenerate = async () => {
    if (!uploadedFile) {
      toast({
        variant: 'destructive',
        title: 'No template uploaded',
        description: 'Please upload a Word template first.',
      });
      return;
    }
    setGenerationStatus('loading');
    setGeneratedFileContent(null);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 95 ? 95 : prev + 5));
    }, 500);

    try {
      const fileContent = await fileToBase64(uploadedFile);

      const result = await generateReport({
        fileContent,
        parameters,
        reportDate,
      });

      clearInterval(interval);
      setProgress(100);

      setGeneratedFileContent(result.fileContent);
      setGenerationStatus('success');
      toast({
        title: 'Report Generated Successfully',
        description: 'Your report is ready for download.',
      });
    } catch (error) {
      clearInterval(interval);
      setGenerationStatus('error');
      setProgress(0);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during generation.';
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: "The AI failed to generate the report. Please check your parameters and template.",
      });
      console.error(error);
    }
  };

  const handleDownload = () => {
    if (!generatedFileContent || !uploadedFile) return;

    const byteCharacters = atob(generatedFileContent);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const datePart = reportDate || format(new Date(), 'yyyy-MM');
    const originalName = uploadedFile.name.replace(/\.docx$/, '');
    a.download = `${originalName}-generated-${datePart}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <header className="text-center">
        <h1 className="text-4xl font-bold text-primary">Report Forge</h1>
        <p className="text-muted-foreground mt-2">
          Your automated report generation assistant.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>1. Upload Template</CardTitle>
          <CardDescription>
            Choose a .docx Word file to use as your report template.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {uploadedFile ? (
            <div className="flex items-center justify-between p-4 border rounded-lg bg-secondary/50">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-primary" />
                <span className="font-medium text-sm">{uploadedFile.name}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setUploadedFile(null);
                  setGeneratedFileContent(null);
                  setGenerationStatus('idle');
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <label
              htmlFor="dropzone-file"
              className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent transition-colors"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground">
                  <span className="font-semibold text-primary">Click to upload</span> or
                  drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  Word document (.docx only)
                </p>
              </div>
              <Input
                id="dropzone-file"
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              />
            </label>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Configure Report</CardTitle>
          <CardDescription>
            Set the report date and manage data parameters.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="report-date">Report Date (yyyy-mm)</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="report-date"
                  type="month"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Parameters</Label>
              <SettingsDialog parameters={parameters} setParameters={setParameters}>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="mr-2 h-4 w-4" />
                  Manage Parameters
                </Button>
              </SettingsDialog>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Generate & Download</CardTitle>
          <CardDescription>
            Create your report and download the final document.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {generationStatus === 'loading' && (
            <div className="space-y-2">
              <p className="text-sm text-center text-primary">Generating your report...</p>
              <Progress value={progress} className="w-full" />
            </div>
          )}
          {generationStatus === 'error' && (
             <div className="flex items-center justify-center flex-col gap-2 text-destructive p-4 border border-destructive/50 rounded-lg bg-destructive/10">
                <FileWarning className="w-8 h-8"/>
                <p className="font-medium">Generation Failed</p>
                <p className="text-sm text-center">Please check your template and parameters, then try again.</p>
             </div>
          )}
        </CardContent>
        <CardFooter className="flex-col sm:flex-row gap-4">
          <Button
            onClick={handleGenerate}
            disabled={generationStatus === 'loading' || !uploadedFile}
            className="w-full sm:w-auto"
          >
            {generationStatus === 'loading' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Generate Report
          </Button>
          {generationStatus === 'success' && generatedFileContent && (
            <Button
              onClick={handleDownload}
              variant="secondary"
              className="w-full sm:w-auto"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Report
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
