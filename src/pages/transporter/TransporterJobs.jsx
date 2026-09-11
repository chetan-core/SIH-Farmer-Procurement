import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router";
import {
  Check,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  Filter,
  Globe2,
  MapPin,
  Navigation,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Truck,
  X,
  XCircle,
  Zap,
} from "lucide-react";

import Header from "../../components/Header";
import { useLanguage } from "../../translations/LanguageContext";

/*
 * API base normalization.
 *
 * This component sends paths beginning with /api/ below. If VITE_API_URL
 * is configured as http://localhost:5000/api, concatenating it directly
 * would produce /api/api/... and Express would correctly return 404
 * ("Route not found").
 *
 * Supported values:
 *   VITE_API_URL=http://localhost:5000
 *   VITE_API_URL=http://localhost:5000/api
 *   VITE_API_URL=/api        (works with a Vite /api proxy)
 *   unset                    -> http://localhost:5000
 */
const RAW_API_BASE =
  String(import.meta.env.VITE_API_URL || "").trim();

const API_BASE = (() => {
  if (!RAW_API_BASE) return "http://localhost:5000";
  if (RAW_API_BASE === "/api") return "";

  return RAW_API_BASE
    .replace(/\/+$/, "")
    .replace(/\/api$/i, "");
})();

const SESSION_KEY =
  "krishisetu_transporter_session";

const TEMP_SESSION_KEY =
  "krishisetu_transporter_temp_session";

const TRANSPORTER_ID_KEY =
  "krishisetu_transporter_id";

const COPY = {
  en: {
    eyebrow: "TRANSPORT PARTNER",
    title: "Available farmer jobs",
    subtitle:
      "Only requests eligible for your registered service area are loaded from the server.",
    back: "Dashboard",
    refresh: "Refresh",
    refreshing: "Refreshing…",
    search: "Search farmer, village, crop or center",
    all: "All",
    waiting: "Waiting",
    assigned: "Assigned",
    active: "Active",
    completed: "Completed",
    requested: "Waiting for transporter",
    serviceArea: "Service area",
    online: "Online",
    offline: "Offline",
    goOnline: "Go online",
    goOffline: "Go offline",
    jobsFound: "jobs",
    noJobs: "No matching jobs",
    noJobsText:
      "There are no farmer transport requests in your eligible region right now.",
    farmer: "Farmer",
    crop: "Crop",
    quantity: "Quantity",
    pickup: "Pickup",
    destination: "Destination",
    requestedFor: "Requested",
    fare: "Estimated fare",
    fareUnknown: "Fare to be agreed",
    estimateSuffix: "estimate",
    accept: "Accept",
    accepting: "Accepting…",
    reject: "Decline",
    declineTitle: "Decline this request",
    declineReason: "Reason",
    reasonPlaceholder:
      "Optional reason for declining this job",
    confirmDecline: "Decline request",
    cancel: "Cancel",
    route: "Open route",
    call: "Call farmer",
    capacity: "Vehicle capacity",
    regionMatch: "Region match",
    sameVillage: "Same village",
    sameDistrict: "Same district",
    sameState: "Same state",
    locationProtected:
      "The backend decides eligibility from the farmer and transporter geographic records.",
    mustBeOnline:
      "Go online before accepting a new farmer job.",
    activeTrip:
      "You already have an active trip. Complete it before accepting another request.",
    notAvailable:
      "This request is no longer available.",
    connection:
      "Backend connection",
    connected: "Connected",
    disconnected: "Unavailable",
    retry: "Try again",
    language: "Language",
    profile: "Profile",
    quantityTooHigh:
      "This load is above your registered vehicle capacity.",
    accepted:
      "Transport request accepted.",
    declined:
      "Transport request declined.",
    history:
      "Assigned/active jobs remain visible here so you can return to them quickly.",
    login:
      "Your transporter session is missing. Please sign in again.",
    updated:
      "Updated",
    cancelTrip: "Cancel trip",
    cancelTripTitle: "Cancel this active trip?",
    cancelTripReason: "Cancellation reason",
    cancelTripReasonPlaceholder: "Tell the farmer why you are cancelling this trip",
    confirmCancelTrip: "Cancel trip",
    keepTrip: "Keep trip",
    cancellationReasonRequired: "Please enter a reason before cancelling the trip.",
    tripCancelled: "Active trip cancelled successfully.",
    cancelTripError: "Unable to cancel this trip.",
    viewTrip: "View active trip",
  },
  hi: {
    eyebrow: "परिवहन साझेदार",
    title: "उपलब्ध किसान कार्य",
    subtitle:
      "केवल आपके पंजीकृत सेवा क्षेत्र के योग्य अनुरोध सर्वर से लोड होते हैं।",
    back: "डैशबोर्ड",
    refresh: "रिफ्रेश",
    refreshing: "रिफ्रेश हो रहा है…",
    search: "किसान, गाँव, फसल या केंद्र खोजें",
    all: "सभी",
    waiting: "प्रतीक्षा",
    assigned: "असाइन",
    active: "सक्रिय",
    completed: "पूर्ण",
    requested: "परिवहनकर्ता की प्रतीक्षा",
    serviceArea: "सेवा क्षेत्र",
    online: "ऑनलाइन",
    offline: "ऑफलाइन",
    goOnline: "ऑनलाइन जाएँ",
    goOffline: "ऑफलाइन जाएँ",
    jobsFound: "कार्य",
    noJobs: "कोई मिलान कार्य नहीं",
    noJobsText:
      "अभी आपके योग्य क्षेत्र में कोई किसान परिवहन अनुरोध नहीं है।",
    farmer: "किसान",
    crop: "फसल",
    quantity: "मात्रा",
    pickup: "पिकअप",
    destination: "गंतव्य",
    requestedFor: "अनुरोध",
    fare: "अनुमानित किराया",
    fareUnknown: "किराया तय होना बाकी है",
    estimateSuffix: "अनुमान",
    accept: "स्वीकार करें",
    accepting: "स्वीकार हो रहा है…",
    reject: "मना करें",
    declineTitle: "अनुरोध मना करें",
    declineReason: "कारण",
    reasonPlaceholder:
      "मना करने का वैकल्पिक कारण",
    confirmDecline: "अनुरोध मना करें",
    cancel: "रद्द करें",
    route: "रूट खोलें",
    call: "किसान को कॉल",
    capacity: "वाहन क्षमता",
    regionMatch: "क्षेत्र मिलान",
    sameVillage: "उसी गाँव",
    sameDistrict: "उसी जिले",
    sameState: "उसी राज्य",
    locationProtected:
      "योग्यता किसान और परिवहनकर्ता के भौगोलिक रिकॉर्ड से बैकएंड तय करता है।",
    mustBeOnline:
      "नया किसान कार्य स्वीकार करने से पहले ऑनलाइन जाएँ।",
    activeTrip:
      "आपकी एक सक्रिय यात्रा है। दूसरा अनुरोध स्वीकार करने से पहले इसे पूरा करें।",
    notAvailable:
      "यह अनुरोध अब उपलब्ध नहीं है।",
    connection: "बैकएंड कनेक्शन",
    connected: "कनेक्टेड",
    disconnected: "उपलब्ध नहीं",
    retry: "फिर प्रयास",
    language: "भाषा",
    profile: "प्रोफ़ाइल",
    quantityTooHigh:
      "यह भार आपकी पंजीकृत वाहन क्षमता से अधिक है।",
    accepted: "परिवहन अनुरोध स्वीकार हो गया।",
    declined: "परिवहन अनुरोध मना कर दिया गया।",
    history:
      "असाइन और सक्रिय कार्य यहाँ दिखते रहेंगे ताकि आप जल्दी वापस लौट सकें।",
    login:
      "परिवहनकर्ता सत्र नहीं मिला। कृपया फिर से साइन इन करें।",
    updated: "अपडेट",
    cancelTrip: "सक्रिय यात्रा रद्द करें",
    cancelTripTitle: "क्या यह सक्रिय यात्रा रद्द करें?",
    cancelTripReason: "रद्द करने का कारण",
    cancelTripReasonPlaceholder: "किसान को बताएं कि आप यह यात्रा क्यों रद्द कर रहे हैं",
    confirmCancelTrip: "यात्रा रद्द करें",
    keepTrip: "यात्रा जारी रखें",
    cancellationReasonRequired: "यात्रा रद्द करने से पहले कारण दर्ज करें।",
    tripCancelled: "सक्रिय यात्रा सफलतापूर्वक रद्द हो गई।",
    cancelTripError: "यह यात्रा रद्द नहीं हो सकी।",
    viewTrip: "सक्रिय यात्रा देखें",
  },
  te: {
    eyebrow: "రవాణా భాగస్వామి",
    title: "అందుబాటులో ఉన్న రైతు పనులు",
    subtitle:
      "మీ నమోదైన సేవా ప్రాంతానికి అర్హమైన అభ్యర్థనలు మాత్రమే సర్వర్ నుండి లోడ్ అవుతాయి.",
    back: "డ్యాష్‌బోర్డ్",
    refresh: "రిఫ్రెష్",
    refreshing: "రిఫ్రెష్ అవుతోంది…",
    search: "రైతు, గ్రామం, పంట లేదా కేంద్రం వెతకండి",
    all: "అన్నీ",
    waiting: "వేచి ఉంది",
    assigned: "కేటాయించబడింది",
    active: "యాక్టివ్",
    completed: "పూర్తయింది",
    requested: "రవాణాదారు కోసం వేచి ఉంది",
    serviceArea: "సేవా ప్రాంతం",
    online: "ఆన్‌లైన్",
    offline: "ఆఫ్‌లైన్",
    goOnline: "ఆన్‌లైన్‌కు వెళ్లండి",
    goOffline: "ఆఫ్‌లైన్‌కు వెళ్లండి",
    jobsFound: "పనులు",
    noJobs: "సరిపోలే పనులు లేవు",
    noJobsText:
      "ప్రస్తుతం మీ అర్హమైన ప్రాంతంలో రైతు రవాణా అభ్యర్థనలు లేవు.",
    farmer: "రైతు",
    crop: "పంట",
    quantity: "పరిమాణం",
    pickup: "పికప్",
    destination: "గమ్యం",
    requestedFor: "అభ్యర్థన",
    fare: "అంచనా ఛార్జీ",
    fareUnknown: "ఛార్జీ నిర్ణయించాలి",
    estimateSuffix: "అంచనా",
    accept: "అంగీకరించండి",
    accepting: "అంగీకరిస్తోంది…",
    reject: "తిరస్కరించండి",
    declineTitle: "ఈ అభ్యర్థనను తిరస్కరించండి",
    declineReason: "కారణం",
    reasonPlaceholder:
      "తిరస్కరణకు ఐచ్ఛిక కారణం",
    confirmDecline: "అభ్యర్థన తిరస్కరించండి",
    cancel: "రద్దు",
    route: "రూట్ తెరవండి",
    call: "రైతుకు కాల్",
    capacity: "వాహన సామర్థ్యం",
    regionMatch: "ప్రాంత సరిపోలిక",
    sameVillage: "అదే గ్రామం",
    sameDistrict: "అదే జిల్లా",
    sameState: "అదే రాష్ట్రం",
    locationProtected:
      "రైతు మరియు రవాణాదారు భౌగోళిక రికార్డుల ఆధారంగా బ్యాకెండ్ అర్హతను నిర్ణయిస్తుంది.",
    mustBeOnline:
      "కొత్త రైతు పని అంగీకరించడానికి ముందు ఆన్‌లైన్‌లోకి వెళ్లండి.",
    activeTrip:
      "మీకు ఇప్పటికే యాక్టివ్ ట్రిప్ ఉంది. మరొక అభ్యర్థనను అంగీకరించే ముందు దాన్ని పూర్తి చేయండి.",
    notAvailable:
      "ఈ అభ్యర్థన ఇక అందుబాటులో లేదు.",
    connection: "బ్యాకెండ్ కనెక్షన్",
    connected: "కనెక్ట్ అయింది",
    disconnected: "అందుబాటులో లేదు",
    retry: "మళ్లీ ప్రయత్నించండి",
    language: "భాష",
    profile: "ప్రొఫైల్",
    quantityTooHigh:
      "ఈ లోడ్ మీ నమోదైన వాహన సామర్థ్యాన్ని మించిపోయింది.",
    accepted: "రవాణా అభ్యర్థన అంగీకరించబడింది.",
    declined: "రవాణా అభ్యర్థన తిరస్కరించబడింది.",
    history:
      "కేటాయించబడిన మరియు యాక్టివ్ పనులు త్వరగా తిరిగి తెరవడానికి ఇక్కడ కనిపిస్తాయి.",
    login:
      "రవాణాదారు సెషన్ కనుగొనబడలేదు. మళ్లీ సైన్ ఇన్ చేయండి.",
    updated: "అప్డేట్",
    cancelTrip: "యాక్టివ్ ట్రిప్ రద్దు",
    cancelTripTitle: "ఈ యాక్టివ్ ట్రిప్‌ను రద్దు చేయాలా?",
    cancelTripReason: "రద్దు కారణం",
    cancelTripReasonPlaceholder: "ఈ ట్రిప్‌ను ఎందుకు రద్దు చేస్తున్నారో రైతుకు తెలియజేయండి",
    confirmCancelTrip: "ట్రిప్ రద్దు చేయండి",
    keepTrip: "ట్రిప్ కొనసాగించండి",
    cancellationReasonRequired: "ట్రిప్ రద్దు చేయడానికి ముందు కారణం నమోదు చేయండి.",
    tripCancelled: "యాక్టివ్ ట్రిప్ విజయవంతంగా రద్దు చేయబడింది.",
    cancelTripError: "ఈ ట్రిప్‌ను రద్దు చేయలేకపోయాము.",
    viewTrip: "యాక్టివ్ ట్రిప్ చూడండి",
  },
};

