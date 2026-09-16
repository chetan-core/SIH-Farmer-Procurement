/* =========================================================
   KRISHISETU AI ASSISTANT SERVICE
=========================================================

   PURPOSE

   This module is the transport layer between the frontend
   assistant and the backend AI API.

   It does NOT:

   - render UI
   - navigate
   - speak
   - modify React state
   - execute bookings
   - decide routes
   - manipulate the DOM

   It DOES:

   - build the request
   - preserve rich farmer context
   - preserve booking state
   - call /api/assistant
   - handle timeout / abort / network errors
   - normalize backend responses
========================================================= */


/* =========================================================
   CONFIGURATION
========================================================= */

const DEFAULT_API_URL =
  "http://localhost:5000/api";


const API_URL =
  import.meta.env.VITE_API_URL ||
  DEFAULT_API_URL;


const ASSISTANT_ENDPOINT =
  `${API_URL}/assistant`;


const DEFAULT_TIMEOUT =
  30000;


const MAX_HISTORY_MESSAGES =
  20;


/* =========================================================
   TEXT HELPERS
========================================================= */

function cleanText(
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


/* =========================================================
   HISTORY SANITIZATION
========================================================= */

function sanitizeHistory(
  history
) {

  if (
    !Array.isArray(
      history
    )
  ) {

    return [];

  }


  return history
    .filter(
      item => {

        if (
          !item ||
          (
            item.role !==
              "user" &&
            item.role !==
              "assistant"
          )
        ) {

          return false;

        }


        return Boolean(
          cleanText(
            item.content
          )
        );

      }
    )
    .slice(
      -MAX_HISTORY_MESSAGES
    )
    .map(
      item => {

        const result = {

          role:
            item.role,

          content:
            cleanText(
              item.content
            ),

        };


        if (
          item.action
        ) {

          result.action =
            cleanText(
              item.action
            );

        }


        if (
          item.semanticTopic
        ) {

          result.semanticTopic =
            cleanText(
              item.semanticTopic
            );

        }


        return result;

      }
    );

}


/* =========================================================
   SAFE OBJECT CLONE
========================================================= */

function sanitizePlainObject(
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

    return null;

  }


  /*
   * Context has already been built by
   * assistantContext.js.
   *
   * We intentionally preserve its structure.
   *
   * JSON serialization below removes anything that
   * cannot safely travel over the API boundary.
   */

  try {

    return JSON.parse(
      JSON.stringify(
        value
      )
    );

  } catch {

    return null;

  }

}


/* =========================================================
   CONTEXT SANITIZATION
========================================================= */

function sanitizeContext(
  context
) {

  return sanitizePlainObject(
    context
  );

}


/* =========================================================
   ERROR CLASS
========================================================= */

export class AssistantServiceError
  extends Error {

  constructor(
    message,
    options = {}
  ) {

    super(
      message
    );


    this.name =
      "AssistantServiceError";


    this.code =
      options.code ||
      "ASSISTANT_SERVICE_ERROR";


    this.status =
      options.status ??
      null;


    this.cause =
      options.cause ||
      null;


    this.response =
      options.response ||
      null;

  }

}


/* =========================================================
   ERROR CODES
========================================================= */

export const SERVICE_ERROR_CODES = {

  NETWORK:
    "NETWORK_ERROR",

  TIMEOUT:
    "TIMEOUT",

  ABORTED:
    "ABORTED",

  HTTP:
    "HTTP_ERROR",

  INVALID_RESPONSE:
    "INVALID_RESPONSE",

  JSON:
    "INVALID_JSON",

  UNKNOWN:
    "UNKNOWN_ERROR",

};


/* =========================================================
   ENDPOINT
========================================================= */

export function getAssistantEndpoint() {

  return ASSISTANT_ENDPOINT;

}


/* =========================================================
   TIMEOUT / ABORT CONTROLLER
========================================================= */

