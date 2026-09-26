"use client";

import { useEffect, useRef, useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import { saveProductAction, type ProductFormState } from "../product-actions";
import { SITES, type SiteSlug } from "@/lib/sites";
import type { Product } from "@/lib/products/types";

/**
 * The product editor. Client-side because the form is dynamic: spec rows and
 * content sections are added and removed before submit, and each section
 * previews its image and its left/right placement live. Everything still
 * submits as one normal FormData POST to a Server Action.
 */

type SpecRow = { key: string; label: string; value: string };

type SectionRow = {
  key: string;
  id: string;
  title: string;
  body: string;
  imageUrl: string;
  imageSide: "left" | "right";
  /** Data URI of a picked file, so the admin sees what will be stored. */
  preview: string | null;
};

let counter = 0;
function nextKey(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}

const IDLE: ProductFormState = { status: "idle", message: "", productId: null };

function toSpecRows(product: Product | null): SpecRow[] {
  if (!product) return [{ key: nextKey("spec"), label: "", value: "" }];
  if (product.specs.length === 0) return [{ key: nextKey("spec"), label: "", value: "" }];
  return product.specs.map((spec) => ({ key: nextKey("spec"), label: spec.label, value: spec.value }));
}

function toSectionRows(product: Product | null): SectionRow[] {
  if (!product || product.sections.length === 0) {
    return [
      {
        key: nextKey("sec"),
        id: "",
        title: "",
        body: "",
        imageUrl: "",
        imageSide: "left",
        preview: null,
      },
    ];
  }
  return product.sections.map((section) => ({
    key: nextKey("sec"),
    id: section.id,
    title: section.title,
    body: section.body,
    imageUrl: section.imageUrl && !section.imageUrl.startsWith("data:") ? section.imageUrl : "",
    imageSide: section.imageSide,
    preview: section.imageUrl?.startsWith("data:") ? section.imageUrl : null,
  }));
}

function ImagePreview({ src }: { src: string | null }) {
  if (!src) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- data URIs and arbitrary host URLs
    <img className="ad-prod__thumb" src={src} alt="" />
  );
}

