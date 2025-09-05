
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Parameter } from '@/lib/types';
import { Sparkles, Loader2, ShieldCheck, ShieldAlert } from 'lucide-react';
import { suggestSqlQuery } from '@/ai/flows/suggest-sql-query';
import { verifySqlQuery } from '@/ai/flows/verify-sql-query';
import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

interface ParameterFormProps {
  mode: 'add' | 'edit' | null;
  initialData: Parameter | null;
  parameters: Parameter[];
  setParameters: React.Dispatch<React.SetStateAction<Parameter[]>>;
  onClose: () => void;
}

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').regex(/^[a-zA-Z0-9_]+$/, 'Name can only contain letters, numbers, and underscores.'),
  description: z.string().min(1, 'Description is required'),
  sql: z.string().min(1, 'SQL query is required'),
});

type AIState = 'idle' | 'loading';
type VerifyResult = { isSuitable: boolean; reason: string } | null;

export function ParameterForm({
  mode,
  initialData,
  parameters,
  setParameters,
  onClose,
}: ParameterFormProps) {
  const { toast } = useToast();
  const [aiState, setAiState] = useState<AIState>('idle');
  const [verifyResult, setVerifyResult] = useState<VerifyResult>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      sql: initialData?.sql || '',
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (mode === 'add') {
      const newParam: Parameter = {
        id: Date.now().toString(),
        ...values,
      };
      setParameters([...parameters, newParam]);
      toast({ title: 'Parameter added', description: `"${values.name}" has been created.` });
    } else if (mode === 'edit' && initialData) {
      const updatedParam: Parameter = { ...initialData, ...values };
      setParameters(parameters.map((p) => (p.id === initialData.id ? updatedParam : p)));
      toast({ title: 'Parameter updated', description: `"${values.name}" has been saved.` });
    }
    onClose();
  };

  const handleSuggestQuery = async () => {
    const { name, description } = form.getValues();
    if (!name || !description) {
      toast({
        variant: 'destructive',
        title: 'Missing information',
        description: 'Please provide a parameter name and description first.',
      });
      return;
    }
    setAiState('loading');
    setVerifyResult(null);
    try {
      const result = await suggestSqlQuery({ parameterName: name, description });
      form.setValue('sql', result.sqlQuery, { shouldValidate: true });
      toast({ title: 'SQL Query Suggested', description: 'AI has generated a query for you.' });
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'AI Suggestion Failed',
        description: 'Could not generate a query. Please try again.',
      });
    } finally {
      setAiState('idle');
    }
  };
  
  const handleVerifyQuery = async () => {
    const { sql, description } = form.getValues();
    if (!sql || !description) {
        toast({
            variant: 'destructive',
            title: 'Missing information',
            description: 'Please provide a SQL query and description to verify.',
        });
        return;
    }
    setAiState('loading');
    setVerifyResult(null);
    try {
        const result = await verifySqlQuery({ sqlQuery: sql, expectedDataDescription: description });
        setVerifyResult(result);
    } catch (e) {
        toast({
            variant: 'destructive',
            title: 'AI Verification Failed',
            description: 'Could not verify query. Please try again.',
        });
    } finally {
        setAiState('idle');
    }
  };

  if (!mode) return null;

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{mode === 'add' ? 'Add New' : 'Edit'} Parameter</DialogTitle>
        <DialogDescription>
          Define a parameter and its corresponding SQL query.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parameter Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., total_sales" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="A brief description of the data this parameter retrieves. Used by AI to generate queries."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sql"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SQL Query</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="SELECT COUNT(*) FROM users;"
                    className="font-mono text-sm"
                    rows={6}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {verifyResult && (
            <Alert variant={verifyResult.isSuitable ? 'default' : 'destructive'} className={verifyResult.isSuitable ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' : ''}>
              {verifyResult.isSuitable ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
              <AlertTitle>{verifyResult.isSuitable ? "Verification Successful" : "Verification Issues Found"}</AlertTitle>
              <AlertDescription>{verifyResult.reason}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={handleSuggestQuery} disabled={aiState === 'loading'}>
              {aiState === 'loading' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Suggest with AI
            </Button>
            <Button type="button" variant="outline" onClick={handleVerifyQuery} disabled={aiState === 'loading'}>
              {aiState === 'loading' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
              Verify with AI
            </Button>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {mode === 'add' ? 'Add Parameter' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}
