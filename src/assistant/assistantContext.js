/* =========================================================
   KRISHISETU AI ASSISTANT CONTEXT
=========================================================

   This module builds the context sent to the AI system.

   The assistant should not interpret a message in isolation.

   Example:

   User:
       "open it"

   Without context:
       impossible to know what "it" means.

   With context:
       previous intent = OPEN_BOOKING
       pending action = OPEN_BOOKING
       current page = Farmer Home

   The context layer gives the assistant that information.

========================================================= */

import {
  ACTIONS,
  getAction,
  getActionIds,
  getNavigationActions,
} from "./assistantActions";

import {
  cleanText,
  createId,
  getLastAssistantMessage,
  getLastUserMessage,
  getPageName,
  getStoredFarmer,
  historyForServer,
  isActionName,
  isFarmerPath,
  limitHistory,
  normalizeLanguageCode,
  normalizePathname,
  readStorageJson,
} from "./assistantUtils";


/* =========================================================
   CONSTANTS
========================================================= */

const PENDING_ACTION_STORAGE_KEY =
  "krishisetu_ai_pending_action";


const PENDING_ACTION_TTL =
  5 * 60 * 1000;


const MAX_CONTEXT_HISTORY =
  12;


const MAX_CONTEXT_MESSAGES =
  20;


/* =========================================================
   PAGE DEFINITIONS
========================================================= */

const PAGE_METADATA = {

  "/farmer/home": {

    id:
      "FARMER_HOME",

    name:
      "Farmer Home",

    section:
      "farmer",

    capabilities: [

      "view dashboard",

      "view notifications",

      "view farmer overview",

      "view procurement summary",

      "view booking summary",

    ],

  },


  "/farmer/book": {

    id:
      "FARMER_BOOKING",

    name:
      "Book Procurement Slot",

    section:
      "farmer",

    capabilities: [

      "create booking",

      "select crop",

      "enter quantity",

      "select procurement slot",

      "review booking",

    ],

  },


  "/farmer/token": {

    id:
      "FARMER_TOKEN",

    name:
      "Token / Booking Tracking",

    section:
      "farmer",

    capabilities: [

      "view token",

      "view booking",

      "track booking",

      "view booking status",

    ],

  },


  "/farmer/history": {

    id:
      "FARMER_HISTORY",

    name:
      "Procurement History",

    section:
      "farmer",

    capabilities: [

      "view procurement history",

      "view previous bookings",

      "view previous procurement records",

    ],

  },


  "/farmer/payments": {

    id:
      "FARMER_PAYMENTS",

    name:
      "Payment History",

    section:
      "farmer",

    capabilities: [

      "view payment history",

      "view payment records",

      "view payment status",

    ],

  },


  "/farmer/settings": {

    id:
      "FARMER_SETTINGS",

    name:
      "Farmer Settings",

    section:
      "farmer",

    capabilities: [

      "view account settings",

      "edit preferences",

      "manage account settings",

    ],

  },


  "/farmer/help": {

    id:
      "FARMER_HELP",

    name:
      "Farmer Help",

    section:
      "farmer",

    capabilities: [

      "view help",

      "view frequently asked questions",

      "find support information",

    ],

  },


  "/farmer/login": {

    id:
      "FARMER_LOGIN",

    name:
      "Farmer Login",

    section:
      "authentication",

    capabilities: [

      "login",

      "authenticate farmer",

    ],

  },


  "/farmer/register": {

    id:
      "FARMER_REGISTER",

    name:
      "Farmer Registration",

    section:
      "authentication",

    capabilities: [

      "register farmer",

      "create farmer account",

    ],

  },

};


/* =========================================================
   CURRENT PAGE
========================================================= */

/*
 * Return metadata about the current route.
 */

export function getCurrentPageMetadata(
  pathname
) {

  const normalized =
    normalizePathname(
      pathname
    );


  const metadata =
    PAGE_METADATA[
      normalized
    ];


  if (
    metadata
  ) {

    return {

      ...metadata,

      pathname:
        normalized,

      known:
        true,

    };

  }


  return {

    id:
      "UNKNOWN_PAGE",

    name:
      getPageName(
        normalized
      ),

    section:
      normalized.startsWith(
        "/farmer"
      )
        ? "farmer"
        : "unknown",

    capabilities: [],

    pathname:
      normalized,

    known:
      false,

  };

}


/* =========================================================
   CURRENT PAGE CAPABILITIES
========================================================= */

export function getCurrentPageCapabilities(
  pathname
) {

  return [
    ...getCurrentPageMetadata(
      pathname
    ).capabilities,
  ];

}


