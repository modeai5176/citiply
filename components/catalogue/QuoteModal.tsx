"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Toast } from "@/components/ui/Toast";
import { quoteSchema, type QuoteFormValues } from "@/lib/validations";

type QuoteContextValue = {
  openQuote: (product?: string | QuoteProductSummary) => void;
};

type QuoteProductSummary = {
  sku: string;
  name: string;
  finish?: string;
  colorTone?: string;
  imageUrl?: string;
};

const QuoteContext = createContext<QuoteContextValue | null>(null);

export function useQuoteModal() {
  const context = useContext(QuoteContext);
  if (!context) throw new Error("useQuoteModal must be used inside QuoteModalProvider");
  return context;
}

export function QuoteModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<QuoteProductSummary | null>(null);
  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteSchema),
    defaultValues: { fullName: "", phone: "", whatsapp: "", firm: "", city: "", productCode: "", quantity: "", message: "" }
  });

  const value = useMemo<QuoteContextValue>(() => ({
    openQuote: (product?: string | QuoteProductSummary) => {
      setSubmitted(false);
      const productSummary = typeof product === "string" ? { sku: product, name: product } : product ?? null;
      setSelectedProduct(productSummary);
      form.setValue("productCode", productSummary?.sku ?? "");
      setOpen(true);
    }
  }), [form]);

  async function onSubmit(values: QuoteFormValues) {
    const response = await fetch("/api/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });

    if (!response.ok) {
      setToast({ message: "Could not send inquiry. Please try again.", type: "error" });
      return;
    }

    setSubmitted(true);
    setToast({ message: "Inquiry sent", type: "success" });
    form.reset();
  }

  return (
    <QuoteContext.Provider value={value}>
      {children}
      <Modal title="Quick Inquiry" open={open} onClose={() => setOpen(false)}>
        {submitted ? (
          <div className="grid min-h-72 place-items-center text-center">
            <div>
              <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-accent" />
              <h3 className="text-2xl font-semibold">Request received</h3>
              <p className="mt-2 text-text-secondary">Our team will contact you with details and next steps.</p>
            </div>
          </div>
        ) : (
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
            {selectedProduct ? (
              <div className="sm:col-span-2 rounded-xl border border-accent/20 bg-accent/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Selected Product</p>
                <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-text-primary">{selectedProduct.name}</p>
                    <p className="text-sm text-text-secondary">{selectedProduct.sku}</p>
                  </div>
                  {(selectedProduct.finish || selectedProduct.colorTone) ? (
                    <p className="text-sm text-text-muted">{[selectedProduct.finish, selectedProduct.colorTone].filter(Boolean).join(" / ")}</p>
                  ) : null}
                </div>
              </div>
            ) : null}
            <Input label="Full Name*" {...form.register("fullName")} error={form.formState.errors.fullName?.message} />
            <Input label="Phone*" {...form.register("phone")} error={form.formState.errors.phone?.message} />
            <Input label="WhatsApp" {...form.register("whatsapp")} error={form.formState.errors.whatsapp?.message} />
            <Input label="Firm / Company" {...form.register("firm")} />
            <Input label="City*" {...form.register("city")} error={form.formState.errors.city?.message} />
            {selectedProduct ? (
              <input type="hidden" {...form.register("productCode")} />
            ) : (
              <Input label="Product Code" {...form.register("productCode")} />
            )}
            <Input label="Quantity" {...form.register("quantity")} />
            <Textarea className="sm:col-span-2" label="Message" {...form.register("message")} />
            <p className="text-sm text-text-muted sm:col-span-2">
              Want to enquire about multiple products? Browse the catalogue and use the Add to Enquiry button on each product.
            </p>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Sending..." : "Submit Inquiry"}</Button>
            </div>
          </form>
        )}
      </Modal>
      {toast ? <Toast message={toast.message} type={toast.type} /> : null}
    </QuoteContext.Provider>
  );
}
