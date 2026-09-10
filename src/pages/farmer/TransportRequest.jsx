import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Crosshair,
  MapPin,
  Navigation,
  RefreshCw,
  ShieldCheck,
  Truck,
  UserRound,
  XCircle,
  Star,
  Phone,
  CalendarDays,
  Package,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useSearchParams,
} from "react-router";

import Header from "../../components/Header";
import { useLanguage } from "../../translations/LanguageContext";
import { getCurrentFarmer } from "../../data/appStore";

const RAW_API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const API_BASE = String(RAW_API_URL)
  .replace(/\/+$/, "")
  .replace(/\/api$/i, "");

const API = `${API_BASE}/api`;

const ACTIVE_REQUEST_STATUSES = new Set([
  "REQUESTED",
  "ASSIGNED",
  "EN_ROUTE_TO_FARMER",
  "CROP_PICKED_UP",
  "EN_ROUTE_TO_CENTER",
  "DELIVERED",
]);

const COPY = {
  en: {
    eyebrow: "KRISHISETU • FARMER",
    title: "Vehicle for this booking",
    subtitle: "Your booking details are already linked. We only need the pickup location and final confirmation.",
    booking: "BOOKING",
    token: "Token",
    crop: "Crop",
    quantity: "Quantity",
    pickup: "Pickup location",
    center: "Procurement center",
    date: "Arrival",
    route: "Route",
    fromFarm: "From your farm",
    toCenter: "To procurement center",
    location: "Farmer location",
    accountLocation: "From your farmer profile",
    useGps: "Use current GPS",
    locating: "Getting location…",
    gpsSaved: "GPS location saved",
    noGps: "GPS not saved. You can still request using your farm address / village.",
    nearby: "Active transporters near pickup",
    nearbyText: "Online vehicles with enough capacity are shown first.",
    noNearby: "No active transporter was found in the current radius yet.",
    refresh: "Refresh",
    request: "Request vehicle",
    requesting: "Sending request…",
    requested: "Vehicle request created",
    requestedText: "Your request is now visible to eligible transporters.",
    requestId: "Request ID",
    track: "Track transport",
    manage: "Manage transport",
    backToken: "Back to token",
    server: "Unable to create the transport request.",
    login: "Please log in as a farmer before requesting transport.",
    load: "Loading booking details…",
    noBooking: "This transport page was opened without a booking. Go back to your token and use Request Vehicle there.",
    capacity: "Capacity",
    distance: "Distance",
    km: "km",
    online: "Online",
    trips: "trips",
    rating: "rating",
    waiting: "Waiting for transporter",
    smart: "Smart matching",
    smartText: "Nearby matching uses your current GPS, transporter service radius, crop quantity and online status. Your registered area is used as a fallback.",
    estimatedFare: "Estimated fare (optional)",
    estimatedFareHint: "Leave blank or enter ₹0 if you do not know the transport cost. This is only an estimate, not the final fare.",
    fareUnknown: "Fare to be agreed with transporter",
    invalidFare: "Please enter a valid fare of ₹0 or more, or leave it blank.",
  },
  hi: {
    eyebrow: "KRISHISETU • किसान",
    title: "इस बुकिंग के लिए वाहन",
    subtitle: "आपकी बुकिंग पहले से जुड़ी है। अब केवल पिकअप लोकेशन और अंतिम पुष्टि चाहिए।",
    booking: "बुकिंग",
    token: "टोकन",
    crop: "फसल",
    quantity: "मात्रा",
    pickup: "पिकअप स्थान",
    center: "खरीद केंद्र",
    date: "आगमन",
    route: "मार्ग",
    fromFarm: "आपके खेत से",
    toCenter: "खरीद केंद्र तक",
    location: "किसान का स्थान",
    accountLocation: "किसान प्रोफाइल से",
    useGps: "वर्तमान GPS लें",
    locating: "लोकेशन मिल रही है…",
    gpsSaved: "GPS लोकेशन सेव हो गई",
    noGps: "GPS सेव नहीं है। खेत का पता / गांव फिर भी उपयोग किया जा सकता है।",
    nearby: "पिकअप के पास सक्रिय ट्रांसपोर्टर",
    nearbyText: "पर्याप्त क्षमता वाले ऑनलाइन वाहन पहले दिखाए जाते हैं।",
    noNearby: "अभी इस क्षेत्र में कोई सक्रिय ट्रांसपोर्टर नहीं मिला।",
    refresh: "रिफ्रेश",
    request: "वाहन रिक्वेस्ट करें",
    requesting: "रिक्वेस्ट भेजी जा रही है…",
    requested: "वाहन रिक्वेस्ट बन गई",
    requestedText: "आपकी रिक्वेस्ट योग्य ट्रांसपोर्टरों को दिखाई दे रही है।",
    requestId: "रिक्वेस्ट आईडी",
    track: "परिवहन ट्रैक करें",
    manage: "परिवहन प्रबंधित करें",
    backToken: "टोकन पर वापस",
    server: "परिवहन रिक्वेस्ट नहीं बन सकी।",
    login: "परिवहन रिक्वेस्ट करने से पहले किसान के रूप में लॉग इन करें।",
    load: "बुकिंग विवरण लोड हो रहा है…",
    noBooking: "यह पेज बिना बुकिंग के खोला गया है। टोकन पर वापस जाएं और Request Vehicle दबाएं।",
    capacity: "क्षमता",
    distance: "दूरी",
    km: "किमी",
    online: "ऑनलाइन",
    trips: "यात्राएं",
    rating: "रेटिंग",
    waiting: "ट्रांसपोर्टर की प्रतीक्षा",
    smart: "स्मार्ट मैचिंग",
    smartText: "मैचिंग आपके क्षेत्र, फसल की मात्रा और उपलब्ध वाहनों के आधार पर होती है।",
    estimatedFare: "अनुमानित किराया (वैकल्पिक)",
    estimatedFareHint: "परिवहन लागत पता न हो तो खाली छोड़ें या ₹0 लिखें। यह केवल अनुमान है, अंतिम किराया नहीं।",
    fareUnknown: "किराया ट्रांसपोर्टर के साथ तय होगा",
    invalidFare: "कृपया ₹0 या उससे अधिक सही किराया लिखें, या खाली छोड़ें।",
  },
  te: {
    eyebrow: "KRISHISETU • రైతు",
    title: "ఈ బుకింగ్ కోసం వాహనం",
    subtitle: "మీ బుకింగ్ ఇప్పటికే లింక్ అయింది. పికప్ లొకేషన్ మరియు చివరి నిర్ధారణ మాత్రమే అవసరం.",
    booking: "బుకింగ్",
    token: "టోకెన్",
    crop: "పంట",
    quantity: "పరిమాణం",
    pickup: "పికప్ స్థానం",
    center: "కొనుగోలు కేంద్రం",
    date: "ఆగమనం",
    route: "మార్గం",
    fromFarm: "మీ పొలం నుండి",
    toCenter: "కొనుగోలు కేంద్రానికి",
    location: "రైతు స్థానం",
    accountLocation: "రైతు ప్రొఫైల్ నుండి",
    useGps: "ప్రస్తుత GPS ఉపయోగించండి",
    locating: "లొకేషన్ పొందుతోంది…",
    gpsSaved: "GPS లొకేషన్ సేవ్ అయింది",
    noGps: "GPS సేవ్ కాలేదు. పొలం చిరునామా / గ్రామాన్ని ఉపయోగించవచ్చు.",
    nearby: "పికప్ దగ్గర యాక్టివ్ ట్రాన్స్‌పోర్టర్లు",
    nearbyText: "సరిపడే సామర్థ్యం ఉన్న ఆన్‌లైన్ వాహనాలు ముందుగా కనిపిస్తాయి.",
    noNearby: "ఈ పరిధిలో ప్రస్తుతం యాక్టివ్ ట్రాన్స్‌పోర్టర్ లభించలేదు.",
    refresh: "రిఫ్రెష్",
    request: "వాహనం అభ్యర్థించండి",
    requesting: "అభ్యర్థన పంపుతోంది…",
    requested: "వాహన అభ్యర్థన సృష్టించబడింది",
    requestedText: "మీ అభ్యర్థన సరిపడే ట్రాన్స్‌పోర్టర్లకు కనిపిస్తోంది.",
    requestId: "అభ్యర్థన ఐడి",
    track: "రవాణా ట్రాక్ చేయండి",
    manage: "రవాణా నిర్వహించండి",
    backToken: "టోకెన్‌కు తిరిగి",
    server: "రవాణా అభ్యర్థన సృష్టించలేకపోయాము.",
    login: "రవాణా అభ్యర్థించడానికి ముందు రైతుగా లాగిన్ అవ్వండి.",
    load: "బుకింగ్ వివరాలు లోడ్ అవుతున్నాయి…",
    noBooking: "బుకింగ్ లేకుండా ఈ పేజీ తెరవబడింది. టోకెన్‌కు వెళ్లి Request Vehicle నొక్కండి.",
    capacity: "సామర్థ్యం",
    distance: "దూరం",
    km: "కి.మీ",
    online: "ఆన్‌లైన్",
    trips: "ట్రిప్స్",
    rating: "రేటింగ్",
    waiting: "ట్రాన్స్‌పోర్టర్ కోసం వేచి ఉంది",
    smart: "స్మార్ట్ మ్యాచ్ింగ్",
    smartText: "మీ ప్రాంతం, పంట పరిమాణం మరియు అందుబాటులో ఉన్న వాహనాల ఆధారంగా మ్యాచ్ చేస్తుంది.",
    estimatedFare: "అంచనా రవాణా ఛార్జీ (ఐచ్ఛికం)",
    estimatedFareHint: "ఖర్చు తెలియకపోతే ఖాళీగా ఉంచండి లేదా ₹0 నమోదు చేయండి. ఇది అంచనా మాత్రమే, తుది ఛార్జీ కాదు.",
    fareUnknown: "రవాణాదారుతో ఛార్జీ నిర్ణయించబడుతుంది",
    invalidFare: "₹0 లేదా అంతకంటే ఎక్కువ సరైన ఛార్జీ నమోదు చేయండి లేదా ఖాళీగా ఉంచండి.",
  },
};