/* =========================================================
   PAGE CATEGORY
========================================================= */

export function getPageSection(
  pathname
) {

  return getCurrentPageMetadata(
    pathname
  ).section;

}


/* =========================================================
   PENDING ACTION
========================================================= */

/*
 * Read the currently pending conversational action.
 *
 * Example:
 *
 * User:
 *     "book 300 kg wheat"
 *
 * Pending:
 *
 * {
 *   action: "OPEN_BOOKING",
 *   booking: {
 *     crop: "wheat",
 *     quantity: 300
 *   }
 * }
 *
 * Then:
 *
 * User:
 *     "okay do it"
 *
 * The context tells the system what "it" means.
 */

export function getPendingAction() {

  const pending =
    readStorageJson(
      PENDING_ACTION_STORAGE_KEY,
      null
    );


  if (
    !pending ||
    typeof pending !==
      "object"
  ) {

    return null;

  }


  if (
    !pending.action ||
    !isActionName(
      pending.action,
      ACTIONS
    )
  ) {

    return null;

  }


  const createdAt =
    Number(
      pending.createdAt ||
      0
    );


  if (
    createdAt &&
    Date.now() -
      createdAt >
      PENDING_ACTION_TTL
  ) {

    return null;

  }


  return {

    ...pending,

    action:
      pending.action,

    definition:
      getAction(
        pending.action
      ),

  };

}


/*
 * Return true when there is an unexpired pending action.
 */

export function hasPendingAction() {

  return Boolean(
    getPendingAction()
  );

}


/* =========================================================
   ACTION CONTEXT
========================================================= */

/*
 * Describe an action in a format useful for the AI.
 */

export function getActionContext(
  action
) {

  if (
    !isActionName(
      action,
      ACTIONS
    )
  ) {

    return null;

  }


  const definition =
    getAction(
      action
    );


  return {

    id:
      definition.id,

    label:
      definition.label,

    description:
      definition.description,

    category:
      definition.category,

    route:
      definition.route,

    requiresConfirmation:
      Boolean(
        definition.requiresConfirmation
      ),

    acceptsParams:
      Boolean(
        definition.acceptsParams
      ),

  };

}


/*
 * Return every available navigation action.
 */

export function getAvailableNavigationActions() {

  return getNavigationActions()
    .map(
      action =>
        getActionContext(
          action.id
        )
    );

}


/*
 * Return all available action IDs.
 */

export function getAvailableActionIds() {

  return getActionIds();

}


/* =========================================================
   CONVERSATION STATE
========================================================= */

/*
 * Build a compact representation of the conversation.
 */

export function getConversationContext(
  history
) {

  const safeHistory =
    limitHistory(
      history,
      MAX_CONTEXT_MESSAGES
    );


  const serverHistory =
    historyForServer(
      safeHistory,
      MAX_CONTEXT_HISTORY
    );


  const lastUser =
    getLastUserMessage(
      safeHistory
    );


  const lastAssistant =
    getLastAssistantMessage(
      safeHistory
    );


  return {

    messageCount:
      safeHistory.length,

    recentMessages:
      serverHistory,

    lastUserMessage:
      lastUser
        ? {

            content:
              cleanText(
                lastUser.content
              ),

            timestamp:
              lastUser.timestamp,

          }
        : null,

    lastAssistantMessage:
      lastAssistant
        ? {

            content:
              cleanText(
                lastAssistant.content
              ),

            action:
              lastAssistant.action ||
              "NONE",

            timestamp:
              lastAssistant.timestamp,

            failed:
              Boolean(
                lastAssistant.failed
              ),

          }
        : null,

  };

}


/* =========================================================
   CONVERSATION RELATION
========================================================= */

/*
 * Determine how the newest user message relates to
 * the preceding conversation.
 *
 * This is deliberately heuristic.
 *
 * It does NOT decide intent.
 * It only gives the AI additional context.
 */

