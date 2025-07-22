'use client';

import { useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { getSettings, saveSettings, defaultSettings } from '@/lib/settingsService';
import type { GlobalSettings } from '@/types';

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const settingsSchema = z.object({
  disableFileSizeLimit: z.boolean(),
  standardTranscriptionInstructions: z.string().optional(),
  reviewSettings: z.object({
    correctSpelling: z.boolean(),
    analyzeDiarization: z.boolean(),
    customReviewPrompt: z.string().optional(),
  }),
});

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const form = useForm<GlobalSettings>({
    resolver: zodResolver(settingsSchema),
    defaultValues: getSettings(),
  });

  useEffect(() => {
    if (isOpen) {
      form.reset(getSettings());
    }
  }, [isOpen, form]);

  const onSubmit = (data: GlobalSettings) => {
    saveSettings(data);
    onClose();
  };

  const handleReset = () => {
    form.reset(defaultSettings);
    saveSettings(defaultSettings);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure default settings for your transcriptions.
          </DialogDescription>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="standardTranscriptionInstructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Standard Transcription Instructions</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter instructions that will be applied to every transcription..."
                      {...field}
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-4 rounded-lg border p-4">
                <h3 className="font-semibold">AI Review & Correction Settings</h3>
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="reviewSettings.correctSpelling" render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        <FormLabel className='font-normal'>Correct Spelling</FormLabel>
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="reviewSettings.analyzeDiarization" render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        <FormLabel className='font-normal'>Analyze Diarization</FormLabel>
                        </FormItem>
                    )} />
                </div>
                <FormField
                    control={form.control}
                    name="reviewSettings.customReviewPrompt"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Custom Review Prompt</FormLabel>
                        <FormControl>
                            <Textarea
                            placeholder="Add custom instructions for the AI review process..."
                            {...field}
                            rows={3}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            
            <div className="space-y-4 rounded-lg border p-4">
                <h3 className="font-semibold">Advanced</h3>
                 <FormField control={form.control} name="disableFileSizeLimit" render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <FormLabel className='font-normal'>Disable file size limit (31MB)</FormLabel>
                    </FormItem>
                )} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleReset}>
                Reset to Defaults
              </Button>
              <Button type="submit">Save Settings</Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
