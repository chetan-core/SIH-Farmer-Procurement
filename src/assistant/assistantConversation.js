/* =========================================================
   KRISHISETU AI BOOKING CONVERSATION ENGINE
=========================================================

   PURPOSE

   This module manages the conversational state of a
   procurement booking.

   Example:

      User:
        "Book 50 kg of paddy"

      Assistant:
        Crop      = Paddy
        Quantity  = 50 kg
        Date      = not selected
        Slot      = not selected

        "I have saved paddy and 50 kg.
         We still need your date and arrival time.
         Which date would you like?"

      User:
        "What dates are available?"

      Assistant:
        Shows exact available dates supplied by the
        application.

      User:
        "Tomorrow"

      Assistant:
        Selects tomorrow.

      User:
        "What times are available?"

      Assistant:
        Shows exact available slots.

      User:
        "11 AM"

      Assistant:
        Selects the slot.

      Assistant:
        Shows complete booking review.

      User:
        "Yes"

      Assistant:
        Returns confirmation intent.

   IMPORTANT

   This module does NOT:

   - perform API calls
   - navigate
   - render UI
   - directly save a booking
   - directly manipulate FarmerBook.jsx

   The controller/executor performs those operations.

========================================================= */

import {
  cleanText,
  normalizeText,
  sanitizeActionParams,
} from "./assistantUtils";


/* =========================================================
   CONSTANTS
========================================================= */

export const BOOKING_STEPS = {

  EMPTY:
    "EMPTY",

  DETAILS:
    "DETAILS",

  DATE:
    "DATE",

  SLOT:
    "SLOT",

  REVIEW:
    "REVIEW",

  CONFIRMED:
    "CONFIRMED",

  CANCELLED:
    "CANCELLED",

};


export const BOOKING_INTENTS = {

  START:
    "START_BOOKING",

  UPDATE:
    "UPDATE_BOOKING",

  SHOW_STATE:
    "SHOW_BOOKING_STATE",

  ASK_DATES:
    "ASK_AVAILABLE_DATES",

  SELECT_DATE:
    "SELECT_DATE",

  ASK_SLOTS:
    "ASK_AVAILABLE_SLOTS",

  SELECT_SLOT:
    "SELECT_SLOT",

  REVIEW:
    "REVIEW_BOOKING",

  CONFIRM:
    "CONFIRM_BOOKING",

  CANCEL:
    "CANCEL_BOOKING",

  NONE:
    "NONE",

};


/* =========================================================
   CROP DEFINITIONS
========================================================= */

