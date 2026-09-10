import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";



import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Clock3,
  Eye,
  EyeOff,
  Languages,
  LocateFixed,
  MapPin,
  MapPinned,
  Navigation,
  Phone,
  RefreshCw,
  Save,
  ShieldCheck,
  Truck,
  UserRound,
  X,
} from "lucide-react";

import Header from "../../components/Header";
import { useLanguage } from "../../translations/LanguageContext";
import { locationData } from "../../data/locationData";

const API_URL = import.meta.env.VITE_API_URL || "";


const API_BASE = API_URL || "http://localhost:5000/api";
const TRANSPORTER_SESSION_KEY = "krishisetu_transporter_session";
const LANGUAGE_OPTIONS = [
  { id: "en", label: "English", native: "English" },
  { id: "hi", label: "Hindi", native: "हिन्दी" },
  { id: "te", label: "Telugu", native: "తెలుగు" },
];

// Complete state / UT selector. Districts, mandals and villages come from the
// application's verified location master when available; otherwise the user
// can use GPS or enter the locality manually. This prevents fabricated IDs.
const INDIA_STATES = [
  ["ap", "Andhra Pradesh"], ["ar", "Arunachal Pradesh"], ["as", "Assam"],
  ["br", "Bihar"], ["cg", "Chhattisgarh"], ["ga", "Goa"], ["gj", "Gujarat"],
  ["hr", "Haryana"], ["hp", "Himachal Pradesh"], ["jh", "Jharkhand"],
  ["ka", "Karnataka"], ["kl", "Kerala"], ["mp", "Madhya Pradesh"],
  ["mh", "Maharashtra"], ["mn", "Manipur"], ["me", "Meghalaya"],
  ["miz", "Mizoram"], ["nl", "Nagaland"], ["od", "Odisha"],
  ["pb", "Punjab"], ["rj", "Rajasthan"], ["sk", "Sikkim"],
  ["tn", "Tamil Nadu"], ["ts", "Telangana"], ["tr", "Tripura"],
  ["up", "Uttar Pradesh"], ["uk", "Uttarakhand"], ["wb", "West Bengal"],
  ["an", "Andaman and Nicobar Islands"], ["ch", "Chandigarh"],
  ["dn", "Dadra and Nagar Haveli and Daman and Diu"], ["dl", "Delhi"],
  ["jk", "Jammu and Kashmir"], ["la", "Ladakh"], ["ld", "Lakshadweep"],
  ["py", "Puducherry"],
].map(([id, name]) => ({ id, name }));

const STATE_NAME_ALIASES = {
  "orissa": "Odisha",
  "pondicherry": "Puducherry",
  "uttaranchal": "Uttarakhand",
  "nct of delhi": "Delhi",
  "telangana state": "Telangana",
};

const DAY_OPTIONS = [
  ["MON", "Mon"], ["TUE", "Tue"], ["WED", "Wed"], ["THU", "Thu"],
  ["FRI", "Fri"], ["SAT", "Sat"], ["SUN", "Sun"],
];

const COPY = {
  en: {
    title: "Register as a local transport partner",
    subtitle: "Connect with farmers in your village, mandal, district and nearby service area.",
    personal: "Personal & account",
    vehicle: "Vehicle details",
    area: "Service area",
    availability: "Availability",
    review: "Review & finish",
    name: "Full name", phone: "Mobile number", password: "Password", confirmPassword: "Confirm password",
    useLocation: "Use my current location", locating: "Getting current location…", locationFound: "Current location detected",
    language: "Preferred language", state: "State / UT", district: "District", mandal: "Mandal / Block", village: "Village",
    pincode: "PIN code", address: "Starting address / landmark", radius: "Service radius",
    next: "Continue", back: "Back", create: "Create transporter account", creating: "Creating account…",
    saved: "Progress saved locally", gpsHint: "GPS is used to reduce locality-entry mistakes. You can review the detected area before continuing.",
    matching: "Farmer requests are filtered by registered village/region, vehicle capacity and availability.",
    already: "Already registered? Sign in",
  },
  hi: {
    title: "स्थानीय परिवहन साझेदार के रूप में पंजीकरण करें",
    subtitle: "अपने गांव, मंडल, जिले और आसपास के सेवा क्षेत्र के किसानों से जुड़ें।",
    personal: "व्यक्तिगत और खाता विवरण", vehicle: "वाहन विवरण", area: "सेवा क्षेत्र", availability: "उपलब्धता", review: "जांच और पूरा करें",
    name: "पूरा नाम", phone: "मोबाइल नंबर", password: "पासवर्ड", confirmPassword: "पासवर्ड की पुष्टि",
    useLocation: "मेरी वर्तमान लोकेशन का उपयोग करें", locating: "वर्तमान लोकेशन प्राप्त की जा रही है…", locationFound: "वर्तमान लोकेशन मिल गई",
    language: "पसंदीदा भाषा", state: "राज्य / केंद्रशासित प्रदेश", district: "जिला", mandal: "मंडल / ब्लॉक", village: "गांव",
    pincode: "पिन कोड", address: "शुरुआती पता / लैंडमार्क", radius: "सेवा क्षेत्र की दूरी",
    next: "आगे बढ़ें", back: "वापस", create: "ट्रांसपोर्टर खाता बनाएं", creating: "खाता बनाया जा रहा है…",
    saved: "प्रगति स्थानीय रूप से सहेजी गई", gpsHint: "GPS का उपयोग गांव/क्षेत्र की गलती कम करने के लिए किया जाता है। आगे बढ़ने से पहले पता जांचें।",
    matching: "किसान अनुरोध पंजीकृत गांव/क्षेत्र, वाहन क्षमता और उपलब्धता के आधार पर फ़िल्टर होंगे।",
    already: "पहले से पंजीकृत हैं? लॉगिन करें",
  },
  te: {
    title: "స్థానిక రవాణా భాగస్వామిగా నమోదు చేసుకోండి",
    subtitle: "మీ గ్రామం, మండలం, జిల్లా మరియు సమీప సేవా ప్రాంతంలోని రైతులతో కనెక్ట్ అవ్వండి.",
    personal: "వ్యక్తిగత & ఖాతా వివరాలు", vehicle: "వాహనం వివరాలు", area: "సేవా ప్రాంతం", availability: "అందుబాటు", review: "పరిశీలించి పూర్తి చేయండి",
    name: "పూర్తి పేరు", phone: "మొబైల్ నంబర్", password: "పాస్‌వర్డ్", confirmPassword: "పాస్‌వర్డ్ నిర్ధారించండి",
    useLocation: "నా ప్రస్తుత లొకేషన్ ఉపయోగించండి", locating: "ప్రస్తుత లొకేషన్ తీసుకుంటోంది…", locationFound: "ప్రస్తుత లొకేషన్ గుర్తించబడింది",
    language: "ఇష్టమైన భాష", state: "రాష్ట్రం / కేంద్ర పాలిత ప్రాంతం", district: "జిల్లా", mandal: "మండలం / బ్లాక్", village: "గ్రామం",
    pincode: "పిన్ కోడ్", address: "ప్రారంభ చిరునామా / గుర్తింపు స్థలం", radius: "సేవా పరిధి",
    next: "కొనసాగించండి", back: "వెనుకకు", create: "రవాణాదారు ఖాతా సృష్టించండి", creating: "ఖాతా సృష్టిస్తోంది…",
    saved: "ప్రగతి స్థానికంగా భద్రపరచబడింది", gpsHint: "గ్రామం/ప్రాంతం ఎంట్రీ పొరపాట్లు తగ్గించడానికి GPS ఉపయోగిస్తాము. కొనసాగించే ముందు గుర్తించిన ప్రాంతాన్ని తనిఖీ చేయండి.",
    matching: "రైతుల అభ్యర్థనలు నమోదు చేసిన గ్రామం/ప్రాంతం, వాహన సామర్థ్యం మరియు అందుబాటును బట్టి ఫిల్టర్ అవుతాయి.",
    already: "ఇప్పటికే నమోదు అయ్యారా? లాగిన్ చేయండి",
  },
};

