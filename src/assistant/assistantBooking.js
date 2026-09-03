/* =========================================================
   KRISHISETU AI BOOKING CONVERSATION
=========================================================

   PURPOSE

   This module manages the conversational state of a farmer
   procurement booking.

   It does NOT:
   - render JSX
   - navigate
   - call the backend
   - submit the booking

   It DOES:
   - extract booking details from natural language
   - remember partially completed booking details
   - determine which details are missing
   - interpret date/slot-related questions
   - produce the next conversational step
   - prepare a clean booking object for the controller
========================================================= */

import {
  cleanText,
  normalizeText,
  sanitizeActionParams,
  readStorageJson,
  writeStorageJson,
  removeStorage,
} from "./assistantUtils";


/* =========================================================
   CONSTANTS
========================================================= */

export const BOOKING_STATE_KEY =
  "krishisetu_ai_booking_state";


export const BOOKING_STATUS = {

  EMPTY:
    "EMPTY",

  COLLECTING:
    "COLLECTING",

  READY:
    "READY",

  CONFIRMATION:
    "CONFIRMATION",

  COMPLETED:
    "COMPLETED",

};


/* =========================================================
   CROPS
========================================================= */

const CROP_ALIASES = {

  wheat: [

    "wheat",
    "wheat crop",
    "gehu",
    "gehun",
    "गेहूं",
    "गेहूँ",
    "गेहू",
    "गहूं",
    "గోధుమ",
    "గోధుమలు",

  ],

  paddy: [

    "paddy",
    "rice",
    "dhan",
    "धान",
    "धान की फसल",
    "चावल",
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


/* =========================================================
   CROP DISPLAY NAMES
========================================================= */

const CROP_NAMES = {

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


/* =========================================================
   DATE LANGUAGE
========================================================= */

const RELATIVE_DATES = {

  today: [

    "today",
    "aaj",
    "आज",
    "आज ही",
    "నేడు",
    "ఈరోజు",

  ],

  tomorrow: [

    "tomorrow",
    "tmrw",
    "kal",
    "कल",
    "कल ही",
    "రేపు",
    "రేపే",

  ],

  dayAfterTomorrow: [

    "day after tomorrow",
    "day-after-tomorrow",
    "परसों",
    "परसों को",
    "ఎల్లుండి",

  ],

};


/* =========================================================
   TIME LANGUAGE
========================================================= */

const TIME_HINTS = [

  "am",
  "pm",
  "morning",
  "afternoon",
  "evening",
  "night",
  "सुबह",
  "दोपहर",
  "शाम",
  "रात",
  "ఉదయం",
  "మధ్యాహ్నం",
  "సాయంత్రం",
  "రాత్రి",

];


/* =========================================================
   GENERIC PHRASES
========================================================= */

const BOOKING_TERMS = [

  "book",
  "booking",
  "slot",
  "procurement",
  "sell crop",
  "sell produce",
  "फसल बेच",
  "बुक",
  "बुकिंग",
  "स्लॉट",
  "खरीद",
  "पंट అమ్మకం",
  "బుక్",
  "బుకింగ్",
  "స్లాట్",
  "పంట అమ్మకం",

];


/* =========================================================
   STATE
========================================================= */

export function createEmptyBookingState() {

  return {

    status:
      BOOKING_STATUS.EMPTY,

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

    slotStart:
      null,

    slotEnd:
      null,

    slotLabel:
      null,

    availableDates:
      [],

    availableSlots:
      [],

    lastQuestion:
      null,

    lastUserMessage:
      null,

    confirmationRequested:
      false,

    confirmed:
      false,

    updatedAt:
      Date.now(),

  };

}


/* =========================================================
   STATE NORMALIZATION
========================================================= */

export function normalizeBookingState(
  state
) {

  const base =
    createEmptyBookingState();


  if (
    !state ||
    typeof state !==
      "object"
  ) {

    return base;

  }


  const quantity =
    Number(
      state.quantity
    );


  const safeQuantity =
    Number.isFinite(
      quantity
    ) &&
    quantity > 0 &&
    quantity <= 50000
      ? quantity
      : null;


  return {

    ...base,

    crop:
      typeof state.crop ===
        "string" &&
      state.crop.trim()
        ? cleanText(
            state.crop
          )
        : null,

    quantity:
      safeQuantity,

    centerId:
      state.centerId ??
      null,

    centerName:
      typeof state.centerName ===
        "string"
        ? cleanText(
            state.centerName
          )
        : null,

    date:
      typeof state.date ===
        "string" &&
      state.date.trim()
        ? cleanText(
            state.date
          )
        : null,

    dateLabel:
      typeof state.dateLabel ===
        "string"
        ? cleanText(
            state.dateLabel
          )
        : null,

    slotStart:
      typeof state.slotStart ===
        "string"
        ? cleanText(
            state.slotStart
          )
        : null,

    slotEnd:
      typeof state.slotEnd ===
        "string"
        ? cleanText(
            state.slotEnd
          )
        : null,

    slotLabel:
      typeof state.slotLabel ===
        "string"
        ? cleanText(
            state.slotLabel
          )
        : null,

    availableDates:
      Array.isArray(
        state.availableDates
      )
        ? state.availableDates
        : [],

    availableSlots:
      Array.isArray(
        state.availableSlots
      )
        ? state.availableSlots
        : [],

    lastQuestion:
      typeof state.lastQuestion ===
        "string"
        ? cleanText(
            state.lastQuestion
          )
        : null,

    lastUserMessage:
      typeof state.lastUserMessage ===
        "string"
        ? cleanText(
            state.lastUserMessage
          )
        : null,

    confirmationRequested:
      Boolean(
        state.confirmationRequested
      ),

    confirmed:
      Boolean(
        state.confirmed
      ),

    status:
      Object.values(
        BOOKING_STATUS
      ).includes(
        state.status
      )
        ? state.status
        : BOOKING_STATUS.EMPTY,

    updatedAt:
      Number(
        state.updatedAt
      ) ||
      Date.now(),

  };

}


/* =========================================================
   PERSISTENCE
========================================================= */

export function loadBookingState() {

  const stored =
    readStorageJson(
      BOOKING_STATE_KEY,
      null
    );


  if (
    !stored
  ) {

    return createEmptyBookingState();

  }


  return normalizeBookingState(
    stored
  );

}


export function saveBookingState(
  state
) {

  const normalized =
    normalizeBookingState(
      state
    );


  normalized.updatedAt =
    Date.now();


  writeStorageJson(
    BOOKING_STATE_KEY,
    normalized
  );


  return normalized;

}


export function clearBookingState() {

  removeStorage(
    BOOKING_STATE_KEY
  );


  return createEmptyBookingState();

}


/* =========================================================
   CROP EXTRACTION
========================================================= */

export function extractCrop(
  message
) {

  const text =
    normalizeText(
      message
    );


  if (
    !text
  ) {

    return null;

  }


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

      const target =
        normalizeText(
          alias
        );


      if (
        !target
      ) {

        continue;

      }


      if (
        text.includes(
          target
        )
      ) {

        return crop;

      }

    }

  }


  return null;

}


/* =========================================================
   QUANTITY EXTRACTION
========================================================= */

export function extractQuantity(
  message
) {

  const text =
    normalizeText(
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


  const match =
    explicit ||
    text.match(
      /\b(\d+(?:\.\d+)?)\b/
    );


  if (
    !match
  ) {

    return null;

  }


  const quantity =
    Number(
      match[1]
    );


  if (
    !Number.isFinite(
      quantity
    ) ||
    quantity <= 0 ||
    quantity > 50000
  ) {

    return null;

  }


  return quantity;

}


/* =========================================================
   BOOKING LANGUAGE DETECTION
========================================================= */

export function containsBookingTerm(
  message
) {

  const text =
    normalizeText(
      message
    );


  if (
    !text
  ) {

    return false;

  }


  return BOOKING_TERMS.some(
    term =>
      text.includes(
        normalizeText(
          term
        )
      )
  );

}


/* =========================================================
   DATE HELPERS
========================================================= */

function pad(
  value
) {

  return String(
    value
  ).padStart(
    2,
    "0"
  );

}


function dateToIso(
  date
) {

  return [

    date.getFullYear(),

    pad(
      date.getMonth() + 1
    ),

    pad(
      date.getDate()
    ),

  ].join("-");

}


function getRelativeDate(
  kind
) {

  const date =
    new Date();


  date.setHours(
    0,
    0,
    0,
    0
  );


  if (
    kind ===
    "tomorrow"
  ) {

    date.setDate(
      date.getDate() + 1
    );

  }


  if (
    kind ===
    "dayAfterTomorrow"
  ) {

    date.setDate(
      date.getDate() + 2
    );

  }


  return date;

}


/* =========================================================
   EXTRACT DATE
========================================================= */

export function extractDate(
  message
) {

  const text =
    normalizeText(
      message
    );


  if (
    !text
  ) {

    return null;

  }


  for (
    const [
      kind,
      aliases,
    ] of Object.entries(
      RELATIVE_DATES
    )
  ) {

    for (
      const alias of aliases
    ) {

      if (
        text.includes(
          normalizeText(
            alias
          )
        )
      ) {

        const date =
          getRelativeDate(
            kind
          );


        return {

          date:
            dateToIso(
              date
            ),

          kind,

        };

      }

    }

  }


  /*
   * yyyy-mm-dd
   */

  const isoMatch =
    text.match(
      /\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/
    );


  if (
    isoMatch
  ) {

    const year =
      Number(
        isoMatch[1]
      );


    const month =
      Number(
        isoMatch[2]
      );


    const day =
      Number(
        isoMatch[3]
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

      return {

        date:
          dateToIso(
            date
          ),

        kind:
          "explicit",

      };

    }

  }


  /*
   * dd/mm/yyyy
   */

  const slashMatch =
    text.match(
      /\b(\d{1,2})\/(\d{1,2})\/(20\d{2})\b/
    );


  if (
    slashMatch
  ) {

    const day =
      Number(
        slashMatch[1]
      );


    const month =
      Number(
        slashMatch[2]
      );


    const year =
      Number(
        slashMatch[3]
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

      return {

        date:
          dateToIso(
            date
          ),

        kind:
          "explicit",

      };

    }

  }


  return null;

}


/* =========================================================
   DATE QUESTION
========================================================= */

export function isDateQuestion(
  message
) {

  const text =
    normalizeText(
      message
    );


  if (
    !text
  ) {

    return false;

  }


  const patterns = [

    "what dates are available",
    "which dates are available",
    "available dates",
    "availability dates",
    "what date can i book",
    "which date can i book",
    "when can i book",
    "what day can i book",
    "which days are available",
    "dates available",
    "book on which date",

    "कौन सी तारीख उपलब्ध है",
    "कौन सी तारीखें उपलब्ध हैं",
    "उपलब्ध तारीख",
    "उपलब्ध तारीखें",
    "किस तारीख को बुक कर सकता हूँ",
    "कब बुक कर सकता हूँ",

    "ఏ తేదీలు అందుబాటులో ఉన్నాయి",
    "ఏ తేదీన బుక్ చేయవచ్చు",
    "అందుబాటులో ఉన్న తేదీలు",

  ];


  return patterns.some(
    pattern =>
      text.includes(
        normalizeText(
          pattern
        )
      )
  );

}


/* =========================================================
   SLOT QUESTION
========================================================= */

export function isSlotQuestion(
  message
) {

  const text =
    normalizeText(
      message
    );


  if (
    !text
  ) {

    return false;

  }


  const patterns = [

    "what slots are available",
    "which slots are available",
    "available slots",
    "what time slots",
    "which time",
    "what times are available",
    "arrival times",
    "available timings",
    "available timing",
    "what time can i come",
    "when can i arrive",
    "which slot can i book",
    "book which slot",

    "कौन से स्लॉट उपलब्ध हैं",
    "उपलब्ध स्लॉट",
    "कौन सा समय उपलब्ध है",
    "किस समय आना है",
    "कौन सा टाइम",
    "कौन सा स्लॉट",

    "ఏ స్లాట్లు అందుబాటులో ఉన్నాయి",
    "అందుబాటులో ఉన్న స్లాట్లు",
    "ఏ సమయాల్లో రావచ్చు",
    "ఏ సమయం అందుబాటులో ఉంది",

  ];


  return patterns.some(
    pattern =>
      text.includes(
        normalizeText(
          pattern
        )
      )
  );

}


/* =========================================================
   TIME EXTRACTION
========================================================= */

export function extractTime(
  message
) {

  const text =
    normalizeText(
      message
    );


  if (
    !text
  ) {

    return null;

  }


  /*
   * 10:30
   * 10:30 am
   * 5 pm
   */

  const match =
    text.match(
      /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i
    );


  if (
    !match
  ) {

    return null;

  }


  let hour =
    Number(
      match[1]
    );


  let minute =
    Number(
      match[2] ||
      0
    );


  const period =
    match[3]
      ? match[3].toLowerCase()
      : null;


  if (
    !Number.isFinite(
      hour
    ) ||
    !Number.isFinite(
      minute
    ) ||
    minute > 59
  ) {

    return null;

  }


  if (
    period ===
    "am"
  ) {

    if (
      hour ===
      12
    ) {

      hour =
        0;

    }

  } else if (
    period ===
    "pm"
  ) {

    if (
      hour !==
      12
    ) {

      hour +=
        12;

    }

  }


  if (
    hour >
    23
  ) {

    return null;

  }


  return {

    hour,

    minute,

    value:
      `${pad(hour)}:${pad(minute)}`,

  };

}


/* =========================================================
   TIME QUESTION
========================================================= */

export function containsTimeHint(
  message
) {

  const text =
    normalizeText(
      message
    );


  return TIME_HINTS.some(
    hint =>
      text.includes(
        normalizeText(
          hint
        )
      )
  );

}


/* =========================================================
   MISSING FIELDS
========================================================= */

export function getMissingBookingFields(
  state
) {

  const booking =
    normalizeBookingState(
      state
    );


  const missing = [];


  if (
    !booking.crop
  ) {

    missing.push(
      "crop"
    );

  }


  if (
    !booking.quantity
  ) {

    missing.push(
      "quantity"
    );

  }


  if (
    !booking.centerId
  ) {

    missing.push(
      "center"
    );

  }


  if (
    !booking.date
  ) {

    missing.push(
      "date"
    );

  }


  if (
    !booking.slotStart
  ) {

    missing.push(
      "slot"
    );

  }


  return missing;

}


/* =========================================================
   STATE STATUS
========================================================= */

export function getBookingStatus(
  state
) {

  const booking =
    normalizeBookingState(
      state
    );


  if (
    booking.confirmed
  ) {

    return BOOKING_STATUS.COMPLETED;

  }


  if (
    booking.confirmationRequested
  ) {

    return BOOKING_STATUS.CONFIRMATION;

  }


  const missing =
    getMissingBookingFields(
      booking
    );


  if (
    missing.length ===
    0
  ) {

    return BOOKING_STATUS.READY;

  }


  if (
    booking.crop ||
    booking.quantity ||
    booking.centerId ||
    booking.date ||
    booking.slotStart
  ) {

    return BOOKING_STATUS.COLLECTING;

  }


  return BOOKING_STATUS.EMPTY;

}


/* =========================================================
   APPLY MESSAGE TO STATE
========================================================= */

export function updateBookingFromMessage(
  state,
  message
) {

  const current =
    normalizeBookingState(
      state
    );


  const text =
    cleanText(
      message
    );


  const next = {

    ...current,

    lastUserMessage:
      text,

    confirmationRequested:
      false,

    updatedAt:
      Date.now(),

  };


  const crop =
    extractCrop(
      text
    );


  if (
    crop
  ) {

    next.crop =
      crop;

  }


  const quantity =
    extractQuantity(
      text
    );


  if (
    quantity
  ) {

    next.quantity =
      quantity;

  }


  const date =
    extractDate(
      text
    );


  if (
    date
  ) {

    next.date =
      date.date;

    next.dateLabel =
      date.kind;

  }


  const time =
    extractTime(
      text
    );


  if (
    time &&
    !isSlotQuestion(
      text
    )
  ) {

    next.slotStart =
      time.value;

  }


  next.status =
    getBookingStatus(
      next
    );


  return next;

}


/* =========================================================
   SET CENTER
========================================================= */

export function setBookingCenter(
  state,
  center
) {

  const current =
    normalizeBookingState(
      state
    );


  if (
    !center
  ) {

    return current;

  }


  const next = {

    ...current,

    centerId:
      center.id ??
      null,

    centerName:
      center.name ??
      null,

    updatedAt:
      Date.now(),

  };


  next.status =
    getBookingStatus(
      next
    );


  return next;

}


/* =========================================================
   SET DATE
========================================================= */

export function setBookingDate(
  state,
  date,
  label = null
) {

  const current =
    normalizeBookingState(
      state
    );


  const next = {

    ...current,

    date:
      cleanText(
        date
      ) ||
      null,

    dateLabel:
      label
        ? cleanText(
            label
          )
        : current.dateLabel,

    updatedAt:
      Date.now(),

  };


  next.status =
    getBookingStatus(
      next
    );


  return next;

}


/* =========================================================
   SET SLOT
========================================================= */

export function setBookingSlot(
  state,
  slot
) {

  const current =
    normalizeBookingState(
      state
    );


  if (
    !slot
  ) {

    return current;

  }


  const next = {

    ...current,

    slotStart:
      slot.start ??
      slot.slotStart ??
      null,

    slotEnd:
      slot.end ??
      slot.slotEnd ??
      null,

    slotLabel:
      slot.display ??
      slot.label ??
      null,

    updatedAt:
      Date.now(),

  };


  next.status =
    getBookingStatus(
      next
    );


  return next;

}


/* =========================================================
   AVAILABLE DATES
========================================================= */

export function setAvailableDates(
  state,
  dates
) {

  const current =
    normalizeBookingState(
      state
    );


  return {

    ...current,

    availableDates:
      Array.isArray(
        dates
      )
        ? dates
        : [],

    updatedAt:
      Date.now(),

  };

}


/* =========================================================
   AVAILABLE SLOTS
========================================================= */

export function setAvailableSlots(
  state,
  slots
) {

  const current =
    normalizeBookingState(
      state
    );


  return {

    ...current,

    availableSlots:
      Array.isArray(
        slots
      )
        ? slots
        : [],

    updatedAt:
      Date.now(),

  };

}


/* =========================================================
   CONFIRMATION
========================================================= */

export function requestBookingConfirmation(
  state
) {

  const current =
    normalizeBookingState(
      state
    );


  const missing =
    getMissingBookingFields(
      current
    );


  if (
    missing.length >
    0
  ) {

    return {

      state:
        current,

      ready:
        false,

      missing,

    };

  }


  const next = {

    ...current,

    status:
      BOOKING_STATUS.CONFIRMATION,

    confirmationRequested:
      true,

    updatedAt:
      Date.now(),

  };


  return {

    state:
      next,

    ready:
      true,

    missing: [],

  };

}


/* =========================================================
   MARK COMPLETED
========================================================= */

export function markBookingCompleted(
  state
) {

  const current =
    normalizeBookingState(
      state
    );


  return {

    ...current,

    status:
      BOOKING_STATUS.COMPLETED,

    confirmed:
      true,

    confirmationRequested:
      false,

    updatedAt:
      Date.now(),

  };

}


/* =========================================================
   BOOKING PARAMS
========================================================= */

export function getBookingParams(
  state
) {

  const booking =
    normalizeBookingState(
      state
    );


  const params = {


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

    slotStart:
      booking.slotStart,

    slotEnd:
      booking.slotEnd,

    slotLabel:
      booking.slotLabel,

  };


  return sanitizeActionParams(
    {
      crop:
        params.crop,

      quantity:
        params.quantity,

    }
  )
    ? params
    : {

        ...params,

      };

}


/* =========================================================
   BOOKING SUMMARY
========================================================= */

export function getBookingSummary(
  state,
  language = "en"
) {

  const booking =
    normalizeBookingState(
      state
    );


  const names =
    CROP_NAMES[
      language
    ] ||
    CROP_NAMES.en;


  const cropName =
    booking.crop
      ? names[
          booking.crop
        ] ||
        booking.crop
      : null;


  return {

    crop:
      cropName,

    quantity:
      booking.quantity
        ? `${booking.quantity} kg`
        : null,

    center:
      booking.centerName ||
      null,

    date:
      booking.dateLabel ||
      booking.date ||
      null,

    slot:
      booking.slotLabel ||
      (
        booking.slotStart
          ? booking.slotEnd
            ? `${booking.slotStart} – ${booking.slotEnd}`
            : booking.slotStart
          : null
      ),

    complete:
      getMissingBookingFields(
        booking
      ).length ===
      0,

    missing:
      getMissingBookingFields(
        booking
      ),

  };

}


/* =========================================================
   NEXT REQUIRED FIELD
========================================================= */

export function getNextBookingField(
  state
) {

  const missing =
    getMissingBookingFields(
      state
    );


  return missing[0] ||
    null;

}


/* =========================================================
   HUMAN-READABLE FIELD NAME
========================================================= */

export function getBookingFieldLabel(
  field,
  language = "en"
) {

  const labels = {

    en: {

      crop:
        "crop",

      quantity:
        "quantity",

      center:
        "procurement center",

      date:
        "date",

      slot:
        "arrival time slot",

    },

    hi: {

      crop:
        "फसल",

      quantity:
        "मात्रा",

      center:
        "खरीद केंद्र",

      date:
        "तारीख",

      slot:
        "आने का समय",

    },

    te: {

      crop:
        "పంట",

      quantity:
        "పరిమాణం",

      center:
        "కొనుగోలు కేంద్రం",

      date:
        "తేదీ",

      slot:
        "రాక సమయం",

    },

  };


  return (
    labels[
      language
    ]?.[
      field
    ] ||
    labels.en[
      field
    ] ||
    field
  );

}


/* =========================================================
   CONVERSATIONAL STEP
========================================================= */

export function getNextBookingStep(
  state
) {

  const booking =
    normalizeBookingState(
      state
    );


  const missing =
    getMissingBookingFields(
      booking
    );


  if (
    missing.length ===
    0
  ) {

    return {

      type:
        "CONFIRMATION",

      field:
        null,

    };

  }


  return {

    type:
      "COLLECT",

    field:
      missing[0],

  };

}


/* =========================================================
   SET CONFIRMATION STATE
========================================================= */

export function beginConfirmation(
  state
) {

  const result =
    requestBookingConfirmation(
      state
    );


  if (
    !result.ready
  ) {

    return {

      state:
        result.state,

      ready:
        false,

      missing:
        result.missing,

    };

  }


  return {

    state:
      saveBookingState(
        result.state
      ),

    ready:
      true,

    missing: [],

  };

}


/* =========================================================
   RESET CONFIRMATION
========================================================= */

export function resetConfirmation(
  state
) {

  const current =
    normalizeBookingState(
      state
    );


  return saveBookingState({

    ...current,

    confirmationRequested:
      false,

    confirmed:
      false,

    status:
      getBookingStatus(
        {
          ...current,
          confirmationRequested:
            false,
          confirmed:
            false,
        }
      ),

  });

}


/* =========================================================
   BUILD BOOKING CONTEXT
========================================================= */

export function buildBookingContext(
  state,
  language = "en"
) {

  const booking =
    normalizeBookingState(
      state
    );


  const summary =
    getBookingSummary(
      booking,
      language
    );


  const nextStep =
    getNextBookingStep(
      booking
    );


  return {

    status:
      getBookingStatus(
        booking
      ),

    booking,

    summary,

    nextStep,

    missingFields:
      getMissingBookingFields(
        booking
      ),

    nextField:
      getNextBookingField(
        booking
      ),

    nextFieldLabel:
      getBookingFieldLabel(
        getNextBookingField(
          booking
        ),
        language
      ),

    availableDates:
      booking.availableDates,

    availableSlots:
      booking.availableSlots,

  };

}


/* =========================================================
   BOOKING REQUEST DETECTION
========================================================= */

export function looksLikeBookingRequest(
  message
) {

  const text =
    normalizeText(
      message
    );


  if (
    !text
  ) {

    return false;

  }


  if (
    containsBookingTerm(
      text
    )
  ) {

    return true;

  }


  const crop =
    extractCrop(
      text
    );


  const quantity =
    extractQuantity(
      text
    );


  return Boolean(
    crop &&
    quantity
  );

}


/* =========================================================
   UPDATE + SAVE
========================================================= */

export function applyBookingMessage(
  message,
  state =
    null
) {

  const current =
    state
      ? normalizeBookingState(
          state
        )
      : loadBookingState();


  const next =
    updateBookingFromMessage(
      current,
      message
    );


  return saveBookingState(
    next
  );

}


/* =========================================================
   EXPORT OBJECT
========================================================= */

export const assistantBooking = {

  createEmptyBookingState,

  normalizeBookingState,

  loadBookingState,

  saveBookingState,

  clearBookingState,

  extractCrop,

  extractQuantity,

  extractDate,

  extractTime,

  isDateQuestion,

  isSlotQuestion,

  containsTimeHint,

  containsBookingTerm,

  looksLikeBookingRequest,

  getMissingBookingFields,

  getBookingStatus,

  getNextBookingField,

  getNextBookingStep,

  getBookingFieldLabel,

  updateBookingFromMessage,

  applyBookingMessage,

  setBookingCenter,

  setBookingDate,

  setBookingSlot,

  setAvailableDates,

  setAvailableSlots,

  requestBookingConfirmation,

  beginConfirmation,

  resetConfirmation,

  markBookingCompleted,

  getBookingParams,

  getBookingSummary,

  buildBookingContext,

};


/* =========================================================
   DEVELOPMENT TESTS
========================================================= */

if (
  typeof import.meta !==
    "undefined" &&
  import.meta.env?.DEV
) {

  const examples = [

    "book 50 kg paddy",

    "book 500kg wheat",

    "I want to sell 100 kg maize",

    "tomorrow",

    "show available dates",

    "what slots are available",

    "10:30 am",

  ];


  for (
    const example of
    examples
  ) {

    console.debug(
      "[KrishiSetu Booking]",
      example,
      {
        crop:
          extractCrop(
            example
          ),

        quantity:
          extractQuantity(
            example
          ),

        date:
          extractDate(
            example
          ),

        time:
          extractTime(
            example
          ),

        dateQuestion:
          isDateQuestion(
            example
          ),

        slotQuestion:
          isSlotQuestion(
            example
          ),

      }
    );

  }

}