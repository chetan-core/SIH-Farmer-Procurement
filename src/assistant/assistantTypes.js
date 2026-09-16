/* =========================================================
   KRISHISETU AI ASSISTANT TYPES
=========================================================

   This file defines the common data structures used by the
   KrishiSetu AI system.

   JavaScript does not enforce interfaces at runtime, so these
   helpers provide:

   1. Consistent object shapes
   2. Safe defaults
   3. Runtime normalization
   4. Easier debugging
   5. Cleaner communication between modules

   ARCHITECTURE

   VoiceAssistant
        ↓
   assistantController
        ↓
   assistantRouter
        ↓
   assistantContext
        ↓
   assistantService
        ↓
   backend AI

========================================================= */


/* =========================================================
   CONSTANTS
========================================================= */

export const ASSISTANT_MESSAGE_ROLES = {

  USER:
    "user",

  ASSISTANT:
    "assistant",

};


export const ASSISTANT_ROUTER_TYPES = {

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


export const ASSISTANT_REQUEST_STATES = {

  IDLE:
    "idle",

  PROCESSING:
    "processing",

  SUCCESS:
    "success",

  ERROR:
    "error",

  CANCELLED:
    "cancelled",

};


export const ASSISTANT_RESPONSE_TYPES = {

  MESSAGE:
    "MESSAGE",

  NAVIGATION:
    "NAVIGATION",

  CURRENT_PAGE:
    "CURRENT_PAGE",

  CONFIRMATION:
    "CONFIRMATION",

  CANCELLATION:
    "CANCELLATION",

  ERROR:
    "ERROR",

};


/* =========================================================
   BASIC NORMALIZATION HELPERS
========================================================= */

function safeString(
  value
) {

  return String(
    value ?? ""
  )
    .trim();

}


function safeNumber(
  value,
  fallback = null
) {

  const number =
    Number(
      value
    );


  if (
    !Number.isFinite(
      number
    )
  ) {

    return fallback;

  }


  return number;

}


function safeBoolean(
  value
) {

  return Boolean(
    value
  );

}


function safeObject(
  value
) {

  if (
    !value ||
    typeof value !==
      "object" ||
    Array.isArray(
      value
    )
  ) {

    return {};

  }


  return value;

}


function safeArray(
  value
) {

  return Array.isArray(
    value
  )
    ? value
    : [];

}


/* =========================================================
   MESSAGE
========================================================= */

/*
 * Standard conversation message.
 *
 * Example:
 *
 * {
 *   id: "...",
 *   role: "user",
 *   content: "open help",
 *   timestamp: 123456789,
 *   action: "OPEN_HELP",
 *   failed: false
 * }
 */

export function createAssistantMessage(
  options = {}
) {

  const {

    id =
      createMessageId(),

    role =
      ASSISTANT_MESSAGE_ROLES.ASSISTANT,

    content =
      "",

    timestamp =
      Date.now(),

    action =
      "NONE",

    failed =
      false,

    metadata =
      null,

  } =
    safeObject(
      options
    );


  return {

    id:
      safeString(
        id
      ) ||
      createMessageId(),

    role:
      role ===
        ASSISTANT_MESSAGE_ROLES.USER
        ? ASSISTANT_MESSAGE_ROLES.USER
        : ASSISTANT_MESSAGE_ROLES.ASSISTANT,

    content:
      safeString(
        content
      ),

    timestamp:
      safeNumber(
        timestamp,
        Date.now()
      ),

    action:
      safeString(
        action
      ) ||
      "NONE",

    failed:
      safeBoolean(
        failed
      ),

    metadata:
      metadata
        ? safeObject(
            metadata
          )
        : null,

  };

}


/*
 * Create a user message.
 */

export function createUserMessage(
  content,
  options = {}
) {

  return createAssistantMessage({

    ...options,

    role:
      ASSISTANT_MESSAGE_ROLES.USER,

    content,

    action:
      options.action ||
      "NONE",

    failed:
      false,

  });

}


/*
 * Create an assistant message.
 */

export function createAssistantReplyMessage(
  content,
  options = {}
) {

  return createAssistantMessage({

    ...options,

    role:
      ASSISTANT_MESSAGE_ROLES.ASSISTANT,

    content,

  });

}


/*
 * Generate a message ID.
 */

export function createMessageId() {

  if (
    typeof crypto !==
      "undefined" &&
    typeof crypto.randomUUID ===
      "function"
  ) {

    return crypto.randomUUID();

  }


  return (
    `msg-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`
  );

}


/* =========================================================
   INTENT
========================================================= */

/*
 * Standard local intent object.
 *
 * Example:
 *
 * {
 *   action: "OPEN_BOOKING",
 *   confidence: 0.98,
 *   booking: {...},
 *   semanticTopic: null
 * }
 */

export function createIntent(
  options = {}
) {

  const {

    action =
      "NONE",

    confidence =
      0,

    booking =
      null,

    semanticTopic =
      null,

    entities =
      null,

    source =
      "local",

    metadata =
      null,

  } =
    safeObject(
      options
    );


  return {

    action:
      safeString(
        action
      ) ||
      "NONE",

    confidence:
      Math.max(
        0,
        Math.min(
          1,
          safeNumber(
            confidence,
            0
          )
        )
      ),

    booking:
      booking
        ? normalizeBookingParams(
            booking
          )
        : null,

    semanticTopic:
      semanticTopic
        ? safeString(
            semanticTopic
          )
        : null,

    entities:
      entities
        ? safeObject(
            entities
          )
        : null,

    source:
      safeString(
        source
      ) ||
      "local",

    metadata:
      metadata
        ? safeObject(
            metadata
          )
        : null,

  };

}


/* =========================================================
   BOOKING PARAMETERS
========================================================= */

/*
 * Booking parameters shared across the entire application.
 *
 * Example:
 *
 * {
 *   crop: "wheat",
 *   quantity: 300
 * }
 */

export function normalizeBookingParams(
  booking
) {

  if (
    !booking ||
    typeof booking !==
      "object" ||
    Array.isArray(
      booking
    )
  ) {

    return null;

  }


  const crop =
    safeString(
      booking.crop
    );


  const quantity =
    safeNumber(
      booking.quantity,
      null
    );


  const result = {};


  if (
    crop
  ) {

    result.crop =
      crop;

  }


  if (
    Number.isFinite(
      quantity
    ) &&
    quantity > 0
  ) {

    result.quantity =
      quantity;

  }


  return Object.keys(
    result
  ).length
    ? result
    : null;

}


/* =========================================================
   PENDING ACTION
========================================================= */

/*
 * Standard pending conversational action.
 *
 * Example:
 *
 * {
 *   action: "OPEN_BOOKING",
 *   params: {
 *     crop: "wheat",
 *     quantity: 300
 *   },
 *   booking: {
 *     crop: "wheat",
 *     quantity: 300
 *   },
 *   createdAt: 123456789
 * }
 */

export function createPendingAction(
  options = {}
) {

  const {

    action =
      "NONE",

    params =
      null,

    booking =
      null,

    createdAt =
      Date.now(),

    expiresAt =
      null,

  } =
    safeObject(
      options
    );


  const normalizedParams =
    params
      ? normalizeActionParams(
          params
        )
      : null;


  const normalizedBooking =
    booking
      ? normalizeBookingParams(
          booking
        )
      : null;


  const created =
    safeNumber(
      createdAt,
      Date.now()
    );


  return {

    action:
      safeString(
        action
      ) ||
      "NONE",

    params:
      normalizedParams,

    booking:
      normalizedBooking,

    createdAt:
      created,

    expiresAt:
      safeNumber(
        expiresAt,
        null
      ),

  };

}


/*
 * Check whether a pending action is expired.
 */

export function isPendingActionExpired(
  pendingAction,
  now =
    Date.now()
) {

  if (
    !pendingAction
  ) {

    return true;

  }


  const expiresAt =
    safeNumber(
      pendingAction.expiresAt,
      null
    );


  if (
    expiresAt !==
    null
  ) {

    return (
      now >=
      expiresAt
    );

  }


  return false;

}


/* =========================================================
   ACTION PARAMETERS
========================================================= */

/*
 * Sanitize general action parameters.
 *
 * The system should keep this structure controlled.
 */

export function normalizeActionParams(
  params
) {

  if (
    !params ||
    typeof params !==
      "object" ||
    Array.isArray(
      params
    )
  ) {

    return null;

  }


  const output = {};


  /*
   * Booking parameters.
   */

  const booking =
    normalizeBookingParams(
      params
    );


  if (
    booking
  ) {

    Object.assign(
      output,
      booking
    );

  }


  /*
   * Generic IDs.
   */

  const tokenId =
    safeString(
      params.tokenId
    );


  if (
    tokenId
  ) {

    output.tokenId =
      tokenId;

  }


  const bookingId =
    safeString(
      params.bookingId
    );


  if (
    bookingId
  ) {

    output.bookingId =
      bookingId;

  }


  const farmerId =
    safeString(
      params.farmerId
    );


  if (
    farmerId
  ) {

    output.farmerId =
      farmerId;

  }


  /*
   * Generic page parameters.
   */

  const page =
    safeString(
      params.page
    );


  if (
    page
  ) {

    output.page =
      page;

  }


  return Object.keys(
    output
  ).length
    ? output
    : null;

}


/* =========================================================
   ROUTER DECISION
========================================================= */

/*
 * Standard output of assistantRouter.
 */

export function createRouterDecision(
  options = {}
) {

  const {

    type =
      ASSISTANT_ROUTER_TYPES.NONE,

    action =
      "NONE",

    confidence =
      0,

    reply =
      null,

    userText =
      "",

    normalized =
      "",

    params =
      null,

    intent =
      null,

    pendingAction =
      null,

    currentPage =
      null,

    shouldCallAI =
      false,

    shouldNavigate =
      false,

    createPending =
      false,

    clearPending =
      false,

    metadata =
      null,

  } =
    safeObject(
      options
    );


  return {

    type:
      safeString(
        type
      ) ||
      ASSISTANT_ROUTER_TYPES.NONE,

    action:
      safeString(
        action
      ) ||
      "NONE",

    confidence:
      Math.max(
        0,
        Math.min(
          1,
          safeNumber(
            confidence,
            0
          )
        )
      ),

    reply:
      reply ===
        null
        ? null
        : safeString(
            reply
          ),

    userText:
      safeString(
        userText
      ),

    normalized:
      safeString(
        normalized
      ),

    params:
      params
        ? normalizeActionParams(
            params
          )
        : null,

    intent:
      intent
        ? createIntent(
            intent
          )
        : null,

    pendingAction:
      pendingAction
        ? createPendingAction(
            pendingAction
          )
        : null,

    currentPage:
      currentPage
        ? safeString(
            currentPage
          )
        : null,

    shouldCallAI:
      safeBoolean(
        shouldCallAI
      ),

    shouldNavigate:
      safeBoolean(
        shouldNavigate
      ),

    createPending:
      safeBoolean(
        createPending
      ),

    clearPending:
      safeBoolean(
        clearPending
      ),

    metadata:
      metadata
        ? safeObject(
            metadata
          )
        : null,

  };

}


/* =========================================================
   EXECUTION PLAN
========================================================= */

/*
 * Describes what the UI/controller should actually execute.
 */

export function createExecutionPlan(
  options = {}
) {

  const {

    type =
      ASSISTANT_ROUTER_TYPES.NONE,

    action =
      "NONE",

    execute =
      false,

    route =
      null,

    params =
      null,

    speech =
      null,

  } =
    safeObject(
      options
    );


  return {

    type:
      safeString(
        type
      ) ||
      ASSISTANT_ROUTER_TYPES.NONE,

    action:
      safeString(
        action
      ) ||
      "NONE",

    execute:
      safeBoolean(
        execute
      ),

    route:
      route
        ? safeString(
            route
          )
        : null,

    params:
      params
        ? normalizeActionParams(
            params
          )
        : null,

    speech:
      speech
        ? safeString(
            speech
          )
        : null,

  };

}


/* =========================================================
   BACKEND REQUEST
========================================================= */

/*
 * Standard assistant API request object.
 */

export function createAssistantRequest(
  options = {}
) {

  const {

    text =
      "",

    language =
      "en",

    currentPath =
      "",

    currentPage =
      "",

    farmerId =
      "",

    phone =
      "",

    history =
      [],

    context =
      null,

    clientRequestId =
      createMessageId(),

  } =
    safeObject(
      options
    );


  return {

    text:
      safeString(
        text
      ),

    language:
      safeString(
        language
      ) ||
      "en",

    currentPath:
      safeString(
        currentPath
      ),

    currentPage:
      safeString(
        currentPage
      ),

    farmerId:
      safeString(
        farmerId
      ),

    phone:
      safeString(
        phone
      ),

    history:
      normalizeMessageHistory(
        history
      ),

    context:
      context
        ? safeObject(
            context
          )
        : null,

    clientRequestId:
      safeString(
        clientRequestId
      ) ||
      createMessageId(),

    timestamp:
      Date.now(),

  };

}


/* =========================================================
   BACKEND RESPONSE
========================================================= */

/*
 * Standard backend response.
 *
 * The backend is allowed to return additional properties,
 * but this normalized object gives the frontend predictable
 * fields.
 */

export function createAssistantResponse(
  options = {}
) {

  const {

    reply =
      "",

    action =
      "NONE",

    confidence =
      0,

    explicitNavigation =
      false,

    data =
      null,

    error =
      null,

    requestId =
      null,

    metadata =
      null,

  } =
    safeObject(
      options
    );


  return {

    reply:
      safeString(
        reply
      ),

    action:
      safeString(
        action
      ) ||
      "NONE",

    confidence:
      Math.max(
        0,
        Math.min(
          1,
          safeNumber(
            confidence,
            0
          )
        )
      ),

    explicitNavigation:
      safeBoolean(
        explicitNavigation
      ),

    data:
      data
        ? safeObject(
            data
          )
        : null,

    error:
      error
        ? safeString(
            error
          )
        : null,

    requestId:
      requestId
        ? safeString(
            requestId
          )
        : null,

    metadata:
      metadata
        ? safeObject(
            metadata
          )
        : null,

  };

}


/* =========================================================
   API RESULT
========================================================= */

/*
 * Separates transport success/failure from assistant response.
 */

export function createServiceResult(
  options = {}
) {

  const {

    ok =
      false,

    status =
      null,

    response =
      null,

    error =
      null,

    networkError =
      false,

    timeout =
      false,

    aborted =
      false,

  } =
    safeObject(
      options
    );


  return {

    ok:
      safeBoolean(
        ok
      ),

    status:
      safeNumber(
        status,
        null
      ),

    response:
      response
        ? createAssistantResponse(
            response
          )
        : null,

    error:
      error
        ? safeString(
            error
          )
        : null,

    networkError:
      safeBoolean(
        networkError
      ),

    timeout:
      safeBoolean(
        timeout
      ),

    aborted:
      safeBoolean(
        aborted
      ),

  };

}


/* =========================================================
   CONVERSATION CONTEXT
========================================================= */

/*
 * Compact representation of conversation state.
 */

export function createConversationContext(
  options = {}
) {

  const {

    messageCount =
      0,

    recentMessages =
      [],

    lastUserMessage =
      null,

    lastAssistantMessage =
      null,

  } =
    safeObject(
      options
    );


  return {

    messageCount:
      Math.max(
        0,
        Math.floor(
          safeNumber(
            messageCount,
            0
          )
        )
      ),

    recentMessages:
      normalizeMessageHistory(
        recentMessages
      ),

    lastUserMessage:
      normalizeConversationReference(
        lastUserMessage
      ),

    lastAssistantMessage:
      normalizeConversationReference(
        lastAssistantMessage
      ),

  };

}


/*
 * Normalize a reference to one conversation message.
 */

function normalizeConversationReference(
  message
) {

  if (
    !message ||
    typeof message !==
      "object"
  ) {

    return null;

  }


  return {

    content:
      safeString(
        message.content
      ),

    action:
      safeString(
        message.action
      ) ||
      "NONE",

    timestamp:
      safeNumber(
        message.timestamp,
        null
      ),

    failed:
      safeBoolean(
        message.failed
      ),

  };

}


/* =========================================================
   ROUTE CONTEXT
========================================================= */

export function createRouteContext(
  options = {}
) {

  const {

    pathname =
      "",

    pageId =
      "UNKNOWN_PAGE",

    pageName =
      "Unknown Page",

    section =
      "unknown",

    knownPage =
      false,

    capabilities =
      [],

    isFarmerPage =
      false,

  } =
    safeObject(
      options
    );


  return {

    pathname:
      safeString(
        pathname
      ),

    pageId:
      safeString(
        pageId
      ) ||
      "UNKNOWN_PAGE",

    pageName:
      safeString(
        pageName
      ) ||
      "Unknown Page",

    section:
      safeString(
        section
      ) ||
      "unknown",

    knownPage:
      safeBoolean(
        knownPage
      ),

    capabilities:
      uniqueStrings(
        capabilities
      ),

    isFarmerPage:
      safeBoolean(
        isFarmerPage
      ),

  };

}


/* =========================================================
   PAGE CONTEXT
========================================================= */

export function createPageContext(
  options = {}
) {

  const {

    id =
      "UNKNOWN_PAGE",

    name =
      "Unknown Page",

    pathname =
      "",

    section =
      "unknown",

    capabilities =
      [],

    known =
      false,

  } =
    safeObject(
      options
    );


  return {

    id:
      safeString(
        id
      ) ||
      "UNKNOWN_PAGE",

    name:
      safeString(
        name
      ) ||
      "Unknown Page",

    pathname:
      safeString(
        pathname
      ),

    section:
      safeString(
        section
      ) ||
      "unknown",

    capabilities:
      uniqueStrings(
        capabilities
      ),

    known:
      safeBoolean(
        known
      ),

  };

}


/* =========================================================
   FARMER CONTEXT
========================================================= */

export function createFarmerContext(
  options = {}
) {

  const {

    authenticated =
      false,

    farmerId =
      "",

    phone =
      "",

  } =
    safeObject(
      options
    );


  return {

    authenticated:
      safeBoolean(
        authenticated
      ),

    farmerId:
      safeString(
        farmerId
      ),

    phone:
      safeString(
        phone
      ),

  };

}


/* =========================================================
   USER CAPABILITIES
========================================================= */

export function normalizeCapabilities(
  capabilities
) {

  return uniqueStrings(
    capabilities
  );

}


/* =========================================================
   FULL ASSISTANT CONTEXT
========================================================= */

export function createAssistantContext(
  options = {}
) {

  const {

    version =
      "1.0",

    contextId =
      createMessageId(),

    timestamp =
      Date.now(),

    language =
      "en",

    currentPage =
      "",

    currentPath =
      "",

    route =
      null,

    page =
      null,

    farmer =
      null,

    conversation =
      null,

    conversationRelation =
      null,

    pendingAction =
      null,

    availableActions =
      [],

    availableNavigationActions =
      [],

    userCapabilities =
      [],

  } =
    safeObject(
      options
    );


  return {

    version:
      safeString(
        version
      ) ||
      "1.0",

    contextId:
      safeString(
        contextId
      ) ||
      createMessageId(),

    timestamp:
      safeNumber(
        timestamp,
        Date.now()
      ),

    language:
      safeString(
        language
      ) ||
      "en",

    currentPage:
      safeString(
        currentPage
      ),

    currentPath:
      safeString(
        currentPath
      ),

    route:
      route
        ? createRouteContext(
            route
          )
        : null,

    page:
      page
        ? createPageContext(
            page
          )
        : null,

    farmer:
      farmer
        ? createFarmerContext(
            farmer
          )
        : null,

    conversation:
      conversation
        ? createConversationContext(
            conversation
          )
        : null,

    conversationRelation:
      conversationRelation
        ? safeObject(
            conversationRelation
          )
        : null,

    pendingAction:
      pendingAction
        ? createPendingAction(
            pendingAction
          )
        : null,

    availableActions:
      uniqueStrings(
        availableActions
      ),

    availableNavigationActions:
      safeArray(
        availableNavigationActions
      ),

    userCapabilities:
      normalizeCapabilities(
        userCapabilities
      ),

  };

}


/* =========================================================
   NORMALIZE MESSAGE HISTORY
========================================================= */

export function normalizeMessageHistory(
  history
) {

  return safeArray(
    history
  )
    .map(
      message => {

        if (
          !message ||
          typeof message !==
            "object"
        ) {

          return null;

        }


        return createAssistantMessage({

          id:
            message.id ||
            createMessageId(),

          role:
            message.role,

          content:
            message.content,

          timestamp:
            message.timestamp,

          action:
            message.action,

          failed:
            message.failed,

          metadata:
            message.metadata,

        });

      }
    )
    .filter(
      Boolean
    );

}


/* =========================================================
   AI MESSAGE HISTORY
========================================================= */

/*
 * Remove client-only fields before sending conversation
 * history to the backend.
 */

export function historyForAI(
  history,
  maxMessages =
    12
) {

  const safe =
    normalizeMessageHistory(
      history
    );


  const limit =
    Math.max(
      0,
      Math.floor(
        safeNumber(
          maxMessages,
          12
        )
      )
    );


  return safe
    .slice(
      -limit
    )
    .map(
      message => ({

        role:
          message.role,

        content:
          message.content,

      })
    );

}


/* =========================================================
   ERROR
========================================================= */

/*
 * Standard assistant error.
 */

export function createAssistantError(
  options = {}
) {

  const {

    code =
      "UNKNOWN_ERROR",

    message =
      "Something went wrong.",

    retriable =
      false,

    network =
      false,

    timeout =
      false,

    aborted =
      false,

    details =
      null,

  } =
    safeObject(
      options
    );


  return {

    code:
      safeString(
        code
      ) ||
      "UNKNOWN_ERROR",

    message:
      safeString(
        message
      ) ||
      "Something went wrong.",

    retriable:
      safeBoolean(
        retriable
      ),

    network:
      safeBoolean(
        network
      ),

    timeout:
      safeBoolean(
        timeout
      ),

    aborted:
      safeBoolean(
        aborted
      ),

    details:
      details
        ? safeObject(
            details
          )
        : null,

  };

}


/* =========================================================
   REQUEST STATE
========================================================= */

export function createRequestState(
  options = {}
) {

  const {

    status =
      ASSISTANT_REQUEST_STATES.IDLE,

    requestId =
      null,

    startedAt =
      null,

    completedAt =
      null,

    error =
      null,

  } =
    safeObject(
      options
    );


  return {

    status:
      safeString(
        status
      ) ||
      ASSISTANT_REQUEST_STATES.IDLE,

    requestId:
      requestId
        ? safeString(
            requestId
          )
        : null,

    startedAt:
      safeNumber(
        startedAt,
        null
      ),

    completedAt:
      safeNumber(
        completedAt,
        null
      ),

    error:
      error
        ? createAssistantError(
            error
          )
        : null,

  };

}


/* =========================================================
   ASSISTANT RESULT
========================================================= */

/*
 * Final normalized result returned by the assistant
 * controller to the UI.
 */

export function createAssistantResult(
  options = {}
) {

  const {

    type =
      ASSISTANT_RESPONSE_TYPES.MESSAGE,

    reply =
      "",

    action =
      "NONE",

    confidence =
      0,

    decision =
      null,

    response =
      null,

    execution =
      null,

    error =
      null,

    requestState =
      null,

  } =
    safeObject(
      options
    );


  return {

    type:
      safeString(
        type
      ) ||
      ASSISTANT_RESPONSE_TYPES.MESSAGE,

    reply:
      safeString(
        reply
      ),

    action:
      safeString(
        action
      ) ||
      "NONE",

    confidence:
      Math.max(
        0,
        Math.min(
          1,
          safeNumber(
            confidence,
            0
          )
        )
      ),

    decision:
      decision
        ? createRouterDecision(
            decision
          )
        : null,

    response:
      response
        ? createAssistantResponse(
            response
          )
        : null,

    execution:
      execution
        ? createExecutionPlan(
            execution
          )
        : null,

    error:
      error
        ? createAssistantError(
            error
          )
        : null,

    requestState:
      requestState
        ? createRequestState(
            requestState
          )
        : null,

  };

}


/* =========================================================
   TYPE GUARDS
========================================================= */

/*
 * These functions make runtime checks easy.
 */

export function isUserMessage(
  message
) {

  return Boolean(
    message &&
    message.role ===
      ASSISTANT_MESSAGE_ROLES.USER
  );

}


export function isAssistantMessage(
  message
) {

  return Boolean(
    message &&
    message.role ===
      ASSISTANT_MESSAGE_ROLES.ASSISTANT
  );

}


export function isNavigationDecision(
  decision
) {

  if (
    !decision
  ) {

    return false;

  }


  return (
    decision.type ===
      ASSISTANT_ROUTER_TYPES.NAVIGATE ||
    decision.type ===
      ASSISTANT_ROUTER_TYPES.GO_BACK ||
    decision.type ===
      ASSISTANT_ROUTER_TYPES.CONFIRM
  );

}


export function isCurrentPageDecision(
  decision
) {

  return Boolean(
    decision &&
    decision.type ===
      ASSISTANT_ROUTER_TYPES.CURRENT_PAGE
  );

}


export function isAiDecision(
  decision
) {

  return Boolean(
    decision &&
    decision.type ===
      ASSISTANT_ROUTER_TYPES.ASK_AI
  );

}


export function isErrorResult(
  result
) {

  return Boolean(
    result &&
    (
      result.type ===
        ASSISTANT_RESPONSE_TYPES.ERROR ||
      result.error
    )
  );

}


/* =========================================================
   VALIDATION
========================================================= */

/*
 * Validate an assistant message.
 */

export function validateAssistantMessage(
  message
) {

  const errors = [];


  if (
    !message ||
    typeof message !==
      "object"
  ) {

    return {

      valid:
        false,

      errors: [
        "Message must be an object.",
      ],

    };

  }


  if (
    !message.id
  ) {

    errors.push(
      "Message is missing id."
    );

  }


  if (
    !message.role ||
    (
      message.role !==
        ASSISTANT_MESSAGE_ROLES.USER &&
      message.role !==
        ASSISTANT_MESSAGE_ROLES.ASSISTANT
    )
  ) {

    errors.push(
      "Message has an invalid role."
    );

  }


  if (
    typeof message.content !==
    "string"
  ) {

    errors.push(
      "Message content must be a string."
    );

  }


  return {

    valid:
      errors.length ===
      0,

    errors,

  };

}


/*
 * Validate a router decision.
 */

export function validateRouterDecision(
  decision
) {

  const errors = [];


  if (
    !decision ||
    typeof decision !==
      "object"
  ) {

    return {

      valid:
        false,

      errors: [
        "Decision must be an object.",
      ],

    };

  }


  if (
    !decision.type
  ) {

    errors.push(
      "Decision is missing type."
    );

  }


  if (
    !decision.action
  ) {

    errors.push(
      "Decision is missing action."
    );

  }


  if (
    typeof decision.confidence !==
    "number"
  ) {

    errors.push(
      "Decision confidence must be a number."
    );

  } else if (
    decision.confidence <
      0 ||
    decision.confidence >
      1
  ) {

    errors.push(
      "Decision confidence must be between 0 and 1."
    );

  }


  return {

    valid:
      errors.length ===
      0,

    errors,

  };

}


/* =========================================================
   STRING UTILITIES
========================================================= */

function uniqueStrings(
  values
) {

  return [
    ...new Set(
      safeArray(
        values
      )
        .map(
          value =>
            safeString(
              value
            )
        )
        .filter(
          Boolean
        )
    ),
  ];

}


/* =========================================================
   DEBUG SUMMARY
========================================================= */

export function summarizeAssistantResult(
  result
) {

  if (
    !result
  ) {

    return "No assistant result.";

  }


  return [

    `type=${result.type || "UNKNOWN"}`,

    `action=${result.action || "NONE"}`,

    `confidence=${result.confidence ?? 0}`,

    `hasReply=${Boolean(
      result.reply
    )}`,

    `hasError=${Boolean(
      result.error
    )}`,

  ].join(
    " | "
  );

}


/* =========================================================
   DEBUG SUMMARY — DECISION
========================================================= */

export function summarizeRouterDecision(
  decision
) {

  if (
    !decision
  ) {

    return "No router decision.";

  }


  return [

    `type=${decision.type || "NONE"}`,

    `action=${decision.action || "NONE"}`,

    `confidence=${decision.confidence ?? 0}`,

    `callAI=${Boolean(
      decision.shouldCallAI
    )}`,

    `navigate=${Boolean(
      decision.shouldNavigate
    )}`,

    `pending=${Boolean(
      decision.createPending
    )}`,

  ].join(
    " | "
  );

}


/* =========================================================
   TYPE BUNDLE
========================================================= */

export const ASSISTANT_TYPES = {

  ASSISTANT_MESSAGE_ROLES,

  ASSISTANT_ROUTER_TYPES,

  ASSISTANT_REQUEST_STATES,

  ASSISTANT_RESPONSE_TYPES,

  createAssistantMessage,

  createUserMessage,

  createAssistantReplyMessage,

  createMessageId,

  createIntent,

  normalizeBookingParams,

  createPendingAction,

  isPendingActionExpired,

  normalizeActionParams,

  createRouterDecision,

  createExecutionPlan,

  createAssistantRequest,

  createAssistantResponse,

  createServiceResult,

  createConversationContext,

  createRouteContext,

  createPageContext,

  createFarmerContext,

  normalizeCapabilities,

  createAssistantContext,

  normalizeMessageHistory,

  historyForAI,

  createAssistantError,

  createRequestState,

  createAssistantResult,

  isUserMessage,

  isAssistantMessage,

  isNavigationDecision,

  isCurrentPageDecision,

  isAiDecision,

  isErrorResult,

  validateAssistantMessage,

  validateRouterDecision,

  summarizeAssistantResult,

  summarizeRouterDecision,

};


/* =========================================================
   DEVELOPMENT VALIDATION
========================================================= */

if (
  typeof import.meta !==
    "undefined" &&
  import.meta.env?.DEV
) {

  const testMessage =
    createUserMessage(
      "open help"
    );


  const testIntent =
    createIntent({

      action:
        "OPEN_HELP",

      confidence:
        0.99,

    });


  const testDecision =
    createRouterDecision({

      type:
        ASSISTANT_ROUTER_TYPES.NAVIGATE,

      action:
        "OPEN_HELP",

      confidence:
        0.99,

      userText:
        "open help",

      shouldNavigate:
        true,

      shouldCallAI:
        false,

    });


  const messageValidation =
    validateAssistantMessage(
      testMessage
    );


  const decisionValidation =
    validateRouterDecision(
      testDecision
    );


  if (
    !messageValidation.valid
  ) {

    console.warn(
      "[KrishiSetu AI] Message type validation failed:",
      messageValidation.errors
    );

  }


  if (
    !decisionValidation.valid
  ) {

    console.warn(
      "[KrishiSetu AI] Router decision validation failed:",
      decisionValidation.errors
    );

  }


  console.debug(
    "[KrishiSetu AI] Types initialized.",
    {
      testMessage,
      testIntent,
      testDecision,
    }
  );

}