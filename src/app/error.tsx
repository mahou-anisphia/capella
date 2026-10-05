"use client";

import { CloudIcon } from "lucide-react";

import { Button } from "~/components/ui/button";

/** Calm fallback when a page's data can't load (database down, migrations not run, …). */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="bg-card ring-border shadow-surface flex flex-col items-center gap-4 rounded-xl px-6 py-12 text-center ring-1">
      <CloudIcon className="text-accent size-10" aria-hidden />
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold">This page couldn&apos;t load</h1>
        <p className="text-muted-foreground text-sm">
          Nothing you logged is lost. Give it another go in a moment.
        </p>
        {process.env.NODE_ENV === "development" && (
          <p className="text-muted-foreground mt-2 font-mono text-xs break-all">
            {error.message}
          </p>
        )}
      </div>
      <Button className="h-10 rounded-full px-5" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
