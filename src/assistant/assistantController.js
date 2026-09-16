/* =========================================================
   KRISHISETU AI ASSISTANT CONTROLLER
=========================================================

   RESPONSIBILITIES

   - Orchestrate local assistant logic
   - Maintain conversational booking state
   - Resolve farmer-specific data
   - Refresh booking availability
   - Connect booking confirmation to FarmerBook
   - Handle QR / receipt requests
   - Route ordinary navigation
   - Fall back to backend AI

   IMPORTANT

   The controller does NOT directly create a booking.

   Actual booking POST remains inside FarmerBook.

   Flow:

      user
        ↓
      controller
        ↓
      booking engine
        ↓
      FarmerBook confirmation bridge
        ↓
      existing booking POST
========================================================= */

import {
  ACTIONS,
} from "./assistantActions";

import {
  buildAssistantContext,
  buildServerAssistantContext,
  validateActionForContext,
  getFarmerContext,
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
  debugLog,
  readStorageJson,
  writeStorageJson,
  removeStorage,
  getStoredFarmer,
} from "./assistantUtils";

/* =========================================================
   CONSTANTS
========================================================= */

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

const BOOKING_CONFIRM_TIMEOUT =
  15000;

const BOOKING_API_URL =
  import.meta.env.VITE_API_URL ||
  "";


/* =========================================================
   TYPES
========================================================= */

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


/* =========================================================
   INTERNAL STATE
========================================================= */

/*
 * Prevent two assistant messages from triggering two
 * simultaneous FarmerBook submissions.
 */

let bookingSubmissionInFlight =
  null;


/* =========================================================
   RESULT
========================================================= */

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


/* =========================================================
   OPTIONS
========================================================= */

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

    bookingDraft =
      undefined,

    semanticTopic =
      null,

    decision =
      null,

    signal =
      null,

  } =
    options;


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

    bookingDraft,

    semanticTopic,

    decision,

    signal,

  };

}


/* =========================================================
   BOOKING STATE
========================================================= */

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


/* =========================================================
   BOOKING TEXT
========================================================= */

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

    date =
      null,

    slot =
      null,

    state =
      null,

  } =
    data;


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

        return (
          `मैंने ${displayCrop} की ${quantity} kg मात्रा रख ली है। ` +
          `अब तारीख और आने का समय चुनना बाकी है।`
        );

      }


      if (
        displayCrop
      ) {

        return (
          `मैंने ${displayCrop} चुन लिया है। ` +
          `अब अनुमानित मात्रा बताएं।`
        );

      }


      if (
        quantity
      ) {

        return (
          `मैंने ${quantity} kg मात्रा रख ली है। ` +
          `अब फसल बताएं।`
        );

      }


      return "बुकिंग की जानकारी अपडेट हो गई है।";

    }


    if (
      language ===
      "te"
    ) {

      if (
        displayCrop &&
        quantity
      ) {

        return (
          `${displayCrop} ${quantity} kg వివరాలను నమోదు చేశాను. ` +
          `ఇంకా తేదీ మరియు రాక సమయం ఎంచుకోవాలి.`
        );

      }


      if (
        displayCrop
      ) {

        return (
          `${displayCrop} ఎంపిక చేశాను. ` +
          `ఇప్పుడు అంచనా పరిమాణం చెప్పండి.`
        );

      }


      if (
        quantity
      ) {

        return (
          `${quantity} kg పరిమాణాన్ని నమోదు చేశాను. ` +
          `ఇప్పుడు పంటను చెప్పండి.`
        );

      }


      return "బుకింగ్ వివరాలు నవీకరించబడ్డాయి.";

    }


    if (
      displayCrop &&
      quantity
    ) {

      return (
        `I saved ${quantity} kg of ${displayCrop}. ` +
        `We still need the date and arrival time.`
      );

    }


    if (
      displayCrop
    ) {

      return (
        `I selected ${displayCrop}. ` +
        `Now tell me the estimated quantity.`
      );

    }


    if (
      quantity
    ) {

      return (
        `I saved ${quantity} kg. ` +
        `Now tell me which crop you are bringing.`
      );

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

      return (
        `ठीक है। ${date || "यह तारीख"} चुन ली गई है। ` +
        `अब मैं इस तारीख के उपलब्ध समय देख सकता हूँ।`
      );

    }


    if (
      language ===
      "te"
    ) {

      return (
        `సరే. ${date || "ఈ తేదీ"} ఎంచుకున్నాను. ` +
        `ఇప్పుడు ఈ తేదీకి అందుబాటులో ఉన్న రాక సమయాలను చూడవచ్చు.`
      );

    }


    return (
      `Okay. ${date || "That date"} is selected. ` +
      `I can now check the available arrival times for this date.`
    );

  }


  if (
    key ===
    "slotSelected"
  ) {

    if (
      language ===
      "hi"
    ) {

      return (
        `समय ${slot || "चुन लिया गया"}। ` +
        `बुकिंग की सारी जानकारी तैयार है। ` +
        `क्या मैं पुष्टि कर दूँ?`
      );

    }


    if (
      language ===
      "te"
    ) {

      return (
        `సమయం ${slot || "ఎంచుకున్నాము"}. ` +
        `ఇప్పుడు బుకింగ్ వివరాలన్నీ సిద్ధంగా ఉన్నాయి. ` +
        `నిర్ధారించనా?`
      );

    }


    return (
      `The ${slot || "arrival time"} is selected. ` +
      `Your booking details are complete. ` +
      `Shall I confirm it?`
    );

  }


  if (
    key ===
    "needDate"
  ) {

    return assistantBooking.nextPrompt(
      assistantBooking.normalize(
        state
      ),
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

      return (
        "तारीख चुन ली गई है। " +
        "उपलब्ध समय पूछें या कोई उपलब्ध समय चुनें।"
      );

    }


    if (
      language ===
      "te"
    ) {

      return (
        "తేదీ ఎంచుకున్నారు. " +
        "అందుబాటులో ఉన్న సమయాలు అడగండి లేదా ఒక సమయాన్ని ఎంచుకోండి."
      );

    }


    return (
      "Your date is selected. " +
      "Ask me for the available times, or choose one."
    );

  }


  if (
    key ===
    "state"
  ) {

    const summary =
      assistantBooking.getStateSummary(
        state,
        language
      );


    if (
      language ===
      "hi"
    ) {

      return (
        `अभी आपकी बुकिंग में:\n${summary}`
      );

    }


    if (
      language ===
      "te"
    ) {

      return (
        `ప్రస్తుతం మీ బుకింగ్‌లో:\n${summary}`
      );

    }


    return (
      `Here is what I currently have for your booking:\n${summary}`
    );

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
        ? `उपलब्ध तारीखें हैं: ${data.dateText}। इनमें से कोई तारीख चुनें।`
        : "अभी उपलब्ध तारीखें नहीं मिलीं।";

    }


    if (
      language ===
      "te"
    ) {

      return data.dateText
        ? `అందుబాటులో ఉన్న తేదీలు: ${data.dateText}. వీటిలో ఒకదాన్ని ఎంచుకోండి.`
        : "ప్రస్తుతం అందుబాటులో ఉన్న తేదీలు లేవు.";

    }


    return data.dateText
      ? `The available dates are: ${data.dateText}. You can choose one.`
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
      ? `The available arrival times are: ${data.slotText}. Choose one.`
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

      return (
        "बुकिंग की सारी जानकारी तैयार है। " +
        "अंतिम पुष्टि के लिए हाँ कहें।"
      );

    }


    if (
      language ===
      "te"
    ) {

      return (
        "బుకింగ్ వివరాలన్నీ సిద్ధంగా ఉన్నాయి. " +
        "తుది నిర్ధారణ కోసం అవును అని చెప్పండి."
      );

    }


    return (
      "All booking details are ready. " +
      "Say yes to submit the booking."
    );

  }


  if (
    key ===
    "confirmed"
  ) {

    if (
      language ===
      "hi"
    ) {

      return "बुकिंग सफलतापूर्वक पुष्टि हो गई।";

    }


    if (
      language ===
      "te"
    ) {

      return "బుకింగ్ విజయవంతంగా నిర్ధారించబడింది.";

    }


    return "Booking confirmed successfully.";

  }


  return "";

}


/* =========================================================
   TIME HELPERS
========================================================= */

function controllerTimeToMinutes(
  value
) {

  const raw =
    String(
      value ??
      ""
    )
      .trim()
      .toLowerCase()
      .replace(
        /\./g,
        ":"
      );


  if (
    !raw
  ) {

    return null;

  }


  let match =
    raw.match(
      /^(\d{1,2}):(\d{1,2})(?::\d{1,2})?\s*(am|pm)?$/
    );


  if (
    match
  ) {

    let hours =
      Number(
        match[1]
      );

    const minutes =
      Number(
        match[2]
      );

    const period =
      match[3];


    if (
      !Number.isFinite(
        hours
      ) ||
      !Number.isFinite(
        minutes
      ) ||
      minutes >
        59
    ) {

      return null;

    }


    if (
      period ===
      "am" &&
      hours ===
      12
    ) {

      hours =
        0;

    }


    if (
      period ===
      "pm" &&
      hours !==
      12
    ) {

      hours +=
        12;

    }


    if (
      hours >
      23
    ) {

      return null;

    }


    return (
      hours *
      60 +
      minutes
    );

  }


  /*
   * Support compact times such as:
   *
   * 830
   * 0830
   */

  match =
    raw.match(
      /^(\d{3,4})(am|pm)?$/
    );


  if (
    match
  ) {

    const digits =
      match[1];


    let hours;

    let minutes;


    if (
      digits.length ===
      3
    ) {

      hours =
        Number(
          digits.slice(
            0,
            1
          )
        );

      minutes =
        Number(
          digits.slice(
            1
          )
        );

    } else {

      hours =
        Number(
          digits.slice(
            0,
            2
          )
        );

      minutes =
        Number(
          digits.slice(
            2
          )
        );

    }


    const period =
      match[2];


    if (
      !period
    ) {

      if (
        hours >
        23 ||
        minutes >
        59
      ) {

        return null;

      }

    } else {

      if (
        hours <
        1 ||
        hours >
        12 ||
        minutes >
        59
      ) {

        return null;

      }


      if (
        period ===
        "pm" &&
        hours !==
        12
      ) {

        hours +=
          12;

      }


      if (
        period ===
        "am" &&
        hours ===
        12
      ) {

        hours =
          0;

      }

    }


    return (
      hours *
      60 +
      minutes
    );

  }


  return null;

}


