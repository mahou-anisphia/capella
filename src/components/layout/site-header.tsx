import { SparklesIcon } from "lucide-react";
import Link from "next/link";

import { ThemeToggle } from "~/components/theme/theme-toggle";

export function SiteHeader() {
  return (
    <header className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 py-3">
      <Link
        href="/"
        className="focus-visible:ring-ring/50 font-heading flex items-center gap-2 rounded-full px-1 text-xl font-bold tracking-tight outline-none focus-visible:ring-3"
      >
        <SparklesIcon className="text-accent size-5" aria-hidden />
        Capella
      </Link>
      <ThemeToggle />
    </header>
  );
}
