'use server';

/**
 * @fileOverview This file defines a Genkit flow for transcribing an audio file stored in Firebase Storage.
 *
 * - streamTranscriptionFromStorage - A server action that takes a storage path and streams the transcription.
 * - TranscribeFromStorageInput - The input type for the transcribeFromStorage action.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFileDownloadURL } from '@/lib/storageService.server';

const TranscribeFromStorageInputSchema = z.object({
  fileStoragePath: z
    .string()
    .describe('The full path to the audio file in Firebase Storage.'),
  model: z.string().describe('The Gemini model to use for transcription.'),
  subject: z.string().describe('The subject of the audio recording.'),
  transcriptionInstructions: z
    .string()
    .describe('Instructions for the transcription process.'),
});
export type TranscribeFromStorageInput = z.infer<
  typeof TranscribeFromStorageInputSchema
>;

export async function streamTranscriptionFromStorage(
  input: TranscribeFromStorageInput
): Promise<ReadableStream<string>> {
  try {
    // Get a downloadable URL for the file in Storage.
    // This URL is temporary and secure.
    const audioUrl = await getFileDownloadURL(input.fileStoragePath);

    const { stream } = await ai.generateStream({
      model: `googleai/${input.model}`,
      prompt: [
        {
          text: `Transcribe the following audio. Subject: ${input.subject}. Instructions: ${input.transcriptionInstructions}`,
        },
        { media: { url: audioUrl } },
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
      },
    });

    return readableStream;
  } catch (e: any) {
    console.error(
      `[GeminiScribe] Error in streamTranscriptionFromStorage: ${e.message}`
    );
    // Re-throw a more user-friendly error that the client can handle.
    throw new Error(
      `The AI model failed to process the request. This can be due to API limits, file access permissions, or an internal model error. Details: ${e.message}`
    );
  }
}