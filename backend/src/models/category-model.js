import { getDb } from "../lib/db.js";

const collectionName = "categories";
const projection = { _id: 0 };

export async function initializeCategoryModel() {
  const collection = await getCategoryCollection();
  await collection.createIndex({ id: 1 }, { unique: true });
  await collection.createIndex({ name: 1 });
  await collection.createIndex({ slug: 1 });
}

export async function listCategories({ q = "", schemaFilter = "" } = {}) {
  const collection = await getCategoryCollection();
  const query = buildCategoryQuery(q);
  const categories = await collection.find(query, { projection }).toArray();
  return categories.filter((category) => matchesSchemaFilter(category, schemaFilter));
}

export async function findCategoryById(id) {
  const collection = await getCategoryCollection();
  return collection.findOne({ id }, { projection });
}

export async function findCategoriesByIds(ids) {
  if (!ids.length) {
    return [];
  }

  const collection = await getCategoryCollection();
  return collection.find({ id: { $in: ids } }, { projection }).toArray();
}

export async function insertCategory(category) {
  const collection = await getCategoryCollection();
  await collection.insertOne(category);
  return category;
}

export async function replaceCategory(id, category) {
  const collection = await getCategoryCollection();
  await collection.replaceOne({ id }, category);
  return category;
}

function buildCategoryQuery(q) {
  const normalizedQuery = q.trim();
  if (!normalizedQuery) {
    return {};
  }

  return {
    $or: [
      { name: { $regex: normalizedQuery, $options: "i" } },
      { slug: { $regex: normalizedQuery, $options: "i" } },
      { description: { $regex: normalizedQuery, $options: "i" } }
    ]
  };
}

function matchesSchemaFilter(category, schemaFilter) {
  if (!schemaFilter) {
    return true;
  }

  const attributeCount = (category.attributeGroups || []).reduce(
    (count, group) => count + (group.attributes || []).length,
    0
  );

  if (schemaFilter === "3+") {
    return attributeCount >= 3;
  }

  if (schemaFilter === "1-2") {
    return attributeCount >= 1 && attributeCount <= 2;
  }

  return true;
}

async function getCategoryCollection() {
  const db = await getDb();
  return db.collection(collectionName);
}
