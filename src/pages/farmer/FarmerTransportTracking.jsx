
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useLanguage } from "../../translations/LanguageContext";

const RAW_API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "";

const API_BASE = String(RAW_API_BASE)
  .trim()
  .replace(/\/+$/, "")
  .replace(/\/api$/i, "");

const COPY = {
  en: {
    title: "Transport Tracking",
    subtitle: "Follow your crop from pickup to the procurement center.",
    loading: "Loading trip...",
    refresh: "Refresh",
    back: "Back",
    logistics: "Logistics",
    call: "Call",
    maps: "Maps",
    pickup: "Pickup",
    center: "Procurement Center",
    transporter: "Transporter",
    vehicle: "Vehicle",
    quantity: "Quantity",
    crop: "Crop",
    request: "Request",
    status: "Status",
    eta: "ETA",
    updated: "Last updated",
    date: "Pickup date",
    time: "Pickup time",
    fare: "Transport fare",
    farePending: "Fare to be agreed",
    estimatedFare: "Estimated fare",
    finalFare: "Final fare",
    noLocation: "Transporter location is not available yet.",
    waiting: "Waiting for transporter assignment",
    assigned: "Transporter assigned",
    enRouteFarmer: "Transporter is on the way to your farm",
    pickedUp: "Crop picked up",
    enRouteCenter: "Crop is on the way to the procurement center",
    delivered: "Delivered to procurement center",
    completed: "Transport completed",
    cancelled: "Transport cancelled",
    rejected: "Request rejected",
    unknown: "Status unavailable",
    timeline: "Trip progress",
    details: "Trip details",
    live: "Live",
    openMaps: "Open in Maps",
    noTrip: "Transport request not found.",
    server: "Unable to load the transport request.",
    network: "Network error. Please try again.",
    retry: "Try again",
    rate: "Rate transporter",
    ratingSaved: "Thank you. Your rating was submitted.",
    ratingQuestion: "How was your transport experience?",
    comment: "Comment (optional)",
    submitRating: "Submit rating",
    close: "Close",
    ratingError: "Could not submit the rating.",
    home: "Farmer dashboard"
  },
  hi: {
    title: "परिवहन ट्रैकिंग",
    subtitle: "पिकअप से खरीद केंद्र तक अपनी फसल की यात्रा देखें।",
    loading: "यात्रा लोड हो रही है...",
    refresh: "रिफ्रेश",
    back: "पीछे",
    logistics: "लॉजिस्टिक्स",
    call: "कॉल",
    maps: "मैप",
    pickup: "पिकअप",
    center: "खरीद केंद्र",
    transporter: "ट्रांसपोर्टर",
    vehicle: "वाहन",
    quantity: "मात्रा",
    crop: "फसल",
    request: "अनुरोध",
    status: "स्थिति",
    eta: "अनुमानित समय",
    updated: "अंतिम अपडेट",
    date: "पिकअप तारीख",
    time: "पिकअप समय",
    fare: "परिवहन किराया",
    farePending: "किराया तय होना बाकी है",
    estimatedFare: "अनुमानित किराया",
    finalFare: "अंतिम किराया",
    noLocation: "अभी ट्रांसपोर्टर की लोकेशन उपलब्ध नहीं है।",
    waiting: "ट्रांसपोर्टर के चयन की प्रतीक्षा",
    assigned: "ट्रांसपोर्टर नियुक्त",
    enRouteFarmer: "ट्रांसपोर्टर आपके खेत की ओर आ रहा है",
    pickedUp: "फसल उठाई जा चुकी है",
    enRouteCenter: "फसल खरीद केंद्र की ओर जा रही है",
    delivered: "खरीद केंद्र पर पहुंच गई",
    completed: "परिवहन पूरा हुआ",
    cancelled: "परिवहन रद्द हुआ",
    rejected: "अनुरोध अस्वीकार हुआ",
    unknown: "स्थिति उपलब्ध नहीं",
    timeline: "यात्रा प्रगति",
    details: "यात्रा विवरण",
    live: "लाइव",
    openMaps: "मैप में खोलें",
    noTrip: "परिवहन अनुरोध नहीं मिला।",
    server: "परिवहन अनुरोध लोड नहीं हो सका।",
    network: "नेटवर्क त्रुटि। फिर से प्रयास करें।",
    retry: "फिर प्रयास करें",
    rate: "ट्रांसपोर्टर को रेट करें",
    ratingSaved: "धन्यवाद। आपकी रेटिंग भेज दी गई है।",
    ratingQuestion: "परिवहन का अनुभव कैसा रहा?",
    comment: "टिप्पणी (वैकल्पिक)",
    submitRating: "रेटिंग भेजें",
    close: "बंद करें",
    ratingError: "रेटिंग भेजी नहीं जा सकी।",
    home: "किसान डैशबोर्ड"
  },
  te: {
    title: "రవాణా ట్రాకింగ్",
    subtitle: "పికప్ నుండి కొనుగోలు కేంద్రం వరకు మీ పంట ప్రయాణాన్ని చూడండి.",
    loading: "ట్రిప్ లోడ్ అవుతోంది...",
    refresh: "రిఫ్రెష్",
    back: "వెనుకకు",
    logistics: "లాజిస్టిక్స్",
    call: "కాల్",
    maps: "మ్యాప్",
    pickup: "పికప్",
    center: "కొనుగోలు కేంద్రం",
    transporter: "రవాణాదారు",
    vehicle: "వాహనం",
    quantity: "పరిమాణం",
    crop: "పంట",
    request: "అభ్యర్థన",
    status: "స్థితి",
    eta: "అంచనా సమయం",
    updated: "చివరి అప్‌డేట్",
    date: "పికప్ తేదీ",
    time: "పికప్ సమయం",
    fare: "రవాణా ఛార్జీ",
    farePending: "ఛార్జీ ఇంకా నిర్ణయించలేదు",
    estimatedFare: "అంచనా ఛార్జీ",
    finalFare: "చివరి ఛార్జీ",
    noLocation: "రవాణాదారు స్థానం ఇంకా అందుబాటులో లేదు.",
    waiting: "రవాణాదారుని కేటాయించడానికి వేచి ఉంది",
    assigned: "రవాణాదారు కేటాయించబడ్డారు",
    enRouteFarmer: "రవాణాదారు మీ పొలం వైపు వస్తున్నారు",
    pickedUp: "పంట తీసుకున్నారు",
    enRouteCenter: "పంట కొనుగోలు కేంద్రం వైపు వెళుతోంది",
    delivered: "కొనుగోలు కేంద్రానికి చేరింది",
    completed: "రవాణా పూర్తయింది",
    cancelled: "రవాణా రద్దు చేయబడింది",
    rejected: "అభ్యర్థన తిరస్కరించబడింది",
    unknown: "స్థితి అందుబాటులో లేదు",
    timeline: "ప్రయాణ పురోగతి",
    details: "ప్రయాణ వివరాలు",
    live: "లైవ్",
    openMaps: "మ్యాప్‌లో తెరవండి",
    noTrip: "రవాణా అభ్యర్థన కనబడలేదు.",
    server: "రవాణా అభ్యర్థనను లోడ్ చేయలేకపోయాం.",
    network: "నెట్‌వర్క్ లోపం. మళ్లీ ప్రయత్నించండి.",
    retry: "మళ్లీ ప్రయత్నించండి",
    rate: "రవాణాదారుని రేట్ చేయండి",
    ratingSaved: "ధన్యవాదాలు. మీ రేటింగ్ పంపబడింది.",
    ratingQuestion: "మీ రవాణా అనుభవం ఎలా ఉంది?",
    comment: "వ్యాఖ్య (ఐచ్ఛికం)",
    submitRating: "రేటింగ్ పంపండి",
    close: "మూసివేయండి",
    ratingError: "రేటింగ్ పంపలేకపోయాం.",
    home: "రైతు డ్యాష్‌బోర్డ్"
  }
};

