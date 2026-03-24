export const routes = {
  categories: "/categories",
  addCategory: "/categories/new",
  editCategory: "/categories/edit",
  products: "/products",
  addProduct: "/products/new",
  editProduct: "/products/edit"
};

export function normalizePath(pathname) {
  if (!pathname || pathname === "/") {
    return routes.categories;
  }

  if (Object.values(routes).includes(pathname)) {
    return pathname;
  }

  return routes.categories;
}
