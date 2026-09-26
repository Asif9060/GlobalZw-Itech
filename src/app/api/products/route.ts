import { getProductStore } from "@/lib/products";
import { isSiteSlug, type SiteSlug } from "@/lib/sites";

/**
 * GET /api/products — the read-only catalogue endpoint the landing pages use.
 *
 * Public by design: everything it returns is content the admin chose to
 * publish. With `?site=<slug>` it narrows to the products assigned to one
 * landing page; otherwise it lists the whole catalogue.
 */

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const siteParam = url.searchParams.get("site");

  let site: SiteSlug | undefined;
  if (siteParam) {
    if (!isSiteSlug(siteParam)) {
      return Response.json(
        { ok: false, message: "Unknown `site`." },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }
    site = siteParam;
  }

  const products = await getProductStore().listProducts(site);

  // Strip timestamps the pages never render, keep payloads small — sections
  // can carry inline data-URI images.
  const payload = products.map((product) => ({
    id: product.id,
    slug: product.slug,
    name: product.name,
    category: product.category,
    description: product.description,
    mainImage: product.mainImage,
    specs: product.specs,
    sections: product.sections,
    sites: product.sites,
  }));

  return Response.json(
    { ok: true, products: payload },
    {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    },
  );
}
