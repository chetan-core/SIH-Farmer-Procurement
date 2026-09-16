/* =========================================================
   KRISHISETU AI BOOKING FLOW
=========================================================

   PURPOSE

   This module manages the conversational booking state
   between the AI assistant and FarmerBook.jsx.

   BOOKING FLOW

      user message
           ↓
      assistantBooking
           ↓
      booking state
           ↓
      FarmerBook.jsx
           ↓
      crop
      quantity
      center
      date
      slot
      confirmation

   IMPORTANT

   This module does NOT:

   - render UI
   - navigate
   - call the backend
   - manipulate React state directly
   - confirm/create a booking

   It only:

   - normalizes booking data
   - merges newly supplied information
   - determines missing booking fields
   - understands conversational booking progress
   - creates a safe booking payload for FarmerBook
   - generates useful human-readable booking summaries

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

  CROP:
    "crop",

  QUANTITY:
    "quantity",

  CENTER:
    "center",

  DATE:
    "date",

  SLOT:
    "slot",

  CONFIRM:
    "confirm",

};


export const BOOKING_STATUS = {

  EMPTY:
    "EMPTY",

  PARTIAL:
    "PARTIAL",

  READY_FOR_AVAILABILITY:
    "READY_FOR_AVAILABILITY",

  WAITING_FOR_SLOT:
    "WAITING_FOR_SLOT",

  READY_FOR_CONFIRMATION:
    "READY_FOR_CONFIRMATION",

  CONFIRMED:
    "CONFIRMED",

};


/*
 * Fields that must exist before availability can be checked.
 */

const AVAILABILITY_FIELDS = [

  "crop",

  "quantity",

];


/*
 * Fields that must exist before final confirmation.
 */

const CONFIRMATION_FIELDS = [

  "crop",

  "quantity",

  "centerId",

  "date",

  "slot",

];


/* =========================================================
   CROP ALIASES
========================================================= */

