export default function ProductDetails({ product, onClose, onEdit }) {
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="section-head">
          <div>
            <p className="pill">{product.category.name}</p>
            <h2>{product.title}</h2>
          </div>
          <div className="inline-actions">
            <button type="button" className="secondary-button" onClick={() => onEdit(product)}>
              Edit
            </button>
            <button type="button" onClick={onClose}>
              Close
            </button>
          </div>
        </div>

        <section className="detail-section product-summary-grid">
          <div className="summary-card">
            <span className="summary-label">Price</span>
            <strong>{product.currency} {Number(product.price || 0).toLocaleString()}</strong>
          </div>
          <div className="summary-card">
            <span className="summary-label">Brand</span>
            <strong>{product.brand || "-"}</strong>
          </div>
          <div className="summary-card">
            <span className="summary-label">SKU</span>
            <strong>{product.sku || "-"}</strong>
          </div>
        </section>

        {product.detailsSections.map((section) => (
          <section key={section.key} className="detail-section">
            <h3>{section.title}</h3>
            <SectionRenderer section={section} />
          </section>
        ))}
      </div>
    </div>
  );
}

function SectionRenderer({ section }) {
  if (section.type === "list") {
    return (
      <ul>
        {section.value.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }

  if (section.type === "table") {
    return (
      <table>
        <tbody>
          {section.value.map((row, index) => (
            <tr key={`${row.label}-${index}`}>
              <th>{row.label}</th>
              <td>{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return <p>{section.value}</p>;
}
