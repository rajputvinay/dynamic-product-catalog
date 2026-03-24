import { useState } from "react";

export default function CategoryBuilder({ draft, onChange, onSubmit, submitLabel = "Save Category Schema" }) {
  const [errors, setErrors] = useState({});
  const firstGroup = draft.attributeGroups[0];

  function updateAttribute(index, field, value) {
    const nextAttributes = firstGroup.attributes.map((attribute, attributeIndex) =>
      attributeIndex === index ? { ...attribute, [field]: value } : attribute
    );

    onChange({
      ...draft,
      attributeGroups: [{ ...firstGroup, attributes: nextAttributes }]
    });
  }

  function updateOptions(index, value) {
    updateAttribute(index, "options", value.split(",").map((entry) => entry.trim()));
  }

  function addAttribute() {
    onChange({
      ...draft,
      attributeGroups: [
        {
          ...firstGroup,
          attributes: [
            ...firstGroup.attributes,
            { key: "", label: "", type: "select", required: true, filterable: true, options: [""] }
          ]
        }
      ]
    });
  }

  function removeAttribute(index) {
    onChange({
      ...draft,
      attributeGroups: [
        {
          ...firstGroup,
          attributes: firstGroup.attributes.filter((_, attributeIndex) => attributeIndex !== index)
        }
      ]
    });
  }

  function updateContentField(index, field, value) {
    const contentModel = draft.contentModel.map((entry, entryIndex) =>
      entryIndex === index ? { ...entry, [field]: value } : entry
    );

    onChange({
      ...draft,
      contentModel
    });
  }

  function addContentField() {
    onChange({
      ...draft,
      contentModel: [
        ...draft.contentModel,
        { key: "", label: "", type: "textarea", required: true }
      ]
    });
  }

  function removeContentField(index) {
    onChange({
      ...draft,
      contentModel: draft.contentModel.filter((_, entryIndex) => entryIndex !== index)
    });
  }

  function handleSubmit(event) {
    const nextErrors = {};

    if (!draft.name.trim()) {
      nextErrors.name = "Category name is required.";
    }

    if (!draft.description.trim()) {
      nextErrors.description = "Description is required.";
    }

    const invalidAttribute = firstGroup.attributes.find((attribute) => {
      const hasOptions = Array.isArray(attribute.options) && attribute.options.filter(Boolean).length > 0;
      return !attribute.key.trim() || !attribute.label.trim() || !hasOptions;
    });

    if (invalidAttribute) {
      nextErrors.attributes = "Each attribute needs key, label, and at least one option.";
    }

    const invalidContentField = draft.contentModel.find((field) => !field.key.trim() || !field.label.trim());
    if (invalidContentField) {
      nextErrors.contentModel = "Each content field needs both key and label.";
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
        <input
          className={errors.name ? "input-error" : ""}
          placeholder="Category name"
          value={draft.name}
          onChange={(event) => onChange({ ...draft, name: event.target.value })}
        />
        {errors.name ? <span className="field-error">{errors.name}</span> : null}
      </label>

      <label className="stack compact">
        <textarea
          className={errors.description ? "input-error" : ""}
          placeholder="Description"
          value={draft.description}
          onChange={(event) => onChange({ ...draft, description: event.target.value })}
        />
        {errors.description ? <span className="field-error">{errors.description}</span> : null}
      </label>

      <div className="subsection">
        <div className="section-head">
          <h3>Attributes</h3>
          <button type="button" onClick={addAttribute}>
            Add Attribute
          </button>
        </div>
        {firstGroup.attributes.map((attribute, index) => (
          <div className="attribute-row attribute-row-with-action" key={`attribute-${index}`}>
            <input
              className={errors.attributes ? "input-error" : ""}
              placeholder="Key"
              value={attribute.key}
              onChange={(event) => updateAttribute(index, "key", event.target.value)}
            />
            <input
              className={errors.attributes ? "input-error" : ""}
              placeholder="Label"
              value={attribute.label}
              onChange={(event) => updateAttribute(index, "label", event.target.value)}
            />
            <input
              className={errors.attributes ? "input-error" : ""}
              placeholder="Options (comma separated)"
              value={attribute.options.join(", ")}
              onChange={(event) => updateOptions(index, event.target.value)}
            />
            {firstGroup.attributes.length > 1 ? (
              <button
                type="button"
                className="danger-button icon-button"
                aria-label="Delete attribute"
                onClick={() => removeAttribute(index)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 7h2v8h-2v-8zm4 0h2v8h-2v-8zM7 8h10l-1 12H8L7 8z" fill="currentColor" />
                </svg>
              </button>
            ) : null}
          </div>
        ))}
        {errors.attributes ? <span className="field-error">{errors.attributes}</span> : null}
      </div>

      <div className="subsection">
        <div className="section-head">
          <h3>Content Fields</h3>
          <button type="button" onClick={addContentField}>
            Add Content Field
          </button>
        </div>
        {draft.contentModel.map((field, index) => (
          <div className="attribute-row attribute-row-with-action" key={`content-${index}`}>
            <input
              className={errors.contentModel ? "input-error" : ""}
              placeholder="Content key"
              value={field.key}
              onChange={(event) => updateContentField(index, "key", event.target.value)}
            />
            <input
              className={errors.contentModel ? "input-error" : ""}
              placeholder="Label"
              value={field.label}
              onChange={(event) => updateContentField(index, "label", event.target.value)}
            />
            <select value={field.type} onChange={(event) => updateContentField(index, "type", event.target.value)}>
              <option value="list">List</option>
              <option value="textarea">Textarea</option>
              <option value="kv-list">Key/Value List</option>
            </select>
            {draft.contentModel.length > 1 ? (
              <button
                type="button"
                className="danger-button icon-button"
                aria-label="Delete content field"
                onClick={() => removeContentField(index)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 7h2v8h-2v-8zm4 0h2v8h-2v-8zM7 8h10l-1 12H8L7 8z" fill="currentColor" />
                </svg>
              </button>
            ) : null}
          </div>
        ))}
        {errors.contentModel ? <span className="field-error">{errors.contentModel}</span> : null}
      </div>

      <button type="submit">{submitLabel}</button>
    </form>
  );
}
