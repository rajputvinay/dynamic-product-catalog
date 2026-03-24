import { getDb } from "../lib/db.js";

const collectionName = "products";
const projection = { _id: 0 };

export async function initializeProductModel() {
  const collection = await getProductCollection();
  await Promise.all([
    collection.createIndex({ id: 1 }, { unique: true }),
    collection.createIndex({ sku: 1 }, { unique: true, sparse: true }),
    collection.createIndex({ categoryId: 1 })
  ]);
}

export async function insertProduct(product) {
  const collection = await getProductCollection();
  await collection.insertOne(product);
  return product;
}

export async function replaceProduct(id, product) {
  const collection = await getProductCollection();
  await collection.replaceOne({ id }, product);
  return product;
}

export async function findProductById(id) {
  const collection = await getProductCollection();
  return collection.findOne({ id }, { projection });
}

export async function findProductsByCategory(categoryId) {
  const collection = await getProductCollection();
  const query = categoryId ? { categoryId } : {};
  return collection.find(query, { projection }).toArray();
}

export async function findProductsByIds(ids) {
  if (!ids.length) {
    return [];
  }

  const collection = await getProductCollection();
  return collection.find({ id: { $in: ids } }, { projection }).toArray();
}

export async function listAllProducts() {
  const collection = await getProductCollection();
  return collection.find({}, { projection }).toArray();
}

async function getProductCollection() {
  const db = await getDb();
  return db.collection(collectionName);
}
