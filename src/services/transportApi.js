/*
 * KrishiSetu Phase 2
 * Shared transport API layer.
 *
 * This file intentionally keeps the API surface small:
 * - transporter auth/profile
 * - transporter availability/location
 * - transport request CRUD actions
 * - trip status
 * - rating
 *
 * Backend route names mirror the routes already present in server/server.js.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const error = new Error(
      data?.message ||
        data?.error ||
        `Request failed with status ${response.status}`
    );

    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

function buildQuery(params = {}) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  });

  const query = search.toString();
  return query ? `?${query}` : "";
}

/* -------------------------------------------------------------------------- */
/* Auth                                                                       */
/* -------------------------------------------------------------------------- */

export async function registerTransporter(payload) {
  return request("/api/transporters/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function loginTransporter(phone, password) {
  return request("/api/transporters/login", {
    method: "POST",
    body: JSON.stringify({
      phone,
      password,
    }),
  });
}

export async function getTransporter(transporterId) {
  if (!transporterId) throw new Error("Transporter ID is required.");

  return request(
    `/api/transporters/${encodeURIComponent(transporterId)}`
  );
}

export async function getTransporterProfile(transporterId) {
  if (!transporterId) throw new Error("Transporter ID is required.");

  return request(
    `/api/transporters/${encodeURIComponent(transporterId)}/profile`
  );
}

/* -------------------------------------------------------------------------- */
/* Transporter presence                                                       */
/* -------------------------------------------------------------------------- */

export async function updateTransporterAvailability(
  transporterId,
  isOnline,
  location = {}
) {
  if (!transporterId) throw new Error("Transporter ID is required.");

  return request(
    `/api/transporters/${encodeURIComponent(transporterId)}/availability`,
    {
      method: "PATCH",
      body: JSON.stringify({
        isOnline: Boolean(isOnline),
        ...location,
      }),
    }
  );
}

export async function updateTransporterLocation(
  transporterId,
  latitude,
  longitude
) {
  if (!transporterId) throw new Error("Transporter ID is required.");

  return request(
    `/api/transporters/${encodeURIComponent(transporterId)}/location`,
    {
      method: "PATCH",
      body: JSON.stringify({
        latitude,
        longitude,
      }),
    }
  );
}

/* -------------------------------------------------------------------------- */
/* Transport requests                                                         */
/* -------------------------------------------------------------------------- */

export async function createTransportRequest(payload) {
  return request("/api/transport/requests", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getTransportRequests(params = {}) {
  return request(`/api/transport/requests${buildQuery(params)}`);
}

export async function getTransportRequest(requestId) {
  if (!requestId) throw new Error("Transport request ID is required.");

  return request(
    `/api/transport/requests/${encodeURIComponent(requestId)}`
  );
}

export async function acceptTransportRequest(requestId, transporterId) {
  if (!requestId) throw new Error("Transport request ID is required.");
  if (!transporterId) throw new Error("Transporter ID is required.");

  return request(
    `/api/transport/requests/${encodeURIComponent(requestId)}/accept`,
    {
      method: "PATCH",
      body: JSON.stringify({
        transporterId,
      }),
    }
  );
}

export async function rejectTransportRequest(requestId, transporterId, reason = "") {
  if (!requestId) throw new Error("Transport request ID is required.");
  if (!transporterId) throw new Error("Transporter ID is required.");

  return request(
    `/api/transport/requests/${encodeURIComponent(requestId)}/reject`,
    {
      method: "PATCH",
      body: JSON.stringify({
        transporterId,
        reason: reason || undefined,
      }),
    }
  );
}

export async function updateTransportRequest(requestId, payload) {
  if (!requestId) throw new Error("Transport request ID is required.");

  return request(
    `/api/transport/requests/${encodeURIComponent(requestId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
}

export async function cancelTransportRequest(requestId, payload = {}) {
  if (!requestId) throw new Error("Transport request ID is required.");

  return request(
    `/api/transport/requests/${encodeURIComponent(requestId)}/cancel`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
}

/* -------------------------------------------------------------------------- */
/* Trip state                                                                 */
/* -------------------------------------------------------------------------- */

export async function updateTransportStatus(
  requestId,
  transporterId,
  status,
  extra = {}
) {
  if (!requestId) throw new Error("Transport request ID is required.");
  if (!transporterId) throw new Error("Transporter ID is required.");
  if (!status) throw new Error("Transport status is required.");

  return request(
    `/api/transport/requests/${encodeURIComponent(requestId)}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({
        transporterId,
        status,
        ...extra,
      }),
    }
  );
}

/* -------------------------------------------------------------------------- */
/* Rating                                                                     */
/* -------------------------------------------------------------------------- */

export async function rateTransportRequest(
  requestId,
  rating,
  comment = "",
  farmerId = ""
) {
  if (!requestId) throw new Error("Transport request ID is required.");

  return request(
    `/api/transport/requests/${encodeURIComponent(requestId)}/rating`,
    {
      method: "POST",
      body: JSON.stringify({
        rating,
        comment: comment || undefined,
        farmerId: farmerId || undefined,
      }),
    }
  );
}

/* -------------------------------------------------------------------------- */
/* Convenience helpers                                                        */
/* -------------------------------------------------------------------------- */

export function getStoredFarmer() {
  try {
    return JSON.parse(localStorage.getItem("krishisetu_farmer") || "null");
  } catch {
    return null;
  }
}

export function getStoredTransporter() {
  try {
    return JSON.parse(
      localStorage.getItem("krishisetu_transporter") || "null"
    );
  } catch {
    return null;
  }
}

export function getFarmerId(farmer = getStoredFarmer()) {
  return (
    farmer?.id ||
    farmer?.farmerId ||
    farmer?.farmer_id ||
    localStorage.getItem("farmer_id") ||
    ""
  );
}

export function getTransporterId(
  transporter = getStoredTransporter()
) {
  return (
    transporter?.id ||
    transporter?.transporterId ||
    transporter?.transporter_id ||
    localStorage.getItem("transporter_id") ||
    ""
  );
}

export function normalizeTransportResponse(payload) {
  if (!payload) return null;

  return (
    payload.request ||
    payload.transportRequest ||
    payload.transport_request ||
    payload.transporter ||
    payload.data ||
    payload
  );
}

export function normalizeTransportList(payload) {
  if (Array.isArray(payload)) return payload;

  if (Array.isArray(payload?.requests)) {
    return payload.requests;
  }

  if (Array.isArray(payload?.transportRequests)) {
    return payload.transportRequests;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
}

export function openGoogleMaps(destination) {
  if (!destination) return false;

  let query = destination;

  if (
    typeof destination === "object" &&
    destination.lat != null &&
    destination.lng != null
  ) {
    query = `${destination.lat},${destination.lng}`;
  }

  window.open(
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      String(query)
    )}`,
    "_blank",
    "noopener,noreferrer"
  );

  return true;
}

export function callPhone(phone) {
  if (!phone) return false;

  window.location.href = `tel:${String(phone).replace(/\s+/g, "")}`;
  return true;
}

export const TRANSPORT_STATUS = Object.freeze({
  REQUESTED: "REQUESTED",
  ASSIGNED: "ASSIGNED",
  EN_ROUTE_TO_FARMER: "EN_ROUTE_TO_FARMER",
  CROP_PICKED_UP: "CROP_PICKED_UP",
  EN_ROUTE_TO_CENTER: "EN_ROUTE_TO_CENTER",
  DELIVERED: "DELIVERED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  REJECTED: "REJECTED",
});

export const TRANSPORT_STATUS_ORDER = Object.freeze([
  TRANSPORT_STATUS.REQUESTED,
  TRANSPORT_STATUS.ASSIGNED,
  TRANSPORT_STATUS.EN_ROUTE_TO_FARMER,
  TRANSPORT_STATUS.CROP_PICKED_UP,
  TRANSPORT_STATUS.EN_ROUTE_TO_CENTER,
  TRANSPORT_STATUS.DELIVERED,
  TRANSPORT_STATUS.COMPLETED,
]);

export default {
  registerTransporter,
  loginTransporter,
  getTransporter,
  getTransporterProfile,
  updateTransporterAvailability,
  updateTransporterLocation,
  createTransportRequest,
  getTransportRequests,
  getTransportRequest,
  acceptTransportRequest,
  rejectTransportRequest,
  updateTransportRequest,
  cancelTransportRequest,
  updateTransportStatus,
  rateTransportRequest,
  getStoredFarmer,
  getStoredTransporter,
  getFarmerId,
  getTransporterId,
  normalizeTransportResponse,
  normalizeTransportList,
  openGoogleMaps,
  callPhone,
  TRANSPORT_STATUS,
  TRANSPORT_STATUS_ORDER,
};
