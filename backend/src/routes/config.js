import { getDbName, getMongoUri } from "../lib/db.js";
import { sendSuccess } from "../lib/http.js";

const mongoUri = getMongoUri();
const dbName = getDbName();
const port = Number(process.env.PORT || 4000);

export async function handleConfigRoutes(request, response, url) {
  if (request.method === "GET" && url.pathname === "/api/config") {
    return sendSuccess(response, 200, { port, mongoUri, dbName });
  }

  return false;
}
