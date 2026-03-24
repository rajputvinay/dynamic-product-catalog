import { handleCategoryRoutes } from "./categories.js";
import { handleConfigRoutes } from "./config.js";
import { handleProductRoutes } from "./products.js";

const routeHandlers = [
  handleCategoryRoutes,
  handleProductRoutes,
  handleConfigRoutes
];

export async function routeRequest(request, response, url) {
  for (const handler of routeHandlers) {
    const handled = await handler(request, response, url);
    if (handled !== false) {
      return true;
    }
  }

  return false;
}