function text(language, key, fallback = "") {
  return COPY[language]?.[key] || COPY.en[key] || fallback || key;
}

function normalizeStateName(value) {
  const raw = String(value || "").trim();
  const key = raw.toLowerCase();
  return STATE_NAME_ALIASES[key] || raw;
}

function findStateByName(value) {
  const normalized = normalizeStateName(value).toLowerCase();
  return INDIA_STATES.find(item => item.name.toLowerCase() === normalized) || null;
}

function getMasterState(nameOrId) {
  const value = String(nameOrId || "").toLowerCase();
  return locationData.find(item =>
    String(item.stateId || "").toLowerCase() === value ||
    String(item.stateName || "").toLowerCase() === value
  ) || null;
}

function getMasterDistricts(stateId, stateName) {
  const state = getMasterState(stateId) || getMasterState(stateName);
  return state?.districts || [];
}

function getMasterDistrict(stateId, stateName, districtId, districtName) {
  const districts = getMasterDistricts(stateId, stateName);
  return districts.find(item =>
    String(item.districtId || "").toLowerCase() === String(districtId || "").toLowerCase() ||
    String(item.districtName || "").toLowerCase() === String(districtName || "").toLowerCase()
  ) || null;
}

function getMasterMandals(stateId, stateName, districtId, districtName) {
  return getMasterDistrict(stateId, stateName, districtId, districtName)?.mandals || [];
}

function getMasterMandal(stateId, stateName, districtId, districtName, mandalId, mandalName) {
  const mandals = getMasterMandals(stateId, stateName, districtId, districtName);
  return mandals.find(item =>
    String(item.mandalId || "").toLowerCase() === String(mandalId || "").toLowerCase() ||
    String(item.mandalName || "").toLowerCase() === String(mandalName || "").toLowerCase()
  ) || null;
}

function getMasterVillages(stateId, stateName, districtId, districtName, mandalId, mandalName) {
  return getMasterMandal(stateId, stateName, districtId, districtName, mandalId, mandalName)?.villages || [];
}

function deriveLocationFromMaster(form) {
  const state = getMasterState(form.stateId) || getMasterState(form.stateName);
  const district = getMasterDistrict(form.stateId, form.stateName, form.districtId, form.districtName);
  const mandal = getMasterMandal(form.stateId, form.stateName, form.districtId, form.districtName, form.mandalId, form.mandalName);
  return {
    stateId: state?.stateId || form.stateId || "",
    stateName: state?.stateName || form.stateName || "",
    districtId: district?.districtId || form.districtId || "",
    districtName: district?.districtName || form.districtName || "",
    mandalId: mandal?.mandalId || form.mandalId || "",
    mandalName: mandal?.mandalName || form.mandalName || "",
  };
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const a = [lat1, lon1, lat2, lon2].map(Number);
  if (a.some(v => !Number.isFinite(v))) return null;
  const [p1, l1, p2, l2] = a.map(v => (v * Math.PI) / 180);
  const dp = p2 - p1;
  const dl = l2 - l1;
  const h = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

async function reverseGeocode(lat, lon) {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", lat);
  url.searchParams.set("lon", lon);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("zoom", "18");
  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("Reverse geocoding is temporarily unavailable.");
  return response.json();
}

const TRANSPORTER_DRAFT_KEY = "krishisetu_transporter_registration_draft";
const TRANSPORTER_ID_KEY = "krishisetu_transporter_id";

const VEHICLE_OPTIONS = [
  {
    value: "TRACTOR",
    label: "Tractor",
    description: "Best for village and farm pickup",
    defaultCapacity: 1500,
  },
  {
    value: "MINI_TRUCK",
    label: "Mini truck",
    description: "Small commercial cargo vehicle",
    defaultCapacity: 1500,
  },
  {
    value: "PICKUP",
    label: "Pickup",
    description: "Flexible farm-to-center transport",
    defaultCapacity: 1000,
  },
  {
    value: "TRUCK",
    label: "Truck",
    description: "Large agricultural loads",
    defaultCapacity: 5000,
  },
  {
    value: "TEMPO",
    label: "Tempo",
    description: "Compact local transport",
    defaultCapacity: 1000,
  },
  {
    value: "OTHER",
    label: "Other",
    description: "Another suitable transport vehicle",
    defaultCapacity: 1000,
  },
];

const SERVICE_RADIUS_OPTIONS = [
  { value: "5", label: "Up to 5 km", description: "Very local village service" },
  { value: "10", label: "Up to 10 km", description: "Nearby villages" },
  { value: "20", label: "Up to 20 km", description: "Wider local area" },
  { value: "30", label: "Up to 30 km", description: "Several surrounding villages" },
  { value: "50", label: "Up to 50 km", description: "Large service area" },
];

const INITIAL_FORM = {
  name: "",
  phone: "",
  password: "",
  confirmPassword: "",
  language: "en",
  vehicleType: "TRACTOR",
  vehicleNumber: "",
  capacityKg: "1500",

  stateId: "",
  stateName: "",
  districtId: "",
  districtName: "",
  mandalId: "",
  mandalName: "",
  village: "",

  serviceRadiusKm: "10",
  additionalVillages: [],

  pickupLat: "",
  pickupLng: "",
  pickupAddress: "",
  pincode: "",
  locationAccuracyM: null,
  locationSource: "manual",

  preferredCenters: [],
  availableDays: [
    "MON",
    "TUE",
    "WED",
    "THU",
    "FRI",
    "SAT",
    "SUN",
  ],
  startTime: "06:00",
  endTime: "20:00",

  acceptsEmergency: true,
  acceptsScheduled: true,
  acceptsSmallLoads: true,

  termsAccepted: false,
};

function readDraft() {
  try {
    const raw = window.localStorage.getItem(TRANSPORTER_DRAFT_KEY);
    if (!raw) return INITIAL_FORM;

    const parsed = JSON.parse(raw);

    return {
      ...INITIAL_FORM,
      ...parsed,
      additionalVillages: Array.isArray(parsed.additionalVillages)
        ? parsed.additionalVillages
        : [],
      preferredCenters: Array.isArray(parsed.preferredCenters)
        ? parsed.preferredCenters
        : [],
      availableDays: Array.isArray(parsed.availableDays)
        ? parsed.availableDays
        : INITIAL_FORM.availableDays,
    };
  } catch {
    return INITIAL_FORM;
  }
}

function writeDraft(form) {
  try {
    window.localStorage.setItem(
      TRANSPORTER_DRAFT_KEY,
      JSON.stringify(form)
    );
  } catch {
    return false;
  }

  return true;
}

function normalisePhone(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 10);
}

function normaliseVehicleNumber(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9 -]/g, "")
    .slice(0, 20);
}

function cleanText(value) {
  return String(value || "").trim();
}

