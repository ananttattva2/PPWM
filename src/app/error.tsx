"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="error-page">
      <h1>We couldn’t connect right now.</h1>
      <p>Please try again. If this continues, contact your administrator.</p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
