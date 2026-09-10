import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Eye,
  EyeOff,
  Globe2,
  LocateFixed,
  LockKeyhole,
  KeyRound,
  MapPin,
  Pencil,
  Phone,
  RefreshCw,
  Save,
  ShieldCheck,
  Star,
  Truck,
  UserRound,
  X,
} from "lucide-react";

import Header from "../../components/Header";
import { useLanguage } from "../../translations/LanguageContext";

const RAW_API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_BASE = String(RAW_API_BASE)
  .replace(/\/+$/, "")
  .replace(/\/api$/i, "");

const SESSION_KEY = "krishisetu_transporter_session";
const TEMP_SESSION_KEY = "krishisetu_transporter_temp_session";
const TRANSPORTER_ID_KEY = "krishisetu_transporter_id";

const COPY = {
  en: {
    eyebrow: "TRANSPORT PARTNER ACCOUNT",
    title: "Profile & service settings",
    subtitle:
      "Keep your identity, vehicle, operating area and live location ready so KrishiSetu can match you with the right farmer requests.",
    back: "Back to dashboard",
    refresh: "Refresh",
    refreshing: "Refreshing…",
    edit: "Edit profile",
    done: "Done",
    save: "Save changes",
    saving: "Saving…",
    cancel: "Cancel",
    overview: "Overview",
    account: "Account",
    vehicle: "Vehicle",
    service: "Service area",
    location: "Live location",
    availability: "Availability",
    security: "Security",
    personal: "Personal information",
    vehicleDetails: "Vehicle details",
    serviceDetails: "Service area & matching",
    locationTitle: "GPS location",
    locationText:
      "GPS is your current working location. Your registered village and district describe your service area, not your live position.",
    updateLocation: "Update current location",
    updatingLocation: "Getting GPS…",
    locationUpdated: "Current GPS location updated.",
    locationError: "Could not update your current location.",
    live: "Live",
    offline: "Offline",
    online: "Online",
    status: "Status",
    name: "Full name",
    phone: "Mobile number",
    vehicleType: "Vehicle type",
    vehicleNumber: "Vehicle number",
    capacity: "Load capacity",
    village: "Registered village",
    mandal: "Mandal / block",
    district: "District",
    state: "State",
    pincode: "Pincode",
    radius: "Service radius",
    currentGps: "Current GPS",
    lastSeen: "Last GPS update",
    noGps: "No current GPS saved yet",
    notAvailable: "Not available",
    registration: "Transporter ID",
    accountCreated: "Account created",
    verified: "Verified account",
    workingHours: "Working hours",
    workingDays: "Working days",
    emergency: "Urgent jobs",
    scheduled: "Scheduled jobs",
    smallLoads: "Small loads",
    enabled: "Enabled",
    disabled: "Disabled",
    passwordTitle: "Password protected",
    passwordText:
      "Your password is never displayed on this page. Authentication remains handled by the backend login system.",
    matchingTitle: "How matching works",
    matchingText:
      "KrishiSetu first considers your current GPS position, service radius, online status and capacity. Your registered service area is used as a fallback.",
    backend: "Backend",
    connected: "Connected",
    unavailable: "Unavailable",
    error: "Unable to load your profile.",
    saveError: "Unable to save profile changes.",
    saved: "Profile updated successfully.",
    login:
      "Your transporter session is missing. Please sign in again.",
    maps: "Open in Maps",
    copyCoords: "Copy coordinates",
    copied: "Copied",
    vehicleFallback: "Transport vehicle",
    noVehicleNumber: "Not provided",
    daysNone: "No working days configured",
    monday: "Mon",
    tuesday: "Tue",
    wednesday: "Wed",
    thursday: "Thu",
    friday: "Fri",
    saturday: "Sat",
    sunday: "Sun",
    rating: "Rating",
    jobs: "Jobs",
    note: "Changes are saved to your transporter account.",
    currentServiceArea: "Registered service area",
    gpsPriority: "GPS-first matching",
    radiusHint: "How far you are willing to travel for farmer pickup.",
    changePassword: "Change password",
    passwordChangeTitle: "Change your password",
    passwordChangeText: "Use your current password to verify your account, then choose a new password.",
    currentPassword: "Current password",
    newPassword: "New password",
    confirmPassword: "Confirm new password",
    showPassword: "Show password",
    hidePassword: "Hide password",
    passwordChanged: "Password changed successfully.",
    passwordMismatch: "New passwords do not match.",
    passwordTooShort: "New password must contain at least 6 characters.",
    currentPasswordRequired: "Enter your current password.",
    changingPassword: "Changing password…",
    close: "Close",
    useGpsForArea: "Use current location to fill service area",
    resolvingArea: "Finding your area…",
    areaUpdated: "Service area filled from your current location.",
    areaResolveError: "Your GPS was saved, but the service-area details could not be resolved. Try again.",
    locationSource: "Location source",
    gpsDetected: "Detected from current GPS",
    registeredSource: "Registered service area",
    preferencesUnavailable: "Job preferences are not configured in the current backend.",
  },
  hi: {
    eyebrow: "परिवहन साझेदार खाता",
    title: "प्रोफ़ाइल और सेवा सेटिंग",
    subtitle:
      "अपनी पहचान, वाहन, सेवा क्षेत्र और वर्तमान स्थान सही रखें ताकि कृषिसेतु सही किसान अनुरोध आपसे जोड़ सके।",
    back: "डैशबोर्ड पर जाएँ",
    refresh: "रिफ्रेश",
    refreshing: "रिफ्रेश हो रहा है…",
    edit: "प्रोफ़ाइल संपादित करें",
    done: "पूरा",
    save: "बदलाव सहेजें",
    saving: "सहेजा जा रहा है…",
    cancel: "रद्द करें",
    overview: "ओवरव्यू",
    account: "खाता",
    vehicle: "वाहन",
    service: "सेवा क्षेत्र",
    location: "लाइव स्थान",
    availability: "उपलब्धता",
    security: "सुरक्षा",
    personal: "व्यक्तिगत जानकारी",
    vehicleDetails: "वाहन विवरण",
    serviceDetails: "सेवा क्षेत्र और मिलान",
    locationTitle: "GPS स्थान",
    locationText:
      "GPS आपका वर्तमान कार्य स्थान है। पंजीकृत गाँव और जिला आपके सेवा क्षेत्र को बताते हैं, लाइव स्थान को नहीं।",
    updateLocation: "वर्तमान स्थान अपडेट करें",
    updatingLocation: "GPS लिया जा रहा है…",
    locationUpdated: "वर्तमान GPS स्थान अपडेट हो गया।",
    locationError: "वर्तमान स्थान अपडेट नहीं हो सका।",
    live: "लाइव",
    offline: "ऑफलाइन",
    online: "ऑनलाइन",
    status: "स्थिति",
    name: "पूरा नाम",
    phone: "मोबाइल नंबर",
    vehicleType: "वाहन प्रकार",
    vehicleNumber: "वाहन नंबर",
    capacity: "लोड क्षमता",
    village: "पंजीकृत गाँव",
    mandal: "मंडल / ब्लॉक",
    district: "जिला",
    state: "राज्य",
    pincode: "पिनकोड",
    radius: "सेवा सीमा",
    currentGps: "वर्तमान GPS",
    lastSeen: "अंतिम GPS अपडेट",
    noGps: "अभी कोई GPS सेव नहीं है",
    notAvailable: "उपलब्ध नहीं",
    registration: "ट्रांसपोर्टर आईडी",
    accountCreated: "खाता बनाया गया",
    verified: "सत्यापित खाता",
    workingHours: "कार्य समय",
    workingDays: "कार्य दिवस",
    emergency: "तत्काल कार्य",
    scheduled: "निर्धारित कार्य",
    smallLoads: "छोटा भार",
    enabled: "सक्रिय",
    disabled: "बंद",
    passwordTitle: "पासवर्ड सुरक्षित",
    passwordText:
      "आपका पासवर्ड इस पेज पर कभी प्रदर्शित नहीं होता। लॉगिन सुरक्षा बैकएंड संभालता है।",
    matchingTitle: "मिलान कैसे होता है",
    matchingText:
      "कृषिसेतु पहले वर्तमान GPS, सेवा सीमा, ऑनलाइन स्थिति और क्षमता देखता है। पंजीकृत क्षेत्र fallback के रूप में उपयोग होता है।",
    backend: "बैकएंड",
    connected: "कनेक्टेड",
    unavailable: "उपलब्ध नहीं",
    error: "प्रोफ़ाइल लोड नहीं हो सकी।",
    saveError: "प्रोफ़ाइल बदलाव सहेजे नहीं जा सके।",
    saved: "प्रोफ़ाइल सफलतापूर्वक अपडेट हुई।",
    login: "ट्रांसपोर्टर सत्र नहीं मिला। कृपया फिर से साइन इन करें।",
    maps: "मैप में खोलें",
    copyCoords: "निर्देशांक कॉपी करें",
    copied: "कॉपी हो गया",
    vehicleFallback: "परिवहन वाहन",
    noVehicleNumber: "उपलब्ध नहीं",
    daysNone: "कोई कार्य दिवस कॉन्फ़िगर नहीं",
    monday: "सोम",
    tuesday: "मंगल",
    wednesday: "बुध",
    thursday: "गुरु",
    friday: "शुक्र",
    saturday: "शनि",
    sunday: "रवि",
    rating: "रेटिंग",
    jobs: "कार्य",
    note: "बदलाव आपके ट्रांसपोर्टर खाते में सेव होंगे।",
    currentServiceArea: "पंजीकृत सेवा क्षेत्र",
    gpsPriority: "GPS-प्रथम मिलान",
    radiusHint: "किसान पिकअप के लिए आप कितनी दूरी तक जाना चाहते हैं।",
    changePassword: "पासवर्ड बदलें",
    passwordChangeTitle: "पासवर्ड बदलें",
    passwordChangeText: "पहले वर्तमान पासवर्ड से खाते की पुष्टि करें, फिर नया पासवर्ड चुनें।",
    currentPassword: "वर्तमान पासवर्ड",
    newPassword: "नया पासवर्ड",
    confirmPassword: "नया पासवर्ड फिर से लिखें",
    showPassword: "पासवर्ड दिखाएँ",
    hidePassword: "पासवर्ड छिपाएँ",
    passwordChanged: "पासवर्ड सफलतापूर्वक बदल गया।",
    passwordMismatch: "नए पासवर्ड एक जैसे नहीं हैं।",
    passwordTooShort: "नया पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।",
    currentPasswordRequired: "वर्तमान पासवर्ड दर्ज करें।",
    changingPassword: "पासवर्ड बदला जा रहा है…",
    close: "बंद करें",
    useGpsForArea: "वर्तमान स्थान से सेवा क्षेत्र भरें",
    resolvingArea: "आपका क्षेत्र खोजा जा रहा है…",
    areaUpdated: "वर्तमान GPS से सेवा क्षेत्र भर दिया गया।",
    areaResolveError: "GPS सेव हो गया, लेकिन सेवा क्षेत्र की जानकारी नहीं मिली। फिर से प्रयास करें।",
    locationSource: "स्थान स्रोत",
    gpsDetected: "वर्तमान GPS से मिला",
    registeredSource: "पंजीकृत सेवा क्षेत्र",
    preferencesUnavailable: "इस बैकएंड में जॉब प्रेफरेंस अभी कॉन्फ़िगर नहीं हैं।",
  },
  te: {
    eyebrow: "రవాణా భాగస్వామి ఖాతా",
    title: "ప్రొఫైల్ & సేవా సెట్టింగ్స్",
    subtitle:
      "మీ గుర్తింపు, వాహనం, సేవా ప్రాంతం మరియు ప్రస్తుత GPS సరిగ్గా ఉంచండి. అప్పుడు కృషిసేతు సరైన రైతు అభ్యర్థనలను మీతో మ్యాచింగ్ చేయగలదు.",
    back: "డ్యాష్‌బోర్డ్‌కు వెళ్ళండి",
    refresh: "రిఫ్రెష్",
    refreshing: "రిఫ్రెష్ అవుతోంది…",
    edit: "ప్రొఫైల్ మార్చండి",
    done: "పూర్తి",
    save: "మార్పులు సేవ్ చేయండి",
    saving: "సేవ్ అవుతోంది…",
    cancel: "రద్దు",
    overview: "ఓవerview",
    account: "ఖాతా",
    vehicle: "వాహనం",
    service: "సేవా ప్రాంతం",
    location: "లైవ్ లొకేషన్",
    availability: "అందుబాటు",
    security: "భద్రత",
    personal: "వ్యక్తిగత సమాచారం",
    vehicleDetails: "వాహన వివరాలు",
    serviceDetails: "సేవా ప్రాంతం & మ్యాచింగ్",
    locationTitle: "GPS లొకేషన్",
    locationText:
      "GPS మీ ప్రస్తుత పని స్థానం. రిజిస్టర్ చేసిన గ్రామం మరియు జిల్లా మీ సేవా ప్రాంతాన్ని సూచిస్తాయి, లైవ్ స్థానాన్ని కాదు.",
    updateLocation: "ప్రస్తుత లొకేషన్ అప్డేట్ చేయండి",
    updatingLocation: "GPS తీసుకుంటోంది…",
    locationUpdated: "ప్రస్తుత GPS లొకేషన్ అప్డేట్ అయింది.",
    locationError: "ప్రస్తుత లొకేషన్ అప్డేట్ కాలేదు.",
    live: "లైవ్",
    offline: "ఆఫ్‌లైన్",
    online: "ఆన్‌లైన్",
    status: "స్థితి",
    name: "పూర్తి పేరు",
    phone: "మొబైల్ నంబర్",
    vehicleType: "వాహన రకం",
    vehicleNumber: "వాహన నంబర్",
    capacity: "లోడ్ సామర్థ్యం",
    village: "రిజిస్టర్ చేసిన గ్రామం",
    mandal: "మండలం / బ్లాక్",
    district: "జిల్లా",
    state: "రాష్ట్రం",
    pincode: "పిన్‌కోడ్",
    radius: "సేవా పరిధి",
    currentGps: "ప్రస్తుత GPS",
    lastSeen: "చివరి GPS అప్డేట్",
    noGps: "ఇంకా GPS సేవ్ కాలేదు",
    notAvailable: "అందుబాటులో లేదు",
    registration: "ట్రాన్స్‌పోర్టర్ ID",
    accountCreated: "ఖాతా సృష్టించబడింది",
    verified: "ధృవీకరించిన ఖాతా",
    workingHours: "పని సమయం",
    workingDays: "పని రోజులు",
    emergency: "అత్యవసర పనులు",
    scheduled: "షెడ్యూల్ పనులు",
    smallLoads: "చిన్న లోడ్లు",
    enabled: "అమల్లో ఉంది",
    disabled: "ఆఫ్",
    passwordTitle: "పాస్‌వర్డ్ రక్షితం",
    passwordText:
      "మీ పాస్‌వర్డ్ ఈ పేజీలో చూపబడదు. లాగిన్ భద్రత బ్యాకెండ్ ద్వారా నిర్వహించబడుతుంది.",
    matchingTitle: "మ్యాచింగ్ ఎలా పనిచేస్తుంది",
    matchingText:
      "కృషిసేతు ముందుగా ప్రస్తుత GPS, సేవా పరిధి, ఆన్‌లైన్ స్థితి మరియు సామర్థ్యాన్ని చూస్తుంది. రిజిస్టర్ చేసిన ప్రాంతం fallback గా ఉపయోగించబడుతుంది.",
    backend: "బ్యాకెండ్",
    connected: "కనెక్ట్ అయింది",
    unavailable: "అందుబాటులో లేదు",
    error: "ప్రొఫైల్ లోడ్ కాలేదు.",
    saveError: "ప్రొఫైల్ మార్పులు సేవ్ కాలేదు.",
    saved: "ప్రొఫైల్ విజయవంతంగా అప్డేట్ అయింది.",
    login: "రవాణాదారు సేషన్ లేదు. మళ్లీ సైన్ ఇన్ చేయండి.",
    maps: "మ్యాప్స్‌లో తెరవండి",
    copyCoords: "కోఆర్డినేట్లు కాపీ చేయండి",
    copied: "కాపీ అయింది",
    vehicleFallback: "రవాణా వాహనం",
    noVehicleNumber: "అందుబాటులో లేదు",
    daysNone: "పని రోజులు కాన్ఫిగర్ కాలేదు",
    monday: "సోమ",
    tuesday: "మంగళ",
    wednesday: "బుధ",
    thursday: "గురు",
    friday: "శుక్ర",
    saturday: "శని",
    sunday: "ఆది",
    rating: "రేటింగ్",
    jobs: "పనులు",
    note: "మార్పులు మీ ట్రాన్స్‌పోర్టర్ ఖాతాలో సేవ్ అవుతాయి.",
    currentServiceArea: "రిజిస్టర్ చేసిన సేవా ప్రాంతం",
    gpsPriority: "GPS-మొదటి మ్యాచింగ్",
    radiusHint: "రైతు పికప్ కోసం మీరు ఎంత దూరం ప్రయాణించడానికి సిద్ధంగా ఉన్నారు.",
  },
};

