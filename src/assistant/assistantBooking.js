/* =========================================================
   KRISHISETU AI BOOKING
   Conversational booking state + live availability bridge.
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

export const BOOKING_ENGINE_VERSION = "2026-09-09-one-shot";

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

export const BOOKING_STORAGE_KEY = "krishisetu_ai_booking_draft";
export const BOOKING_STATE_STORAGE_KEY = "krishisetu_ai_booking_state";
export const BOOKING_AVAILABILITY_STORAGE_KEY =
  "krishisetu_ai_booking_availability";
export const BOOKING_SCHEMA_VERSION = 2;

const AVAILABILITY_TTL = 5 * 60 * 1000;
const MAX_QUANTITY = 50000;

const EVENT_BOOKING = "krishisetu:assistant-booking-updated";
const EVENT_AVAILABILITY =
  "krishisetu:assistant-availability-updated";
const EVENT_REQUEST_AVAILABILITY =
  "krishisetu:assistant-request-availability";

const CROP_ALIASES = {
  wheat: [
    "wheat",
    "gehun",
    "gehu",
    "गेहूं",
    "गेहू",
    "गेहूँ",
    "గోధుమ",
  ],
  paddy: [
    "paddy",
    "rice",
    "dhan",
    "धान",
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

function clean(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

function norm(value) {
  return clean(value)
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s:/.,'\-–—]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function languageCode(value) {
  const code = clean(value).toLowerCase();

  if (code.startsWith("hi")) {
    return "hi";
  }

  if (code.startsWith("te")) {
    return "te";
  }

  return "en";
}

function validQuantity(value, max = MAX_QUANTITY) {
  const number = Number(value);

  return (
    Number.isFinite(number) &&
    number > 0 &&
    number <= Number(max)
  );
}

function isoDate(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function dayStart(value = new Date()) {
  const date = new Date(value);

  date.setHours(
    0,
    0,
    0,
    0
  );

  return date;
}

function addDays(days, now = new Date()) {
  const date = dayStart(now);

  date.setDate(
    date.getDate() + Number(days)
  );

  return date;
}

function parseDate(value) {
  const text = clean(value);

  if (!text) {
    return null;
  }

  const normalized =
    normalizeBookingDate(text);

  if (!normalized) {
    return null;
  }

  const date =
    new Date(`${normalized}T00:00:00`);

  return Number.isNaN(
    date.getTime()
  )
    ? null
    : date;
}

function dispatch(name, detail) {
  if (typeof window === "undefined") {
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
        new Event(name)
      );
    } catch {}
  }
}

function readJson(
  key,
  fallback = null
) {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw =
      localStorage.getItem(key);

    return raw
      ? JSON.parse(raw)
      : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(
  key,
  value
) {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    localStorage.setItem(
      key,
      JSON.stringify(value)
    );

    return true;
  } catch {
    return false;
  }
}

function removeKey(key) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.removeItem(key);
  } catch {}
}

/* =========================================================
   CROP
========================================================= */

