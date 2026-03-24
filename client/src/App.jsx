import { useEffect, useMemo, useState } from "react";
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import {
  createCategory,
  createProduct,
  fetchCategories,
  fetchProduct,
  fetchProducts,
  updateCategory,
  updateProduct
} from "./api.js";
import CategoryDetails from "./components/CategoryDetails.jsx";
import ProductDetails from "./components/ProductDetails.jsx";
import CategoriesPage from "./routes/categories/CategoriesPage.jsx";
import NewCategoryPage from "./routes/categories/NewCategoryPage.jsx";
import ProductsPage from "./routes/products/ProductsPage.jsx";
import NewProductPage from "./routes/products/NewProductPage.jsx";
import { normalizeCategoryDraft } from "./lib/catalog.js";
import { routes } from "./lib/routes.js";

const DEBOUNCE_MS = 300;
const CATEGORY_PAGE_SIZE = 10;
const PRODUCT_PAGE_SIZE = 10;
const defaultPagination = { page: 1, pageSize: 10, totalItems: 0, totalPages: 1 };

const emptyCategoryDraft = {
  name: "",
  description: "",
  attributeGroups: [
    {
      id: "primary",
      title: "Primary Attributes",
      attributes: [
        { key: "", label: "", type: "select", required: true, filterable: true, options: [""] }
      ]
    }
  ],
  contentModel: [
    { key: "", label: "", type: "textarea", required: true }
  ]
};

