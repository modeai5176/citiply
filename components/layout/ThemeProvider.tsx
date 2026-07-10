/**
 * The site uses a single fixed theme (Noir Walnut), applied via the
 * `data-theme="noir-walnut"` attribute on <html> in the root layout. This
 * provider is intentionally a passthrough — kept so the layout tree and any
 * future theming hook have a stable mount point — and renders children verbatim.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
