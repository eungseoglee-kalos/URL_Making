"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-color-scheme: dark)";

function getMediaQuery() {
  return typeof window === "undefined" ? null : window.matchMedia(QUERY);
}

function subscribe(onChange: () => void) {
  const mq = getMediaQuery();
  if (!mq) return () => {};
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getSnapshot() {
  return getMediaQuery()?.matches ?? false;
}

// Server render always assumes light so the markup matches the first client
// paint; the store then corrects it if the OS is in dark mode.
function getServerSnapshot() {
  return false;
}

/** Tracks the OS colour scheme, for chart colours Tailwind's `dark:` can't reach. */
export function useIsDark() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
