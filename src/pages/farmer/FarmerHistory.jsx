import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Coins,
  RefreshCw,
  Scale,
  Search,
  Wheat,
} from "lucide-react";

import {
  Link,
} from "react-router";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Header from "../../components/Header";
import StatusBadge from "../../components/StatusBadge";

import {
  useLanguage,
} from "../../translations/LanguageContext";

import {
  getCurrentFarmer,
} from "../../data/appStore";


const API_URL =
  import.meta.env.VITE_API_URL;


const COMPLETED_STATUSES = [
  "PROCURED",
  "PAYMENT_PENDING",
  "PAYMENT_SENT",
];


function FarmerHistory() {

  const {
    t,
    language,
  } =
    useLanguage();


  const farmer =
    getCurrentFarmer();


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
    search,
    setSearch,
  ] =
    useState("");


  const [
    cropFilter,
    setCropFilter,
  ] =
    useState("ALL");


  const [
    monthFilter,
    setMonthFilter,
  ] =
    useState("ALL");


  const farmerId =
    farmer?.id ||
    null;


  const loadHistory =
    useCallback(
      async (
        manual = false
      ) => {

        if (
          !farmerId
        ) {

          setError(
            getText(
              language,
              "Farmer account could not be loaded.",
              "किसान खाता लोड नहीं हो सका।",
              "రైతు ఖాతాను లోడ్ చేయలేకపోయాము."
            )
          );

          setLoading(false);

          return;

        }


        if (
          manual
        ) {

          setRefreshing(true);

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
              "Unable to load procurement history."
            );

          }


          const allBookings =
            Array.isArray(
              data?.bookings
            )
              ? data.bookings
              : [];


          const mine =
            allBookings.filter(
              (
                item
              ) =>
                String(
                  item?.farmer_id ??
                  ""
                ) ===
                String(
                  farmerId
                )
            );


          setBookings(
            mine
          );


          setError("");


        } catch (
          historyError
        ) {

          console.error(
            "FarmerHistory error:",
            historyError
          );


          setError(
            historyError?.message ||
            getText(
              language,
              "Unable to load procurement history.",
              "खरीद इतिहास लोड नहीं हो सका।",
              "కొనుగోలు చరిత్రను లోడ్ చేయలేకపోయాము."
            )
          );


        } finally {

          setLoading(false);

          setRefreshing(false);

        }

      },
      [
        farmerId,
        language,
      ]
    );


  useEffect(
    () => {

      loadHistory();


      const timer =
        setInterval(
          () =>
            loadHistory(),
          5000
        );


      return () => {

        clearInterval(
          timer
        );

      };

    },
    [
      loadHistory,
    ]
  );


  const monthOptions =
    useMemo(
      () => {

        const values =
          bookings
            .map(
              (
                item
              ) =>
                getMonthId(
                  item.date
                )
            )
            .filter(Boolean);


        return Array.from(
          new Set(
            values
          )
        ).sort(
          (
            a,
            b
          ) =>
            b.localeCompare(
              a
            )
        );

      },
      [
        bookings,
      ]
    );


  const cropOptions =
    useMemo(
      () =>
        Array.from(
          new Set(
            bookings
              .map(
                (
                  item
                ) =>
                  item.crop
              )
              .filter(Boolean)
          )
        ),
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


        return [
          ...bookings,
        ]
          .filter(
            (
              item
            ) => {

              if (
                cropFilter !==
                  "ALL" &&
                item.crop !==
                  cropFilter
              ) {

                return false;

              }


              if (
                monthFilter !==
                  "ALL" &&
                getMonthId(
                  item.date
                ) !==
                  monthFilter
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
                  item.id,
                  item.token,
                  item.crop,
                  item.date,
                  item.status,
                  item.center_id,
                  item.payment_reference,
                ]
                  .filter(Boolean)
                  .join(" ")
                  .toLowerCase();


              return searchable.includes(
                query
              );

            }
          )
          .sort(
            (
              a,
              b
            ) => {

              const dateCompare =
                String(
                  b.date ||
                  ""
                ).localeCompare(
                  String(
                    a.date ||
                    ""
                  )
                );


              if (
                dateCompare !==
                0
              ) {

                return dateCompare;

              }


              return String(
                b.created_at ||
                ""
              ).localeCompare(
                String(
                  a.created_at ||
                  ""
                )
              );

            }
          );

      },
      [
        bookings,
        search,
        cropFilter,
        monthFilter,
      ]
    );


  const summary =
    useMemo(
      () => {

        const completed =
          bookings.filter(
            (
              item
            ) =>
              COMPLETED_STATUSES.includes(
                item.status
              )
          );


        const quantity =
          completed.reduce(
            (
              total,
              item
            ) =>
              total +
              Number(
                item.actual_quantity ??
                item.estimated_quantity ??
                0
              ),
            0
          );


        const received =
          bookings
            .filter(
              (
                item
              ) =>
                item.status ===
                "PAYMENT_SENT"
            )
            .reduce(
              (
                total,
                item
              ) =>
                total +
                Number(
                  item.payment_amount ||
                  0
                ),
              0
            );


        return {

          bookings:
            bookings.length,

          completed:
            completed.length,

          quantity,

          received,

        };

      },
      [
        bookings,
      ]
    );


  const graphData =
    useMemo(
      () => {

        const source =
          monthFilter ===
          "ALL"
            ? bookings
            : bookings.filter(
                (
                  item
                ) =>
                  getMonthId(
                    item.date
                  ) ===
                  monthFilter
              );


        const completed =
          source.filter(
            (
              item
            ) =>
              COMPLETED_STATUSES.includes(
                item.status
              )
          );


        const map =
          {};


        completed.forEach(
          (
            item
          ) => {

            const crop =
              item.crop ||
              "other";


            if (
              !map[crop]
            ) {

              map[crop] = {

                crop,

                quantity:
                  0,

                amount:
                  0,

                count:
                  0,

              };

            }


            map[
              crop
            ].quantity +=
              Number(
                item.actual_quantity ??
                item.estimated_quantity ??
                0
              );


            map[
              crop
            ].amount +=
              Number(
                item.payment_amount ||
                0
              );


            map[
              crop
            ].count +=
              1;

          }
        );


        return Object.values(
          map
        ).sort(
          (
            a,
            b
          ) =>
            b.quantity -
            a.quantity
        );

      },
      [
        bookings,
        monthFilter,
      ]
    );


  const graphMaximum =
    Math.max(
      ...graphData.map(
        (
          item
        ) =>
          item.quantity
      ),
      1
    );


  if (
    !farmer
  ) {

    return (

      <div className="farmer-history-page">

        <Header />

        <main className="farmer-history-container">

          <section className="farmer-history-empty">

            <div className="farmer-history-empty-icon">

              <Search
                size={28}
              />

            </div>


            <h1>

              {getText(
                language,
                "Farmer account not found",
                "किसान खाता नहीं मिला",
                "రైతు ఖాతా కనుగొనబడలేదు"
              )}

            </h1>


            <p>

              {getText(
                language,
                "Please login again to continue.",
                "जारी रखने के लिए फिर लॉगिन करें।",
                "కొనసాగించడానికి మళ్లీ లాగిన్ చేయండి."
              )}

            </p>


            <Link
              to="/farmer/login"
              className="home-primary-action"
            >

              {getText(
                language,
                "Go to Login",
                "लॉगिन पर जाएं",
                "లాగిన్‌కు వెళ్లండి"
              )}

              <ArrowRight
                size={17}
              />

            </Link>

          </section>

        </main>

      </div>

    );

  }


  return (

    <div className="farmer-history-page">

      <Header />


      <main className="farmer-history-container">


        {/* HEADER */}

        <section className="farmer-history-top">

          <div>

            <Link
              to="/farmer/home"
              className="back-link"
            >

              <ArrowLeft
                size={17}
              />

              {getText(
                language,
                "Back to Home",
                "होम पर वापस जाएं",
                "హోమ్‌కు తిరిగి వెళ్లండి"
              )}

            </Link>


            <span className="page-eyebrow">

              {getText(
                language,
                "PROCUREMENT HISTORY",
                "खरीद इतिहास",
                "కొనుగోలు చరిత్ర"
              )}

            </span>


            <h1>

              {getText(
                language,
                "Your procurement history",
                "आपका खरीद इतिहास",
                "మీ కొనుగోలు చరిత్ర"
              )}

            </h1>


            <p>

              {getText(
                language,
                "See your crops, quantities, procurement records and payments in one place.",
                "अपनी फसल, मात्रा, खरीद रिकॉर्ड और भुगतान एक ही जगह देखें।",
                "మీ పంటలు, పరిమాణాలు, కొనుగోలు రికార్డులు మరియు చెల్లింపులను ఒకే చోట చూడండి."
              )}

            </p>

          </div>


          <button
            type="button"
            className="farmer-history-refresh"
            onClick={() =>
              loadHistory(true)
            }
            disabled={
              refreshing
            }
          >

            <RefreshCw
              size={17}
              className={
                refreshing
                  ? "loading-spin"
                  : ""
              }
            />

            {getText(
              language,
              "Refresh",
              "रीफ्रेश",
              "రిఫ్రెష్"
            )}

          </button>

        </section>



        {/* FILTERS */}

        <section className="farmer-history-filter-bar">

          <div className="farmer-history-search">

            <Search
              size={18}
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
              placeholder={getText(
                language,
                "Search token, crop, date or reference...",
                "टोकन, फसल, तारीख या संदर्भ खोजें...",
                "టోకెన్, పంట, తేదీ లేదా రిఫరెన్స్ వెతకండి..."
              )}
            />

          </div>


          <select
            value={
              monthFilter
            }
            onChange={(event) =>
              setMonthFilter(
                event.target.value
              )
            }
          >

            <option value="ALL">

              {getText(
                language,
                "All months",
                "सभी महीने",
                "అన్ని నెలలు"
              )}

            </option>


            {
              monthOptions.map(
                (
                  month
                ) => (

                  <option
                    key={
                      month
                    }
                    value={
                      month
                    }
                  >

                    {
                      formatMonthLabel(
                        month,
                        language
                      )
                    }

                  </option>

                )
              )
            }

          </select>


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

              {getText(
                language,
                "All crops",
                "सभी फसलें",
                "అన్ని పంటలు"
              )}

            </option>


            {
              cropOptions.map(
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
                        language,
                        t
                      )
                    }

                  </option>

                )
              )
            }

          </select>


          {
            (
              search ||
              cropFilter !==
                "ALL" ||
              monthFilter !==
                "ALL"
            ) && (

              <button
                type="button"
                onClick={() => {

                  setSearch("");

                  setCropFilter(
                    "ALL"
                  );

                  setMonthFilter(
                    "ALL"
                  );

                }}
              >

                {getText(
                  language,
                  "Clear",
                  "साफ करें",
                  "క్లియర్"
                )}

              </button>

            )
          }

        </section>



        {/* SUMMARY */}

        <section className="farmer-history-stats">

          <HistoryStat
            icon={
              <CalendarDays
                size={21}
              />
            }
            label={getText(
              language,
              "Total bookings",
              "कुल बुकिंग",
              "మొత్తం బుకింగ్‌లు"
            )}
            value={
              summary.bookings
            }
          />


          <HistoryStat
            icon={
              <CheckCircle2
                size={21}
              />
            }
            label={getText(
              language,
              "Completed",
              "पूरी हुई",
              "పూర్తైనవి"
            )}
            value={
              summary.completed
            }
          />


          <HistoryStat
            icon={
              <Scale
                size={21}
              />
            }
            label={getText(
              language,
              "Produce supplied",
              "दी गई उपज",
              "సరఫరా చేసిన పంట"
            )}
            value={
              `${summary.quantity.toLocaleString()} kg`
            }
          />


          <HistoryStat
            icon={
              <Coins
                size={21}
              />
            }
            label={getText(
              language,
              "Total received",
              "कुल प्राप्त",
              "మొత్తం అందుకున్నది"
            )}
            value={
              `₹${summary.received.toLocaleString(
                "en-IN",
                {
                  maximumFractionDigits:
                    2,
                }
              )}`
            }
          />

        </section>



        {/* GRAPH */}

        <section className="farmer-history-chart-card">

          <div className="farmer-history-chart-heading">

            <div>

              <span className="page-eyebrow">

                {getText(
                  language,
                  "CROP ACTIVITY",
                  "फसल गतिविधि",
                  "పంట కార్యకలాపాలు"
                )}

              </span>


              <h2>

                {getText(
                  language,
                  "Produce supplied by crop",
                  "फसल के अनुसार दी गई उपज",
                  "పంట ప్రకారం సరఫరా చేసిన పంట"
                )}

              </h2>


              <p>

                {
                  monthFilter ===
                  "ALL"
                    ? getText(
                        language,
                        "All available months",
                        "सभी उपलब्ध महीने",
                        "అందుబాటులో ఉన్న అన్ని నెలలు"
                      )
                    : formatMonthLabel(
                        monthFilter,
                        language
                      )
                }

              </p>

            </div>


            <Wheat
              size={24}
            />

          </div>


          {
            graphData.length ===
              0 ? (

              <div className="farmer-history-chart-empty">

                <Wheat
                  size={28}
                />


                <strong>

                  {getText(
                    language,
                    "No completed procurement data",
                    "कोई पूरी हुई खरीद जानकारी नहीं",
                    "పూర్తైన కొనుగోలు డేటా లేదు"
                  )}

                </strong>


                <span>

                  {getText(
                    language,
                    "Your crop activity will appear here after procurement.",
                    "खरीद पूरी होने के बाद आपकी फसल गतिविधि यहां दिखाई देगी।",
                    "కొనుగోలు పూర్తైన తర్వాత మీ పంట కార్యకలాపాలు ఇక్కడ కనిపిస్తాయి."
                  )}

                </span>

              </div>

            ) : (

              <div className="farmer-history-chart">

                {
                  graphData.map(
                    (
                      item
                    ) => {

                      const percent =
                        (
                          item.quantity /
                          graphMaximum
                        ) *
                        100;


                      return (

                        <div
                          key={
                            item.crop
                          }
                          className="farmer-history-chart-row"
                        >

                          <div className="farmer-history-chart-label">

                            <div className="farmer-history-chart-icon">

                              <Wheat
                                size={17}
                              />

                            </div>


                            <strong>

                              {
                                getCropName(
                                  item.crop,
                                  language,
                                  t
                                )
                              }

                            </strong>

                          </div>


                          <div className="farmer-history-chart-track">

                            <div
                              className="farmer-history-chart-bar"
                              style={{
                                width:
                                  `${Math.max(
                                    percent,
                                    5
                                  )}%`,
                              }}
                            />

                          </div>


                          <div className="farmer-history-chart-value">

                            <strong>

                              {
                                item.quantity.toLocaleString()
                              }

                              {" kg"}

                            </strong>


                            <span>

                              ₹
                              {
                                item.amount.toLocaleString(
                                  "en-IN",
                                  {
                                    maximumFractionDigits:
                                      2,
                                  }
                                )
                              }

                            </span>

                          </div>

                        </div>

                      );

                    }
                  )
                }

              </div>

            )
          }

        </section>



        {/* CROP SUMMARY */}

        {
          graphData.length >
          0 && (

            <section className="farmer-history-crop-summary">

              <div className="farmer-history-chart-heading">

                <div>

                  <span className="page-eyebrow">

                    {getText(
                      language,
                      "BY CROP",
                      "फसल के अनुसार",
                      "పంట ప్రకారం"
                    )}

                  </span>


                  <h2>

                    {getText(
                      language,
                      "Crop summary",
                      "फसल सारांश",
                      "పంట సారాంశం"
                    )}

                  </h2>

                </div>

              </div>


              <div className="farmer-history-crop-cards">

                {
                  graphData.map(
                    (
                      item
                    ) => (

                      <div
                        key={
                          item.crop
                        }
                        className="farmer-history-crop-card"
                      >

                        <div className="farmer-history-crop-card-icon">

                          <Wheat
                            size={19}
                          />

                        </div>


                        <strong>

                          {
                            getCropName(
                              item.crop,
                              language,
                              t
                            )
                          }

                        </strong>


                        <span>

                          {
                            item.quantity.toLocaleString()
                          }

                          {" kg"}

                        </span>


                        <small>

                          ₹
                          {
                            item.amount.toLocaleString(
                              "en-IN",
                              {
                                maximumFractionDigits:
                                  2,
                              }
                            )
                          }

                        </small>

                      </div>

                    )
                  )
                }

              </div>

            </section>

          )
        }



        {/* RECORDS */}

        <section className="farmer-history-list-card">

          <div className="farmer-history-list-heading">

            <div>

              <span className="page-eyebrow">

                {getText(
                  language,
                  "PROCUREMENT RECORDS",
                  "खरीद रिकॉर्ड",
                  "కొనుగోలు రికార్డులు"
                )}

              </span>


              <h2>

                {
                  filteredBookings.length
                }

                {" "}

                {getText(
                  language,
                  "records",
                  "रिकॉर्ड",
                  "రికార్డులు"
                )}

              </h2>

            </div>


            <span className="farmer-history-month-label">

              {
                monthFilter ===
                  "ALL"
                  ? getText(
                      language,
                      "All time",
                      "सभी समय",
                      "అన్ని కాలాలు"
                    )
                  : formatMonthLabel(
                      monthFilter,
                      language
                    )
              }

            </span>

          </div>


          {
            loading ? (

              <div className="farmer-history-loading">

                <RefreshCw
                  size={24}
                  className="loading-spin"
                />


                {getText(
                  language,
                  "Loading history...",
                  "इतिहास लोड हो रहा है...",
                  "చరిత్ర లోడ్ అవుతోంది..."
                )}

              </div>

            ) : error ? (

              <div className="farmer-history-empty">

                <RefreshCw
                  size={25}
                />


                <strong>

                  {getText(
                    language,
                    "Unable to load history",
                    "इतिहास लोड नहीं हो सका",
                    "చరిత్రను లోడ్ చేయలేకపోయాము"
                  )}

                </strong>


                <span>
                  {error}
                </span>


                <button
                  type="button"
                  className="home-primary-action"
                  onClick={() =>
                    loadHistory(true)
                  }
                >

                  {getText(
                    language,
                    "Try again",
                    "फिर कोशिश करें",
                    "మళ్లీ ప్రయత్నించండి"
                  )}

                </button>

              </div>

            ) : filteredBookings.length ===
                0 ? (

              <div className="farmer-history-empty">

                <Search
                  size={26}
                />


                <strong>

                  {getText(
                    language,
                    "No matching records",
                    "कोई रिकॉर्ड नहीं मिला",
                    "సరిపోలే రికార్డులు లేవు"
                  )}

                </strong>


                <span>

                  {getText(
                    language,
                    "Try changing the month, crop or search.",
                    "महीना, फसल या खोज बदलकर देखें।",
                    "నెల, పంట లేదా శోధనను మార్చి చూడండి."
                  )}

                </span>

              </div>

            ) : (

              <div className="farmer-history-records">

                {
                  filteredBookings.map(
                    (
                      item
                    ) => (

                      <Link
                        key={
                          item.id
                        }
                        to={
                          `/farmer/token?booking=${encodeURIComponent(
                            item.id
                          )}`
                        }
                        className="farmer-history-record"
                      >

                        <div className="farmer-history-token">

                          #
                          {
                            item.token ||
                            item.id
                          }

                        </div>


                        <div className="farmer-history-crop">

                          <div className="farmer-history-crop-icon">

                            <Wheat
                              size={19}
                            />

                          </div>


                          <div>

                            <strong>

                              {
                                getCropName(
                                  item.crop,
                                  language,
                                  t
                                )
                              }

                            </strong>


                            <span>

                              {
                                Number(
                                  item.actual_quantity ??
                                  item.estimated_quantity ??
                                  0
                                ).toLocaleString()
                              }

                              {" kg"}

                              {" · "}

                              {
                                formatDate(
                                  item.date,
                                  language
                                )
                              }

                            </span>

                          </div>

                        </div>


                        <div className="farmer-history-status">

                          <StatusBadge
                            status={
                              item.status
                            }
                          />

                        </div>


                        <div className="farmer-history-amount">

                          {
                            Number(
                              item.payment_amount ||
                              0
                            ) > 0 ? (

                              <>

                                <strong>

                                  ₹
                                  {
                                    Number(
                                      item.payment_amount
                                    ).toLocaleString(
                                      "en-IN",
                                      {
                                        maximumFractionDigits:
                                          2,
                                      }
                                    )
                                  }

                                </strong>


                                <span>

                                  {
                                    item.status ===
                                    "PAYMENT_SENT"
                                      ? getText(
                                          language,
                                          "Paid",
                                          "भुगतान हुआ",
                                          "చెల్లింపు అయింది"
                                        )
                                      : getText(
                                          language,
                                          "Processing",
                                          "प्रक्रिया में",
                                          "ప్రాసెసింగ్‌లో"
                                        )
                                  }

                                </span>

                              </>

                            ) : (

                              <span>

                                {getText(
                                  language,
                                  "No payment yet",
                                  "अभी भुगतान नहीं",
                                  "ఇంకా చెల్లింపు లేదు"
                                )}

                              </span>

                            )
                          }

                        </div>


                        <ChevronRight
                          size={18}
                        />

                      </Link>

                    )
                  )
                }

              </div>

            )
          }

        </section>



        {/* FOOTER */}

        <div className="farmer-history-footer">

          <Link
            to="/farmer/home"
            className="home-secondary-action"
          >

            <ArrowLeft
              size={16}
            />

            {getText(
              language,
              "Back to Home",
              "होम पर वापस जाएं",
              "హోమ్‌కు తిరిగి వెళ్లండి"
            )}

          </Link>


          <Link
            to="/farmer/book"
            className="home-primary-action"
          >

            {getText(
              language,
              "Book another procurement slot",
              "दूसरा खरीद स्लॉट बुक करें",
              "మరో కొనుగోలు స్లాట్ బుక్ చేయండి"
            )}

            <ArrowRight
              size={17}
            />

          </Link>

        </div>

      </main>

    </div>

  );

}


