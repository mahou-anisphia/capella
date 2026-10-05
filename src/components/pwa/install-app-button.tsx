"use client";

import { DownloadIcon, ShareIcon, SquarePlusIcon } from "lucide-react";
import { useSyncExternalStore } from "react";

import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "~/components/ui/popover";

/** Chromium-only event, not in lib.dom. */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type InstallMode = "none" | "prompt" | "ios";

// Chromium fires `beforeinstallprompt` once, possibly before React hydrates, so it is captured
// at module load and kept outside React.
let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    notify();
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && navigator.standalone === true)
  );
}

// iPadOS reports itself as a Mac, so touch support tells them apart.
function isIos() {
  const ua = navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (ua.includes("Macintosh") && navigator.maxTouchPoints > 1)
  );
}

function getMode(): InstallMode {
  if (isStandalone()) return "none";
  if (deferredPrompt) return "prompt";
  // iOS has no install API; the user adds it from Safari's share sheet.
  if (isIos()) return "ios";
  return "none";
}

/** Offers "install to home screen"; hidden when already installed or the browser can't. */
export function InstallAppButton() {
  const mode = useSyncExternalStore(subscribe, getMode, () => "none" as const);

  if (mode === "prompt") {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full"
        aria-label="Install app"
        onClick={async () => {
          const prompt = deferredPrompt;
          if (!prompt) return;
          await prompt.prompt();
          await prompt.userChoice;
          // A prompt can only be used once.
          deferredPrompt = null;
          notify();
        }}
      >
        <DownloadIcon />
      </Button>
    );
  }

  if (mode === "ios") {
    return (
      <Popover>
        <PopoverTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label="Add to Home Screen"
            />
          }
        >
          <DownloadIcon />
        </PopoverTrigger>
        <PopoverContent align="end">
          <PopoverHeader>
            <PopoverTitle>Add Capella to your Home Screen</PopoverTitle>
            <PopoverDescription>
              It opens full screen, like an app.
            </PopoverDescription>
          </PopoverHeader>
          <ol className="flex flex-col gap-1.5">
            <li className="flex items-center gap-2">
              <ShareIcon className="text-muted-foreground size-4 shrink-0" />
              Tap Share in the browser toolbar.
            </li>
            <li className="flex items-center gap-2">
              <SquarePlusIcon className="text-muted-foreground size-4 shrink-0" />
              Choose Add to Home Screen.
            </li>
          </ol>
        </PopoverContent>
      </Popover>
    );
  }

  return null;
}
