"use client";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("Page failed to render", error);
  }, [error]);
  return (
    <main className="error-page">
      <h1>This page couldn’t open.</h1>
      <p>Try again, or reload the page to start fresh.</p>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <Button onClick={() => retry()}>Try again</Button>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Reload page
        </Button>
      </div>
    </main>
  );
}