export default function ProductForm({ product }: { product: Product | null }) {
  const [state, formAction, pending] = useActionState(saveProductAction, IDLE);
  const router = useRouter();

  const [specs, setSpecs] = useState<SpecRow[]>(() => toSpecRows(product));
  const [sections, setSections] = useState<SectionRow[]>(() => toSectionRows(product));
  const [selectedSites, setSelectedSites] = useState<Set<SiteSlug>>(
    () => new Set(product?.sites ?? []),
  );
  const [mainPreview, setMainPreview] = useState<string | null>(
    product?.mainImage?.startsWith("data:") ? product.mainImage : null,
  );

  const createdRef = useRef(false);
  useEffect(() => {
    // After a create, move to the edit URL so further saves are updates.
    if (state.status === "saved" && state.productId && !createdRef.current && !product) {
      createdRef.current = true;
      router.replace(`/admin/products/${state.productId}`);
    }
  }, [state, product, router]);

  function toggleSite(site: SiteSlug) {
    setSelectedSites((prev) => {
      const next = new Set(prev);
      if (next.has(site)) next.delete(site);
      else next.add(site);
      return next;
    });
  }

  function pickImage(file: File | undefined, apply: (dataUri: string | null) => void) {
    if (!file) {
      apply(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => apply(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  }

  /* ---- spec rows ---- */
  function updateSpec(key: string, patch: Partial<SpecRow>) {
    setSpecs((rows) => rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  /* ---- section rows ---- */
  function updateSection(key: string, patch: Partial<SectionRow>) {
    setSections((rows) => rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  return (
    <form action={formAction} className="ad-form ad-prod-form">
      <input type="hidden" name="id" value={product?.id ?? ""} />

      {state.status === "error" && (
        <div className="ad-banner ad-banner--danger" role="alert">
          <span className="ad-banner__icon" aria-hidden="true">⛔</span>
          <div>{state.message}</div>
        </div>
      )}
      {state.status === "saved" && (
        <div className="ad-banner" role="status">
          <span className="ad-banner__icon" aria-hidden="true">✅</span>
          <div>{state.message}</div>
        </div>
      )}

      {/* ---- basics ---- */}
      <div className="ad-panel">
        <div className="ad-panel__head">
          <h2 className="ad-panel__title">Product basics</h2>
        </div>
        <div className="ad-panel__body ad-prod-grid">
          <label className="ad-field">
            <span>Product name *</span>
            <input className="ad-input" name="name" defaultValue={product?.name ?? ""} required maxLength={140} />
          </label>
          <label className="ad-field">
            <span>Category / group</span>
            <input
              className="ad-input"
              name="category"
              defaultValue={product?.category ?? ""}
              maxLength={80}
              placeholder="e.g. Signal Heads, Inverters"
            />
          </label>
          <label className="ad-field ad-field--wide">
            <span>Description *</span>
            <textarea
              className="ad-input"
              name="description"
              rows={4}
              required
              maxLength={4000}
              defaultValue={product?.description ?? ""}
              placeholder="What it is, what it does, who it is for."
            />
          </label>

          <div className="ad-field ad-field--wide">
            <span>Main product image — upload a file or paste an image URL</span>
            <div className="ad-prod-imgrow">
              <input
                type="file"
                name="mainImageFile"
                accept="image/*"
                className="ad-input"
                onChange={(event) => pickImage(event.target.files?.[0], setMainPreview)}
              />
              <input
                className="ad-input"
                name="mainImageUrl"
                defaultValue={product?.mainImage && !product.mainImage.startsWith("data:") ? product.mainImage : ""}
                placeholder="https://…"
              />
            </div>
            <ImagePreview src={mainPreview} />
          </div>

          <div className="ad-field ad-field--wide">
            <span>Show this product on *</span>
            <div className="ad-prod-sites">
              {SITES.map((site) => (
                <label key={site.slug} className="ad-prod-site">
                  <input
                    type="checkbox"
                    name="sites"
                    value={site.slug}
                    checked={selectedSites.has(site.slug)}
                    onChange={() => toggleSite(site.slug)}
                  />
                  <span>{site.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ---- specifications ---- */}
      <div className="ad-panel">
        <div className="ad-panel__head">
          <h2 className="ad-panel__title">Measurements / specifications</h2>
          <p className="ad-panel__hint">Rendered as a two-column table on the product page. Leave both empty to skip a row.</p>
        </div>
        <div className="ad-panel__body">
          {specs.map((row) => (
            <div key={row.key} className="ad-prod-specrow">
              <input
                className="ad-input"
                name="specLabel"
                value={row.label}
                maxLength={80}
                placeholder="Label — e.g. Lens size"
                onChange={(event) => updateSpec(row.key, { label: event.target.value })}
              />
              <input
                className="ad-input"
                name="specValue"
                value={row.value}
                maxLength={200}
                placeholder="Value — e.g. 200 mm"
                onChange={(event) => updateSpec(row.key, { value: event.target.value })}
              />
              <button
                type="button"
                className="ad-btn ad-btn--sm"
                onClick={() => setSpecs((rows) => rows.filter((r) => r.key !== row.key))}
                aria-label="Remove specification"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            className="ad-btn ad-btn--sm"
            onClick={() => setSpecs((rows) => [...rows, { key: nextKey("spec"), label: "", value: "" }])}
          >
            + Add specification
          </button>
        </div>
      </div>

      {/* ---- content sections ---- */}
      <div className="ad-panel">
        <div className="ad-panel__head">
          <h2 className="ad-panel__title">Content sections</h2>
          <p className="ad-panel__hint">
            Each section gets its own image. Choose the side the image sits on — text fills the
            other side — so every product can have a different layout.
          </p>
        </div>
        <div className="ad-panel__body">
          {sections.map((section, index) => (
            <div key={section.key} className="ad-prod-section">
              <div className="ad-prod-section__head">
                <strong>Section {index + 1}</strong>
                <button
                  type="button"
                  className="ad-btn ad-btn--sm"
                  onClick={() => setSections((rows) => rows.filter((r) => r.key !== section.key))}
                >
                  Remove
                </button>
              </div>
              <input type="hidden" name="sectionId" value={section.id} />

              <label className="ad-field">
                <span>Heading</span>
                <input
                  className="ad-input"
                  name="sectionTitle"
                  value={section.title}
                  maxLength={140}
                  placeholder="e.g. Key features"
                  onChange={(event) => updateSection(section.key, { title: event.target.value })}
                />
              </label>
              <label className="ad-field">
                <span>Content</span>
                <textarea
                  className="ad-input"
                  name="sectionBody"
                  rows={4}
                  maxLength={6000}
                  value={section.body}
                  placeholder="Body text for this section. Line breaks are kept."
                  onChange={(event) => updateSection(section.key, { body: event.target.value })}
                />
              </label>

              <div className="ad-prod-imgrow">
                <label className="ad-field">
                  <span>Section image — file</span>
                  <input
                    type="file"
                    name="sectionImageFile"
                    accept="image/*"
                    className="ad-input"
                    onChange={(event) =>
                      pickImage(event.target.files?.[0], (uri) =>
                        updateSection(section.key, { preview: uri }),
                      )
                    }
                  />
                </label>
                <label className="ad-field">
                  <span>…or image URL</span>
                  <input
                    className="ad-input"
                    name="sectionImageUrl"
                    value={section.imageUrl}
                    placeholder="https://…"
                    onChange={(event) => updateSection(section.key, { imageUrl: event.target.value })}
                  />
                </label>
                <label className="ad-field">
                  <span>Image position</span>
                  <select
                    className="ad-input"
                    name="sectionImageSide"
                    value={section.imageSide}
                    onChange={(event) =>
                      updateSection(section.key, {
                        imageSide: event.target.value === "right" ? "right" : "left",
                      })
                    }
                  >
                    <option value="left">Image on the left</option>
                    <option value="right">Image on the right</option>
                  </select>
                </label>
              </div>

              {/* Live preview of the chosen layout */}
              <div className={`ad-prod-preview${section.imageSide === "right" ? " ad-prod-preview--flip" : ""}`}>
                <div className="ad-prod-preview__img">
                  <ImagePreview src={section.preview || section.imageUrl || null} />
                  {!section.preview && !section.imageUrl && <span>No image</span>}
                </div>
                <div className="ad-prod-preview__txt">
                  <strong>{section.title || "Section heading"}</strong>
                  <p>{section.body || "Section text appears here."}</p>
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            className="ad-btn ad-btn--sm"
            onClick={() =>
              setSections((rows) => [
                ...rows,
                { key: nextKey("sec"), id: "", title: "", body: "", imageUrl: "", imageSide: "left", preview: null },
              ])
            }
          >
            + Add content section
          </button>
        </div>
      </div>

      <div className="ad-prod-actions">
        <button type="submit" className="ad-btn ad-btn--primary" disabled={pending}>
          {pending ? "Saving…" : product ? "Save changes" : "Add product"}
        </button>
      </div>
    </form>
  );
}
