'use server';

/**
 * @fileOverview This file defines a Genkit flow for transcribing audio files using the Gemini API.
 *
 * - transcribeAudio - A function that handles the audio transcription process.
 * - TranscribeAudioInput - The input type for the transcribeAudio function.
 * - TranscribeAudioOutput - The return type for the transcribeAudio function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranscribeAudioInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "An audio file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  model: z.string().describe('The Gemini model to use for transcription.'),
  subject: z.string().describe('The subject of the audio recording.'),
  transcriptionInstructions: z.string().describe('Instructions for the transcription process.'),
  speakerLabels: z.boolean().describe('Whether to include speaker labels in the transcription.'),
  addTimestamps: z.boolean().describe('Whether to add timestamps to the transcription.'),
  generateSummary: z.boolean().describe('Whether to generate a summary of the transcription.'),
  review: z.boolean().describe('Whether to review and correct the transcription.'),
  referenceFiles: z.array(z.string()).describe('A list of reference files to use for context.'),
});
export type TranscribeAudioInput = z.infer<typeof TranscribeAudioInputSchema>;

const TranscribeAudioOutputSchema = z.object({
  transcription: z.string().describe('The transcribed text.'),
});
export type TranscribeAudioOutput = z.infer<typeof TranscribeAudioOutputSchema>;

export async function transcribeAudio(input: TranscribeAudioInput): Promise<TranscribeAudioOutput> {
  return transcribeAudioFlow(input);
}

const prompt = ai.definePrompt({
  name: 'transcribeAudioPrompt',
  input: {schema: TranscribeAudioInputSchema},
  output: {schema: TranscribeAudioOutputSchema},
  prompt: `You are an expert transcriptionist. Transcribe the provided audio recording into text accurately.

Subject: {{{subject}}}
Transcription Instructions: {{{transcriptionInstructions}}}

Your output MUST be a valid JSON object matching the requested schema. Do not include any other text or markdown fences.

Audio: {{media url=audioDataUri}}
`,
});

const transcribeAudioFlow = ai.defineFlow(
  {
    name: 'transcribeAudioFlow',
    inputSchema: TranscribeAudioInputSchema,
    outputSchema: TranscribeAudioOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
