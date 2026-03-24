import http from "node:http";
import { initializeCatalogStore } from "./lib/catalog.js";
import { getDbName, getMongoUri } from "./lib/db.js";
import { sendError, setCorsHeaders } from "./lib/http.js";
import { routeRequest } from "./routes/index.js";

const port = Number(process.env.PORT || 4000);
const mongoUri = getMongoUri();
const dbName = getDbName();

const server = http.createServer(async (request, response) => {
  try {
    setCorsHeaders(response);

    if (request.method === "OPTIONS") {
      response.writeHead(204);
      response.end();
      return;
    }

    const url = new URL(request.url, `http://${request.headers.host}`);
    const handled = await routeRequest(request, response, url);

    if (!handled) {
      sendError(response, 404, "Route not found.");
    }
  } catch (error) {
    sendError(response, 400, error.message || "Unexpected error.");
  }
});

startServer();

async function startServer() {
  try {
    await initializeCatalogStore();
    server.listen(port, () => {
      console.log(`Dynamic catalog API listening on http://localhost:${port}`);
      console.log(`Mongo URI configured: ${mongoUri}`);
      console.log(`Mongo database configured: ${dbName}`);
    });
  } catch (error) {
    console.error("Failed to initialize MongoDB.", error);
    process.exit(1);
  }
}