function createTimeoutSignal(
  timeout,
  externalSignal
) {

  const controller =
    new AbortController();


  let timer =
    null;


  if (
    Number.isFinite(
      timeout
    ) &&
    timeout > 0
  ) {

    timer =
      setTimeout(
        () => {

          controller.abort(
            "krishisetu-timeout"
          );

        },
        timeout
      );

  }


  let removeExternalListener =
    null;


  if (
    externalSignal
  ) {

    if (
      externalSignal.aborted
    ) {

      controller.abort(
        externalSignal.reason
      );

    } else {

      const handleAbort =
        () => {

          controller.abort(
            externalSignal.reason
          );

        };


      externalSignal.addEventListener(
        "abort",
        handleAbort,
        {
          once:
            true,
        }
      );


      removeExternalListener =
        () => {

          externalSignal.removeEventListener(
            "abort",
            handleAbort
          );

        };

    }

  }


  return {

    signal:
      controller.signal,

    cleanup: () => {

      if (
        timer
      ) {

        clearTimeout(
          timer
        );

      }


      if (
        removeExternalListener
      ) {

        removeExternalListener();

      }

    },

  };

}


/* =========================================================
   REQUEST BODY
========================================================= */

export function buildAssistantRequestBody(
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

    bookingState =
      null,

    bookingDraft =
      null,

    semanticTopic =
      null,

    decision =
      null,

  } =
    options;


  const cleanHistory =
    sanitizeHistory(
      history
    );


  const safeContext =
    sanitizeContext(
      context
    );


  const safeBookingState =
    sanitizePlainObject(
      bookingState
    );


  const safeBookingDraft =
    sanitizePlainObject(
      bookingDraft
    );


  const safeDecision =
    sanitizePlainObject(
      decision
    );


  return {

    /*
     * Primary message.
     */

    text:
      cleanText(
        text
      ),


    /*
     * Language.
     */

    language:
      cleanText(
        language
      ) ||
      "en",


    /*
     * Current frontend route.
     */

    currentPath:
      cleanText(
        currentPath
      ),


    currentPage:
      cleanText(
        currentPage
      ),


    /*
     * Existing farmer identity fields.
     */

    farmerId:
      cleanText(
        farmerId
      ),


    phone:
      cleanText(
        phone
      ),


    /*
     * Conversation history.
     */

    history:
      cleanHistory,


    /*
     * Rich farmer/application context.
     *
     * This contains information such as:
     *
     * - crops
     * - bookings
     * - latest token
     * - payments
     * - booking history
     * - current references
     *
     * assistantContext.js is responsible for building it.
     */

    context:
      safeContext,


    /*
     * Active booking conversation state.
     *
     * Keeping these as top-level fields makes the API
     * contract easier to inspect and allows older backend
     * code to ignore them safely.
     */

    bookingState:
      safeBookingState,

    bookingDraft:
      safeBookingDraft,


    /*
     * Local semantic classification.
     *
     * Examples:
     *
     * crops
     * booking
     * booking-centers
     * booking-dates
     * booking-timings
     * token
     * history
     * payments
     * qr
     * receipt
     * cancellation
     */

    semanticTopic:
      cleanText(
        semanticTopic
      ) ||
      null,


    /*
     * Frontend routing decision, when available.
     *
     * This is informational context for the backend.
     * The backend must not blindly override local routing.
     */

    decision:
      safeDecision,

  };

}


/* =========================================================
   RESPONSE VALIDATION
========================================================= */

function validateResponseObject(
  data
) {

  if (
    !data ||
    typeof data !==
      "object" ||
    Array.isArray(
      data
    )
  ) {

    throw new AssistantServiceError(

      "Assistant returned an invalid response object.",

      {

        code:
          SERVICE_ERROR_CODES.INVALID_RESPONSE,

      }

    );

  }


  return data;

}


/* =========================================================
   RESPONSE NORMALIZATION
========================================================= */

