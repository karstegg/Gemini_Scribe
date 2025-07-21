'use server';
/**
 * @fileOverview An AI agent that reviews and corrects a transcription, providing a changelog.
 *
 * - reviewAndCorrectTranscription - A function that handles the review and correction process.
 * - ReviewAndCorrectTranscriptionInput - The input type for the reviewAndCorrectTranscription function.
 * - ReviewAndCorrectTranscriptionOutput - The return type for the reviewAndCorrectTranscription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ReviewAndCorrectTranscriptionInputSchema = z.object({
  transcription: z
    .string()
    .describe('The original transcription to be reviewed and corrected.'),
  reviewSettings: z.object({
    correctSpelling: z.boolean().describe('Whether to correct spelling errors.'),
    analyzeDiarization: z
      .boolean()
      .describe('Whether to analyze speaker diarization and correct speaker labels.'),
    customReviewPrompt: z.string().describe('Custom instructions for the review process.').optional(),
  })
});

export type ReviewAndCorrectTranscriptionInput = z.infer<
  typeof ReviewAndCorrectTranscriptionInputSchema
>;

const ReviewAndCorrectTranscriptionOutputSchema = z.object({
  correctedTranscription: z
    .string()
    .describe('The corrected transcription after review.'),
  changelog: z.string().describe('A summary of the changes made during the review.'),
});

export type ReviewAndCorrectTranscriptionOutput = z.infer<
  typeof ReviewAndCorrectTranscriptionOutputSchema
>;

export async function reviewAndCorrectTranscription(
  input: ReviewAndCorrectTranscriptionInput
): Promise<ReviewAndCorrectTranscriptionOutput> {
  return reviewAndCorrectTranscriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'reviewAndCorrectTranscriptionPrompt',
  input: {schema: ReviewAndCorrectTranscriptionInputSchema},
  output: {schema: ReviewAndCorrectTranscriptionOutputSchema},
  prompt: `You are an AI expert tasked with reviewing and correcting transcriptions.

  Given the original transcription, your goal is to provide a corrected transcription and a changelog summarizing the edits.

  Here are the review settings:
  - Correct spelling: {{reviewSettings.correctSpelling}}
  - Analyze speaker diarization: {{reviewSettings.analyzeDiarization}}
  - Custom Review Prompt: {{reviewSettings.customReviewPrompt}}

  Original Transcription: {{{transcription}}}

  Follow these instructions:
  1.  Correct any spelling and grammatical errors.
  2.  If analyze speaker diarization is true, ensure the speaker labels are accurate and consistent.
  3.  Use the custom review prompt, if available, to guide the review process.

  Output the corrected transcription and a detailed changelog.
  Ensure the output is a JSON with the following schema: { correctedTranscription: string, changelog: string }
  Be very strict about escaping characters and not including markdown fences.
  
  Corrected Transcription: 
  Changelog: `,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const reviewAndCorrectTranscriptionFlow = ai.defineFlow(
  {
    name: 'reviewAndCorrectTranscriptionFlow',
    inputSchema: ReviewAndCorrectTranscriptionInputSchema,
    outputSchema: ReviewAndCorrectTranscriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
