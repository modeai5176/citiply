import { BRANDS, type Brand } from '@/lib/brands';
import { cn } from '@/lib/utils';

function BrandMark({ brand }: { brand: Brand }) {
  if (brand.logo) {
    // Official artwork is tinted to the marquee colour via CSS mask, whatever its original colours.
    return (
      <span
        role="img"
        aria-label={brand.name}
        className="block h-6 w-24 bg-current"
        style={{
          WebkitMask: `url(${brand.logo}) center / contain no-repeat`,
          mask: `url(${brand.logo}) center / contain no-repeat`,
        }}
      />
    );
  }

  return (
    <span
      className={cn(
        'whitespace-nowrap',
        brand.face === 'serif' ? 'font-serif text-lg' : 'font-sans text-sm font-semibold uppercase tracking-[0.18em]'
      )}
    >
      {brand.name}
    </span>
  );
}

/** Single-colour, infinitely scrolling row of partner brands. */
export function BrandMarquee({ className }: { className?: string }) {
  // Rendered twice so the -50% translate loops seamlessly.
  const track = [...BRANDS, ...BRANDS];

  return (
    <div className={className}>
      <p className="mb-3 px-6 text-[0.65rem] uppercase tracking-[0.22em] sm:px-10" style={{ color: 'rgb(var(--on-image) / 0.45)' }}>
        Brands at Citiply
      </p>
      <div
        className="overflow-hidden"
        style={{
          WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)',
          maskImage: 'linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)',
        }}
        aria-label={`Brands: ${BRANDS.map((brand) => brand.name).join(', ')}`}
        role="region"
      >
        <ul className="marquee-track flex w-max items-center" style={{ color: 'rgb(var(--on-image) / 0.72)' }}>
          {track.map((brand, index) => (
            <li key={`${brand.slug}-${index}`} className="flex items-center" aria-hidden={index >= BRANDS.length}>
              <BrandMark brand={brand} />
              <span aria-hidden="true" className="mx-6 block h-1 w-1 rounded-full" style={{ backgroundColor: 'var(--color-gold)' }} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
