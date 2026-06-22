import Image from "next/image";
import { Download } from "lucide-react";
import type { Collection } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export function CollectionCard({ collection }: { collection: Collection }) {
  const count = collection.productCount ?? 0;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-ivory shadow-sm transition hover:shadow-md">
      <div className="relative aspect-[16/9]">
        <Image src={collection.bannerUrl} alt={collection.name} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
      </div>
      <div className="p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-2xl font-semibold">{collection.name}</h3>
          <Badge>{count} products</Badge>
        </div>
        <p className="text-sm leading-6 text-text-secondary">{collection.description}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button href={`/collections/${collection.slug}`}>View Range</Button>
          {collection.brochureUrl !== "#" ? (
            <Button variant="ghost" href={collection.brochureUrl} target="_blank">
              <Download className="h-4 w-4" /> Download Brochure
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
