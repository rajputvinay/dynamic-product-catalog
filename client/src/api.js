import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";
const ACCESS_TOKEN_KEY = "accessToken";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      return Promise.reject(new Error(error.response.data?.message || "Request failed."));
    }

    return Promise.reject(new Error("Network request failed. Check whether the backend server is running."));
  }
);

export function getAccessToken() {
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token) {
  if (!token) {
    clearAccessToken();
    return;
  }

  window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken() {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
}

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
  const response = await api.request(config);
  return response.data;
}

function buildParams(values) {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== undefined && value !== null && value !== "")
  );
}
