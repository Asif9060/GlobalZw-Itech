import { randomUUID } from "node:crypto";
import { isSiteSlug, type SiteSlug } from "@/lib/sites";
import {
  isImageSide,
  type ImageSide,
  type NewProduct,
  type ProductSection,
  type ProductSpec,
} from "@/lib/products/types";

/**
 * Turns the admin form's FormData into a validated NewProduct.
 *
 * Image inputs accept either an uploaded file (converted to a data URI and
 * stored inline) or a plain URL typed into the paired text field. A file wins
 * over a URL when both are present.
 */

type ImageResult = { url: string | null; error: string | null };

const MAX_IMAGE_BYTES = 900 * 1024;
const IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "image/gif",
]);

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

async function readImage(file: unknown, urlValue: string, label: string): Promise<ImageResult> {
  if (file instanceof File && file.size > 0 && file.name) {
    if (!IMAGE_TYPES.has(file.type)) {
      return { url: null, error: `${label}: use a PNG, JPG, WebP, GIF or SVG image.` };
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return {
        url: null,
        error: `${label}: that image is ${(file.size / 1024 / 1024).toFixed(1)} MB — keep each image under 900 KB.`,
      };
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    return { url: `data:${file.type};base64,${buffer.toString("base64")}`, error: null };
  }

  const trimmed = urlValue.trim();
  if (trimmed) {
    if (!isHttpUrl(trimmed) && !trimmed.startsWith("data:image/")) {
      return { url: null, error: `${label}: that image address does not look like a URL.` };
    }
    return { url: trimmed.slice(0, 5000), error: null };
  }

  return { url: null, error: null };
}

function texts(formData: FormData, key: string): string[] {
  return formData.getAll(key).map((value) => String(value).trim());
}

export type ProductParseResult =
  | { ok: true; product: NewProduct }
  | { ok: false; message: string };

export async function parseProductForm(formData: FormData): Promise<ProductParseResult> {
  const name = String(formData.get("name") ?? "").trim().slice(0, 140);
  const category = String(formData.get("category") ?? "").trim().slice(0, 80);
  const description = String(formData.get("description") ?? "").trim().slice(0, 4000);

  if (!name) return { ok: false, message: "The product needs a name." };
  if (!description) return { ok: false, message: "Add a short product description." };

  const sites = texts(formData, "sites").filter(isSiteSlug) as SiteSlug[];
  if (sites.length === 0) {
    return { ok: false, message: "Pick at least one landing page for this product to appear on." };
  }

  const mainImage = await readImage(
    formData.get("mainImageFile"),
    String(formData.get("mainImageUrl") ?? ""),
    "Main image",
  );
  if (mainImage.error) return { ok: false, message: mainImage.error };

  /* ---- specs: parallel arrays of labels and values ---- */
  const specLabels = texts(formData, "specLabel");
  const specValues = texts(formData, "specValue");
  const specs: ProductSpec[] = [];
  for (let i = 0; i < Math.min(specLabels.length, specValues.length, 40); i += 1) {
    if (!specLabels[i] || !specValues[i]) continue;
    specs.push({ label: specLabels[i].slice(0, 80), value: specValues[i].slice(0, 200) });
  }

  /* ---- sections: parallel arrays, one image per section ---- */
  const sectionIds = texts(formData, "sectionId");
  const titles = texts(formData, "sectionTitle");
  const bodies = texts(formData, "sectionBody");
  const sides = texts(formData, "sectionImageSide");
  const sectionUrls = texts(formData, "sectionImageUrl");
  const sectionFiles = formData.getAll("sectionImageFile");

  const count = Math.min(sectionIds.length, titles.length, bodies.length, 20);
  const sections: ProductSection[] = [];

  for (let i = 0; i < count; i += 1) {
    const title = titles[i].slice(0, 140);
    const body = bodies[i].slice(0, 6000);
    if (!title && !body) continue;
    if (!title) return { ok: false, message: `Content section ${i + 1} needs a heading.` };

    const rawSide = sides[i];
    const side: ImageSide = isImageSide(rawSide) ? rawSide : "left";
    const image = await readImage(sectionFiles[i], sectionUrls[i] ?? "", `"${title}" image`);
    if (image.error) return { ok: false, message: image.error };

    sections.push({
      id: sectionIds[i] || randomUUID(),
      title,
      body,
      imageUrl: image.url,
      imageSide: side,
    });
  }

  return {
    ok: true,
    product: {
      name,
      category,
      description,
      mainImage: mainImage.url,
      specs,
      sections,
      sites,
    },
  };
}
