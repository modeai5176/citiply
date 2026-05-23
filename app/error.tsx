"use client";

import { Button } from "@/components/ui/Button";

export default function ErrorPage({ reset }: { reset: () => void }) {
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
