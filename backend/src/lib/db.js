import "dotenv/config";
import { MongoClient } from "mongodb";
const defaultMongoUri = "mongodb://127.0.0.1:27017/dynamic-catalog";
const mongoUri = process.env.MONGO_URI || defaultMongoUri;
const dbName = process.env.MONGO_DB_NAME || extractDbName(mongoUri) || "dynamic-catalog";

let clientPromise;

export function getMongoUri() {
  return mongoUri;
}

export function getDbName() {
  return dbName;
}

export async function getDb() {
  if (!clientPromise) {
    const client = new MongoClient(mongoUri);
    clientPromise = client.connect();
  }

  const client = await clientPromise;
  return client.db(dbName);
}

function extractDbName(uri) {
  try {
    const parsed = new URL(uri);
    const pathname = parsed.pathname.replace(/^\/+/, "");
    return pathname || null;
  } catch {
    return null;
  }
}