export function getConversationRelation(
  history,
  message
) {

  const current =
    cleanText(
      message
    );


  const lastUser =
    getLastUserMessage(
      history
    );


  const lastAssistant =
    getLastAssistantMessage(
      history
    );


  const pending =
    getPendingAction();


  if (
    pending &&
    current
  ) {

    return {

      type:
        "PENDING_ACTION_EXISTS",

      pendingAction:
        pending.action,

    };

  }


  if (
    !lastAssistant
  ) {

    return {

      type:
        "NEW_CONVERSATION",

    };

  }


  const assistantText =
    cleanText(
      lastAssistant.content
    )
      .toLowerCase();


  /*
   * Pronouns such as:
   *
   * "it"
   * "that"
   * "there"
   *
   * often refer to the previous assistant result.
   */

  const pronounPattern =
    /\b(it|that|this|there|them|those)\b/i;


  if (
    pronounPattern.test(
      current
    )
  ) {

    return {

      type:
        "REFERENCES_PREVIOUS_MESSAGE",

      previousAction:
        lastAssistant.action ||
        "NONE",

      previousAssistantMessage:
        lastAssistant.content,

    };

  }


  /*
   * Confirmation-like continuation.
   */

  const continuationPattern =
    /\b(yes|okay|ok|sure|continue|do it|go ahead|please do)\b/i;


  if (
    continuationPattern.test(
      current
    )
  ) {

    return {

      type:
        "POSSIBLE_CONFIRMATION",

      previousAction:
        lastAssistant.action ||
        "NONE",

      previousAssistantMessage:
        lastAssistant.content,

    };

  }


  return {

    type:
      "NORMAL_FOLLOW_UP",

    previousUserMessage:
      lastUser?.content ||
      null,

    previousAssistantMessage:
      lastAssistant?.content ||
      null,

    previousAction:
      lastAssistant?.action ||
      "NONE",

    previousAssistantText:
      assistantText,

  };

}


/* =========================================================
   FARMER CONTEXT
========================================================= */

/*
 * Build farmer identity context.
 *
 * This intentionally contains only the identifiers already
 * available in localStorage.
 */

export function getFarmerContext() {

  const farmer =
    getStoredFarmer();


  return {

    authenticated:
      Boolean(
        farmer.farmerId ||
        farmer.phone
      ),

    farmerId:
      farmer.farmerId ||
      "",

    phone:
      farmer.phone ||
      "",

  };

}


/* =========================================================
   USER CAPABILITIES
========================================================= */

/*
 * Future versions can expand this based on:
 *
 * - authentication
 * - role
 * - permissions
 * - route
 * - backend capabilities
 *
 * For now it describes the capabilities available
 * to the current prototype.
 */

export function getUserCapabilities(
  pathname
) {

  const farmer =
    getFarmerContext();


  const pageCapabilities =
    getCurrentPageCapabilities(
      pathname
    );


  const capabilities = [

    "use krishisetu ai",

    "navigate portal",

  ];


  if (
    farmer.authenticated
  ) {

    capabilities.push(
      "access farmer account"
    );

  }


  capabilities.push(
    ...pageCapabilities
  );


  return [
    ...new Set(
      capabilities
    ),
  ];

}


/* =========================================================
   ROUTE CONTEXT
========================================================= */

/*
 * Build route-aware context.
 */

export function getRouteContext(
  pathname
) {

  const normalized =
    normalizePathname(
      pathname
    );


  const page =
    getCurrentPageMetadata(
      normalized
    );


  return {

    pathname:
      normalized,

    pageId:
      page.id,

    pageName:
      page.name,

    section:
      page.section,

    knownPage:
      page.known,

    capabilities:
      page.capabilities,

    isFarmerPage:
      isFarmerPath(
        normalized
      ),

  };

}


/* =========================================================
   ASSISTANT CONTEXT
========================================================= */

/*
 * Build the complete runtime context.
 *
 * This is the main function other modules should use.
 */

export function buildAssistantContext(
  options = {}
) {

  const {

    pathname =
      "",

    language =
      "en",

    history =
      [],

    message =
      "",

    pendingAction =
      undefined,

    includeHistory =
      true,

  } =
    options;


  const normalizedPath =
    normalizePathname(
      pathname
    );


  const normalizedLanguage =
    normalizeLanguageCode(
      language
    );


  const page =
    getCurrentPageMetadata(
      normalizedPath
    );


  const farmer =
    getFarmerContext();


  const route =
    getRouteContext(
      normalizedPath
    );


  const conversation =
    getConversationContext(
      history
    );


  const relation =
    getConversationRelation(
      history,
      message
    );


  const pending =
    pendingAction ===
    undefined
      ? getPendingAction()
      : pendingAction;


  return {

    version:
      "1.0",

    contextId:
      createId(),

    timestamp:
      Date.now(),

    language:
      normalizedLanguage,

    currentPage:
      page.name,

    currentPath:
      normalizedPath,

    route,

    page,

    farmer,

    conversation:
      includeHistory
        ? conversation
        : {

            messageCount:
              conversation.messageCount,

            recentMessages:
              [],

            lastUserMessage:
              conversation.lastUserMessage,

            lastAssistantMessage:
              conversation.lastAssistantMessage,

          },

    conversationRelation:
      relation,

    pendingAction:
      pending
        ? {

            action:
              pending.action,

            params:
              pending.booking ||
              pending.params ||
              null,

            createdAt:
              pending.createdAt ||
              null,

            definition:
              getActionContext(
                pending.action
              ),

          }
        : null,

    availableActions:
      getAvailableActionIds(),

    availableNavigationActions:
      getAvailableNavigationActions(),

    userCapabilities:
      getUserCapabilities(
        normalizedPath
      ),

  };

}