function controllerMinutesToTime(
  total
) {

  const hours =
    Math.floor(
      Number(
        total
      ) /
      60
    );


  const minutes =
    Number(
      total
    ) %
    60;


  return (
    `${String(
      hours
    ).padStart(
      2,
      "0"
    )}:` +

    `${String(
      minutes
    ).padStart(
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
      value ||
      ""
    );

  }


  const hours =
    Math.floor(
      total /
      60
    );


  const minutes =
    total %
    60;


  const displayHour =
    hours %
      12 ||
    12;


  const suffix =
    hours >=
    12
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


/* =========================================================
   SLOT GENERATION
========================================================= */

function controllerGenerateSlots(
  center,
  settings
) {

  const opening =
    center?.opening_time ||
    center?.openingTime ||
    center?.openTime ||
    "09:00";


  const closing =
    center?.closing_time ||
    center?.closingTime ||
    center?.closeTime ||
    "17:00";


  const duration =
    Math.max(
      5,
      Number(
        settings?.slotDuration ??
        settings?.slot_duration ??
        30
      ) || 30
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
    end <=
      cursor
  ) {

    return [];

  }


  const slots =
    [];


  while (
    cursor +
      duration <=
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


/* =========================================================
   PAST SLOT
========================================================= */

function controllerIsPastSlot(
  slot,
  date
) {

  const now =
    new Date();


  const todayIso =
    [
      now.getFullYear(),

      String(
        now.getMonth() +
        1
      ).padStart(
        2,
        "0"
      ),

      String(
        now.getDate()
      ).padStart(
        2,
        "0"
      ),

    ].join(
      "-"
    );


  if (
    String(
      date
    ) !==
    todayIso
  ) {

    return false;

  }


  const end =
    controllerTimeToMinutes(
      slot?.end ??
      slot?.endTime ??
      slot?.to
    );


  if (
    end == null
  ) {

    return false;

  }


  return (
    end <=
    now.getHours() *
      60 +
      now.getMinutes()
  );

}


/* =========================================================
   DATE GENERATION
========================================================= */

function controllerGenerateDates(
  days,
  now = new Date()
) {

  const safeDays =
    Math.max(
      0,
      Number(
        days
      ) ||
      7
    );


  const base =
    new Date(
      now
    );


  base.setHours(
    0,
    0,
    0,
    0
  );


  const result =
    [];


  for (
    let index = 0;
    index <=
      safeDays;
    index +=
      1
  ) {

    const date =
      new Date(
        base
      );


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

      ].join(
        "-"
      );


    result.push({

      id:
        iso,

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
        index ===
          0
          ? "Today"
          : index ===
              1
            ? "Tomorrow"
            : date.toLocaleDateString(
                "en-US",
                {
                  weekday:
                    "long",

                  month:
                    "short",

                  day:
                    "numeric",
                }
              ),

    });

  }


  return result;

}


/* =========================================================
   BOOKING DATE NORMALIZATION
========================================================= */

function normalizeControllerDate(
  value
) {

  const text =
    String(
      value ??
      ""
    )
      .trim();


  if (
    !text
  ) {

    return null;

  }


  if (
    /^\d{4}-\d{1,2}-\d{1,2}$/.test(
      text
    )
  ) {

    const [
      year,
      month,
      day,
    ] =
      text
        .split(
          "-"
        )
        .map(
          Number
        );


    const date =
      new Date(
        year,
        month -
          1,
        day
      );


    if (
      date.getFullYear() ===
        year &&
      date.getMonth() ===
        month -
        1 &&
      date.getDate() ===
        day
    ) {

      return (

        `${String(
          year
        )}-${String(
          month
        ).padStart(
          2,
          "0"
        )}-${String(
          day
        ).padStart(
          2,
          "0"
        )}`

      );

    }

  }


  return null;

}


/* =========================================================
   BOOKED COUNT
========================================================= */

function controllerBookedCount(
  rows,
  centerId,
  date,
  start,
  end
) {

  if (
    !Array.isArray(
      rows
    )
  ) {

    return 0;

  }


  const ignoredStatuses =
    new Set([

      "CANCELLED",

      "CANCELED",

      "REJECTED",

      "EXPIRED",

    ]);


  const wantedStart =
    controllerTimeToMinutes(
      start
    );


  const wantedEnd =
    controllerTimeToMinutes(
      end
    );


  return rows.filter(
    row => {

      const status =
        String(
          row?.status ??
          ""
        )
          .toUpperCase();


      if (
        ignoredStatuses.has(
          status
        )
      ) {

        return false;

      }


      const rowCenter =
        row?.center_id ??
        row?.centerId ??
        row?.procurement_center_id;


      const rowDate =
        row?.date ??
        row?.booking_date ??
        row?.bookingDate;


      const rowStart =
        row?.slot_start ??
        row?.slotStart ??
        row?.startTime ??
        row?.start_time;


      const rowEnd =
        row?.slot_end ??
        row?.slotEnd ??
        row?.endTime ??
        row?.end_time;


      const actualStart =
        controllerTimeToMinutes(
          rowStart
        );


      const actualEnd =
        controllerTimeToMinutes(
          rowEnd
        );


      return (

        String(
          rowCenter ??
          ""
        ) ===
        String(
          centerId ??
          ""
        ) &&

        String(
          rowDate ??
          ""
        ) ===
        String(
          date ??
          ""
        ) &&

        wantedStart !=
          null &&

        actualStart !=
          null &&

        actualStart ===
          wantedStart &&

        wantedEnd !=
          null &&

        actualEnd !=
          null &&

        actualEnd ===
          wantedEnd

      );

    }
  ).length;

}


/* =========================================================
   API
========================================================= */

async function controllerGetJson(
  path,
  options = {}
) {

  const query =
    String(
      path ||
      ""
    );


  const response =
    await fetch(
      `${BOOKING_API_URL}${query}`,
      {

        method:
          "GET",

        headers: {

          Accept:
            "application/json",

        },

        signal:
          options.signal ||
          undefined,

      }
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

      data?.error?.message ||

      data?.error ||

      `Request failed: ${path}`

    );

  }


  return (
    data ||
    {}
  );

}


/* =========================================================
   AVAILABILITY CACHE SCOPE
========================================================= */

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
    state?.date &&
    context.selectedDate &&
    String(
      context.selectedDate
    ) !==
      String(
        state.date
      )
  ) {

    return false;

  }


  if (
    state?.centerId &&
    context.selectedCenterId &&
    String(
      context.selectedCenterId
    ) !==
      String(
        state.centerId
      )
  ) {

    return false;

  }


  return true;

}


/* =========================================================
   SERVER AUTHORITATIVE AVAILABILITY
========================================================= */

async function getServerAuthoritativeAvailability(
  state,
  options = {}
) {

  const date =
    normalizeControllerDate(
      state?.date
    );


  if (
    !date
  ) {

    return null;

  }


  const query =
    new URLSearchParams({

      date,

    });


  if (
    state?.centerId
  ) {

    query.set(
      "centerId",
      String(
        state.centerId
      )
    );

  }


  try {

    const data =
      await controllerGetJson(
        `/booking-availability?${query.toString()}`,
        options
      );


    const rawSlots =
      Array.isArray(
        data?.slots
      )
        ? data.slots
        : [];


    const rawCenters =
      Array.isArray(
        data?.centers
      )
        ? data.centers
        : [];


    const centers =
      rawCenters.map(
        center => ({

          id:
            center?.id ??
            center?.centerId,

          name:
            center?.name ??
            center?.centerName ??
            center?.title ??
            "Procurement Center",

          openingTime:
            center?.opening_time ??
            center?.openingTime ??
            "09:00",

          closingTime:
            center?.closing_time ??
            center?.closingTime ??
            "17:00",

          capacity:
            Number(
              center?.capacity ??
              center?.capacityPerSlot ??
              center?.capacity_per_slot ??
              20
            ) || 20,

        })
      );


    const selectedCenter =
      state?.centerId
        ? (

            centers.find(
              center =>
                String(
                  center.id
                ) ===
                String(
                  state.centerId
                )
            ) ||

            null

          )
        : (

            centers[0] ||
            null

          );


    const selectedCenterId =
      selectedCenter?.id ??
      state?.centerId ??
      null;


    const normalizedSlots =
      rawSlots
        .map(
          slot => {

            const centerId =
              slot?.centerId ??
              slot?.center_id ??
              selectedCenterId ??
              null;


            const start =
              slot?.start ??
              slot?.startTime ??
              slot?.start_time ??
              slot?.from ??
              "";


            const end =
              slot?.end ??
              slot?.endTime ??
              slot?.end_time ??
              slot?.to ??
              "";


            const startMinutes =
              controllerTimeToMinutes(
                start
              );


            const endMinutes =
              controllerTimeToMinutes(
                end
              );


            /*
             * Some API responses provide remaining.
             * Others simply provide availability flags.
             *
             * Missing remaining MUST NOT mean "zero".
             */

            const rawRemaining =
              Number(
                slot?.remaining
              );


            const rawAvailable =
              slot?.available ??
              slot?.isAvailable ??
              slot?.is_available;


            const available =
              Number.isFinite(
                rawRemaining
              )
                ? rawRemaining >
                  0

                : rawAvailable ===
                    false
                  ? false
                  : true;


            return {

              ...slot,

              id:
                slot?.id ||
                (
                  start &&
                  end
                    ? `${String(
                        start
                      ).slice(
                        0,
                        5
                      ).replace(
                        ":",
                        "-"
                      )}`
                    : null
                ),

              centerId,

              start:
                startMinutes !=
                  null
                  ? controllerMinutesToTime(
                      startMinutes
                    )
                  : start,

              end:
                endMinutes !=
                  null
                  ? controllerMinutesToTime(
                      endMinutes
                    )
                  : end,

              display:
                slot?.display ||
                slot?.label ||
                (
                  start &&
                  end
                    ? `${controllerFormatTime(
                        start
                      )} – ${controllerFormatTime(
                        end
                      )}`
                    : ""
                ),

              remaining:
                Number.isFinite(
                  rawRemaining
                )
                  ? rawRemaining
                  : null,

              available,

            };

          }
        )
        .filter(
          slot =>
            slot.available !==
            false
        );


    const centerSlots =
      selectedCenterId

        ? normalizedSlots.filter(
            slot =>
              String(
                slot.centerId ??
                ""
              ) ===
              String(
                selectedCenterId
              )
          )

        : normalizedSlots;


    const apiDates =
      Array.isArray(
        data?.availableDates
      )
        ? data.availableDates
        : Array.isArray(
            data?.dates
          )
          ? data.dates
          : [];


    const availableDates =
      apiDates.length
        ? apiDates
            .map(
              item => {

                const itemDate =
                  normalizeControllerDate(
                    item?.date ??
                    item?.id ??
                    item?.value
                  );


                return {

                  id:
                    itemDate ||
                    item?.id ||
                    String(
                      item
                    ),

                  date:
                    itemDate,

                  label:
                    item?.label ||
                    item?.name ||
                    itemDate ||
                    "",

                };

              }
            )
            .filter(
              item =>
                Boolean(
                  item.date
                )
            )

        : [

            {

              id:
                date,

              date,

              label:
                new Date(
                  `${date}T00:00:00`
                ).toLocaleDateString(
                  "en-US",
                  {

                    weekday:
                      "long",

                    month:
                      "long",

                    day:
                      "numeric",

                    year:
                      "numeric",

                  }
                ),

            },

          ];


    return {

      availableDates,

      availableSlots:
        centerSlots,

      availableCenters:
        centers,

      selectedDate:
        date,

      selectedCenterId,

      updatedAt:
        Date.now(),

      serverAuthoritative:
        true,

    };

  } catch (
    error
  ) {

    debugLog(
      "Server availability endpoint failed",
      error
    );


    return null;

  }

}


/* =========================================================
   LIVE AVAILABILITY REFRESH
========================================================= */

async function refreshLiveBookingAvailability(
  state,
  options = {}
) {

  const {

    force =
      false,

    signal =
      null,

  } =
    options;


  let pageContext =
    typeof assistantBooking.getBookingAvailabilityContext ===
      "function"
      ? assistantBooking.getBookingAvailabilityContext()
      : null;


  if (
    !force &&
    sameBookingAvailabilityScope(
      pageContext,
      state
    )
  ) {

    return pageContext;

  }


  /*
   * When a date is selected, prefer the backend's live
   * availability endpoint.
   */

  if (
    state?.date
  ) {

    const authoritative =
      await getServerAuthoritativeAvailability(
        state,
        {
          signal,
        }
      );


    if (
      authoritative
    ) {

      if (
        typeof assistantBooking.saveBookingAvailabilityContext ===
        "function"
      ) {

        assistantBooking.saveBookingAvailabilityContext(
          authoritative
        );

      }


      return authoritative;

    }

  }


  /*
   * Ask the currently mounted booking page for its
   * latest availability snapshot as a fast fallback.
   */

  if (
    typeof assistantBooking.requestBookingAvailabilitySync ===
    "function"
  ) {

    try {

      pageContext =
        assistantBooking.requestBookingAvailabilitySync() ||
        pageContext;

    } catch {
    }

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
          "/centers",
          {
            signal,
          }
        ),

        controllerGetJson(
          "/settings",
          {
            signal,
          }
        ),

        controllerGetJson(
          "/bookings",
          {
            signal,
          }
        ),

      ]);


    const settings =
      settingsData?.settings ||
      settingsData ||
      {};


    const rawCenters =
      Array.isArray(
        centersData?.centers
      )
        ? centersData.centers
        : Array.isArray(
            centersData
          )
          ? centersData
          : [];


    const centers =
      rawCenters.filter(
        center => {

          const active =
            center?.active ??
            center?.isActive ??
            center?.is_active ??
            1;


          return (
            active ===
            true ||

            active ===
            1 ||

            active ===
            "1" ||

            active ===
            "true"
          );

        }
      );


    const bookings =
      Array.isArray(
        bookingsData?.bookings
      )
        ? bookingsData.bookings
        : Array.isArray(
            bookingsData
          )
          ? bookingsData
          : [];


    const dates =
      controllerGenerateDates(
        Number(
          settings?.advanceBookingDays ??
          settings?.advance_booking_days ??
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
                  ) ||
                  20
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


                  const booked =
                    controllerBookedCount(
                      bookings,
                      center?.id,
                      day.date,
                      slot.start,
                      slot.end
                    );


                  return (
                    booked <
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


    let availableSlots =
      [];


    if (
      selectedCenter &&
      selectedDate
    ) {

      availableSlots =
        controllerGenerateSlots(
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
                  ) ||
                  20
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

                centerId:
                  selectedCenter.id,

                capacity,

                booked,

                remaining,

                available:
                  remaining >
                  0,

                loadClass:
                  remaining ===
                    0
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
          );

    }


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
              center?.name ??
              center?.centerName ??
              center?.title,

            openingTime:
              center?.opening_time ??
              center?.openingTime ??
              "09:00",

            closingTime:
              center?.closing_time ??
              center?.closingTime ??
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

      updatedAt:
        Date.now(),

      serverAuthoritative:
        false,

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

        availableDates:
          [],

        availableSlots:
          [],

        availableCenters:
          [],

        selectedDate:
          null,

        selectedCenterId:
          null,

        updatedAt:
          0,

      }

    );

  }

}


/* =========================================================
   BOOKING PROCESSOR WRAPPER
========================================================= */

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


/* =========================================================
   BOOKING RESULT
========================================================= */

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


    let reply;


    if (
      missing.length
    ) {

      reply =
        assistantBooking.nextPrompt(
          state,
          language
        );

    } else {

      reply =
        getBookingText(
          language,
          "ready",
          {
            state,
          }
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
          language ===
          "hi"

            ? (
                `उपलब्ध खरीद केंद्र: ` +
                `${assistantBooking.formatCenterOptions(
                  bookingResult.centers ||
                    [],
                  language
                )}.`
              )

            : language ===
                "te"

              ? (
                  `అందుబాటులో ఉన్న కొనుగోలు కేంద్రాలు: ` +
                  `${assistantBooking.formatCenterOptions(
                    bookingResult.centers ||
                      [],
                    language
                  )}.`
                )

              : (
                  `Available procurement centers: ` +
                  `${assistantBooking.formatCenterOptions(
                    bookingResult.centers ||
                      [],
                    language
                  )}.`
                ),

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

        slots:
          bookingResult.slots ||
          [],

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


    const pending = {

      action:
        "OPEN_BOOKING",

      params:
        sanitizeActionParams(
          state
        ),

      booking:
        state,

      createdAt:
        Date.now(),

    };


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
          )}` +

          `\n${assistantBooking.formatBookingProgress(
            state,
            language
          )}` +

          (
            language ===
            "hi"

              ? "\nअंतिम पुष्टि के लिए ‘हाँ’ कहें।"

              : language ===
                  "te"

                ? "\nతుది నిర్ధారణ కోసం ‘అవును’ అని చెప్పండి."

                : "\nSay ‘yes’ to submit the booking."

          ),

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
          pending,

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
          "CONFIRM_BOOKING",

        reply:
          language ===
          "hi"

            ? "ठीक है। मैं आपकी चुनी हुई बुकिंग अभी सबमिट कर रहा हूँ।"

            : language ===
                "te"

              ? "సరే. మీరు ఎంచుకున్న బుకింగ్‌ను ఇప్పుడు సమర్పిస్తున్నాను."

              : "Okay. I’m submitting the booking with your selected details now.",

        bookingState:
          state,

        booking:
          state,

        params:
          sanitizeActionParams(
            state
          ),

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
                "ready",
                {
                  state,
                }
              )
            : assistantBooking.nextPrompt(
                state,
                language
              ),

        bookingState:
          state,

        review,

        awaitingConfirmation:
          Boolean(
            state.awaitingConfirmation
          ),

        readyForConfirmation:
          Boolean(
            state.readyForConfirmation
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
    BOOKING_INTENTS.CANCEL
  ) {

    clearBookingState();

    clearPendingAction();


    return controllerResult(
      CONTROLLER_TYPES.CANCELLATION,
      CONTROLLER_STATUS.CANCELLED,
      {

        bookingIntent:
          intent,

        action:
          "NONE",

        reply:
          language ===
          "hi"

            ? "ठीक है, मैंने आपकी बुकिंग प्रक्रिया रद्द कर दी।"

            : language ===
                "te"

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


/* =========================================================
   BOOKING PATH
========================================================= */

function isBookingPath(
  pathname
) {

  return /^\/farmer\/book\/?$/i.test(
    String(
      pathname ||
      ""
    )
  );

}


/* =========================================================
   BOOKING NAVIGATION
========================================================= */

function navigateBookingPage(
  state,
  options,
  autoConfirm = false
) {

  const safeState =
    assistantBooking.normalize(
      state
    );


  const routeState = {

    ...assistantBooking.buildBookingRouteState(
      safeState
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


/* =========================================================
   BOOKING CONFIRMATION EVENT
========================================================= */

function dispatchBookingEventAndWait(
  name,
  state,
  timeoutMs =
    BOOKING_CONFIRM_TIMEOUT
) {

  if (
    bookingSubmissionInFlight
  ) {

    return bookingSubmissionInFlight;

  }


  bookingSubmissionInFlight =
    new Promise(
      resolve => {

        if (
          typeof window ===
          "undefined"
        ) {

          resolve({

            success:
              false,

            reason:
              "Booking page is unavailable.",

          });

          return;

        }


        let settled =
          false;


        let timeout =
          null;


        const finish =
          result => {

            if (
              settled
            ) {

              return;

            }


            settled =
              true;


            if (
              timeout
            ) {

              clearTimeout(
                timeout
              );

            }


            resolve(

              result ||
              {

                success:
                  true,

              }

            );

          };


        timeout =
          setTimeout(
            () => {

              finish({

                success:
                  false,

                reason:
                  "The booking page did not finish submitting the booking. Please check the booking form and try again.",

                timedOut:
                  true,

              });

            },
            timeoutMs
          );


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

                  source:
                    "krishisetu-assistant",

                  autoConfirm:
                    true,

                  onComplete:
                    finish,

                },

              }
            )

          );

        } catch (
          error
        ) {

          finish({

            success:
              false,

            reason:
              error?.message ||
              "Unable to submit the booking.",

          });

        }

      }
    );


  bookingSubmissionInFlight =
    bookingSubmissionInFlight
      .finally(
        () => {

          bookingSubmissionInFlight =
            null;

        }
      );


  return bookingSubmissionInFlight;

}


/* =========================================================
   ACTUAL BOOKING HANDOFF
========================================================= */

async function submitBookingThroughFarmerBook(
  state,
  options
) {

  const safe =
    assistantBooking.normalize(
      state
    );


  const validation =
    assistantBooking.validateBookingDraft(
      safe
    );


  if (
    !validation.valid
  ) {

    return {

      success:
        false,

      reason:
        assistantBooking.nextPrompt(
          safe,
          options.language
        ),

      validation,

      booking:
        safe,

    };

  }


  /*
   * IMPORTANT
   *
   * `confirmed` in assistantBooking historically means
   * "user has authorized this booking".
   *
   * It must NOT remain true while the real HTTP submission
   * is still pending, otherwise a failed submission can make
   * the assistant believe the booking already exists.
   */

  const submissionState =
    assistantBooking.normalize({

      ...safe,

      confirmed:
        false,

      readyForConfirmation:
        true,

      awaitingConfirmation:
        true,

    });


  saveBookingState(
    submissionState
  );


  /*
   * FarmerBook is already mounted.
   */

  if (
    isBookingPath(
      options.currentPath
    )
  ) {

    const submission =
      await dispatchBookingEventAndWait(
        "krishisetu:assistant-confirm-booking",
        submissionState
      );


    if (
      !submission?.success
    ) {

      /*
       * Restore a retryable state after a failed
       * submission rather than locking the booking.
       */

      const retryState =
        assistantBooking.normalize({

          ...submissionState,

          confirmed:
            false,

          readyForConfirmation:
            true,

          awaitingConfirmation:
            true,

        });


      saveBookingState(
        retryState
      );


      return {

        success:
          false,

        reason:
          submission?.reason ||
          "I couldn’t complete the booking.",

        booking:
          retryState,

        submission,

      };

    }


    const submittedBooking =
      submission.booking ||
      null;


    const finalState =
      assistantBooking.normalize({

        ...submissionState,

        confirmed:
          true,

        readyForConfirmation:
          false,

        awaitingConfirmation:
          false,

        token:
          submittedBooking?.token ||
          submission?.token ||
          submissionState.token ||
          null,

        bookingId:
          submittedBooking?.id ||
          submission?.bookingId ||
          submissionState.bookingId ||
          null,

      });


    clearPendingAction();


    saveBookingState(
      finalState
    );


    return {

      success:
        true,

      submitted:
        true,

      booking:
        finalState,

      submittedBooking,

      submission,

    };

  }


  /*
   * FarmerBook is not mounted.
   *
   * Navigate with autoConfirm so the existing FarmerBook
   * auto-confirm bridge can perform the real submission.
   */

  const navigation =
    navigateBookingPage(
      submissionState,
      options,
      true
    );


  return {

    success:
      true,

    submitted:
      false,

    pendingSubmission:
      true,

    navigation,

    booking:
      submissionState,

    reason:
      "Opening the booking page to complete the authorized booking.",

  };

}


/* =========================================================
   CROP AVAILABILITY
========================================================= */

function isCropAvailabilityRequest(
  text
) {

  const value =
    String(
      text ||
      ""
    )
      .toLowerCase();


  return (

    /\b(what|which|show|list|tell)\b.*\b(crops?|produce)\b/i.test(
      value
    ) ||

    /\b(available|accepted|offered)\b.*\b(crops?|produce)\b/i.test(
      value
    ) ||

    /\b(crops?|produce)\b.*\b(available|accepted|offered)\b/i.test(
      value
    ) ||

    /उपलब्ध.*फसल|कौन.*फसल/i.test(
      value
    ) ||

    /అందుబాటులో.*పంట|ఏ.*పంట/i.test(
      value
    )

  );

}


/* =========================================================
   AVAILABLE CROPS
========================================================= */

function getAvailableCropNames(
  language = "en"
) {

  const farmer =
    getFarmerContext();


  const crops =
    Array.isArray(
      farmer?.crops
    )
      ? farmer.crops
      : [];


  const names =
    crops
      .map(
        crop =>
          String(
            crop?.name ??
            crop?.cropName ??
            ""
          )
            .trim()
      )
      .filter(
        Boolean
      );


  if (
    names.length
  ) {

    return [
      ...new Set(
        names
      ),
    ];

  }


  if (
    language ===
    "hi"
  ) {

    return [

      "गेहूं",

      "धान",

      "मक्का",

      "कपास",

    ];

  }


  if (
    language ===
    "te"
  ) {

    return [

      "గోధుమ",

      "వరి",

      "మొక్కజొన్న",

      "పత్తి",

    ];

  }


  return [

    "Wheat",

    "Paddy",

    "Maize",

    "Cotton",

  ];

}


/* =========================================================
   BOOKING PAGE REQUEST
========================================================= */

function isBookingPageRequest(
  text
) {

  const value =
    String(
      text ||
      ""
    );


  return (

    /\b(open|show|go\s+to|take\s+me\s+to|navigate\s+to)\b.*\bbooking\b.*\b(page|form|screen)\b/i.test(
      value
    ) ||

    /\bbooking\s+(page|form|screen)\b/i.test(
      value
    ) ||

    /\b(procurement|book)\s+(page|form|screen)\b/i.test(
      value
    )

  );

}


/* =========================================================
   BOOKING COMMAND
========================================================= */

function extractExplicitBookingCommand(
  text
) {

  return (

    /\b(book|booking|reserve|reservation|procurement|sell|select|choose|start|new)\b/i.test(
      String(
        text ||
        ""
      )
    ) ||

    /बुक|बुकिंग|बिक्री|चुनो|चुनें|రిజర్వ్|బుక్|బుకింగ్|ఎంచుకో/i.test(
      String(
        text ||
        ""
      )
    )

  );

}


/* =========================================================
   IMMEDIATE BOOKING APPROVAL
========================================================= */

function isImmediateBookingApproval(
  text
) {

  const value =
    String(
      text ||
      ""
    )
      .trim();


  if (
    !value
  ) {

    return false;

  }


  /*
   * Examples:
   *
   * yes book 234 kg paddy tomorrow 8 to 830
   * okay book 100 kg wheat tomorrow
   * sure book paddy
   */

  return (

    /^(yes|yeah|yep|yup|sure|okay|ok|haan|हां|हाँ|ठीक|ठीक है|अवश्य|అవును|సరే)\b/i.test(
      value
    ) &&

    extractExplicitBookingCommand(
      value
    )

  );

}


/* =========================================================
   AFFIRMATIVE
========================================================= */

function extractAffirmative(
  text
) {

  return (

    /^(yes|yeah|yep|yup|sure|okay|ok|k|confirm|confirmed|do it|book it|go ahead|continue|proceed|haan|हाँ|हां|ठीक|ठीक है|अवश्य|करो|कर दो|అవును|సరే|చేయండి)[.!\s]*$/i.test(
      String(
        text ||
        ""
      ).trim()
    )

  );

}


/* =========================================================
   FARMER QUERY CLASSIFICATION + INTENT FIREWALL
========================================================= */

function normalizeFarmerQuery(
  value
) {

  return String(
    value ||
    ""
  )
    .normalize("NFKC")
    .toLowerCase()
    .replace(
      /[^\p{L}\p{N}]+/gu,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();

}


function farmerEditDistance(
  left,
  right
) {

  const a =
    String(
      left ||
      ""
    );

  const b =
    String(
      right ||
      ""
    );

  if (
    a ===
    b
  ) {
    return 0;
  }

  if (
    !a
  ) {
    return b.length;
  }

  if (
    !b
  ) {
    return a.length;
  }

  const previous =
    Array.from(
      {
        length:
          b.length +
          1,
      },
      (
        _,
        index
      ) =>
        index
    );

  for (
    let i =
      1;
    i <=
      a.length;
    i +=
      1
  ) {

    const current =
      [
        i,
      ];

    for (
      let j =
        1;
      j <=
        b.length;
      j +=
        1
    ) {

      const cost =
        a[i - 1] ===
        b[j - 1]
          ? 0
          : 1;

      current[j] =
        Math.min(
          current[j - 1] +
            1,
          previous[j] +
            1,
          previous[j - 1] +
            cost
        );

    }

    for (
      let j =
        0;
      j <=
        b.length;
      j +=
        1
    ) {

      previous[j] =
        current[j];

    }

  }

  return previous[
    b.length
  ];

}


function farmerWords(
  text
) {

  return normalizeFarmerQuery(
    text
  )
    .split(" ")
    .filter(
      Boolean
    );

}


function hasFuzzyFarmerWord(
  text,
  targets,
  maxDistance = 1
) {

  const words =
    farmerWords(
      text
    );

  const wanted =
    Array.isArray(
      targets
    )
      ? targets
      : [
          targets,
        ];

  return words.some(
    word =>
      wanted.some(
        target => {
          const normalizedTarget =
            normalizeFarmerQuery(
              target
            );

          const distance =
            farmerEditDistance(
              word,
              normalizedTarget
            );

          /*
           * Do not let short common words such as "my", "a",
           * "to", "me" accidentally match domain words.
           *
           * Longer typo-prone words may use a slightly wider
           * distance, e.g.:
           *   laas -> last
           *   tokeeen -> token
           *   nummmber -> number
           */
          const shortestLength =
            Math.min(
              word.length,
              normalizedTarget.length
            );

          const allowedDistance =
            shortestLength <=
              3
              ? 0
              : shortestLength <=
                  4
                ? Math.min(
                    1,
                    maxDistance
                  )
                : Math.min(
                    2,
                    maxDistance
                  );

          return distance <=
            allowedDistance;
        }
      )
  );

}


function hasAnyFarmerWord(
  text,
  targets,
  maxDistance = 1
) {

  return hasFuzzyFarmerWord(
    text,
    targets,
    maxDistance
  );

}


function hasFarmerPhrase(
  text,
  patterns
) {

  const value =
    normalizeFarmerQuery(
      text
    );

  return (
    Array.isArray(
      patterns
    ) &&
    patterns.some(
      pattern =>
        pattern instanceof RegExp
          ? pattern.test(
              value
            )
          : value.includes(
              normalizeFarmerQuery(
                pattern
              )
            )
    )
  );

}


function getFarmerDataKind(
  text
) {

  const value =
    normalizeFarmerQuery(
      text
    );

  if (
    !value
  ) {
    return null;
  }

  const words =
    value.split(
      " "
    );

  const firstPerson =
    hasAnyFarmerWord(
      value,
      [
        "my",
        "i",
        "me",
        "mine",
        "we",
        "our",
        "admin",
      ],
      1
    );

  const historical =
    hasAnyFarmerWord(
      value,
      [
        "last",
        "latest",
        "recent",
        "previous",
        "past",
        "old",
        "yesterday",
        "today",
        "current",
        "this",
        "laas",
        "las",
      ],
      2
    );

  const tokenLike =
    hasAnyFarmerWord(
      value,
      [
        "token",
        "tokens",
        "token number",
        "number",
        "टोकन",
        "టోకెన్",
      ],
      2
    );

  const bookingLike =
    hasAnyFarmerWord(
      value,
      [
        "booking",
        "bookings",
        "booked",
        "book",
        "record",
        "records",
      ],
      1
    );

  const procurementLike =
    hasAnyFarmerWord(
      value,
      [
        "procure",
        "procured",
        "procurement",
        "produce",
        "produced",
        "purchase",
        "purchased",
        "sell",
        "sold",
        "sale",
        "sales",
      ],
      2
    );

  const paymentLike =
    hasAnyFarmerWord(
      value,
      [
        "payment",
        "payments",
        "paid",
        "pay",
        "money",
        "amount",
        "earning",
        "earnings",
        "income",
        "received",
        "receive",
        "admin",
      ],
      2
    );

  const cropLike =
    hasAnyFarmerWord(
      value,
      [
        "crop",
        "crops",
      ],
      1
    );

  const quantityLike =
    hasAnyFarmerWord(
      value,
      [
        "much",
        "many",
        "total",
        "sum",
        "quantity",
        "amount",
        "kg",
        "kilo",
        "kilos",
      ],
      1
    );

  const successLike =
    hasAnyFarmerWord(
      value,
      [
        "success",
        "successful",
        "successfully",
        "completed",
        "complete",
        "confirmed",
        "approved",
      ],
      2
    );

  const monthYearLike =
    hasAnyFarmerWord(
      value,
      [
        "month",
        "year",
        "week",
      ],
      1
    );

  const explicitHistory =
    (
      /\blast\s+(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+bookings?\b/i.test(
        value
      ) ||
      /\b(recent|previous|past|old)\s+bookings?\b/i.test(
        value
      ) ||
      /\b(bookings?|procurement|purchase)\s+(history|records?)\b/i.test(
        value
      ) ||
      /\bmy\s+history\b/i.test(
        value
      )
    );

  /*
   * "what is a token?" is educational, not account data.
   */
  const educationalToken =
    /\bwhat\s+(?:is|are)\b.*\btoken\b/i.test(
      value
    ) &&
    !(
      firstPerson ||
      historical ||
      /\b(my|latest|last|recent|current)\b/i.test(
        value
      )
    );

  if (
    tokenLike &&
    !educationalToken
  ) {
    if (
      /\b(crop|which\s+crop|what\s+crop)\b/i.test(
        value
      ) &&
      bookingLike
    ) {
      return "crop";
    }

    return "token";
  }

  if (
    explicitHistory
  ) {
    return "history";
  }

  if (
    cropLike &&
    bookingLike &&
    (
      firstPerson ||
      historical
    )
  ) {
    return "crop";
  }

  if (
    paymentLike &&
    (
      firstPerson ||
      historical ||
      hasFarmerPhrase(
        value,
        [
          "payment history",
          "payment status",
          "did admin pay",
          "how much money",
          "how much did i earn",
          "how much did we earn",
        ]
      )
    )
  ) {
    return "payment";
  }

  if (
    procurementLike &&
    (
      firstPerson ||
      historical ||
      quantityLike ||
      successLike ||
      monthYearLike
    )
  ) {
    return "procurement";
  }

  if (
    bookingLike &&
    (
      firstPerson ||
      historical ||
      /\bwhat\s+(was|were|is|are)\b/i.test(
        value
      )
    )
  ) {
    return "booking";
  }

  if (
    historical &&
    (
      bookingLike ||
      procurementLike ||
      paymentLike
    )
  ) {
    return (
      paymentLike
        ? "payment"
        : procurementLike
          ? "procurement"
          : "history"
    );
  }

  if (
    hasFarmerPhrase(
      value,
      [
        "booking history",
        "booking records",
        "procurement history",
        "purchase history",
        "my history",
      ]
    )
  ) {
    return "history";
  }

  if (
    /\blast\s+\d+\b.*\b(bookings?|records?)\b/i.test(
      value
    )
  ) {
    return "history";
  }

  return null;

}


function isBookingAvailabilityQuestion(
  text
) {

  const value =
    normalizeFarmerQuery(
      text
    );

  if (!value) {
    return false;
  }

  /* Availability is a booking-system question, not farmer history/data. */
  return (
    /\bavailable\s+(?:booking\s+)?dates?\b/i.test(value) ||
    /\bdates?\s+(?:are\s+)?available\b/i.test(value) ||
    /\b(?:what|which)\s+(?:are\s+)?(?:the\s+)?(?:available\s+)?dates?\b/i.test(value) ||
    /\b(?:what|which)\s+dates?\b.*\b(?:book|booking|slot|slots|available)\b/i.test(value) ||
    /\b(?:show|list|tell\s+me|give\s+me)\b.*\bavailable\b.*\bdates?\b/i.test(value)
  );
}


function isBookingDataQuestion(
  text
) {

  if (
    isBookingAvailabilityQuestion(
      text
    )
  ) {
    return false;
  }

  return Boolean(
    getFarmerDataKind(
      text
    )
  );
}


function isExplicitNavigationRequest(
  text
) {

  const value =
    normalizeFarmerQuery(
      text
    );

  if (
    !value
  ) {
    return false;
  }

  const navigationVerb =
    hasFarmerPhrase(
      value,
      [
        "take me",
        "send me",
        "bring me",
        "go to",
        "goto",
        "navigate to",
        "open",
        "show me",
        "head to",
        "move to",
        "return to",
      ]
    );

  const destination =
    hasAnyFarmerWord(
      value,
      [
        "home",
        "homepage",
        "dashboard",
        "booking",
        "book",
        "token",
        "history",
        "payment",
        "payments",
        "settings",
        "help",
        "notification",
        "notifications",
      ],
      1
    );

  return (
    (
      navigationVerb &&
      destination
    ) ||
    [
      "home",
      "homepage",
      "dashboard",
      "booking",
      "book",
      "token",
      "history",
      "payments",
      "payment",
      "settings",
      "help",
      "notifications",
    ].includes(
      value
    )
  );

}


function isBookingFollowUpMessage(
  text,
  bookingState
) {

  if (
    !bookingState?.active
  ) {
    return false;
  }

  if (
    isBookingDataQuestion(
      text
    ) ||
    isExplicitNavigationRequest(
      text
    )
  ) {
    return false;
  }

  const value =
    normalizeFarmerQuery(
      text
    );

  if (
    !value
  ) {
    return false;
  }

  if (
    extractAffirmative(
      value
    )
  ) {
    return Boolean(
      bookingState.readyForConfirmation ||
      bookingState.awaitingConfirmation
    );
  }

  if (
    /\b(cancel|cancelar|never\s+mind|stop)\b/i.test(
      value
    )
  ) {
    return true;
  }

  if (
    /\b(today|tomorrow|day\s+after\s+tomorrow|yesterday|aaj|kal|कल|आज|रविवार|सोमवार|मंगलवार|बुधवार|गुरुवार|शुक्रवार|शनिवार)\b/i.test(
      value
    )
  ) {
    return true;
  }

  if (
    /\b(time|timing|timings|slot|slots|arrival|when|morning|afternoon|evening)\b/i.test(
      value
    )
  ) {
    return true;
  }

  if (
    /\b(center|centre|procurement\s+center|procurement\s+centre)\b/i.test(
      value
    )
  ) {
    return true;
  }

  if (
    /^\d{1,2}(?:\s*(?:to|-|–)\s*\d{1,4})?$/i.test(
      value
    )
  ) {
    return true;
  }

  return false;

}


function isActuallyBookingRelated(
  text
) {

  const value =
    normalizeFarmerQuery(
      text
    );

  if (
    !value
  ) {
    return false;
  }

  if (
    isExplicitNavigationRequest(
      value
    ) ||
    isBookingDataQuestion(
      value
    )
  ) {
    return false;
  }

  if (
    /\b(book|booking|reserve|reservation|procurement|slot|slots|arrival\s+time|arrival\s+date)\b/i.test(
      value
    )
  ) {
    return true;
  }

  if (
    assistantBooking.extractCrop(
      value
    ) ||
    assistantBooking.extractQuantity(
      value
    ) ||
    assistantBooking.extractNaturalBookingDate(
      value,
      new Date()
    ) ||
    assistantBooking.extractTimeReference(
      value
    )
  ) {
    return true;
  }

  if (
    /\b(available\s+dates?|dates?\s+available|available\s+times?|available\s+timings?|available\s+slots?|which\s+center|which\s+centre|procurement\s+center|procurement\s+centre)\b/i.test(
      value
    )
  ) {
    return true;
  }

  if (
    /\b(cancel|cancel\s+booking|stop\s+booking|never\s+mind\s+the\s+booking)\b/i.test(
      value
    )
  ) {
    return true;
  }

  return false;

}

/* =========================================================
   ACTUAL BOOKING MUTATIONS
========================================================= */

function isActualBookingCancelRequest(text) {
  const value = normalizeFarmerQuery(text);
  if (!value) return false;
  return (
    /\b(cancel|cancelled|cancelation|cancellation|remove|drop)\b/i.test(value) &&
    /\b(my|this|that|latest|current|booking|reservation|slot)\b/i.test(value)
  );
}

function isActualBookingEditRequest(text) {
  const value = normalizeFarmerQuery(text);
  if (!value) return false;
  return (
    /\b(edit|modify|change|update|reschedule|move)\b/i.test(value) &&
    /\b(my|this|that|latest|current|booking|reservation|slot|date|time|quantity|crop|center|centre)\b/i.test(value)
  );
}

async function executeActualBookingCancellation(pending, options = {}) {
  const bookingId =
    pending?.bookingId ||
    pending?.booking?.id ||
    pending?.params?.bookingId ||
    null;

  if (!bookingId) {
    return controllerResult(
      CONTROLLER_TYPES.ERROR,
      CONTROLLER_STATUS.FAILED,
      {
        action: "CANCEL_BOOKING",
        reply: "I couldn't determine which booking you want to cancel.",
        shouldCallAI: false,
        shouldNavigate: false,
      }
    );
  }

  const farmer = getStoredFarmer();

  try {
    const response = await fetch(
      `${BOOKING_API_URL}/bookings/${encodeURIComponent(bookingId)}/cancel`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          farmerId:
            farmer?.farmerId ||
            farmer?.id ||
            null,
          phone:
            farmer?.phone ||
            null,
          reason:
            pending?.reason ||
            "Cancelled through KrishiSetu assistant",
        }),
        signal:
          options.signal ||
          undefined,
      }
    );

    let data = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      return controllerResult(
        CONTROLLER_TYPES.ERROR,
        CONTROLLER_STATUS.FAILED,
        {
          action: "CANCEL_BOOKING",
          reply:
            data?.message ||
            "I couldn't cancel that booking.",
          booking:
            data?.booking ||
            pending?.booking ||
            null,
          shouldCallAI: false,
          shouldNavigate: false,
        }
      );
    }

    clearPendingAction();

    return controllerResult(
      CONTROLLER_TYPES.CANCELLATION,
      CONTROLLER_STATUS.SUCCESS,
      {
        action: "CANCEL_BOOKING",
        reply:
          options.language === "hi"
            ? "ठीक है। आपकी बुकिंग सफलतापूर्वक रद्द कर दी गई है।"
            : options.language === "te"
              ? "సరే. మీ బుకింగ్ విజయవంతంగా రద్దు చేయబడింది."
              : "Done. Your booking has been cancelled successfully.",
        booking:
          data?.booking ||
          pending?.booking ||
          null,
        bookingId,
        shouldCallAI: false,
        shouldNavigate: false,
      }
    );
  } catch (error) {
    return controllerResult(
      CONTROLLER_TYPES.ERROR,
      CONTROLLER_STATUS.FAILED,
      {
        action: "CANCEL_BOOKING",
        reply:
          error?.message ||
          "I couldn't cancel that booking.",
        shouldCallAI: false,
        shouldNavigate: false,
      }
    );
  }
}