export function extractBookingCrop(
  message
) {
  const text = norm(message);

  if (!text) {
    return null;
  }

  for (
    const [crop, aliases]
    of Object.entries(CROP_ALIASES)
  ) {
    if (
      aliases.some(
        alias =>
          text === norm(alias) ||
          text.includes(norm(alias))
      )
    ) {
      return crop;
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
  const text = norm(message);

  if (!text) {
    return null;
  }

  const explicit =
    text.match(
      /(\d+(?:\.\d+)?)\s*(kg|kgs|kilo|kilos|kilogram|kilograms|किलो|किलोग्राम|కిలో|కిలోలు)\b/i
    );

  if (explicit) {
    const value =
      Number(explicit[1]);

    return validQuantity(value)
      ? value
      : null;
  }

  if (
    !/^\d+(?:\.\d+)?$/.test(text)
  ) {
    return null;
  }

  const value =
    Number(text);

  return validQuantity(value)
    ? value
    : null;
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
    clean(value);

  return text || null;
}

/* =========================================================
   DATE
========================================================= */

export function normalizeBookingDate(
  value
) {
  if (!value) {
    return null;
  }

  const text =
    clean(value);

  if (
    /^\d{4}-\d{1,2}-\d{1,2}$/.test(text)
  ) {
    const [
      year,
      month,
      day,
    ] = text
      .split("-")
      .map(Number);

    const date =
      new Date(
        year,
        month - 1,
        day
      );

    if (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    ) {
      return isoDate(date);
    }
  }

  const slash =
    text.match(
      /^(\d{1,2})\/(\d{1,2})\/(20\d{2})$/
    );

  if (slash) {
    const day =
      Number(slash[1]);

    const month =
      Number(slash[2]);

    const year =
      Number(slash[3]);

    const date =
      new Date(
        year,
        month - 1,
        day
      );

    if (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    ) {
      return isoDate(date);
    }
  }

  return null;
}

export function extractNaturalBookingDate(
  message,
  now = new Date()
) {
  const text =
    norm(message);

  if (!text) {
    return null;
  }

  if (
    /\b(today|aaj|आज|ఈ రోజు|నేడు)\b/i.test(text)
  ) {
    return isoDate(
      new Date(now)
    );
  }

  if (
    /\b(tomorrow|kal|कल|రేపు)\b/i.test(text)
  ) {
    return isoDate(
      addDays(1, now)
    );
  }

  if (
    /\b(day after tomorrow|परसों|ఎల్లుండి)\b/i.test(text)
  ) {
    return isoDate(
      addDays(2, now)
    );
  }

  const inDays =
    text.match(
      /\bin\s+(\d{1,3})\s+(day|days|दिन|రోజులు)\b/i
    );

  if (inDays) {
    return isoDate(
      addDays(
        Number(inDays[1]),
        now
      )
    );
  }

  const explicit =
    normalizeBookingDate(text);

  if (explicit) {
    return explicit;
  }

  return null;
}

export function getDateReference(
  value
) {
  const dateText =
    normalizeBookingDate(value);

  const date =
    parseDate(dateText);

  if (!date) {
    return null;
  }

  return {
    date: dateText,

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
          weekday: "long",
        }
      ),

    label:
      date.toLocaleDateString(
        "en-IN",
        {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }
      ),
  };
}

/* =========================================================
   TIME
========================================================= */

function time24(value) {
  const text =
    clean(value).toLowerCase();

  const match =
    text.match(
      /^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i
    );

  if (!match) {
    return null;
  }

  let hour =
    Number(match[1]);

  const minute =
    Number(match[2] || 0);

  const meridiem =
    match[3]?.toLowerCase();

  if (minute > 59) {
    return null;
  }

  if (meridiem) {
    if (
      hour < 1 ||
      hour > 12
    ) {
      return null;
    }

    if (
      meridiem === "pm" &&
      hour !== 12
    ) {
      hour += 12;
    }

    if (
      meridiem === "am" &&
      hour === 12
    ) {
      hour = 0;
    }
  } else if (hour > 23) {
    return null;
  }

  return (
    `${String(hour).padStart(2, "0")}:` +
    `${String(minute).padStart(2, "0")}`
  );
}

export function normalizeBookingSlot(
  value
) {
  if (!value) {
    return null;
  }

  if (
    typeof value === "object"
  ) {
    const start =
      time24(value.start) ||
      clean(value.start);

    const end =
      time24(value.end) ||
      clean(value.end);

    if (!start && !end) {
      return null;
    }

    return {
      id:
        value.id ||
        `${start}-${end}`,

      start,

      end,

      display:
        clean(value.display) ||
        `${start}${end ? ` – ${end}` : ""}`,
    };
  }

  const text =
    clean(value);

  const range =
    text.match(
      /(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:-|to|–|—)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i
    );

  if (range) {
    const start =
      time24(range[1]);

    const end =
      time24(range[2]);

    if (start && end) {
      return {
        id:
          `${start}-${end}`,

        start,

        end,

        display:
          `${start} – ${end}`,
      };
    }
  }

  const single =
    time24(text);

  if (single) {
    return {
      id: single,
      start: single,
      end: "",
      display: single,
    };
  }

  return {
    id: text,
    start: text,
    end: "",
    display: text,
  };
}

