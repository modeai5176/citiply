"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { quoteSchema, type QuoteFormValues } from "@/lib/validations";

export function QuotePageForm() {
  const [done, setDone] = useState(false);
  const form = useForm<QuoteFormValues>({ resolver: zodResolver(quoteSchema) });

  async function onSubmit(values: QuoteFormValues) {
    const response = await fetch("/api/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
    if (response.ok) setDone(true);
  }

  if (done) {
    return <div className="grid min-h-64 place-items-center text-center"><div><CheckCircle2 className="mx-auto mb-3 h-14 w-14 text-accent" /><h2 className="text-2xl font-semibold">Request sent</h2></div></div>;
  }

  return (
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
      <Input label="Full Name*" {...form.register("fullName")} error={form.formState.errors.fullName?.message} />
      <Input label="Phone*" {...form.register("phone")} error={form.formState.errors.phone?.message} />
      <Input label="WhatsApp" {...form.register("whatsapp")} error={form.formState.errors.whatsapp?.message} />
      <Input label="Firm / Company" {...form.register("firm")} />
      <Input label="City*" {...form.register("city")} error={form.formState.errors.city?.message} />
      <Input label="Product Code" {...form.register("productCode")} />
      <Input label="Quantity" {...form.register("quantity")} />
      <Textarea className="sm:col-span-2" label="Message" {...form.register("message")} />
      <Button className="sm:col-span-2" type="submit">Submit Request</Button>
    </form>
  );
}
