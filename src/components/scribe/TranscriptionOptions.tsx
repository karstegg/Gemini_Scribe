'use client';

import { useFormContext } from 'react-hook-form';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button, buttonVariants } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileUp, File as FileIcon, Settings2, X, Trash2 } from 'lucide-react';
import type { TranscriptionOptions } from '@/types';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '../ui/card';

const recordingTypePrompts = {
  meeting: 'This is a recording of a team meeting. Please identify action items and key decisions.',
  case: 'This is a recording for a case file. Pay close attention to details, names, and timelines.',
};

export function TranscriptionOptionsForm() {
  const form = useFormContext<TranscriptionOptions>();

  const setRecordingType = (type: 'meeting' | 'case') => {
    form.setValue('transcriptionInstructions', recordingTypePrompts[type], { shouldValidate: true });
  };

  const handleAddFiles = (files: FileList | null) => {
    if (files) {
      const currentFiles = form.getValues('referenceFiles');
      const newFiles = Array.from(files);
      form.setValue('referenceFiles', [...currentFiles, ...newFiles], { shouldValidate: true });
    }
  };
  
  const handleRemoveFile = (indexToRemove: number) => {
    const currentFiles = form.getValues('referenceFiles');
    form.setValue('referenceFiles', currentFiles.filter((_, index) => index !== indexToRemove), { shouldValidate: true });
  };

  const referenceFiles = form.watch('referenceFiles');

  return (
    <Form {...form}>
      <form>
        <Collapsible defaultOpen={true}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between px-2 text-lg font-semibold">
              Transcription Options
              <Settings2 className="h-5 w-5" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-6 p-2">
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject (Required)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Q2 Planning Meeting" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>AI Model</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a model" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="gemini-1.5-flash-latest">Gemini 1.5 Flash</SelectItem>
                      <SelectItem value="gemini-1.5-pro-latest">Gemini 1.5 Pro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormItem>
              <FormLabel>Recording Type</FormLabel>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setRecordingType('meeting')}>Meeting</Button>
                <Button type="button" variant="outline" onClick={() => setRecordingType('case')}>Case</Button>
              </div>
              <FormDescription>Select a type to use a prompt template.</FormDescription>
            </FormItem>

            <FormField
              control={form.control}
              name="transcriptionInstructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transcription Instructions</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Provide any specific instructions for the AI..." {...field} rows={4} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="speakerLabels" render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <FormLabel className='font-normal'>Speaker Labels</FormLabel>
                </FormItem>
              )} />
              <FormField control={form.control} name="addTimestamps" render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <FormLabel className='font-normal'>Add Timestamps</FormLabel>
                </FormItem>
              )} />
              <FormField control={form.control} name="generateSummary" render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <FormLabel className='font-normal'>Generate Summary</FormLabel>
                </FormItem>
              )} />
               <FormField control={form.control} name="review" render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <FormLabel className='font-normal'>AI Review & Correction</FormLabel>
                </FormItem>
              )} />
            </div>

            <FormItem>
              <FormLabel>Context Documents</FormLabel>
              <FormControl>
                <div>
                  <input 
                    type="file" 
                    multiple 
                    className="hidden" 
                    id="reference-files-upload"
                    onChange={(e) => handleAddFiles(e.target.files)}
                  />
                  <label htmlFor="reference-files-upload" className={cn(buttonVariants({variant: 'outline'}), "w-full cursor-pointer")}>
                    <FileUp className="mr-2 h-4 w-4"/>
                    Add Reference Files
                  </label>
                </div>
              </FormControl>
              <FormDescription>Upload text files for additional context (e.g., meeting agenda, glossary).</FormDescription>
              {referenceFiles.length > 0 && (
                <Card className="mt-2">
                  <CardContent className="p-3 space-y-2">
                    {referenceFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded-md">
                          <div className='flex items-center gap-2 truncate'>
                            <FileIcon className="h-4 w-4 shrink-0" />
                            <span className="truncate">{file.name}</span>
                          </div>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveFile(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                    ))}
                  </CardContent>
                </Card>
              )}
              <FormMessage />
            </FormItem>
          </CollapsibleContent>
        </Collapsible>
      </form>
    </Form>
  );
}
