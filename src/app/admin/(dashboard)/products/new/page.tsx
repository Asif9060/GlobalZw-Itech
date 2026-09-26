import Link from "next/link";
import ProductForm from "../../../_components/product-form";
import { PageHeading } from "../../../_components/ui";

export const metadata = { title: "Add product" };

export default function NewProductPage() {
  return (
    <>
      <PageHeading
        eyebrow="Catalogue"
        title="Add product"
        subtitle="Compose the product page: basics, specifications, and content sections with a left/right image choice for each."
        actions={
          <Link className="ad-btn" href="/admin/products">
            ← Back to catalogue
          </Link>
        }
      />
      <ProductForm product={null} />
    </>
  );
}
