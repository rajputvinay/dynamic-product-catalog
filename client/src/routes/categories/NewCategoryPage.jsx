import CategoryBuilder from "../../components/CategoryBuilder.jsx";

export default function NewCategoryPage({ draft, onChange, onSubmit, onBack, heading, description, submitLabel }) {
  return (
    <section className="panel form-page-panel">
      <div className="page-head">
        <div>
          <p className="eyebrow">Admin Flow</p>
          <h2>{heading}</h2>
          <p>{description}</p>
        </div>
        <button type="button" className="secondary-button" onClick={onBack}>
          Back to Categories
        </button>
      </div>
      <CategoryBuilder draft={draft} onChange={onChange} onSubmit={onSubmit} submitLabel={submitLabel} />
    </section>
  );
}