async function handleActualBookingMutationRequest(message, normalized) {
  const wantsCancel = isActualBookingCancelRequest(message);
  const wantsEdit = isActualBookingEditRequest(message);

  if (!wantsCancel && !wantsEdit) return null;

  const rows = sortBookings(
    await getFarmerBookings()
  );

  const editable = new Set(["CONFIRMED", "LATE"]);

  const tokenMatch =
    normalizeFarmerQuery(message).match(
      /\b(?:token\s*(?:no\.?|number|#)?\s*|#)([a-z0-9-]+)\b/i
    );

  const requestedToken =
    tokenMatch?.[1] ||
    null;

  const target =
    (requestedToken
      ? rows.find(
          row =>
            editable.has(
              String(row?.status || "CONFIRMED").toUpperCase()
            ) &&
            String(
              row?.token ||
              row?.tokenNumber ||
              ""
            ).toLowerCase() ===
            String(requestedToken).toLowerCase()
        )
      : null) ||
    rows.find(row =>
      editable.has(
        String(row?.status || "CONFIRMED").toUpperCase()
      )
    ) ||
    null;

  if (!target) {
    return controllerResult(
      CONTROLLER_TYPES.ERROR,
      CONTROLLER_STATUS.FAILED,
      {
        action: wantsCancel ? "CANCEL_BOOKING" : "OPEN_BOOKING",
        reply:
          normalized.language === "hi"
            ? "मुझे आपकी ऐसी सक्रिय बुकिंग नहीं मिली जिसे बदला या रद्द किया जा सके।"
            : normalized.language === "te"
              ? "మార్చడానికి లేదా రద్దు చేయడానికి యాక్టివ్ బుకింగ్ దొరకలేదు."
              : "I couldn't find an active booking that can still be changed or cancelled.",
        shouldCallAI: false,
        shouldNavigate: false,
      }
    );
  }

  if (wantsEdit) {
    const targetPath =
      `/farmer/book?edit=${encodeURIComponent(target.id)}`;

    clearPendingAction();

    return controllerResult(
      CONTROLLER_TYPES.NAVIGATION,
      CONTROLLER_STATUS.SUCCESS,
      {
        action: "OPEN_BOOKING",
        reply:
          normalized.language === "hi"
            ? "ठीक है। आपकी बुकिंग संपादन के लिए खोल रहा हूँ।"
            : normalized.language === "te"
              ? "సరే. మీ బుకింగ్‌ను మార్చడానికి తెరుస్తున్నాను."
              : "Okay. I’m opening your booking so you can edit it.",
        booking: target,
        bookingId: target.id,
        navigateTo: targetPath,
        shouldNavigate: true,
        shouldCallAI: false,
        routeState: {
          assistantBookingEdit: target,
        },
      }
    );
  }

  const pending = {
    action: "CANCEL_ACTUAL_BOOKING",
    bookingId: target.id,
    booking: target,
    createdAt: Date.now(),
    reason: "Cancelled through KrishiSetu assistant",
  };

  savePendingAction(pending);

  const token =
    target.token ||
    target.id;

  return controllerResult(
    CONTROLLER_TYPES.CONFIRMATION,
    CONTROLLER_STATUS.PENDING,
    {
      action: "CANCEL_BOOKING",
      reply:
        normalized.language === "hi"
          ? `आपकी सक्रिय बुकिंग का टोकन #${token} है। इसे रद्द करने के लिए “हाँ” कहें।`
          : normalized.language === "te"
            ? `మీ యాక్టివ్ బుకింగ్ టోకెన్ #${token}. రద్దు చేయడానికి “అవును” అని చెప్పండి.`
            : `Your active booking is token #${token}. Say “yes” to cancel it.`,
      pendingAction: pending,
      booking: target,
      bookingId: target.id,
      shouldCallAI: false,
      shouldNavigate: false,
      createPending: true,
    }
  );
}


/* =========================================================
   RESOLVE FARMER BOOKINGS
========================================================= */

async function getFarmerBookings() {

  const farmer =
    getStoredFarmer();


  if (
    !farmer?.farmerId &&
    !farmer?.phone
  ) {

    return [];

  }


  try {

    const data =
      await controllerGetJson(
        "/bookings"
      );


    const rows =
      Array.isArray(
        data?.bookings
      )
        ? data.bookings
        : Array.isArray(
            data
          )
          ? data
          : [];


    const farmerId =
      String(
        farmer.farmerId ||
        ""
      );


    const farmerPhone =
      String(
        farmer.phone ||
        ""
      )
        .replace(
          /\D/g,
          ""
        );


    return rows.filter(
      row => {

        const rowFarmerId =
          String(
            row?.farmer_id ??
            row?.farmerId ??
            ""
          );


        const rowPhone =
          String(
            row?.farmer_phone ??
            row?.phone ??
            row?.mobile ??
            ""
          )
            .replace(
              /\D/g,
              ""
            );


        return (

          (
            farmerId &&
            rowFarmerId ===
              farmerId
          ) ||

          (
            farmerPhone &&
            rowPhone ===
              farmerPhone
          )

        );

      }
    );

  } catch {

    return [];

  }

}


/* =========================================================
   SORT BOOKINGS
========================================================= */

function sortBookings(
  rows
) {

  return [

    ...(
      Array.isArray(
        rows
      )
        ? rows
        : []
    ),

  ].sort(
    (
      a,
      b
    ) => {

      const aTime =
        String(
          a?.created_at ??
          a?.createdAt ??
          `${a?.date || ""} ${a?.slot_start || ""}`
        );


      const bTime =
        String(
          b?.created_at ??
          b?.createdAt ??
          `${b?.date || ""} ${b?.slot_start || ""}`
        );


      return bTime.localeCompare(
        aTime
      );

    }
  );

}


/* =========================================================
   FIND SPECIFIC FARMER BOOKING
========================================================= */

async function resolveFarmerBookingForAssistant(
  message,
  bookingState = null
) {

  const normalizedMessage =
    String(
      message ||
      ""
    )
      .toLowerCase();


  const rows =
    await getFarmerBookings();


  if (
    !rows.length
  ) {

    /*
     * A currently stored actual token can still be useful
     * when the page has the booking loaded.
     */

    const context =
      getFarmerContext();


    const contextBooking =
      context?.latestBooking ||
      context?.currentBooking ||
      null;


    if (
      contextBooking
    ) {

      return contextBooking;

    }


    return null;

  }


  const exactToken =
    normalizedMessage.match(
      /\b(?:token|टोकन|టోకెన్)\s*(?:no\.?|number|#)?\s*([a-z0-9-]+)\b/i
    )?.[1] ||
    null;


  if (
    exactToken
  ) {

    const match =
      rows.find(
        row =>
          String(
            row?.token ??
            row?.tokenNumber ??
            ""
          )
            .toLowerCase() ===
          exactToken.toLowerCase()
      );


    if (
      match
    ) {

      return match;

    }

  }


  const currentTokenRequested =
    /\b(this|current|latest|my)\s+token\b/i.test(
      normalizedMessage
    );


  if (
    currentTokenRequested
  ) {

    const draftToken =
      bookingState?.token;


    if (
      draftToken
    ) {

      const draftMatch =
        rows.find(
          row =>
            String(
              row?.token ||
              ""
            ) ===
            String(
              draftToken
            )
        );


      if (
        draftMatch
      ) {

        return draftMatch;

      }

    }


    const context =
      getFarmerContext();


    const contextToken =
      context?.currentToken?.token ||
      context?.latestToken?.token ||
      context?.currentToken?.tokenNumber ||
      context?.latestToken?.tokenNumber ||
      null;


    if (
      contextToken
    ) {

      const contextMatch =
        rows.find(
          row =>
            String(
              row?.token ||
              row?.tokenNumber ||
              ""
            ) ===
            String(
              contextToken
            )
        );


      if (
        contextMatch
      ) {

        return contextMatch;

      }

    }

  }


  const bookingId =
    bookingState?.bookingId;


  if (
    bookingId
  ) {

    const byId =
      rows.find(
        row =>
          String(
            row?.id ??
            ""
          ) ===
          String(
            bookingId
          )
      );


    if (
      byId
    ) {

      return byId;

    }

  }


  const now =
    new Date();


  const isoForOffset =
    offset => {

      const date =
        new Date(
          now
        );


      date.setHours(
        0,
        0,
        0,
        0
      );


      date.setDate(
        date.getDate() +
        Number(
          offset
        )
      );


      return (

        `${date.getFullYear()}-` +

        `${String(
          date.getMonth() +
          1
        ).padStart(
          2,
          "0"
        )}-` +

        `${String(
          date.getDate()
        ).padStart(
          2,
          "0"
        )}`

      );

    };


  const yesterdayRequested =
    /\b(yesterday|kal|कल)\b/i.test(
      normalizedMessage
    );


  const todayRequested =
    /\b(today|aaj|आज)\b/i.test(
      normalizedMessage
    );


  if (
    yesterdayRequested ||
    todayRequested
  ) {

    const targetDate =
      isoForOffset(
        yesterdayRequested
          ? -1
          : 0
      );


    const sameDay =
      rows.filter(
        row =>
          String(
            row?.date ??
            ""
          ) ===
          targetDate
      );


    if (
      sameDay.length
    ) {

      return sortBookings(
        sameDay
      )[0];

    }

  }


  /*
   * If "this booking" is requested, prefer the newest
   * active booking.
   */

  if (
    /\b(this|current)\s+booking\b/i.test(
      normalizedMessage
    )
  ) {

    const active =
      rows.filter(
        row =>
          ![
            "CANCELLED",
            "CANCELED",
            "REJECTED",
            "EXPIRED",
          ].includes(
            String(
              row?.status ??
              ""
            ).toUpperCase()
          )
      );


    if (
      active.length
    ) {

      return sortBookings(
        active
      )[0];

    }

  }


  return sortBookings(
    rows
  )[0] ||
  null;

}


/* =========================================================
   DOCUMENT REQUEST
========================================================= */

async function handleFarmerDocumentRequest(
  message,
  normalized,
  bookingState
) {

  const text =
    String(
      message ||
      ""
    ).toLowerCase();


  const mentionsQr =
    /\bqr(?:\s+code)?\b/i.test(
      text
    );


  const mentionsReceipt =
    /\breceipt\b/i.test(
      text
    ) ||
    /\bदस्तावेज़\b/i.test(
      text
    ) ||
    /\bरसीद\b/i.test(
      text
    ) ||
    /\bరసీదు\b/i.test(
      text
    );


  if (
    !mentionsQr &&
    !mentionsReceipt
  ) {

    return null;

  }


  /*
   * Do not intercept educational questions such as:
   *
   * "what is a QR code?"
   */

  const informational =
    /\bwhat\s+is\b.*\bqr\b/i.test(
      text
    ) ||
    /\bwhat\s+is\b.*\breceipt\b/i.test(
      text
    );


  if (
    informational
  ) {

    return null;

  }


  const actionable =
    /\b(download|save|get|show|open|view|give|send|provide)\b/i.test(
      text
    ) ||

    /\b(this|current|latest|my|yesterday|today|token|booking|बुकिंग|टोकन)\b/i.test(
      text
    );


  if (
    !actionable
  ) {

    return null;

  }


  const booking =
    await resolveFarmerBookingForAssistant(
      message,
      bookingState
    );


  if (
    !booking
  ) {

    return controllerResult(
      CONTROLLER_TYPES.ERROR,
      CONTROLLER_STATUS.FAILED,
      {

        action:
          "OPEN_TOKEN",

        reply:
          normalized.language ===
          "hi"

            ? "मुझे उस बुकिंग का रिकॉर्ड नहीं मिला।"

            : normalized.language ===
                "te"

              ? "ఆ బుకింగ్ రికార్డ్ దొరకలేదు."

              : "I couldn't find the booking record you're referring to.",

        shouldNavigate:
          false,

        shouldCallAI:
          false,

      }
    );

  }


  const assistantAction =
    mentionsReceipt
      ? "download-receipt"
      : "download-qr";


  const query =
    new URLSearchParams({

      booking:
        String(
          booking.id
        ),

      assistantAction,

    });


  const target =
    `/farmer/token?${query.toString()}`;


  if (
    typeof normalized.navigate ===
    "function"
  ) {

    normalized.navigate(
      target
    );


    return controllerResult(
      CONTROLLER_TYPES.NAVIGATION,
      CONTROLLER_STATUS.SUCCESS,
      {

        action:
          "OPEN_TOKEN",

        reply:
          normalized.language ===
          "hi"

            ? (
                mentionsReceipt
                  ? "ठीक है, उस बुकिंग की रसीद खोल रहा हूँ।"
                  : "ठीक है, उस बुकिंग का QR खोल रहा हूँ।"
              )

            : normalized.language ===
                "te"

              ? (
                  mentionsReceipt
                    ? "సరే, ఆ బుకింగ్ రసీదును తెరుస్తున్నాను."
                    : "సరే, ఆ బుకింగ్ QR ను తెరుస్తున్నాను."
                )

              : (
                  mentionsReceipt
                    ? "Okay. I’m opening that booking's receipt."
                    : "Okay. I’m opening that booking's QR."
                ),

        shouldNavigate:
          false,

        shouldCallAI:
          false,

        navigateTo:
          target,

        bookingId:
          booking.id,

        booking:
          {

            id:
              booking.id,

            token:
              booking.token ||
              booking.tokenNumber ||
              null,

            date:
              booking.date ||
              null,

          },

        assistantTokenAction:
          assistantAction,

      }
    );

  }


  return controllerResult(
    CONTROLLER_TYPES.NAVIGATION,
    CONTROLLER_STATUS.SUCCESS,
    {

      action:
        "OPEN_TOKEN",

      reply:
        mentionsReceipt
          ? "Opening that booking's receipt."
          : "Opening that booking's QR.",

      shouldNavigate:
        true,

      shouldCallAI:
        false,

      navigateTo:
        target,

      routeState:
        {

          assistantTokenAction:
            assistantAction,

        },

      bookingId:
        booking.id,

    }
  );

}


/* =========================================================
   FARMER DATA FORMATTING
========================================================= */

function bookingSummaryLine(
  booking,
  language
) {

  const crop =
    booking?.crop ||
    booking?.cropName ||
    "";


  const quantity =
    booking?.quantity ??
    booking?.estimatedQuantity ??
    "";


  const date =
    booking?.date ||
    "date unavailable";


  const token =
    booking?.token ||
    booking?.tokenNumber ||
    "";


  if (
    language ===
    "hi"
  ) {

    return (
      `${crop || "फसल"} — ` +
      `${quantity ? `${quantity} kg, ` : ""}` +
      `${date}` +
      `${token ? `, टोकन ${token}` : ""}`
    );

  }


  if (
    language ===
    "te"
  ) {

    return (
      `${crop || "పంట"} — ` +
      `${quantity ? `${quantity} kg, ` : ""}` +
      `${date}` +
      `${token ? `, టోకెన్ ${token}` : ""}`
    );

  }


  return (
    `${crop || "crop"} — ` +
    `${quantity ? `${quantity} kg, ` : ""}` +
    `${date}` +
    `${token ? `, token ${token}` : ""}`
  );

}


/* =========================================================
   FARMER DATA REQUEST
========================================================= */

function farmerBookingDate(
  booking
) {

  return (
    booking?.booking_date ||
    booking?.bookingDate ||
    booking?.date ||
    booking?.arrival_date ||
    booking?.arrivalDate ||
    ""
  );

}


function farmerBookingCrop(
  booking
) {

  return (
    booking?.crop ||
    booking?.crop_name ||
    booking?.cropName ||
    booking?.produce ||
    booking?.produce_name ||
    booking?.produceName ||
    ""
  );

}


function farmerBookingQuantity(
  booking
) {

  const value =
    booking?.quantity ??
    booking?.estimated_quantity ??
    booking?.estimatedQuantity ??
    booking?.quantity_kg ??
    booking?.quantityKg ??
    booking?.weight ??
    0;

  const number =
    Number(
      value
    );

  return Number.isFinite(
    number
  )
    ? number
    : 0;

}


function farmerBookingToken(
  booking
) {

  return (
    booking?.token ||
    booking?.tokenNumber ||
    booking?.token_number ||
    booking?.tokenNo ||
    ""
  );

}


function farmerBookingStatus(
  booking
) {

  return String(
    booking?.status ||
    booking?.booking_status ||
    booking?.bookingStatus ||
    ""
  )
    .trim()
    .toUpperCase();

}


function farmerPaymentAmount(
  booking
) {

  const payment =
    booking?.payment ||
    booking?.latestPayment ||
    booking?.latest_payment ||
    {};

  const value =
    booking?.payment_amount ??
    booking?.paymentAmount ??
    booking?.paid_amount ??
    booking?.paidAmount ??
    booking?.amount_paid ??
    booking?.amountPaid ??
    payment?.amount ??
    payment?.paidAmount ??
    payment?.total ??
    0;

  const number =
    Number(
      value
    );

  return Number.isFinite(
    number
  )
    ? number
    : 0;

}


function farmerPaymentStatus(
  booking
) {

  const payment =
    booking?.payment ||
    booking?.latestPayment ||
    booking?.latest_payment ||
    {};

  return String(
    booking?.payment_status ??
    booking?.paymentStatus ??
    payment?.status ??
    ""
  )
    .trim()
    .toUpperCase();

}


function farmerPaymentDate(
  booking
) {

  const payment =
    booking?.payment ||
    booking?.latestPayment ||
    booking?.latest_payment ||
    {};

  return (
    booking?.payment_date ||
    booking?.paymentDate ||
    booking?.payment_updated_at ||
    booking?.paymentUpdatedAt ||
    payment?.date ||
    payment?.paymentDate ||
    payment?.updatedAt ||
    farmerBookingDate(
      booking
    ) ||
    booking?.created_at ||
    booking?.createdAt ||
    ""
  );

}


function isFarmerPaymentCompleted(
  booking
) {

  const status =
    farmerPaymentStatus(
      booking
    );

  if (
    [
      "PAID",
      "PAYMENT_SENT",
      "COMPLETED",
      "SUCCESS",
      "SUCCESSFUL",
      "SETTLED",
      "RELEASED",
      "TRANSFERRED",
    ].includes(
      status
    )
  ) {
    return true;
  }

  if (
    booking?.payment_completed ===
      true ||
    booking?.paymentCompleted ===
      true ||
    booking?.is_paid ===
      true ||
    booking?.isPaid ===
      true
  ) {
    return true;
  }

  return false;

}


function isFarmerSuccessfulBooking(
  booking
) {

  const status =
    farmerBookingStatus(
      booking
    );

  if (
    [
      "COMPLETED",
      "SUCCESS",
      "SUCCESSFUL",
      "CONFIRMED",
      "APPROVED",
      "PROCURED",
      "COMPLETED_SUCCESSFULLY",
    ].includes(
      status
    )
  ) {
    return true;
  }

  return false;

}


function farmerNumberFromText(
  text,
  fallback = 5
) {

  const match =
    String(
      text ||
      ""
    ).match(
      /\b(?:last|latest|show|get)\s+(\d{1,2})\b/i
    );

  const number =
    Number(
      match?.[1] ||
      fallback
    );

  return Math.min(
    Math.max(
      Number.isFinite(
        number
      )
        ? number
        : fallback,
      1
    ),
    20
  );

}


function farmerPeriodFromText(
  text
) {

  const value =
    normalizeFarmerQuery(
      text
    );

  if (
    /\blast\s+month\b/i.test(
      value
    )
  ) {
    return "lastMonth";
  }

  if (
    /\bthis\s+month\b/i.test(
      value
    )
  ) {
    return "thisMonth";
  }

  if (
    /\blast\s+year\b/i.test(
      value
    )
  ) {
    return "lastYear";
  }

  if (
    /\bthis\s+year\b/i.test(
      value
    )
  ) {
    return "thisYear";
  }

  if (
    /\blast\s+week\b/i.test(
      value
    )
  ) {
    return "lastWeek";
  }

  if (
    /\bthis\s+week\b/i.test(
      value
    )
  ) {
    return "thisWeek";
  }

  return null;

}


function farmerDateRange(
  period
) {

  const now =
    new Date();

  const start =
    new Date(
      now
    );

  const end =
    new Date(
      now
    );

  if (
    period ===
    "lastMonth"
  ) {

    start.setDate(
      1
    );

    start.setMonth(
      start.getMonth() -
        1
    );

    end.setDate(
      1
    );

    end.setHours(
      0,
      0,
      0,
      0
    );

  } else if (
    period ===
    "thisMonth"
  ) {

    start.setDate(
      1
    );

    end.setMonth(
      end.getMonth() +
        1,
      1
    );

  } else if (
    period ===
    "lastYear"
  ) {

    start.setMonth(
      0,
      1
    );

    start.setFullYear(
      start.getFullYear() -
        1
    );

    end.setMonth(
      0,
      1
    );

  } else if (
    period ===
    "thisYear"
  ) {

    start.setMonth(
      0,
      1
    );

    end.setFullYear(
      end.getFullYear() +
        1,
      0,
      1
    );

  } else if (
    period ===
    "lastWeek"
  ) {

    const day =
      start.getDay();

    const distance =
      day ===
      0
        ? 6
        : day - 1;

    start.setDate(
      start.getDate() -
        distance -
        7
    );

    start.setHours(
      0,
      0,
      0,
      0
    );

    end.setTime(
      start.getTime()
    );

    end.setDate(
      end.getDate() +
        7
    );

  } else if (
    period ===
    "thisWeek"
  ) {

    const day =
      start.getDay();

    const distance =
      day ===
      0
        ? 6
        : day - 1;

    start.setDate(
      start.getDate() -
        distance
    );

    start.setHours(
      0,
      0,
      0,
      0
    );

    end.setTime(
      start.getTime()
    );

    end.setDate(
      end.getDate() +
        7
    );

  } else {

    return null;

  }

  return {
    start,
    end,
  };

}


function farmerRecordDateValue(
  booking,
  forPayment = false
) {

  const raw =
    forPayment
      ? farmerPaymentDate(
          booking
        )
      : (
          farmerBookingDate(
            booking
          ) ||
          booking?.created_at ||
          booking?.createdAt ||
          ""
        );

  if (
    !raw
  ) {
    return null;
  }

  const date =
    new Date(
      raw
    );

  return Number.isNaN(
    date.getTime()
  )
    ? null
    : date;

}


function farmerInPeriod(
  booking,
  period,
  forPayment = false
) {

  if (
    !period
  ) {
    return true;
  }

  const range =
    farmerDateRange(
      period
    );

  if (
    !range
  ) {
    return true;
  }

  const date =
    farmerRecordDateValue(
      booking,
      forPayment
    );

  if (
    !date
  ) {
    return false;
  }

  return (
    date >=
      range.start &&
    date <
      range.end
  );

}


function formatFarmerMoney(
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
    return "₹0";
  }

  return (
    `₹${number.toLocaleString(
      "en-IN",
      {
        maximumFractionDigits:
          2,
      }
    )}`
  );

}


async function handleFarmerDataRequest(
  message,
  normalized,
  bookingState
) {

  const text =
    normalizeFarmerQuery(
      message
    );

  const kind =
    getFarmerDataKind(
      text
    );

  if (
    !kind
  ) {
    return null;
  }

  const rows =
    sortBookings(
      await getFarmerBookings()
    );

  const latest =
    rows[0] ||
    null;

  const language =
    normalized.language;

  /*
   * REAL FARMER DATA ALWAYS COMES FROM ACTUAL BOOKING
   * RECORDS. A draft is never used as the latest token.
   */

  if (
    kind ===
    "token"
  ) {

    const exactToken =
      text.match(
        /\b(?:token|टोकन|టోకెన్)\s*(?:no\.?|number|#)?\s*([a-z0-9-]+)\b/i
      )?.[1] ||
      null;

    const tokenBooking =
      exactToken
        ? await resolveFarmerBookingForAssistant(
            message,
            null
          )
        : latest ||
          await resolveFarmerBookingForAssistant(
            message,
            null
          );

    if (
      !tokenBooking
    ) {

      return controllerResult(
        CONTROLLER_TYPES.ERROR,
        CONTROLLER_STATUS.FAILED,
        {
          action:
            "OPEN_TOKEN",
          reply:
            language ===
            "hi"
              ? "मुझे आपकी हाल की बुकिंग या टोकन रिकॉर्ड नहीं मिला।"
              : language ===
                  "te"
                ? "మీ ఇటీవలి బుకింగ్ లేదా టోకెన్ రికార్డ్ దొరకలేదు."
                : "I couldn't find a recent booking or token record for you.",
          shouldNavigate:
            false,
          shouldCallAI:
            false,
        }
      );

    }

    const token =
      farmerBookingToken(
        tokenBooking
      ) ||
      "not available";

    return controllerResult(
      CONTROLLER_TYPES.LOCAL,
      CONTROLLER_STATUS.SUCCESS,
      {
        action:
          "OPEN_TOKEN",

        reply:
          language ===
          "hi"
            ? `आपका नवीनतम टोकन ${token} है${farmerBookingDate(tokenBooking) ? `। बुकिंग तारीख ${farmerBookingDate(tokenBooking)} है।` : "।"}`
            : language ===
                "te"
              ? `మీ తాజా టోకెన్ ${token}${farmerBookingDate(tokenBooking) ? `. బుకింగ్ తేదీ ${farmerBookingDate(tokenBooking)}.` : "."}`
              : `Your latest token is ${token}${farmerBookingDate(tokenBooking) ? `. The booking date is ${farmerBookingDate(tokenBooking)}.` : "."}`,

        booking:
          tokenBooking,

        token,

        bookingId:
          tokenBooking.id ||
          null,

        shouldNavigate:
          false,

        shouldCallAI:
          false,

      }
    );

  }


  if (
    kind ===
    "crop"
  ) {

    if (
      !latest
    ) {
      return null;
    }

    const crop =
      farmerBookingCrop(
        latest
      ) ||
      "not available";

    return controllerResult(
      CONTROLLER_TYPES.LOCAL,
      CONTROLLER_STATUS.SUCCESS,
      {
        action:
          "SHOW_FARMER_DATA",

        reply:
          language ===
          "hi"
            ? `आपकी पिछली बुकिंग में फसल ${crop} थी।`
            : language ===
                "te"
              ? `మీ చివరి బుకింగ్‌లో పంట ${crop}.`
              : `The crop in your last booking was ${crop}.`,

        booking:
          latest,

        crop,

        bookingId:
          latest.id ||
          null,

        shouldNavigate:
          false,

        shouldCallAI:
          false,

      }
    );

  }


  if (
    kind ===
    "booking"
  ) {

    let booking =
      latest;

    if (
      /\b(current|this)\s+booking\b/i.test(
        text
      )
    ) {

      const active =
        rows.find(
          row =>
            ![
              "CANCELLED",
              "CANCELED",
              "REJECTED",
              "EXPIRED",
            ].includes(
              farmerBookingStatus(
                row
              )
            )
        );

      booking =
        active ||
        latest;

    }

    if (
      !booking
    ) {
      return null;
    }

    return controllerResult(
      CONTROLLER_TYPES.LOCAL,
      CONTROLLER_STATUS.SUCCESS,
      {
        action:
          "OPEN_HISTORY",

        reply:
          language ===
          "hi"
            ? `आपकी सबसे हाल की बुकिंग: ${bookingSummaryLine(booking, language)}।`
            : language ===
                "te"
              ? `మీ తాజా బుకింగ్: ${bookingSummaryLine(booking, language)}.`
              : `Your latest booking: ${bookingSummaryLine(booking, language)}.`,

        booking,

        bookingId:
          booking.id ||
          null,

        shouldNavigate:
          false,

        shouldCallAI:
          false,

      }
    );

  }


  if (
    kind ===
    "history"
  ) {

    const count =
      farmerNumberFromText(
        text,
        5
      );

    const recent =
      rows.slice(
        0,
        count
      );

    if (
      !recent.length
    ) {

      return controllerResult(
        CONTROLLER_TYPES.LOCAL,
        CONTROLLER_STATUS.SUCCESS,
        {
          action:
            "OPEN_HISTORY",
          reply:
            language ===
            "hi"
              ? "आपकी बुकिंग हिस्ट्री में अभी कोई रिकॉर्ड नहीं मिला।"
              : language ===
                  "te"
                ? "మీ బుకింగ్ చరిత్రలో ప్రస్తుతం రికార్డులు లేవు."
                : "I couldn't find any booking records in your history.",
          bookings:
            [],
          shouldNavigate:
            false,
          shouldCallAI:
            false,
        }
      );

    }

    const lines =
      recent.map(
        (
          booking,
          index
        ) =>
          `${index + 1}. ${bookingSummaryLine(booking, language)}`
      );

    return controllerResult(
      CONTROLLER_TYPES.LOCAL,
      CONTROLLER_STATUS.SUCCESS,
      {
        action:
          "OPEN_HISTORY",

        reply:
          language ===
          "hi"
            ? `आपकी हाल की ${recent.length} बुकिंग:\n${lines.join("\n")}`
            : language ===
                "te"
              ? `మీ ఇటీవలి ${recent.length} బుకింగ్స్:\n${lines.join("\n")}`
              : `Your recent ${recent.length} bookings:\n${lines.join("\n")}`,

        bookings:
          recent,

        shouldNavigate:
          false,

        shouldCallAI:
          false,

      }
    );

  }


  if (
    kind ===
    "payment"
  ) {

    const period =
      farmerPeriodFromText(
        text
      );

    const paymentRows =
      rows.filter(
        row =>
          farmerPaymentAmount(
            row
          ) >
          0 &&
          isFarmerPaymentCompleted(
            row
          )
      );

    const periodPayments =
      paymentRows.filter(
        row =>
          farmerInPeriod(
            row,
            period,
            true
          )
      );

    if (
      period
    ) {

      const total =
        periodPayments.reduce(
          (
            sum,
            row
          ) =>
            sum +
            farmerPaymentAmount(
              row
            ),
          0
        );

      const count =
        periodPayments.length;

      const reply =
        language ===
        "hi"
          ? `उस अवधि में आपको ${count} भुगतान मिला, कुल ${formatFarmerMoney(total)}।`
          : language ===
              "te"
            ? `ఆ కాలంలో మీకు ${count} చెల్లింపులు వచ్చాయి, మొత్తం ${formatFarmerMoney(total)}.`
            : `You received ${count} payment${count === 1 ? "" : "s"} in that period, totaling ${formatFarmerMoney(total)}.`;

      return controllerResult(
        CONTROLLER_TYPES.LOCAL,
        CONTROLLER_STATUS.SUCCESS,
        {
          action:
            "OPEN_PAYMENTS",

          reply,

          payments:
            periodPayments,

          totalAmount:
            total,

          shouldNavigate:
            false,

          shouldCallAI:
            false,

        }
      );

    }

    const recent =
      paymentRows.slice(
        0,
        5
      );

    if (
      !recent.length
    ) {

      return controllerResult(
        CONTROLLER_TYPES.LOCAL,
        CONTROLLER_STATUS.SUCCESS,
        {
          action:
            "OPEN_PAYMENTS",
          reply:
            language ===
            "hi"
              ? "मुझे अभी आपके भुगतान रिकॉर्ड में कोई सफल भुगतान नहीं मिला।"
              : language ===
                  "te"
                ? "మీ చెల్లింపు రికార్డుల్లో ప్రస్తుతం విజయవంతమైన చెల్లింపు దొరకలేదు."
                : "I couldn't find a completed payment in your records yet.",
          payments:
            [],
          totalAmount:
            0,
          shouldNavigate:
            false,
          shouldCallAI:
            false,
        }
      );

    }

    const total =
      recent.reduce(
        (
          sum,
          row
        ) =>
          sum +
          farmerPaymentAmount(
            row
          ),
        0
      );

    const paymentLines =
      recent.map(
        (
          row,
          index
        ) =>
          `${index + 1}. ${formatFarmerMoney(farmerPaymentAmount(row))}` +
          `${farmerPaymentDate(row) ? ` — ${farmerPaymentDate(row)}` : ""}` +
          `${farmerPaymentStatus(row) ? ` — ${farmerPaymentStatus(row)}` : ""}`
      );

    return controllerResult(
      CONTROLLER_TYPES.LOCAL,
      CONTROLLER_STATUS.SUCCESS,
      {
        action:
          "OPEN_PAYMENTS",

        reply:
          language ===
          "hi"
            ? `आपके हाल के भुगतान:\n${paymentLines.join("\n")}\nकुल ${formatFarmerMoney(total)}।`
            : language ===
                "te"
              ? `మీ ఇటీవలి చెల్లింపులు:\n${paymentLines.join("\n")}\nమొత్తం ${formatFarmerMoney(total)}.`
              : `Your recent payments:\n${paymentLines.join("\n")}\nTotal: ${formatFarmerMoney(total)}.`,

        payments:
          recent,

        totalAmount:
          total,

        shouldNavigate:
          false,

        shouldCallAI:
          false,

      }
    );

  }


  if (
    kind ===
    "procurement"
  ) {

    const period =
      farmerPeriodFromText(
        text
      );

    let records =
      period
        ? rows.filter(
            row =>
              farmerInPeriod(
                row,
                period
              )
          )
        : rows;

    const successful =
      records.filter(
        isFarmerSuccessfulBooking
      );

    const quantity =
      successful.reduce(
        (
          sum,
          row
        ) =>
          sum +
          farmerBookingQuantity(
            row
          ),
        0
      );

    const count =
      successful.length;

    if (
      /\b(success|successful|successfully|completed|confirmed|approved)\b/i.test(
        text
      )
    ) {

      return controllerResult(
        CONTROLLER_TYPES.LOCAL,
        CONTROLLER_STATUS.SUCCESS,
        {
          action:
            "SHOW_FARMER_DATA",

          reply:
            language ===
            "hi"
              ? `सफल खरीद/प्रोक्योरमेंट: ${count} रिकॉर्ड, कुल ${quantity} kg।`
              : language ===
                  "te"
                ? `విజయవంతమైన ప్రొక్యూర్‌మెంట్: ${count} రికార్డులు, మొత్తం ${quantity} kg.`
                : `Successful procurement: ${count} record${count === 1 ? "" : "s"}, totaling ${quantity} kg.`,

          bookings:
            successful,

          quantity,

          count,

          shouldNavigate:
            false,

          shouldCallAI:
            false,

        }
      );

    }

    const totalQuantity =
      records.reduce(
        (
          sum,
          row
        ) =>
          sum +
          farmerBookingQuantity(
            row
          ),
        0
      );

    return controllerResult(
      CONTROLLER_TYPES.LOCAL,
      CONTROLLER_STATUS.SUCCESS,
      {
        action:
          "SHOW_FARMER_DATA",

        reply:
          language ===
          "hi"
            ? `इस अवधि में आपकी कुल प्रोक्योरमेंट मात्रा ${totalQuantity} kg है, ${records.length} रिकॉर्ड के साथ।`
            : language ===
                "te"
              ? `ఈ కాలంలో మీ మొత్తం ప్రొక్యూర్‌మెంట్ పరిమాణం ${totalQuantity} kg, ${records.length} రికార్డులతో.`
              : `Your total procurement in that period is ${totalQuantity} kg across ${records.length} record${records.length === 1 ? "" : "s"}.`,

        bookings:
          records,

        quantity:
          totalQuantity,

        count:
          records.length,

        shouldNavigate:
          false,

        shouldCallAI:
          false,

      }
    );

  }

  /*
   * Fall through to backend AI only when the local farmer
   * records do not cover the question.
   */
  return null;

}

/* =========================================================
   LOCAL ROUTING
========================================================= */

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


  /*
   * Farmer data questions must not be mistaken for
   * booking-form updates.
   */

  if (
    isBookingDataQuestion(
      normalized.message
    )
  ) {

    return {

      decision:
        null,

      pending,

      booking:
        bookingState,

      farmerDataRequest:
        true,

    };

  }


  /*
   * Booking information and booking continuation are
   * handled locally.
   */

  const bookingInformationRequest =
    typeof assistantBooking.isBookingInformationRequest ===
      "function" &&

    assistantBooking.isBookingInformationRequest(
      normalized.message
    );


  const hasBookingDetails =
    Boolean(
      assistantBooking.extractCrop(
        normalized.message
      ) ||

      assistantBooking.extractQuantity(
        normalized.message
      ) ||

      assistantBooking.extractNaturalBookingDate(
        normalized.message,
        new Date()
      ) ||

      assistantBooking.extractTimeReference(
        normalized.message
      )
    );


  const bookingFollowUp =
    isBookingFollowUpMessage(
      normalized.message,
      bookingState
    );

  const explicitBookingCommand =
    extractExplicitBookingCommand(
      normalized.message
    );

  const canUseBookingDetails =
    bookingState.active ||
    explicitBookingCommand;

  if (
    bookingFollowUp ||
    bookingInformationRequest ||
    (
      hasBookingDetails &&
      canUseBookingDetails
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

        bookingState:
          bookingState,

        bookingDraft:
          bookingState,

      }
    );


  return {

    decision,

    pending,

    booking:
      bookingState,

  };

}


/* =========================================================
   CONTEXT
========================================================= */

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

      bookingState,

      bookingDraft:
        bookingState,

      bookingContext:
        normalized.bookingContext,

      semanticTopic:
        normalized.semanticTopic,

    });


  const serverContext =
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

      bookingState,

      bookingDraft:
        bookingState,

      bookingContext:
        normalized.bookingContext,

      semanticTopic:
        normalized.semanticTopic,

    });


  return {

    context,

    serverContext,

    pending,

    bookingState,

  };

}


