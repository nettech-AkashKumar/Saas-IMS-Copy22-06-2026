import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  createReminderTemplate,
  getReminderTemplateById,
  updateReminderTemplate,
} from "../../../services/adminApi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
// import "./SuperAdminDashboard.css";

const formatFileSize = (size = 0) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const CreateReminder = ({ onBack, onCreated, templateForEdit }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [imageSourceType, setImageSourceType] = useState("none");
  const [croppedImage, setCroppedImage] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [dragActive, setDragActive] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [selectedImageSize, setSelectedImageSize] = useState(0);
  const fileInputRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { templateId } = useParams();
  const routeTemplate = location.state?.template;
  const [editingTemplate, setEditingTemplate] = useState(
    templateForEdit || routeTemplate || null,
  );
  const isEditMode = Boolean(editingTemplate && editingTemplate._id);

  const loadTemplateById = async (id) => {
    try {
      const data = await getReminderTemplateById(id);
      if (data?.template) {
        setEditingTemplate(data.template);
      }
    } catch (err) {
      console.error("Failed to load template for edit", err);
      toast.error(err.message || "Failed to load template for edit");
    }
  };

  useEffect(() => {
    if (templateForEdit) {
      setEditingTemplate(templateForEdit);
      return;
    }

    if (routeTemplate) {
      setEditingTemplate(routeTemplate);
      return;
    }

    if (templateId) {
      loadTemplateById(templateId);
      return;
    }

    setEditingTemplate(null);
  }, [templateForEdit, routeTemplate, templateId]);

  useEffect(() => {
    if (!editingTemplate) {
      return;
    }

    setTitle(editingTemplate.title || "");
    setDescription(editingTemplate.description || "");
    setImageDataUrl(editingTemplate.image || "");
    setImageSourceType(editingTemplate.image ? "remote" : "none");
    setCroppedImage("");
    setCrop({ x: 0, y: 0, width: 100, height: 100 });
    setSelectedImageSize(0);
  }, [editingTemplate]);

  const handleImageFile = (file) => {
    if (!file || !file.type.startsWith("image/")) {
      toast.warning("Please upload a valid image file.");
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.warning("Image size must be 10MB or less.");
      return;
    }

    setSelectedImageSize(file.size);
    const reader = new FileReader();
    reader.onload = () => {
      setImageDataUrl(reader.result);
      setImageSourceType("file");
      setCroppedImage("");
      setCrop({ x: 0, y: 0, width: 100, height: 100 });
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    handleImageFile(file);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    handleImageFile(file);
  };

  useEffect(() => {
    if (!imageDataUrl) {
      setImageDimensions({ width: 0, height: 0 });
      setCroppedImage("");
      return;
    }

    const image = new Image();
    if (imageSourceType === "remote") {
      image.crossOrigin = "anonymous";
    }
    image.onload = () => {
      setImageDimensions({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };
    image.onerror = () => {
      setImageDimensions({ width: 0, height: 0 });
    };
    image.src = imageDataUrl;
  }, [imageDataUrl, imageSourceType]);

  useEffect(() => {
    if (!imageDataUrl || !imageDimensions.width || imageSourceType !== "file")
      return;

    const image = new Image();
    image.onload = () => {
      const sx = Math.round((crop.x / 100) * image.naturalWidth);
      const sy = Math.round((crop.y / 100) * image.naturalHeight);
      const sw = Math.round((crop.width / 100) * image.naturalWidth);
      const sh = Math.round((crop.height / 100) * image.naturalHeight);

      const canvas = document.createElement("canvas");
      canvas.width = sw;
      canvas.height = sh;
      const context = canvas.getContext("2d");
      if (context) {
        context.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);
        setCroppedImage(canvas.toDataURL("image/jpeg", 0.92));
      }
    };
    image.src = imageDataUrl;
  }, [crop, imageDataUrl, imageDimensions.width, imageSourceType]);

  const previewImage = croppedImage || imageDataUrl;

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.warning("Title and description are required");
      return;
    }

    try {
      setSavingTemplate(true);
      const imageToSave = previewImage || "";

      if (isEditMode && editingTemplate?._id) {
        await updateReminderTemplate(editingTemplate._id, {
          title,
          image: imageToSave,
          description,
        });
        toast.success("Reminder template updated");
      } else {
        await createReminderTemplate({
          title,
          image: imageToSave,
          description,
        });
        toast.success("Reminder template created");
      }

      setTitle("");
      setDescription("");
      setImageDataUrl("");
      setCroppedImage("");
      setSelectedImageSize(0);
      setEditingTemplate(null);
      if (typeof onCreated === "function") {
        onCreated();
      } else {
        navigate("/admin/dashboard/reminder");
      }
    } catch (err) {
      toast.error(err.message || "Failed to save template");
    } finally {
      setSavingTemplate(false);
    }
  };

  const previewContent = useMemo(
    () => ({
      title: title.trim() || "Template title will show here",
      description:
        description.trim() ||
        "The email preview will show the description and image here.",
      image: previewImage,
    }),
    [title, description, previewImage],
  );

  return (
    <section className="sa-panel sa-reminder-template-panel">
      <ToastContainer position="top-right" autoClose={2200} pauseOnHover />

      <div className="sa-panel__header sa-table-panel__header">
        <div>
          <p className="sa-eyebrow">
            {isEditMode ? "Edit Reminder" : "Create Reminder"}
          </p>
          <h3>
            {isEditMode
              ? "Update reminder template"
              : "Create reminder template"}
          </h3>
        </div>
        <button
          type="button"
          className="sa-btn sa-btn--secondary"
          onClick={() => {
            if (typeof onBack === "function") {
              onBack();
            } else {
              navigate("/admin/dashboard/reminder");
            }
          }}
        >
          Back to Reminder Center
        </button>
      </div>

      <div className="sa-reminder-template-layout">
        <form className="sa-reminder-form" onSubmit={handleCreateTemplate}>
          <div className="sa-reminder-form__stack">
            <input
              type="text"
              placeholder="Template title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <textarea
              rows={5}
              placeholder="Template description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="sa-image-upload-section">
            <label className="sa-form-label">
              Optional image upload (max 10MB)
            </label>
            <div
              className={`sa-image-dropzone ${dragActive ? "is-active" : ""}`}
              onDragOver={handleDragOver}
              onDragEnter={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                hidden
              />
              {previewImage ? (
                <img
                  src={previewImage}
                  alt="Selected preview"
                  className="sa-image-dropzone__preview"
                />
              ) : (
                <div>
                  <strong>Drag & drop image here</strong>
                  <p>or click to upload</p>
                </div>
              )}
            </div>
            <div className="sa-image-size-note">
              <span>
                {selectedImageSize
                  ? `Selected image size: ${formatFileSize(selectedImageSize)}`
                  : "Max upload size: 10MB"}
              </span>
            </div>
          </div>

          {imageDataUrl && imageSourceType === "file" ? (
            <div className="sa-crop-panel">
              <div className="sa-crop-panel__row">
                <label>
                  Crop left
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={crop.x}
                    onChange={(e) =>
                      setCrop((prev) => ({
                        ...prev,
                        x: Number(e.target.value),
                      }))
                    }
                  />
                </label>
                <label>
                  Crop top
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={crop.y}
                    onChange={(e) =>
                      setCrop((prev) => ({
                        ...prev,
                        y: Number(e.target.value),
                      }))
                    }
                  />
                </label>
              </div>
              <div className="sa-crop-panel__row">
                <label>
                  Width
                  <input
                    type="range"
                    min="20"
                    max="100"
                    value={crop.width}
                    onChange={(e) =>
                      setCrop((prev) => ({
                        ...prev,
                        width: Math.min(100 - prev.x, Number(e.target.value)),
                      }))
                    }
                  />
                </label>
                <label>
                  Height
                  <input
                    type="range"
                    min="20"
                    max="100"
                    value={crop.height}
                    onChange={(e) =>
                      setCrop((prev) => ({
                        ...prev,
                        height: Math.min(100 - prev.y, Number(e.target.value)),
                      }))
                    }
                  />
                </label>
              </div>
            </div>
          ) : null}

          <button
            type="submit"
            className="sa-btn sa-btn--primary"
            disabled={savingTemplate}
          >
            {savingTemplate
              ? isEditMode
                ? "Updating..."
                : "Creating..."
              : isEditMode
                ? "Update Template"
                : "Create Template"}
          </button>
        </form>

        <div className="sa-reminder-preview-card">
          <div className="sa-reminder-preview-card__header">
            <p className="sa-eyebrow">Email preview</p>
            <h4>How the template will appear in the reminder email</h4>
          </div>
          <div className="sa-reminder-preview-card__body">
            <div className="sa-reminder-preview-mobile">
              <div className="sa-reminder-preview-mobile__screen">
                {previewContent.image ? (
                  <img
                    src={previewContent.image}
                    alt="Preview"
                    className="sa-reminder-preview-image"
                  />
                ) : (
                  <div className="sa-reminder-preview-fallback">
                    No image uploaded yet
                  </div>
                )}
                <div className="sa-reminder-preview-mobile__content">
                  <strong>{previewContent.title}</strong>
                  <p>{previewContent.description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CreateReminder;
