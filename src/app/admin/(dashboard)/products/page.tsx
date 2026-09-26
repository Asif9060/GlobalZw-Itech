import Link from "next/link";
import { getProductStore } from "@/lib/products";
import { Empty, PageHeading } from "../../_components/ui";
import { deleteProductAction } from "../../product-actions";
import ConfirmButton from "../../_components/confirm-button";

/**
 * Catalogue overview: every product, which landing pages it appears on, and
 * links into the editor. New products start at /admin/products/new.
 */

export const metadata = { title: "Products" };

export default async function ProductsPage() {
  const products = await getProductStore().listProducts();

  return (
    <>
      <PageHeading
        eyebrow="Catalogue"
        title="Products"
        subtitle="Products added here appear on the landing pages you pick for them, with a detail modal visitors can open."
        actions={
          <Link className="ad-btn ad-btn--primary" href="/admin/products/new">
            + Add product
          </Link>
        }
      />

      {products.length === 0 ? (
        <Empty
          icon="📦"
          title="No products yet"
          hint={
            <>
              Add your first product with the form — name, description, main image,
              specifications and any number of content sections with left/right images.
            </>
          }
        />
      ) : (
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Pages</th>
                <th>Sections</th>
                <th>Updated</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <Link className="ad-link" href={`/admin/products/${product.id}`}>
                      {product.name}
                    </Link>
                  </td>
                  <td>{product.category || "—"}</td>
                  <td>{product.sites.join(", ")}</td>
                  <td>{product.sections.length}</td>
                  <td>{new Date(product.updatedAt).toLocaleDateString()}</td>
                  <td className="ad-table__actions">
                    <Link className="ad-btn ad-btn--sm" href={`/admin/products/${product.id}`}>
                      Edit
                    </Link>
                    <form action={deleteProductAction}>
                      <input type="hidden" name="id" value={product.id} />
                      <ConfirmButton message={`Delete "${product.name}" from the catalogue?`}>
                        Delete
                      </ConfirmButton>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
