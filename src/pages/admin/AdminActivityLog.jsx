import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Database,
  Filter,
  RefreshCw,
  Search,
  Scale,
  UserRound,
  X,
} from "lucide-react";

import {
  Link,
} from "react-router";

import AdminLayout from "../../components/admin/AdminLayout";

import { useLanguage } from "../../translations/LanguageContext";


const API_URL =
  import.meta.env.VITE_API_URL;


function AdminActivityLog() {

  const [
    events,
    setEvents,
  ] = useState([]);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    refreshing,
    setRefreshing,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  const [
    success,
    setSuccess,
  ] = useState("");


  const [
    search,
    setSearch,
  ] = useState("");


  const [
    statusFilter,
    setStatusFilter,
  ] = useState("ALL");


  const [
    actorFilter,
    setActorFilter,
  ] = useState("ALL");


  const {
  language,
} = useLanguage();


  const text =
    getActivityCopy(
      language
    );


  const loadEvents =
    useCallback(
      async (
        manual = false
      ) => {

        if (
          manual
        ) {

          setRefreshing(
            true
          );

        } else {

          setLoading(
            true
          );

        }


        try {

          const response =
            await fetch(
              `${API_URL}/activity-log`
            );


          const data =
            await response.json();


          if (
            !response.ok
          ) {

            throw new Error(
              data?.message ||
              text.loadError
            );

          }


          const rows =
            Array.isArray(
              data?.events
            )
              ? data.events
              : [];


          setEvents(
            rows
          );


          setError("");


        } catch (
          loadError
        ) {

          console.error(
            "Activity log error:",
            loadError
          );


          setError(
            loadError?.message ||
            text.loadError
          );

        } finally {

          setLoading(
            false
          );

          setRefreshing(
            false
          );

        }

      },
      [
        text.loadError,
      ]
    );


  useEffect(() => {

    loadEvents();


    const timer =
      setInterval(
        () =>
          loadEvents(),
        5000
      );


    function handleLanguageChange() {

      setLanguage(
        localStorage.getItem(
          "krishisetu-language"
        ) || "en"
      );

    }


    window.addEventListener(
      "storage",
      handleLanguageChange
    );


    return () => {

      clearInterval(
        timer
      );


      window.removeEventListener(
        "storage",
        handleLanguageChange
      );

    };

  }, [
    loadEvents,
  ]);


  const filteredEvents =
    useMemo(
      () => {

        const query =
          search
            .trim()
            .toLowerCase();


        return events.filter(
          (
            event
          ) => {

            if (
              statusFilter !==
                "ALL" &&
              event.status !==
                statusFilter
            ) {

              return false;

            }


            if (
              actorFilter !==
                "ALL" &&
              event.actor_type !==
                actorFilter
            ) {

              return false;

            }


            if (
              !query
            ) {

              return true;

            }


            const searchable =
              [
                event.id,
                event.booking_id,
                event.token,
                event.status,
                event.actor_type,
                event.actor_id,
                event.farmer_name,
                event.farmer_phone,
                event.note,
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


            return searchable.includes(
              query
            );

          }
        );

      },
      [
        events,
        search,
        statusFilter,
        actorFilter,
      ]
    );


  const stats =
    useMemo(
      () => {

        const today =
          new Date();


        today.setHours(
          0,
          0,
          0,
          0
        );


        const todayCount =
          events.filter(
            (
              event
            ) => {

              const date =
                new Date(
                  event.created_at ||
                  event.timestamp
                );


              if (
                Number.isNaN(
                  date.getTime()
                )
              ) {

                return false;

              }


              return (
                date >=
                today
              );

            }
          ).length;


        const adminActions =
          events.filter(
            (
              event
            ) =>
              event.actor_type ===
              "ADMIN"
          ).length;


        const systemActions =
          events.filter(
            (
              event
            ) =>
              event.actor_type ===
              "SYSTEM"
          ).length;


        const procurementActions =
          events.filter(
            (
              event
            ) =>
              event.status ===
              "PROCURED"
          ).length;


        return {

          total:
            events.length,

          today:
            todayCount,

          admin:
            adminActions,

          system:
            systemActions,

          procurement:
            procurementActions,

        };

      },
      [
        events,
      ]
    );


  const statuses =
    useMemo(
      () => {

        return [
          "CONFIRMED",
          "ARRIVED",
          "LATE",
          "WEIGHING",
          "PROCURED",
          "PAYMENT_PENDING",
          "PAYMENT_SENT",
        ].filter(
          (
            status
          ) =>
            events.some(
              (
                event
              ) =>
                event.status ===
                status
            )
        );

      },
      [
        events,
      ]
    );


  const actorTypes =
    useMemo(
      () => {

        return [
          "ADMIN",
          "SYSTEM",
          "OPERATOR",
        ].filter(
          (
            actor
          ) =>
            events.some(
              (
                event
              ) =>
                event.actor_type ===
                actor
            )
        );

      },
      [
        events,
      ]
    );


  return (

    <AdminLayout
      title={
        text.title
      }
      subtitle={
        text.subtitle
      }
    >

      <div className="admin-activity-page">


        {/* =====================================================
            HERO
        ====================================================== */}

        <section className="admin-activity-hero">


          <div>

            <span className="admin-page-eyebrow">

              {text.eyebrow}

            </span>


            <h2>

              {text.heading}

            </h2>


            <p>

              {text.description}

            </p>

          </div>


          <div className="admin-activity-actions">


            <div className="admin-activity-live">

              <Activity
                size={14}
              />

              {text.liveData}

            </div>


            <button
              type="button"
              className="admin-activity-refresh"
              onClick={() =>
                loadEvents(
                  true
                )
              }
              disabled={
                refreshing
              }
            >

              <RefreshCw
                size={15}
                className={
                  refreshing
                    ? "admin-refresh-spin"
                    : ""
                }
              />


              {
                refreshing
                  ? text.refreshing
                  : text.refresh
              }

            </button>

          </div>

        </section>



        {/* =====================================================
            ERROR
        ====================================================== */}

        {error && (

          <div className="admin-activity-feedback error">

            <AlertTriangle
              size={17}
            />


            <span>

              {error}

            </span>


            <button
              type="button"
              onClick={() =>
                setError("")
              }
            >

              <X
                size={14}
              />

            </button>

          </div>

        )}


        {success && (

          <div className="admin-activity-feedback success">

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
            >

              <X
                size={14}
              />

            </button>

          </div>

        )}



        {/* =====================================================
            KPIs
        ====================================================== */}

        <section className="admin-activity-kpi-grid">


          <ActivityKpi
            tone="blue"
            icon={
              <Database
                size={18}
              />
            }
            value={
              stats.total
            }
            label={
              text.totalEvents
            }
          />


          <ActivityKpi
            tone="green"
            icon={
              <CalendarClock
                size={18}
              />
            }
            value={
              stats.today
            }
            label={
              text.todayEvents
            }
          />


          <ActivityKpi
            tone="purple"
            icon={
              <UserRound
                size={18}
              />
            }
            value={
              stats.admin
            }
            label={
              text.adminActions
            }
          />


          <ActivityKpi
            tone="gold"
            icon={
              <Scale
                size={18}
              />
            }
            value={
              stats.procurement
            }
            label={
              text.procurementEvents
            }
          />

        </section>



        {/* =====================================================
            FILTERS
        ====================================================== */}

        <section className="admin-activity-filter-panel">


          <div className="admin-activity-search">

            <Search
              size={16}
            />


            <input
              type="text"
              value={
                search
              }
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder={
                text.searchPlaceholder
              }
            />

          </div>


          <div className="admin-activity-filter-select">

            <Filter
              size={14}
            />


            <select
              value={
                statusFilter
              }
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
            >

              <option value="ALL">
                {text.allStatuses}
              </option>


              {statuses.map(
                (
                  status
                ) => (

                  <option
                    key={
                      status
                    }
                    value={
                      status
                    }
                  >

                    {
                      getStatusLabel(
                        status,
                        language
                      )
                    }

                  </option>

                )
              )}

            </select>

          </div>


          <div className="admin-activity-filter-select">

            <select
              value={
                actorFilter
              }
              onChange={(event) =>
                setActorFilter(
                  event.target.value
                )
              }
            >

              <option value="ALL">
                {text.allActors}
              </option>


              {actorTypes.map(
                (
                  actor
                ) => (

                  <option
                    key={
                      actor
                    }
                    value={
                      actor
                    }
                  >

                    {
                      getActorLabel(
                        actor,
                        language
                      )
                    }

                  </option>

                )
              )}

            </select>

          </div>


          {(search ||
            statusFilter !==
              "ALL" ||
            actorFilter !==
              "ALL") && (

            <button
              type="button"
              className="admin-activity-clear"
              onClick={() => {

                setSearch("");

                setStatusFilter(
                  "ALL"
                );

                setActorFilter(
                  "ALL"
                );

              }}
            >

              <X
                size={13}
              />

              {text.clear}

            </button>

          )}

        </section>



        {/* =====================================================
            TIMELINE
        ====================================================== */}

        <section className="admin-activity-panel">


          <div className="admin-activity-panel-header">

            <div>

              <span className="admin-page-eyebrow">

                {text.timeline}

              </span>


              <h3>

                {
                  filteredEvents.length
                }

                {" "}

                {text.events}

              </h3>

            </div>


            <span>

              {text.liveDatabase}

            </span>

          </div>



          {loading ? (

            <ActivityLoading />

          ) : filteredEvents.length ===
            0 ? (

            <div className="admin-activity-empty">

              <Activity
                size={27}
              />


              <strong>
                {text.noEvents}
              </strong>


              <span>
                {text.noEventsDescription}
              </span>

            </div>

          ) : (

            <div className="admin-activity-timeline">

              {filteredEvents.map(
                (
                  event,
                  index
                ) => (

                  <ActivityEvent
                    key={
                      `${event.id}-${index}`
                    }
                    event={
                      event
                    }
                    language={
                      language
                    }
                    text={
                      text
                    }
                  />

                )
              )}

            </div>

          )}

        </section>



        <div className="admin-activity-footer">

          <span>
            {text.footer}
          </span>


          <span>

            {
              filteredEvents.length
            }

            {" "}

            {text.displayed}

          </span>

        </div>

      </div>

    </AdminLayout>

  );
}


/* =========================================================
   KPI
========================================================= */

function ActivityKpi({
  icon,
  tone,
  value,
  label,
}) {

  return (

    <div
      className={
        `admin-activity-kpi ${tone}`
      }
    >

      <div className="admin-activity-kpi-icon">

        {icon}

      </div>


      <div>

        <strong>
          {value}
        </strong>


        <span>
          {label}
        </span>

      </div>

    </div>

  );
}


/* =========================================================
   EVENT
========================================================= */

function ActivityEvent({
  event,
  language,
  text,
}) {

  const status =
    event.status ||
    "UNKNOWN";


  const tone =
    getStatusTone(
      status
    );


  const date =
    formatActivityDate(
      event.created_at ||
      event.timestamp,
      language
    );


  const time =
    formatActivityTime(
      event.created_at ||
      event.timestamp,
      language
    );


  return (

    <div className="admin-activity-event">


      <div className="admin-activity-event-line">


        <div
          className={
            `admin-activity-event-dot ${tone}`
          }
        >

          {
            getStatusIcon(
              status
            )
          }

        </div>


      </div>



      <div className="admin-activity-event-body">


        <div className="admin-activity-event-top">


          <div>

            <span
              className={
                `admin-activity-status ${tone}`
              }
            >

              {
                getStatusLabel(
                  status,
                  language
                )
              }

            </span>


            {event.token && (

              <strong>

                #

                {
                  event.token
                }

              </strong>

            )}

          </div>


          <time>

            {date}

            {" · "}

            {time}

          </time>

        </div>



        <div className="admin-activity-event-content">


          <strong>

            {
              getEventTitle(
                status,
                language
              )
            }

          </strong>


          <p>

            {
              event.note ||
              getEventDefaultNote(
                status,
                language
              )
            }

          </p>

        </div>



        <div className="admin-activity-event-meta">


          <span>

            {text.booking}

            {": "}

            {
              event.booking_id ||
              "—"
            }

          </span>


          <span>

            {text.actor}

            {": "}

            {
              getActorLabel(
                event.actor_type,
                language
              )
            }

          </span>


          {event.actor_id && (

            <span>

              {text.actorId}

              {": "}

              {
                event.actor_id
              }

            </span>

          )}

        </div>



        {event.changed_fields && (

          <div className="admin-activity-changes">


            <span>
              {text.changedFields}
            </span>


            <div>

              {
                formatChangedFields(
                  event.changed_fields
                )
              }

            </div>

          </div>

        )}

      </div>

    </div>

  );

}


/* =========================================================
   ICON
========================================================= */

function getStatusIcon(
  status
) {

  if (
    status ===
    "CONFIRMED"
  ) {

    return (
      <CalendarClock
        size={13}
      />
    );

  }


  if (
    status ===
      "ARRIVED" ||
    status ===
      "LATE"
  ) {

    return (
      <UserRound
        size={13}
      />
    );

  }


  if (
    status ===
    "WEIGHING"
  ) {

    return (
      <Scale
        size={13}
      />
    );

  }


  if (
    status ===
    "PROCURED"
  ) {

    return (
      <CheckCircle2
        size={13}
      />
    );

  }


  if (
    status ===
      "PAYMENT_PENDING" ||
    status ===
      "PAYMENT_SENT"
  ) {

    return (
      <Database
        size={13}
      />
    );

  }


  return (
    <Activity
      size={13}
    />
  );

}


/* =========================================================
   STATUS
========================================================= */

function getStatusTone(
  status
) {

  if (
    status ===
    "ARRIVED"
  ) {

    return "blue";

  }


  if (
    status ===
    "LATE"
  ) {

    return "orange";

  }


  if (
    status ===
    "WEIGHING"
  ) {

    return "purple";

  }


  if (
    status ===
    "PAYMENT_PENDING"
  ) {

    return "gold";

  }


  if (
    status ===
    "PAYMENT_SENT"
  ) {

    return "green";

  }


  if (
    status ===
    "PROCURED"
  ) {

    return "teal";

  }


  return "blue";

}


function getStatusLabel(
  status,
  language
) {

  const labels = {

    en: {
      CONFIRMED:
        "Confirmed",

      ARRIVED:
        "Arrived",

      LATE:
        "Late",

      WEIGHING:
        "Weighing",

      PROCURED:
        "Procured",

      PAYMENT_PENDING:
        "Payment Pending",

      PAYMENT_SENT:
        "Payment Sent",
    },

    hi: {
      CONFIRMED:
        "पुष्टि",

      ARRIVED:
        "पहुंचे",

      LATE:
        "देर से",

      WEIGHING:
        "वजन",

      PROCURED:
        "खरीद पूरी",

      PAYMENT_PENDING:
        "भुगतान लंबित",

      PAYMENT_SENT:
        "भुगतान भेजा गया",
    },

    te: {
      CONFIRMED:
        "నిర్ధారించబడింది",

      ARRIVED:
        "చేరుకున్నారు",

      LATE:
        "ఆలస్యం",

      WEIGHING:
        "తూకం",

      PROCURED:
        "కొనుగోలు పూర్తైంది",

      PAYMENT_PENDING:
        "చెల్లింపు పెండింగ్",

      PAYMENT_SENT:
        "చెల్లింపు పంపబడింది",
    },

  };


  return (
    labels[
      language
    ]?.[
      status
    ] ||
    labels.en[
      status
    ] ||
    status
  );

}


/* =========================================================
   EVENT TITLES
========================================================= */

function getEventTitle(
  status,
  language
) {

  const titles = {

    en: {

      CONFIRMED:
        "Booking confirmed",

      ARRIVED:
        "Farmer arrival recorded",

      LATE:
        "Farmer marked late",

      WEIGHING:
        "Weighing activity recorded",

      PROCURED:
        "Procurement completed",

      PAYMENT_PENDING:
        "Payment moved to pending",

      PAYMENT_SENT:
        "Payment marked as sent",

    },

    hi: {

      CONFIRMED:
        "बुकिंग की पुष्टि हुई",

      ARRIVED:
        "किसान का आगमन दर्ज हुआ",

      LATE:
        "किसान को देर से चिह्नित किया गया",

      WEIGHING:
        "वजन गतिविधि दर्ज हुई",

      PROCURED:
        "खरीद पूरी हुई",

      PAYMENT_PENDING:
        "भुगतान लंबित हुआ",

      PAYMENT_SENT:
        "भुगतान भेजा गया",

    },

    te: {

      CONFIRMED:
        "బుకింగ్ నిర్ధారించబడింది",

      ARRIVED:
        "రైతు రాక నమోదు చేయబడింది",

      LATE:
        "రైతు ఆలస్యంగా గుర్తించబడ్డారు",

      WEIGHING:
        "తూకం కార్యకలాపం నమోదు చేయబడింది",

      PROCURED:
        "కొనుగోలు పూర్తైంది",

      PAYMENT_PENDING:
        "చెల్లింపు పెండింగ్‌కు మార్చబడింది",

      PAYMENT_SENT:
        "చెల్లింపు పంపినట్లు గుర్తించబడింది",

    },

  };


  return (
    titles[
      language
    ]?.[
      status
    ] ||
    titles.en[
      status
    ] ||
    status
  );

}


/* =========================================================
   DEFAULT NOTES
========================================================= */

function getEventDefaultNote(
  status,
  language
) {

  const notes = {

    en: {

      CONFIRMED:
        "A procurement booking was confirmed.",

      ARRIVED:
        "The farmer arrived at the procurement center.",

      LATE:
        "The booking was marked late by an operator.",

      WEIGHING:
        "The booking was processed at the weighing desk.",

      PROCURED:
        "Produce verification and procurement were completed.",

      PAYMENT_PENDING:
        "The booking is ready for payment processing.",

      PAYMENT_SENT:
        "The payment transaction was recorded as sent.",

    },

    hi: {

      CONFIRMED:
        "खरीद बुकिंग की पुष्टि की गई।",

      ARRIVED:
        "किसान खरीद केंद्र पर पहुंचा।",

      LATE:
        "ऑपरेटर ने बुकिंग को देर से चिह्नित किया।",

      WEIGHING:
        "बुकिंग वजन डेस्क पर प्रोसेस की गई।",

      PROCURED:
        "उपज सत्यापन और खरीद पूरी की गई।",

      PAYMENT_PENDING:
        "बुकिंग भुगतान प्रक्रिया के लिए तैयार है।",

      PAYMENT_SENT:
        "भुगतान लेनदेन को भेजा गया दर्ज किया गया।",

    },

    te: {

      CONFIRMED:
        "కొనుగోలు బుకింగ్ నిర్ధారించబడింది.",

      ARRIVED:
        "రైతు కొనుగోలు కేంద్రానికి చేరుకున్నారు.",

      LATE:
        "ఆపరేటర్ బుకింగ్‌ను ఆలస్యంగా గుర్తించారు.",

      WEIGHING:
        "బుకింగ్ తూకం డెస్క్ వద్ద ప్రాసెస్ చేయబడింది.",

      PROCURED:
        "పంట ధృవీకరణ మరియు కొనుగోలు పూర్తయ్యాయి.",

      PAYMENT_PENDING:
        "బుకింగ్ చెల్లింపు ప్రక్రియకు సిద్ధంగా ఉంది.",

      PAYMENT_SENT:
        "చెల్లింపు లావాదేవీ పంపబడినట్లు నమోదు చేయబడింది.",

    },

  };


  return (
    notes[
      language
    ]?.[
      status
    ] ||
    notes.en[
      status
    ] ||
    ""
  );

}


/* =========================================================
   ACTOR
========================================================= */

function getActorLabel(
  actor,
  language
) {

  const labels = {

    en: {
      ADMIN:
        "Administrator",

      SYSTEM:
        "System",

      OPERATOR:
        "Operator",
    },

    hi: {
      ADMIN:
        "प्रशासक",

      SYSTEM:
        "सिस्टम",

      OPERATOR:
        "ऑपरेटर",
    },

    te: {
      ADMIN:
        "అడ్మినిస్ట్రేటర్",

      SYSTEM:
        "సిస్టమ్",

      OPERATOR:
        "ఆపరేటర్",
    },

  };


  return (
    labels[
      language
    ]?.[
      actor
    ] ||
    labels.en[
      actor
    ] ||
    actor ||
    "Unknown"
  );

}


/* =========================================================
   DATE / TIME
========================================================= */

function formatActivityDate(
  value,
  language
) {

  if (
    !value
  ) {

    return "—";

  }


  const date =
    new Date(
      value
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "—";

  }


  const locale =
    language ===
      "hi"
      ? "hi-IN"
      : language ===
          "te"
        ? "te-IN"
        : "en-IN";


  return date.toLocaleDateString(
    locale,
    {
      day:
        "numeric",

      month:
        "short",

      year:
        "numeric",
    }
  );

}


function formatActivityTime(
  value,
  language
) {

  if (
    !value
  ) {

    return "—";

  }


  const date =
    new Date(
      value
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "—";

  }


  const locale =
    language ===
      "hi"
      ? "hi-IN"
      : language ===
          "te"
        ? "te-IN"
        : "en-IN";


  return date.toLocaleTimeString(
    locale,
    {
      hour:
        "numeric",

      minute:
        "2-digit",
    }
  );

}


/* =========================================================
   CHANGES
========================================================= */

function formatChangedFields(
  value
) {

  if (
    !value
  ) {

    return "";

  }


  let object =
    value;


  if (
    typeof value ===
    "string"
  ) {

    try {

      object =
        JSON.parse(
          value
        );

    } catch {

      return value;

    }

  }


  if (
    typeof object !==
    "object"
  ) {

    return String(
      object
    );

  }


  return Object.entries(
    object
  )
    .map(
      (
        [
          key,
          value,
        ]
      ) =>
        `${key}: ${value}`
    )
    .join(
      " · "
    );

}


/* =========================================================
   LOADING
========================================================= */

function ActivityLoading() {

  return (

    <div className="admin-activity-loading">

      {[
        1,
        2,
        3,
        4,
        5,
      ].map(
        (
          item
        ) => (

          <div
            key={
              item
            }
            className="admin-activity-loading-row"
          >

            <span />


            <div>

              <span />
              <span />
              <span />
              <span />

            </div>

          </div>

        )
      )}

    </div>

  );

}


/* =========================================================
   COPY
========================================================= */

function getActivityCopy(
  language
) {

  const copy = {

    en: {

      title:
        "Activity Log",

      subtitle:
        "Complete operational history of important system and administrator actions.",

      eyebrow:
        "AUDIT & ACTIVITY",

      heading:
        "See what happened across KrishiSetu.",

      description:
        "Review booking transitions, operator actions, weighing, procurement and payment events from the live system.",

      liveData:
        "LIVE DATA",

      refreshing:
        "Refreshing...",

      refresh:
        "Refresh",

      loadError:
        "Unable to load the activity log.",

      configurationIssue:
        "Activity log issue",

      totalEvents:
        "Total events",

      todayEvents:
        "Today's events",

      adminActions:
        "Admin actions",

      procurementEvents:
        "Procurement events",

      searchPlaceholder:
        "Search booking, token, farmer, actor or note...",

      allStatuses:
        "All statuses",

      allActors:
        "All actors",

      clear:
        "Clear",

      timeline:
        "AUDIT TIMELINE",

      events:
        "events",

      liveDatabase:
        "Live database",

      noEvents:
        "No activity found",

      noEventsDescription:
        "No events match the current search and filters.",

      booking:
        "Booking",

      actor:
        "Actor",

      actorId:
        "Actor ID",

      changedFields:
        "Changed fields",

      footer:
        "Activity records are read from the live status event history.",

      displayed:
        "displayed",

    },


    hi: {

      title:
        "गतिविधि लॉग",

      subtitle:
        "महत्वपूर्ण सिस्टम और एडमिन गतिविधियों का पूरा इतिहास।",

      eyebrow:
        "ऑडिट और गतिविधि",

      heading:
        "KrishiSetu में क्या हुआ, सब देखें।",

      description:
        "बुकिंग स्थिति, ऑपरेटर कार्य, वजन, खरीद और भुगतान की लाइव गतिविधियां देखें।",

      liveData:
        "लाइव डेटा",

      refreshing:
        "रीफ्रेश हो रहा है...",

      refresh:
        "रीफ्रेश",

      loadError:
        "गतिविधि लॉग लोड नहीं हो सका।",

      configurationIssue:
        "गतिविधि लॉग समस्या",

      totalEvents:
        "कुल इवेंट",

      todayEvents:
        "आज के इवेंट",

      adminActions:
        "एडमिन कार्य",

      procurementEvents:
        "खरीद इवेंट",

      searchPlaceholder:
        "बुकिंग, टोकन, किसान, ऑपरेटर या नोट खोजें...",

      allStatuses:
        "सभी स्थितियां",

      allActors:
        "सभी अभिनेता",

      clear:
        "साफ करें",

      timeline:
        "ऑडिट टाइमलाइन",

      events:
        "इवेंट",

      liveDatabase:
        "लाइव डेटाबेस",

      noEvents:
        "कोई गतिविधि नहीं मिली",

      noEventsDescription:
        "वर्तमान खोज और फ़िल्टर से कोई इवेंट नहीं मिला।",

      booking:
        "बुकिंग",

      actor:
        "अभिनेता",

      actorId:
        "अभिनेता ID",

      changedFields:
        "बदले गए फ़ील्ड",

      footer:
        "गतिविधि रिकॉर्ड लाइव स्थिति इतिहास से पढ़े जाते हैं।",

      displayed:
        "दिखाए गए",

    },


    te: {

      title:
        "యాక్టివిటీ లాగ్",

      subtitle:
        "ముఖ్యమైన సిస్టమ్ మరియు అడ్మిన్ చర్యల పూర్తి చరిత్ర.",

      eyebrow:
        "ఆడిట్ & యాక్టివిటీ",

      heading:
        "KrishiSetuలో ఏమి జరిగిందో చూడండి.",

      description:
        "బుకింగ్ మార్పులు, ఆపరేటర్ చర్యలు, తూకం, కొనుగోలు మరియు చెల్లింపు ఈవెంట్లను లైవ్‌గా సమీక్షించండి.",

      liveData:
        "లైవ్ డేటా",

      refreshing:
        "రిఫ్రెష్ చేస్తోంది...",

      refresh:
        "రిఫ్రెష్",

      loadError:
        "యాక్టివిటీ లాగ్‌ను లోడ్ చేయలేకపోయాము.",

      configurationIssue:
        "యాక్టివిటీ లాగ్ సమస్య",

      totalEvents:
        "మొత్తం ఈవెంట్లు",

      todayEvents:
        "ఈరోజు ఈవెంట్లు",

      adminActions:
        "అడ్మిన్ చర్యలు",

      procurementEvents:
        "కొనుగోలు ఈవెంట్లు",

      searchPlaceholder:
        "బుకింగ్, టోకెన్, రైతు, ఆపరేటర్ లేదా నోట్ వెతకండి...",

      allStatuses:
        "అన్ని స్థితులు",

      allActors:
        "అన్ని యాక్టర్లు",

      clear:
        "క్లియర్",

      timeline:
        "ఆడిట్ టైమ్‌లైన్",

      events:
        "ఈవెంట్లు",

      liveDatabase:
        "లైవ్ డేటాబేస్",

      noEvents:
        "యాక్టివిటీ కనుగొనబడలేదు",

      noEventsDescription:
        "ప్రస్తుత శోధన మరియు ఫిల్టర్‌లకు సరిపోయే ఈవెంట్లు లేవు.",

      booking:
        "బుకింగ్",

      actor:
        "యాక్టర్",

      actorId:
        "యాక్టర్ ID",

      changedFields:
        "మారిన ఫీల్డ్‌లు",

      footer:
        "యాక్టివిటీ రికార్డులు లైవ్ స్టేటస్ ఈవెంట్ చరిత్ర నుండి చదవబడతాయి.",

      displayed:
        "చూపబడుతున్నవి",

    },

  };


  return (
    copy[
      language
    ] ||
    copy.en
  );

}


export default AdminActivityLog;