/* =========================================================
   KRISHISETU AI ASSISTANT ROUTER
========================================================= */

import {
  ACTIONS,
  getAction,
  getActionRoute,
} from "./assistantActions";

import {
  detectIntent,
  getActionReply,
  getCurrentPageReply,
  getPageContext,
  isConfirmation,
  isCurrentPageQuestion,
  isNegative,
} from "./intentEngine";

import {
  cleanText,
  normalizeText,
  getStoredFarmer,
  getLastUserMessage,
  sanitizeActionParams,
} from "./assistantUtils";


/* =========================================================
   ROUTER TYPES
========================================================= */

export const ROUTER_TYPES = {

  NONE:
    "NONE",

  NAVIGATE:
    "NAVIGATE",

  GO_BACK:
    "GO_BACK",

  CURRENT_PAGE:
    "CURRENT_PAGE",

  CONFIRM:
    "CONFIRM",

  CANCEL:
    "CANCEL",

  BOOKING:
    "BOOKING",

  ASK_AI:
    "ASK_AI",

  ERROR:
    "ERROR",

};


/* =========================================================
   CONSTANTS
========================================================= */

const PENDING_ACTION_TTL =
  5 * 60 * 1000;

export const DEFAULT_PENDING_ACTION_KEY =
  "krishisetu_ai_pending_action";


/* =========================================================
   SMALL HELPERS
========================================================= */

function normalizeAction(
  action
) {

  if (
    !action ||
    typeof action !==
      "string"
  ) {

    return "NONE";

  }

  const normalized =
    action
      .trim()
      .toUpperCase();

  return isValidAction(
    normalized
  )
    ? normalized
    : "NONE";

}


function safeConfidence(
  value,
  fallback = 0.9
) {

  const number =
    Number(value);

  if (
    Number.isFinite(number) &&
    number >= 0 &&
    number <= 1
  ) {

    return number;

  }

  return fallback;

}


function isBookingAction(
  action
) {

  const normalized =
    normalizeAction(
      action
    );

  return (
    normalized ===
      "OPEN_BOOKING" ||
    normalized ===
      "BOOK" ||
    normalized ===
      "CONFIRM_BOOKING" ||
    normalized ===
      "CANCEL_BOOKING"
  );

}


function hasBookingParameters(
  object
) {

  if (
    !object ||
    typeof object !==
      "object"
  ) {

    return false;

  }

  return Boolean(

    object.crop ||
    object.quantity ||
    object.date ||
    object.time ||
    object.startTime ||
    object.endTime ||
    object.center ||
    object.slot ||
    object.selectedSlot ||
    object.selectedCenter

  );

}


/* =========================================================
   PENDING ACTION STORAGE
========================================================= */

export function loadPendingAction(
  storageKey =
    DEFAULT_PENDING_ACTION_KEY
) {

  if (
    typeof window ===
    "undefined"
  ) {

    return null;

  }

  try {

    const raw =
      localStorage.getItem(
        storageKey
      );

    if (
      !raw
    ) {

      return null;

    }

    const parsed =
      JSON.parse(
        raw
      );

    if (
      !parsed ||
      typeof parsed !==
        "object"
    ) {

      return null;

    }

    const createdAt =
      Number(
        parsed.createdAt ||
        0
      );

    if (
      createdAt &&
      Date.now() -
        createdAt >
        PENDING_ACTION_TTL
    ) {

      localStorage.removeItem(
        storageKey
      );

      return null;

    }

    const action =
      normalizeAction(
        parsed.action
      );

    if (
      action ===
      "NONE"
    ) {

      localStorage.removeItem(
        storageKey
      );

      return null;

    }

    return {

      action,

      booking:
        sanitizeActionParams(
          parsed.booking
        ),

      params:
        sanitizeActionParams(
          parsed.params
        ),

      createdAt:
        createdAt ||
        Date.now(),

    };

  } catch {

    return null;

  }

}


