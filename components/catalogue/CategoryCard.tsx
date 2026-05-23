import Image from "next/image";
import Link from "next/link";
import type { Category } from "@/lib/types";

export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link className="group relative block aspect-[4/5] overflow-hidden rounded-xl bg-dark" href={`/categories/${category.slug}`}>
      <Image src={category.imageUrl} alt={category.name} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover transition duration-300 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      <div className="absolute bottom-0 p-5 text-white">
        <h3 className="text-xl font-semibold">{category.name}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-white/75">{category.description}</p>
      </div>
    </Link>
  );
}
