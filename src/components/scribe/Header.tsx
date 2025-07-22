'use client';

import { Button } from '@/components/ui/button';
import { History, Home, Settings, Bot } from 'lucide-react';
import type { View } from '@/types';

type HeaderProps = {
  view: View;
  onShowHistory: () => void;
  onShowNewTranscription: () => void;
  onOpenSettings: () => void;
};

export function Header({ view, onShowHistory, onShowNewTranscription, onOpenSettings }: HeaderProps) {
  return (
    <header className="flex items-center justify-between p-4 border-b border-border/50">
      <div className="flex items-center gap-3">
        <Bot className="h-8 w-8 text-primary" />
        <div>
            <h1 className="text-2xl font-bold">Gemini Scribe</h1>
            <p className="text-muted-foreground">AI-powered audio transcription</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {view === 'transcribe' ? (
          <>
            <Button variant="outline" size="sm" onClick={onOpenSettings}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
            <Button variant="outline" size="sm" onClick={onShowHistory}>
              <History className="mr-2 h-4 w-4" />
              History
            </Button>
          </>
        ) : (
          <Button variant="outline" size="sm" onClick={onShowNewTranscription}>
            <Home className="mr-2 h-4 w-4" />
            Home
          </Button>
        )}
      </div>
    </header>
  );
}