function clean(value) {
  return String(value ?? "").trim();
}

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function first(...values) {
  for (const value of values) {
    if (clean(value)) return value;
  }
  return "";
}

function farmerIdOf(farmer) {
  return first(
    farmer?.id,
    farmer?.farmerId,
    farmer?.farmer_id
  );
}

function tokenOf(booking) {
  return first(
    booking?.token,
    booking?.booking_token,
    booking?.bookingToken
  );
}

function cropLabel(value) {
  const raw = clean(value);
  if (!raw) return "Produce";
  return raw
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}

function formatDate(value, language) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return clean(value);
  return d.toLocaleDateString(
    language === "hi" ? "hi-IN" : language === "te" ? "te-IN" : "en-IN",
    { day: "numeric", month: "short", year: "numeric" }
  );
}

function formatTime(value) {
  const raw = clean(value);
  if (!raw) return "";
  const match = raw.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return raw;
  let h = Number(match[1]);
  const m = match[2];
  const suffix = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${suffix}`;
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const a = num(lat1);
  const b = num(lng1);
  const c = num(lat2);
  const d = num(lng2);
  if ([a, b, c, d].some(v => v === null)) return null;
  const R = 6371;
  const p1 = a * Math.PI / 180;
  const p2 = c * Math.PI / 180;
  const dp = (c - a) * Math.PI / 180;
  const dl = (d - b) * Math.PI / 180;
  const x =
    Math.sin(dp / 2) ** 2 +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function locationFromFarmer(farmer) {
  return {
    village: first(farmer?.village, farmer?.village_name),
    villageId: first(farmer?.villageId, farmer?.village_id),
    mandal: first(farmer?.mandal, farmer?.mandal_name),
    mandalId: first(farmer?.mandalId, farmer?.mandal_id),
    district: first(farmer?.district, farmer?.district_name),
    districtId: first(farmer?.districtId, farmer?.district_id),
    state: first(farmer?.state, farmer?.state_name),
    stateId: first(farmer?.stateId, farmer?.state_id),
    address: first(
      farmer?.address,
      farmer?.farmAddress,
      farmer?.farm_address,
      farmer?.pickupAddress,
      farmer?.pickup_address
    ),
    lat: first(
      farmer?.pickupLat,
      farmer?.pickup_lat,
      farmer?.latitude,
      farmer?.lat,
      farmer?.currentLat,
      farmer?.current_lat
    ),
    lng: first(
      farmer?.pickupLng,
      farmer?.pickup_lng,
      farmer?.longitude,
      farmer?.lng,
      farmer?.currentLng,
      farmer?.current_lng
    ),
  };
}

function displayPickup(location) {
  const parts = [
    location?.address,
    location?.village,
    location?.mandal,
    location?.district,
    location?.state,
  ].filter(Boolean);
  return parts.join(", ") || "Farmer pickup location";
}

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
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
      data?.message || data?.error?.message || `Request failed (${response.status})`
    );
  }

  return data || {};
}

function transporterDistance(transporter, location) {
  const backendDistance = num(
    first(
      transporter?.distanceKm,
      transporter?.distance_km
    )
  );

  if (backendDistance !== null) return backendDistance;

  return haversineKm(
    location?.lat,
    location?.lng,
    first(transporter?.current_lat, transporter?.currentLat),
    first(transporter?.current_lng, transporter?.currentLng)
  );
}

function sameRegion(transporter, location) {
  const fv = clean(location?.villageId);
  const fd = clean(location?.districtId);
  const fs = clean(location?.stateId);

  const tv = clean(first(transporter?.village_id, transporter?.villageId));
  const td = clean(first(transporter?.district_id, transporter?.districtId));
  const ts = clean(first(transporter?.state_id, transporter?.stateId));

  if (fv && fd && fs && tv && td && ts) {
    return fv.toLowerCase() === tv.toLowerCase()
      && fd.toLowerCase() === td.toLowerCase()
      && fs.toLowerCase() === ts.toLowerCase();
  }

  const fvn = clean(location?.village).toLowerCase();
  const fdn = clean(location?.district).toLowerCase();
  const fsn = clean(location?.state).toLowerCase();
  const tvn = clean(first(transporter?.village, transporter?.village_name)).toLowerCase();
  const tdn = clean(first(transporter?.district, transporter?.district_name)).toLowerCase();
  const tsn = clean(first(transporter?.state, transporter?.state_name)).toLowerCase();

  if (fvn && fdn && fsn && tvn && tdn && tsn) {
    return fvn === tvn && fdn === tdn && fsn === tsn;
  }

  return false;
}

function filterNearbyTransporters(list, location, quantityKg) {
  const quantity = Number(quantityKg) || 0;
  const hasPickupGps =
    num(location?.lat) !== null &&
    num(location?.lng) !== null;

  return list
    .map(item => {
      const capacity = Number(
        first(item?.capacity_kg, item?.capacityKg, 0)
      ) || 0;
      const distance = transporterDistance(item, location);
      const serviceRadius = Number(
        first(item?.service_radius_km, item?.serviceRadiusKm, 0)
      ) || 0;

      const transporterHasGps =
        num(item?.current_lat) !== null &&
        num(item?.current_lng) !== null;

      const gpsEligible =
        hasPickupGps &&
        transporterHasGps &&
        serviceRadius > 0 &&
        distance !== null &&
        distance <= serviceRadius;

      const regionEligible = sameRegion(item, location);

      return {
        ...item,
        _capacity: capacity,
        _distance: distance,
        _radius: serviceRadius,
        _gpsEligible: gpsEligible,
        _regionEligible: regionEligible,
      };
    })
    .filter(item => {
      if (item.is_online === false) return false;
      if (item._capacity < quantity) return false;

      /*
       * GPS is the primary matching rule.
       * Registered region is only the fallback when GPS cannot
       * establish a distance match.
       */
      if (hasPickupGps) {
        return item._gpsEligible || (!item._distance && item._regionEligible);
      }

      return item._regionEligible;
    })
    .sort((a, b) => {
      const aGps = a._gpsEligible ? 0 : 1;
      const bGps = b._gpsEligible ? 0 : 1;
      if (aGps !== bGps) return aGps - bGps;

      const ad = a._distance ?? Number.POSITIVE_INFINITY;
      const bd = b._distance ?? Number.POSITIVE_INFINITY;
      if (ad !== bd) return ad - bd;

      const ar = Number(a.rating || 0);
      const br = Number(b.rating || 0);
      if (ar !== br) return br - ar;

      return Number(b.total_trips || 0) - Number(a.total_trips || 0);
    });
}

export default function TransportRequest() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { language } = useLanguage();
  const t = COPY[COPY[language] ? language : "en"];

  const bookingId = clean(params.get("booking"));
  const currentFarmer = useMemo(() => getCurrentFarmer(), []);

  const [farmer, setFarmer] = useState(currentFarmer);
  const [booking, setBooking] = useState(null);
  const [centers, setCenters] = useState([]);
  const [location, setLocation] = useState(locationFromFarmer(currentFarmer));
  const [transporters, setTransporters] = useState([]);
  const [loading, setLoading] = useState(Boolean(bookingId));
  const [loadingTransporters, setLoadingTransporters] = useState(false);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [createdRequest, setCreatedRequest] = useState(null);
  const [estimatedFare, setEstimatedFare] = useState("");

  const farmerId = farmerIdOf(farmer);

  const bookingCenter = useMemo(() => {
    if (!booking?.center_id && !booking?.centerId) return null;
    const id = String(first(booking?.center_id, booking?.centerId));
    return centers.find(item => String(item.id) === id) || null;
  }, [booking, centers]);

  const crop = first(booking?.crop_name, booking?.cropName, booking?.crop);
  const quantity = Number(
    first(
      booking?.actual_quantity,
      booking?.actualQuantity,
      booking?.estimated_quantity,
      booking?.estimatedQuantity,
      0
    )
  );
  const centerName = first(
    booking?.center_name,
    booking?.centerName,
    bookingCenter?.name,
    booking?.center_id,
    "Procurement center"
  );
  const centerAddress = first(
    booking?.center_address,
    booking?.centerAddress,
    bookingCenter?.address,
    bookingCenter?.village
  );
  const requestedDate = first(booking?.date, booking?.requested_date);
  const requestedStart = first(booking?.slot_start, booking?.requested_slot_start);
  const requestedEnd = first(booking?.slot_end, booking?.requested_slot_end);
  const token = tokenOf(booking);

  const pickupText = useMemo(() => displayPickup(location), [location]);

  const loadTransporters = useCallback(async () => {
    if (!farmerId) return;
    setLoadingTransporters(true);
    try {
      const response = await api("/transporters?online=true");
      const list = Array.isArray(response?.transporters)
        ? response.transporters
        : [];
      setTransporters(
        filterNearbyTransporters(list, location, quantity)
      );
    } catch (err) {
      console.warn("Nearby transporters:", err);
      setTransporters([]);
    } finally {
      setLoadingTransporters(false);
    }
  }, [farmerId, location, quantity]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!farmerId) {
        setLoading(false);
        return;
      }

      try {
        let resolvedFarmer = farmer;

        try {
          const serverFarmer = await api(
            `/farmers/${encodeURIComponent(farmerId)}`
          );
          if (serverFarmer?.farmer) {
            resolvedFarmer = {
              ...farmer,
              ...serverFarmer.farmer,
            };
            if (!cancelled) {
              setFarmer(resolvedFarmer);
              setLocation(locationFromFarmer(resolvedFarmer));
            }
          }
        } catch {
          // Existing app-store farmer remains usable.
        }

        const centerResponse = await api("/centers");
        if (!cancelled) {
          setCenters(
            Array.isArray(centerResponse?.centers)
              ? centerResponse.centers.filter(c => Number(c.active ?? 1) === 1)
              : []
          );
        }

        if (!bookingId) {
          if (!cancelled) setLoading(false);
          return;
        }

        const bookingResponse = await api(
          `/bookings/${encodeURIComponent(bookingId)}`
        );

        if (!cancelled) {
          setBooking(bookingResponse?.booking || null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || t.server);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [bookingId, farmerId]);

  useEffect(() => {
    if (!booking && !bookingId) return;
    if (!farmerId) return;
    loadTransporters();
  }, [booking, bookingId, farmerId, loadTransporters]);

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Your browser does not support GPS location.");
      return;
    }

    setLocating(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      async position => {
        const lat = Number(position.coords.latitude).toFixed(7);
        const lng = Number(position.coords.longitude).toFixed(7);

        // Keep the farmer's saved hierarchy immediately, then ask the
        // backend location service to resolve the live GPS position. This
        // avoids losing village/district/state matching when GPS is used.
        setLocation(prev => ({
          ...prev,
          lat,
          lng,
        }));

        try {
          const resolved = await api(
            `/locations/resolve?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`
          );
          const live = resolved?.location;
          if (live) {
            setLocation(prev => ({
              ...prev,
              village: first(live.village, prev.village),
              villageId: first(live.villageId, prev.villageId),
              mandal: first(live.mandal, prev.mandal),
              mandalId: first(live.mandalId, prev.mandalId),
              district: first(live.district, prev.district),
              districtId: first(live.districtId, prev.districtId),
              state: first(live.state, prev.state),
              stateId: first(live.stateId, prev.stateId),
              lat,
              lng,
            }));
          }
        } catch (resolveError) {
          console.warn("GPS region resolve failed; keeping registered farmer region.", resolveError);
        }

        setLocating(false);
      },
      geoError => {
        setLocating(false);
        setError(
          geoError?.code === 1
            ? "Location permission was denied. Your saved farmer location will still be used."
            : "Unable to read current location."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 30000,
      }
    );
  }, []);

  const submit = useCallback(async () => {
    if (!farmerId) {
      setError(t.login);
      return;
    }

    if (!bookingId || !booking?.id) {
      setError(t.noBooking);
      return;
    }

    const fareRaw = clean(estimatedFare);
    const fareNumber = fareRaw === "" ? null : Number(fareRaw);

    if (
      fareRaw !== "" &&
      (!Number.isFinite(fareNumber) || fareNumber < 0)
    ) {
      setError(t.invalidFare);
      return;
    }

    setSaving(true);
    setError("");

    try {
      const body = {
        farmerId,
        phone: first(farmer?.phone),
        centerId: first(booking?.center_id, booking?.centerId),
        crop: first(booking?.crop),
        quantityKg: quantity,
        pickupAddress: pickupText,
        pickupLat: location.lat ? Number(location.lat) : null,
        pickupLng: location.lng ? Number(location.lng) : null,
        pickupNote: "Pickup from farmer location",
        requestedDate,
        requestedSlotStart: requestedStart,
        requestedSlotEnd: requestedEnd,
        estimatedFare: fareNumber === null || fareNumber === 0 ? null : fareNumber,
        notes: "Requested from Farmer Token.",
      };

      const response = await api(
        `/bookings/${encodeURIComponent(bookingId)}/transport-request`,
        {
          method: "POST",
          body: JSON.stringify(body),
        }
      );

      const request = response?.request || null;
      const candidates = Array.isArray(response?.candidates)
        ? response.candidates
        : [];

      if (!request?.id) {
        throw new Error(t.server);
      }

      setCreatedRequest({
        ...request,
        candidates: candidates.length
          ? candidates
          : transporters,
      });
    } catch (err) {
      setError(err?.message || t.server);
    } finally {
      setSaving(false);
    }
  }, [
    booking,
    bookingId,
    farmer,
    farmerId,
    estimatedFare,
    location,
    pickupText,
    quantity,
    requestedDate,
    requestedEnd,
    requestedStart,
    t.server,
    transporters,
  ]);

  if (createdRequest) {
    const requestId = createdRequest.id;
    const candidateList = Array.isArray(createdRequest.candidates)
      ? createdRequest.candidates
      : [];

    return (
      <div className="ks-transport-page">
        <style>{STYLES}</style>
        <Header />

        <main className="ks-transport-shell">
          <section className="ks-success-card">
            <div className="ks-success-icon">
              <CheckCircle2 size={34} />
            </div>
            <span className="ks-eyebrow">KRISHISETU • LOGISTICS</span>
            <h1>{t.requested}</h1>
            <p>{t.requestedText}</p>

            <div className="ks-success-meta">
              <div>
                <small>{t.requestId}</small>
                <strong>#{requestId}</strong>
              </div>
              <div>
                <small>{t.token}</small>
                <strong>#{token || "—"}</strong>
              </div>
            </div>

            <section className="ks-match-card">
              <div className="ks-section-head">
                <div>
                  <span className="ks-mini-label">{t.nearby}</span>
                  <h2>{candidateList.length}</h2>
                  <p>{t.nearbyText}</p>
                </div>
                <div className="ks-match-badge">
                  <ShieldCheck size={16} /> {t.smart}
                </div>
              </div>

              {candidateList.length ? (
                <div className="ks-transporter-grid">
                  {candidateList.slice(0, 6).map((item, index) => (
                    <TransporterCard
                      key={item.id || `${item.name}-${index}`}
                      item={item}
                      location={location}
                      t={t}
                    />
                  ))}
                </div>
              ) : (
                <div className="ks-no-match">
                  <Truck size={22} />
                  <strong>{t.noNearby}</strong>
                  <span>{t.waiting}</span>
                </div>
              )}
            </section>

            <div className="ks-success-actions">
              <button
                type="button"
                className="ks-btn ks-btn-primary"
                onClick={() => navigate(`/farmer/transport/tracking/${encodeURIComponent(requestId)}`)}
              >
                <Navigation size={16} /> {t.track}
              </button>
              <button
                type="button"
                className="ks-btn ks-btn-light"
                onClick={() => navigate(`/farmer/logistics?request=${encodeURIComponent(requestId)}`)}
              >
                <Truck size={16} /> {t.manage}
              </button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="ks-transport-page">
        <style>{STYLES}</style>
        <Header />
        <main className="ks-transport-shell">
          <div className="ks-loading-card">
            <RefreshCw className="ks-spin" size={22} />
            <span>{t.load}</span>
          </div>
        </main>
      </div>
    );
  }

  if (!farmerId) {
    return (
      <div className="ks-transport-page">
        <style>{STYLES}</style>
        <Header />
        <main className="ks-transport-shell">
          <button className="ks-back" type="button" onClick={() => navigate(-1)}>
            <ArrowLeft size={17} /> {t.backToken}
          </button>
          <div className="ks-error-card">
            <UserRound size={25} />
            <h2>{t.login}</h2>
            <p>Open the Farmer Token page after signing in and press Request Vehicle.</p>
          </div>
        </main>
      </div>
    );
  }

  if (bookingId && !booking) {
    return (
      <div className="ks-transport-page">
        <style>{STYLES}</style>
        <Header />
        <main className="ks-transport-shell">
          <button className="ks-back" type="button" onClick={() => navigate(-1)}>
            <ArrowLeft size={17} /> {t.backToken}
          </button>
          <div className="ks-error-card">
            <XCircle size={25} />
            <h2>{t.noBooking}</h2>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="ks-transport-page">
      <style>{STYLES}</style>
      <Header />

      <main className="ks-transport-shell">
        <button className="ks-back" type="button" onClick={() => navigate(-1)}>
          <ArrowLeft size={17} /> {t.backToken}
        </button>

        <header className="ks-page-head">
          <div>
            <span className="ks-eyebrow">{t.eyebrow}</span>
            <h1>{t.title}{token ? ` • #${token}` : ""}</h1>
            <p>{t.subtitle}</p>
          </div>
          <div className="ks-live-pill">
            <span /> {t.nearby}
          </div>
        </header>

        {error && (
          <div className="ks-alert">
            <XCircle size={17} />
            <span>{error}</span>
          </div>
        )}

        <section className="ks-booking-summary">
          <div className="ks-summary-head">
            <div className="ks-summary-token">
              <Package size={18} />
              <div>
                <small>{t.booking}</small>
                <strong>{booking?.id || bookingId}</strong>
              </div>
            </div>
            <span className="ks-confirmed-pill">
              <CheckCircle2 size={14} /> Confirmed
            </span>
          </div>

          <div className="ks-summary-grid">
            <Summary icon={<Package size={17} />} label={t.crop} value={cropLabel(crop)} />
            <Summary icon={<Package size={17} />} label={t.quantity} value={`${quantity.toLocaleString("en-IN")} kg`} />
            <Summary icon={<MapPin size={17} />} label={t.center} value={centerName} note={centerAddress} />
            <Summary
              icon={<CalendarDays size={17} />}
              label={t.date}
              value={formatDate(requestedDate, language)}
              note={`${formatTime(requestedStart)}${requestedEnd ? ` – ${formatTime(requestedEnd)}` : ""}`}
            />
          </div>
        </section>

        <section className="ks-fare-panel">
          <div className="ks-fare-icon">₹</div>
          <div className="ks-fare-copy">
            <strong>{t.estimatedFare}</strong>
            <span>{t.estimatedFareHint}</span>
          </div>
          <div className="ks-fare-input-wrap">
            <span>₹</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="1"
              value={estimatedFare}
              onChange={event => setEstimatedFare(event.target.value)}
              placeholder="0"
              aria-label={t.estimatedFare}
            />
          </div>
        </section>

        <div className="ks-main-grid">
          <section className="ks-card">
            <div className="ks-card-head">
              <div>
                <span className="ks-mini-label">01</span>
                <h2>{t.route}</h2>
              </div>
            </div>

            <div className="ks-route-card">
              <div className="ks-route-point">
                <div className="ks-route-icon green"><MapPin size={18} /></div>
                <div>
                  <small>{t.fromFarm}</small>
                  <strong>{pickupText}</strong>
                </div>
              </div>
              <div className="ks-route-line"><span /></div>
              <div className="ks-route-point">
                <div className="ks-route-icon blue"><Navigation size={18} /></div>
                <div>
                  <small>{t.toCenter}</small>
                  <strong>{centerName}</strong>
                </div>
              </div>
            </div>

            <div className="ks-location-panel">
              <div className="ks-location-icon"><Crosshair size={18} /></div>
              <div className="ks-location-copy">
                <small>{t.location}</small>
                <strong>{pickupText}</strong>
                <span>{location.lat && location.lng ? `Current GPS • ${Number(location.lat).toFixed(5)}, ${Number(location.lng).toFixed(5)}${location.village ? ` · Registered area: ${location.village}` : ""}` : `Registered area: ${location.village || "Farmer profile"} • ${t.noGps}`}</span>
              </div>
              <button
                type="button"
                className="ks-btn ks-btn-light ks-gps-btn"
                onClick={locate}
                disabled={locating}
              >
                <Crosshair size={15} /> {locating ? t.locating : t.useGps}
              </button>
            </div>
          </section>

          <aside className="ks-card ks-match-side">
            <div className="ks-card-head">
              <div>
                <span className="ks-mini-label">02</span>
                <h2>{t.nearby}</h2>
                <p>{t.nearbyText}</p>
              </div>
              <button
                className="ks-icon-btn"
                type="button"
                onClick={loadTransporters}
                disabled={loadingTransporters}
                title={t.refresh}
              >
                <RefreshCw size={16} className={loadingTransporters ? "ks-spin" : ""} />
              </button>
            </div>

            {loadingTransporters ? (
              <div className="ks-side-loading">
                <RefreshCw className="ks-spin" size={20} />
                <span>{t.load}</span>
              </div>
            ) : transporters.length ? (
              <div className="ks-transporter-list">
                {transporters.slice(0, 4).map((item, index) => (
                  <TransporterCard
                    compact
                    key={item.id || `${item.name}-${index}`}
                    item={item}
                    location={location}
                    t={t}
                  />
                ))}
              </div>
            ) : (
              <div className="ks-no-match compact">
                <Truck size={24} />
                <strong>{t.noNearby}</strong>
                <span>{t.smartText}</span>
              </div>
            )}

            <div className="ks-smart-note">
              <ShieldCheck size={16} />
              <div>
                <strong>{t.smart}</strong>
                <span>{t.smartText}</span>
              </div>
            </div>
          </aside>
        </div>

        <section className="ks-bottom-bar">
          <div>
            <span className="ks-bottom-title">{t.request}</span>
            <span className="ks-bottom-sub">
              {cropLabel(crop)} • {quantity.toLocaleString("en-IN")} kg • #{token || bookingId}
              {" • "}
              {estimatedFare && Number(estimatedFare) > 0
                ? `₹${Number(estimatedFare).toLocaleString("en-IN")} est.`
                : t.fareUnknown}
            </span>
          </div>
          <button
            type="button"
            className="ks-btn ks-btn-primary ks-request-btn"
            onClick={submit}
            disabled={saving}
          >
            <Truck size={17} />
            {saving ? t.requesting : t.request}
            <Navigation size={15} />
          </button>
        </section>
      </main>
    </div>
  );
}