const FILTERS = [
  "ALL",
  "REQUESTED",
  "ASSIGNED",
  "ACTIVE",
  "COMPLETED",
];

const ACTIVE = new Set([
  "ASSIGNED",
  "EN_ROUTE_TO_FARMER",
  "CROP_PICKED_UP",
  "EN_ROUTE_TO_CENTER",
  "DELIVERED",
]);

function sessionTransporterId() {
  const keys = [
    [SESSION_KEY, window.localStorage],
    [TEMP_SESSION_KEY, window.sessionStorage],
  ];

  for (const [key, storage] of keys) {
    try {
      const raw = storage.getItem(key);
      if (!raw) continue;

      const parsed = JSON.parse(raw);
      if (parsed?.transporter?.id) {
        return String(
          parsed.transporter.id
        );
      }
    } catch {
      // Continue.
    }
  }

  const fallback =
    window.localStorage.getItem(
      TRANSPORTER_ID_KEY
    );

  return fallback
    ? String(fallback)
    : "";
}

async function api(
  path,
  options = {}
) {
  const normalizedPath =
    String(path || "").startsWith("/")
      ? String(path || "")
      : `/${String(path || "")}`;

  const response = await fetch(
    `${API_BASE}${normalizedPath}`,
    {
      ...options,
      headers: {
        Accept:
          "application/json",
        "Content-Type":
          "application/json",
        ...(options.headers || {}),
      },
    }
  );

  let data = {};

  try {
    data =
      await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error?.message ||
        data?.error ||
        `Request failed (${response.status})`
    );
  }

  return data;
}

function statusText(
  status,
  language
) {
  const key =
    String(status || "")
      .toUpperCase();

  const labels = {
    REQUESTED: {
      en: "Waiting",
      hi: "प्रतीक्षा",
      te: "వేచి ఉంది",
    },
    ASSIGNED: {
      en: "Assigned",
      hi: "असाइन",
      te: "కేటాయించబడింది",
    },
    EN_ROUTE_TO_FARMER: {
      en: "Going to farmer",
      hi: "किसान के पास",
      te: "రైతు దగ్గరకు",
    },
    CROP_PICKED_UP: {
      en: "Crop picked up",
      hi: "फसल उठाई",
      te: "పంట తీసుకున్నారు",
    },
    EN_ROUTE_TO_CENTER: {
      en: "Going to center",
      hi: "केंद्र की ओर",
      te: "కేంద్రానికి",
    },
    DELIVERED: {
      en: "Delivered",
      hi: "पहुंचाया",
      te: "చేరవేశారు",
    },
    COMPLETED: {
      en: "Completed",
      hi: "पूर्ण",
      te: "పూర్తయింది",
    },
    CANCELLED: {
      en: "Cancelled",
      hi: "रद्द",
      te: "రద్దయింది",
    },
  };

  return (
    labels[key]?.[language] ||
    labels[key]?.en ||
    key
  );
}

function category(
  status
) {
  const key =
    String(status || "")
      .toUpperCase();

  if (key === "REQUESTED") {
    return "REQUESTED";
  }

  if (ACTIVE.has(key)) {
    return key === "ASSIGNED"
      ? "ASSIGNED"
      : "ACTIVE";
  }

  if (
    key === "COMPLETED" ||
    key === "DELIVERED"
  ) {
    return "COMPLETED";
  }

  return "ALL";
}

function mapsLink(
  request
) {
  if (
    request?.pickup_lat != null &&
    request?.pickup_lng != null
  ) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      `${request.pickup_lat},${request.pickup_lng}`
    )}`;
  }

  if (
    request?.pickup_address
  ) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      request.pickup_address
    )}`;
  }

  return "";
}

function formatEstimatedFare(value, copy) {
  const n = Number(value);

  if (!Number.isFinite(n) || n <= 0) {
    return copy.fareUnknown;
  }

  return `₹${n.toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 0,
    }
  )} ${copy.estimateSuffix}`;
}

function formatQuantity(
  value
) {
  const n = Number(value);

  return Number.isFinite(n)
    ? n.toLocaleString("en-IN")
    : "0";
}

function routeRegion(
  request
) {
  return [
    request?.request_farmer_village ||
      request?.farmer_village,
    request?.request_farmer_mandal ||
      request?.farmer_mandal,
    request?.request_farmer_district ||
      request?.farmer_district,
    request?.request_farmer_state ||
      request?.farmer_state,
  ]
    .filter(Boolean)
    .join(" · ");
}