function createTransporterId() {
  return `T${Date.now()}${Math.floor(Math.random() * 10000)}`;
}

async function requestJson(path, options = {}) {
  const root = API_URL ? API_URL.replace(/\/$/, "").replace(/\/api$/, "") : "http://localhost:5000";
  const response = await fetch(`${root}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
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
    throw new Error(
      data?.message ||
        data?.error?.message ||
        `Request failed (${response.status})`
    );
  }

  return data || {};
}

function Field({
  label,
  required = false,
  hint = "",
  children,
}) {
  return (
    <label className="transporter-register-field">
      <span className="transporter-register-label">
        {label}
        {required ? <b>*</b> : null}
      </span>

      {children}

      {hint ? (
        <small className="transporter-register-hint">
          {hint}
        </small>
      ) : null}
    </label>
  );
}

function StepIndicator({ currentStep, language = "en" }) {
  const copy = key => text(language, key);
  const steps = [
    {
      number: 1,
      title: copy("personal"),
      subtitle: language === "hi" ? "मूल जानकारी" : language === "te" ? "ప్రాథమిక వివరాలు" : "Basic details",
    },
    {
      number: 2,
      title: copy("vehicle"),
      subtitle: language === "hi" ? "वाहन विवरण" : language === "te" ? "వాహనం వివరాలు" : "Transport details",
    },
    {
      number: 3,
      title: copy("area"),
      subtitle: language === "hi" ? "आप किसे सेवा देंगे" : language === "te" ? "ఎవరికి సేవ చేస్తారు" : "Who you serve",
    },
    {
      number: 4,
      title: copy("availability"),
      subtitle: language === "hi" ? "आप कब काम करेंगे" : language === "te" ? "ఎప్పుడు పని చేస్తారు" : "When you work",
    },
    {
      number: 5,
      title: copy("review"),
      subtitle: language === "hi" ? "पंजीकरण पूरा करें" : language === "te" ? "నమోదు పూర్తి చేయండి" : "Finish registration",
    },
  ];

  return (
    <div className="transporter-register-steps">
      {steps.map((step, index) => {
        const active = step.number === currentStep;
        const completed = step.number < currentStep;

        return (
          <div
            className={`transporter-register-step ${
              active ? "active" : ""
            } ${completed ? "completed" : ""}`}
            key={step.number}
          >
            <div className="transporter-register-step-circle">
              {completed ? (
                <Check size={16} />
              ) : (
                step.number
              )}
            </div>

            <div className="transporter-register-step-copy">
              <strong>{step.title}</strong>
              <span>{step.subtitle}</span>
            </div>

            {index < steps.length - 1 ? (
              <div className="transporter-register-step-line" />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function LocationPreview({
  form,
}) {
  const hasHierarchy =
    form.stateName ||
    form.districtName ||
    form.mandalName ||
    form.village;

  const hierarchy = [
    form.stateName,
    form.districtName,
    form.mandalName,
    form.village,
  ].filter(Boolean);

  return (
    <div className="transporter-register-location-preview">
      <div className="transporter-register-location-icon">
        <MapPin size={21} />
      </div>

      <div>
        <span>YOUR PRIMARY SERVICE LOCATION</span>

        <strong>
          {hasHierarchy
            ? hierarchy.join(" · ")
            : "Location not selected yet"}
        </strong>

        <small>
          Farmers from this area can be matched to you when
          transport requests are created.
        </small>
      </div>
    </div>
  );
}

function VehicleCard({
  option,
  selected,
  onSelect,
}) {
  return (
    <button
      type="button"
      className={`transporter-register-vehicle-card ${
        selected ? "selected" : ""
      }`}
      onClick={() => onSelect(option)}
    >
      <div className="transporter-register-vehicle-icon">
        <Truck size={23} />
      </div>

      <div>
        <strong>{option.label}</strong>
        <span>{option.description}</span>
        <small>
          Typical capacity:{" "}
          {option.defaultCapacity.toLocaleString("en-IN")} kg
        </small>
      </div>

      {selected ? (
        <CheckCircle2
          className="transporter-register-selected-icon"
          size={21}
        />
      ) : null}
    </button>
  );
}

function DayButton({
  value,
  label,
  selected,
  onClick,
}) {
  return (
    <button
      type="button"
      className={`transporter-register-day ${
        selected ? "selected" : ""
      }`}
      onClick={() => onClick(value)}
    >
      {label}
    </button>
  );
}

function ReviewRow({
  label,
  value,
}) {
  return (
    <div className="transporter-register-review-row">
      <span>{label}</span>
      <strong>{value || "Not provided"}</strong>
    </div>
  );
}

export default function TransporterRegister() {
  const { language: contextLanguage, setLanguage } = useLanguage();
  const [form, setForm] = useState(() => ({ ...readDraft(), language: readDraft().language || contextLanguage || "en" }));
  const [step, setStep] = useState(1);

  const [newVillage, setNewVillage] = useState("");
  const [newCenter, setNewCenter] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [locationLoading, setLocationLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const autoGpsRequestedRef = useRef(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [geoDetails, setGeoDetails] = useState(null);

  useEffect(() => {
    writeDraft(form);
  }, [form]);

  useEffect(() => {
    const next = form.language || contextLanguage || "en";
    if (next !== contextLanguage) setLanguage(next);
    document.documentElement.setAttribute("lang", next);
  }, [form.language, contextLanguage, setLanguage]);

  const lang = form.language || contextLanguage || "en";
  const copy = key => text(lang, key);

  const masterDistricts = useMemo(() => getMasterDistricts(form.stateId, form.stateName), [form.stateId, form.stateName]);
  const masterMandals = useMemo(() => getMasterMandals(form.stateId, form.stateName, form.districtId, form.districtName), [form.stateId, form.stateName, form.districtId, form.districtName]);
  const masterVillages = useMemo(() => getMasterVillages(form.stateId, form.stateName, form.districtId, form.districtName, form.mandalId, form.mandalName), [form.stateId, form.stateName, form.districtId, form.districtName, form.mandalId, form.mandalName]);

  const selectedVehicle = useMemo(
    () =>
      VEHICLE_OPTIONS.find(
        option => option.value === form.vehicleType
      ) || VEHICLE_OPTIONS[0],
    [form.vehicleType]
  );

  const update = (key, value) => {
    setForm(current => ({
      ...current,
      [key]: value,
    }));

    setError("");
    setNotice("");
  };

  const updateVehicle = option => {
    setForm(current => ({
      ...current,
      vehicleType: option.value,
      capacityKg:
        current.capacityKg ||
        String(option.defaultCapacity),
    }));

    setError("");
  };

  const toggleDay = day => {
    setForm(current => {
      const exists = current.availableDays.includes(day);

      return {
        ...current,
        availableDays: exists
          ? current.availableDays.filter(item => item !== day)
          : [...current.availableDays, day],
      };
    });
  };

  const addVillage = () => {
    const village = cleanText(newVillage);

    if (!village) return;

    const exists = form.additionalVillages.some(
      item => item.toLowerCase() === village.toLowerCase()
    );

    if (!exists) {
      update("additionalVillages", [
        ...form.additionalVillages,
        village,
      ]);
    }

    setNewVillage("");
  };

  const removeVillage = village => {
    update(
      "additionalVillages",
      form.additionalVillages.filter(
        item => item !== village
      )
    );
  };

  const addCenter = () => {
    const center = cleanText(newCenter);

    if (!center) return;

    const exists = form.preferredCenters.some(
      item => item.toLowerCase() === center.toLowerCase()
    );

    if (!exists) {
      update("preferredCenters", [
        ...form.preferredCenters,
        center,
      ]);
    }

    setNewCenter("");
  };

  const removeCenter = center => {
    update(
      "preferredCenters",
      form.preferredCenters.filter(
        item => item !== center
      )
    );
  };

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus(
        "This browser does not support GPS location. Please use a browser with location access."
      );
      return;
    }

    setLocationLoading(true);
    setLocationStatus(copy("locating"));
    setError("");

    navigator.geolocation.getCurrentPosition(
      async position => {
        const lat = Number(position.coords.latitude.toFixed(7));
        const lng = Number(position.coords.longitude.toFixed(7));
        const accuracy = Number.isFinite(position.coords.accuracy)
          ? Math.round(position.coords.accuracy)
          : null;

        try {
          const data = await reverseGeocode(lat, lng);
          const address = data?.address || {};

          const detectedState = normalizeStateName(
            address.state ||
              address.state_district ||
              ""
          );

          const detectedDistrict = String(
            address.state_district ||
              address.county ||
              address.district ||
              address.region ||
              ""
          ).trim();

          const detectedMandal = String(
            address.municipality ||
              address.city_district ||
              address.block ||
              address.township ||
              address.suburb ||
              ""
          ).trim();

          const detectedVillage = String(
            address.village ||
              address.town ||
              address.city ||
              address.hamlet ||
              address.neighbourhood ||
              ""
          ).trim();

          const detectedPincode = String(
            address.postcode || ""
          ).trim();

          const masterState =
            getMasterState(detectedState) ||
            getMasterState(findStateByName(detectedState)?.id);

          const nextLocation = {
            stateId:
              masterState?.stateId ||
              "",
            stateName:
              masterState?.stateName ||
              detectedState ||
              "",
            districtId: "",
            districtName: detectedDistrict || "",
            mandalId: "",
            mandalName: detectedMandal || "",
            village: detectedVillage || "",
          };

          const derived = deriveLocationFromMaster(
            nextLocation
          );

          setForm(current => ({
            ...current,
            pickupLat: String(lat),
            pickupLng: String(lng),
            locationAccuracyM: accuracy,
            locationSource: "gps+reverse-geocode",

            stateId:
              derived.stateId ||
              current.stateId ||
              "",
            stateName:
              derived.stateName ||
              current.stateName ||
              detectedState ||
              "",

            districtId:
              derived.districtId ||
              current.districtId ||
              "",
            districtName:
              derived.districtName ||
              current.districtName ||
              detectedDistrict ||
              "",

            mandalId:
              derived.mandalId ||
              current.mandalId ||
              "",
            mandalName:
              derived.mandalName ||
              current.mandalName ||
              detectedMandal ||
              "",

            village:
              detectedVillage ||
              current.village ||
              "",

            pincode:
              detectedPincode ||
              current.pincode ||
              "",

            pickupAddress:
              data?.display_name ||
              current.pickupAddress ||
              "",
          }));

          setGeoDetails({
            displayName: data?.display_name || "",
            detectedState,
            detectedDistrict,
            detectedMandal,
            detectedVillage,
            pincode: detectedPincode,
          });

          setLocationStatus(
            `${copy("locationFound")}${
              accuracy
                ? ` · ±${accuracy} m`
                : ""
            }`
          );
        } catch (reverseError) {
          console.warn(
            "Reverse geocoding failed:",
            reverseError
          );

          /*
           * GPS coordinates are still useful, but location registration
           * needs readable locality values. Do not silently pretend that
           * the coordinates identify the wrong village.
           */
          setForm(current => ({
            ...current,
            pickupLat: String(lat),
            pickupLng: String(lng),
            locationAccuracyM: accuracy,
            locationSource: "gps",
          }));

          setLocationStatus(
            `GPS captured (${lat}, ${lng}) but the area name could not be resolved. Tap "Use my current location" again to retry.`
          );
        } finally {
          setLocationLoading(false);
        }
      },
      errorValue => {
        let message =
          "Unable to read your current GPS location.";

        if (errorValue?.code === 1) {
          message =
            "Location permission was denied. Allow browser location access and try again.";
        }

        if (errorValue?.code === 2) {
          message =
            "Your current location could not be determined. Please try again.";
        }

        if (errorValue?.code === 3) {
          message =
            "GPS location timed out. Please try again in an open area.";
        }

        setLocationStatus(message);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 10000,
      }
    );
  }, [copy, setForm]);

  /*
   * GPS-first registration:
   * entering the location step automatically asks for the current
   * position once. The user does not need to search for or type an area.
   */
  useEffect(() => {
    if (
      step !== 3 ||
      autoGpsRequestedRef.current ||
      form.pickupLat ||
      form.pickupLng
    ) {
      return;
    }

    autoGpsRequestedRef.current = true;
    detectLocation();
  }, [
    step,
    form.pickupLat,
    form.pickupLng,
    detectLocation,
  ]);

  const validateStep = currentStep => {
    setError("");

    if (currentStep === 1) {
      if (!cleanText(form.name)) {
        setError("Enter your full name.");
        return false;
      }

      if (normalisePhone(form.phone).length !== 10) {
        setError("Enter a valid 10-digit mobile number.");
        return false;
      }
      if (!form.password || form.password.length < 6) {
        setError("Password must contain at least 6 characters.");
        return false;
      }
      if (form.password !== form.confirmPassword) {
        setError("Passwords do not match.");
        return false;
      }
    }

    if (currentStep === 2) {
      if (!form.vehicleType) {
        setError("Select your vehicle type.");
        return false;
      }

      if (!cleanText(form.vehicleNumber)) {
        setError("Enter your vehicle registration number.");
        return false;
      }

      const capacity = Number(form.capacityKg);

      if (
        !Number.isFinite(capacity) ||
        capacity <= 0
      ) {
        setError(
          "Enter a vehicle capacity greater than zero."
        );
        return false;
      }
    }

    if (currentStep === 3) {
      if (!cleanText(form.stateName)) {
        setError("Enter your state.");
        return false;
      }

      if (!cleanText(form.districtName)) {
        setError("Enter your district.");
        return false;
      }

      if (!cleanText(form.mandalName)) {
        setError("Enter your mandal / block.");
        return false;
      }

      if (!cleanText(form.village)) {
        setError(
          "Enter your primary village."
        );
        return false;
      }
    }

    if (currentStep === 4) {
      if (!form.availableDays.length) {
        setError(
          "Select at least one day when you are available."
        );
        return false;
      }

      if (!form.startTime || !form.endTime) {
        setError(
          "Select your normal working hours."
        );
        return false;
      }

      if (form.startTime >= form.endTime) {
        setError(
          "Availability end time must be later than start time."
        );
        return false;
      }
    }

    if (currentStep === 5) {
      if (!form.termsAccepted) {
        setError(
          "Please accept the transporter partner agreement."
        );
        return false;
      }
    }

    return true;
  };

  const goNext = () => {
    if (!validateStep(step)) return;

    setNotice("");

    if (step < 5) {
      setStep(current => current + 1);
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  const goBack = () => {
    setError("");
    setNotice("");

    if (step > 1) {
      setStep(current => current - 1);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  const saveRegistration = async event => {
    event.preventDefault();

    if (!validateStep(5)) return;

    setSaving(true);
    setError("");
    setNotice("");

    const transporterId =
      createTransporterId();

    const payload = {
      id: transporterId,

      name: cleanText(form.name),
      phone: normalisePhone(form.phone),
      password: form.password,

      vehicleType: form.vehicleType,
      vehicleNumber: normaliseVehicleNumber(
        form.vehicleNumber
      ),
      capacityKg: Number(form.capacityKg),

      stateId: cleanText(form.stateId) || null,
      stateName: cleanText(form.stateName),

      districtId:
        cleanText(form.districtId) || null,
      districtName: cleanText(
        form.districtName
      ),

      mandalId:
        cleanText(form.mandalId) || null,
      mandalName: cleanText(
        form.mandalName
      ),

      village: cleanText(form.village),
      pincode: cleanText(form.pincode),

      serviceRadiusKm:
        Number(form.serviceRadiusKm) || 10,

      additionalVillages:
        form.additionalVillages,

      pickupLat:
        form.pickupLat === ""
          ? null
          : Number(form.pickupLat),

      pickupLng:
        form.pickupLng === ""
          ? null
          : Number(form.pickupLng),

      pickupAddress:
        cleanText(form.pickupAddress) || null,
      currentLat:
        form.pickupLat === "" ? null : Number(form.pickupLat),
      currentLng:
        form.pickupLng === "" ? null : Number(form.pickupLng),

      preferredCenters:
        form.preferredCenters,

      availableDays:
        form.availableDays,

      startTime: form.startTime,
      endTime: form.endTime,

      acceptsEmergency:
        Boolean(form.acceptsEmergency),

      acceptsScheduled:
        Boolean(form.acceptsScheduled),

      acceptsSmallLoads:
        Boolean(form.acceptsSmallLoads),

      isOnline: false,
    };

    try {
      /*
       * This endpoint is intentionally kept as the single
       * registration boundary. The backend will validate the
       * geographic service area and persist the transporter.
       */
      const data = await requestJson(
        "/api/transporters/register",
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      const saved =
        data?.transporter || payload;

      if (!saved?.id) {
        throw new Error(
          "Transporter registration did not return a valid account."
        );
      }

      window.localStorage.setItem(
        TRANSPORTER_ID_KEY,
        String(saved.id)
      );

      window.localStorage.removeItem(TRANSPORTER_DRAFT_KEY);
      window.localStorage.setItem(
        TRANSPORTER_SESSION_KEY,
        JSON.stringify({
          authenticated: true,
          transporter: saved,
          token: data?.token || null,
          loginAt: new Date().toISOString(),
        })
      );

      setNotice(
        "Transporter registration completed successfully."
      );

      /*
       * Do not force a router dependency into this page.
       * App.jsx can route the transporter to login/dashboard
       * after registration in the next integration step.
       */
      window.setTimeout(() => {
        window.location.assign(
          "/transporter/dashboard"
        );
      }, 500);
    } catch (saveError) {
      console.error(
        "Transporter registration:",
        saveError
      );

      /*
       * Keep the complete draft if the backend is not ready
       * or temporarily unavailable. Nothing entered by the
       * transporter is lost.
       */
      writeDraft(form);

      setError(
        saveError?.message ||
          "Unable to complete transporter registration."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="transporter-register-page">
      <Header />

      <main className="transporter-register-shell">
        <section className="transporter-register-hero">
          <div className="transporter-register-hero-icon">
            <Truck size={30} />
          </div>

          <div>
            <span className="transporter-register-eyebrow">
              KRISHISETU · TRANSPORT PARTNER
            </span>

            <h1>{copy("title")}</h1>
            <p>{copy("subtitle")}</p>
          </div>

          <div className="transporter-register-language-control">
            <Languages size={18} />
            <label htmlFor="transporter-language">{copy("language")}</label>
            <select
              id="transporter-language"
              value={lang}
              onChange={event => update("language", event.target.value)}
            >
              {LANGUAGE_OPTIONS.map(option => (
                <option key={option.id} value={option.id}>
                  {option.native}
                </option>
              ))}
            </select>
          </div>

          <div className="transporter-register-hero-badge">
            <ShieldCheck size={18} />
            <span>
              Your service area controls job matching
            </span>
          </div>
        </section>

        <StepIndicator currentStep={step} language={lang} />

        <form
          className="transporter-register-card"
          onSubmit={saveRegistration}
        >
          {error ? (
            <div className="transporter-register-alert error">
              <CircleAlert size={19} />
              <span>{error}</span>
            </div>
          ) : null}

          {notice ? (
            <div className="transporter-register-alert success">
              <CheckCircle2 size={19} />
              <span>{notice}</span>
            </div>
          ) : null}

          {step === 1 ? (
            <section className="transporter-register-section">
              <div className="transporter-register-section-heading">
                <div className="transporter-register-section-number">
                  01
                </div>

                <div>
                  <span>PERSONAL DETAILS</span>
                  <h2>Tell us who will operate the vehicle</h2>
                  <p>
                    These details are used for transporter
                    communication and trip coordination.
                  </p>
                </div>
              </div>

              <div className="transporter-register-grid">
                <Field
                  label="Full name"
                  required
                  hint="Use the name you normally use for transport work."
                >
                  <div className="transporter-register-input-wrap">
                    <UserRound size={18} />
                    <input
                      value={form.name}
                      onChange={event =>
                        update(
                          "name",
                          event.target.value
                        )
                      }
                      placeholder="e.g. Ramesh Kumar"
                      autoComplete="name"
                    />
                  </div>
                </Field>

                <Field
                  label="Mobile number"
                  required
                  hint="Used for trip notifications and farmer coordination."
                >
                  <div className="transporter-register-input-wrap">
                    <Phone size={18} />
                    <input
                      value={form.phone}
                      onChange={event =>
                        update(
                          "phone",
                          normalisePhone(
                            event.target.value
                          )
                        )
                      }
                      placeholder="10-digit mobile number"
                      inputMode="numeric"
                      autoComplete="tel"
                    />
                  </div>
                </Field>
              </div>

              <div className="transporter-register-grid">
                <Field label={copy("password")} required hint="Use at least 6 characters. Never share your password with a farmer.">
                  <div className="transporter-register-input-wrap">
                    <ShieldCheck size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={event => update("password", event.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="transporter-register-password-toggle"
                      onClick={() => setShowPassword(value => !value)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </Field>

                <Field label={copy("confirmPassword")} required hint="Re-enter the same password.">
                  <div className="transporter-register-input-wrap">
                    <ShieldCheck size={18} />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={form.confirmPassword}
                      onChange={event => update("confirmPassword", event.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="transporter-register-password-toggle"
                      onClick={() => setShowConfirmPassword(value => !value)}
                      aria-label={showConfirmPassword ? "Hide password confirmation" : "Show password confirmation"}
                    >
                      {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </Field>
              </div>

              <div className="transporter-register-info-box">
                <ShieldCheck size={20} />

                <div>
                  <strong>
                    One transporter profile per mobile number
                  </strong>

                  <span>
                    Your mobile number will be associated
                    with your transporter account when the
                    backend registration is enabled.
                  </span>
                </div>
              </div>
            </section>
          ) : null}

          {step === 2 ? (
            <section className="transporter-register-section">
              <div className="transporter-register-section-heading">
                <div className="transporter-register-section-number">
                  02
                </div>

                <div>
                  <span>VEHICLE DETAILS</span>
                  <h2>What vehicle do you operate?</h2>
                  <p>
                    Vehicle capacity is a major factor in
                    deciding which farmer requests you can
                    accept.
                  </p>
                </div>
              </div>

              <div className="transporter-register-vehicle-grid">
                {VEHICLE_OPTIONS.map(option => (
                  <VehicleCard
                    key={option.value}
                    option={option}
                    selected={
                      form.vehicleType ===
                      option.value
                    }
                    onSelect={updateVehicle}
                  />
                ))}
              </div>

              <div className="transporter-register-grid">
                <Field
                  label="Vehicle registration number"
                  required
                  hint="Example: TS 09 AB 1234"
                >
                  <input
                    className="transporter-register-input"
                    value={form.vehicleNumber}
                    onChange={event =>
                      update(
                        "vehicleNumber",
                        normaliseVehicleNumber(
                          event.target.value
                        )
                      )
                    }
                    placeholder="TS 09 AB 1234"
                  />
                </Field>

                <Field
                  label="Maximum cargo capacity"
                  required
                  hint="Enter the safe load you are willing to carry for KrishiSetu jobs."
                >
                  <div className="transporter-register-input-unit">
                    <input
                      className="transporter-register-input"
                      value={form.capacityKg}
                      onChange={event =>
                        update(
                          "capacityKg",
                          event.target.value.replace(
                            /\D/g,
                            ""
                          )
                        )
                      }
                      placeholder={String(
                        selectedVehicle.defaultCapacity
                      )}
                      inputMode="numeric"
                    />
                    <span>kg</span>
                  </div>
                </Field>
              </div>

              <div className="transporter-register-capacity-preview">
                <GaugeIcon />

                <div>
                  <span>LOAD MATCHING</span>
                  <strong>
                    Requests up to{" "}
                    {Number(
                      form.capacityKg || 0
                    ).toLocaleString("en-IN")}{" "}
                    kg can be considered
                  </strong>
                  <small>
                    The backend will never assign a request
                    above your registered capacity.
                  </small>
                </div>
              </div>
            </section>
          ) : null}

          {step === 3 ? (
            <section className="transporter-register-section">
              <div className="transporter-register-section-heading">
                <div className="transporter-register-section-number">
                  03
                </div>

                <div>
                  <span>SERVICE AREA</span>
                  <h2>Choose exactly where you serve</h2>
                  <p>
                    This is the heart of KrishiSetu
                    transport matching. Farmers outside
                    your configured service area should not
                    appear in your normal job queue.
                  </p>
                </div>
              </div>

              <div className="transporter-register-important-location">
                <MapPin size={21} />

                <div>
                  <strong>
                    Your location is detected automatically
                  </strong>

                  <span>
                    Tap "Use my current location" or allow the automatic GPS request.
                    KrishiSetu fills the state, district, mandal, village,
                    PIN and starting coordinates from your current position.
                  </span>
                </div>
              </div>

              <div className="transporter-register-location-tools">
                <button
                  type="button"
                  className="transporter-register-location-button primary"
                  onClick={detectLocation}
                  disabled={locationLoading}
                >
                  {locationLoading ? <RefreshCw size={18} className="transporter-register-spin" /> : <LocateFixed size={18} />}
                  {locationLoading ? copy("locating") : copy("useLocation")}
                </button>
                <div className="transporter-register-location-helper">
                  <Navigation size={16} />
                  <span>{copy("gpsHint")}</span>
                </div>
              </div>

              {geoDetails?.displayName ? (
                <div className="transporter-register-geocode-card">
                  <MapPinned size={18} />
                  <div>
                    <strong>Detected from GPS</strong>
                    <span>{geoDetails.displayName}</span>
                  </div>
                </div>
              ) : null}

              <div className="transporter-register-grid">
                <Field label={copy("state")} required hint="Full India state/UT list is available. Choose the same state used by farmer profiles.">
                  <div className="transporter-register-select-wrap">
                    <select
                      value={form.stateId || findStateByName(form.stateName)?.id || ""}
                      disabled={form.locationSource.startsWith("gps")}
                      onChange={event => {
                        const selected = INDIA_STATES.find(item => item.id === event.target.value);
                        update("stateId", selected?.id || "");
                        update("stateName", selected?.name || "");
                        update("districtId", "");
                        update("districtName", "");
                        update("mandalId", "");
                        update("mandalName", "");
                        update("village", "");
                      }}
                    >
                      <option value="">Select state / UT</option>
                      {INDIA_STATES.map(state => (
                        <option key={state.id} value={state.id}>{state.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={17} />
                  </div>
                </Field>

                <Field label={copy("district")} required hint={masterDistricts.length ? "Select from the available master locations." : "No district master was bundled for this state; type the district or use GPS autofill."}>
                  {masterDistricts.length ? (
                    <div className="transporter-register-select-wrap">
                      <select
                        value={form.districtId || ""}
                        disabled={form.locationSource.startsWith("gps")}
                        onChange={event => {
                          const item = masterDistricts.find(d => d.districtId === event.target.value);
                          update("districtId", item?.districtId || "");
                          update("districtName", item?.districtName || "");
                          update("mandalId", "");
                          update("mandalName", "");
                          update("village", "");
                        }}
                      >
                        <option value="">Select district</option>
                        {masterDistricts.map(item => <option key={item.districtId} value={item.districtId}>{item.districtName}</option>)}
                      </select>
                      <ChevronDown size={17} />
                    </div>
                  ) : (
                    <input className="transporter-register-input" value={form.districtName} readOnly={form.locationSource.startsWith("gps")} onChange={event => update("districtName", event.target.value)} placeholder="Detected from GPS" />
                  )}
                </Field>

                <Field label={copy("mandal")} required hint={masterMandals.length ? "Select the mandal / block from the master list." : "Type the mandal / block when a master list is not available."}>
                  {masterMandals.length ? (
                    <div className="transporter-register-select-wrap">
                      <select
                        value={form.mandalId || ""}
                        disabled={form.locationSource.startsWith("gps")}
                        onChange={event => {
                          const item = masterMandals.find(d => d.mandalId === event.target.value);
                          update("mandalId", item?.mandalId || "");
                          update("mandalName", item?.mandalName || "");
                          update("village", "");
                        }}
                      >
                        <option value="">Select mandal / block</option>
                        {masterMandals.map(item => <option key={item.mandalId} value={item.mandalId}>{item.mandalName}</option>)}
                      </select>
                      <ChevronDown size={17} />
                    </div>
                  ) : (
                    <input className="transporter-register-input" value={form.mandalName} readOnly={form.locationSource.startsWith("gps")} onChange={event => update("mandalName", event.target.value)} placeholder="Detected from GPS" />
                  )}
                </Field>

                <Field label={copy("village")} required hint={masterVillages.length ? "Choose your primary village from the master list." : "Type the village name. GPS can populate it automatically."}>
                  {masterVillages.length ? (
                    <div className="transporter-register-select-wrap">
                      <select
                        value={form.village}
                        disabled={form.locationSource.startsWith("gps")}
                        onChange={event => update("village", event.target.value)}
                      >
                        <option value="">Select village</option>
                        {masterVillages.map(village => <option key={village} value={village}>{village}</option>)}
                      </select>
                      <ChevronDown size={17} />
                    </div>
                  ) : (
                    <input className="transporter-register-input" value={form.village} readOnly={form.locationSource.startsWith("gps")} onChange={event => update("village", event.target.value)} placeholder="Detected from GPS" />
                  )}
                </Field>

                <Field label={copy("pincode")} hint="Six-digit postal PIN. GPS may fill this automatically.">
                  <input
                    className="transporter-register-input"
                    value={form.pincode}
                    readOnly={form.locationSource.startsWith("gps")}
                    onChange={event => update("pincode", event.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="Detected from GPS"
                    inputMode="numeric"
                  />
                </Field>

                <Field label={copy("address")} hint="Optional. This is stored as a human-readable starting point.">
                  <input className="transporter-register-input" value={form.pickupAddress} onChange={event => update("pickupAddress", event.target.value)} placeholder="Village road, market, landmark..." />
                </Field>
              </div>

              <div className="transporter-register-grid compact">
                <Field label="Latitude">
                  <input className="transporter-register-input" value={form.pickupLat} onChange={event => update("pickupLat", event.target.value)} placeholder="17.0000000" inputMode="decimal" />
                </Field>
                <Field label="Longitude">
                  <input className="transporter-register-input" value={form.pickupLng} onChange={event => update("pickupLng", event.target.value)} placeholder="78.0000000" inputMode="decimal" />
                </Field>
              </div>

              {locationStatus ? (
                <div className="transporter-register-location-status">
                  <MapPin size={16} />
                  <span>{locationStatus}</span>
                </div>
              ) : null}


              <LocationPreview form={form} />

              <div className="transporter-register-subsection">
                <div className="transporter-register-subsection-heading">
                  <div>
                    <span>ADDITIONAL VILLAGES</span>
                    <h3>
                      Other villages you regularly serve
                    </h3>
                  </div>
                </div>

                <div className="transporter-register-add-row">
                  <input
                    className="transporter-register-input"
                    value={newVillage}
                    onChange={event =>
                      setNewVillage(
                        event.target.value
                      )
                    }
                    onKeyDown={event => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addVillage();
                      }
                    }}
                    placeholder="Enter another village"
                  />

                  <button
                    type="button"
                    className="transporter-register-add-button"
                    onClick={addVillage}
                  >
                    Add village
                  </button>
                </div>

                {form.additionalVillages.length ? (
                  <div className="transporter-register-chip-list">
                    {form.additionalVillages.map(
                      village => (
                        <span
                          className="transporter-register-chip"
                          key={village}
                        >
                          <MapPin size={14} />
                          {village}
                          <button
                            type="button"
                            onClick={() =>
                              removeVillage(
                                village
                              )
                            }
                            aria-label={`Remove ${village}`}
                          >
                            <X size={14} />
                          </button>
                        </span>
                      )
                    )}
                  </div>
                ) : (
                  <p className="transporter-register-muted">
                    No additional villages added. You can
                    still serve the primary village and the
                    configured radius.
                  </p>
                )}
              </div>

              <div className="transporter-register-subsection">
                <div className="transporter-register-subsection-heading">
                  <div>
                    <span>PROCUREMENT CENTERS</span>
                    <h3>
                      Centers you commonly deliver to
                    </h3>
                  </div>
                </div>

                <div className="transporter-register-add-row">
                  <input
                    className="transporter-register-input"
                    value={newCenter}
                    onChange={event =>
                      setNewCenter(
                        event.target.value
                      )
                    }
                    onKeyDown={event => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addCenter();
                      }
                    }}
                    placeholder="Center name or center ID"
                  />

                  <button
                    type="button"
                    className="transporter-register-add-button"
                    onClick={addCenter}
                  >
                    Add center
                  </button>
                </div>

                {form.preferredCenters.length ? (
                  <div className="transporter-register-chip-list">
                    {form.preferredCenters.map(
                      center => (
                        <span
                          className="transporter-register-chip center"
                          key={center}
                        >
                          <Truck size={14} />
                          {center}
                          <button
                            type="button"
                            onClick={() =>
                              removeCenter(
                                center
                              )
                            }
                            aria-label={`Remove ${center}`}
                          >
                            <X size={14} />
                          </button>
                        </span>
                      )
                    )}
                  </div>
                ) : (
                  <p className="transporter-register-muted">
                    You can leave this empty. Center
                    compatibility will also be calculated
                    from farmer requests and route data.
                  </p>
                )}
              </div>
            </section>
          ) : null}

          {step === 4 ? (
            <section className="transporter-register-section">
              <div className="transporter-register-section-heading">
                <div className="transporter-register-section-number">
                  04
                </div>

                <div>
                  <span>AVAILABILITY</span>
                  <h2>When can farmers request you?</h2>
                  <p>
                    These preferences help prevent unsuitable
                    requests from reaching your dashboard.
                  </p>
                </div>
              </div>

              <div className="transporter-register-subsection">
                <div className="transporter-register-subsection-heading">
                  <div>
                    <span>WORKING DAYS</span>
                    <h3>Select your normal transport days</h3>
                  </div>
                </div>

                <div className="transporter-register-day-grid">
                  <DayButton
                    value="MON"
                    label="Mon"
                    selected={form.availableDays.includes("MON")}
                    onClick={toggleDay}
                  />
                  <DayButton
                    value="TUE"
                    label="Tue"
                    selected={form.availableDays.includes("TUE")}
                    onClick={toggleDay}
                  />
                  <DayButton
                    value="WED"
                    label="Wed"
                    selected={form.availableDays.includes("WED")}
                    onClick={toggleDay}
                  />
                  <DayButton
                    value="THU"
                    label="Thu"
                    selected={form.availableDays.includes("THU")}
                    onClick={toggleDay}
                  />
                  <DayButton
                    value="FRI"
                    label="Fri"
                    selected={form.availableDays.includes("FRI")}
                    onClick={toggleDay}
                  />
                  <DayButton
                    value="SAT"
                    label="Sat"
                    selected={form.availableDays.includes("SAT")}
                    onClick={toggleDay}
                  />
                  <DayButton
                    value="SUN"
                    label="Sun"
                    selected={form.availableDays.includes("SUN")}
                    onClick={toggleDay}
                  />
                </div>
              </div>

              <div className="transporter-register-grid">
                <Field
                  label="Start time"
                  required
                >
                  <div className="transporter-register-input-wrap">
                    <Clock3 size={18} />
                    <input
                      type="time"
                      value={form.startTime}
                      onChange={event =>
                        update(
                          "startTime",
                          event.target.value
                        )
                      }
                    />
                  </div>
                </Field>

                <Field
                  label="End time"
                  required
                >
                  <div className="transporter-register-input-wrap">
                    <Clock3 size={18} />
                    <input
                      type="time"
                      value={form.endTime}
                      onChange={event =>
                        update(
                          "endTime",
                          event.target.value
                        )
                      }
                    />
                  </div>
                </Field>
              </div>

              <div className="transporter-register-subsection">
                <div className="transporter-register-subsection-heading">
                  <div>
                    <span>TRIP PREFERENCES</span>
                    <h3>What kinds of requests do you accept?</h3>
                  </div>
                </div>

                <label className="transporter-register-check-card">
                  <input
                    type="checkbox"
                    checked={form.acceptsScheduled}
                    onChange={event =>
                      update(
                        "acceptsScheduled",
                        event.target.checked
                      )
                    }
                  />

                  <div>
                    <strong>Scheduled farmer requests</strong>
                    <span>
                      Accept requests booked for a future
                      pickup date and time.
                    </span>
                  </div>
                </label>

                <label className="transporter-register-check-card">
                  <input
                    type="checkbox"
                    checked={form.acceptsEmergency}
                    onChange={event =>
                      update(
                        "acceptsEmergency",
                        event.target.checked
                      )
                    }
                  />

                  <div>
                    <strong>Urgent / ASAP requests</strong>
                    <span>
                      Allow nearby farmers to request an
                      available vehicle immediately.
                    </span>
                  </div>
                </label>

                <label className="transporter-register-check-card">
                  <input
                    type="checkbox"
                    checked={form.acceptsSmallLoads}
                    onChange={event =>
                      update(
                        "acceptsSmallLoads",
                        event.target.checked
                      )
                    }
                  />

                  <div>
                    <strong>Small loads</strong>
                    <span>
                      Accept crop loads significantly below
                      your vehicle's maximum capacity.
                    </span>
                  </div>
                </label>
              </div>

              <div className="transporter-register-subsection">
                <div className="transporter-register-subsection-heading">
                  <div>
                    <span>STARTING LOCATION</span>
                    <h3>GPS location for automatic registration</h3>
                  </div>
                </div>

                <button
                  type="button"
                  className="transporter-register-location-button"
                  onClick={detectLocation}
                  disabled={locationLoading}
                >
                  <MapPin size={18} />

                  {locationLoading
                    ? "Getting current location…"
                    : "Detect my location automatically"}
                </button>

                {locationStatus ? (
                  <div className="transporter-register-location-status">
                    {locationStatus}
                  </div>
                ) : null}

                <Field
                  label="Starting address / landmark"
                  hint="Optional description of where your vehicle normally starts."
                >
                  <input
                    className="transporter-register-input"
                    value={form.pickupAddress}
                    onChange={event =>
                      update(
                        "pickupAddress",
                        event.target.value
                      )
                    }
                    placeholder="Village road, market, landmark..."
                  />
                </Field>

                <div className="transporter-register-grid compact">
                  <Field label="Latitude">
                    <input
                      className="transporter-register-input"
                      value={form.pickupLat}
                      onChange={event =>
                        update(
                          "pickupLat",
                          event.target.value
                        )
                      }
                      placeholder="17.0000000"
                      inputMode="decimal"
                    />
                  </Field>

                  <Field label="Longitude">
                    <input
                      className="transporter-register-input"
                      value={form.pickupLng}
                      onChange={event =>
                        update(
                          "pickupLng",
                          event.target.value
                        )
                      }
                      placeholder="78.0000000"
                      inputMode="decimal"
                    />
                  </Field>
                </div>
              </div>
            </section>
          ) : null}

          {step === 5 ? (
            <section className="transporter-register-section">
              <div className="transporter-register-section-heading">
                <div className="transporter-register-section-number">
                  05
                </div>

                <div>
                  <span>FINAL REVIEW</span>
                  <h2>Check your transporter profile</h2>
                  <p>
                    Review the information before creating
                    your KrishiSetu transport partner account.
                  </p>
                </div>
              </div>

              <div className="transporter-register-review-card">
                <div className="transporter-register-review-heading">
                  <UserRound size={19} />
                  <strong>Personal</strong>
                </div>

                <ReviewRow
                  label="Name"
                  value={form.name}
                />

                <ReviewRow
                  label="Mobile"
                  value={form.phone}
                />
              </div>

              <div className="transporter-register-review-card">
                <div className="transporter-register-review-heading">
                  <Truck size={19} />
                  <strong>Vehicle</strong>
                </div>

                <ReviewRow
                  label="Vehicle"
                  value={selectedVehicle.label}
                />

                <ReviewRow
                  label="Registration"
                  value={form.vehicleNumber}
                />

                <ReviewRow
                  label="Capacity"
                  value={`${Number(
                    form.capacityKg || 0
                  ).toLocaleString("en-IN")} kg`}
                />
              </div>

              <div className="transporter-register-review-card">
                <div className="transporter-register-review-heading">
                  <MapPin size={19} />
                  <strong>Service area</strong>
                </div>

                <ReviewRow
                  label="State"
                  value={form.stateName}
                />

                <ReviewRow
                  label="District"
                  value={form.districtName}
                />

                <ReviewRow
                  label="Mandal / Block"
                  value={form.mandalName}
                />

                <ReviewRow
                  label="Primary village"
                  value={form.village}
                />

                <ReviewRow
                  label="Service radius"
                  value={`${form.serviceRadiusKm} km`}
                />

                <ReviewRow
                  label="Additional villages"
                  value={
                    form.additionalVillages.length
                      ? form.additionalVillages.join(", ")
                      : "Primary village + radius only"
                  }
                />
              </div>

              <div className="transporter-register-review-card">
                <div className="transporter-register-review-heading">
                  <Clock3 size={19} />
                  <strong>Availability</strong>
                </div>

                <ReviewRow
                  label="Days"
                  value={
                    form.availableDays.length
                      ? form.availableDays.join(", ")
                      : "None"
                  }
                />

                <ReviewRow
                  label="Working hours"
                  value={`${form.startTime} – ${form.endTime}`}
                />

                <ReviewRow
                  label="Scheduled jobs"
                  value={
                    form.acceptsScheduled
                      ? "Accepted"
                      : "Not accepted"
                  }
                />

                <ReviewRow
                  label="Urgent jobs"
                  value={
                    form.acceptsEmergency
                      ? "Accepted"
                      : "Not accepted"
                  }
                />
              </div>

              <div className="transporter-register-final-location">
                <MapPin size={20} />

                <div>
                  <span>JOB MATCHING WILL USE</span>
                  <strong>
                    {[
                      form.village,
                      form.mandalName,
                      form.districtName,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </strong>

                  <small>
                    Primary village + additional villages +
                    service radius + vehicle capacity +
                    availability will be used to rank
                    relevant farmer transport requests.
                  </small>
                </div>
              </div>

              <label className="transporter-register-terms">
                <input
                  type="checkbox"
                  checked={form.termsAccepted}
                  onChange={event =>
                    update(
                      "termsAccepted",
                      event.target.checked
                    )
                  }
                />

                <span>
                  I confirm that the vehicle and service
                  information I entered is accurate and I
                  agree to operate transport requests
                  accepted through KrishiSetu responsibly.
                </span>
              </label>
            </section>
          ) : null}

          <div className="transporter-register-navigation">
            <button
              type="button"
              className="transporter-register-back-button"
              onClick={goBack}
              disabled={step === 1 || saving}
            >
              <ArrowLeft size={18} />
              {copy("back")}
            </button>

            <div className="transporter-register-save-note">
              <Save size={15} />
              Your progress is saved locally
            </div>

            {step < 5 ? (
              <button
                type="button"
                className="transporter-register-next-button"
                onClick={goNext}
              >
                {copy("next")}
                <ArrowRight size={18} />
              </button>
            ) : (
              <button
                type="submit"
                className="transporter-register-submit-button"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="transporter-register-spinner" />
                    {copy("creating")}
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    {copy("create")}
                  </>
                )}
              </button>
            )}
          </div>
        </form>

        <footer className="transporter-register-footer">
          <div>
            <ShieldCheck size={16} />
            <span>
              KrishiSetu uses your registered service area
              for transport matching.
            </span>
          </div>

          <div>
            <MapPin size={16} />
            <span>
              {copy("matching")}
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}

function GaugeIcon() {
  return (
    <div className="transporter-register-gauge-icon">
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 14l3-3" />
        <path d="M20.4 15a8.1 8.1 0 1 0-16.8 0" />
        <path d="M4.6 15h15.8" />
      </svg>
    </div>
  );
}
