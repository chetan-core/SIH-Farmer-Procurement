import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  CreditCard,
  Filter,
  RefreshCw,
  Scale,
  Search,
  TicketCheck,
  UserRound,
  Wheat,
  X,
} from "lucide-react";

import {
  Link,
} from "react-router";

import AdminLayout from "../../components/admin/AdminLayout";


const API_URL =
  import.meta.env.VITE_API_URL;


const STATUS_ORDER = [
  "CONFIRMED",
  "ARRIVED",
  "LATE",
  "WEIGHING",
  "PROCURED",
  "PAYMENT_PENDING",
  "PAYMENT_SENT",
];


function AdminQueue() {

  const [
    bookings,
    setBookings,
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
    language,
    setLanguage,
  ] = useState(
    () =>
      localStorage.getItem(
        "krishisetu-language"
      ) || "en"
  );


  const [
    search,
    setSearch,
  ] = useState("");


  const [
    statusFilter,
    setStatusFilter,
  ] = useState("ALL");


  const [
    cropFilter,
    setCropFilter,
  ] = useState("ALL");


  const [
    dateFilter,
    setDateFilter,
  ] = useState("ALL");


  const [
    sortMode,
    setSortMode,
  ] = useState("queue");


  const [
    selectedBooking,
    setSelectedBooking,
  ] = useState(null);


  const [
    updatingId,
    setUpdatingId,
  ] = useState(null);


  const text =
    getQueueCopy(
      language
    );


  const loadBookings =
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

        } else if (
          bookings.length ===
          0
        ) {

          setLoading(
            true
          );

        }


        try {

          const response =
            await fetch(
              `${API_URL}/bookings`
            );


          const data =
            await response.json();


          if (
            !response.ok
          ) {

            throw new Error(
              data?.message ||
              "Unable to load the live queue."
            );

          }


          setBookings(
            Array.isArray(
              data?.bookings
            )
              ? data.bookings
              : []
          );


          setError("");


        } catch (
          loadError
        ) {

          console.error(
            "Admin queue error:",
            loadError
          );


          setError(
            loadError?.message ||
            "Unable to connect to the procurement backend."
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
        bookings.length,
      ]
    );


  useEffect(() => {

    loadBookings();


    function handleExternalRefresh() {

      loadBookings(
        true
      );

    }


    function handleLanguageChange(
      event
    ) {

      setLanguage(
        event?.detail?.language ||
        localStorage.getItem(
          "krishisetu-language"
        ) ||
        "en"
      );

    }


    window.addEventListener(
      "krishisetu-admin-refresh",
      handleExternalRefresh
    );


    window.addEventListener(
      "krishisetu-language-change",
      handleLanguageChange
    );


    const timer =
      setInterval(
        () =>
          loadBookings(false),
        5000
      );


    return () => {

      clearInterval(
        timer
      );


      window.removeEventListener(
        "krishisetu-admin-refresh",
        handleExternalRefresh
      );


      window.removeEventListener(
        "krishisetu-language-change",
        handleLanguageChange
      );

    };

  }, [
    loadBookings,
  ]);


  const stats =
    useMemo(
      () =>
        getQueueStats(
          bookings
        ),
      [
        bookings,
      ]
    );


  const cropOptions =
    useMemo(
      () => {

        const values =
          bookings
            .map(
              (
                booking
              ) =>
                booking.crop
            )
            .filter(Boolean);


        return [
          "ALL",
          ...Array.from(
            new Set(
              values
            )
          ),
        ];

      },
      [
        bookings,
      ]
    );


  const dateOptions =
    useMemo(
      () => {

        const values =
          bookings
            .map(
              (
                booking
              ) =>
                booking.date
            )
            .filter(Boolean)
            .sort();


        return [
          "ALL",
          ...Array.from(
            new Set(
              values
            )
          ),
        ];

      },
      [
        bookings,
      ]
    );


  const filteredBookings =
    useMemo(
      () => {

        const query =
          search
            .trim()
            .toLowerCase();


        const rows =
          bookings.filter(
            (
              booking
            ) => {

              if (
                statusFilter !==
                  "ALL" &&
                booking.status !==
                  statusFilter
              ) {

                return false;

              }


              if (
                cropFilter !==
                  "ALL" &&
                booking.crop !==
                  cropFilter
              ) {

                return false;

              }


              if (
                dateFilter !==
                  "ALL" &&
                booking.date !==
                  dateFilter
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
                  booking.id,
                  booking.token,
                  booking.farmer_name,
                  booking.farmer_phone,
                  booking.farmer_village,
                  booking.crop,
                  booking.center_id,
                ]
                  .filter(Boolean)
                  .join(" ")
                  .toLowerCase();


              return searchable.includes(
                query
              );

            }
          );


        return sortBookings(
          rows,
          sortMode
        );

      },
      [
        bookings,
        search,
        statusFilter,
        cropFilter,
        dateFilter,
        sortMode,
      ]
    );


  async function updateStatus(
    booking,
    nextStatus
  ) {

    if (
      updatingId
    ) {

      return;

    }


    /*
     * Payment transitions belong to
     * Admin Payments, not Queue.
     */

    if (
      [
        "PAYMENT_PENDING",
        "PAYMENT_SENT",
      ].includes(
        nextStatus
      )
    ) {

      return;

    }


    if (
      booking.status ===
      nextStatus
    ) {

      return;

    }


    setUpdatingId(
      booking.id
    );


    setError("");


    try {

      const response =
        await fetch(
          `${API_URL}/bookings/${encodeURIComponent(
            booking.id
          )}/status`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                status:
                  nextStatus,
              }),
          }
        );


      const data =
        await response.json();


      if (
        !response.ok
      ) {

        throw new Error(
          data?.message ||
          "Unable to update booking status."
        );

      }


      await loadBookings(
        true
      );


      setSelectedBooking(
        null
      );


    } catch (
      statusError
    ) {

      console.error(
        "Status update error:",
        statusError
      );


      setError(
        statusError?.message ||
        "Unable to update booking."
      );

    } finally {

      setUpdatingId(
        null
      );

    }

  }


  return (

    <AdminLayout
      title={
        text.title
      }
      subtitle={
        text.subtitle
      }
    >

      <div className="admin-queue-page">


        {/* =====================================================
            HERO
        ====================================================== */}

        <section className="admin-queue-hero">


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


          <div className="admin-queue-hero-actions">


            <div className="admin-queue-live-indicator">

              <span />

              {text.liveUpdating}

            </div>


            <button
              type="button"
              className="admin-queue-refresh-button"
              onClick={() =>
                loadBookings(
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



        {error && (

          <div className="admin-queue-error">

            <AlertTriangle
              size={17}
            />


            <div>

              <strong>
                {text.problem}
              </strong>


              <span>
                {error}
              </span>

            </div>


            <button
              type="button"
              onClick={() =>
                loadBookings(
                  true
                )
              }
            >

              {text.retry}

            </button>

          </div>

        )}



        {/* =====================================================
            STATS
        ====================================================== */}

        <section className="admin-queue-stats">


          <QueueStat
            tone="blue"
            icon={
              <TicketCheck
                size={18}
              />
            }
            label={
              text.confirmed
            }
            value={
              stats.confirmed
            }
            active={
              statusFilter ===
              "CONFIRMED"
            }
            onClick={() =>
              setStatusFilter(
                statusFilter ===
                  "CONFIRMED"
                  ? "ALL"
                  : "CONFIRMED"
              )
            }
          />


          <QueueStat
            tone="green"
            icon={
              <CheckCircle2
                size={18}
              />
            }
            label={
              text.arrived
            }
            value={
              stats.arrived
            }
            active={
              statusFilter ===
              "ARRIVED"
            }
            onClick={() =>
              setStatusFilter(
                statusFilter ===
                  "ARRIVED"
                  ? "ALL"
                  : "ARRIVED"
              )
            }
          />


          <QueueStat
            tone="orange"
            icon={
              <Clock3
                size={18}
              />
            }
            label={
              text.late
            }
            value={
              stats.late
            }
            active={
              statusFilter ===
              "LATE"
            }
            onClick={() =>
              setStatusFilter(
                statusFilter ===
                  "LATE"
                  ? "ALL"
                  : "LATE"
              )
            }
          />


          <QueueStat
            tone="purple"
            icon={
              <Scale
                size={18}
              />
            }
            label={
              text.weighing
            }
            value={
              stats.weighing
            }
            active={
              statusFilter ===
              "WEIGHING"
            }
            onClick={() =>
              setStatusFilter(
                statusFilter ===
                  "WEIGHING"
                  ? "ALL"
                  : "WEIGHING"
              )
            }
          />


          <QueueStat
            tone="gold"
            icon={
              <CreditCard
                size={18}
              />
            }
            label={
              text.paymentPending
            }
            value={
              stats.paymentPending
            }
            active={
              statusFilter ===
              "PAYMENT_PENDING"
            }
            onClick={() =>
              setStatusFilter(
                statusFilter ===
                  "PAYMENT_PENDING"
                  ? "ALL"
                  : "PAYMENT_PENDING"
              )
            }
          />


          <QueueStat
            tone="teal"
            icon={
              <CheckCircle2
                size={18}
              />
            }
            label={
              text.completed
            }
            value={
              stats.completed
            }
            active={
              statusFilter ===
              "PROCURED"
            }
            onClick={() =>
              setStatusFilter(
                statusFilter ===
                  "PROCURED"
                  ? "ALL"
                  : "PROCURED"
              )
            }
          />

        </section>



        {/* =====================================================
            FILTERS
        ====================================================== */}

        <section className="admin-queue-filter-panel">


          <div className="admin-queue-search">

            <Search
              size={17}
            />


            <input
              type="text"
              placeholder={
                text.searchPlaceholder
              }
              value={
                search
              }
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />

          </div>


          <div className="admin-queue-filter-control">

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


              {STATUS_ORDER.map(
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


          <div className="admin-queue-filter-control">

            <Wheat
              size={14}
            />


            <select
              value={
                cropFilter
              }
              onChange={(event) =>
                setCropFilter(
                  event.target.value
                )
              }
            >

              <option value="ALL">
                {text.allCrops}
              </option>


              {cropOptions
                .filter(
                  (
                    crop
                  ) =>
                    crop !==
                    "ALL"
                )
                .map(
                  (
                    crop
                  ) => (

                    <option
                      key={
                        crop
                      }
                      value={
                        crop
                      }
                    >

                      {
                        getCropName(
                          crop,
                          language
                        )
                      }

                    </option>

                  )
                )}

            </select>

          </div>


          <div className="admin-queue-filter-control">

            <CalendarDays
              size={14}
            />


            <select
              value={
                dateFilter
              }
              onChange={(event) =>
                setDateFilter(
                  event.target.value
                )
              }
            >

              <option value="ALL">
                {text.allDates}
              </option>


              {dateOptions
                .filter(
                  (
                    date
                  ) =>
                    date !==
                    "ALL"
                )
                .map(
                  (
                    date
                  ) => (

                    <option
                      key={
                        date
                      }
                      value={
                        date
                      }
                    >

                      {
                        formatAdminDate(
                          date,
                          language
                        )
                      }

                    </option>

                  )
                )}

            </select>

          </div>


          <div className="admin-queue-filter-control">

            <ChevronDown
              size={14}
            />


            <select
              value={
                sortMode
              }
              onChange={(event) =>
                setSortMode(
                  event.target.value
                )
              }
            >

              <option value="queue">
                {text.queueOrder}
              </option>

              <option value="newest">
                {text.newest}
              </option>

              <option value="oldest">
                {text.oldest}
              </option>

              <option value="token">
                {text.tokenOrder}
              </option>

            </select>

          </div>


          {(search ||
            statusFilter !==
              "ALL" ||
            cropFilter !==
              "ALL" ||
            dateFilter !==
              "ALL") && (

            <button
              type="button"
              className="admin-clear-filters"
              onClick={() => {

                setSearch("");

                setStatusFilter(
                  "ALL"
                );

                setCropFilter(
                  "ALL"
                );

                setDateFilter(
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
            TABLE
        ====================================================== */}

        <section className="admin-queue-table-panel">


          <div className="admin-queue-table-header">

            <div>

              <span className="admin-page-eyebrow">

                {text.currentQueue}

              </span>


              <h3>

                {
                  filteredBookings.length
                }

                {" "}

                {text.records}

              </h3>

            </div>


            <span className="admin-queue-result-note">

              {text.liveDatabase}

            </span>

          </div>



          <div className="admin-full-queue-table">


            <div className="admin-full-table-head">

              <span>
                {text.booking}
              </span>

              <span>
                {text.farmer}
              </span>

              <span>
                {text.produce}
              </span>

              <span>
                {text.schedule}
              </span>

              <span>
                {text.status}
              </span>

              <span>
                {text.action}
              </span>

            </div>



            {loading ? (

              <QueueLoadingRows />

            ) : filteredBookings.length ===
              0 ? (

              <div className="admin-queue-empty">

                <div className="admin-queue-empty-icon">

                  <Search
                    size={23}
                  />

                </div>


                <h3>
                  {text.noMatchingBookings}
                </h3>


                <p>
                  {text.noMatchingBookingsText}
                </p>


                <button
                  type="button"
                  onClick={() => {

                    setSearch("");

                    setStatusFilter(
                      "ALL"
                    );

                    setCropFilter(
                      "ALL"
                    );

                    setDateFilter(
                      "ALL"
                    );

                  }}
                >

                  {text.clearFilters}

                </button>

              </div>

            ) : (

              filteredBookings.map(
                (
                  booking
                ) => (

                  <QueueTableRow
                    key={
                      booking.id
                    }
                    booking={
                      booking
                    }
                    language={
                      language
                    }
                    text={
                      text
                    }
                    updating={
                      updatingId ===
                      booking.id
                    }
                    onOpen={() =>
                      setSelectedBooking(
                        booking
                      )
                    }
                    onStatusChange={
                      updateStatus
                    }
                  />

                )
              )

            )}

          </div>

        </section>



        <section className="admin-queue-info-grid">


          <QueueInfoCard
            icon={
              <UserRound
                size={19}
              />
            }
            tone="blue"
            title={
              text.operatorControl
            }
            text={
              text.operatorControlText
            }
          />


          <QueueInfoCard
            icon={
              <RefreshCw
                size={19}
              />
            }
            tone="green"
            title={
              text.autoUpdates
            }
            text={
              text.autoUpdatesText
            }
          />


          <QueueInfoCard
            icon={
              <Scale
                size={19}
              />
            }
            tone="purple"
            title={
              text.nextStage
            }
            text={
              text.nextStageText
            }
          />

        </section>



        {selectedBooking && (

          <BookingDrawer
            booking={
              selectedBooking
            }
            language={
              language
            }
            text={
              text
            }
            updating={
              updatingId ===
              selectedBooking.id
            }
            onClose={() =>
              setSelectedBooking(
                null
              )
            }
            onStatusChange={
              updateStatus
            }
          />

        )}

      </div>

    </AdminLayout>

  );
}


/* =========================================================
   STAT
========================================================= */

function QueueStat({
  icon,
  tone,
  label,
  value,
  active,
  onClick,
}) {

  return (

    <button
      type="button"
      className={
        `admin-queue-stat ${tone} ${
          active
            ? "active"
            : ""
        }`
      }
      onClick={
        onClick
      }
    >

      <div className="admin-queue-stat-icon">
        {icon}
      </div>


      <div className="admin-queue-stat-content">

        <span>
          {label}
        </span>


        <strong>
          {value}
        </strong>

      </div>


      <ArrowRight
        size={14}
        className="admin-queue-stat-arrow"
      />

    </button>

  );
}
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
    return "teal";
  }

  if (
    status ===
    "PROCURED"
  ) {
    return "green";
  }

  return "blue";
}

function StatusPill({
  status,
  language,
}) {

  return (
    <span
      className={
        `admin-status-pill ${
          getStatusTone(status)
        }`
      }
    >

      <span />

      {
        getStatusLabel(
          status,
          language
        )
      }

    </span>
  );

}
/* =========================================================
   ROW
========================================================= */

function QueueTableRow({
  booking,
  language,
  text,
  updating,
  onOpen,
  onStatusChange,
}) {

  const status =
    booking.status ||
    "CONFIRMED";


  const nextAction =
    getNextAction(
      status
    );


  const paymentState =
    [
      "PAYMENT_PENDING",
      "PAYMENT_SENT",
    ].includes(
      status
    );


  return (

    <div className="admin-full-table-row">


      <div className="admin-full-booking-cell">

        <div className="admin-token-badge">

          <TicketCheck
            size={14}
          />

        </div>


        <div>

          <strong>
            #{booking.token || "—"}
          </strong>


          <span>
            {booking.id || "—"}
          </span>

        </div>

      </div>



      <div className="admin-full-farmer-cell">

        <div className="admin-farmer-avatar">

          <UserRound
            size={15}
          />

        </div>


        <div>

          <strong>
            {
              booking.farmer_name ||
              text.unknownFarmer
            }
          </strong>


          <span>
            {
              booking.farmer_phone ||
              booking.farmer_village ||
              "—"
            }
          </span>

        </div>

      </div>



      <div className="admin-full-produce-cell">

        <div className="admin-produce-name">

          <Wheat
            size={14}
          />


          <strong>

            {
              getCropName(
                booking.crop,
                language
              )
            }

          </strong>

        </div>


        <span>

          {
            Number(
              booking.actual_quantity ??
              booking.estimated_quantity ??
              0
            ).toLocaleString()
          }

          {" kg"}


          {booking.actual_quantity !==
            null &&
           booking.actual_quantity !==
            undefined && (

            <small>
              {" "}
              · {text.actual}
            </small>

          )}

        </span>

      </div>



      <div className="admin-full-schedule-cell">

        <div>

          <CalendarDays
            size={13}
          />


          <strong>

            {
              formatAdminDate(
                booking.date,
                language
              )
            }

          </strong>

        </div>


        <span>

          {
            formatAdminTime(
              booking.slot_start,
              booking.slot_end
            )
          }

        </span>

      </div>



      <div className="admin-full-status-cell">

        <StatusPill
          status={
            status
          }
          language={
            language
          }
        />

      </div>



      <div className="admin-full-action-cell">

        <button
          type="button"
          className="admin-row-view-button"
          onClick={
            onOpen
          }
        >

          {text.view}

        </button>


        {paymentState ? (

          <Link
            to="/admin/payments"
            className="admin-row-payment-link"
          >

            <CreditCard
              size={13}
            />

            {text.openPayments}

          </Link>

        ) : nextAction ? (

          <button
            type="button"
            className={
              `admin-row-action-button ${
                nextAction.tone
              }`
            }
            disabled={
              updating
            }
            onClick={() =>
              onStatusChange(
                booking,
                nextAction.status
              )
            }
          >

            {updating ? (

              <RefreshCw
                size={13}
                className="admin-refresh-spin"
              />

            ) : (

              <>

                {nextAction.icon}

                <span>
                  {
                    getActionLabel(
                      nextAction.status,
                      text
                    )
                  }
                </span>

              </>

            )}

          </button>

        ) : null}

      </div>

    </div>

  );
}


/* =========================================================
   DRAWER
========================================================= */

function BookingDrawer({
  booking,
  language,
  text,
  updating,
  onClose,
  onStatusChange,
}) {

  const status =
    booking.status ||
    "CONFIRMED";


  const nextAction =
    getNextAction(
      status
    );


  const paymentState =
    [
      "PAYMENT_PENDING",
      "PAYMENT_SENT",
    ].includes(
      status
    );


  const currentIndex =
    Math.max(
      STATUS_ORDER.indexOf(
        status
      ),
      0
    );


  return (

    <>

      <div
        className="admin-booking-drawer-overlay"
        onClick={
          onClose
        }
      />


      <aside className="admin-booking-drawer">


        <div className="admin-drawer-header">

          <div>

            <span className="admin-page-eyebrow">

              {text.bookingDetails}

            </span>


            <h2>

              #
              {
                booking.token ||
                booking.id
              }

            </h2>

          </div>


          <button
            type="button"
            className="admin-drawer-close"
            onClick={
              onClose
            }
          >

            <X
              size={19}
            />

          </button>

        </div>



        <div className="admin-drawer-status">

          <StatusPill
            status={
              status
            }
            language={
              language
            }
          />


          <span>

            {
              getStatusDescription(
                status,
                language
              )
            }

          </span>

        </div>



        <div className="admin-drawer-body">


          <DrawerSection
            title={
              text.farmerInformation
            }
            icon={
              <UserRound
                size={17}
              />
            }
          >

            <DrawerField
              label={
                text.name
              }
              value={
                booking.farmer_name ||
                "—"
              }
            />


            <DrawerField
              label={
                text.phone
              }
              value={
                booking.farmer_phone ||
                "—"
              }
            />


            <DrawerField
              label={
                text.village
              }
              value={
                booking.farmer_village ||
                "—"
              }
            />

          </DrawerSection>



          <DrawerSection
            title={
              text.produceInformation
            }
            icon={
              <Wheat
                size={17}
              />
            }
          >

            <DrawerField
              label={
                text.crop
              }
              value={
                getCropName(
                  booking.crop,
                  language
                )
              }
            />


            <DrawerField
              label={
                text.estimatedQuantity
              }
              value={
                `${Number(
                  booking.estimated_quantity ||
                  0
                ).toLocaleString()} kg`
              }
            />


            <DrawerField
              label={
                text.actualQuantity
              }
              value={
                booking.actual_quantity ===
                  null ||
                booking.actual_quantity ===
                  undefined
                  ? text.notRecorded
                  : `${Number(
                      booking.actual_quantity
                    ).toLocaleString()} kg`
              }
            />


            <DrawerField
              label={
                text.quality
              }
              value={
                booking.quality ||
                text.notRecorded
              }
            />

          </DrawerSection>



          <DrawerSection
            title={
              text.scheduleInformation
            }
            icon={
              <CalendarDays
                size={17}
              />
            }
          >

            <DrawerField
              label={
                text.date
              }
              value={
                formatAdminDate(
                  booking.date,
                  language
                )
              }
            />


            <DrawerField
              label={
                text.arrivalWindow
              }
              value={
                formatAdminTime(
                  booking.slot_start,
                  booking.slot_end
                )
              }
            />


            <DrawerField
              label={
                text.center
              }
              value={
                booking.center_id ||
                "Main Procurement Center"
              }
            />

          </DrawerSection>



          <DrawerSection
            title={
              text.statusTimeline
            }
            icon={
              <Clock3
                size={17}
              />
            }
          >

            <div className="admin-drawer-mini-timeline">

              {STATUS_ORDER.map(
                (
                  item,
                  index
                ) => (

                  <div
                    key={
                      item
                    }
                    className={
                      `admin-mini-timeline-item ${
                        index <
                        currentIndex
                          ? "complete"
                          : ""
                      } ${
                        index ===
                        currentIndex
                          ? "active"
                          : ""
                      }`
                    }
                  >

                    <div>

                      {index <
                        currentIndex ? (

                        <Check
                          size={11}
                        />

                      ) : (

                        <span />

                      )}

                    </div>


                    <span>

                      {
                        getStatusLabel(
                          item,
                          language
                        )
                      }

                    </span>

                  </div>

                )
              )}

            </div>

          </DrawerSection>



          {paymentState ? (

            <div className="admin-drawer-action-card">

              <span>
                {text.nextAction}
              </span>


              <strong>
                {text.openPayments}
              </strong>


              <p>
                {text.paymentActionText}
              </p>


              <Link
                to="/admin/payments"
                className="admin-drawer-action gold"
              >

                <CreditCard
                  size={15}
                />

                {text.openPayments}

                <ArrowRight
                  size={15}
                />

              </Link>

            </div>

          ) : nextAction && (

            <div className="admin-drawer-action-card">

              <span>
                {text.nextAction}
              </span>


              <strong>

                {
                  getActionLabel(
                    nextAction.status,
                    text
                  )
                }

              </strong>


              <p>

                {
                  getActionDescription(
                    nextAction.status,
                    language
                  )
                }

              </p>


              <button
                type="button"
                className={
                  `admin-drawer-action ${
                    nextAction.tone
                  }`
                }
                disabled={
                  updating
                }
                onClick={() =>
                  onStatusChange(
                    booking,
                    nextAction.status
                  )
                }
              >

                {updating ? (

                  <>

                    <RefreshCw
                      size={15}
                      className="admin-refresh-spin"
                    />

                    {text.updating}

                  </>

                ) : (

                  <>

                    {nextAction.icon}

                    {
                      getActionLabel(
                        nextAction.status,
                        text
                      )
                    }

                    <ArrowRight
                      size={15}
                    />

                  </>

                )}

              </button>

            </div>

          )}

        </div>



        <div className="admin-drawer-footer">

          <button
            type="button"
            onClick={
              onClose
            }
          >
            {text.close}
          </button>


          <Link
            to={
              `/admin/booking/${encodeURIComponent(
                booking.id
              )}`
            }
            className="admin-drawer-details-link"
          >

            {text.openFullRecord}

            <ArrowRight
              size={14}
            />

          </Link>

        </div>

      </aside>

    </>

  );
}


/* =========================================================
   DRAWER HELPERS
========================================================= */

function DrawerSection({
  title,
  icon,
  children,
}) {

  return (

    <section className="admin-drawer-section">

      <div className="admin-drawer-section-heading">

        <div>
          {icon}
        </div>


        <h3>
          {title}
        </h3>

      </div>


      <div className="admin-drawer-section-content">

        {children}

      </div>

    </section>

  );
}


function DrawerField({
  label,
  value,
}) {

  return (

    <div className="admin-drawer-field">

      <span>
        {label}
      </span>


      <strong>
        {value}
      </strong>

    </div>

  );

}


/* =========================================================
   INFO
========================================================= */

function QueueInfoCard({
  icon,
  tone,
  title,
  text,
}) {

  return (

    <div
      className={
        `admin-queue-info-card ${tone}`
      }
    >

      <div className="admin-queue-info-icon">

        {icon}

      </div>


      <div>

        <strong>
          {title}
        </strong>


        <span>
          {text}
        </span>

      </div>

    </div>

  );
}


/* =========================================================
   LOADING
========================================================= */

function QueueLoadingRows() {

  return (

    <div className="admin-queue-loading">

      {[
        1,
        2,
        3,
        4,
        5,
        6,
      ].map(
        (
          item
        ) => (

          <div
            key={
              item
            }
            className="admin-full-skeleton-row"
          >

            <span />
            <span />
            <span />
            <span />
            <span />
            <span />

          </div>

        )
      )}

    </div>

  );

}


/* =========================================================
   DATA HELPERS
========================================================= */

function getQueueStats(
  bookings
) {

  return {

    confirmed:
      bookings.filter(
        (
          booking
        ) =>
          booking.status ===
          "CONFIRMED"
      ).length,

    arrived:
      bookings.filter(
        (
          booking
        ) =>
          booking.status ===
          "ARRIVED"
      ).length,

    late:
      bookings.filter(
        (
          booking
        ) =>
          booking.status ===
          "LATE"
      ).length,

    weighing:
      bookings.filter(
        (
          booking
        ) =>
          booking.status ===
          "WEIGHING"
      ).length,

    paymentPending:
      bookings.filter(
        (
          booking
        ) =>
          booking.status ===
          "PAYMENT_PENDING"
      ).length,

    completed:
      bookings.filter(
        (
          booking
        ) =>
          booking.status ===
            "PROCURED" ||
          booking.status ===
            "PAYMENT_SENT"
      ).length,

  };

}


function sortBookings(
  bookings,
  mode
) {

  const rows =
    [...bookings];


  if (
    mode ===
    "newest"
  ) {

    return rows.sort(
      (
        a,
        b
      ) =>
        String(
          b.created_at ||
          ""
        ).localeCompare(
          String(
            a.created_at ||
            ""
          )
        )
    );

  }


  if (
    mode ===
    "oldest"
  ) {

    return rows.sort(
      (
        a,
        b
      ) =>
        String(
          a.created_at ||
          ""
        ).localeCompare(
          String(
            b.created_at ||
            ""
          )
        )
    );

  }


  if (
    mode ===
    "token"
  ) {

    return rows.sort(
      (
        a,
        b
      ) =>
        String(
          a.token ||
          ""
        ).localeCompare(
          String(
            b.token ||
            ""
          ),
          undefined,
          {
            numeric:
              true,
          }
        )
    );

  }


  const rank = {

    LATE:
      1,

    ARRIVED:
      2,

    WEIGHING:
      3,

    CONFIRMED:
      4,

    PROCURED:
      5,

    PAYMENT_PENDING:
      6,

    PAYMENT_SENT:
      7,

  };


  return rows.sort(
    (
      a,
      b
    ) => {

      const statusDifference =
        (
          rank[
            a.status
          ] ||
          99
        ) -
        (
          rank[
            b.status
          ] ||
          99
        );


      if (
        statusDifference !==
        0
      ) {

        return statusDifference;

      }


      return String(
        a.created_at ||
        ""
      ).localeCompare(
        String(
          b.created_at ||
          ""
        )
      );

    }
  );

}


function getNextAction(
  status
) {

  if (
    status ===
    "CONFIRMED"
  ) {

    return {

      status:
        "ARRIVED",

      tone:
        "green",

      icon:
        <CheckCircle2
          size={14}
        />,

    };

  }


  if (
    status ===
      "ARRIVED" ||
    status ===
      "LATE"
  ) {

    return {

      status:
        "WEIGHING",

      tone:
        "purple",

      icon:
        <Scale
          size={14}
        />,

    };

  }


  if (
    status ===
    "WEIGHING"
  ) {

    return null;

  }


  return null;

}


function getActionLabel(
  status,
  text
) {

  const labels = {

    ARRIVED:
      text.markArrived,

    WEIGHING:
      text.startWeighing,

    PROCURED:
      text.completeProcurement,

  };


  return (
    labels[
      status
    ] ||
    status
  );

}


function getActionDescription(
  status,
  language
) {

  const descriptions = {

    en: {

      ARRIVED:
        "Record that the farmer has reached the center.",

      WEIGHING:
        "Move this farmer to the weighing stage.",

      PROCURED:
        "Complete procurement from the weighing desk.",

    },


    hi: {

      ARRIVED:
        "किसान के केंद्र पर पहुंचने की जानकारी दर्ज करें।",

      WEIGHING:
        "इस किसान को वजन की प्रक्रिया में भेजें।",

      PROCURED:
        "वजन डेस्क से खरीद पूरी करें।",

    },


    te: {

      ARRIVED:
        "రైతు కేంద్రానికి చేరుకున్నట్లు నమోదు చేయండి.",

      WEIGHING:
        "ఈ రైతును తూకం దశకు పంపండి.",

      PROCURED:
        "తూకం డెస్క్ నుండి కొనుగోలు పూర్తి చేయండి.",

    },

  };


  return (
    descriptions[
      language
    ]?.[
      status
    ] ||
    descriptions.en[
      status
    ] ||
    ""
  );

}


/* =========================================================
   STATUS
========================================================= */

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
   DESCRIPTION
========================================================= */

function getStatusDescription(
  status,
  language
) {

  const descriptions = {

    en: {

      CONFIRMED:
        "The farmer has a confirmed procurement slot.",

      ARRIVED:
        "The farmer has been recorded as arrived.",

      LATE:
        "The farmer has been recorded as late.",

      WEIGHING:
        "The farmer is currently at the weighing stage.",

      PROCURED:
        "Procurement has been completed.",

      PAYMENT_PENDING:
        "The booking is waiting for payment processing.",

      PAYMENT_SENT:
        "The payment has been recorded as sent.",

    },


    hi: {

      CONFIRMED:
        "किसान का खरीद स्लॉट पुष्टि हो चुका है।",

      ARRIVED:
        "किसान के पहुंचने की जानकारी दर्ज है।",

      LATE:
        "किसान के देर से आने की जानकारी दर्ज है।",

      WEIGHING:
        "किसान फिलहाल वजन के चरण में है।",

      PROCURED:
        "खरीद पूरी हो चुकी है।",

      PAYMENT_PENDING:
        "बुकिंग भुगतान प्रक्रिया की प्रतीक्षा कर रही है।",

      PAYMENT_SENT:
        "भुगतान भेजा जा चुका है।",

    },


    te: {

      CONFIRMED:
        "రైతు కొనుగోలు స్లాట్ నిర్ధారించబడింది.",

      ARRIVED:
        "రైతు చేరుకున్నట్లు నమోదు చేయబడింది.",

      LATE:
        "రైతు ఆలస్యంగా వచ్చినట్లు నమోదు చేయబడింది.",

      WEIGHING:
        "రైతు ప్రస్తుతం తూకం దశలో ఉన్నారు.",

      PROCURED:
        "కొనుగోలు పూర్తైంది.",

      PAYMENT_PENDING:
        "బుకింగ్ చెల్లింపు కోసం వేచి ఉంది.",

      PAYMENT_SENT:
        "చెల్లింపు పంపబడింది.",

    },

  };


  return (
    descriptions[
      language
    ]?.[
      status
    ] ||
    descriptions.en[
      status
    ] ||
    ""
  );

}


/* =========================================================
   CROP
========================================================= */

function getCropName(
  crop,
  language
) {

  const names = {

    wheat: {
      en:
        "Wheat",
      hi:
        "गेहूं",
      te:
        "గోధుమ",
    },

    paddy: {
      en:
        "Paddy",
      hi:
        "धान",
      te:
        "వరి",
    },

    maize: {
      en:
        "Maize",
      hi:
        "मक्का",
      te:
        "మొక్కజొన్న",
    },

    cotton: {
      en:
        "Cotton",
      hi:
        "कपास",
      te:
        "పత్తి",
    },

  };


  return (
    names[
      crop
    ]?.[
      language
    ] ||
    names[
      crop
    ]?.en ||
    crop ||
    "—"
  );

}


/* =========================================================
   DATE
========================================================= */

function formatAdminDate(
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
      `${value}T00:00:00`
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return value;

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

    }
  );

}


/* =========================================================
   TIME
========================================================= */

function formatAdminTime(
  start,
  end
) {

  if (
    !start
  ) {

    return "—";

  }


  function convert(
    value
  ) {

    const parts =
      String(
        value
      ).split(
        ":"
      );


    const hour =
      Number(
        parts[0]
      );


    const minute =
      parts[1] ||
      "00";


    if (
      Number.isNaN(
        hour
      )
    ) {

      return value;

    }


    const suffix =
      hour >= 12
        ? "PM"
        : "AM";


    const displayHour =
      hour % 12 ||
      12;


    return `${displayHour}:${minute} ${suffix}`;

  }


  return end
    ? `${convert(start)} – ${convert(end)}`
    : convert(start);

}


/* =========================================================
   COPY
========================================================= */

function getQueueCopy(
  language
) {

  const copy = {

    en: {

      title:
        "Live Queue",

      subtitle:
        "Monitor and control every farmer moving through today's procurement workflow.",

      eyebrow:
        "QUEUE CONTROL",

      heading:
        "Manage today's procurement queue.",

      description:
        "Search bookings, manage arrival and weighing stages, and send completed procurement records to Payments.",

      liveUpdating:
        "LIVE UPDATING",

      refreshing:
        "Refreshing...",

      refresh:
        "Refresh",

      problem:
        "Queue connection issue",

      retry:
        "Retry",

      confirmed:
        "Confirmed",

      arrived:
        "Arrived",

      late:
        "Late",

      weighing:
        "Weighing",

      paymentPending:
        "Payment pending",

      completed:
        "Completed",

      searchPlaceholder:
        "Search token, farmer, phone or crop...",

      allStatuses:
        "All statuses",

      allCrops:
        "All crops",

      allDates:
        "All dates",

      queueOrder:
        "Queue priority",

      newest:
        "Newest first",

      oldest:
        "Oldest first",

      tokenOrder:
        "Token order",

      clear:
        "Clear",

      currentQueue:
        "CURRENT QUEUE",

      records:
        "records",

      liveDatabase:
        "Live database",

      booking:
        "Booking",

      farmer:
        "Farmer",

      produce:
        "Produce",

      schedule:
        "Schedule",

      status:
        "Status",

      action:
        "Action",

      actual:
        "actual",

      view:
        "View",

      openPayments:
        "Open Payments",

      paymentActionText:
        "This booking is ready for payment processing. Continue in the Payments page.",

      noMatchingBookings:
        "No matching bookings",

      noMatchingBookingsText:
        "Try changing the search or filters to see more records.",

      clearFilters:
        "Clear filters",

      bookingDetails:
        "BOOKING DETAILS",

      farmerInformation:
        "Farmer information",

      produceInformation:
        "Produce information",

      scheduleInformation:
        "Schedule information",

      statusTimeline:
        "Status timeline",

      nextAction:
        "NEXT OPERATOR ACTION",

      name:
        "Name",

      phone:
        "Phone",

      village:
        "Village",

      crop:
        "Crop",

      estimatedQuantity:
        "Estimated quantity",

      actualQuantity:
        "Actual quantity",

      quality:
        "Quality",

      notRecorded:
        "Not recorded",

      date:
        "Date",

      arrivalWindow:
        "Arrival window",

      center:
        "Center",

      updating:
        "Updating...",

      close:
        "Close",

      openFullRecord:
        "Open full record",

      markArrived:
        "Mark Arrived",

      startWeighing:
        "Start Weighing",

      completeProcurement:
        "Complete Procurement",

      unknownFarmer:
        "Unknown farmer",

      operatorControl:
        "Operator control",

      operatorControlText:
        "Use the action beside a booking to move it through arrival and weighing. Procurement calculations are handled at the weighing desk.",

      autoUpdates:
        "Live updates",

      autoUpdatesText:
        "The queue refreshes automatically so changes from other operators become visible.",

      nextStage:
        "Controlled progression",

      nextStageText:
        "Payment transitions are handled separately in the Payments module.",

    },


    hi: {

      title:
        "लाइव कतार",

      subtitle:
        "आज की खरीद प्रक्रिया में आगे बढ़ रहे हर किसान की निगरानी और नियंत्रण करें।",

      eyebrow:
        "कतार नियंत्रण",

      heading:
        "आज की खरीद कतार प्रबंधित करें।",

      description:
        "बुकिंग खोजें, आगमन और वजन चरण प्रबंधित करें और पूरी हुई खरीद को भुगतान पेज पर भेजें।",

      liveUpdating:
        "लाइव अपडेट",

      refreshing:
        "रीफ्रेश हो रहा है...",

      refresh:
        "रीफ्रेश",

      problem:
        "कतार कनेक्शन समस्या",

      retry:
        "फिर कोशिश करें",

      confirmed:
        "पुष्टि",

      arrived:
        "पहुंचे",

      late:
        "देर से",

      weighing:
        "वजन",

      paymentPending:
        "भुगतान लंबित",

      completed:
        "पूरा",

      searchPlaceholder:
        "टोकन, किसान, फोन या फसल खोजें...",

      allStatuses:
        "सभी स्थितियां",

      allCrops:
        "सभी फसलें",

      allDates:
        "सभी तारीखें",

      queueOrder:
        "कतार प्राथमिकता",

      newest:
        "नवीनतम पहले",

      oldest:
        "पुराने पहले",

      tokenOrder:
        "टोकन क्रम",

      clear:
        "साफ करें",

      currentQueue:
        "वर्तमान कतार",

      records:
        "रिकॉर्ड",

      liveDatabase:
        "लाइव डेटाबेस",

      booking:
        "बुकिंग",

      farmer:
        "किसान",

      produce:
        "उपज",

      schedule:
        "समय",

      status:
        "स्थिति",

      action:
        "कार्रवाई",

      actual:
        "वास्तविक",

      view:
        "देखें",

      openPayments:
        "भुगतान खोलें",

      paymentActionText:
        "यह बुकिंग भुगतान के लिए तैयार है। भुगतान पेज पर जाएं।",

      noMatchingBookings:
        "कोई मिलती बुकिंग नहीं",

      noMatchingBookingsText:
        "अधिक रिकॉर्ड देखने के लिए खोज या फ़िल्टर बदलें।",

      clearFilters:
        "फ़िल्टर साफ करें",

      bookingDetails:
        "बुकिंग विवरण",

      farmerInformation:
        "किसान जानकारी",

      produceInformation:
        "उपज जानकारी",

      scheduleInformation:
        "समय जानकारी",

      statusTimeline:
        "स्थिति क्रम",

      nextAction:
        "अगली ऑपरेटर कार्रवाई",

      name:
        "नाम",

      phone:
        "फोन",

      village:
        "गांव",

      crop:
        "फसल",

      estimatedQuantity:
        "अनुमानित मात्रा",

      actualQuantity:
        "वास्तविक मात्रा",

      quality:
        "गुणवत्ता",

      notRecorded:
        "दर्ज नहीं",

      date:
        "तारीख",

      arrivalWindow:
        "आने का समय",

      center:
        "केंद्र",

      updating:
        "अपडेट हो रहा है...",

      close:
        "बंद करें",

      openFullRecord:
        "पूरा रिकॉर्ड खोलें",

      markArrived:
        "पहुंचा हुआ दर्ज करें",

      startWeighing:
        "वजन शुरू करें",

      completeProcurement:
        "खरीद पूरी करें",

      unknownFarmer:
        "अज्ञात किसान",

      operatorControl:
        "ऑपरेटर नियंत्रण",

      operatorControlText:
        "बुकिंग को आगमन और वजन चरणों में भेजें। खरीद गणना वजन डेस्क पर होती है।",

      autoUpdates:
        "लाइव अपडेट",

      autoUpdatesText:
        "कतार अपने आप रीफ्रेश होती है ताकि अन्य ऑपरेटरों के बदलाव दिखाई दें।",

      nextStage:
        "नियंत्रित प्रगति",

      nextStageText:
        "भुगतान की स्थिति अलग से Payments मॉड्यूल में संभाली जाती है।",

    },


    te: {

      title:
        "లైవ్ క్యూ",

      subtitle:
        "ఈరోజు కొనుగోలు ప్రక్రియలో ఉన్న ప్రతి రైతును పర్యవేక్షించి నిర్వహించండి.",

      eyebrow:
        "క్యూ నియంత్రణ",

      heading:
        "ఈరోజు కొనుగోలు క్యూ నిర్వహించండి.",

      description:
        "బుకింగ్‌లను వెతికి, రాక మరియు తూకం దశలను నిర్వహించి, పూర్తయిన కొనుగోలును చెల్లింపు పేజీకి పంపండి.",

      liveUpdating:
        "లైవ్ అప్‌డేటింగ్",

      refreshing:
        "రిఫ్రెష్ చేస్తోంది...",

      refresh:
        "రిఫ్రెష్",

      problem:
        "క్యూ కనెక్షన్ సమస్య",

      retry:
        "మళ్లీ ప్రయత్నించండి",

      confirmed:
        "నిర్ధారించబడింది",

      arrived:
        "చేరుకున్నారు",

      late:
        "ఆలస్యం",

      weighing:
        "తూకం",

      paymentPending:
        "చెల్లింపు పెండింగ్",

      completed:
        "పూర్తైంది",

      searchPlaceholder:
        "టోకెన్, రైతు, ఫోన్ లేదా పంట వెతకండి...",

      allStatuses:
        "అన్ని స్థితులు",

      allCrops:
        "అన్ని పంటలు",

      allDates:
        "అన్ని తేదీలు",

      queueOrder:
        "క్యూ ప్రాధాన్యత",

      newest:
        "కొత్తవి ముందు",

      oldest:
        "పాతవి ముందు",

      tokenOrder:
        "టోకెన్ క్రమం",

      clear:
        "క్లియర్",

      currentQueue:
        "ప్రస్తుత క్యూ",

      records:
        "రికార్డులు",

      liveDatabase:
        "లైవ్ డేటాబేస్",

      booking:
        "బుకింగ్",

      farmer:
        "రైతు",

      produce:
        "పంట",

      schedule:
        "సమయం",

      status:
        "స్థితి",

      action:
        "చర్య",

      actual:
        "వాస్తవ",

      view:
        "చూడండి",

      openPayments:
        "చెల్లింపులు తెరవండి",

      paymentActionText:
        "ఈ బుకింగ్ చెల్లింపుకు సిద్ధంగా ఉంది. చెల్లింపు పేజీకి వెళ్లండి.",

      noMatchingBookings:
        "సరిపోలే బుకింగ్‌లు లేవు",

      noMatchingBookingsText:
        "మరిన్ని రికార్డుల కోసం శోధన లేదా ఫిల్టర్ మార్చండి.",

      clearFilters:
        "ఫిల్టర్‌లను క్లియర్ చేయండి",

      bookingDetails:
        "బుకింగ్ వివరాలు",

      farmerInformation:
        "రైతు సమాచారం",

      produceInformation:
        "పంట సమాచారం",

      scheduleInformation:
        "సమయ సమాచారం",

      statusTimeline:
        "స్థితి టైమ్‌లైన్",

      nextAction:
        "తదుపరి ఆపరేటర్ చర్య",

      name:
        "పేరు",

      phone:
        "ఫోన్",

      village:
        "గ్రామం",

      crop:
        "పంట",

      estimatedQuantity:
        "అంచనా పరిమాణం",

      actualQuantity:
        "వాస్తవ పరిమాణం",

      quality:
        "నాణ్యత",

      notRecorded:
        "నమోదు కాలేదు",

      date:
        "తేదీ",

      arrivalWindow:
        "రాక సమయం",

      center:
        "కేంద్రం",

      updating:
        "అప్‌డేట్ చేస్తోంది...",

      close:
        "మూసివేయండి",

      openFullRecord:
        "పూర్తి రికార్డు తెరవండి",

      markArrived:
        "చేరుకున్నట్లు నమోదు",

      startWeighing:
        "తూకం ప్రారంభించండి",

      completeProcurement:
        "కొనుగోలు పూర్తి చేయండి",

      unknownFarmer:
        "తెలియని రైతు",

      operatorControl:
        "ఆపరేటర్ నియంత్రణ",

      operatorControlText:
        "బుకింగ్‌ను రాక మరియు తూకం దశలలోకి పంపండి. కొనుగోలు లెక్కింపు తూకం డెస్క్ వద్ద జరుగుతుంది.",

      autoUpdates:
        "లైవ్ అప్‌డేట్‌లు",

      autoUpdatesText:
        "ఇతర ఆపరేటర్ల మార్పులు కనిపించడానికి క్యూ ఆటోమేటిక్‌గా రిఫ్రెష్ అవుతుంది.",

      nextStage:
        "నియంత్రిత పురోగతి",

      nextStageText:
        "చెల్లింపు స్థితులు Payments మాడ్యూల్‌లో ప్రత్యేకంగా నిర్వహించబడతాయి.",

    },

  };


  return (
    copy[
      language
    ] ||
    copy.en
  );

}


export default AdminQueue;