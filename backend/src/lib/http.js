export function sendSuccess(response, statusCode, data) {
  return sendJson(response, statusCode, { status: "success", data });
}

export function sendError(response, statusCode, message) {
  return sendJson(response, statusCode, { status: "error", message });
}

export function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": "application/json" });
  response.end(JSON.stringify(payload, null, 2));
}

export function setCorsHeaders(response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export function parseFilters(rawValue) {
  if (!rawValue) {
    return {};
  }

  const parsed = JSON.parse(rawValue);
  return Object.fromEntries(
    Object.entries(parsed).map(([key, value]) => [key, Array.isArray(value) ? value : [value]])
  );
}

export function parsePositiveInt(rawValue) {
  const parsed = Number.parseInt(rawValue || "", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

export function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
    });

    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON payload."));
      }
    });

    request.on("error", reject);
  });
}
