import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { QuotePageForm } from "./quote-page-form";

export default function QuotePage() {
  return (
    <>
      <Breadcrumb items={[{ label: "Request Quote" }]} />
      <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6 lg:px-8">
        <h1 className="text-5xl font-semibold">Request Quote</h1>
        <p className="mt-4 text-text-secondary">Share project details and our team will respond with product availability and pricing guidance.</p>
        <div className="mt-8 rounded-xl border border-border bg-white p-5">
          <QuotePageForm />
        </div>
      </section>
    </>
  );
}