export function savePendingAction(
  pendingAction,
  storageKey =
    DEFAULT_PENDING_ACTION_KEY
) {

  if (
    typeof window ===
    "undefined"
  ) {

    return false;

  }

  try {

    if (
      !pendingAction ||
      !pendingAction.action
    ) {

      localStorage.removeItem(
        storageKey
      );

      return true;

    }

    const action =
      normalizeAction(
        pendingAction.action
      );

    if (
      action ===
      "NONE"
    ) {

      return false;

    }

    const booking =
      sanitizeActionParams(
        pendingAction.booking
      );

    const params =
      sanitizeActionParams(
        pendingAction.params
      );

    const payload = {

      action,

      booking,

      params,

      createdAt:
        Number(
          pendingAction.createdAt
        ) ||
        Date.now(),

    };

    localStorage.setItem(
      storageKey,
      JSON.stringify(
        payload
      )
    );

    return true;

  } catch {

    return false;

  }

}


export function clearPendingAction(
  storageKey =
    DEFAULT_PENDING_ACTION_KEY
) {

  if (
    typeof window ===
    "undefined"
  ) {

    return false;

  }

  try {

    localStorage.removeItem(
      storageKey
    );

    return true;

  } catch {

    return false;

  }

}


/* =========================================================
   ACTION VALIDATION
========================================================= */

export function isValidAction(
  action
) {

  if (
    !action ||
    typeof action !==
      "string"
  ) {

    return false;

  }

  return Boolean(
    ACTIONS[
      action
    ]
  );

}


export function isNavigationalAction(
  action
) {

  if (
    action ===
    "GO_BACK"
  ) {

    return true;

  }

  const definition =
    getAction(
      action
    );

  return Boolean(
    definition?.route
  );

}


/* =========================================================
   CURRENT PAGE
========================================================= */

function buildCurrentPageDecision(
  pathname,
  language,
  originalText
) {

  return {

    type:
      ROUTER_TYPES.CURRENT_PAGE,

    action:
      "SHOW_CURRENT_PAGE",

    confidence:
      0.99,

    reply:
      getCurrentPageReply(
        pathname,
        language
      ),

    userText:
      originalText,

    currentPage:
      getPageContext(
        pathname
      ),

    shouldCallAI:
      false,

    shouldNavigate:
      false,

  };

}


/* =========================================================
   CANCEL REPLY
========================================================= */

function getCancelledReply(
  language
) {

  if (
    language ===
    "hi"
  ) {

    return "ठीक है, मैंने यह कार्रवाई रद्द कर दी।";

  }

  if (
    language ===
    "te"
  ) {

    return "సరే, ఈ చర్యను రద్దు చేశాను.";

  }

  return "Okay, I cancelled that action.";

}


/* =========================================================
   CONFIRMATION REPLY
========================================================= */

function getGenericConfirmationText(
  language
) {

  if (
    language ===
    "hi"
  ) {

    return "मैं यह कार्रवाई कर सकता हूँ। आगे बढ़ने के लिए हाँ कहें।";

  }

  if (
    language ===
    "te"
  ) {

    return "నేను ఈ చర్య చేయగలను. కొనసాగించడానికి అవును అని చెప్పండి.";

  }

  return "I can do that. Say yes to continue.";

}