const VEHICLE_OPTIONS = [
  ["TRACTOR", "Tractor"],
  ["MINI_TRUCK", "Mini truck"],
  ["PICKUP", "Pickup"],
  ["TRUCK", "Truck"],
  ["TEMPO", "Tempo"],
  ["OTHER", "Other"],
];

const DAYS = [
  ["MON", "monday"],
  ["TUE", "tuesday"],
  ["WED", "wednesday"],
  ["THU", "thursday"],
  ["FRI", "friday"],
  ["SAT", "saturday"],
  ["SUN", "sunday"],
];

function getSession() {
  const sources = [
    [SESSION_KEY, window.localStorage],
    [TEMP_SESSION_KEY, window.sessionStorage],
  ];

  for (const [key, storage] of sources) {
    try {
      const raw = storage.getItem(key);
      if (!raw) continue;
      const session = JSON.parse(raw);
      if (session?.transporter?.id) return session;
    } catch {
      // Continue to fallback.
    }
  }

  const id = window.localStorage.getItem(TRANSPORTER_ID_KEY);
  return id ? { transporter: { id } } : null;
}

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  let data = {};
  try {
    data = await response.json();
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

function vehicleLabel(value, copy) {
  const key = String(value || "").toUpperCase();
  return (
    VEHICLE_OPTIONS.find(([code]) => code === key)?.[1] ||
    value ||
    copy.vehicleFallback
  );
}

function readDays(value, copy) {
  if (!Array.isArray(value) || !value.length) return copy.daysNone;

  return value
    .map((day) => {
      const entry = DAYS.find(
        ([code]) => code === String(day).toUpperCase()
      );
      return entry ? copy[entry[1]] : day;
    })
    .join(" · ");
}

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRating(value) {
  const rating = Number(value);
  return Number.isFinite(rating) && rating > 0 ? rating.toFixed(1) : "—";
}

function initials(name = "Transporter") {
  return String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function mapsUrl(lat, lng) {
  const safeLat = Number(lat);
  const safeLng = Number(lng);
  if (!Number.isFinite(safeLat) || !Number.isFinite(safeLng)) return "";
  return `https://www.google.com/maps?q=${safeLat},${safeLng}`;
}

function Field({
  label,
  value,
  onChange,
  disabled = false,
  readOnly = false,
  type = "text",
  hint = "",
}) {
  return (
    <label style={styles.field}>
      <span style={styles.fieldLabel}>{label}</span>
      <input
        type={type}
        value={value ?? ""}
        onChange={onChange}
        disabled={disabled}
        readOnly={readOnly}
        style={styles.input}
      />
      {hint ? <span style={styles.fieldHint}>{hint}</span> : null}
    </label>
  );
}

function SelectField({ label, value, onChange, options = [] }) {
  return (
    <label style={styles.field}>
      <span style={styles.fieldLabel}>{label}</span>
      <select value={value ?? ""} onChange={onChange} style={styles.input}>
        {options.map(([valueOption, labelOption]) => (
          <option key={valueOption} value={valueOption}>
            {labelOption}
          </option>
        ))}
      </select>
    </label>
  );
}

function DetailTile({ icon: Icon, label, value, tone = "green" }) {
  const toneMap = {
    green: {
      bg: "#eef8f1",
      icon: "#2f7d4d",
    },
    blue: {
      bg: "#eef5fb",
      icon: "#3d6f9f",
    },
    amber: {
      bg: "#fff7e8",
      icon: "#a27026",
    },
  };

  const colors = toneMap[tone] || toneMap.green;

  return (
    <div style={styles.detailTile}>
      <div style={{ ...styles.detailIcon, background: colors.bg, color: colors.icon }}>
        <Icon size={17} />
      </div>
      <div style={styles.detailTextWrap}>
        <span style={styles.detailLabel}>{label}</span>
        <strong style={styles.detailValue}>{value || "—"}</strong>
      </div>
    </div>
  );
}

function SectionCard({ icon: Icon, title, subtitle, children, action }) {
  return (
    <section style={styles.sectionCard}>
      <div style={styles.sectionHeader}>
        <div style={styles.sectionTitleWrap}>
          <div style={styles.sectionIcon}>
            <Icon size={18} />
          </div>
          <div>
            <h2 style={styles.sectionTitle}>{title}</h2>
            {subtitle ? <p style={styles.sectionSubtitle}>{subtitle}</p> : null}
          </div>
        </div>
        {action || null}
      </div>
      <div style={styles.sectionBody}>{children}</div>
    </section>
  );
}

export default function TransporterProfile() {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();

  const copy = useMemo(
    () => COPY[language] || COPY.en,
    [language]
  );

  const session = useMemo(() => getSession(), []);
  const transporterId =
    session?.transporter?.id ||
    window.localStorage.getItem(TRANSPORTER_ID_KEY);

  const [transporter, setTransporter] = useState(session?.transporter || null);
  const [draft, setDraft] = useState(session?.transporter || null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locationBusy, setLocationBusy] = useState(false);
  const [locationNotice, setLocationNotice] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [backendState, setBackendState] = useState("idle");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState({ current: false, next: false, confirm: false });
  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" });
  const [areaBusy, setAreaBusy] = useState(false);

  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (!transporterId) {
        setError(copy.login);
        setLoading(false);
        return;
      }

      if (!silent) setLoading(true);
      setBackendState("loading");

      try {
        const response = await api(
          `/api/transporters/${encodeURIComponent(transporterId)}/profile`
        );

        const next = response?.transporter || null;

        if (!next) {
          throw new Error(copy.error);
        }

        setTransporter(next);
        setDraft(next);
        setError("");
        setBackendState("connected");
      } catch (loadError) {
        setBackendState("unavailable");
        setError(loadError?.message || copy.error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [copy.error, copy.login, transporterId]
  );

  useEffect(() => {
    load();
  }, [load]);

  const updateDraft = (key, value) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setError("");
    setSuccess("");
  };

  const save = async (event) => {
    event?.preventDefault();

    if (!draft || !transporterId) return;

    const name = String(draft.name || "").trim();
    const phone = String(draft.phone || "").replace(/\D/g, "");
    const capacity = Number(
      draft.capacity_kg ?? draft.capacityKg ?? 0
    );
    const radius = Number(
      draft.service_radius_km ??
        draft.serviceRadiusKm ??
        0
    );

    if (!name) {
      setError(`${copy.name} is required.`);
      return;
    }

    if (phone.length !== 10) {
      setError(`${copy.phone} must contain 10 digits.`);
      return;
    }

    if (!Number.isFinite(capacity) || capacity <= 0) {
      setError(`${copy.capacity} must be greater than zero.`);
      return;
    }

    if (!Number.isFinite(radius) || radius < 0 || radius > 250) {
      setError(`${copy.radius} must be between 0 and 250 km.`);
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        id: transporterId,
        name,
        phone,
        vehicleType:
          draft.vehicle_type ??
          draft.vehicleType ??
          "",
        vehicleNumber:
          draft.vehicle_number ??
          draft.vehicleNumber ??
          "",
        capacityKg: capacity,
        village: draft.village || "",
        villageId: draft.village_id || draft.villageId || "",
        mandal: draft.mandal || "",
        mandalId: draft.mandal_id || draft.mandalId || "",
        district: draft.district || "",
        districtId: draft.district_id || draft.districtId || "",
        state: draft.state || "",
        stateId: draft.state_id || draft.stateId || "",
        pincode: draft.pincode || "",
        serviceRadiusKm: radius,
        isOnline: online,
        currentLat:
          draft.current_lat ??
          draft.currentLat ??
          current.current_lat ??
          current.currentLat ??
          null,
        currentLng:
          draft.current_lng ??
          draft.currentLng ??
          current.current_lng ??
          current.currentLng ??
          null,
      };

      const response = await api(
        "/api/transporters",
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      const next =
        response?.transporter ||
        response?.data?.transporter ||
        null;

      if (next) {
        setTransporter(next);
        setDraft(next);
      } else {
        await load({ silent: true });
      }

      setEditing(false);
      setSuccess(copy.saved);
    } catch (saveError) {
      setError(saveError?.message || copy.saveError);
    } finally {
      setSaving(false);
    }
  };

  const reverseGeocode = async (lat, lng) => {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&zoom=18&addressdetails=1&accept-language=en`;
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("Reverse geocoding failed.");
    const data = await response.json();
    const address = data?.address || {};

    const village =
      address.village ||
      address.hamlet ||
      address.suburb ||
      address.town ||
      address.city_district ||
      "";
    const mandal =
      address.county ||
      address.city_district ||
      address.municipality ||
      address.township ||
      "";
    const district =
      address.state_district ||
      address.district ||
      address.county ||
      "";
    const state = address.state || "";
    const pincode = address.postcode || "";

    return { village, mandal, district, state, pincode };
  };

  const captureLocation = async ({ fillServiceArea = false } = {}) => {
    if (!navigator.geolocation) {
      setLocationNotice(copy.locationError);
      return;
    }

    if (!transporterId) {
      setLocationNotice(copy.login);
      return;
    }

    if (fillServiceArea) setAreaBusy(true);
    setLocationBusy(true);
    setLocationNotice("");
    setError("");
    setSuccess("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = Number(position.coords.latitude);
        const lng = Number(position.coords.longitude);
        let area = null;

        try {
          if (fillServiceArea) {
            area = await reverseGeocode(lat, lng);
            if (!area?.state && !area?.district && !area?.village) {
              throw new Error(copy.areaResolveError);
            }
          }

          const nextDraft = {
            ...(draft || {}),
            current_lat: lat,
            current_lng: lng,
            location_updated_at: new Date().toISOString(),
            ...(area
              ? {
                  village: area.village || draft?.village || "",
                  mandal: area.mandal || draft?.mandal || "",
                  district: area.district || draft?.district || "",
                  state: area.state || draft?.state || "",
                  pincode: area.pincode || draft?.pincode || "",
                }
              : {}),
          };

          if (fillServiceArea) {
            const response = await api("/api/transporters", {
              method: "POST",
              body: JSON.stringify({
                id: transporterId,
                name: current.name || "",
                phone: current.phone || "",
                vehicleType: current.vehicle_type || current.vehicleType || "TRUCK",
                vehicleNumber: current.vehicle_number || current.vehicleNumber || "",
                capacityKg: Number(current.capacity_kg ?? current.capacityKg ?? 1000),
                village: area.village || current.village || "",
                villageId: current.village_id || current.villageId || "",
                mandal: area.mandal || current.mandal || "",
                mandalId: current.mandal_id || current.mandalId || "",
                district: area.district || current.district || "",
                districtId: current.district_id || current.districtId || "",
                state: area.state || current.state || "",
                stateId: current.state_id || current.stateId || "",
                pincode: area.pincode || current.pincode || "",
                serviceRadiusKm: Number(current.service_radius_km ?? current.serviceRadiusKm ?? 0),
                isOnline: online,
                currentLat: lat,
                currentLng: lng,
              }),
            });

            const next = response?.transporter || response?.data?.transporter || null;
            setTransporter((old) => ({ ...(old || {}), ...(next || {}), ...nextDraft }));
            setDraft((old) => ({ ...(old || {}), ...(next || {}), ...nextDraft }));
            setEditing(true);
            setActiveTab("service");
            setLocationNotice(copy.areaUpdated);
          } else {
            const response = await api(
              `/api/transporters/${encodeURIComponent(transporterId)}/location`,
              {
                method: "PATCH",
                body: JSON.stringify({ lat, lng }),
              }
            );

            const next = response?.transporter || {};
            setTransporter((old) => ({ ...(old || {}), ...next, current_lat: lat, current_lng: lng, location_updated_at: new Date().toISOString() }));
            setDraft((old) => ({ ...(old || {}), ...next, current_lat: lat, current_lng: lng, location_updated_at: new Date().toISOString() }));
            setLocationNotice(copy.locationUpdated);
          }
        } catch (locationError) {
          setLocationNotice(
            locationError?.message ||
              (fillServiceArea ? copy.areaResolveError : copy.locationError)
          );
        } finally {
          setLocationBusy(false);
          setAreaBusy(false);
        }
      },
      (geoError) => {
        setLocationBusy(false);
        setAreaBusy(false);
        const messageMap = {
          1: "Location permission was denied.",
          2: "Current location is unavailable.",
          3: "Location request timed out.",
        };
        setLocationNotice(messageMap[geoError?.code] || copy.locationError);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      }
    );
  };

  const changePassword = async (event) => {
    event?.preventDefault();
    const currentPassword = passwordForm.current;
    const nextPassword = passwordForm.next;
    const confirmPassword = passwordForm.confirm;

    if (!currentPassword) {
      setError(copy.currentPasswordRequired);
      return;
    }
    if (nextPassword.length < 6) {
      setError(copy.passwordTooShort);
      return;
    }
    if (nextPassword !== confirmPassword) {
      setError(copy.passwordMismatch);
      return;
    }

    setPasswordBusy(true);
    setError("");
    setSuccess("");

    try {
      await api("/api/transporters/login", {
        method: "POST",
        body: JSON.stringify({ phone: current.phone, password: currentPassword }),
      });

      const response = await api("/api/transporters", {
        method: "POST",
        body: JSON.stringify({
          id: transporterId,
          name: current.name || "",
          phone: current.phone || "",
          vehicleType: current.vehicle_type || current.vehicleType || "TRUCK",
          vehicleNumber: current.vehicle_number || current.vehicleNumber || "",
          capacityKg: Number(current.capacity_kg ?? current.capacityKg ?? 1000),
          village: current.village || "",
          villageId: current.village_id || current.villageId || "",
          mandal: current.mandal || "",
          mandalId: current.mandal_id || current.mandalId || "",
          district: current.district || "",
          districtId: current.district_id || current.districtId || "",
          state: current.state || "",
          stateId: current.state_id || current.stateId || "",
          pincode: current.pincode || "",
          serviceRadiusKm: Number(current.service_radius_km ?? current.serviceRadiusKm ?? 0),
          isOnline: online,
          currentLat: currentLat ?? null,
          currentLng: currentLng ?? null,
          password: nextPassword,
        }),
      });

      const next = response?.transporter || response?.data?.transporter || null;
      if (next) {
        setTransporter(next);
        setDraft(next);
      }
      setPasswordForm({ current: "", next: "", confirm: "" });
      setPasswordVisible({ current: false, next: false, confirm: false });
      setPasswordOpen(false);
      setSuccess(copy.passwordChanged);
    } catch (passwordError) {
      setError(passwordError?.message || copy.saveError);
    } finally {
      setPasswordBusy(false);
    }
  };

  const copyCoordinates = async () => {
    const lat =
      transporter?.current_lat ??
      transporter?.currentLat;
    const lng =
      transporter?.current_lng ??
      transporter?.currentLng;

    if (lat == null || lng == null) return;

    try {
      await navigator.clipboard.writeText(
        `${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}`
      );
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const cancelEdit = () => {
    setDraft(transporter);
    setEditing(false);
    setError("");
    setSuccess("");
  };

  const current = transporter || {};
  const currentLat = current.current_lat ?? current.currentLat;
  const currentLng = current.current_lng ?? current.currentLng;
  const currentGpsUrl = mapsUrl(currentLat, currentLng);

  const rating = formatRating(
    current.rating ??
      current.average_rating ??
      current.avg_rating
  );

  const totalJobs = Number(
    current.completed_jobs ??
      current.completed_jobs_count ??
      current.total_jobs ??
      0
  );

  const online =
    current.is_online === true ||
    current.isOnline === true;

  const radius =
    current.service_radius_km ??
    current.serviceRadiusKm;

  const days =
    current.available_days ??
    current.availableDays ??
    [];

  const tabs = [
    ["overview", copy.overview],
    ["account", copy.account],
    ["service", copy.service],
    ["location", copy.location],
  ];

  if (!transporterId) return null;

  return (
    <div style={styles.page}>
      <Header />

      <main style={styles.shell}>
        <header style={styles.topbar}>
          <div style={styles.topbarLeft}>
            <button
              type="button"
              onClick={() => navigate("/transporter/dashboard")}
              style={styles.backButton}
            >
              <ArrowLeft size={17} />
              {copy.back}
            </button>

            <div style={styles.breadcrumb}>
              <span>{copy.eyebrow}</span>
              <ChevronRight size={12} />
              <strong>{copy.title}</strong>
            </div>
          </div>

          <div style={styles.topbarActions}>
            <div style={styles.languagePill}>
              <Globe2 size={14} />
              {[
                ["en", "EN"],
                ["hi", "HI"],
                ["te", "TE"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setLanguage(id)}
                  style={{
                    ...styles.languageButton,
                    ...(language === id ? styles.languageActive : {}),
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                setRefreshing(true);
                load({ silent: true });
              }}
              disabled={refreshing}
              style={styles.secondaryButton}
            >
              <RefreshCw
                size={15}
                style={
                  refreshing
                    ? { animation: "ks-profile-spin .8s linear infinite" }
                    : undefined
                }
              />
              {refreshing ? copy.refreshing : copy.refresh}
            </button>
          </div>
        </header>

        {error ? (
          <div style={styles.errorBanner}>
            <AlertCircle size={17} />
            <span style={styles.flexOne}>{error}</span>
            <button
              type="button"
              onClick={() => load()}
              style={styles.inlineAction}
            >
              {copy.refresh}
            </button>
            <button
              type="button"
              onClick={() => setError("")}
              style={styles.iconButton}
            >
              <X size={15} />
            </button>
          </div>
        ) : null}

        {success ? (
          <div style={styles.successBanner}>
            <CheckCircle2 size={17} />
            <span style={styles.flexOne}>{success}</span>
            <button
              type="button"
              onClick={() => setSuccess("")}
              style={styles.iconButton}
            >
              <X size={15} />
            </button>
          </div>
        ) : null}

        {loading ? (
          <div style={styles.loadingCard}>
            <div style={styles.loadingOrb}>
              <Truck size={24} />
            </div>
            <strong>Loading transporter profile…</strong>
            <span>Getting your account and location details.</span>
          </div>
        ) : (
          <>
            <section style={styles.hero}>
              <div style={styles.heroMain}>
                <div style={styles.avatar}>{initials(current.name)}</div>

                <div style={styles.heroIdentity}>
                  <div style={styles.heroEyebrow}>
                    {copy.verified}
                  </div>
                  <h1 style={styles.heroTitle}>
                    {current.name || "Transporter"}
                  </h1>
                  <div style={styles.heroMeta}>
                    <span style={styles.metaItem}>
                      <Phone size={14} />
                      {current.phone || copy.notAvailable}
                    </span>
                    <span style={styles.metaItem}>
                      <Truck size={14} />
                      {vehicleLabel(current.vehicle_type, copy)}
                    </span>
                    <span style={styles.metaItem}>
                      <Star size={14} />
                      {rating} {copy.rating}
                    </span>
                  </div>
                </div>
              </div>

              <div style={styles.heroStats}>
                <div style={styles.heroStat}>
                  <span>{copy.status}</span>
                  <strong
                    style={{
                      color: online ? "#267247" : "#66756c",
                    }}
                  >
                    <span
                      style={{
                        ...styles.onlineDot,
                        background: online ? "#2d9b58" : "#8a958f",
                      }}
                    />
                    {online ? copy.online : copy.offline}
                  </strong>
                </div>
                <div style={styles.heroStat}>
                  <span>{copy.jobs}</span>
                  <strong>{Number.isFinite(totalJobs) ? totalJobs : "—"}</strong>
                </div>
              </div>
            </section>

            <div style={styles.contextRow}>
              <div style={styles.contextPill}>
                <ShieldCheck size={14} />
                {copy.gpsPriority}
              </div>
              <div style={styles.contextPill}>
                <MapPin size={14} />
                {current.village || current.district
                  ? `${current.village || "—"}${current.district ? ` · ${current.district}` : ""}`
                  : copy.notAvailable}
              </div>
              <div style={styles.contextPill}>
                <Truck size={14} />
                {radius != null ? `${radius} km service radius` : copy.radius}
              </div>
              <span style={styles.backendStatus}>
                <span
                  style={{
                    ...styles.backendDot,
                    background:
                      backendState === "connected"
                        ? "#31a05b"
                        : backendState === "loading"
                        ? "#bb8a31"
                        : "#be5b51",
                  }}
                />
                {copy.backend}:{" "}
                {backendState === "connected"
                  ? copy.connected
                  : backendState === "loading"
                  ? "Checking…"
                  : copy.unavailable}
              </span>
            </div>

            <nav style={styles.tabs}>
              {tabs.map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  style={{
                    ...styles.tabButton,
                    ...(activeTab === id ? styles.tabActive : {}),
                  }}
                >
                  {label}
                </button>
              ))}

              {!editing ? (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  style={styles.primaryButton}
                >
                  <Pencil size={15} />
                  {copy.edit}
                </button>
              ) : (
                <div style={styles.editActions}>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    disabled={saving}
                    style={styles.secondaryButton}
                  >
                    <X size={15} />
                    {copy.cancel}
                  </button>
                  <button
                    type="button"
                    onClick={save}
                    disabled={saving}
                    style={styles.primaryButton}
                  >
                    {saving ? (
                      <span style={styles.spinner} />
                    ) : (
                      <Save size={15} />
                    )}
                    {saving ? copy.saving : copy.save}
                  </button>
                </div>
              )}
            </nav>

            <form onSubmit={save}>
              {activeTab === "overview" ? (
                <div style={styles.contentGrid}>
                  <div style={styles.mainColumn}>
                    <SectionCard
                      icon={UserRound}
                      title={copy.personal}
                      subtitle="The identity farmers and the operations team see."
                      action={
                        editing ? null : (
                          <span style={styles.sectionBadge}>Profile</span>
                        )
                      }
                    >
                      <div style={styles.detailsGrid}>
                        <DetailTile
                          icon={UserRound}
                          label={copy.name}
                          value={current.name}
                        />
                        <DetailTile
                          icon={Phone}
                          label={copy.phone}
                          value={current.phone}
                        />
                        <DetailTile
                          icon={Truck}
                          label={copy.vehicleType}
                          value={vehicleLabel(current.vehicle_type, copy)}
                        />
                        <DetailTile
                          icon={Truck}
                          label={copy.capacity}
                          value={
                            current.capacity_kg != null
                              ? `${Number(current.capacity_kg).toLocaleString("en-IN")} kg`
                              : "—"
                          }
                        />
                      </div>
                    </SectionCard>

                    <SectionCard
                      icon={Truck}
                      title={copy.vehicleDetails}
                      subtitle="Vehicle information used for load and job eligibility."
                    >
                      {editing ? (
                        <div style={styles.editGrid}>
                          <SelectField
                            label={copy.vehicleType}
                            value={
                              draft?.vehicle_type ??
                              draft?.vehicleType ??
                              ""
                            }
                            onChange={(event) =>
                              updateDraft(
                                "vehicle_type",
                                event.target.value
                              )
                            }
                            options={[
                              ["", "Select vehicle"],
                              ...VEHICLE_OPTIONS,
                            ]}
                          />
                          <Field
                            label={copy.vehicleNumber}
                            value={
                              draft?.vehicle_number ??
                              draft?.vehicleNumber ??
                              ""
                            }
                            onChange={(event) =>
                              updateDraft(
                                "vehicle_number",
                                event.target.value.toUpperCase()
                              )
                            }
                          />
                          <Field
                            label={copy.capacity}
                            type="number"
                            value={
                              draft?.capacity_kg ??
                              draft?.capacityKg ??
                              ""
                            }
                            onChange={(event) =>
                              updateDraft(
                                "capacity_kg",
                                event.target.value
                              )
                            }
                          />
                        </div>
                      ) : (
                        <div style={styles.vehicleSummary}>
                          <div style={styles.vehicleVisual}>
                            <Truck size={31} />
                          </div>
                          <div style={styles.vehicleIdentity}>
                            <strong>
                              {vehicleLabel(current.vehicle_type, copy)}
                            </strong>
                            <span>
                              {current.vehicle_number ||
                                copy.noVehicleNumber}
                            </span>
                          </div>
                          <div style={styles.vehicleCapacity}>
                            <span>{copy.capacity}</span>
                            <strong>
                              {current.capacity_kg != null
                                ? `${Number(
                                    current.capacity_kg
                                  ).toLocaleString("en-IN")} kg`
                                : "—"}
                            </strong>
                          </div>
                        </div>
                      )}
                    </SectionCard>

                    <SectionCard
                      icon={LockKeyhole}
                      title={copy.security}
                      subtitle="Account protection and backend authentication."
                      action={
                        <button
                          type="button"
                          onClick={() => {
                            setPasswordOpen(true);
                            setError("");
                            setSuccess("");
                          }}
                          style={styles.smallActionButton}
                        >
                          <KeyRound size={15} />
                          {copy.changePassword}
                        </button>
                      }
                    >
                      <div style={styles.securityPanel}>
                        <div style={styles.securityIcon}>
                          <LockKeyhole size={20} />
                        </div>
                        <div style={styles.securityBody}>
                          <strong>{copy.passwordTitle}</strong>
                          <p>{copy.passwordText}</p>
                        </div>
                        <CheckCircle2 size={18} color="#2a7b48" />
                      </div>
                    </SectionCard>
                  </div>

                  <aside style={styles.sideColumn}>
                    <SectionCard
                      icon={MapPin}
                      title={copy.locationTitle}
                      subtitle={copy.locationText}
                    >
                      <LocationPanel
                        current={current}
                        copy={copy}
                        currentLat={currentLat}
                        currentLng={currentLng}
                        locationBusy={locationBusy}
                        locationNotice={locationNotice}
                        onUpdate={captureLocation}
                        mapsHref={currentGpsUrl}
                        onCopy={copyCoordinates}
                        copied={copied}
                      />
                    </SectionCard>

                    <SectionCard
                      icon={Clock3}
                      title={copy.availability}
                      subtitle="When and what kinds of transport jobs you accept."
                    >
                      <div style={styles.availabilityStack}>
                        <DetailTile
                          icon={Clock3}
                          label={copy.status}
                          value={online ? copy.online : copy.offline}
                          tone={online ? "green" : "blue"}
                        />
                        <DetailTile
                          icon={Clock3}
                          label={copy.workingHours}
                          value={
                            current.start_time && current.end_time
                              ? `${current.start_time} – ${current.end_time}`
                              : "—"
                          }
                        />
                        <div style={styles.daysPanel}>
                          <span style={styles.detailLabel}>
                            {copy.workingDays}
                          </span>
                          <strong style={styles.daysText}>
                            {readDays(days, copy)}
                          </strong>
                        </div>
                        <div style={styles.preferenceInfo}>
                          <ShieldCheck size={16} />
                          <span>{copy.preferencesUnavailable}</span>
                        </div>
                      </div>
                    </SectionCard>
                  </aside>
                </div>
              ) : null}

              {activeTab === "account" ? (
                <div style={styles.singleGrid}>
                  <SectionCard
                    icon={UserRound}
                    title={copy.personal}
                    subtitle={copy.note}
                  >
                    <div style={styles.editGrid}>
                      <Field
                        label={copy.name}
                        value={draft?.name}
                        onChange={(event) =>
                          updateDraft("name", event.target.value)
                        }
                      />
                      <Field
                        label={copy.phone}
                        value={draft?.phone}
                        onChange={(event) =>
                          updateDraft("phone", event.target.value)
                        }
                      />
                      <Field
                        label={copy.registration}
                        value={current.id}
                        readOnly
                      />
                      <Field
                        label={copy.accountCreated}
                        value={formatDateTime(
                          current.created_at ??
                            current.createdAt
                        )}
                        readOnly
                      />
                    </div>
                  </SectionCard>
                </div>
              ) : null}

              {activeTab === "service" ? (
                <div style={styles.singleGrid}>
                  <SectionCard
                    icon={MapPin}
                    title={copy.serviceDetails}
                    subtitle={copy.matchingText}
                  >
                    <div style={styles.serviceHighlight}>
                      <div style={styles.serviceHighlightIcon}>
                        <ShieldCheck size={21} />
                      </div>
                      <div>
                        <strong>{copy.gpsPriority}</strong>
                        <p>
                          {copy.currentServiceArea} is kept separately from
                          your current working GPS.
                        </p>
                      </div>
                    </div>

                    <div style={styles.areaAssistPanel}>
                      <div style={styles.areaAssistIcon}>
                        <LocateFixed size={18} />
                      </div>
                      <div style={styles.areaAssistBody}>
                        <strong>{copy.gpsDetected}</strong>
                        <span>{copy.currentGps}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => captureLocation({ fillServiceArea: true })}
                        disabled={areaBusy || locationBusy}
                        style={styles.smallActionButton}
                      >
                        <LocateFixed size={15} />
                        {areaBusy ? copy.resolvingArea : copy.useGpsForArea}
                      </button>
                    </div>

                    <div style={styles.editGrid}>
                      <Field
                        label={copy.village}
                        value={draft?.village}
                        onChange={(event) =>
                          updateDraft("village", event.target.value)
                        }
                      />
                      <Field
                        label={copy.mandal}
                        value={draft?.mandal}
                        onChange={(event) =>
                          updateDraft("mandal", event.target.value)
                        }
                      />
                      <Field
                        label={copy.district}
                        value={draft?.district}
                        onChange={(event) =>
                          updateDraft("district", event.target.value)
                        }
                      />
                      <Field
                        label={copy.state}
                        value={draft?.state}
                        onChange={(event) =>
                          updateDraft("state", event.target.value)
                        }
                      />
                      <Field
                        label={copy.pincode}
                        value={draft?.pincode}
                        onChange={(event) =>
                          updateDraft("pincode", event.target.value)
                        }
                      />
                      <Field
                        label={copy.radius}
                        type="number"
                        value={
                          draft?.service_radius_km ??
                          draft?.serviceRadiusKm ??
                          ""
                        }
                        onChange={(event) =>
                          updateDraft(
                            "service_radius_km",
                            event.target.value
                          )
                        }
                        hint={copy.radiusHint}
                      />
                    </div>
                  </SectionCard>
                </div>
              ) : null}

              {activeTab === "location" ? (
                <div style={styles.singleGrid}>
                  <SectionCard
                    icon={LocateFixed}
                    title={copy.locationTitle}
                    subtitle={copy.locationText}
                  >
                    <LocationPanel
                      current={current}
                      copy={copy}
                      currentLat={currentLat}
                      currentLng={currentLng}
                      locationBusy={locationBusy}
                      locationNotice={locationNotice}
                      onUpdate={captureLocation}
                      mapsHref={currentGpsUrl}
                      onCopy={copyCoordinates}
                      copied={copied}
                      large
                    />
                  </SectionCard>
                </div>
              ) : null}

              {editing ? (
                <div style={styles.bottomSaveBar}>
                  <span style={styles.bottomNote}>{copy.note}</span>
                  <div style={styles.editActions}>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      disabled={saving}
                      style={styles.secondaryButton}
                    >
                      <X size={15} />
                      {copy.cancel}
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      style={styles.primaryButton}
                    >
                      {saving ? (
                        <span style={styles.spinner} />
                      ) : (
                        <Save size={15} />
                      )}
                      {saving ? copy.saving : copy.save}
                    </button>
                  </div>
                </div>
              ) : null}
            </form>



            {passwordOpen ? (
              <div style={styles.modalBackdrop} role="presentation">
                <div style={styles.passwordModal} role="dialog" aria-modal="true" aria-label={copy.passwordChangeTitle}>
                  <div style={styles.passwordModalHeader}>
                    <div>
                      <span style={styles.modalEyebrow}>{copy.security}</span>
                      <h2 style={styles.modalTitle}>{copy.passwordChangeTitle}</h2>
                      <p style={styles.modalText}>{copy.passwordChangeText}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => !passwordBusy && setPasswordOpen(false)}
                      style={styles.iconButton}
                      aria-label={copy.close}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <form onSubmit={changePassword} style={styles.passwordForm}>
                    <PasswordField
                      label={copy.currentPassword}
                      value={passwordForm.current}
                      visible={passwordVisible.current}
                      onToggle={() => setPasswordVisible((v) => ({ ...v, current: !v.current }))}
                      onChange={(value) => setPasswordForm((f) => ({ ...f, current: value }))}
                      copy={copy}
                    />
                    <PasswordField
                      label={copy.newPassword}
                      value={passwordForm.next}
                      visible={passwordVisible.next}
                      onToggle={() => setPasswordVisible((v) => ({ ...v, next: !v.next }))}
                      onChange={(value) => setPasswordForm((f) => ({ ...f, next: value }))}
                      copy={copy}
                    />
                    <PasswordField
                      label={copy.confirmPassword}
                      value={passwordForm.confirm}
                      visible={passwordVisible.confirm}
                      onToggle={() => setPasswordVisible((v) => ({ ...v, confirm: !v.confirm }))}
                      onChange={(value) => setPasswordForm((f) => ({ ...f, confirm: value }))}
                      copy={copy}
                    />

                    <div style={styles.modalActions}>
                      <button
                        type="button"
                        onClick={() => !passwordBusy && setPasswordOpen(false)}
                        disabled={passwordBusy}
                        style={styles.secondaryButton}
                      >
                        <X size={15} />
                        {copy.cancel}
                      </button>
                      <button
                        type="submit"
                        disabled={passwordBusy}
                        style={styles.primaryButton}
                      >
                        {passwordBusy ? <span style={styles.spinner} /> : <KeyRound size={15} />}
                        {passwordBusy ? copy.changingPassword : copy.changePassword}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : null}

            <footer style={styles.footer}>
              <div style={styles.footerLeft}>
                <ShieldCheck size={15} />
                <span>{copy.matchingText}</span>
              </div>
              <button
                type="button"
                onClick={() => navigate("/transporter/dashboard")}
                style={styles.footerLink}
              >
                {copy.back}
              </button>
            </footer>
          </>
        )}
      </main>

      <style>{`
        @keyframes ks-profile-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        * { box-sizing: border-box; }
        @media (max-width: 980px) {
          .ks-profile-mobile-hide { display: none !important; }
        }
      `}</style>
    </div>
  );
}

function PasswordField({ label, value, visible, onToggle, onChange, copy }) {
  return (
    <label style={styles.passwordField}>
      <span style={styles.fieldLabel}>{label}</span>
      <div style={styles.passwordInputWrap}>
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete="current-password"
          style={styles.passwordInput}
        />
        <button
          type="button"
          onClick={onToggle}
          style={styles.passwordVisibility}
          aria-label={visible ? copy.hidePassword : copy.showPassword}
          title={visible ? copy.hidePassword : copy.showPassword}
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </label>
  );
}

function PreferenceChip({ label, value, copy }) {
  const enabled = Boolean(value);

  return (
    <div
      style={{
        ...styles.preferenceChip,
        ...(enabled ? styles.preferenceEnabled : {}),
      }}
    >
      <span>{label}</span>
      <strong>{enabled ? copy.enabled : copy.disabled}</strong>
    </div>
  );
}

function LocationPanel({
  copy,
  currentLat,
  currentLng,
  current,
  locationBusy,
  locationNotice,
  onUpdate,
  mapsHref,
  onCopy,
  copied,
  large = false,
}) {
  const hasGps =
    currentLat != null &&
    currentLng != null &&
    Number.isFinite(Number(currentLat)) &&
    Number.isFinite(Number(currentLng));

  return (
    <div style={styles.locationPanel}>
      <div
        style={{
          ...styles.gpsHero,
          ...(large ? styles.gpsHeroLarge : {}),
        }}
      >
        <div style={styles.gpsPulse}>
          <LocateFixed size={24} />
        </div>

        <div style={styles.gpsIdentity}>
          <div style={styles.gpsStatusLine}>
            <span
              style={{
                ...styles.statusBadge,
                background: hasGps ? "#eaf7ee" : "#f1f4f2",
                color: hasGps ? "#287347" : "#727f77",
              }}
            >
              <span
                style={{
                  ...styles.statusBadgeDot,
                  background: hasGps ? "#33a460" : "#909b95",
                }}
              />
              {hasGps ? copy.live : copy.noGps}
            </span>
          </div>

          {hasGps ? (
            <>
              <strong style={styles.coordinates}>
                {Number(currentLat).toFixed(6)},{" "}
                {Number(currentLng).toFixed(6)}
              </strong>
              <span style={styles.locationTimestamp}>
                {copy.lastSeen}:{" "}
                {formatDateTime(
                  current.location_updated_at ??
                    current.locationUpdatedAt
                )}
              </span>
            </>
          ) : (
            <strong style={styles.noGpsTitle}>{copy.noGps}</strong>
          )}
        </div>
      </div>

      <div style={styles.locationActions}>
        <button
          type="button"
          onClick={onUpdate}
          disabled={locationBusy}
          style={styles.primaryWideButton}
        >
          {locationBusy ? (
            <span style={styles.spinner} />
          ) : (
            <LocateFixed size={16} />
          )}
          {locationBusy ? copy.updatingLocation : copy.updateLocation}
        </button>

        {hasGps && mapsHref ? (
          <a
            href={mapsHref}
            target="_blank"
            rel="noreferrer"
            style={styles.mapsButton}
          >
            <MapPin size={16} />
            {copy.maps}
          </a>
        ) : null}

        {hasGps ? (
          <button
            type="button"
            onClick={onCopy}
            style={styles.secondaryWideButton}
          >
            {copied ? <Check size={16} /> : <MapPin size={16} />}
            {copied ? copy.copied : copy.copyCoords}
          </button>
        ) : null}
      </div>

      {locationNotice ? (
        <div style={styles.locationNotice}>
          <CheckCircle2 size={15} />
          <span>{locationNotice}</span>
        </div>
      ) : null}

      <div style={styles.registeredAreaBox}>
        <div style={styles.registeredAreaHeader}>
          <MapPin size={15} />
          <strong>{copy.currentServiceArea}</strong>
        </div>
        <div style={styles.registeredAreaValue}>
          {[
            current?.village,
            current?.mandal,
            current?.district,
            current?.state,
            current?.pincode,
          ]
            .filter(Boolean)
            .join(" · ") || copy.notAvailable}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #f5f8f6 0%, #ffffff 25%, #f7faf8 100%)",
    color: "#20382b",
  },

  shell: {
    width: "min(1240px, calc(100% - 34px))",
    margin: "0 auto",
    padding: "24px 0 46px",
  },

  topbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 18,
    minHeight: 54,
  },

  topbarLeft: {
    display: "flex",
    flexDirection: "column",
    gap: 7,
  },

  backButton: {
    border: 0,
    background: "transparent",
    padding: 0,
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    color: "#567064",
    fontSize: 11,
    fontWeight: 800,
    cursor: "pointer",
    width: "fit-content",
  },

  breadcrumb: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    color: "#89958e",
    fontSize: 9,
    fontWeight: 700,
  },

  topbarActions: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },

  languagePill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 2,
    padding: 4,
    border: "1px solid #dce6df",
    borderRadius: 11,
    background: "#fff",
    color: "#6c7b73",
  },

  languageButton: {
    border: 0,
    borderRadius: 7,
    padding: "6px 8px",
    background: "transparent",
    color: "#6b7a72",
    fontSize: 9,
    fontWeight: 800,
    cursor: "pointer",
  },

  languageActive: {
    background: "#236c3f",
    color: "#fff",
  },

  secondaryButton: {
    minHeight: 35,
    padding: "0 11px",
    border: "1px solid #d7e1db",
    borderRadius: 9,
    background: "#fff",
    color: "#315b43",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    fontSize: 9,
    fontWeight: 800,
    cursor: "pointer",
  },

  primaryButton: {
    minHeight: 35,
    padding: "0 13px",
    border: "1px solid #21683c",
    borderRadius: 9,
    background: "#246f40",
    color: "#fff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    fontSize: 9,
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 6px 15px rgba(36, 111, 64, 0.12)",
  },

  errorBanner: {
    marginTop: 16,
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "11px 12px",
    border: "1px solid #edd6d1",
    borderRadius: 10,
    background: "#fff6f3",
    color: "#925047",
    fontSize: 9,
  },

  successBanner: {
    marginTop: 16,
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "11px 12px",
    border: "1px solid #cfe7d5",
    borderRadius: 10,
    background: "#eff9f2",
    color: "#2d6e43",
    fontSize: 9,
  },

  flexOne: {
    flex: 1,
  },

  inlineAction: {
    border: 0,
    background: "transparent",
    color: "inherit",
    fontSize: 9,
    fontWeight: 800,
    textDecoration: "underline",
    cursor: "pointer",
  },

  iconButton: {
    width: 26,
    height: 26,
    border: 0,
    borderRadius: 7,
    background: "transparent",
    color: "inherit",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },

  loadingCard: {
    minHeight: 340,
    marginTop: 18,
    border: "1px solid #e1e8e3",
    borderRadius: 20,
    background: "#fff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    color: "#7b8981",
    boxShadow: "0 10px 28px rgba(26, 72, 44, 0.04)",
  },

  loadingOrb: {
    width: 50,
    height: 50,
    borderRadius: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#eaf5ed",
    color: "#2c7447",
    marginBottom: 3,
  },

  hero: {
    marginTop: 18,
    padding: "22px 22px 20px",
    borderRadius: 22,
    border: "1px solid #dbe7df",
    background:
      "radial-gradient(circle at 85% 20%, rgba(224,241,230,.95) 0, rgba(224,241,230,0) 38%), linear-gradient(135deg, #ffffff 0%, #f1f8f3 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 18,
    boxShadow: "0 13px 32px rgba(22, 74, 43, 0.045)",
  },

  heroMain: {
    minWidth: 0,
    display: "flex",
    alignItems: "center",
    gap: 14,
  },

  avatar: {
    width: 64,
    height: 64,
    borderRadius: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    background: "#246f40",
    color: "#fff",
    fontSize: 19,
    fontWeight: 900,
    boxShadow: "0 10px 20px rgba(36, 111, 64, 0.18)",
  },

  heroIdentity: {
    minWidth: 0,
  },

  heroEyebrow: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 7px",
    borderRadius: 999,
    background: "#e7f4eb",
    color: "#2b7145",
    fontSize: 8,
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: ".08em",
  },

  heroTitle: {
    margin: "7px 0 5px",
    color: "#1d3828",
    fontSize: 27,
    lineHeight: 1.1,
    letterSpacing: "-.02em",
  },

  heroMeta: {
    display: "flex",
    alignItems: "center",
    gap: 11,
    flexWrap: "wrap",
  },

  metaItem: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    color: "#697970",
    fontSize: 9,
    fontWeight: 700,
  },

  heroStats: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(100px, 1fr))",
    gap: 9,
  },

  heroStat: {
    minWidth: 104,
    padding: "11px 12px",
    border: "1px solid #dbe6df",
    borderRadius: 12,
    background: "rgba(255,255,255,.78)",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },

  heroStatSpan: {},

  heroStatLabel: {},

  onlineDot: {
    display: "inline-block",
    width: 7,
    height: 7,
    borderRadius: "50%",
    marginRight: 5,
  },

  contextRow: {
    marginTop: 10,
    display: "flex",
    alignItems: "center",
    gap: 7,
    flexWrap: "wrap",
  },

  contextPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    minHeight: 27,
    padding: "0 8px",
    border: "1px solid #e0e8e3",
    borderRadius: 999,
    background: "#fff",
    color: "#66756d",
    fontSize: 8,
    fontWeight: 800,
  },

  backendStatus: {
    marginLeft: "auto",
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    color: "#87928d",
    fontSize: 8,
    fontWeight: 700,
  },

  backendDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
  },

  tabs: {
    marginTop: 17,
    padding: 5,
    display: "flex",
    alignItems: "center",
    gap: 3,
    flexWrap: "wrap",
    border: "1px solid #e0e7e3",
    borderRadius: 12,
    background: "#f3f6f4",
  },

  tabButton: {
    minHeight: 32,
    padding: "0 11px",
    border: 0,
    borderRadius: 8,
    background: "transparent",
    color: "#718077",
    fontSize: 9,
    fontWeight: 800,
    cursor: "pointer",
  },

  tabActive: {
    background: "#fff",
    color: "#245f3a",
    boxShadow: "0 3px 12px rgba(28, 75, 46, 0.08)",
  },

  editActions: {
    marginLeft: "auto",
    display: "flex",
    gap: 7,
  },

  contentGrid: {
    marginTop: 13,
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.52fr) minmax(310px, .98fr)",
    gap: 13,
    alignItems: "start",
  },

  mainColumn: {
    minWidth: 0,
  },

  sideColumn: {
    minWidth: 0,
  },

  singleGrid: {
    marginTop: 13,
  },

  sectionCard: {
    marginBottom: 13,
    border: "1px solid #dfe8e3",
    borderRadius: 18,
    background: "#fff",
    boxShadow: "0 10px 26px rgba(25, 72, 44, 0.04)",
    overflow: "hidden",
  },

  sectionHeader: {
    minHeight: 65,
    padding: "13px 15px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderBottom: "1px solid #edf1ee",
  },

  sectionTitleWrap: {
    minWidth: 0,
    display: "flex",
    alignItems: "center",
    gap: 9,
  },

  sectionIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    background: "#edf7f0",
    color: "#2b7546",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  sectionTitle: {
    margin: 0,
    color: "#2d4437",
    fontSize: 13,
    fontWeight: 900,
  },

  sectionSubtitle: {
    margin: "3px 0 0",
    color: "#87938c",
    fontSize: 8,
    lineHeight: 1.45,
  },

  sectionBadge: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 25,
    padding: "0 8px",
    borderRadius: 999,
    background: "#f4f7f5",
    color: "#6f7c74",
    fontSize: 8,
    fontWeight: 800,
  },

  sectionBody: {
    padding: 14,
  },

  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 8,
  },

  detailTile: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
    padding: 10,
    border: "1px solid #ebf0ed",
    borderRadius: 12,
    background: "#fafcfb",
  },

  detailIcon: {
    width: 31,
    height: 31,
    borderRadius: 9,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  detailTextWrap: {
    minWidth: 0,
  },

  detailLabel: {
    display: "block",
    color: "#89958e",
    fontSize: 7,
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: ".07em",
  },

  detailValue: {
    display: "block",
    marginTop: 3,
    color: "#334b3d",
    fontSize: 10,
    lineHeight: 1.35,
  },

  editGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10,
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
    minWidth: 0,
  },

  fieldLabel: {
    color: "#7d8b83",
    fontSize: 8,
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: ".07em",
  },

  fieldHint: {
    color: "#95a099",
    fontSize: 7,
    lineHeight: 1.4,
  },

  input: {
    width: "100%",
    minHeight: 39,
    padding: "0 10px",
    border: "1px solid #dce6df",
    borderRadius: 10,
    outline: "none",
    background: "#fff",
    color: "#334a3c",
    fontFamily: "inherit",
    fontSize: 10,
  },

  vehicleSummary: {
    display: "grid",
    gridTemplateColumns: "auto minmax(0, 1fr) auto",
    gap: 11,
    alignItems: "center",
    padding: 12,
    border: "1px solid #e6ece8",
    borderRadius: 13,
    background: "#fbfcfb",
  },

  vehicleVisual: {
    width: 51,
    height: 51,
    borderRadius: 15,
    background: "#eaf5ed",
    color: "#2b7345",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  vehicleIdentity: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 3,
  },

  vehicleCapacity: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 3,
  },

  smallActionButton: {
    minHeight: "34px",
    padding: "0 11px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    border: "1px solid #bddcc7",
    borderRadius: "9px",
    background: "#ffffff",
    color: "#256b40",
    fontSize: "10px",
    fontWeight: 800,
    cursor: "pointer",
  },

  preferenceInfo: {
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    padding: "12px 13px",
    border: "1px dashed #cbdcd2",
    borderRadius: "11px",
    background: "#f7faf8",
    color: "#66766d",
    fontSize: "10px",
    lineHeight: 1.5,
  },

  areaAssistPanel: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
    padding: "12px",
    marginBottom: "16px",
    border: "1px solid #d5e8da",
    borderRadius: "12px",
    background: "linear-gradient(90deg, #f2faf4 0%, #ffffff 100%)",
  },

  areaAssistIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    display: "grid",
    placeItems: "center",
    background: "#e8f6ed",
    color: "#2d8050",
    flexShrink: 0,
  },

  areaAssistBody: {
    minWidth: 0,
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },

  modalBackdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    display: "grid",
    placeItems: "center",
    padding: "20px",
    background: "rgba(25, 41, 32, .34)",
    backdropFilter: "blur(5px)",
  },

  passwordModal: {
    width: "min(520px, 100%)",
    borderRadius: "18px",
    border: "1px solid #d7e5dc",
    background: "#ffffff",
    boxShadow: "0 24px 70px rgba(32, 55, 42, .22)",
    overflow: "hidden",
  },

  passwordModalHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "18px",
    padding: "22px 22px 17px",
    borderBottom: "1px solid #e8eee9",
  },

  modalEyebrow: {
    display: "block",
    marginBottom: "5px",
    color: "#6a7b71",
    fontSize: "9px",
    fontWeight: 800,
    letterSpacing: ".12em",
    textTransform: "uppercase",
  },

  modalTitle: {
    margin: 0,
    color: "#20382a",
    fontSize: "20px",
    lineHeight: 1.25,
  },

  modalText: {
    margin: "7px 0 0",
    color: "#77847d",
    fontSize: "11px",
    lineHeight: 1.55,
  },

  passwordForm: {
    padding: "20px 22px 22px",
  },

  passwordField: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    marginBottom: "14px",
  },

  passwordInputWrap: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },

  passwordInput: {
    width: "100%",
    height: "44px",
    padding: "0 45px 0 13px",
    border: "1px solid #d5e2da",
    borderRadius: "11px",
    outline: 0,
    background: "#fbfdfc",
    color: "#21382a",
    fontSize: "12px",
  },

  passwordVisibility: {
    position: "absolute",
    right: "8px",
    width: "34px",
    height: "34px",
    border: 0,
    borderRadius: "8px",
    display: "grid",
    placeItems: "center",
    background: "transparent",
    color: "#688075",
    cursor: "pointer",
  },

  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "9px",
    marginTop: "20px",
  },

  securityPanel: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: 12,
    border: "1px solid #e0e9e4",
    borderRadius: 12,
    background: "#f8fbf9",
  },

  securityIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    background: "#e7f2eb",
    color: "#2b7245",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  securityBody: {
    flex: 1,
    minWidth: 0,
  },

  daysPanel: {
    padding: 10,
    border: "1px solid #e7ece9",
    borderRadius: 12,
    background: "#fafcfb",
  },

  daysText: {
    display: "block",
    marginTop: 4,
    color: "#41584a",
    fontSize: 10,
  },

  availabilityStack: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  preferenceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 7,
  },

  preferenceChip: {
    minWidth: 0,
    padding: 9,
    borderRadius: 11,
    border: "1px solid #e4eae6",
    background: "#fafcfb",
  },

  preferenceEnabled: {
    border: "1px solid #d4e8da",
    background: "#f3faf5",
  },

  locationPanel: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  gpsHero: {
    display: "flex",
    alignItems: "center",
    gap: 11,
    padding: 12,
    border: "1px solid #dae8df",
    borderRadius: 13,
    background:
      "linear-gradient(135deg, #f8fcf9 0%, #eef8f1 100%)",
  },

  gpsHeroLarge: {
    padding: 17,
  },

  gpsPulse: {
    width: 48,
    height: 48,
    borderRadius: 15,
    background: "#e0f0e5",
    color: "#2e7749",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  gpsIdentity: {
    minWidth: 0,
  },

  gpsStatusLine: {
    marginBottom: 4,
  },

  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    minHeight: 23,
    padding: "0 7px",
    borderRadius: 999,
    fontSize: 7,
    fontWeight: 900,
  },

  statusBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
  },

  coordinates: {
    display: "block",
    color: "#294639",
    fontSize: 13,
  },

  locationTimestamp: {
    display: "block",
    marginTop: 3,
    color: "#829089",
    fontSize: 8,
  },

  noGpsTitle: {
    display: "block",
    color: "#65746c",
    fontSize: 10,
  },

  locationActions: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 7,
  },

  primaryWideButton: {
    gridColumn: "1 / -1",
    minHeight: 39,
    border: "1px solid #226b3f",
    borderRadius: 10,
    background: "#246f40",
    color: "#fff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    fontSize: 9,
    fontWeight: 800,
    cursor: "pointer",
  },

  mapsButton: {
    minHeight: 37,
    border: "1px solid #d3e2d8",
    borderRadius: 10,
    background: "#f7faf8",
    color: "#2f6e46",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    fontSize: 8,
    fontWeight: 800,
    textDecoration: "none",
  },

  secondaryWideButton: {
    minHeight: 37,
    border: "1px solid #d9e3dd",
    borderRadius: 10,
    background: "#fff",
    color: "#617269",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    fontSize: 8,
    fontWeight: 800,
    cursor: "pointer",
  },

  locationNotice: {
    display: "flex",
    alignItems: "flex-start",
    gap: 6,
    padding: 9,
    borderRadius: 10,
    background: "#eef9f1",
    color: "#2c7145",
    fontSize: 8,
    lineHeight: 1.45,
  },

  registeredAreaBox: {
    padding: 11,
    border: "1px solid #e2e9e5",
    borderRadius: 11,
    background: "#fbfcfb",
  },

  registeredAreaHeader: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    color: "#586b60",
    fontSize: 8,
  },

  registeredAreaValue: {
    marginTop: 6,
    color: "#364d3f",
    fontSize: 9,
    lineHeight: 1.5,
  },

  serviceHighlight: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    padding: 12,
    marginBottom: 12,
    borderRadius: 12,
    border: "1px solid #dbe8df",
    background: "#f4faf6",
  },

  serviceHighlightIcon: {
    width: 37,
    height: 37,
    borderRadius: 11,
    background: "#e2f1e7",
    color: "#2b7546",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  bottomSaveBar: {
    marginTop: 4,
    padding: 12,
    border: "1px solid #dce7e0",
    borderRadius: 14,
    background: "#fbfdfb",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  bottomNote: {
    color: "#7c8981",
    fontSize: 8,
  },

  spinner: {
    width: 11,
    height: 11,
    borderRadius: "50%",
    border: "2px solid rgba(255,255,255,.45)",
    borderTopColor: "#fff",
    animation: "ks-profile-spin .7s linear infinite",
  },

  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingTop: 16,
    color: "#7d8a82",
    fontSize: 8,
  },

  footerLeft: {
    display: "flex",
    alignItems: "flex-start",
    gap: 7,
    maxWidth: 780,
    lineHeight: 1.5,
  },

  footerLink: {
    border: 0,
    background: "transparent",
    color: "#2b7045",
    fontSize: 8,
    fontWeight: 900,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
};
