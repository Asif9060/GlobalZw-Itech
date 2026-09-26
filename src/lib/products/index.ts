import { localProductStore, ProductStoreError } from "@/lib/products/store";
import type { ProductStore } from "@/lib/products/store";

/**
 * Public entry point for product storage. Server-only — this module
 * transitively imports `node:fs`, so it must never be pulled into a Client
 * Component.
 *
 * The catalogue lives in the local file store only for now; when Supabase
 * gains a `products` table, add a backend here behind the same interface, the
 * way `src/lib/leads/index.ts` does.
 */

export function getProductStore(): ProductStore {
  return localProductStore;
}

export { ProductStoreError };
export type { ProductStore };
export * from "@/lib/products/types";
