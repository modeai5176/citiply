import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <section className="grid min-h-[60vh] place-items-center px-4 text-center">
      <div>
        <p className="text-sm uppercase tracking-[0.25em] text-text-muted">404</p>
        <h1 className="mt-3 text-4xl font-semibold">Page not found</h1>
        <p className="mt-3 text-text-secondary">The catalogue page you requested is unavailable.</p>
        <Button className="mt-6" href="/">Back Home</Button>
      </div>
    </section>
  );
}
