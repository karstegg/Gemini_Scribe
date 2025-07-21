'use client';

import { useState, type DragEvent } from 'react';
import { UploadCloud, File as FileIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

const MAX_FILE_SIZE = 31 * 1024 * 1024; // 31MB
const ACCEPTED_FILE_TYPES = 'audio/mpeg,audio/wav,audio/mp4,audio/x-m4a,audio/webm,audio/flac';
const acceptedMimeTypes = ACCEPTED_FILE_TYPES.split(',');

type FileUploadProps = {
  file: File | null;
  setFile: (file: File | null) => void;
  disabled?: boolean;
};

export function FileUpload({ file, setFile, disabled = false }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleValidation = (selectedFile: File) => {
    setError(null);
    if (!acceptedMimeTypes.includes(selectedFile.type)) {
      setError(`Invalid file type. Please upload one of: ${acceptedMimeTypes.join(', ')}`);
      return false;
    }
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError(`File is too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`);
      return false;
    }
    return true;
  };

  const handleFileChange = (selectedFile: File | undefined | null) => {
    if (selectedFile && handleValidation(selectedFile)) {
      setFile(selectedFile);
    }
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setError(null);
  };

  if (file) {
    return (
      <div className="p-4 rounded-lg border-2 border-dashed border-border bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileIcon className="h-8 w-8 text-primary" />
            <div>
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleRemoveFile} disabled={disabled}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        className={cn(
          'relative flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200 ease-in-out',
          isDragging ? 'border-primary bg-accent/20' : 'border-border hover:border-primary/50',
          disabled && 'cursor-not-allowed opacity-50'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDragLeave}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <UploadCloud className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="mb-2 text-lg font-semibold text-center">
          Drag & drop your audio file here
        </p>
        <p className="text-muted-foreground text-sm mb-4">or</p>
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept={ACCEPTED_FILE_TYPES}
          onChange={(e) => handleFileChange(e.target.files?.[0])}
          disabled={disabled}
        />
        <label
          htmlFor="file-upload"
          className={cn(
            "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90",
            disabled && 'pointer-events-none opacity-50'
          )}
        >
          Browse File
        </label>
        <p className="mt-4 text-xs text-muted-foreground">Max file size: 31MB</p>
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
