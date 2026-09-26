import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductStore } from "@/lib/products";
import ProductForm from "../../../_components/product-form";
import { PageHeading } from "../../../_components/ui";

export const metadata = { title: "Edit product" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductStore().getProduct(id);
  if (!product) notFound();

  return (
    <>
      <PageHeading
        eyebrow="Catalogue"
        title={`Edit — ${product.name}`}
        subtitle="Changes go live on every landing page this product is assigned to."
        actions={
          <Link className="ad-btn" href="/admin/products">
            ← Back to catalogue
          </Link>
        }
      />
      <ProductForm product={product} />
    </>
  );
}
