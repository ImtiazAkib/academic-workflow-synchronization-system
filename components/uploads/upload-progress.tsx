'use client';

import { useEffect } from 'react';

import { useRouter } from '@/l10n/navigation';
import { FileConversionStatus } from '@/types';

import { FILE_CONVERSION_STATUS } from '@/constants/storage.const';

import { Badge, Spinner, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui';

/**
 * One conversion, reduced to what the table renders — every string already localized and
 * formatted on the server, so this component only paints and polls.
 */
export type UploadRowView = {
  conversionId: string;
  fileName: string;
  status: FileConversionStatus;
  statusLabel: string;
  /** The size summary when done, the reason when failed, the arriving size while processing. */
  detail: string;
  when: string;
};

export type UploadProgressLabels = {
  tableLabel: string;
  fileColumn: string;
  statusColumn: string;
  detailColumn: string;
  whenColumn: string;
  empty: string;
};

type UploadProgressProps = {
  rows: UploadRowView[];
  labels: UploadProgressLabels;
};

/*
  The conversions list, and it refreshes itself while any of them is still running.

  A conversion finishes on the server, off the back of the upload's response — nothing
  pushes that news to this page. So while a row is `processing`, the component re-runs the
  server component on an interval; the moment none are, it stops, because there is nothing
  left to wait for and a dashboard that polls forever is a dashboard that never sleeps.
*/
export function UploadProgress({ rows, labels }: UploadProgressProps) {
  const router = useRouter();
  const hasProcessing = rows.some(x => x.status === FILE_CONVERSION_STATUS.PROCESSING);

  useEffect(() => {
    if (!hasProcessing) {
      return;
    }

    const interval = setInterval(() => router.refresh(), 4000);

    return () => clearInterval(interval);
  }, [hasProcessing, router]);

  if (rows.length === 0) {
    return <p className="text-muted-foreground rounded-lg border border-dashed px-4 py-8 text-center text-sm">{labels.empty}</p>;
  }

  return (
    <div className="border-border w-full overflow-x-auto rounded-lg border" aria-live="polite" aria-busy={hasProcessing}>
      <Table aria-label={labels.tableLabel} className="min-w-2xl">
        <TableHeader>
          <TableRow>
            <TableHead>{labels.fileColumn}</TableHead>
            <TableHead>{labels.statusColumn}</TableHead>
            <TableHead>{labels.detailColumn}</TableHead>
            <TableHead>{labels.whenColumn}</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {rows.map(x => (
            <TableRow key={x.conversionId}>
              <TableCell className="font-medium break-all">{x.fileName}</TableCell>

              <TableCell>
                <Badge
                  variant={x.status === FILE_CONVERSION_STATUS.DONE ? 'success' : x.status === FILE_CONVERSION_STATUS.FAILED ? 'destructive' : 'info'}
                  className="inline-flex items-center gap-1.5">
                  {x.status === FILE_CONVERSION_STATUS.PROCESSING && <Spinner className="size-3" />}
                  {x.statusLabel}
                </Badge>
              </TableCell>

              <TableCell className="text-muted-foreground text-sm break-all">{x.detail}</TableCell>

              <TableCell className="text-muted-foreground text-sm whitespace-nowrap">{x.when}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
