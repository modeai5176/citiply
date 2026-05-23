import { Search } from "lucide-react";

const filters = ["Finish", "Base Material", "Color Tone", "Application", "Thickness"];

export function FilterBar() {
  return (
    <div className="mb-8 flex flex-col gap-4 rounded-xl border border-border bg-white p-3 md:flex-row md:items-center">
      <label className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input className="h-11 w-full rounded-full border border-border bg-background pl-10 pr-4 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" placeholder="Search product code or name" />
      </label>
      <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
        {filters.map((filter) => (
          <button className="shrink-0 cursor-pointer rounded-full border border-border px-4 py-2 text-sm text-text-secondary transition hover:border-accent hover:text-accent" key={filter}>
            {filter}
          </button>
        ))}
      </div>
    </div>
  );
}
