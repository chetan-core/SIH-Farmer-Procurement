/* =========================================================
   KRISHISETU AI BOOKING
   Conversational booking state + live availability bridge.

   IMPORTANT:
   - Booking state is independent from FarmerBook React state.
   - Supports one-shot commands:
       "book 234 kg paddy tomorrow 8 to 8:30"
       "book 234 kg paddy tomorrow 8 to 830"
   - Supports follow-up commands:
       "tomorrow"
       "8 to 8:30"
       "8 to 830"
       "morning"
       "yes"
   - Does NOT directly submit the booking.
   - Final booking submission remains in FarmerBook/controller.
========================================================= */

export const BOOKING_FIELDS = {
  CROP: "crop",
  QUANTITY: "quantity",
  CENTER: "centerId",
  DATE: "date",
  SLOT: "slot",
};

export const BOOKING_STAGES = {
  EMPTY: "EMPTY",
  DETAILS: "DETAILS",
  CENTER: "CENTER",
  DATE: "DATE",
  AVAILABILITY: "AVAILABILITY",
  SLOT: "SLOT",
  CONFIRM: "CONFIRM",
  COMPLETE: "COMPLETE",
};

export const BOOKING_STEPS = {
  DETAILS: "DETAILS",
  CENTER: "CENTER",
  DATE: "DATE",
  AVAILABILITY: "AVAILABILITY",
  SLOT: "SLOT",
  REVIEW: "REVIEW",
  CONFIRM: "CONFIRM",
  COMPLETE: "COMPLETE",
};

export const BOOKING_ENGINE_VERSION =
  "2026-09-09-stable-flow-v3";

export const BOOKING_INTENTS = {
  NONE: "NONE",
  START: "START",
  UPDATE: "UPDATE",
  SHOW_STATE: "SHOW_STATE",
  SHOW_CENTERS: "SHOW_CENTERS",
  ASK_DATES: "ASK_DATES",
  SELECT_DATE: "SELECT_DATE",
  ASK_SLOTS: "ASK_SLOTS",
  SELECT_SLOT: "SELECT_SLOT",
  REVIEW: "REVIEW",
  CONFIRM: "CONFIRM",
  CANCEL: "CANCEL",
};

export const BOOKING_STORAGE_KEY =
  "krishisetu_ai_booking_draft";

export const BOOKING_STATE_STORAGE_KEY =
  "krishisetu_ai_booking_state";

export const BOOKING_AVAILABILITY_STORAGE_KEY =
  "krishisetu_ai_booking_availability";

export const BOOKING_SCHEMA_VERSION = 4;

const AVAILABILITY_TTL =
  5 * 60 * 1000;

const MAX_QUANTITY =
  50000;

const EVENT_BOOKING =
  "krishisetu:assistant-booking-updated";

const EVENT_AVAILABILITY =
  "krishisetu:assistant-availability-updated";

const EVENT_REQUEST_AVAILABILITY =
  "krishisetu:assistant-request-availability";


/* =========================================================
   CROP ALIASES
========================================================= */

const CROP_ALIASES = {

  wheat: [
    "wheat",
    "gehun",
    "gehu",
    "gehun crop",
    "गेहूं",
    "गेहू",
    "गेहूँ",
    "गहूं",
    "గోధుమ",
    "గోధుమలు",
  ],

  paddy: [
    "paddy",
    "rice",
    "dhan",
    "dhan crop",
    "ধান",
    "धान",
    "चावल",
    "धान की फसल",
    "వరి",
    "బియ్యం",
  ],

  maize: [
    "maize",
    "corn",
    "maka",
    "मक्का",
    "మొక్కజొన్న",
  ],

  cotton: [
    "cotton",
    "kapas",
    "कपास",
    "పత్తి",
  ],

};


const CROP_NAMES = {

  en: {
    wheat: "wheat",
    paddy: "paddy",
    maize: "maize",
    cotton: "cotton",
  },

  hi: {
    wheat: "गेहूं",
    paddy: "धान",
    maize: "मक्का",
    cotton: "कपास",
  },

  te: {
    wheat: "గోధుమ",
    paddy: "వరి",
    maize: "మొక్కజొన్న",
    cotton: "పత్తి",
  },

};


/* =========================================================
   BASIC HELPERS
========================================================= */

function clean(
  value
) {

  return String(
    value ?? ""
  )
    .trim()
    .replace(
      /\s+/g,
      " "
    );

}