function Summary({ icon, label, value, note }) {
  return (
    <div className="ks-summary-item">
      <div className="ks-summary-icon">{icon}</div>
      <div>
        <small>{label}</small>
        <strong>{value || "—"}</strong>
        {note ? <span>{note}</span> : null}
      </div>
    </div>
  );
}

function TransporterCard({ item, location, t, compact = false }) {
  const name = first(item?.name, "Transport Partner");
  const vehicle = first(item?.vehicle_type, item?.vehicleType, "Vehicle");
  const vehicleNumber = first(item?.vehicle_number, item?.vehicleNumber);
  const capacity = Number(first(item?.capacity_kg, item?.capacityKg, 0)) || 0;
  const rating = Number(item?.rating || 0);
  const trips = Number(item?.total_trips || item?.totalTrips || 0);
  const distance = transporterDistance(item, location);
  const phone = first(item?.phone, item?.mobile);

  return (
    <article className={`ks-transporter-card${compact ? " compact" : ""}`}>
      <div className="ks-transporter-top">
        <div className="ks-driver-avatar"><UserRound size={18} /></div>
        <div className="ks-driver-main">
          <strong>{name}</strong>
          <span>{vehicle}{vehicleNumber ? ` • ${vehicleNumber}` : ""}</span>
        </div>
        <span className="ks-online-dot" title={t.online} />
      </div>

      <div className="ks-transporter-meta">
        <span><Truck size={13} /> {t.capacity}: {capacity.toLocaleString("en-IN")} kg</span>
        {distance !== null ? (
          <span><Navigation size={13} /> {distance.toFixed(1)} {t.km}</span>
        ) : null}
        {rating > 0 ? (
          <span><Star size={13} /> {rating.toFixed(1)}</span>
        ) : null}
      </div>

      {!compact && (
        <div className="ks-transporter-footer">
          <span>{trips.toLocaleString("en-IN")} {t.trips}</span>
          {phone ? (
            <a href={`tel:${phone}`}>
              <Phone size={13} />
            </a>
          ) : null}
        </div>
      )}
    </article>
  );
}