/* =========================================================
   BACKEND REQUEST
========================================================= */

export function createBackendRequest(
  options = {}
) {

  const normalized =
    normalizeOptions(
      options
    );


  const farmer =
    getStoredFarmer();


  const bookingState =
    getEffectiveBookingState(
      normalized.bookingState
    );


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
      farmer?.farmerId ||
      farmer?.id ||
      null,

    phone:
      farmer?.phone ||
      null,

    history:
      normalized.history,

    context:
      {

        ...serverContext,

        booking:
          {

            state:
              bookingState,

          },

        bookingConversation:
          true,

        farmerContext:
          getFarmerContext(),

      },

    bookingState,

    bookingDraft:
      bookingState,

    semanticTopic:
      normalized.semanticTopic ||
      null,

    decision:
      normalized.decision ||
      null,

  };

}


/* =========================================================
   BACKEND AI
========================================================= */

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


/* =========================================================
   BACKEND DECISION
========================================================= */

export function processBackendDecision(
  localDecision,
  backendResponse,
  options = {}
) {

  const normalized =
    normalizeOptions(
      options
    );


  return {

    decision:
      mergeBackendDecision(
        localDecision,
        backendResponse,
        {

          language:
            normalized.language,

          originalText:
            normalized.message,

        }
      ),

  };

}


