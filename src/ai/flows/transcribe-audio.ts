'use server';

/**
 * @fileOverview This file defines a Genkit flow for transcribing audio files using the Gemini API.
 *
 * - streamTranscription - A server action that provides a stream of transcription text.
 * - TranscribeAudioInput - The input type for the transcribeAudio function.
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


// New server action for streaming
export async function streamTranscription(input: TranscribeAudioInput): Promise<ReadableStream<string>> {
  try {
    const { stream } = await ai.generateStream({
      model: `googleai/${input.model}`,
      prompt: [
          {text: `Transcribe the following audio. Subject: ${input.subject}. Instructions: ${input.transcriptionInstructions}`},
          {media: {url: input.audioDataUri}}
      ],
    });

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.text;
          if (text) {
            controller.enqueue(encoder.encode(text));
          }
        }
        controller.close();
      }
    });

    return readableStream;
  } catch(e: any) {
    console.error(`[GeminiScribe] Error in streamTranscription: ${e.message}`);
    // Re-throw a more user-friendly error that the client can handle.
    throw new Error(`The AI model failed to process the request. This can be due to API limits (e.g., file size, duration) or an internal model error. Details: ${e.message}`);
  }
}