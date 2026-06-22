import Image from "next/image";
import Link from "next/link";
import type { Catalogue } from "@/lib/types";

export function CatalogueCard({ catalogue }: { catalogue: Catalogue }) {
  return (
    <Link className="group relative block aspect-[4/5] overflow-hidden rounded-xl bg-dark" href={`/catalogues/${catalogue.slug}`}>
      <Image src={catalogue.imageUrl} alt={catalogue.name} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover transition duration-300 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-[rgb(var(--scrim)/0.7)] via-[rgb(var(--scrim)/0.1)] to-transparent" />
      <div className="absolute bottom-0 p-5 text-[rgb(var(--on-image))]">
        <h3 className="text-xl font-semibold">{catalogue.name}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-[rgb(var(--on-image)/0.75)]">{catalogue.description}</p>
      </div>
    </Link>
  );
}
