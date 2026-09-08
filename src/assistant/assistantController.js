import {
  ACTIONS,
} from "./assistantActions";

import {
  buildAssistantContext,
  buildServerAssistantContext,
  validateActionForContext,
} from "./assistantContext";

import {
  assistantRouter,
  routeAssistantCommand,
  mergeBackendDecision,
  getExecutionPlan,
  loadPendingAction,
  savePendingAction,
  clearPendingAction,
} from "./assistantRouter";

import {
  assistantService,
} from "./assistantService";

import {
  assistantExecutor,
} from "./assistantExecutor";

import {
  assistantBooking,
  BOOKING_INTENTS,
  BOOKING_STEPS,
} from "./assistantBooking";

import {
  cleanText,
  normalizeLanguageCode,
  sanitizeActionParams,
  getStoredFarmer,
  debugLog,
  readStorageJson,
  writeStorageJson,
  removeStorage,
} from "./assistantUtils";

const DEFAULT_LANGUAGE =
  "en";

const DEFAULT_PATH =
  "/";

const BOOKING_STATE_STORAGE_KEY =
  "krishisetu_ai_booking_state";

const BOOKING_STATE_TTL =
  15 * 60 * 1000;

const BOOKING_AVAILABILITY_CACHE_TTL =
  60 * 1000;

const BOOKING_API_URL =
  import.meta.env.VITE_API_URL ||
  "";

export const CONTROLLER_TYPES = {
  LOCAL:
    "LOCAL",

  AI:
    "AI",

  NAVIGATION:
    "NAVIGATION",

  CONFIRMATION:
    "CONFIRMATION",

  CANCELLATION:
    "CANCELLATION",

  CURRENT_PAGE:
    "CURRENT_PAGE",

  BOOKING:
    "BOOKING",

  ERROR:
    "ERROR",

  NONE:
    "NONE",
};

export const CONTROLLER_STATUS = {
  SUCCESS:
    "SUCCESS",

  FAILED:
    "FAILED",

  PENDING:
    "PENDING",

  CANCELLED:
    "CANCELLED",

  SKIPPED:
    "SKIPPED",
};

function controllerResult(
  type,
  status,
  extras = {}
) {
  return {
    type,
    status,
    success:
      status ===
      CONTROLLER_STATUS.SUCCESS,
    ...extras,
  };
}

function normalizeOptions(
  options = {}
) {
  const {
    currentPath =
      DEFAULT_PATH,

    language =
      DEFAULT_LANGUAGE,

    history =
      [],

    message =
      "",

    pendingAction =
      undefined,

    navigate =
      null,

    bookingState =
      undefined,

    bookingContext =
      null,
  } = options;

  return {
    currentPath:
      String(
        currentPath ||
        DEFAULT_PATH
      ),

    language:
      normalizeLanguageCode(
        language
      ),

    history:
      Array.isArray(
        history
      )
        ? history
        : [],

    message:
      cleanText(
        message
      ),

    pendingAction,

    navigate,

    bookingState,

    bookingContext,
  };
}

function loadBookingState() {
  const canonical =
    typeof assistantBooking.loadBookingDraft ===
      "function"
      ? assistantBooking.loadBookingDraft()
      : null;

  if (
    canonical &&
    canonical.active
  ) {
    const updatedAt =
      Number(
        canonical.updatedAt ||
        0
      );

    if (
      !updatedAt ||
      Date.now() -
        updatedAt <=
        BOOKING_STATE_TTL
    ) {
      return assistantBooking.normalize(
        canonical
      );
    }
  }

  const stored =
    readStorageJson(
      BOOKING_STATE_STORAGE_KEY,
      null
    );

  if (
    stored &&
    typeof stored ===
      "object"
  ) {
    const updatedAt =
      Number(
        stored.updatedAt ||
        0
      );

    if (
      !updatedAt ||
      Date.now() -
        updatedAt <=
        BOOKING_STATE_TTL
    ) {
      return assistantBooking.normalize(
        stored
      );
    }
  }

  return assistantBooking.createEmpty();
}

function saveBookingState(
  state
) {
  const normalized =
    assistantBooking.normalize(
      state
    );

  if (
    typeof assistantBooking.saveBookingState ===
    "function"
  ) {
    return assistantBooking.saveBookingState(
      normalized
    );
  }

  writeStorageJson(
    BOOKING_STATE_STORAGE_KEY,
    normalized
  );

  return normalized;
}

function clearBookingState() {
  if (
    typeof assistantBooking.clearBookingDraft ===
    "function"
  ) {
    assistantBooking.clearBookingDraft();
  }

  removeStorage(
    BOOKING_STATE_STORAGE_KEY
  );
}

function getEffectiveBookingState(
  explicitState
) {
  if (
    explicitState !==
    undefined
  ) {
    return assistantBooking.normalize(
      explicitState
    );
  }

  return loadBookingState();
}

