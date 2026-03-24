import { useEffect, useState } from "react";

export default function ProductForm({ categories, selectedCategory, draft, onChange, onSubmit, submitLabel = "Create Product" }) {
  const [errors, setErrors] = useState({});

  function handleFieldChange(field, value) {
    onChange({ ...draft, [field]: value });
  }

  function handleAttributeChange(key, value) {
    onChange({
      ...draft,
      attributes: {
        ...draft.attributes,
        [key]: value
      }
    });
  }

  function handleContentChange(key, value) {
    onChange({
      ...draft,
      content: {
        ...draft.content,
        [key]: value
      }
    });
  }

  function handleSubmit(event) {
    const nextErrors = {};

    if (!draft.categoryId) nextErrors.categoryId = "Category is required.";
    if (!draft.title.trim()) nextErrors.title = "Title is required.";
    if (!draft.sku.trim()) nextErrors.sku = "SKU is required.";
    if (!draft.brand.trim()) nextErrors.brand = "Brand is required.";
    if (!draft.price || Number(draft.price) <= 0) nextErrors.price = "Enter a valid price.";
    if (!draft.summary.trim()) nextErrors.summary = "Summary is required.";

    if (selectedCategory) {
      const missingAttribute = selectedCategory.attributeGroups
        .flatMap((group) => group.attributes)
        .find((attribute) => attribute.required && !draft.attributes[attribute.key]);

      if (missingAttribute) {
        nextErrors.attributes = `${missingAttribute.label} is required.`;
      }

      const missingContent = selectedCategory.contentModel.find((field) => {
        const value = draft.content[field.key];
        if (!field.required) return false;
        if (Array.isArray(value)) return value.length === 0;
        return !String(value || "").trim();
      });

      if (missingContent) {
        nextErrors.content = `${missingContent.label} is required.`;
      }
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      event.preventDefault();
      return;
    }

    onSubmit(event);
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <label className="stack compact">
        <select className={errors.categoryId ? "input-error" : ""} value={draft.categoryId} onChange={(event) => handleFieldChange("categoryId", event.target.value)}>
          <option value="">Select category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {errors.categoryId ? <span className="field-error">{errors.categoryId}</span> : null}
      </label>

      <label className="stack compact">
        <input className={errors.title ? "input-error" : ""} placeholder="Title" value={draft.title} onChange={(event) => handleFieldChange("title", event.target.value)} />
        {errors.title ? <span className="field-error">{errors.title}</span> : null}
      </label>

      <label className="stack compact">
        <input className={errors.sku ? "input-error" : ""} placeholder="SKU" value={draft.sku} onChange={(event) => handleFieldChange("sku", event.target.value)} />
        {errors.sku ? <span className="field-error">{errors.sku}</span> : null}
      </label>

      <label className="stack compact">
        <input className={errors.brand ? "input-error" : ""} placeholder="Brand" value={draft.brand} onChange={(event) => handleFieldChange("brand", event.target.value)} />
        {errors.brand ? <span className="field-error">{errors.brand}</span> : null}
      </label>

      <label className="stack compact">
        <input className={errors.price ? "input-error" : ""} placeholder="Price" type="number" value={draft.price} onChange={(event) => handleFieldChange("price", event.target.value)} />
        {errors.price ? <span className="field-error">{errors.price}</span> : null}
      </label>

      <label className="stack compact">
        <textarea className={errors.summary ? "input-error" : ""} placeholder="Summary" value={draft.summary} onChange={(event) => handleFieldChange("summary", event.target.value)} />
        {errors.summary ? <span className="field-error">{errors.summary}</span> : null}
      </label>

      {selectedCategory ? (
        <>
          <div className="subsection">
            <h3>Dynamic Attributes</h3>
            {selectedCategory.attributeGroups.map((group) => (
              <div key={group.id} className="stack compact">
                {group.attributes.map((attribute) => (
                  <label key={attribute.key} className="stack compact">
                    <span>{attribute.label}</span>
                    <select
                      className={errors.attributes && !draft.attributes[attribute.key] ? "input-error" : ""}
                      value={draft.attributes[attribute.key] || ""}
                      onChange={(event) => handleAttributeChange(attribute.key, event.target.value)}
                    >
                      <option value="">Select {attribute.label}</option>
                      {attribute.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            ))}
            {errors.attributes ? <span className="field-error">{errors.attributes}</span> : null}
          </div>

          <div className="subsection">
            <h3>Category Content</h3>
            <div className="stack">
              {selectedCategory.contentModel.map((field) => (
                <DynamicContentField
                  key={field.key}
                  field={field}
                  value={draft.content[field.key]}
                  hasError={Boolean(errors.content)}
                  onChange={handleContentChange}
                />
              ))}
            </div>
            {errors.content ? <span className="field-error">{errors.content}</span> : null}
          </div>
        </>
      ) : null}

      <button type="submit">{submitLabel}</button>
    </form>
  );
}

function DynamicContentField({ field, value, hasError, onChange }) {
  const [textValue, setTextValue] = useState(() => formatFieldValue(field.type, value));

  useEffect(() => {
    setTextValue(formatFieldValue(field.type, value));
  }, [field.key, field.type]);

  if (field.type === "list") {
    return (
      <label className="stack compact">
        <span>{field.label}</span>
        <textarea
          className={hasError ? "input-error" : ""}
          placeholder="One item per line"
          value={textValue}
          onChange={(event) => {
            const nextText = event.target.value;
            setTextValue(nextText);
            onChange(
              field.key,
              nextText.split("\n").map((entry) => entry.trim()).filter(Boolean)
            );
          }}
        />
      </label>
    );
  }

  if (field.type === "kv-list") {
    return (
      <label className="stack compact">
        <span>{field.label}</span>
        <textarea
          className={hasError ? "input-error" : ""}
          placeholder="Label:Value per line"
          value={textValue}
          onChange={(event) => {
            const nextText = event.target.value;
            setTextValue(nextText);
            onChange(
              field.key,
              nextText
                .split("\n")
                .map((line) => line.split(":"))
                .filter((parts) => parts[0] && parts[1])
                .map(([label, rowValue]) => ({ label: label.trim(), value: rowValue.trim() }))
            );
          }}
        />
      </label>
    );
  }

  return (
    <label className="stack compact">
      <span>{field.label}</span>
      <textarea className={hasError ? "input-error" : ""} value={value || ""} onChange={(event) => onChange(field.key, event.target.value)} />
    </label>
  );
}

function formatFieldValue(type, value) {
  if (type === "list") {
    return Array.isArray(value) ? value.join("\n") : "";
  }

  if (type === "kv-list") {
    return Array.isArray(value) ? value.map((row) => `${row.label}:${row.value}`).join("\n") : "";
  }

  return value || "";
}
