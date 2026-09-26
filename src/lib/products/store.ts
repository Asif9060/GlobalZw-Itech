import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { SiteSlug } from "@/lib/sites";
import type { NewProduct, Product, ProductStoreKind } from "@/lib/products/types";

/**
 * File-backed product catalogue store.
 *
 * Same shape as the lead store's local backend: one JSON document under
 * `.data/`, read on demand and written atomically (temp file + rename), with
 * writes serialised through a single promise chain. Products are edited only
 * from the admin portal, so write volume is tiny.
 *
 * Unlike leads, products are read by every landing page through
 * `/api/products`, so the document is cached in memory and only re-read when
 * a write happens.
 */

type ProductsDocument = {
  version: 1;
  products: Product[];
};

export class ProductStoreError extends Error {
  readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "ProductStoreError";
    this.cause = cause;
  }
}

export interface ProductStore {
  readonly kind: ProductStoreKind;
  createProduct(input: NewProduct): Promise<Product>;
  updateProduct(id: string, input: NewProduct): Promise<Product | null>;
  deleteProduct(id: string): Promise<boolean>;
  listProducts(site?: SiteSlug): Promise<Product[]>;
  getProduct(id: string): Promise<Product | null>;
}

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_FILE = path.join(DATA_DIR, "products.json");

const EMPTY: ProductsDocument = { version: 1, products: [] };

/** Serialises read-modify-write cycles so two requests cannot clobber each other. */
let queue: Promise<unknown> = Promise.resolve();

function withLock<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

/** In-memory cache; invalidated on every write. */
let cached: ProductsDocument | null = null;

async function readDoc(): Promise<ProductsDocument> {
  if (cached) return cached;

  try {
    const raw = await readFile(STORE_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<ProductsDocument>;
    cached = {
      version: 1,
      products: Array.isArray(parsed.products) ? parsed.products : [],
    };
    return cached;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      cached = { ...EMPTY };
      return cached;
    }
    if (error instanceof SyntaxError) {
      throw new ProductStoreError(
        `The products store at ${STORE_FILE} is not valid JSON. Delete it to start fresh.`,
        error,
      );
    }
    throw new ProductStoreError(`Could not read ${STORE_FILE}`, error);
  }
}

async function writeDoc(doc: ProductsDocument): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  const temp = `${STORE_FILE}.${process.pid}.tmp`;
  await writeFile(temp, JSON.stringify(doc, null, 2), "utf8");
  await rename(temp, STORE_FILE);
  cached = doc;
}

/** "Futura 200 mm LED" -> "futura-200-mm-led", guaranteed unique in the doc. */
function makeSlug(doc: ProductsDocument, name: string, ignoreId?: string): string {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "product";

  let slug = base;
  for (
    let i = 2;
    doc.products.some((p) => p.slug === slug && p.id !== ignoreId);
    i += 1
  ) {
    slug = `${base}-${i}`;
  }
  return slug;
}

export const localProductStore: ProductStore = {
  kind: "local",

  async createProduct(input: NewProduct): Promise<Product> {
    return withLock(async () => {
      const doc = await readDoc();
      const now = new Date().toISOString();

      const product: Product = {
        id: randomUUID(),
        slug: makeSlug(doc, input.name),
        name: input.name,
        category: input.category,
        description: input.description,
        mainImage: input.mainImage,
        specs: input.specs,
        sections: input.sections,
        sites: input.sites,
        createdAt: now,
        updatedAt: now,
      };

      doc.products.unshift(product);
      await writeDoc(doc);
      return product;
    });
  },

  async updateProduct(id: string, input: NewProduct): Promise<Product | null> {
    return withLock(async () => {
      const doc = await readDoc();
      const index = doc.products.findIndex((p) => p.id === id);
      if (index === -1) return null;

      const current = doc.products[index];
      const updated: Product = {
        ...current,
        slug: makeSlug(doc, input.name, id),
        name: input.name,
        category: input.category,
        description: input.description,
        mainImage: input.mainImage,
        specs: input.specs,
        sections: input.sections,
        sites: input.sites,
        updatedAt: new Date().toISOString(),
      };

      doc.products[index] = updated;
      await writeDoc(doc);
      return updated;
    });
  },

  async deleteProduct(id: string): Promise<boolean> {
    return withLock(async () => {
      const doc = await readDoc();
      const before = doc.products.length;
      doc.products = doc.products.filter((p) => p.id !== id);
      if (doc.products.length === before) return false;
      await writeDoc(doc);
      return true;
    });
  },

  async listProducts(site?: SiteSlug): Promise<Product[]> {
    const doc = await readDoc();
    // Newest first, matching the lead store's ordering.
    const products = [...doc.products].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
    if (!site) return products;
    return products.filter((p) => p.sites.includes(site));
  },

  async getProduct(id: string): Promise<Product | null> {
    const doc = await readDoc();
    return doc.products.find((p) => p.id === id) ?? null;
  },
};
