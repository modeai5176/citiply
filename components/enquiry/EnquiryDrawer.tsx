"use client";

import { useState } from "react";
import Image from "next/image";
import { Send, Trash2, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEnquiryStore } from "@/lib/enquiry-store";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const formSchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  phone: z.string().min(7, "Phone is required"),
  whatsapp: z.string().optional(),
  firm: z.string().optional(),
  city: z.string().min(2, "City is required"),
  message: z.string().optional()
});
type EnquiryFormValues = z.infer<typeof formSchema>;

export function EnquiryDrawer() {
  const { items, drawerOpen, closeDrawer, removeItem, updateItem, clearItems } = useEnquiryStore();
  const [step, setStep] = useState<"list" | "form" | "success">("list");
  const [error, setError] = useState("");
  const form = useForm<EnquiryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { full_name: "", phone: "", whatsapp: "", firm: "", city: "", message: "" }
  });

  if (!drawerOpen) return null;

  async function onSubmit(values: EnquiryFormValues) {
    setError("");
    const response = await fetch("/api/enquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contact: values, items })
    });
    if (!response.ok) {
      const json = (await response.json()) as { error?: string };
      setError(json.error ?? "Could not submit enquiry");
      return;
    }
    clearItems();
    form.reset();
    setStep("success");
  }

  function handleClose() {
    closeDrawer();
    window.setTimeout(() => setStep("list"), 250);
  }

  return (
    <div className="fixed inset-0 z-[90] bg-[rgb(var(--scrim)/0.45)] backdrop-blur-sm">
      <div className="ml-auto flex h-full w-full max-w-md flex-col bg-background shadow-premium">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold">Enquiry List</h2>
            <p className="text-sm text-text-muted">{items.length} product{items.length === 1 ? "" : "s"}</p>
          </div>
          <button className="cursor-pointer rounded-full p-2 text-text-secondary transition hover:bg-surface hover:text-text-primary" onClick={handleClose} aria-label="Close enquiry drawer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === "list" ? (
          <>
            <div className="flex-1 overflow-y-auto p-4">
              {!items.length ? (
                <div className="grid h-full place-items-center text-center text-text-secondary">
                  <div><ShoppingBagIcon /><p className="mt-4 font-medium text-text-primary">No products added</p><p className="mt-1 text-sm">Use Add to Enquiry on product cards.</p></div>
                </div>
              ) : (
                <div className="grid gap-3">
                  {items.map((item) => (
                    <div className="rounded-xl border border-border bg-ivory p-3" key={item.productId}>
                      <div className="flex gap-3">
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-surface">
                          {item.thumbnailUrl ? <Image src={item.thumbnailUrl} alt={item.name} fill sizes="64px" className="object-cover" /> : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-text-primary">{item.name}</p>
                              <p className="text-xs text-text-muted">{item.collectionName}</p>
                              <p className="font-mono text-xs text-text-muted">{item.sku}</p>
                            </div>
                            <button className="cursor-pointer text-text-muted transition hover:text-red-600" onClick={() => removeItem(item.productId)} aria-label={`Remove ${item.name}`}>
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="mt-3 grid gap-2">
                            <input className="h-9 rounded-lg border border-border bg-background px-3 text-xs outline-none focus:border-accent" placeholder="Quantity" value={item.quantity} onChange={(event) => updateItem(item.productId, { quantity: event.target.value })} />
                            <input className="h-9 rounded-lg border border-border bg-background px-3 text-xs outline-none focus:border-accent" placeholder="Note" value={item.note} onChange={(event) => updateItem(item.productId, { note: event.target.value })} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="border-t border-border p-4">
              <Button className="w-full" disabled={!items.length} onClick={() => setStep("form")}><Send className="h-4 w-4" /> Request Quote</Button>
              {items.length ? <button className="mt-3 w-full cursor-pointer text-sm text-text-muted hover:text-red-600" onClick={clearItems}>Clear all</button> : null}
            </div>
          </>
        ) : null}

        {step === "form" ? (
          <form className="flex flex-1 flex-col" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="border-b border-border bg-surface px-5 py-3">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-text-muted">Products</p>
              <p className="mt-1 text-sm text-text-secondary">{items.map((item) => item.sku).join(", ")}</p>
            </div>
            <div className="grid flex-1 gap-4 overflow-y-auto p-5 sm:grid-cols-2">
              {error ? <div className="sm:col-span-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
              <Input label="Full Name*" {...form.register("full_name")} error={form.formState.errors.full_name?.message} />
              <Input label="Phone*" {...form.register("phone")} error={form.formState.errors.phone?.message} />
              <Input label="WhatsApp" {...form.register("whatsapp")} />
              <Input label="Firm / Company" {...form.register("firm")} />
              <Input label="City*" {...form.register("city")} error={form.formState.errors.city?.message} />
              <Textarea className="sm:col-span-2" label="Project / Message" {...form.register("message")} />
            </div>
            <div className="border-t border-border p-4">
              <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Sending..." : "Submit Enquiry"}</Button>
              <button className="mt-3 w-full cursor-pointer text-sm text-text-muted hover:text-text-primary" type="button" onClick={() => setStep("list")}>Back to list</button>
            </div>
          </form>
        ) : null}

        {step === "success" ? (
          <div className="grid flex-1 place-items-center p-8 text-center">
            <div>
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-green-100 text-green-700">✓</div>
              <h3 className="mt-5 text-xl font-semibold">Enquiry sent</h3>
              <p className="mt-2 text-sm text-text-secondary">Our team will review your product list and contact you soon.</p>
              <Button className="mt-6" onClick={handleClose}>Continue Browsing</Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ShoppingBagIcon() {
  return <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-surface text-text-muted">0</div>;
}
