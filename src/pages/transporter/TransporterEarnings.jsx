import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  Clock3,
  Globe2,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Truck,
  WalletCards,
  XCircle,
} from "lucide-react";

import Header from "../../components/Header";
import { useLanguage } from "../../translations/LanguageContext";

/*
 * Normalize the configured API origin.
 * This page builds its own /api/... paths, so a VITE_API_URL ending in
 * /api would otherwise create /api/api/... and Express will return 404.
 *
 * Supported:
 *   http://localhost:5000
 *   http://localhost:5000/
 *   http://localhost:5000/api
 *   http://localhost:5000/api/
 *   /api (when Vite proxies /api)
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

const COPY = {
  en: {
    eyebrow: "TRANSPORT PARTNER",
    title: "Earnings",
    subtitle:
      "Track completed transport income and the trips that generated it.",
    back: "Back",
    dashboard: "Dashboard",
    refresh: "Refresh",
    refreshing: "Refreshing…",
    language: "Language",
    today: "Today",
    week: "This week",
    month: "This month",
    total: "Lifetime",
    earnings: "Earnings",
    trips: "Trips",
    average: "Average per trip",
    rating: "Rating",
    noRating: "Not rated yet",
    ratings: "Ratings & reviews",
    ratingCount: "ratings",
    jobRating: "Job rating",
    review: "Review",
    noReviews: "No ratings received yet",
    noReviewsText: "Ratings from completed transport jobs will appear here.",
    unrated: "Not rated",
    recent: "Recent completed trips",
    noTrips: "No completed trips yet",
    noTripsText:
      "Your earnings history will appear here after completed transport jobs.",
    crop: "Crop",
    quantity: "Quantity",
    farmer: "Farmer",
    center: "Center",
    fare: "Final fare",
    completed: "Completed",
    updated: "Updated",
    connection: "Backend",
    connected: "Connected",
    unavailable: "Unavailable",
    retry: "Try again",
    login:
      "Your transporter session is missing. Please sign in again.",
    network:
      "KrishiSetu backend is not reachable.",
    protected:
      "Earnings are calculated from completed transport requests recorded by the backend.",
    transportInfo:
      "Your trip amount is added to lifetime earnings only when the backend moves the request to COMPLETED.",
  },
  hi: {
    eyebrow: "परिवहन साझेदार",
    title: "कमाई",
    subtitle:
      "पूरी हुई परिवहन यात्राओं और उनसे हुई आय देखें।",
    back: "वापस",
    dashboard: "डैशबोर्ड",
    refresh: "रिफ्रेश",
    refreshing: "रिफ्रेश हो रहा है…",
    language: "भाषा",
    today: "आज",
    week: "इस सप्ताह",
    month: "इस महीने",
    total: "कुल",
    earnings: "कमाई",
    trips: "यात्राएँ",
    average: "प्रति यात्रा औसत",
    rating: "रेटिंग",
    noRating: "अभी रेटिंग नहीं",
    ratings: "रेटिंग और समीक्षाएँ",
    ratingCount: "रेटिंग",
    jobRating: "यात्रा रेटिंग",
    review: "समीक्षा",
    noReviews: "अभी कोई रेटिंग नहीं मिली",
    noReviewsText: "पूरी हुई परिवहन यात्राओं की रेटिंग यहाँ दिखाई देगी।",
    unrated: "रेटिंग नहीं",
    recent: "हाल की पूरी यात्राएँ",
    noTrips: "अभी कोई पूरी यात्रा नहीं",
    noTripsText:
      "पूरी हुई परिवहन यात्राओं के बाद आपकी कमाई का इतिहास यहाँ दिखेगा।",
    crop: "फसल",
    quantity: "मात्रा",
    farmer: "किसान",
    center: "केंद्र",
    fare: "अंतिम किराया",
    completed: "पूरा हुआ",
    updated: "अपडेट",
    connection: "बैकएंड",
    connected: "कनेक्टेड",
    unavailable: "उपलब्ध नहीं",
    retry: "फिर प्रयास",
    login:
      "परिवहनकर्ता सत्र नहीं मिला। कृपया फिर से साइन इन करें।",
    network:
      "कृषिसेतु बैकएंड से कनेक्शन नहीं हो पाया।",
    protected:
      "कमाई की गणना बैकएंड में दर्ज पूरी हुई परिवहन यात्राओं से होती है।",
    transportInfo:
      "रिक्वेस्ट COMPLETED होने पर ही यात्रा की राशि आपकी कुल कमाई में जुड़ती है।",
  },
  te: {
    eyebrow: "రవాణా భాగస్వామి",
    title: "ఆదాయం",
    subtitle:
      "పూర్తయిన రవాణా ట్రిప్స్ మరియు వాటి ద్వారా వచ్చిన ఆదాయాన్ని చూడండి.",
    back: "వెనక్కి",
    dashboard: "డ్యాష్‌బోర్డ్",
    refresh: "రిఫ్రెష్",
    refreshing: "రిఫ్రెష్ అవుతోంది…",
    language: "భాష",
    today: "ఈ రోజు",
    week: "ఈ వారం",
    month: "ఈ నెల",
    total: "మొత్తం",
    earnings: "ఆదాయం",
    trips: "ట్రిప్స్",
    average: "ఒక్క ట్రిప్ సగటు",
    rating: "రేటింగ్",
    noRating: "ఇంకా రేటింగ్ లేదు",
    ratings: "రేటింగ్స్ & సమీక్షలు",
    ratingCount: "రేటింగ్స్",
    jobRating: "ట్రిప్ రేటింగ్",
    review: "సమీక్ష",
    noReviews: "ఇంకా రేటింగ్స్ లేవు",
    noReviewsText: "పూర్తయిన రవాణా ట్రిప్స్ రేటింగ్స్ ఇక్కడ కనిపిస్తాయి.",
    unrated: "రేటింగ్ లేదు",
    recent: "ఇటీవలి పూర్తయిన ట్రిప్స్",
    noTrips: "ఇంకా పూర్తయిన ట్రిప్స్ లేవు",
    noTripsText:
      "రవాణా ట్రిప్స్ పూర్తయ్యాక మీ ఆదాయ చరిత్ర ఇక్కడ కనిపిస్తుంది.",
    crop: "పంట",
    quantity: "పరిమాణం",
    farmer: "రైతు",
    center: "కేంద్రం",
    fare: "చివరి ఛార్జీ",
    completed: "పూర్తయింది",
    updated: "అప్డేట్",
    connection: "బ్యాకెండ్",
    connected: "కనెక్ట్ అయింది",
    unavailable: "అందుబాటులో లేదు",
    retry: "మళ్లీ ప్రయత్నించండి",
    login:
      "రవాణాదారు సెషన్ లేదు. మళ్లీ సైన్ ఇన్ చేయండి.",
    network:
      "కృషిసేతు బ్యాకెండ్‌కు కనెక్ట్ కాలేకపోయాం.",
    protected:
      "పూర్తయిన రవాణా అభ్యర్థనల ఆధారంగా బ్యాకెండ్ ఆదాయాన్ని లెక్కిస్తుంది.",
    transportInfo:
      "అభ్యర్థన COMPLETED అయినప్పుడు మాత్రమే ట్రిప్ మొత్తం మీ మొత్తం ఆదాయంలో చేరుతుంది.",
  },
};

function getSession() {
  const sources = [
    [SESSION_KEY, window.localStorage],
    [TEMP_SESSION_KEY, window.sessionStorage],
  ];

  for (const [key, storage] of sources) {
    try {
      const raw = storage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (parsed?.transporter?.id) return parsed;
    } catch {
      // Continue.
    }
  }

  const id =
    window.localStorage.getItem(
      TRANSPORTER_ID_KEY
    );

  return id
    ? { transporter: { id } }
    : null;
}

async function api(path, options = {}) {
  const normalizedPath =
    String(path || "").startsWith("/")
      ? String(path || "")
      : `/${String(path || "")}`;

  const response = await fetch(
    `${API_BASE}${normalizedPath}`,
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
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    const error = new Error(
      data?.message ||
        data?.error?.message ||
        data?.error ||
        `Request failed (${response.status})`
    );

    error.status = response.status;
    error.url = response.url;

    throw error;
  }

  return data;
}

function money(value) {
  const n = Number(value);
  return Number.isFinite(n)
    ? `₹${n.toLocaleString("en-IN", {
        maximumFractionDigits: 0,
      })}`
    : "₹0";
}

function number(value) {
  const n = Number(value);
  return Number.isFinite(n)
    ? n.toLocaleString("en-IN")
    : "0";
}

function date(value, language) {
  if (!value) return "—";
  const d = new Date(value);

  if (Number.isNaN(d.getTime())) {
    return String(value);
  }

  const locale =
    language === "hi"
      ? "hi-IN"
      : language === "te"
      ? "te-IN"
      : "en-IN";

  return d.toLocaleString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function completedDate(request) {
  return (
    request.completed_at ||
    request.updated_at ||
    request.delivered_at ||
    request.created_at
  );
}

function withinDay(value) {
  if (!value) return false;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return false;

  const now = new Date();
  return d.toDateString() === now.toDateString();
}

function withinWeek(value) {
  if (!value) return false;

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return false;

  const now = new Date();
  const start = new Date(now);
  const day = start.getDay();
  const mondayOffset =
    day === 0 ? 6 : day - 1;

  start.setDate(
    start.getDate() - mondayOffset
  );
  start.setHours(0, 0, 0, 0);

  return d >= start && d <= now;
}

function withinMonth(value) {
  if (!value) return false;

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return false;

  const now = new Date();

  return (
    d.getFullYear() ===
      now.getFullYear() &&
    d.getMonth() ===
      now.getMonth()
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  sub,
}) {
  return (
    <div style={styles.stat}>
      <div style={styles.statIcon}>
        <Icon size={18} />
      </div>

      <div>
        <span style={styles.statLabel}>
          {label}
        </span>
        <strong style={styles.statValue}>
          {value}
        </strong>

        {sub ? (
          <small style={styles.statSub}>
            {sub}
          </small>
        ) : null}
      </div>
    </div>
  );
}

export default function TransporterEarnings() {
  const navigate = useNavigate();

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

  const [transporter, setTransporter] =
    useState(
      session?.transporter ||
        null
    );

  const [requests, setRequests] =
    useState([]);

  const [ratings, setRatings] =
    useState([]);

  const [ratingsSummary, setRatingsSummary] =
    useState(null);

  const [ratingsLoading, setRatingsLoading] =
    useState(true);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [connection, setConnection] =
    useState("unknown");

  const load =
    useCallback(
      async ({
        silent = false,
      } = {}) => {
        if (!transporterId) {
          setError(copy.login);
          setLoading(false);
          return;
        }

        if (!silent) {
          setLoading(true);
        }
        setRatingsLoading(true);

        try {
          const [
            transporterResponse,
            requestsResponse,
            ratingsResponse,
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
              api(
                `/api/transporters/${encodeURIComponent(
                  transporterId
                )}/ratings`
              ),
            ]);

          setTransporter(
            transporterResponse?.transporter ||
              null
          );

          const all =
            Array.isArray(
              requestsResponse?.requests
            )
              ? requestsResponse.requests
              : [];

          setRequests(all);

          const ratingRows =
            Array.isArray(ratingsResponse?.ratings)
              ? ratingsResponse.ratings
              : Array.isArray(ratingsResponse?.items)
              ? ratingsResponse.items
              : [];

          setRatings(ratingRows);
          setRatingsSummary(
            ratingsResponse?.summary ||
              ratingsResponse?.aggregate ||
              null
          );
          setRatingsLoading(false);

          setConnection(
            "connected"
          );
          setError("");
        } catch (loadError) {
          setRatingsLoading(false);
          console.error(
            "Transporter earnings API request failed:",
            {
              apiBase:
                API_BASE ||
                "(relative /api proxy)",
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

          setConnection(
            "unavailable"
          );
          setError(
            loadError?.message ||
              copy.network
          );
        } finally {
          if (!silent) {
            setLoading(false);
          }
        }
      },
      [
        copy.login,
        copy.network,
        transporterId,
      ]
    );

  useEffect(() => {
    load();

    const interval =
      window.setInterval(
        () =>
          load({
            silent: true,
          }),
        20000
      );

    return () =>
      window.clearInterval(
        interval
      );
  }, [load]);

  const completed =
    useMemo(
      () =>
        requests.filter(
          (request) =>
            String(
              request.status ||
                ""
            ).toUpperCase() ===
            "COMPLETED"
        ),
      [requests]
    );

  const lifetime =
    Number(
      transporter?.total_earnings ||
        transporter?.totalEarnings ||
        completed.reduce(
          (sum, request) =>
            sum +
            Number(
              request.final_fare ??
                request.estimated_fare ??
                0
            ),
          0
        )
    );

  const lifetimeTrips =
    Number(
      transporter?.total_trips ||
        transporter?.totalTrips ||
        completed.length
    );

  const todayTrips =
    completed.filter(
      (request) =>
        withinDay(
          completedDate(request)
        )
    );

  const weekTrips =
    completed.filter(
      (request) =>
        withinWeek(
          completedDate(request)
        )
    );

  const monthTrips =
    completed.filter(
      (request) =>
        withinMonth(
          completedDate(request)
        )
    );

  const today =
    todayTrips.reduce(
      (sum, request) =>
        sum +
        Number(
          request.final_fare ??
            request.estimated_fare ??
            0
        ),
      0
    );

  const week =
    weekTrips.reduce(
      (sum, request) =>
        sum +
        Number(
          request.final_fare ??
            request.estimated_fare ??
            0
        ),
      0
    );

  const month =
    monthTrips.reduce(
      (sum, request) =>
        sum +
        Number(
          request.final_fare ??
            request.estimated_fare ??
            0
        ),
      0
    );

  const average =
    lifetimeTrips > 0
      ? lifetime /
        lifetimeTrips
      : 0;

  const rating =
    Number(
      transporter?.rating ||
        ratingsSummary?.rating ||
        ratingsSummary?.averageRating ||
        0
    );

  const ratingTotal =
    Number(
      transporter?.total_ratings ||
        transporter?.totalRatings ||
        ratingsSummary?.total_ratings ||
        ratingsSummary?.totalRatings ||
        ratings.length ||
        0
    );

  const refresh =
    async () => {
      setRefreshing(true);
      await load();
      setRefreshing(false);
    };

  if (!transporterId) {
    return null;
  }

  return (
    <div
      className="transporter-earnings-page"
      style={styles.page}
    >
      <style>{`
        @media (max-width: 760px) {
          .transporter-earnings-page .ratingsSection { padding: 14px !important; }
          .transporter-earnings-page .ratingDetails { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
        }
        @media (max-width: 520px) {
          .transporter-earnings-page .ratingCardTop { flex-direction: column !important; }
          .transporter-earnings-page .ratingSummary { align-self: flex-start !important; }
          .transporter-earnings-page .ratingDetails { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <Header />

      <main
        style={styles.shell}
      >
        <header
          className="transporter-earnings-header"
          style={styles.header}
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
                styles.backButton
              }
            >
              <ArrowLeft size={15} />
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
            className="transporter-earnings-actions"
            style={
              styles.actions
            }
          >
            <div
              style={
                styles.language
              }
            >
              <Globe2 size={14} />

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
              onClick={refresh}
              disabled={
                refreshing
              }
              style={
                styles.refreshButton
              }
            >
              <RefreshCw
                size={14}
                className={
                  refreshing
                    ? "transporter-earnings-spin"
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
            <XCircle size={17} />
            <span>
              {error}
            </span>
            <button
              type="button"
              onClick={
                refresh
              }
              style={
                styles.retry
              }
            >
              {copy.retry}
            </button>
          </div>
        ) : null}

        <section
          style={
            styles.connectionBar
          }
        >
          <span
            style={
              styles.connectionDot
            }
          />

          <span>
            {copy.connection}:{" "}
            {connection ===
            "connected"
              ? copy.connected
              : copy.unavailable}
          </span>

          {transporter?.name ? (
            <strong
              style={
                styles.connectionName
              }
            >
              {transporter.name}
            </strong>
          ) : null}
        </section>

        {loading ? (
          <div
            style={
              styles.loading
            }
          >
            <Truck size={24} />
            <span>
              {copy.refreshing}
            </span>
          </div>
        ) : (
          <>
            <section
              className="transporter-earnings-stat-grid"
              style={
                styles.statGrid
              }
            >
              <Stat
                icon={Banknote}
                label={
                  copy.total
                }
                value={money(
                  lifetime
                )}
                sub={
                  `${number(
                    lifetimeTrips
                  )} ${copy.trips}`
                }
              />

              <Stat
                icon={TrendingUp}
                label={
                  copy.today
                }
                value={money(
                  today
                )}
                sub={
                  `${todayTrips.length} ${copy.trips}`
                }
              />

              <Stat
                icon={WalletCards}
                label={
                  copy.week
                }
                value={money(
                  week
                )}
                sub={
                  `${weekTrips.length} ${copy.trips}`
                }
              />

              <Stat
                icon={Clock3}
                label={
                  copy.month
                }
                value={money(
                  month
                )}
                sub={
                  `${monthTrips.length} ${copy.trips}`
                }
              />

              <Stat
                icon={Truck}
                label={
                  copy.average
                }
                value={money(
                  average
                )}
                sub={
                  `${number(
                    lifetimeTrips
                  )} ${copy.trips}`
                }
              />

              <Stat
                icon={CheckCircle2}
                label={
                  copy.rating
                }
                value={
                  rating > 0
                    ? rating.toFixed(
                        1
                      )
                    : "—"
                }
                sub={
                  rating > 0
                    ? "★"
                    : copy.noRating
                }
              />
            </section>

            <section
              style={
                styles.infoCard
              }
            >
              <div
                style={
                  styles.infoIcon
                }
              >
                <ShieldCheck
                  size={20}
                />
              </div>

              <div>
                <strong>
                  {copy.protected}
                </strong>

                <p
                  style={
                    styles.infoText
                  }
                >
                  {
                    copy.transportInfo
                  }
                </p>
              </div>
            </section>

            <section
              style={
                styles.ratingsSection
              }
            >
              <div
                style={
                  styles.sectionHeader
                }
              >
                <div>
                  <span
                    style={
                      styles.eyebrowSmall
                    }
                  >
                    {copy.ratings}
                  </span>
                  <h2
                    style={
                      styles.sectionTitle
                    }
                  >
                    {copy.ratings}
                  </h2>
                </div>

                <div
                  style={
                    styles.ratingSummary
                  }
                >
                  <strong
                    style={
                      styles.ratingSummaryValue
                    }
                  >
                    {rating > 0 ? rating.toFixed(1) : "—"} ★
                  </strong>
                  <span
                    style={
                      styles.ratingSummaryCount
                    }
                  >
                    {ratingTotal} {copy.ratingCount}
                  </span>
                </div>
              </div>

              {ratingsLoading ? (
                <div
                  style={styles.ratingsLoading}
                >
                  <Clock3 size={18} />
                  <span>{copy.refreshing}</span>
                </div>
              ) : ratings.length ? (
                <div
                  className="transporter-earnings-ratings-list"
                  style={styles.ratingsList}
                >
                  {ratings
                    .slice(0, 50)
                    .map((item, index) => {
                      const itemRating = Number(
                        item.rating ||
                          item.stars ||
                          0
                      );
                      const jobId =
                        item.request_id ||
                        item.requestId ||
                        item.transport_request_id ||
                        item.id ||
                        "—";
                      const tripDate =
                        item.created_at ||
                        item.createdAt ||
                        item.rated_at ||
                        item.ratedAt ||
                        item.completed_at ||
                        item.completedAt;
                      const farmerName =
                        item.farmer_name ||
                        item.farmerName ||
                        "Farmer";
                      const crop =
                        item.crop ||
                        "Transport job";
                      const quantity =
                        item.quantity_kg ??
                        item.quantityKg;
                      const fare =
                        item.final_fare ??
                        item.finalFare ??
                        item.estimated_fare ??
                        item.estimatedFare;
                      const review =
                        item.review ||
                        item.comment ||
                        "";
                      const center =
                        item.center_name ||
                        item.centerName ||
                        item.center_address ||
                        item.centerAddress ||
                        "";

                      return (
                        <article
                          key={`${jobId}-${index}`}
                          style={styles.ratingCard}
                        >
                          <div
                            style={styles.ratingCardTop}
                          >
                            <div>
                              <strong
                                style={styles.ratingJobTitle}
                              >
                                {crop}
                              </strong>
                              <span
                                style={styles.ratingJobMeta}
                              >
                                Job #{jobId}
                                {center
                                  ? ` · ${center}`
                                  : ""}
                              </span>
                            </div>
                            <div
                              style={styles.ratingStars}
                              aria-label={`${itemRating} out of 5`}
                            >
                              {"★★★★★".slice(
                                0,
                                Math.max(
                                  0,
                                  Math.min(5, itemRating)
                                )
                              )}
                              <span
                                style={styles.ratingNumber}
                              >
                                {itemRating}/5
                              </span>
                            </div>
                          </div>

                          <div
                            style={styles.ratingDetails}
                          >
                            <span>
                              <b>{copy.farmer}:</b>{" "}
                              {farmerName}
                            </span>
                            <span>
                              <b>{copy.quantity}:</b>{" "}
                              {quantity !== undefined &&
                              quantity !== null
                                ? `${number(quantity)} kg`
                                : "—"}
                            </span>
                            <span>
                              <b>{copy.fare}:</b>{" "}
                              {fare !== undefined &&
                              fare !== null
                                ? money(fare)
                                : "—"}
                            </span>
                            <span>
                              <b>{copy.completed}:</b>{" "}
                              {date(
                                item.completed_at ||
                                  item.completedAt ||
                                  tripDate,
                                language
                              )}
                            </span>
                          </div>

                          {review ? (
                            <div
                              style={styles.reviewBox}
                            >
                              <span
                                style={styles.reviewLabel}
                              >
                                {copy.review}
                              </span>
                              <p
                                style={styles.reviewText}
                              >
                                “{review}”
                              </p>
                            </div>
                          ) : (
                            <div
                              style={styles.noReview}
                            >
                              {copy.review}: {copy.unrated}
                            </div>
                          )}

                          <span
                            style={styles.ratedAt}
                          >
                            {date(tripDate, language)}
                          </span>
                        </article>
                      );
                    })}
                </div>
              ) : (
                <div
                  style={styles.empty}
                >
                  <CheckCircle2 size={26} />
                  <h3
                    style={styles.emptyTitle}
                  >
                    {copy.noReviews}
                  </h3>
                  <p
                    style={styles.emptyText}
                  >
                    {copy.noReviewsText}
                  </p>
                </div>
              )}
            </section>

            <section
              style={
                styles.tableSection
              }
            >
              <div
                style={
                  styles.sectionHeader
                }
              >
                <div>
                  <span
                    style={
                      styles.eyebrowSmall
                    }
                  >
                    {copy.recent}
                  </span>

                  <h2
                    style={
                      styles.sectionTitle
                    }
                  >
                    {copy.recent}
                  </h2>
                </div>

                <span
                  style={
                    styles.completedCount
                  }
                >
                  {completed.length}{" "}
                  {copy.trips}
                </span>
              </div>

              {completed.length ? (
                <div
                  className="transporter-earnings-table-wrap"
                  style={
                    styles.tableWrap
                  }
                >
                  <table
                    style={
                      styles.table
                    }
                  >
                    <thead>
                      <tr>
                        <th
                          style={
                            styles.th
                          }
                        >
                          {copy.completed}
                        </th>
                        <th
                          style={
                            styles.th
                          }
                        >
                          {copy.farmer}
                        </th>
                        <th
                          style={
                            styles.th
                          }
                        >
                          {copy.crop}
                        </th>
                        <th
                          style={
                            styles.th
                          }
                        >
                          {copy.quantity}
                        </th>
                        <th
                          style={
                            styles.th
                          }
                        >
                          {copy.center}
                        </th>
                        <th
                          style={
                            styles.thRight
                          }
                        >
                          {copy.fare}
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {completed
                        .slice(
                          0,
                          30
                        )
                        .map(
                          (
                            request
                          ) => (
                            <tr
                              key={
                                request.id
                              }
                            >
                              <td
                                style={
                                  styles.td
                                }
                              >
                                <span
                                  style={
                                    styles.dateValue
                                  }
                                >
                                  {date(
                                    completedDate(
                                      request
                                    ),
                                    language
                                  )}
                                </span>
                              </td>

                              <td
                                style={
                                  styles.td
                                }
                              >
                                <strong
                                  style={
                                    styles.cellStrong
                                  }
                                >
                                  {request.farmer_name ||
                                    "Farmer"}
                                </strong>

                                {request.farmer_phone ? (
                                  <a
                                    href={`tel:${request.farmer_phone}`}
                                    style={
                                      styles.cellLink
                                    }
                                  >
                                    {request.farmer_phone}
                                  </a>
                                ) : null}
                              </td>

                              <td
                                style={
                                  styles.td
                                }
                              >
                                {request.crop ||
                                  "Crop load"}
                              </td>

                              <td
                                style={
                                  styles.td
                                }
                              >
                                {number(
                                  request.quantity_kg
                                )}{" "}
                                kg
                              </td>

                              <td
                                style={
                                  styles.td
                                }
                              >
                                {request.center_name ||
                                  request.center_address ||
                                  "Center"}
                              </td>

                              <td
                                style={
                                  styles.tdRight
                                }
                              >
                                <strong
                                  style={
                                    styles.fareValue
                                  }
                                >
                                  {money(
                                    request.final_fare ??
                                      request.estimated_fare
                                  )}
                                </strong>
                              </td>
                            </tr>
                          )
                        )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div
                  style={
                    styles.empty
                  }
                >
                  <Truck
                    size={26}
                  />

                  <h3
                    style={
                      styles.emptyTitle
                    }
                  >
                    {copy.noTrips}
                  </h3>

                  <p
                    style={
                      styles.emptyText
                    }
                  >
                    {copy.noTripsText}
                  </p>
                </div>
              )}
            </section>
          </>
        )}

        <footer
          style={
            styles.footer
          }
        >
          <ShieldCheck size={15} />
          <span>
            {copy.protected}
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
            {copy.dashboard}
          </button>
        </footer>
      </main>

    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #f7faf8 0%, #ffffff 48%, #f8fbf9 100%)",
    color: "#23372b",
  },

  shell: {
    width:
      "min(1200px, calc(100% - 30px))",
    margin: "0 auto",
    padding:
      "30px 0 50px",
  },

  header: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "flex-end",
    gap: "20px",
    paddingBottom:
      "20px",
    borderBottom:
      "1px solid #e3ebe5",
  },

  backButton: {
    display: "inline-flex",
    alignItems:
      "center",
    gap: "5px",
    marginBottom:
      "13px",
    padding: 0,
    border: 0,
    background:
      "transparent",
    color:
      "#5d7165",
    fontSize:
      "10px",
    fontWeight:
      800,
    cursor:
      "pointer",
  },

  eyebrow: {
    display:
      "block",
    color:
      "#7d8b82",
    fontSize:
      "9px",
    letterSpacing:
      "0.16em",
    fontWeight:
      800,
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
      "650px",
    margin:
      "7px 0 0",
    color:
      "#738078",
    fontSize:
      "11px",
    lineHeight:
      1.55,
  },

  actions: {
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
      "#68776e",
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

  refreshButton: {
    minHeight:
      "35px",
    padding:
      "0 11px",
    display:
      "inline-flex",
    alignItems:
      "center",
    justifyContent:
      "center",
    gap:
      "6px",
    border:
      "1px solid #216f3f",
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
      "1px solid #eed5cf",
    background:
      "#fff5f2",
    color:
      "#9a5145",
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
    textDecoration:
      "underline",
    fontSize:
      "9px",
    fontWeight:
      800,
    cursor:
      "pointer",
  },

  connectionBar: {
    display:
      "flex",
    alignItems:
      "center",
    gap:
      "7px",
    marginTop:
      "14px",
    padding:
      "10px 12px",
    borderRadius:
      "10px",
    background:
      "#f8faf9",
    border:
      "1px solid #e3eae5",
    color:
      "#77847d",
    fontSize:
      "9px",
  },

  connectionDot: {
    width:
      "7px",
    height:
      "7px",
    borderRadius:
      "50%",
    background:
      "#35a25c",
  },

  connectionName: {
    marginLeft:
      "auto",
    color:
      "#456052",
  },

  loading: {
    minHeight:
      "320px",
    marginTop:
      "15px",
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
    borderRadius:
      "18px",
    border:
      "1px solid #e3eae5",
    background:
      "#ffffff",
    color:
      "#738178",
    fontSize:
      "10px",
  },

  statGrid: {
    display:
      "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap:
      "11px",
    marginTop:
      "15px",
  },

  stat: {
    display:
      "flex",
    alignItems:
      "center",
    gap:
      "10px",
    padding:
      "16px",
    borderRadius:
      "16px",
    border:
      "1px solid #e1e9e4",
    background:
      "#ffffff",
    boxShadow:
      "0 9px 22px rgba(26,72,45,0.035)",
  },

  statIcon: {
    width:
      "40px",
    height:
      "40px",
    borderRadius:
      "12px",
    display:
      "flex",
    alignItems:
      "center",
    justifyContent:
      "center",
    background:
      "#eaf5ed",
    color:
      "#2a7245",
    flexShrink:
      0,
  },

  statLabel: {
    display:
      "block",
    color:
      "#87938b",
    fontSize:
      "8px",
    textTransform:
      "uppercase",
    letterSpacing:
      "0.1em",
    fontWeight:
      800,
  },

  statValue: {
    display:
      "block",
    marginTop:
      "3px",
    color:
      "#254031",
    fontSize:
      "19px",
    lineHeight:
      1.1,
  },

  statSub: {
    display:
      "block",
    marginTop:
      "3px",
    color:
      "#829089",
    fontSize:
      "8px",
  },

  infoCard: {
    display:
      "flex",
    alignItems:
      "flex-start",
    gap:
      "10px",
    marginTop:
      "14px",
    padding:
      "13px",
    borderRadius:
      "13px",
    border:
      "1px solid #dfe9e3",
    background:
      "#f8fbf9",
    color:
      "#52665a",
    fontSize:
      "9px",
    lineHeight:
      1.5,
  },

  infoIcon: {
    width:
      "35px",
    height:
      "35px",
    borderRadius:
      "10px",
    display:
      "flex",
    alignItems:
      "center",
    justifyContent:
      "center",
    background:
      "#e7f4eb",
    color:
      "#2a7445",
    flexShrink:
      0,
  },

  infoText: {
    margin:
      "4px 0 0",
    color:
      "#75837a",
  },

  ratingsSection: {
    marginTop: "18px",
    padding: "18px",
    borderRadius: "18px",
    border: "1px solid #e1e9e4",
    background: "#ffffff",
    boxShadow: "0 10px 26px rgba(26,72,45,0.04)",
  },

  ratingSummary: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    padding: "8px 11px",
    borderRadius: "12px",
    background: "#fff8e8",
    border: "1px solid #f1dfae",
  },

  ratingSummaryValue: {
    color: "#9b6a12",
    fontSize: "17px",
    lineHeight: 1,
  },

  ratingSummaryCount: {
    color: "#826f4a",
    fontSize: "8px",
    fontWeight: 800,
  },

  ratingsLoading: {
    minHeight: "120px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    borderRadius: "14px",
    border: "1px dashed #d9e4dc",
    background: "#fbfdfb",
    color: "#718078",
    fontSize: "9px",
  },

  ratingsList: {
    display: "grid",
    gap: "10px",
  },

  ratingCard: {
    padding: "14px",
    borderRadius: "15px",
    border: "1px solid #e4ebe6",
    background: "linear-gradient(180deg,#ffffff 0%,#fbfdfb 100%)",
  },

  ratingCardTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px",
  },

  ratingJobTitle: {
    display: "block",
    color: "#294233",
    fontSize: "12px",
  },

  ratingJobMeta: {
    display: "block",
    marginTop: "4px",
    color: "#7a887f",
    fontSize: "8px",
  },

  ratingStars: {
    color: "#d59620",
    fontSize: "15px",
    letterSpacing: "1px",
    whiteSpace: "nowrap",
  },

  ratingNumber: {
    marginLeft: "6px",
    color: "#806b40",
    fontSize: "9px",
    fontWeight: 800,
    letterSpacing: "normal",
  },

  ratingDetails: {
    display: "grid",
    gridTemplateColumns: "repeat(4,minmax(0,1fr))",
    gap: "8px",
    marginTop: "12px",
    paddingTop: "10px",
    borderTop: "1px solid #edf1ee",
    color: "#64736a",
    fontSize: "8px",
  },

  reviewBox: {
    marginTop: "10px",
    padding: "9px 10px",
    borderRadius: "11px",
    background: "#f6faf7",
    border: "1px solid #e1ebe4",
  },

  reviewLabel: {
    display: "block",
    color: "#5c7465",
    fontSize: "7px",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
  },

  reviewText: {
    margin: "4px 0 0",
    color: "#42574a",
    fontSize: "9px",
    lineHeight: 1.5,
  },

  noReview: {
    marginTop: "10px",
    color: "#8a958e",
    fontSize: "8px",
    fontStyle: "italic",
  },

  ratedAt: {
    display: "block",
    marginTop: "8px",
    color: "#95a098",
    fontSize: "7px",
  },

  tableSection: {
    marginTop:
      "27px",
  },

  sectionHeader: {
    display:
      "flex",
    alignItems:
      "flex-end",
    justifyContent:
      "space-between",
    gap:
      "12px",
    marginBottom:
      "11px",
  },

  eyebrowSmall: {
    display:
      "block",
    color:
      "#859189",
    fontSize:
      "8px",
    fontWeight:
      800,
    letterSpacing:
      "0.14em",
    textTransform:
      "uppercase",
  },

  sectionTitle: {
    margin:
      "4px 0 0",
    color:
      "#284032",
    fontSize:
      "18px",
  },

  completedCount: {
    padding:
      "6px 8px",
    borderRadius:
      "999px",
    background:
      "#eef6f0",
    color:
      "#2b6f45",
    fontSize:
      "8px",
    fontWeight:
      800,
  },

  tableWrap: {
    overflow:
      "hidden",
    borderRadius:
      "17px",
    border:
      "1px solid #e1e9e4",
    background:
      "#ffffff",
  },

  table: {
    width:
      "100%",
    borderCollapse:
      "collapse",
    minWidth:
      "780px",
  },

  th: {
    padding:
      "11px 12px",
    textAlign:
      "left",
    color:
      "#818e86",
    background:
      "#f8faf9",
    borderBottom:
      "1px solid #e4ebe6",
    fontSize:
      "8px",
    fontWeight:
      800,
    textTransform:
      "uppercase",
    letterSpacing:
      "0.08em",
  },

  thRight: {
    padding:
      "11px 12px",
    textAlign:
      "right",
    color:
      "#818e86",
    background:
      "#f8faf9",
    borderBottom:
      "1px solid #e4ebe6",
    fontSize:
      "8px",
    fontWeight:
      800,
    textTransform:
      "uppercase",
    letterSpacing:
      "0.08em",
  },

  td: {
    padding:
      "12px",
    color:
      "#55675b",
    fontSize:
      "9px",
    borderBottom:
      "1px solid #eef2ef",
    verticalAlign:
      "top",
  },

  tdRight: {
    padding:
      "12px",
    textAlign:
      "right",
    borderBottom:
      "1px solid #eef2ef",
    verticalAlign:
      "top",
  },

  dateValue: {
    color:
      "#728077",
    fontSize:
      "8px",
    whiteSpace:
      "nowrap",
  },

  cellStrong: {
    display:
      "block",
    color:
      "#33483a",
    fontSize:
      "10px",
  },

  cellLink: {
    display:
      "block",
    marginTop:
      "3px",
    color:
      "#537462",
    textDecoration:
      "none",
    fontSize:
      "8px",
  },

  fareValue: {
    color:
      "#287247",
    fontSize:
      "11px",
  },

  empty: {
    minHeight:
      "270px",
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
    borderRadius:
      "17px",
    border:
      "1px dashed #d9e4dc",
    background:
      "#fbfdfb",
    color:
      "#6f7e75",
  },

  emptyTitle: {
    margin:
      "11px 0 0",
    color:
      "#33483a",
    fontSize:
      "15px",
  },

  emptyText: {
    maxWidth:
      "480px",
    margin:
      "7px 0 0",
    color:
      "#7b8880",
    fontSize:
      "9px",
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
      "23px",
    paddingTop:
      "14px",
    borderTop:
      "1px solid #e5ece7",
    color:
      "#7b8780",
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
