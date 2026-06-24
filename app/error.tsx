"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  // The error boundary sometimes fires on a soft (client-side) navigation that
  // succeeds on a retry. Auto-recover once so the user doesn't see this screen
  // or have to reload manually; fall back to the manual prompt if it persists.
  const retried = useRef(false);

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("Catalogue view error:", error);
    }
    if (!retried.current) {
      retried.current = true;
      reset();
    }
  }, [error, reset]);

  return (
    <section className="grid min-h-[60vh] place-items-center px-4 text-center">
      <div>
        <h1 className="text-4xl font-semibold">Something went wrong</h1>
        <p className="mt-3 text-text-secondary">Please reload this catalogue view.</p>
        <Button className="mt-6" onClick={reset}>Try Again</Button>
      </div>
    </section>
  );
}