/* =========================================================
   EXECUTION
========================================================= */

async function executeLocalDecision(
  decision,
  options
) {

  if (
    !decision
  ) {

    return null;

  }


  const {

    navigate =
      null,

    currentPath =
      DEFAULT_PATH,

    language =
      DEFAULT_LANGUAGE,

  } =
    options;


  /*
   * BOOKING EXECUTION
   */

  if (
    decision.type ===
      CONTROLLER_TYPES.BOOKING ||

    decision.bookingCommand ||

    (
      decision.type ===
        "CONFIRM" &&
      (
        decision.action ===
          "OPEN_BOOKING" ||
        decision.action ===
          "CONFIRM_BOOKING"
      )
    )
  ) {

    const shouldExecute =
      Boolean(
        decision.shouldExecuteBooking
      ) ||

      decision.action ===
        "CONFIRM_BOOKING";


    if (
      shouldExecute
    ) {

      const state =
        assistantBooking.normalize(
          decision.bookingState ||
          decision.booking ||
          decision.params ||
          null
        );


      const submission =
        await submitBookingThroughFarmerBook(
          state,
          options
        );


      if (
        !submission.success
      ) {

        return controllerResult(
          CONTROLLER_TYPES.BOOKING,
          CONTROLLER_STATUS.FAILED,
          {

            ...decision,

            reply:
              submission.reason ||
              "I couldn’t complete the booking.",

            bookingState:
              submission.booking ||
              state,

            booking:
              submission.booking ||
              state,

            bookingSubmitted:
              false,

            shouldExecuteBooking:
              false,

            shouldNavigate:
              false,

          }
        );

      }


      if (
        submission.submitted
      ) {

        const submittedBooking =
          submission.submittedBooking ||
          null;


        return controllerResult(
          CONTROLLER_TYPES.BOOKING,
          CONTROLLER_STATUS.SUCCESS,
          {

            ...decision,

            action:
              "BOOKING_CONFIRMED",

            reply:
              language ===
              "hi"

                ? (
                    `बुकिंग सफलतापूर्वक पुष्टि हो गई` +
                    `${
                      submittedBooking?.token
                        ? `। आपका टोकन ${submittedBooking.token} है।`
                        : "।"
                    }`
                  )

                : language ===
                    "te"

                  ? (
                      `బుకింగ్ విజయవంతంగా నిర్ధారించబడింది` +
                      `${
                        submittedBooking?.token
                          ? `. మీ టోకెన్ ${submittedBooking.token}.`
                          : "."
                      }`
                    )

                  : (
                      `Booking confirmed successfully` +
                      `${
                        submittedBooking?.token
                          ? `. Your token is ${submittedBooking.token}.`
                          : "."
                      }`
                    ),

            confirmationDispatched:
              true,

            bookingSubmitted:
              true,

            bookingResult:
              submittedBooking,

            bookingState:
              submission.booking,

            booking:
              submission.booking,

            shouldExecuteBooking:
              false,

            awaitingConfirmation:
              false,

            shouldNavigate:
              false,

          }
        );

      }


      /*
       * Not mounted: navigation occurred and FarmerBook's
       * auto-confirm bridge will finish the actual POST.
       */

      return controllerResult(
        CONTROLLER_TYPES.BOOKING,
        CONTROLLER_STATUS.PENDING,
        {

          ...decision,

          action:
            "OPEN_BOOKING",

          reply:
            language ===
            "hi"

              ? "ठीक है। बुकिंग पेज खोल रहा हूँ और आपकी पुष्टि के बाद बुकिंग पूरी की जाएगी।"

              : language ===
                  "te"

                ? "సరే. బుకింగ్ పేజీని తెరుస్తున్నాను మరియు మీ అనుమతితో బుకింగ్ పూర్తవుతుంది."

                : "Okay. I’m opening the booking page to complete the authorized booking.",

          bookingState:
            submission.booking,

          booking:
            submission.booking,

          shouldExecuteBooking:
            true,

          pendingSubmission:
            true,

          ...submission.navigation,

        }
      );

    }


    return decision;

  }


  /*
   * CURRENT PAGE
   */

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


  /*
   * CANCEL
   */

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


  /*
   * NORMAL NAVIGATION / CONFIRMATION
   */

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

        bookingState:
          getEffectiveBookingState(
            options.bookingState
          ),

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


/* =========================================================
   MAIN COMMAND HANDLER
========================================================= */

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

  let bookingState =
    getEffectiveBookingState(
      normalized.bookingState
    );

  const affirmative =
    extractAffirmative(
      normalized.message
    );

  const negative =
    /^(no|nope|nah|not now|don't|do not|cancel that|never mind|n|नहीं|नही|मत करो|रहने दो|వద్దు|కాదు)[.!\s]*$/i.test(
      String(normalized.message || "").trim()
    );

  /*
   * =======================================================
   * ACTIVE ACTION CONFIRMATION
   *
   * A pending real-booking cancellation is deliberately
   * handled before the booking draft so a bare "yes" cannot
   * accidentally resume a procurement booking conversation.
   * =======================================================
   */

  const pendingAction =
    loadPendingAction();

  if (
    affirmative &&
    pendingAction?.action ===
      "CANCEL_ACTUAL_BOOKING"
  ) {
    return executeActualBookingCancellation(
      pendingAction,
      normalized
    );
  }

  if (
    negative &&
    pendingAction?.action ===
      "CANCEL_ACTUAL_BOOKING"
  ) {
    clearPendingAction();

    return controllerResult(
      CONTROLLER_TYPES.CANCELLATION,
      CONTROLLER_STATUS.CANCELLED,
      {
        action: "NONE",
        reply:
          normalized.language === "hi"
            ? "ठीक है। मैंने बुकिंग रद्द करने की कार्रवाई रोक दी है।"
            : normalized.language === "te"
              ? "సరే. బుకింగ్ రద్దు చర్యను ఆపేశాను."
              : "Okay. I kept the booking unchanged.",
        shouldCallAI: false,
        shouldNavigate: false,
      }
    );
  }

  /*
   * =======================================================
   * INTENT PRIORITY
   *
   * 1. Explicit navigation
   * 2. Farmer's real account/history/payment data
   * 3. Crop availability
   * 4. QR / receipt
   * 5. Booking
   * 6. Other local commands
   * 7. Backend AI
   *
   * An active booking draft is context only. It never becomes
   * the user's intent by itself.
   * =======================================================
   */

  const messageText =
    normalized.message;

  const navigationDecision =
    routeAssistantCommand(
      messageText,
      {
        currentPath:
          normalized.currentPath,
        language:
          normalized.language,
        pendingAction:
          null,
        bookingState:
          null,
      }
    );

  /*
   * "open/go to/show page" is navigation.
   * Never allow an unfinished booking to hijack it.
   */
  if (
    navigationDecision &&
    (
      navigationDecision.type ===
        "NAVIGATE" ||
      navigationDecision.type ===
        "GO_BACK"
    ) &&
    navigationDecision.action !==
      "OPEN_BOOKING"
  ) {
    return executeLocalDecision(
      navigationDecision,
      normalized
    );
  }

  /*
   * Farmer-specific data wins before booking state.
   * This fixes questions such as:
   *
   * "what was my laas tokeeen nummber"
   * "which crop i booked last time"
   * "how much money did we earn last month"
   * "how much procure was successful"
   */
  if (
    isBookingDataQuestion(
      messageText
    )
  ) {

    const farmerData =
      await handleFarmerDataRequest(
        messageText,
        normalized,
        bookingState
      );

    if (
      farmerData
    ) {
      return farmerData;
    }

  }

  /* =======================================================
     2. ACTUAL BOOKING EDIT / CANCEL
  ======================================================= */

  const actualBookingMutation =
    await handleActualBookingMutationRequest(
      normalized.message,
      normalized
    );

  if (actualBookingMutation) {
    return actualBookingMutation;
  }


  /* =======================================================
     3. CROP AVAILABILITY
  ======================================================= */

  if (
    isCropAvailabilityRequest(
      normalized.message
    )
  ) {

    const names =
      getAvailableCropNames(
        normalized.language
      );


    const reply =

      normalized.language ===
      "hi"

        ? `उपलब्ध फसलें हैं: ${names.join(
            ", "
          )}.`

        : normalized.language ===
            "te"

          ? `అందుబాటులో ఉన్న పంటలు: ${names.join(
              ", "
            )}.`

          : `The available crops are: ${names.join(
              ", "
            )}.`;


    return controllerResult(
      CONTROLLER_TYPES.LOCAL,
      CONTROLLER_STATUS.SUCCESS,
      {

        action:
          "SHOW_CROPS",

        reply,

        crops:
          names,

        shouldCallAI:
          false,

        shouldNavigate:
          false,

        bookingCommand:
          false,

      }
    );

  }


  /* =======================================================
     3. QR / RECEIPT
  ======================================================= */

  const documentRequest =
    await handleFarmerDocumentRequest(
      normalized.message,
      normalized,
      bookingState
    );


  if (
    documentRequest
  ) {

    return documentRequest;

  }


  /* =======================================================
     4. EXPLICIT NEW BOOKING DETAILS
  ======================================================= */

  const incomingCrop =
    assistantBooking.extractCrop(
      normalized.message
    );


  const incomingQuantity =
    assistantBooking.extractQuantity(
      normalized.message
    );


  const incomingDate =
    assistantBooking.extractNaturalBookingDate(
      normalized.message,
      new Date()
    );


  const incomingTime =
    assistantBooking.extractTimeReference(
      normalized.message
    );


  const explicitBookingStart =
    Boolean(

      (
        incomingCrop ||
        incomingQuantity
      ) &&

      extractExplicitBookingCommand(
        normalized.message
      )

    );


  /*
   * Starting a genuinely new booking must destroy stale
   * conversational state.
   */

  if (
    explicitBookingStart
  ) {

    clearPendingAction();

    clearBookingState();

    bookingState =
      assistantBooking.createEmpty();

  }


  /* =======================================================
     5. CONFIRM CURRENT BOOKING
  ======================================================= */

  if (
    affirmative &&
    bookingState.confirmed
  ) {

    return controllerResult(
      CONTROLLER_TYPES.BOOKING,
      CONTROLLER_STATUS.SUCCESS,
      {

        action:
          "BOOKING_ALREADY_CONFIRMED",

        reply:
          normalized.language ===
          "hi"

            ? "यह बुकिंग पहले ही सफलतापूर्वक पुष्टि हो चुकी है।"

            : normalized.language ===
                "te"

              ? "ఈ బుకింగ్ ఇప్పటికే విజయవంతంగా నిర్ధారించబడింది."

              : "That booking has already been successfully confirmed.",

        bookingState,

        booking:
          bookingState,

        shouldCallAI:
          false,

        shouldNavigate:
          false,

        shouldExecuteBooking:
          false,

        bookingCommand:
          true,

      }
    );

  }


  const pending =
  loadPendingAction();

const hasBookingConfirmationPending =
  Boolean(
    pending &&
    (
      pending.action ===
        "OPEN_BOOKING" ||

      pending.action ===
        "CONFIRM_BOOKING"
    ) &&

    (
      pending.booking ||
      pending.params
    )
  );if (
  affirmative &&
  hasBookingConfirmationPending
) { 

    const result =
      processBookingConversation(
        normalized.message,
        {

          ...normalized,

          bookingState,

        }
      );


    if (
      result?.handled &&
      result.intent ===
        BOOKING_INTENTS.CONFIRM
    ) {

      const decision =
        buildBookingControllerResult(
          result,
          normalized.message,
          normalized.language
        );


      const state =
        assistantBooking.normalize(
          result.state
        );


      return executeLocalDecision(

        {

          ...decision,

          bookingState:
            state,

          booking:
            state,

          shouldExecuteBooking:
            true,

          action:
            "CONFIRM_BOOKING",

        },

        {

          ...normalized,

          bookingState:
            state,

        }

      );

    }

  }


  /* =======================================================
     6. BOOKING DETECTION
  ======================================================= */

  const bookingInformationRequest =
    typeof assistantBooking.isBookingInformationRequest ===
      "function" &&

    assistantBooking.isBookingInformationRequest(
      normalized.message
    );


  const bookingFollowUp =
    isBookingFollowUpMessage(
      normalized.message,
      bookingState
    );

  const bookingLikely =
    explicitBookingStart ||
    bookingInformationRequest ||
    extractExplicitBookingCommand(
      normalized.message
    ) ||
    bookingFollowUp;


  /* =======================================================
     7. BOOKING CONVERSATION
  ======================================================= */

  if (
    bookingLikely
  ) {

    /*
     * A date/time in a new booking request must always
     * refresh availability rather than trusting an old
     * cached snapshot.
     */

    const availabilitySeed =
      incomingDate
        ? assistantBooking.mergeBookingDraft(

            bookingState,

            {

              date:
                incomingDate,

              slot:
                null,

              slotId:
                null,

              slotStart:
                null,

              slotEnd:
                null,

              slotDisplay:
                null,

              readyForConfirmation:
                false,

              awaitingConfirmation:
                false,

              confirmed:
                false,

            }

          )

        : bookingState;


    const liveBookingContext =
      await refreshLiveBookingAvailability(

        availabilitySeed,

        {

          force:

            explicitBookingStart ||

            Boolean(
              incomingDate ||
              incomingTime
            ) ||

            bookingInformationRequest,

          signal:
            normalized.signal,

        }

      );


    normalized.bookingContext =
      {

        ...(
          normalized.bookingContext ||
          {}
        ),

        ...(
          liveBookingContext ||
          {}
        ),

      };


    /*
     * Explicit booking page navigation remains ordinary
     * navigation.
     */

    const genericBookingPageRequest =

      (
        bookingState.active ||

        bookingInformationRequest
      ) &&

      /\b(open|show|go\s+to|take\s+me\s+to|navigate\s+to)\b.*\b(page|form|screen)\b/i.test(
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
        {

          ...normalized,

          bookingState:

            explicitBookingStart
              ? assistantBooking.createEmpty()
              : bookingState,

        }
      );


    /*
     * A date selection must always be followed by a fresh
     * slot availability lookup.
     */

    if (
      bookingResult?.handled &&
      bookingResult.intent ===
        BOOKING_INTENTS.SELECT_DATE
    ) {

      const freshAvailability =
        await refreshLiveBookingAvailability(

          bookingResult.state,

          {

            force:
              true,

            signal:
              normalized.signal,

          }

        );


      bookingResult = {

        ...bookingResult,

        slots:
          freshAvailability
            ?.availableSlots ||
          bookingResult.slots ||
          [],

        availableSlots:
          freshAvailability
            ?.availableSlots ||
          bookingResult.slots ||
          [],

      };


      normalized.bookingContext =
        {

          ...(
            normalized.bookingContext ||
            {}
          ),

          ...(
            freshAvailability ||
            {}
          ),

        };

    }


    /*
     * Handle bare "morning", "afternoon", "evening"
     * as a slot preference when availability exists.
     */

    if (
      bookingResult?.handled &&
      bookingResult.intent ===
        BOOKING_INTENTS.SELECT_DATE &&
      (
        /\b(morning|सुबह|ఉదయం)\b/i.test(
          normalized.message
        ) ||

        /\b(afternoon|दोपहर|మధ్యాహ్నం)\b/i.test(
          normalized.message
        ) ||

        /\b(evening|शाम|సాయంత్రం)\b/i.test(
          normalized.message
        )
      )
    ) {

      const slots =
        bookingResult.slots ||
        normalized.bookingContext
          ?.availableSlots ||
        [];


      const preferredSlot =
        assistantBooking.findSlotReference(
          normalized.message,
          slots
        );


      if (
        preferredSlot
      ) {

        const slotState =
          assistantBooking.mergeBookingDraft(

            bookingResult.state,

            {

              slot:
                preferredSlot,

              availabilityChecked:
                true,

              readyForConfirmation:
                false,

              awaitingConfirmation:
                false,

              confirmed:
                false,

            }

          );


        bookingResult =
          {

            handled:
              true,

            intent:
              BOOKING_INTENTS.SELECT_SLOT,

            state:
              assistantBooking.normalize(
                slotState
              ),

            selectedSlot:
              preferredSlot,

            review:
              assistantBooking.review(
                slotState,
                normalized.language
              ),

            nextStep:
              BOOKING_STEPS.REVIEW,

          };


        saveBookingState(
          slotState
        );

      }

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


      /*
       * Save pending confirmation after selecting a slot.
       */

      if (
        bookingDecision.createPending &&
        bookingDecision.pendingAction
      ) {

        savePendingAction(
          bookingDecision.pendingAction
        );

      }


      /*
       * One-shot authorized command:
       *
       * "yes book 234 kg paddy tomorrow 8 to 830"
       *
       * Once all details have been resolved, submit.
       */

      const readyNow =
        Boolean(
          bookingResult.readyForConfirmation
        ) ||

        Boolean(
          bookingResult.state
            ?.readyForConfirmation
        ) ||

        Boolean(
          bookingDecision.bookingState
            ?.readyForConfirmation
        );


      const immediateBookingApproval =
        isImmediateBookingApproval(
          normalized.message
        );

      const shouldImmediatelySubmit =
        immediateBookingApproval &&
        readyNow;


      if (
        bookingResult.intent ===
          BOOKING_INTENTS.CONFIRM ||
        shouldImmediatelySubmit
      ) {

        const state =
          assistantBooking.normalize(

            bookingResult.state ||

            bookingDecision.bookingState

          );


        return executeLocalDecision(

          {

            ...bookingDecision,

            type:
              CONTROLLER_TYPES.BOOKING,

            action:
              "CONFIRM_BOOKING",

            bookingIntent:
              BOOKING_INTENTS.CONFIRM,

            bookingState:
              state,

            booking:
              state,

            params:
              sanitizeActionParams(
                state
              ),

            shouldExecuteBooking:
              true,

            bookingCommand:
              true,

          },

          {

            ...normalized,

            bookingState:
              state,

          }

        );

      }


      /*
       * Pending confirmation.
       */

      if (
        bookingDecision.status ===
        CONTROLLER_STATUS.PENDING
      ) {

        return bookingDecision;

      }


      /*
       * Start/update from another page:
       * open FarmerBook while preserving the exact state.
       */

      const shouldOpenBookingPage =

        (

          bookingResult.intent ===
            BOOKING_INTENTS.START ||

          bookingResult.intent ===
            BOOKING_INTENTS.UPDATE ||

          bookingResult.intent ===
            BOOKING_INTENTS.SELECT_DATE

        ) &&

        bookingDecision.bookingState
          ?.active &&

        !isBookingPath(
          normalized.currentPath
        ) &&

        typeof normalized.navigate ===
        "function";


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
              `${bookingDecision.reply} ` +

              (
                normalized.language ===
                "hi"

                  ? "बुकिंग पेज भी खोल दिया है; बातचीत जारी रख सकते हैं।"

                  : normalized.language ===
                      "te"

                    ? "బుకింగ్ పేజీని కూడా తెరిచాను; ఇక్కడే సంభాషణ కొనసాగించవచ్చు."

                    : "I’ve also opened the booking page; you can keep the conversation here."

              ),

            ...navigation,

          }
        );

      }


      return bookingDecision;

    }

  }


  /* =======================================================
     8. OTHER LOCAL COMMANDS
  ======================================================= */

  const local =
    routeLocalCommand(
      normalized.message,
      {

        ...normalized,

        bookingState,

        bookingContext:
          normalized.bookingContext,

      }
    );


  if (
    local?.farmerDataRequest
  ) {

    const farmerData =
      await handleFarmerDataRequest(

        normalized.message,

        normalized,

        bookingState

      );


    if (
      farmerData
    ) {

      return farmerData;

    }

  }


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


  /* =======================================================
     9. BACKEND AI
  ======================================================= */

  let backendResponse;


  try {

    backendResponse =
      await requestAI({

        ...normalized,

        decision:
          localDecision,

        semanticTopic:
          localDecision?.intent
            ?.semanticTopic ||

          localDecision
            ?.semanticTopic ||

          normalized.semanticTopic ||

          null,

        bookingState,

        bookingDraft:
          bookingState,

      });

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


  /*
   * Validate backend navigation against the current
   * farmer context.
   */

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

        bookingState:
          bookingState,

        bookingDraft:
          bookingState,

        semanticTopic:
          backendResponse?.semanticTopic ||
          null,

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


  /*
   * Ordinary natural-language answer.
   */

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
          finalDecision
            ?.intent
            ?.semanticTopic ||
          null,

        booking:
          backendResponse?.booking ||
          null,

        bookingState:
          bookingState,

      }
    );

  }


  /* =======================================================
     10. EXECUTE BACKEND NAVIGATION
  ======================================================= */

  const plan =
    getExecutionPlan(
      finalDecision
    );


  /*
   * Backend booking actions should go through the booking
   * controller rather than ordinary route execution.
   */

  if (
    plan?.type ===
    "BOOKING"
  ) {

    const booking =
      backendResponse?.booking ||
      backendResponse?.bookingDraft ||
      finalDecision?.booking ||
      finalDecision?.params ||
      bookingState;


    return executeLocalDecision(

      {

        ...finalDecision,

        type:
          CONTROLLER_TYPES.BOOKING,

        bookingCommand:
          true,

        bookingState:
          booking,

        booking,

        params:
          booking,

        shouldExecuteBooking:
          Boolean(
            backendResponse?.executeBooking ||
            finalDecision?.executeBooking
          ),

      },

      {

        ...normalized,

        bookingState:
          booking,

      }

    );

  }


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




