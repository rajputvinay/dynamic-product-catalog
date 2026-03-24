import ProductForm from "../../components/ProductForm.jsx";

export default function NewProductPage({ categories, selectedCategory, draft, onChange, onSubmit, onBack, heading, description, submitLabel }) {
  return (
    <section className="panel form-page-panel">
      <div className="page-head">
        <div>
          <p className="eyebrow">Admin Flow</p>
          <h2>{heading}</h2>
          <p>{description}</p>
        </div>
        <button type="button" className="secondary-button" onClick={onBack}>
          Back to Products
        </button>
      </div>
      <ProductForm
        categories={categories}
        selectedCategory={selectedCategory}
        draft={draft}
        onChange={onChange}
        onSubmit={onSubmit}
        submitLabel={submitLabel}
      />
    </section>
  );
}
