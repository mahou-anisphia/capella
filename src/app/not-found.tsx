import { CompassIcon } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export default function NotFound() {
  return (
    <div className="bg-card ring-border shadow-surface flex flex-col items-center gap-4 rounded-xl px-6 py-12 text-center ring-1">
      <CompassIcon className="text-accent size-10" aria-hidden />
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold">Nothing here</h1>
        <p className="text-muted-foreground text-sm">
          This page doesn&apos;t exist, or the habit was deleted.
        </p>
      </div>
      <Link href="/" className={cn(buttonVariants(), "h-10 rounded-full px-5")}>
        Back to habits
      </Link>
    </div>
  );
}