/* =========================================================
   SERVER CONTEXT
========================================================= */

/*
 * Produce a compact JSON-safe version for the backend.
 *
 * We do not need every client-side detail on every request.
 */

export function buildServerAssistantContext(
  options = {}
) {

  const context =
    buildAssistantContext(
      options
    );


  return {

    version:
      context.version,

    language:
      context.language,

    currentPage:
      context.currentPage,

    currentPath:
      context.currentPath,

    route: {

      pageId:
        context.route.pageId,

      pageName:
        context.route.pageName,

      section:
        context.route.section,

      isFarmerPage:
        context.route.isFarmerPage,

    },

    farmer: {

      authenticated:
        context.farmer.authenticated,

      farmerId:
        context.farmer.farmerId,

      phone:
        context.farmer.phone,

    },

    conversation: {

      messageCount:
        context.conversation.messageCount,

      recentMessages:
        context.conversation.recentMessages,

      lastUserMessage:
        context.conversation.lastUserMessage,

      lastAssistantMessage:
        context.conversation.lastAssistantMessage,

    },

    conversationRelation:
      context.conversationRelation,

    pendingAction:
      context.pendingAction,

    availableActions:
      context.availableActions,

    userCapabilities:
      context.userCapabilities,

  };

}


/* =========================================================
   ACTION VALIDATION
========================================================= */

/*
 * Validate whether an action makes sense in the current
 * application context.
 *
 * This is not intent detection.
 *
 * Example:
 *
 * OPEN_HELP
 *
 * is valid almost everywhere.
 *
 * An action can still be rejected by permissions or
 * application-specific rules in the future.
 */

export function validateActionForContext(
  action,
  context
) {

  const definition =
    getAction(
      action
    );


  if (
    !definition ||
    action ===
      "NONE"
  ) {

    return {

      valid:
        false,

      reason:
        "Unknown or empty action.",

    };

  }


  /*
   * Current-page information is always valid.
   */

  if (
    action ===
    "SHOW_CURRENT_PAGE"
  ) {

    return {

      valid:
        true,

      reason:
        null,

    };

  }


  /*
   * Back is always valid inside the browser router.
   */

  if (
    action ===
    "GO_BACK"
  ) {

    return {

      valid:
        true,

      reason:
        null,

    };

  }


  if (
    !context
  ) {

    return {

      valid:
        true,

      reason:
        null,

    };

  }


  /*
   * Check farmer-page restrictions.
   */

  if (
    definition.route?.startsWith(
      "/farmer"
    ) &&
    !context.route?.isFarmerPage
  ) {

    /*
     * This is not automatically invalid.
     *
     * The AI can navigate from a public page into the
     * farmer portal.
     */

    return {

      valid:
        true,

      reason:
        null,

    };

  }


  return {

    valid:
      true,

    reason:
      null,

  };

}


/* =========================================================
   CONTEXT SUMMARY
========================================================= */

/*
 * Small human-readable summary useful in logs.
 */

export function summarizeContext(
  context
) {

  if (
    !context
  ) {

    return "No assistant context.";

  }


  const page =
    context.currentPage ||
    "Unknown Page";


  const path =
    context.currentPath ||
    "/";


  const language =
    context.language ||
    "en";


  const pending =
    context.pendingAction?.action ||
    "NONE";


  const lastAction =
    context
      .conversation
      ?.lastAssistantMessage
      ?.action ||
    "NONE";


  return [

    `page=${page}`,

    `path=${path}`,

    `language=${language}`,

    `pending=${pending}`,

    `lastAction=${lastAction}`,

  ].join(
    " | "
  );

}


/* =========================================================
   CONTEXT EXPORT
========================================================= */

export const ASSISTANT_CONTEXT = {

  getCurrentPageMetadata,

  getCurrentPageCapabilities,

  getPageSection,

  getPendingAction,

  hasPendingAction,

  getActionContext,

  getAvailableNavigationActions,

  getAvailableActionIds,

  getConversationContext,

  getConversationRelation,

  getFarmerContext,

  getUserCapabilities,

  getRouteContext,

  buildAssistantContext,

  buildServerAssistantContext,

  validateActionForContext,

  summarizeContext,

};