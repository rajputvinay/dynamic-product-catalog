import EmptyState from "../../components/EmptyState.jsx";

export default function ProductsPage({
  categories,
  products,
  search,
  selectedCategoryId,
  pagination,
  onSearchChange,
  onCategoryChange,
  onPageChange,
  onAddProduct,
  onAddCategory,
  onViewProduct,
  onEditProduct
}) {
  const totalPages = pagination?.totalPages || 1;
  const currentPage = pagination?.page || 1;
  const totalItems = pagination?.totalItems || products.length;

  return (
    <section className="panel table-page-panel">
      <div className="page-head compact">
        <div>
          <h2>Product Table</h2>
          <p>All products with backend-driven search.</p>
        </div>
        <button type="button" onClick={onAddProduct}>
          Add Product
        </button>
      </div>

      <div className="toolbar-grid">
        <label className="stack compact toolbar-field">
          <span>Category</span>
          <select value={selectedCategoryId} onChange={(event) => onCategoryChange(event.target.value)}>
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className="stack compact toolbar-field toolbar-search">
          <span>Search</span>
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by title, brand, summary, or specs"
          />
        </label>
      </div>

      {!products.length ? (
        <EmptyState
          title="No products found"
          message="Adjust the search, or add a new product for the selected category set."
          primaryLabel="Add Product"
          secondaryLabel="Add Category"
          onPrimary={onAddProduct}
          onSecondary={onAddCategory}
        />
      ) : (
        <div className="catalog-table-wrap">
          <table className="catalog-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Brand</th>
                <th>Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <strong>{product.title}</strong>
                    <p>{product.summary}</p>
                  </td>
                  <td>{product.category.name}</td>
                  <td>{product.brand}</td>
                  <td>{product.currency} {product.price.toLocaleString()}</td>
                  <td>
                    <div className="inline-actions">
                      <button type="button" className="secondary-button icon-button table-action-button" aria-label="View product" onClick={() => onViewProduct(product.id)}>
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M12 5c5.5 0 9.5 4.4 10.8 6-.3.4-1 1.3-2.1 2.4C18.8 15.2 15.8 17 12 17s-6.8-1.8-8.7-3.6C2.2 12.3 1.5 11.4 1.2 11c1.3-1.6 5.3-6 10.8-6zm0 2C8.4 7 5.4 9.7 3.4 12c2 2.3 5 5 8.6 5s6.6-2.7 8.6-5c-2-2.3-5-5-8.6-5zm0 1.5A3.5 3.5 0 1 1 8.5 12 3.5 3.5 0 0 1 12 8.5zm0 2A1.5 1.5 0 1 0 13.5 12 1.5 1.5 0 0 0 12 10.5z" fill="currentColor" />
                        </svg>
                      </button>
                      <button type="button" className="icon-button table-action-button" aria-label="Edit product" onClick={() => onEditProduct(product)}>
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M3 17.25V21h3.75L17.8 9.94l-3.75-3.75L3 17.25zm2.92 2.33H5v-.92l8.06-8.06.92.92L5.92 19.58zM20.7 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.13 1.13 3.75 3.75 1.13-1.13z" fill="currentColor" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="footer-pagination">
        <p className="pagination-summary">
          <span>{totalItems} products</span>
          <span className="pagination-separator" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span>Page {currentPage} of {totalPages}</span>
        </p>
        <div className="inline-actions">
          <button type="button" className="secondary-button icon-button pagination-button" aria-label="Previous page" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button type="button" className="icon-button pagination-button" aria-label="Next page" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
