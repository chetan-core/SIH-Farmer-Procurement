/* =========================================================
   KRISHISETU AI ASSISTANT UTILITIES
=========================================================

   Shared utility functions used by:

   assistantActions.js
   intentEngine.js
   assistantContext.js
   assistantRouter.js
   assistantService.js
   VoiceAssistant.jsx

   This file contains reusable, side-effect-light helpers.
========================================================= */


/* =========================================================
   CONSTANTS
========================================================= */

const DEFAULT_MAX_HISTORY =
  12;

const DEFAULT_MAX_MESSAGES =
  50;


/* =========================================================
   TEXT
========================================================= */

export function cleanText(
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


export function normalizeText(
  value
) {

  return cleanText(
    value
  )
    .toLowerCase()
    .normalize(
      "NFKC"
    )
    .replace(
      /[^\p{L}\p{N}\s:./-]/gu,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();

}


export function normalizeLanguageCode(
  value
) {

  const text =
    String(
      value || ""
    )
      .trim()
      .toLowerCase();


  if (
    text === "hi" ||
    text.startsWith("hi-") ||
    text.startsWith("hin")
  ) {

    return "hi";

  }


  if (
    text === "te" ||
    text.startsWith("te-") ||
    text.startsWith("tel")
  ) {

    return "te";

  }


  return "en";

}


/* =========================================================
   ID
========================================================= */

export function createId() {

  if (
    typeof crypto !==
      "undefined" &&
    typeof crypto.randomUUID ===
      "function"
  ) {

    return crypto.randomUUID();

  }


  return (
    `ai-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`
  );

}


/* =========================================================
   ARRAY HELPERS
========================================================= */

export function asArray(
  value
) {

  return Array.isArray(
    value
  )
    ? value
    : [];

}


export function uniqueArray(
  values
) {

  return [
    ...new Set(
      asArray(
        values
      )
    ),
  ];

}


/* =========================================================
   STORAGE
========================================================= */

export function readStorageJson(
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


    if (
      !raw
    ) {

      return fallback;

    }


    const parsed =
      JSON.parse(
        raw
      );


    return (
      parsed ??
      fallback
    );

  } catch {

    return fallback;

  }

}


export function writeStorageJson(
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


export function removeStorage(
  key
) {

  if (
    typeof window ===
    "undefined"
  ) {

    return false;

  }


  try {

    localStorage.removeItem(
      key
    );


    return true;

  } catch {

    return false;

  }

}


export function readStorageValue(
  key,
  fallback = ""
) {

  if (
    typeof window ===
    "undefined"
  ) {

    return fallback;

  }


  try {

    const value =
      localStorage.getItem(
        key
      );


    return (
      value ??
      fallback
    );

  } catch {

    return fallback;

  }

}


/* =========================================================
   FARMER STORAGE
========================================================= */

const FARMER_OBJECT_KEYS = [

  "farmer",

  "farmerData",

  "loggedInFarmer",

  "currentFarmer",

  "krishisetuFarmer",

  "krishisetu_farmer",

  "farmerUser",

];


const FARMER_ID_KEYS = [

  "farmerId",

  "farmer_id",

  "currentFarmerId",

];


const FARMER_PHONE_KEYS = [

  "farmerPhone",

  "farmer_phone",

  "phone",

];


function extractFarmerFromObject(
  value
) {

  if (
    !value ||
    typeof value !==
      "object"
  ) {

    return null;

  }


  const farmerId =
    value.id ??
    value.farmerId ??
    value.farmer_id ??
    "";


  const phone =
    value.phone ??
    value.mobile ??
    value.mobileNumber ??
    value.farmerPhone ??
    "";


  const name =
    value.name ??
    value.fullName ??
    value.farmerName ??
    "";


  if (
    !farmerId &&
    !phone
  ) {

    return null;

  }


  return {

    farmerId:
      String(
        farmerId || ""
      ),

    phone:
      String(
        phone || ""
      ),

    name:
      String(
        name || ""
      ),

  };

}


export function getStoredFarmer() {

  const empty = {

    farmerId:
      "",

    phone:
      "",

    name:
      "",

  };


  if (
    typeof window ===
    "undefined"
  ) {

    return empty;

  }


  /*
   * Prototype state has priority.
   */

  try {

    const prototypeState =
      localStorage.getItem(
        "krishisetu_prototype_state"
      );


    if (
      prototypeState
    ) {

      const parsed =
        JSON.parse(
          prototypeState
        );


      const farmer =
        extractFarmerFromObject(
          parsed?.currentUser
        );


      if (
        farmer
      ) {

        return farmer;

      }

    }

  } catch {
  }


  /*
   * Search object-based storage.
   */

  for (
    const key of
    FARMER_OBJECT_KEYS
  ) {

    try {

      const raw =
        localStorage.getItem(
          key
        );


      if (
        !raw
      ) {

        continue;

      }


      const parsed =
        JSON.parse(
          raw
        );


      const farmer =
        extractFarmerFromObject(
          parsed
        );


      if (
        farmer
      ) {

        return farmer;

      }

    } catch {
    }

  }


  /*
   * Search primitive storage.
   */

  let farmerId =
    "";

  let phone =
    "";


  for (
    const key of
    FARMER_ID_KEYS
  ) {

    const value =
      readStorageValue(
        key,
        ""
      );


    if (
      value
    ) {

      farmerId =
        value;

      break;

    }

  }


  for (
    const key of
    FARMER_PHONE_KEYS
  ) {

    const value =
      readStorageValue(
        key,
        ""
      );


    if (
      value
    ) {

      phone =
        value;

      break;

    }

  }


  return {

    farmerId:
      String(
        farmerId ||
        ""
      ),

    phone:
      String(
        phone ||
        ""
      ),

    name:
      "",

  };

}


export function hasStoredFarmer() {

  const farmer =
    getStoredFarmer();


  return Boolean(

    farmer.farmerId ||
    farmer.phone

  );

}


/* =========================================================
   ROUTES
========================================================= */

export function normalizePathname(
  pathname
) {

  let path =
    String(
      pathname || ""
    )
      .trim();


  if (
    !path
  ) {

    return "/";

  }


  const queryIndex =
    path.indexOf(
      "?"
    );


  if (
    queryIndex >=
    0
  ) {

    path =
      path.slice(
        0,
        queryIndex
      );

  }


  const hashIndex =
    path.indexOf(
      "#"
    );


  if (
    hashIndex >=
    0
  ) {

    path =
      path.slice(
        0,
        hashIndex
      );

  }


  if (
    path.length >
      1 &&
    path.endsWith(
      "/"
    )
  ) {

    path =
      path.slice(
        0,
        -1
      );

  }


  return (
    path ||
    "/"
  );

}


export function isFarmerPath(
  pathname
) {

  return normalizePathname(
    pathname
  ).startsWith(
    "/farmer"
  );

}


/* =========================================================
   PAGE NAMES
========================================================= */

const PAGE_NAMES = {

  "/":
    "Home",

  "/farmer/home":
    "Farmer Home",

  "/farmer/book":
    "Book Procurement Slot",

  "/farmer/token":
    "Token / Booking Tracking",

  "/farmer/history":
    "Procurement History",

  "/farmer/payments":
    "Payment History",

  "/farmer/settings":
    "Farmer Settings",

  "/farmer/help":
    "Farmer Help",

  "/farmer/login":
    "Farmer Login",

  "/farmer/register":
    "Farmer Registration",

};


export function getPageName(
  pathname
) {

  const normalized =
    normalizePathname(
      pathname
    );


  return (
    PAGE_NAMES[
      normalized
    ] ||
    normalized ||
    "Unknown Page"
  );

}


/* =========================================================
   ACTION HELPERS
========================================================= */

export function isActionName(
  action,
  actionRegistry
) {

  if (
    !action ||
    !actionRegistry ||
    typeof actionRegistry !==
      "object"
  ) {

    return false;

  }


  return Boolean(
    actionRegistry[
      action
    ]
  );

}


/* =========================================================
   HISTORY
========================================================= */

export function sanitizeHistory(
  history
) {

  return asArray(
    history
  )
    .filter(
      message => {

        if (
          !message ||
          typeof message !==
            "object"
        ) {

          return false;

        }


        if (
          message.role !==
            "user" &&
          message.role !==
            "assistant"
        ) {

          return false;

        }


        return Boolean(
          cleanText(
            message.content
          )
        );

      }
    )
    .map(
      message => {

        const result = {

          id:
            message.id ||
            createId(),

          role:
            message.role,

          content:
            cleanText(
              message.content
            ),

          timestamp:
            Number(
              message.timestamp
            ) ||
            Date.now(),

          action:
            message.action ||
            "NONE",

          failed:
            Boolean(
              message.failed
            ),

        };


        if (
          message.semanticTopic
        ) {

          result.semanticTopic =
            cleanText(
              message.semanticTopic
            );

        }


        return result;

      }
    );

}


export function limitHistory(
  history,
  maxMessages =
    DEFAULT_MAX_MESSAGES
) {

  const safe =
    sanitizeHistory(
      history
    );


  const limit =
    Number(
      maxMessages
    );


  if (
    !Number.isFinite(
      limit
    ) ||
    limit <= 0
  ) {

    return [];

  }


  return safe.slice(
    -Math.floor(
      limit
    )
  );

}


export function historyForServer(
  history,
  maxMessages =
    DEFAULT_MAX_HISTORY
) {

  return limitHistory(
    history,
    maxMessages
  )
    .map(
      message => {

        const result = {

          role:
            message.role,

          content:
            cleanText(
              message.content
            ),

        };


        if (
          message.action &&
          message.action !==
            "NONE"
        ) {

          result.action =
            message.action;

        }


        if (
          message.semanticTopic
        ) {

          result.semanticTopic =
            message.semanticTopic;

        }


        return result;

      }
    );

}


export function getLastMessage(
  history,
  role
) {

  const safe =
    sanitizeHistory(
      history
    );


  for (
    let index =
      safe.length - 1;
    index >= 0;
    index -= 1
  ) {

    if (
      safe[index].role ===
      role
    ) {

      return safe[
        index
      ];

    }

  }


  return null;

}


export function getLastUserMessage(
  history
) {

  return getLastMessage(
    history,
    "user"
  );

}


export function getLastAssistantMessage(
  history
) {

  return getLastMessage(
    history,
    "assistant"
  );

}


/* =========================================================
   HISTORY SUMMARY
========================================================= */

export function summarizeHistory(
  history,
  maxMessages = 6
) {

  return limitHistory(
    history,
    maxMessages
  )
    .map(
      message => {

        const result = {

          role:
            message.role,

          content:
            cleanText(
              message.content
            ),

          action:
            message.action ||
            "NONE",

        };


        if (
          message.semanticTopic
        ) {

          result.semanticTopic =
            message.semanticTopic;

        }


        return result;

      }
    );

}


/* =========================================================
   MESSAGE TIME
========================================================= */

export function formatMessageTime(
  timestamp,
  language = "en"
) {

  const date =
    new Date(
      timestamp
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "";

  }


  const normalizedLanguage =
    normalizeLanguageCode(
      language
    );


  const locale =
    normalizedLanguage ===
      "hi"
      ? "hi-IN"
      : normalizedLanguage ===
          "te"
        ? "te-IN"
        : "en-IN";


  try {

    return date.toLocaleTimeString(
      locale,
      {

        hour:
          "numeric",

        minute:
          "2-digit",

      }
    );

  } catch {

    return date.toLocaleTimeString();

  }

}


/* =========================================================
   LANGUAGE
========================================================= */

export function getLocale(
  language
) {

  const normalized =
    normalizeLanguageCode(
      language
    );


  if (
    normalized ===
    "hi"
  ) {

    return "hi-IN";

  }


  if (
    normalized ===
    "te"
  ) {

    return "te-IN";

  }


  return "en-IN";

}


export function getSpeechLanguage(
  language
) {

  return getLocale(
    language
  );

}


/* =========================================================
   TEXT RELATION
========================================================= */

export function containsText(
  value,
  phrase
) {

  const text =
    normalizeText(
      value
    );


  const target =
    normalizeText(
      phrase
    );


  if (
    !text ||
    !target
  ) {

    return false;

  }


  return text.includes(
    target
  );

}


export function containsAnyText(
  value,
  phrases
) {

  const text =
    normalizeText(
      value
    );


  return asArray(
    phrases
  )
    .some(
      phrase =>
        containsText(
          text,
          phrase
        )
    );

}


/* =========================================================
   SAFE JSON
========================================================= */

export function safeJsonParse(
  value,
  fallback = {}
) {

  if (
    typeof value !==
      "string"
  ) {

    return value ??
      fallback;

  }


  try {

    return JSON.parse(
      value
    );

  } catch {

    return fallback;

  }

}


/* =========================================================
   API RESPONSE
========================================================= */

export function getApiErrorMessage(
  data,
  fallback =
    "The assistant request failed."
) {

  if (
    typeof data ===
      "string" &&
    cleanText(
      data
    )
  ) {

    return cleanText(
      data
    );

  }


  if (
    data &&
    typeof data ===
      "object"
  ) {

    const candidates = [

      data.message,

      data.error,

      data.detail,

      data.reason,

    ];


    for (
      const candidate of
      candidates
    ) {

      if (
        typeof candidate ===
          "object" &&
        candidate !==
          null
      ) {

        if (
          cleanText(
            candidate.message
          )
        ) {

          return cleanText(
            candidate.message
          );

        }

        continue;

      }


      if (
        cleanText(
          candidate
        )
      ) {

        return cleanText(
          candidate
        );

      }

    }

  }


  return fallback;

}


/* =========================================================
   BROWSER CAPABILITIES
========================================================= */

export function hasSpeechRecognition() {

  if (
    typeof window ===
    "undefined"
  ) {

    return false;

  }


  return Boolean(

    window.SpeechRecognition ||

    window.webkitSpeechRecognition

  );

}


export function hasSpeechSynthesis() {

  if (
    typeof window ===
    "undefined"
  ) {

    return false;

  }


  return Boolean(
    window.speechSynthesis
  );

}


export function hasMicrophoneSupport() {

  if (
    typeof navigator ===
    "undefined"
  ) {

    return false;

  }


  return Boolean(

    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia

  );

}


/* =========================================================
   DEVICE
========================================================= */

export function isTouchDevice() {

  if (
    typeof window ===
    "undefined"
  ) {

    return false;

  }


  return (

    "ontouchstart" in
      window ||

    navigator.maxTouchPoints >
      0

  );

}


export function getViewportCategory() {

  if (
    typeof window ===
    "undefined"
  ) {

    return "desktop";

  }


  const width =
    window.innerWidth;


  if (
    width <= 480
  ) {

    return "mobile";

  }


  if (
    width <= 900
  ) {

    return "tablet";

  }


  return "desktop";

}


/* =========================================================
   OBJECT HELPERS
========================================================= */

export function isPlainObject(
  value
) {

  return Boolean(

    value &&

    typeof value ===
      "object" &&

    !Array.isArray(
      value
    )

  );

}


export function pick(
  object,
  keys
) {

  if (
    !isPlainObject(
      object
    )
  ) {

    return {};

  }


  const output = {};


  for (
    const key of
    asArray(
      keys
    )
  ) {

    if (
      Object.prototype.hasOwnProperty.call(
        object,
        key
      )
    ) {

      output[
        key
      ] =
        object[
          key
        ];

    }

  }


  return output;

}


/* =========================================================
   RECENCY
========================================================= */

export function isRecent(
  timestamp,
  maxAgeMs
) {

  const time =
    Number(
      timestamp
    );


  if (
    !time
  ) {

    return false;

  }


  const age =
    Date.now() -
    time;


  return (

    age >= 0 &&

    age <=
      Number(
        maxAgeMs
      )

  );

}


/* =========================================================
   ACTION PARAMETER SAFETY
========================================================= */

/*
 * IMPORTANT
 *
 * This is intentionally richer than the old implementation.
 *
 * Booking state must survive all of these transitions:
 *
 * user
 *  ↓
 * intentEngine
 *  ↓
 * router
 *  ↓
 * pending action
 *  ↓
 * controller
 *  ↓
 * executor / FarmerBook
 *
 * The previous implementation kept only:
 *
 *   crop
 *   quantity
 *
 * which caused date / center / slot information to disappear.
 */

export function sanitizeActionParams(
  params
) {

  if (
    !isPlainObject(
      params
    )
  ) {

    return null;

  }


  const output = {};


  /*
   * -------------------------------------------------------
   * CROP
   * -------------------------------------------------------
   */

  if (
    typeof params.crop ===
      "string" &&
    cleanText(
      params.crop
    )
  ) {

    output.crop =
      cleanText(
        params.crop
      );

  }


  /*
   * -------------------------------------------------------
   * QUANTITY
   * -------------------------------------------------------
   */

  const quantity =
    Number(
      params.quantity ??
      params.estimatedQuantity
    );


  if (
    Number.isFinite(
      quantity
    ) &&
    quantity > 0 &&
    quantity <= 50000
  ) {

    output.quantity =
      quantity;

  }


  /*
   * -------------------------------------------------------
   * CENTER
   * -------------------------------------------------------
   */

  if (
    params.centerId !==
      undefined &&
    params.centerId !==
      null &&
    cleanText(
      params.centerId
    )
  ) {

    output.centerId =
      params.centerId;

  }


  if (
    typeof params.centerName ===
      "string" &&
    cleanText(
      params.centerName
    )
  ) {

    output.centerName =
      cleanText(
        params.centerName
      );

  }


  /*
   * -------------------------------------------------------
   * DATE
   * -------------------------------------------------------
   */

  if (
    typeof params.date ===
      "string" &&
    cleanText(
      params.date
    )
  ) {

    output.date =
      cleanText(
        params.date
      );

  }


  if (
    typeof params.dateLabel ===
      "string" &&
    cleanText(
      params.dateLabel
    )
  ) {

    output.dateLabel =
      cleanText(
        params.dateLabel
      );

  }


  /*
   * -------------------------------------------------------
   * SLOT
   * -------------------------------------------------------
   */

  if (
    typeof params.slotId ===
      "string" &&
    cleanText(
      params.slotId
    )
  ) {

    output.slotId =
      cleanText(
        params.slotId
      );

  }


  if (
    typeof params.slotStart ===
      "string" &&
    cleanText(
      params.slotStart
    )
  ) {

    output.slotStart =
      cleanText(
        params.slotStart
      );

  }


  if (
    typeof params.slotEnd ===
      "string" &&
    cleanText(
      params.slotEnd
    )
  ) {

    output.slotEnd =
      cleanText(
        params.slotEnd
      );

  }


  if (
    typeof params.slotDisplay ===
      "string" &&
    cleanText(
      params.slotDisplay
    )
  ) {

    output.slotDisplay =
      cleanText(
        params.slotDisplay
      );

  }


  /*
   * -------------------------------------------------------
   * STEP / BOOKING STATE
   * -------------------------------------------------------
   */

  if (
    typeof params.step ===
      "string" &&
    cleanText(
      params.step
    )
  ) {

    output.step =
      cleanText(
        params.step
      );

  }


  if (
    typeof params.readyForConfirmation ===
      "boolean"
  ) {

    output.readyForConfirmation =
      params.readyForConfirmation;

  }


  if (
    typeof params.awaitingConfirmation ===
      "boolean"
  ) {

    output.awaitingConfirmation =
      params.awaitingConfirmation;

  }


  if (
    typeof params.active ===
      "boolean"
  ) {

    output.active =
      params.active;

  }


  /*
   * -------------------------------------------------------
   * TOKEN
   * -------------------------------------------------------
   */

  if (
    params.token !==
      undefined &&
    params.token !==
      null &&
    cleanText(
      params.token
    )
  ) {

    output.token =
      cleanText(
        params.token
      );

  }


  if (
    params.tokenNumber !==
      undefined &&
    params.tokenNumber !==
      null &&
    cleanText(
      params.tokenNumber
    )
  ) {

    output.tokenNumber =
      cleanText(
        params.tokenNumber
      );

  }


  /*
   * -------------------------------------------------------
   * BOOKING REFERENCE
   * -------------------------------------------------------
   */

  if (
    params.bookingId !==
      undefined &&
    params.bookingId !==
      null &&
    cleanText(
      params.bookingId
    )
  ) {

    output.bookingId =
      cleanText(
        params.bookingId
      );

  }


  /*
   * -------------------------------------------------------
   * ENTITY REFERENCES
   * -------------------------------------------------------
   */

  if (
    params.referenceType
  ) {

    output.referenceType =
      cleanText(
        params.referenceType
      );

  }


  if (
    params.referenceValue !==
      undefined &&
    params.referenceValue !==
      null &&
    cleanText(
      params.referenceValue
    )
  ) {

    output.referenceValue =
      cleanText(
        params.referenceValue
      );

  }


  /*
   * -------------------------------------------------------
   * DATE REFERENCE
   * -------------------------------------------------------
   */

  if (
    typeof params.requestedDate ===
      "string" &&
    cleanText(
      params.requestedDate
    )
  ) {

    output.requestedDate =
      cleanText(
        params.requestedDate
      );

  }


  /*
   * -------------------------------------------------------
   * ACTION-SPECIFIC FLAGS
   * -------------------------------------------------------
   */

  const booleanKeys = [

    "download",

    "downloadQr",

    "downloadReceipt",

    "open",

    "navigate",

    "explicitNavigation",

    "continueBooking",

    "executeBooking",

    "cancelBooking",

  ];


  for (
    const key of
    booleanKeys
  ) {

    if (
      typeof params[key] ===
        "boolean"
    ) {

      output[key] =
        params[key];

    }

  }


  return Object.keys(
    output
  ).length
    ? output
    : null;

}


/* =========================================================
   BOOKING DATA MERGE
========================================================= */

/*
 * Merge booking objects without allowing undefined/null
 * values to erase useful information already collected.
 */

export function mergeSafeParams(
  previous,
  next
) {

  const first =
    sanitizeActionParams(
      previous
    ) ||
    {};

  const second =
    sanitizeActionParams(
      next
    ) ||
    {};


  const merged = {

    ...first,

    ...second,

  };


  return Object.keys(
    merged
  ).length
    ? merged
    : null;

}


/* =========================================================
   BOOKING PARAMETER CHECK
========================================================= */

export function hasBookingParams(
  params
) {

  const safe =
    sanitizeActionParams(
      params
    );


  return Boolean(

    safe &&
    (
      safe.crop ||
      safe.quantity ||
      safe.centerId ||
      safe.date ||
      safe.slotId ||
      safe.slotStart ||
      safe.slotEnd
    )

  );

}


/* =========================================================
   STORAGE VERSIONING
========================================================= */

export function versionedStorageRead(
  key,
  currentVersion = 1,
  fallback = null
) {

  const value =
    readStorageJson(
      key,
      null
    );


  if (
    !value ||
    !isPlainObject(
      value
    )
  ) {

    return fallback;

  }


  if (
    Number(
      value.version
    ) !==
    Number(
      currentVersion
    )
  ) {

    return fallback;

  }


  return value.data ??
    fallback;

}


/* =========================================================
   DEBUG
========================================================= */

export function debugLog(
  label,
  value
) {

  if (
    typeof import.meta !==
      "undefined" &&
    import.meta.env?.DEV
  ) {

    console.debug(
      `[KrishiSetu AI] ${label}`,
      value
    );

  }

}


/* =========================================================
   EXPORT BUNDLE
========================================================= */

export const ASSISTANT_UTILS = {

  cleanText,

  normalizeText,

  normalizeLanguageCode,

  createId,

  asArray,

  uniqueArray,

  readStorageJson,

  writeStorageJson,

  removeStorage,

  readStorageValue,

  getStoredFarmer,

  hasStoredFarmer,

  normalizePathname,

  isFarmerPath,

  getPageName,

  isActionName,

  sanitizeHistory,

  limitHistory,

  historyForServer,

  getLastMessage,

  getLastUserMessage,

  getLastAssistantMessage,

  summarizeHistory,

  formatMessageTime,

  getLocale,

  getSpeechLanguage,

  containsText,

  containsAnyText,

  safeJsonParse,

  getApiErrorMessage,

  hasSpeechRecognition,

  hasSpeechSynthesis,

  hasMicrophoneSupport,

  isTouchDevice,

  getViewportCategory,

  isPlainObject,

  pick,

  isRecent,

  sanitizeActionParams,

  mergeSafeParams,

  hasBookingParams,

  versionedStorageRead,

  debugLog,

};