function formatRequestedDateTime(
  request,
  language
) {
  const rawDate =
    request?.requested_date ||
    request?.requestedDate;

  const rawStart =
    request?.requested_slot_start ||
    request?.requestedSlotStart;

  const rawEnd =
    request?.requested_slot_end ||
    request?.requestedSlotEnd;

  const locale =
    language === "hi"
      ? "hi-IN"
      : language === "te"
      ? "te-IN"
      : "en-IN";

  if (rawDate) {
    const d = new Date(
      `${String(rawDate).slice(0, 10)}T00:00:00`
    );

    const dateText =
      Number.isNaN(d.getTime())
        ? String(rawDate)
        : d.toLocaleDateString(
            locale,
            {
              day: "numeric",
              month: "short",
              year: "numeric",
            }
          );

    const timeText = [
      rawStart,
      rawEnd,
    ]
      .filter(Boolean)
      .map(value =>
        String(value).slice(0, 5)
      )
      .join(" – ");

    return timeText
      ? `${dateText} • ${timeText}`
      : dateText;
  }

  const created =
    request?.created_at ||
    request?.createdAt;

  if (!created) return "Timing not set";

  const d = new Date(created);

  if (Number.isNaN(d.getTime())) {
    return String(created);
  }

  return d.toLocaleString(
    locale,
    {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  );
}

function JobCard({
  request,
  language,
  copy,
  transporter,
  canAccept,
  busyId,
  onAccept,
  onDecline,
}) {
  const [declining, setDeclining] =
    useState(false);

  const [reason, setReason] =
    useState("");

  const quantity =
    Number(
      request.quantity_kg
    );

  const capacity =
    Number(
      transporter?.capacity_kg ||
        transporter?.capacityKg ||
        0
    );

  const overCapacity =
    Number.isFinite(
      capacity
    ) &&
    capacity > 0 &&
    quantity > capacity;

  const busy =
    String(busyId || "") ===
    String(request.id);

  const link =
    mapsLink(request);

  const status =
    String(
      request.status || ""
    ).toUpperCase();

  const eligible =
    status === "REQUESTED";

  const disabled =
    !canAccept ||
    !eligible ||
    overCapacity ||
    busy;

  return (
    <article
      className="ks-job-card-hover"
      style={styles.jobCard}
    >
      <div
        style={styles.jobHead}
      >
        <div>
          <span
            style={
              styles.miniEyebrow
            }
          >
            {copy.farmer}
          </span>

          <h3
            style={
              styles.jobName
            }
          >
            {request.farmer_name ||
              "Farmer"}
          </h3>
        </div>

        <span
          style={{
            ...styles.statusPill,
            ...(status === "REQUESTED"
              ? styles.statusRequested
              : status === "ASSIGNED"
              ? styles.statusAssigned
              : status === "COMPLETED" ||
                status === "DELIVERED"
              ? styles.statusCompleted
              : status === "CANCELLED"
              ? styles.statusCancelled
              : styles.statusActive),
          }}
        >
          {statusText(
            status,
            language
          )}
        </span>
      </div>

      <div
        style={styles.jobInfoGrid}
      >
        <Info
          label={copy.crop}
          value={
            request.crop ||
            "Crop load"
          }
        />

        <Info
          label={copy.quantity}
          value={`${formatQuantity(
            quantity
          )} kg`}
        />

        <Info
          label={copy.fare}
          value={formatEstimatedFare(
            request.estimated_fare,
            copy
          )}
        />

        <Info
          label={
            copy.requestedFor
          }
          value={formatRequestedDateTime(
            request,
            language
          )}
        />
      </div>

      <div
        style={
          styles.routeCard
        }
      >
        <RouteRow
          color="#5b9970"
          label={
            copy.pickup
          }
          value={
            request.pickup_address ||
            request.farmer_village ||
            "Pickup location"
          }
        />

        <div
          style={
            styles.routeConnector
          }
        />

        <RouteRow
          color="#286f43"
          label={
            copy.destination
          }
          value={
            request.center_name ||
            request.center_address ||
            "Procurement center"
          }
        />
      </div>

      <div
        style={
          styles.regionLine
        }
      >
        <MapPin size={14} />

        <span>
          {routeRegion(
            request
          ) ||
            "Region details unavailable"}
        </span>
      </div>

      {overCapacity ? (
        <div
          style={
            styles.capacityWarning
          }
        >
          <Truck size={15} />

          <span>
            {copy.quantityTooHigh}
            {" "}
            ({formatQuantity(
              quantity
            )} /{" "}
            {formatQuantity(
              capacity
            )} kg)
          </span>
        </div>
      ) : null}

      <div
        style={
          styles.jobActions
        }
      >
        {request.farmer_phone ? (
          <a
            href={`tel:${request.farmer_phone}`}
            style={
              styles.secondaryButton
            }
          >
            <Phone size={15} />
            {copy.call}
          </a>
        ) : null}

        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            style={
              styles.secondaryButton
            }
          >
            <Navigation
              size={15}
            />
            {copy.route}
          </a>
        ) : null}

        {eligible ? (
          <>
            <button
              type="button"
              style={
                styles.declineButton
              }
              disabled={busy}
              onClick={() =>
                setDeclining(
                  (value) =>
                    !value
                )
              }
            >
              <X size={15} />
              {copy.reject}
            </button>

            <button
              type="button"
              style={{
                ...styles.acceptButton,
                opacity:
                  disabled
                    ? 0.5
                    : 1,
              }}
              disabled={
                disabled
              }
              onClick={() =>
                onAccept(
                  request.id
                )
              }
            >
              {busy ? (
                <span
                  style={
                    styles.spinner
                  }
                />
              ) : (
                <Check size={15} />
              )}

              {busy
                ? copy.accepting
                : copy.accept}
            </button>
          </>
        ) : (
          <span
            style={
              styles.readOnlyBadge
            }
          >
            {statusText(
              status,
              language
            )}
          </span>
        )}
      </div>

      {declining ? (
        <div
          style={
            styles.declinePanel
          }
        >
          <strong>
            {copy.declineTitle}
          </strong>

          <label
            style={
              styles.label
            }
          >
            {copy.declineReason}
          </label>

          <textarea
            value={reason}
            onChange={(event) =>
              setReason(
                event.target.value
              )
            }
            placeholder={
              copy.reasonPlaceholder
            }
            rows={3}
            style={
              styles.textarea
            }
          />

          <div
            style={
              styles.declineActions
            }
          >
            <button
              type="button"
              style={
                styles.cancelButton
              }
              onClick={() =>
                setDeclining(
                  false
                )
              }
            >
              {copy.cancel}
            </button>

            <button
              type="button"
              style={
                styles.confirmDecline
              }
              disabled={busy}
              onClick={() => {
                onDecline(
                  request.id,
                  reason
                );
                setDeclining(
                  false
                );
                setReason("");
              }}
            >
              {busy ? (
                <span
                  style={
                    styles.spinner
                  }
                />
              ) : (
                <X size={15} />
              )}

              {copy.confirmDecline}
            </button>
          </div>
        </div>
      ) : null}

      <div
        style={
          styles.matchFooter
        }
      >
        <ShieldCheck size={14} />

        <span>
          {copy.locationProtected}
        </span>
      </div>
    </article>
  );
}

function Info({
  label,
  value,
}) {
  return (
    <div>
      <span
        style={
          styles.infoLabel
        }
      >
        {label}
      </span>

      <strong
        style={
          styles.infoValue
        }
      >
        {value}
      </strong>
    </div>
  );
}

function RouteRow({
  color,
  label,
  value,
}) {
  return (
    <div
      style={
        styles.routeRow
      }
    >
      <span
        style={{
          ...styles.routeDot,
          background:
            color,
        }}
      />

      <div>
        <span
          style={
            styles.routeLabel
          }
        >
          {label}
        </span>

        <strong
          style={
            styles.routeValue
          }
        >
          {value}
        </strong>
      </div>
    </div>
  );
}

