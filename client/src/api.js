import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:4000/api",
  headers: {
    "Content-Type": "application/json"
  }
});

export async function fetchCategories({ q, schemaFilter, page, pageSize } = {}) {
  return request({
    url: "/categories",
    params: buildParams({ q, schemaFilter, page, pageSize })
  });
}

export async function fetchCategory(categoryId) {
  return request({ url: `/categories/${categoryId}` });
}

export async function createCategory(payload) {
  return request({
    url: "/categories",
    method: "post",
    data: payload
  });
}

export async function updateCategory(categoryId, payload) {
  return request({
    url: `/categories/${categoryId}`,
    method: "put",
    data: payload
  });
}

export async function createProduct(payload) {
  return request({
    url: "/products",
    method: "post",
    data: payload
  });
}

export async function updateProduct(productId, payload) {
  return request({
    url: `/products/${productId}`,
    method: "put",
    data: payload
  });
}

export async function fetchProducts({ categoryId, q, filters, page, pageSize } = {}) {
  const params = buildParams({ categoryId, q, page, pageSize });
  if (filters && Object.keys(filters).length) {
    params.filters = JSON.stringify(filters);
  }

  return request({
    url: "/products",
    params
  });
}

export async function fetchProduct(productId) {
  return request({ url: `/products/${productId}` });
}

async function request(config) {
  try {
    const response = await api.request(config);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data?.message || "Request failed.");
    }

    throw new Error("Network request failed. Check whether the backend server is running.");
  }
}

function buildParams(values) {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== undefined && value !== null && value !== "")
  );
}