export function normalizeAssistantResponse(
  data
) {

  const response =
    validateResponseObject(
      data
    );


  const reply =
    cleanText(
      response.reply
    );


  const action =
    typeof response.action ===
      "string"
      ? response.action
          .trim()
          .toUpperCase()
      : "NONE";


  /*
   * Accept the naming used by several backend versions.
   */

  const explicitNavigation =
    Boolean(
      response.explicitNavigation
    ) ||
    Boolean(
      response.navigate
    ) ||
    Boolean(
      response.shouldNavigate
    );


  const confidenceValue =
    Number(
      response.confidence
    );


  const confidence =
    Number.isFinite(
      confidenceValue
    )
      ? Math.max(
          0,
          Math.min(
            1,
            confidenceValue
          )
        )
      : 0;


  /*
   * Preserve booking-related information.
   */

  const booking =
    sanitizePlainObject(
      response.booking
    );


  const params =
    sanitizePlainObject(
      response.params
    );


  /*
   * Backend semantic information.
   */

  const semanticTopic =
    cleanText(
      response.semanticTopic
    ) ||
    null;


  /*
   * Some backend implementations may return
   * a conversational state directly.
   */

  const bookingState =
    sanitizePlainObject(
      response.bookingState
    );


  const bookingDraft =
    sanitizePlainObject(
      response.bookingDraft
    );


  /*
   * Confirmation / execution flags.
   */

  const continueBooking =
    Boolean(
      response.continueBooking
    );


  const executeBooking =
    Boolean(
      response.executeBooking
    );


  const cancelBooking =
    Boolean(
      response.cancelBooking
    );


  const requiresBookingController =
    Boolean(
      response.requiresBookingController
    );


  return {

    reply,

    action,

    confidence,

    explicitNavigation,

    navigate:
      explicitNavigation,

    shouldNavigate:
      explicitNavigation,


    semanticTopic,

    booking,

    bookingState,

    bookingDraft,

    params,


    continueBooking,

    executeBooking,

    cancelBooking,

    requiresBookingController,


    metadata:
      response.metadata ||
      null,


    usage:
      response.usage ||
      null,


    model:
      response.model ||
      null,


    requestId:
      response.requestId ||
      null,


    raw:
      response,

  };

}


/* =========================================================
   HTTP ERROR MESSAGE
========================================================= */

async function extractErrorMessage(
  response
) {

  /*
   * Clone first so we do not consume the original
   * response body unnecessarily.
   */

  try {

    const clone =
      response.clone();


    const data =
      await clone.json();


    if (
      data?.message
    ) {

      return cleanText(
        data.message
      );

    }


    if (
      typeof data?.error ===
        "string"
    ) {

      return cleanText(
        data.error
      );

    }


    if (
      data?.error?.message
    ) {

      return cleanText(
        data.error.message
      );

    }

  } catch {
  }


  try {

    const text =
      await response.text();


    if (
      text
    ) {

      return cleanText(
        text
      );

    }

  } catch {
  }


  return "";

}


/* =========================================================
   NETWORK ERROR DETECTION
========================================================= */

export function isNetworkError(
  error
) {

  if (
    !error
  ) {

    return false;

  }


  if (
    error instanceof
      AssistantServiceError
  ) {

    return (
      error.code ===
      SERVICE_ERROR_CODES.NETWORK
    );

  }


  if (
    error instanceof
      TypeError
  ) {

    return true;

  }


  const name =
    String(
      error.name ||
      ""
    )
      .toLowerCase();


  const message =
    String(
      error.message ||
      ""
    )
      .toLowerCase();


  return (

    name.includes(
      "network"
    ) ||

    message.includes(
      "network"
    ) ||

    message.includes(
      "failed to fetch"
    ) ||

    message.includes(
      "load failed"
    ) ||

    message.includes(
      "connection refused"
    )

  );

}


/* =========================================================
   TIMEOUT ERROR DETECTION
========================================================= */

export function isTimeoutError(
  error
) {

  if (
    !error
  ) {

    return false;

  }


  if (
    error instanceof
      AssistantServiceError
  ) {

    return (
      error.code ===
      SERVICE_ERROR_CODES.TIMEOUT
    );

  }


  const message =
    String(
      error.message ||
      ""
    )
      .toLowerCase();


  return (

    message.includes(
      "timeout"
    ) ||

    message.includes(
      "timed out"
    ) ||

    message.includes(
      "krishisetu-timeout"
    )

  );

}


/* =========================================================
   ABORT ERROR DETECTION
========================================================= */

export function isAbortedError(
  error
) {

  if (
    !error
  ) {

    return false;

  }


  if (
    error instanceof
      AssistantServiceError
  ) {

    return (
      error.code ===
      SERVICE_ERROR_CODES.ABORTED
    );

  }


  const name =
    String(
      error.name ||
      ""
    )
      .toLowerCase();


  return (

    name ===
      "aborterror" ||

    name ===
      "aborted"

  );

}


