import {
  findCategoriesByIds,
  findCategoryById,
  initializeCategoryModel,
  insertCategory,
  listCategories as listCategoryDocuments,
  replaceCategory
} from "../models/category-model.js";
import {
  findProductById,
  findProductsByCategory,
  findProductsByIds,
  initializeProductModel,
  insertProduct,
  listAllProducts,
  replaceProduct
} from "../models/product-model.js";
import {
  indexProduct,
  initializeElastic,
  isElasticEnabled,
  searchProductIds,
  syncProductsToElastic
} from "./elastic.js";

let readyPromise;

export async function initializeCatalogStore() {
  if (!readyPromise) {
    readyPromise = prepareStores();
  }

  return readyPromise;
}

export async function listCategories({ q = "", schemaFilter = "", page, pageSize } = {}) {
  await initializeCatalogStore();
  const categories = await listCategoryDocuments({ q, schemaFilter });
  return paginateCollection(categories, page, pageSize);
}

export async function getCategory(categoryId) {
  await initializeCatalogStore();
  return findCategoryById(categoryId);
}

export async function createCategory(input) {
  await initializeCatalogStore();

  const category = buildCategoryDocument(input, { id: slugify(input.name) });
  const existingCategory = await findCategoryById(category.id);
  if (existingCategory) {
    throw new Error("Category already exists.");
  }

  return insertCategory(category);
}

export async function updateCategory(categoryId, input) {
  await initializeCatalogStore();

  const existingCategory = await findCategoryById(categoryId);
  if (!existingCategory) {
    throw new Error("Category not found.");
  }

  const category = buildCategoryDocument(input, existingCategory);
  await replaceCategory(categoryId, category);
  return category;
}

export async function createProduct(input) {
  await initializeCatalogStore();

  const category = await findCategoryById(input.categoryId);
  if (!category) {
    throw new Error("Category not found.");
  }

  validateProduct(category, input);

  const product = buildProductDocument(input);
  await insertProduct(product);
  await safeIndexProduct(product);
  return attachCategory(product, category);
}

export async function updateProduct(productId, input) {
  await initializeCatalogStore();

  const existingProduct = await findProductById(productId);
  if (!existingProduct) {
    throw new Error("Product not found.");
  }

  const category = await findCategoryById(input.categoryId);
  if (!category) {
    throw new Error("Category not found.");
  }

  validateProduct(category, input);

  const product = buildProductDocument(input, existingProduct);
  await replaceProduct(productId, product);
  await safeIndexProduct(product);
  return attachCategory(product, category);
}

export async function getProduct(productId) {
  await initializeCatalogStore();

  const product = await findProductById(productId);
  if (!product) {
    return null;
  }

  return attachCategory(product, await findCategoryById(product.categoryId));
}

export async function searchProducts({ categoryId, q = "", filters = {}, page, pageSize } = {}) {
  await initializeCatalogStore();

  const matchedProducts = await resolveSearchProducts({ categoryId, q, filters });
  const relevantCategoryIds = Array.from(new Set(matchedProducts.map((product) => product.categoryId)));
  const categories = await loadCategoriesByIds(relevantCategoryIds);
  const selectedCategory = categoryId ? categories.get(categoryId) || (await findCategoryById(categoryId)) : null;
  const items = matchedProducts.map((product) => attachCategory(product, categories.get(product.categoryId) || null));

  return {
    ...paginateCollection(items, page, pageSize),
    filters: buildFilterDefinitions(matchedProducts, selectedCategory, categories)
  };
}

async function prepareStores() {
  await Promise.all([initializeCategoryModel(), initializeProductModel()]);

  const elasticReady = await initializeElastic();
  if (elasticReady) {
    const products = await listAllProducts();
    await syncProductsToElastic(products);
  }
}

async function resolveSearchProducts({ categoryId, q, filters }) {
  if (isElasticEnabled()) {
    try {
      const productIds = await searchProductIds({ categoryId, q, filters });
      if (productIds) {
        const products = await findProductsByIds(productIds);
        return orderProductsByIds(products, productIds);
      }
    } catch (error) {
      console.warn("Elasticsearch search failed. Falling back to Mongo search.", error.message || error);
    }
  }

  return searchProductsInMongo({ categoryId, q, filters });
}

async function searchProductsInMongo({ categoryId, q, filters }) {
  const normalizedQuery = q.trim().toLowerCase();
  const products = await findProductsByCategory(categoryId);

  return products.filter((product) => {
    const matchesQuery =
      !normalizedQuery ||
      [
        product.title,
        product.brand,
        product.summary,
        ...Object.values(product.attributes),
        ...stringifyContent(product.content)
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);

    if (!matchesQuery) {
      return false;
    }

    return Object.entries(filters).every(([key, values]) => {
      if (!values.length) {
        return true;
      }

      return values.includes(product.attributes[key]);
    });
  });
}

