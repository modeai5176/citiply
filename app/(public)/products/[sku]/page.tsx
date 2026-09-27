import Link from "next/link";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ImageGallery } from "@/components/catalogue/ImageGallery";
import { ProductGrid } from "@/components/catalogue/ProductGrid";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProductCodeBadge } from "@/components/ui/ProductCodeBadge";
import { AddToEnquiryButton } from "@/components/enquiry/AddToEnquiryButton";
import { getCategories, getCollections, getProductBySku, getProducts, getProductStaticParams } from "@/lib/catalogue-data";
import { ProductQuoteButton } from "./product-quote-button";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  return getProductStaticParams(10);
}

export default async function ProductDetailPage({ params }: { params: { sku: string } }) {
  const product = await getProductBySku(params.sku);
  if (!product) notFound();
  const [categories, collections, related] = await Promise.all([
    getCategories(),
    getCollections(),
    getProducts({ collectionId: product.collectionId, excludeId: product.id, limit: 4 })
  ]);
  const collection = collections.find((item) => item.id === product.collectionId);
  const category = categories.find((item) => item.id === product.categoryId);
  const details = [
    ["Size", product.size],
    ["Color Tone", product.colorTone]
  ].filter(([, value]) => value && value !== "Not specified");

  return (
    <>
      <Breadcrumb
        items={[
          ...(category?.catalogueName && category.catalogueSlug ? [{ label: category.catalogueName, href: `/catalogues/${category.catalogueSlug}` }] : []),
          { label: category?.name ?? "Category", href: category ? `/categories/${category.slug}` : undefined },
          { label: collection?.name ?? "Collection", href: collection ? `/collections/${collection.slug}` : undefined },
          { label: product.sku }
        ]}
      />
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(360px,2fr)]">
          <ImageGallery images={product.images} />
          <div>
            <ProductCodeBadge code={product.sku} className="text-sm" />
            <h1 className="mt-5 text-5xl font-semibold">{product.name}</h1>
            {collection ? <Link className="mt-4 inline-flex text-accent" href={`/collections/${collection.slug}`}>{collection.name}</Link> : null}
            {product.shortDescription ? <p className="mt-5 text-text-secondary">{product.shortDescription}</p> : null}
            {details.length ? (
              <dl className="mt-8 divide-y divide-border border-y border-border">
                {details.map(([name, value]) => (
                  <div className="flex items-baseline justify-between gap-6 py-3" key={name}>
                    <dt className="text-xs uppercase tracking-[0.2em] text-text-muted">{name}</dt>
                    <dd className="text-right font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            {product.applications.length ? (
              <div className="mt-6">
                <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Applications</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {product.applications.map((item) => <Badge key={item}>{item}</Badge>)}
                </div>
              </div>
            ) : null}
            <div className="mt-8 flex flex-wrap gap-3">
              {product.brochureUrl !== "#" ? <Button href={product.brochureUrl} target="_blank"><Download className="h-4 w-4" /> Download Brochure</Button> : null}
              <ProductQuoteButton product={{ sku: product.sku, name: product.name, colorTone: product.colorTone === "Not specified" ? undefined : product.colorTone, imageUrl: product.images[0]?.thumbnailUrl }} />
            </div>
            <div className="mt-3 max-w-xs">
              <AddToEnquiryButton product={product} variant="detail" />
            </div>
          </div>
        </div>
        {product.specs.length ? (
          <div className="mt-16">
            <h2 className="text-3xl font-semibold">Technical Specs</h2>
            <dl className="mt-5 max-w-3xl divide-y divide-border border-y border-border">
              {product.specs.map((spec) => (
                <div className="grid grid-cols-2 gap-6 py-3 text-sm" key={spec.name}>
                  <dt className="font-medium">{spec.name}</dt>
                  <dd className="text-text-secondary">{spec.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}
        {related.length ? (
          <div className="mt-16">
            <h2 className="mb-6 text-3xl font-semibold">Related Products</h2>
            <ProductGrid products={related} />
          </div>
        ) : null}
      </section>
    </>
  );
}
