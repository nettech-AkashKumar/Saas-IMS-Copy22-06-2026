/**
 * variantTrackingService.js
 * 
 * UPDATED: Now returns data for creating a NEW PRODUCT instead of new variant
 * when tracking changes are detected.
 */

const normalize = (v) => String(v ?? "").trim().toLowerCase();

const normalizeDate = (d) => {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

/**
 * Builds a comparable "fingerprint" of the tracking-relevant fields
 */
const buildTrackingFingerprint = (source = {}) => {
  return {
    lotNumber: normalize(source.lotNumber),
    expiryDate: normalizeDate(source.expiryDate),
    manufacturingDate: normalizeDate(source.manufacturingDate),
    warrantyType: normalize(source.warrantyType),
    warrantyPeriod: normalize(source.warrantyPeriod),
    color: normalize(source.color),
    size: normalize(source.size),
    modelNo: normalize(source.modelNo),
  };
};

const fingerprintsMatch = (a, b) => {
  const keys = [
    "lotNumber",
    "expiryDate",
    "manufacturingDate",
    "warrantyType",
    "warrantyPeriod",
    "color",
    "size",
    "modelNo",
  ];
  return keys.every((k) => a[k] === b[k]);
};

/**
 * Finds the reference variant on the product
 */
const findReferenceVariant = (product, incoming = {}) => {
  if (!product?.variants?.length) return null;

  if (incoming.variantId) {
    const byId = product.variants.find(
      (v) => String(v._id) === String(incoming.variantId)
    );
    if (byId) return byId;
  }

  if (incoming.lotNumber) {
    const byLot = product.variants.find(
      (v) => normalize(v.lotNumber) === normalize(incoming.lotNumber)
    );
    if (byLot) return byLot;
  }

  const hasColor = Boolean(normalize(incoming.color));
  const hasSize = Boolean(normalize(incoming.size));
  if (hasColor || hasSize) {
    const byAttrs = product.variants.find((v) => {
      const colorOk = hasColor
        ? normalize(v.color) === normalize(incoming.color)
        : true;
      const sizeOk = hasSize ? normalize(v.size) === normalize(incoming.size) : true;
      return colorOk && sizeOk;
    });
    if (byAttrs) return byAttrs;
  }

  return product.variants[0] || null;
};

/**
 * UPDATED: Now returns data for creating a NEW PRODUCT
 * instead of creating a new variant.
 */
const resolveVariantForTracking = (product, incoming = {}) => {
  if (!product) {
    throw new Error("resolveVariantForTracking: product is required");
  }

  const referenceVariant = findReferenceVariant(product, incoming);

  // No variants exist yet -> will create new product
  if (!referenceVariant) {
    const newProductData = buildNewProductData(product, incoming);
    return { 
      action: "create_new_product", 
      variant: null, 
      isNew: true, 
      changedFields: ["__no_existing_variant__"],
      newProductData: newProductData,
    };
  }

  const existingFingerprint = buildTrackingFingerprint(referenceVariant);
  const incomingFingerprint = buildTrackingFingerprint(incoming);

  // Check if price changed
  const priceChanged = Number(incoming.receivingPrice) !== Number(referenceVariant.purchasePrice);

  // Check if tracking fields match
  const trackingMatch = fingerprintsMatch(existingFingerprint, incomingFingerprint);

  // If tracking matches AND price hasn't changed -> reuse
  if (trackingMatch && !priceChanged) {
    return { 
      action: "reuse", 
      variant: referenceVariant, 
      isNew: false, 
      changedFields: [] 
    };
  }

  // Something changed -> create NEW PRODUCT
  const changedFields = [];
  if (!trackingMatch) {
    const trackingKeys = [
      "lotNumber",
      "expiryDate",
      "manufacturingDate",
      "warrantyType",
      "warrantyPeriod",
      "color",
      "size",
      "modelNo",
    ];
    trackingKeys.forEach((k) => {
      if (existingFingerprint[k] !== incomingFingerprint[k]) {
        changedFields.push(k);
      }
    });
  }
  if (priceChanged) {
    changedFields.push("receivingPrice");
  }

  const newProductData = buildNewProductData(product, incoming, referenceVariant);
  
  return { 
    action: "create_new_product", 
    variant: null, 
    isNew: true, 
    changedFields,
    newProductData: newProductData,
  };
};

/**
 * Builds data for creating a NEW PRODUCT
 * CLEAN: Product name only = base name + (color/size) if they exist
 */
const buildNewProductData = (product, incoming, referenceVariant = null) => {
  // Determine base product name
  const baseName = product.productName || "Product";
  
  // Create clean product name - only base name + color/size
  let newProductName = baseName;
  
  const color = incoming.color || referenceVariant?.color || "";
  const size = incoming.size || referenceVariant?.size || "";
  
  if (color && size) {
    newProductName = `${baseName} (${color} / ${size})`;
  } else if (color) {
    newProductName = `${baseName} (${color})`;
  } else if (size) {
    newProductName = `${baseName} (${size})`;
  }

  // Build product data
  return {
    productName: newProductName,
    description: product.description || "",
    category: product.category,
    subcategory: product.subcategory,
    brand: product.brand,
    hsn: product.hsn,
    lot_pricing: true,
    productType: "Single",
    checkedExpiry: Boolean(incoming.expiryDate),
    checkedSerial: Boolean(incoming.serialNumbers?.length > 0),
    checkedBatch: Boolean(incoming.lotNumber),
    checkedWarranty: Boolean(incoming.warrantyType),
    variants: [{
      lotNumber: incoming.lotNumber || "",
      modelNo: incoming.modelNo || "",
      serialNumbers: incoming.serialNumbers || [],
      purchasePrice: incoming.receivingPrice || incoming.purchasePrice || 0,
      purchasePriceTaxType: incoming.purchasePriceTaxType || "withoutgst",
      tax: incoming.tax || "",
      mrp: incoming.mrp || 0,
      sellingPrice: incoming.sellingPrice || 0,
      gst: incoming.purchasePriceTaxType === "withgst",
      size: incoming.size || "",
      color: incoming.color || "",
      openingQuantity: incoming.receivingQty || 0,
      stockQuantity: incoming.receivingQty || 0,
      minStockToMaintain: incoming.minStockToMaintain || 0,
      discountAmount: incoming.discountAmount || 0,
      discountType: incoming.discountType || "Fixed",
      manufacturingDate: incoming.manufacturingDate || null,
      expiryDate: incoming.expiryDate || null,
      unit: incoming.unit || "",
      // Warranty fields
      warrantyType: incoming.warrantyType || "",
      warrantyPeriod: incoming.warrantyPeriod || null,
      coverageScope: incoming.coverageScope || "",
      serviceMode: incoming.serviceMode || "",
      maxClaimsAllowed: incoming.maxClaimsAllowed || null,
      inspectionRequired: Boolean(incoming.inspectionRequired),
      warrantyStartsFrom: incoming.warrantyStartsFrom || "",
      linkedto: incoming.linkedto || "",
      extensionPeriod: incoming.extensionPeriod || "",
      coverageType: incoming.coverageType || "",
      extendedWarrantyPrice: incoming.extendedWarrantyPrice || null,
      lifetimeDefination: incoming.lifetimeDefination || "",
      coverageOf: incoming.coverageOf || "",
      whatNotCovered: incoming.whatNotCovered || "",
      maxClaims: incoming.maxClaims || null,
      replacementOnceOnly: Boolean(incoming.replacementOnceOnly),
    }]
  };
};

/**
 * Increments stock on a variant (unchanged)
 */
const incrementVariantStock = (variant, qty) => {
  const amount = Number(qty) || 0;
  variant.stockQuantity = Math.max(0, (variant.stockQuantity || 0) + amount);
};

module.exports = {
  resolveVariantForTracking,
  incrementVariantStock,
  buildTrackingFingerprint,
  fingerprintsMatch,
  findReferenceVariant,
};


// this will for creating new variant which we will use in future
// /**
//  * variantTrackingService.js
//  *
//  * Reusable backend logic for GRN / Purchase tracking ("Manage Tracking" popup).
//  *
//  * Responsibility:
//  *  - Given a Product document and the tracking details entered by the user
//  *    for a single GRN/Purchase line item (lot no, expiry, warranty, color, size),
//  *    decide whether this matches an EXISTING variant on that product, or
//  *    whether the details have changed enough that a NEW variant must be created.
//  *
//  * Rule (per product owner's decision):
//  *   ANY change to lotNumber, expiryDate, manufacturingDate, warrantyType,
//  *   warrantyPeriod, color, or size relative to the variant being referenced
//  *   means: do NOT mutate that variant's history. Create a brand-new variant
//  *   on the SAME product instead, and stock goes to the new variant.
//  *
//  * This mirrors the variant-matching pattern already used in ProductCreate.jsx
//  * (getVariantForSelection) but extended with batch/expiry/warranty fields,
//  * since those are exactly the fields GRN/Purchase tracking can change.
//  */

// const normalize = (v) => String(v ?? "").trim().toLowerCase();

// const normalizeDate = (d) => {
//   if (!d) return "";
//   const date = new Date(d);
//   if (isNaN(date.getTime())) return "";
//   // Compare by calendar day only (ignore time-of-day noise)
//   return date.toISOString().slice(0, 10);
// };

// /**
//  * Builds a comparable "fingerprint" of the tracking-relevant fields for a variant
//  * or for the incoming GRN/Purchase line tracking data. Both sides must be passed
//  * through this same function so the comparison is apples-to-apples.
//  */
// const buildTrackingFingerprint = (source = {}) => {
//   return {
//     lotNumber: normalize(source.lotNumber),
//     expiryDate: normalizeDate(source.expiryDate),
//     manufacturingDate: normalizeDate(source.manufacturingDate),
//     warrantyType: normalize(source.warrantyType),
//     warrantyPeriod: normalize(source.warrantyPeriod),
//     color: normalize(source.color),
//     size: normalize(source.size),
//     modelNo: normalize(source.modelNo),
//   };
// };

// const fingerprintsMatch = (a, b) => {
//   const keys = [
//     "lotNumber",
//     "expiryDate",
//     "manufacturingDate",
//     "warrantyType",
//     "warrantyPeriod",
//     "color",
//     "size",
//     "modelNo",
//   ];
//   return keys.every((k) => a[k] === b[k]);
// };

// /**
//  * Finds the variant on `product` that the GRN/Purchase line item claims to be
//  * receiving against (by variantId if provided, else by best-effort match on
//  * color/size/lotNumber), so we have a baseline to diff against.
//  */
// const findReferenceVariant = (product, incoming = {}) => {
//   if (!product?.variants?.length) return null;

//   // 1) Exact variant id match (most reliable — UI should pass this when known)
//   if (incoming.variantId) {
//     const byId = product.variants.find(
//       (v) => String(v._id) === String(incoming.variantId)
//     );
//     if (byId) return byId;
//   }

//   // 2) Match by lotNumber (batch number is the natural key for tracked stock)
//   if (incoming.lotNumber) {
//     const byLot = product.variants.find(
//       (v) => normalize(v.lotNumber) === normalize(incoming.lotNumber)
//     );
//     if (byLot) return byLot;
//   }

//   // 3) Fallback: match by color + size (variant-mode products without lot tracking)
//   const hasColor = Boolean(normalize(incoming.color));
//   const hasSize = Boolean(normalize(incoming.size));
//   if (hasColor || hasSize) {
//     const byAttrs = product.variants.find((v) => {
//       const colorOk = hasColor
//         ? normalize(v.color) === normalize(incoming.color)
//         : true;
//       const sizeOk = hasSize ? normalize(v.size) === normalize(incoming.size) : true;
//       return colorOk && sizeOk;
//     });
//     if (byAttrs) return byAttrs;
//   }

//   // 4) Last resort: first variant (single-variant / non-tracked products)
//   return product.variants[0] || null;
// };

// /**
//  * Main entry point.
//  *
//  * @param {Document} product   - Mongoose Product document (must be a full doc, not lean, if you intend to .save() after mutating)
//  * @param {Object} incoming    - Tracking data entered in the GRN/Purchase "Manage Tracking" popup
//  *   {
//  *     variantId,        // optional - if user is explicitly receiving against a known variant
//  *     lotNumber,
//  *     modelNo,
//  *     expiryDate,
//  *     manufacturingDate,
//  *     warrantyType,
//  *     warrantyPeriod,
//  *     coverageScope, serviceMode, maxClaimsAllowed, inspectionRequired, warrantyStartsFrom,
//  *     linkedto, extensionPeriod, coverageType, extendedWarrantyPrice,
//  *     lifetimeDefination, coverageOf, whatNotCovered, maxClaims, replacementOnceOnly,
//  *     color, size,
//  *     serialNumbers,    // array of strings, only relevant when serial tracking is on
//  *     unit, purchasePrice, sellingPrice, mrp, tax, purchasePriceTaxType,
//  *     minStockToMaintain, discountAmount, discountType,
//  *   }
//  *
//  * @returns {{
//  *   action: "reuse" | "create",
//  *   variant: Object,          // the variant object to use going forward (existing or newly pushed)
//  *   isNew: boolean,
//  *   changedFields: string[],  // which tracking fields differed (empty if reused)
//  * }}
//  */
// const resolveVariantForTracking = (product, incoming = {}) => {
//   if (!product) {
//     throw new Error("resolveVariantForTracking: product is required");
//   }

//   const referenceVariant = findReferenceVariant(product, incoming);

//   // No variants exist yet at all -> must create the first one
//   if (!referenceVariant) {
//     const created = pushNewVariant(product, incoming);
//     return { action: "create", variant: created, isNew: true, changedFields: ["__no_existing_variant__"] };
//   }

//   const existingFingerprint = buildTrackingFingerprint(referenceVariant);
//   const incomingFingerprint = buildTrackingFingerprint(incoming);

//   if (fingerprintsMatch(existingFingerprint, incomingFingerprint)) {
//     return { action: "reuse", variant: referenceVariant, isNew: false, changedFields: [] };
//   }

//   // Something tracking-relevant changed -> diff for logging/audit, then fork a new variant
//   const changedFields = Object.keys(existingFingerprint).filter(
//     (k) => existingFingerprint[k] !== incomingFingerprint[k]
//   );

//   const created = pushNewVariant(product, incoming, referenceVariant);
//   return { action: "create", variant: created, isNew: true, changedFields };
// };

// /**
//  * Pushes a brand-new variant onto product.variants based on incoming tracking data,
//  * inheriting pricing/unit fields from the reference variant where the incoming
//  * payload didn't explicitly override them. Mutates `product` in place (caller must .save()).
//  */
// const pushNewVariant = (product, incoming = {}, referenceVariant = null) => {
//   const base = referenceVariant ? referenceVariant.toObject?.() ?? referenceVariant : {};

//   const newVariant = {
//     itemBarcode: incoming.itemBarcode || "", // caller should generate one if blank before save, see barcode helper in productControllers.js
//     lotNumber: incoming.lotNumber ?? base.lotNumber ?? "",
//     modelNo: incoming.modelNo ?? base.modelNo ?? "",
//     serialNumbers: Array.isArray(incoming.serialNumbers) ? incoming.serialNumbers : [],

//     purchasePrice: incoming.purchasePrice ?? base.purchasePrice ?? 0,
//     purchasePriceTaxType: incoming.purchasePriceTaxType ?? base.purchasePriceTaxType ?? "withoutgst",
//     tax: incoming.tax ?? base.tax ?? "",
//     mrp: incoming.mrp ?? base.mrp ?? 0,
//     sellingPrice: incoming.sellingPrice ?? base.sellingPrice ?? 0,
//     gst: incoming.purchasePriceTaxType ? incoming.purchasePriceTaxType === "withgst" : Boolean(base.gst),

//     size: incoming.size ?? base.size ?? "",
//     color: incoming.color ?? base.color ?? "",

//     openingQuantity: Number(incoming.receivingQty ?? incoming.openingQuantity ?? 0),
//     stockQuantity: Number(incoming.receivingQty ?? incoming.openingQuantity ?? 0),
//     minStockToMaintain: incoming.minStockToMaintain ?? base.minStockToMaintain ?? 0,
//     discountAmount: incoming.discountAmount ?? base.discountAmount ?? 0,
//     discountType: incoming.discountType ?? base.discountType ?? "Fixed",

//     manufacturingDate: incoming.manufacturingDate || null,
//     expiryDate: incoming.expiryDate || null,
//     unit: incoming.unit ?? base.unit ?? "",

//     // Warranty fields
//     warrantyType: incoming.warrantyType ?? "",
//     warrantyPeriod: incoming.warrantyPeriod ?? null,
//     coverageScope: incoming.coverageScope ?? "",
//     serviceMode: incoming.serviceMode ?? "",
//     maxClaimsAllowed: incoming.maxClaimsAllowed ?? null,
//     inspectionRequired: Boolean(incoming.inspectionRequired),
//     warrantyStartsFrom: incoming.warrantyStartsFrom ?? "",
//     linkedto: incoming.linkedto ?? "",
//     extensionPeriod: incoming.extensionPeriod ?? "",
//     coverageType: incoming.coverageType ?? "",
//     extendedWarrantyPrice: incoming.extendedWarrantyPrice ?? null,
//     lifetimeDefination: incoming.lifetimeDefination ?? "",
//     coverageOf: incoming.coverageOf ?? "",
//     whatNotCovered: incoming.whatNotCovered ?? "",
//     maxClaims: incoming.maxClaims ?? null,
//     replacementOnceOnly: Boolean(incoming.replacementOnceOnly),

//     images: [],
//   };

//   product.variants.push(newVariant);
//   // Return the just-pushed subdocument (last element) so caller has its real _id after push
//   return product.variants[product.variants.length - 1];
// };

// /**
//  * Convenience helper: increments stock on a variant that was "reused" (no tracking change).
//  * Use this on the "reuse" branch instead of pushNewVariant.
//  */
// const incrementVariantStock = (variant, qty) => {
//   const amount = Number(qty) || 0;
//   variant.stockQuantity = Math.max(0, (variant.stockQuantity || 0) + amount);
// };

// module.exports = {
//   resolveVariantForTracking,
//   incrementVariantStock,
//   buildTrackingFingerprint,
//   fingerprintsMatch,
//   findReferenceVariant,
// };
