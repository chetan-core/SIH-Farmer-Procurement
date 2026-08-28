import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";


import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Database,
  Download,
  FileText,
  IndianRupee,
  RefreshCw,
  Search,
  Scale,
  TrendingUp,
  Users,
  Wheat,
} from "lucide-react";


import AdminLayout from "../../components/admin/AdminLayout";


const API_URL =
  import.meta.env.VITE_API_URL;


function AdminReports() {

  const [
    bookings,
    setBookings,
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


  const [
    dateFilter,
    setDateFilter,
  ] =
    useState("ALL");


  const [
    cropFilter,
    setCropFilter,
  ] =
    useState("ALL");


  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState("ALL");


  const [
    search,
    setSearch,
  ] =
    useState("");


  const text =
    getReportsCopy(
      language
    );


  const loadReports =
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


          let data =
            null;


          try {

            data =
              await response.json();

          } catch {

            data =
              null;

          }


          if (
            !response.ok
          ) {

            throw new Error(
              data?.message ||
              "Unable to load report data."
            );

          }


          const rows =
            Array.isArray(
              data?.bookings
            )
              ? data.bookings
              : [];


          setBookings(
            rows
          );


          setError("");


        } catch (
          reportError
        ) {

          console.error(
            "Admin reports error:",
            reportError
          );


          setError(
            reportError?.message ||
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
      [
        bookings.length,
      ]
    );


  useEffect(() => {

    loadReports();


    function handleExternalRefresh() {

      loadReports(
        true
      );

    }


    window.addEventListener(
      "krishisetu-admin-refresh",
      handleExternalRefresh
    );


    const timer =
      setInterval(
        () =>
          loadReports(false),
        10000
      );


    return () => {

      clearInterval(
        timer
      );


      window.removeEventListener(
        "krishisetu-admin-refresh",
        handleExternalRefresh
      );

    };

  }, [
    loadReports,
  ]);


  const dateOptions =
    useMemo(
      () =>
        [
          "ALL",
          ...Array.from(
            new Set(
              bookings
                .map(
                  (
                    booking
                  ) =>
                    booking.date
                )
                .filter(Boolean)
            )
          ).sort(),
        ],
      [
        bookings,
      ]
    );


  const cropOptions =
    useMemo(
      () =>
        [
          "ALL",
          ...Array.from(
            new Set(
              bookings
                .map(
                  (
                    booking
                  ) =>
                    booking.crop
                )
                .filter(Boolean)
            )
          ),
        ],
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


        return bookings.filter(
          (
            booking
          ) => {

            if (
              dateFilter !==
                "ALL" &&
              booking.date !==
                dateFilter
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
              statusFilter !==
                "ALL" &&
              booking.status !==
                statusFilter
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
                booking.payment_reference,
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
        bookings,
        dateFilter,
        cropFilter,
        statusFilter,
        search,
      ]
    );


  const overview =
    useMemo(
      () =>
        getReportOverview(
          filteredBookings
        ),
      [
        filteredBookings,
      ]
    );


  const cropBreakdown =
    useMemo(
      () =>
        getCropBreakdown(
          filteredBookings
        ),
      [
        filteredBookings,
      ]
    );


  const statusBreakdown =
    useMemo(
      () =>
        getStatusBreakdown(
          filteredBookings,
          language
        ),
      [
        filteredBookings,
        language,
      ]
    );


  const paymentBreakdown =
    useMemo(
      () =>
        getPaymentBreakdown(
          filteredBookings
        ),
      [
        filteredBookings,
      ]
    );


  const dailyBreakdown =
    useMemo(
      () =>
        getDailyBreakdown(
          filteredBookings,
          language
        ),
      [
        filteredBookings,
        language,
      ]
    );


  function clearFilters() {

    setDateFilter(
      "ALL"
    );

    setCropFilter(
      "ALL"
    );

    setStatusFilter(
      "ALL"
    );

    setSearch("");

  }


  function exportCsv() {

    const headers = [

      "Booking ID",

      "Token",

      "Farmer",

      "Phone",

      "Village",

      "Crop",

      "Estimated Quantity",

      "Actual Quantity",

      "Date",

      "Slot Start",

      "Slot End",

      "Status",

      "Payment Amount",

      "Payment Method",

      "Payment Reference",

    ];


    const rows =
      filteredBookings.map(
        (
          booking
        ) => [

          booking.id ||
            "",

          booking.token ||
            "",

          booking.farmer_name ||
            "",

          booking.farmer_phone ||
            "",

          booking.farmer_village ||
            "",

          booking.crop ||
            "",

          booking.estimated_quantity ??
            "",

          booking.actual_quantity ??
            "",

          booking.date ||
            "",

          booking.slot_start ||
            "",

          booking.slot_end ||
            "",

          booking.status ||
            "",

          booking.payment_amount ??
            "",

          booking.payment_method ||
            "",

          booking.payment_reference ||
            "",

        ]
      );


    const csv = [
      headers,
      ...rows,
    ]
      .map(
        (
          row
        ) =>
          row
            .map(
              (value) =>
                `"${String(
                  value
                ).replaceAll(
                  '"',
                  '""'
                )}"`
            )
            .join(",")
      )
      .join("\n");


    const blob =
      new Blob(
        [csv],
        {
          type:
            "text/csv;charset=utf-8;",
        }
      );


    const url =
      URL.createObjectURL(
        blob
      );


    const link =
      document.createElement(
        "a"
      );


    link.href =
      url;


    link.download =
      "krishisetu-report.csv";


    document.body.appendChild(
      link
    );


    link.click();


    document.body.removeChild(
      link
    );


    URL.revokeObjectURL(
      url
    );

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

      <div className="admin-reports-page">


        {/* =====================================================
            HERO
        ====================================================== */}

        <section className="admin-reports-hero">


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


          <div className="admin-reports-hero-actions">


            <div className="admin-report-data-chip">

              <Database
                size={14}
              />

              {text.liveData}

            </div>


            <button
              type="button"
              className="admin-report-refresh"
              onClick={() =>
                loadReports(
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


            <button
              type="button"
              className="admin-report-export"
              onClick={
                exportCsv
              }
            >

              <Download
                size={15}
              />

              {text.exportCsv}

            </button>

          </div>

        </section>



        {/* =====================================================
            ERROR
        ====================================================== */}

        {error && (

          <div className="admin-report-error">

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


            <button
              type="button"
              onClick={() =>
                loadReports(
                  true
                )
              }
            >

              {text.retry}

            </button>

          </div>

        )}



        {/* =====================================================
            FILTERS
        ====================================================== */}

        <section className="admin-reports-filter-panel">


          <div className="admin-reports-search">

            <Search
              size={16}
            />


            <input
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



          <ReportFilter
            icon={
              <CalendarDays
                size={14}
              />
            }
            value={
              dateFilter
            }
            onChange={
              setDateFilter
            }
          >

            <option value="ALL">
              {text.allDates}
            </option>


            {dateOptions
              .filter(
                (
                  value
                ) =>
                  value !==
                  "ALL"
              )
              .map(
                (
                  value
                ) => (

                  <option
                    key={
                      value
                    }
                    value={
                      value
                    }
                  >

                    {
                      formatReportDate(
                        value,
                        language
                      )
                    }

                  </option>

                )
              )}

          </ReportFilter>



          <ReportFilter
            icon={
              <Wheat
                size={14}
              />
            }
            value={
              cropFilter
            }
            onChange={
              setCropFilter
            }
          >

            <option value="ALL">
              {text.allCrops}
            </option>


            {cropOptions
              .filter(
                (
                  value
                ) =>
                  value !==
                  "ALL"
              )
              .map(
                (
                  value
                ) => (

                  <option
                    key={
                      value
                    }
                    value={
                      value
                    }
                  >

                    {
                      getCropName(
                        value,
                        language
                      )
                    }

                  </option>

                )
              )}

          </ReportFilter>



          <ReportFilter
            icon={
              <BarChart3
                size={14}
              />
            }
            value={
              statusFilter
            }
            onChange={
              setStatusFilter
            }
          >

            <option value="ALL">
              {text.allStatuses}
            </option>


            {[
              "CONFIRMED",
              "ARRIVED",
              "LATE",
              "WEIGHING",
              "PROCURED",
              "PAYMENT_PENDING",
              "PAYMENT_SENT",
            ].map(
              (
                value
              ) => (

                <option
                  key={
                    value
                  }
                  value={
                    value
                  }
                >

                  {
                    getStatusLabel(
                      value,
                      language
                    )
                  }

                </option>

              )
            )}

          </ReportFilter>



          {(dateFilter !==
              "ALL" ||
            cropFilter !==
              "ALL" ||
            statusFilter !==
              "ALL" ||
            search) && (

            <button
              type="button"
              className="admin-reports-clear"
              onClick={
                clearFilters
              }
            >

              {text.clearFilters}

            </button>

          )}

        </section>



        {/* =====================================================
            KPI
        ====================================================== */}

        <section className="admin-report-kpi-grid">


          <ReportKpi
            tone="blue"
            icon={
              <FileText
                size={19}
              />
            }
            value={
              overview.totalBookings
            }
            label={
              text.totalBookings
            }
          />


          <ReportKpi
            tone="green"
            icon={
              <Scale
                size={19}
              />
            }
            value={
              formatQuantity(
                overview.totalActualQuantity
              )
            }
            label={
              text.totalProcuredQuantity
            }
            suffix="kg"
          />


          <ReportKpi
            tone="gold"
            icon={
              <IndianRupee
                size={19}
              />
            }
            value={
              formatCurrency(
                overview.totalPaid,
                language
              )
            }
            label={
              text.totalPaid
            }
          />


          <ReportKpi
            tone="orange"
            icon={
              <CreditCard
                size={19}
              />
            }
            value={
              formatCurrency(
                overview.pendingAmount,
                language
              )
            }
            label={
              text.pendingAmount
            }
          />


          <ReportKpi
            tone="purple"
            icon={
              <Users
                size={19}
              />
            }
            value={
              overview.uniqueFarmers
            }
            label={
              text.uniqueFarmers
            }
          />


          <ReportKpi
            tone="teal"
            icon={
              <TrendingUp
                size={19}
              />
            }
            value={
              `${overview.completionRate}%`
            }
            label={
              text.completionRate
            }
          />

        </section>



        {/* =====================================================
            ANALYTICS GRID
        ====================================================== */}

        <section className="admin-reports-analytics-grid">


          {/* CROP */}

          <div className="admin-report-panel">


            <ReportPanelHeader
              icon={
                <Wheat
                  size={18}
                />
              }
              tone="green"
              eyebrow={
                text.procurementAnalysis
              }
              title={
                text.cropBreakdown
              }
            />


            <div className="admin-report-chart-list">

              {cropBreakdown.length ===
                0 ? (

                <ReportEmpty
                  text={
                    text.noData
                  }
                />

              ) : (

                cropBreakdown.map(
                  (
                    item
                  ) => (

                    <HorizontalBar
                      key={
                        item.crop
                      }
                      label={
                        getCropName(
                          item.crop,
                          language
                        )
                      }
                      value={
                        item.quantity
                      }
                      max={
                        cropBreakdown[0]
                          ?.quantity ||
                        1
                      }
                      suffix="kg"
                    />

                  )
                )

              )}

            </div>

          </div>



          {/* STATUS */}

          <div className="admin-report-panel">


            <ReportPanelHeader
              icon={
                <BarChart3
                  size={18}
                />
              }
              tone="blue"
              eyebrow={
                text.workflow
              }
              title={
                text.statusBreakdown
              }
            />


            <div className="admin-status-report-list">

              {statusBreakdown.map(
                (
                  item
                ) => (

                  <div
                    key={
                      item.status
                    }
                    className="admin-status-report-row"
                  >

                    <div>

                      <span
                        className={
                          `admin-status-report-dot ${item.tone}`
                        }
                      />


                      <span>
                        {
                          getStatusLabel(
                            item.status,
                            language
                          )
                        }
                      </span>

                    </div>


                    <strong>
                      {item.count}
                    </strong>

                  </div>

                )
              )}

            </div>


            <div className="admin-status-total">

              <span>
                {text.totalRecords}
              </span>


              <strong>
                {
                  filteredBookings.length
                }
              </strong>

            </div>

          </div>



          {/* PAYMENTS */}

          <div className="admin-report-panel">


            <ReportPanelHeader
              icon={
                <IndianRupee
                  size={18}
                />
              }
              tone="gold"
              eyebrow={
                text.financialAnalysis
              }
              title={
                text.paymentBreakdown
              }
            />


            <div className="admin-payment-analysis">


              <PaymentAnalysisRow
                label={
                  text.paid
                }
                value={
                  formatCurrency(
                    paymentBreakdown.paid,
                    language
                  )
                }
                tone="green"
              />


              <PaymentAnalysisRow
                label={
                  text.pending
                }
                value={
                  formatCurrency(
                    paymentBreakdown.pending,
                    language
                  )
                }
                tone="gold"
              />


              <PaymentAnalysisRow
                label={
                  text.total
                }
                value={
                  formatCurrency(
                    paymentBreakdown.total,
                    language
                  )
                }
                tone="blue"
              />


              <div className="admin-payment-method-heading">

                <span>
                  {text.methods}
                </span>

              </div>


              {paymentBreakdown.methods.map(
                (
                  item
                ) => (

                  <div
                    key={
                      item.method
                    }
                    className="admin-payment-method-row"
                  >

                    <span>
                      {
                        formatPaymentMethod(
                          item.method,
                          language
                        )
                      }
                    </span>


                    <strong>
                      {item.count}
                    </strong>

                  </div>

                )
              )}

            </div>

          </div>



          {/* DAILY */}

          <div className="admin-report-panel admin-report-daily-panel">


            <ReportPanelHeader
              icon={
                <CalendarDays
                  size={18}
                />
              }
              tone="purple"
              eyebrow={
                text.trendAnalysis
              }
              title={
                text.dailyActivity
              }
            />


            <div className="admin-daily-chart">

              {dailyBreakdown.length ===
                0 ? (

                <ReportEmpty
                  text={
                    text.noData
                  }
                />

              ) : (

                dailyBreakdown.map(
                  (
                    item
                  ) => (

                    <div
                      key={
                        item.date
                      }
                      className="admin-daily-column"
                    >

                      <div
                        className="admin-daily-bar-area"
                      >

                        <div
                          className="admin-daily-bar"
                          style={{
                            height:
                              `${Math.max(
                                item.percent,
                                5
                              )}%`,
                          }}
                        >

                          <span>
                            {item.count}
                          </span>

                        </div>

                      </div>


                      <span>
                        {
                          formatShortDate(
                            item.date,
                            language
                          )
                        }
                      </span>

                    </div>

                  )
                )

              )}

            </div>

          </div>

        </section>



        {/* =====================================================
            DETAIL TABLE
        ====================================================== */}

        <section className="admin-report-panel admin-report-record-panel">


          <ReportPanelHeader
            icon={
              <FileText
                size={18}
              />
            }
            tone="teal"
            eyebrow={
              text.filteredData
            }
            title={
              text.reportRecords
            }
          />


          <div className="admin-report-record-table">


            <div className="admin-report-record-head">

              <span>
                {text.booking}
              </span>

              <span>
                {text.farmer}
              </span>

              <span>
                {text.crop}
              </span>

              <span>
                {text.quantity}
              </span>

              <span>
                {text.status}
              </span>

              <span>
                {text.payment}
              </span>

            </div>



            {loading ? (

              <ReportTableLoading />

            ) : filteredBookings.length ===
              0 ? (

              <div className="admin-report-no-records">

                <Search
                  size={22}
                />


                <strong>
                  {text.noMatchingRecords}
                </strong>


                <span>
                  {text.noMatchingRecordsText}
                </span>

              </div>

            ) : (

              filteredBookings
                .slice(
                  0,
                  30
                )
                .map(
                  (
                    booking
                  ) => (

                    <div
                      key={
                        booking.id
                      }
                      className="admin-report-record-row"
                    >

                      <div>

                        <strong>
                          #
                          {
                            booking.token ||
                            booking.id
                          }
                        </strong>


                        <span>
                          {
                            booking.id
                          }
                        </span>

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
                            booking.farmer_village ||
                            "—"
                          }
                        </span>

                      </div>


                      <div>

                        <strong>
                          {
                            getCropName(
                              booking.crop,
                              language
                            )
                          }
                        </strong>

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
                            booking.actual_quantity !==
                              null &&
                            booking.actual_quantity !==
                              undefined
                              ? text.actual
                              : text.estimated
                          }
                        </span>

                      </div>


                      <div>

                        <span
                          className={
                            `admin-report-status ${
                              getStatusTone(
                                booking.status
                              )
                            }`
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


                      <div>

                        <strong>

                          {
                            booking.payment_amount
                              ? formatCurrency(
                                  Number(
                                    booking.payment_amount
                                  ),
                                  language
                                )
                              : "—"
                          }

                        </strong>


                        <span>

                          {
                            booking.payment_method
                              ? formatPaymentMethod(
                                  booking.payment_method,
                                  language
                                )
                              : text.notAvailable
                          }

                        </span>

                      </div>

                    </div>

                  )
                )

            )}

          </div>


          {filteredBookings.length >
            30 && (

            <div className="admin-report-table-footer">

              {text.showingFirst30}

            </div>

          )}

        </section>



        {/* =====================================================
            REPORT FOOTER
        ====================================================== */}

        <div className="admin-reports-footer">

          <div>

            <Database
              size={13}
            />


            <span>
              {text.footerData}
            </span>

          </div>


          <span>
            {text.footerReadOnly}
          </span>

        </div>


      </div>

    </AdminLayout>

  );
}
function ReportFilter({
  icon,
  value,
  onChange,
  children,
}) {

  return (

    <div className="admin-report-filter">

      {icon}

      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
      >

        {children}

      </select>

    </div>

  );
}


/* =========================================================
   KPI
========================================================= */

function ReportKpi({
  icon,
  tone,
  value,
  label,
  suffix,
}) {

  return (

    <div
      className={
        `admin-report-kpi ${tone}`
      }
    >

      <div className="admin-report-kpi-icon">

        {icon}

      </div>


      <div>

        <strong>
          {value}
          {suffix && (
            <small>
              {" "}
              {suffix}
            </small>
          )}
        </strong>


        <span>
          {label}
        </span>

      </div>

    </div>

  );
}


/* =========================================================
   PANEL HEADER
========================================================= */

function ReportPanelHeader({
  icon,
  tone,
  eyebrow,
  title,
}) {

  return (

    <div className="admin-report-panel-header">

      <div
        className={
          `admin-report-panel-icon ${tone}`
        }
      >
        {icon}
      </div>


      <div>

        <span>
          {eyebrow}
        </span>


        <h3>
          {title}
        </h3>

      </div>

    </div>

  );
}


/* =========================================================
   HORIZONTAL BAR
========================================================= */

function HorizontalBar({
  label,
  value,
  max,
  suffix,
}) {

  const safeMax =
    Math.max(
      Number(max) || 0,
      1
    );


  const percent =
    Math.min(
      100,
      Math.max(
        3,
        (
          (
            Number(value) || 0
          ) /
          safeMax
        ) *
        100
      )
    );


  return (

    <div className="admin-horizontal-bar-row">

      <div className="admin-horizontal-bar-heading">

        <span>
          {label}
        </span>


        <strong>

          {
            Number(
              value || 0
            ).toLocaleString()
          }

          {" "}

          {suffix}

        </strong>

      </div>


      <div className="admin-horizontal-bar-track">

        <div
          style={{
            width:
              `${percent}%`,
          }}
        />

      </div>

    </div>

  );
}


/* =========================================================
   PAYMENT ANALYSIS ROW
========================================================= */

function PaymentAnalysisRow({
  label,
  value,
  tone,
}) {

  return (

    <div className="admin-payment-analysis-row">

      <div>

        <span
          className={
            `admin-payment-analysis-dot ${tone}`
          }
        />

        <span>
          {label}
        </span>

      </div>


      <strong>
        {value}
      </strong>

    </div>

  );
}


/* =========================================================
   EMPTY
========================================================= */

function ReportEmpty({
  text,
}) {

  return (

    <div className="admin-report-empty">

      <BarChart3
        size={22}
      />


      <span>
        {text}
      </span>

    </div>

  );
}


/* =========================================================
   TABLE LOADING
========================================================= */

function ReportTableLoading() {

  return (

    <div className="admin-report-loading">

      {[
        1,
        2,
        3,
        4,
        5,
      ].map(
        (item) => (

          <div
            key={item}
            className="admin-report-skeleton-row"
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
   REPORT OVERVIEW
========================================================= */

function getReportOverview(
  bookings
) {

  const totalBookings =
    bookings.length;


  const totalActualQuantity =
    bookings.reduce(
      (
        total,
        booking
      ) => {

        const quantity =
          Number(
            booking.actual_quantity ||
            0
          );


        return (
          total +
          (
            Number.isFinite(
              quantity
            )
              ? quantity
              : 0
          )
        );

      },
      0
    );


  const totalPaid =
    bookings.reduce(
      (
        total,
        booking
      ) => {

        if (
          booking.status !==
          "PAYMENT_SENT"
        ) {

          return total;

        }


        const amount =
          Number(
            booking.payment_amount ||
            0
          );


        return (
          total +
          (
            Number.isFinite(
              amount
            )
              ? amount
              : 0
          )
        );

      },
      0
    );


  const pendingAmount =
    bookings.reduce(
      (
        total,
        booking
      ) => {

        if (
          booking.status !==
            "PAYMENT_PENDING" &&
          booking.status !==
            "PROCURED"
        ) {

          return total;

        }


        const amount =
          Number(
            booking.payment_amount ||
            0
          );


        return (
          total +
          (
            Number.isFinite(
              amount
            )
              ? amount
              : 0
          )
        );

      },
      0
    );


  const uniqueFarmers =
    new Set(
      bookings
        .map(
          (
            booking
          ) =>
            booking.farmer_id
        )
        .filter(Boolean)
    ).size;


  const completed =
    bookings.filter(
      (
        booking
      ) =>
        booking.status ===
          "PROCURED" ||
        booking.status ===
          "PAYMENT_PENDING" ||
        booking.status ===
          "PAYMENT_SENT"
    ).length;


  const completionRate =
    totalBookings ===
      0
      ? 0
      : Math.round(
          (
            completed /
            totalBookings
          ) *
          100
        );


  return {

    totalBookings,

    totalActualQuantity,

    totalPaid,

    pendingAmount,

    uniqueFarmers,

    completionRate,

  };

}


/* =========================================================
   CROP BREAKDOWN
========================================================= */

function getCropBreakdown(
  bookings
) {

  const map =
    new Map();


  bookings.forEach(
    (
      booking
    ) => {

      const crop =
        booking.crop ||
        "unknown";


      const quantity =
        Number(
          booking.actual_quantity ||
          booking.estimated_quantity ||
          0
        );


      map.set(
        crop,
        (
          map.get(
            crop
          ) || 0
        ) +
        (
          Number.isFinite(
            quantity
          )
            ? quantity
            : 0
        )
      );

    }
  );


  return Array.from(
    map.entries()
  )
    .map(
      (
        [
          crop,
          quantity,
        ]
      ) => ({
        crop,
        quantity,
      })
    )
    .sort(
      (
        a,
        b
      ) =>
        b.quantity -
        a.quantity
    );

}


/* =========================================================
   STATUS BREAKDOWN
========================================================= */

function getStatusBreakdown(
  bookings
) {

  const statuses = [

    "CONFIRMED",

    "ARRIVED",

    "LATE",

    "WEIGHING",

    "PROCURED",

    "PAYMENT_PENDING",

    "PAYMENT_SENT",

  ];


  return statuses.map(
    (
      status
    ) => ({

      status,

      count:
        bookings.filter(
          (
            booking
          ) =>
            booking.status ===
            status
        ).length,

      tone:
        getStatusTone(
          status
        ),

    })
  );

}


/* =========================================================
   PAYMENT BREAKDOWN
========================================================= */

function getPaymentBreakdown(
  bookings
) {

  let paid =
    0;


  let pending =
    0;


  bookings.forEach(
    (
      booking
    ) => {

      const amount =
        Number(
          booking.payment_amount ||
          0
        );


      if (
        !Number.isFinite(
          amount
        )
      ) {

        return;

      }


      if (
        booking.status ===
        "PAYMENT_SENT"
      ) {

        paid +=
          amount;

      }


      if (
        booking.status ===
          "PAYMENT_PENDING" ||
        booking.status ===
          "PROCURED"
      ) {

        pending +=
          amount;

      }

    }
  );


  const methodsMap =
    new Map();


  bookings.forEach(
    (
      booking
    ) => {

      const method =
        booking.payment_method;


      if (
        !method
      ) {

        return;

      }


      methodsMap.set(
        method,
        (
          methodsMap.get(
            method
          ) || 0
        ) +
        1
      );

    }
  );


  const methods =
    Array.from(
      methodsMap.entries()
    )
      .map(
        (
          [
            method,
            count,
          ]
        ) => ({
          method,
          count,
        })
      )
      .sort(
        (
          a,
          b
        ) =>
          b.count -
          a.count
      );


  return {

    paid,

    pending,

    total:
      paid +
      pending,

    methods,

  };

}


/* =========================================================
   DAILY BREAKDOWN
========================================================= */

function getDailyBreakdown(
  bookings
) {

  const map =
    new Map();


  bookings.forEach(
    (
      booking
    ) => {

      const date =
        booking.date ||
        "";


      if (
        !date
      ) {

        return;

      }


      map.set(
        date,
        (
          map.get(
            date
          ) || 0
        ) +
        1
      );

    }
  );


  const rows =
    Array.from(
      map.entries()
    )
      .map(
        (
          [
            date,
            count,
          ]
        ) => ({
          date,
          count,
        })
      )
      .sort(
        (
          a,
          b
        ) =>
          a.date.localeCompare(
            b.date
          )
      )
      .slice(
        -7
      );


  const max =
    Math.max(
      ...rows.map(
        (
          item
        ) =>
          item.count
      ),
      1
    );


  return rows.map(
    (
      item
    ) => ({

      ...item,

      percent:
        (
          item.count /
          max
        ) *
        100,

    })
  );

}


/* =========================================================
   STATUS TONE
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


/* =========================================================
   STATUS LABEL
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
    status ||
    "Unknown"
  );

}


/* =========================================================
   CROP LABEL
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
   CURRENCY
========================================================= */

function formatCurrency(
  amount,
  language
) {

  const value =
    Number(
      amount
    );


  if (
    !Number.isFinite(
      value
    )
  ) {

    return "₹0";

  }


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
    value
  );

}


/* =========================================================
   QUANTITY
========================================================= */

function formatQuantity(
  value
) {

  const number =
    Number(
      value ||
      0
    );


  if (
    !Number.isFinite(
      number
    )
  ) {

    return "0";

  }


  if (
    number >=
    1000000
  ) {

    return `${(
      number /
      1000000
    ).toFixed(
      1
    )}M`;

  }


  if (
    number >=
    1000
  ) {

    return `${(
      number /
      1000
    ).toFixed(
      number >=
        10000
        ? 0
        : 1
    )}K`;

  }


  return number.toLocaleString();

}


/* =========================================================
   DATE
========================================================= */

function formatReportDate(
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

      year:
        "numeric",
    }
  );

}


/* =========================================================
   SHORT DATE
========================================================= */

function formatShortDate(
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
   PAYMENT METHOD
========================================================= */

function formatPaymentMethod(
  method,
  language
) {

  const labels = {

    BANK_TRANSFER: {

      en:
        "Bank Transfer",

      hi:
        "बैंक ट्रांसफर",

      te:
        "బ్యాంక్ ట్రాన్స్‌ఫర్",

    },

    UPI: {

      en:
        "UPI",

      hi:
        "UPI",

      te:
        "UPI",

    },

    CASH: {

      en:
        "Cash",

      hi:
        "नकद",

      te:
        "నగదు",

    },

  };


  return (
    labels[
      method
    ]?.[
      language
    ] ||
    labels[
      method
    ]?.en ||
    method ||
    "—"
  );

}


/* =========================================================
   COPY
========================================================= */

function getReportsCopy(
  language
) {

  const copy = {

    en: {

      title:
        "Reports & Analytics",

      subtitle:
        "Analyse procurement, farmers, quantities and payment activity.",

      eyebrow:
        "MANAGEMENT INTELLIGENCE",

      heading:
        "Understand what is happening at the center.",

      description:
        "Use filters and live procurement data to review operational performance, crop volumes, workflow progress and payments.",

      liveData:
        "LIVE DATA",

      refreshing:
        "Refreshing...",

      refresh:
        "Refresh",

      exportCsv:
        "Export CSV",

      connectionIssue:
        "Report data connection issue",

      retry:
        "Retry",

      searchPlaceholder:
        "Search farmer, token, crop or reference...",

      allDates:
        "All dates",

      allCrops:
        "All crops",

      allStatuses:
        "All statuses",

      clearFilters:
        "Clear filters",

      totalBookings:
        "Total bookings",

      totalProcuredQuantity:
        "Actual quantity",

      totalPaid:
        "Total paid",

      pendingAmount:
        "Pending amount",

      uniqueFarmers:
        "Unique farmers",

      completionRate:
        "Completion rate",

      procurementAnalysis:
        "PROCUREMENT ANALYSIS",

      cropBreakdown:
        "Crop volume",

      workflow:
        "WORKFLOW",

      statusBreakdown:
        "Booking status",

      financialAnalysis:
        "FINANCIAL ANALYSIS",

      paymentBreakdown:
        "Payment overview",

      paid:
        "Paid",

      pending:
        "Pending",

      total:
        "Total",

      methods:
        "Payment methods",

      trendAnalysis:
        "TREND ANALYSIS",

      dailyActivity:
        "Daily bookings",

      noData:
        "There is not enough data for this view yet.",

      totalRecords:
        "Total records",

      filteredData:
        "FILTERED DATA",

      reportRecords:
        "Detailed report records",

      booking:
        "Booking",

      farmer:
        "Farmer",

      crop:
        "Crop",

      quantity:
        "Quantity",

      status:
        "Status",

      payment:
        "Payment",

      actual:
        "Actual",

      estimated:
        "Estimated",

      notAvailable:
        "Not available",

      unknownFarmer:
        "Unknown farmer",

      noMatchingRecords:
        "No matching records",

      noMatchingRecordsText:
        "Change the filters or search term to see more records.",

      showingFirst30:
        "Showing the first 30 matching records.",

      footerData:
        "Reports are calculated from the live KrishiSetu booking database.",

      footerReadOnly:
        "Read-only management view",

    },


    hi: {

      title:
        "रिपोर्ट और एनालिटिक्स",

      subtitle:
        "खरीद, किसानों, मात्रा और भुगतान गतिविधि का विश्लेषण करें।",

      eyebrow:
        "प्रबंधन जानकारी",

      heading:
        "केंद्र में क्या हो रहा है, समझें।",

      description:
        "फ़िल्टर और लाइव खरीद डेटा से ऑपरेशनल प्रदर्शन, फसल मात्रा, प्रक्रिया और भुगतान की समीक्षा करें।",

      liveData:
        "लाइव डेटा",

      refreshing:
        "रीफ्रेश हो रहा है...",

      refresh:
        "रीफ्रेश",

      exportCsv:
        "CSV निर्यात",

      connectionIssue:
        "रिपोर्ट डेटा कनेक्शन समस्या",

      retry:
        "फिर कोशिश करें",

      searchPlaceholder:
        "किसान, टोकन, फसल या संदर्भ खोजें...",

      allDates:
        "सभी तारीखें",

      allCrops:
        "सभी फसलें",

      allStatuses:
        "सभी स्थितियां",

      clearFilters:
        "फ़िल्टर साफ करें",

      totalBookings:
        "कुल बुकिंग",

      totalProcuredQuantity:
        "वास्तविक मात्रा",

      totalPaid:
        "कुल भुगतान",

      pendingAmount:
        "लंबित राशि",

      uniqueFarmers:
        "अलग किसान",

      completionRate:
        "पूर्णता दर",

      procurementAnalysis:
        "खरीद विश्लेषण",

      cropBreakdown:
        "फसल मात्रा",

      workflow:
        "प्रक्रिया",

      statusBreakdown:
        "बुकिंग स्थिति",

      financialAnalysis:
        "वित्तीय विश्लेषण",

      paymentBreakdown:
        "भुगतान अवलोकन",

      paid:
        "भुगतान हुआ",

      pending:
        "लंबित",

      total:
        "कुल",

      methods:
        "भुगतान तरीके",

      trendAnalysis:
        "रुझान विश्लेषण",

      dailyActivity:
        "दैनिक बुकिंग",

      noData:
        "इस दृश्य के लिए अभी पर्याप्त डेटा नहीं है।",

      totalRecords:
        "कुल रिकॉर्ड",

      filteredData:
        "फ़िल्टर किया गया डेटा",

      reportRecords:
        "विस्तृत रिपोर्ट रिकॉर्ड",

      booking:
        "बुकिंग",

      farmer:
        "किसान",

      crop:
        "फसल",

      quantity:
        "मात्रा",

      status:
        "स्थिति",

      payment:
        "भुगतान",

      actual:
        "वास्तविक",

      estimated:
        "अनुमानित",

      notAvailable:
        "उपलब्ध नहीं",

      unknownFarmer:
        "अज्ञात किसान",

      noMatchingRecords:
        "कोई मिलते रिकॉर्ड नहीं",

      noMatchingRecordsText:
        "अधिक रिकॉर्ड देखने के लिए फ़िल्टर या खोज बदलें।",

      showingFirst30:
        "पहले 30 मिलते रिकॉर्ड दिखाए जा रहे हैं।",

      footerData:
        "रिपोर्ट लाइव KrishiSetu बुकिंग डेटाबेस से तैयार होती हैं।",

      footerReadOnly:
        "केवल-पठन प्रबंधन दृश्य",

    },


    te: {

      title:
        "రిపోర్టులు & అనలిటిక్స్",

      subtitle:
        "కొనుగోలు, రైతులు, పరిమాణాలు మరియు చెల్లింపు కార్యకలాపాలను విశ్లేషించండి.",

      eyebrow:
        "మేనేజ్‌మెంట్ ఇంటెలిజెన్స్",

      heading:
        "కేంద్రంలో ఏమి జరుగుతుందో తెలుసుకోండి.",

      description:
        "ఫిల్టర్‌లు మరియు లైవ్ కొనుగోలు డేటాతో కార్యకలాపాలు, పంట పరిమాణం, ప్రక్రియ మరియు చెల్లింపులను సమీక్షించండి.",

      liveData:
        "లైవ్ డేటా",

      refreshing:
        "రిఫ్రెష్ చేస్తోంది...",

      refresh:
        "రిఫ్రెష్",

      exportCsv:
        "CSV ఎగుమతి",

      connectionIssue:
        "రిపోర్ట్ డేటా కనెక్షన్ సమస్య",

      retry:
        "మళ్లీ ప్రయత్నించండి",

      searchPlaceholder:
        "రైతు, టోకెన్, పంట లేదా సూచన వెతకండి...",

      allDates:
        "అన్ని తేదీలు",

      allCrops:
        "అన్ని పంటలు",

      allStatuses:
        "అన్ని స్థితులు",

      clearFilters:
        "ఫిల్టర్‌లను క్లియర్ చేయండి",

      totalBookings:
        "మొత్తం బుకింగ్‌లు",

      totalProcuredQuantity:
        "వాస్తవ పరిమాణం",

      totalPaid:
        "మొత్తం చెల్లింపు",

      pendingAmount:
        "పెండింగ్ మొత్తం",

      uniqueFarmers:
        "ప్రత్యేక రైతులు",

      completionRate:
        "పూర్తి రేటు",

      procurementAnalysis:
        "కొనుగోలు విశ్లేషణ",

      cropBreakdown:
        "పంట పరిమాణం",

      workflow:
        "వర్క్‌ఫ్లో",

      statusBreakdown:
        "బుకింగ్ స్థితి",

      financialAnalysis:
        "ఆర్థిక విశ్లేషణ",

      paymentBreakdown:
        "చెల్లింపు అవలోకనం",

      paid:
        "చెల్లించినవి",

      pending:
        "పెండింగ్",

      total:
        "మొత్తం",

      methods:
        "చెల్లింపు పద్ధతులు",

      trendAnalysis:
        "ట్రెండ్ విశ్లేషణ",

      dailyActivity:
        "రోజువారీ బుకింగ్‌లు",

      noData:
        "ఈ వీక్షణకు ప్రస్తుతం తగినంత డేటా లేదు.",

      totalRecords:
        "మొత్తం రికార్డులు",

      filteredData:
        "ఫిల్టర్ చేసిన డేటా",

      reportRecords:
        "వివరమైన రిపోర్ట్ రికార్డులు",

      booking:
        "బుకింగ్",

      farmer:
        "రైతు",

      crop:
        "పంట",

      quantity:
        "పరిమాణం",

      status:
        "స్థితి",

      payment:
        "చెల్లింపు",

      actual:
        "వాస్తవ",

      estimated:
        "అంచనా",

      notAvailable:
        "అందుబాటులో లేదు",

      unknownFarmer:
        "తెలియని రైతు",

      noMatchingRecords:
        "సరిపోలే రికార్డులు లేవు",

      noMatchingRecordsText:
        "మరిన్ని రికార్డుల కోసం ఫిల్టర్ లేదా శోధన మార్చండి.",

      showingFirst30:
        "మొదటి 30 సరిపోలే రికార్డులు చూపబడుతున్నాయి.",

      footerData:
        "రిపోర్టులు లైవ్ KrishiSetu బుకింగ్ డేటాబేస్ ఆధారంగా రూపొందించబడతాయి.",

      footerReadOnly:
        "రీడ్-ఓన్లీ మేనేజ్‌మెంట్ వీక్షణ",

    },

  };


  return (
    copy[language] ||
    copy.en
  );

}


export default AdminReports;