import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock3,
  Globe2,
  LocateFixed,
  MapPin,
  Navigation,
  Phone,
  RefreshCw,
  ShieldCheck,
  Truck,
  Wifi,
  WifiOff,
  X,
  XCircle,
  Zap,
} from "lucide-react";

import Header from "../../components/Header";
import { useLanguage } from "../../translations/LanguageContext";

/*
 * Normalize the configured backend URL before appending /api routes.
 *
 * This supports:
 *   VITE_API_URL=http://localhost:5000
 *   VITE_API_URL=http://localhost:5000/
 *   VITE_API_URL=http://localhost:5000/api
 *   VITE_API_URL=http://localhost:5000/api/
 *   VITE_API_URL=/api
 *   VITE_API_URL=   (defaults to localhost:5000)
 */
const RAW_API_BASE =
  String(import.meta.env.VITE_API_URL || "").trim();

const API_BASE = (() => {
  if (!RAW_API_BASE) {
    return "http://localhost:5000";
  }

  if (RAW_API_BASE === "/api") {
    return "";
  }

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

const ACTIVE_STATUSES = new Set([
  "ASSIGNED",
  "EN_ROUTE_TO_FARMER",
  "CROP_PICKED_UP",
  "EN_ROUTE_TO_CENTER",
  "DELIVERED",
]);

const STATUS_SEQUENCE = [
  "ASSIGNED",
  "EN_ROUTE_TO_FARMER",
  "CROP_PICKED_UP",
  "EN_ROUTE_TO_CENTER",
  "DELIVERED",
  "COMPLETED",
];

const COPY = {
  en: {
    eyebrow: "ACTIVE TRANSPORT",
    title: "Manage your trip",
    subtitle:
      "Keep the farmer informed as you move from pickup to the procurement center.",
    back: "Back to jobs",
    dashboard: "Dashboard",
    refresh: "Refresh",
    refreshing: "Refreshing…",
    online: "Online",
    offline: "Offline",
    goOnline: "Go online",
    goOffline: "Go offline",
    active: "Active",
    waiting: "Waiting",
    completed: "Completed",
    tripDetails: "Trip details",
    pickup: "Pickup",
    destination: "Destination",
    farmer: "Farmer",
    phone: "Call farmer",
    crop: "Crop",
    quantity: "Quantity",
    fare: "Fare",
    fareNotAgreed: "Fare not agreed yet",
    estimatedFare: "Farmer estimate",
    quoteFare: "Set agreed transport fare",
    fareModalText: "Before pickup, enter the fare you have agreed with the farmer. This amount will be visible to the farmer and used for the completed trip.",
    farePlaceholder: "Enter agreed fare",
    fareRequired: "Enter a fare greater than ₹0.",
    fareConfirm: "Save fare & continue",
    fareCancel: "Not now",
    fareNotice: "A positive fare is required before the crop can be marked as picked up.",
    requested: "Requested",
    status: "Status",
    nextStep: "Next step",
    startPickup: "Start pickup",
    pickedUp: "Mark crop picked up",
    startCenter: "Start to center",
    markDelivered: "Mark delivered",
    completeTrip: "Complete trip",
    updating: "Updating…",
    currentLocation: "Current GPS location",
    locationSent: "Live location updated.",
    locationOff:
      "Location access is unavailable. Enable browser location permission.",
    locationSharing:
      "Your location is shared with the farmer only for this active transport trip.",
    updated: "Last update",
    never: "Not yet",
    accuracy: "Accuracy",
    route: "Open route",
    centerRoute: "Open center route",
    timeline: "Journey timeline",
    eventHistory: "Status history",
    noEvents: "No status events have been recorded yet.",
    notFound: "Transport trip not found.",
    assignedElsewhere:
      "This trip is assigned to a different transporter.",
    completeMessage:
      "Trip completed. Your earnings have been updated.",
    statusSaved:
      "Trip status updated successfully.",
    error:
      "Unable to load or update this trip.",
    network:
      "KrishiSetu backend is not reachable.",
    login:
      "Your transporter session is missing. Please sign in again.",
    region:
      "This transport request is protected by the farmer/transporter region matching rules on the server.",
    language: "Language",
    enRouteFarmer:
      "Travel to the farmer pickup location.",
    pickupDone:
      "Confirm that the crop has been physically collected.",
    enRouteCenter:
      "Proceed to the registered procurement center.",
    delivered:
      "Mark delivery when the crop has reached the center.",
    finalStep:
      "Complete the trip after delivery has been acknowledged.",
    noActive:
      "There is no active transport trip assigned to you.",
    openMapFallback:
      "Open pickup location",
    emergency:
      "For urgent issues, use the farmer contact or report the problem through the admin workflow.",
    hideNotice: "Close",
  },
  hi: {
    eyebrow: "सक्रिय परिवहन",
    title: "अपनी यात्रा प्रबंधित करें",
    subtitle:
      "पिकअप से खरीद केंद्र तक किसान को आपकी यात्रा की स्थिति दिखाई जाती है।",
    back: "कार्यों पर वापस",
    dashboard: "डैशबोर्ड",
    refresh: "रिफ्रेश",
    refreshing: "रिफ्रेश हो रहा है…",
    online: "ऑनलाइन",
    offline: "ऑफलाइन",
    goOnline: "ऑनलाइन जाएँ",
    goOffline: "ऑफलाइन जाएँ",
    active: "सक्रिय",
    waiting: "प्रतीक्षा",
    completed: "पूरा",
    tripDetails: "यात्रा विवरण",
    pickup: "पिकअप",
    destination: "गंतव्य",
    farmer: "किसान",
    phone: "किसान को कॉल",
    crop: "फसल",
    quantity: "मात्रा",
    fare: "किराया",
    fareNotAgreed: "किराया अभी तय नहीं है",
    estimatedFare: "किसान का अनुमान",
    quoteFare: "तय किया गया किराया दर्ज करें",
    fareModalText: "पिकअप से पहले किसान के साथ तय किया गया किराया दर्ज करें। यह राशि किसान को दिखाई जाएगी और पूरी हुई यात्रा की कमाई के लिए उपयोग होगी।",
    farePlaceholder: "तय किराया दर्ज करें",
    fareRequired: "₹0 से अधिक किराया दर्ज करें।",
    fareConfirm: "किराया सेव करके आगे बढ़ें",
    fareCancel: "अभी नहीं",
    fareNotice: "फसल उठाई गई बताने से पहले सकारात्मक किराया जरूरी है।",
    requested: "अनुरोध",
    status: "स्थिति",
    nextStep: "अगला कदम",
    startPickup: "पिकअप शुरू करें",
    pickedUp: "फसल उठाई चिन्हित करें",
    startCenter: "केंद्र की ओर जाएँ",
    markDelivered: "पहुंचा हुआ चिन्हित करें",
    completeTrip: "यात्रा पूरी करें",
    updating: "अपडेट हो रहा है…",
    currentLocation: "वर्तमान GPS स्थान",
    locationSent: "लाइव लोकेशन अपडेट हो गई।",
    locationOff:
      "लोकेशन उपलब्ध नहीं है। ब्राउज़र में लोकेशन अनुमति दें।",
    locationSharing:
      "यह स्थान केवल इस सक्रिय परिवहन यात्रा के लिए किसान के साथ साझा किया जाता है।",
    updated: "अंतिम अपडेट",
    never: "अभी नहीं",
    accuracy: "सटीकता",
    route: "रूट खोलें",
    centerRoute: "केंद्र का रूट",
    timeline: "यात्रा टाइमलाइन",
    eventHistory: "स्थिति इतिहास",
    noEvents: "अभी कोई स्थिति घटना दर्ज नहीं है।",
    notFound: "परिवहन यात्रा नहीं मिली।",
    assignedElsewhere:
      "यह यात्रा किसी अन्य परिवहनकर्ता को दी गई है।",
    completeMessage:
      "यात्रा पूरी हुई। आपकी कमाई अपडेट कर दी गई है।",
    statusSaved:
      "यात्रा की स्थिति सफलतापूर्वक अपडेट हुई।",
    error:
      "यात्रा लोड या अपडेट नहीं हो सकी।",
    network:
      "कृषिसेतु बैकएंड से कनेक्शन नहीं हो पाया।",
    login:
      "परिवहनकर्ता सत्र नहीं मिला। कृपया फिर से साइन इन करें।",
    region:
      "यह परिवहन अनुरोध सर्वर के किसान/परिवहनकर्ता क्षेत्र मिलान नियमों से सुरक्षित है।",
    language: "भाषा",
    enRouteFarmer:
      "किसान के पिकअप स्थान की ओर जाएँ।",
    pickupDone:
      "पुष्टि करें कि फसल वास्तव में उठा ली गई है।",
    enRouteCenter:
      "पंजीकृत खरीद केंद्र की ओर जाएँ।",
    delivered:
      "फसल केंद्र पहुँचने पर डिलीवरी चिन्हित करें।",
    finalStep:
      "डिलीवरी की पुष्टि के बाद यात्रा पूरी करें।",
    noActive:
      "आपको कोई सक्रिय परिवहन यात्रा नहीं दी गई है।",
    openMapFallback:
      "पिकअप स्थान खोलें",
    emergency:
      "आपात स्थिति में किसान से संपर्क करें या व्यवस्थापक कार्यप्रवाह से समस्या दर्ज करें।",
    hideNotice: "बंद करें",
  },
  te: {
    eyebrow: "యాక్టివ్ రవాణా",
    title: "మీ ట్రిప్ నిర్వహించండి",
    subtitle:
      "పికప్ నుండి కొనుగోలు కేంద్రం వరకు రైతుకు మీ ప్రయాణ స్థితి కనిపిస్తుంది.",
    back: "పనులకు తిరిగి",
    dashboard: "డ్యాష్‌బోర్డ్",
    refresh: "రిఫ్రెష్",
    refreshing: "రిఫ్రెష్ అవుతోంది…",
    online: "ఆన్‌లైన్",
    offline: "ఆఫ్‌లైన్",
    goOnline: "ఆన్‌లైన్‌కు వెళ్లండి",
    goOffline: "ఆఫ్‌లైన్‌కు వెళ్లండి",
    active: "యాక్టివ్",
    waiting: "వేచి ఉంది",
    completed: "పూర్తయింది",
    tripDetails: "ట్రిప్ వివరాలు",
    pickup: "పికప్",
    destination: "గమ్యం",
    farmer: "రైతు",
    phone: "రైతుకు కాల్",
    crop: "పంట",
    quantity: "పరిమాణం",
    fare: "ఛార్జీ",
    fareNotAgreed: "ఛార్జీ ఇంకా నిర్ణయించలేదు",
    estimatedFare: "రైతు అంచనా",
    quoteFare: "అంగీకరించిన ఛార్జీ నమోదు చేయండి",
    fareModalText: "పికప్‌కు ముందు రైతుతో అంగీకరించిన ఛార్జీని నమోదు చేయండి. ఈ మొత్తం రైతుకు కనిపిస్తుంది మరియు పూర్తయిన ట్రిప్ ఆదాయంగా ఉపయోగించబడుతుంది.",
    farePlaceholder: "అంగీకరించిన ఛార్జీ నమోదు చేయండి",
    fareRequired: "₹0 కంటే ఎక్కువ ఛార్జీ నమోదు చేయండి.",
    fareConfirm: "ఛార్జీ సేవ్ చేసి కొనసాగండి",
    fareCancel: "ఇప్పుడు వద్దు",
    fareNotice: "పంట తీసుకున్నట్లు గుర్తించే ముందు సానుకూల ఛార్జీ అవసరం.",
    requested: "అభ్యర్థన",
    status: "స్థితి",
    nextStep: "తదుపరి దశ",
    startPickup: "పికప్ ప్రారంభించండి",
    pickedUp: "పంట తీసుకున్నట్లు గుర్తించండి",
    startCenter: "కేంద్రానికి బయలుదేరండి",
    markDelivered: "చేరవేసినట్లు గుర్తించండి",
    completeTrip: "ట్రిప్ పూర్తి చేయండి",
    updating: "అప్డేట్ అవుతోంది…",
    currentLocation: "ప్రస్తుత GPS లొకేషన్",
    locationSent: "లైవ్ లొకేషన్ అప్డేట్ అయింది.",
    locationOff:
      "లొకేషన్ అందుబాటులో లేదు. బ్రౌజర్ లొకేషన్ అనుమతిని ఇవ్వండి.",
    locationSharing:
      "ఈ యాక్టివ్ రవాణా ట్రిప్ కోసం మాత్రమే మీ లొకేషన్ రైతుతో పంచబడుతుంది.",
    updated: "చివరి అప్డేట్",
    never: "ఇంకా లేదు",
    accuracy: "ఖచ్చితత్వం",
    route: "రూట్ తెరవండి",
    centerRoute: "కేంద్ర రూట్",
    timeline: "ప్రయాణ టైమ్‌లైన్",
    eventHistory: "స్థితి చరిత్ర",
    noEvents: "ఇంకా స్థితి ఈవెంట్లు నమోదు కాలేదు.",
    notFound: "రవాణా ట్రిప్ కనిపించలేదు.",
    assignedElsewhere:
      "ఈ ట్రిప్ మరొక రవాణాదారుకు కేటాయించబడింది.",
    completeMessage:
      "ట్రిప్ పూర్తయింది. మీ ఆదాయం అప్డేట్ అయింది.",
    statusSaved:
      "ట్రిప్ స్థితి విజయవంతంగా అప్డేట్ అయింది.",
    error:
      "ట్రిప్ లోడ్ లేదా అప్డేట్ కాలేదు.",
    network:
      "కృషిసేతు బ్యాకెండ్‌కు కనెక్ట్ కాలేకపోయాం.",
    login:
      "రవాణాదారు సెషన్ కనుగొనబడలేదు. మళ్లీ సైన్ ఇన్ చేయండి.",
    region:
      "ఈ రవాణా అభ్యర్థన సర్వర్‌లోని రైతు/రవాణాదారు ప్రాంత సరిపోలిక నియమాలతో రక్షించబడింది.",
    language: "భాష",
    enRouteFarmer:
      "రైతు పికప్ లొకేషన్‌కు వెళ్లండి.",
    pickupDone:
      "పంట నిజంగా తీసుకున్నట్లు నిర్ధారించండి.",
    enRouteCenter:
      "నమోదైన కొనుగోలు కేంద్రానికి వెళ్లండి.",
    delivered:
      "పంట కేంద్రానికి చేరిన తర్వాత డెలివరీని గుర్తించండి.",
    finalStep:
      "డెలివరీ నిర్ధారణ తర్వాత ట్రిప్‌ను పూర్తి చేయండి.",
    noActive:
      "మీకు యాక్టివ్ రవాణా ట్రిప్ కేటాయించబడలేదు.",
    openMapFallback:
      "పికప్ లొకేషన్ తెరవండి",
    emergency:
      "అత్యవసర సమస్యల కోసం రైతును సంప్రదించండి లేదా నిర్వాహక ప్రక్రియ ద్వారా సమస్యను నమోదు చేయండి.",
    hideNotice: "మూసివేయి",
  },
};

function getSession() {
  const sources = [
    [SESSION_KEY, window.localStorage],
    [TEMP_SESSION_KEY, window.sessionStorage],
  ];

  for (
    const [key, storage] of sources
  ) {
    try {
      const raw =
        storage.getItem(key);

      if (!raw) continue;

      const parsed =
        JSON.parse(raw);

      if (
        parsed?.transporter?.id
      ) {
        return parsed;
      }
    } catch {
      // Continue.
    }
  }

  const id =
    window.localStorage.getItem(
      TRANSPORTER_ID_KEY
    );

  return id
    ? {
        transporter: {
          id,
        },
      }
    : null;
}

async function requestJson(
  path,
  options = {}
) {
  const normalizedPath =
    String(path || "").startsWith("/")
      ? String(path || "")
      : `/${String(path || "")}`;

  const response =
    await fetch(
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
    const message =
      data?.message ||
      data?.error?.message ||
      data?.error ||
      `Request failed (${response.status})`;

    const error =
      new Error(message);

    error.status =
      response.status;

    error.url =
      response.url;

    throw error;
  }

  return data;
}

function statusLabel(
  status,
  language
) {
  const key =
    String(status || "")
      .trim()
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
      hi: "किसान की ओर",
      te: "రైతు వైపు",
    },
    CROP_PICKED_UP: {
      en: "Crop picked up",
      hi: "फसल उठाई गई",
      te: "పంట తీసుకున్నారు",
    },
    EN_ROUTE_TO_CENTER: {
      en: "Going to center",
      hi: "केंद्र की ओर",
      te: "కేంద్రానికి",
    },
    DELIVERED: {
      en: "Delivered",
      hi: "पहुंचाया गया",
      te: "చేరవేశారు",
    },
    COMPLETED: {
      en: "Completed",
      hi: "पूरा हुआ",
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
    key ||
    "—"
  );
}

function nextStatus(
  status
) {
  const current =
    String(status || "")
      .toUpperCase();

  const index =
    STATUS_SEQUENCE.indexOf(
      current
    );

  if (index < 0) {
    return null;
  }

  return (
    STATUS_SEQUENCE[index + 1] ||
    null
  );
}

function actionLabel(
  status,
  copy
) {
  switch (
    String(status || "")
      .toUpperCase()
  ) {
    case "ASSIGNED":
      return copy.startPickup;

    case "EN_ROUTE_TO_FARMER":
      return copy.pickedUp;

    case "CROP_PICKED_UP":
      return copy.startCenter;

    case "EN_ROUTE_TO_CENTER":
      return copy.markDelivered;

    case "DELIVERED":
      return copy.completeTrip;

    default:
      return "";
  }
}

function actionHint(
  status,
  copy
) {
  switch (
    String(status || "")
      .toUpperCase()
  ) {
    case "ASSIGNED":
      return copy.enRouteFarmer;

    case "EN_ROUTE_TO_FARMER":
      return copy.pickupDone;

    case "CROP_PICKED_UP":
      return copy.enRouteCenter;

    case "EN_ROUTE_TO_CENTER":
      return copy.delivered;

    case "DELIVERED":
      return copy.finalStep;

    default:
      return "";
  }
}

function positiveMoneyValue(...values) {
  for (const value of values) {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

function money(value) {
  const n =
    Number(value);

  if (
    !Number.isFinite(n) ||
    n <= 0
  ) {
    return "—";
  }

  return `₹${n.toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 0,
    }
  )}`;
}

function quantity(value) {
  const n =
    Number(value);

  return Number.isFinite(n)
    ? `${n.toLocaleString(
        "en-IN"
      )} kg`
    : "—";
}

function dateTime(
  value,
  language
) {
  if (!value) return "—";

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return String(value);
  }

  const locale =
    language === "hi"
      ? "hi-IN"
      : language === "te"
      ? "te-IN"
      : "en-IN";

  return date.toLocaleString(
    locale,
    {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

function mapsLink(
  latitude,
  longitude,
  address
) {
  if (
    latitude != null &&
    longitude != null
  ) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      `${latitude},${longitude}`
    )}`;
  }

  if (address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      address
    )}`;
  }

  return "";
}

function StatusBadge({
  status,
  language,
}) {
  return (
    <span
      style={
        styles.statusBadge
      }
    >
      <span
        style={
          styles.statusDot
        }
      />
      {statusLabel(
        status,
        language
      )}
    </span>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div
      className="detail"
      style={
        styles.detail
      }
    >
      <div
        style={
          styles.detailIcon
        }
      >
        <Icon size={15} />
      </div>

      <div>
        <span
          className="detail-label"
          style={
            styles.detailLabel
          }
        >
          {label}
        </span>

        <strong
          className="detail-value"
          style={
            styles.detailValue
          }
        >
          {value || "—"}
        </strong>
      </div>
    </div>
  );
}

function Timeline({
  request,
  events,
  language,
  copy,
}) {
  const current =
    String(
      request?.status || ""
    ).toUpperCase();

  const flow = [
    {
      status: "ASSIGNED",
      title:
        language === "hi"
          ? "कार्य असाइन"
          : language === "te"
          ? "పని కేటాయించబడింది"
          : "Job assigned",
    },
    {
      status:
        "EN_ROUTE_TO_FARMER",
      title:
        language === "hi"
          ? "किसान की ओर"
          : language === "te"
          ? "రైతు వైపు"
          : "Going to farmer",
    },
    {
      status:
        "CROP_PICKED_UP",
      title:
        language === "hi"
          ? "फसल उठाई"
          : language === "te"
          ? "పంట తీసుకున్నారు"
          : "Crop picked up",
    },
    {
      status:
        "EN_ROUTE_TO_CENTER",
      title:
        language === "hi"
          ? "केंद्र की ओर"
          : language === "te"
          ? "కేంద్రానికి"
          : "Going to center",
    },
    {
      status: "DELIVERED",
      title:
        language === "hi"
          ? "केंद्र पहुँचा"
          : language === "te"
          ? "కేంద్రానికి చేరింది"
          : "Delivered",
    },
    {
      status: "COMPLETED",
      title:
        language === "hi"
          ? "यात्रा पूर्ण"
          : language === "te"
          ? "ట్రిప్ పూర్తయింది"
          : "Trip completed",
    },
  ];

  const currentIndex =
    STATUS_SEQUENCE.indexOf(
      current
    );

  return (
    <div
      style={
        styles.timeline
      }
    >
      {flow.map(
        (item, index) => {
          const itemIndex =
            STATUS_SEQUENCE.indexOf(
              item.status
            );

          const reached =
            currentIndex >=
            itemIndex;

          const event =
            events.find(
              (entry) =>
                String(
                  entry.status ||
                    ""
                ).toUpperCase() ===
                item.status
            );

          const isLast =
            index ===
            flow.length - 1;

          return (
            <div
              key={
                item.status
              }
              style={
                styles.timelineRow
              }
            >
              <div
                style={
                  styles.timelineRail
                }
              >
                <div
                  style={{
                    ...styles.timelineNode,
                    ...(reached
                      ? styles.timelineNodeReached
                      : {}),
                  }}
                >
                  {reached ? (
                    <Check
                      size={13}
                    />
                  ) : (
                    <span>
                      {index +
                        1}
                    </span>
                  )}
                </div>

                {!isLast ? (
                  <div
                    style={{
                      ...styles.timelineLine,
                      background:
                        currentIndex >
                        itemIndex
                          ? "#b9d8c1"
                          : "#e3e9e5",
                    }}
                  />
                ) : null}
              </div>

              <div
                style={
                  styles.timelineCopy
                }
              >
                <div
                  style={
                    styles.timelineTitleRow
                  }
                >
                  <strong>
                    {item.title}
                  </strong>

                  {reached ? (
                    <span
                      style={
                        styles.timelineDone
                      }
                    >
                      ✓
                    </span>
                  ) : null}
                </div>

                {event?.created_at ? (
                  <span
                    style={
                      styles.timelineDate
                    }
                  >
                    {dateTime(
                      event.created_at,
                      language
                    )}
                  </span>
                ) : null}
              </div>
            </div>
          );
        }
      )}
    </div>
  );
}

export default function TransporterTrip() {
  const {
    id: routeId,
  } = useParams();

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

  const session =
    useMemo(
      () => getSession(),
      []
    );

  const transporterId =
    session?.transporter?.id ||
    window.localStorage.getItem(
      TRANSPORTER_ID_KEY
    );

  const [request, setRequest] =
    useState(null);

  const [events, setEvents] =
    useState([]);

  const [transporter, setTransporter] =
    useState(
      session?.transporter ||
        null
    );

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [statusBusy, setStatusBusy] =
    useState(false);

  const [fareModalOpen, setFareModalOpen] =
    useState(false);

  const [fareInput, setFareInput] =
    useState("");

  const [fareError, setFareError] =
    useState("");

  const [locationBusy, setLocationBusy] =
    useState(false);

  const [locationError, setLocationError] =
    useState("");

  const [location, setLocation] =
    useState(null);

  const watchRef =
    useRef(null);

  /*
   * IMPORTANT:
   * Do not make loadTrip depend on request state or transporter state.
   * When /transporter/trip is opened without an :id`, loadTrip discovers
   * the active trip and then setRequest() runs. If loadTrip depended on
   * request?.id or transporter, every state update recreated the callback,
   * the effect ran again, and the page flickered forever on "Refreshing…".
   */
  const effectiveRequestId =
    routeId ||
    request?.id ||
    "";

  const loadTrip =
    useCallback(
      async ({
        silent = false,
      } = {}) => {
        if (
          !transporterId
        ) {
          setLoading(false);
          setError(
            copy.login
          );
          return;
        }

        if (!silent) {
          setLoading(true);
        }

        setError("");

        try {
          /*
           * /transporter/trip is valid without an :id.
           * In that case discover the latest ACTIVE trip that is
           * actually assigned to this transporter.
           *
           * The backend may also return REQUESTED region-matched jobs
           * for the same transporterId, so REQUESTED is deliberately
           * excluded here.
           */
          let requestId =
            routeId ||
            "";

          if (!requestId) {
            const activeResponse =
              await requestJson(
                `/api/transport/requests?transporterId=${encodeURIComponent(
                  transporterId
                )}&activeOnly=true`
              );

            const activeRequests =
              Array.isArray(
                activeResponse?.requests
              )
                ? activeResponse.requests
                : [];

            const assignedTrips =
              activeRequests.filter(
                (item) =>
                  String(
                    item?.transporter_id ||
                      ""
                  ) ===
                  String(
                    transporterId
                  ) &&
                  ACTIVE_STATUSES.has(
                    String(
                      item?.status ||
                        ""
                    )
                      .trim()
                      .toUpperCase()
                  )
              );

            /*
             * The server already sorts active requests by creation time.
             * Pick the first genuinely assigned active trip.
             */
            const assignedTrip =
              assignedTrips[0] ||
              null;

            requestId =
              assignedTrip?.id ||
              "";

            if (!requestId) {
              const transporterResponse =
                await requestJson(
                  `/api/transporters/${encodeURIComponent(
                    transporterId
                  )}`
                );

              setTransporter(
                transporterResponse?.transporter ||
                  session?.transporter ||
                  null
              );

              setRequest(null);
              setEvents([]);
              setLoading(false);
              setError(
                copy.notFound
              );
              return;
            }
          }

          const [
            tripResponse,
            transporterResponse,
            eventsResponse,
          ] =
            await Promise.all([
              requestJson(
                `/api/transport/requests/${encodeURIComponent(
                  requestId
                )}`
              ),
              requestJson(
                `/api/transporters/${encodeURIComponent(
                  transporterId
                )}`
              ),
              requestJson(
                `/api/transport/requests/${encodeURIComponent(
                  requestId
                )}/events`
              ),
            ]);

          const trip =
            tripResponse?.request ||
            null;

          if (!trip) {
            throw new Error(
              copy.notFound
            );
          }

          if (
            String(
              trip.transporter_id ||
                ""
            ) !==
            String(
              transporterId
            )
          ) {
            throw new Error(
              copy.assignedElsewhere
            );
          }

          setRequest(
            trip
          );

          setTransporter(
            transporterResponse?.transporter ||
              session?.transporter ||
              null
          );

          setEvents(
            Array.isArray(
              eventsResponse?.events
            )
              ? eventsResponse.events
              : Array.isArray(
                    tripResponse?.events
                  )
                ? tripResponse.events
                : []
          );

          setError("");
        } catch (
          loadError
        ) {
          console.error(
            "Transport trip load failed:",
            {
              requestId:
                routeId ||
                "(auto-discovery)",
              transporterId,
              status:
                loadError?.status ||
                null,
              url:
                loadError?.url ||
                null,
              error:
                loadError,
            }
          );

          setError(
            loadError?.message ||
              copy.error
          );
        } finally {
          if (!silent) {
            setLoading(false);
          }
        }
      },
      [
        copy.assignedElsewhere,
        copy.error,
        copy.login,
        copy.notFound,
        routeId,
        transporterId,
        session,
      ]
    );

  useEffect(() => {
    loadTrip();

    const interval =
      window.setInterval(
        () =>
          loadTrip({
            silent: true,
          }),
        15000
      );

    return () =>
      window.clearInterval(
        interval
      );
  }, [loadTrip]);

  const online =
    transporter?.is_online ===
      true ||
    transporter?.isOnline ===
      true;

  const status =
    String(
      request?.status || ""
    ).toUpperCase();

  const next =
    nextStatus(status);

  const isActive =
    ACTIVE_STATUSES.has(
      status
    );

  const action =
    actionLabel(
      status,
      copy
    );

  const actionHelp =
    actionHint(
      status,
      copy
    );

  const pickupMap =
    mapsLink(
      request?.pickup_lat,
      request?.pickup_lng,
      request?.pickup_address
    );

  const centerMap =
    mapsLink(
      request?.center_lat,
      request?.center_lng,
      request?.center_address ||
        request?.center_name
    );

  const performStatusUpdate =
    async (fareOverride = null) => {
      if (
        !effectiveRequestId ||
        !next
      ) {
        return;
      }

      setStatusBusy(true);
      setError("");
      setSuccess("");

      try {
        const body = {
          transporterId,
          status: next,
          note:
            `Updated by transporter from ${status} to ${next}.`,
        };

        const normalizedFare = Number(fareOverride);
        if (
          Number.isFinite(normalizedFare) &&
          normalizedFare > 0
        ) {
          body.finalFare = normalizedFare;
        }

        const response =
          await requestJson(
            `/api/transport/requests/${encodeURIComponent(
              effectiveRequestId
            )}/status`,
            {
              method: "PATCH",
              body: JSON.stringify(body),
            }
          );

        setRequest(
          response?.request ||
            request
        );

        setSuccess(
          next === "COMPLETED"
            ? copy.completeMessage
            : copy.statusSaved
        );

        await loadTrip({
          silent: true,
        });
      } catch (statusError) {
        setError(
          statusError?.message ||
            copy.error
        );
      } finally {
        setStatusBusy(false);
      }
    };

  const openFareModal = () => {
    setFareError("");
    setFareInput(
      positiveMoneyValue(
        request?.final_fare,
        request?.estimated_fare
      )
        ? String(
            Math.round(
              positiveMoneyValue(
                request?.final_fare,
                request?.estimated_fare
              )
            )
          )
        : ""
    );
    setFareModalOpen(true);
  };

  const updateStatus =
    async () => {
      if (!next) return;

      const currentFare =
        positiveMoneyValue(
          request?.final_fare
        );

      const needsFareBeforePickup =
        [
          "EN_ROUTE_TO_FARMER",
          "CROP_PICKED_UP",
        ].includes(next) &&
        !currentFare;

      if (needsFareBeforePickup) {
        openFareModal();
        return;
      }

      await performStatusUpdate();
    };

  const confirmFareAndContinue =
    async () => {
      const fare = Number(
        String(fareInput || "").replace(/,/g, "").trim()
      );

      if (
        !Number.isFinite(fare) ||
        fare <= 0
      ) {
        setFareError(copy.fareRequired);
        return;
      }

      setFareError("");
      setFareModalOpen(false);
      await performStatusUpdate(fare);
    };

  const sendLocation =
    useCallback(
      async (
        position,
        showNotice = false
      ) => {
        if (
          !transporterId
        ) {
          return false;
        }

        const lat =
          Number(
            position?.coords?.latitude
          );

        const lng =
          Number(
            position?.coords?.longitude
          );

        if (
          !Number.isFinite(
            lat
          ) ||
          !Number.isFinite(
            lng
          )
        ) {
          return false;
        }

        const current = {
          lat,
          lng,
          accuracy:
            Number(
              position?.coords
                ?.accuracy
            ) || null,
          capturedAt:
            new Date().toISOString(),
        };

        setLocation(
          current
        );

        try {
          await requestJson(
            `/api/transporters/${encodeURIComponent(
              transporterId
            )}/location`,
            {
              method: "PATCH",
              body:
                JSON.stringify({
                  lat,
                  lng,
                }),
            }
          );

          if (showNotice) {
            setSuccess(
              copy.locationSent
            );
          }

          return true;
        } catch (
          locationUpdateError
        ) {
          setLocationError(
            locationUpdateError?.message ||
              copy.network
          );

          return false;
        }
      },
      [
        copy.locationSent,
        copy.network,
        transporterId,
      ]
    );

  const startLocationWatch =
    useCallback(
      () => {
        if (
          !navigator.geolocation
        ) {
          setLocationError(
            copy.locationOff
          );
          return;
        }

        if (
          watchRef.current
        ) {
          navigator.geolocation.clearWatch(
            watchRef.current
          );
        }

        watchRef.current =
          navigator.geolocation.watchPosition(
            (position) => {
              sendLocation(
                position
              );
            },
            () => {
              setLocationError(
                copy.locationOff
              );
            },
            {
              enableHighAccuracy:
                true,
              maximumAge:
                10000,
              timeout:
                15000,
            }
          );
      },
      [
        copy.locationOff,
        sendLocation,
      ]
    );

  useEffect(() => {
    if (
      online &&
      isActive
    ) {
      startLocationWatch();
    }

    return () => {
      if (
        watchRef.current
      ) {
        navigator.geolocation?.clearWatch(
          watchRef.current
        );

        watchRef.current =
          null;
      }
    };
  }, [
    isActive,
    online,
    startLocationWatch,
  ]);

  const captureLocation =
    () => {
      if (
        !navigator.geolocation
      ) {
        setLocationError(
          copy.locationOff
        );
        return;
      }

      setLocationBusy(true);
      setLocationError("");

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          await sendLocation(
            position,
            true
          );

          setLocationBusy(false);
        },
        () => {
          setLocationBusy(false);
          setLocationError(
            copy.locationOff
          );
        },
        {
          enableHighAccuracy:
            true,
          maximumAge: 5000,
          timeout: 15000,
        }
      );
    };

  const toggleAvailability =
    async () => {
      if (
        !transporterId
      ) {
        return;
      }

      try {
        const desired =
          !online;

        const response =
          await requestJson(
            `/api/transporters/${encodeURIComponent(
              transporterId
            )}/availability`,
            {
              method: "PATCH",
              body:
                JSON.stringify({
                  isOnline:
                    desired,
                  is_online:
                    desired,
                  currentLat:
                    location?.lat ??
                    null,
                  currentLng:
                    location?.lng ??
                    null,
                }),
            }
          );

        setTransporter(
          response?.transporter ||
            transporter
        );

        setSuccess(
          desired
            ? copy.online
            : copy.offline
        );

        if (
          desired
        ) {
          startLocationWatch();
        } else if (
          watchRef.current
        ) {
          navigator.geolocation?.clearWatch(
            watchRef.current
          );
          watchRef.current =
            null;
        }
      } catch (
        availabilityError
      ) {
        setError(
          availabilityError?.message ||
            copy.network
        );
      }
    };

  const goBack =
    () =>
      navigate(
        "/transporter/jobs"
      );

  const goDashboard =
    () =>
      navigate(
        "/transporter/dashboard"
      );

  if (
    !transporterId
  ) {
    return null;
  }

  return (
    <div
      className="transporter-trip-page"
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
                goBack
              }
              style={
                styles.backButton
              }
            >
              <ArrowLeft
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
                    key={id}
                    type="button"
                    onClick={() =>
                      setLanguage(
                        id
                      )
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
                toggleAvailability
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
                loadTrip()
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
            <XCircle
              size={17}
            />
            <span>
              {error}
            </span>
            <button
              type="button"
              onClick={() =>
                loadTrip()
              }
              style={
                styles.retry
              }
            >
              {copy.refresh}
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
                styles.close
              }
            >
              <X size={15} />
            </button>
          </div>
        ) : null}

        {loading ? (
          <div
            style={
              styles.loading
            }
          >
            <div
              style={
                styles.loadingIcon
              }
            >
              <Truck
                size={25}
              />
            </div>

            <strong>
              {copy.refreshing}
            </strong>
          </div>
        ) : request ? (
          <>
            <section
              style={
                styles.tripHeaderCard
              }
            >
              <div
                style={
                  styles.tripHeaderMain
                }
              >
                <div
                  style={
                    styles.tripTruck
                  }
                >
                  <Truck
                    size={27}
                  />
                </div>

                <div>
                  <span
                    style={
                      styles.miniEyebrow
                    }
                  >
                    {copy.farmer}
                  </span>

                  <h2
                    style={
                      styles.tripTitle
                    }
                  >
                    {request.farmer_name ||
                      "Farmer"}
                    {" · "}
                    {request.crop ||
                      "Crop load"}
                  </h2>

                  <span
                    className="route-summary"
                    style={
                      styles.routeSummary
                    }
                  >
                    {request.pickup_address ||
                      request.farmer_village ||
                      copy.pickup}
                    {" → "}
                    {request.center_name ||
                      request.center_address ||
                      copy.destination}
                  </span>
                </div>
              </div>

              <StatusBadge
                status={
                  status
                }
                language={
                  language
                }
              />
            </section>

            <section
              style={
                styles.mainGrid
              }
            >
              <div>
                <section
                  className="panel"
                  style={
                    styles.panel
                  }
                >
                  <div
                    style={
                      styles.panelHeader
                    }
                  >
                    <div>
                      <span
                        style={
                          styles.miniEyebrow
                        }
                      >
                        {copy.tripDetails}
                      </span>

                      <h3
                        style={
                          styles.panelTitle
                        }
                      >
                        {copy.tripDetails}
                      </h3>
                    </div>

                    <span
                      style={
                        styles.activeTag
                      }
                    >
                      {isActive
                        ? copy.active
                        : copy.completed}
                    </span>
                  </div>

                  <div
                    style={
                      styles.detailsGrid
                    }
                  >
                    <Detail
                      icon={
                        MapPin
                      }
                      label={
                        copy.pickup
                      }
                      value={
                        request.pickup_address ||
                        request.farmer_village
                      }
                    />

                    <Detail
                      icon={
                        MapPin
                      }
                      label={
                        copy.destination
                      }
                      value={
                        request.center_name ||
                        request.center_address
                      }
                    />

                    <Detail
                      icon={
                        Truck
                      }
                      label={
                        copy.crop
                      }
                      value={
                        request.crop
                      }
                    />

                    <Detail
                      icon={
                        Zap
                      }
                      label={
                        copy.quantity
                      }
                      value={quantity(
                        request.quantity_kg
                      )}
                    />

                    <Detail
                      icon={
                        Phone
                      }
                      label={
                        copy.farmer
                      }
                      value={
                        request.farmer_name
                      }
                    />

                    <Detail
                      icon={
                        CheckCircle2
                      }
                      label={
                        copy.fare
                      }
                      value={(() => {
                        const finalFare = positiveMoneyValue(
                          request.final_fare
                        );
                        const estimateFare = positiveMoneyValue(
                          request.estimated_fare
                        );
                        if (finalFare) return money(finalFare);
                        if (estimateFare) {
                          return `${money(estimateFare)} · ${copy.estimatedFare}`;
                        }
                        return copy.fareNotAgreed;
                      })()}
                    />

                    <Detail
                      icon={
                        Clock3
                      }
                      label={
                        copy.requested
                      }
                      value={dateTime(
                        request.requested_date ||
                          request.created_at,
                        language
                      )}
                    />

                    <Detail
                      icon={
                        status ===
                        "EN_ROUTE_TO_FARMER" ||
                        status ===
                        "EN_ROUTE_TO_CENTER"
                          ? Navigation
                          : CheckCircle2
                      }
                      label={
                        copy.status
                      }
                      value={statusLabel(
                        status,
                        language
                      )}
                    />
                  </div>

                  <div
                    style={
                      styles.routeButtons
                    }
                  >
                    {request.farmer_phone ? (
                      <a
                        href={`tel:${request.farmer_phone}`}
                        style={
                          styles.secondaryButton
                        }
                      >
                        <Phone
                          size={15}
                        />
                        {
                          copy.phone
                        }
                      </a>
                    ) : null}

                    {pickupMap ? (
                      <a
                        href={
                          pickupMap
                        }
                        target="_blank"
                        rel="noreferrer"
                        style={
                          styles.secondaryButton
                        }
                      >
                        <Navigation
                          size={15}
                        />
                        {
                          copy.route
                        }
                      </a>
                    ) : null}

                    {centerMap ? (
                      <a
                        href={
                          centerMap
                        }
                        target="_blank"
                        rel="noreferrer"
                        style={
                          styles.secondaryButton
                        }
                      >
                        <MapPin
                          size={15}
                        />
                        {
                          copy.centerRoute
                        }
                      </a>
                    ) : null}
                  </div>
                </section>

                <section
                  className="panel"
                  style={
                    styles.panel
                  }
                >
                  <div
                    style={
                      styles.panelHeader
                    }
                  >
                    <div>
                      <span
                        style={
                          styles.miniEyebrow
                        }
                      >
                        {copy.timeline}
                      </span>

                      <h3
                        style={
                          styles.panelTitle
                        }
                      >
                        {copy.timeline}
                      </h3>
                    </div>
                  </div>

                  <Timeline
                    request={
                      request
                    }
                    events={
                      events
                    }
                    language={
                      language
                    }
                    copy={
                      copy
                    }
                  />
                </section>

                <section
                  className="panel"
                  style={
                    styles.panel
                  }
                >
                  <div
                    style={
                      styles.panelHeader
                    }
                  >
                    <div>
                      <span
                        style={
                          styles.miniEyebrow
                        }
                      >
                        {copy.eventHistory}
                      </span>

                      <h3
                        style={
                          styles.panelTitle
                        }
                      >
                        {copy.eventHistory}
                      </h3>
                    </div>
                  </div>

                  {events.length ? (
                    <div
                      style={
                        styles.eventList
                      }
                    >
                      {events.map(
                        (
                          event
                        ) => (
                          <div
                            key={
                              event.id ||
                              `${event.status}-${event.created_at}`
                            }
                            style={
                              styles.eventRow
                            }
                          >
                            <div
                              style={
                                styles.eventDot
                              }
                            />

                            <div>
                              <strong>
                                {statusLabel(
                                  event.status,
                                  language
                                )}
                              </strong>

                              <span>
                                {event.note ||
                                  ""}
                              </span>
                            </div>

                            <time
                              style={
                                styles.eventTime
                              }
                            >
                              {dateTime(
                                event.created_at,
                                language
                              )}
                            </time>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <div
                      style={
                        styles.noEvents
                      }
                    >
                      {copy.noEvents}
                    </div>
                  )}
                </section>
              </div>

              <aside>
                <section
                  className="action-panel"
                  style={
                    styles.actionPanel
                  }
                >
                  <div
                    style={
                      styles.actionIcon
                    }
                  >
                    {online ? (
                      <Wifi
                        size={23}
                      />
                    ) : (
                      <WifiOff
                        size={23}
                      />
                    )}
                  </div>

                  <span
                    style={
                      styles.miniEyebrow
                    }
                  >
                    {copy.nextStep}
                  </span>

                  <h3
                    style={
                      styles.actionTitle
                    }
                  >
                    {action ||
                      statusLabel(
                        status,
                        language
                      )}
                  </h3>

                  <p
                    className="action-help"
                    style={
                      styles.actionHelp
                    }
                  >
                    {actionHelp ||
                      copy.finalStep}
                  </p>

                  {next && !positiveMoneyValue(request.final_fare) &&
                  ["EN_ROUTE_TO_FARMER", "CROP_PICKED_UP"].includes(next) ? (
                    <div style={styles.fareNotice}>
                      <CheckCircle2 size={15} />
                      <span>{copy.fareNotice}</span>
                    </div>
                  ) : null}

                  {next ? (
                    <button
                      type="button"
                      onClick={
                        updateStatus
                      }
                      disabled={
                        statusBusy
                      }
                      style={
                        styles.primaryButton
                      }
                    >
                      {statusBusy ? (
                        <span
                          style={
                            styles.spinner
                          }
                        />
                      ) : (
                        <Check
                          size={16}
                        />
                      )}

                      {statusBusy
                        ? copy.updating
                        : action}
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={
                      toggleAvailability
                    }
                    style={
                      styles.secondaryWideButton
                    }
                  >
                    <span
                      style={
                        styles.onlineMiniDot
                      }
                    />
                    {online
                      ? copy.goOffline
                      : copy.goOnline}
                  </button>
                </section>

                <section
                  className="location-panel"
                  style={
                    styles.locationPanel
                  }
                >
                  <div
                    style={
                      styles.locationHeader
                    }
                  >
                    <div>
                      <span
                        style={
                          styles.miniEyebrow
                        }
                      >
                        {copy.currentLocation}
                      </span>

                      <h3
                        style={
                          styles.panelTitle
                        }
                      >
                        {copy.currentLocation}
                      </h3>
                    </div>

                    {location ? (
                      <span
                        style={
                          styles.locationLive
                        }
                      >
                        <span
                          style={
                            styles.locationLiveDot
                          }
                        />
                        LIVE
                      </span>
                    ) : null}
                  </div>

                  <div
                    style={
                      styles.locationGraphic
                    }
                  >
                    <LocateFixed
                      size={34}
                    />
                  </div>

                  {location ? (
                    <div
                      style={
                        styles.locationData
                      }
                    >
                      <strong>
                        {location.lat.toFixed(
                          5
                        )}
                        ,{" "}
                        {location.lng.toFixed(
                          5
                        )}
                      </strong>

                      <span>
                        {copy.updated}:{" "}
                        {dateTime(
                          location.capturedAt,
                          language
                        )}
                      </span>

                      {location.accuracy ? (
                        <span>
                          {
                            copy.accuracy
                          }
                          : ±
                          {Math.round(
                            location.accuracy
                          )}{" "}
                          m
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <p
                      className="location-text"
                      style={
                        styles.locationText
                      }
                    >
                      {copy.locationSharing}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={
                      captureLocation
                    }
                    disabled={
                      locationBusy
                    }
                    style={
                      styles.locationButton
                    }
                  >
                    {locationBusy ? (
                      <span
                        style={
                          styles.spinnerDark
                        }
                      />
                    ) : (
                      <LocateFixed
                        size={16}
                      />
                    )}

                    {locationBusy
                      ? copy.refreshing
                      : copy.currentLocation}
                  </button>

                  {locationError ? (
                    <div
                      style={
                        styles.locationError
                      }
                    >
                      <WifiOff
                        size={14}
                      />
                      <span>
                        {
                          locationError
                        }
                      </span>
                    </div>
                  ) : null}
                </section>

                <section
                  style={
                    styles.protectionPanel
                  }
                >
                  <ShieldCheck
                    size={20}
                  />

                  <div>
                    <strong>
                      {copy.region}
                    </strong>

                    <p
                      style={
                        styles.protectionText
                      }
                    >
                      {copy.region}
                    </p>
                  </div>
                </section>

                {request.pickup_lat !=
                  null &&
                request.pickup_lng !=
                  null ? (
                  <div
                    style={
                      styles.coordinateCard
                    }
                  >
                    <MapPin
                      size={16}
                    />
                    <span>
                      Pickup GPS:{" "}
                      {Number(
                        request.pickup_lat
                      ).toFixed(5)}
                      ,{" "}
                      {Number(
                        request.pickup_lng
                      ).toFixed(5)}
                    </span>
                  </div>
                ) : null}
              </aside>
            </section>
          </>
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
              <Truck size={27} />
            </div>

            <h2
              style={
                styles.emptyTitle
              }
            >
              {copy.noActive}
            </h2>

            <p
              style={
                styles.emptyText
              }
            >
              {copy.notFound}
            </p>

            <button
              type="button"
              onClick={
                goBack
              }
              style={
                styles.primaryButton
              }
            >
              <ArrowLeft
                size={15}
              />
              {copy.back}
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
            {copy.locationSharing}
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
            {copy.dashboard}
          </button>
        </footer>
      </main>

      {fareModalOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="transporter-fare-title"
          style={styles.fareOverlay}
          onClick={() => {
            if (!statusBusy) setFareModalOpen(false);
          }}
        >
          <div
            style={styles.fareModal}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={styles.fareModalIcon}>
              <CheckCircle2 size={23} />
            </div>

            <span style={styles.miniEyebrow}>
              {copy.quoteFare}
            </span>

            <h2
              id="transporter-fare-title"
              style={styles.fareModalTitle}
            >
              {copy.quoteFare}
            </h2>

            <p style={styles.fareModalText}>
              {copy.fareModalText}
            </p>

            {positiveMoneyValue(request?.estimated_fare) ? (
              <div style={styles.fareEstimateBox}>
                <span>{copy.estimatedFare}</span>
                <strong>
                  {money(request.estimated_fare)}
                </strong>
              </div>
            ) : null}

            <label style={styles.fareLabel}>
              <span>{copy.fare}</span>
              <input
                autoFocus
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={fareInput}
                onChange={(event) => {
                  setFareInput(event.target.value);
                  if (fareError) setFareError("");
                }}
                placeholder={copy.farePlaceholder}
                style={styles.fareInput}
                disabled={statusBusy}
              />
            </label>

            {fareError ? (
              <div style={styles.fareError}>
                <XCircle size={15} />
                <span>{fareError}</span>
              </div>
            ) : null}

            <div style={styles.fareModalButtons}>
              <button
                type="button"
                onClick={() => setFareModalOpen(false)}
                disabled={statusBusy}
                style={styles.fareCancelButton}
              >
                {copy.fareCancel}
              </button>

              <button
                type="button"
                onClick={confirmFareAndContinue}
                disabled={statusBusy}
                style={styles.fareConfirmButton}
              >
                {statusBusy ? copy.updating : copy.fareConfirm}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <style>
        {`
          @keyframes transporter-trip-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          .transporter-trip-spin {
            animation: transporter-trip-spin 0.75s linear infinite;
          }

          @media (max-width: 920px) {
            .transporter-trip-main-grid {
              grid-template-columns: 1fr !important;
            }

            .transporter-trip-header {
              flex-direction: column !important;
              align-items: stretch !important;
            }

            .transporter-trip-header-actions {
              justify-content: flex-start !important;
            }
          }

          @media (max-width: 680px) {
            .transporter-trip-shell {
              width: min(100% - 16px, 1200px) !important;
              padding-top: 14px !important;
            }

            .transporter-trip-details {
              grid-template-columns: 1fr !important;
            }

            .transporter-trip-action-buttons {
              flex-direction: column !important;
              align-items: stretch !important;
            }

            .transporter-trip-action-buttons > * {
              width: 100% !important;
            }

            .transporter-trip-page button,
            .transporter-trip-page a {
              min-height: 44px !important;
            }
          }

          @media (max-width: 480px) {
            .transporter-trip-page .trip-header-card {
              gap: 12px !important;
              padding: 14px !important;
            }

            .transporter-trip-page .trip-title {
              font-size: 17px !important;
              line-height: 1.3 !important;
            }

            .transporter-trip-page .detail-value {
              font-size: 12px !important;
            }

            .transporter-trip-page .detail-label,
            .transporter-trip-page .route-summary,
            .transporter-trip-page .action-help,
            .transporter-trip-page .location-text {
              font-size: 11px !important;
            }

            .transporter-trip-page .panel,
            .transporter-trip-page .action-panel,
            .transporter-trip-page .location-panel {
              padding: 14px !important;
              border-radius: 15px !important;
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
      "linear-gradient(180deg, #f7faf8 0%, #ffffff 43%, #f7faf8 100%)",
    color: "#21352a",
  },

  shell: {
    width:
      "min(1200px, calc(100% - 30px))",
    margin: "0 auto",
    padding:
      "29px 0 48px",
  },

  header: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "flex-end",
    gap: "20px",
    padding:
      "5px 0 19px",
    borderBottom:
      "1px solid #e3eae5",
  },

  backButton: {
    display: "inline-flex",
    alignItems:
      "center",
    gap: "5px",
    padding: 0,
    marginBottom:
      "13px",
    border: 0,
    background:
      "transparent",
    color:
      "#5b7062",
    fontSize: "10px",
    fontWeight: 800,
    cursor:
      "pointer",
  },

  eyebrow: {
    display: "block",
    color:
      "#78877d",
    fontSize: "9px",
    fontWeight: 800,
    letterSpacing:
      "0.16em",
  },

  title: {
    margin:
      "6px 0 0",
    color:
      "#1d3a28",
    fontSize: "29px",
    lineHeight:
      1.08,
    letterSpacing:
      "-0.025em",
  },

  subtitle: {
    maxWidth:
      "690px",
    margin:
      "7px 0 0",
    color:
      "#738078",
    fontSize: "11px",
    lineHeight:
      1.55,
  },

  headerActions: {
    display: "flex",
    alignItems:
      "center",
    justifyContent:
      "flex-end",
    gap: "7px",
    flexWrap:
      "wrap",
  },

  language: {
    display: "flex",
    alignItems:
      "center",
    gap: "3px",
    padding:
      "4px",
    border:
      "1px solid #dfe8e2",
    background:
      "#ffffff",
    borderRadius:
      "10px",
    color:
      "#6e7d74",
  },

  languageButton: {
    border: 0,
    borderRadius:
      "7px",
    padding:
      "6px 7px",
    background:
      "transparent",
    color:
      "#66766c",
    fontSize:
      "9px",
    cursor:
      "pointer",
  },

  languageActive: {
    background:
      "#246f40",
    color:
      "#ffffff",
    fontWeight:
      800,
  },

  onlineButton: {
    minHeight:
      "35px",
    padding:
      "0 10px",
    display:
      "inline-flex",
    alignItems:
      "center",
    gap:
      "7px",
    border:
      "1px solid #dbe6df",
    borderRadius:
      "10px",
    background:
      "#f4f7f5",
    color:
      "#627268",
    fontSize:
      "9px",
    fontWeight:
      800,
    cursor:
      "pointer",
  },

  onlineOn: {
    background:
      "#e8f5eb",
    borderColor:
      "#c7e5cf",
    color:
      "#287043",
  },

  onlineDot: {
    width: "7px",
    height: "7px",
    borderRadius:
      "50%",
    background:
      "#37a35d",
    boxShadow:
      "0 0 0 3px rgba(55,163,93,0.13)",
  },

  refreshButton: {
    minHeight:
      "35px",
    padding:
      "0 10px",
    display:
      "inline-flex",
    alignItems:
      "center",
    gap:
      "6px",
    border:
      "1px solid #246f40",
    borderRadius:
      "10px",
    background:
      "#246f40",
    color:
      "#ffffff",
    fontSize:
      "9px",
    fontWeight:
      800,
    cursor:
      "pointer",
  },

  error: {
    marginTop:
      "13px",
    display:
      "flex",
    alignItems:
      "center",
    gap:
      "8px",
    padding:
      "10px 12px",
    borderRadius:
      "10px",
    border:
      "1px solid #efd8d2",
    background:
      "#fff5f3",
    color:
      "#985246",
    fontSize:
      "10px",
  },

  success: {
    marginTop:
      "13px",
    display:
      "flex",
    alignItems:
      "center",
    gap:
      "8px",
    padding:
      "10px 12px",
    borderRadius:
      "10px",
    border:
      "1px solid #d1e9d7",
    background:
      "#eff9f2",
    color:
      "#286b40",
    fontSize:
      "10px",
  },

  retry: {
    marginLeft:
      "auto",
    border: 0,
    background:
      "transparent",
    color:
      "inherit",
    fontSize:
      "9px",
    fontWeight:
      800,
    textDecoration:
      "underline",
    cursor:
      "pointer",
  },

  close: {
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

  loading: {
    minHeight:
      "350px",
    marginTop:
      "18px",
    borderRadius:
      "18px",
    background:
      "#ffffff",
    border:
      "1px solid #e2eae5",
    display:
      "flex",
    flexDirection:
      "column",
    alignItems:
      "center",
    justifyContent:
      "center",
    gap:
      "10px",
    color:
      "#748179",
    fontSize:
      "11px",
  },

  loadingIcon: {
    width:
      "54px",
    height:
      "54px",
    borderRadius:
      "17px",
    display:
      "flex",
    alignItems:
      "center",
    justifyContent:
      "center",
    background:
      "#eef6f0",
    color:
      "#2a7445",
  },

  tripHeaderCard: {
    marginTop:
      "17px",
    display:
      "flex",
    alignItems:
      "center",
    justifyContent:
      "space-between",
    gap:
      "18px",
    padding:
      "19px 20px",
    borderRadius:
      "18px",
    background:
      "linear-gradient(135deg, #ffffff 0%, #f3f9f5 100%)",
    border:
      "1px solid #dfe9e2",
    boxShadow:
      "0 12px 28px rgba(30, 77, 48, 0.045)",
  },

  tripHeaderMain: {
    display:
      "flex",
    alignItems:
      "center",
    gap:
      "13px",
    minWidth:
      0,
  },

  tripTruck: {
    width:
      "49px",
    height:
      "49px",
    borderRadius:
      "15px",
    flexShrink:
      0,
    display:
      "flex",
    alignItems:
      "center",
    justifyContent:
      "center",
    background:
      "#e8f5ec",
    color:
      "#297345",
  },

  miniEyebrow: {
    display:
      "block",
    color:
      "#849088",
    fontSize:
      "8px",
    fontWeight:
      800,
    textTransform:
      "uppercase",
    letterSpacing:
      "0.13em",
  },

  tripTitle: {
    margin:
      "4px 0 0",
    color:
      "#20392a",
    fontSize:
      "18px",
  },

  routeSummary: {
    display:
      "block",
    marginTop:
      "3px",
    color:
      "#718077",
    fontSize:
      "10px",
    lineHeight:
      1.45,
  },

  statusBadge: {
    display:
      "inline-flex",
    alignItems:
      "center",
    gap:
      "6px",
    flexShrink:
      0,
    padding:
      "7px 9px",
    borderRadius:
      "999px",
    background:
      "#e9f6ed",
    color:
      "#286f42",
    fontSize:
      "9px",
    fontWeight:
      800,
  },

  statusDot: {
    width:
      "7px",
    height:
      "7px",
    borderRadius:
      "50%",
    background:
      "#38a35d",
  },

  mainGrid: {
    display:
      "grid",
    gridTemplateColumns:
      "minmax(0, 1fr) 330px",
    gap:
      "15px",
    marginTop:
      "15px",
  },

  panel: {
    padding:
      "18px",
    marginBottom:
      "13px",
    borderRadius:
      "18px",
    background:
      "#ffffff",
    border:
      "1px solid #e1e9e4",
    boxShadow:
      "0 10px 25px rgba(28, 73, 46, 0.035)",
  },

  panelHeader: {
    display:
      "flex",
    alignItems:
      "flex-end",
    justifyContent:
      "space-between",
    gap:
      "10px",
    marginBottom:
      "13px",
  },

  panelTitle: {
    margin:
      "4px 0 0",
    color:
      "#294133",
    fontSize:
      "16px",
  },

  activeTag: {
    padding:
      "6px 8px",
    borderRadius:
      "999px",
    background:
      "#f0f5f2",
    color:
      "#738178",
    fontSize:
      "8px",
    fontWeight:
      800,
    textTransform:
      "uppercase",
  },

  detailsGrid: {
    display:
      "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap:
      "9px",
  },

  detail: {
    display:
      "flex",
    alignItems:
      "center",
    gap:
      "8px",
    padding:
      "10px",
    borderRadius:
      "11px",
    background:
      "#f8fbf9",
    border:
      "1px solid #edf1ee",
  },

  detailIcon: {
    width:
      "31px",
    height:
      "31px",
    borderRadius:
      "9px",
    display:
      "flex",
    alignItems:
      "center",
    justifyContent:
      "center",
    flexShrink:
      0,
    background:
      "#eaf5ed",
    color:
      "#2c7447",
  },

  detailLabel: {
    display:
      "block",
    color:
      "#89948d",
    fontSize:
      "8px",
    fontWeight:
      800,
    textTransform:
      "uppercase",
  },

  detailValue: {
    display:
      "block",
    marginTop:
      "2px",
    color:
      "#33473b",
    fontSize:
      "10px",
    lineHeight:
      1.35,
  },

  routeButtons: {
    display:
      "flex",
    justifyContent:
      "flex-end",
    flexWrap:
      "wrap",
    gap:
      "6px",
    marginTop:
      "12px",
  },

  secondaryButton: {
    minHeight:
      "34px",
    padding:
      "0 10px",
    display:
      "inline-flex",
    alignItems:
      "center",
    justifyContent:
      "center",
    gap:
      "6px",
    border:
      "1px solid #dce6e0",
    borderRadius:
      "9px",
    background:
      "#ffffff",
    color:
      "#52675a",
    textDecoration:
      "none",
    fontSize:
      "9px",
    fontWeight:
      800,
  },

  timeline: {
    padding:
      "3px 2px 1px",
  },

  timelineRow: {
    display:
      "grid",
    gridTemplateColumns:
      "30px 1fr",
    gap:
      "10px",
    minHeight:
      "55px",
  },

  timelineRail: {
    position:
      "relative",
    display:
      "flex",
    flexDirection:
      "column",
    alignItems:
      "center",
  },

  timelineNode: {
    width:
      "25px",
    height:
      "25px",
    borderRadius:
      "9px",
    display:
      "flex",
    alignItems:
      "center",
    justifyContent:
      "center",
    background:
      "#eef2ef",
    color:
      "#87928b",
    fontSize:
      "8px",
    fontWeight:
      800,
    zIndex:
      2,
  },

  timelineNodeReached: {
    background:
      "#e8f5ec",
    color:
      "#287344",
  },

  timelineLine: {
    position:
      "absolute",
    top:
      "25px",
    bottom:
      "-2px",
    width:
      "2px",
  },

  timelineCopy: {
    paddingTop:
      "1px",
  },

  timelineTitleRow: {
    display:
      "flex",
    alignItems:
      "center",
    gap:
      "6px",
  },
  timelineDone: {
    color:
      "#2e8b50",
    fontSize:
      "9px",
  },

  timelineDate: {
    display:
      "block",
    marginTop:
      "3px",
    color:
      "#8b968f",
    fontSize:
      "8px",
  },

  eventList: {
    overflow:
      "hidden",
    borderRadius:
      "11px",
    border:
      "1px solid #e8edea",
  },

  eventRow: {
    display:
      "grid",
    gridTemplateColumns:
      "10px minmax(0, 1fr) auto",
    gap:
      "9px",
    alignItems:
      "center",
    padding:
      "10px 11px",
    borderBottom:
      "1px solid #edf1ee",
  },

  eventDot: {
    width:
      "7px",
    height:
      "7px",
    borderRadius:
      "50%",
    background:
      "#2e7a49",
  },

  eventRowLast: {
    borderBottom:
      "none",
  },

  eventRowDiv: {
    minWidth:
      0,
  },

  eventRowStrong: {
    display:
      "block",
    color:
      "#33473b",
    fontSize:
      "10px",
  },

  eventRowSpan: {
    display:
      "block",
    marginTop:
      "2px",
    color:
      "#7b8880",
    fontSize:
      "8px",
    lineHeight:
      1.4,
  },

  eventTime: {
    color:
      "#89958e",
    fontSize:
      "8px",
    whiteSpace:
      "nowrap",
  },

  noEvents: {
    padding:
      "20px",
    textAlign:
      "center",
    borderRadius:
      "11px",
    border:
      "1px dashed #dce5df",
    color:
      "#7a8880",
    fontSize:
      "10px",
  },

  actionPanel: {
    padding:
      "19px",
    borderRadius:
      "18px",
    background:
      "linear-gradient(145deg, #eef8f1 0%, #ffffff 100%)",
    border:
      "1px solid #d8e8dd",
  },

  actionIcon: {
    width:
      "47px",
    height:
      "47px",
    borderRadius:
      "15px",
    display:
      "flex",
    alignItems:
      "center",
    justifyContent:
      "center",
    marginBottom:
      "14px",
    background:
      "#e1f1e5",
    color:
      "#2a7444",
  },

  actionTitle: {
    margin:
      "5px 0 0",
    color:
      "#23402e",
    fontSize:
      "19px",
  },

  actionHelp: {
    margin:
      "7px 0 15px",
    color:
      "#6e7d74",
    fontSize:
      "10px",
    lineHeight:
      1.5,
  },

  primaryButton: {
    width:
      "100%",
    minHeight:
      "40px",
    padding:
      "0 12px",
    display:
      "inline-flex",
    alignItems:
      "center",
    justifyContent:
      "center",
    gap:
      "7px",
    border:
      "1px solid #226d3e",
    borderRadius:
      "10px",
    background:
      "#236f40",
    color:
      "#ffffff",
    fontSize:
      "10px",
    fontWeight:
      800,
    cursor:
      "pointer",
  },

  secondaryWideButton: {
    width:
      "100%",
    minHeight:
      "38px",
    marginTop:
      "8px",
    padding:
      "0 11px",
    display:
      "inline-flex",
    alignItems:
      "center",
    justifyContent:
      "center",
    gap:
      "7px",
    border:
      "1px solid #d8e4dc",
    borderRadius:
      "10px",
    background:
      "#ffffff",
    color:
      "#55695c",
    fontSize:
      "10px",
    fontWeight:
      800,
    cursor:
      "pointer",
  },

  onlineMiniDot: {
    width:
      "7px",
    height:
      "7px",
    borderRadius:
      "50%",
    background:
      "#36a15b",
  },

  spinner: {
    width:
      "12px",
    height:
      "12px",
    borderRadius:
      "50%",
    border:
      "2px solid rgba(255,255,255,.4)",
    borderTopColor:
      "#ffffff",
    animation:
      "transporter-trip-spin .7s linear infinite",
  },

  locationPanel: {
    marginTop:
      "13px",
    padding:
      "18px",
    borderRadius:
      "18px",
    background:
      "#ffffff",
    border:
      "1px solid #e1e9e4",
  },

  locationHeader: {
    display:
      "flex",
    alignItems:
      "flex-end",
    justifyContent:
      "space-between",
    gap:
      "10px",
  },

  locationLive: {
    display:
      "inline-flex",
    alignItems:
      "center",
    gap:
      "5px",
    padding:
      "5px 7px",
    borderRadius:
      "999px",
    background:
      "#eaf7ee",
    color:
      "#287246",
    fontSize:
      "8px",
    fontWeight:
      800,
  },

  locationLiveDot: {
    width:
      "6px",
    height:
      "6px",
    borderRadius:
      "50%",
    background:
      "#35a25b",
  },

  locationGraphic: {
    minHeight:
      "122px",
    marginTop:
      "12px",
    borderRadius:
      "13px",
    background:
      "radial-gradient(circle at 50% 48%, #e8f4eb 0, #f3f8f5 34%, #fbfdfb 68%)",
    display:
      "flex",
    alignItems:
      "center",
    justifyContent:
      "center",
    color:
      "#2c7445",
    border:
      "1px solid #edf2ee",
  },

  locationData: {
    display:
      "flex",
    flexDirection:
      "column",
    gap:
      "3px",
    marginTop:
      "10px",
    color:
      "#53665a",
    fontSize:
      "9px",
  },

  locationDataStrong: {
    color:
      "#33483b",
    fontSize:
      "10px",
  },

  locationDataSpan: {
    color:
      "#7b8981",
  },

  locationText: {
    margin:
      "10px 0 0",
    color:
      "#738078",
    fontSize:
      "9px",
    lineHeight:
      1.5,
  },

  locationButton: {
    width:
      "100%",
    minHeight:
      "36px",
    marginTop:
      "10px",
    display:
      "inline-flex",
    alignItems:
      "center",
    justifyContent:
      "center",
    gap:
      "6px",
    border:
      "1px solid #d1e0d6",
    borderRadius:
      "9px",
    background:
      "#f7faf8",
    color:
      "#2b7044",
    fontSize:
      "9px",
    fontWeight:
      800,
    cursor:
      "pointer",
  },

  spinnerDark: {
    width:
      "11px",
    height:
      "11px",
    borderRadius:
      "50%",
    border:
      "2px solid #c4d9ca",
    borderTopColor:
      "#2a7445",
    animation:
      "transporter-trip-spin .7s linear infinite",
  },

  locationError: {
    display:
      "flex",
    alignItems:
      "flex-start",
    gap:
      "6px",
    marginTop:
      "9px",
    padding:
      "8px 9px",
    borderRadius:
      "8px",
    background:
      "#fff6f2",
    color:
      "#9a5a49",
    fontSize:
      "8px",
    lineHeight:
      1.4,
  },

  protectionPanel: {
    display:
      "flex",
    alignItems:
      "flex-start",
    gap:
      "9px",
    marginTop:
      "13px",
    padding:
      "14px",
    borderRadius:
      "15px",
    background:
      "#f7faf8",
    border:
      "1px solid #e0e9e3",
    color:
      "#5f7167",
  },

  protectionText: {
    margin:
      "5px 0 0",
    color:
      "#7a8880",
    fontSize:
      "9px",
    lineHeight:
      1.45,
  },

  coordinateCard: {
    display:
      "flex",
    alignItems:
      "flex-start",
    gap:
      "7px",
    marginTop:
      "13px",
    padding:
      "10px",
    borderRadius:
      "11px",
    background:
      "#fbfdfb",
    border:
      "1px solid #e4ebe6",
    color:
      "#738179",
    fontSize:
      "8px",
    lineHeight:
      1.45,
  },

  fareNotice: {
    display: "flex",
    alignItems: "flex-start",
    gap: "7px",
    margin: "0 0 12px",
    padding: "9px 10px",
    borderRadius: "10px",
    background: "#fff8e8",
    border: "1px solid #f1dfad",
    color: "#7a5a20",
    fontSize: "9px",
    fontWeight: 700,
    lineHeight: 1.45,
  },

  fareOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 2147483000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "18px",
    background: "rgba(18, 34, 25, 0.56)",
    backdropFilter: "blur(6px)",
  },

  fareModal: {
    width: "min(100%, 460px)",
    maxHeight: "calc(100dvh - 36px)",
    overflowY: "auto",
    padding: "22px",
    borderRadius: "22px",
    background: "#ffffff",
    border: "1px solid #dce8df",
    boxShadow: "0 24px 70px rgba(9, 46, 24, 0.24)",
  },

  fareModalIcon: {
    width: "50px",
    height: "50px",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "14px",
    background: "#e7f5eb",
    color: "#277246",
  },

  fareModalTitle: {
    margin: "4px 0 0",
    color: "#20382a",
    fontSize: "22px",
    lineHeight: 1.25,
  },

  fareModalText: {
    margin: "9px 0 14px",
    color: "#64746b",
    fontSize: "12px",
    lineHeight: 1.6,
  },

  fareEstimateBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    padding: "11px 12px",
    marginBottom: "12px",
    borderRadius: "11px",
    background: "#f6faf7",
    border: "1px solid #dfebe2",
  },

  fareEstimateBoxSpan: {
    color: "#748179",
    fontSize: "10px",
    fontWeight: 800,
  },

  fareLabel: {
    display: "block",
    color: "#42564a",
    fontSize: "11px",
    fontWeight: 800,
  },

  fareInput: {
    width: "100%",
    boxSizing: "border-box",
    height: "48px",
    marginTop: "7px",
    padding: "0 13px",
    borderRadius: "12px",
    border: "1px solid #cfded4",
    outline: "none",
    background: "#fbfdfb",
    color: "#20382a",
    fontSize: "16px",
    fontWeight: 800,
  },

  fareError: {
    display: "flex",
    alignItems: "flex-start",
    gap: "7px",
    marginTop: "8px",
    padding: "9px 10px",
    borderRadius: "9px",
    background: "#fff5f2",
    color: "#9b5444",
    fontSize: "10px",
    lineHeight: 1.4,
  },

  fareModalButtons: {
    display: "grid",
    gridTemplateColumns: "1fr 1.4fr",
    gap: "8px",
    marginTop: "15px",
  },

  fareCancelButton: {
    minHeight: "44px",
    borderRadius: "11px",
    border: "1px solid #dbe6df",
    background: "#ffffff",
    color: "#65746b",
    fontSize: "11px",
    fontWeight: 800,
    cursor: "pointer",
  },

  fareConfirmButton: {
    minHeight: "44px",
    borderRadius: "11px",
    border: "1px solid #236d3f",
    background: "#236f40",
    color: "#ffffff",
    fontSize: "11px",
    fontWeight: 800,
    cursor: "pointer",
  },

  empty: {
    minHeight:
      "350px",
    marginTop:
      "18px",
    padding:
      "25px",
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
  },

  emptyIcon: {
    width:
      "55px",
    height:
      "55px",
    borderRadius:
      "17px",
    background:
      "#edf7f0",
    color:
      "#2b7445",
    display:
      "flex",
    alignItems:
      "center",
    justifyContent:
      "center",
  },

  emptyTitle: {
    margin:
      "13px 0 0",
    color:
      "#304338",
    fontSize:
      "17px",
  },

  emptyText: {
    margin:
      "7px auto 15px",
    color:
      "#78867e",
    fontSize:
      "10px",
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
      "8px",
  },

  footerLink: {
    marginLeft:
      "auto",
    border:
      0,
    background:
      "transparent",
    color:
      "#2a6f43",
    fontSize:
      "9px",
    fontWeight:
      800,
    cursor:
      "pointer",
  },
};
