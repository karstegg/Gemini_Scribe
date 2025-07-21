'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AlertCircle, FileText, Trash2 } from 'lucide-react';
import type { HistoryItem } from '@/types';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Badge } from '../ui/badge';

type HistoryListProps = {
  history: HistoryItem[];
  loading: boolean;
  error: string | null;
  onViewDetail: (item: HistoryItem) => void;
  onDeleteItem: (id: string) => void;
};

export function HistoryList({ history, loading, error, onViewDetail, onDeleteItem }: HistoryListProps) {

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDeleteItem(id);
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (history.length === 0) {
    return (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No History Found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
                Your transcribed files will appear here.
            </p>
        </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>File Name</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((item) => (
            <TableRow key={item.id} onClick={() => onViewDetail(item)} className="cursor-pointer">
              <TableCell className="font-medium">{item.fileName}</TableCell>
              <TableCell>{item.createdAt?.toDate().toLocaleString() ?? 'N/A'}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {item.summary && <Badge variant="outline">Summary</Badge>}
                  {item.correctedTranscription && <Badge variant="outline">Reviewed</Badge>}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={(e) => handleDelete(e, item.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
