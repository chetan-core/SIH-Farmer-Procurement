import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  CreditCard,
  Database,
  IndianRupee,
  MapPin,
  MessageCircleWarning,
  RefreshCw,
  Scale,
  Users,
  Wheat,
} from "lucide-react";

import {
  Link,
} from "react-router";

import AdminLayout from "../../components/admin/AdminLayout";


const API_URL =
  import.meta.env.VITE_API_URL;


function AdminDashboard() {

  const [
    bookings,
    setBookings,
  ] =
    useState([]);


  const [
    centers,
    setCenters,
  ] =
    useState([]);


  const [
    settings,
    setSettings,
  ] =
    useState(null);


  const [
    paymentIssues,
    setPaymentIssues,
  ] =
    useState([]);


  const [
    loading,
    setLoading,
  ] =
    useState(true);


  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);


  const [
    error,
    setError,
  ] =
    useState("");


  const [
    language,
    setLanguage,
  ] =
    useState(
      () =>
        localStorage.getItem(
          "krishisetu-language"
        ) ||
        "en"
    );


  const text =
    getDashboardCopy(
      language
    );


  const loadDashboard =
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

          const [
            bookingResponse,
            centerResponse,
            settingsResponse,
            paymentIssueResponse,
          ] =
            await Promise.all([
              fetch(
                `${API_URL}/bookings`
              ),

              fetch(
                `${API_URL}/centers`
              ),

              fetch(
                `${API_URL}/settings`
              ),

              fetch(
                `${API_URL}/payment-issues`
              ),

            ]);


          const bookingData =
            await bookingResponse.json();


          const centerData =
            await centerResponse.json();


          let settingsData =
            null;


          let paymentIssueData =
            null;


          try {

            settingsData =
              await settingsResponse.json();

          } catch {

            settingsData =
              null;

          }


          try {

            paymentIssueData =
              await paymentIssueResponse.json();

          } catch {

            paymentIssueData =
              null;

          }


          if (
            !bookingResponse.ok
          ) {

            throw new Error(
              bookingData?.message ||
              "Unable to load bookings."
            );

          }


          if (
            !centerResponse.ok
          ) {

            throw new Error(
              centerData?.message ||
              "Unable to load centers."
            );

          }


          setBookings(
            Array.isArray(
              bookingData?.bookings
            )
              ? bookingData.bookings
              : []
          );


          setCenters(
            Array.isArray(
              centerData?.centers
            )
              ? centerData.centers
              : []
          );


          setSettings(
            settingsData?.settings ||
            null
          );


          setPaymentIssues(
            paymentIssueResponse.ok &&
            Array.isArray(
              paymentIssueData?.issues
            )
              ? paymentIssueData.issues
              : []
          );


          setError("");


        } catch (
          dashboardError
        ) {

          console.error(
            "Dashboard error:",
            dashboardError
          );


          setError(
            dashboardError?.message ||
            "Unable to connect to the backend."
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
      []
    );


  useEffect(() => {

    loadDashboard();


    const timer =
      setInterval(
        () =>
          loadDashboard(),
        10000
      );


    function handleLanguageChange() {

      setLanguage(
        localStorage.getItem(
          "krishisetu-language"
        ) ||
        "en"
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
    loadDashboard,
  ]);


  const today =
    new Date();


  const todayString =
    [
      today.getFullYear(),
      String(
        today.getMonth() + 1
      ).padStart(
        2,
        "0"
      ),
      String(
        today.getDate()
      ).padStart(
        2,
        "0"
      ),
    ].join("-");


  const todayBookings =
    useMemo(
      () =>
        bookings.filter(
          (
            booking
          ) =>
            booking.date ===
            todayString
        ),
      [
        bookings,
        todayString,
      ]
    );


  const stats =
    useMemo(
      () =>
        getDashboardStats(
          bookings,
          todayBookings,
          paymentIssues
        ),
      [
        bookings,
        todayBookings,
        paymentIssues,
      ]
    );


  const alerts =
    useMemo(
      () =>
        getDashboardAlerts(
          bookings,
          centers,
          paymentIssues,
          language
        ),
      [
        bookings,
        centers,
        paymentIssues,
        language,
      ]
    );


  const centerRows =
    useMemo(
      () =>
        getCenterRows(
          centers,
          bookings
        ),
      [
        centers,
        bookings,
      ]
    );


  const recentBookings =
    useMemo(
      () =>
        [
          ...bookings,
        ]
          .sort(
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
          )
          .slice(
            0,
            8
          ),
      [
        bookings,
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

      <div className="admin-dashboard-page">


        {/* =====================================================
            HEADER
        ====================================================== */}

        <section className="admin-dashboard-hero">

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


          <div className="admin-dashboard-actions">

            <div className="admin-dashboard-live">

              <span />

              {text.live}

            </div>


            <button
              type="button"
              className="admin-dashboard-refresh"
              onClick={() =>
                loadDashboard(true)
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

        {
          error && (

            <div className="admin-dashboard-error">

              <AlertTriangle
                size={17}
              />


              <div>

                <strong>
                  {text.connectionIssue}
                </strong>


                <span>
                  {error}
                </span>

              </div>

            </div>

          )
        }



        {/* =====================================================
            KPIs
        ====================================================== */}

        <section className="admin-dashboard-kpi-grid">

          <DashboardKpi
            tone="blue"
            icon={
              <CalendarClock
                size={18}
              />
            }
            value={
              stats.todayBookings
            }
            label={
              text.todayBookings
            }
          />


          <DashboardKpi
            tone="purple"
            icon={
              <MapPin
                size={18}
              />
            }
            value={
              stats.arrivals
            }
            label={
              text.arrivals
            }
          />


          <DashboardKpi
            tone="gold"
            icon={
              <Scale
                size={18}
              />
            }
            value={
              stats.weighing
            }
            label={
              text.weighing
            }
          />


          <DashboardKpi
            tone="green"
            icon={
              <CheckCircle2
                size={18}
              />
            }
            value={
              stats.procured
            }
            label={
              text.procured
            }
          />


          <DashboardKpi
            tone="orange"
            icon={
              <CreditCard
                size={18}
              />
            }
            value={
              stats.pendingPayments
            }
            label={
              text.pendingPayments
            }
          />


          <DashboardKpi
            tone="teal"
            icon={
              <MessageCircleWarning
                size={18}
              />
            }
            value={
              stats.openPaymentIssues
            }
            label={
              text.paymentIssues
            }
          />

        </section>



        {/* =====================================================
            ALERTS
        ====================================================== */}

        <section className="admin-dashboard-alerts-panel">

          <div className="admin-dashboard-panel-header">

            <div>

              <span className="admin-page-eyebrow">
                {text.attention}
              </span>


              <h3>
                {text.alerts}
              </h3>

            </div>


            <span className="admin-dashboard-alert-count">

              {
                alerts.length
              }

              {" "}
              {text.activeAlerts}

            </span>

          </div>


          {
            alerts.length ===
            0 ? (

              <div className="admin-dashboard-no-alerts">

                <CheckCircle2
                  size={20}
                />


                <span>
                  {text.noAlerts}
                </span>

              </div>

            ) : (

              <div className="admin-dashboard-alert-list">

                {
                  alerts
                    .slice(
                      0,
                      8
                    )
                    .map(
                      (
                        alert
                      ) => (

                        <Link
                          key={
                            alert.id
                          }
                          to={
                            alert.href
                          }
                          className={
                            `admin-dashboard-alert-row ${alert.tone}`
                          }
                        >

                          <div className="admin-dashboard-alert-icon">

                            {alert.icon}

                          </div>


                          <div>

                            <strong>
                              {alert.title}
                            </strong>


                            <span>
                              {alert.message}
                            </span>

                          </div>


                          <ArrowRight
                            size={14}
                          />

                        </Link>

                      )
                    )
                }

              </div>

            )
          }

        </section>



        {/* =====================================================
            PAYMENT ISSUE FEATURE
        ====================================================== */}

        <section className="admin-dashboard-payment-issues-card">

          <div className="admin-dashboard-payment-issues-icon">

            <MessageCircleWarning
              size={24}
            />

          </div>


          <div className="admin-dashboard-payment-issues-content">

            <span className="admin-page-eyebrow">
              {text.paymentSupport}
            </span>


            <h3>
              {text.paymentIssuesHeading}
            </h3>


            <p>
              {text.paymentIssuesDescription}
            </p>

          </div>


          <div className="admin-dashboard-payment-issues-count">

            <strong>
              {
                stats.openPaymentIssues
              }
            </strong>


            <span>
              {text.openIssues}
            </span>

          </div>


          <Link
            to="/admin/payment-issues"
            className="admin-dashboard-payment-issues-button"
          >

            {text.openPaymentIssues}

            <ArrowRight
              size={15}
            />

          </Link>

        </section>



        {/* =====================================================
            MAIN GRID
        ====================================================== */}

        <section className="admin-dashboard-main-grid">


          {/* CENTER LOAD */}

          <div className="admin-dashboard-panel">

            <div className="admin-dashboard-panel-header">

              <div>

                <span className="admin-page-eyebrow">
                  {text.infrastructure}
                </span>


                <h3>
                  {text.centerLoad}
                </h3>

              </div>


              <Link
                to="/admin/centers"
                className="admin-dashboard-panel-link"
              >

                {text.viewAll}

                <ArrowRight
                  size={13}
                />

              </Link>

            </div>


            {
              centerRows.length ===
              0 ? (

                <DashboardEmpty
                  text={
                    text.noCenters
                  }
                />

              ) : (

                <div className="admin-dashboard-center-list">

                  {
                    centerRows
                      .slice(
                        0,
                        5
                      )
                      .map(
                        (
                          row
                        ) => (

                          <div
                            key={
                              row.id
                            }
                            className="admin-dashboard-center-row"
                          >

                            <div className="admin-dashboard-center-name">

                              <div>

                                <MapPin
                                  size={14}
                                />

                              </div>


                              <span>
                                {row.name}
                              </span>

                            </div>


                            <div className="admin-dashboard-center-load">

                              <div>

                                <span>

                                  {
                                    row.activeBookings
                                  }

                                  {" / "}

                                  {
                                    row.capacity
                                  }

                                </span>


                                <strong>

                                  {
                                    row.utilization
                                  }%

                                </strong>

                              </div>


                              <div className="admin-dashboard-mini-progress">

                                <div
                                  style={{
                                    width:
                                      `${row.utilization}%`,
                                  }}
                                />

                              </div>

                            </div>

                          </div>

                        )
                      )
                  }

                </div>

              )
            }

          </div>



          {/* WORKFLOW */}

          <div className="admin-dashboard-panel">

            <div className="admin-dashboard-panel-header">

              <div>

                <span className="admin-page-eyebrow">
                  {text.workflow}
                </span>


                <h3>
                  {text.workflowToday}
                </h3>

              </div>


              <Link
                to="/admin/queue"
                className="admin-dashboard-panel-link"
              >

                {text.openQueue}

                <ArrowRight
                  size={13}
                />

              </Link>

            </div>


            <div className="admin-dashboard-workflow">

              <WorkflowStep
                label={
                  text.confirmed
                }
                value={
                  stats.confirmed
                }
                tone="blue"
              />


              <WorkflowStep
                label={
                  text.arrived
                }
                value={
                  stats.arrivals
                }
                tone="purple"
              />


              <WorkflowStep
                label={
                  text.weighing
                }
                value={
                  stats.weighing
                }
                tone="gold"
              />


              <WorkflowStep
                label={
                  text.procured
                }
                value={
                  stats.procured
                }
                tone="green"
              />


              <WorkflowStep
                label={
                  text.paymentPending
                }
                value={
                  stats.pendingPayments
                }
                tone="orange"
              />


              <WorkflowStep
                label={
                  text.paymentSent
                }
                value={
                  stats.paymentSent
                }
                tone="teal"
              />

            </div>

          </div>



          {/* MONEY */}

          <div className="admin-dashboard-panel">

            <div className="admin-dashboard-panel-header">

              <div>

                <span className="admin-page-eyebrow">
                  {text.finance}
                </span>


                <h3>
                  {text.paymentPosition}
                </h3>

              </div>


              <Link
                to="/admin/payments"
                className="admin-dashboard-panel-link"
              >

                {text.openPayments}

                <ArrowRight
                  size={13}
                />

              </Link>

            </div>


            <div className="admin-dashboard-money">

              <div className="admin-dashboard-money-card paid">

                <span>
                  {text.paid}
                </span>


                <strong>
                  {
                    formatCurrency(
                      stats.totalPaid,
                      language
                    )
                  }
                </strong>

              </div>


              <div className="admin-dashboard-money-card pending">

                <span>
                  {text.pending}
                </span>


                <strong>
                  {
                    formatCurrency(
                      stats.pendingAmount,
                      language
                    )
                  }
                </strong>

              </div>


              <div className="admin-dashboard-money-card total">

                <span>
                  {text.totalValue}
                </span>


                <strong>
                  {
                    formatCurrency(
                      stats.totalValue,
                      language
                    )
                  }
                </strong>

              </div>

            </div>

          </div>



          {/* QUICK ACTIONS */}

          <div className="admin-dashboard-panel">

            <div className="admin-dashboard-panel-header">

              <div>

                <span className="admin-page-eyebrow">
                  {text.operations}
                </span>


                <h3>
                  {text.quickActions}
                </h3>

              </div>

            </div>


            <div className="admin-dashboard-quick-actions">

              <QuickAction
                href="/admin/queue"
                icon={
                  <Clock3
                    size={17}
                  />
                }
                title={
                  text.queue
                }
                description={
                  text.queueDescription
                }
              />


              <QuickAction
                href="/admin/weighing"
                icon={
                  <Scale
                    size={17}
                  />
                }
                title={
                  text.weighing
                }
                description={
                  text.weighingDescription
                }
              />


              <QuickAction
                href="/admin/payments"
                icon={
                  <IndianRupee
                    size={17}
                  />
                }
                title={
                  text.payments
                }
                description={
                  text.paymentsDescription
                }
              />


              <QuickAction
                href="/admin/payment-issues"
                icon={
                  <MessageCircleWarning
                    size={17}
                  />
                }
                title={
                  text.paymentIssues
                }
                description={
                  text.paymentIssuesDescriptionShort
                }
              />

            </div>

          </div>

        </section>



        {/* RECENT ACTIVITY */}

        <section className="admin-dashboard-panel admin-dashboard-recent-panel">

          <div className="admin-dashboard-panel-header">

            <div>

              <span className="admin-page-eyebrow">
                {text.liveOperations}
              </span>


              <h3>
                {text.recentBookings}
              </h3>

            </div>


            <Link
              to="/admin/queue"
              className="admin-dashboard-panel-link"
            >

              {text.viewQueue}

              <ArrowRight
                size={13}
              />

            </Link>

          </div>


          {
            loading ? (

              <DashboardLoading />

            ) : recentBookings.length ===
              0 ? (

              <DashboardEmpty
                text={
                  text.noRecentBookings
                }
              />

            ) : (

              <div className="admin-dashboard-recent-list">

                {
                  recentBookings.map(
                    (
                      booking
                    ) => (

                      <div
                        key={
                          booking.id
                        }
                        className="admin-dashboard-recent-row"
                      >

                        <div className="admin-dashboard-recent-token">

                          #
                          {
                            booking.token ||
                            booking.id
                          }

                        </div>


                        <div className="admin-dashboard-recent-farmer">

                          <strong>

                            {
                              booking.farmer_name ||
                              text.unknownFarmer
                            }

                          </strong>


                          <span>

                            {
                              booking.farmer_village ||
                              "—"
                            }

                          </span>

                        </div>


                        <div className="admin-dashboard-recent-crop">

                          <Wheat
                            size={13}
                          />


                          <span>

                            {
                              getCropName(
                                booking.crop,
                                language
                              )
                            }

                          </span>

                        </div>


                        <div>

                          <strong>

                            {
                              Number(
                                booking.actual_quantity ??
                                booking.estimated_quantity ??
                                0
                              ).toLocaleString()
                            }

                            {" kg"}

                          </strong>


                          <span>

                            {
                              booking.actual_quantity !=
                              null
                                ? text.actual
                                : text.estimated
                            }

                          </span>

                        </div>


                        <div>

                          <span
                            className={
                              `admin-dashboard-status ${getStatusTone(
                                booking.status
                              )}`
                            }
                          >

                            {
                              getStatusLabel(
                                booking.status,
                                language
                              )
                            }

                          </span>

                        </div>

                      </div>

                    )
                  )
                }

              </div>

            )
          }

        </section>



        {
          settings && (

            <div className="admin-dashboard-footer">

              <Database
                size={13}
              />


              <span>

                {text.settingsLoaded}

                {" · "}

                {
                  settings.bookingEnabled
                    ? text.bookingOpen
                    : text.bookingClosed
                }

                {" · "}

                {
                  settings.maintenanceMode
                    ? text.maintenance
                    : text.normalOperation
                }

              </span>

            </div>

          )
        }

      </div>

    </AdminLayout>

  );
}


/* =========================================================
   KPI
========================================================= */

function DashboardKpi({
  icon,
  tone,
  value,
  suffix,
  label,
}) {

  return (

    <div
      className={
        `admin-dashboard-kpi ${tone}`
      }
    >

      <div className="admin-dashboard-kpi-icon">

        {icon}

      </div>


      <div>

        <strong>

          {value}

          {
            suffix && (
              <small>
                {" "}
                {suffix}
              </small>
            )
          }

        </strong>


        <span>
          {label}
        </span>

      </div>

    </div>

  );
}


/* =========================================================
   WORKFLOW
========================================================= */

function WorkflowStep({
  label,
  value,
  tone,
}) {

  return (

    <div
      className={
        `admin-dashboard-workflow-step ${tone}`
      }
    >

      <div className="admin-dashboard-workflow-dot" />


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
   QUICK ACTION
========================================================= */

function QuickAction({
  href,
  icon,
  title,
  description,
}) {

  return (

    <Link
      to={
        href
      }
      className="admin-dashboard-quick-action"
    >

      <div className="admin-dashboard-quick-icon">

        {icon}

      </div>


      <div>

        <strong>
          {title}
        </strong>


        <span>
          {description}
        </span>

      </div>


      <ArrowRight
        size={13}
      />

    </Link>

  );

}


/* =========================================================
   EMPTY
========================================================= */

function DashboardEmpty({
  text,
}) {

  return (

    <div className="admin-dashboard-empty">

      <Database
        size={21}
      />


      <span>
        {text}
      </span>

    </div>

  );

}


/* =========================================================
   LOADING
========================================================= */

function DashboardLoading() {

  return (

    <div className="admin-dashboard-loading">

      {
        [
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
              className="admin-dashboard-skeleton"
            >

              <span />
              <span />
              <span />
              <span />

            </div>

          )
        )
      }

    </div>

  );

}


/* =========================================================
   STATS
========================================================= */

function getDashboardStats(
  bookings,
  todayBookings,
  paymentIssues
) {

  const count =
    (
      status
    ) =>
      todayBookings.filter(
        (
          booking
        ) =>
          booking.status ===
          status
      ).length;


  const arrivals =
    todayBookings.filter(
      (
        booking
      ) =>
        [
          "ARRIVED",
          "LATE",
          "WEIGHING",
          "PROCURED",
          "PAYMENT_PENDING",
          "PAYMENT_SENT",
        ].includes(
          booking.status
        )
    ).length;


  const weighing =
    todayBookings.filter(
      (
        booking
      ) =>
        booking.status ===
        "WEIGHING"
    ).length;


  const procured =
    todayBookings.filter(
      (
        booking
      ) =>
        [
          "PROCURED",
          "PAYMENT_PENDING",
          "PAYMENT_SENT",
        ].includes(
          booking.status
        )
    ).length;


  const pendingPayments =
    bookings.filter(
      (
        booking
      ) =>
        booking.status ===
        "PAYMENT_PENDING"
    ).length;


  const paymentSent =
    bookings.filter(
      (
        booking
      ) =>
        booking.status ===
        "PAYMENT_SENT"
    ).length;


  const totalQuantity =
    bookings.reduce(
      (
        total,
        booking
      ) =>
        total +
        Number(
          booking.actual_quantity ||
          booking.estimated_quantity ||
          0
        ),
      0
    );


  const totalPaid =
    bookings.reduce(
      (
        total,
        booking
      ) =>
        total +
        (
          booking.status ===
          "PAYMENT_SENT"
            ? Number(
                booking.payment_amount ||
                0
              )
            : 0
        ),
      0
    );


  const pendingAmount =
    bookings.reduce(
      (
        total,
        booking
      ) =>
        total +
        (
          [
            "PROCURED",
            "PAYMENT_PENDING",
          ].includes(
            booking.status
          )
            ? Number(
                booking.payment_amount ||
                0
              )
            : 0
        ),
      0
    );


  const totalValue =
    totalPaid +
    pendingAmount;


  const openPaymentIssues =
    paymentIssues.filter(
      (
        issue
      ) =>
        String(
          issue?.status ||
          "OPEN"
        ).toUpperCase() ===
        "OPEN"
    ).length;


  return {

    todayBookings:
      todayBookings.length,

    confirmed:
      count(
        "CONFIRMED"
      ),

    arrivals,

    weighing,

    procured,

    pendingPayments,

    paymentSent,

    totalQuantity,

    totalPaid,

    pendingAmount,

    totalValue,

    openPaymentIssues,

  };

}


/* =========================================================
   ALERTS
========================================================= */

function getDashboardAlerts(
  bookings,
  centers,
  paymentIssues,
  language
) {

  const alerts = [];


  const openPaymentIssues =
    paymentIssues.filter(
      (
        issue
      ) =>
        String(
          issue?.status ||
          "OPEN"
        ).toUpperCase() ===
        "OPEN"
    );


  if (
    openPaymentIssues.length
  ) {

    alerts.push({

      id:
        "payment-issues",

      tone:
        "red",

      title:
        getAlertCopy(
          "paymentIssueTitle",
          language
        ),

      message:
        `${openPaymentIssues.length} ${getAlertCopy(
          "paymentIssueMessage",
          language
        )}`,

      href:
        "/admin/payment-issues",

      icon:
        <MessageCircleWarning
          size={16}
        />,

    });

  }


  const late =
    bookings.filter(
      (
        booking
      ) =>
        booking.status ===
        "LATE"
    );


  if (
    late.length
  ) {

    alerts.push({

      id:
        "late",

      tone:
        "orange",

      title:
        getAlertCopy(
          "lateTitle",
          language
        ),

      message:
        `${late.length} ${getAlertCopy(
          "lateMessage",
          language
        )}`,

      href:
        "/admin/queue",

      icon:
        <AlertTriangle
          size={16}
        />,

    });

  }


  const weighing =
    bookings.filter(
      (
        booking
      ) =>
        booking.status ===
        "WEIGHING"
    );


  if (
    weighing.length
  ) {

    alerts.push({

      id:
        "weighing",

      tone:
        "gold",

      title:
        getAlertCopy(
          "weighingTitle",
          language
        ),

      message:
        `${weighing.length} ${getAlertCopy(
          "weighingMessage",
          language
        )}`,

      href:
        "/admin/weighing",

      icon:
        <Scale
          size={16}
        />,

    });

  }


  const pending =
    bookings.filter(
      (
        booking
      ) =>
        booking.status ===
        "PAYMENT_PENDING"
    );


  if (
    pending.length
  ) {

    alerts.push({

      id:
        "payments",

      tone:
        "red",

      title:
        getAlertCopy(
          "paymentTitle",
          language
        ),

      message:
        `${pending.length} ${getAlertCopy(
          "paymentMessage",
          language
        )}`,

      href:
        "/admin/payments",

      icon:
        <CreditCard
          size={16}
        />,

    });

  }


  centers.forEach(
    (
      center
    ) => {

      const capacity =
        Number(
          center.capacity ||
          20
        );


      const count =
        bookings.filter(
          (
            booking
          ) =>
            String(
              booking.center_id
            ) ===
            String(
              center.id
            ) &&
            booking.status !==
            "PAYMENT_SENT"
        ).length;


      if (
        capacity > 0 &&
        count >= capacity
      ) {

        alerts.push({

          id:
            `center-${center.id}`,

          tone:
            "purple",

          title:
            getAlertCopy(
              "centerFullTitle",
              language
            ),

          message:
            `${
              center.name ||
              getAlertCopy(
                "center",
                language
              )
            } ${getAlertCopy(
              "centerFullMessage",
              language
            )}`,

          href:
            "/admin/centers",

          icon:
            <MapPin
              size={16}
            />,

        });

      }

    }
  );


  return alerts;

}


/* =========================================================
   CENTER ROWS
========================================================= */

function getCenterRows(
  centers,
  bookings
) {

  return centers.map(
    (
      center
    ) => {

      const centerBookings =
        bookings.filter(
          (
            booking
          ) =>
            String(
              booking.center_id
            ) ===
            String(
              center.id
            )
        );


      const activeBookings =
        centerBookings.filter(
          (
            booking
          ) =>
            booking.status !==
            "PAYMENT_SENT"
        );


      const capacity =
        Number(
          center.capacity ||
          20
        );


      const utilization =
        capacity > 0
          ? Math.min(
              100,
              Math.round(
                (
                  activeBookings.length /
                  capacity
                ) *
                100
              )
            )
          : 0;


      return {

        id:
          center.id,

        name:
          center.name ||
          "Procurement Center",

        capacity,

        activeBookings:
          activeBookings.length,

        utilization,

      };

    }
  );

}


/* =========================================================
   HELPERS
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


  return "green";

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
    status ||
    "Unknown"
  );

}


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


function formatCurrency(
  value,
  language
) {

  const number =
    Number(
      value ||
      0
    );


  const locale =
    language ===
      "hi"
      ? "hi-IN"
      : language ===
          "te"
        ? "te-IN"
        : "en-IN";


  return new Intl.NumberFormat(
    locale,
    {
      style:
        "currency",

      currency:
        "INR",

      maximumFractionDigits:
        2,

    }
  ).format(
    number
  );

}


function getAlertCopy(
  key,
  language
) {

  const copy = {

    en: {

      paymentIssueTitle:
        "Farmer payment issues",

      paymentIssueMessage:
        "open payment issue reports need attention.",

      lateTitle:
        "Late arrivals",

      lateMessage:
        "bookings require attention.",

      weighingTitle:
        "Weighing queue",

      weighingMessage:
        "bookings are waiting for processing.",

      paymentTitle:
        "Payments pending",

      paymentMessage:
        "payments need operator action.",

      centerFullTitle:
        "Center capacity reached",

      centerFullMessage:
        "has reached its current active booking capacity.",

      center:
        "Procurement center",

    },

    hi: {

      paymentIssueTitle:
        "किसान भुगतान समस्याएं",

      paymentIssueMessage:
        "खुली भुगतान समस्याओं पर ध्यान देना जरूरी है।",

      lateTitle:
        "देर से पहुंचे किसान",

      lateMessage:
        "बुकिंग ध्यान चाहती हैं।",

      weighingTitle:
        "वजन कतार",

      weighingMessage:
        "बुकिंग प्रोसेसिंग की प्रतीक्षा कर रही हैं।",

      paymentTitle:
        "भुगतान लंबित",

      paymentMessage:
        "भुगतान पर ऑपरेटर की कार्रवाई जरूरी है।",

      centerFullTitle:
        "केंद्र की क्षमता पूरी",

      centerFullMessage:
        "वर्तमान सक्रिय बुकिंग क्षमता तक पहुंच गया है।",

      center:
        "खरीद केंद्र",

    },

    te: {

      paymentIssueTitle:
        "రైతు చెల్లింపు సమస్యలు",

      paymentIssueMessage:
        "ఓపెన్ చెల్లింపు సమస్యలకు శ్రద్ధ అవసరం.",

      lateTitle:
        "ఆలస్యంగా వచ్చినవి",

      lateMessage:
        "బుకింగ్‌లకు శ్రద్ధ అవసరం.",

      weighingTitle:
        "తూకం క్యూ",

      weighingMessage:
        "బుకింగ్‌లు ప్రాసెసింగ్ కోసం వేచి ఉన్నాయి.",

      paymentTitle:
        "చెల్లింపులు పెండింగ్",

      paymentMessage:
        "చెల్లింపులకు ఆపరేటర్ చర్య అవసరం.",

      centerFullTitle:
        "కేంద్ర సామర్థ్యం పూర్తైంది",

      centerFullMessage:
        "ప్రస్తుత యాక్టివ్ బుకింగ్ సామర్థ్యాన్ని చేరుకుంది.",

      center:
        "కొనుగోలు కేంద్రం",

    },

  };


  return (
    copy[
      language
    ]?.[
      key
    ] ||
    copy.en[
      key
    ] ||
    ""
  );

}


/* =========================================================
   COPY
========================================================= */

function getDashboardCopy(
  language
) {

  const copy = {

    en: {

      title:
        "Admin Dashboard",

      subtitle:
        "Live command center for procurement operations.",

      eyebrow:
        "OPERATIONS CONTROL",

      heading:
        "Everything important, at a glance.",

      description:
        "Monitor today's bookings, workflow pressure, center capacity, payments and farmer support issues from one place.",

      live:
        "LIVE",

      refreshing:
        "Refreshing...",

      refresh:
        "Refresh",

      connectionIssue:
        "Dashboard connection issue",

      todayBookings:
        "Today's bookings",

      arrivals:
        "Arrivals today",

      weighing:
        "Weighing",

      procured:
        "Procured",

      pendingPayments:
        "Pending payments",

      paymentIssues:
        "Payment issues",

      attention:
        "ATTENTION",

      alerts:
        "Operational alerts",

      activeAlerts:
        "active alerts",

      noAlerts:
        "No operational alerts right now.",

      paymentSupport:
        "FARMER PAYMENT SUPPORT",

      paymentIssuesHeading:
        "Payment issues need fast attention.",

      paymentIssuesDescription:
        "Farmers can report payment problems directly from their payment history. Review the report and resolve it after investigation.",

      paymentIssuesDescriptionShort:
        "Review and resolve farmer payment complaints.",

      openIssues:
        "open issues",

      openPaymentIssues:
        "Open Payment Issues",

      infrastructure:
        "INFRASTRUCTURE",

      centerLoad:
        "Center load",

      viewAll:
        "View all",

      noCenters:
        "No procurement centers configured.",

      workflow:
        "WORKFLOW",

      workflowToday:
        "Today's workflow",

      openQueue:
        "Open queue",

      confirmed:
        "Confirmed",

      arrived:
        "Arrived",

      paymentPending:
        "Payment pending",

      paymentSent:
        "Payment sent",

      finance:
        "FINANCE",

      paymentPosition:
        "Payment position",

      openPayments:
        "Open payments",

      paid:
        "Paid",

      pending:
        "Pending",

      totalValue:
        "Total value",

      operations:
        "OPERATIONS",

      quickActions:
        "Quick actions",

      queue:
        "Queue",

      queueDescription:
        "Manage arrivals and workflow status.",

      weighingDescription:
        "Record weights and procurement.",

      payments:
        "Payments",

      paymentsDescription:
        "Review and send pending payments.",

      reports:
        "Reports",

      reportsDescription:
        "Analyse live operational data.",

      liveOperations:
        "LIVE OPERATIONS",

      recentBookings:
        "Recent bookings",

      viewQueue:
        "View queue",

      noRecentBookings:
        "No booking activity yet.",

      unknownFarmer:
        "Unknown farmer",

      actual:
        "Actual",

      estimated:
        "Estimated",

      settingsLoaded:
        "System settings loaded",

      bookingOpen:
        "new bookings enabled",

      bookingClosed:
        "new bookings paused",

      maintenance:
        "maintenance mode",

      normalOperation:
        "normal operation",

    },


    hi: {

      title:
        "एडमिन डैशबोर्ड",

      subtitle:
        "खरीद संचालन के लिए लाइव कमांड सेंटर।",

      eyebrow:
        "ऑपरेशन नियंत्रण",

      heading:
        "जरूरी हर जानकारी एक नज़र में।",

      description:
        "आज की बुकिंग, प्रक्रिया, केंद्र क्षमता, भुगतान और किसान सहायता समस्याओं की एक जगह से निगरानी करें।",

      live:
        "लाइव",

      refreshing:
        "रीफ्रेश हो रहा है...",

      refresh:
        "रीफ्रेश",

      connectionIssue:
        "डैशबोर्ड कनेक्शन समस्या",

      todayBookings:
        "आज की बुकिंग",

      arrivals:
        "आज पहुंचे",

      weighing:
        "वजन",

      procured:
        "खरीद पूरी",

      pendingPayments:
        "लंबित भुगतान",

      paymentIssues:
        "भुगतान समस्याएं",

      attention:
        "ध्यान दें",

      alerts:
        "ऑपरेशनल अलर्ट",

      activeAlerts:
        "सक्रिय अलर्ट",

      noAlerts:
        "अभी कोई ऑपरेशनल अलर्ट नहीं है।",

      paymentSupport:
        "किसान भुगतान सहायता",

      paymentIssuesHeading:
        "भुगतान समस्याओं पर जल्दी ध्यान दें।",

      paymentIssuesDescription:
        "किसान अपने भुगतान इतिहास से सीधे समस्या बता सकते हैं। रिपोर्ट की समीक्षा करके समस्या का समाधान करें।",

      paymentIssuesDescriptionShort:
        "किसान भुगतान समस्याओं की समीक्षा और समाधान करें।",

      openIssues:
        "खुली समस्याएं",

      openPaymentIssues:
        "भुगतान समस्याएं खोलें",

      infrastructure:
        "इंफ्रास्ट्रक्चर",

      centerLoad:
        "केंद्र भार",

      viewAll:
        "सभी देखें",

      noCenters:
        "कोई खरीद केंद्र कॉन्फ़िगर नहीं है।",

      workflow:
        "प्रक्रिया",

      workflowToday:
        "आज की प्रक्रिया",

      openQueue:
        "कतार खोलें",

      confirmed:
        "पुष्ट",

      arrived:
        "पहुंचे",

      paymentPending:
        "भुगतान लंबित",

      paymentSent:
        "भुगतान भेजा",

      finance:
        "वित्त",

      paymentPosition:
        "भुगतान स्थिति",

      openPayments:
        "भुगतान खोलें",

      paid:
        "भुगतान हुआ",

      pending:
        "लंबित",

      totalValue:
        "कुल मूल्य",

      operations:
        "संचालन",

      quickActions:
        "त्वरित कार्य",

      queue:
        "कतार",

      queueDescription:
        "आगमन और प्रक्रिया स्थिति प्रबंधित करें।",

      weighingDescription:
        "वजन और खरीद दर्ज करें।",

      payments:
        "भुगतान",

      paymentsDescription:
        "लंबित भुगतान की समीक्षा और भेजें।",

      reports:
        "रिपोर्ट",

      reportsDescription:
        "लाइव ऑपरेशनल डेटा का विश्लेषण करें।",

      liveOperations:
        "लाइव ऑपरेशन",

      recentBookings:
        "हाल की बुकिंग",

      viewQueue:
        "कतार देखें",

      noRecentBookings:
        "अभी कोई बुकिंग गतिविधि नहीं है।",

      unknownFarmer:
        "अज्ञात किसान",

      actual:
        "वास्तविक",

      estimated:
        "अनुमानित",

      settingsLoaded:
        "सिस्टम सेटिंग्स लोड",

      bookingOpen:
        "नई बुकिंग चालू",

      bookingClosed:
        "नई बुकिंग रुकी",

      maintenance:
        "मेंटेनेंस मोड",

      normalOperation:
        "सामान्य संचालन",

    },


    te: {

      title:
        "అడ్మిన్ డ్యాష్‌బోర్డ్",

      subtitle:
        "కొనుగోలు కార్యకలాపాల కోసం లైవ్ కమాండ్ సెంటర్.",

      eyebrow:
        "ఆపరేషన్స్ కంట్రోల్",

      heading:
        "అవసరమైన ప్రతిదీ ఒకే చూపులో.",

      description:
        "ఈరోజు బుకింగ్‌లు, వర్క్‌ఫ్లో, కేంద్ర సామర్థ్యం, చెల్లింపులు మరియు రైతు సమస్యలను ఒకే చోట పర్యవేక్షించండి.",

      live:
        "లైవ్",

      refreshing:
        "రిఫ్రెష్ చేస్తోంది...",

      refresh:
        "రిఫ్రెష్",

      connectionIssue:
        "డ్యాష్‌బోర్డ్ కనెక్షన్ సమస్య",

      todayBookings:
        "ఈరోజు బుకింగ్‌లు",

      arrivals:
        "ఈరోజు చేరినవి",

      weighing:
        "తూకం",

      procured:
        "కొనుగోలు పూర్తైంది",

      pendingPayments:
        "పెండింగ్ చెల్లింపులు",

      paymentIssues:
        "చెల్లింపు సమస్యలు",

      attention:
        "శ్రద్ధ",

      alerts:
        "ఆపరేషనల్ అలర్ట్‌లు",

      activeAlerts:
        "యాక్టివ్ అలర్ట్‌లు",

      noAlerts:
        "ప్రస్తుతం ఆపరేషనల్ అలర్ట్‌లు లేవు.",

      paymentSupport:
        "రైతు చెల్లింపు సహాయం",

      paymentIssuesHeading:
        "చెల్లింపు సమస్యలకు త్వరగా శ్రద్ధ అవసరం.",

      paymentIssuesDescription:
        "రైతులు తమ చెల్లింపు చరిత్ర నుంచే సమస్యలను నివేదించగలరు. రిపోర్ట్‌ను సమీక్షించి పరిష్కరించండి.",

      paymentIssuesDescriptionShort:
        "రైతు చెల్లింపు సమస్యలను సమీక్షించి పరిష్కరించండి.",

      openIssues:
        "ఓపెన్ సమస్యలు",

      openPaymentIssues:
        "చెల్లింపు సమస్యలు తెరవండి",

      infrastructure:
        "ఇన్‌ఫ్రాస్ట్రక్చర్",

      centerLoad:
        "కేంద్ర లోడ్",

      viewAll:
        "అన్నీ చూడండి",

      noCenters:
        "కొనుగోలు కేంద్రాలు కాన్ఫిగర్ చేయలేదు.",

      workflow:
        "వర్క్‌ఫ్లో",

      workflowToday:
        "ఈరోజు వర్క్‌ఫ్లో",

      openQueue:
        "క్యూను తెరవండి",

      confirmed:
        "నిర్ధారించబడింది",

      arrived:
        "చేరుకున్నారు",

      paymentPending:
        "చెల్లింపు పెండింగ్",

      paymentSent:
        "చెల్లింపు పంపబడింది",

      finance:
        "ఫైనాన్స్",

      paymentPosition:
        "చెల్లింపు స్థితి",

      openPayments:
        "చెల్లింపులు తెరవండి",

      paid:
        "చెల్లించినవి",

      pending:
        "పెండింగ్",

      totalValue:
        "మొత్తం విలువ",

      operations:
        "కార్యకలాపాలు",

      quickActions:
        "త్వరిత చర్యలు",

      queue:
        "క్యూ",

      queueDescription:
        "రాక మరియు వర్క్‌ఫ్లో స్థితిని నిర్వహించండి.",

      weighingDescription:
        "తూకం మరియు కొనుగోలును నమోదు చేయండి.",

      payments:
        "చెల్లింపులు",

      paymentsDescription:
        "పెండింగ్ చెల్లింపులను సమీక్షించి పంపండి.",

      reports:
        "రిపోర్టులు",

      reportsDescription:
        "లైవ్ ఆపరేషనల్ డేటాను విశ్లేషించండి.",

      liveOperations:
        "లైవ్ ఆపరేషన్స్",

      recentBookings:
        "ఇటీవలి బుకింగ్‌లు",

      viewQueue:
        "క్యూను చూడండి",

      noRecentBookings:
        "ఇంకా బుకింగ్ కార్యకలాపం లేదు.",

      unknownFarmer:
        "తెలియని రైతు",

      actual:
        "వాస్తవ",

      estimated:
        "అంచనా",

      settingsLoaded:
        "సిస్టమ్ సెట్టింగ్స్ లోడ్ అయ్యాయి",

      bookingOpen:
        "కొత్త బుకింగ్‌లు ప్రారంభం",

      bookingClosed:
        "కొత్త బుకింగ్‌లు నిలిపివేయబడ్డాయి",

      maintenance:
        "మెయింటెనెన్స్ మోడ్",

      normalOperation:
        "సాధారణ కార్యకలాపం",

    },

  };


  return (
    copy[
      language
    ] ||
    copy.en
  );

}


export default AdminDashboard;