const CROP_ALIASES = {

  wheat: [

    "wheat",
    "wheat crop",
    "gehu",
    "gehun",
    "गेहूं",
    "गेहू",
    "गेहूँ",
    "गहूं",
    "ഗോതമ്പ്",
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
   CROP LABELS
========================================================= */

const CROP_LABELS = {

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
   EMPTY BOOKING
========================================================= */

export function createEmptyBooking() {

  return {

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

    slotStart:
      null,

    slotEnd:
      null,

    slotDisplay:
      null,

  };

}


/* =========================================================
   NORMALIZE CROP
========================================================= */

export function normalizeCrop(
  value
) {

  const text =
    normalizeText(
      value
    );


  if (
    !text
  ) {

    return null;

  }


  for (
    const [
      cropId,
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
        text ===
        target
      ) {

        return cropId;

      }


      if (
        target.length >= 5 &&
        (
          text.includes(
            target
          ) ||
          target.includes(
            text
          )
        )
      ) {

        return cropId;

      }

    }

  }


  return null;

}


/* =========================================================
   NORMALIZE QUANTITY
========================================================= */

export function normalizeQuantity(
  value
) {

  if (
    value ===
      null ||
    value ===
      undefined ||
    value ===
      ""
  ) {

    return null;

  }


  const numeric =
    Number(
      String(
        value
      )
        .replace(
          /,/g,
          ""
        )
        .trim()
    );


  if (
    !Number.isFinite(
      numeric
    ) ||
    numeric <=
      0
  ) {

    return null;

  }


  if (
    numeric >
    50000
  ) {

    return null;

  }


  return numeric;

}


/* =========================================================
   NORMALIZE CENTER
========================================================= */

export function normalizeCenter(
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


  if (
    typeof value ===
      "string" ||
    typeof value ===
      "number"
  ) {

    const text =
      cleanText(
        value
      );


    return text
      ? {

          centerId:
            text,

          centerName:
            null,

        }
      : null;

  }


  if (
    typeof value !==
      "object"
  ) {

    return null;

  }


  const centerId =
    value.id ??
    value.centerId ??
    value.center_id ??
    null;


  const centerName =
    value.name ??
    value.centerName ??
    null;


  if (
    centerId ===
      null &&
    !centerName
  ) {

    return null;

  }


  return {

    centerId:
      centerId !==
        null
        ? String(
            centerId
          )
        : null,

    centerName:
      centerName
        ? cleanText(
            centerName
          )
        : null,

  };

}


/* =========================================================
   NORMALIZE DATE
========================================================= */

export function normalizeDate(
  value
) {

  if (
    value ===
      null ||
    value ===
      undefined ||
    value ===
      ""
  ) {

    return null;

  }


  if (
    typeof value ===
      "object"
  ) {

    const date =
      value.date ??
      value.id ??
      null;


    if (
      !date
    ) {

      return null;

    }


    return {

      date:
        cleanText(
          date
        ),

      label:
        cleanText(
          value.label
        ) ||
        null,

      day:
        cleanText(
          value.day
        ) ||
        null,

      month:
        cleanText(
          value.month
        ) ||
        null,

    };

  }


  const text =
    cleanText(
      value
    );


  if (
    !text
  ) {

    return null;

  }


  return {

    date:
      text,

    label:
      null,

    day:
      null,

    month:
      null,

  };

}


/* =========================================================
   NORMALIZE SLOT
========================================================= */

export function normalizeSlot(
  value
) {

  if (
    !value
  ) {

    return null;

  }


  if (
    typeof value ===
      "string"
  ) {

    const display =
      cleanText(
        value
      );


    return {

      id:
        display,

      start:
        null,

      end:
        null,

      display,

    };

  }


  if (
    typeof value !==
      "object"
  ) {

    return null;

  }


  const id =
    value.id ??
    value.slotId ??
    null;


  const start =
    value.start ??
    value.slotStart ??
    value.slot_start ??
    null;


  const end =
    value.end ??
    value.slotEnd ??
    value.slot_end ??
    null;


  const display =
    value.display ??
    value.slotDisplay ??
    null;


  if (
    !id &&
    !start &&
    !display
  ) {

    return null;

  }


  return {

    id:
      id !==
        null
        ? String(
            id
          )
        : (
            display ||
            `${start || ""}-${end || ""}`
          ),

    start:
      start
        ? String(
            start
          )
        : null,

    end:
      end
        ? String(
            end
          )
        : null,

    display:
      cleanText(
        display
      ) ||
      (
        start &&
        end
          ? `${start} - ${end}`
          : null
      ),

  };

}


/* =========================================================
   NORMALIZE BOOKING
========================================================= */

export function normalizeBooking(
  booking = {}
) {

  const source =
    booking &&
    typeof booking ===
      "object"
      ? booking
      : {};


  const normalized =
    createEmptyBooking();


  normalized.crop =
    normalizeCrop(
      source.crop
    );


  normalized.quantity =
    normalizeQuantity(
      source.quantity ??
      source.estimatedQuantity ??
      source.estimated_quantity
    );


  const center =
    normalizeCenter(
      source.center ??
      {
        centerId:
          source.centerId ??
          source.center_id,

        centerName:
          source.centerName,

      }
    );


  if (
    center
  ) {

    normalized.centerId =
      center.centerId;


    normalized.centerName =
      center.centerName;

  }


  const date =
    normalizeDate(
      source.date
    );


  if (
    date
  ) {

    normalized.date =
      date.date;

    normalized.dateLabel =
      date.label;

  }


  const slot =
    normalizeSlot(
      source.slot ??
      source.selectedSlot ??
      {
        id:
          source.slotId,

        start:
          source.slotStart ??
          source.slot_start,

        end:
          source.slotEnd ??
          source.slot_end,

        display:
          source.slotDisplay,

      }
    );


  if (
    slot
  ) {

    normalized.slot =
      slot.id;

    normalized.slotStart =
      slot.start;

    normalized.slotEnd =
      slot.end;

    normalized.slotDisplay =
      slot.display;

  }


  return normalized;

}


/* =========================================================
   MERGE BOOKING
========================================================= */

export function mergeBooking(
  currentBooking,
  incomingBooking
) {

  const current =
    normalizeBooking(
      currentBooking
    );


  const incoming =
    normalizeBooking(
      incomingBooking
    );


  return {

    crop:
      incoming.crop ||
      current.crop ||
      null,

    quantity:
      incoming.quantity ||
      current.quantity ||
      null,

    centerId:
      incoming.centerId ||
      current.centerId ||
      null,

    centerName:
      incoming.centerName ||
      current.centerName ||
      null,

    date:
      incoming.date ||
      current.date ||
      null,

    dateLabel:
      incoming.dateLabel ||
      current.dateLabel ||
      null,

    slot:
      incoming.slot ||
      current.slot ||
      null,

    slotStart:
      incoming.slotStart ||
      current.slotStart ||
      null,

    slotEnd:
      incoming.slotEnd ||
      current.slotEnd ||
      null,

    slotDisplay:
      incoming.slotDisplay ||
      current.slotDisplay ||
      null,

  };

}


/* =========================================================
   CLEAR FIELD
========================================================= */

export function clearBookingField(
  booking,
  field
) {

  const result =
    normalizeBooking(
      booking
    );


  if (
    field ===
    "crop"
  ) {

    result.crop =
      null;

  }


  if (
    field ===
    "quantity"
  ) {

    result.quantity =
      null;

  }


  if (
    field ===
    "center"
  ) {

    result.centerId =
      null;

    result.centerName =
      null;

  }


  if (
    field ===
    "date"
  ) {

    result.date =
      null;

    result.dateLabel =
      null;

  }


  if (
    field ===
    "slot"
  ) {

    result.slot =
      null;

    result.slotStart =
      null;

    result.slotEnd =
      null;

    result.slotDisplay =
      null;

  }


  return result;

}


/* =========================================================
   MISSING FIELDS
========================================================= */

export function getMissingBookingFields(
  booking
) {

  const normalized =
    normalizeBooking(
      booking
    );


  const missing =
    [];


  if (
    !normalized.crop
  ) {

    missing.push(
      "crop"
    );

  }


  if (
    !normalized.quantity
  ) {

    missing.push(
      "quantity"
    );

  }


  if (
    !normalized.centerId
  ) {

    missing.push(
      "center"
    );

  }


  if (
    !normalized.date
  ) {

    missing.push(
      "date"
    );

  }


  if (
    !normalized.slot
  ) {

    missing.push(
      "slot"
    );

  }


  return missing;

}


/* =========================================================
   NEXT BOOKING STEP
========================================================= */

export function getNextBookingStep(
  booking
) {

  const normalized =
    normalizeBooking(
      booking
    );


  if (
    !normalized.crop
  ) {

    return BOOKING_STEPS.CROP;

  }


  if (
    !normalized.quantity
  ) {

    return BOOKING_STEPS.QUANTITY;

  }


  if (
    !normalized.centerId
  ) {

    return BOOKING_STEPS.CENTER;

  }


  if (
    !normalized.date
  ) {

    return BOOKING_STEPS.DATE;

  }


  if (
    !normalized.slot
  ) {

    return BOOKING_STEPS.SLOT;

  }


  return BOOKING_STEPS.CONFIRM;

}


/* =========================================================
   BOOKING STATUS
========================================================= */

export function getBookingStatus(
  booking
) {

  const normalized =
    normalizeBooking(
      booking
    );


  if (
    !normalized.crop &&
    !normalized.quantity &&
    !normalized.centerId &&
    !normalized.date &&
    !normalized.slot
  ) {

    return BOOKING_STATUS.EMPTY;

  }


  if (
    normalized.crop &&
    normalized.quantity &&
    !normalized.centerId &&
    !normalized.date &&
    !normalized.slot
  ) {

    return BOOKING_STATUS.READY_FOR_AVAILABILITY;

  }


  if (
    normalized.crop &&
    normalized.quantity &&
    normalized.centerId &&
    normalized.date &&
    !normalized.slot
  ) {

    return BOOKING_STATUS.WAITING_FOR_SLOT;

  }


  if (
    normalized.crop &&
    normalized.quantity &&
    normalized.centerId &&
    normalized.date &&
    normalized.slot
  ) {

    return BOOKING_STATUS.READY_FOR_CONFIRMATION;

  }


  return BOOKING_STATUS.PARTIAL;

}


/* =========================================================
   FIELD LABEL
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
        "arrival date",

      slot:
        "arrival time",

      confirm:
        "confirmation",

    },

    hi: {

      crop:
        "फसल",

      quantity:
        "मात्रा",

      center:
        "खरीद केंद्र",

      date:
        "आने की तारीख",

      slot:
        "आने का समय",

      confirm:
        "पुष्टि",

    },

    te: {

      crop:
        "పంట",

      quantity:
        "పరిమాణం",

      center:
        "కొనుగోలు కేంద్రం",

      date:
        "రాక తేదీ",

      slot:
        "రాక సమయం",

      confirm:
        "నిర్ధారణ",

    },

  };


  return (
    labels[
      language
    ] ||
    labels.en
  )[
    field
  ] ||
  field;

}


/* =========================================================
   NEXT STEP QUESTION
========================================================= */

export function getNextStepQuestion(
  booking,
  language = "en"
) {

  const normalized =
    normalizeBooking(
      booking
    );


  const next =
    getNextBookingStep(
      normalized
    );


  if (
    next ===
    BOOKING_STEPS.CROP
  ) {

    if (
      language ===
      "hi"
    ) {

      return "आप कौन सी फसल बुक करना चाहते हैं?";

    }


    if (
      language ===
      "te"
    ) {

      return "మీరు ఏ పంటను బుక్ చేయాలనుకుంటున్నారు?";

    }


    return "Which crop would you like to book?";

  }


  if (
    next ===
    BOOKING_STEPS.QUANTITY
  ) {

    if (
      language ===
      "hi"
    ) {

      return "कितनी मात्रा बुक करनी है? मात्रा किलो में बताएं।";

    }


    if (
      language ===
      "te"
    ) {

      return "ఎంత పరిమాణం బుక్ చేయాలి? కిలోల్లో చెప్పండి.";

    }


    return "How much would you like to book? Please give the quantity in kilograms.";

  }


  if (
    next ===
    BOOKING_STEPS.CENTER
  ) {

    if (
      language ===
      "hi"
    ) {

      return "किस खरीद केंद्र पर आप अपनी उपज लाना चाहते हैं?";

    }


    if (
      language ===
      "te"
    ) {

      return "మీరు పంటను ఏ కొనుగోలు కేంద్రానికి తీసుకురావాలనుకుంటున్నారు?";

    }


    return "Which procurement center would you like to use?";

  }


  if (
    next ===
    BOOKING_STEPS.DATE
  ) {

    if (
      language ===
      "hi"
    ) {

      return "आप किस तारीख को आना चाहते हैं? मैं उपलब्ध तारीखें भी बता सकता हूँ।";

    }


    if (
      language ===
      "te"
    ) {

      return "మీరు ఏ తేదీన రావాలనుకుంటున్నారు? అందుబాటులో ఉన్న తేదీలను కూడా చెప్పగలను.";

    }


    return "Which date would you like to arrive? I can also tell you which dates are available.";

  }


  if (
    next ===
    BOOKING_STEPS.SLOT
  ) {

    if (
      language ===
      "hi"
    ) {

      return "कौन सा समय स्लॉट चुनना चाहते हैं? मैं उपलब्ध समय भी बता सकता हूँ।";

    }


    if (
      language ===
      "te"
    ) {

      return "ఏ సమయ స్లాట్‌ను ఎంచుకోవాలనుకుంటున్నారు? అందుబాటులో ఉన్న సమయాలను కూడా చెప్పగలను.";

    }


    return "Which arrival window would you like? I can also tell you the available time slots.";

  }


  if (
    language ===
    "hi"
  ) {

    return "आपकी बुकिंग के सभी विवरण तैयार हैं। क्या मैं इसे बुक कर दूँ?";

  }


  if (
    language ===
    "te"
  ) {

    return "మీ బుకింగ్ వివరాలన్నీ సిద్ధంగా ఉన్నాయి. నేను ఇప్పుడు బుక్ చేయనా?";

  }


  return "All booking details are ready. Would you like me to confirm the booking?";

}


/* =========================================================
   BOOKING SUMMARY
========================================================= */

export function getBookingSummary(
  booking,
  language = "en"
) {

  const normalized =
    normalizeBooking(
      booking
    );


  const crop =
    CROP_LABELS[
      language
    ]?.[
      normalized.crop
    ] ||
    normalized.crop ||
    null;


  const quantity =
    normalized.quantity;


  const center =
    normalized.centerName ||
    normalized.centerId ||
    null;


  const date =
    normalized.dateLabel ||
    normalized.date ||
    null;


  const slot =
    normalized.slotDisplay ||
    normalized.slot ||
    null;


  if (
    language ===
    "hi"
  ) {

    const lines = [

      `फसल: ${crop || "नहीं चुनी गई"}`,

      `मात्रा: ${
        quantity
          ? `${quantity} kg`
          : "नहीं दी गई"
      }`,

      `खरीद केंद्र: ${
        center ||
        "अभी नहीं चुना गया"
      }`,

      `तारीख: ${
        date ||
        "अभी नहीं चुनी गई"
      }`,

      `समय: ${
        slot ||
        "अभी नहीं चुना गया"
      }`,

    ];


    return lines.join(
      "\n"
    );

  }


  if (
    language ===
    "te"
  ) {

    const lines = [

      `పంట: ${crop || "ఎంచుకోలేదు"}`,

      `పరిమాణం: ${
        quantity
          ? `${quantity} kg`
          : "ఇవ్వలేదు"
      }`,

      `కొనుగోలు కేంద్రం: ${
        center ||
        "ఇంకా ఎంచుకోలేదు"
      }`,

      `తేదీ: ${
        date ||
        "ఇంకా ఎంచుకోలేదు"
      }`,

      `సమయం: ${
        slot ||
        "ఇంకా ఎంచుకోలేదు"
      }`,

    ];


    return lines.join(
      "\n"
    );

  }


  const lines = [

    `Crop: ${
      crop ||
      "not selected"
    }`,

    `Quantity: ${
      quantity
        ? `${quantity} kg`
        : "not provided"
    }`,

    `Procurement center: ${
      center ||
      "not selected yet"
    }`,

    `Date: ${
      date ||
      "not selected yet"
    }`,

    `Arrival time: ${
      slot ||
      "not selected yet"
    }`,

  ];


  return lines.join(
    "\n"
  );

}


/* =========================================================
   SHORT SUMMARY
========================================================= */

export function getShortBookingSummary(
  booking,
  language = "en"
) {

  const normalized =
    normalizeBooking(
      booking
    );


  const crop =
    CROP_LABELS[
      language
    ]?.[
      normalized.crop
    ] ||
    normalized.crop;


  const parts =
    [];


  if (
    crop
  ) {

    parts.push(
      crop
    );

  }


  if (
    normalized.quantity
  ) {

    parts.push(
      `${normalized.quantity} kg`
    );

  }


  if (
    normalized.centerName
  ) {

    parts.push(
      normalized.centerName
    );

  }


  if (
    normalized.date
  ) {

    parts.push(
      normalized.dateLabel ||
      normalized.date
    );

  }


  if (
    normalized.slotDisplay
  ) {

    parts.push(
      normalized.slotDisplay
    );

  }


  return parts.join(
    " · "
  );

}


/* =========================================================
   AVAILABILITY REQUIREMENT
========================================================= */

export function canCheckAvailability(
  booking
) {

  const normalized =
    normalizeBooking(
      booking
    );


  return AVAILABILITY_FIELDS.every(
    field => {

      if (
        field ===
        "crop"
      ) {

        return Boolean(
          normalized.crop
        );

      }


      if (
        field ===
        "quantity"
      ) {

        return Boolean(
          normalized.quantity
        );

      }


      return false;

    }
  );

}


/* =========================================================
   FINAL CONFIRMATION REQUIREMENT
========================================================= */

export function canConfirmBooking(
  booking
) {

  const normalized =
    normalizeBooking(
      booking
    );


  return (

    Boolean(
      normalized.crop
    ) &&

    Boolean(
      normalized.quantity
    ) &&

    Boolean(
      normalized.centerId
    ) &&

    Boolean(
      normalized.date
    ) &&

    Boolean(
      normalized.slot
    )

  );

}


/* =========================================================
   SAFE FARMER BOOKING STATE
========================================================= */

export function toFarmerBookState(
  booking
) {

  const normalized =
    normalizeBooking(
      booking
    );


  return {

    assistantBooking: {

      crop:
        normalized.crop,

      quantity:
        normalized.quantity,

      centerId:
        normalized.centerId,

      centerName:
        normalized.centerName,

      date:
        normalized.date,

      dateLabel:
        normalized.dateLabel,

      slot:
        normalized.slot,

      slotStart:
        normalized.slotStart,

      slotEnd:
        normalized.slotEnd,

      slotDisplay:
        normalized.slotDisplay,

    },

  };

}


/* =========================================================
   ACTION PARAMETERS
========================================================= */

/*
 * Convert arbitrary assistant parameters into booking data.
 */

export function bookingFromActionParams(
  params
) {

  const safe =
    sanitizeActionParams(
      params
    );


  if (
    !safe
  ) {

    return createEmptyBooking();

  }


  return normalizeBooking(
    safe
  );

}


/* =========================================================
   EXTRACT BOOKING FROM ACTION
========================================================= */

export function extractBookingFromAction(
  actionResult
) {

  if (
    !actionResult ||
    typeof actionResult !==
      "object"
  ) {

    return null;

  }


  const candidates = [

    actionResult.booking,

    actionResult.params,

    actionResult.pendingAction
      ?.booking,

    actionResult.pendingAction
      ?.params,

    actionResult.execution
      ?.params,

  ];


  for (
    const candidate of
    candidates
  ) {

    const booking =
      normalizeBooking(
        candidate
      );


    if (
      getMissingBookingFields(
        booking
      ).length <
      5
    ) {

      return booking;

    }

  }


  return null;

}


/* =========================================================
   BOOKING RESPONSE
========================================================= */

export function createBookingProgressResponse(
  booking,
  language = "en"
) {

  const normalized =
    normalizeBooking(
      booking
    );


  const status =
    getBookingStatus(
      normalized
    );


  const missing =
    getMissingBookingFields(
      normalized
    );


  const nextStep =
    getNextBookingStep(
      normalized
    );


  return {

    status,

    booking:
      normalized,

    missingFields:
      missing,

    nextStep,

    canCheckAvailability:
      canCheckAvailability(
        normalized
      ),

    canConfirm:
      canConfirmBooking(
        normalized
      ),

    nextQuestion:
      getNextStepQuestion(
        normalized,
        language
      ),

    summary:
      getBookingSummary(
        normalized,
        language
      ),

    shortSummary:
      getShortBookingSummary(
        normalized,
        language
      ),

  };

}


/* =========================================================
   BOOKING COMMAND DETECTION
========================================================= */

const BOOKING_WORDS = [

  "book",

  "booking",

  "slot",

  "procurement",

  "sell crop",

  "sell produce",

  "buying center",

  "procurement center",

  "बुक",

  "बुकिंग",

  "स्लॉट",

  "खरीद",

  "फसल बेच",

  "బుక్",

  "బుకింగ్",

  "స్లాట్",

  "కొనుగోలు",

];


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


  return BOOKING_WORDS.some(
    word =>
      text.includes(
        normalizeText(
          word
        )
      )
  );

}


/* =========================================================
   EXTRACT SIMPLE BOOKING DETAILS
========================================================= */

export function extractBookingFromText(
  message
) {

  const text =
    normalizeText(
      message
    );


  if (
    !text
  ) {

    return createEmptyBooking();

  }


  const booking =
    createEmptyBooking();


  for (
    const [
      cropId,
      aliases,
    ] of Object.entries(
      CROP_ALIASES
    )
  ) {

    const found =
      aliases.some(
        alias =>
          text.includes(
            normalizeText(
              alias
            )
          )
      );


    if (
      found
    ) {

      booking.crop =
        cropId;

      break;

    }

  }


  const quantityMatch =
    text.match(
      /(\d+(?:\.\d+)?)\s*(kg|kgs|kilo|kilos|kilogram|kilograms|किलो|किलोग्राम|కిలో|కిలోలు)?\b/i
    );


  if (
    quantityMatch
  ) {

    booking.quantity =
      normalizeQuantity(
        quantityMatch[1]
      );

  }


  return booking;

}


/* =========================================================
   UPDATE BOOKING FROM TEXT
========================================================= */

export function updateBookingFromText(
  currentBooking,
  message
) {

  const extracted =
    extractBookingFromText(
      message
    );


  return mergeBooking(
    currentBooking,
    extracted
  );

}


/* =========================================================
   BOOKING DISPLAY MESSAGE
========================================================= */

export function getBookingProgressMessage(
  booking,
  language = "en"
) {

  const normalized =
    normalizeBooking(
      booking
    );


  const status =
    getBookingStatus(
      normalized
    );


  if (
    status ===
    BOOKING_STATUS.EMPTY
  ) {

    if (
      language ===
      "hi"
    ) {

      return "अभी कोई बुकिंग विवरण दर्ज नहीं है।";

    }


    if (
      language ===
      "te"
    ) {

      return "ఇంకా బుకింగ్ వివరాలు నమోదు కాలేదు.";

    }


    return "No booking details have been entered yet.";

  }


  const summary =
    getShortBookingSummary(
      normalized,
      language
    );


  if (
    status ===
    BOOKING_STATUS.READY_FOR_AVAILABILITY
  ) {

    if (
      language ===
      "hi"
    ) {

      return `अभी मेरे पास ${summary} है। फसल और मात्रा मिल गई है। अब खरीद केंद्र और तारीख चुननी होगी।`;

    }


    if (
      language ===
      "te"
    ) {

      return `ప్రస్తుతం నా దగ్గర ${summary} ఉంది. పంట మరియు పరిమాణం నమోదయ్యాయి. ఇప్పుడు కొనుగోలు కేంద్రం మరియు తేదీ ఎంచుకోవాలి.`;

    }


    return `I have ${summary} so far. The crop and quantity are set. We still need the procurement center and arrival date.`;

  }


  if (
    status ===
    BOOKING_STATUS.WAITING_FOR_SLOT
  ) {

    if (
      language ===
      "hi"
    ) {

      return `अभी बुकिंग में ${summary} है। अब उपलब्ध समय स्लॉट में से एक चुनना है।`;

    }


    if (
      language ===
      "te"
    ) {

      return `ఇప్పటి వరకు బుకింగ్‌లో ${summary} ఉంది. ఇప్పుడు అందుబాటులో ఉన్న సమయ స్లాట్‌ను ఎంచుకోవాలి.`;

    }


    return `So far the booking has ${summary}. The next step is choosing an available arrival window.`;

  }


  if (
    status ===
    BOOKING_STATUS.READY_FOR_CONFIRMATION
  ) {

    if (
      language ===
      "hi"
    ) {

      return `सभी बुकिंग विवरण तैयार हैं: ${summary}. क्या मैं इसे अंतिम रूप से बुक कर दूँ?`;

    }


    if (
      language ===
      "te"
    ) {

      return `అన్ని బుకింగ్ వివరాలు సిద్ధంగా ఉన్నాయి: ${summary}. నేను ఇప్పుడు బుకింగ్‌ను తుది నిర్ధారణ చేయనా?`;

    }


    return `All booking details are ready: ${summary}. Would you like me to confirm the booking?`;

  }


  if (
    language ===
    "hi"
  ) {

    return `अभी तक बुकिंग में ${summary} है। कुछ विवरण अभी बाकी हैं।`;

  }


  if (
    language ===
    "te"
  ) {

    return `ఇప్పటి వరకు బుకింగ్‌లో ${summary} ఉంది. ఇంకా కొన్ని వివరాలు కావాలి.`;

  }


  return `So far the booking contains ${summary}. A few details are still missing.`;

}


/* =========================================================
   BOOKING FIELD NAME FROM USER MESSAGE
========================================================= */

export function detectBookingField(
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


  if (
    normalizeCrop(
      text
    )
  ) {

    return BOOKING_STEPS.CROP;

  }


  if (
    /\b\d+(?:\.\d+)?\s*(kg|kgs|kilo|kilos|kilogram|kilograms)\b/i.test(
      text
    )
  ) {

    return BOOKING_STEPS.QUANTITY;

  }


  if (
    text.includes(
      "date"
    ) ||
    text.includes(
      "tomorrow"
    ) ||
    text.includes(
      "today"
    ) ||
    text.includes(
      "कल"
    ) ||
    text.includes(
      "आज"
    ) ||
    text.includes(
      "తేదీ"
    )
  ) {

    return BOOKING_STEPS.DATE;

  }


  if (
    text.includes(
      "slot"
    ) ||
    text.includes(
      "time"
    ) ||
    text.includes(
      "morning"
    ) ||
    text.includes(
      "afternoon"
    ) ||
    text.includes(
      "evening"
    ) ||
    text.includes(
      "समय"
    ) ||
    text.includes(
      "सुबह"
    ) ||
    text.includes(
      "शाम"
    ) ||
    text.includes(
      "సమయం"
    )
  ) {

    return BOOKING_STEPS.SLOT;

  }


  return null;

}


/* =========================================================
   BOOKING REQUEST STATE
========================================================= */

export function buildBookingRequestState(
  currentBooking,
  message,
  language = "en"
) {

  const booking =
    updateBookingFromText(
      currentBooking,
      message
    );


  return createBookingProgressResponse(
    booking,
    language
  );

}


/* =========================================================
   EXPORT BUNDLE
========================================================= */

export const assistantBooking = {

  BOOKING_STEPS,

  BOOKING_STATUS,

  createEmptyBooking,

  normalizeCrop,

  normalizeQuantity,

  normalizeCenter,

  normalizeDate,

  normalizeSlot,

  normalizeBooking,

  mergeBooking,

  clearBookingField,

  getMissingBookingFields,

  getNextBookingStep,

  getBookingStatus,

  getBookingFieldLabel,

  getNextStepQuestion,

  getBookingSummary,

  getShortBookingSummary,

  canCheckAvailability,

  canConfirmBooking,

  toFarmerBookState,

  bookingFromActionParams,

  extractBookingFromAction,

  createBookingProgressResponse,

  looksLikeBookingRequest,

  extractBookingFromText,

  updateBookingFromText,

  getBookingProgressMessage,

  detectBookingField,

  buildBookingRequestState,

};


export default assistantBooking;