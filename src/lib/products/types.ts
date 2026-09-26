import type { SiteSlug } from "@/lib/sites";

/**
 * The catalogue model shared by the admin form, the products API and the
 * landing-page modals.
 *
 * A product is deliberately free-form: apart from the name, description and
 * main image, everything else is a list the operator composes in the form —
 * spec rows and content sections. Each section carries its own image and the
 * side that image sits on, so no two product pages need the same layout.
 */

/** Which side of a content section the image occupies. Text fills the other. */
export const IMAGE_SIDES = ["left", "right"] as const;

export type ImageSide = (typeof IMAGE_SIDES)[number];

export function isImageSide(value: unknown): value is ImageSide {
  return value === "left" || value === "right";
}

export type ProductSpec = {
  label: string;
  value: string;
};

export type ProductSection = {
  id: string;
  title: string;
  body: string;
  /** URL or data URI; null when the section is text-only. */
  imageUrl: string | null;
  imageSide: ImageSide;
};

export type Product = {
  id: string;
  /** URL-safe unique handle, generated from the name. */
  slug: string;
  name: string;
  /** Grouping shown as a chip, e.g. "Signal Heads" or "Inverters". */
  category: string;
  description: string;
  /** URL or data URI of the hero image shown on cards and the modal top. */
  mainImage: string | null;
  specs: ProductSpec[];
  sections: ProductSection[];
  /** Landing pages this product appears on. */
  sites: SiteSlug[];
  createdAt: string;
  updatedAt: string;
};

/** Validated input handed to the store by the admin actions. */
export type NewProduct = {
  name: string;
  category: string;
  description: string;
  mainImage: string | null;
  specs: ProductSpec[];
  sections: ProductSection[];
  sites: SiteSlug[];
};

export type ProductStoreKind = "local";
