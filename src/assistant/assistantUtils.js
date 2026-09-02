/* =========================================================
   KRISHISETU AI ASSISTANT UTILITIES
=========================================================

   Shared utility functions used by:

   assistantActions.js
   intentEngine.js
   assistantContext.js
   assistantRouter.js
   VoiceAssistant.jsx

   This file should contain reusable, side-effect-light
   helper functions.

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

/*
 * Clean user-visible text without changing its meaning.
 */

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


/*
 * More aggressive normalization for intent detection.
 */

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
      /[^\p{L}\p{N}\s]/gu,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();

}


/*
 * Convert a language value into one of the supported
 * language identifiers.
 */

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

/*
 * Safely read JSON from localStorage.
 */

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


/*
 * Safely write JSON to localStorage.
 */

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


/*
 * Safely remove localStorage item.
 */

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


/* =========================================================
   LOCAL STORAGE VALUE
========================================================= */

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


/*
 * Try to extract farmer identity from an object.
 */

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

  };

}


/*
 * Get the currently stored farmer.
 */

export function getStoredFarmer() {

  const empty = {

    farmerId:
      "",

    phone:
      "",

  };


  if (
    typeof window ===
    "undefined"
  ) {

    return empty;

  }


  /*
   * Current prototype state has priority.
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
   * Search known object-based storage keys.
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
   * Search primitive storage keys.
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

  };

}


/*
 * Check whether a farmer appears authenticated.
 */

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


  /*
   * Remove query string.
   */

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


  /*
   * Remove hash.
   */

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


  /*
   * Normalize trailing slash.
   */

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


/*
 * Check whether current route belongs to farmer portal.
 */

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


/*
 * Get human-readable route name.
 */

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

/*
 * Check whether action exists in an action registry.
 */

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

/*
 * Keep only valid conversational messages.
 */

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
      message => ({

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

      })
    );

}


/*
 * Limit conversation size.
 */

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


/*
 * Convert history into the structure expected by the
 * backend AI.
 */

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
      message => ({

        role:
          message.role,

        content:
          cleanText(
            message.content
          ),

      })
    );

}


/*
 * Get latest message by role.
 */

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
      message => ({

        role:
          message.role,

        content:
          cleanText(
            message.content
          ),

        action:
          message.action ||
          "NONE",

      })
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
   TEXT RELATION HELPERS
========================================================= */

/*
 * Check whether a phrase contains another phrase
 * without performing aggressive fuzzy matching.
 */

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


/*
 * Check whether any phrase exists in text.
 */

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

/*
 * Safely parse arbitrary backend JSON text.
 */

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

/*
 * Extract a useful error message from an API response.
 */

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


/*
 * This does not attempt to determine an exact device.
 * It only provides a UI hint.
 */

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


/*
 * Pick only explicitly supplied properties.
 */

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
   DATE / TIME
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
   * Booking parameters currently supported.
   *
   * Keep this allow-list tight.
   */

  if (
    typeof params.crop ===
      "string" &&
    params.crop.trim()
  ) {

    output.crop =
      cleanText(
        params.crop
      );

  }


  if (
    Number.isFinite(
      Number(
        params.quantity
      )
    )
  ) {

    const quantity =
      Number(
        params.quantity
      );


    if (
      quantity > 0 &&
      quantity <=
        50000
    ) {

      output.quantity =
        quantity;

    }

  }


  return Object.keys(
    output
  ).length
    ? output
    : null;

}


/* =========================================================
   STORAGE VERSIONING
========================================================= */

/*
 * Storage helpers for future migration.
 */

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

  versionedStorageRead,

  debugLog,

};