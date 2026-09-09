/*
 * KrishiSetu Phase 2
 * Shared GPS + location helper.
 *
 * Important:
 * Browser GPS returns coordinates only.
 * Reverse geocoding is optional and depends on the configured provider.
 * The helper returns partial data safely when reverse geocoding is unavailable.
 */

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";

function buildApiUrl(path) {
  const base = import.meta.env.VITE_API_BASE_URL || "";
  return `${base}${path}`;
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeReverseLocation(payload) {
  const address = payload?.address || {};

  return {
    latitude: toNumber(payload?.lat),
    longitude: toNumber(payload?.lon),
    displayName: payload?.display_name || "",
    address: payload?.display_name || "",
    village:
      address.village ||
      address.hamlet ||
      address.town ||
      address.city_district ||
      "",
    district:
      address.state_district ||
      address.district ||
      address.county ||
      "",
    state: address.state || "",
    stateCode: address["ISO3166-2-lvl4"] || "",
    pincode: address.postcode || "",
    country: address.country || "",
    countryCode: address.country_code || "",
  };
}

export function isGeolocationSupported() {
  return (
    typeof navigator !== "undefined" &&
    "geolocation" in navigator
  );
}

export function getCurrentLocation(options = {}) {
  const settings = {
    enableHighAccuracy: true,
    timeout: 12000,
    maximumAge: 30000,
    ...options,
  };

  return new Promise((resolve, reject) => {
    if (!isGeolocationSupported()) {
      const error = new Error("Geolocation is not supported on this device.");
      error.code = "NOT_SUPPORTED";
      reject(error);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const {
          latitude,
          longitude,
          accuracy,
          altitude,
          heading,
          speed,
        } = position.coords;

        resolve({
          latitude,
          longitude,
          accuracy: accuracy ?? null,
          altitude: altitude ?? null,
          heading: heading ?? null,
          speed: speed ?? null,
          timestamp: position.timestamp,
        });
      },
      (geoError) => {
        const error = new Error(
          geoError?.message || "Unable to determine current location."
        );

        error.code =
          geoError?.code === 1
            ? "PERMISSION_DENIED"
            : geoError?.code === 2
              ? "POSITION_UNAVAILABLE"
              : geoError?.code === 3
                ? "TIMEOUT"
                : "UNKNOWN";

        error.original = geoError;
        reject(error);
      },
      settings
    );
  });
}

export async function reverseGeocode(
  latitude,
  longitude,
  options = {}
) {
  const lat = toNumber(latitude);
  const lng = toNumber(longitude);

  if (lat === null || lng === null) {
    throw new Error("Valid latitude and longitude are required.");
  }

  /*
   * Project backend can later expose:
   * GET /api/location/reverse?lat=...&lng=...
   *
   * Set VITE_LOCATION_REVERSE_ENDPOINT to use that backend endpoint.
   */
  const backendPath = import.meta.env.VITE_LOCATION_REVERSE_ENDPOINT;

  if (backendPath) {
    const query = new URLSearchParams({
      lat: String(lat),
      lng: String(lng),
    });

    const response = await fetch(
      buildApiUrl(`${backendPath}?${query.toString()}`),
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Reverse geocoding failed with status ${response.status}.`
      );
    }

    const payload = await response.json();
    return normalizeReverseLocation(payload);
  }

  /*
   * Demo/development fallback:
   * OpenStreetMap Nominatim works without an API key.
   * For production, configure a permitted geocoder/backend proxy and
   * respect that provider's usage policy.
   */
  const query = new URLSearchParams({
    format: "jsonv2",
    lat: String(lat),
    lon: String(lng),
    zoom: String(options.zoom || 18),
    addressdetails: "1",
  });

  const response = await fetch(`${NOMINATIM_URL}?${query.toString()}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Reverse geocoding failed with status ${response.status}.`
    );
  }

  const payload = await response.json();
  return normalizeReverseLocation(payload);
}

export async function getCurrentLocationWithAddress(options = {}) {
  const coordinates = await getCurrentLocation(options);

  try {
    const location = await reverseGeocode(
      coordinates.latitude,
      coordinates.longitude,
      options
    );

    return {
      ...coordinates,
      ...location,
    };
  } catch (error) {
    /*
     * GPS itself is still useful even if reverse geocoding fails.
     * Return coordinates and mark address as unavailable.
     */
    return {
      ...coordinates,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      address: "",
      displayName: "",
      village: "",
      district: "",
      state: "",
      stateCode: "",
      pincode: "",
      country: "",
      countryCode: "",
      reverseGeocodeError: error?.message || "Reverse geocoding unavailable.",
    };
  }
}

export function formatCoordinates(latitude, longitude, decimals = 5) {
  const lat = toNumber(latitude);
  const lng = toNumber(longitude);

  if (lat === null || lng === null) return "";

  return `${lat.toFixed(decimals)}, ${lng.toFixed(decimals)}`;
}

export function hasCoordinates(location) {
  return (
    toNumber(location?.latitude ?? location?.lat) !== null &&
    toNumber(location?.longitude ?? location?.lng) !== null
  );
}

export function openLocationInMaps(latitude, longitude, address = "") {
  const lat = toNumber(latitude);
  const lng = toNumber(longitude);

  const query =
    lat !== null && lng !== null
      ? `${lat},${lng}`
      : address;

  if (!query || typeof window === "undefined") {
    return false;
  }

  window.open(
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      query
    )}`,
    "_blank",
    "noopener,noreferrer"
  );

  return true;
}

export function openDirectionsInMaps(
  fromLatitude,
  fromLongitude,
  toLatitude,
  toLongitude,
  destinationAddress = ""
) {
  const toLat = toNumber(toLatitude);
  const toLng = toNumber(toLongitude);

  if (toLat === null || toLng === null || typeof window === "undefined") {
    return false;
  }

  const destination = `${toLat},${toLng}`;

  const fromLat = toNumber(fromLatitude);
  const fromLng = toNumber(fromLongitude);

  const params = new URLSearchParams({
    api: "1",
    destination,
  });

  if (fromLat !== null && fromLng !== null) {
    params.set("origin", `${fromLat},${fromLng}`);
  }

  if (destinationAddress) {
    params.set("destination", destinationAddress);
  }

  window.open(
    `https://www.google.com/maps/dir/?${params.toString()}`,
    "_blank",
    "noopener,noreferrer"
  );

  return true;
}

export function getLocationErrorMessage(error) {
  switch (error?.code) {
    case "PERMISSION_DENIED":
      return "Location permission was denied. Please allow location access or enter the address manually.";
    case "POSITION_UNAVAILABLE":
      return "Your current location could not be determined. Check GPS/network and try again.";
    case "TIMEOUT":
      return "Location request timed out. Please try again.";
    case "NOT_SUPPORTED":
      return "This browser or device does not support GPS location.";
    default:
      return error?.message || "Unable to get your current location.";
  }
}

export default {
  isGeolocationSupported,
  getCurrentLocation,
  reverseGeocode,
  getCurrentLocationWithAddress,
  formatCoordinates,
  hasCoordinates,
  openLocationInMaps,
  openDirectionsInMaps,
  getLocationErrorMessage,
};
