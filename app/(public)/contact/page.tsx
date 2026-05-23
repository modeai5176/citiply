import { MapPin, MessageCircle, Phone } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";

export default function ContactPage() {
  return (
    <>
      <Breadcrumb items={[{ label: "Contact" }]} />
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <h1 className="text-5xl font-semibold">Contact</h1>
        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.4fr]">
          <div className="grid gap-4">
            <div className="rounded-xl border border-border bg-white p-6"><MapPin className="h-6 w-6 text-accent" /><h2 className="mt-4 text-xl font-semibold">Showroom</h2><p className="mt-2 text-text-secondary">307-308, Traffic Lite Business Park, M.G. Road, Mumbai, Maharashtra</p></div>
            <a className="rounded-xl border border-border bg-white p-6" href="tel:+919136460666"><Phone className="h-6 w-6 text-accent" /><h2 className="mt-4 text-xl font-semibold">Phone</h2><p className="mt-2 text-text-secondary">+91 9136460666</p></a>
            <a className="rounded-xl border border-border bg-white p-6" href="https://wa.me/919136460666" target="_blank" rel="noreferrer"><MessageCircle className="h-6 w-6 text-accent" /><h2 className="mt-4 text-xl font-semibold">WhatsApp</h2><p className="mt-2 text-text-secondary">Click to chat with the team</p></a>
            <div className="rounded-xl border border-border bg-white p-6"><h2 className="text-xl font-semibold">Business Hours</h2><p className="mt-2 text-text-secondary">Monday to Saturday, 10:00 AM - 7:00 PM</p></div>
          </div>
          <iframe className="min-h-[520px] w-full rounded-xl border border-border" title="Google Maps showroom" loading="lazy" src="https://www.google.com/maps?q=Mumbai%20Maharashtra&output=embed" />
        </div>
      </section>
    </>
  );
}
