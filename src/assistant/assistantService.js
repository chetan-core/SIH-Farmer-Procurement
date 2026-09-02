/* =========================================================
   KRISHISETU AI ASSISTANT SERVICE
=========================================================

   PURPOSE

   This module is the ONLY layer responsible for communicating
   with the backend AI assistant API.

   Architecture:

        VoiceAssistant
              ↓
        assistantRouter
              ↓
        assistantController
              ↓
        assistantService
              ↓
        /api/assistant
              ↓
        Backend AI


   IMPORTANT

   This module does NOT:

   - render UI
   - navigate
   - update React state
   - speak
   - decide browser routes
   - manipulate DOM
   - interpret natural language locally

   Its job is simply:

   1. Build the request.
   2. Send it to the backend.
   3. Parse the response.
   4. Normalize the response.
   5. Detect network/timeout/abort failures.
   6. Return a predictable result.

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


/*
 * Default request timeout.
 *
 * The backend should normally answer much faster,
 * but a generous timeout prevents the UI from hanging
 * forever when the backend becomes unavailable.
 */

const DEFAULT_TIMEOUT =
  30000;


/*
 * Maximum number of messages allowed in the payload.
 *
 * The UI already limits history, but this service adds
 * another safety layer.
 */

const MAX_HISTORY_MESSAGES =
  20;


/*
 * Maximum context JSON size is intentionally not enforced
 * byte-for-byte here because JSON string length is only an
 * approximation.
 *
 * Instead we sanitize the major fields before transmission.
 */


/* =========================================================
   TEXT HELPERS
========================================================= */

function cleanText(
  value
) {

  return String(
    value || ""
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
      item =>
        item &&
        (
          item.role ===
            "user" ||
          item.role ===
            "assistant"
        ) &&
        cleanText(
          item.content
        )
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


        /*
         * Preserve action metadata when available.
         *
         * The backend may use this to understand what
         * happened immediately before the current request.
         */

        if (
          item.action
        ) {

          result.action =
            String(
              item.action
            );

        }


        return result;

      }
    );

}


/* =========================================================
   CONTEXT SANITIZATION
========================================================= */

function sanitizeContext(
  context
) {

  if (
    !context ||
    typeof context !==
      "object"
  ) {

    return null;

  }


  /*
   * Context is already assembled by assistantContext.js.
   *
   * We intentionally preserve its structure rather than
   * rebuilding it here.
   */

  return context;

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
   REQUEST URL
========================================================= */

export function getAssistantEndpoint() {

  return ASSISTANT_ENDPOINT;

}


/* =========================================================
   ABORT / TIMEOUT
========================================================= */

function createTimeoutSignal(
  timeout,
  externalSignal
) {

  /*
   * Modern browsers support AbortSignal.timeout(),
   * but using an AbortController manually gives us
   * better compatibility and explicit cleanup.
   */

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
      window.setTimeout(
        () => {

          controller.abort(
            "timeout"
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

        window.clearTimeout(
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

  } =
    options;


  const cleanHistory =
    sanitizeHistory(
      history
    );


  return {

    /*
     * Primary user message.
     */

    text:
      cleanText(
        text
      ),


    /*
     * Current UI language.
     */

    language:
      cleanText(
        language
      ) ||
      "en",


    /*
     * Route information.
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
     * Farmer identity.
     *
     * These values are passed only because your current
     * application already uses them.
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
     * Rich assistant context.
     */

    context:
      sanitizeContext(
        context
      ),

  };

}


/* =========================================================
   RESPONSE JSON VALIDATION
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


  /*
   * Normalize reply.
   */

  const reply =
    cleanText(
      response.reply
    );


  /*
   * Normalize action.
   */

  const action =
    typeof response.action ===
      "string"
      ? response.action
          .trim()
          .toUpperCase()
      : "NONE";


  /*
   * Normalize navigation flag.
   *
   * Different backend versions may use:
   *
   * explicitNavigation
   * navigate
   * shouldNavigate
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


  /*
   * Normalize confidence.
   */

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
   * Preserve the backend response,
   * but expose a predictable shape.
   */

  return {

    reply,

    action,

    confidence,

    explicitNavigation,

    navigate:
      explicitNavigation,

    shouldNavigate:
      explicitNavigation,


    /*
     * Preserve possible semantic information.
     */

    semanticTopic:
      response.semanticTopic ||
      null,


    booking:
      response.booking ||
      null,


    params:
      response.params ||
      null,


    /*
     * Preserve backend metadata if present.
     */

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


    /*
     * Keep the original response available for
     * debugging and future features.
     */

    raw:
      response,

  };

}


/* =========================================================
   HTTP ERROR
========================================================= */

async function extractErrorMessage(
  response
) {

  /*
   * Try JSON first.
   */

  try {

    const data =
      await response.json();


    if (
      data?.message
    ) {

      return cleanText(
        data.message
      );

    }


    if (
      data?.error
    ) {

      if (
        typeof data.error ===
          "string"
      ) {

        return cleanText(
          data.error
        );

      }


      if (
        data.error.message
      ) {

        return cleanText(
          data.error.message
        );

      }

    }

  } catch {
  }


  /*
   * Fall back to text.
   */

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

    /*
     * fetch() commonly produces TypeError when
     * a network request cannot be completed.
     */

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
   SERVICE ERROR MESSAGE
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


    /*
     * HTTP error.
     */

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

        }

      );

    }


    /*
     * Parse JSON.
     */

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


    /*
     * Normalize response.
     */

    return normalizeAssistantResponse(
      data
    );

  } catch (
    error
  ) {

    /*
     * Already normalized service errors should
     * simply pass through.
     */

    if (
      error instanceof
      AssistantServiceError
    ) {

      throw error;

    }


    /*
     * Browser abort.
     */

    if (
      error?.name ===
      "AbortError"
    ) {

      /*
       * Determine whether this was our timeout
       * or an external AbortController.
       */

      const message =
        String(
          error?.message ||
          ""
        )
          .toLowerCase();


      const likelyTimeout =
        message.includes(
          "timeout"
        );


      throw new AssistantServiceError(

        likelyTimeout
          ? "Assistant request timed out."
          : "Assistant request was aborted.",

        {

          code:
            likelyTimeout
              ? SERVICE_ERROR_CODES.TIMEOUT
              : SERVICE_ERROR_CODES.ABORTED,

          cause:
            error,

        }

      );

    }


    /*
     * Network failure.
     */

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


    /*
     * Unknown failure.
     */

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

/*
 * Optional helper for future connection indicators.
 *
 * This does NOT affect assistant operation.
 *
 * It simply checks whether the API server responds.
 */

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

/*
 * Useful during development.
 *
 * It allows you to inspect exactly what the frontend will
 * send without actually sending a request.
 */

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

      }),

  };

}


/* =========================================================
   SERVICE DESCRIPTION
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