const STATUS_ORDER = [
  "REQUESTED",
  "ASSIGNED",
  "EN_ROUTE_TO_FARMER",
  "CROP_PICKED_UP",
  "EN_ROUTE_TO_CENTER",
  "DELIVERED",
  "COMPLETED"
];

const STATUS_TEXT = {
  REQUESTED: "waiting",
  ASSIGNED: "assigned",
  EN_ROUTE_TO_FARMER: "enRouteFarmer",
  CROP_PICKED_UP: "pickedUp",
  EN_ROUTE_TO_CENTER: "enRouteCenter",
  DELIVERED: "delivered",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  REJECTED: "rejected"
};

function extractRequest(payload) {
  return payload?.request ||
    payload?.transportRequest ||
    payload?.transport_request ||
    payload?.data ||
    payload ||
    null;
}

function normalizeTrip(raw) {
  if (!raw) return null;

  const transporter = raw.transporter || {};
  const farmer = raw.farmer || {};
  const center = raw.center || raw.procurementCenter || {};

  return {
    id: raw.id ?? raw.requestId ?? raw.request_id ?? "",
    status: String(raw.status || "REQUESTED").toUpperCase(),
    crop: raw.crop || raw.cropName || raw.crop_name || "",
    quantityKg: raw.quantityKg ?? raw.quantity_kg ?? raw.quantity ?? null,
    createdAt: raw.createdAt || raw.created_at || null,
    pickupDate: raw.pickupDate || raw.pickup_date || raw.scheduledDate || raw.scheduled_date || null,
    pickupTime: raw.pickupTime || raw.pickup_time || raw.scheduledTime || raw.scheduled_time || null,
    pickupAddress: raw.pickupAddress || raw.pickup_address || raw.address || "",
    pickupVillage: raw.pickupVillage || raw.pickup_village || raw.village || farmer.village || "",
    pickupDistrict: raw.pickupDistrict || raw.pickup_district || raw.district || farmer.district || "",
    pickupState: raw.pickupState || raw.pickup_state || raw.state || farmer.state || "",
    pickupLat: raw.pickupLat ?? raw.pickup_lat ?? raw.latitude ?? null,
    pickupLng: raw.pickupLng ?? raw.pickup_lng ?? raw.longitude ?? null,
    centerId: raw.centerId ?? raw.center_id ?? center.id ?? "",
    centerName: raw.centerName || raw.center_name || center.name || "",
    centerAddress: raw.centerAddress || raw.center_address || center.address || "",
    centerLat: raw.centerLat ?? raw.center_lat ?? center.lat ?? center.latitude ?? null,
    centerLng: raw.centerLng ?? raw.center_lng ?? center.lng ?? center.longitude ?? null,
    transporter: {
      id: transporter.id ?? raw.transporterId ?? raw.transporter_id ?? "",
      name: transporter.name || raw.transporterName || raw.transporter_name || "",
      phone: transporter.phone || transporter.mobile || raw.transporterPhone || "",
      vehicleType: transporter.vehicle_type || transporter.vehicleType || raw.vehicleType || "",
      vehicleNumber: transporter.vehicle_number || transporter.vehicleNumber || raw.vehicleNumber || "",
      lat: transporter.current_latitude ?? transporter.latitude ?? raw.transporterLat ?? raw.currentLat ?? null,
      lng: transporter.current_longitude ?? transporter.longitude ?? raw.transporterLng ?? raw.currentLng ?? null,
      locationUpdatedAt: transporter.location_updated_at || transporter.locationUpdatedAt || raw.locationUpdatedAt || null
    },
    eta: raw.eta || raw.etaMinutes || raw.estimatedArrival || raw.estimated_arrival || null,
    estimatedFare: raw.estimatedFare ?? raw.estimated_fare ?? null,
    finalFare: raw.finalFare ?? raw.final_fare ?? null,
    events: Array.isArray(raw.events) ? raw.events : Array.isArray(raw.transportEvents) ? raw.transportEvents : []
  };
}

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const error = new Error(data?.message || data?.error || "Request failed");
    error.status = response.status;
    throw error;
  }

  return data;
}

