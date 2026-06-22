import React, { useMemo, useState } from "react";
import defaultHeroImage from "../../../../component/website/assets/images/hero.png";
import {
  uploadHeroImage,
  getHeroByTemplateType,
} from "../../../../services/adminApi";
import HeroDesign from "./HeroDesign";
// import "../../SuperAdminDashboard.css";
import "./HeroEditor.css";

const defaultFeatureRows = [
  {
    title: "afroz Control",
    description: "Manage purchases, sales, and stock from one dashboard.",
  },
  {
    title: "Real Time Updates",
    description: "Always know what is in stock with no surprises.",
  },
  {
    title: "Built In Automation",
    description: "From billing to reporting, everything runs smoothly.",
  },
  {
    title: "GST Compliant Invoicing",
    description: "Stay tax ready and audit safe.",
  },
];

const buildEmptyHero = () => ({
  name: "",
  title: "Track Stock.\nGenerate Bills.\nGrow Your Business.",
  subtitle:
    "A complete inventory and billing suite built to keep your store efficient, compliant, and growing.",
  features: [...defaultFeatureRows],
  primaryText: "Contact Us",
  primaryUrl: "#contact",
  secondaryText: "Get A Demo",
  secondaryUrl: "#demo",
  imageUrl: defaultHeroImage,
  imageUrls: [],
  imageAlt: "POS Software",
  templateType: "modern",
  isActive: false,
});

const slotLabels = {
  left: "Left card",
  phone: "Phone frame",
  right: "Right card",
};

