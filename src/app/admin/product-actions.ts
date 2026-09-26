"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth/admin";
import { getProductStore, ProductStoreError } from "@/lib/products";
import { parseProductForm } from "@/lib/products/validate";

/**
 * Product catalogue mutations for the admin portal.
 *
 * Server Actions rather than a Route Handler because only the signed-in admin
 * ever writes products — `assertAdmin()` runs first in every action, the same
 * guard the lead actions use. The public pages only read, through GET
 * `/api/products`.
 */

export type ProductFormState = {
  status: "idle" | "saved" | "error";
  message: string;
  /** Set after a create, so the UI can navigate to the edit view. */
  productId: string | null;
};

const IDLE: ProductFormState = { status: "idle", message: "", productId: null };

function refreshAdmin() {
  revalidatePath("/admin", "layout");
}

function storeFailure(error: unknown): ProductFormState {
  console.error("[admin/products] store failure:", error);
  const message =
    error instanceof ProductStoreError
      ? error.message
      : "The product catalogue could not be saved. Try again.";
  return { status: "error", message, productId: null };
}

export async function saveProductAction(
  _previous: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await assertAdmin();

  const parsed = await parseProductForm(formData);
  if (!parsed.ok) {
    return { status: "error", message: parsed.message, productId: null };
  }

  // Present only on edits; a create sends an empty id.
  const id = String(formData.get("id") ?? "").trim();

  try {
    const store = getProductStore();

    if (id) {
      const existing = await store.getProduct(id);
      if (!existing) {
        return { status: "error", message: "That product no longer exists.", productId: null };
      }
      await store.updateProduct(id, parsed.product);
      refreshAdmin();
      return { status: "saved", message: "Product updated.", productId: id };
    }

    const created = await store.createProduct(parsed.product);
    refreshAdmin();
    return { status: "saved", message: "Product added to the catalogue.", productId: created.id };
  } catch (error) {
    return storeFailure(error);
  }
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  await assertAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await getProductStore().deleteProduct(id);
  refreshAdmin();
}
