import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

type LoaderProps = {
  message: string;
  progress: number;
};

export function Loader({ message, progress }: LoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 p-8 rounded-lg bg-card w-full max-w-md mx-auto">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <div className="text-center">
        <p className="text-lg font-medium">{message}</p>
        <p className="text-sm text-muted-foreground">Please wait a moment...</p>
      </div>
      <Progress value={progress} className="w-full" />
    </div>
  );
}