/* =========================================================
   PUBLIC HELPERS
========================================================= */

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


/* =========================================================
   CONFIRM PENDING
========================================================= */

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
      bookingState.readyForConfirmation ||
      bookingState.awaitingConfirmation
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


  if (
    pending.action ===
    "CANCEL_ACTUAL_BOOKING"
  ) {
    return executeActualBookingCancellation(
      pending,
      normalizeOptions(options)
    );
  }


  /*
   * Booking confirmations should go through the booking
   * conversation rather than generic navigation.
   */

  if (
    pending.action ===
      "OPEN_BOOKING" ||
    pending.action ===
      "CONFIRM_BOOKING"
  ) {

    const bookingState =
      assistantBooking.normalize(

        pending.booking ||

        pending.params ||

        loadBookingState()

      );


    clearPendingAction();


    return handleAssistantCommand(

      "yes",

      {

        ...options,

        bookingState,

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


/* =========================================================
   CANCEL PENDING
========================================================= */

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


/* =========================================================
   BOOKING STATE API
========================================================= */

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


/* =========================================================
   BOOKING MESSAGE API
========================================================= */

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


/* =========================================================
   BOOKING FORM COMMAND
========================================================= */

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

    awaitingConfirmation:
      booking.awaitingConfirmation,

    confirmed:
      booking.confirmed,

    token:
      booking.token ||
      null,

    bookingId:
      booking.bookingId ||
      null,

  };

}


/* =========================================================
   PREVIEW
========================================================= */

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
    createBackendRequest({

      ...normalized,

      decision:
        local.decision,

      bookingState:
        local.booking,

      bookingDraft:
        local.booking,

      semanticTopic:
        local.decision
          ?.intent
          ?.semanticTopic ||
        null,

    });


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


/* =========================================================
   CONTROLLER STATE
========================================================= */

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


/* =========================================================
   ACTION VALIDATION
========================================================= */

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

      bookingState:
        getEffectiveBookingState(
          normalized.bookingState
        ),

    });


  return validateActionForContext(

    action,

    context

  );

}


/* =========================================================
   CONTROLLER INFO
========================================================= */

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

      "maintain booking continuity",

      "handle dates",

      "handle live slot availability",

      "handle timings",

      "handle procurement centers",

      "handle booking confirmation",

      "handle farmer crops",

      "handle tokens",

      "handle booking history",

      "handle payments",

      "handle receipts",

      "handle QR requests",

      "support future cancellation",

      "route local commands",

      "manage pending actions",

      "call backend AI",

      "validate backend decisions",

      "execute approved actions",

    ],

  };

}


/* =========================================================
   CONTROLLER OBJECT
========================================================= */

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


/* =========================================================
   DEFAULT EXPORT
========================================================= */

export default assistantController;