/* =========================================================
   LOCALIZED SERVICE ERROR
========================================================= */

export function getServiceErrorMessage(
  error,
  language = "en"
) {

  if (
    isTimeoutError(
      error
    )
  ) {

    if (
      language ===
      "hi"
    ) {

      return "सहायक को जवाब देने में बहुत समय लग रहा है। कृपया फिर से कोशिश करें।";

    }


    if (
      language ===
      "te"
    ) {

      return "అసిస్టెంట్ స్పందించడానికి ఎక్కువ సమయం పడుతోంది. దయచేసి మళ్లీ ప్రయత్నించండి.";

    }


    return "The assistant is taking too long to respond. Please try again.";

  }


  if (
    isAbortedError(
      error
    )
  ) {

    if (
      language ===
      "hi"
    ) {

      return "अनुरोध रोक दिया गया। आप फिर से कोशिश कर सकते हैं।";

    }


    if (
      language ===
      "te"
    ) {

      return "అభ్యర్థన ఆపబడింది. మీరు మళ్లీ ప్రయత్నించవచ్చు.";

    }


    return "The request was stopped. You can try again.";

  }


  if (
    isNetworkError(
      error
    )
  ) {

    if (
      language ===
      "hi"
    ) {

      return "AI सेवा से कनेक्ट नहीं हो पा रहा है। कृपया कुछ देर बाद फिर कोशिश करें।";

    }


    if (
      language ===
      "te"
    ) {

      return "AI సేవకు కనెక్ట్ కాలేకపోతున్నాము. కొద్దిసేపటి తర్వాత మళ్లీ ప్రయత్నించండి.";

    }


    return "I can’t connect to the AI service right now. Please try again in a moment.";

  }


  if (
    language ===
    "hi"
  ) {

    return "सहायक सेवा में एक समस्या आ गई। कृपया फिर से कोशिश करें।";

  }


  if (
    language ===
    "te"
  ) {

    return "అసిస్టెంట్ సేవలో సమస్య వచ్చింది. దయచేసి మళ్లీ ప్రయత్నించండి.";

  }


  return "Something went wrong with the assistant service. Please try again.";

}


/* =========================================================
   SEND REQUEST
========================================================= */

export async function askAssistantService(
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

    bookingState =
      null,

    bookingDraft =
      null,

    semanticTopic =
      null,

    decision =
      null,

    signal =
      null,

    timeout =
      DEFAULT_TIMEOUT,

  } =
    options;


  const cleanedText =
    cleanText(
      text
    );


  if (
    !cleanedText
  ) {

    throw new AssistantServiceError(

      "Assistant message is empty.",

      {

        code:
          SERVICE_ERROR_CODES.INVALID_RESPONSE,

      }

    );

  }


  const requestBody =
    buildAssistantRequestBody({

      text:
        cleanedText,

      language,

      currentPath,

      currentPage,

      farmerId,

      phone,

      history,

      context,

      bookingState,

      bookingDraft,

      semanticTopic,

      decision,

    });


  const {

    signal:
      requestSignal,

    cleanup,

  } =
    createTimeoutSignal(
      timeout,
      signal
    );


  try {

    const response =
      await fetch(
        ASSISTANT_ENDPOINT,
        {

          method:
            "POST",

          headers: {

            "Content-Type":
              "application/json",

            Accept:
              "application/json",

          },

          body:
            JSON.stringify(
              requestBody
            ),

          signal:
            requestSignal,

        }
      );


    if (
      !response.ok
    ) {

      const serverMessage =
        await extractErrorMessage(
          response
        );


      throw new AssistantServiceError(

        serverMessage ||
          `Assistant returned HTTP ${response.status}.`,

        {

          code:
            SERVICE_ERROR_CODES.HTTP,

          status:
            response.status,

          response,

        }

      );

    }


    let data;


    try {

      data =
        await response.json();

    } catch (
      parseError
    ) {

      throw new AssistantServiceError(

        "Assistant returned invalid JSON.",

        {

          code:
            SERVICE_ERROR_CODES.JSON,

          cause:
            parseError,

        }

      );

    }


    return normalizeAssistantResponse(
      data
    );

  } catch (
    error
  ) {

    if (
      error instanceof
      AssistantServiceError
    ) {

      throw error;

    }


    /*
     * Browser AbortController turns both timeout and
     * explicit cancellation into AbortError.
     *
     * Our own controller stores "krishisetu-timeout"
     * as the reason, which lets us distinguish them.
     */

    if (
      error?.name ===
      "AbortError"
    ) {

      const reason =
        String(
          requestSignal?.reason ||
          ""
        )
          .toLowerCase();


      const timedOut =
        reason.includes(
          "krishisetu-timeout"
        ) ||
        reason.includes(
          "timeout"
        );


      throw new AssistantServiceError(

        timedOut
          ? "Assistant request timed out."
          : "Assistant request was aborted.",

        {

          code:
            timedOut
              ? SERVICE_ERROR_CODES.TIMEOUT
              : SERVICE_ERROR_CODES.ABORTED,

          cause:
            error,

        }

      );

    }


    if (
      isTimeoutError(
        error
      )
    ) {

      throw new AssistantServiceError(

        "Assistant request timed out.",

        {

          code:
            SERVICE_ERROR_CODES.TIMEOUT,

          cause:
            error,

        }

      );

    }


    if (
      isNetworkError(
        error
      )
    ) {

      throw new AssistantServiceError(

        "Could not connect to the assistant service.",

        {

          code:
            SERVICE_ERROR_CODES.NETWORK,

          cause:
            error,

        }

      );

    }


    throw new AssistantServiceError(

      error?.message ||
        "Unknown assistant service error.",

      {

        code:
          SERVICE_ERROR_CODES.UNKNOWN,

        cause:
          error,

      }

    );

  } finally {

    cleanup();

  }

}