function norm(
  value
) {

  return clean(
    value
  )
    .toLowerCase()
    .normalize(
      "NFKC"
    )
    .replace(
      /[^\p{L}\p{N}\s:/.,'\-–—]/gu,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();

}


function languageCode(
  value
) {

  const code =
    clean(
      value
    ).toLowerCase();


  if (
    code.startsWith(
      "hi"
    )
  ) {

    return "hi";

  }


  if (
    code.startsWith(
      "te"
    )
  ) {

    return "te";

  }


  return "en";

}


function validQuantity(
  value,
  max = MAX_QUANTITY
) {

  const number =
    Number(
      value
    );


  return (

    Number.isFinite(
      number
    ) &&

    number > 0 &&

    number <=
      Number(
        max
      )

  );

}


function isoDate(
  date
) {

  return [

    date.getFullYear(),

    String(
      date.getMonth() + 1
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

}


function dayStart(
  value = new Date()
) {

  const date =
    new Date(
      value
    );


  date.setHours(
    0,
    0,
    0,
    0
  );


  return date;

}


function addDays(
  days,
  now = new Date()
) {

  const date =
    dayStart(
      now
    );


  date.setDate(
    date.getDate() +
      Number(
        days
      )
  );


  return date;

}


/* =========================================================
   EVENTS
========================================================= */

function dispatch(
  name,
  detail
) {

  if (
    typeof window ===
    "undefined"
  ) {

    return;

  }


  try {

    window.dispatchEvent(
      new CustomEvent(
        name,
        {
          detail,
        }
      )
    );

  } catch {

    try {

      window.dispatchEvent(
        new Event(
          name
        )
      );

    } catch {
    }

  }

}


/* =========================================================
   STORAGE
========================================================= */

function readJson(
  key,
  fallback = null
) {

  if (
    typeof window ===
    "undefined"
  ) {

    return fallback;

  }


  try {

    const raw =
      localStorage.getItem(
        key
      );


    return raw
      ? JSON.parse(
          raw
        )
      : fallback;

  } catch {

    return fallback;

  }

}


function writeJson(
  key,
  value
) {

  if (
    typeof window ===
    "undefined"
  ) {

    return false;

  }


  try {

    localStorage.setItem(
      key,
      JSON.stringify(
        value
      )
    );


    return true;

  } catch {

    return false;

  }

}


function removeKey(
  key
) {

  if (
    typeof window ===
    "undefined"
  ) {

    return;

  }


  try {

    localStorage.removeItem(
      key
    );

  } catch {
  }

}


/* =========================================================
   CROP
========================================================= */

export function extractBookingCrop(
  message
) {

  const text =
    norm(
      message
    );


  if (
    !text
  ) {

    return null;

  }


  const words =
    text.split(
      /\s+/
    );


  for (
    const [
      crop,
      aliases,
    ] of Object.entries(
      CROP_ALIASES
    )
  ) {

    for (
      const alias of aliases
    ) {

      const normalizedAlias =
        norm(
          alias
        );


      if (
        !normalizedAlias
      ) {

        continue;

      }


      if (
        text ===
        normalizedAlias
      ) {

        return crop;

      }


      if (
        words.includes(
          normalizedAlias
        )
      ) {

        return crop;

      }


      if (
        text.includes(
          normalizedAlias
        )
      ) {

        return crop;

      }

    }

  }


  return null;

}


export const extractCrop =
  extractBookingCrop;


/* =========================================================
   QUANTITY
========================================================= */

export function extractBookingQuantity(
  message
) {

  const text =
    norm(
      message
    );


  if (
    !text
  ) {

    return null;

  }


  const explicit =
    text.match(
      /(\d+(?:\.\d+)?)\s*(kg|kgs|kilo|kilos|kilogram|kilograms|किलो|किलोग्राम|కిలో|కిలోలు)\b/i
    );


  if (
    explicit
  ) {

    const value =
      Number(
        explicit[1]
      );


    return validQuantity(
      value
    )
      ? value
      : null;

  }


  if (
    /^\d+(?:\.\d+)?$/.test(
      text
    )
  ) {

    const value =
      Number(
        text
      );


    return validQuantity(
      value
    )
      ? value
      : null;

  }


  /*
   * Bare quantity in a natural booking sentence.
   */

  const bare =
    text.match(
      /\b(\d+(?:\.\d+)?)\b/
    );


  if (
    bare &&
    (
      extractBookingCrop(
        text
      ) ||
      /\b(book|booking|slot|procurement)\b/i.test(
        text
      )
    )
  ) {

    const value =
      Number(
        bare[1]
      );


    return validQuantity(
      value
    )
      ? value
      : null;

  }


  return null;

}


export const extractQuantity =
  extractBookingQuantity;


/* =========================================================
   CENTER
========================================================= */

export function normalizeCenter(
  value
) {

  const text =
    clean(
      value
    );


  return text ||
    null;

}


/* =========================================================
   DATE
========================================================= */

export function normalizeBookingDate(
  value
) {

  if (
    !value
  ) {

    return null;

  }


  const text =
    clean(
      value
    );


  /*
   * YYYY-MM-DD
   */

  const iso =
    text.match(
      /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/
    );


  if (
    iso
  ) {

    const year =
      Number(
        iso[1]
      );

    const month =
      Number(
        iso[2]
      );

    const day =
      Number(
        iso[3]
      );


    const date =
      new Date(
        year,
        month - 1,
        day
      );


    if (
      date.getFullYear() ===
        year &&
      date.getMonth() ===
        month - 1 &&
      date.getDate() ===
        day
    ) {

      return isoDate(
        date
      );

    }

  }


  /*
   * DD/MM/YYYY
   */

  const slash =
    text.match(
      /^(\d{1,2})\/(\d{1,2})\/(20\d{2})$/
    );


  if (
    slash
  ) {

    const day =
      Number(
        slash[1]
      );

    const month =
      Number(
        slash[2]
      );

    const year =
      Number(
        slash[3]
      );


    const date =
      new Date(
        year,
        month - 1,
        day
      );


    if (
      date.getFullYear() ===
        year &&
      date.getMonth() ===
        month - 1 &&
      date.getDate() ===
        day
    ) {

      return isoDate(
        date
      );

    }

  }


  /*
   * DD-MM-YYYY
   */

  const dash =
    text.match(
      /^(\d{1,2})-(\d{1,2})-(20\d{2})$/
    );


  if (
    dash
  ) {

    const day =
      Number(
        dash[1]
      );

    const month =
      Number(
        dash[2]
      );

    const year =
      Number(
        dash[3]
      );


    const date =
      new Date(
        year,
        month - 1,
        day
      );


    if (
      date.getFullYear() ===
        year &&
      date.getMonth() ===
        month - 1 &&
      date.getDate() ===
        day
    ) {

      return isoDate(
        date
      );

    }

  }


  return null;

}


export function extractNaturalBookingDate(
  message,
  now = new Date()
) {

  const text =
    norm(
      message
    );


  if (
    !text
  ) {

    return null;

  }


  if (
    /\b(today|aaj|आज|इस\s+दिन|ఈ రోజు|నేడు)\b/i.test(
      text
    )
  ) {

    return isoDate(
      new Date(
        now
      )
    );

  }


  if (
    /\b(tomorrow|tommorow|tommorrow|tomorow|tmrw|kal|कल|రేపు)\b/i.test(
      text
    )
  ) {

    return isoDate(
      addDays(
        1,
        now
      )
    );

  }


  if (
    /\b(day after tomorrow|day after tommorrow|परसों|ఎల్లుండి)\b/i.test(
      text
    )
  ) {

    return isoDate(
      addDays(
        2,
        now
      )
    );

  }


  const inDays =
    text.match(
      /\bin\s+(\d{1,3})\s+(day|days)\b/i
    );


  if (
    inDays
  ) {

    return isoDate(
      addDays(
        Number(
          inDays[1]
        ),
        now
      )
    );

  }


  const hindiDays =
    text.match(
      /(\d{1,3})\s*(दिन)\s*(बाद)?/i
    );


  if (
    hindiDays
  ) {

    return isoDate(
      addDays(
        Number(
          hindiDays[1]
        ),
        now
      )
    );

  }


  const weekday =
    extractWeekdayDate(
      text,
      now
    );


  if (
    weekday
  ) {

    return weekday;

  }


  return normalizeBookingDate(
    text
  );

}


function weekdayIndex(
  name
) {

  return {

    sunday:
      0,

    sun:
      0,

    monday:
      1,

    mon:
      1,

    tuesday:
      2,

    tue:
      2,

    tues:
      2,

    wednesday:
      3,

    wed:
      3,

    thursday:
      4,

    thu:
      4,

    thurs:
      4,

    friday:
      5,

    fri:
      5,

    saturday:
      6,

    sat:
      6,

  }[
    name
  ];

}


function extractWeekdayDate(
  text,
  now
) {

  const match =
    text.match(
      /\b(next\s+)?(sunday|sun|monday|mon|tuesday|tue|tues|wednesday|wed|thursday|thu|thurs|friday|fri|saturday|sat)\b/i
    );


  if (
    !match
  ) {

    return null;

  }


  const weekdayName =
    match[2]
      .toLowerCase();


  const targetDay =
    weekdayIndex(
      weekdayName
    );


  if (
    targetDay ===
      undefined
  ) {

    return null;

  }


  const currentDay =
    new Date(
      now
    ).getDay();


  const wantsNext =
    Boolean(
      match[1]
    );


  let delta =
    (
      targetDay -
      currentDay +
      7
    ) %
    7;


  if (
    delta === 0 ||
    wantsNext
  ) {

    delta += 7;

  }


  return isoDate(
    addDays(
      delta,
      now
    )
  );

}


export function getDateReference(
  value
) {

  const dateText =
    normalizeBookingDate(
      value
    );


  if (
    !dateText
  ) {

    return null;

  }


  const date =
    new Date(
      `${dateText}T00:00:00`
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return null;

  }


  return {

    date:
      dateText,

    year:
      date.getFullYear(),

    month:
      date.getMonth() + 1,

    day:
      date.getDate(),

    weekday:
      date.toLocaleDateString(
        "en-IN",
        {
          weekday:
            "long",
        }
      ),

    label:
      date.toLocaleDateString(
        "en-IN",
        {

          weekday:
            "long",

          day:
            "numeric",

          month:
            "long",

          year:
            "numeric",

        }
      ),

  };

}


/* =========================================================
   TIME HELPERS
========================================================= */

/*
 * Accept:
 *
 * 8
 * 08
 * 8:00
 * 8.00
 * 8 am
 * 8 pm
 * 830
 * 0830
 * 8:30
 *
 * Compact 3/4 digit values:
 *
 * 830  -> 08:30
 * 1230 -> 12:30
 */

function parseTimeValue(
  value
) {

  const text =
    clean(
      value
    )
      .toLowerCase()
      .replace(
        /\./g,
        ":"
      )
      .trim();


  if (
    !text
  ) {

    return null;

  }


  const compact =
    text.match(
      /^(\d{3,4})\s*(am|pm)?$/i
    );


  if (
    compact
  ) {

    const digits =
      compact[1];


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


    return makeTimeValue(
      hours,
      minutes,
      compact[2]
    );

  }


  const regular =
    text.match(
      /^(\d{1,2})(?::(\d{1,2}))?\s*(am|pm)?$/i
    );


  if (
    !regular
  ) {

    return null;

  }


  const hours =
    Number(
      regular[1]
    );


  const minutes =
    Number(
      regular[2] ||
        0
    );


  return makeTimeValue(
    hours,
    minutes,
    regular[3]
  );

}


function makeTimeValue(
  rawHours,
  rawMinutes,
  meridiem
) {

  let hours =
    Number(
      rawHours
    );


  const minutes =
    Number(
      rawMinutes
    );


  if (
    !Number.isFinite(
      hours
    ) ||
    !Number.isFinite(
      minutes
    ) ||
    minutes < 0 ||
    minutes > 59
  ) {

    return null;

  }


  const suffix =
    meridiem?.toLowerCase() ||
    "";


  if (
    suffix
  ) {

    if (
      hours < 1 ||
      hours > 12
    ) {

      return null;

    }


    if (
      suffix ===
        "pm" &&
      hours !== 12
    ) {

      hours +=
        12;

    }


    if (
      suffix ===
        "am" &&
      hours === 12
    ) {

      hours =
        0;

    }

  } else {

    if (
      hours >
      23
    ) {

      return null;

    }

  }


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


function time24(
  value
) {

  return parseTimeValue(
    value
  );

}


function timeToMinutes(
  value
) {

  const normalized =
    time24(
      value
    );


  if (
    !normalized
  ) {

    return null;

  }


  const [
    hours,
    minutes,
  ] =
    normalized
      .split(
        ":"
      )
      .map(
        Number
      );


  return (
    hours * 60 +
    minutes
  );

}


function minutesToTime(
  total
) {

  const safeTotal =
    Number(
      total
    );


  if (
    !Number.isFinite(
      safeTotal
    )
  ) {

    return null;

  }


  const hours =
    Math.floor(
      safeTotal /
      60
    );


  const minutes =
    safeTotal %
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


function formatDisplayTime(
  value
) {

  const minutes =
    timeToMinutes(
      value
    );


  if (
    minutes == null
  ) {

    return clean(
      value
    );

  }


  const hours =
    Math.floor(
      minutes /
      60
    );


  const minute =
    minutes %
    60;


  const displayHour =
    hours %
      12 ||
    12;


  const suffix =
    hours >= 12
      ? "PM"
      : "AM";


  return (

    `${displayHour}:` +

    `${String(
      minute
    ).padStart(
      2,
      "0"
    )} ${suffix}`

  );

}


function formatSlotDisplay(
  start,
  end
) {

  if (
    !start
  ) {

    return clean(
      end
    );

  }


  if (
    !end
  ) {

    return formatDisplayTime(
      start
    );

  }


  return (

    `${formatDisplayTime(
      start
    )} – ` +

    `${formatDisplayTime(
      end
    )}`

  );

}


/* =========================================================
   SLOT NORMALIZATION
========================================================= */

export function normalizeBookingSlot(
  value
) {

  if (
    !value
  ) {

    return null;

  }


  if (
    typeof value ===
    "object"
  ) {

    const rawStart =
      value.start ??
      value.startTime ??
      value.from ??
      value.begin ??
      "";


    const rawEnd =
      value.end ??
      value.endTime ??
      value.to ??
      value.finish ??
      "";


    const start =
      time24(
        rawStart
      ) ||
      clean(
        rawStart
      );


    const end =
      time24(
        rawEnd
      ) ||
      clean(
        rawEnd
      );


    if (
      !start &&
      !end
    ) {

      return null;

    }


    return {

      id:
        clean(
          value.id
        ) ||
        (
          start &&
          end
            ? `${start}-${end}`
            : start
        ),

      start,

      end,

      display:
        clean(
          value.display ||
          value.label
        ) ||
        formatSlotDisplay(
          start,
          end
        ),

      centerId:
        value.centerId ??
        value.center_id ??
        null,

    };

  }


  const text =
    clean(
      value
    );


  if (
    !text
  ) {

    return null;

  }


  const normalizedText =
    text.replace(
      /\b(to|until|till)\b/gi,
      "-"
    );


  const range =
    normalizedText.match(
      /(\d{1,4}(?::\d{1,2})?\s*(?:am|pm)?)\s*(?:-|–|—)\s*(\d{1,4}(?::\d{1,2})?\s*(?:am|pm)?)/i
    );


  if (
    range
  ) {

    let start =
      time24(
        range[1]
      );


    let end =
      time24(
        range[2]
      );


    /*
     * Handle:
     *
     * 8 to 8:30
     * 8 to 830
     * 8:00 to 830
     * 8am to 830am
     */

    if (
      start &&
      end
    ) {

      const startMinutes =
        timeToMinutes(
          start
        );


      let endMinutes =
        timeToMinutes(
          end
        );


      /*
       * If both are plain 12-hour-looking values and
       * end appears earlier, try PM for the end.
       */

      if (
        startMinutes != null &&
        endMinutes != null &&
        endMinutes <=
          startMinutes
      ) {

        const candidate =
          endMinutes +
          12 * 60;


        if (
          candidate >
          startMinutes &&
          candidate <
          24 * 60
        ) {

          end =
            minutesToTime(
              candidate
            );

          endMinutes =
            candidate;

        }

      }


      return {

        id:
          `${start}-${end}`,

        start,

        end,

        display:
          formatSlotDisplay(
            start,
            end
          ),

      };

    }

  }


  const single =
    time24(
      text
    );


  if (
    single
  ) {

    return {

      id:
        single,

      start:
        single,

      end:
        "",

      display:
        formatSlotDisplay(
          single,
          ""
        ),

    };

  }


  return {

    id:
      text,

    start:
      text,

    end:
      "",

    display:
      text,

  };

}


/* =========================================================
   TIME REFERENCE EXTRACTION
========================================================= */

export function extractTimeReference(
  message
) {

  const text =
    norm(
      message
    );


  if (
    !text
  ) {

    return null;

  }


  const normalizedText =
    text.replace(
      /\b(to|until|till)\b/gi,
      "-"
    );


  /*
   * Range.
   */

  const range =
    normalizedText.match(
      /(\d{1,4}(?::\d{1,2})?\s*(?:am|pm)?)\s*(?:-|–|—)\s*(\d{1,4}(?::\d{1,2})?\s*(?:am|pm)?)/i
    );


  if (
    range
  ) {

    return normalizeBookingSlot(
      `${range[1]}-${range[2]}`
    );

  }


  /*
   * Explicit AM/PM.
   */

  const twelve =
    text.match(
      /\b(\d{1,4}(?::\d{1,2})?\s*(?:am|pm))\b/i
    );


  if (
    twelve
  ) {

    return normalizeBookingSlot(
      twelve[1]
    );

  }


  /*
   * 24-hour HH:MM.
   */

  const twentyFour =
    text.match(
      /\b([01]?\d|2[0-3]):[0-5]\d\b/
    );


  if (
    twentyFour
  ) {

    return normalizeBookingSlot(
      twentyFour[0]
    );

  }


  /*
   * Contextual:
   *
   * at 8
   * around 8
   * about 8
   */

  const contextual =
    text.match(
      /\b(?:at|around|about|near|approximately)\s+(\d{1,4})(?:\s*(am|pm))?\b/i
    );


  if (
    contextual
  ) {

    return normalizeBookingSlot(
      `${contextual[1]}${
        contextual[2]
          ? ` ${contextual[2]}`
          : ""
      }`
    );

  }


  /*
   * 8 morning
   * 8 in the morning
   */

  const morning =
    text.match(
      /\b(\d{1,2})\s*(?:in the morning|morning)\b/i
    );


  if (
    morning
  ) {

    return normalizeBookingSlot(
      `${morning[1]} am`
    );

  }


  const afternoon =
    text.match(
      /\b(\d{1,2})\s*(?:in the afternoon|afternoon)\b/i
    );


  if (
    afternoon
  ) {

    return normalizeBookingSlot(
      `${afternoon[1]} pm`
    );

  }


  return null;

}


/* =========================================================
   DATE MATCHING
========================================================= */

export function findAvailableDate(
  message,
  availableDates = [],
  now = new Date()
) {

  const text =
    norm(
      message
    );


  if (
    !text ||
    !Array.isArray(
      availableDates
    )
  ) {

    return null;

  }


  const normalizedDates =
    availableDates
      .map(
        item => {

          const dateValue =
            item?.date ||
            item?.id ||
            item?.value ||
            "";


          return {

            item,

            date:
              normalizeBookingDate(
                dateValue
              ),

            label:
              norm(
                item?.label ||
                item?.name ||
                dateValue
              ),

          };

        }
      );


  const natural =
    extractNaturalBookingDate(
      text,
      now
    );


  if (
    natural
  ) {

    const exact =
      normalizedDates.find(
        entry =>
          entry.date ===
          natural
      );


    if (
      exact
    ) {

      return exact.item;

    }

  }


  const explicit =
    normalizeBookingDate(
      text
    );


  if (
    explicit
  ) {

    const exact =
      normalizedDates.find(
        entry =>
          entry.date ===
          explicit
      );


    if (
      exact
    ) {

      return exact.item;

    }

  }


  const weekdayDate =
    extractWeekdayDate(
      text,
      now
    );


  if (
    weekdayDate
  ) {

    const exact =
      normalizedDates.find(
        entry =>
          entry.date ===
          weekdayDate
      );


    if (
      exact
    ) {

      return exact.item;

    }

  }


  /*
   * Match labels such as:
   *
   * "Thursday 10 September"
   * "10 Sep"
   */

  const labelMatch =
    normalizedDates.find(
      entry =>
        entry.label &&
        (
          text.includes(
            entry.label
          ) ||
          entry.label.includes(
            text
          )
        )
    );


  return (
    labelMatch?.item ||
    null
  );

}


/* =========================================================
   CENTER MATCHING
========================================================= */

export function findAvailableCenter(
  message,
  availableCenters = []
) {

  const text =
    norm(
      message
    );


  if (
    !text ||
    !Array.isArray(
      availableCenters
    )
  ) {

    return null;

  }


  return (
    availableCenters.find(
      center => {

        const id =
          norm(
            center?.id
          );


        const name =
          norm(
            center?.name ||
            center?.centerName ||
            center?.title
          );


        return (

          (
            id &&
            text.includes(
              id
            )
          ) ||

          (
            name &&
            text.includes(
              name
            )
          )

        );

      }
    ) ||
    null
  );

}


/* =========================================================
   TIME NORMALIZATION FOR AVAILABILITY
========================================================= */

function normalizeTimeLike(
  value
) {

  if (
    value ===
    null ||
    value ===
    undefined
  ) {

    return null;

  }


  const parsed =
    time24(
      value
    );


  if (
    parsed
  ) {

    return parsed;

  }


  const text =
    clean(
      value
    );


  const hhmm =
    text.match(
      /(\d{1,2}):(\d{2})/
    );


  if (
    hhmm
  ) {

    return time24(
      `${hhmm[1]}:${hhmm[2]}`
    );

  }


  return null;

}


/* =========================================================
   SLOT MATCHING
========================================================= */

export function findSlotReference(
  message,
  availableSlots = []
) {

  const text =
    norm(
      message
    );


  if (
    !text ||
    !Array.isArray(
      availableSlots
    )
  ) {

    return null;

  }


  const requested =
    extractTimeReference(
      text
    );


  if (
    requested
  ) {

    const requestedStart =
      timeToMinutes(
        requested.start
      );


    const requestedEnd =
      timeToMinutes(
        requested.end
      );


    /*
     * First try exact start/end.
     */

    const exact =
      availableSlots.find(
        item => {

          const itemStart =
            timeToMinutes(
              item?.start ??
              item?.startTime ??
              item?.from
            );


          const itemEnd =
            timeToMinutes(
              item?.end ??
              item?.endTime ??
              item?.to
            );


          if (
            requestedStart ==
              null ||
            itemStart ==
              null
          ) {

            return false;

          }


          if (
            requestedEnd ==
              null
          ) {

            return (
              itemStart ===
              requestedStart
            );

          }


          return (

            itemStart ===
            requestedStart &&

            itemEnd ===
            requestedEnd

          );

        }
      );


    if (
      exact
    ) {

      return exact;

    }


    /*
     * Normalize backend slot IDs/labels.
     */

    const normalizedStart =
      requested.start;


    const normalizedEnd =
      requested.end;


    const fallback =
      availableSlots.find(
        item => {

          const itemStart =
            normalizeTimeLike(
              item?.start ??
              item?.startTime ??
              item?.from
            );


          const itemEnd =
            normalizeTimeLike(
              item?.end ??
              item?.endTime ??
              item?.to
            );


          return (

            itemStart ===
              normalizedStart &&

            (
              !normalizedEnd ||
              itemEnd ===
                normalizedEnd
            )

          );

        }
      );


    if (
      fallback
    ) {

      return fallback;

    }


    /*
     * Final display-label matching.
     */

    const requestedDisplay =
      norm(
        formatSlotDisplay(
          requested.start,
          requested.end
        )
      );


    return (

      availableSlots.find(
        item =>
          norm(
            item?.display ||
            item?.label ||
            ""
          ).includes(
            requestedDisplay
          )
      ) ||
      null

    );

  }


  /*
   * First available.
   */

  if (
    /\b(first|earliest|first available)\b/i.test(
      text
    )
  ) {

    return (
      availableSlots[0] ||
      null
    );

  }


  /*
   * Morning.
   */

  if (
    /\b(morning|सुबह|ఉదయం)\b/i.test(
      text
    )
  ) {

    return (

      availableSlots.find(
        item => {

          const minutes =
            timeToMinutes(
              item?.start ??
              item?.startTime ??
              item?.from
            );


          return (

            minutes !=
              null &&

            minutes <
              12 * 60

          );

        }
      ) ||
      null

    );

  }


  /*
   * Afternoon.
   */

  if (
    /\b(afternoon|दोपहर|మధ్యాహ్నం)\b/i.test(
      text
    )
  ) {

    return (

      availableSlots.find(
        item => {

          const minutes =
            timeToMinutes(
              item?.start ??
              item?.startTime ??
              item?.from
            );


          return (

            minutes !=
              null &&

            minutes >=
              12 * 60 &&

            minutes <
              17 * 60

          );

        }
      ) ||
      null

    );

  }


  /*
   * Evening.
   */

  if (
    /\b(evening|शाम|సాయంత్రం)\b/i.test(
      text
    )
  ) {

    return (

      availableSlots.find(
        item => {

          const minutes =
            timeToMinutes(
              item?.start ??
              item?.startTime ??
              item?.from
            );


          return (

            minutes !=
              null &&

            minutes >=
              17 * 60

          );

        }
      ) ||
      null

    );

  }


  return null;

}


/* =========================================================
   SLOT FIELDS
========================================================= */

function slotFromFields(
  source = {}
) {

  if (
    source.slot
  ) {

    return normalizeBookingSlot(
      source.slot
    );

  }


  if (
    source.selectedSlot
  ) {

    return normalizeBookingSlot(
      source.selectedSlot
    );

  }


  if (
    source.slotStart ||
    source.slotEnd ||
    source.slotId ||
    source.slotDisplay
  ) {

    return normalizeBookingSlot({

      id:
        source.slotId,

      start:
        source.slotStart,

      end:
        source.slotEnd,

      display:
        source.slotDisplay,

    });

  }


  return null;

}


/* =========================================================
   REQUIRED FIELDS
========================================================= */

export function getMissingBookingFields(
  draft = {}
) {

  const missing =
    [];


  if (
    !draft.crop
  ) {

    missing.push(
      BOOKING_FIELDS.CROP
    );

  }


  if (
    !validQuantity(
      draft.quantity
    )
  ) {

    missing.push(
      BOOKING_FIELDS.QUANTITY
    );

  }


  if (
    !draft.centerId
  ) {

    missing.push(
      BOOKING_FIELDS.CENTER
    );

  }


  if (
    !draft.date
  ) {

    missing.push(
      BOOKING_FIELDS.DATE
    );

  }


  if (
    !slotFromFields(
      draft
    )
  ) {

    missing.push(
      BOOKING_FIELDS.SLOT
    );

  }


  return missing;

}


export const getMissingDetails =
  getMissingBookingFields;


/* =========================================================
   STAGE
========================================================= */

export function getBookingStage(
  draft = {}
) {

  if (
    draft.confirmed
  ) {

    return BOOKING_STAGES.COMPLETE;

  }


  if (
    draft.awaitingConfirmation &&
    slotFromFields(
      draft
    )
  ) {

    return BOOKING_STAGES.CONFIRM;

  }


  if (
    slotFromFields(
      draft
    )
  ) {

    return BOOKING_STAGES.CONFIRM;

  }


  if (
    draft.availabilityChecked
  ) {

    return BOOKING_STAGES.SLOT;

  }


  if (
    draft.date
  ) {

    return BOOKING_STAGES.AVAILABILITY;

  }


  if (
    draft.crop &&
    validQuantity(
      draft.quantity
    ) &&
    !draft.centerId
  ) {

    return BOOKING_STAGES.CENTER;

  }


  if (
    draft.crop &&
    validQuantity(
      draft.quantity
    )
  ) {

    return BOOKING_STAGES.DATE;

  }


  return (

    draft.crop ||
    validQuantity(
      draft.quantity
    )

  )
    ? BOOKING_STAGES.DETAILS
    : BOOKING_STAGES.EMPTY;

}


export const getBookingStep =
  getBookingStage;


/* =========================================================
   NEXT FIELD
========================================================= */

export function getNextBookingField(
  draft = {}
) {

  if (
    !draft.crop
  ) {

    return BOOKING_FIELDS.CROP;

  }


  if (
    !validQuantity(
      draft.quantity
    )
  ) {

    return BOOKING_FIELDS.QUANTITY;

  }


  if (
    !draft.centerId
  ) {

    return BOOKING_FIELDS.CENTER;

  }


  if (
    !draft.date
  ) {

    return BOOKING_FIELDS.DATE;

  }


  if (
    !slotFromFields(
      draft
    )
  ) {

    return BOOKING_FIELDS.SLOT;

  }


  return null;

}


/* =========================================================
   VALIDATION
========================================================= */

export function validateBookingDraft(
  draft = {},
  options = {}
) {

  const maxQuantity =
    Number(
      options.maxQuantity ||
      MAX_QUANTITY
    );


  const errors =
    {};


  if (
    !draft.crop
  ) {

    errors.crop =
      "Crop is required.";

  }


  if (
    !validQuantity(
      draft.quantity,
      maxQuantity
    )
  ) {

    errors.quantity =
      "A valid quantity is required.";

  }


  if (
    !draft.centerId
  ) {

    errors.centerId =
      "Procurement center is required.";

  }


  if (
    !draft.date
  ) {

    errors.date =
      "Arrival date is required.";

  }


  if (
    !slotFromFields(
      draft
    )
  ) {

    errors.slot =
      "Arrival window is required.";

  }


  return {

    valid:
      Object.keys(
        errors
      ).length === 0,

    errors,

  };

}


/* =========================================================
   CREATE DRAFT
========================================================= */

export function createBookingDraft(
  values = {}
) {

  const source =
    values &&
    typeof values ===
      "object"
      ? values
      : {};


  const slot =
    slotFromFields(
      source
    );


  const date =
    normalizeBookingDate(
      source.date
    );


  const draft = {

    schemaVersion:
      BOOKING_SCHEMA_VERSION,

    active:
      source.active !==
      false,

    assistantManaged:
      source.assistantManaged ===
      true,

    crop:
      source.crop ||
      null,

    quantity:
      validQuantity(
        source.quantity
      )
        ? Number(
            source.quantity
          )
        : null,

    centerId:
      source.centerId ==
        null
        ? null
        : normalizeCenter(
            source.centerId
          ),

    centerName:
      source.centerName
        ? clean(
            source.centerName
          )
        : null,

    date,

    dateLabel:
      source.dateLabel ||
      null,

    slot,

    slotId:
      slot?.id ||
      null,

    slotStart:
      slot?.start ||
      null,

    slotEnd:
      slot?.end ||
      null,

    slotDisplay:
      slot?.display ||
      null,

    availabilityChecked:
      Boolean(
        source.availabilityChecked
      ),

    confirmed:
      Boolean(
        source.confirmed
      ),

    awaitingConfirmation:
      Boolean(
        source.awaitingConfirmation
      ),

    readyForConfirmation:
      false,

    token:
      source.token ||
      null,

    bookingId:
      source.bookingId ||
      null,

    updatedAt:
      Number(
        source.updatedAt ||
        0
      ) ||
      Date.now(),

  };


  if (
    !draft.dateLabel &&
    draft.date
  ) {

    draft.dateLabel =
      getDateReference(
        draft.date
      )?.label ||
      null;

  }


  /*
   * If a slot exists then availability has effectively
   * been checked from the conversational perspective.
   */

  if (
    draft.slot
  ) {

    draft.availabilityChecked =
      true;

  }


  draft.readyForConfirmation =
    getMissingBookingFields(
      draft
    ).length === 0 &&
    !draft.confirmed;


  draft.step =
    getBookingStage(
      draft
    );


  return draft;

}


/* =========================================================
   EMPTY
========================================================= */

export function createEmpty(
  values = {}
) {

  return createBookingDraft({

    ...values,

    active:
      false,

    assistantManaged:
      false,

    crop:
      null,

    quantity:
      null,

    centerId:
      null,

    centerName:
      null,

    date:
      null,

    dateLabel:
      null,

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

    availabilityChecked:
      false,

    confirmed:
      false,

    awaitingConfirmation:
      false,

    readyForConfirmation:
      false,

    token:
      null,

    bookingId:
      null,

  });

}


/* =========================================================
   NORMALIZE
========================================================= */

export function normalize(
  values = {}
) {

  return createBookingDraft(
    values
  );

}


export const normalizeBookingState =
  normalize;


/* =========================================================
   MERGE
========================================================= */

/*
 * IMPORTANT:
 * undefined / null fields from a partial update must not
 * accidentally erase previously collected booking details.
 *
 * Explicit null is allowed when the caller intentionally
 * wants to clear a value.
 */

export function mergeBookingDraft(
  current = {},
  updates = {}
) {

  const base =
    createBookingDraft(
      current
    );


  const source =
    updates &&
    typeof updates ===
      "object"
      ? updates
      : {};


  const merged = {
    ...base,
    ...source,
  };


  /*
   * Partial conversational updates:
   *
   * { date: "..." }
   *
   * should not erase crop, quantity or center.
   */

  const booking =
    createBookingDraft(
      merged
    );


  return booking;

}


/* =========================================================
   UPDATE EXTRACTION
========================================================= */

export function extractBookingUpdates(
  message,
  options = {}
) {

  const text =
    clean(
      message
    );


  const updates =
    {};


  const crop =
    extractBookingCrop(
      text
    );


  const quantity =
    extractBookingQuantity(
      text
    );


  const date =
    extractNaturalBookingDate(
      text,
      options.now ||
      new Date()
    );


  const slot =
    extractTimeReference(
      text
    );


  if (
    crop
  ) {

    updates.crop =
      crop;

  }


  if (
    quantity
  ) {

    updates.quantity =
      quantity;

  }


  if (
    date
  ) {

    updates.date =
      date;

  }


  if (
    slot
  ) {

    updates.slot =
      slot;

  }


  return updates;

}


/* =========================================================
   STORAGE
========================================================= */

export function saveBookingDraft(
  draft
) {

  return writeJson(
    BOOKING_STORAGE_KEY,
    createBookingDraft(
      draft
    )
  );

}


export function loadBookingDraft() {

  const stored =
    readJson(
      BOOKING_STORAGE_KEY,
      null
    );


  return (

    stored &&
    typeof stored ===
      "object"

  )
    ? normalize(
        stored
      )
    : null;

}


function loadBookingState() {

  const storedDraft =
    loadBookingDraft();


  if (
    storedDraft
  ) {

    return storedDraft;

  }


  const stored =
    readJson(
      BOOKING_STATE_STORAGE_KEY,
      null
    );


  return (

    stored &&
    typeof stored ===
      "object"

  )
    ? normalize(
        stored
      )
    : createEmpty();

}


function persistState(
  state,
  notify = true
) {

  const normalized =
    normalize(
      state
    );


  writeJson(
    BOOKING_STATE_STORAGE_KEY,
    normalized
  );


  writeJson(
    BOOKING_STORAGE_KEY,
    normalized
  );


  if (
    notify
  ) {

    dispatch(
      EVENT_BOOKING,
      normalized
    );

  }


  return normalized;

}


export function updateBookingDraft(
  updates = {}
) {

  const current =
    loadBookingDraft() ||
    loadBookingState();


  return persistState(
    {
      ...current,
      ...updates,
      active:
        true,
    },
    true
  );

}


export function saveBookingState(
  state
) {

  return persistState(
    state,
    true
  );

}


export function clearBookingDraft() {

  removeKey(
    BOOKING_STORAGE_KEY
  );


  removeKey(
    BOOKING_STATE_STORAGE_KEY
  );


  removeKey(
    BOOKING_AVAILABILITY_STORAGE_KEY
  );


  dispatch(
    EVENT_BOOKING,
    createEmpty()
  );


  return true;

}


/* =========================================================
   AVAILABILITY
========================================================= */

export function saveBookingAvailabilityContext(
  context = {}
) {

  const value = {

    availableDates:
      Array.isArray(
        context.availableDates
      )
        ? context.availableDates
        : [],

    availableSlots:
      Array.isArray(
        context.availableSlots
      )
        ? context.availableSlots
        : [],

    availableCenters:
      Array.isArray(
        context.availableCenters
      )
        ? context.availableCenters
        : [],

    selectedDate:
      context.selectedDate ||
      null,

    selectedCenterId:
      context.selectedCenterId ||
      null,

    updatedAt:
      Date.now(),

  };


  const ok =
    writeJson(
      BOOKING_AVAILABILITY_STORAGE_KEY,
      value
    );


  if (
    ok
  ) {

    dispatch(
      EVENT_AVAILABILITY,
      value
    );

  }


  return ok;

}


export function getBookingAvailabilityContext() {

  const empty = {

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

  };


  const value =
    readJson(
      BOOKING_AVAILABILITY_STORAGE_KEY,
      null
    );


  if (
    !value ||
    typeof value !==
      "object"
  ) {

    return empty;

  }


  const updatedAt =
    Number(
      value.updatedAt ||
      0
    );


  if (
    updatedAt &&
    Date.now() -
      updatedAt >
      AVAILABILITY_TTL
  ) {

    removeKey(
      BOOKING_AVAILABILITY_STORAGE_KEY
    );


    return empty;

  }


  return {

    availableDates:
      Array.isArray(
        value.availableDates
      )
        ? value.availableDates
        : [],

    availableSlots:
      Array.isArray(
        value.availableSlots
      )
        ? value.availableSlots
        : [],

    availableCenters:
      Array.isArray(
        value.availableCenters
      )
        ? value.availableCenters
        : [],

    selectedDate:
      value.selectedDate ||
      null,

    selectedCenterId:
      value.selectedCenterId ||
      null,

    updatedAt,

  };

}


export function requestBookingAvailabilitySync() {

  if (
    typeof window !==
    "undefined"
  ) {

    dispatch(
      EVENT_REQUEST_AVAILABILITY
    );

  }


  return getBookingAvailabilityContext();

}


/* =========================================================
   BOOKING INTENT HELPERS
========================================================= */

function isBookingStart(
  text
) {

  return (

    /\b(book|booking|reserve|reservation|procurement|sell)\b/i.test(
      text
    ) ||

    /\b(बुक|बुकिंग|रिजर्व|बिक्री|బుక్|బుకింగ్)\b/i.test(
      text
    )

  );

}


function isConfirmation(
  text
) {

  return /^(yes|yeah|yep|yup|sure|ok|okay|k|confirm|confirmed|book it|do it|go ahead|continue|proceed|yes please|haan|हां|हाँ|ठीक|ठीक है|अवश्य|करो|कर दो|अवును|అవును|సరే|చేయండి)[.!\s]*$/i.test(
    text
  );

}


function isCancellation(
  text
) {

  return (

    /\b(cancel|stop booking|never mind|forget it)\b/i.test(
      text
    ) ||

    /\b(रद्द|रद्द करो|रद्द करें|मत करो)\b/i.test(
      text
    ) ||

    /\b(రద్దు|వద్దు|ఆపండి)\b/i.test(
      text
    )

  );

}


function asksForState(
  text
) {

  return (

    /\b(what have i|what did i|show my|my booking|booking details|selected|what have we selected|booking summary|summary)\b/i.test(
      text
    ) ||

    /क्या.*चुना|बुकिंग.*विवरण|सारांश/i.test(
      text
    ) ||

    /బుకింగ్.*వివరాలు|సారాంశ/i.test(
      text
    )

  );

}


function asksForDates(
  text
) {

  return (

    /\b(what|which|show|tell|give).*(date|dates)\b/i.test(
      text
    ) ||

    /\b(available dates|dates available|which dates)\b/i.test(
      text
    ) ||

    /^dates?$/i.test(
      text.trim()
    ) ||

    /तारीख.*उपलब्ध|तारीखें.*बताओ/i.test(
      text
    ) ||

    /తేదీలు.*అందుబాటులో|ఏ తేదీలు/i.test(
      text
    )

  );

}


function asksForSlots(
  text
) {

  return (

    /\b(what|which|show|tell|give).*(time|times|slot|slots)\b/i.test(
      text
    ) ||

    /\b(available\s+(time|times|slot|slots|timing|timings|timming|timmings))\b/i.test(
      text
    ) ||

    /\b(slot timings?|booking timings?|procurement timings?)\b/i.test(
      text
    ) ||

    /^time(s)?$/i.test(
      text.trim()
    ) ||

    /^(timing|timings|timming|timmings|hours)$/i.test(
      text.trim()
    ) ||

    /\bwhat time\b/i.test(
      text
    ) ||

    /समय.*उपलब्ध|समय.*बताओ|स्लॉट.*उपलब्ध/i.test(
      text
    ) ||

    /సమయం.*అందుబాటులో|స్లాట్.*అందుబాటులో/i.test(
      text
    )

  );

}


function asksForCenters(
  text
) {

  return (

    /\b(what|which|show|tell|give|list).*(center|centers|centre|centres|centeers|procurement center|procurement centers)\b/i.test(
      text
    ) ||

    /\bavailable\s+(center|centers|centre|centres|centeers)\b/i.test(
      text
    ) ||

    /^(center|centers|centre|centres|centeer|centeers)$/i.test(
      text.trim()
    ) ||

    /केंद्र.*उपलब्ध|केंद्र.*बताओ|केंद्र कौन/i.test(
      text
    ) ||

    /కేంద్రాలు.*అందుబాటులో|కేంద్రాలు.*చెప్పు/i.test(
      text
    )

  );

}


function asksForCenterTimings(
  text
) {

  const centerWords =
    /\b(center|centers|centre|centres|centeers|procurement|location|locations)\b/i.test(
      text
    );


  const timingWords =
    /\b(time|times|timing|timings|timming|timmings|hours|opening|closing|open|close)\b/i.test(
      text
    );


  return (

    centerWords &&
    timingWords

  );

}


export function isBookingInformationRequest(
  text
) {

  const value =
    norm(
      text
    );


  if (
    !value
  ) {

    return false;

  }


  return (

    asksForCenters(
      value
    ) ||

    asksForCenterTimings(
      value
    ) ||

    asksForDates(
      value
    ) ||

    asksForSlots(
      value
    )

  );

}


function asksForReview(
  text
) {

  return /\b(review|summary|summarize|show details|read it back|final details|confirm details)\b/i.test(
    text
  );

}


/* =========================================================
   DISPLAY HELPERS
========================================================= */

function makeDateText(
  dates = []
) {

  return dates
    .map(
      item => {

        const ref =
          getDateReference(
            item?.date ||
            item?.id
          );


        const label =
          clean(
            item?.label
          );


        return (

          ref?.label ||

          label ||

          item?.date ||

          item?.id ||

          ""

        );

      }
    )
    .filter(
      Boolean
    )
    .join(
      ", "
    );

}


function makeSlotText(
  slots = []
) {

  return slots
    .map(
      item => (

        item?.display ||

        item?.label ||

        formatSlotDisplay(
          item?.start ||
          item?.startTime ||
          item?.from,
          item?.end ||
          item?.endTime ||
          item?.to
        )

      )
    )
    .filter(
      Boolean
    )
    .join(
      ", "
    );

}


/* =========================================================
   CENTER DISPLAY
========================================================= */

export function formatCenterOptions(
  centers = [],
  language = "en"
) {

  const rows =
    Array.isArray(
      centers
    )
      ? centers
      : [];


  if (
    !rows.length
  ) {

    if (
      language ===
      "hi"
    ) {

      return "अभी कोई सक्रिय खरीद केंद्र नहीं मिला।";

    }


    if (
      language ===
      "te"
    ) {

      return "ప్రస్తుతం యాక్టివ్ కొనుగోలు కేంద్రాలు ఏవీ లభించలేదు.";

    }


    return "I couldn't find any active procurement centers right now.";

  }


  return rows
    .map(
      (
        center,
        index
      ) => {

        const name =
          clean(
            center?.name ||
            center?.centerName ||
            center?.title
          ) ||
          `Center ${
            index + 1
          }`;


        const open =
          clean(
            center?.openingTime ||
            center?.opening_time ||
            center?.openTime
          );


        const close =
          clean(
            center?.closingTime ||
            center?.closing_time ||
            center?.closeTime
          );


        const timing =
          open &&
          close
            ? ` — ${formatDisplayTime(
                open
              )} to ${formatDisplayTime(
                close
              )}`
            : "";


        return (
          `${index + 1}. ${name}${timing}`
        );

      }
    )
    .join(
      "; "
    );

}


/* =========================================================
   BOOKING SUMMARY
========================================================= */

export function getBookingSummary(
  draft = {},
  language = "en"
) {

  const safe =
    normalize(
      draft
    );


  const code =
    languageCode(
      language
    );


  const date =
    getDateReference(
      safe.date
    );


  return {

    crop:
      CROP_NAMES[
        code
      ]?.[
        safe.crop
      ] ||
      safe.crop ||
      null,

    quantity:
      safe.quantity ||
      null,

    centerId:
      safe.centerId ||
      null,

    centerName:
      safe.centerName ||
      null,

    date:
      date?.label ||
      safe.dateLabel ||
      null,

    rawDate:
      safe.date ||
      null,

    slot:
      safe.slotDisplay ||
      (
        safe.slotStart
          ? formatSlotDisplay(
              safe.slotStart,
              safe.slotEnd
            )
          : null
      ),

    complete:
      getMissingBookingFields(
        safe
      ).length ===
      0,

    stage:
      getBookingStage(
        safe
      ),

    readyForConfirmation:
      safe.readyForConfirmation,

    awaitingConfirmation:
      safe.awaitingConfirmation,

    confirmed:
      safe.confirmed,

    token:
      safe.token ||
      null,

    bookingId:
      safe.bookingId ||
      null,

  };

}


export function formatBookingProgress(
  draft = {},
  language = "en"
) {

  const summary =
    getBookingSummary(
      draft,
      language
    );


  const code =
    languageCode(
      language
    );


  const labels =

    code ===
    "hi"

      ? [
          "फसल",
          "मात्रा",
          "केंद्र",
          "तारीख",
          "समय",
        ]

      : code ===
          "te"

        ? [
            "పంట",
            "పరిమాణం",
            "కేంద్రం",
            "తేదీ",
            "సమయం",
          ]

        : [
            "Crop",
            "Quantity",
            "Center",
            "Date",
            "Time",
          ];


  const values = [

    summary.crop ||
      "not selected",

    summary.quantity
      ? `${summary.quantity} kg`
      : "not provided",

    summary.centerName ||
      summary.centerId ||
      "not selected",

    summary.date ||
      "not selected",

    summary.slot ||
      "not selected",

  ];


  return labels
    .map(
      (
        label,
        index
      ) =>
        `${label}: ${values[index]}`
    )
    .join(
      "\n"
    );

}


export const getStateSummary =
  formatBookingProgress;

export const getBookingProgress =
  formatBookingProgress;


/* =========================================================
   NEXT QUESTION
========================================================= */

export function getNextBookingQuestion(
  draft = {},
  language = "en"
) {

  const code =
    languageCode(
      language
    );


  const copy = {

    en: {

      crop:
        "Which crop would you like to book?",

      quantity:
        "How much produce are you bringing? Please give the quantity in kilograms.",

      center:
        "Which procurement center would you like to use?",

      date:
        "Which date would you like to arrive? I can check the available dates for you.",

      slot:
        "Which arrival time works for you? I can show the available slots for your selected date.",

      complete:
        "All booking details are complete. I'll show you the details before final confirmation.",

    },

    hi: {

      crop:
        "आप कौन सी फसल बुक करना चाहते हैं?",

      quantity:
        "कितनी मात्रा में फसल लानी है? मात्रा किलो में बताएं।",

      center:
        "आप किस खरीद केंद्र पर जाना चाहते हैं?",

      date:
        "आप किस तारीख को आना चाहते हैं? मैं उपलब्ध तारीखें देखकर बता सकता हूँ।",

      slot:
        "आप किस समय आना चाहते हैं? मैं उपलब्ध स्लॉट दिखा सकता हूँ।",

      complete:
        "आपकी बुकिंग की सारी जानकारी तैयार है। अंतिम पुष्टि से पहले मैं विवरण दिखाऊँगा।",

    },

    te: {

      crop:
        "మీరు ఏ పంటను బుక్ చేయాలనుకుంటున్నారు?",

      quantity:
        "ఎంత పరిమాణంలో పంట తీసుకువస్తారు? కిలోల్లో చెప్పండి.",

      center:
        "మీరు ఏ కొనుగోలు కేంద్రాన్ని ఉపయోగించాలనుకుంటున్నారు?",

      date:
        "మీరు ఏ తేదీన రావాలనుకుంటున్నారు? అందుబాటులో ఉన్న తేదీలను చూస్తాను.",

      slot:
        "మీరు ఏ సమయంలో రావాలనుకుంటున్నారు? అందుబాటులో ఉన్న స్లాట్‌లను చూపగలను.",

      complete:
        "మీ బుకింగ్ వివరాలన్నీ సిద్ధంగా ఉన్నాయి. తుది నిర్ధారణకు ముందు పూర్తి వివరాలను చూపిస్తాను.",

    },

  };


  const field =
    getNextBookingField(
      draft
    );


  return (

    copy[
      code
    ]?.[
      field
    ] ||

    copy[
      code
    ].complete

  );

}


export const nextPrompt =
  getNextBookingQuestion;


/* =========================================================
   REVIEW
========================================================= */

export function review(
  draft = {},
  language = "en"
) {

  const safe =
    normalize(
      draft
    );


  return {

    ...getBookingSummary(
      safe,
      language
    ),

    valid:
      getMissingBookingFields(
        safe
      ).length ===
      0,

  };

}


/* =========================================================
   CONTEXT
========================================================= */

export function buildBookingContext(
  draft = {},
  language = "en"
) {

  const safe =
    normalize(
      draft
    );


  return {

    draft:
      safe,

    stage:
      getBookingStage(
        safe
      ),

    nextField:
      getNextBookingField(
        safe
      ),

    missingFields:
      getMissingBookingFields(
        safe
      ),

    summary:
      getBookingSummary(
        safe,
        language
      ),

    nextQuestion:
      getNextBookingQuestion(
        safe,
        language
      ),

    valid:
      validateBookingDraft(
        safe
      ),

    awaitingConfirmation:
      safe.awaitingConfirmation,

    readyForConfirmation:
      safe.readyForConfirmation,

    confirmed:
      safe.confirmed,

    token:
      safe.token ||
      null,

    bookingId:
      safe.bookingId ||
      null,

  };

}


/* =========================================================
   ROUTE STATE
========================================================= */

export function buildBookingRouteState(
  draft = {}
) {

  const safe =
    normalize(
      draft
    );


  return {

    assistantBooking:
      safe,

    assistantAction:
      "OPEN_BOOKING",

  };

}


export function readBookingRouteState(
  locationState
) {

  return locationState
    ?.assistantBooking

    ? normalize(
        locationState.assistantBooking
      )

    : null;

}


/* =========================================================
   SMALL HELPERS FOR PROCESSOR
========================================================= */

function hasUsefulBookingUpdate(
  updates
) {

  return Boolean(

    updates &&
    Object.keys(
      updates
    ).length >
    0

  );

}


function getSlotsForSelectedDate(
  state,
  availableSlots
) {

  if (
    !state.date
  ) {

    return [];

  }


  const centerFiltered =
    state.centerId
      ? availableSlots.filter(
          slot =>
            String(
              slot?.centerId ??
              slot?.center_id ??
              ""
            ) ===
            String(
              state.centerId
            )
        )
      : availableSlots;


  /*
   * Some frontend availability payloads already contain
   * only the selected day's slots. Others may include date.
   *
   * Filter by date only when slot data explicitly carries
   * a date.
   */

  const withDate =
    centerFiltered.filter(
      slot =>
        slot?.date ||
        slot?.bookingDate
    );


  if (
    withDate.length
  ) {

    return withDate.filter(
      slot =>
        String(
          slot?.date ??
          slot?.bookingDate ??
          ""
        ) ===
        String(
          state.date
        )
    );

  }


  return centerFiltered;

}


function applySelectedDate(
  state,
  selectedDate
) {

  if (
    !selectedDate
  ) {

    return state;

  }


  const date =
    selectedDate.date ||
    selectedDate.id ||
    selectedDate.value ||
    null;


  return mergeBookingDraft(
    state,
    {

      date,

      dateLabel:
        selectedDate.label ||
        selectedDate.name ||
        null,

      /*
       * Changing date MUST invalidate the old slot.
       */

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

      availabilityChecked:
        false,

      confirmed:
        false,

      awaitingConfirmation:
        false,

      readyForConfirmation:
        false,

    }
  );

}


function applySelectedSlot(
  state,
  selectedSlot
) {

  if (
    !selectedSlot
  ) {

    return state;

  }


  const normalized =
    normalizeBookingSlot(
      selectedSlot
    );


  return mergeBookingDraft(
    state,
    {

      slot:
        normalized,

      slotId:
        normalized?.id ||
        null,

      slotStart:
        normalized?.start ||
        null,

      slotEnd:
        normalized?.end ||
        null,

      slotDisplay:
        normalized?.display ||
        null,

      availabilityChecked:
        true,

      confirmed:
        false,

      awaitingConfirmation:
        false,

      readyForConfirmation:
        false,

    }
  );

}


function ensurePreferredCenter(
  state,
  availableCenters,
  availability
) {

  if (
    state.centerId
  ) {

    const existing =
      availableCenters.find(
        center =>
          String(
            center?.id
          ) ===
          String(
            state.centerId
          )
      );


    if (
      existing
    ) {

      return mergeBookingDraft(
        state,
        {

          centerName:
            existing.name ||
            existing.centerName ||
            state.centerName ||
            null,

        }
      );

    }

  }


  const preferredId =
    availability.selectedCenterId ||
    availableCenters[0]?.id ||
    null;


  if (
    !preferredId
  ) {

    return state;

  }


  const preferred =
    availableCenters.find(
      center =>
        String(
          center?.id
        ) ===
        String(
          preferredId
        )
    );


  return mergeBookingDraft(
    state,
    {

      centerId:
        preferred?.id ||
        preferredId,

      centerName:
        preferred?.name ||
        preferred?.centerName ||
        state.centerName ||
        null,

    }
  );

}


function makeConfirmationReady(
  state
) {

  return normalize({

    ...state,

    confirmed:
      false,

    awaitingConfirmation:
      true,

    readyForConfirmation:
      true,

    active:
      true,

  });

}


/* =========================================================
   MAIN BOOKING PROCESSOR
========================================================= */

export function processBookingConversation(
  currentState,
  message,
  options = {}
) {

  const text =
    clean(
      message
    );


  const normalizedText =
    norm(
      text
    );


  const now =
    options.now ||
    new Date();


  const previous =
    normalize(
      currentState ||
      loadBookingState()
    );


  let availability =
    getBookingAvailabilityContext();


  /*
   * Use explicitly supplied live data first.
   */

  if (
    Array.isArray(
      options.availableDates
    ) &&
    Array.isArray(
      options.availableSlots
    ) &&
    Array.isArray(
      options.availableCenters
    )
  ) {

    availability = {

      ...availability,

      availableDates:
        options.availableDates,

      availableSlots:
        options.availableSlots,

      availableCenters:
        options.availableCenters,

    };

  } else {

    /*
     * Ask FarmerBook for a fresh snapshot.
     *
     * The event is asynchronous, so immediately after this
     * call we still use the latest cached snapshot.
     */

    requestBookingAvailabilitySync();

  }


  const availableDates =
    Array.isArray(
      options.availableDates
    )
      ? options.availableDates
      : availability.availableDates;


  const availableSlots =
    Array.isArray(
      options.availableSlots
    )
      ? options.availableSlots
      : availability.availableSlots;


  const availableCenters =
    Array.isArray(
      options.availableCenters
    )
      ? options.availableCenters
      : availability.availableCenters;


  if (
    !text
  ) {

    return {

      handled:
        false,

      intent:
        BOOKING_INTENTS.NONE,

      state:
        previous,

    };

  }


  /* =======================================================
     CANCEL
  ======================================================= */

  if (
    isCancellation(
      normalizedText
    )
  ) {

    const empty =
      createEmpty();


    persistState(
      empty
    );


    return {

      handled:
        true,

      intent:
        BOOKING_INTENTS.CANCEL,

      state:
        empty,

      nextStep:
        BOOKING_STEPS.DETAILS,

    };

  }


  /* =======================================================
     CURRENT CONFIRMATION
  ======================================================= */

  if (
    isConfirmation(
      normalizedText
    )
  ) {

    if (
      previous.confirmed
    ) {

      return {

        handled:
          true,

        intent:
          BOOKING_INTENTS.CONFIRM,

        state:
          previous,

        alreadyConfirmed:
          true,

        nextStep:
          BOOKING_STEPS.COMPLETE,

      };

    }


    const valid =
      validateBookingDraft(
        previous
      ).valid;


    if (
      previous.readyForConfirmation &&
      valid
    ) {

      /*
       * IMPORTANT:
       *
       * confirmed=true here means:
       *
       * USER AUTHORIZED SUBMISSION
       *
       * It does NOT mean that the backend booking
       * already exists.
       *
       * FarmerBook/controller performs the actual POST.
       */

      const authorized =
        normalize({

          ...previous,

          confirmed:
            true,

          readyForConfirmation:
            false,

          awaitingConfirmation:
            false,

        });


      persistState(
        authorized
      );


      return {

        handled:
          true,

        intent:
          BOOKING_INTENTS.CONFIRM,

        state:
          authorized,

        booking:
          authorized,

        nextStep:
          BOOKING_STEPS.COMPLETE,

        executeBooking:
          true,

      };

    }


    return {

      handled:
        true,

      intent:
        BOOKING_INTENTS.UPDATE,

      state:
        previous,

      missing:
        getMissingBookingFields(
          previous
        ),

      nextStep:
        getBookingStage(
          previous
        ),

      confirmationBlocked:
        true,

    };

  }


  /* =======================================================
     EXTRACT CURRENT MESSAGE
  ======================================================= */

  const incomingCrop =
    extractBookingCrop(
      text
    );


  const incomingQuantity =
    extractBookingQuantity(
      text
    );


  const incomingDate =
    extractNaturalBookingDate(
      text,
      now
    );


  const incomingSlot =
    extractTimeReference(
      text
    );


  const containsBookingStart =
    isBookingStart(
      normalizedText
    );


  /*
   * A fresh booking starts only when the current message
   * contains booking intent AND actual booking details.
   *
   * "book"
   * alone should not destroy an existing draft.
   */

  const startingFresh =
    containsBookingStart &&
    Boolean(

      incomingCrop ||
      incomingQuantity ||
      incomingDate ||
      incomingSlot

    );


  let state =
    startingFresh

      ? createBookingDraft({

          active:
            true,

          assistantManaged:
            true,

          crop:
            incomingCrop,

          quantity:
            incomingQuantity,

          centerId:
            null,

          centerName:
            null,

          date:
            null,

          slot:
            null,

          confirmed:
            false,

          awaitingConfirmation:
            false,

          readyForConfirmation:
            false,

        })

      : previous;


  /*
   * If this is an actual new booking command, stale fields
   * must never leak into it.
   */

  if (
    startingFresh
  ) {

    state =
      mergeBookingDraft(
        createEmpty(),

        {

          active:
            true,

          assistantManaged:
            true,

          crop:
            incomingCrop,

          quantity:
            incomingQuantity,

          date:
            null,

          slot:
            null,

          centerId:
            null,

          centerName:
            null,

          confirmed:
            false,

          awaitingConfirmation:
            false,

        }

      );

  }


  /* =======================================================
     EXPLICIT CENTER
  ======================================================= */

  const explicitCenter =
    findAvailableCenter(
      text,
      availableCenters
    );


  if (
    explicitCenter
  ) {

    state =
      mergeBookingDraft(
        state,

        {

          centerId:
            explicitCenter.id,

          centerName:
            explicitCenter.name ||
            explicitCenter.centerName ||
            null,

          /*
           * Changing center invalidates slot.
           */

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

          availabilityChecked:
            false,

          confirmed:
            false,

          awaitingConfirmation:
            false,

          readyForConfirmation:
            false,

        }
      );

  }


  /* =======================================================
     BASIC DETAILS
  ======================================================= */

  if (
    incomingCrop
  ) {

    state =
      mergeBookingDraft(
        state,

        {

          crop:
            incomingCrop,

          confirmed:
            false,

          awaitingConfirmation:
            false,

          readyForConfirmation:
            false,

        }
      );

  }


  if (
    incomingQuantity
  ) {

    state =
      mergeBookingDraft(
        state,

        {

          quantity:
            incomingQuantity,

          confirmed:
            false,

          awaitingConfirmation:
            false,

          readyForConfirmation:
            false,

        }
      );

  }


  /*
   * Choose a default/current center only when the user
   * is actually progressing through a booking.
   */

  if (
    (
      incomingCrop ||
      incomingQuantity ||
      incomingDate ||
      incomingSlot ||
      containsBookingStart
    ) &&
    availableCenters.length &&
    !state.centerId
  ) {

    state =
      ensurePreferredCenter(
        state,
        availableCenters,
        availability
      );

  }


  /* =======================================================
     INFORMATION REQUESTS
  ======================================================= */

  if (
    asksForCenters(
      normalizedText
    ) ||
    asksForCenterTimings(
      normalizedText
    )
  ) {

    persistState(
      state
    );


    return {

      handled:
        true,

      intent:
        BOOKING_INTENTS.SHOW_CENTERS,

      state,

      centers:
        availableCenters,

      centerText:
        formatCenterOptions(
          availableCenters,
          options.language ||
            "en"
        ),

      dates:
        availableDates,

      dateText:
        makeDateText(
          availableDates
        ),

      nextStep:
        getBookingStage(
          state
        ),

    };

  }


  if (
    asksForDates(
      normalizedText
    )
  ) {

    persistState(
      state
    );


    return {

      handled:
        true,

      intent:
        BOOKING_INTENTS.ASK_DATES,

      state,

      dates:
        availableDates,

      dateText:
        makeDateText(
          availableDates
        ),

      nextStep:
        BOOKING_STEPS.DATE,

    };

  }


  if (
    asksForSlots(
      normalizedText
    )
  ) {

    const relevantSlots =
      getSlotsForSelectedDate(
        state,
        availableSlots
      );


    persistState(
      state
    );


    return {

      handled:
        true,

      intent:
        BOOKING_INTENTS.ASK_SLOTS,

      state,

      slots:
        relevantSlots.length
          ? relevantSlots
          : availableSlots,

      slotText:
        makeSlotText(
          relevantSlots.length
            ? relevantSlots
            : availableSlots
        ),

      nextStep:
        BOOKING_STEPS.SLOT,

    };

  }


  /* =======================================================
     DATE SELECTION
  ======================================================= */

  let selectedDate =
    null;


  if (
    incomingDate
  ) {

    selectedDate =
      availableDates.find(
        item =>
          normalizeBookingDate(
            item?.date ||
            item?.id ||
            item?.value
          ) ===
          incomingDate
      ) ||
      null;

  }


  if (
    !selectedDate
  ) {

    selectedDate =
      findAvailableDate(
        text,
        availableDates,
        now
      );

  }


  const explicitlyMentionsDate =
    Boolean(
      incomingDate
    ) ||

    /\b(today|tomorrow|tommorow|tommorrow|tomorow|tmrw|yesterday|kal|next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i.test(
      normalizedText
    );


  if (
    explicitlyMentionsDate
  ) {

    /*
     * Never silently retain an old date when the user
     * explicitly requested another date.
     */

    if (
      !selectedDate
    ) {

      persistState(
        state
      );


      return {

        handled:
          true,

        intent:
          BOOKING_INTENTS.ASK_DATES,

        state,

        dates:
          availableDates,

        dateText:
          makeDateText(
            availableDates
          ),

        unavailableDate:
          incomingDate ||
          normalizedText,

        needsAvailability:
          true,

      };

    }


    state =
      applySelectedDate(
        state,
        selectedDate
      );


    /*
     * IMPORTANT:
     *
     * Do NOT return here.
     *
     * This lets:
     *
     * "book 234 kg paddy tomorrow 8 to 830"
     *
     * continue into slot matching inside the SAME call.
     */

  }


  /* =======================================================
     SLOT AVAILABILITY
  ======================================================= */

  let relevantSlots =
    getSlotsForSelectedDate(
      state,
      availableSlots
    );


  /*
   * Slot may have been supplied before date.
   */

  if (
    incomingSlot &&
    !state.date
  ) {

    persistState(
      state
    );


    return {

      handled:
        true,

      intent:
        BOOKING_INTENTS.SELECT_DATE,

      state,

      nextStep:
        BOOKING_STEPS.DATE,

      missing:
        getMissingBookingFields(
          state
        ),

      timeWithoutDate:
        true,

    };

  }


  /* =======================================================
     SLOT SELECTION
  ======================================================= */

  if (
    incomingSlot &&
    state.date
  ) {

    let selectedSlot =
      findSlotReference(
        text,
        relevantSlots
      );


    /*
     * Some availability payloads do not attach centerId
     * even though the slots belong to the selected center.
     */

    if (
      !selectedSlot &&
      relevantSlots.length ===
        0
    ) {

      selectedSlot =
        findSlotReference(
          text,
          availableSlots
        );

    }


    if (
      !selectedSlot
    ) {

      persistState(
        state
      );


      return {

        handled:
          true,

        intent:
          BOOKING_INTENTS.ASK_SLOTS,

        state,

        slots:
          relevantSlots.length
            ? relevantSlots
            : availableSlots,

        slotText:
          makeSlotText(
            relevantSlots.length
              ? relevantSlots
              : availableSlots
          ),

        unavailableSlot:
          incomingSlot,

        nextStep:
          BOOKING_STEPS.SLOT,

      };

    }


    state =
      applySelectedSlot(
        state,
        selectedSlot
      );


    /*
     * Re-read slot list after state update.
     */

    relevantSlots =
      getSlotsForSelectedDate(
        state,
        availableSlots
      );

  }


  /* =======================================================
     DATE-ONLY FOLLOW-UP
  ======================================================= */

  if (
    selectedDate &&
    !incomingSlot
  ) {

    persistState(
      state
    );


    return {

      handled:
        true,

      intent:
        BOOKING_INTENTS.SELECT_DATE,

      state,

      selectedDate,

      slots:
        relevantSlots,

      nextStep:
        BOOKING_STEPS.SLOT,

    };

  }


  /* =======================================================
     STANDALONE TIME FOLLOW-UP
  ======================================================= */

  if (
    incomingSlot &&
    state.date &&
    !slotFromFields(
      state
    )
  ) {

    persistState(
      state
    );


    return {

      handled:
        true,

      intent:
        BOOKING_INTENTS.ASK_SLOTS,

      state,

      slots:
        relevantSlots,

      slotText:
        makeSlotText(
          relevantSlots
        ),

      unavailableSlot:
        incomingSlot,

      nextStep:
        BOOKING_STEPS.SLOT,

    };

  }


  /* =======================================================
     REVIEW
  ======================================================= */

  if (
    asksForReview(
      normalizedText
    )
  ) {

    const reviewed =
      review(
        state,
        options.language ||
          "en"
      );


    const reviewState =
      reviewed.valid
        ? makeConfirmationReady(
            state
          )
        : state;


    persistState(
      reviewState
    );


    return {

      handled:
        true,

      intent:
        BOOKING_INTENTS.REVIEW,

      state:
        reviewState,

      review:
        review(
          reviewState,
          options.language ||
            "en"
        ),

      nextStep:
        reviewState.readyForConfirmation
          ? BOOKING_STEPS.REVIEW
          : getBookingStage(
              reviewState
            ),

      awaitingConfirmation:
        reviewState.awaitingConfirmation,

      readyForConfirmation:
        reviewState.readyForConfirmation,

    };

  }


  /* =======================================================
     COMPLETE DRAFT
  ======================================================= */

  const missing =
    getMissingBookingFields(
      state
    );


  if (
    missing.length ===
    0
  ) {

    const ready =
      makeConfirmationReady(
        state
      );


    persistState(
      ready
    );


    return {

      handled:
        true,

      intent:
        state.slot &&
        (
          incomingSlot ||
          selectedDate
        )
          ? BOOKING_INTENTS.SELECT_SLOT
          : BOOKING_INTENTS.UPDATE,

      state:
        ready,

      selectedDate,

      selectedSlot:
        slotFromFields(
          ready
        ),

      review:
        review(
          ready,
          options.language ||
            "en"
        ),

      nextStep:
        BOOKING_STEPS.REVIEW,

      awaitingConfirmation:
        true,

      readyForConfirmation:
        true,

    };

  }


  /* =======================================================
     BASIC UPDATE
  ======================================================= */

  const extractedUpdates = {

    crop:
      incomingCrop,

    quantity:
      incomingQuantity,

    date:
      incomingDate,

    slot:
      incomingSlot,

  };


  if (
    hasUsefulBookingUpdate(
      extractedUpdates
    )
  ) {

    persistState(
      state
    );


    return {

      handled:
        true,

      intent:
        startingFresh
          ? BOOKING_INTENTS.START
          : BOOKING_INTENTS.UPDATE,

      state,

      missing:
        getMissingBookingFields(
          state
        ),

      nextStep:
        getBookingStage(
          state
        ),

    };

  }


  /* =======================================================
     SHOW STATE
  ======================================================= */

  if (
    asksForState(
      normalizedText
    )
  ) {

    persistState(
      state
    );


    return {

      handled:
        true,

      intent:
        BOOKING_INTENTS.SHOW_STATE,

      state,

      summary:
        getBookingSummary(
          state,
          options.language ||
            "en"
        ),

      progress:
        formatBookingProgress(
          state,
          options.language ||
            "en"
        ),

      missing:
        getMissingBookingFields(
          state
        ),

      nextStep:
        getBookingStage(
          state
        ),

    };

  }


  /* =======================================================
     ACTIVE STATE
  ======================================================= */

  if (
    startingFresh ||
    state.active
  ) {

    persistState(
      state
    );


    return {

      handled:
        true,

      intent:
        startingFresh
          ? BOOKING_INTENTS.START
          : BOOKING_INTENTS.UPDATE,

      state,

      missing:
        getMissingBookingFields(
          state
        ),

      nextStep:
        getBookingStage(
          state
        ),

    };

  }


  return {

    handled:
      false,

    intent:
      BOOKING_INTENTS.NONE,

    state,

  };

}


export const process =
  processBookingConversation;


/* =========================================================
   PUBLIC OBJECT
========================================================= */

export const assistantBooking = {

  BOOKING_ENGINE_VERSION,

  BOOKING_FIELDS,

  BOOKING_STAGES,

  BOOKING_STEPS,

  BOOKING_INTENTS,

  BOOKING_STORAGE_KEY,

  BOOKING_STATE_STORAGE_KEY,

  BOOKING_AVAILABILITY_STORAGE_KEY,

  BOOKING_SCHEMA_VERSION,

  extractBookingCrop,

  extractCrop,

  extractBookingQuantity,

  extractQuantity,

  normalizeCenter,

  findAvailableCenter,

  normalizeBookingDate,

  extractNaturalBookingDate,

  getDateReference,

  normalizeBookingSlot,

  extractTimeReference,

  findAvailableDate,

  findSlotReference,

  createBookingDraft,

  createEmpty,

  normalize,

  normalizeBookingState,

  mergeBookingDraft,

  getMissingBookingFields,

  getMissingDetails,

  getBookingStage,

  getBookingStep,

  getNextBookingField,

  validateBookingDraft,

  extractBookingUpdates,

  saveBookingDraft,

  loadBookingDraft,

  updateBookingDraft,

  saveBookingState,

  clearBookingDraft,

  saveBookingAvailabilityContext,

  getBookingAvailabilityContext,

  requestBookingAvailabilitySync,

  buildBookingRouteState,

  readBookingRouteState,

  formatCenterOptions,

  getBookingSummary,

  getStateSummary,

  getNextBookingQuestion,

  nextPrompt,

  formatBookingProgress,

  getBookingProgress,

  review,

  buildBookingContext,

  processBookingConversation,

  isBookingInformationRequest,

  process,

};


export default assistantBooking;