async function safeIndexProduct(product) {
  try {
    await indexProduct(product);
  } catch (error) {
    console.warn("Product saved in Mongo, but Elasticsearch indexing failed.", error.message || error);
  }
}

function buildCategoryDocument(input, baseCategory = {}) {
  if (!input.name) {
    throw new Error("Category name is required.");
  }

  const contentModel = input.contentModel || [];
  return {
    id: baseCategory.id,
    slug: baseCategory.slug || baseCategory.id,
    name: input.name,
    description: input.description || "",
    attributeGroups: input.attributeGroups || [],
    contentModel,
    detailsLayout: input.detailsLayout?.length ? input.detailsLayout : buildDefaultLayout(contentModel)
  };
}

function buildProductDocument(input, baseProduct = {}) {
  return {
    id: baseProduct.id || `p-${Date.now()}`,
    categoryId: input.categoryId,
    title: input.title,
    sku: input.sku,
    price: Number(input.price),
    currency: input.currency || "INR",
    brand: input.brand,
    summary: input.summary || "",
    attributes: input.attributes || {},
    content: input.content || {}
  };
}

function orderProductsByIds(products, ids) {
  const byId = new Map(products.map((product) => [product.id, product]));
  return ids.map((id) => byId.get(id)).filter(Boolean);
}

async function loadCategoriesByIds(categoryIds) {
  const categories = await findCategoriesByIds(categoryIds);
  return new Map(categories.map((category) => [category.id, category]));
}

function validateProduct(category, input) {
  if (!input.title || !input.sku || !input.brand) {
    throw new Error("Title, SKU, and brand are required.");
  }

  const attributes = category.attributeGroups.flatMap((group) => group.attributes);
  for (const attribute of attributes) {
    if (attribute.required && !input.attributes?.[attribute.key]) {
      throw new Error(`Missing required attribute: ${attribute.label}`);
    }
  }

  for (const field of category.contentModel) {
    if (field.required && !input.content?.[field.key]) {
      throw new Error(`Missing required content field: ${field.label}`);
    }
  }
}

function attachCategory(product, category) {
  return {
    ...product,
    category,
    detailsSections: buildDetailsSections(product, category)
  };
}

function buildDetailsSections(product, category) {
  if (!category) {
    return [];
  }

  return category.detailsLayout.map((entry) => {
    if (entry.section === "attributes") {
      const rows = category.attributeGroups.flatMap((group) =>
        group.attributes.map((attribute) => ({
          label: attribute.label,
          value: product.attributes[attribute.key] || "-"
        }))
      );

      const specRows = Array.isArray(product.content.specifications) ? product.content.specifications : [];
      return {
        key: entry.section,
        title: entry.title,
        type: "table",
        value: [...rows, ...specRows]
      };
    }

    return {
      key: entry.section,
      title: entry.title,
      type: inferContentType(product.content[entry.section]),
      value: product.content[entry.section]
    };
  });
}

function buildFilterDefinitions(items, category, categoryMap = new Map()) {
  const sourceCategory = category || categoryMap.get(items[0]?.categoryId) || null;

  if (!sourceCategory) {
    return [];
  }

  const attributes = sourceCategory.attributeGroups.flatMap((group) => group.attributes);
  return attributes
    .filter((attribute) => attribute.filterable)
    .map((attribute) => {
      const options = Array.from(
        new Set(items.map((item) => item.attributes[attribute.key]).filter(Boolean))
      ).sort();

      return {
        key: attribute.key,
        label: attribute.label,
        options
      };
    });
}

function buildDefaultLayout(contentModel) {
  return [
    ...contentModel.map((field) => ({ section: field.key, title: field.label })),
    { section: "attributes", title: "Specifications" }
  ];
}

function inferContentType(value) {
  if (Array.isArray(value)) {
    return typeof value[0] === "object" ? "table" : "list";
  }

  return "text";
}

function stringifyContent(content) {
  return Object.values(content).flatMap((value) => {
    if (Array.isArray(value)) {
      return value.map((entry) => (typeof entry === "object" ? Object.values(entry).join(" ") : entry));
    }

    return [String(value)];
  });
}

function paginateCollection(items, page, pageSize) {
  if (!page || !pageSize) {
    return items;
  }

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;

  return {
    items: items.slice(startIndex, startIndex + pageSize),
    pagination: {
      page: currentPage,
      pageSize,
      totalItems,
      totalPages
    }
  };
}

function slugify(value) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
}