/* =========================================================
   HEALTH CHECK
========================================================= */

export async function checkAssistantHealth(
  options = {}
) {

  const {

    timeout =
      5000,

    signal =
      null,

  } =
    options;


  const healthEndpoint =
    `${API_URL}/health`;


  const {

    signal:
      requestSignal,

    cleanup,

  } =
    createTimeoutSignal(
      timeout,
      signal
    );


  try {

    const response =
      await fetch(
        healthEndpoint,
        {

          method:
            "GET",

          headers: {

            Accept:
              "application/json",

          },

          signal:
            requestSignal,

        }
      );


    return {

      online:
        response.ok,

      status:
        response.status,

    };

  } catch (
    error
  ) {

    return {

      online:
        false,

      status:
        null,

      error,

    };

  } finally {

    cleanup();

  }

}


/* =========================================================
   REQUEST PREVIEW
========================================================= */

export function createAssistantRequestPreview(
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

    bookingState =
      null,

    bookingDraft =
      null,

    semanticTopic =
      null,

    decision =
      null,

  } =
    options;


  return {

    endpoint:
      ASSISTANT_ENDPOINT,

    method:
      "POST",

    headers: {

      "Content-Type":
        "application/json",

      Accept:
        "application/json",

    },

    body:
      buildAssistantRequestBody({

        text,

        language,

        currentPath,

        currentPage,

        farmerId,

        phone,

        history,

        context,

        bookingState,

        bookingDraft,

        semanticTopic,

        decision,

      }),

  };

}


/* =========================================================
   SERVICE INFO
========================================================= */

export function getAssistantServiceInfo() {

  return {

    endpoint:
      ASSISTANT_ENDPOINT,

    method:
      "POST",

    timeout:
      DEFAULT_TIMEOUT,

    maxHistory:
      MAX_HISTORY_MESSAGES,

  };

}


/* =========================================================
   SERVICE OBJECT
========================================================= */

export const assistantService = {

  ask:
    askAssistantService,

  health:
    checkAssistantHealth,

  preview:
    createAssistantRequestPreview,

  normalizeResponse:
    normalizeAssistantResponse,

  buildRequestBody:
    buildAssistantRequestBody,

  endpoint:
    getAssistantEndpoint,

  info:
    getAssistantServiceInfo,

};


/* =========================================================
   DEVELOPMENT CHECK
========================================================= */

if (
  typeof import.meta !==
    "undefined" &&
  import.meta.env?.DEV
) {

  console.debug(
    "[KrishiSetu AI] Assistant service initialized:",
    ASSISTANT_ENDPOINT
  );

}


/* =========================================================
   DEFAULT EXPORT
========================================================= */

export default assistantService;