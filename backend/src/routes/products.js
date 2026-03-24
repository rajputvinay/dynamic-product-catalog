import {
  createProduct,
  getProduct,
  searchProducts,
  updateProduct
} from "../lib/catalog.js";
import {
  parseFilters,
  parsePositiveInt,
  readJson,
  sendError,
  sendSuccess
} from "../lib/http.js";

export async function handleProductRoutes(request, response, url) {
  if (request.method === "GET" && url.pathname === "/api/products") {
    const categoryId = url.searchParams.get("categoryId") || "";
    const q = url.searchParams.get("q") || "";
    const filters = parseFilters(url.searchParams.get("filters"));
    const page = parsePositiveInt(url.searchParams.get("page"));
    const pageSize = parsePositiveInt(url.searchParams.get("pageSize"));
    return sendSuccess(response, 200, await searchProducts({ categoryId, q, filters, page, pageSize }));
  }

  if (request.method === "POST" && url.pathname === "/api/products") {
    const body = await readJson(request);
    return sendSuccess(response, 201, await createProduct(body));
  }

  if (request.method === "PUT" && url.pathname.startsWith("/api/products/")) {
    const productId = url.pathname.split("/").pop();
    const body = await readJson(request);
    return sendSuccess(response, 200, await updateProduct(productId, body));
  }

  if (request.method === "GET" && url.pathname.startsWith("/api/products/")) {
    const productId = url.pathname.split("/").pop();
    const product = await getProduct(productId);
    return product
      ? sendSuccess(response, 200, product)
      : sendError(response, 404, "Product not found.");
  }

  return false;
}
