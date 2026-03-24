import "dotenv/config";
import { Client } from "@elastic/elasticsearch";

const elasticNode = process.env.ELASTICSEARCH_NODE || "";
const elasticUsername = process.env.ELASTICSEARCH_USERNAME || "";
const elasticPassword = process.env.ELASTICSEARCH_PASSWORD || "";
const elasticIndex = process.env.ELASTICSEARCH_INDEX || "products";

let client;
let elasticEnabled = Boolean(elasticNode);

export function isElasticEnabled() {
  return elasticEnabled;
}

export function getElasticConfig() {
  return {
    node: elasticNode,
    index: elasticIndex,
    enabled: elasticEnabled
  };
}

export async function initializeElastic() {
  if (!elasticEnabled) {
    return false;
  }

  const esClient = getClient();

  try {
    await esClient.info();
    await ensureIndex(esClient);
    return true;
  } catch (error) {
    elasticEnabled = false;
    console.warn("Elasticsearch disabled. Falling back to Mongo search.", error.message || error);
    return false;
  }
}

export async function syncProductsToElastic(products) {
  if (!elasticEnabled || !products.length) {
    return;
  }

  const esClient = getClient();
  const operations = products.flatMap((product) => [
    { index: { _index: elasticIndex, _id: product.id } },
    buildSearchDocument(product)
  ]);

  await esClient.bulk({ operations, refresh: true });
}

export async function indexProduct(product) {
  if (!elasticEnabled) {
    return;
  }

  const esClient = getClient();
  await esClient.index({
    index: elasticIndex,
    id: product.id,
    document: buildSearchDocument(product),
    refresh: true
  });
}

export async function searchProductIds({ categoryId, q = "", filters = {} }) {
  if (!elasticEnabled) {
    return null;
  }

  const esClient = getClient();
  const must = [];
  const filter = [];

  if (q.trim()) {
    must.push({
      multi_match: {
        query: q,
        fields: ["title^3", "brand^2", "summary^2", "searchableText"],
        fuzziness: "AUTO"
      }
    });
  }

  if (categoryId) {
    filter.push({ term: { categoryId } });
  }

  for (const [key, values] of Object.entries(filters)) {
    if (!Array.isArray(values) || !values.length) {
      continue;
    }

    filter.push({ terms: { [`attributes.${key}.keyword`]: values } });
  }

  const query = {
    bool: {
      must: must.length ? must : [{ match_all: {} }],
      filter
    }
  };

  const response = await esClient.search({
    index: elasticIndex,
    size: 1000,
    query,
    sort: must.length ? [{ _score: "desc" }] : [{ title: "asc" }],
    _source: false
  });

  return response.hits.hits.map((hit) => hit._id);
}

function getClient() {
  if (!client) {
    const auth = elasticUsername && elasticPassword
      ? { username: elasticUsername, password: elasticPassword }
      : undefined;

    client = new Client({
      node: elasticNode,
      auth
    });
  }

  return client;
}

async function ensureIndex(esClient) {
  const exists = await esClient.indices.exists({ index: elasticIndex });
  if (exists) {
    return;
  }

  await esClient.indices.create({
    index: elasticIndex,
    mappings: {
      properties: {
        id: { type: "keyword" },
        categoryId: { type: "keyword" },
        title: { type: "text", fields: { keyword: { type: "keyword" } } },
        sku: { type: "keyword" },
        brand: { type: "text", fields: { keyword: { type: "keyword" } } },
        summary: { type: "text" },
        currency: { type: "keyword" },
        price: { type: "double" },
        attributes: { type: "object", dynamic: true },
        searchableText: { type: "text" }
      }
    }
  });
}

function buildSearchDocument(product) {
  return {
    id: product.id,
    categoryId: product.categoryId,
    title: product.title,
    sku: product.sku,
    brand: product.brand,
    summary: product.summary,
    currency: product.currency,
    price: product.price,
    attributes: product.attributes || {},
    searchableText: buildSearchableText(product)
  };
}

function buildSearchableText(product) {
  const attributeValues = Object.values(product.attributes || {});
  const contentValues = Object.values(product.content || {}).flatMap((value) => {
    if (Array.isArray(value)) {
      return value.map((entry) => (typeof entry === "object" ? Object.values(entry).join(" ") : String(entry)));
    }

    return [String(value || "")];
  });

  return [product.title, product.brand, product.summary, ...attributeValues, ...contentValues]
    .filter(Boolean)
    .join(" ");
}
