import {
  createCategory,
  getCategory,
  listCategories,
  updateCategory
} from "../lib/catalog.js";
import {
  parsePositiveInt,
  readJson,
  sendError,
  sendSuccess
} from "../lib/http.js";

export async function handleCategoryRoutes(request, response, url) {
  if (request.method === "GET" && url.pathname === "/api/categories") {
    const q = url.searchParams.get("q") || "";
    const schemaFilter = url.searchParams.get("schemaFilter") || "";
    const page = parsePositiveInt(url.searchParams.get("page"));
    const pageSize = parsePositiveInt(url.searchParams.get("pageSize"));
    return sendSuccess(response, 200, await listCategories({ q, schemaFilter, page, pageSize }));
  }

  if (request.method === "POST" && url.pathname === "/api/categories") {
    const body = await readJson(request);
    return sendSuccess(response, 201, await createCategory(body));
  }

  if (request.method === "PUT" && url.pathname.startsWith("/api/categories/")) {
    const categoryId = url.pathname.split("/").pop();
    const body = await readJson(request);
    return sendSuccess(response, 200, await updateCategory(categoryId, body));
  }

  if (request.method === "GET" && url.pathname.startsWith("/api/categories/")) {
    const categoryId = url.pathname.split("/").pop();
    const category = await getCategory(categoryId);
    return category
      ? sendSuccess(response, 200, category)
      : sendError(response, 404, "Category not found.");
  }

  return false;
}
