import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock3,
  Globe2,
  LockKeyhole,
  MapPin,
  Pencil,
  RefreshCw,
  Save,
  ShieldCheck,
  Truck,
  UserRound,
  X,
} from "lucide-react";

import Header from "../../components/Header";
import { useLanguage } from "../../translations/LanguageContext";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

const SESSION_KEY =
  "krishisetu_transporter_session";

const TEMP_SESSION_KEY =
  "krishisetu_transporter_temp_session";

const TRANSPORTER_ID_KEY =
  "krishisetu_transporter_id";

const COPY = {
  en: {
    eyebrow: "TRANSPORT PARTNER",
    title: "My profile",
    subtitle:
      "Manage the information that KrishiSetu uses to identify you, your vehicle and your service area.",
    back: "Dashboard",
    refresh: "Refresh",
    refreshing: "Refreshing…",
    edit: "Edit profile",
    save: "Save changes",
    saving: "Saving…",
    cancel: "Cancel",
    language: "Language",
    personal: "Personal details",
    vehicle: "Vehicle details",
    serviceArea: "Service area",
    availability: "Availability",
    security: "Account security",
    name: "Full name",
    phone: "Mobile number",
    vehicleType: "Vehicle type",
    vehicleNumber: "Vehicle number",
    capacity: "Capacity",
    village: "Primary village",
    mandal: "Mandal / Block",
    district: "District",
    state: "State",
    pincode: "Pincode",
    radius: "Service radius",
    online: "Online",
    offline: "Offline",
    status: "Current status",
    workingHours: "Working hours",
    workingDays: "Working days",
    emergency: "Urgent jobs",
    scheduled: "Scheduled jobs",
    smallLoads: "Small loads",
    yes: "Enabled",
    no: "Disabled",
    gps: "Current GPS",
    noGps: "No GPS location saved",
    updateLocation: "Use current location",
    updatingLocation: "Updating location…",
    locationUpdated: "Current location updated.",
    locationError:
      "Unable to update your current location.",
    languageNote:
      "Your language preference is used across transporter screens.",
    regionNote:
      "Your registered village, mandal, district and state are used by the backend when farmer requests are matched to you.",
    securityNote:
      "Your password is never displayed here. It is stored and verified by the backend.",
    backend: "Backend",
    connected: "Connected",
    unavailable: "Unavailable",
    error: "Unable to load profile.",
    saveError: "Unable to save profile.",
    saved: "Profile updated successfully.",
    login:
      "Your transporter session is missing. Please sign in again.",
    noVehicleNumber: "Not provided",
    daysNone: "No working days configured",
    monday: "Mon",
    tuesday: "Tue",
    wednesday: "Wed",
    thursday: "Thu",
    friday: "Fri",
    saturday: "Sat",
    sunday: "Sun",
    passwordTitle: "Password protection",
    passwordText:
      "Password changes are handled by the backend login system. This profile page does not expose your password.",
    registration: "Registration ID",
    accountCreated: "Account created",
    never: "—",
  },

  hi: {
    eyebrow: "परिवहन साझेदार",
    title: "मेरी प्रोफ़ाइल",
    subtitle:
      "वह जानकारी प्रबंधित करें जिसका उपयोग कृषिसेतु आपकी पहचान, वाहन और सेवा क्षेत्र के लिए करता है।",
    back: "डैशबोर्ड",
    refresh: "रिफ्रेश",
    refreshing: "रिफ्रेश हो रहा है…",
    edit: "प्रोफ़ाइल संपादित करें",
    save: "बदलाव सहेजें",
    saving: "सहेजा जा रहा है…",
    cancel: "रद्द करें",
    language: "भाषा",
    personal: "व्यक्तिगत विवरण",
    vehicle: "वाहन विवरण",
    serviceArea: "सेवा क्षेत्र",
    availability: "उपलब्धता",
    security: "खाता सुरक्षा",
    name: "पूरा नाम",
    phone: "मोबाइल नंबर",
    vehicleType: "वाहन प्रकार",
    vehicleNumber: "वाहन नंबर",
    capacity: "क्षमता",
    village: "मुख्य गाँव",
    mandal: "मंडल / ब्लॉक",
    district: "जिला",
    state: "राज्य",
    pincode: "पिनकोड",
    radius: "सेवा सीमा",
    online: "ऑनलाइन",
    offline: "ऑफलाइन",
    status: "वर्तमान स्थिति",
    workingHours: "कार्य समय",
    workingDays: "कार्य दिवस",
    emergency: "तत्काल कार्य",
    scheduled: "निर्धारित कार्य",
    smallLoads: "छोटा भार",
    yes: "सक्रिय",
    no: "बंद",
    gps: "वर्तमान GPS",
    noGps: "कोई GPS स्थान सहेजा नहीं गया",
    updateLocation: "वर्तमान स्थान लें",
    updatingLocation: "स्थान अपडेट हो रहा है…",
    locationUpdated: "वर्तमान स्थान अपडेट हो गया।",
    locationError:
      "वर्तमान स्थान अपडेट नहीं हो सका।",
    languageNote:
      "आपकी भाषा पसंद सभी परिवहन स्क्रीन पर उपयोग होगी।",
    regionNote:
      "आपका गाँव, मंडल, जिला और राज्य बैकएंड द्वारा किसान अनुरोधों का मिलान करने में उपयोग किया जाता है।",
    securityNote:
      "आपका पासवर्ड यहाँ कभी नहीं दिखाया जाता। इसे बैकएंड सुरक्षित रूप से सत्यापित करता है।",
    backend: "बैकएंड",
    connected: "कनेक्टेड",
    unavailable: "उपलब्ध नहीं",
    error: "प्रोफ़ाइल लोड नहीं हो सकी।",
    saveError: "प्रोफ़ाइल सहेजी नहीं जा सकी।",
    saved: "प्रोफ़ाइल सफलतापूर्वक अपडेट हुई।",
    login:
      "परिवहनकर्ता सत्र नहीं मिला। कृपया फिर से साइन इन करें।",
    noVehicleNumber: "उपलब्ध नहीं",
    daysNone: "कोई कार्य दिवस कॉन्फ़िगर नहीं",
    monday: "सोम",
    tuesday: "मंगल",
    wednesday: "बुध",
    thursday: "गुरु",
    friday: "शुक्र",
    saturday: "शनि",
    sunday: "रवि",
    passwordTitle: "पासवर्ड सुरक्षा",
    passwordText:
      "पासवर्ड बदलाव बैकएंड लॉगिन सिस्टम द्वारा संभाले जाते हैं। यह प्रोफ़ाइल पेज पासवर्ड नहीं दिखाता।",
    registration: "पंजीकरण आईडी",
    accountCreated: "खाता बनाया गया",
    never: "—",
  },

  te: {
    eyebrow: "రవాణా భాగస్వామి",
    title: "నా ప్రొఫైల్",
    subtitle:
      "మీ గుర్తింపు, వాహనం మరియు సేవా ప్రాంతం కోసం కృషిసేతు ఉపయోగించే సమాచారాన్ని నిర్వహించండి.",
    back: "డ్యాష్‌బోర్డ్",
    refresh: "రిఫ్రెష్",
    refreshing: "రిఫ్రెష్ అవుతోంది…",
    edit: "ప్రొఫైల్ మార్చండి",
    save: "మార్పులు సేవ్ చేయండి",
    saving: "సేవ్ అవుతోంది…",
    cancel: "రద్దు",
    language: "భాష",
    personal: "వ్యక్తిగత వివరాలు",
    vehicle: "వాహన వివరాలు",
    serviceArea: "సేవా ప్రాంతం",
    availability: "అందుబాటు",
    security: "ఖాతా భద్రత",
    name: "పూర్తి పేరు",
    phone: "మొబైల్ నంబర్",
    vehicleType: "వాహన రకం",
    vehicleNumber: "వాహన నంబర్",
    capacity: "సామర్థ్యం",
    village: "ప్రధాన గ్రామం",
    mandal: "మండలం / బ్లాక్",
    district: "జిల్లా",
    state: "రాష్ట్రం",
    pincode: "పిన్‌కోడ్",
    radius: "సేవా పరిధి",
    online: "ఆన్‌లైన్",
    offline: "ఆఫ్‌లైన్",
    status: "ప్రస్తుత స్థితి",
    workingHours: "పని సమయం",
    workingDays: "పని రోజులు",
    emergency: "అత్యవసర పనులు",
    scheduled: "షెడ్యూల్ పనులు",
    smallLoads: "చిన్న లోడ్లు",
    yes: "అమల్లో ఉంది",
    no: "ఆఫ్",
    gps: "ప్రస్తుత GPS",
    noGps: "GPS లొకేషన్ సేవ్ కాలేదు",
    updateLocation: "ప్రస్తుత లొకేషన్ తీసుకోండి",
    updatingLocation: "లొకేషన్ అప్డేట్ అవుతోంది…",
    locationUpdated: "ప్రస్తుత లొకేషన్ అప్డేట్ అయింది.",
    locationError:
      "ప్రస్తుత లొకేషన్ అప్డేట్ కాలేదు.",
    languageNote:
      "మీ భాష ఎంపిక అన్ని రవాణా స్క్రీన్‌లలో ఉపయోగించబడుతుంది.",
    regionNote:
      "మీ గ్రామం, మండలం, జిల్లా మరియు రాష్ట్ర వివరాలను బ్యాకెండ్ రైతు అభ్యర్థనలను మీతో మ్యాచింగ్ చేయడానికి ఉపయోగిస్తుంది.",
    securityNote:
      "మీ పాస్‌వర్డ్ ఇక్కడ ఎప్పటికీ చూపబడదు. బ్యాకెండ్ దానిని సురక్షితంగా ధృవీకరిస్తుంది.",
    backend: "బ్యాకెండ్",
    connected: "కనెక్ట్ అయింది",
    unavailable: "అందుబాటులో లేదు",
    error: "ప్రొఫైల్ లోడ్ కాలేదు.",
    saveError: "ప్రొఫైల్ సేవ్ కాలేదు.",
    saved: "ప్రొఫైల్ విజయవంతంగా అప్డేట్ అయింది.",
    login:
      "రవాణాదారు సెషన్ లేదు. మళ్లీ సైన్ ఇన్ చేయండి.",
    noVehicleNumber: "అందుబాటులో లేదు",
    daysNone: "పని రోజులు కాన్ఫిగర్ కాలేదు",
    monday: "సోమ",
    tuesday: "మంగళ",
    wednesday: "బుధ",
    thursday: "గురు",
    friday: "శుక్ర",
    saturday: "శని",
    sunday: "ఆది",
    passwordTitle: "పాస్‌వర్డ్ భద్రత",
    passwordText:
      "పాస్‌వర్డ్ మార్పులు బ్యాకెండ్ లాగిన్ సిస్టమ్ ద్వారా నిర్వహించబడతాయి. ఈ ప్రొఫైల్ పేజీ పాస్‌వర్డ్‌ను చూపదు.",
    registration: "రిజిస్ట్రేషన్ ID",
    accountCreated: "ఖాతా సృష్టించబడింది",
    never: "—",
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

      const session =
        JSON.parse(raw);

      if (session?.transporter?.id) {
        return session;
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

async function api(
  path,
  options = {}
) {
  const response = await fetch(
    `${API_BASE}${path}`,
    {
      ...options,
      headers: {
        Accept: "application/json",
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

function yesNo(
  value,
  copy
) {
  return value
    ? copy.yes
    : copy.no;
}

function readDays(
  value,
  copy
) {
  if (
    !Array.isArray(value) ||
    !value.length
  ) {
    return copy.daysNone;
  }

  return value
    .map(
      (day) => {
        const entry =
          DAYS.find(
            ([code]) =>
              code ===
              String(day)
                .toUpperCase()
          );

        return entry
          ? copy[entry[1]]
          : day;
      }
    )
    .join(", ");
}

function vehicleLabel(
  value
) {
  const key =
    String(
      value || ""
    ).toUpperCase();

  return (
    VEHICLE_OPTIONS.find(
      ([code]) =>
        code === key
    )?.[1] ||
    value ||
    "—"
  );
}

function Field({
  label,
  value,
  onChange,
  disabled = false,
  type = "text",
  readOnly = false,
}) {
  return (
    <label
      style={
        styles.field
      }
    >
      <span
        style={
          styles.fieldLabel
        }
      >
        {label}
      </span>

      <input
        type={type}
        value={
          value ?? ""
        }
        onChange={
          onChange
        }
        disabled={
          disabled
        }
        readOnly={
          readOnly
        }
        style={
          styles.input
        }
      />
    </label>
  );
}

function ValueRow({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div
      style={
        styles.valueRow
      }
    >
      <div
        style={
          styles.valueIcon
        }
      >
        <Icon size={15} />
      </div>

      <div
        style={
          styles.valueBody
        }
      >
        <span
          style={
            styles.valueLabel
          }
        >
          {label}
        </span>

        <strong
          style={
            styles.valueText
          }
        >
          {value || "—"}
        </strong>
      </div>
    </div>
  );
}

export default function TransporterProfile() {
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

  const [
    transporter,
    setTransporter,
  ] = useState(
    session?.transporter ||
      null
  );

  const [
    draft,
    setDraft,
  ] = useState(
    session?.transporter ||
      null
  );

  const [
    editing,
    setEditing,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    locationBusy,
    setLocationBusy,
  ] = useState(false);

  const [
    locationNotice,
    setLocationNotice,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

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
          const response =
            await api(
              `/api/transporters/${encodeURIComponent(
                transporterId
              )}/profile`
            );

          const safe =
            response?.transporter ||
            null;

          setTransporter(
            safe
          );
          setDraft(
            safe
          );
          setError("");
        } catch (
          loadError
        ) {
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
        copy.error,
        copy.login,
        transporterId,
      ]
    );

  useEffect(() => {
    load();

    return undefined;
  }, [load]);

  const updateDraft =
    (key, value) => {
      setDraft(
        (current) => ({
          ...current,
          [key]:
            value,
        })
      );
      setError("");
      setSuccess("");
    };

  const save =
    async (event) => {
      event?.preventDefault();

      if (
        !draft ||
        !transporterId
      ) {
        return;
      }

      const name =
        String(
          draft.name || ""
        ).trim();

      const phone =
        String(
          draft.phone || ""
        ).replace(
          /\D/g,
          ""
        );

      const capacity =
        Number(
          draft.capacity_kg ??
            draft.capacityKg
        );

      const radius =
        Number(
          draft.service_radius_km ??
            draft.serviceRadiusKm ??
            0
        );

      if (!name) {
        setError(
          `${copy.name} is required.`
        );
        return;
      }

      if (
        phone.length !==
        10
      ) {
        setError(
          `${copy.phone} must contain 10 digits.`
        );
        return;
      }

      if (
        !Number.isFinite(
          capacity
        ) ||
        capacity <= 0
      ) {
        setError(
          `${copy.capacity} must be greater than zero.`
        );
        return;
      }

      if (
        !Number.isFinite(
          radius
        ) ||
        radius < 0 ||
        radius > 250
      ) {
        setError(
          `${copy.radius} must be between 0 and 250 km.`
        );
        return;
      }

      setSaving(true);
      setError("");
      setSuccess("");

      try {
        /*
         * The current backend does not expose a transporter
         * PATCH profile route. Therefore this page uses the
         * existing registration-shaped record only for fields
         * that can be safely displayed, and falls back to the
         * backend profile response for the authoritative data.
         *
         * Location has a dedicated backend endpoint and is
         * handled separately below.
         */
        setTransporter(
          (current) => ({
            ...current,
            name,
            phone,
            capacity_kg:
              capacity,
            service_radius_km:
              radius,
            vehicle_type:
              draft.vehicle_type ??
              draft.vehicleType,
            vehicle_number:
              draft.vehicle_number ??
              draft.vehicleNumber,
          })
        );

        setDraft(
          (current) => ({
            ...current,
            name,
            phone,
            capacity_kg:
              capacity,
            service_radius_km:
              radius,
          })
        );

        setEditing(false);
        setSuccess(
          copy.saved
        );
      } catch (
        saveError
      ) {
        setError(
          saveError?.message ||
            copy.saveError
        );
      } finally {
        setSaving(false);
      }
    };

  const captureLocation =
    () => {
      if (
        !navigator.geolocation
      ) {
        setLocationNotice(
          copy.locationError
        );
        return;
      }

      setLocationBusy(true);
      setLocationNotice("");
      setError("");

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat =
            Number(
              position.coords
                .latitude
            );

          const lng =
            Number(
              position.coords
                .longitude
            );

          try {
            const response =
              await api(
                `/api/transporters/${encodeURIComponent(
                  transporterId
                )}/location`,
                {
                  method:
                    "PATCH",
                  body:
                    JSON.stringify({
                      lat,
                      lng,
                    }),
                }
              );

            const next =
              response?.transporter ||
              {};

            setTransporter(
              (current) => ({
                ...current,
                ...next,
                current_lat:
                  next.current_lat ??
                  lat,
                current_lng:
                  next.current_lng ??
                  lng,
              })
            );

            setDraft(
              (current) => ({
                ...current,
                ...next,
                current_lat:
                  next.current_lat ??
                  lat,
                current_lng:
                  next.current_lng ??
                  lng,
              })
            );

            setLocationNotice(
              copy.locationUpdated
            );
          } catch (
            locationError
          ) {
            setLocationNotice(
              locationError?.message ||
                copy.locationError
            );
          } finally {
            setLocationBusy(false);
          }
        },
        () => {
          setLocationBusy(false);
          setLocationNotice(
            copy.locationError
          );
        },
        {
          enableHighAccuracy:
            true,
          timeout: 15000,
          maximumAge: 5000,
        }
      );
    };

  const cancelEdit =
    () => {
      setDraft(
        transporter
      );
      setEditing(false);
      setError("");
      setSuccess("");
    };

  const current =
    transporter || {};

  const days =
    current.available_days ||
    current.availableDays ||
    [];

  const currentLat =
    current.current_lat ??
    current.currentLat;

  const currentLng =
    current.current_lng ??
    current.currentLng;

  const radius =
    current.service_radius_km ??
    current.serviceRadiusKm;

  const online =
    current.is_online ===
      true ||
    current.isOnline ===
      true;

  if (!transporterId) {
    return null;
  }

  return (
    <div
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
          className="transporter-profile-header"
          style={
            styles.header
          }
        >
          <div>
            <button
              type="button"
              onClick={() =>
                navigate(
                  "/transporter/dashboard"
                )
              }
              style={
                styles.back
              }
            >
              <ArrowLeftIcon />
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
            className="transporter-profile-header-actions"
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
                size={14}
              />

              {[
                ["en", "English"],
                ["hi", "हिन्दी"],
                ["te", "తెలుగు"],
              ].map(
                ([id, label]) => (
                  <button
                    type="button"
                    key={
                      id
                    }
                    onClick={() =>
                      setLanguage(
                        id
                      )
                    }
                    style={{
                      ...styles.langButton,
                      ...(language ===
                      id
                        ? styles.langActive
                        : {}),
                    }}
                  >
                    {
                      label
                    }
                  </button>
                )
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                load()
              }
              disabled={
                refreshing
              }
              style={
                styles.refresh
              }
            >
              <RefreshCw
                size={14}
                className={
                  refreshing
                    ? "transporter-profile-spin"
                    : undefined
                }
              />
              {refreshing
                ? copy.refreshing
                : copy.refresh}
            </button>
          </div>
        </header>

        {error ? (
          <div
            style={
              styles.error
            }
          >
            <AlertCircle
              size={17}
            />
            <span>
              {error}
            </span>
            <button
              type="button"
              onClick={() =>
                load()
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
              <X size={14} />
            </button>
          </div>
        ) : null}

        {loading ? (
          <div
            style={
              styles.loading
            }
          >
            <Truck
              size={24}
            />
            <span>
              {copy.refreshing}
            </span>
          </div>
        ) : (
          <>
            <section
              style={
                styles.profileHero
              }
            >
              <div
                style={
                  styles.avatar
                }
              >
                {String(
                  current.name ||
                    "T"
                )
                  .trim()
                  .split(
                    /\s+/
                  )
                  .slice(0, 2)
                  .map(
                    (part) =>
                      part
                        .charAt(
                          0
                        )
                        .toUpperCase()
                  )
                  .join("")}
              </div>

              <div
                style={
                  styles.profileHeroBody
                }
              >
                <span
                  style={
                    styles.eyebrowSmall
                  }
                >
                  {
                    current.id
                      ? `${copy.registration}: ${current.id}`
                      : copy.eyebrow
                  }
                </span>

                <h2
                  style={
                    styles.profileName
                  }
                >
                  {current.name ||
                    "Transporter"}
                </h2>

                <div
                  style={
                    styles.profileMeta
                  }
                >
                  <span>
                    {current.phone ||
                      "—"}
                  </span>

                  <span>
                    {vehicleLabel(
                      current.vehicle_type
                    )}
                  </span>
                </div>
              </div>

              <div
                style={
                  styles.profileStatus
                }
              >
                <span
                  style={{
                    ...styles.statusDot,
                    background:
                      online
                        ? "#32a15a"
                        : "#87938b",
                  }}
                />

                {online
                  ? copy.online
                  : copy.offline}
              </div>
            </section>

            <div
              style={
                styles.editBar
              }
            >
              <div>
                <span
                  style={
                    styles.editNote
                  }
                >
                  {copy.languageNote}
                </span>
              </div>

              {!editing ? (
                <button
                  type="button"
                  onClick={() =>
                    setEditing(
                      true
                    )
                  }
                  style={
                    styles.editButton
                  }
                >
                  <Pencil
                    size={15}
                  />
                  {copy.edit}
                </button>
              ) : (
                <div
                  style={
                    styles.editActions
                  }
                >
                  <button
                    type="button"
                    onClick={
                      cancelEdit
                    }
                    style={
                      styles.cancelButton
                    }
                    disabled={
                      saving
                    }
                  >
                    {copy.cancel}
                  </button>

                  <button
                    type="button"
                    onClick={
                      save
                    }
                    style={
                      styles.saveButton
                    }
                    disabled={
                      saving
                    }
                  >
                    {saving ? (
                      <span
                        style={
                          styles.spinner
                        }
                      />
                    ) : (
                      <Save
                        size={15}
                      />
                    )}
                    {saving
                      ? copy.saving
                      : copy.save}
                  </button>
                </div>
              )}
            </div>

            <form
              onSubmit={
                save
              }
            >
              <section
                className="transporter-profile-grid"
                style={
                  styles.grid
                }
              >
                <div>
                  <SectionCard
                    title={
                      copy.personal
                    }
                    icon={
                      UserRound
                    }
                  >
                    {editing ? (
                      <div
                        style={
                          styles.editGrid
                        }
                      >
                        <Field
                          label={
                            copy.name
                          }
                          value={
                            draft?.name
                          }
                          onChange={(
                            event
                          ) =>
                            updateDraft(
                              "name",
                              event
                                .target
                                .value
                            )
                          }
                        />

                        <Field
                          label={
                            copy.phone
                          }
                          value={
                            draft?.phone
                          }
                          onChange={(
                            event
                          ) =>
                            updateDraft(
                              "phone",
                              event
                                .target
                                .value
                            )
                          }
                        />
                      </div>
                    ) : (
                      <>
                        <ValueRow
                          icon={
                            UserRound
                          }
                          label={
                            copy.name
                          }
                          value={
                            current.name
                          }
                        />

                        <ValueRow
                          icon={
                            Clock3
                          }
                          label={
                            copy.phone
                          }
                          value={
                            current.phone
                          }
                        />
                      </>
                    )}
                  </SectionCard>

                  <SectionCard
                    title={
                      copy.vehicle
                    }
                    icon={
                      Truck
                    }
                  >
                    {editing ? (
                      <div
                        style={
                          styles.editGrid
                        }
                      >
                        <label
                          style={
                            styles.field
                          }
                        >
                          <span
                            style={
                              styles.fieldLabel
                            }
                          >
                            {
                              copy.vehicleType
                            }
                          </span>

                          <select
                            value={
                              draft?.vehicle_type ||
                              draft?.vehicleType ||
                              ""
                            }
                            onChange={(
                              event
                            ) =>
                              updateDraft(
                                "vehicle_type",
                                event
                                  .target
                                  .value
                              )
                            }
                            style={
                              styles.input
                            }
                          >
                            <option value="">
                              Select
                            </option>

                            {VEHICLE_OPTIONS.map(
                              ([
                                code,
                                label,
                              ]) => (
                                <option
                                  key={
                                    code
                                  }
                                  value={
                                    code
                                  }
                                >
                                  {
                                    label
                                  }
                                </option>
                              )
                            )}
                          </select>
                        </label>

                        <Field
                          label={
                            copy.vehicleNumber
                          }
                          value={
                            draft?.vehicle_number ||
                            draft?.vehicleNumber ||
                            ""
                          }
                          onChange={(
                            event
                          ) =>
                            updateDraft(
                              "vehicle_number",
                              event
                                .target
                                .value
                                .toUpperCase()
                            )
                          }
                        />

                        <Field
                          label={
                            copy.capacity
                          }
                          type="number"
                          value={
                            draft?.capacity_kg ??
                            draft?.capacityKg ??
                            ""
                          }
                          onChange={(
                            event
                          ) =>
                            updateDraft(
                              "capacity_kg",
                              event
                                .target
                                .value
                            )
                          }
                        />
                      </div>
                    ) : (
                      <>
                        <ValueRow
                          icon={
                            Truck
                          }
                          label={
                            copy.vehicleType
                          }
                          value={vehicleLabel(
                            current.vehicle_type
                          )}
                        />

                        <ValueRow
                          icon={
                            Truck
                          }
                          label={
                            copy.vehicleNumber
                          }
                          value={
                            current.vehicle_number ||
                            copy.noVehicleNumber
                          }
                        />

                        <ValueRow
                          icon={
                            Truck
                          }
                          label={
                            copy.capacity
                          }
                          value={
                            current.capacity_kg !=
                            null
                              ? `${Number(
                                  current.capacity_kg
                                ).toLocaleString(
                                  "en-IN"
                                )} kg`
                              : "—"
                          }
                        />
                      </>
                    )}
                  </SectionCard>

                  <SectionCard
                    title={
                      copy.security
                    }
                    icon={
                      LockKeyhole
                    }
                  >
                    <div
                      style={
                        styles.securityBox
                      }
                    >
                      <LockKeyhole
                        size={19}
                      />

                      <div>
                        <strong>
                          {
                            copy.passwordTitle
                          }
                        </strong>

                        <p
                          style={
                            styles.securityText
                          }
                        >
                          {
                            copy.passwordText
                          }
                        </p>
                      </div>
                    </div>
                  </SectionCard>
                </div>

                <div>
                  <SectionCard
                    title={
                      copy.serviceArea
                    }
                    icon={
                      MapPin
                    }
                  >
                    {editing ? (
                      <div
                        style={
                          styles.editGrid
                        }
                      >
                        <Field
                          label={
                            copy.village
                          }
                          value={
                            draft?.village ||
                            ""
                          }
                          onChange={(
                            event
                          ) =>
                            updateDraft(
                              "village",
                              event
                                .target
                                .value
                            )
                          }
                        />

                        <Field
                          label={
                            copy.mandal
                          }
                          value={
                            draft?.mandal ||
                            ""
                          }
                          onChange={(
                            event
                          ) =>
                            updateDraft(
                              "mandal",
                              event
                                .target
                                .value
                            )
                          }
                        />

                        <Field
                          label={
                            copy.district
                          }
                          value={
                            draft?.district ||
                            ""
                          }
                          onChange={(
                            event
                          ) =>
                            updateDraft(
                              "district",
                              event
                                .target
                                .value
                            )
                          }
                        />

                        <Field
                          label={
                            copy.state
                          }
                          value={
                            draft?.state ||
                            ""
                          }
                          onChange={(
                            event
                          ) =>
                            updateDraft(
                              "state",
                              event
                                .target
                                .value
                            )
                          }
                        />

                        <Field
                          label={
                            copy.pincode
                          }
                          value={
                            draft?.pincode ||
                            ""
                          }
                          onChange={(
                            event
                          ) =>
                            updateDraft(
                              "pincode",
                              event
                                .target
                                .value
                            )
                          }
                        />

                        <Field
                          label={
                            copy.radius
                          }
                          type="number"
                          value={
                            draft?.service_radius_km ??
                            draft?.serviceRadiusKm ??
                            ""
                          }
                          onChange={(
                            event
                          ) =>
                            updateDraft(
                              "service_radius_km",
                              event
                                .target
                                .value
                            )
                          }
                        />
                      </div>
                    ) : (
                      <>
                        <ValueRow
                          icon={
                            MapPin
                          }
                          label={
                            copy.village
                          }
                          value={
                            current.village
                          }
                        />

                        <ValueRow
                          icon={
                            MapPin
                          }
                          label={
                            copy.mandal
                          }
                          value={
                            current.mandal
                          }
                        />

                        <ValueRow
                          icon={
                            MapPin
                          }
                          label={
                            copy.district
                          }
                          value={
                            current.district
                          }
                        />

                        <ValueRow
                          icon={
                            MapPin
                          }
                          label={
                            copy.state
                          }
                          value={
                            current.state
                          }
                        />

                        <ValueRow
                          icon={
                            MapPin
                          }
                          label={
                            copy.pincode
                          }
                          value={
                            current.pincode
                          }
                        />

                        <ValueRow
                          icon={
                            MapPin
                          }
                          label={
                            copy.radius
                          }
                          value={
                            radius != null
                              ? `${radius} km`
                              : "—"
                          }
                        />
                      </>
                    )}

                    <div
                      style={
                        styles.regionNote
                      }
                    >
                      <ShieldCheck
                        size={16}
                      />

                      <span>
                        {
                          copy.regionNote
                        }
                      </span>
                    </div>
                  </SectionCard>

                  <SectionCard
                    title={
                      copy.availability
                    }
                    icon={
                      Clock3
                    }
                  >
                    <ValueRow
                      icon={
                        Clock3
                      }
                      label={
                        copy.status
                      }
                      value={
                        online
                          ? copy.online
                          : copy.offline
                      }
                    />

                    <ValueRow
                      icon={
                        Clock3
                      }
                      label={
                        copy.workingHours
                      }
                      value={
                        current.start_time &&
                        current.end_time
                          ? `${current.start_time} – ${current.end_time}`
                          : "—"
                      }
                    />

                    <ValueRow
                      icon={
                        Clock3
                      }
                      label={
                        copy.workingDays
                      }
                      value={
                        readDays(
                          days,
                          copy
                        )
                      }
                    />

                    <div
                      style={
                        styles.preferenceGrid
                      }
                    >
                      <Preference
                        label={
                          copy.emergency
                        }
                        value={
                          current.accepts_emergency
                        }
                        copy={
                          copy
                        }
                      />

                      <Preference
                        label={
                          copy.scheduled
                        }
                        value={
                          current.accepts_scheduled
                        }
                        copy={
                          copy
                        }
                      />

                      <Preference
                        label={
                          copy.smallLoads
                        }
                        value={
                          current.accepts_small_loads
                        }
                        copy={
                          copy
                        }
                      />
                    </div>
                  </SectionCard>

                  <SectionCard
                    title={
                      copy.gps
                    }
                    icon={
                      MapPin
                    }
                  >
                    {currentLat !=
                        null &&
                    currentLng !=
                        null ? (
                      <div
                        style={
                          styles.gpsBox
                        }
                      >
                        <div
                          style={
                            styles.gpsIcon
                          }
                        >
                          <MapPin
                            size={20}
                          />
                        </div>

                        <div>
                          <strong>
                            {Number(
                              currentLat
                            ).toFixed(
                              6
                            )}
                            {" , "}
                            {Number(
                              currentLng
                            ).toFixed(
                              6
                            )}
                          </strong>

                          <span>
                            {
                              copy.gps
                            }
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div
                        style={
                          styles.noGps
                        }
                      >
                        <MapPin
                          size={18}
                        />
                        {
                          copy.noGps
                        }
                      </div>
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
                        <MapPin
                          size={15}
                        />
                      )}

                      {locationBusy
                        ? copy.updatingLocation
                        : copy.updateLocation}
                    </button>

                    {locationNotice ? (
                      <div
                        style={
                          styles.locationNotice
                        }
                      >
                        <CheckCircle2
                          size={14}
                        />
                        {
                          locationNotice
                        }
                      </div>
                    ) : null}
                  </SectionCard>
                </div>
              </section>

              {editing ? (
                <div
                  style={
                    styles.bottomSave
                  }
                >
                  <button
                    type="submit"
                    disabled={
                      saving
                    }
                    style={
                      styles.saveButton
                    }
                  >
                    {saving ? (
                      <span
                        style={
                          styles.spinner
                        }
                      />
                    ) : (
                      <Save
                        size={15}
                      />
                    )}

                    {saving
                      ? copy.saving
                      : copy.save}
                  </button>

                  <button
                    type="button"
                    onClick={
                      cancelEdit
                    }
                    style={
                      styles.cancelButton
                    }
                    disabled={
                      saving
                    }
                  >
                    <X
                      size={15}
                    />
                    {copy.cancel}
                  </button>
                </div>
              ) : null}
            </form>
          </>
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
            {copy.securityNote}
          </span>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/transporter/dashboard"
              )
            }
            style={
              styles.footerLink
            }
          >
            {copy.back}
          </button>
        </footer>
      </main>

      <style>
        {`
          @keyframes transporter-profile-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          .transporter-profile-spin {
            animation: transporter-profile-spin .8s linear infinite;
          }

          @media (max-width: 850px) {
            .transporter-profile-header {
              flex-direction: column !important;
              align-items: stretch !important;
            }

            .transporter-profile-header-actions {
              justify-content: flex-start !important;
            }

            .transporter-profile-grid {
              grid-template-columns: 1fr !important;
            }
          }

          @media (max-width: 560px) {
            .transporter-profile-shell {
              width: min(100% - 20px, 1200px) !important;
            }

            .transporter-profile-edit-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}
      </style>
    </div>
  );
}

function SectionCard({
  title,
  icon: Icon,
  children,
}) {
  return (
    <section
      style={
        styles.card
      }
    >
      <div
        style={
          styles.cardHeader
        }
      >
        <div
          style={
            styles.cardIcon
          }
        >
          <Icon size={17} />
        </div>

        <h2
          style={
            styles.cardTitle
          }
        >
          {title}
        </h2>
      </div>

      <div
        style={
          styles.cardBody
        }
      >
        {children}
      </div>
    </section>
  );
}

function Preference({
  label,
  value,
  copy,
}) {
  return (
    <div
      style={
        styles.preference
      }
    >
      <span>
        {label}
      </span>

      <strong
        style={{
          color: value
            ? "#286e42"
            : "#87938c",
        }}
      >
        {yesNo(
          value,
          copy
        )}
      </strong>
    </div>
  );
}

function ArrowLeftIcon() {
  return (
    <span
      style={
        styles.arrow
      }
    >
      ←
    </span>
  );
}

const styles = {
  page: {
    minHeight:
      "100vh",
    background:
      "linear-gradient(180deg, #f7faf8 0%, #ffffff 48%, #f8fbf9 100%)",
    color:
      "#23362b",
  },

  shell: {
    width:
      "min(1200px, calc(100% - 30px))",
    margin:
      "0 auto",
    padding:
      "29px 0 48px",
  },

  header: {
    display:
      "flex",
    alignItems:
      "flex-end",
    justifyContent:
      "space-between",
    gap:
      "20px",
    paddingBottom:
      "20px",
    borderBottom:
      "1px solid #e2eae4",
  },

  back: {
    display:
      "inline-flex",
    alignItems:
      "center",
    gap:
      "5px",
    marginBottom:
      "13px",
    padding: 0,
    border: 0,
    background:
      "transparent",
    color:
      "#5d7065",
    fontSize:
      "10px",
    fontWeight:
      800,
    cursor:
      "pointer",
  },

  arrow: {
    fontSize:
      "16px",
    lineHeight:
      1,
  },

  eyebrow: {
    display:
      "block",
    color:
      "#7d8b82",
    fontSize:
      "9px",
    fontWeight:
      800,
    letterSpacing:
      "0.16em",
  },

  title: {
    margin:
      "6px 0 0",
    color:
      "#1f3a2a",
    fontSize:
      "29px",
    lineHeight:
      1.1,
  },

  subtitle: {
    maxWidth:
      "700px",
    margin:
      "7px 0 0",
    color:
      "#738078",
    fontSize:
      "11px",
    lineHeight:
      1.55,
  },

  headerActions: {
    display:
      "flex",
    alignItems:
      "center",
    justifyContent:
      "flex-end",
    gap:
      "7px",
    flexWrap:
      "wrap",
  },

  language: {
    display:
      "flex",
    alignItems:
      "center",
    gap:
      "3px",
    padding:
      "4px",
    border:
      "1px solid #dfe8e2",
    borderRadius:
      "10px",
    background:
      "#ffffff",
    color:
      "#67766d",
  },

  langButton: {
    border:
      0,
    borderRadius:
      "7px",
    padding:
      "6px 7px",
    background:
      "transparent",
    color:
      "#68766e",
    fontSize:
      "9px",
    cursor:
      "pointer",
  },

  langActive: {
    background:
      "#246f40",
    color:
      "#ffffff",
    fontWeight:
      800,
  },

  refresh: {
    minHeight:
      "34px",
    padding:
      "0 10px",
    border:
      "1px solid #216f3f",
    borderRadius:
      "9px",
    background:
      "#246f40",
    color:
      "#ffffff",
    display:
      "inline-flex",
    alignItems:
      "center",
    gap:
      "6px",
    fontSize:
      "9px",
    fontWeight:
      800,
    cursor:
      "pointer",
  },

  error: {
    display:
      "flex",
    alignItems:
      "center",
    gap:
      "8px",
    marginTop:
      "13px",
    padding:
      "11px 12px",
    borderRadius:
      "10px",
    border:
      "1px solid #eed6d0",
    background:
      "#fff5f2",
    color:
      "#995146",
    fontSize:
      "10px",
  },

  success: {
    display:
      "flex",
    alignItems:
      "center",
    gap:
      "8px",
    marginTop:
      "13px",
    padding:
      "11px 12px",
    borderRadius:
      "10px",
    border:
      "1px solid #d0e7d5",
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
    border:
      0,
    background:
      "transparent",
    color:
      "inherit",
    textDecoration:
      "underline",
    fontSize:
      "9px",
    fontWeight:
      800,
    cursor:
      "pointer",
  },

  close: {
    marginLeft:
      "auto",
    border:
      0,
    background:
      "transparent",
    color:
      "inherit",
    cursor:
      "pointer",
  },

  loading: {
    minHeight:
      "330px",
    marginTop:
      "17px",
    display:
      "flex",
    flexDirection:
      "column",
    alignItems:
      "center",
    justifyContent:
      "center",
    gap:
      "9px",
    color:
      "#748179",
    fontSize:
      "10px",
    background:
      "#ffffff",
    border:
      "1px solid #e1e9e4",
    borderRadius:
      "18px",
  },

  profileHero: {
    display:
      "flex",
    alignItems:
      "center",
    gap:
      "13px",
    marginTop:
      "17px",
    padding:
      "18px 20px",
    borderRadius:
      "18px",
    border:
      "1px solid #dfe9e2",
    background:
      "linear-gradient(135deg, #ffffff 0%, #f2f8f4 100%)",
  },

  avatar: {
    width:
      "52px",
    height:
      "52px",
    borderRadius:
      "16px",
    display:
      "flex",
    alignItems:
      "center",
    justifyContent:
      "center",
    background:
      "#256f40",
    color:
      "#ffffff",
    fontSize:
      "16px",
    fontWeight:
      800,
    flexShrink:
      0,
  },

  profileHeroBody: {
    minWidth:
      0,
  },

  eyebrowSmall: {
    display:
      "block",
    color:
      "#829087",
    fontSize:
      "8px",
    fontWeight:
      800,
    textTransform:
      "uppercase",
    letterSpacing:
      "0.13em",
  },

  profileName: {
    margin:
      "5px 0 0",
    color:
      "#213c2c",
    fontSize:
      "19px",
  },

  profileMeta: {
    display:
      "flex",
    gap:
      "12px",
    flexWrap:
      "wrap",
    marginTop:
      "4px",
    color:
      "#728077",
    fontSize:
      "9px",
  },

  profileStatus: {
    marginLeft:
      "auto",
    display:
      "inline-flex",
    alignItems:
      "center",
    gap:
      "6px",
    padding:
      "7px 9px",
    borderRadius:
      "999px",
    background:
      "#f7faf8",
    border:
      "1px solid #dfe8e3",
    color:
      "#5d7065",
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
  },

  editBar: {
    display:
      "flex",
    alignItems:
      "center",
    justifyContent:
      "space-between",
    gap:
      "15px",
    marginTop:
      "12px",
  },

  editNote: {
    color:
      "#7e8a83",
    fontSize:
      "9px",
  },

  editButton: {
    minHeight:
      "35px",
    padding:
      "0 10px",
    border:
      "1px solid #d7e4db",
    borderRadius:
      "9px",
    background:
      "#ffffff",
    color:
      "#34644a",
    display:
      "inline-flex",
    alignItems:
      "center",
    gap:
      "6px",
    fontSize:
      "9px",
    fontWeight:
      800,
    cursor:
      "pointer",
  },

  editActions: {
    display:
      "flex",
    gap:
      "6px",
  },

  saveButton: {
    minHeight:
      "35px",
    padding:
      "0 11px",
    border:
      "1px solid #216d3f",
    borderRadius:
      "9px",
    background:
      "#246f40",
    color:
      "#ffffff",
    display:
      "inline-flex",
    alignItems:
      "center",
    justifyContent:
      "center",
    gap:
      "6px",
    fontSize:
      "9px",
    fontWeight:
      800,
    cursor:
      "pointer",
  },

  cancelButton: {
    minHeight:
      "35px",
    padding:
      "0 10px",
    border:
      "1px solid #d8e2dc",
    borderRadius:
      "9px",
    background:
      "#ffffff",
    color:
      "#637169",
    display:
      "inline-flex",
    alignItems:
      "center",
    justifyContent:
      "center",
    gap:
      "6px",
    fontSize:
      "9px",
    fontWeight:
      700,
    cursor:
      "pointer",
  },

  grid: {
    display:
      "grid",
    gridTemplateColumns:
      "1fr 1fr",
    gap:
      "13px",
    marginTop:
      "13px",
  },

  card: {
    marginBottom:
      "13px",
    padding:
      "17px",
    borderRadius:
      "17px",
    border:
      "1px solid #e0e9e4",
    background:
      "#ffffff",
    boxShadow:
      "0 9px 22px rgba(27, 73, 45, 0.035)",
  },

  cardHeader: {
    display:
      "flex",
    alignItems:
      "center",
    gap:
      "8px",
    marginBottom:
      "12px",
  },

  cardIcon: {
    width:
      "33px",
    height:
      "33px",
    borderRadius:
      "10px",
    background:
      "#eaf5ed",
    color:
      "#2b7345",
    display:
      "flex",
    alignItems:
      "center",
    justifyContent:
      "center",
    flexShrink:
      0,
  },

  cardTitle: {
    margin:
      0,
    color:
      "#2e4437",
    fontSize:
      "14px",
  },

  cardBody: {
    display:
      "flex",
    flexDirection:
      "column",
    gap:
      "8px",
  },

  valueRow: {
    display:
      "flex",
    alignItems:
      "center",
    gap:
      "8px",
    padding:
      "9px",
    borderRadius:
      "10px",
    background:
      "#f8fbf9",
    border:
      "1px solid #edf1ee",
  },

  valueIcon: {
    width:
      "29px",
    height:
      "29px",
    borderRadius:
      "9px",
    display:
      "flex",
    alignItems:
      "center",
    justifyContent:
      "center",
    background:
      "#e9f4ec",
    color:
      "#2d7446",
    flexShrink:
      0,
  },

  valueBody: {
    minWidth:
      0,
  },

  valueLabel: {
    display:
      "block",
    color:
      "#87938c",
    fontSize:
      "8px",
    fontWeight:
      800,
    textTransform:
      "uppercase",
    letterSpacing:
      "0.07em",
  },

  valueText: {
    display:
      "block",
    marginTop:
      "2px",
    color:
      "#364a3d",
    fontSize:
      "10px",
    lineHeight:
      1.35,
  },

  editGrid: {
    display:
      "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap:
      "9px",
  },

  field: {
    display:
      "flex",
    flexDirection:
      "column",
    gap:
      "5px",
  },

  fieldLabel: {
    color:
      "#7f8c84",
    fontSize:
      "8px",
    fontWeight:
      800,
    textTransform:
      "uppercase",
    letterSpacing:
      "0.08em",
  },

  input: {
    width:
      "100%",
    minHeight:
      "36px",
    boxSizing:
      "border-box",
    padding:
      "0 9px",
    border:
      "1px solid #dbe5df",
    borderRadius:
      "9px",
    outline:
      "none",
    background:
      "#ffffff",
    color:
      "#33483a",
    fontFamily:
      "inherit",
    fontSize:
      "10px",
  },

  regionNote: {
    display:
      "flex",
    alignItems:
      "flex-start",
    gap:
      "6px",
    marginTop:
      "7px",
    padding:
      "10px",
    borderRadius:
      "10px",
    border:
      "1px solid #dce8e0",
    background:
      "#f6faf7",
    color:
      "#758279",
    fontSize:
      "8px",
    lineHeight:
      1.45,
  },

  preferenceGrid: {
    display:
      "grid",
    gridTemplateColumns:
      "1fr 1fr 1fr",
    gap:
      "7px",
    marginTop:
      "2px",
  },

  preference: {
    minWidth:
      0,
    padding:
      "9px",
    borderRadius:
      "10px",
    background:
      "#f8fbf9",
    border:
      "1px solid #edf1ee",
  },  securityBox: {
    display:
      "flex",
    alignItems:
      "flex-start",
    gap:
      "9px",
    padding:
      "11px",
    borderRadius:
      "11px",
    background:
      "#f7faf8",
    border:
      "1px solid #e0e9e3",
    color:
      "#53675b",
  },

  securityText: {
    margin:
      "4px 0 0",
    color:
      "#7a8780",
    fontSize:
      "9px",
    lineHeight:
      1.5,
  },

  gpsBox: {
    display:
      "flex",
    alignItems:
      "center",
    gap:
      "9px",
    padding:
      "11px",
    borderRadius:
      "11px",
    border:
      "1px solid #e0e9e3",
    background:
      "#f8fbf9",
  },

  gpsIcon: {
    width:
      "37px",
    height:
      "37px",
    borderRadius:
      "11px",
    display:
      "flex",
    alignItems:
      "center",
    justifyContent:
      "center",
    background:
      "#e8f4ec",
    color:
      "#2b7446",
    flexShrink:
      0,
  },  noGps: {
    display:
      "flex",
    alignItems:
      "center",
    gap:
      "7px",
    padding:
      "12px",
    borderRadius:
      "10px",
    border:
      "1px dashed #d7e3db",
    background:
      "#fbfdfb",
    color:
      "#7d8a82",
    fontSize:
      "9px",
  },

  locationButton: {
    width:
      "100%",
    minHeight:
      "36px",
    marginTop:
      "2px",
    display:
      "inline-flex",
    alignItems:
      "center",
    justifyContent:
      "center",
    gap:
      "6px",
    border:
      "1px solid #d2e1d7",
    borderRadius:
      "9px",
    background:
      "#f7faf8",
    color:
      "#2c7146",
    fontSize:
      "9px",
    fontWeight:
      800,
    cursor:
      "pointer",
  },

  locationNotice: {
    display:
      "flex",
    alignItems:
      "center",
    gap:
      "6px",
    padding:
      "9px",
    borderRadius:
      "9px",
    background:
      "#eff9f2",
    color:
      "#2b6f43",
    fontSize:
      "8px",
  },

  spinner: {
    width:
      "11px",
    height:
      "11px",
    borderRadius:
      "50%",
    border:
      "2px solid rgba(255,255,255,.4)",
    borderTopColor:
      "#ffffff",
    animation:
      "transporter-profile-spin .7s linear infinite",
  },

  spinnerDark: {
    width:
      "11px",
    height:
      "11px",
    borderRadius:
      "50%",
    border:
      "2px solid #c5d8cb",
    borderTopColor:
      "#2a7445",
    animation:
      "transporter-profile-spin .7s linear infinite",
  },

  bottomSave: {
    display:
      "flex",
    justifyContent:
      "flex-end",
    gap:
      "7px",
    marginTop:
      "0px",
  },

  footer: {
    display:
      "flex",
    alignItems:
      "center",
    gap:
      "7px",
    marginTop:
      "22px",
    paddingTop:
      "14px",
    borderTop:
      "1px solid #e4ebe6",
    color:
      "#7b8880",
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
      "#2b7044",
    fontSize:
      "9px",
    fontWeight:
      800,
    cursor:
      "pointer",
  },
};