export function extractTimeReference(
  message
) {
  const text =
    norm(message);

  const range =
    text.match(
      /(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:-|to|–|—)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i
    );

  if (range) {
    return normalizeBookingSlot(
      `${range[1]}-${range[2]}`
    );
  }

  const twelve =
    text.match(
      /\b(\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i
    );

  if (twelve) {
    return normalizeBookingSlot(
      twelve[1]
    );
  }

  const twentyFour =
    text.match(
      /\b([01]?\d|2[0-3]):[0-5]\d\b/
    );

  if (twentyFour) {
    return normalizeBookingSlot(
      twentyFour[0]
    );
  }

  const contextualHour =
    text.match(
      /\b(?:at|around|about|near|approximately)\s+([01]?\d|2[0-3])(?:\s*(?:am|pm))?\b/i
    );

  if (contextualHour) {
    const raw =
      `${contextualHour[1]} ${
        text.includes("pm")
          ? "pm"
          : text.includes("am")
            ? "am"
            : ""
      }`.trim();

    return normalizeBookingSlot(
      raw
    );
  }

  const morning =
    text.match(
      /\b(\d{1,2})(?:\s*)\b(?:in the morning|morning)\b/i
    );

  if (morning) {
    return normalizeBookingSlot(
      `${morning[1]} am`
    );
  }

  const afternoon =
    text.match(
      /\b(\d{1,2})(?:\s*)\b(?:in the afternoon|afternoon)\b/i
    );

  if (afternoon) {
    return normalizeBookingSlot(
      `${afternoon[1]} pm`
    );
  }

  return null;
}

/* =========================================================
   WEEKDAY
========================================================= */

function weekdayIndex(name) {
  return {
    sunday: 0,
    sun: 0,

    monday: 1,
    mon: 1,

    tuesday: 2,
    tue: 2,
    tues: 2,

    wednesday: 3,
    wed: 3,

    thursday: 4,
    thu: 4,
    thurs: 4,

    friday: 5,
    fri: 5,

    saturday: 6,
    sat: 6,
  }[name];
}

export function findAvailableDate(
  message,
  availableDates = [],
  now = new Date()
) {
  const text =
    norm(message);

  if (
    !text ||
    !Array.isArray(availableDates)
  ) {
    return null;
  }

  const natural =
    extractNaturalBookingDate(
      text,
      now
    );

  if (natural) {
    return (
      availableDates.find(
        item =>
          String(
            item.date || item.id
          ) === natural
      ) || null
    );
  }

  const dayMatch =
    text.match(
      /\b(sunday|sun|monday|mon|tuesday|tue|tues|wednesday|wed|thursday|thu|thurs|friday|fri|saturday|sat)\b/i
    );

  if (dayMatch) {
    const index =
      weekdayIndex(
        dayMatch[1].toLowerCase()
      );

    const today =
      new Date(now).getDay();

    const wantsNext =
      /\bnext\s+/.test(text);

    let delta =
      (index - today + 7) % 7;

    if (
      delta === 0 ||
      wantsNext
    ) {
      delta += 7;
    }

    const target =
      isoDate(
        addDays(
          delta,
          now
        )
      );

    return (
      availableDates.find(
        item =>
          String(
            item.date || item.id
          ) === target
      ) || null
    );
  }

  return (
    availableDates.find(
      item => {
        const label =
          norm(
            item.label ||
            item.date ||
            item.id
          );

        return (
          label &&
          text.includes(label)
        );
      }
    ) || null
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
    norm(message);

  if (
    !text ||
    !Array.isArray(availableCenters)
  ) {
    return null;
  }

  return (
    availableCenters.find(
      center => {
        const id =
          norm(center?.id);

        const name =
          norm(center?.name);

        return (
          (id &&
            text.includes(id)) ||
          (name &&
            text.includes(name))
        );
      }
    ) || null
  );
}

/* =========================================================
   SLOT MATCHING
========================================================= */

export function findSlotReference(
  message,
  availableSlots = []
) {
  const text =
    norm(message);

  if (
    !text ||
    !Array.isArray(availableSlots)
  ) {
    return null;
  }

  let requested =
    extractTimeReference(
      text
    );

  if (
    !requested &&
    /^\d{1,2}(?::\d{2})?$/.test(text)
  ) {
    requested =
      normalizeBookingSlot(
        text
      );
  }

  if (requested) {
    const exact =
      availableSlots.find(
        item =>
          String(item.start) ===
            String(requested.start) &&
          (
            !requested.end ||
            String(item.end) ===
              String(requested.end)
          )
      );

    if (exact) {
      return exact;
    }

    return (
      availableSlots.find(
        item =>
          String(item.start) ===
          String(requested.start)
      ) || null
    );
  }

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

  if (
    /\b(morning|सुबह|ఉదయం)\b/i.test(text)
  ) {
    return (
      availableSlots.find(
        item =>
          Number(
            String(item.start).slice(
              0,
              2
            )
          ) < 12
      ) || null
    );
  }

  if (
    /\b(afternoon|दोपहर|మధ్యాహ్నం)\b/i.test(text)
  ) {
    return (
      availableSlots.find(
        item => {
          const hour =
            Number(
              String(
                item.start
              ).slice(0, 2)
            );

          return (
            hour >= 12 &&
            hour < 17
          );
        }
      ) || null
    );
  }

  if (
    /\b(evening|शाम|సాయంత్రం)\b/i.test(text)
  ) {
    return (
      availableSlots.find(
        item =>
          Number(
            String(
              item.start
            ).slice(0, 2)
          ) >= 17
      ) || null
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
  if (source.slot) {
    return normalizeBookingSlot(
      source.slot
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
  const missing = [];

  if (!draft.crop) {
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

  if (!draft.centerId) {
    missing.push(
      BOOKING_FIELDS.CENTER
    );
  }

  if (!draft.date) {
    missing.push(
      BOOKING_FIELDS.DATE
    );
  }

  if (!slotFromFields(draft)) {
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
  if (draft.confirmed) {
    return BOOKING_STAGES.COMPLETE;
  }

  if (
    slotFromFields(draft)
  ) {
    return BOOKING_STAGES.CONFIRM;
  }

  if (
    draft.availabilityChecked
  ) {
    return BOOKING_STAGES.SLOT;
  }

  if (draft.date) {
    return BOOKING_STAGES.AVAILABILITY;
  }

  if (
    draft.crop &&
    validQuantity(draft.quantity) &&
    !draft.centerId
  ) {
    return BOOKING_STAGES.CENTER;
  }

  if (
    draft.crop &&
    validQuantity(draft.quantity)
  ) {
    return BOOKING_STAGES.DATE;
  }

  return (
    draft.crop ||
    draft.quantity
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
  if (!draft.crop) {
    return BOOKING_FIELDS.CROP;
  }

  if (
    !validQuantity(
      draft.quantity
    )
  ) {
    return BOOKING_FIELDS.QUANTITY;
  }

  if (!draft.centerId) {
    return BOOKING_FIELDS.CENTER;
  }

  if (!draft.date) {
    return BOOKING_FIELDS.DATE;
  }

  if (!slotFromFields(draft)) {
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

  const errors = {};

  if (!draft.crop) {
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

  if (!draft.centerId) {
    errors.centerId =
      "Procurement center is required.";
  }

  if (!draft.date) {
    errors.date =
      "Arrival date is required.";
  }

  if (!slotFromFields(draft)) {
    errors.slot =
      "Arrival window is required.";
  }

  return {
    valid:
      Object.keys(errors)
        .length === 0,

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
    typeof values === "object"
      ? values
      : {};

  const slot =
    slotFromFields(source);

  const draft = {
    schemaVersion:
      BOOKING_SCHEMA_VERSION,

    active:
      source.active !== false,

    assistantManaged:
      source.assistantManaged === true,

    crop:
      source.crop ||
      null,

    quantity:
      validQuantity(
        source.quantity
      )
        ? Number(source.quantity)
        : null,

    centerId:
      source.centerId == null
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

    date:
      normalizeBookingDate(
        source.date
      ),

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

    updatedAt:
      Date.now(),
  };

  draft.readyForConfirmation =
    getMissingBookingFields(
      draft
    ).length === 0;

  draft.step =
    getBookingStage(draft);

  if (
    !draft.dateLabel &&
    draft.date
  ) {
    draft.dateLabel =
      getDateReference(
        draft.date
      )?.label || null;
  }

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

export function mergeBookingDraft(
  current = {},
  updates = {}
) {
  return createBookingDraft({
    ...current,
    ...updates,
  });
}

/* =========================================================
   UPDATE EXTRACTION
========================================================= */

export function extractBookingUpdates(
  message,
  options = {}
) {
  const text =
    clean(message);

  const updates = {};

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

  if (crop) {
    updates.crop = crop;
  }

  if (quantity) {
    updates.quantity =
      quantity;
  }

  if (date) {
    updates.date = date;
  }

  if (slot) {
    updates.slot = slot;
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
    createBookingDraft(draft)
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
    ? normalize(stored)
    : null;
}

function loadBookingState() {
  const draft =
    readJson(
      BOOKING_STORAGE_KEY,
      null
    );

  if (
    draft &&
    typeof draft ===
      "object"
  ) {
    return normalize(draft);
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
    ? normalize(stored)
    : createEmpty();
}

function persistState(
  state,
  notify = true
) {
  const normalized =
    normalize(state);

  writeJson(
    BOOKING_STATE_STORAGE_KEY,
    normalized
  );

  writeJson(
    BOOKING_STORAGE_KEY,
    normalized
  );

  if (notify) {
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
      active: true,
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
   AVAILABILITY STORAGE
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

  if (ok) {
    dispatch(
      EVENT_AVAILABILITY,
      value
    );
  }

  return ok;
}

export function getBookingAvailabilityContext() {
  const empty = {
    availableDates: [],
    availableSlots: [],
    availableCenters: [],
    selectedDate: null,
    selectedCenterId: null,
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
   INTENT DETECTION
========================================================= */

function isBookingStart(
  text
) {
  return (
    /\b(book|booking|reserve|reservation|procurement|sell)\b/i.test(
      text
    ) ||
    /\b(बुक|बुकिंग|రిజర్వ్|బుక్|బుకింగ్)\b/i.test(
      text
    )
  );
}

function isConfirmation(
  text
) {
  return /^(yes|yeah|yep|ok|okay|confirm|confirmed|book it|do it|go ahead|haan|हां|हाँ|ठीक|ठीक है|అవును|సరే)\b/i.test(
    text
  );
}

function isCancellation(
  text
) {
  return /\b(cancel|cancel booking|stop booking|never mind|रद्द|रद्द करो|రద్దు|వద్దు)\b/i.test(
    text
  );
}

function asksForState(
  text
) {
  return (
    /\b(what have i|what did i|show my|my booking|booking details|selected|what have we selected)\b/i.test(
      text
    ) ||
    /क्या.*चुना|बुकिंग.*विवरण/i.test(
      text
    )
  );
}

function asksForDates(
  text
) {
  return (
    /\b(what|which|show|tell|give).*(date|dates)\b|\bavailable dates\b|\bdates available\b|\bwhich dates\b/i.test(
      text
    ) ||
    /तारीख.*उपलब्ध|तारीखें.*बताओ|తేదీలు.*అందుబాటులో/i.test(
      text
    )
  );
}

function asksForSlots(text) {
  return /\b(what|which|show|tell).*(time|times|slot|slots)\b|\bavailable (time|times|slots)\b|\bwhat time\b|\b(there are|they are|i see|i can see).*(available|slots|times)\b|\b(available|slots|times).*(there|here|already)\b/i.test(text) ||
    /समय.*उपलब्ध|समय.*बताओ|स्लॉट.*उपलब्ध|సమయం.*అందుబాటులో|స్లాట్లు.*అందుబాటులో/i.test(text);
}

function asksForCenters(
  text
) {
  return (
    /\b(what|which|show|tell|give|list).*(center|centers|procurement center|procurement centers)\b|\bavailable (center|centers)\b/i.test(
      text
    ) ||
    /केंद्र.*उपलब्ध|केंद्र.*बताओ|కేంద్రాలు.*అందుబాటులో|కేంద్రాలు.*చెప్పు/i.test(
      text
    )
  );
}

function asksForCenterTimings(
  text
) {
  const centerWords =
    /\b(center|centers|procurement|location|locations)\b/i.test(
      text
    );

  const timingWords =
    /\b(time|times|timing|timings|hours|opening|closing|open|close)\b/i.test(
      text
    );

  return (
    centerWords &&
    timingWords
  );
}

function asksForReview(
  text
) {
  return /\b(review|summary|summarize|show details|read it back|final details)\b/i.test(
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
    .map(item => {
      const ref =
        getDateReference(
          item.date ||
          item.id
        );

      const label =
        clean(item.label);

      if (
        ref?.label &&
        label &&
        !/^\d/.test(label)
      ) {
        return (
          `${label} (${ref.label})`
        );
      }

      return (
        ref?.label ||
        label ||
        item.date ||
        item.id
      );
    })
    .filter(Boolean)
    .join(", ");
}

function makeSlotText(
  slots = []
) {
  return slots
    .map(
      item =>
        item.display ||
        `${item.start || ""}${
          item.end
            ? ` – ${item.end}`
            : ""
        }`
    )
    .filter(Boolean)
    .join(", ");
}

/* =========================================================
   CENTER DISPLAY
========================================================= */

export function formatCenterOptions(
  centers = [],
  language = "en"
) {
  const rows =
    Array.isArray(centers)
      ? centers
      : [];

  if (!rows.length) {
    if (language === "hi") {
      return "अभी कोई सक्रिय खरीद केंद्र नहीं मिला।";
    }

    if (language === "te") {
      return "ప్రస్తుతం యాక్టివ్ కొనుగోలు కేంద్రాలు ఏవీ లభించలేదు.";
    }

    return "I couldn't find any active procurement centers right now.";
  }

  return rows
    .map(
      (center, index) => {
        const name =
          clean(center?.name) ||
          `Center ${index + 1}`;

        const open =
          clean(
            center?.openingTime ||
            center?.opening_time
          );

        const close =
          clean(
            center?.closingTime ||
            center?.closing_time
          );

        const timing =
          open && close
            ? ` — ${open} to ${close}`
            : "";

        return (
          `${index + 1}. ${name}${timing}`
        );
      }
    )
    .join("; ");
}

/* =========================================================
   BOOKING SUMMARY
========================================================= */

export function getBookingSummary(
  draft = {},
  language = "en"
) {
  const safe =
    normalize(draft);

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
      CROP_NAMES[code]?.[
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
      safe.slotStart ||
      null,

    complete:
      getMissingBookingFields(
        safe
      ).length === 0,

    stage:
      getBookingStage(
        safe
      ),
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

  const label =
    code === "hi"
      ? [
          "फसल",
          "मात्रा",
          "केंद्र",
          "तारीख",
          "समय",
        ]
      : code === "te"
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

  const value = [
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

  return label
    .map(
      (item, index) =>
        `${item}: ${value[index]}`
    )
    .join("\n");
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
        "All booking details are complete. I’ll show you the details before the final confirmation.",
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
    copy[code][field] ||
    copy[code].complete
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
    normalize(draft);

  return {
    ...getBookingSummary(
      safe,
      language
    ),

    valid:
      getMissingBookingFields(
        safe
      ).length === 0,
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
    normalize(draft);

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
  };
}

/* =========================================================
   ROUTE STATE
========================================================= */

export function buildBookingRouteState(
  draft = {}
) {
  const safe =
    normalize(draft);

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
  return locationState?.assistantBooking
    ? normalize(
        locationState.assistantBooking
      )
    : null;
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
    clean(message);

  const normalized =
    norm(text);

  const now =
    options.now ||
    new Date();

  let availability =
    getBookingAvailabilityContext();

  if (
    !Array.isArray(
      options.availableDates
    ) ||
    !Array.isArray(
      options.availableSlots
    )
  ) {
    availability =
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

  const previous =
    normalize(
      currentState ||
        loadBookingState()
    );

  const crop =
    extractBookingCrop(
      text
    );

  const quantity =
    extractBookingQuantity(
      text
    );

  /*
    A command like:

      book 50kg maize

    MUST start a new conversation.

    It must not inherit a stale date,
    stale slot, or stale confirmation
    from an older booking.
  */
  const startingFresh =
    isBookingStart(
      normalized
    ) &&
    Boolean(
      crop ||
      quantity
    );

  const preferredCenterId =
    previous.centerId ||
    availability.selectedCenterId ||
    availableCenters[0]?.id ||
    null;

  const preferredCenter =
    availableCenters.find(
      item =>
        String(item?.id) ===
        String(
          preferredCenterId
        )
    ) || null;

  let state =
    startingFresh
      ? createBookingDraft({
          active: true,

          assistantManaged:
            true,

          crop,

          quantity,

          centerId:
            preferredCenterId,

          centerName:
            preferredCenter?.name ||
            null,
        })
      : previous;

  if (!text) {
    return {
      handled: false,
      intent:
        BOOKING_INTENTS.NONE,
      state,
    };
  }

  /* =======================================================
     CANCEL
  ======================================================= */

  if (
    isCancellation(
      normalized
    )
  ) {
    const empty =
      createEmpty();

    persistState(
      empty
    );

    return {
      handled: true,

      intent:
        BOOKING_INTENTS.CANCEL,

      state:
        empty,

      nextStep:
        BOOKING_STEPS.DETAILS,
    };
  }

  /* =======================================================
     CONFIRM
  ======================================================= */

  if (
    isConfirmation(
      normalized
    )
  ) {
    if (
      state.readyForConfirmation &&
      validateBookingDraft(
        state
      ).valid
    ) {
      state =
        createBookingDraft({
          ...state,

          confirmed:
            true,

          awaitingConfirmation:
            false,
        });

      persistState(
        state
      );

      return {
        handled: true,

        intent:
          BOOKING_INTENTS.CONFIRM,

        state,

        booking:
          state,

        nextStep:
          BOOKING_STEPS.COMPLETE,
      };
    }

    return {
      handled: true,

      intent:
        BOOKING_INTENTS.UPDATE,

      state,

      missing:
        getMissingBookingFields(
          state
        ),

      nextStep:
        getBookingStage(
          state
        ),

      confirmationBlocked:
        true,
    };
  }

  /* =======================================================
     SHOW CURRENT STATE
  ======================================================= */

  if (
    asksForState(
      normalized
    )
  ) {
    persistState(
      state
    );

    return {
      handled: true,

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
     CENTERS / CENTER TIMINGS
  ======================================================= */

  if (
    asksForCenters(
      normalized
    ) ||
    asksForCenterTimings(
      normalized
    )
  ) {
    persistState(
      state
    );

    return {
      handled: true,

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
    };
  }

  /* =======================================================
     DATES
  ======================================================= */

  if (
    asksForDates(
      normalized
    )
  ) {
    persistState(
      state
    );

    return {
      handled: true,

      intent:
        BOOKING_INTENTS.ASK_DATES,

      state,

      dates:
        availableDates,

      dateText:
        makeDateText(
          availableDates
        ),
    };
  }

  /* =======================================================
     SLOTS
  ======================================================= */

  if (
    asksForSlots(
      normalized
    )
  ) {
    persistState(
      state
    );

    return {
      handled: true,

      intent:
        BOOKING_INTENTS.ASK_SLOTS,

      state,

      slots:
        availableSlots,

      slotText:
        makeSlotText(
          availableSlots
        ),
    };
  }

  /* =======================================================
     CENTER SELECTION
  ======================================================= */

  let center =
    findAvailableCenter(
      text,
      availableCenters
    );

  if (
    !center &&
    /\b(first|earliest|nearest|default)\s+(center|centre)\b/i.test(
      text
    )
  ) {
    center =
      availableCenters[0] ||
      null;
  }

  if (
    !center &&
    /\b(another|different|other)\s+(center|centre)\b/i.test(
      text
    ) &&
    state.centerId
  ) {
    center =
      availableCenters.find(
        item =>
          String(item?.id) !==
          String(
            state.centerId
          )
      ) || null;
  }

  if (center) {
    state =
      mergeBookingDraft(
        state,
        {
          centerId:
            center.id,

          centerName:
            center.name ||
            null,

          slot:
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
        }
      );

    persistState(
      state
    );

    return {
      handled: true,

      intent:
        BOOKING_INTENTS.UPDATE,

      state,

      nextStep:
        getBookingStage(
          state
        ),

      missing:
        getMissingBookingFields(
          state
        ),
    };
  }

  /* =======================================================
     EXTRACT DETAILS
  ======================================================= */

  const updates =
    extractBookingUpdates(
      text,
      {
        now,
      }
    );

  /* =======================================================
     NATURAL DATE
  ======================================================= */

  if (updates.date) {
    if (!availableDates.length) {
      persistState(
        state
      );

      return {
        handled: true,

        intent:
          BOOKING_INTENTS.ASK_DATES,

        state,

        dates: [],

        dateText:
          "",

        unavailableDate:
          updates.date,

        needsAvailability:
          true,
      };
    }

    const selectedDate =
      availableDates.find(
        item =>
          String(
            item.date ||
              item.id
          ) ===
          String(
            updates.date
          )
      );

    if (!selectedDate) {
      persistState(
        state
      );

      return {
        handled: true,

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
          updates.date,
      };
    }

    state =
      mergeBookingDraft(
        state,
        {
          ...updates,

          date:
            selectedDate.date ||
            selectedDate.id,

          slot:
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
        }
      );

    persistState(
      state
    );

    return {
      handled: true,

      intent:
        BOOKING_INTENTS.SELECT_DATE,

      state,

      selectedDate,

      nextStep:
        BOOKING_STEPS.SLOT,
    };
  }

  /* =======================================================
     DATE BY NAME / WEEKDAY
  ======================================================= */

  const selectedDate =
    findAvailableDate(
      text,
      availableDates,
      now
    );

  if (selectedDate) {
    state =
      mergeBookingDraft(
        state,
        {
          date:
            selectedDate.date ||
            selectedDate.id,

          slot:
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
        }
      );

    persistState(
      state
    );

    return {
      handled: true,

      intent:
        BOOKING_INTENTS.SELECT_DATE,

      state,

      selectedDate,

      nextStep:
        BOOKING_STEPS.SLOT,
    };
  }

  /* =======================================================
     DATE-LIKE MESSAGE BUT UNAVAILABLE
  ======================================================= */

  const looksLikeDateChoice =
    Boolean(
      extractNaturalBookingDate(
        text,
        now
      )
    ) ||
    /\b(today|tomorrow|day after tomorrow|next|monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thurs|fri|sat|sun)\b/i.test(
      text
    );

  if (
    looksLikeDateChoice
  ) {
    persistState(
      state
    );

    return {
      handled: true,

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
        text,
    };
  }

  /* =======================================================
     SLOT SELECTION
  ======================================================= */

  const selectedSlot =
    findSlotReference(
      text,
      availableSlots
    );

  if (selectedSlot) {
    state =
      mergeBookingDraft(
        state,
        {
          slot:
            selectedSlot,

          availabilityChecked:
            true,

          confirmed:
            false,

          awaitingConfirmation:
            false,
        }
      );

    persistState(
      state
    );

    return {
      handled: true,

      intent:
        BOOKING_INTENTS.SELECT_SLOT,

      state,

      selectedSlot,

      review:
        review(
          state,
          options.language ||
            "en"
        ),

      nextStep:
        state.readyForConfirmation
          ? BOOKING_STEPS.REVIEW
          : getBookingStage(
              state
            ),
    };
  }

  /* =======================================================
     TIME WAS REQUESTED BUT NOT AVAILABLE
  ======================================================= */

  if (
    extractTimeReference(
      text
    )
  ) {
    persistState(
      state
    );

    return {
      handled: true,

      intent:
        BOOKING_INTENTS.ASK_SLOTS,

      state,

      slots:
        availableSlots,

      slotText:
        makeSlotText(
          availableSlots
        ),

      unavailableSlot:
        extractTimeReference(
          text
        ),
    };
  }

  /* =======================================================
     REVIEW
  ======================================================= */

  if (
    asksForReview(
      normalized
    )
  ) {
    persistState(
      state
    );

    return {
      handled: true,

      intent:
        BOOKING_INTENTS.REVIEW,

      state,

      review:
        review(
          state,
          options.language ||
            "en"
        ),

      nextStep:
        state.readyForConfirmation
          ? BOOKING_STEPS.REVIEW
          : getBookingStage(
              state
            ),
    };
  }

  /* =======================================================
     GENERIC FIELD UPDATES
  ======================================================= */

  if (
    Object.keys(
      updates
    ).length
  ) {
    const dateChanged =
      Boolean(
        updates.date
      );

    state =
      mergeBookingDraft(
        state,
        {
          ...updates,

          availabilityChecked:
            dateChanged
              ? false
              : state.availabilityChecked,

          slot:
            dateChanged
              ? null
              : state.slot,

          slotStart:
            dateChanged
              ? null
              : state.slotStart,

          slotEnd:
            dateChanged
              ? null
              : state.slotEnd,

          slotDisplay:
            dateChanged
              ? null
              : state.slotDisplay,

          confirmed:
            false,

          awaitingConfirmation:
            false,
        }
      );

    persistState(
      state
    );

    return {
      handled: true,

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
     NEW BOOKING
  ======================================================= */

  if (startingFresh) {
    persistState(
      state
    );

    return {
      handled: true,

      intent:
        BOOKING_INTENTS.START,

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
    handled: false,

    intent:
      BOOKING_INTENTS.NONE,

    state,
  };
}

export const process =
  processBookingConversation;

/* =========================================================
   DEFAULT OBJECT
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

  process,
};

export default assistantBooking;