const STYLES = `
.ks-transport-page{min-height:100vh;background:#f4f8f5;color:#173126}.ks-transport-page *{box-sizing:border-box}.ks-transport-shell{width:min(1160px,calc(100% - 30px));margin:0 auto;padding:28px 0 50px}.ks-back{border:1px solid #d9e4dd;background:#fff;color:#315046;border-radius:11px;padding:10px 13px;display:inline-flex;align-items:center;gap:7px;font:inherit;font-size:12px;font-weight:800;cursor:pointer;margin-bottom:20px}.ks-page-head{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-bottom:20px}.ks-eyebrow{display:block;color:#16824e;font-size:10px;font-weight:950;letter-spacing:.14em}.ks-page-head h1{margin:5px 0 8px;font-size:clamp(29px,4vw,43px);letter-spacing:-.04em;line-height:1.04}.ks-page-head p{margin:0;max-width:720px;color:#6c7c73;font-size:13px;line-height:1.6}.ks-live-pill{display:inline-flex;align-items:center;gap:7px;padding:9px 12px;background:#eff8f2;border:1px solid #cfe5d6;border-radius:999px;color:#2a714b;font-size:10px;font-weight:900;white-space:nowrap}.ks-live-pill>span{width:7px;height:7px;border-radius:50%;background:#2ea45a;box-shadow:0 0 0 4px rgba(46,164,90,.1)}.ks-alert{display:flex;align-items:center;gap:8px;padding:12px 14px;margin-bottom:15px;border:1px solid #efc9c9;border-radius:12px;background:#fff3f3;color:#8c2f2f;font-size:12px}.ks-fare-panel{display:flex;align-items:center;gap:13px;margin-bottom:16px;padding:15px 17px;border:1px solid #dfe9e3;background:#fff;border-radius:17px;box-shadow:0 10px 27px rgba(22,61,43,.04)}.ks-fare-icon{width:39px;height:39px;border-radius:12px;display:grid;place-items:center;background:#eef8f1;color:#23734a;font-weight:950;font-size:18px;flex:none}.ks-fare-copy{min-width:0;flex:1}.ks-fare-copy strong{display:block;font-size:12px;color:#294238}.ks-fare-copy span{display:block;margin-top:4px;color:#74837b;font-size:9px;line-height:1.45}.ks-fare-input-wrap{width:150px;display:flex;align-items:center;border:1px solid #d7e3db;border-radius:11px;background:#fbfdfc;overflow:hidden;flex:none}.ks-fare-input-wrap>span{padding-left:12px;color:#6d7d73;font-weight:850}.ks-fare-input-wrap input{width:100%;min-width:0;border:0;outline:0;background:transparent;padding:11px 10px 11px 7px;font:inherit;font-size:13px;font-weight:850;color:#21372b}.ks-booking-summary,.ks-card,.ks-bottom-bar{border:1px solid #dfe9e3;background:#fff;border-radius:20px;box-shadow:0 12px 32px rgba(22,61,43,.05)}.ks-booking-summary{padding:20px;margin-bottom:16px}.ks-summary-head{display:flex;justify-content:space-between;align-items:center;gap:15px;margin-bottom:16px}.ks-summary-token{display:flex;gap:10px;align-items:center}.ks-summary-token>svg{color:#2d7751}.ks-summary-token small{display:block;color:#87968f;font-size:8px;font-weight:950;letter-spacing:.12em}.ks-summary-token strong{display:block;margin-top:3px;font-size:14px}.ks-confirmed-pill{display:inline-flex;align-items:center;gap:6px;padding:7px 10px;border-radius:999px;background:#eef9f1;color:#237344;border:1px solid #cee7d5;font-size:9px;font-weight:950}.ks-summary-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.ks-summary-item{display:flex;gap:10px;padding:13px;border:1px solid #e5ece7;border-radius:14px;background:#fbfdfc;min-width:0}.ks-summary-icon{width:33px;height:33px;display:grid;place-items:center;border-radius:10px;background:#edf7f0;color:#28734e;flex:none}.ks-summary-item small{display:block;color:#87958e;font-size:9px;font-weight:950;letter-spacing:.08em;text-transform:uppercase}.ks-summary-item strong{display:block;margin-top:4px;font-size:12px;overflow:hidden;text-overflow:ellipsis}.ks-summary-item span{display:block;color:#718078;font-size:10px;margin-top:3px;line-height:1.35}.ks-main-grid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(340px,.85fr);gap:16px}.ks-card-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:18px 19px;border-bottom:1px solid #edf2ef}.ks-mini-label{display:block;color:#8a9891;font-size:8px;font-weight:950;letter-spacing:.12em}.ks-card-head h2{margin:4px 0 0;font-size:17px;letter-spacing:-.02em}.ks-card-head p{margin:4px 0 0;color:#78877f;font-size:10px;line-height:1.45}.ks-route-card{padding:24px 22px}.ks-route-point{display:flex;align-items:center;gap:11px}.ks-route-icon{width:39px;height:39px;border-radius:12px;display:grid;place-items:center;flex:none}.ks-route-icon.green{background:#ebf8ef;color:#25814f}.ks-route-icon.blue{background:#edf5fc;color:#3276a7}.ks-route-point small{display:block;color:#8a9791;font-size:9px;font-weight:950;text-transform:uppercase;letter-spacing:.08em}.ks-route-point strong{display:block;margin-top:4px;font-size:12px;line-height:1.45}.ks-route-line{height:38px;margin-left:19px;border-left:2px dashed #bfd3c7}.ks-location-panel{display:flex;align-items:center;gap:11px;margin:0 19px 19px;padding:14px;border:1px solid #dce9e0;border-radius:14px;background:#f8fcf9}.ks-location-icon{width:35px;height:35px;display:grid;place-items:center;border-radius:10px;background:#eaf7ef;color:#23734a;flex:none}.ks-location-copy{min-width:0;flex:1}.ks-location-copy small{display:block;color:#87948d;font-size:8px;font-weight:950;text-transform:uppercase;letter-spacing:.09em}.ks-location-copy strong{display:block;margin-top:3px;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ks-location-copy span{display:block;margin-top:3px;color:#718078;font-size:9px;line-height:1.45}.ks-btn{min-height:42px;border-radius:11px;padding:0 13px;display:inline-flex;align-items:center;justify-content:center;gap:7px;font:inherit;font-size:11px;font-weight:900;cursor:pointer;transition:.16s ease;text-decoration:none}.ks-btn-primary{border:0;background:#16833f;color:#fff;box-shadow:0 8px 20px rgba(22,131,63,.18)}.ks-btn-primary:hover{background:#0f6832}.ks-btn-light{border:1px solid #d8e4dd;background:#fff;color:#315046}.ks-btn-light:hover{background:#f7faf8}.ks-btn:disabled{opacity:.55;cursor:not-allowed}.ks-gps-btn{flex:none;min-height:38px}.ks-icon-btn{width:35px;height:35px;border:1px solid #dce6df;border-radius:10px;background:#fff;color:#527266;display:grid;place-items:center;cursor:pointer}.ks-match-side{overflow:hidden}.ks-transporter-list{padding:13px;display:grid;gap:9px}.ks-transporter-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:15px}.ks-transporter-card{border:1px solid #dde8e0;border-radius:14px;padding:13px;background:#fbfdfc}.ks-transporter-card.compact{padding:11px}.ks-transporter-top{display:flex;align-items:center;gap:9px}.ks-driver-avatar{width:39px;height:39px;display:grid;place-items:center;border-radius:11px;background:#edf7f0;color:#29764e;flex:none}.ks-driver-main{min-width:0;flex:1}.ks-driver-main strong{display:block;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ks-driver-main span{display:block;margin-top:3px;color:#74847b;font-size:9px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ks-online-dot{width:8px;height:8px;border-radius:50%;background:#36a35c;box-shadow:0 0 0 4px rgba(54,163,92,.10);flex:none}.ks-transporter-meta{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px}.ks-transporter-meta span{display:inline-flex;align-items:center;gap:4px;color:#6f8178;font-size:8px;font-weight:800}.ks-transporter-meta svg{color:#3a7a57}.ks-transporter-footer{display:flex;justify-content:space-between;align-items:center;margin-top:11px;padding-top:10px;border-top:1px dashed #dbe6df;color:#77867e;font-size:9px}.ks-transporter-footer a{width:28px;height:28px;display:grid;place-items:center;border-radius:8px;background:#edf7f0;color:#26734b;text-decoration:none}.ks-side-loading{min-height:175px;display:grid;place-items:center;align-content:center;gap:8px;color:#73837a;font-size:10px}.ks-no-match{margin:13px;padding:23px 14px;border:1px dashed #d6e2da;border-radius:13px;text-align:center;display:grid;place-items:center;gap:6px;color:#7a8981}.ks-no-match svg{color:#39805b}.ks-no-match strong{font-size:10px;color:#53665b}.ks-no-match span{font-size:9px;line-height:1.45}.ks-no-match.compact{margin:13px}.ks-smart-note{display:flex;gap:9px;margin:0 13px 13px;padding:11px;border-radius:12px;background:#f2faf4;border:1px solid #d5eadb;color:#28704a}.ks-smart-note>svg{flex:none;margin-top:1px}.ks-smart-note strong{display:block;font-size:9px}.ks-smart-note span{display:block;margin-top:3px;color:#718178;font-size:8px;line-height:1.45}.ks-bottom-bar{position:sticky;bottom:12px;margin-top:16px;padding:13px 16px;display:flex;justify-content:space-between;align-items:center;gap:15px;z-index:5}.ks-bottom-title{display:block;font-size:11px;font-weight:950;color:#1f3d2d}.ks-bottom-sub{display:block;margin-top:3px;color:#74837b;font-size:9px}.ks-request-btn{min-width:190px}.ks-loading-card,.ks-error-card{min-height:260px;display:grid;place-items:center;align-content:center;gap:9px;border:1px dashed #d5e1d9;border-radius:20px;background:#fff;color:#6e7d75;text-align:center;padding:20px}.ks-error-card h2{margin:2px 0 0;font-size:16px;color:#4d6156}.ks-error-card p{margin:0;color:#718078;font-size:11px}.ks-spin{animation:ksSpin 1s linear infinite}@keyframes ksSpin{to{transform:rotate(360deg)}}.ks-success-card{width:min(930px,100%);margin:25px auto 0;padding:28px;border:1px solid #dfe9e3;border-radius:22px;background:#fff;box-shadow:0 15px 45px rgba(22,61,43,.07);text-align:center}.ks-success-icon{width:66px;height:66px;display:grid;place-items:center;margin:0 auto 12px;border-radius:20px;background:#e5f6ea;color:#2d7c50}.ks-success-card h1{margin:7px 0 6px;font-size:28px}.ks-success-card>p{margin:0 auto;max-width:600px;color:#6d7d74;font-size:12px;line-height:1.6}.ks-success-meta{display:flex;justify-content:center;gap:10px;margin:18px 0}.ks-success-meta>div{min-width:140px;padding:10px 13px;border:1px solid #e1e9e3;border-radius:12px;background:#fbfdfc}.ks-success-meta small{display:block;color:#8b9891;font-size:8px;font-weight:950;text-transform:uppercase}.ks-success-meta strong{display:block;margin-top:4px;font-size:13px}.ks-match-card{margin-top:18px;text-align:left;border:1px solid #dce8e0;border-radius:17px;padding:16px;background:#fbfefc}.ks-section-head{display:flex;justify-content:space-between;align-items:flex-start;gap:15px}.ks-section-head h2{margin:3px 0;font-size:22px}.ks-section-head p{margin:0;color:#738279;font-size:10px}.ks-match-badge{display:inline-flex;align-items:center;gap:6px;padding:8px 10px;border-radius:999px;border:1px solid #cee4d5;background:#eff8f2;color:#28734b;font-size:8px;font-weight:950;white-space:nowrap}.ks-success-actions{display:flex;justify-content:center;gap:9px;margin-top:17px}.ks-success-actions .ks-btn{min-width:155px}@media(max-width:900px){.ks-summary-grid{grid-template-columns:repeat(2,1fr)}.ks-main-grid{grid-template-columns:1fr}.ks-transporter-grid{grid-template-columns:1fr 1fr}}@media(max-width:640px){.ks-transport-shell{width:calc(100% - 16px);padding-top:18px}.ks-page-head,.ks-summary-head,.ks-bottom-bar{flex-direction:column;align-items:stretch}.ks-live-pill{align-self:flex-start}.ks-summary-grid{grid-template-columns:1fr}.ks-transporter-grid{grid-template-columns:1fr}.ks-location-panel{align-items:flex-start;flex-wrap:wrap}.ks-gps-btn{width:100%}.ks-fare-panel{align-items:flex-start;flex-wrap:wrap}.ks-fare-copy{flex-basis:calc(100% - 54px)}.ks-fare-input-wrap{width:100%}.ks-bottom-bar{gap:10px}.ks-request-btn{width:100%}.ks-success-actions{flex-direction:column}.ks-success-actions .ks-btn{width:100%}.ks-success-meta{flex-direction:column}.ks-success-meta>div{width:100%}}
`;
