const API_BASE = 'http://localhost:8000';

/**
 * Generic POST request handler
 * @param {string} path - The API endpoint (e.g., '/v1/scan')
 * @param {object} body - The JSON payload to send
 */
export async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    // Try to parse error as JSON if possible, otherwise use raw text
    try {
        const errorData = JSON.parse(text);
        throw new Error(errorData.detail || `POST ${path} failed (${res.status})`);
    } catch (e) {
        throw new Error(text || `POST ${path} failed (${res.status})`);
    }
  }
  return res.json();
}

/**
 * Generic GET request handler
 * @param {string} path - The API endpoint with query params (e.g., '/v1/scans?limit=20')
 */
export async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`, {
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `GET ${path} failed (${res.status})`);
  }
  return res.json();
}