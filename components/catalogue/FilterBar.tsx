import { Search } from "lucide-react";

export type FilterState = {
  search: string;
  species: string;
  tone: string;
  grain: string;
  finish: string;
  application: string;
  availability: string;
};

export type FilterGroup = {
  key: keyof Omit<FilterState, "search">;
  label: string;
  options: string[];
};

export const emptyFilters: FilterState = {
  search: "",
  species: "",
  tone: "",
  grain: "",
  finish: "",
  application: "",
  availability: ""
};

type FilterBarProps = {
  groups: FilterGroup[];
  value: FilterState;
  onChange: (value: FilterState) => void;
};

export function FilterBar({ groups, value, onChange }: FilterBarProps) {
  return (
    <div className="mb-8 rounded-xl border border-border bg-ivory p-3">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <label className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            className="h-11 w-full rounded-full border border-border bg-background pl-10 pr-4 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            placeholder="Search product code or name"
            value={value.search}
            onChange={(event) => onChange({ ...value, search: event.target.value })}
          />
        </label>
        <div className="flex flex-wrap gap-3 md:flex-nowrap md:overflow-x-auto md:pb-0">
          {groups.map((group) => (
            <select
              key={group.key}
              value={value[group.key]}
              onChange={(event) => onChange({ ...value, [group.key]: event.target.value })}
              className="h-11 shrink-0 cursor-pointer rounded-full border border-border bg-background px-4 text-sm text-text-secondary outline-none transition hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20"
            >
              <option value="">{group.label}</option>
              {group.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ))}
        </div>
      </div>
    </div>
  );
}
