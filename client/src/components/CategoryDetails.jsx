export default function CategoryDetails({ category, onClose, onEdit }) {
  const attributes = category.attributeGroups.flatMap((group) => group.attributes);

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="section-head">
          <div>
            <p className="pill">{category.slug}</p>
            <h2>{category.name}</h2>
          </div>
          <div className="inline-actions">
            <button type="button" className="secondary-button" onClick={() => onEdit(category)}>
              Edit
            </button>
            <button type="button" onClick={onClose}>
              Close
            </button>
          </div>
        </div>

        <section className="detail-section">
          <h3>Description</h3>
          <p>{category.description || "-"}</p>
        </section>

        <section className="detail-section">
          <h3>Attributes</h3>
          <table>
            <tbody>
              {attributes.map((attribute) => (
                <tr key={attribute.key}>
                  <th>{attribute.label}</th>
                  <td>{attribute.options.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="detail-section">
          <h3>Content Fields</h3>
          <table>
            <tbody>
              {category.contentModel.map((field) => (
                <tr key={field.key}>
                  <th>{field.label}</th>
                  <td>{field.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