const CROP_ALIASES = {

  wheat: [

    "wheat",

    "gehu",

    "gehun",

    "gehoo",

    "gahu",

    "गेहूं",

    "गेहू",

    "गहूं",

    "गहू",

    "गेहूँ",

    "గోధుమ",

    "గోధుమలు",

  ],

  paddy: [

    "paddy",

    "rice",

    "dhan",

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
   STATE FACTORY
========================================================= */

export function createEmptyBookingState() {

  return {

    active:
      false,

    step:
      BOOKING_STEPS.EMPTY,

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

    slotId:
      null,

    slotStart:
      null,

    slotEnd:
      null,

    slotDisplay:
      null,

    availableDates:
      [],

    availableSlots:
      [],

    awaiting:
      null,

    readyForConfirmation:
      false,

    completed:
      false,

    cancelled:
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

  const source =
    state &&
    typeof state ===
      "object"
      ? state
      : {};


  const safeDates =
    Array.isArray(
      source.availableDates
    )
      ? source.availableDates
      : [];


  const safeSlots =
    Array.isArray(
      source.availableSlots
    )
      ? source.availableSlots
      : [];


  return {

    ...createEmptyBookingState(),

    ...source,

    active:
      Boolean(
        source.active
      ),

    crop:
      typeof source.crop ===
        "string"
        ? source.crop
        : null,

    quantity:
      Number.isFinite(
        Number(
          source.quantity
        )
      )
        ? Number(
            source.quantity
          )
        : null,

    centerId:
      source.centerId ??
      null,

    centerName:
      typeof source.centerName ===
        "string"
        ? source.centerName
        : null,

    date:
      typeof source.date ===
        "string"
        ? source.date
        : null,

    dateLabel:
      typeof source.dateLabel ===
        "string"
        ? source.dateLabel
        : null,

    slotId:
      source.slotId ??
      null,

    slotStart:
      typeof source.slotStart ===
        "string"
        ? source.slotStart
        : null,

    slotEnd:
      typeof source.slotEnd ===
        "string"
        ? source.slotEnd
        : null,

    slotDisplay:
      typeof source.slotDisplay ===
        "string"
        ? source.slotDisplay
        : null,

    availableDates:
      safeDates,

    availableSlots:
      safeSlots,

    awaiting:
      source.awaiting ||
      null,

    readyForConfirmation:
      Boolean(
        source.readyForConfirmation
      ),

    completed:
      Boolean(
        source.completed
      ),

    cancelled:
      Boolean(
        source.cancelled
      ),

    updatedAt:
      Date.now(),

  };

}


/* =========================================================
   CROP PARSING
========================================================= */

function findCrop(
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

      const normalizedAlias =
        normalizeText(
          alias
        );


      if (
        normalizedAlias &&
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


export function extractCrop(
  message
) {

  return findCrop(
    message
  );

}


/* =========================================================
   QUANTITY PARSING
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


  if (
    explicit
  ) {

    const quantity =
      Number(
        explicit[1]
      );


    if (
      Number.isFinite(
        quantity
      ) &&
      quantity > 0 &&
      quantity <= 50000
    ) {

      return quantity;

    }

  }


  /*
   * A bare number is accepted only when the user
   * is clearly talking about booking/produce/quantity.
   */

  const bare =
    text.match(
      /\b(\d+(?:\.\d+)?)\b/
    );


  if (
    !bare
  ) {

    return null;

  }


  const quantity =
    Number(
      bare[1]
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


  const contextWords = [

    "book",

    "booking",

    "quantity",

    "kg",

    "kilo",

    "crop",

    "wheat",

    "paddy",

    "rice",

    "maize",

    "corn",

    "cotton",

    "गेहूं",

    "धान",

    "चावल",

    "मक्का",

    "कपास",

    "గోధుమ",

    "వరి",

    "మొక్కజొన్న",

    "పత్తి",

  ];


  const hasBookingContext =
    contextWords.some(
      word =>
        text.includes(
          normalizeText(
            word
          )
        )
    );


  return hasBookingContext
    ? quantity
    : null;

}


/* =========================================================
   DATE COMMAND DETECTION
========================================================= */

const DATE_QUESTION_PHRASES = [

  "what dates are available",

  "which dates are available",

  "what dates can i book",

  "which dates can i book",

  "show available dates",

  "show me available dates",

  "available dates",

  "booking dates",

  "available days",

  "what days are available",

  "which days are available",

  "when can i book",

  "when can i come",

  "कौन सी तारीख उपलब्ध है",

  "कौन सी तारीखें उपलब्ध हैं",

  "उपलब्ध तारीख",

  "उपलब्ध तारीखें",

  "कौन से दिन उपलब्ध हैं",

  "ఎన్ని తేదీలు అందుబాటులో ఉన్నాయి",

  "ఏ తేదీలు అందుబాటులో ఉన్నాయి",

  "అందుబాటులో ఉన్న తేదీలు",

];


const DATE_SELECTION_HINTS = [

  "today",

  "tomorrow",

  "day after tomorrow",

  "next day",

  "आज",

  "कल",

  "परसों",

  "आज की तारीख",

  "మరుసటి రోజు",

  "రేపు",

  "ఎల్లుండి",

];


export function isDateQuestion(
  message
) {

  const text =
    normalizeText(
      message
    );


  return DATE_QUESTION_PHRASES.some(
    phrase =>
      text.includes(
        normalizeText(
          phrase
        )
      )
  );

}


export function containsDateSelectionHint(
  message
) {

  const text =
    normalizeText(
      message
    );


  return DATE_SELECTION_HINTS.some(
    phrase =>
      text.includes(
        normalizeText(
          phrase
        )
      )
  );

}


/* =========================================================
   SLOT QUESTION DETECTION
========================================================= */

const SLOT_QUESTION_PHRASES = [

  "what times are available",

  "which times are available",

  "what slots are available",

  "which slots are available",

  "show available slots",

  "show me available slots",

  "available slots",

  "available timings",

  "what time can i come",

  "which time can i come",

  "what time should i come",

  "what timings are available",

  "show timings",

  "show times",

  "कौन से स्लॉट उपलब्ध हैं",

  "कौन सा समय उपलब्ध है",

  "कौन से समय उपलब्ध हैं",

  "उपलब्ध स्लॉट",

  "उपलब्ध समय",

  "कौन सा टाइम उपलब्ध है",

  "ఏ సమయాలు అందుబాటులో ఉన్నాయి",

  "ఏ స్లాట్లు అందుబాటులో ఉన్నాయి",

  "అందుబాటులో ఉన్న స్లాట్లు",

  "అందుబాటులో ఉన్న సమయాలు",

];


export function isSlotQuestion(
  message
) {

  const text =
    normalizeText(
      message
    );


  return SLOT_QUESTION_PHRASES.some(
    phrase =>
      text.includes(
        normalizeText(
          phrase
        )
      )
  );

}


/* =========================================================
   REVIEW / STATE QUESTIONS
========================================================= */

const STATE_QUESTION_PHRASES = [

  "what have i selected",

  "what did i select",

  "what is selected",

  "what have i chosen",

  "show my booking",

  "show booking details",

  "show my booking details",

  "what are my booking details",

  "what do i have",

  "what is my booking",

  "what have we selected",

  "मेरी बुकिंग में क्या चुना है",

  "मैंने क्या चुना है",

  "अभी क्या चुना है",

  "मेरी बुकिंग दिखाओ",

  "నేను ఏమి ఎంచుకున్నాను",

  "నా బుకింగ్ వివరాలు చూపించు",

];


export function isStateQuestion(
  message
) {

  const text =
    normalizeText(
      message
    );


  return STATE_QUESTION_PHRASES.some(
    phrase =>
      text.includes(
        normalizeText(
          phrase
        )
      )
  );

}


/* =========================================================
   CONFIRMATION / CANCELLATION
========================================================= */

const CONFIRMATION_WORDS = [

  "yes",

  "yeah",

  "yep",

  "yup",

  "okay",

  "ok",

  "sure",

  "confirm",

  "confirm it",

  "confirm booking",

  "book it",

  "do it",

  "go ahead",

  "continue",

  "proceed",

  "yes please",

  "हाँ",

  "हां",

  "हाँ करो",

  "करो",

  "पक्का",

  "पुष्टि",

  "पुष्टि करो",

  "अवश्य",

  "అవును",

  "సరే",

  "చేయండి",

  "నిర్ధారించండి",

];


const CANCELLATION_WORDS = [

  "no",

  "nope",

  "cancel",

  "cancel it",

  "stop",

  "forget it",

  "never mind",

  "not now",

  "don't",

  "do not",

  "नहीं",

  "रद्द",

  "रद्द करो",

  "मत करो",

  "छोड़ो",

  "रहने दो",

  "లేదు",

  "వద్దు",

  "ఆపండి",

  "రద్దు",

];


function exactOrContains(
  message,
  values
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


  return values.some(
    value => {

      const normalized =
        normalizeText(
          value
        );


      return (
        text ===
        normalized ||
        text.includes(
          normalized
        )
      );

    }
  );

}


export function isBookingConfirmation(
  message
) {

  return exactOrContains(
    message,
    CONFIRMATION_WORDS
  );

}


export function isBookingCancellation(
  message
) {

  return exactOrContains(
    message,
    CANCELLATION_WORDS
  );

}


/* =========================================================
   TIME PARSING
========================================================= */

export function parseRequestedTime(
  message
) {

  const raw =
    String(
      message || ""
    )
      .trim();


  if (
    !raw
  ) {

    return null;

  }


  const text =
    normalizeText(
      raw
    );


  const direct =
    text.match(
      /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i
    );


  if (
    direct
  ) {

    let hours =
      Number(
        direct[1]
      );


    const minutes =
      Number(
        direct[2] ||
        0
      );


    const period =
      direct[3]
        .toLowerCase();


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


    if (
      hours >=
        0 &&
      hours <=
        23 &&
      minutes >=
        0 &&
      minutes <=
        59
    ) {

      return {

        hours,

        minutes,

        value:
          `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,

      };

    }

  }


  const twentyFour =
    text.match(
      /\b([01]?\d|2[0-3]):([0-5]\d)\b/
    );


  if (
    twentyFour
  ) {

    const hours =
      Number(
        twentyFour[1]
      );


    const minutes =
      Number(
        twentyFour[2]
      );


    return {

      hours,

      minutes,

      value:
        `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,

    };

  }


  return null;

}


/* =========================================================
   DATE HELPERS
========================================================= */

function localDateToISO(
  date
) {

  const year =
    date.getFullYear();


  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );


  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );


  return `${year}-${month}-${day}`;

}


function getDateOffset(
  offset
) {

  const date =
    new Date();


  date.setHours(
    0,
    0,
    0,
    0
  );


  date.setDate(
    date.getDate() +
    offset
  );


  return date;

}


export function resolveRelativeDate(
  message
) {

  const text =
    normalizeText(
      message
    );


  if (
    text ===
      "today" ||
    text ===
      "आज" ||
    text.includes(
      "today"
    )
  ) {

    return getDateOffset(
      0
    );

  }


  if (
    text ===
      "tomorrow" ||
    text ===
      "कल" ||
    text.includes(
      "tomorrow"
    )
  ) {

    return getDateOffset(
      1
    );

  }


  if (
    text ===
      "day after tomorrow" ||
    text ===
      "परसों"
  ) {

    return getDateOffset(
      2
    );

  }


  if (
    text ===
      "next day" ||
    text ===
      "रేపు"
  ) {

    return getDateOffset(
      1
    );

  }


  return null;

}


function parseISODate(
  message
) {

  const text =
    normalizeText(
      message
    );


  const iso =
    text.match(
      /\b(20\d{2})[-/](\d{1,2})[-/](\d{1,2})\b/
    );


  if (
    iso
  ) {

    const date =
      new Date(
        Number(
          iso[1]
        ),
        Number(
          iso[2]
        ) - 1,
        Number(
          iso[3]
        )
      );


    if (
      !Number.isNaN(
        date.getTime()
      )
    ) {

      return date;

    }

  }


  return null;

}


function parseNaturalDate(
  message
) {

  const text =
    normalizeText(
      message
    );


  const relative =
    resolveRelativeDate(
      text
    );


  if (
    relative
  ) {

    return relative;

  }


  return parseISODate(
    text
  );

}


/* =========================================================
   DATE MATCHING
========================================================= */

function normalizeAvailableDate(
  item
) {

  if (
    typeof item ===
      "string"
  ) {

    return {

      date:
        item,

      label:
        item,

    };

  }


  if (
    !item ||
    typeof item !==
      "object"
  ) {

    return null;

  }


  return {

    date:
      item.date ||
      item.id ||
      "",

    label:
      item.label ||
      item.display ||
      item.date ||
      item.id ||
      "",

    day:
      item.day ??
      null,

    month:
      item.month ??
      null,

  };

}


export function findMatchingAvailableDate(
  message,
  availableDates
) {

  const dates =
    Array.isArray(
      availableDates
    )
      ? availableDates
          .map(
            normalizeAvailableDate
          )
          .filter(
            item =>
              item?.date
          )
      : [];


  if (
    dates.length ===
    0
  ) {

    return null;

  }


  const relative =
    parseNaturalDate(
      message
    );


  if (
    relative
  ) {

    const target =
      localDateToISO(
        relative
      );


    const match =
      dates.find(
        item =>
          String(
            item.date
          ) ===
          target
      );


    if (
      match
    ) {

      return match;

    }

  }


  const text =
    normalizeText(
      message
    );


  const direct =
    dates.find(
      item => {

        const candidates = [

          item.date,

          item.label,

          item.day,

          item.month,

        ];


        return candidates.some(
          value =>
            value !==
              null &&
            value !==
              undefined &&
            text.includes(
              normalizeText(
                value
              )
            )
        );

      }
    );


  return direct ||
    null;

}


/* =========================================================
   SLOT MATCHING
========================================================= */

function normalizeAvailableSlot(
  item
) {

  if (
    !item ||
    typeof item !==
      "object"
  ) {

    return null;

  }


  return {

    ...item,

    id:
      item.id ??
      null,

    start:
      item.start ??
      item.slotStart ??
      item.slot_start ??
      "",

    end:
      item.end ??
      item.slotEnd ??
      item.slot_end ??
      "",

    display:
      item.display ||
      item.label ||
      item.start ||
      "",

    remaining:
      Number(
        item.remaining ??
        0
      ),

  };

}


function timeDifferenceInMinutes(
  a,
  b
) {

  if (
    !a ||
    !b
  ) {

    return Number.POSITIVE_INFINITY;

  }


  const parse =
    value => {

      const match =
        String(
          value
        )
          .match(
            /^(\d{1,2}):(\d{2})/
          );


      if (
        !match
      ) {

        return null;

      }


      return (
        Number(
          match[1]
        ) *
        60 +
        Number(
          match[2]
        )
      );

    };


  const first =
    parse(
      a
    );


  const second =
    parse(
      b
    );


  if (
    first ===
      null ||
    second ===
      null
  ) {

    return Number.POSITIVE_INFINITY;

  }


  return Math.abs(
    first -
    second
  );

}


export function findMatchingAvailableSlot(
  message,
  availableSlots
) {

  const slots =
    Array.isArray(
      availableSlots
    )
      ? availableSlots
          .map(
            normalizeAvailableSlot
          )
          .filter(
            slot =>
              slot &&
              Number(
                slot.remaining
              ) > 0
          )
      : [];


  if (
    slots.length ===
    0
  ) {

    return null;

  }


  const requestedTime =
    parseRequestedTime(
      message
    );


  if (
    requestedTime
  ) {

    const exact =
      slots.find(
        slot =>
          String(
            slot.start
          ) ===
          requestedTime.value
      );


    if (
      exact
    ) {

      return exact;

    }


    let nearest =
      null;


    let nearestDistance =
      Number.POSITIVE_INFINITY;


    for (
      const slot of slots
    ) {

      const distance =
        timeDifferenceInMinutes(
          slot.start,
          requestedTime.value
        );


      if (
        distance <
        nearestDistance
      ) {

        nearest =
          slot;

        nearestDistance =
          distance;

      }

    }


    /*
     * Do not silently choose a wildly different slot.
     */

    if (
      nearest &&
      nearestDistance <=
        45
    ) {

      return nearest;

    }

  }


  const text =
    normalizeText(
      message
    );


  const textual =
    slots.find(
      slot =>
        text.includes(
          normalizeText(
            slot.display
          )
        ) ||
        text.includes(
          normalizeText(
            slot.start
          )
        )
    );


  return textual ||
    null;

}


/* =========================================================
   MISSING DETAILS
========================================================= */

export function getMissingBookingDetails(
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
    booking.quantity ===
      null ||
    booking.quantity <=
      0
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
   NEXT STEP
========================================================= */

export function getNextBookingStep(
  state
) {

  const booking =
    normalizeBookingState(
      state
    );


  if (
    booking.cancelled
  ) {

    return BOOKING_STEPS.CANCELLED;

  }


  if (
    booking.completed
  ) {

    return BOOKING_STEPS.CONFIRMED;

  }


  if (
    !booking.crop ||
    booking.quantity ===
      null
  ) {

    return BOOKING_STEPS.DETAILS;

  }


  if (
    !booking.centerId
  ) {

    return BOOKING_STEPS.DETAILS;

  }


  if (
    !booking.date
  ) {

    return BOOKING_STEPS.DATE;

  }


  if (
    !booking.slotStart
  ) {

    return BOOKING_STEPS.SLOT;

  }


  return BOOKING_STEPS.REVIEW;

}


/* =========================================================
   STATE TEXT
========================================================= */

export function getBookingStateSummary(
  state,
  language = "en"
) {

  const booking =
    normalizeBookingState(
      state
    );


  const crop =
    booking.crop
      ? (
          CROP_NAMES[
            language
          ]?.[
            booking.crop
          ] ||
          booking.crop
        )
      : null;


  const quantity =
    booking.quantity !==
      null
      ? `${booking.quantity} kg`
      : null;


  const center =
    booking.centerName ||
    booking.centerId ||
    null;


  const date =
    booking.dateLabel ||
    booking.date ||
    null;


  const slot =
    booking.slotDisplay ||
    (
      booking.slotStart
        ? `${booking.slotStart}${booking.slotEnd ? ` – ${booking.slotEnd}` : ""}`
        : null
    );


  const parts = [];


  if (
    crop
  ) {

    parts.push(
      language === "hi"
        ? `फसल: ${crop}`
        : language === "te"
          ? `పంట: ${crop}`
          : `Crop: ${crop}`
    );

  }


  if (
    quantity
  ) {

    parts.push(
      language === "hi"
        ? `मात्रा: ${quantity}`
        : language === "te"
          ? `పరిమాణం: ${quantity}`
          : `Quantity: ${quantity}`
    );

  }


  if (
    center
  ) {

    parts.push(
      language === "hi"
        ? `केंद्र: ${center}`
        : language === "te"
          ? `కేంద్రం: ${center}`
          : `Center: ${center}`
    );

  }


  if (
    date
  ) {

    parts.push(
      language === "hi"
        ? `तारीख: ${date}`
        : language === "te"
          ? `తేదీ: ${date}`
          : `Date: ${date}`
    );

  }


  if (
    slot
  ) {

    parts.push(
      language === "hi"
        ? `समय: ${slot}`
        : language === "te"
          ? `సమయం: ${slot}`
          : `Time: ${slot}`
    );

  }


  if (
    parts.length ===
    0
  ) {

    return language === "hi"
      ? "अभी कोई बुकिंग विवरण चुना नहीं गया है।"
      : language === "te"
        ? "ఇంకా బుకింగ్ వివరాలు ఎంచుకోలేదు."
        : "No booking details have been selected yet.";

  }


  return parts.join(
    " • "
  );

}


/* =========================================================
   AVAILABLE DATE FORMAT
========================================================= */

function formatDateList(
  dates,
  language
) {

  if (
    !Array.isArray(
      dates
    ) ||
    dates.length ===
    0
  ) {

    return language === "hi"
      ? "इस समय कोई उपलब्ध तारीख नहीं मिली।"
      : language === "te"
        ? "ప్రస్తుతం అందుబాటులో ఉన్న తేదీలు లేవు."
        : "No available dates were found.";

  }


  return dates
    .map(
      item => {

        const normalized =
          normalizeAvailableDate(
            item
          );


        if (
          !normalized
        ) {

          return null;

        }


        if (
          normalized.label
        ) {

          return normalized.label;

        }


        return normalized.date;

      }
    )
    .filter(Boolean)
    .join(
      ", "
    );

}


/* =========================================================
   AVAILABLE SLOT FORMAT
========================================================= */

function formatSlotList(
  slots,
  language
) {

  if (
    !Array.isArray(
      slots
    ) ||
    slots.length ===
    0
  ) {

    return language === "hi"
      ? "इस तारीख के लिए कोई उपलब्ध स्लॉट नहीं मिला।"
      : language === "te"
        ? "ఈ తేదీకి అందుబాటులో ఉన్న స్లాట్లు లేవు."
        : "No available slots were found for this date.";

  }


  return slots
    .map(
      item => {

        const normalized =
          normalizeAvailableSlot(
            item
          );


        return normalized?.display ||
          normalized?.start ||
          null;

      }
    )
    .filter(Boolean)
    .join(
      ", "
    );

}


/* =========================================================
   RESPONSE HELPERS
========================================================= */

function response(
  intent,
  extras = {}
) {

  return {

    intent,

    handled:
      true,

    ...extras,

  };

}


/* =========================================================
   APPLY USER DETAILS
========================================================= */

export function applyBookingDetails(
  state,
  message
) {

  const booking =
    normalizeBookingState(
      state
    );


  const crop =
    findCrop(
      message
    );


  const quantity =
    extractQuantity(
      message
    );


  const next = {

    ...booking,

    active:
      true,

    cancelled:
      false,

    completed:
      false,

    readyForConfirmation:
      false,

    updatedAt:
      Date.now(),

  };


  if (
    crop
  ) {

    next.crop =
      crop;

  }


  if (
    quantity !==
      null
  ) {

    next.quantity =
      quantity;

  }


  /*
   * A change to crop or quantity invalidates
   * downstream availability/slot information.
   */

  if (
    crop &&
    crop !==
      booking.crop
  ) {

    next.date =
      null;

    next.dateLabel =
      null;

    next.slotId =
      null;

    next.slotStart =
      null;

    next.slotEnd =
      null;

    next.slotDisplay =
      null;

  }


  if (
    quantity !==
      null &&
    quantity !==
      booking.quantity
  ) {

    next.date =
      null;

    next.dateLabel =
      null;

    next.slotId =
      null;

    next.slotStart =
      null;

    next.slotEnd =
      null;

    next.slotDisplay =
      null;

  }


  next.step =
    getNextBookingStep(
      next
    );


  return next;

}


/* =========================================================
   SET DATE
========================================================= */

export function setBookingDate(
  state,
  date
) {

  const booking =
    normalizeBookingState(
      state
    );


  const normalized =
    normalizeAvailableDate(
      date
    );


  if (
    !normalized?.date
  ) {

    return booking;

  }


  return {

    ...booking,

    active:
      true,

    date:
      normalized.date,

    dateLabel:
      normalized.label,

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

    awaiting:
      "slot",

    step:
      BOOKING_STEPS.SLOT,

    updatedAt:
      Date.now(),

  };

}


/* =========================================================
   SET SLOT
========================================================= */

export function setBookingSlot(
  state,
  slot
) {

  const booking =
    normalizeBookingState(
      state
    );


  const normalized =
    normalizeAvailableSlot(
      slot
    );


  if (
    !normalized?.start
  ) {

    return booking;

  }


  return {

    ...booking,

    active:
      true,

    slotId:
      normalized.id,

    slotStart:
      normalized.start,

    slotEnd:
      normalized.end,

    slotDisplay:
      normalized.display,

    readyForConfirmation:
      true,

    awaiting:
      "confirmation",

    step:
      BOOKING_STEPS.REVIEW,

    updatedAt:
      Date.now(),

  };

}


/* =========================================================
   SET CENTER
========================================================= */

export function setBookingCenter(
  state,
  center
) {

  const booking =
    normalizeBookingState(
      state
    );


  if (
    !center
  ) {

    return booking;

  }


  const centerId =
    center.id ??
    center.centerId ??
    center.center_id ??
    null;


  if (
    centerId ===
    null
  ) {

    return booking;

  }


  return {

    ...booking,

    active:
      true,

    centerId:
      String(
        centerId
      ),

    centerName:
      center.name ||
      center.label ||
      String(
        centerId
      ),

    date:
      null,

    dateLabel:
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

    awaiting:
      "date",

    step:
      BOOKING_STEPS.DATE,

    updatedAt:
      Date.now(),

  };

}


/* =========================================================
   SET AVAILABLE DATES
========================================================= */

export function setAvailableDates(
  state,
  dates
) {

  const booking =
    normalizeBookingState(
      state
    );


  const safeDates =
    Array.isArray(
      dates
    )
      ? dates
          .map(
            normalizeAvailableDate
          )
          .filter(
            item =>
              item?.date
          )
      : [];


  return {

    ...booking,

    availableDates:
      safeDates,

    awaiting:
      booking.date
        ? "slot"
        : "date",

    updatedAt:
      Date.now(),

  };

}


/* =========================================================
   SET AVAILABLE SLOTS
========================================================= */

export function setAvailableSlots(
  state,
  slots
) {

  const booking =
    normalizeBookingState(
      state
    );


  const safeSlots =
    Array.isArray(
      slots
    )
      ? slots
          .map(
            normalizeAvailableSlot
          )
          .filter(
            slot =>
              slot &&
              Number(
                slot.remaining
              ) > 0
          )
      : [];


  return {

    ...booking,

    availableSlots:
      safeSlots,

    awaiting:
      safeSlots.length
        ? "slot"
        : booking.awaiting,

    updatedAt:
      Date.now(),

  };

}


/* =========================================================
   CLEAR DOWNSTREAM DATE/SLOT
========================================================= */

export function clearBookingDateAndSlot(
  state
) {

  const booking =
    normalizeBookingState(
      state
    );


  return {

    ...booking,

    date:
      null,

    dateLabel:
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

    awaiting:
      "date",

    step:
      BOOKING_STEPS.DATE,

    updatedAt:
      Date.now(),

  };

}


/* =========================================================
   CANCEL BOOKING FLOW
========================================================= */

export function cancelBookingFlow(
  state
) {

  return {

    ...createEmptyBookingState(),

    cancelled:
      true,

    active:
      false,

    step:
      BOOKING_STEPS.CANCELLED,

    updatedAt:
      Date.now(),

  };

}


/* =========================================================
   COMPLETE STATE
========================================================= */

export function markBookingCompleted(
  state
) {

  const booking =
    normalizeBookingState(
      state
    );


  return {

    ...booking,

    completed:
      true,

    active:
      false,

    readyForConfirmation:
      false,

    awaiting:
      null,

    step:
      BOOKING_STEPS.CONFIRMED,

    updatedAt:
      Date.now(),

  };

}


/* =========================================================
   REVIEW
========================================================= */

export function buildBookingReview(
  state,
  language = "en"
) {

  const booking =
    normalizeBookingState(
      state
    );


  const missing =
    getMissingBookingDetails(
      booking
    );


  return {

    valid:
      missing.length ===
      0,

    missing,

    state:
      booking,

    summary:
      getBookingStateSummary(
        booking,
        language
      ),

  };

}


/* =========================================================
   MAIN CONVERSATION PROCESSOR
========================================================= */

export function processBookingMessage(
  state,
  message,
  options = {}
) {

  const {

    language =
      "en",

    availableDates =
      undefined,

    availableSlots =
      undefined,

  } =
    options;


  let booking =
    normalizeBookingState(
      state
    );


  const text =
    cleanText(
      message
    );


  if (
    !text
  ) {

    return response(
      BOOKING_INTENTS.NONE,
      {

        state:
          booking,

        nextStep:
          getNextBookingStep(
            booking
          ),

      }
    );

  }


  /*
   * =======================================================
   * CANCEL
   * =======================================================
   */

  if (
    isBookingCancellation(
      text
    )
  ) {

    booking =
      cancelBookingFlow(
        booking
      );


    return response(
      BOOKING_INTENTS.CANCEL,
      {

        state:
          booking,

        shouldCancel:
          true,

        nextStep:
          BOOKING_STEPS.CANCELLED,

      }
    );

  }


  /*
   * =======================================================
   * STATE QUESTION
   * =======================================================
   */

  if (
    isStateQuestion(
      text
    )
  ) {

    return response(
      BOOKING_INTENTS.SHOW_STATE,
      {

        state:
          booking,

        summary:
          getBookingStateSummary(
            booking,
            language
          ),

        nextStep:
          getNextBookingStep(
            booking
          ),

      }
    );

  }


  /*
   * =======================================================
   * AVAILABLE DATES QUESTION
   * =======================================================
   */

  if (
    isDateQuestion(
      text
    )
  ) {

    if (
      Array.isArray(
        availableDates
      )
    ) {

      booking =
        setAvailableDates(
          booking,
          availableDates
        );

    }


    return response(
      BOOKING_INTENTS.ASK_DATES,
      {

        state:
          booking,

        dates:
          booking.availableDates,

        dateText:
          formatDateList(
            booking.availableDates,
            language
          ),

        nextStep:
          BOOKING_STEPS.DATE,

      }
    );

  }


  /*
   * =======================================================
   * AVAILABLE SLOTS QUESTION
   * =======================================================
   */

  if (
    isSlotQuestion(
      text
    )
  ) {

    if (
      Array.isArray(
        availableSlots
      )
    ) {

      booking =
        setAvailableSlots(
          booking,
          availableSlots
        );

    }


    return response(
      BOOKING_INTENTS.ASK_SLOTS,
      {

        state:
          booking,

        slots:
          booking.availableSlots,

        slotText:
          formatSlotList(
            booking.availableSlots,
            language
          ),

        nextStep:
          BOOKING_STEPS.SLOT,

      }
    );

  }


  /*
   * =======================================================
   * DETAILS
   *
   * "book 50 kg paddy"
   * "change to wheat"
   * "make it 100 kg"
   * =======================================================
   */

  const extractedCrop =
    findCrop(
      text
    );


  const extractedQuantity =
    extractQuantity(
      text
    );


  if (
    extractedCrop ||
    extractedQuantity !==
      null
  ) {

    booking =
      applyBookingDetails(
        booking,
        text
      );


    const missing =
      getMissingBookingDetails(
        booking
      );


    return response(
      BOOKING_INTENTS.UPDATE,
      {

        state:
          booking,

        crop:
          booking.crop,

        quantity:
          booking.quantity,

        missing,

        nextStep:
          getNextBookingStep(
            booking
          ),

        needsDate:
          !booking.date,

        needsSlot:
          !booking.slotStart,

      }
    );

  }


  /*
   * =======================================================
   * DATE SELECTION
   * =======================================================
   */

  if (
    booking.active &&
    (
      booking.step ===
        BOOKING_STEPS.DATE ||
      booking.step ===
        BOOKING_STEPS.SLOT ||
      containsDateSelectionHint(
        text
      )
    )
  ) {

    if (
      Array.isArray(
        availableDates
      )
    ) {

      booking =
        setAvailableDates(
          booking,
          availableDates
        );

    }


    const selectedDate =
      findMatchingAvailableDate(
        text,
        booking.availableDates
      );


    if (
      selectedDate
    ) {

      booking =
        setBookingDate(
          booking,
          selectedDate
        );


      return response(
        BOOKING_INTENTS.SELECT_DATE,
        {

          state:
            booking,

          selectedDate,

          nextStep:
            BOOKING_STEPS.SLOT,

        }
      );

    }

  }


  /*
   * =======================================================
   * SLOT SELECTION
   * =======================================================
   */

  if (
    booking.active &&
    (
      booking.step ===
        BOOKING_STEPS.SLOT ||
      booking.awaiting ===
        "slot"
    )
  ) {

    if (
      Array.isArray(
        availableSlots
      )
    ) {

      booking =
        setAvailableSlots(
          booking,
          availableSlots
        );

    }


    const selectedSlot =
      findMatchingAvailableSlot(
        text,
        booking.availableSlots
      );


    if (
      selectedSlot
    ) {

      booking =
        setBookingSlot(
          booking,
          selectedSlot
        );


      const review =
        buildBookingReview(
          booking,
          language
        );


      return response(
        BOOKING_INTENTS.SELECT_SLOT,
        {

          state:
            booking,

          selectedSlot,

          review,

          nextStep:
            BOOKING_STEPS.REVIEW,

          requiresConfirmation:
            true,

        }
      );

    }

  }


  /*
   * =======================================================
   * CONFIRMATION
   * =======================================================
   */

  if (
    booking.readyForConfirmation &&
    isBookingConfirmation(
      text
    )
  ) {

    return response(
      BOOKING_INTENTS.CONFIRM,
      {

        state:
          booking,

        params:
          sanitizeActionParams({

            crop:
              booking.crop,

            quantity:
              booking.quantity,

          }),

        booking,
        
        requiresExecution:
          true,

      }
    );

  }


  /*
   * =======================================================
   * REVIEW REQUEST
   * =======================================================
   */

  if (
    booking.active &&
    (
      text ===
        "review" ||
      text ===
        "review booking" ||
      text ===
        "show final details" ||
      text ===
        "check everything"
    )
  ) {

    const review =
      buildBookingReview(
        booking,
        language
      );


    return response(
      BOOKING_INTENTS.REVIEW,
      {

        state:
          booking,

        review,

        nextStep:
          review.valid
            ? BOOKING_STEPS.REVIEW
            : getNextBookingStep(
                booking
              ),

        requiresConfirmation:
          review.valid,

      }
    );

  }


  /*
   * =======================================================
   * START BOOKING
   * =======================================================
   */

  const startsBooking =
    /\b(book|booking|reserve|procurement|sell)\b/i.test(
      text
    ) ||
    text.includes(
      "बुक"
    ) ||
    text.includes(
      "बुकिंग"
    ) ||
    text.includes(
      "बिक्री"
    ) ||
    text.includes(
      "బుక్"
    ) ||
    text.includes(
      "బుకింగ్"
    );


  if (
    startsBooking
  ) {

    booking = {

      ...booking,

      active:
        true,

      cancelled:
        false,

      completed:
        false,

    };


    if (
      Array.isArray(
        availableDates
      )
    ) {

      booking =
        setAvailableDates(
          booking,
          availableDates
        );

    }


    booking.step =
      getNextBookingStep(
        booking
      );


    return response(
      BOOKING_INTENTS.START,
      {

        state:
          booking,

        missing:
          getMissingBookingDetails(
            booking
          ),

        nextStep:
          booking.step,

      }
    );

  }


  /*
   * =======================================================
   * NO BOOKING ACTION
   * =======================================================
   */

  return response(
    BOOKING_INTENTS.NONE,
    {

      handled:
        false,

      state:
        booking,

      nextStep:
        getNextBookingStep(
          booking
        ),

    }
  );

}


/* =========================================================
   ASSISTANT PROMPT
========================================================= */

/*
 * Generate a human-readable next question based on the
 * current state.
 */

export function getNextBookingPrompt(
  state,
  language = "en"
) {

  const booking =
    normalizeBookingState(
      state
    );


  const crop =
    booking.crop
      ? (
          CROP_NAMES[
            language
          ]?.[
            booking.crop
          ] ||
          booking.crop
        )
      : null;


  if (
    !booking.active
  ) {

    return language === "hi"
      ? "क्या आप एक नई खरीद बुकिंग शुरू करना चाहते हैं?"
      : language === "te"
        ? "మీరు కొత్త కొనుగోలు బుకింగ్ ప్రారంభించాలనుకుంటున్నారా?"
        : "Would you like to start a new procurement booking?";

  }


  if (
    !booking.crop
  ) {

    return language === "hi"
      ? "आप कौन सी फसल बुक करना चाहते हैं?"
      : language === "te"
        ? "మీరు ఏ పంటను బుక్ చేయాలనుకుంటున్నారు?"
        : "Which crop would you like to book?";

  }


  if (
    booking.quantity ===
      null
  ) {

    return language === "hi"
      ? `${crop} के लिए कितनी मात्रा बुक करनी है?`
      : language === "te"
        ? `${crop} ఎంత పరిమాణం బుక్ చేయాలి?`
        : `How many kilograms of ${crop} would you like to book?`;

  }


  if (
    !booking.centerId
  ) {

    return language === "hi"
      ? "किस खरीद केंद्र पर आप अपनी उपज लाना चाहते हैं?"
      : language === "te"
        ? "మీరు ఏ కొనుగోలు కేంద్రానికి పంటను తీసుకురావాలనుకుంటున్నారు?"
        : "Which procurement center would you like to use?";

  }


  if (
    !booking.date
  ) {

    return language === "hi"
      ? `ठीक है। अभी तक मैंने ${crop} और ${booking.quantity} kg रखा है। कौन सी तारीख चुनेंगे?`
      : language === "te"
        ? `సరే. ${crop} మరియు ${booking.quantity} kg వివరాలను ఉంచాను. ఏ తేదీని ఎంచుకుంటారు?`
        : `Okay. I have ${booking.quantity} kg of ${crop} saved. Which date would you like?`;

  }


  if (
    !booking.slotStart
  ) {

    return language === "hi"
      ? "तारीख चुन ली गई है। अब उपलब्ध समय स्लॉट में से एक चुनें।"
      : language === "te"
        ? "తేదీ ఎంచుకున్నారు. ఇప్పుడు అందుబాటులో ఉన్న సమయ స్లాట్‌ను ఎంచుకోండి."
        : "Your date is selected. Now choose an available arrival time.";

  }


  if (
    booking.readyForConfirmation
  ) {

    return language === "hi"
      ? "सारी जानकारी तैयार है। क्या मैं इस बुकिंग की पुष्टि कर दूँ?"
      : language === "te"
        ? "అన్ని వివరాలు సిద్ధంగా ఉన్నాయి. ఈ బుకింగ్‌ను నిర్ధారించనా?"
        : "Everything is ready. Would you like me to confirm this booking?";

  }


  return language === "hi"
    ? "आपकी बुकिंग जानकारी अपडेट हो गई है।"
    : language === "te"
      ? "మీ బుకింగ్ వివరాలు నవీకరించబడ్డాయి."
      : "Your booking details have been updated.";

}


/* =========================================================
   EXPORT BUNDLE
========================================================= */

export const assistantBooking = {

  steps:
    BOOKING_STEPS,

  intents:
    BOOKING_INTENTS,

  createEmpty:
    createEmptyBookingState,

  normalize:
    normalizeBookingState,

  extractCrop,

  extractQuantity,

  isDateQuestion,

  isSlotQuestion,

  isStateQuestion,

  isBookingConfirmation,

  isBookingCancellation,

  parseRequestedTime,

  resolveRelativeDate,

  findMatchingAvailableDate,

  findMatchingAvailableSlot,

  getMissingDetails:
    getMissingBookingDetails,

  getNextStep:
    getNextBookingStep,

  getStateSummary:
    getBookingStateSummary,

  applyDetails:
    applyBookingDetails,

  setDate:
    setBookingDate,

  setSlot:
    setBookingSlot,

  setCenter:
    setBookingCenter,

  setAvailableDates,

  setAvailableSlots,

  clearDateAndSlot:
    clearBookingDateAndSlot,

  cancel:
    cancelBookingFlow,

  complete:
    markBookingCompleted,

  review:
    buildBookingReview,

  process:
    processBookingMessage,

  nextPrompt:
    getNextBookingPrompt,

};


export default assistantBooking;