const emptyProductDraft = {
  categoryId: "",
  title: "",
  sku: "",
  price: "",
  currency: "INR",
  brand: "",
  summary: "",
  attributes: {},
  content: {}
};

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const [categories, setCategories] = useState([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [categorySchemaFilter, setCategorySchemaFilter] = useState("");
  const [categoryPage, setCategoryPage] = useState(1);
  const [categoryPagination, setCategoryPagination] = useState({ ...defaultPagination, pageSize: CATEGORY_PAGE_SIZE });
  const [productItems, setProductItems] = useState([]);
  const [productSearch, setProductSearch] = useState("");
  const [selectedProductCategory, setSelectedProductCategory] = useState("");
  const [productPage, setProductPage] = useState(1);
  const [productPagination, setProductPagination] = useState({ ...defaultPagination, pageSize: PRODUCT_PAGE_SIZE });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [editingCategoryId, setEditingCategoryId] = useState("");
  const [editingProductId, setEditingProductId] = useState("");
  const [categoryDraft, setCategoryDraft] = useState(emptyCategoryDraft);
  const [productDraft, setProductDraft] = useState(emptyProductDraft);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const isCategoryPage = pathname === routes.categories;
  const isAddCategoryPage = pathname === routes.addCategory;
  const isEditCategoryPage = pathname === routes.editCategory;
  const isProductsPage = pathname === routes.products;
  const isAddProductPage = pathname === routes.addProduct;
  const isEditProductPage = pathname === routes.editProduct;
  const needsCategories = isCategoryPage || isProductsPage || isAddProductPage || isEditCategoryPage || isEditProductPage;
  const needsProducts = isProductsPage;

  const debouncedCategorySearch = useDebouncedValue(categorySearch, DEBOUNCE_MS);
  const debouncedCategorySchemaFilter = useDebouncedValue(categorySchemaFilter, DEBOUNCE_MS);
  const debouncedProductSearch = useDebouncedValue(productSearch, DEBOUNCE_MS);
  const debouncedSelectedProductCategory = useDebouncedValue(selectedProductCategory, DEBOUNCE_MS);

  useEffect(() => {
    setCategoryPage(1);
  }, [debouncedCategorySearch, debouncedCategorySchemaFilter]);

  useEffect(() => {
    setProductPage(1);
  }, [debouncedProductSearch, debouncedSelectedProductCategory]);

  useEffect(() => {
    if (!needsCategories) {
      return;
    }

    loadCategories().catch(handleError);
  }, [pathname, needsCategories, isCategoryPage, debouncedCategorySearch, debouncedCategorySchemaFilter, categoryPage]);

  useEffect(() => {
    if (!needsProducts) {
      return;
    }

    loadProductList().catch(handleError);
  }, [pathname, needsProducts, debouncedSelectedProductCategory, debouncedProductSearch, productPage]);

  useEffect(() => {
    if ((isAddProductPage || isEditProductPage) && categories.length && !productDraft.categoryId) {
      setProductDraft((current) => ({ ...current, categoryId: categories[0].id }));
    }
  }, [isAddProductPage, isEditProductPage, categories, productDraft.categoryId]);

  async function loadCategories() {
    const response = await fetchCategories(
      isCategoryPage
        ? {
            q: debouncedCategorySearch,
            schemaFilter: debouncedCategorySchemaFilter,
            page: categoryPage,
            pageSize: CATEGORY_PAGE_SIZE
          }
        : {}
    );

    const payload = response.data;
    if (Array.isArray(payload)) {
      setCategories(payload);
      setCategoryPagination({ page: 1, pageSize: payload.length || CATEGORY_PAGE_SIZE, totalItems: payload.length, totalPages: 1 });
    } else {
      setCategories(Array.isArray(payload.items) ? payload.items : []);
      setCategoryPagination(payload.pagination || { ...defaultPagination, pageSize: CATEGORY_PAGE_SIZE });
    }

    setError("");
  }

  async function loadProductList() {
    const response = await fetchProducts({
      categoryId: debouncedSelectedProductCategory,
      q: debouncedProductSearch,
      filters: {},
      page: productPage,
      pageSize: PRODUCT_PAGE_SIZE
    });

    const payload = response.data;
    if (Array.isArray(payload)) {
      setProductItems(payload);
      setProductPagination({ page: 1, pageSize: payload.length || PRODUCT_PAGE_SIZE, totalItems: payload.length, totalPages: 1 });
    } else {
      setProductItems(Array.isArray(payload?.items) ? payload.items : []);
      setProductPagination(payload?.pagination || { ...defaultPagination, pageSize: PRODUCT_PAGE_SIZE });
    }

    setError("");
  }

  async function handleViewProduct(productId) {
    const response = await fetchProduct(productId);
    setSelectedProduct(response.data || null);
  }

  async function handleCreateCategory(event) {
    event.preventDefault();
    setError("");
    await createCategory(normalizeCategoryDraft(categoryDraft));
    setCategoryDraft(emptyCategoryDraft);
    setMessage("Category created.");
    await loadCategories();
    navigate(routes.categories);
  }

  async function handleUpdateCategory(event) {
    event.preventDefault();
    setError("");
    await updateCategory(editingCategoryId, normalizeCategoryDraft(categoryDraft));
    setEditingCategoryId("");
    setCategoryDraft(emptyCategoryDraft);
    setMessage("Category updated.");
    await loadCategories();
    navigate(routes.categories);
  }

  async function handleCreateProduct(event) {
    event.preventDefault();
    setError("");
    await createProduct(productDraft);
    setProductDraft((current) => ({
      ...emptyProductDraft,
      categoryId: current.categoryId || categories[0]?.id || "",
      currency: "INR"
    }));
    setMessage("Product created.");
    navigate(routes.products);
  }

  async function handleUpdateProduct(event) {
    event.preventDefault();
    setError("");
    await updateProduct(editingProductId, productDraft);
    setEditingProductId("");
    setProductDraft(emptyProductDraft);
    setMessage("Product updated.");
    navigate(routes.products);
  }

  function handleStartEditCategory(category) {
    setEditingCategoryId(category.id);
    setCategoryDraft(toCategoryDraft(category));
    navigate(routes.editCategory);
  }

  function handleStartEditProduct(product) {
    setEditingProductId(product.id);
    setProductDraft(toProductDraft(product));
    navigate(routes.editProduct);
  }

  function handleViewCategory(category) {
    setSelectedCategory(category);
  }

  function handleError(cause) {
    setError(cause.message || "Unexpected error.");
  }

  const selectedProductCategorySchema = useMemo(
    () => categories.find((category) => category.id === productDraft.categoryId),
    [categories, productDraft.categoryId]
  );

  const categoryNavActive = pathname.startsWith("/categories");
  const productNavActive = pathname.startsWith("/products");

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <h1>Dynamic Add Product & Search</h1>
          <p className="hero-copy">
            Category metadata drives admin forms, product detail sections, and backend-generated filters.
          </p>
        </div>
      </header>

      <div className="workspace-shell">
        <aside className="sidebar panel">
          <p className="eyebrow">Navigation</p>
          <h2>Admin Pages</h2>
          <nav className="sidebar-nav">
            <NavLink
              to={routes.categories}
              className={categoryNavActive ? "sidebar-link active" : "sidebar-link"}
            >
              Category
            </NavLink>
            <NavLink
              to={routes.products}
              className={productNavActive ? "sidebar-link active" : "sidebar-link"}
            >
              Product
            </NavLink>
          </nav>
        </aside>

        <main className="workspace-main">
          <Routes>
            <Route
              path={routes.categories}
              element={
                <CategoriesPage
                  categories={categories}
                  search={categorySearch}
                  schemaFilter={categorySchemaFilter}
                  pagination={categoryPagination}
                  onSearchChange={setCategorySearch}
                  onSchemaFilterChange={setCategorySchemaFilter}
                  onPageChange={setCategoryPage}
                  onAddCategory={() => {
                    setEditingCategoryId("");
                    setCategoryDraft(emptyCategoryDraft);
                    navigate(routes.addCategory);
                  }}
                  onAddProduct={() => navigate(routes.addProduct)}
                  onViewCategory={handleViewCategory}
                  onEditCategory={handleStartEditCategory}
                />
              }
            />
            <Route
              path={routes.addCategory}
              element={
                <NewCategoryPage
                  draft={categoryDraft}
                  onChange={setCategoryDraft}
                  onSubmit={handleCreateCategory}
                  onBack={() => navigate(routes.categories)}
                  heading="Add Category"
                  description="Create a new category schema with dynamic attributes and content fields."
                  submitLabel="Save Category Schema"
                />
              }
            />
            <Route
              path={routes.editCategory}
              element={
                <NewCategoryPage
                  draft={categoryDraft}
                  onChange={setCategoryDraft}
                  onSubmit={handleUpdateCategory}
                  onBack={() => navigate(routes.categories)}
                  heading="Edit Category"
                  description="Update the category schema and metadata for this catalog type."
                  submitLabel="Update Category"
                />
              }
            />
            <Route
              path={routes.products}
              element={
                <ProductsPage
                  categories={categories}
                  products={productItems}
                  search={productSearch}
                  selectedCategoryId={selectedProductCategory}
                  pagination={productPagination}
                  onSearchChange={setProductSearch}
                  onCategoryChange={setSelectedProductCategory}
                  onPageChange={setProductPage}
                  onAddProduct={() => {
                    setEditingProductId("");
                    setProductDraft(emptyProductDraft);
                    navigate(routes.addProduct);
                  }}
                  onAddCategory={() => navigate(routes.addCategory)}
                  onViewProduct={(productId) => handleViewProduct(productId).catch(handleError)}
                  onEditProduct={handleStartEditProduct}
                />
              }
            />
            <Route
              path={routes.addProduct}
              element={
                <NewProductPage
                  categories={categories}
                  selectedCategory={selectedProductCategorySchema}
                  draft={productDraft}
                  onChange={setProductDraft}
                  onSubmit={handleCreateProduct}
                  onBack={() => navigate(routes.products)}
                  heading="Add Product"
                  description="Create a category-driven product without hardcoded fields."
                  submitLabel="Create Product"
                />
              }
            />
            <Route
              path={routes.editProduct}
              element={
                <NewProductPage
                  categories={categories}
                  selectedCategory={selectedProductCategorySchema}
                  draft={productDraft}
                  onChange={setProductDraft}
                  onSubmit={handleUpdateProduct}
                  onBack={() => navigate(routes.products)}
                  heading="Edit Product"
                  description="Update product content, attributes, and category-driven metadata."
                  submitLabel="Update Product"
                />
              }
            />
            <Route path="/" element={<Navigate to={routes.categories} replace />} />
            <Route path="*" element={<Navigate to={routes.categories} replace />} />
          </Routes>
        </main>
      </div>

      {selectedCategory ? (
        <CategoryDetails
          category={selectedCategory}
          onClose={() => setSelectedCategory(null)}
          onEdit={(category) => {
            setSelectedCategory(null);
            handleStartEditCategory(category);
          }}
        />
      ) : null}
      {selectedProduct ? (
        <ProductDetails
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onEdit={(product) => {
            setSelectedProduct(null);
            handleStartEditProduct(product);
          }}
        />
      ) : null}
      {message ? <div className="toast">{message}</div> : null}
      {error ? <div className="toast">{error}</div> : null}
    </div>
  );
}

function toCategoryDraft(category) {
  return {
    name: category.name || "",
    description: category.description || "",
    attributeGroups: category.attributeGroups?.length
      ? category.attributeGroups.map((group) => ({
          ...group,
          attributes: group.attributes.map((attribute) => ({ ...attribute, options: [...(attribute.options || [])] }))
        }))
      : emptyCategoryDraft.attributeGroups,
    contentModel: category.contentModel?.length
      ? category.contentModel.map((field) => ({ ...field }))
      : emptyCategoryDraft.contentModel
  };
}

function toProductDraft(product) {
  return {
    categoryId: product.categoryId || "",
    title: product.title || "",
    sku: product.sku || "",
    price: String(product.price || ""),
    currency: product.currency || "INR",
    brand: product.brand || "",
    summary: product.summary || "",
    attributes: { ...(product.attributes || {}) },
    content: JSON.parse(JSON.stringify(product.content || {}))
  };
}

function useDebouncedValue(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const serializedValue = typeof value === "object" && value !== null ? JSON.stringify(value) : value;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => window.clearTimeout(timeoutId);
  }, [serializedValue, delay, value]);

  return debouncedValue;
}
