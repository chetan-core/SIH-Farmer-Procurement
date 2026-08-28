import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  CheckCircle2,
  Database,
  RefreshCw,
  Search,
  Scale,
  Wheat,
} from "lucide-react";

import AdminLayout from "../../components/admin/AdminLayout";

const API_URL =
  import.meta.env.VITE_API_URL;


function AdminProcurement() {

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
    search,
    setSearch,
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
    error,
    setError,
  ] = useState("");


  const text =
    getProcurementCopy(
      language
    );


  const loadData =
    useCallback(
      async (
        manual = false
      ) => {

        if (manual) {
          setRefreshing(true);
        } else {
          setLoading(true);
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
              text.loadError
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
            "Procurement page error:",
            loadError
          );


          setError(
            loadError?.message ||
            text.loadError
          );

        } finally {

          setLoading(false);
          setRefreshing(false);

        }

      },
      [
        text.loadError,
      ]
    );


  useEffect(() => {

    loadData();


    const timer =
      setInterval(
        () =>
          loadData(),
        10000
      );


    return () =>
      clearInterval(
        timer
      );

  }, [
    loadData,
  ]);


  const procurementRows =
    useMemo(
      () =>
        bookings.filter(
          (
            booking
          ) =>
            [
              "PROCURED",
              "PAYMENT_PENDING",
              "PAYMENT_SENT",
            ].includes(
              booking.status
            ) &&
            booking.actual_quantity !==
              null &&
            booking.actual_quantity !==
              undefined
        ),
      [
        bookings,
      ]
    );


  const filteredRows =
    useMemo(
      () => {

        const query =
          search
            .trim()
            .toLowerCase();


        if (!query) {
          return procurementRows;
        }


        return procurementRows.filter(
          (
            booking
          ) => {

            const searchable =
              [
                booking.id,
                booking.token,
                booking.farmer_name,
                booking.farmer_phone,
                booking.farmer_village,
                booking.crop,
                booking.center_id,
                booking.quality,
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
        procurementRows,
        search,
      ]
    );


  const stats =
    useMemo(
      () => {

        const totalQuantity =
          procurementRows.reduce(
            (
              total,
              booking
            ) =>
              total +
              Number(
                booking.actual_quantity ||
                0
              ),
            0
          );


        const totalValue =
          procurementRows.reduce(
            (
              total,
              booking
            ) =>
              total +
              Number(
                booking.payment_amount ||
                0
              ),
            0
          );


        const averageQuantity =
          procurementRows.length
            ? totalQuantity /
              procurementRows.length
            : 0;


        const paid =
          procurementRows.filter(
            (
              booking
            ) =>
              booking.status ===
              "PAYMENT_SENT"
          ).length;


        return {
          total:
            procurementRows.length,

          totalQuantity,

          totalValue,

          averageQuantity,

          paid,
        };

      },
      [
        procurementRows,
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

      <div className="admin-procurement-page">


        <section className="admin-procurement-hero">


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


          <div className="admin-procurement-actions">


            <div className="admin-procurement-live">

              <Database
                size={14}
              />

              {text.liveData}

            </div>


            <button
              type="button"
              className="admin-procurement-refresh"
              onClick={() =>
                loadData(true)
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

          <div className="admin-procurement-error">

            <AlertTriangle
              size={17}
            />


            <span>
              {error}
            </span>

          </div>

        )}



        <section className="admin-procurement-kpi-grid">


          <ProcurementKpi
            tone="blue"
            icon={
              <CheckCircle2
                size={18}
              />
            }
            value={
              stats.total
            }
            label={
              text.totalProcurements
            }
          />


          <ProcurementKpi
            tone="green"
            icon={
              <Scale
                size={18}
              />
            }
            value={
              stats.totalQuantity.toLocaleString()
            }
            suffix="kg"
            label={
              text.totalQuantity
            }
          />


          <ProcurementKpi
            tone="gold"
            icon={
              <Wheat
                size={18}
              />
            }
            value={
              stats.averageQuantity.toLocaleString(
                undefined,
                {
                  maximumFractionDigits:
                    1,
                }
              )
            }
            suffix="kg"
            label={
              text.averageQuantity
            }
          />


          <ProcurementKpi
            tone="purple"
            icon={
              <CheckCircle2
                size={18}
              />
            }
            value={
              stats.paid
            }
            label={
              text.paidProcurements
            }
          />

        </section>



        <section className="admin-procurement-filter-panel">


          <div className="admin-procurement-search">

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


          <span>

            {
              filteredRows.length
            }

            {" "}

            {text.records}

          </span>

        </section>



        <section className="admin-procurement-table-panel">


          <div className="admin-procurement-table-header">

            <div>

              <span className="admin-page-eyebrow">
                {text.procurementRecords}
              </span>


              <h3>
                {text.completedProcurement}
              </h3>

            </div>


            <span>
              {text.liveDatabase}
            </span>

          </div>



          <div className="admin-procurement-table">


            <div className="admin-procurement-table-head">

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
                {text.quality}
              </span>

              <span>
                {text.rate}
              </span>

              <span>
                {text.amount}
              </span>

              <span>
                {text.status}
              </span>

            </div>



            {loading ? (

              <ProcurementLoading />

            ) : filteredRows.length ===
              0 ? (

              <div className="admin-procurement-empty">

                <Scale
                  size={25}
                />


                <strong>
                  {text.noRecords}
                </strong>


                <span>
                  {text.noRecordsText}
                </span>

              </div>

            ) : (

              filteredRows.map(
                (
                  booking
                ) => (

                  <ProcurementRow
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
                  />

                )
              )

            )}

          </div>

        </section>



        <div className="admin-procurement-footer">

          <span>
            {text.footer}
          </span>


          <span>
            {
              filteredRows.length
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

function ProcurementKpi({
  icon,
  tone,
  value,
  suffix,
  label,
}) {

  return (

    <div
      className={
        `admin-procurement-kpi ${tone}`
      }
    >

      <div className="admin-procurement-kpi-icon">

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
   ROW
========================================================= */

function ProcurementRow({
  booking,
  language,
  text,
}) {

  const paid =
    booking.status ===
    "PAYMENT_SENT";


  return (

    <div className="admin-procurement-row">


      <div className="admin-procurement-booking">

        <strong>

          #
          {
            booking.token ||
            booking.id
          }

        </strong>


        <span>
          {
            booking.date ||
            "—"
          }
        </span>

      </div>



      <div className="admin-procurement-farmer">

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



      <div className="admin-procurement-crop">

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



      <div className="admin-procurement-quantity">

        <strong>

          {
            Number(
              booking.actual_quantity ||
              0
            ).toLocaleString()
          }

          {" kg"}

        </strong>


        <span>

          {text.actual}

        </span>

      </div>



      <div>

        <span
          className={
            `admin-procurement-quality ${
              String(
                booking.quality ||
                ""
              ).toLowerCase()
            }`
          }
        >

          {
            getQualityLabel(
              booking.quality,
              language
            )
          }

        </span>

      </div>



      <div className="admin-procurement-rate">

        <strong>

          {
            booking.payment_rate_per_kg
              ? `₹${Number(
                  booking.payment_rate_per_kg
                ).toLocaleString(
                  "en-IN",
                  {
                    maximumFractionDigits:
                      2,
                  }
                )}`
              : "—"
          }

        </strong>


        <span>
          / kg
        </span>

      </div>



      <div className="admin-procurement-amount">

        <strong>

          ₹
          {
            Number(
              booking.payment_amount ||
              0
            ).toLocaleString(
              "en-IN",
              {
                maximumFractionDigits:
                  2,
              }
            )
          }

        </strong>

      </div>



      <div>

        <span
          className={
            `admin-procurement-status ${
              paid
                ? "paid"
                : "pending"
            }`
          }
        >

          <span />

          {
            paid
              ? text.paid
              : text.paymentPending
          }

        </span>

      </div>

    </div>

  );

}


/* =========================================================
   LOADING
========================================================= */

function ProcurementLoading() {

  return (

    <div className="admin-procurement-loading">

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
            className="admin-procurement-skeleton"
          >

            <span />
            <span />
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
   HELPERS
========================================================= */

function getCropName(
  crop,
  language
) {

  const names = {

    wheat: {
      en: "Wheat",
      hi: "गेहूं",
      te: "గోధుమ",
    },

    paddy: {
      en: "Paddy",
      hi: "धान",
      te: "వరి",
    },

    maize: {
      en: "Maize",
      hi: "मक्का",
      te: "మొక్కజొన్న",
    },

    cotton: {
      en: "Cotton",
      hi: "कपास",
      te: "పత్తి",
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


function getQualityLabel(
  quality,
  language
) {

  const labels = {

    GOOD: {
      en: "Good",
      hi: "अच्छी",
      te: "మంచిది",
    },

    AVERAGE: {
      en: "Average",
      hi: "औसत",
      te: "సగటు",
    },

    POOR: {
      en: "Poor",
      hi: "खराब",
      te: "తక్కువ",
    },

  };


  return (
    labels[
      quality
    ]?.[
      language
    ] ||
    labels[
      quality
    ]?.en ||
    quality ||
    "—"
  );

}


/* =========================================================
   COPY
========================================================= */

function getProcurementCopy(
  language
) {

  const copy = {

    en: {

      title:
        "Procurement",

      subtitle:
        "Review completed produce procurement and payable values.",

      eyebrow:
        "PROCUREMENT CONTROL",

      heading:
        "Every completed procurement in one place.",

      description:
        "Review actual quantities, quality, approved rates, payable amounts and payment state after procurement is completed.",

      liveData:
        "LIVE DATA",

      refreshing:
        "Refreshing...",

      refresh:
        "Refresh",

      loadError:
        "Unable to load procurement records.",

      totalProcurements:
        "Total procurements",

      totalQuantity:
        "Total quantity",

      averageQuantity:
        "Average quantity",

      paidProcurements:
        "Paid procurements",

      searchPlaceholder:
        "Search token, farmer, phone, crop or center...",

      records:
        "records",

      procurementRecords:
        "PROCUREMENT RECORDS",

      completedProcurement:
        "Completed procurement",

      liveDatabase:
        "Live database",

      booking:
        "Booking",

      farmer:
        "Farmer",

      crop:
        "Crop",

      quantity:
        "Quantity",

      quality:
        "Quality",

      rate:
        "Rate",

      amount:
        "Amount",

      status:
        "Status",

      actual:
        "Actual",

      paid:
        "Paid",

      paymentPending:
        "Payment pending",

      unknownFarmer:
        "Unknown farmer",

      noRecords:
        "No procurement records",

      noRecordsText:
        "Completed procurement records will appear here.",

      footer:
        "Procurement values are read from the live booking and payment records.",

      displayed:
        "displayed",

    },


    hi: {

      title:
        "खरीद",

      subtitle:
        "पूरी हुई उपज खरीद और देय राशि की समीक्षा करें।",

      eyebrow:
        "खरीद नियंत्रण",

      heading:
        "हर पूरी हुई खरीद एक जगह।",

      description:
        "वास्तविक मात्रा, गुणवत्ता, स्वीकृत दर, देय राशि और भुगतान स्थिति की समीक्षा करें।",

      liveData:
        "लाइव डेटा",

      refreshing:
        "रीफ्रेश हो रहा है...",

      refresh:
        "रीफ्रेश",

      loadError:
        "खरीद रिकॉर्ड लोड नहीं किए जा सके।",

      totalProcurements:
        "कुल खरीद",

      totalQuantity:
        "कुल मात्रा",

      averageQuantity:
        "औसत मात्रा",

      paidProcurements:
        "भुगतान की गई खरीद",

      searchPlaceholder:
        "टोकन, किसान, फोन, फसल या केंद्र खोजें...",

      records:
        "रिकॉर्ड",

      procurementRecords:
        "खरीद रिकॉर्ड",

      completedProcurement:
        "पूरी हुई खरीद",

      liveDatabase:
        "लाइव डेटाबेस",

      booking:
        "बुकिंग",

      farmer:
        "किसान",

      crop:
        "फसल",

      quantity:
        "मात्रा",

      quality:
        "गुणवत्ता",

      rate:
        "दर",

      amount:
        "राशि",

      status:
        "स्थिति",

      actual:
        "वास्तविक",

      paid:
        "भुगतान किया",

      paymentPending:
        "भुगतान लंबित",

      unknownFarmer:
        "अज्ञात किसान",

      noRecords:
        "कोई खरीद रिकॉर्ड नहीं",

      noRecordsText:
        "पूरी हुई खरीद के रिकॉर्ड यहां दिखाई देंगे।",

      footer:
        "खरीद मूल्य लाइव बुकिंग और भुगतान रिकॉर्ड से लिए जाते हैं।",

      displayed:
        "दिखाए गए",

    },


    te: {

      title:
        "కొనుగోలు",

      subtitle:
        "పూర్తయిన పంట కొనుగోలు మరియు చెల్లించాల్సిన మొత్తాలను సమీక్షించండి.",

      eyebrow:
        "కొనుగోలు నియంత్రణ",

      heading:
        "పూర్తయిన ప్రతి కొనుగోలు ఒకే చోట.",

      description:
        "వాస్తవ పరిమాణం, నాణ్యత, ఆమోదించిన రేటు, చెల్లించాల్సిన మొత్తం మరియు చెల్లింపు స్థితిని సమీక్షించండి.",

      liveData:
        "లైవ్ డేటా",

      refreshing:
        "రిఫ్రెష్ చేస్తోంది...",

      refresh:
        "రిఫ్రెష్",

      loadError:
        "కొనుగోలు రికార్డులను లోడ్ చేయలేకపోయాము.",

      totalProcurements:
        "మొత్తం కొనుగోళ్లు",

      totalQuantity:
        "మొత్తం పరిమాణం",

      averageQuantity:
        "సగటు పరిమాణం",

      paidProcurements:
        "చెల్లించిన కొనుగోళ్లు",

      searchPlaceholder:
        "టోకెన్, రైతు, ఫోన్, పంట లేదా కేంద్రం వెతకండి...",

      records:
        "రికార్డులు",

      procurementRecords:
        "కొనుగోలు రికార్డులు",

      completedProcurement:
        "పూర్తయిన కొనుగోలు",

      liveDatabase:
        "లైవ్ డేటాబేస్",

      booking:
        "బుకింగ్",

      farmer:
        "రైతు",

      crop:
        "పంట",

      quantity:
        "పరిమాణం",

      quality:
        "నాణ్యత",

      rate:
        "రేటు",

      amount:
        "మొత్తం",

      status:
        "స్థితి",

      actual:
        "వాస్తవ",

      paid:
        "చెల్లించబడింది",

      paymentPending:
        "చెల్లింపు పెండింగ్",

      unknownFarmer:
        "తెలియని రైతు",

      noRecords:
        "కొనుగోలు రికార్డులు లేవు",

      noRecordsText:
        "పూర్తయిన కొనుగోలు రికార్డులు ఇక్కడ కనిపిస్తాయి.",

      footer:
        "కొనుగోలు విలువలు లైవ్ బుకింగ్ మరియు చెల్లింపు రికార్డుల నుండి తీసుకోబడతాయి.",

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


export default AdminProcurement;