function getBookingConfirmationText(
  booking,
  language
) {

  const crop =
    booking?.crop ||
    null;

  const quantity =
    booking?.quantity ||
    null;

  const date =
    booking?.date ||
    null;

  const time =
    booking?.time ||
    booking?.slot ||
    null;

  const cropNames = {

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
    language === "hi" ||
    language === "te"
      ? cropNames[
          language
        ]?.[
          String(
            crop
          ).toLowerCase()
        ] ||
        crop
      : crop;

  const details = [];

  if (
    quantity
  ) {

    details.push(
      `${quantity} kg`
    );

  }

  if (
    displayCrop
  ) {

    details.push(
      displayCrop
    );

  }

  if (
    date
  ) {

    details.push(
      date
    );

  }

  if (
    time
  ) {

    details.push(
      time
    );

  }

  if (
    language ===
    "hi"
  ) {

    if (
      details.length
    ) {

      return (
        `मैं ${details.join(
          " "
        )} की बुकिंग कर सकता हूँ। ` +
        `आगे बढ़ने के लिए "हाँ" या "करो" कहें।`
      );

    }

    return getGenericConfirmationText(
      language
    );

  }

  if (
    language ===
    "te"
  ) {

    if (
      details.length
    ) {

      return (
        `${details.join(
          " "
        )} బుకింగ్‌ను చేయగలను. ` +
        `కొనసాగించడానికి "అవును" లేదా "చేయండి" అని చెప్పండి.`
      );

    }

    return getGenericConfirmationText(
      language
    );

  }

  if (
    details.length
  ) {

    return (
      `I can book ${details.join(
        " "
      )}. ` +
      `Say "yes" or "do it" to continue.`
    );

  }

  return getGenericConfirmationText(
    language
  );

}


export function getConfirmationReply(
  intent,
  language
) {

  const action =
    normalizeAction(
      intent?.action
    );

  if (
    isBookingAction(
      action
    ) &&
    intent?.booking
  ) {

    return getBookingConfirmationText(
      intent.booking,
      language
    );

  }

  return (
    getActionReply(
      action,
      language
    ) ||
    getGenericConfirmationText(
      language
    )
  );

}


/* =========================================================
   PENDING ACTION DECISIONS
========================================================= */

function buildConfirmationDecision(
  pending,
  originalText,
  language
) {

  const action =
    normalizeAction(
      pending?.action
    );

  if (
    action ===
    "NONE"
  ) {

    return null;

  }

  const params =
    sanitizeActionParams(

      pending?.booking ||
      pending?.params ||
      null

    );

  /*
   * IMPORTANT:
   *
   * OPEN_BOOKING is not treated as ordinary navigation.
   *
   * A confirmation means:
   *
   * "continue the booking flow with these details"
   *
   * rather than:
   *
   * "open booking page and stop".
   */

  if (
    action ===
    "OPEN_BOOKING"
  ) {

    return {

      type:
        ROUTER_TYPES.CONFIRM,

      action:
        "OPEN_BOOKING",

      confidence:
        0.99,

      reply:
        null,

      userText:
        originalText,

      params,

      pendingAction:
        pending,

      shouldCallAI:
        false,

      shouldNavigate:
        false,

      clearPending:
        true,

      continueBooking:
        true,

      executeBooking:
        true,

    };

  }

  const definition =
    getAction(
      action
    );

  return {

    type:
      ROUTER_TYPES.CONFIRM,

    action,

    confidence:
      0.99,

    reply:
      getActionReply(
        action,
        language
      ),

    userText:
      originalText,

    params,

    pendingAction:
      pending,

    shouldCallAI:
      false,

    shouldNavigate:
      Boolean(
        definition?.route
      ),

    clearPending:
      true,

  };

}


function buildCancellationDecision(
  pending,
  originalText,
  language
) {

  return {

    type:
      ROUTER_TYPES.CANCEL,

    action:
      "NONE",

    confidence:
      0.99,

    reply:
      getCancelledReply(
        language
      ),

    userText:
      originalText,

    pendingAction:
      pending,

    shouldCallAI:
      false,

    shouldNavigate:
      false,

    clearPending:
      true,

    cancelBooking:
      Boolean(
        pending &&
        isBookingAction(
          pending.action
        )
      ),

  };

}


/* =========================================================
   LOCAL INTENT
========================================================= */

function buildLocalIntentDecision(
  intent,
  originalText,
  language
) {

  if (
    !intent ||
    !intent.action
  ) {

    return null;

  }

  const action =
    normalizeAction(
      intent.action
    );

  if (
    action ===
    "NONE"
  ) {

    return null;

  }

  if (
    action ===
    "SHOW_CURRENT_PAGE"
  ) {

    return null;

  }

  if (
    action ===
    "GO_BACK"
  ) {

    return {

      type:
        ROUTER_TYPES.GO_BACK,

      action:
        "GO_BACK",

      confidence:
        safeConfidence(
          intent.confidence,
          0.99
        ),

      reply:
        getActionReply(
          "GO_BACK",
          language
        ),

      userText:
        originalText,

      shouldCallAI:
        false,

      shouldNavigate:
        true,

    };

  }

  const definition =
    getAction(
      action
    );

  if (
    !definition
  ) {

    return null;

  }

  const params =
    sanitizeActionParams(
      intent.booking ||
      intent.params ||
      null
    );

  /*
   * BOOKING COMMANDS
   *
   * Booking is now a special conversation route.
   *
   * This prevents:
   *
   * "book 234 kg paddy tomorrow 8 to 830"
   *
   * from becoming a simple:
   *
   * NAVIGATE -> BOOKING PAGE
   */

  if (
    isBookingAction(
      action
    )
  ) {

    return {

      type:
        ROUTER_TYPES.BOOKING,

      action,

      confidence:
        safeConfidence(
          intent.confidence,
          0.95
        ),

      reply:
        null,

      userText:
        originalText,

      params,

      booking:
        params,

      intent,

      shouldCallAI:
        false,

      shouldNavigate:
        false,

      continueBooking:
        true,

      hasBookingParameters:
        hasBookingParameters(
          params
        ),

    };

  }

  return {

    type:
      ROUTER_TYPES.NAVIGATE,

    action,

    confidence:
      safeConfidence(
        intent.confidence
      ),

    reply:
      getActionReply(
        action,
        language
      ),

    userText:
      originalText,

    params,

    intent,

    shouldCallAI:
      false,

    shouldNavigate:
      true,

  };

}


/* =========================================================
   ACTION CONFIRMATION RULES
========================================================= */

export function actionRequiresConfirmation(
  action
) {

  const definition =
    getAction(
      normalizeAction(
        action
      )
    );

  return Boolean(
    definition
      ?.requiresConfirmation
  );

}


export function shouldAskForConfirmation(
  intent
) {

  if (
    !intent ||
    !intent.action
  ) {

    return false;

  }

  const action =
    normalizeAction(
      intent.action
    );

  if (
    action ===
    "NONE"
  ) {

    return false;

  }

  /*
   * Booking parameters start/continue the booking
   * conversation. The booking engine decides whether
   * confirmation is needed after all required details
   * are available.
   *
   * This is deliberately NOT forced here.
   */

  if (
    isBookingAction(
      action
    )
  ) {

    return false;

  }

  return actionRequiresConfirmation(
    action
  );

}


/* =========================================================
   CREATE PENDING ACTION
========================================================= */

export function createPendingAction(
  action,
  params = null
) {

  const normalizedAction =
    normalizeAction(
      action
    );

  if (
    normalizedAction ===
    "NONE"
  ) {

    return null;

  }

  const safeParams =
    sanitizeActionParams(
      params
    );

  return {

    action:
      normalizedAction,

    params:
      safeParams,

    booking:
      normalizedAction ===
        "OPEN_BOOKING" ||
      isBookingAction(
        normalizedAction
      )
        ? safeParams
        : null,

    createdAt:
      Date.now(),

  };

}


/* =========================================================
   MAIN ROUTER
========================================================= */

export function routeAssistantCommand(
  message,
  options = {}
) {

  const {

    currentPath =
      "",

    language =
      "en",

    pendingAction =
      null,

    bookingState =
      null,

    bookingDraft =
      null,

  } =
    options;


  const originalText =
    cleanText(
      message
    );

  const normalized =
    normalizeText(
      originalText
    );


  /* =======================================================
     EMPTY
  ======================================================= */

  if (
    !normalized
  ) {

    return {

      type:
        ROUTER_TYPES.NONE,

      action:
        "NONE",

      confidence:
        0,

      userText:
        originalText,

      normalized,

      shouldCallAI:
        false,

      shouldNavigate:
        false,

    };

  }


  /* =======================================================
     1. CURRENT PAGE
  ======================================================= */

  if (
    isCurrentPageQuestion(
      originalText
    )
  ) {

    return buildCurrentPageDecision(
      currentPath,
      language,
      originalText
    );

  }


  /* =======================================================
     2. ACTIVE BOOKING CONVERSATION
  ======================================================= */

  /*
   * This is intentionally checked BEFORE ordinary
   * confirmation handling.
   *
   * Examples:
   *
   *   "tomorrow"
   *   "8 to 830"
   *   "morning"
   *   "yes"
   *   "select 300 kg wheat"
   *
   * When a booking draft already exists, these are
   * continuation messages, not fresh navigation commands.
   */

  if (
    bookingState ||
    bookingDraft
  ) {

    const activeBooking =
      bookingDraft ||
      bookingState?.draft ||
      bookingState?.booking ||
      null;

    if (
      activeBooking
    ) {

      const bookingIntent =
        detectIntent(
          originalText,
          currentPath
        );

      const detectedAction =
        normalizeAction(
          bookingIntent?.action
        );

      /*
       * Explicit cancellation must win.
       */

      if (
        isNegative(
          originalText
        )
      ) {

        return {

          type:
            ROUTER_TYPES.CANCEL,

          action:
            "NONE",

          confidence:
            0.99,

          reply:
            getCancelledReply(
              language
            ),

          userText:
            originalText,

          params:
            sanitizeActionParams(
              activeBooking
            ),

          booking:
            sanitizeActionParams(
              activeBooking
            ),

          bookingState,

          bookingDraft:
            activeBooking,

          shouldCallAI:
            false,

          shouldNavigate:
            false,

          clearPending:
            true,

          cancelBooking:
            true,

          continueBooking:
            false,

        };

      }

      /*
       * A plain confirmation while booking is active
       * means "continue with the current booking".
       *
       * It must NOT open the booking page again.
       */

      if (
        isConfirmation(
          originalText
        )
      ) {

        return {

          type:
            ROUTER_TYPES.BOOKING,

          action:
            "CONFIRM_BOOKING",

          confidence:
            0.99,

          reply:
            null,

          userText:
            originalText,

          params:
            sanitizeActionParams(
              activeBooking
            ),

          booking:
            sanitizeActionParams(
              activeBooking
            ),

          bookingState,

          bookingDraft:
            activeBooking,

          intent:
            bookingIntent,

          shouldCallAI:
            false,

          shouldNavigate:
            false,

          continueBooking:
            true,

          executeBooking:
            true,

        };

      }

      /*
       * Any booking-related intent remains inside the
       * booking conversation.
       */

      if (
        isBookingAction(
          detectedAction
        ) ||
        bookingIntent?.booking ||
        hasBookingParameters(
          bookingIntent
        )
      ) {

        return {

          type:
            ROUTER_TYPES.BOOKING,

          action:
            detectedAction ||
            "OPEN_BOOKING",

          confidence:
            safeConfidence(
              bookingIntent?.confidence,
              0.95
            ),

          reply:
            null,

          userText:
            originalText,

          params:
            sanitizeActionParams(
              bookingIntent?.booking ||
              bookingIntent?.params ||
              activeBooking
            ),

          booking:
            sanitizeActionParams(
              bookingIntent?.booking ||
              activeBooking
            ),

          bookingState,

          bookingDraft:
            activeBooking,

          intent:
            bookingIntent,

          shouldCallAI:
            false,

          shouldNavigate:
            false,

          continueBooking:
            true,

        };

      }

      /*
       * Short date/time confirmations frequently have
       * no recognized "action". Preserve them for the
       * booking engine instead of sending them to AI.
       */

        const bookingWords =
  /\b(today|tomorrow|tommorow|tomorow|morning|afternoon|evening|night|am|pm|kg|kilogram|kilograms)\b/i.test(
    originalText
  ) ||
  /\b\d{1,2}[:.]?\d{0,2}\s*(?:am|pm)?\b/i.test(
    originalText
  ) ||
  /\b\d{1,2}\s*(?:to|-)\s*\d{1,2}\b/i.test(
    originalText
  );
      if (
        bookingWords
      ) {

        return {

          type:
            ROUTER_TYPES.BOOKING,

          action:
            "OPEN_BOOKING",

          confidence:
            0.95,

          reply:
            null,

          userText:
            originalText,

          params:
            sanitizeActionParams(
              activeBooking
            ),

          booking:
            sanitizeActionParams(
              activeBooking
            ),

          bookingState,

          bookingDraft:
            activeBooking,

          intent:
            bookingIntent,

          shouldCallAI:
            false,

          shouldNavigate:
            false,

          continueBooking:
            true,

        };

      }

    }

  }


  /* =======================================================
     3. PENDING ACTION
  ======================================================= */

  if (
    pendingAction
  ) {

    if (
      isNegative(
        originalText
      )
    ) {

      return buildCancellationDecision(
        pendingAction,
        originalText,
        language
      );

    }

    if (
      isConfirmation(
        originalText
      )
    ) {

      return buildConfirmationDecision(
        pendingAction,
        originalText,
        language
      );

    }

  }


  /* =======================================================
     4. LOCAL INTENT
  ======================================================= */

  const intent =
    detectIntent(
      originalText,
      currentPath
    );

  const localDecision =
    buildLocalIntentDecision(
      intent,
      originalText,
      language
    );

  if (
    localDecision
  ) {

    /*
     * IMPORTANT:
     *
     * Booking no longer gets converted into a generic
     * confirmation/navigation loop here.
     */

    if (
      localDecision.type ===
      ROUTER_TYPES.BOOKING
    ) {

      return localDecision;

    }


    /*
     * Ordinary destructive/action commands may still
     * require confirmation.
     */

    if (
      shouldAskForConfirmation(
        intent
      )
    ) {

      return {

        type:
          ROUTER_TYPES.CONFIRM,

        action:
          normalizeAction(
            intent.action
          ),

        confidence:
          safeConfidence(
            intent.confidence,
            0.98
          ),

        reply:
          getConfirmationReply(
            intent,
            language
          ),

        userText:
          originalText,

        params:
          sanitizeActionParams(
            intent.booking ||
            intent.params ||
            null
          ),

        intent,

        shouldCallAI:
          false,

        shouldNavigate:
          false,

        createPending:
          true,

        pendingAction:
          createPendingAction(
            intent.action,
            intent.booking ||
            intent.params ||
            null
          ),

      };

    }

    return localDecision;

  }


  /* =======================================================
     5. BACKEND AI
  ======================================================= */

  return {

    type:
      ROUTER_TYPES.ASK_AI,

    action:
      "NONE",

    confidence:
      0,

    reply:
      null,

    userText:
      originalText,

    normalized,

    intent,

    shouldCallAI:
      true,

    shouldNavigate:
      false,

  };

}


/* =========================================================
   ROUTER WITH STORED PENDING ACTION
========================================================= */

export function routeWithStoredPendingAction(
  message,
  options = {}
) {

  const {

    pendingStorageKey =
      DEFAULT_PENDING_ACTION_KEY,

  } =
    options;

  const pending =
    loadPendingAction(
      pendingStorageKey
    );

  return {

    pendingAction:
      pending,

    decision:
      routeAssistantCommand(
        message,
        {
          ...options,
          pendingAction:
            pending,
        }
      ),

  };

}


/* =========================================================
   BACKEND ACTION MERGING
========================================================= */

export function mergeBackendDecision(
  localDecision,
  backendData = {},
  options = {}
) {

  const {

    language =
      "en",

    originalText =
      localDecision?.userText ||
      "",

  } =
    options;


  if (
    !localDecision
  ) {

    return {

      type:
        ROUTER_TYPES.ASK_AI,

      action:
        "NONE",

      shouldCallAI:
        true,

    };

  }


  /*
   * NEVER overwrite an already-resolved local route.
   */

  if (
    localDecision.type !==
    ROUTER_TYPES.ASK_AI
  ) {

    return localDecision;

  }


  const backendAction =
    normalizeAction(
      backendData?.action
    );

  if (
    backendAction ===
    "NONE"
  ) {

    return localDecision;

  }


  /*
   * Backend must explicitly request navigation.
   */

  if (
    !backendData?.explicitNavigation
  ) {

    return localDecision;

  }


  /*
   * Questions about current page must never be
   * converted into navigation.
   */

  if (
    isCurrentPageQuestion(
      originalText
    )
  ) {

    return localDecision;

  }


  if (
    !isValidAction(
      backendAction
    )
  ) {

    return localDecision;

  }


  /*
   * Backend booking action must stay inside the
   * booking conversation.
   */

  if (
    isBookingAction(
      backendAction
    )
  ) {

    const params =
      sanitizeActionParams(
        backendData?.booking ||
        backendData?.params ||
        null
      );

    return {

      type:
        ROUTER_TYPES.BOOKING,

      action:
        backendAction,

      confidence:
        safeConfidence(
          backendData?.confidence,
          0.9
        ),

      reply:
        null,

      userText:
        originalText,

      params,

      booking:
        params,

      backendData,

      shouldCallAI:
        false,

      shouldNavigate:
        false,

      continueBooking:
        true,

    };

  }


  return {

    type:
      ROUTER_TYPES.NAVIGATE,

    action:
      backendAction,

    confidence:
      safeConfidence(
        backendData?.confidence
      ),

    reply:
      getActionReply(
        backendAction,
        language
      ) ||
      cleanText(
        backendData?.reply
      ) ||
      null,

    userText:
      originalText,

    params:
      sanitizeActionParams(
        backendData?.params ||
        null
      ),

    backendData,

    shouldCallAI:
      false,

    shouldNavigate:
      true,

  };

}


/* =========================================================
   EXECUTION PLAN
========================================================= */

export function getExecutionPlan(
  decision
) {

  if (
    !decision
  ) {

    return {

      type:
        ROUTER_TYPES.NONE,

      action:
        "NONE",

      execute:
        false,

    };

  }


  if (
    decision.type ===
    ROUTER_TYPES.GO_BACK
  ) {

    return {

      type:
        ROUTER_TYPES.GO_BACK,

      action:
        "GO_BACK",

      execute:
        true,

      route:
        null,

      params:
        null,

    };

  }


  if (
    decision.type ===
    ROUTER_TYPES.CURRENT_PAGE
  ) {

    return {

      type:
        ROUTER_TYPES.CURRENT_PAGE,

      action:
        "SHOW_CURRENT_PAGE",

      execute:
        false,

      route:
        null,

      params:
        null,

    };

  }


  /*
   * BOOKING IS NOT ORDINARY NAVIGATION.
   */

  if (
    decision.type ===
    ROUTER_TYPES.BOOKING
  ) {

    return {

      type:
        ROUTER_TYPES.BOOKING,

      action:
        normalizeAction(
          decision.action
        ),

      execute:
        true,

      route:
        null,

      params:
        sanitizeActionParams(
          decision.params ||
          decision.booking ||
          decision.bookingDraft ||
          null
        ),

      continueBooking:
        true,

      executeBooking:
        Boolean(
          decision.executeBooking
        ),

      cancelBooking:
        Boolean(
          decision.cancelBooking
        ),

    };

  }


  if (
    decision.type ===
    ROUTER_TYPES.CONFIRM
  ) {

    /*
     * OPEN_BOOKING confirmation continues booking,
     * rather than navigating directly.
     */

    if (
      isBookingAction(
        decision.action
      )
    ) {

      return {

        type:
          ROUTER_TYPES.BOOKING,

        action:
          "CONFIRM_BOOKING",

        execute:
          true,

        route:
          null,

        params:
          sanitizeActionParams(
            decision.params ||
            decision.pendingAction
              ?.booking ||
            decision.pendingAction
              ?.params ||
            null
          ),

        continueBooking:
          true,

        executeBooking:
          true,

      };

    }

    const action =
      normalizeAction(
        decision.action
      );

    return {

      type:
        ROUTER_TYPES.CONFIRM,

      action,

      execute:
        true,

      route:
        getActionRoute(
          action
        ),

      params:
        sanitizeActionParams(
          decision.params ||
          decision.pendingAction
            ?.params ||
          null
        ),

    };

  }


  if (
    decision.type ===
    ROUTER_TYPES.CANCEL
  ) {

    return {

      type:
        ROUTER_TYPES.CANCEL,

      action:
        "NONE",

      execute:
        Boolean(
          decision.cancelBooking
        ),

      route:
        null,

      params:
        sanitizeActionParams(
          decision.params ||
          decision.booking ||
          null
        ),

      cancelBooking:
        Boolean(
          decision.cancelBooking
        ),

    };

  }


  if (
    decision.type ===
    ROUTER_TYPES.NAVIGATE
  ) {

    const action =
      normalizeAction(
        decision.action
      );

    return {

      type:
        ROUTER_TYPES.NAVIGATE,

      action,

      execute:
        true,

      route:
        getActionRoute(
          action
        ),

      params:
        sanitizeActionParams(
          decision.params ||
          null
        ),

    };

  }


  return {

    type:
      ROUTER_TYPES.NONE,

    action:
      "NONE",

    execute:
      false,

    route:
      null,

    params:
      null,

  };

}


/* =========================================================
   DEBUG
========================================================= */

export function explainDecision(
  decision
) {

  if (
    !decision
  ) {

    return {

      type:
        ROUTER_TYPES.NONE,

      action:
        "NONE",

      reason:
        "No decision was produced.",

    };

  }

  const action =
    normalizeAction(
      decision.action
    );

  const definition =
    getAction(
      action
    );

  return {

    type:
      decision.type,

    action,

    actionLabel:
      definition?.label ||
      action,

    actionCategory:
      definition?.category ||
      null,

    confidence:
      decision.confidence ||
      0,

    shouldCallAI:
      Boolean(
        decision.shouldCallAI
      ),

    shouldNavigate:
      Boolean(
        decision.shouldNavigate
      ),

    continueBooking:
      Boolean(
        decision.continueBooking
      ),

    executeBooking:
      Boolean(
        decision.executeBooking
      ),

    hasParameters:
      Boolean(
        decision.params ||
        decision.booking ||
        decision.bookingDraft
      ),

    currentPage:
      decision.currentPage ||
      null,

  };

}


/* =========================================================
   SMART HELPERS
========================================================= */

export function isLikelyConfirmation(
  message
) {

  return isConfirmation(
    message
  );

}


export function isLikelyCancellation(
  message
) {

  return isNegative(
    message
  );

}


export function isLikelyCurrentPageQuestion(
  message
) {

  return isCurrentPageQuestion(
    message
  );

}


/* =========================================================
   FARMER REQUEST CONTEXT
========================================================= */

export function buildAssistantRequestContext(
  message,
  options = {}
) {

  const {

    currentPath =
      "",

    language =
      "en",

    history =
      [],

    bookingState =
      null,

    bookingDraft =
      null,

  } =
    options;


  const farmer =
    getStoredFarmer();


  const routed =
    routeWithStoredPendingAction(
      message,
      {
        currentPath,
        language,
        bookingState,
        bookingDraft,
      }
    );


  return {

    text:
      cleanText(
        message
      ),

    normalized:
      normalizeText(
        message
      ),

    language,

    currentPath,

    currentPage:
      getPageContext(
        currentPath
      ),

    farmerId:
      farmer?.farmerId ||
      farmer?.id ||
      null,

    phone:
      farmer?.phone ||
      null,

    decision:
      routed.decision,

    pendingAction:
      routed.pendingAction,

    bookingState,

    bookingDraft,

    lastUserMessage:
      getLastUserMessage(
        history
      ),

    timestamp:
      Date.now(),

  };

}


/* =========================================================
   SAFE NAVIGATION
========================================================= */

export function canExecuteNavigation(
  decision
) {

  if (
    !decision
  ) {

    return false;

  }

  /*
   * Booking must never be handled by ordinary route
   * execution.
   */

  if (
    decision.type ===
      ROUTER_TYPES.BOOKING ||
    isBookingAction(
      decision.action
    )
  ) {

    return false;

  }

  if (
    !decision.shouldNavigate
  ) {

    return false;

  }

  if (
    decision.action ===
    "GO_BACK"
  ) {

    return true;

  }

  return Boolean(
    getActionRoute(
      decision.action
    )
  );

}


/* =========================================================
   FINAL ROUTER EXPORT
========================================================= */

export const assistantRouter = {

  routeAssistantCommand,

  routeWithStoredPendingAction,

  mergeBackendDecision,

  getExecutionPlan,

  explainDecision,

  buildAssistantRequestContext,

  canExecuteNavigation,

  isValidAction,

  isNavigationalAction,

  actionRequiresConfirmation,

  shouldAskForConfirmation,

  createPendingAction,

  getConfirmationReply,

  loadPendingAction,

  savePendingAction,

  clearPendingAction,

  isLikelyConfirmation,

  isLikelyCancellation,

  isLikelyCurrentPageQuestion,

};


/* =========================================================
   DEVELOPMENT CHECK
========================================================= */

if (
  typeof import.meta !==
    "undefined" &&
  import.meta.env?.DEV
) {

  const testCommands = [

    "open help",

    "opee heeelp",

    "open home",

    "take me back",

    "where are we now",

    "book 300 kg wheat",

    "book 234 kg paddy tomorrow 8 to 830",

    "tomorrow",

    "8 to 830",

    "yes",

    "what are the crops available?",

    "centers?",

    "show my latest token",

    "what's my booking",

    "what is my payment status?",

  ];


  for (
    const command of
    testCommands
  ) {

    try {

      const result =
        routeAssistantCommand(
          command,
          {
            currentPath:
              "/farmer/home",

            language:
              "en",

            pendingAction:
              null,

            bookingState:
              null,

            bookingDraft:
              null,

          }
        );


      console.debug(
        "[KrishiSetu AI router]",
        command,
        result.type,
        result.action,
        result
      );

    } catch (
      error
    ) {

      console.warn(
        "[KrishiSetu AI router] Test failed:",
        command,
        error
      );

    }

  }

}