const HeroEditor = ({ heroData, isCreating, onSave, onCancel, isSaving }) => {
  const [hero, setHero] = useState(
    heroData ? { ...buildEmptyHero(), ...heroData } : buildEmptyHero(),
  );
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState("left");
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewUrls, setPreviewUrls] = useState({});
  const [dragActive, setDragActive] = useState(false);
  const isFirstRenderRef = React.useRef(true);

  // Fetch hero data when templateType changes (not on initial mount)
  React.useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }

    const fetchHeroByTemplate = async () => {
      if (isCreating) return;

      try {
        const fetchedHero = await getHeroByTemplateType(hero.templateType);
        if (fetchedHero) {
          setHero((prev) => ({ ...prev, ...fetchedHero }));
          setPreviewUrl("");
          setPreviewUrls({});
          setSelectedFile(null);
        }
      } catch (error) {
        console.error("Failed to fetch hero by template type:", error);
      }
    };

    fetchHeroByTemplate();
  }, [hero.templateType, isCreating]);

  const slotImageMap = useMemo(() => {
    const slots = Array.isArray(hero.imageUrls)
      ? hero.imageUrls.reduce((acc, item) => {
          if (item?.slot && item?.url) {
            acc[item.slot] = item.url;
          }
          return acc;
        }, {})
      : {};

    return {
      left: previewUrls.left || slots.left || hero.imageUrl || defaultHeroImage,
      phone:
        previewUrls.phone || slots.phone || hero.imageUrl || defaultHeroImage,
      right:
        previewUrls.right || slots.right || hero.imageUrl || defaultHeroImage,
      classic: previewUrl || hero.imageUrl || slots.default || defaultHeroImage,
    };
  }, [hero.imageUrl, hero.imageUrls, previewUrls, previewUrl]);

  const displayImage =
    hero.templateType === "classic"
      ? slotImageMap.classic
      : slotImageMap[selectedSlot] || defaultHeroImage;

  const heroPreview = useMemo(() => {
    const previewHero = { ...hero };

    if (hero.templateType === "modern") {
      const activeSlots = Array.isArray(hero.imageUrls)
        ? [...hero.imageUrls]
        : [];
      const previewSlotItems = Object.entries(previewUrls)
        .filter(([, url]) => url)
        .map(([slot, url]) => ({ slot, url }));

      const mergedSlots = previewSlotItems.reduce((acc, slotItem) => {
        const existingIndex = acc.findIndex(
          (item) => item.slot === slotItem.slot,
        );
        if (existingIndex !== -1) {
          acc[existingIndex] = slotItem;
        } else {
          acc.push(slotItem);
        }
        return acc;
      }, activeSlots);

      previewHero.imageUrls = mergedSlots;
    } else {
      previewHero.imageUrl = previewUrl || hero.imageUrl || defaultHeroImage;
    }

    return previewHero;
  }, [hero, previewUrls, previewUrl]);

  const handleFieldChange = (field, value) => {
    setHero((prev) => ({ ...prev, [field]: value }));
  };

  const handleFeatureChange = (index, field, value) => {
    setHero((prev) => {
      const nextFeatures = [...prev.features];
      nextFeatures[index] = { ...nextFeatures[index], [field]: value };
      return { ...prev, features: nextFeatures };
    });
  };

  const loadSelectedFile = (file) => {
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);

    if (hero.templateType === "modern") {
      setPreviewUrls((prev) => ({
        ...prev,
        [selectedSlot]: objectUrl,
      }));
    } else {
      setPreviewUrl(objectUrl);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    loadSelectedFile(file);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => setDragActive(false);

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    loadSelectedFile(file);
  };

  const handleUploadImage = async () => {
    if (!selectedFile) {
      alert("Please choose an image first.");
      return;
    }

    if (isCreating) {
      alert("Save the hero section first, then upload the image.");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("heroImage", selectedFile, selectedFile.name);
      const slot = hero.templateType === "modern" ? selectedSlot : "default";
      formData.append("slot", slot);

      const heroId = hero._id || heroData?._id;
      if (!heroId) {
        alert("Save the hero section first, then upload the image.");
        return;
      }

      const data = await uploadHeroImage(heroId, formData);

      if (data?.hero) {
        setHero((prev) => ({ ...prev, ...data.hero }));
        setSelectedFile(null);
        setPreviewUrl("");
        setPreviewUrls({});
        alert("Hero image uploaded successfully.");
      } else {
        alert("Image upload completed but no image returned.");
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      const payload = {
        name: hero.title || "Hero Section",
        title: hero.title,
        subtitle: hero.subtitle,
        features: hero.features,
        primaryText: hero.primaryText,
        primaryUrl: hero.primaryUrl,
        secondaryText: hero.secondaryText,
        secondaryUrl: hero.secondaryUrl,
        imageUrl: hero.imageUrl,
        imageUrls: hero.imageUrls,
        imageAlt: hero.imageAlt,
        templateType: hero.templateType || "modern",
        isActive: hero.isActive,
      };

      await onSave(payload, hero._id || heroData?._id);
    } catch (err) {
      console.error(err);
      alert(err.message || "Could not save hero content");
    }
  };

  return (
    // <section className="heroedito-admin-wrapper">
    //   {/* LEFT SIDE FORM */}
    //   <div className="heroedito-admin-form">
    //     <div className="heroedito-card">
    //       <h3 className="heroedito-section-title">Hero Settings</h3>

    //       <div className="heroedito-checkbox">
    //         <input
    //           type="checkbox"
    //           checked={hero.isActive}
    //           onChange={(e) => handleFieldChange("isActive", e.target.checked)}
    //         />
    //         <span>Set as Active Hero (will be displayed on website)</span>
    //       </div>
    //     </div>

    //     <div className="heroedito-card">
    //       <h3 className="heroedito-section-title">Content</h3>

    //       <div className="heroedito-form-group">
    //         <label>Hero Title</label>
    //         <textarea
    //           rows={3}
    //           value={hero.title}
    //           onChange={(e) => handleFieldChange("title", e.target.value)}
    //         />
    //       </div>

    //       <div className="heroedito-form-group">
    //         <label>Hero Subtitle</label>
    //         <textarea
    //           rows={2}
    //           value={hero.subtitle}
    //           onChange={(e) => handleFieldChange("subtitle", e.target.value)}
    //         />
    //       </div>
    //     </div>

    //     <div className="heroedito-card">
    //       <h3 className="heroedito-section-title">CTA Buttons</h3>

    //       <div className="heroedito-grid-2">
    //         <div className="heroedito-form-group">
    //           <label>Primary Label</label>
    //           <input
    //             type="text"
    //             value={hero.primaryText}
    //             onChange={(e) =>
    //               handleFieldChange("primaryText", e.target.value)
    //             }
    //           />
    //         </div>

    //         <div className="heroedito-form-group">
    //           <label>Primary URL</label>
    //           <input
    //             type="text"
    //             value={hero.primaryUrl}
    //             onChange={(e) =>
    //               handleFieldChange("primaryUrl", e.target.value)
    //             }
    //           />
    //         </div>

    //         <div className="heroedito-form-group">
    //           <label>Secondary Label</label>
    //           <input
    //             type="text"
    //             value={hero.secondaryText}
    //             onChange={(e) =>
    //               handleFieldChange("secondaryText", e.target.value)
    //             }
    //           />
    //         </div>

    //         <div className="heroedito-form-group">
    //           <label>Secondary URL</label>
    //           <input
    //             type="text"
    //             value={hero.secondaryUrl}
    //             onChange={(e) =>
    //               handleFieldChange("secondaryUrl", e.target.value)
    //             }
    //           />
    //         </div>
    //       </div>
    //     </div>

    //     <div className="heroedito-card">
    //       <h3 className="heroedito-section-title">Hero Image</h3>

    //       <div
    //         className="heroedito-upload-box"
    //         onDragOver={handleDragOver}
    //         onDragLeave={handleDragLeave}
    //         onDrop={handleDrop}
    //       >
    //         <p>Drag & Drop image or click to upload</p>

    //         <input
    //           id="hero-image-upload"
    //           type="file"
    //           accept="image/*"
    //           onChange={handleFileSelect}
    //           hidden
    //         />

    //         <label htmlFor="hero-image-upload" className="heroedito-upload-btn">
    //           Select Image
    //         </label>
    //       </div>

    //       {displayImage && (
    //         <img
    //           src={displayImage}
    //           alt={hero.imageAlt || "Preview"}
    //           className="heroedito-image-preview"
    //         />
    //       )}

    //       <button
    //         type="button"
    //         onClick={handleUploadImage}
    //         disabled={uploading}
    //         className="heroedito-primary-btn"
    //       >
    //         {uploading ? "Uploading..." : "Upload Image"}
    //       </button>
    //     </div>

    //     <div className="heroedito-action-buttons">
    //       <button
    //         type="button"
    //         onClick={handleSave}
    //         disabled={isSaving}
    //         className="heroedito-primary-btn"
    //       >
    //         {isSaving
    //           ? "Saving..."
    //           : isCreating
    //             ? "Create Hero Section"
    //             : "Update Hero Section"}
    //       </button>

    //       <button
    //         type="button"
    //         onClick={onCancel}
    //         className="heroedito-outline-btn"
    //       >
    //         Cancel
    //       </button>
    //     </div>
    //   </div>

    //   {/* RIGHT SIDE LIVE PREVIEW */}
    //   <div className="heroedito-admin-preview">
    //     <div className="heroedito-preview-card">
    //       <h3>Live Preview</h3>
    //       <HeroDesign hero={heroPreview} displayImage={displayImage} />
    //     </div>
    //   </div>
    // </section>
    <section className="sa-panel sa-reminder-form">
      <div className="sa-form-group">
        <label className="sa-form-label">
          <input
            type="checkbox"
            checked={hero.isActive}
            onChange={(e) => handleFieldChange("isActive", e.target.checked)}
            style={{ marginRight: 8 }}
          />
          Set as Active Hero (will be displayed on website)
        </label>
      </div>

      <div className="sa-form-group">
        <label className="sa-form-label">Hero Title</label>
        <textarea
          value={hero.title}
          onChange={(e) => handleFieldChange("title", e.target.value)}
          rows={4}
        />
      </div>

      <div className="sa-form-group">
        <label className="sa-form-label">Hero Subtitle</label>
        <textarea
          value={hero.subtitle}
          onChange={(e) => handleFieldChange("subtitle", e.target.value)}
          rows={3}
        />
      </div>

      <div className="sa-form-group">
        <label className="sa-form-label">Primary CTA Label</label>
        <input
          type="text"
          value={hero.primaryText}
          onChange={(e) => handleFieldChange("primaryText", e.target.value)}
        />
      </div>

      <div className="sa-form-group">
        <label className="sa-form-label">Primary CTA URL</label>
        <input
          type="text"
          value={hero.primaryUrl}
          onChange={(e) => handleFieldChange("primaryUrl", e.target.value)}
        />
      </div>

      <div className="sa-form-group">
        <label className="sa-form-label">Secondary CTA Label</label>
        <input
          type="text"
          value={hero.secondaryText}
          onChange={(e) => handleFieldChange("secondaryText", e.target.value)}
        />
      </div>

      <div className="sa-form-group">
        <label className="sa-form-label">Secondary CTA URL</label>
        <input
          type="text"
          value={hero.secondaryUrl}
          onChange={(e) => handleFieldChange("secondaryUrl", e.target.value)}
        />
      </div>

      <div className="sa-form-group">
        <label className="sa-form-label">Hero Template</label>
        <select
          value={hero.templateType}
          onChange={(e) => handleFieldChange("templateType", e.target.value)}
          style={{
            width: "100%",
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
          }}
        >
          <option value="modern">Modern Layout</option>
          <option value="classic">Classic Layout</option>
        </select>
      </div>

      <div className="sa-form-group">
        <label className="sa-form-label">Hero Image Alt text</label>
        <input
          type="text"
          value={hero.imageAlt}
          onChange={(e) => handleFieldChange("imageAlt", e.target.value)}
        />
      </div>

      <div className="sa-form-group">
        <label className="sa-form-label">Feature cards</label>
        {hero.features.map((feature, index) => (
          <div key={index} className="sa-reminder-form__stack">
            <input
              type="text"
              placeholder={`Feature ${index + 1} title`}
              value={feature.title}
              onChange={(e) =>
                handleFeatureChange(index, "title", e.target.value)
              }
            />
            <textarea
              rows={2}
              placeholder={`Feature ${index + 1} description`}
              value={feature.description}
              onChange={(e) =>
                handleFeatureChange(index, "description", e.target.value)
              }
            />
          </div>
        ))}
      </div>

      {hero.templateType === "modern" ? (
        <div className="sa-form-group">
          <label className="sa-form-label">Modern layout image slots</label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 12,
              marginBottom: 12,
            }}
          >
            {Object.entries(slotLabels).map(([slot, label]) => (
              <div
                key={slot}
                style={{
                  border:
                    slot === selectedSlot
                      ? "2px solid #2563eb"
                      : "1px solid #d1d5db",
                  borderRadius: 12,
                  padding: 12,
                  textAlign: "center",
                  cursor: "pointer",
                }}
                onClick={() => setSelectedSlot(slot)}
              >
                <div
                  style={{
                    height: 140,
                    overflow: "hidden",
                    borderRadius: 12,
                    background: "#f8fafc",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 8,
                  }}
                >
                  <img
                    src={slotImageMap[slot]}
                    alt={label}
                    style={{ width: "100%", objectFit: "cover" }}
                  />
                </div>
                <div style={{ fontSize: 13, color: "#374151" }}>{label}</div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <label style={{ minWidth: 120, fontWeight: 600 }}>
              Upload slot:
            </label>
            <select
              value={selectedSlot}
              onChange={(e) => setSelectedSlot(e.target.value)}
              style={{
                flex: 1,
                minWidth: 180,
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
              }}
            >
              <option value="left">Left card</option>
              <option value="phone">Phone frame</option>
              <option value="right">Right card</option>
            </select>
          </div>
        </div>
      ) : null}

      <div className="sa-form-group sa-image-upload-section">
        <label className="sa-form-label">
          {hero.templateType === "classic"
            ? "Upload hero image"
            : "Upload selected slot image"}
        </label>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            border: dragActive ? "2px dashed #2563eb" : "2px dashed #d1d5db",
            borderRadius: 18,
            padding: 18,
            background: dragActive ? "#eff6ff" : "#ffffff",
            textAlign: "center",
            marginBottom: 16,
          }}
        >
          <p style={{ margin: 0, color: "#334155" }}>
            Drag & drop image here, or click to select a file.
          </p>
          <input
            id="hero-image-upload"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />
          <label
            htmlFor="hero-image-upload"
            style={{
              display: "inline-block",
              marginTop: 12,
              padding: "10px 16px",
              borderRadius: 12,
              background: "#2563eb",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Select image
          </label>
        </div>
        <div>
          <img
            src={displayImage}
            alt={hero.imageAlt || "Hero preview"}
            style={{
              width: "100%",
              maxWidth: 420,
              borderRadius: 18,
              marginBottom: 12,
            }}
          />
        </div>
        <button
          type="button"
          onClick={handleUploadImage}
          disabled={uploading}
          style={{
            padding: "12px 18px",
            borderRadius: 12,
            border: "none",
            background: "#2f7dff",
            color: "#fff",
            cursor: uploading ? "not-allowed" : "pointer",
          }}
        >
          {uploading ? "Uploading..." : "Upload Image"}
        </button>
      </div>
      <div className="sa-form-group" style={{ marginBottom: 24 }}>
        <label className="sa-form-label">Live Hero Preview</label>
        <HeroDesign hero={heroPreview} displayImage={displayImage} />
      </div>
      <div className="sa-form-group">
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            style={{
              padding: "12px 18px",
              borderRadius: 12,
              border: "none",
              background: "#2f7dff",
              color: "#fff",
              cursor: isSaving ? "not-allowed" : "pointer",
              opacity: isSaving ? 0.6 : 1,
            }}
          >
            {isSaving
              ? "Saving..."
              : isCreating
                ? "Create Hero Section"
                : "Update Hero Section"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            style={{
              padding: "12px 18px",
              borderRadius: 12,
              border: "1px solid #6c757d",
              background: "transparent",
              color: "#6c757d",
              cursor: isSaving ? "not-allowed" : "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroEditor;
