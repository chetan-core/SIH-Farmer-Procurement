/* =========================================================
   KRISHISETU AI ASSISTANT ROUTER
=========================================================

   PURPOSE

   This file is responsible for deciding WHAT the assistant
   should do with a user message.

   It does NOT render UI.
   It does NOT speak.
   It does NOT navigate directly.

   It produces a clean routing decision for the UI/context
   layer to execute.

   FLOW

   User message
        ↓
   assistantRouter
        ↓
   ┌──────────────────────────────────────────────┐
   │ 1. Current-page question                     │
   │ 2. Pending action confirmation/cancellation  │
   │ 3. Local intent                              │
   │ 4. Safe navigation                           │
   │ 5. Backend AI                                │
   └──────────────────────────────────────────────┘

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
   CONSTANTS
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

  ASK_AI:
    "ASK_AI",

  ERROR:
    "ERROR",

};


const PENDING_ACTION_TTL =
  5 * 60 * 1000;


/* =========================================================
   PENDING ACTION STORAGE
========================================================= */

export const DEFAULT_PENDING_ACTION_KEY =
  "krishisetu_ai_pending_action";


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


    if (
      !parsed.action ||
      !ACTIONS[
        parsed.action
      ]
    ) {

      localStorage.removeItem(
        storageKey
      );


      return null;

    }


    return {

      action:
        parsed.action,

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
      pendingAction.action;


    if (
      !ACTIONS[
        action
      ]
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

  return Boolean(
    action &&
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
    definition.route
  );

}


/* =========================================================
   ACTION NORMALIZATION
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


/* =========================================================
   CURRENT PAGE
========================================================= */

function buildCurrentPageDecision(
  pathname,
  language,
  originalText
) {

  const reply =
    getCurrentPageReply(
      pathname,
      language
    );


  return {

    type:
      ROUTER_TYPES.CURRENT_PAGE,

    action:
      "SHOW_CURRENT_PAGE",

    confidence:
      0.99,

    reply,

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
   PENDING ACTION
========================================================= */

function buildConfirmationDecision(
  pending,
  originalText,
  language
) {

  const action =
    normalizeAction(
      pending.action
    );


  if (
    action ===
    "NONE"
  ) {

    return null;

  }


  let params =
    null;


  if (
    pending.booking
  ) {

    params =
      sanitizeActionParams(
        pending.booking
      );

  }


  if (
    !params &&
    pending.params
  ) {

    params =
      sanitizeActionParams(
        pending.params
      );

  }


  const reply =
    getActionReply(
      action,
      language
    );


  return {

    type:
      ROUTER_TYPES.CONFIRM,

    action,

    confidence:
      0.99,

    reply,

    userText:
      originalText,

    params,

    pendingAction:
      pending,

    shouldCallAI:
      false,

    shouldNavigate:
      true,

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

  };

}


/* =========================================================
   CANCEL TEXT
========================================================= */

function getCancelledReply(
  language
) {

  if (
    language ===
    "hi"
  ) {

    return "ठीक है, मैंने वह कार्रवाई रद्द कर दी।";

  }


  if (
    language ===
    "te"
  ) {

    return "సరే, ఆ చర్యను రద్దు చేశాను.";

  }


  return "Okay, I cancelled that action.";

}


/* =========================================================
   LOCAL INTENT DECISION
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
        Number(
          intent.confidence
        ) ||
        0.99,

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


  let params =
    null;


  if (
    intent.booking
  ) {

    params =
      sanitizeActionParams(
        intent.booking
      );

  }


  /*
   * Booking commands with extracted parameters are
   * intentionally returned as a navigational intent.
   *
   * Whether navigation requires confirmation is decided
   * by the action definition and booking flow.
   */

  return {

    type:
      ROUTER_TYPES.NAVIGATE,

    action,

    confidence:
      Number(
        intent.confidence
      ) ||
      0.9,

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
   ACTION REQUIRES CONFIRMATION
========================================================= */

export function actionRequiresConfirmation(
  action
) {

  const definition =
    getAction(
      action
    );


  return Boolean(
    definition
      ?.requiresConfirmation
  );

}


/* =========================================================
   BUILD PENDING ACTION
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
        "OPEN_BOOKING"
        ? safeParams
        : null,

    createdAt:
      Date.now(),

  };

}


/* =========================================================
   SHOULD ASK FOR CONFIRMATION
========================================================= */

export function shouldAskForConfirmation(
  intent
) {

  if (
    !intent ||
    intent.action ===
      "NONE"
  ) {

    return false;

  }


  if (
    !actionRequiresConfirmation(
      intent.action
    )
  ) {

    /*
     * Booking with parameters is treated specially.
     */

    if (
      intent.action ===
        "OPEN_BOOKING" &&
      intent.booking
    ) {

      return true;

    }


    return false;

  }


  return true;

}


/* =========================================================
   CONFIRMATION REPLY
========================================================= */

export function getConfirmationReply(
  intent,
  language
) {

  const action =
    normalizeAction(
      intent?.action
    );


  if (
    action ===
    "OPEN_BOOKING" &&
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


/* =========================================================
   BOOKING CONFIRMATION
========================================================= */

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
    language ===
      "hi" ||
    language ===
      "te"
      ? cropNames[
          language
        ]?.[
          crop
        ] ||
        crop
      : crop;


  if (
    language ===
    "hi"
  ) {

    if (
      displayCrop &&
      quantity
    ) {

      return `मैं ${quantity} kg ${displayCrop} की बुकिंग शुरू कर सकता हूँ। आगे बढ़ने के लिए "हाँ" या "करो" कहें।`;

    }


    if (
      displayCrop
    ) {

      return `मैं ${displayCrop} की बुकिंग शुरू कर सकता हूँ। आगे बढ़ने के लिए "हाँ" कहें।`;

    }


    if (
      quantity
    ) {

      return `मैं ${quantity} kg की बुकिंग शुरू कर सकता हूँ। आगे बढ़ने के लिए "हाँ" कहें।`;

    }

  }


  if (
    language ===
    "te"
  ) {

    if (
      displayCrop &&
      quantity
    ) {

      return `${displayCrop} ${quantity} kg బుకింగ్‌ను ప్రారంభించగలను. కొనసాగించడానికి "అవును" లేదా "చేయండి" అని చెప్పండి.`;

    }


    if (
      displayCrop
    ) {

      return `${displayCrop} బుకింగ్‌ను ప్రారంభించగలను. కొనసాగించడానికి "అవును" అని చెప్పండి.`;

    }


    if (
      quantity
    ) {

      return `${quantity} kg బుకింగ్‌ను ప్రారంభించగలను. కొనసాగించడానికి "అవును" అని చెప్పండి.`;

    }

  }


  if (
    displayCrop &&
    quantity
  ) {

    return `I can start a booking for ${quantity} kg of ${displayCrop}. Say "yes" or "do it" and I'll open the booking page with those details.`;

  }


  if (
    displayCrop
  ) {

    return `I can start a ${displayCrop} booking. Say "yes" and I'll open the booking page.`;

  }


  if (
    quantity
  ) {

    return `I can start a ${quantity} kg booking. Say "yes" and I'll open the booking page.`;

  }


  return getGenericConfirmationText(
    language
  );

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


  /*
   * Empty input.
   */

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
     2. PENDING ACTION
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
     3. LOCAL INTENT
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
     * Booking commands with extracted details are
     * intercepted for confirmation.
     */

    if (
      intent.action ===
        "OPEN_BOOKING" &&
      intent.booking &&
      shouldAskForConfirmation(
        intent
      )
    ) {

      return {

        type:
          ROUTER_TYPES.CONFIRM,

        action:
          "OPEN_BOOKING",

        confidence:
          Number(
            intent.confidence
          ) ||
          0.98,

        reply:
          getConfirmationReply(
            intent,
            language
          ),

        userText:
          originalText,

        params:
          sanitizeActionParams(
            intent.booking
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
            "OPEN_BOOKING",
            intent.booking
          ),

      };

    }


    return localDecision;

  }


  /* =======================================================
     4. NORMAL AI
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
   ROUTER WITH PERSISTED PENDING ACTION
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

/*
 * A backend action is only allowed to influence navigation
 * when the local router did not already produce a decision.
 *
 * This is critical for:
 *
 * "What is my payment status?"
 *
 * Backend:
 *   OPEN_PAYMENTS
 *
 * Local router:
 *   ASK_AI
 *
 * Result:
 *   ASK_AI
 *
 * The backend MUST NOT hijack a normal question.
 */

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

    };

  }


  /*
   * Local decisions always win.
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
   * Backend must explicitly confirm that it wants
   * navigation.
   */

  const backendExplicit =
    Boolean(
      backendData?.explicitNavigation
    );


  if (
    !backendExplicit
  ) {

    return localDecision;

  }


  /*
   * Current-page questions cannot become navigation.
   */

  if (
    isCurrentPageQuestion(
      originalText
    )
  ) {

    return localDecision;

  }


  /*
   * Backend action must correspond to a registered action.
   */

  if (
    !isValidAction(
      backendAction
    )
  ) {

    return localDecision;

  }


  return {

    type:
      ROUTER_TYPES.NAVIGATE,

    action:
      backendAction,

    confidence:
      Number(
        backendData?.confidence
      ) ||
      0.9,

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

    backendData,

    shouldCallAI:
      false,

    shouldNavigate:
      true,

  };

}


/* =========================================================
   EXECUTION DESCRIPTION
========================================================= */

/*
 * Converts a router decision into a simple execution
 * description for AssistantContext.
 *
 * No navigation is performed here.
 */

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


  if (
    decision.type ===
    ROUTER_TYPES.NAVIGATE ||
    decision.type ===
    ROUTER_TYPES.CONFIRM
  ) {

    const action =
      normalizeAction(
        decision.action
      );


    return {

      type:
        decision.type,

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
            ?.booking ||
          decision.pendingAction
            ?.params
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
   ROUTER DEBUG
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
      definition.label,

    actionCategory:
      definition.category,

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

    hasParameters:
      Boolean(
        decision.params
      ),

    currentPage:
      decision.currentPage ||
      null,

  };

}


/* =========================================================
   SMART COMMAND HELPERS
========================================================= */

/*
 * These helpers are deliberately conservative.
 * They are intended for future natural-language expansion,
 * not as replacements for the main intent engine.
 */

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

  } =
    options;


  const farmer =
    getStoredFarmer();


  const decision =
    routeWithStoredPendingAction(
      message,
      {
        currentPath,
        language,
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
      farmer.farmerId,

    phone:
      farmer.phone,

    decision:
      decision.decision,

    pendingAction:
      decision.pendingAction,

    lastUserMessage:
      getLastUserMessage(
        history
      ),

    timestamp:
      Date.now(),

  };

}


/* =========================================================
   SAFE NAVIGATION CHECK
========================================================= */

export function canExecuteNavigation(
  decision
) {

  if (
    !decision
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

  /*
   * Lightweight startup validation.
   */

  const testCommands = [

    "open help",

    "opee heeelp",

    "open home",

    "take me back",

    "where are we now",

    "book 300 kg wheat",

    "book page can you take me",

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
          }
        );


      console.debug(
        "[KrishiSetu AI router]",
        command,
        result.type,
        result.action
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