function getBookingText(
  language,
  key,
  data = {}
) {
  const {
    crop =
      null,

    quantity =
      null,

    center =
      null,

    date =
      null,

    slot =
      null,
  } = data;

  const cropNames = {
    en: {
      wheat:
        "wheat",

      paddy:
        "paddy",

      maize:
        "maize",

      cotton:
        "cotton",
    },

    hi: {
      wheat:
        "गेहूं",

      paddy:
        "धान",

      maize:
        "मक्का",

      cotton:
        "कपास",
    },

    te: {
      wheat:
        "గోధుమ",

      paddy:
        "వరి",

      maize:
        "మొక్కజొన్న",

      cotton:
        "పత్తి",
    },
  };

  const displayCrop =
    crop
      ? (
          cropNames[
            language
          ]?.[
            crop
          ] ||
          crop
        )
      : null;

  if (
    key ===
    "detailsUpdated"
  ) {
    if (
      language ===
      "hi"
    ) {
      if (
        displayCrop &&
        quantity
      ) {
        return `मैंने ${displayCrop} की ${quantity} kg मात्रा रख ली है। अभी तारीख और आने का समय चुनना बाकी है।`;
      }

      if (
        displayCrop
      ) {
        return `मैंने ${displayCrop} चुन लिया है। अब अनुमानित मात्रा बताएं।`;
      }

      if (
        quantity
      ) {
        return `मैंने ${quantity} kg मात्रा रख ली है। अब फसल बताएं।`;
      }

      return "बुकिंग की जानकारी अपडेट हो गई है.";
    }

    if (
      language ===
      "te"
    ) {
      if (
        displayCrop &&
        quantity
      ) {
        return `${displayCrop} ${quantity} kg వివరాలను నమోదు చేశాను. ఇంకా తేదీ మరియు రాక సమయం ఎంచుకోవాలి.`;
      }

      if (
        displayCrop
      ) {
        return `${displayCrop} ఎంపిక చేశాను. ఇప్పుడు అంచనా పరిమాణం చెప్పండి.`;
      }

      if (
        quantity
      ) {
        return `${quantity} kg పరిమాణాన్ని నమోదు చేశాను. ఇప్పుడు పంటను చెప్పండి.`;
      }

      return "బుకింగ్ వివరాలు నవీకరించబడ్డాయి.";
    }

    if (
      displayCrop &&
      quantity
    ) {
      return `I have saved ${quantity} kg of ${displayCrop}. We still need your date and arrival time.`;
    }

    if (
      displayCrop
    ) {
      return `I have selected ${displayCrop}. Now tell me the estimated quantity.`;
    }

    if (
      quantity
    ) {
      return `I have saved ${quantity} kg. Now tell me which crop you are bringing.`;
    }

    return "Your booking details have been updated.";
  }

  if (
    key ===
    "dateSelected"
  ) {
    if (
      language ===
      "hi"
    ) {
      return `ठीक है। ${date || "यह तारीख"} चुन ली गई है। अब मैं इस तारीख के उपलब्ध आने के समय देख सकता हूँ।`;
    }

    if (
      language ===
      "te"
    ) {
      return `సరే. ${date || "ఈ తేదీ"} ఎంచుకున్నాను. ఇప్పుడు ఈ తేదీకి అందుబాటులో ఉన్న రాక సమయాలను చూడవచ్చు.`;
    }

    return `Okay. ${date || "That date"} is selected. I can now check the available arrival times for this date.`;
  }

  if (
    key ===
    "slotSelected"
  ) {
    if (
      language ===
      "hi"
    ) {
      return `समय ${slot || "चुन लिया गया"}। अब बुकिंग की सारी जानकारी तैयार है। क्या मैं पुष्टि कर दूँ?`;
    }

    if (
      language ===
      "te"
    ) {
      return `సమయం ${slot || "ఎంచుకున్నాము"}. ఇప్పుడు బుకింగ్ వివరాలన్నీ సిద్ధంగా ఉన్నాయి. నిర్ధారించనా?`;
    }

    return `The ${slot || "arrival time"} is selected. Your booking details are complete. Shall I confirm it?`;
  }

  if (
    key ===
    "needDate"
  ) {
    return assistantBooking.nextPrompt(
      {
        ...assistantBooking.normalize(
          data.state
        ),
      },
      language
    );
  }

  if (
    key ===
    "needSlot"
  ) {
    if (
      language ===
      "hi"
    ) {
      return "तारीख चुन ली गई है। अब पूछें “उपलब्ध समय बताओ” या कोई उपलब्ध समय चुनें।";
    }

    if (
      language ===
      "te"
    ) {
      return "తేదీ ఎంచుకున్నారు. ఇప్పుడు “అందుబాటులో ఉన్న సమయాలు చెప్పు” అని అడగండి లేదా ఒక సమయాన్ని ఎంచుకోండి.";
    }

    return "Your date is selected. Ask me for the available times, or choose an available time.";
  }

  if (
    key ===
    "state"
  ) {
    const summary =
      assistantBooking.getStateSummary(
        data.state,
        language
      );

    if (
      language ===
      "hi"
    ) {
      return `अभी आपकी बुकिंग में: ${summary}`;
    }

    if (
      language ===
      "te"
    ) {
      return `ప్రస్తుతం మీ బుకింగ్‌లో: ${summary}`;
    }

    return `Here is what I currently have for your booking: ${summary}`;
  }

  if (
    key ===
    "dates"
  ) {
    if (
      language ===
      "hi"
    ) {
      return data.dateText
        ? `उपलब्ध तारीखें हैं: ${data.dateText}। इनमें से कोई तारीख चुन सकते हैं।`
        : "अभी उपलब्ध तारीखें नहीं मिलीं।";
    }

    if (
      language ===
      "te"
    ) {
      return data.dateText
        ? `అందుబాటులో ఉన్న తేదీలు: ${data.dateText}. వీటిలో ఒక తేదీ ఎంచుకోండి.`
        : "ప్రస్తుతం అందుబాటులో ఉన్న తేదీలు లేవు.";
    }

    return data.dateText
      ? `The available dates are: ${data.dateText}. You can choose one of these dates.`
      : "I couldn't find any available dates right now.";
  }

  if (
    key ===
    "slots"
  ) {
    if (
      language ===
      "hi"
    ) {
      return data.slotText
        ? `उपलब्ध समय हैं: ${data.slotText}। इनमें से कोई एक चुनें।`
        : "इस तारीख के लिए कोई उपलब्ध समय नहीं मिला।";
    }

    if (
      language ===
      "te"
    ) {
      return data.slotText
        ? `అందుబాటులో ఉన్న సమయాలు: ${data.slotText}. వీటిలో ఒకదాన్ని ఎంచుకోండి.`
        : "ఈ తేదీకి అందుబాటులో ఉన్న సమయాలు లేవు.";
    }

    return data.slotText
      ? `The available arrival times are: ${data.slotText}. Choose one of them.`
      : "There are no available arrival times for this date.";
  }

  if (
    key ===
    "ready"
  ) {
    if (
      language ===
      "hi"
    ) {
      return "आपकी बुकिंग की सारी जानकारी तैयार है। अंतिम पुष्टि करने से पहले मैं आपको सभी विवरण दिखाऊँगा।";
    }

    if (
      language ===
      "te"
    ) {
      return "మీ బుకింగ్ వివరాలన్నీ సిద్ధంగా ఉన్నాయి. చివరి నిర్ధారణకు ముందు పూర్తి వివరాలను చూపిస్తాను.";
    }

    return "All booking details are ready. I’ll show you the complete booking details before the final confirmation.";
  }

  if (
    key ===
    "confirmed"
  ) {
    if (
      language ===
      "hi"
    ) {
      return "बुकिंग की पुष्टि हो गई।";
    }

    if (
      language ===
      "te"
    ) {
      return "బుకింగ్ నిర్ధారించబడింది.";
    }

    return "Booking confirmed.";
  }

  return "";
}

function controllerTimeToMinutes(
  value
) {
  const text =
    String(
      value || ""
    )
      .trim()
      .toUpperCase();

  const match =
    text.match(
      /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/
    );

  if (!match) {
    return null;
  }

  let hours =
    Number(match[1]);

  const minutes =
    Number(match[2]);

  const period =
    match[3];

  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    minutes > 59
  ) {
    return null;
  }

  if (
    period === "AM" &&
    hours === 12
  ) {
    hours = 0;
  }

  if (
    period === "PM" &&
    hours !== 12
  ) {
    hours += 12;
  }

  if (
    hours > 23
  ) {
    return null;
  }

  return (
    hours * 60 +
    minutes
  );
}

function controllerMinutesToTime(
  total
) {
  const hours =
    Math.floor(
      total / 60
    );

  const minutes =
    total % 60;

  return (
    `${String(hours).padStart(
      2,
      "0"
    )}:` +
    `${String(minutes).padStart(
      2,
      "0"
    )}`
  );
}

function controllerFormatTime(
  value
) {
  const total =
    controllerTimeToMinutes(
      value
    );

  if (
    total == null
  ) {
    return String(
      value || ""
    );
  }

  const hours =
    Math.floor(
      total / 60
    );

  const minutes =
    total % 60;

  const displayHour =
    hours % 12 ||
    12;

  const suffix =
    hours >= 12
      ? "PM"
      : "AM";

  return (
    `${displayHour}:` +
    `${String(
      minutes
    ).padStart(
      2,
      "0"
    )} ${suffix}`
  );
}

function controllerGenerateSlots(
  center,
  settings
) {
  const opening =
    center?.opening_time ||
    center?.openingTime ||
    "09:00";

  const closing =
    center?.closing_time ||
    center?.closingTime ||
    "17:00";

  const duration =
    Math.max(
      5,
      Number(
        settings?.slotDuration ||
        30
      )
    );

  const capacity =
    Math.max(
      1,
      Number(
        center?.capacity ??
        center?.capacityPerSlot ??
        center?.capacity_per_slot ??
        settings?.defaultCapacity ??
        20
      ) || 20
    );

  let cursor =
    controllerTimeToMinutes(
      opening
    );

  const end =
    controllerTimeToMinutes(
      closing
    );

  if (
    cursor == null ||
    end == null ||
    end <= cursor
  ) {
    return [];
  }

  const slots = [];

  while (
    cursor + duration <=
    end
  ) {
    const start =
      controllerMinutesToTime(
        cursor
      );

    const finish =
      controllerMinutesToTime(
        cursor +
        duration
      );

    slots.push({
      id:
        start.replace(
          ":",
          "-"
        ),

      start,

      end:
        finish,

      display:
        `${controllerFormatTime(
          start
        )} – ${controllerFormatTime(
          finish
        )}`,

      capacity,
    });

    cursor +=
      duration;
  }

  return slots;
}