function displayStatus(status, t) {
  const key = STATUS_TEXT[status];
  return key ? t[key] : t.unknown;
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function formatUpdated(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default function FarmerTransportTracking() {
  const navigate = useNavigate();
  const { id: routeId } = useParams();
  const { language } = useLanguage();
  const t = COPY[COPY[language] ? language : "en"];

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ratingOpen, setRatingOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [ratingSaving, setRatingSaving] = useState(false);
  const [ratingMessage, setRatingMessage] = useState("");

  const loadTrip = async ({ silent = false } = {}) => {
    if (!routeId) {
      setError(t.noTrip);
      setLoading(false);
      return;
    }

    if (!silent) {
      setLoading(true);
    }
    setError("");

    try {
      const requestPayload = await api(
        `/api/transport/requests/${encodeURIComponent(routeId)}`
      );

      const request = extractRequest(requestPayload);

      if (!request) {
        setError(t.noTrip);
        setTrip(null);
        return;
      }

      let events = Array.isArray(request.events) ? request.events : [];
      let liveTracking = null;

      /*
       * The backend protects /tracking by farmer identity. The request
       * itself already contains farmer_id, so use that ID for the tracking
       * call instead of depending on a particular localStorage key.
       */
      const farmerId = String(
        request.farmer_id ||
        request.farmerId ||
        request.farmer?.id ||
        ""
      ).trim();

      const [eventsResult, trackingResult] = await Promise.allSettled([
        api(
          `/api/transport/requests/${encodeURIComponent(routeId)}/events`
        ),
        farmerId
          ? api(
              `/api/transport/requests/${encodeURIComponent(routeId)}/tracking?farmerId=${encodeURIComponent(
                farmerId
              )}`
            )
          : Promise.reject(new Error("Farmer identity unavailable"))
      ]);

      if (
        eventsResult.status === "fulfilled" &&
        Array.isArray(eventsResult.value?.events)
      ) {
        events = eventsResult.value.events;
      }

      if (trackingResult.status === "fulfilled") {
        liveTracking = trackingResult.value?.tracking || null;
      }

      const normalized = normalizeTrip({
        ...request,
        events
      });

      /*
       * Prefer the dedicated live-tracking endpoint because it is the
       * freshest transporter position. Fall back to request data when the
       * location service is temporarily unavailable.
       */
      if (liveTracking) {
        normalized.transporter = {
          ...normalized.transporter,
          id:
            liveTracking.transporterId ||
            normalized.transporter.id ||
            "",
          name:
            liveTracking.transporterName ||
            normalized.transporter.name ||
            "",
          phone:
            liveTracking.transporterPhone ||
            normalized.transporter.phone ||
            "",
          vehicleType:
            liveTracking.vehicleType ||
            normalized.transporter.vehicleType ||
            "",
          vehicleNumber:
            liveTracking.vehicleNumber ||
            normalized.transporter.vehicleNumber ||
            "",
          lat:
            liveTracking.lat ??
            normalized.transporter.lat ??
            null,
          lng:
            liveTracking.lng ??
            normalized.transporter.lng ??
            null,
          locationUpdatedAt:
            liveTracking.locationUpdatedAt ||
            normalized.transporter.locationUpdatedAt ||
            null
        };
      }

      setTrip(normalized);
    } catch (requestError) {
      console.error("Transport tracking load failed:", requestError);
      setError(requestError?.message || t.network);
      setTrip(null);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadTrip();
  }, [routeId]);

  useEffect(() => {
    if (!trip) return;
    if (["COMPLETED", "CANCELLED", "REJECTED"].includes(trip.status)) return;

    const interval = window.setInterval(
      () => loadTrip({ silent: true }),
      10000
    );

    return () => window.clearInterval(interval);
  }, [routeId, trip?.id, trip?.status]);

  const progressIndex = useMemo(() => {
    const index = STATUS_ORDER.indexOf(trip?.status);
    return index < 0 ? 0 : index;
  }, [trip?.status]);

  const progressWidth = `${Math.round((progressIndex / (STATUS_ORDER.length - 1)) * 100)}%`;

  const openMaps = (lat, lng, address) => {
    const query =
      lat != null && lng != null
        ? `${lat},${lng}`
        : address || "";
    if (!query) return;
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const callTransporter = () => {
    if (trip?.transporter?.phone) {
      window.location.href = `tel:${trip.transporter.phone}`;
    }
  };

  const submitRating = async () => {
    if (!trip?.id || !rating) return;

    setRatingSaving(true);
    try {
      await api(`/api/transport/requests/${encodeURIComponent(trip.id)}/rating`, {
        method: "POST",
        body: JSON.stringify({
          rating,
          review: comment.trim() || undefined
        })
      });
      setRatingMessage(t.ratingSaved);
      setRatingOpen(false);
    } catch (ratingError) {
      console.error("Rating failed:", ratingError);
      setRatingMessage(t.ratingError);
    } finally {
      setRatingSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="tracking-page">
        <style>{styles}</style>
        <div className="tracking-shell loading-state">
          <div className="spinner" />
          <p>{t.loading}</p>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="tracking-page">
        <style>{styles}</style>
        <div className="tracking-shell">
          <button className="back" onClick={() => navigate(-1)}>← {t.back}</button>
          <div className="error-card">
            <div className="error-icon">!</div>
            <h1>{t.noTrip}</h1>
            <p>{error || t.server}</p>
            <button className="primary" onClick={loadTrip}>{t.retry}</button>
          </div>
        </div>
      </div>
    );
  }

  const currentLocationAvailable =
    trip.transporter.lat != null && trip.transporter.lng != null;

  return (
    <div className="tracking-page">
      <style>{styles}</style>

      <div className="tracking-shell">
        <header className="tracking-header">
          <button className="back" onClick={() => navigate(-1)}>←</button>
          <div className="header-copy">
            <span className="eyebrow">KRISHISETU • LIVE LOGISTICS</span>
            <h1>{t.title}</h1>
            <p>{t.subtitle}</p>
          </div>
          <button className="refresh" onClick={loadTrip}>
            ↻ {t.refresh}
          </button>
        </header>

        <section className="status-hero">
          <div>
            <span className="eyebrow">{t.status}</span>
            <h2>{displayStatus(trip.status, t)}</h2>
            <p>
              {t.request} #{trip.id}
              {trip.transporter.locationUpdatedAt
                ? ` • ${t.updated}: ${formatUpdated(trip.transporter.locationUpdatedAt)}`
                : ""}
            </p>
          </div>

          <span className={`status-pill status-${trip.status.toLowerCase()}`}>
            {trip.status === "COMPLETED" ? "✓" : "●"} {displayStatus(trip.status, t)}
          </span>
        </section>

        {!["COMPLETED", "CANCELLED", "REJECTED"].includes(trip.status) && (
          <section className="progress-card">
            <div className="progress-line">
              <div style={{ width: progressWidth }} />
            </div>

            <div className="progress-points">
              {STATUS_ORDER.map((status, index) => (
                <div
                  key={status}
                  className={index <= progressIndex ? "point reached" : "point"}
                >
                  <span>{index < progressIndex ? "✓" : index + 1}</span>
                  <small>{displayStatus(status, t)}</small>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="main-grid">
          <div className="left-column">
            <section className="card transporter-card">
              <div className="card-heading">
                <div>
                  <span className="eyebrow">{t.transporter}</span>
                  <h3>{trip.transporter.name || "—"}</h3>
                </div>
                {trip.transporter.name ? <span className="live-dot">● {t.live}</span> : null}
              </div>

              <div className="transporter-meta">
                <div><small>{t.vehicle}</small><strong>{trip.transporter.vehicleType || "—"}</strong></div>
                <div><small>Number</small><strong>{trip.transporter.vehicleNumber || "—"}</strong></div>
                <div><small>{t.eta}</small><strong>{trip.eta || "—"}</strong></div>
              </div>

              <div className="button-row">
                {trip.transporter.phone && (
                  <button className="primary" onClick={callTransporter}>☎ {t.call}</button>
                )}
                {currentLocationAvailable && (
                  <button
                    className="secondary"
                    onClick={() => openMaps(trip.transporter.lat, trip.transporter.lng)}
                  >
                    ⌖ {t.openMaps}
                  </button>
                )}
              </div>
            </section>

            <section className="card">
              <div className="card-heading">
                <div>
                  <span className="eyebrow">{t.timeline}</span>
                  <h3>{t.details}</h3>
                </div>
              </div>

              <div className="timeline">
                {STATUS_ORDER.map((status, index) => {
                  const active = index <= progressIndex;
                  const current = status === trip.status;
                  return (
                    <div className={active ? "timeline-row reached" : "timeline-row"} key={status}>
                      <div className="timeline-marker">
                        <span>{active && index < progressIndex ? "✓" : index + 1}</span>
                      </div>
                      <div className="timeline-copy">
                        <strong>{displayStatus(status, t)}</strong>
                        {current ? <small>{t.live}</small> : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {trip.events.length > 0 && (
              <section className="card event-card">
                <div className="card-heading">
                  <div>
                    <span className="eyebrow">EVENTS</span>
                    <h3>{t.timeline}</h3>
                  </div>
                </div>
                <div className="events">
                  {trip.events.slice().reverse().map((event, index) => (
                    <div className="event" key={event.id || index}>
                      <strong>{event.status || event.event || "Update"}</strong>
                      <small>
                        {formatUpdated(event.created_at || event.createdAt || event.timestamp)}
                      </small>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="right-column">
            <section className="card">
              <span className="eyebrow">{t.crop}</span>
              <div className="crop-title">
                <h3>{trip.crop || "—"}</h3>
                <strong>{trip.quantityKg != null ? `${Number(trip.quantityKg).toLocaleString()} kg` : "—"}</strong>
              </div>
            </section>

            <section className="card fare-card">
              <span className="eyebrow">{t.fare}</span>
              {Number(trip.finalFare) > 0 ? (
                <>
                  <div className="fare-title">
                    <strong>₹{Number(trip.finalFare).toLocaleString("en-IN")}</strong>
                    <span>{t.finalFare}</span>
                  </div>
                  <p className="fare-note">{t.finalFare}</p>
                </>
              ) : Number(trip.estimatedFare) > 0 ? (
                <>
                  <div className="fare-title">
                    <strong>₹{Number(trip.estimatedFare).toLocaleString("en-IN")}</strong>
                    <span>{t.estimatedFare}</span>
                  </div>
                  <p className="fare-note">{t.estimatedFare}</p>
                </>
              ) : (
                <>
                  <div className="fare-title pending">
                    <strong>₹—</strong>
                    <span>{t.farePending}</span>
                  </div>
                  <p className="fare-note">{t.farePending}</p>
                </>
              )}
            </section>

            <section className="card route-card">
              <span className="eyebrow">ROUTE</span>

              <div className="route-place">
                <span className="route-dot pickup-dot">1</span>
                <div>
                  <strong>{t.pickup}</strong>
                  <p>
                    {[trip.pickupVillage, trip.pickupDistrict, trip.pickupState]
                      .filter(Boolean)
                      .join(", ") || trip.pickupAddress || "—"}
                  </p>
                </div>
                {(trip.pickupLat != null && trip.pickupLng != null) && (
                  <button
                    className="mini-map"
                    onClick={() => openMaps(trip.pickupLat, trip.pickupLng)}
                  >
                    {t.maps}
                  </button>
                )}
              </div>

              <div className="route-connector" />

              <div className="route-place">
                <span className="route-dot center-dot">2</span>
                <div>
                  <strong>{t.center}</strong>
                  <p>{trip.centerName || "—"}{trip.centerAddress ? ` • ${trip.centerAddress}` : ""}</p>
                </div>
                {(trip.centerLat != null && trip.centerLng != null) && (
                  <button
                    className="mini-map"
                    onClick={() => openMaps(trip.centerLat, trip.centerLng)}
                  >
                    {t.maps}
                  </button>
                )}
              </div>
            </section>

            <section className="card details-list">
              <span className="eyebrow">{t.details}</span>
              <div><small>{t.request}</small><strong>#{trip.id || "—"}</strong></div>
              <div><small>{t.date}</small><strong>{formatDate(trip.pickupDate)}</strong></div>
              <div><small>{t.time}</small><strong>{trip.pickupTime || "—"}</strong></div>
              <div><small>{t.status}</small><strong>{displayStatus(trip.status, t)}</strong></div>
            </section>

            {trip.status === "COMPLETED" && (
              <section className="card rating-card">
                <span className="eyebrow">FEEDBACK</span>
                {ratingMessage ? (
                  <p className="rating-message">{ratingMessage}</p>
                ) : (
                  <>
                    <h3>{t.rate}</h3>
                    <p>{t.ratingQuestion}</p>
                    <button className="primary full" onClick={() => setRatingOpen(true)}>
                      ★ {t.rate}
                    </button>
                  </>
                )}
              </section>
            )}

            <button className="secondary full home-btn" onClick={() => navigate("/farmer/logistics")}>
              {t.logistics}
            </button>
          </aside>
        </div>
      </div>

      {ratingOpen && (
        <div className="modal-backdrop" onMouseDown={() => setRatingOpen(false)}>
          <div className="rating-modal" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setRatingOpen(false)}>×</button>
            <span className="eyebrow">FEEDBACK</span>
            <h2>{t.ratingQuestion}</h2>

            <div className="stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={star <= rating ? "selected" : ""}
                  onClick={() => setRating(star)}
                >
                  ★
                </button>
              ))}
            </div>

            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder={t.comment}
              rows={4}
            />

            <button
              className="primary full"
              disabled={!rating || ratingSaving}
              onClick={submitRating}
            >
              {ratingSaving ? "..." : t.submitRating}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = `
.tracking-page{
  min-height:100vh;
  background:#f5f8f4;
  color:#17231a;
  padding:28px 16px 55px;
}
.tracking-shell{width:min(1120px,100%);margin:auto}
.tracking-header{display:flex;align-items:flex-start;gap:14px;margin-bottom:18px}
.back{width:43px;height:43px;border:1px solid #dbe5dd;border-radius:13px;background:#fff;font:inherit;font-size:20px;cursor:pointer}
.header-copy{flex:1}
.eyebrow{display:block;color:#15803d;font-size:10px;font-weight:900;letter-spacing:.1em}
.tracking-header h1{margin:4px 0 5px;font-size:clamp(29px,4vw,42px);letter-spacing:-.03em}
.tracking-header p{margin:0;color:#647168;line-height:1.5;font-size:13px}
.refresh{border:1px solid #dbe5dd;background:#fff;color:#3a4940;border-radius:12px;padding:11px 14px;font:inherit;font-size:12px;font-weight:800;cursor:pointer}
.status-hero,.progress-card,.card{
  background:#fff;
  border:1px solid #e0e8e1;
  border-radius:21px;
  box-shadow:0 11px 34px rgba(25,53,32,.055);
}
.status-hero{
  padding:25px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:20px;
}
.status-hero h2{margin:6px 0 4px;font-size:24px}
.status-hero p{margin:0;color:#707b73;font-size:12px}
.status-pill{padding:9px 13px;border-radius:999px;font-size:11px;font-weight:850;background:#eef7ef;color:#27653b}
.status-completed{background:#dcfce7;color:#166534}
.status-cancelled,.status-rejected{background:#fff0f0;color:#8b2929}
.progress-card{margin-top:13px;padding:20px 23px}
.progress-line{height:6px;background:#e8eee9;border-radius:999px;overflow:hidden}
.progress-line>div{height:100%;background:#25a357;border-radius:999px;transition:width .3s ease}
.progress-points{display:grid;grid-template-columns:repeat(7,1fr);gap:5px;margin-top:9px}
.point{text-align:center;color:#7a867d}
.point span{
  width:24px;height:24px;margin:0 auto 5px;display:grid;place-items:center;
  border-radius:50%;background:#edf2ee;color:#7d897f;font-size:10px;font-weight:900;
}
.point.reached{color:#245f37}
.point.reached span{background:#dcfce7;color:#166534}
.point small{display:block;font-size:9px;line-height:1.3}
.main-grid{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(290px,.9fr);gap:15px;margin-top:15px}
.left-column,.right-column{display:flex;flex-direction:column;gap:15px}
.card{padding:21px}
.card-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
.card h3{margin:4px 0 0;font-size:18px;letter-spacing:-.015em}
.live-dot{font-size:10px;color:#16823e;background:#effbf2;border:1px solid #d2eed9;border-radius:999px;padding:7px 9px}
.transporter-card{padding-bottom:19px}
.transporter-meta{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:17px}
.transporter-meta div,.details-list div{border:1px solid #e2e9e3;background:#fafcfb;border-radius:12px;padding:12px}
.transporter-meta small,.details-list small{display:block;color:#7b877f;font-size:9px;text-transform:uppercase;font-weight:850;letter-spacing:.04em}
.transporter-meta strong,.details-list strong{display:block;margin-top:5px;font-size:13px}
.button-row{display:flex;gap:9px;margin-top:14px}
.primary,.secondary{
  border-radius:11px;padding:11px 14px;font:inherit;font-size:12px;font-weight:800;cursor:pointer
}
.primary{border:0;background:#16823e;color:#fff}
.secondary{border:1px solid #dbe4dd;background:#f7f9f7;color:#344239}
.full{width:100%;box-sizing:border-box}
.timeline{margin-top:18px}
.timeline-row{display:flex;gap:12px;min-height:52px;color:#8a958d}
.timeline-marker{position:relative;width:28px;display:flex;justify-content:center}
.timeline-marker:after{
  content:"";position:absolute;top:27px;bottom:-1px;width:2px;background:#e3eae4
}
.timeline-row:last-child .timeline-marker:after{display:none}
.timeline-row.reached{color:#294f35}
.timeline-marker span{
  width:25px;height:25px;border-radius:50%;display:grid;place-items:center;
  background:#edf2ee;font-size:9px;font-weight:900;z-index:1
}
.timeline-row.reached .timeline-marker span{background:#dcfce7;color:#166534}
.timeline-copy{padding-top:4px}
.timeline-copy strong{font-size:12px}
.timeline-copy small{margin-left:8px;color:#16823e;font-size:9px;font-weight:900}
.events{margin-top:15px;display:flex;flex-direction:column;gap:8px}
.event{display:flex;justify-content:space-between;gap:12px;padding:11px 12px;border-radius:11px;background:#fafcfb;border:1px solid #e4eae5;font-size:11px}
.event small{color:#7e8a81}
.crop-title{display:flex;align-items:end;justify-content:space-between;gap:10px;margin-top:12px}
.crop-title h3{font-size:20px}
.crop-title strong{font-size:15px;color:#16823e}
.fare-card{padding-bottom:18px}.fare-title{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-top:10px}.fare-title strong{font-size:28px;color:#176b3d;letter-spacing:-.03em}.fare-title span{font-size:9px;text-transform:uppercase;letter-spacing:.06em;font-weight:900;color:#78857d;text-align:right}.fare-title.pending strong{color:#68756d}.fare-title.pending span{color:#a06a27}.fare-note{margin:9px 0 0;color:#718077;font-size:10px;line-height:1.45} .route-card{padding-bottom:18px}
.route-place{display:grid;grid-template-columns:29px 1fr auto;gap:10px;align-items:start;margin-top:15px}
.route-dot{
  width:25px;height:25px;border-radius:50%;display:grid;place-items:center;font-size:9px;font-weight:900
}
.pickup-dot{background:#dcfce7;color:#166534}
.center-dot{background:#e0f2fe;color:#075985}
.route-place strong{font-size:12px}
.route-place p{margin:3px 0 0;color:#738078;font-size:10px;line-height:1.45}
.mini-map{border:0;background:#effbf2;color:#16823e;border-radius:8px;padding:7px 8px;font-size:9px;font-weight:850;cursor:pointer}
.route-connector{height:27px;width:2px;margin-left:12px;background:#d6e3d8}
.details-list{display:flex;flex-direction:column;gap:8px}
.details-list>span{margin-bottom:1px}
.rating-card h3{margin-top:7px}
.rating-card p{font-size:11px;color:#707b73;line-height:1.5;margin:5px 0 13px}
.rating-message{color:#166534!important}
.home-btn{font-size:12px}
.loading-state{min-height:70vh;display:grid;place-items:center;align-content:center;gap:10px;color:#6b776f}
.spinner{width:35px;height:35px;border:3px solid #dce7df;border-top-color:#16823e;border-radius:50%;animation:spin .8s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.error-card{
  margin:10vh auto 0;width:min(500px,100%);background:#fff;border:1px solid #e0e8e1;
  border-radius:23px;padding:35px;text-align:center;box-shadow:0 14px 45px rgba(25,53,32,.07)
}
.error-icon{width:55px;height:55px;display:grid;place-items:center;border-radius:50%;background:#fff0f0;color:#9a3030;font-weight:900;margin:0 auto 15px}
.error-card h1{font-size:23px;margin:0 0 7px}.error-card p{color:#727e75;font-size:12px;line-height:1.5;margin:0 auto 19px}
.modal-backdrop{position:fixed;inset:0;background:rgba(11,25,15,.45);display:grid;place-items:center;padding:16px;z-index:50}
.rating-modal{width:min(430px,100%);background:#fff;border-radius:22px;padding:25px;position:relative;box-shadow:0 22px 70px rgba(0,0,0,.2)}
.modal-close{position:absolute;right:12px;top:10px;border:0;background:transparent;font-size:24px;color:#68756c;cursor:pointer}
.rating-modal h2{font-size:22px;margin:5px 25px 5px 0}
.stars{display:flex;gap:4px;margin:16px 0}
.stars button{border:0;background:transparent;color:#cbd5ce;font-size:30px;cursor:pointer;padding:0}
.stars button.selected{color:#e6a91a}
.rating-modal textarea{width:100%;box-sizing:border-box;border:1px solid #d9e2db;border-radius:12px;padding:12px;font:inherit;resize:vertical;margin-bottom:12px}
@media(max-width:850px){
  .main-grid{grid-template-columns:1fr}
  .right-column{display:grid;grid-template-columns:1fr 1fr}
  .home-btn{grid-column:1/-1}
}
@media(max-width:650px){
  .tracking-page{padding:12px 8px 28px}
  .tracking-shell{width:100%}
  .tracking-header{display:grid;grid-template-columns:42px 1fr;gap:10px;margin-bottom:12px}
  .tracking-header .refresh{grid-column:1/-1;width:100%;min-height:42px}
  .tracking-header h1{font-size:28px;line-height:1.08}
  .tracking-header p{font-size:12px}
  .back{width:42px;height:42px}
  .status-hero{padding:16px;align-items:flex-start;flex-direction:column;gap:10px}
  .status-hero h2{font-size:21px;line-height:1.2}
  .status-pill{font-size:10px}
  .progress-card{padding:15px}
  .progress-points{display:none}
  .main-grid{display:block}
  .left-column,.right-column{gap:10px}
  .right-column{display:flex;margin-top:10px}
  .card{padding:16px;border-radius:17px}
  .card h3{font-size:17px}
  .transporter-meta{grid-template-columns:1fr 1fr;gap:7px}
  .transporter-meta div,.details-list div{padding:10px}
  .transporter-meta strong,.details-list strong{font-size:12px;word-break:break-word}
  .button-row{flex-direction:column}
  .primary,.secondary{width:100%;min-height:44px}
  .route-place{grid-template-columns:28px minmax(0,1fr);gap:9px}
  .mini-map{grid-column:2;justify-self:start;margin-top:2px}
  .crop-title,.fare-title{align-items:flex-start;flex-direction:column;gap:6px}
  .fare-title span{text-align:left}
  .fare-title strong{font-size:25px}
  .event{flex-direction:column;gap:4px}
  .details-list div{display:grid;grid-template-columns:1fr auto;align-items:center;gap:10px}
  .details-list small{margin:0}
  .details-list strong{margin:0;text-align:right}
  .rating-modal{padding:20px;border-radius:18px;max-height:calc(100dvh - 24px);overflow:auto}
  .stars{justify-content:space-between}
  .stars button{font-size:28px}
}
`;