/* =========================================================
   COMPONENT
========================================================= */

function HistoryStat({
  icon,
  label,
  value,
}) {

  return (

    <div className="farmer-history-stat">

      <div className="farmer-history-stat-icon">

        {icon}

      </div>


      <div>

        <span>
          {label}
        </span>


        <strong>
          {value}
        </strong>

      </div>

    </div>

  );

}


/* =========================================================
   HELPERS
========================================================= */

function getText(
  language,
  english,
  hindi,
  telugu
) {

  if (
    language ===
    "hi"
  ) {

    return hindi;

  }


  if (
    language ===
    "te"
  ) {

    return telugu;

  }


  return english;

}


function getCropName(
  crop,
  language,
  t
) {

  if (
    !crop
  ) {

    return getText(
      language,
      "Produce",
      "उपज",
      "పంట"
    );

  }


  const key =
    `crops.${crop}`;


  if (
    t
  ) {

    const translated =
      t(
        key
      );


    if (
      translated &&
      translated !==
        key
    ) {

      return translated;

    }

  }


  const names = {

    wheat:
      getText(
        language,
        "Wheat",
        "गेहूं",
        "గోధుమ"
      ),

    paddy:
      getText(
        language,
        "Paddy",
        "धान",
        "వరి"
      ),

    maize:
      getText(
        language,
        "Maize",
        "मक्का",
        "మొక్కజొన్న"
      ),

    cotton:
      getText(
        language,
        "Cotton",
        "कपास",
        "పత్తి"
      ),

  };


  return (
    names[
      crop
    ] ||
    crop
  );

}


function getMonthId(
  value
) {

  if (
    !value
  ) {

    return "";

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

    return "";

  }


  return (
    `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    )}`
  );

}


function formatMonthLabel(
  monthId,
  language
) {

  if (
    !monthId
  ) {

    return "";

  }


  const [
    year,
    month,
  ] =
    monthId.split(
      "-"
    );


  const date =
    new Date(
      Number(year),
      Number(month) - 1,
      1
    );


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
      month:
        "long",

      year:
        "numeric",

    }
  );

}


function formatDate(
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


export default FarmerHistory;