function controllerIsPastSlot(
  slot,
  date
) {
  const today =
    new Date();

  const todayIso =
    [
      today.getFullYear(),
      String(
        today.getMonth() +
        1
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

  if (
    String(date) !==
    todayIso
  ) {
    return false;
  }

  const end =
    controllerTimeToMinutes(
      slot?.end
    );

  if (
    end == null
  ) {
    return false;
  }

  return (
    end <=
    today.getHours() *
      60 +
      today.getMinutes()
  );
}

function controllerGenerateDates(
  days,
  now = new Date()
) {
  const safeDays =
    Math.max(
      0,
      Number(days) ||
      7
    );

  const base =
    new Date(now);

  base.setHours(
    0,
    0,
    0,
    0
  );

  const result = [];

  for (
    let index = 0;
    index <= safeDays;
    index += 1
  ) {
    const date =
      new Date(base);

    date.setDate(
      base.getDate() +
      index
    );

    const iso =
      [
        date.getFullYear(),
        String(
          date.getMonth() +
          1
        ).padStart(
          2,
          "0"
        ),
        String(
          date.getDate()
        ).padStart(
          2,
          "0"
        ),
      ].join("-");

    result.push({
      id:
        `${String(
          date.getDate()
        ).padStart(
          2,
          "0"
        )}-${date.toLocaleString(
          "en-US",
          {
            month:
              "short",
          }
        ).toLowerCase()}`,

      date:
        iso,

      day:
        String(
          date.getDate()
        ).padStart(
          2,
          "0"
        ),

      month:
        date.toLocaleString(
          "en-US",
          {
            month:
              "short",
          }
        ).toUpperCase(),

      label:
        index === 0
          ? "Today"
          : index === 1
            ? "Tomorrow"
            : date.toLocaleString(
                "en-US",
                {
                  weekday:
                    "long",
                }
              ),
    });
  }

  return result;
}

function controllerBookedCount(rows, centerId, date, start, end) {

  if (!Array.isArray(rows)) return 0;

  const ignoredStatuses = new Set([
    "CANCELLED",
    "CANCELED",
    "REJECTED",
    "EXPIRED",
  ]);

  return rows.filter(row => {
    const status = String(row?.status ?? "").toUpperCase();

    return (
      String(row?.center_id ?? row?.centerId ?? "") === String(centerId) &&
      String(row?.date ?? "") === String(date) &&
      String(row?.slot_start ?? row?.slotStart ?? "") === String(start) &&
      String(row?.slot_end ?? row?.slotEnd ?? "") === String(end) &&
      !ignoredStatuses.has(status)
    );
  }).length;
}

async function controllerGetJson(
  path
) {
  const response =
    await fetch(
      `${BOOKING_API_URL}${path}`
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
      `Request failed: ${path}`
    );
  }

  return (
    data ||
    {}
  );
}

function sameBookingAvailabilityScope(
  context,
  state
) {
  if (
    !context ||
    typeof context !==
      "object"
  ) {
    return false;
  }

  const age =
    Date.now() -
    Number(
      context.updatedAt ||
      0
    );

  if (
    age < 0 ||
    age >
      BOOKING_AVAILABILITY_CACHE_TTL
  ) {
    return false;
  }

  if (
    !Array.isArray(
      context.availableCenters
    ) ||
    !context.availableCenters.length
  ) {
    return false;
  }

  if (
    state?.date &&
    String(
      context.selectedDate ||
      ""
    ) !==
      String(
        state.date
      )
  ) {
    return false;
  }

  if (
    state?.centerId &&
    String(
      context.selectedCenterId ||
      ""
    ) !==
      String(
        state.centerId
      )
  ) {
    return false;
  }

  return true;
}

async function refreshLiveBookingAvailability(
  state,
  {
    force = false,
  } = {}
) {
  let pageContext =
    typeof assistantBooking.getBookingAvailabilityContext ===
      "function"
      ? assistantBooking.getBookingAvailabilityContext()
      : null;

  if (
    typeof assistantBooking.requestBookingAvailabilitySync ===
    "function"
  ) {
    try {
      pageContext =
        assistantBooking.requestBookingAvailabilitySync() ||
        pageContext;
    } catch {}
  }

  if (
    !force &&
    sameBookingAvailabilityScope(
      pageContext,
      state
    )
  ) {
    return pageContext;
  }

  try {
    const [
      centersData,
      settingsData,
      bookingsData,
    ] =
      await Promise.all([
        controllerGetJson(
          "/centers"
        ),

        controllerGetJson(
          "/settings"
        ),

        controllerGetJson(
          "/bookings"
        ),
      ]);

    const settings =
      settingsData?.settings ||
      {};

    const centers =
      Array.isArray(
        centersData?.centers
      )
        ? centersData.centers.filter(
            center =>
              Number(
                center?.active ??
                1
              ) === 1
          )
        : [];

    const bookings =
      Array.isArray(
        bookingsData?.bookings
      )
        ? bookingsData.bookings
        : [];

    const dates =
      controllerGenerateDates(
        Number(
          settings?.advanceBookingDays ??
          7
        )
      );

    const liveAvailableDates =
      dates.filter(
        day =>
          centers.some(
            center => {
              const slots =
                controllerGenerateSlots(
                  center,
                  settings
                );

              const capacity =
                Math.max(
                  1,
                  Number(
                    center?.capacity ??
                    center?.capacityPerSlot ??
                    center?.capacity_per_slot ??
                    settings?.defaultCapacity ??
                    20
                  ) || 20
                );

              return slots.some(
                slot => {
                  if (
                    controllerIsPastSlot(
                      slot,
                      day.date
                    )
                  ) {
                    return false;
                  }

                  return (
                    controllerBookedCount(
                      bookings,
                      center?.id,
                      day.date,
                      slot.start,
                      slot.end
                    ) <
                    capacity
                  );
                }
              );
            }
          )
      );

    const preferredCenterId =
      state?.centerId ||
      pageContext?.selectedCenterId ||
      centers[0]?.id ||
      null;

    const selectedCenter =
      centers.find(
        center =>
          String(
            center?.id
          ) ===
          String(
            preferredCenterId
          )
      ) ||
      centers[0] ||
      null;

    const selectedDate =
      state?.date ||
      pageContext?.selectedDate ||
      null;

    const availableSlots =
      selectedCenter &&
      selectedDate
        ? controllerGenerateSlots(
            selectedCenter,
            settings
          )
            .filter(
              slot =>
                !controllerIsPastSlot(
                  slot,
                  selectedDate
                )
            )
            .map(
              slot => {
                const capacity =
                  Math.max(
                    1,
                    Number(
                      selectedCenter?.capacity ??
                      selectedCenter?.capacityPerSlot ??
                      selectedCenter?.capacity_per_slot ??
                      settings?.defaultCapacity ??
                      20
                    ) || 20
                  );

                const booked =
                  Math.min(
                    controllerBookedCount(
                      bookings,
                      selectedCenter?.id,
                      selectedDate,
                      slot.start,
                      slot.end
                    ),
                    capacity
                  );

                const remaining =
                  Math.max(
                    capacity -
                    booked,
                    0
                  );

                return {
                  ...slot,

                  capacity,

                  booked,

                  remaining,

                  loadClass:
                    remaining === 0
                      ? "full"
                      : remaining <=
                          Math.ceil(
                            capacity *
                            0.25
                          )
                        ? "busy"
                        : remaining <=
                            Math.ceil(
                              capacity *
                              0.5
                            )
                          ? "limited"
                          : "normal",
                };
              }
            )
            .filter(
              slot =>
                slot.remaining >
                0
            )
        : [];

    const context = {
      availableDates:
        liveAvailableDates,

      availableSlots,

      availableCenters:
        centers.map(
          center => ({
            id:
              center?.id,

            name:
              center?.name,

            openingTime:
              center?.opening_time ||
              center?.openingTime ||
              "09:00",

            closingTime:
              center?.closing_time ||
              center?.closingTime ||
              "17:00",

            capacity:
              center?.capacity ??
              center?.capacityPerSlot ??
              center?.capacity_per_slot ??
              settings?.defaultCapacity ??
              20,
          })
        ),

      selectedDate,

      selectedCenterId:
        selectedCenter?.id ||
        null,
    };

    if (
      typeof assistantBooking.saveBookingAvailabilityContext ===
      "function"
    ) {
      assistantBooking.saveBookingAvailabilityContext(
        context
      );
    }

    return context;

  } catch (
    error
  ) {
    debugLog(
      "Live booking availability refresh failed",
      error
    );

    return (
      pageContext ||
      {
        availableDates: [],
        availableSlots: [],
        availableCenters: [],
        selectedDate: null,
        selectedCenterId: null,
      }
    );
  }
}

function processBookingConversation(
  text,
  options
) {
  const {
    language,
    bookingState:
      explicitBookingState,
    bookingContext,
  } =
    options;

  const bookingState =
    getEffectiveBookingState(
      explicitBookingState
    );

  const availableDates =
    Array.isArray(
      bookingContext?.availableDates
    )
      ? bookingContext.availableDates
      : undefined;

  const availableSlots =
    Array.isArray(
      bookingContext?.availableSlots
    )
      ? bookingContext.availableSlots
      : undefined;

  const availableCenters =
    Array.isArray(
      bookingContext?.availableCenters
    )
      ? bookingContext.availableCenters
      : undefined;

  const result =
    assistantBooking.process(
      bookingState,
      text,
      {
        language,

        availableDates,

        availableSlots,

        availableCenters,
      }
    );

  if (
    result?.state
  ) {
    saveBookingState(
      result.state
    );
  }

  return result;
}

function buildBookingControllerResult(
  bookingResult,
  originalText,
  language
) {
  const intent =
    bookingResult?.intent;

  const state =
    bookingResult?.state ||
    assistantBooking.createEmpty();

  if (
    intent ===
      BOOKING_INTENTS.START ||
    intent ===
      BOOKING_INTENTS.UPDATE
  ) {
    const missing =
      bookingResult.missing ||
      assistantBooking.getMissingDetails(
        state
      );

    let reply =
      "";

    if (
      missing.includes(
        "crop"
      )
    ) {
      reply =
        assistantBooking.nextPrompt(
          state,
          language
        );
    } else if (
      missing.includes(
        "quantity"
      )
    ) {
      reply =
        assistantBooking.nextPrompt(
          state,
          language
        );
    } else if (
      missing.includes(
        "date"
      )
    ) {
      reply =
        getBookingText(
          language,
          "needDate",
          {
            state,
          }
        );
    } else if (
      missing.includes(
        "slot"
      )
    ) {
      reply =
        getBookingText(
          language,
          "needSlot",
          {
            state,
          }
        );
    } else {
      reply =
        getBookingText(
          language,
          "ready"
        );
    }

    return controllerResult(
      CONTROLLER_TYPES.BOOKING,
      CONTROLLER_STATUS.SUCCESS,
      {
        decision:
          null,

        bookingIntent:
          intent,

        action:
          "OPEN_BOOKING",

        reply,

        userText:
          originalText,

        bookingState:
          state,

        bookingStep:
          bookingResult.nextStep,

        missing:
          missing,

        shouldCallAI:
          false,

        shouldNavigate:
          false,

        shouldUpdateBookingForm:
          true,

        bookingCommand:
          true,
      }
    );
  }

  if (
    intent ===
    BOOKING_INTENTS.SHOW_STATE
  ) {
    return controllerResult(
      CONTROLLER_TYPES.BOOKING,
      CONTROLLER_STATUS.SUCCESS,
      {
        bookingIntent:
          intent,

        action:
          "OPEN_BOOKING",

        reply:
          getBookingText(
            language,
            "state",
            {
              state,
            }
          ),

        bookingState:
          state,

        bookingStep:
          bookingResult.nextStep,

        shouldCallAI:
          false,

        shouldNavigate:
          false,

        bookingCommand:
          true,
      }
    );
  }

  if (
    intent ===
    BOOKING_INTENTS.SHOW_CENTERS
  ) {
    return controllerResult(
      CONTROLLER_TYPES.BOOKING,
      CONTROLLER_STATUS.SUCCESS,
      {
        bookingIntent:
          intent,

        action:
          "OPEN_BOOKING",

        reply:
          language === "hi"
            ? `उपलब्ध खरीद केंद्र: ${assistantBooking.formatCenterOptions(
                bookingResult.centers ||
                [],
                language
              )}।${
                bookingResult.dateText
                  ? ` उपलब्ध तारीखें: ${bookingResult.dateText}।`
                  : ""
              }`

            : language === "te"
              ? `అందుబాటులో ఉన్న కొనుగోలు కేంద్రాలు: ${assistantBooking.formatCenterOptions(
                  bookingResult.centers ||
                  [],
                  language
                )}.${
                  bookingResult.dateText
                    ? ` అందుబాటులో ఉన్న తేదీలు: ${bookingResult.dateText}.`
                    : ""
                }`

              : `Available procurement centers and timings: ${assistantBooking.formatCenterOptions(
                  bookingResult.centers ||
                  [],
                  language
                )}.${
                  bookingResult.dateText
                    ? ` Available dates: ${bookingResult.dateText}.`
                    : ""
                }`,

        bookingState:
          state,

        centers:
          bookingResult.centers ||
          [],

        dates:
          bookingResult.dates ||
          [],

        bookingStep:
          bookingResult.nextStep ||
          assistantBooking.getBookingStep(
            state
          ),

        shouldCallAI:
          false,

        shouldNavigate:
          false,

        bookingCommand:
          true,
      }
    );
  }

  if (
    intent ===
    BOOKING_INTENTS.ASK_DATES
  ) {
    return controllerResult(
      CONTROLLER_TYPES.BOOKING,
      CONTROLLER_STATUS.SUCCESS,
      {
        bookingIntent:
          intent,

        action:
          "OPEN_BOOKING",

        reply:
          getBookingText(
            language,
            "dates",
            bookingResult
          ),

        bookingState:
          state,

        dates:
          bookingResult.dates ||
          [],

        shouldCallAI:
          false,

        shouldNavigate:
          false,

        bookingCommand:
          true,
      }
    );
  }

  if (
    intent ===
    BOOKING_INTENTS.SELECT_DATE
  ) {
    return controllerResult(
      CONTROLLER_TYPES.BOOKING,
      CONTROLLER_STATUS.SUCCESS,
      {
        bookingIntent:
          intent,

        action:
          "OPEN_BOOKING",

        reply:
          getBookingText(
            language,
            "dateSelected",
            {
              date:
                bookingResult.selectedDate
                  ?.label ||
                bookingResult.selectedDate
                  ?.date ||
                state.date,
            }
          ),

        bookingState:
          state,

        selectedDate:
          bookingResult.selectedDate,

        bookingStep:
          BOOKING_STEPS.SLOT,

        shouldCallAI:
          false,

        shouldNavigate:
          false,

        shouldUpdateBookingForm:
          true,

        bookingCommand:
          true,
      }
    );
  }

  if (
    intent ===
    BOOKING_INTENTS.ASK_SLOTS
  ) {
    return controllerResult(
      CONTROLLER_TYPES.BOOKING,
      CONTROLLER_STATUS.SUCCESS,
      {
        bookingIntent:
          intent,

        action:
          "OPEN_BOOKING",

        reply:
          getBookingText(
            language,
            "slots",
            bookingResult
          ),

        bookingState:
          state,

        slots:
          bookingResult.slots ||
          [],

        bookingStep:
          BOOKING_STEPS.SLOT,

        shouldCallAI:
          false,

        shouldNavigate:
          false,

        bookingCommand:
          true,
      }
    );
  }

  if (
    intent ===
    BOOKING_INTENTS.SELECT_SLOT
  ) {
    const review =
      bookingResult.review ||
      assistantBooking.review(
        state,
        language
      );

    return controllerResult(
      CONTROLLER_TYPES.CONFIRMATION,
      CONTROLLER_STATUS.PENDING,
      {
        bookingIntent:
          intent,

        action:
          "OPEN_BOOKING",

        reply:
          `${getBookingText(
            language,
            "slotSelected",
            {
              slot:
                bookingResult.selectedSlot
                  ?.display ||
                state.slotDisplay,
            }
          )} ${assistantBooking.formatBookingProgress(
            state,
            language
          )}${
            language === "hi"
              ? "\nअंतिम पुष्टि के लिए ‘हाँ’ कहें।"
              : language === "te"
                ? "\nతుది నిర్ధారణ కోసం ‘అవును’ అని చెప్పండి."
                : "\nSay ‘yes’ to submit the booking."
          }`,

        bookingState:
          state,

        review,

        bookingStep:
          BOOKING_STEPS.REVIEW,

        shouldCallAI:
          false,

        shouldNavigate:
          false,

        shouldUpdateBookingForm:
          true,

        bookingCommand:
          true,

        awaitingConfirmation:
          true,

        pendingAction:
          {
            action:
              "OPEN_BOOKING",

            params:
              sanitizeActionParams({
                crop:
                  state.crop,

                quantity:
                  state.quantity,
              }),

            booking:
              state,

            createdAt:
              Date.now(),
          },

        createPending:
          true,
      }
    );
  }

  if (
    intent ===
    BOOKING_INTENTS.CONFIRM
  ) {
    return controllerResult(
      CONTROLLER_TYPES.CONFIRMATION,
      CONTROLLER_STATUS.SUCCESS,
      {
        bookingIntent:
          intent,

        action:
          "OPEN_BOOKING",

        reply:
          language === "hi"
            ? "ठीक है। मैं आपकी चुनी हुई बुकिंग अभी सबमिट कर रहा हूँ।"
            : language === "te"
              ? "సరే. మీరు ఎంచుకున్న బుకింగ్‌ను ఇప్పుడు సమర్పిస్తున్నాను."
              : "Okay. I’m submitting the booking with your selected details now.",

        bookingState:
          state,

        booking:
          state,

        params:
          sanitizeActionParams({
            crop:
              state.crop,

            quantity:
              state.quantity,
          }),

        shouldCallAI:
          false,

        shouldNavigate:
          false,

        shouldExecuteBooking:
          true,

        bookingCommand:
          true,
      }
    );
  }

  if (
    intent ===
    BOOKING_INTENTS.REVIEW
  ) {
    const review =
      bookingResult.review;

    return controllerResult(
      CONTROLLER_TYPES.BOOKING,
      CONTROLLER_STATUS.SUCCESS,
      {
        bookingIntent:
          intent,

        action:
          "OPEN_BOOKING",

        reply:
          review?.valid
            ? getBookingText(
                language,
                "ready"
              )
            : assistantBooking.nextPrompt(
                state,
                language
              ),

        bookingState:
          state,

        review,

        shouldCallAI:
          false,

        shouldNavigate:
          false,

        bookingCommand:
          true,
      }
    );
  }

  if (
    intent ===
    BOOKING_INTENTS.CANCEL
  ) {
    clearBookingState();

    return controllerResult(
      CONTROLLER_TYPES.CANCELLATION,
      CONTROLLER_STATUS.CANCELLED,
      {
        bookingIntent:
          intent,

        action:
          "NONE",

        reply:
          language === "hi"
            ? "ठीक है, मैंने आपकी बुकिंग प्रक्रिया रद्द कर दी।"
            : language === "te"
              ? "సరే, బుకింగ్ ప్రక్రియను రద్దు చేశాను."
              : "Okay, I cancelled the booking process.",

        shouldCallAI:
          false,

        shouldNavigate:
          false,

        bookingCommand:
          true,
      }
    );
  }

  return null;
}

export function routeLocalCommand(
  message,
  options = {}
) {
  const normalized =
    normalizeOptions({
      ...options,
      message,
    });

  const pending =
    normalized.pendingAction !==
      undefined
      ? normalized.pendingAction
      : loadPendingAction();

  const bookingState =
    getEffectiveBookingState(
      normalized.bookingState
    );

  if (
    bookingState.active ||
    assistantBooking.extractCrop(
      normalized.message
    ) ||
    assistantBooking.extractQuantity(
      normalized.message
    )
  ) {
    const bookingResult =
      processBookingConversation(
        normalized.message,
        normalized
      );

    if (
      bookingResult?.handled &&
      bookingResult.intent !==
        BOOKING_INTENTS.NONE
    ) {
      return {
        decision:
          buildBookingControllerResult(
            bookingResult,
            normalized.message,
            normalized.language
          ),

        pending,

        booking:
          bookingResult.state,
      };
    }
  }

  const decision =
    routeAssistantCommand(
      normalized.message,
      {
        currentPath:
          normalized.currentPath,

        language:
          normalized.language,

        pendingAction:
          pending,
      }
    );

  return {
    decision,

    pending,

    booking:
      bookingState,
  };
}

export function createControllerContext(
  options = {}
) {
  const normalized =
    normalizeOptions(
      options
    );

  const pending =
    normalized.pendingAction !==
      undefined
      ? normalized.pendingAction
      : loadPendingAction();

  const bookingState =
    getEffectiveBookingState(
      normalized.bookingState
    );

  const context =
    buildAssistantContext({
      pathname:
        normalized.currentPath,

      language:
        normalized.language,

      history:
        normalized.history,

      message:
        normalized.message,

      pendingAction:
        pending,
    });

  return {
    context,

    serverContext:
      buildServerAssistantContext({
        pathname:
          normalized.currentPath,

        language:
          normalized.language,

        history:
          normalized.history,

        message:
          normalized.message,

        pendingAction:
          pending,
      }),

    pending,

    bookingState,
  };
}

export function createBackendRequest(
  options = {}
) {
  const normalized =
    normalizeOptions(
      options
    );

  const farmer =
    getStoredFarmer();

  const {
    serverContext,
  } =
    createControllerContext(
      normalized
    );

  return {
    text:
      normalized.message,

    language:
      normalized.language,

    currentPath:
      normalized.currentPath,

    currentPage:
      serverContext.currentPage,

    farmerId:
      farmer.farmerId,

    phone:
      farmer.phone,

    history:
      normalized.history,

    context:
      {
        ...serverContext,

        booking:
          {
            state:
              normalized.bookingState ||
              loadBookingState(),
          },

        bookingConversation:
          true,
      },
  };
}

export async function requestAI(
  options = {}
) {
  const request =
    createBackendRequest(
      options
    );

  debugLog(
    "Controller → AI request",
    request
  );

  const response =
    await assistantService.ask(
      request
    );

  debugLog(
    "AI → Controller response",
    response
  );

  return response;
}

export function processBackendDecision(
  localDecision,
  backendResponse,
  options = {}
) {
  const normalized =
    normalizeOptions(
      options
    );

  const merged =
    mergeBackendDecision(
      localDecision,
      backendResponse,
      {
        language:
          normalized.language,

        originalText:
          normalized.message,
      }
    );

  return {
    decision:
      merged,
  };
}

async function executeLocalDecision(
  decision,
  options
) {
  if (!decision) {
    return null;
  }

  const {
    navigate =
      null,

    currentPath =
      DEFAULT_PATH,

    language =
      DEFAULT_LANGUAGE,
  } = options;

  if (
    decision.type ===
      CONTROLLER_TYPES.BOOKING ||
    decision.bookingCommand
  ) {
    if (
      decision.shouldExecuteBooking &&
      decision.bookingState
    ) {
      const state =
        assistantBooking.normalize(
          decision.bookingState
        );

      if (
        isBookingPath(
          currentPath
        )
      ) {
        dispatchBookingEvent(
          "krishisetu:assistant-confirm-booking",
          state
        );

        return {
          ...decision,

          confirmationDispatched:
            true,

          shouldNavigate:
            false,
        };
      }

      const navigation =
        navigateBookingPage(
          state,
          options,
          true
        );

      return {
        ...decision,
        ...navigation,
      };
    }

    return decision;
  }

  if (
    decision.type ===
    "CURRENT_PAGE"
  ) {
    return controllerResult(
      CONTROLLER_TYPES.CURRENT_PAGE,
      CONTROLLER_STATUS.SUCCESS,
      {
        decision,

        reply:
          decision.reply ||
          "",

        action:
          "SHOW_CURRENT_PAGE",

        shouldNavigate:
          false,

        shouldCallAI:
          false,

        execution:
          null,
      }
    );
  }

  if (
    decision.type ===
    "CANCEL"
  ) {
    clearPendingAction();

    clearBookingState();

    return controllerResult(
      CONTROLLER_TYPES.CANCELLATION,
      CONTROLLER_STATUS.CANCELLED,
      {
        decision,

        reply:
          decision.reply ||
          "",

        action:
          "NONE",

        shouldNavigate:
          false,

        shouldCallAI:
          false,

        execution:
          null,
      }
    );
  }

  if (
    decision.type ===
      "CONFIRM" ||
    decision.type ===
      "NAVIGATE" ||
    decision.type ===
      "GO_BACK"
  ) {
    const context =
      buildAssistantContext({
        pathname:
          currentPath,

        language,

        history:
          options.history,

        message:
          options.message,
      });

    const validation =
      validateActionForContext(
        decision.action,
        context
      );

    if (
      !validation.valid
    ) {
      return controllerResult(
        CONTROLLER_TYPES.ERROR,
        CONTROLLER_STATUS.FAILED,
        {
          decision,

          action:
            decision.action,

          reply:
            "This action cannot be performed here.",

          shouldNavigate:
            false,

          shouldCallAI:
            false,

          validation,

          execution:
            null,
        }
      );
    }

    if (
      decision.clearPending
    ) {
      clearPendingAction();
    }

    const execution =
      await assistantExecutor.execute(
        decision.action,
        {
          navigate,

          currentPath,

          params:
            decision.params ||
            decision.pendingAction
              ?.params,

          booking:
            decision.booking ||
            decision.pendingAction
              ?.booking ||
            null,
        }
      );

    const success =
      execution?.success !==
      false;

    return controllerResult(
      decision.type ===
        "GO_BACK"
        ? CONTROLLER_TYPES.NAVIGATION
        : decision.type ===
            "CONFIRM"
          ? CONTROLLER_TYPES.CONFIRMATION
          : CONTROLLER_TYPES.LOCAL,

      success
        ? CONTROLLER_STATUS.SUCCESS
        : CONTROLLER_STATUS.FAILED,

      {
        decision,

        action:
          decision.action,

        reply:
          decision.reply ||
          "",

        shouldNavigate:
          decision.shouldNavigate !==
          false,

        shouldCallAI:
          false,

        execution,
      }
    );
  }

  return null;
}

function isBookingPageRequest(
  text
) {
  return (
    /\b(open|show|go\s+to|take\s+me\s+to)\b.*\bbooking\b.*\b(page|form|screen)\b/i.test(
      text
    ) ||

    /\bbooking\s+(page|form|screen)\b/i.test(
      text
    ) ||

    /\b(procurement|book)\s+(page|form|screen)\b/i.test(
      text
    )
  );
}

function isBookingPath(
  pathname
) {
  return /^\/farmer\/book\/?$/i.test(
    String(
      pathname || ""
    )
  );
}

function navigateBookingPage(
  state,
  options,
  autoConfirm = false
) {
  const routeState = {
    ...assistantBooking.buildBookingRouteState(
      state
    ),

    assistantAutoConfirm:
      Boolean(
        autoConfirm
      ),
  };

  if (
    typeof options.navigate ===
    "function"
  ) {
    options.navigate(
      "/farmer/book",
      {
        state:
          routeState,
      }
    );

    return {
      navigationPerformed:
        true,

      shouldNavigate:
        false,

      navigateTo:
        "/farmer/book",

      routeState,
    };
  }

  return {
    navigationPerformed:
      false,

    shouldNavigate:
      true,

    navigateTo:
      "/farmer/book",

    routeState,
  };
}

function dispatchBookingEvent(
  name,
  state
) {
  if (
    typeof window ===
    "undefined"
  ) {
    return false;
  }

  try {
    window.dispatchEvent(
      new CustomEvent(
        name,
        {
          detail: {
            booking:
              state,

            assistantBooking:
              state,
          },
        }
      )
    );

    return true;
  } catch {
    return false;
  }
}

export async function handleAssistantCommand(
  message,
  options = {}
) {
  const normalized =
    normalizeOptions({
      ...options,
      message,
    });

  if (
    !normalized.message
  ) {
    return controllerResult(
      CONTROLLER_TYPES.NONE,
      CONTROLLER_STATUS.SKIPPED,
      {
        action:
          "NONE",

        reply:
          "",

        shouldCallAI:
          false,

        shouldNavigate:
          false,
      }
    );
  }

  const incomingCrop =
    assistantBooking.extractCrop(
      normalized.message
    );

  const incomingQuantity =
    assistantBooking.extractQuantity(
      normalized.message
    );

  const explicitBookingStart =
    (
      /\b(book|booking|reserve|reservation|procurement|sell)\b|\b(बुक|बुकिंग|बिक्री|బుక్|బుకింగ్|అమ్మ)/i.test(
        normalized.message
      )
    ) &&
    Boolean(
      incomingCrop ||
      incomingQuantity
    );

  if (
    explicitBookingStart
  ) {
    clearPendingAction();

    clearBookingState();
  }

  if (
    isBookingPageRequest(
      normalized.message
    ) &&
    !explicitBookingStart &&
    !getEffectiveBookingState(
      normalized.bookingState
    )?.active
  ) {
    const empty =
      assistantBooking.createEmpty();

    const navigation =
      navigateBookingPage(
        empty,
        normalized,
        false
      );

    return controllerResult(
      CONTROLLER_TYPES.NAVIGATION,
      CONTROLLER_STATUS.SUCCESS,
      {
        action:
          "OPEN_BOOKING",

        reply:
          normalized.language ===
          "hi"
            ? "बुकिंग पेज खोल रहा हूँ।"
            : normalized.language ===
                "te"
              ? "బుకింగ్ పేజీని తెరుస్తున్నాను."
              : "Opening the procurement booking page.",

        bookingState:
          empty,

        booking:
          empty,

        bookingCommand:
          true,

        shouldCallAI:
          false,

        ...navigation,
      }
    );
  }

  let bookingState =
    explicitBookingStart
      ? assistantBooking.createEmpty()
      : getEffectiveBookingState(
          normalized.bookingState
        );

  const bookingLikely =
    bookingState.active ||
    incomingCrop ||
    incomingQuantity ||
    /\b(book|booking|reserve|reservation|procurement|sell)\b/i.test(
      normalized.message
    ) ||
    normalized.message.includes(
      "बुक"
    ) ||
    normalized.message.includes(
      "बुकिंग"
    ) ||
    normalized.message.includes(
      "బుక్"
    ) ||
    normalized.message.includes(
      "బుకింగ్"
    );

  if (
    bookingLikely
  ) {
    const liveBookingContext =
      await refreshLiveBookingAvailability(
        bookingState,
        {
          force:
            explicitBookingStart ||
            /\b(what|which|show|tell|available|center|centers|timings?|slots?)\b/i.test(
              normalized.message
            ),
        }
      );

    normalized.bookingContext =
      {
        ...(normalized.bookingContext ||
          {}),

        ...(liveBookingContext ||
          {}),
      };

    const genericBookingPageRequest =
      bookingState.active &&
      /\b(open|show|go\s+to|take\s+me\s+to)\b.*\b(page|form|screen)\b/i.test(
        normalized.message
      ) &&
      !/\btoken\b/i.test(
        normalized.message
      );

    if (
      isBookingPageRequest(
        normalized.message
      ) ||
      genericBookingPageRequest
    ) {
      const navigation =
        navigateBookingPage(
          bookingState,
          normalized,
          false
        );

      return controllerResult(
        CONTROLLER_TYPES.NAVIGATION,
        CONTROLLER_STATUS.SUCCESS,
        {
          action:
            "OPEN_BOOKING",

          reply:
            normalized.language ===
            "hi"
              ? "बुकिंग पेज खोल रहा हूँ। आपकी चुनी हुई जानकारी वहीं रहेगी।"
              : normalized.language ===
                  "te"
                ? "బుకింగ్ పేజీని తెరుస్తున్నాను. మీరు ఎంచుకున్న వివరాలు అలాగే ఉంటాయి."
                : "Opening the procurement booking page. Your selected details will stay there.",

          bookingState:
            bookingState,

          booking:
            bookingState,

          bookingCommand:
            true,

          shouldCallAI:
            false,

          ...navigation,
        }
      );
    }

    let bookingResult =
  processBookingConversation(
    normalized.message,
    normalized
  );

/*
 * A newly selected date needs a fresh live slot list.
 * FarmerBook updates asynchronously, so the cached slots can
 * still belong to the previous date.
 */
if (
  bookingResult?.handled &&
  bookingResult.intent === BOOKING_INTENTS.SELECT_DATE
) {
  const freshAvailability =
    await refreshLiveBookingAvailability(
      bookingResult.state,
      { force: true }
    );

  bookingResult = {
    ...bookingResult,
    slots: freshAvailability?.availableSlots || [],
  };

  normalized.bookingContext = {
    ...(normalized.bookingContext || {}),
    ...(freshAvailability || {}),
  };
}

    if (
      bookingResult?.handled &&
      bookingResult.intent !==
        BOOKING_INTENTS.NONE
    ) {
      const bookingDecision =
        buildBookingControllerResult(
          bookingResult,
          normalized.message,
          normalized.language
        );

      if (
        bookingDecision.createPending &&
        bookingDecision.pendingAction
      ) {
        savePendingAction(
          bookingDecision.pendingAction
        );
      }

      if (
        bookingResult.intent ===
        BOOKING_INTENTS.CONFIRM
      ) {
        clearPendingAction();

        const state =
          assistantBooking.normalize(
            bookingResult.state
          );

        if (
          isBookingPath(
            normalized.currentPath
          )
        ) {
          dispatchBookingEvent(
            "krishisetu:assistant-confirm-booking",
            state
          );

          return controllerResult(
            CONTROLLER_TYPES.BOOKING,
            CONTROLLER_STATUS.SUCCESS,
            {
              ...bookingDecision,

              action:
                "OPEN_BOOKING",

              reply:
                normalized.language ===
                "hi"
                  ? "ठीक है। मैं आपकी चुनी हुई बुकिंग अभी सबमिट कर रहा हूँ।"
                  : normalized.language ===
                      "te"
                    ? "సరే. మీరు ఎంచుకున్న బుకింగ్‌ను ఇప్పుడు సమర్పిస్తున్నాను."
                    : "Okay. I’m submitting the booking with your selected details now.",

              shouldCallAI:
                false,

              shouldNavigate:
                false,

              shouldExecuteBooking:
                true,

              bookingState:
                state,

              booking:
                state,

              bookingCommand:
                true,

              confirmationDispatched:
                true,
            }
          );
        }

        const navigation =
          navigateBookingPage(
            state,
            normalized,
            true
          );

        return controllerResult(
          CONTROLLER_TYPES.BOOKING,
          CONTROLLER_STATUS.SUCCESS,
          {
            ...bookingDecision,

            action:
              "OPEN_BOOKING",

            reply:
              normalized.language ===
              "hi"
                ? "ठीक है। बुकिंग पेज पर आपकी बुकिंग अभी सबमिट की जा रही है।"
                : normalized.language ===
                    "te"
                  ? "సరే. బుకింగ్ పేజీలో మీ బుకింగ్‌ను ఇప్పుడు సమర్పిస్తున్నాను."
                  : "Okay. I’m opening the booking page and submitting it now.",

            shouldCallAI:
              false,

            shouldExecuteBooking:
              true,

            bookingState:
              state,

            booking:
              state,

            bookingCommand:
              true,

            ...navigation,
          }
        );
      }

      if (
        bookingDecision.status ===
        CONTROLLER_STATUS.PENDING
      ) {
        return bookingDecision;
      }

      const shouldOpenBookingPage =
        (
          bookingResult.intent ===
            BOOKING_INTENTS.START ||
          bookingResult.intent ===
            BOOKING_INTENTS.UPDATE
        ) &&
        bookingDecision.bookingState?.active &&
        !isBookingPath(
          normalized.currentPath
        ) &&
        Boolean(
          normalized.navigate
        );

      if (
        shouldOpenBookingPage
      ) {
        const navigation =
          navigateBookingPage(
            bookingDecision.bookingState,
            normalized,
            false
          );

        return controllerResult(
          CONTROLLER_TYPES.BOOKING,
          CONTROLLER_STATUS.SUCCESS,
          {
            ...bookingDecision,

            reply:
              `${bookingDecision.reply} ${
                normalized.language ===
                "hi"
                  ? "बुकिंग पेज भी खोल दिया है, बातचीत जारी रख सकते हैं।"
                  : normalized.language ===
                      "te"
                    ? "బుకింగ్ పేజీని కూడా తెరిచాను; ఇక్కడే సంభాషణ కొనసాగించవచ్చు."
                    : "I’ve also opened the booking page; you can keep the conversation here."
              }`,

            ...navigation,
          }
        );
      }

      return bookingDecision;
    }
  }

  const local =
    routeLocalCommand(
      normalized.message,
      normalized
    );

  const localDecision =
    local.decision;

  if (
    localDecision?.bookingCommand
  ) {
    return localDecision;
  }

  debugLog(
    "Controller local decision",
    localDecision
  );

  if (
    localDecision?.createPending &&
    localDecision?.pendingAction
  ) {
    savePendingAction(
      localDecision.pendingAction
    );

    return controllerResult(
      CONTROLLER_TYPES.CONFIRMATION,
      CONTROLLER_STATUS.PENDING,
      {
        ...localDecision,

        pendingAction:
          localDecision.pendingAction,

        shouldCallAI:
          false,

        shouldNavigate:
          false,
      }
    );
  }

  if (
    localDecision?.type !==
    "ASK_AI"
  ) {
    return executeLocalDecision(
      localDecision,
      normalized
    );
  }

  let backendResponse;

  try {
    backendResponse =
      await requestAI(
        normalized
      );
  } catch (
    error
  ) {
    debugLog(
      "Controller AI request failed",
      error
    );

    return controllerResult(
      CONTROLLER_TYPES.ERROR,
      CONTROLLER_STATUS.FAILED,
      {
        decision:
          localDecision,

        action:
          "NONE",

        reply:
          null,

        shouldCallAI:
          true,

        shouldNavigate:
          false,

        error,
      }
    );
  }

  const {
    decision:
      finalDecision,
  } =
    processBackendDecision(
      localDecision,
      backendResponse,
      normalized
    );

  if (
    finalDecision?.action &&
    finalDecision.action !==
      "NONE"
  ) {
    const finalContext =
      buildAssistantContext({
        pathname:
          normalized.currentPath,

        language:
          normalized.language,

        history:
          normalized.history,

        message:
          normalized.message,
      });

    const validation =
      validateActionForContext(
        finalDecision.action,
        finalContext
      );

    if (
      !validation.valid
    ) {
      return controllerResult(
        CONTROLLER_TYPES.AI,
        CONTROLLER_STATUS.SUCCESS,
        {
          decision:
            {
              ...finalDecision,

              action:
                "NONE",

              shouldNavigate:
                false,
            },

          action:
            "NONE",

          reply:
            backendResponse?.reply ||
            "",

          shouldCallAI:
            true,

          shouldNavigate:
            false,

          validation,
        }
      );
    }
  }

  if (
    finalDecision?.action ===
      "NONE" ||
    !finalDecision?.shouldNavigate
  ) {
    return controllerResult(
      CONTROLLER_TYPES.AI,
      CONTROLLER_STATUS.SUCCESS,
      {
        decision:
          finalDecision,

        action:
          "NONE",

        reply:
          backendResponse?.reply ||
          "",

        shouldCallAI:
          true,

        shouldNavigate:
          false,

        semanticTopic:
          backendResponse?.semanticTopic ||
          null,

        booking:
          backendResponse?.booking ||
          null,
      }
    );
  }

  const plan =
    getExecutionPlan(
      finalDecision
    );

  const execution =
    await assistantExecutor.execute(
      finalDecision.action,
      {
        navigate:
          normalized.navigate,

        currentPath:
          normalized.currentPath,

        params:
          finalDecision.params ||
          backendResponse?.params ||
          backendResponse?.booking,

        booking:
          backendResponse?.booking,
      }
    );

  const executionSucceeded =
    execution?.success !==
    false;

  return controllerResult(
    executionSucceeded
      ? CONTROLLER_TYPES.NAVIGATION
      : CONTROLLER_TYPES.ERROR,

    executionSucceeded
      ? CONTROLLER_STATUS.SUCCESS
      : CONTROLLER_STATUS.FAILED,

    {
      decision:
        finalDecision,

      action:
        finalDecision.action,

      reply:
        finalDecision.reply ||
        backendResponse?.reply ||
        "",

      shouldCallAI:
        true,

      shouldNavigate:
        true,

      plan,

      execution,
    }
  );
}

export async function askAssistant(
  message,
  options = {}
) {
  return handleAssistantCommand(
    message,
    options
  );
}

export async function executeDecision(
  decision,
  options = {}
) {
  return executeLocalDecision(
    decision,
    normalizeOptions(
      options
    )
  );
}

export async function confirmPendingAction(
  options = {}
) {
  const pending =
    loadPendingAction();

  if (
    !pending
  ) {
    const bookingState =
      loadBookingState();

    if (
      bookingState.readyForConfirmation
    ) {
      return handleAssistantCommand(
        "yes",
        {
          ...options,

          bookingState,
        }
      );
    }

    return controllerResult(
      CONTROLLER_TYPES.NONE,
      CONTROLLER_STATUS.SKIPPED,
      {
        action:
          "NONE",

        reply:
          "",

        reason:
          "No pending action exists.",
      }
    );
  }

  clearPendingAction();

  return executeLocalDecision(
    {
      type:
        "CONFIRM",

      action:
        pending.action,

      confidence:
        0.99,

      reply:
        null,

      userText:
        "yes",

      params:
        pending.params ||
        pending.booking ||
        null,

      booking:
        pending.booking ||
        null,

      pendingAction:
        pending,

      shouldCallAI:
        false,

      shouldNavigate:
        true,

      clearPending:
        true,
    },

    normalizeOptions(
      options
    )
  );
}

export function cancelPendingAction(
  options = {}
) {
  const pending =
    loadPendingAction();

  clearPendingAction();

  clearBookingState();

  const language =
    normalizeLanguageCode(
      options.language
    );

  return controllerResult(
    CONTROLLER_TYPES.CANCELLATION,
    CONTROLLER_STATUS.CANCELLED,
    {
      action:
        "NONE",

      pendingAction:
        pending,

      reply:
        language ===
          "hi"
          ? "ठीक है, मैंने वह कार्रवाई रद्द कर दी।"
          : language ===
              "te"
            ? "సరే, ఆ చర్యను రద్దు చేశాను."
            : "Okay, I cancelled that action.",
    }
  );
}

export function getBookingState() {
  return loadBookingState();
}

export function setBookingState(
  state
) {
  return saveBookingState(
    state
  );
}

export function resetBookingState() {
  clearBookingState();

  return assistantBooking.createEmpty();
}

export function handleBookingMessage(
  message,
  options = {}
) {
  const normalized =
    normalizeOptions({
      ...options,
      message,
    });

  const result =
    processBookingConversation(
      normalized.message,
      normalized
    );

  return buildBookingControllerResult(
    result,
    normalized.message,
    normalized.language
  );
}

export function getBookingFormCommand(
  state =
    loadBookingState()
) {
  const booking =
    assistantBooking.normalize(
      state
    );

  return {
    active:
      booking.active,

    crop:
      booking.crop,

    quantity:
      booking.quantity,

    centerId:
      booking.centerId,

    centerName:
      booking.centerName,

    date:
      booking.date,

    dateLabel:
      booking.dateLabel,

    slotId:
      booking.slotId,

    slotStart:
      booking.slotStart,

    slotEnd:
      booking.slotEnd,

    slotDisplay:
      booking.slotDisplay,

    step:
      booking.step,

    readyForConfirmation:
      booking.readyForConfirmation,
  };
}

export function previewAssistantRequest(
  message,
  options = {}
) {
  const normalized =
    normalizeOptions({
      ...options,
      message,
    });

  const local =
    routeLocalCommand(
      normalized.message,
      normalized
    );

  const request =
    createBackendRequest(
      normalized
    );

  return {
    localDecision:
      local.decision,

    pendingAction:
      local.pending,

    bookingState:
      local.booking,

    backendRequest:
      request,
  };
}

export function getControllerState(
  options = {}
) {
  const normalized =
    normalizeOptions(
      options
    );

  const {
    context,
    serverContext,
    pending,
    bookingState,
  } =
    createControllerContext(
      normalized
    );

  return {
    currentPath:
      normalized.currentPath,

    language:
      normalized.language,

    pendingAction:
      pending,

    bookingState,

    bookingForm:
      getBookingFormCommand(
        bookingState
      ),

    context,

    serverContext,
  };
}

export function validateControllerAction(
  action,
  options = {}
) {
  const normalized =
    normalizeOptions(
      options
    );

  const context =
    buildAssistantContext({
      pathname:
        normalized.currentPath,

      language:
        normalized.language,

      history:
        normalized.history,

      message:
        normalized.message,
    });

  return validateActionForContext(
    action,
    context
  );
}

export function getControllerInfo() {
  return {
    name:
      "KrishiSetu AI Assistant Controller",

    architecture: [
      "VoiceAssistant",
      "assistantController",
      "assistantBooking",
      "assistantRouter",
      "assistantContext",
      "assistantService",
      "assistantExecutor",
    ],

    responsibilities: [
      "orchestrate assistant requests",
      "manage conversational booking",
      "maintain booking state",
      "handle dates and slots",
      "handle booking confirmation",
      "route local commands",
      "manage pending actions",
      "call backend AI",
      "validate backend decisions",
      "execute approved actions",
    ],
  };
}

export const assistantController = {
  ask:
    askAssistant,

  handle:
    handleAssistantCommand,

  routeLocal:
    routeLocalCommand,

  requestAI,

  createContext:
    createControllerContext,

  createBackendRequest,

  processBackendDecision,

  executeDecision,

  confirm:
    confirmPendingAction,

  cancel:
    cancelPendingAction,

  preview:
    previewAssistantRequest,

  state:
    getControllerState,

  validate:
    validateControllerAction,

  booking:
    {
      getState:
        getBookingState,

      setState:
        setBookingState,

      reset:
        resetBookingState,

      handle:
        handleBookingMessage,

      form:
        getBookingFormCommand,
    },

  info:
    getControllerInfo,

  router:
    assistantRouter,

  service:
    assistantService,

  executor:
    assistantExecutor,
};

export default assistantController;