export default function TransporterJobs() {
  const navigate =
    useNavigate();

  const {
    language,
    setLanguage,
  } = useLanguage();

  const copy =
    useMemo(
      () =>
        COPY[language] ||
        COPY.en,
      [language]
    );

  const [
    transporter,
    setTransporter,
  ] = useState(null);

  const [
    requests,
    setRequests,
  ] = useState([]);

  const [
    filter,
    setFilter,
  ] = useState("ALL");

  const [
    query,
    setQuery,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    busyId,
    setBusyId,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  const [
    cancelTarget,
    setCancelTarget,
  ] = useState(null);

  const [
    cancelReason,
    setCancelReason,
  ] = useState("");

  const [
    connection,
    setConnection,
  ] = useState(
    "unknown"
  );

  const transporterId =
    useMemo(
      () =>
        sessionTransporterId(),
      []
    );

  const load =
    useCallback(
      async ({
        silent = false,
      } = {}) => {
        if (
          !transporterId
        ) {
          setError(
            copy.login
          );
          setLoading(false);
          return;
        }

        if (!silent) {
          setLoading(true);
        }

        try {
          const [
            transporterResponse,
            requestResponse,
          ] =
            await Promise.all([
              api(
                `/api/transporters/${encodeURIComponent(
                  transporterId
                )}`
              ),
              api(
                `/api/transport/requests?transporterId=${encodeURIComponent(
                  transporterId
                )}&activeOnly=false`
              ),
            ]);

          setTransporter(
            transporterResponse?.transporter ||
              null
          );

          setRequests(
            Array.isArray(
              requestResponse?.requests
            )
              ? requestResponse.requests
              : []
          );

          setConnection(
            "connected"
          );

          setError("");
        } catch (
          loadError
        ) {
          setConnection(
            "disconnected"
          );

          setError(
            loadError?.message ||
              "Unable to load jobs."
          );
        } finally {
          if (!silent) {
            setLoading(false);
          }
        }
      },
      [
        copy.login,
        transporterId,
      ]
    );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const id =
      window.setInterval(
        () =>
          load({
            silent: true,
          }),
        15000
      );

    return () =>
      window.clearInterval(
        id
      );
  }, [load]);

  const online =
    transporter?.is_online ===
      true ||
    transporter?.isOnline ===
      true;

  const activeTrip =
    requests.find(
      (request) =>
        String(
          request.transporter_id ||
            ""
        ) ===
          String(
            transporterId
          ) &&
        ACTIVE.has(
          String(
            request.status ||
              ""
          ).toUpperCase()
        )
    );

  const filtered =
    useMemo(() => {
      const lower =
        query
          .trim()
          .toLowerCase();

      return requests
        .filter((request) => {
          if (
            filter === "ALL"
          ) {
            return true;
          }

          return (
            category(
              request.status
            ) === filter
          );
        })
        .filter((request) => {
          if (!lower) {
            return true;
          }

          const haystack =
            [
              request.farmer_name,
              request.crop,
              request.pickup_address,
              request.farmer_village,
              request.request_farmer_village,
              request.farmer_district,
              request.request_farmer_district,
              request.center_name,
              request.center_address,
              request.status,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

          return haystack.includes(
            lower
          );
        });
    }, [
      filter,
      query,
      requests,
    ]);

  const counts =
    useMemo(() => {
      const output = {
        ALL: requests.length,
        REQUESTED: 0,
        ASSIGNED: 0,
        ACTIVE: 0,
        COMPLETED: 0,
      };

      for (
        const request of requests
      ) {
        const group =
          category(
            request.status
          );

        if (
          group in output
        ) {
          output[group] += 1;
        }
      }

      return output;
    }, [requests]);

  const toggleOnline =
    async () => {
      try {
        setError("");

        const next =
          !online;

        const data =
          await api(
            `/api/transporters/${encodeURIComponent(
              transporterId
            )}/availability`,
            {
              method: "PATCH",
              body:
                JSON.stringify({
                  isOnline:
                    next,
                  is_online:
                    next,
                }),
            }
          );

        setTransporter(
          data?.transporter ||
            transporter
        );

        setSuccess(
          next
            ? copy.online
            : copy.offline
        );

        await load({
          silent: true,
        });
      } catch (
        toggleError
      ) {
        setError(
          toggleError?.message ||
            "Unable to update availability."
        );
      }
    };

  const accept =
    async (requestId) => {
      if (!online) {
        setError(
          copy.mustBeOnline
        );
        return;
      }

      if (activeTrip) {
        setError(
          copy.activeTrip
        );
        return;
      }

      setBusyId(
        String(requestId)
      );
      setError("");
      setSuccess("");

      try {
        const data =
          await api(
            `/api/transport/requests/${encodeURIComponent(
              requestId
            )}/accept`,
            {
              method: "PATCH",
              body:
                JSON.stringify({
                  transporterId,
                }),
            }
          );

        setSuccess(
          data?.message ||
            copy.accepted
        );

        await load({
          silent: true,
        });
      } catch (
        acceptError
      ) {
        setError(
          acceptError?.message ||
            copy.notAvailable
        );

        await load({
          silent: true,
        });
      } finally {
        setBusyId("");
      }
    };

  const decline =
    async (
      requestId,
      reason
    ) => {
      setBusyId(
        String(requestId)
      );
      setError("");
      setSuccess("");

      try {
        const data =
          await api(
            `/api/transport/requests/${encodeURIComponent(
              requestId
            )}/reject`,
            {
              method: "PATCH",
              body:
                JSON.stringify({
                  transporterId,
                  reason:
                    String(
                      reason || ""
                    ).trim() ||
                    "Transporter declined the request.",
                }),
            }
          );

        setSuccess(
          data?.message ||
            copy.declined
        );

        await load({
          silent: true,
        });
      } catch (
        declineError
      ) {
        setError(
          declineError?.message ||
            "Unable to decline request."
        );
      } finally {
        setBusyId("");
      }
    };

  const cancelActiveTrip =
    async () => {
      if (!cancelTarget?.id) return;

      const status =
        String(
          cancelTarget.status || ""
        ).toUpperCase();

      if (
        ![
          "ASSIGNED",
          "EN_ROUTE_TO_FARMER",
          "CROP_PICKED_UP",
          "EN_ROUTE_TO_CENTER",
          "DELIVERED",
        ].includes(status)
      ) {
        setError(copy.cancelTripError);
        return;
      }

      const reason =
        String(cancelReason || "").trim();

      if (!reason) {
        setError(
          copy.cancellationReasonRequired
        );
        return;
      }

      setBusyId(String(cancelTarget.id));
      setError("");
      setSuccess("");

      try {
        const data =
          await api(
            `/api/transport/requests/${encodeURIComponent(
              cancelTarget.id
            )}/status`,
            {
              method: "PATCH",
              body: JSON.stringify({
                transporterId,
                status: "CANCELLED",
                note:
                  `Transporter cancelled the active trip. Reason: ${reason}`,
              }),
            }
          );

        setCancelTarget(null);
        setCancelReason("");

        setSuccess(
          data?.message ||
            copy.tripCancelled
        );

        await load({
          silent: true,
        });
      } catch (cancelError) {
        setError(
          cancelError?.message ||
            copy.cancelTripError
        );
      } finally {
        setBusyId("");
      }
    };

  const goDashboard =
    () =>
      navigate(
        "/transporter/dashboard"
      );

  if (!transporterId) {
    return null;
  }

  return (
    <div
      className="ks-jobs-page"
      style={
        styles.page
      }
    >
      <Header />

      <main
        style={
          styles.shell
        }
      >
        <header
          style={
            styles.header
          }
        >
          <div>
            <button
              type="button"
              onClick={
                goDashboard
              }
              style={
                styles.backButton
              }
            >
              <ChevronLeft
                size={16}
              />
              {copy.back}
            </button>

            <span
              style={
                styles.eyebrow
              }
            >
              {copy.eyebrow}
            </span>

            <h1
              style={
                styles.title
              }
            >
              {copy.title}
            </h1>

            <p
              style={
                styles.subtitle
              }
            >
              {copy.subtitle}
            </p>
          </div>

          <div
            style={
              styles.headerActions
            }
          >
            <div
              style={
                styles.language
              }
            >
              <Globe2
                size={15}
              />

              {[
                ["en", "English"],
                ["hi", "हिन्दी"],
                ["te", "తెలుగు"],
              ].map(
                ([id, label]) => (
                  <button
                    type="button"
                    key={id}
                    onClick={() =>
                      setLanguage(id)
                    }
                    style={{
                      ...styles.languageButton,
                      ...(language ===
                      id
                        ? styles.languageActive
                        : {}),
                    }}
                  >
                    {label}
                  </button>
                )
              )}
            </div>

            <button
              type="button"
              onClick={
                toggleOnline
              }
              style={{
                ...styles.onlineButton,
                ...(online
                  ? styles.onlineOn
                  : {}),
              }}
            >
              <span
                style={
                  styles.onlineDot
                }
              />
              {online
                ? copy.goOffline
                : copy.goOnline}
            </button>

            <button
              type="button"
              onClick={() =>
                load()
              }
              disabled={
                refreshing
              }
              style={
                styles.refreshButton
              }
            >
              <RefreshCw
                size={15}
              />
              {copy.refresh}
            </button>
          </div>
        </header>

        {error ? (
          <div
            style={
              styles.error
            }
          >
            <XCircle size={17} />
            <span>
              {error}
            </span>
            <button
              type="button"
              onClick={() =>
                load()
              }
              style={
                styles.inlineButton
              }
            >
              {copy.retry}
            </button>
          </div>
        ) : null}

        {success ? (
          <div
            style={
              styles.success
            }
          >
            <CheckCircle2
              size={17}
            />
            <span>
              {success}
            </span>
            <button
              type="button"
              onClick={() =>
                setSuccess("")
              }
              style={
                styles.closeAlert
              }
            >
              <X size={15} />
            </button>
          </div>
        ) : null}

        <section
          style={
            styles.controlBar
          }
        >
          <div
            style={
              styles.areaSummary
            }
          >
            <div
              style={
                styles.areaIcon
              }
            >
              <MapPin
                size={18}
              />
            </div>

            <div>
              <span
                style={
                  styles.miniEyebrow
                }
              >
                {copy.serviceArea}
              </span>

              <strong
                style={
                  styles.areaText
                }
              >
                {[
                  transporter?.village,
                  transporter?.mandal,
                  transporter?.district,
                  transporter?.state,
                ]
                  .filter(Boolean)
                  .join(" · ") ||
                  "Not configured"}
              </strong>
            </div>
          </div>

          <div
            style={
              styles.connection
            }
          >
            <span
              style={{
                ...styles.connectionDot,
                background:
                  connection ===
                  "connected"
                    ? "#33a05c"
                    : "#c65c4d",
              }}
            />
            <span>
              {copy.connection}:{" "}
              {connection ===
              "connected"
                ? copy.connected
                : copy.disconnected}
            </span>
          </div>
        </section>

        <section
          style={
            styles.toolbar
          }
        >
          <div
            style={
              styles.searchBox
            }
          >
            <Search
              size={17}
            />

            <input
              value={query}
              onChange={(event) =>
                setQuery(
                  event.target.value
                )
              }
              placeholder={
                copy.search
              }
              style={
                styles.searchInput
              }
            />

            {query ? (
              <button
                type="button"
                onClick={() =>
                  setQuery("")
                }
                style={
                  styles.searchClear
                }
              >
                <X size={15} />
              </button>
            ) : null}
          </div>

          <div
            style={
              styles.filterGroup
            }
          >
            <Filter
              size={15}
            />

            {FILTERS.map(
              (item) => {
                let label =
                  copy.all;

                if (
                  item ===
                  "REQUESTED"
                )
                  label =
                    copy.waiting;

                if (
                  item ===
                  "ASSIGNED"
                )
                  label =
                    copy.assigned;

                if (
                  item ===
                  "ACTIVE"
                )
                  label =
                    copy.active;

                if (
                  item ===
                  "COMPLETED"
                )
                  label =
                    copy.completed;

                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() =>
                      setFilter(
                        item
                      )
                    }
                    style={{
                      ...styles.filterButton,
                      ...(filter ===
                      item
                        ? styles.filterActive
                        : {}),
                    }}
                  >
                    {label}
                    <span
                      style={
                        styles.count
                      }
                    >
                      {
                        counts[
                          item
                        ]
                      }
                    </span>
                  </button>
                );
              }
            )}
          </div>
        </section>

        {!online ? (
          <div
            style={
              styles.offlineNotice
            }
          >
            <Zap size={17} />

            <div>
              <strong>
                {copy.offline}
              </strong>

              <span>
                {copy.mustBeOnline}
              </span>
            </div>
          </div>
        ) : null}

        {activeTrip ? (
          <>
            <div
              className="ks-active-trip-notice"
              style={styles.activeNotice}
            >
              <div style={styles.activeNoticeIcon}>
                <Truck size={21} />
              </div>

              <div style={styles.activeNoticeMain}>
                <div style={styles.activeNoticeTitleRow}>
                  <div>
                    <span style={styles.activeNoticeEyebrow}>
                      {copy.active}
                    </span>
                    <strong style={styles.activeNoticeTitle}>
                      {activeTrip.crop || "Transport trip"}
                    </strong>
                  </div>

                  <span style={styles.activeStatusPill}>
                    {statusText(
                      activeTrip.status,
                      language
                    )}
                  </span>
                </div>

                <div
                  className="ks-active-notice-meta"
                  style={styles.activeNoticeMeta}
                >
                  <span style={styles.activeMetaGreen}>
                    <Truck size={14} />
                    <strong>
                      {formatQuantity(
                        activeTrip.quantity_kg
                      )}{" "}
                      kg
                    </strong>
                  </span>

                  <span style={styles.activeMetaGreen}>
                    <MapPin size={14} />
                    <strong>
                      {activeTrip.pickup_address ||
                        activeTrip.farmer_village ||
                        copy.pickup}
                    </strong>
                  </span>

                  <span style={styles.activeMetaGold}>
                    <Navigation size={14} />
                    <strong>
                      {activeTrip.center_name ||
                        activeTrip.center_address ||
                        copy.destination}
                    </strong>
                  </span>

                  <span style={styles.activeMetaBlue}>
                    <Clock3 size={14} />
                    <strong>
                      {formatRequestedDateTime(
                        activeTrip,
                        language
                      )}
                    </strong>
                  </span>
                </div>
              </div>

              <div style={styles.activeNoticeActions}>
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/transporter/trip/${encodeURIComponent(
                        activeTrip.id
                      )}`
                    )
                  }
                  style={styles.noticePrimaryButton}
                >
                  <Navigation size={14} />
                  {copy.viewTrip}
                </button>

                {[
                  "ASSIGNED",
                  "EN_ROUTE_TO_FARMER",
                  "CROP_PICKED_UP",
                  "EN_ROUTE_TO_CENTER",
                  "DELIVERED",
                ].includes(
                  String(
                    activeTrip.status || ""
                  ).toUpperCase()
                ) ? (
                  <button
                    type="button"
                    onClick={() => {
                      setCancelTarget(activeTrip);
                      setCancelReason("");
                      setError("");
                    }}
                    style={styles.noticeDangerButton}
                    disabled={
                      String(
                        busyId || ""
                      ) ===
                      String(activeTrip.id)
                    }
                  >
                    <X size={14} />
                    {copy.cancelTrip}
                  </button>
                ) : null}
              </div>
            </div>

            {cancelTarget ? (
              <div style={styles.cancelOverlay}>
                <div
                  style={styles.cancelModal}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="transporter-cancel-title"
                >
                  <div style={styles.cancelIcon}>
                    <XCircle size={23} />
                  </div>

                  <span style={styles.cancelEyebrow}>
                    {copy.cancelTrip}
                  </span>

                  <h2
                    id="transporter-cancel-title"
                    style={styles.cancelTitle}
                  >
                    {copy.cancelTripTitle}
                  </h2>

                  <p style={styles.cancelText}>
                    {cancelTarget?.farmer_name
                      ? `${cancelTarget.farmer_name} • `
                      : ""}
                    {cancelTarget?.crop ||
                      "Transport trip"}
                    {cancelTarget?.quantity_kg
                      ? ` • ${formatQuantity(
                          cancelTarget.quantity_kg
                        )} kg`
                      : ""}
                  </p>

                  <label style={styles.cancelLabel}>
                    {copy.cancelTripReason}
                    <span style={styles.requiredMark}>
                      *
                    </span>
                  </label>

                  <textarea
                    value={cancelReason}
                    onChange={event =>
                      setCancelReason(
                        event.target.value
                      )
                    }
                    placeholder={
                      copy.cancelTripReasonPlaceholder
                    }
                    rows={4}
                    autoFocus
                    maxLength={500}
                    style={styles.cancelTextarea}
                  />

                  <div
                    style={styles.cancelReasonHint}
                  >
                    {cancelReason.length}/500
                  </div>

                  <div
                    style={styles.cancelModalActions}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setCancelTarget(null);
                        setCancelReason("");
                        setError("");
                      }}
                      style={styles.cancelKeepButton}
                      disabled={
                        String(
                          busyId || ""
                        ) ===
                        String(cancelTarget.id)
                      }
                    >
                      {copy.keepTrip}
                    </button>

                    <button
                      type="button"
                      onClick={cancelActiveTrip}
                      style={styles.confirmCancelButton}
                      disabled={
                        String(
                          busyId || ""
                        ) ===
                        String(cancelTarget.id)
                      }
                    >
                      {String(
                        busyId || ""
                      ) ===
                      String(cancelTarget.id) ? (
                        <span style={styles.spinner} />
                      ) : (
                        <X size={15} />
                      )}
                      {copy.confirmCancelTrip}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </>
        ) : null}

        <div
          style={
            styles.resultsHeader
          }
        >
          <div>
            <span
              style={
                styles.miniEyebrow
              }
            >
              {copy.jobsFound}
            </span>

            <strong
              style={
                styles.resultCount
              }
            >
              {filtered.length}
            </strong>
          </div>

          {loading ? (
            <span
              style={
                styles.loadingText
              }
            >
              {copy.refreshing}
            </span>
          ) : null}
        </div>

        {loading ? (
          <div
            style={
              styles.grid
            }
          >
            {[1, 2, 3, 4].map(
              (item) => (
                <div
                  key={item}
                  style={
                    styles.skeleton
                  }
                >
                  <div
                    style={
                      styles.skeletonSmall
                    }
                  />
                  <div
                    style={
                      styles.skeletonMedium
                    }
                  />
                  <div
                    style={
                      styles.skeletonLine
                    }
                  />
                  <div
                    style={
                      styles.skeletonLine
                    }
                  />
                  <div
                    style={
                      styles.skeletonLine
                    }
                  />
                </div>
              )
            )}
          </div>
        ) : filtered.length ? (
          <div
            style={
              styles.grid
            }
          >
            {filtered.map(
              (request) => (
                <JobCard
                  key={
                    request.id
                  }
                  request={
                    request
                  }
                  language={
                    language
                  }
                  copy={
                    copy
                  }
                  transporter={
                    transporter
                  }
                  canAccept={
                    online &&
                    !activeTrip
                  }
                  busyId={
                    busyId
                  }
                  onAccept={
                    accept
                  }
                  onDecline={
                    decline
                  }
                />
              )
            )}
          </div>
        ) : (
          <div
            style={
              styles.empty
            }
          >
            <div
              style={
                styles.emptyIcon
              }
            >
              <Truck size={25} />
            </div>

            <h2
              style={
                styles.emptyTitle
              }
            >
              {copy.noJobs}
            </h2>

            <p
              style={
                styles.emptyText
              }
            >
              {copy.noJobsText}
            </p>

            <button
              type="button"
              onClick={() =>
                load()
              }
              style={
                styles.refreshButton
              }
            >
              <RefreshCw
                size={15}
              />
              {copy.refresh}
            </button>
          </div>
        )}

        <footer
          style={
            styles.footer
          }
        >
          <ShieldCheck
            size={15}
          />

          <span>
            {copy.locationProtected}
          </span>

          <button
            type="button"
            onClick={
              goDashboard
            }
            style={
              styles.footerLink
            }
          >
            {copy.profile}
          </button>
        </footer>
      </main>

      <style>
        {`
          @keyframes ks-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          .ks-refreshing {
            animation: ks-spin 0.8s linear infinite;
          }

          @media (max-width: 820px) {
            .ks-jobs-grid {
              grid-template-columns: 1fr !important;
            }
            .ks-jobs-header {
              flex-direction: column !important;
              align-items: stretch !important;
            }
            .ks-jobs-actions {
              justify-content: flex-start !important;
            }
            .ks-jobs-toolbar {
              flex-direction: column !important;
              align-items: stretch !important;
            }
          }

          .ks-jobs-page .ks-job-card-hover {
            transition:
              transform .18s ease,
              box-shadow .18s ease,
              border-color .18s ease;
          }

          .ks-jobs-page .ks-job-card-hover:hover {
            transform: translateY(-3px);
            box-shadow:
              0 20px 45px rgba(27,77,47,.11) !important;
            border-color: #b9d8c4 !important;
          }

          .ks-jobs-page .ks-active-trip-notice {
            animation:
              ks-active-enter .45s ease-out both;
          }

          @keyframes ks-active-enter {
            from {
              opacity: 0;
              transform: translateY(8px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .ks-jobs-page .ks-active-notice-meta strong {
            overflow-wrap: anywhere;
          }

          .ks-jobs-page textarea:focus {
            border-color: #c65b4d !important;
            box-shadow:
              0 0 0 4px rgba(198,91,77,.10);
          }

          @media (max-width: 900px) {
            .ks-active-notice-meta {
              grid-template-columns:
                repeat(2, minmax(0, 1fr)) !important;
            }

            .ks-active-trip-notice {
              flex-wrap: wrap;
            }

            .ks-active-trip-notice > div:nth-child(2) {
              min-width: 0;
              flex-basis:
                calc(100% - 70px);
            }

            .ks-active-trip-notice > div:last-child {
              width: 100%;
              flex-direction: row !important;
            }

            .ks-active-trip-notice > div:last-child > button {
              flex: 1;
            }
          }

          @media (max-width: 600px) {
            .ks-active-notice-meta {
              grid-template-columns: 1fr !important;
            }

            .ks-active-trip-notice {
              padding: 15px !important;
            }

            .ks-active-trip-notice > div:nth-child(2) {
              flex-basis: calc(100% - 70px);
            }

            .ks-active-trip-notice > div:last-child {
              width: 100%;
              flex-direction: column !important;
            }

            .ks-active-trip-notice > div:last-child > button {
              width: 100%;
            }

            .ks-jobs-toolbar {
              gap: 10px !important;
            }

            .ks-jobs-page input,
            .ks-jobs-page button,
            .ks-jobs-page a {
              min-height: 44px;
            }

            .ks-jobs-page .ks-job-card {
              width: 100%;
            }
          }
        `}
      </style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #f7faf8 0%, #ffffff 45%, #f8fbf9 100%)",
    color: "#213329",
  },

  shell: {
    width:
      "min(1360px, calc(100% - 32px))",
    margin: "0 auto",
    padding:
      "34px 0 70px",
  },

  header: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent:
      "space-between",
    gap: "20px",
    padding:
      "7px 0 21px",
    borderBottom:
      "1px solid #e2eae4",
  },

  backButton: {
    border: 0,
    background:
      "transparent",
    padding: 0,
    marginBottom: "14px",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    color: "#5b7063",
    fontSize: "11px",
    fontWeight: 800,
    cursor: "pointer",
  },

  eyebrow: {
    display: "block",
    color: "#7b8980",
    fontSize: "9px",
    fontWeight: 800,
    letterSpacing:
      "0.16em",
  },

  title: {
    margin:
      "7px 0 0",
    color:
      "#153b27",
    fontSize:
      "clamp(32px, 4vw, 46px)",
    lineHeight: 1.08,
    letterSpacing:
      "-0.035em",
  },

  subtitle: {
    margin:
      "10px 0 0",
    maxWidth:
      "820px",
    color:
      "#61786b",
    fontSize:
      "14px",
    lineHeight: 1.6,
  },

  headerActions: {
    display: "flex",
    alignItems:
      "center",
    justifyContent:
      "flex-end",
    gap: "8px",
    flexWrap:
      "wrap",
  },

  language: {
    display: "flex",
    alignItems:
      "center",
    gap: "3px",
    padding: "4px",
    borderRadius:
      "10px",
    border:
      "1px solid #dfe8e1",
    background:
      "#ffffff",
    color: "#65756b",
  },

  languageButton: {
    border: 0,
    borderRadius:
      "7px",
    padding:
      "6px 8px",
    background:
      "transparent",
    color: "#65756b",
    fontSize: "10px",
    cursor: "pointer",
  },

  languageActive: {
    background:
      "#246d40",
    color:
      "#ffffff",
    fontWeight: 800,
  },

  onlineButton: {
    display: "inline-flex",
    alignItems:
      "center",
    gap: "7px",
    minHeight:
      "36px",
    padding:
      "0 11px",
    borderRadius:
      "10px",
    border:
      "1px solid #dbe6df",
    background:
      "#f4f7f5",
    color: "#5e7065",
    fontSize: "10px",
    fontWeight: 800,
    cursor: "pointer",
  },

  onlineOn: {
    background:
      "#e7f5eb",
    borderColor:
      "#c9e5d1",
    color:
      "#286e42",
  },

  onlineDot: {
    width: "7px",
    height: "7px",
    borderRadius:
      "50%",
    background:
      "#34a35d",
    boxShadow:
      "0 0 0 3px rgba(52,163,93,0.12)",
  },

  refreshButton: {
    display: "inline-flex",
    alignItems:
      "center",
    justifyContent:
      "center",
    gap: "7px",
    minHeight:
      "36px",
    padding:
      "0 12px",
    borderRadius:
      "10px",
    border:
      "1px solid #216d3f",
    background:
      "#246f40",
    color:
      "#ffffff",
    fontSize: "10px",
    fontWeight: 800,
    cursor: "pointer",
  },

  error: {
    display: "flex",
    alignItems:
      "center",
    gap: "9px",
    marginTop:
      "14px",
    padding:
      "11px 13px",
    borderRadius:
      "11px",
    border:
      "1px solid #efd6d0",
    background:
      "#fff5f2",
    color:
      "#995144",
    fontSize: "11px",
  },

  success: {
    display: "flex",
    alignItems:
      "center",
    gap: "9px",
    marginTop:
      "14px",
    padding:
      "11px 13px",
    borderRadius:
      "11px",
    border:
      "1px solid #cfe7d4",
    background:
      "#eff9f2",
    color:
      "#286a40",
    fontSize: "11px",
  },

  inlineButton: {
    marginLeft:
      "auto",
    border: 0,
    background:
      "transparent",
    color:
      "inherit",
    fontSize:
      "10px",
    fontWeight: 800,
    textDecoration:
      "underline",
    cursor:
      "pointer",
  },

  closeAlert: {
    marginLeft:
      "auto",
    border: 0,
    background:
      "transparent",
    color:
      "inherit",
    cursor:
      "pointer",
  },

  controlBar: {
    display: "flex",
    alignItems:
      "center",
    justifyContent:
      "space-between",
    gap: "18px",
    marginTop:
      "16px",
    padding:
      "13px 15px",
    borderRadius:
      "15px",
    background:
      "#f8fbf9",
    border:
      "1px solid #dfe9e2",
  },

  areaSummary: {
    display: "flex",
    alignItems:
      "center",
    gap: "10px",
    minWidth: 0,
  },

  areaIcon: {
    width: "38px",
    height: "38px",
    borderRadius:
      "11px",
    display: "flex",
    alignItems:
      "center",
    justifyContent:
      "center",
    background:
      "#e7f4eb",
    color:
      "#2a7345",
  },

  miniEyebrow: {
    display: "block",
    color:
      "#87938c",
    fontSize: "8px",
    fontWeight: 800,
    textTransform:
      "uppercase",
    letterSpacing:
      "0.13em",
  },

  areaText: {
    display: "block",
    marginTop:
      "3px",
    color:
      "#2b4033",
    fontSize: "12px",
  },

  connection: {
    display: "inline-flex",
    alignItems:
      "center",
    gap: "6px",
    color:
      "#748179",
    fontSize: "10px",
    whiteSpace:
      "nowrap",
  },

  connectionDot: {
    width: "7px",
    height: "7px",
    borderRadius:
      "999px",
  },

  toolbar: {
    display: "flex",
    alignItems:
      "center",
    justifyContent:
      "space-between",
    gap: "15px",
    marginTop:
      "15px",
  },

  searchBox: {
    flex: 1,
    minWidth: 0,
    minHeight:
      "42px",
    display: "flex",
    alignItems:
      "center",
    gap: "8px",
    padding:
      "0 12px",
    borderRadius:
      "11px",
    border:
      "1px solid #dfe8e2",
    background:
      "#ffffff",
    color:
      "#738078",
  },

  searchInput: {
    flex: 1,
    minWidth: 0,
    border: 0,
    outline: 0,
    background:
      "transparent",
    color:
      "#33463a",
    fontFamily:
      "inherit",
    fontSize:
      "11px",
  },

  searchClear: {
    width: "26px",
    height: "26px",
    border: 0,
    background:
      "#f0f4f1",
    borderRadius:
      "8px",
    display: "inline-flex",
    alignItems:
      "center",
    justifyContent:
      "center",
    color:
      "#7c8982",
    cursor:
      "pointer",
  },

  filterGroup: {
    display: "flex",
    alignItems:
      "center",
    gap: "4px",
    padding:
      "4px",
    borderRadius:
      "11px",
    border:
      "1px solid #dfe7e1",
    background:
      "#f8faf9",
    flexWrap:
      "wrap",
  },

  filterButton: {
    border: 0,
    borderRadius:
      "8px",
    padding:
      "7px 8px",
    background:
      "transparent",
    color:
      "#6f7e75",
    fontSize:
      "10px",
    fontWeight:
      800,
    cursor:
      "pointer",
    display:
      "inline-flex",
    alignItems:
      "center",
    gap:
      "5px",
  },

  filterActive: {
    background:
      "#246d40",
    color:
      "#ffffff",
  },

  count: {
    minWidth:
      "15px",
    height:
      "15px",
    display:
      "inline-flex",
    alignItems:
      "center",
    justifyContent:
      "center",
    borderRadius:
      "999px",
    background:
      "rgba(0,0,0,0.07)",
    fontSize:
      "8px",
  },

  offlineNotice: {
    display:
      "flex",
    alignItems:
      "center",
    gap:
      "10px",
    marginTop:
      "13px",
    padding:
      "11px 13px",
    borderRadius:
      "11px",
    background:
      "#fff8ef",
    border:
      "1px solid #efdfc4",
    color:
      "#8a6c37",
    fontSize:
      "10px",
  },

  activeNotice: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginTop: "17px",
    padding: "19px",
    borderRadius: "20px",
    background:
      "linear-gradient(135deg, #eef9f2 0%, #f8fcfa 100%)",
    border:
      "1px solid #cde6d5",
    color: "#205d3a",
    boxShadow:
      "0 16px 38px rgba(24,96,55,.09)",
  },

  noticeButton: {
    marginLeft:
      "auto",
    border:
      "1px solid #cde1d3",
    background:
      "#ffffff",
    color:
      "#2a7044",
    borderRadius:
      "8px",
    padding:
      "7px 10px",
    fontSize:
      "9px",
    fontWeight:
      800,
    cursor:
      "pointer",
  },

  activeNoticeIcon: {
    width: "56px",
    height: "56px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "17px",
    background:
      "linear-gradient(135deg, #d8f3e1, #eefaf2)",
    color: "#1c7a47",
    boxShadow:
      "0 9px 22px rgba(28,122,71,.13)",
  },

  activeNoticeMain: {
    minWidth: 0,
    flex: 1,
  },

  activeNoticeTitleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "13px",
  },

  activeNoticeEyebrow: {
    display: "block",
    color: "#6c8b79",
    fontSize: "9px",
    fontWeight: 950,
    letterSpacing: ".14em",
    textTransform: "uppercase",
  },

  activeNoticeTitle: {
    display: "block",
    marginTop: "3px",
    color: "#113b25",
    fontSize: "21px",
    fontWeight: 950,
    lineHeight: 1.2,
  },

  activeStatusPill: {
    flexShrink: 0,
    padding: "8px 11px",
    borderRadius: "999px",
    background: "#fff3dc",
    color: "#a26412",
    border: "1px solid #efd7aa",
    fontSize: "9px",
    fontWeight: 950,
  },

  activeNoticeMeta: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: "9px",
    marginTop: "13px",
  },

  activeMetaGreen: {
    display: "flex",
    alignItems: "flex-start",
    gap: "6px",
    minWidth: 0,
    padding: "10px",
    borderRadius: "11px",
    background: "#ffffff",
    border: "1px solid #dcebe1",
    color: "#405f50",
    fontSize: "10px",
    lineHeight: 1.4,
  },

  activeMetaGold: {
    display: "flex",
    alignItems: "flex-start",
    gap: "6px",
    minWidth: 0,
    padding: "10px",
    borderRadius: "11px",
    background: "#fffaf0",
    border: "1px solid #ebdfc8",
    color: "#6d5e3f",
    fontSize: "10px",
    lineHeight: 1.4,
  },

  activeMetaBlue: {
    display: "flex",
    alignItems: "flex-start",
    gap: "6px",
    minWidth: 0,
    padding: "10px",
    borderRadius: "11px",
    background: "#f0f6ff",
    border: "1px solid #d3def4",
    color: "#49688e",
    fontSize: "10px",
    lineHeight: 1.4,
  },

  activeNoticeActions: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    flexShrink: 0,
  },

  noticePrimaryButton: {
    minHeight: "42px",
    padding: "0 13px",
    borderRadius: "11px",
    border: "1px solid #1d6d40",
    background: "#217445",
    color: "#ffffff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    fontSize: "10px",
    fontWeight: 900,
    cursor: "pointer",
    boxShadow:
      "0 7px 18px rgba(33,116,69,.17)",
  },

  noticeDangerButton: {
    minHeight: "42px",
    padding: "0 13px",
    borderRadius: "11px",
    border: "1px solid #e1bbb3",
    background: "#fff2ef",
    color: "#a04437",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    fontSize: "10px",
    fontWeight: 900,
    cursor: "pointer",
  },

  cancelOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 10000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    background:
      "rgba(10,28,18,.62)",
    backdropFilter: "blur(8px)",
  },

  cancelModal: {
    width:
      "min(540px, 100%)",
    maxHeight:
      "min(90vh, 700px)",
    overflowY: "auto",
    padding: "28px",
    borderRadius: "24px",
    background: "#ffffff",
    border: "1px solid #dce8e0",
    boxShadow:
      "0 30px 100px rgba(0,0,0,.24)",
  },

  cancelIcon: {
    width: "54px",
    height: "54px",
    display: "grid",
    placeItems: "center",
    borderRadius: "16px",
    background: "#fff0ed",
    color: "#aa4538",
    marginBottom: "14px",
  },

  cancelEyebrow: {
    display: "block",
    color: "#9b655c",
    fontSize: "10px",
    fontWeight: 950,
    letterSpacing: ".14em",
    textTransform: "uppercase",
  },

  cancelTitle: {
    margin:
      "6px 0 8px",
    color: "#40211d",
    fontSize: "27px",
    lineHeight: 1.15,
  },

  cancelText: {
    margin: 0,
    color: "#6a7a72",
    fontSize: "12px",
    lineHeight: 1.55,
  },

  cancelLabel: {
    display: "block",
    marginTop: "18px",
    marginBottom: "7px",
    color: "#574b47",
    fontSize: "11px",
    fontWeight: 900,
  },

  requiredMark: {
    color: "#b13f32",
    marginLeft: "3px",
  },

  cancelTextarea: {
    width: "100%",
    minHeight: "116px",
    boxSizing: "border-box",
    resize: "vertical",
    border: "1px solid #dcc8c3",
    borderRadius: "12px",
    padding: "12px",
    outline: "none",
    fontFamily: "inherit",
    fontSize: "13px",
    lineHeight: 1.5,
    color: "#2d3e35",
    background: "#fffdfd",
  },

  cancelReasonHint: {
    textAlign: "right",
    marginTop: "4px",
    color: "#9aaaa1",
    fontSize: "9px",
  },

  cancelModalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "9px",
    marginTop: "16px",
  },

  cancelKeepButton: {
    minHeight: "44px",
    padding: "0 15px",
    borderRadius: "11px",
    border: "1px solid #d7e2dc",
    background: "#ffffff",
    color: "#4d6559",
    fontSize: "11px",
    fontWeight: 900,
    cursor: "pointer",
  },

  confirmCancelButton: {
    minHeight: "44px",
    padding: "0 15px",
    borderRadius: "11px",
    border: "1px solid #9d3e31",
    background: "#a44537",
    color: "#ffffff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    fontSize: "11px",
    fontWeight: 900,
    cursor: "pointer",
    boxShadow:
      "0 8px 20px rgba(164,69,55,.18)",
  },

  statusRequested: {
    background: "#e8f6ed",
    color: "#1c7a43",
    border:
      "1px solid #c4e1ce",
  },

  statusAssigned: {
    background: "#eaf0ff",
    color: "#3a5fa1",
    border:
      "1px solid #cbd8f4",
  },

  statusActive: {
    background: "#fff2dc",
    color: "#a46312",
    border:
      "1px solid #edd4a7",
  },

  statusCompleted: {
    background: "#e8f7ef",
    color: "#1a7149",
    border:
      "1px solid #c4e4d2",
  },

  statusCancelled: {
    background: "#fff0ed",
    color: "#a04437",
    border:
      "1px solid #edc9c1",
  },

  resultsHeader: {
    display:
      "flex",
    justifyContent:
      "space-between",
    alignItems:
      "flex-end",
    margin:
      "23px 0 11px",
  },

  resultCount: {
    display:
      "block",
    marginTop:
      "3px",
    color:
      "#264132",
    fontSize:
      "19px",
  },

  loadingText: {
    color:
      "#89948e",
    fontSize:
      "10px",
  },

  grid: {
    display:
      "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap:
      "13px",
  },

  skeleton: {
    minHeight:
      "275px",
    padding:
      "19px",
    borderRadius:
      "18px",
    background:
      "#ffffff",
    border:
      "1px solid #e7ece9",
  },

  skeletonSmall: {
    width:
      "25%",
    height:
      "9px",
    borderRadius:
      "999px",
    background:
      "#eef2ef",
  },

  skeletonMedium: {
    width:
      "54%",
    height:
      "17px",
    marginTop:
      "12px",
    borderRadius:
      "999px",
    background:
      "#eef2ef",
  },

  skeletonLine: {
    width:
      "88%",
    height:
      "11px",
    marginTop:
      "21px",
    borderRadius:
      "999px",
    background:
      "#f1f4f2",
  },

  jobCard: {
    padding:
      "24px",
    borderRadius:
      "22px",
    background:
      "#ffffff",
    border:
      "1px solid #dce8e0",
    boxShadow:
      "0 18px 44px rgba(29, 75, 47, 0.08)",
  },

  jobHead: {
    display:
      "flex",
    justifyContent:
      "space-between",
    alignItems:
      "flex-start",
    gap:
      "10px",
  },

  jobName: {
    margin:
      "5px 0 0",
    color:
      "#123b26",
    fontSize:
      "22px",
  },

  statusPill: {
    padding:
      "6px 8px",
    borderRadius:
      "999px",
    background:
      "#eef3ef",
    color:
      "#66756c",
    fontSize:
      "8px",
    fontWeight:
      800,
    textTransform:
      "uppercase",
  },

  jobInfoGrid: {
    display:
      "grid",
    gridTemplateColumns:
      "1.25fr .8fr .95fr 1.2fr",
    gap:
      "12px",
    marginTop:
      "20px",
    padding:
      "14px",
    borderRadius:
      "15px",
    background:
      "#f8fbf9",
  },

  infoLabel: {
    display:
      "block",
    color:
      "#718579",
    fontSize:
      "10px",
    fontWeight:
      850,
    textTransform:
      "uppercase",
  },

  infoValue: {
    display:
      "block",
    marginTop:
      "5px",
    color:
      "#173d28",
    fontSize:
      "14px",
    lineHeight:
      1.4,
  },

  routeCard: {
    marginTop:
      "16px",
    padding:
      "16px",
    borderRadius:
      "15px",
    border:
      "1px solid #dce8e1",
    background:
      "#fbfdfc",
  },

  routeRow: {
    display:
      "flex",
    alignItems:
      "flex-start",
    gap:
      "8px",
  },

  routeDot: {
    width:
      "9px",
    height:
      "9px",
    borderRadius:
      "999px",
    marginTop:
      "4px",
    flexShrink:
      0,
  },

  routeLabel: {
    display:
      "block",
    color:
      "#74877d",
    fontSize:
      "10px",
    fontWeight:
      850,
    textTransform:
      "uppercase",
  },

  routeValue: {
    display:
      "block",
    marginTop:
      "4px",
    color:
      "#173f29",
    fontSize:
      "13px",
    fontWeight:
      800,
    lineHeight:
      1.5,
  },

  routeConnector: {
    width:
      "1px",
    height:
      "14px",
    margin:
      "3px 0 3px 4px",
    background:
      "#d9e3dc",
  },

  regionLine: {
    display:
      "flex",
    alignItems:
      "flex-start",
    gap:
      "6px",
    marginTop:
      "11px",
    color:
      "#557065",
    fontSize:
      "10px",
    lineHeight:
      1.5,
  },

  capacityWarning: {
    display:
      "flex",
    alignItems:
      "center",
    gap:
      "6px",
    marginTop:
      "9px",
    padding:
      "8px 9px",
    borderRadius:
      "8px",
    background:
      "#fff6ec",
    color:
      "#926d37",
    fontSize:
      "9px",
  },

  jobActions: {
    display:
      "flex",
    alignItems:
      "center",
    justifyContent:
      "flex-end",
    flexWrap:
      "wrap",
    gap:
      "6px",
    marginTop:
      "13px",
  },

  secondaryButton: {
    display:
      "inline-flex",
    alignItems:
      "center",
    justifyContent:
      "center",
    gap:
      "6px",
    minHeight:
      "42px",
    padding:
      "0 13px",
    borderRadius:
      "11px",
    border:
      "1px solid #d5e2eb",
    background:
      "#f8fbfe",
    color:
      "#315a73",
    textDecoration:
      "none",
    fontSize:
      "10px",
    fontWeight:
      850,
  },

  declineButton: {
    minHeight:
      "42px",
    padding:
      "0 13px",
    borderRadius:
      "11px",
    border:
      "1px solid #e6c7c0",
    background:
      "#fff2ef",
    color:
      "#a04437",
    display:
      "inline-flex",
    alignItems:
      "center",
    gap:
      "6px",
    fontSize:
      "10px",
    fontWeight:
      850,
    cursor:
      "pointer",
  },

  acceptButton: {
    minHeight:
      "42px",
    padding:
      "0 14px",
    borderRadius:
      "11px",
    border:
      "1px solid #1b6b3e",
    background:
      "#1f7744",
    color:
      "#ffffff",
    display:
      "inline-flex",
    alignItems:
      "center",
    gap:
      "6px",
    fontSize:
      "10px",
    fontWeight:
      900,
    cursor:
      "pointer",
  },

  readOnlyBadge: {
    marginLeft:
      "auto",
    padding:
      "7px 9px",
    borderRadius:
      "8px",
    background:
      "#f2f5f3",
    color:
      "#6e7b73",
    fontSize:
      "9px",
    fontWeight:
      800,
  },

  spinner: {
    width:
      "11px",
    height:
      "11px",
    borderRadius:
      "50%",
    border:
      "2px solid rgba(255,255,255,0.4)",
    borderTopColor:
      "#ffffff",
    animation:
      "ks-spin 0.7s linear infinite",
  },

  declinePanel: {
    marginTop:
      "11px",
    padding:
      "11px",
    borderRadius:
      "10px",
    background:
      "#fff9f7",
    border:
      "1px solid #f0ddd7",
  },

  label: {
    display:
      "block",
    marginTop:
      "9px",
    marginBottom:
      "5px",
    color:
      "#775e55",
    fontSize:
      "9px",
    fontWeight:
      800,
  },

  textarea: {
    width:
      "100%",
    boxSizing:
      "border-box",
    resize:
      "vertical",
    border:
      "1px solid #e4cec7",
    borderRadius:
      "8px",
    padding:
      "8px 9px",
    fontFamily:
      "inherit",
    fontSize:
      "10px",
    color:
      "#34443a",
    outline:
      "none",
  },

  declineActions: {
    display:
      "flex",
    justifyContent:
      "flex-end",
    gap:
      "6px",
    marginTop:
      "7px",
  },

  cancelButton: {
    minHeight:
      "31px",
    padding:
      "0 9px",
    borderRadius:
      "8px",
    border:
      "1px solid #dbe4de",
    background:
      "#ffffff",
    color:
      "#66736c",
    fontSize:
      "9px",
    cursor:
      "pointer",
  },

  confirmDecline: {
    minHeight:
      "31px",
    padding:
      "0 9px",
    borderRadius:
      "8px",
    border:
      "1px solid #a65344",
    background:
      "#a65344",
    color:
      "#ffffff",
    display:
      "inline-flex",
    alignItems:
      "center",
    gap:
      "5px",
    fontSize:
      "9px",
    fontWeight:
      800,
    cursor:
      "pointer",
  },

  matchFooter: {
    display:
      "flex",
    alignItems:
      "flex-start",
    gap:
      "5px",
    marginTop:
      "11px",
    paddingTop:
      "9px",
    borderTop:
      "1px solid #edf1ee",
    color:
      "#839087",
    fontSize:
      "8px",
    lineHeight:
      1.45,
  },

  empty: {
    minHeight:
      "280px",
    borderRadius:
      "18px",
    border:
      "1px dashed #d8e4db",
    background:
      "#fbfdfb",
    display:
      "flex",
    flexDirection:
      "column",
    alignItems:
      "center",
    justifyContent:
      "center",
    textAlign:
      "center",
    padding:
      "25px",
  },

  emptyIcon: {
    width:
      "52px",
    height:
      "52px",
    borderRadius:
      "17px",
    display:
      "flex",
    alignItems:
      "center",
    justifyContent:
      "center",
    background:
      "#eef7f0",
    color:
      "#2b7445",
  },

  emptyTitle: {
    margin:
      "12px 0 0",
    color:
      "#32473a",
    fontSize:
      "16px",
  },

  emptyText: {
    maxWidth:
      "500px",
    margin:
      "7px auto 15px",
    color:
      "#79867f",
    fontSize:
      "10px",
    lineHeight:
      1.5,
  },

  footer: {
    display:
      "flex",
    alignItems:
      "center",
    gap:
      "7px",
    marginTop:
      "24px",
    paddingTop:
      "14px",
    borderTop:
      "1px solid #e5ece7",
    color:
      "#7a8780",
    fontSize:
      "9px",
  },

  footerLink: {
    marginLeft:
      "auto",
    border: 0,
    background:
      "transparent",
    color:
      "#286e42",
    fontSize:
      "9px",
    fontWeight:
      800,
    cursor:
      "pointer",
  },
};
