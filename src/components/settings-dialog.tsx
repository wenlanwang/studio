
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';
import type { Parameter } from '@/lib/types';
import { ParameterForm } from './parameter-form';

interface SettingsDialogProps {
  children: React.ReactNode;
  parameters: Parameter[];
  setParameters: React.Dispatch<React.SetStateAction<Parameter[]>>;
}

export function SettingsDialog({
  children,
  parameters,
  setParameters,
}: SettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | null>(null);
  const [selectedParameter, setSelectedParameter] = useState<Parameter | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [parameterToDelete, setParameterToDelete] = useState<Parameter | null>(null);

  const handleAdd = () => {
    setSelectedParameter(null);
    setDialogMode('add');
  };

  const handleEdit = (param: Parameter) => {
    setSelectedParameter(param);
    setDialogMode('edit');
  };

  const handleDelete = () => {
    if (parameterToDelete) {
      setParameters(parameters.filter((p) => p.id !== parameterToDelete.id));
      setParameterToDelete(null);
    }
  };

  const confirmDelete = (param: Parameter) => {
    setParameterToDelete(param);
    setIsDeleteDialogOpen(true);
  };

  const closeForm = () => {
    setDialogMode(null);
    setSelectedParameter(null);
  };
  
  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Manage Parameters</DialogTitle>
            <DialogDescription>
              Add, edit, or delete parameters used in your report templates.
              Parameters are identified by `[$parm_name]`.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-grow min-h-0">
            <ScrollArea className="h-full pr-6 -mr-6">
              <Table>
                <TableHeader className="sticky top-0 bg-card">
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-[50%]">SQL Query</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parameters.map((param) => (
                    <TableRow key={param.id}>
                      <TableCell className="font-medium align-top">{param.name}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground align-top whitespace-pre-wrap break-all">
                        {param.sql}
                      </TableCell>
                      <TableCell className="text-right align-top">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(param)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => confirmDelete(param)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
          <DialogFooter className="pt-4 border-t">
            <Button onClick={handleAdd}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Parameter
            </Button>
            <DialogClose asChild>
              <Button variant="secondary">Done</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={!!dialogMode} onOpenChange={(isOpen) => !isOpen && closeForm()}>
        <ParameterForm
          mode={dialogMode}
          initialData={selectedParameter}
          parameters={parameters}
          setParameters={setParameters}
          onClose={closeForm}
        />
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the parameter "{parameterToDelete?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
