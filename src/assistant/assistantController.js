/* =========================================================
   KRISHISETU AI ASSISTANT CONTROLLER
=========================================================

   PURPOSE

   This is the orchestration layer of the KrishiSetu AI.

   It connects:

        VoiceAssistant.jsx
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
              ↓
        assistantRouter
              ↓
        assistantExecutor
              ↓
        WEBSITE

   IMPORTANT

   This file does NOT:

   - render UI
   - directly manipulate React state
   - contain page-specific JSX
   - contain speech-recognition logic
   - contain speech-synthesis logic
   - perform arbitrary DOM operations itself

   It DOES:

   - receive user commands
   - construct context
   - ask the local router what the user intends
   - handle pending actions
   - call the backend when necessary
   - validate backend actions
   - merge local + backend decisions
   - construct execution plans
   - execute approved actions
   - return a predictable result to VoiceAssistant

========================================================= */


/* =========================================================
   IMPORTS
========================================================= */

import {
  ACTIONS,
} from "./assistantActions";


import {
  buildAssistantContext,
  buildServerAssistantContext,
  validateActionForContext,
} from "./assistantContext";


import {
  assistantRouter,
  routeAssistantCommand,
  mergeBackendDecision,
  getExecutionPlan,
  loadPendingAction,
  savePendingAction,
  clearPendingAction,
} from "./assistantRouter";


import {
  assistantService,
} from "./assistantService";


import {
  assistantExecutor,
} from "./assistantExecutor";


import {
  cleanText,
  normalizeLanguageCode,
  sanitizeActionParams,
  getStoredFarmer,
  debugLog,
} from "./assistantUtils";


/* =========================================================
   CONTROLLER TYPES
========================================================= */

export const CONTROLLER_TYPES = {

  LOCAL:
    "LOCAL",

  AI:
    "AI",

  NAVIGATION:
    "NAVIGATION",

  CONFIRMATION:
    "CONFIRMATION",

  CANCELLATION:
    "CANCELLATION",

  CURRENT_PAGE:
    "CURRENT_PAGE",

  ERROR:
    "ERROR",

  NONE:
    "NONE",

};


/* =========================================================
   CONTROLLER STATUS
========================================================= */

export const CONTROLLER_STATUS = {

  SUCCESS:
    "SUCCESS",

  FAILED:
    "FAILED",

  PENDING:
    "PENDING",

  CANCELLED:
    "CANCELLED",

  SKIPPED:
    "SKIPPED",

};


/* =========================================================
   DEFAULTS
========================================================= */

const DEFAULT_LANGUAGE =
  "en";


const DEFAULT_PATH =
  "/";


/* =========================================================
   RESULT HELPERS
========================================================= */

function controllerResult(
  type,
  status,
  extras = {}
) {

  return {

    type,

    status,

    success:
      status ===
      CONTROLLER_STATUS.SUCCESS,

    ...extras,

  };

}


/* =========================================================
   NORMALIZATION
========================================================= */

function normalizeOptions(
  options = {}
) {

  const {

    currentPath =
      DEFAULT_PATH,

    language =
      DEFAULT_LANGUAGE,

    history =
      [],

    message =
      "",

    pendingAction =
      undefined,

    navigate =
      null,

  } =
    options;


  return {

    currentPath:
      String(
        currentPath ||
        DEFAULT_PATH
      ),

    language:
      normalizeLanguageCode(
        language
      ),

    history:
      Array.isArray(
        history
      )
        ? history
        : [],

    message:
      cleanText(
        message
      ),

    pendingAction,

    navigate,

  };

}


/* =========================================================
   PENDING ACTION HELPERS
========================================================= */

function getEffectivePendingAction(
  explicitPending
) {

  if (
    explicitPending !==
    undefined
  ) {

    return explicitPending;

  }


  return loadPendingAction();

}


/* =========================================================
   PENDING ACTION CREATION
========================================================= */

function persistPendingFromDecision(
  decision
) {

  if (
    !decision?.createPending
  ) {

    return null;

  }


  const pending =
    decision.pendingAction;


  if (
    !pending
  ) {

    return null;

  }


  savePendingAction(
    pending
  );


  return pending;

}


/* =========================================================
   CURRENT PAGE RESPONSE
========================================================= */

function buildCurrentPageResult(
  decision
) {

  return controllerResult(

    CONTROLLER_TYPES.CURRENT_PAGE,

    CONTROLLER_STATUS.SUCCESS,

    {

      decision,

      reply:
        decision.reply ||
        "",

      action:
        "SHOW_CURRENT_PAGE",

      shouldNavigate:
        false,

      shouldCallAI:
        false,

      execution:
        null,

    }

  );

}


/* =========================================================
   CANCELLATION
========================================================= */

function buildCancellationResult(
  decision
) {

  if (
    decision?.clearPending
  ) {

    clearPendingAction();

  }


  return controllerResult(

    CONTROLLER_TYPES.CANCELLATION,

    CONTROLLER_STATUS.CANCELLED,

    {

      decision,

      reply:
        decision.reply ||
        "",

      action:
        "NONE",

      shouldNavigate:
        false,

      shouldCallAI:
        false,

      execution:
        null,

    }

  );

}


/* =========================================================
   LOCAL DECISION EXECUTION
========================================================= */

async function executeLocalDecision(
  decision,
  options
) {

  if (
    !decision
  ) {

    return null;

  }


  const {

    navigate =
      null,

    currentPath =
      DEFAULT_PATH,

  } =
    options;


  /*
   * Current page information needs no executor.
   */

  if (
    decision.type ===
    "CURRENT_PAGE"
  ) {

    return buildCurrentPageResult(
      decision
    );

  }


  /*
   * Cancellation does not execute anything.
   */

  if (
    decision.type ===
    "CANCEL"
  ) {

    return buildCancellationResult(
      decision
    );

  }


  /*
   * Pending confirmation creates an execution plan.
   */

  if (
    decision.type ===
    "CONFIRM" ||
    decision.type ===
    "NAVIGATE" ||
    decision.type ===
    "GO_BACK"
  ) {

    const context =
      buildAssistantContext({

        pathname:
          currentPath,

        language:
          options.language,

        history:
          options.history,

        message:
          options.message,

      });


    const action =
      decision.action;


    const validation =
      validateActionForContext(
        action,
        context
      );


    if (
      !validation.valid
    ) {

      return controllerResult(

        CONTROLLER_TYPES.ERROR,

        CONTROLLER_STATUS.FAILED,

        {

          decision,

          action,

          reply:
            "This action cannot be performed here.",

          shouldNavigate:
            false,

          shouldCallAI:
            false,

          validation,

          execution:
            null,

        }

      );

    }


    if (
      decision.clearPending
    ) {

      clearPendingAction();

    }


    const plan =
      getExecutionPlan(
        decision
      );


    const execution =
      await assistantExecutor.execute(

        action,

        {

          navigate,

          currentPath,

          params:
            decision.params,

          booking:
            decision.params,

        }

      );


    const success =
      execution?.success !==
      false;


    return controllerResult(

      decision.type ===
        "GO_BACK"
        ? CONTROLLER_TYPES.NAVIGATION
        : decision.type ===
            "CONFIRM"
          ? CONTROLLER_TYPES.CONFIRMATION
          : CONTROLLER_TYPES.LOCAL,

      success
        ? CONTROLLER_STATUS.SUCCESS
        : CONTROLLER_STATUS.FAILED,

      {

        decision,

        action,

        reply:
          decision.reply ||
          "",

        shouldNavigate:
          decision.shouldNavigate !==
            false,

        shouldCallAI:
          false,

        execution,

        plan,

        validation,

      }

    );

  }


  return null;

}


/* =========================================================
   LOCAL ROUTING
========================================================= */

export function routeLocalCommand(
  message,
  options = {}
) {

  const normalized =
    normalizeOptions({

      ...options,

      message,

    });


  const pending =
    getEffectivePendingAction(
      normalized.pendingAction
    );


  const decision =
    routeAssistantCommand(

      normalized.message,

      {

        currentPath:
          normalized.currentPath,

        language:
          normalized.language,

        pendingAction:
          pending,

      }

    );


  return {

    decision,

    pending,

  };

}


/* =========================================================
   BUILD CONTEXT
========================================================= */

export function createControllerContext(
  options = {}
) {

  const normalized =
    normalizeOptions(
      options
    );


  const {

    currentPath,

    language,

    history,

    message,

    pendingAction,

  } =
    normalized;


  const pending =
    getEffectivePendingAction(
      pendingAction
    );


  const context =
    buildAssistantContext({

      pathname:
        currentPath,

      language,

      history,

      message,

      pendingAction:
        pending,

    });


  const serverContext =
    buildServerAssistantContext({

      pathname:
        currentPath,

      language,

      history,

      message,

      pendingAction:
        pending,

    });


  return {

    context,

    serverContext,

    pending,

  };

}


/* =========================================================
   BUILD BACKEND REQUEST
========================================================= */

export function createBackendRequest(
  options = {}
) {

  const normalized =
    normalizeOptions(
      options
    );


  const {

    currentPath,

    language,

    history,

    message,

  } =
    normalized;


  const farmer =
    getStoredFarmer();


  const {
    serverContext,
  } =
    createControllerContext(
      normalized
    );


  return {

    text:
      message,

    language,

    currentPath,

    currentPage:
      serverContext.currentPage,

    farmerId:
      farmer.farmerId,

    phone:
      farmer.phone,

    history,

    context:
      serverContext,

  };

}


/* =========================================================
   BACKEND REQUEST
========================================================= */

export async function requestAI(
  options = {}
) {

  const request =
    createBackendRequest(
      options
    );


  debugLog(
    "Controller → AI request",
    request
  );


  const response =
    await assistantService.ask(
      request
    );


  debugLog(
    "AI → Controller response",
    response
  );


  return response;

}


/* =========================================================
   BACKEND RESPONSE VALIDATION
========================================================= */

function validateBackendResponse(
  response
) {

  if (
    !response ||
    typeof response !==
      "object"
  ) {

    return {

      valid:
        false,

      reason:
        "Backend returned no usable response.",

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
   PROCESS BACKEND DECISION
========================================================= */

export function processBackendDecision(
  localDecision,
  backendResponse,
  options = {}
) {

  const normalized =
    normalizeOptions(
      options
    );


  const validation =
    validateBackendResponse(
      backendResponse
    );


  if (
    !validation.valid
  ) {

    return {

      decision:
        localDecision,

      validation,

    };

  }


  const merged =
    mergeBackendDecision(

      localDecision,

      backendResponse,

      {

        language:
          normalized.language,

        originalText:
          normalized.message,

      }

    );


  return {

    decision:
      merged,

    validation,

  };

}


/* =========================================================
   COMPLETE COMMAND
========================================================= */

export async function handleAssistantCommand(
  message,
  options = {}
) {

  const normalized =
    normalizeOptions({

      ...options,

      message,

    });


  const {

    currentPath,

    language,

    history,

    navigate,

  } =
    normalized;


  if (
    !normalized.message
  ) {

    return controllerResult(

      CONTROLLER_TYPES.NONE,

      CONTROLLER_STATUS.SKIPPED,

      {

        action:
          "NONE",

        reply:
          "",

        shouldCallAI:
          false,

        shouldNavigate:
          false,

      }

    );

  }


  /*
   * =======================================================
   * STEP 1
   *
   * Build context.
   * =======================================================
   */

  const contextBundle =
    createControllerContext({

      ...normalized,

      message:
        normalized.message,

    });


  /*
   * =======================================================
   * STEP 2
   *
   * Local router.
   * =======================================================
   */

  const local =
    routeLocalCommand(

      normalized.message,

      {

        currentPath,

        language,

        history,

        pendingAction:
          contextBundle.pending,

      }

    );


  const localDecision =
    local.decision;


  debugLog(
    "Controller local decision",
    localDecision
  );


  /*
   * =======================================================
   * STEP 3
   *
   * Persist newly created pending action.
   * =======================================================
   */

  const createdPending =
    persistPendingFromDecision(
      localDecision
    );


  if (
    createdPending
  ) {

    return controllerResult(

      CONTROLLER_TYPES.CONFIRMATION,

      CONTROLLER_STATUS.PENDING,

      {

        decision:
          localDecision,

        action:
          localDecision.action,

        reply:
          localDecision.reply ||
          "",

        params:
          sanitizeActionParams(
            localDecision.params
          ),

        shouldCallAI:
          false,

        shouldNavigate:
          false,

        pendingAction:
          createdPending,

        execution:
          null,

      }

    );

  }


  /*
   * =======================================================
   * STEP 4
   *
   * Local action already decided.
   *
   * This means:
   *
   * - navigation
   * - back
   * - confirmation
   * - cancellation
   * - current page
   *
   * should NOT hit the AI backend.
   * =======================================================
   */

  if (
    localDecision.type !==
    "ASK_AI"
  ) {

    return executeLocalDecision(

      localDecision,

      normalized

    );

  }


  /*
   * =======================================================
   * STEP 5
   *
   * Normal question → backend AI.
   * =======================================================
   */

  let backendResponse;


  try {

    backendResponse =
      await requestAI({

        ...normalized,

        message:
          normalized.message,

      });

  } catch (
    error
  ) {

    debugLog(
      "Controller AI request failed",
      error
    );


    return controllerResult(

      CONTROLLER_TYPES.ERROR,

      CONTROLLER_STATUS.FAILED,

      {

        decision:
          localDecision,

        action:
          "NONE",

        reply:
          null,

        shouldCallAI:
          true,

        shouldNavigate:
          false,

        error,

        execution:
          null,

      }

    );

  }


  /*
   * =======================================================
   * STEP 6
   *
   * Merge backend response with local decision.
   *
   * Local ASK_AI may become NAVIGATE only if the backend
   * explicitly requests navigation.
   * =======================================================
   */

  const {

    decision:
      finalDecision,

  } =
    processBackendDecision(

      localDecision,

      backendResponse,

      normalized

    );


  debugLog(
    "Controller final decision",
    finalDecision
  );


  /*
   * =======================================================
   * STEP 7
   *
   * Validate final action against current context.
   * =======================================================
   */

  if (
    finalDecision?.action &&
    finalDecision.action !==
      "NONE"
  ) {

    const finalContext =
      buildAssistantContext({

        pathname:
          currentPath,

        language,

        history,

        message:
          normalized.message,

      });


    const actionValidation =
      validateActionForContext(

        finalDecision.action,

        finalContext

      );


    if (
      !actionValidation.valid
    ) {

      return controllerResult(

        CONTROLLER_TYPES.AI,

        CONTROLLER_STATUS.SUCCESS,

        {

          decision: {

            ...finalDecision,

            action:
              "NONE",

            shouldNavigate:
              false,

          },

          action:
            "NONE",

          reply:
            backendResponse?.reply ||
            "",

          shouldCallAI:
            true,

          shouldNavigate:
            false,

          validation:
            actionValidation,

          execution:
            null,

        }

      );

    }

  }


  /*
   * =======================================================
   * STEP 8
   *
   * Backend produced no navigation.
   *
   * Return its conversational answer.
   * =======================================================
   */

  if (
    finalDecision?.action ===
      "NONE" ||
    !finalDecision?.shouldNavigate
  ) {

    return controllerResult(

      CONTROLLER_TYPES.AI,

      CONTROLLER_STATUS.SUCCESS,

      {

        decision:
          finalDecision,

        action:
          "NONE",

        reply:
          backendResponse?.reply ||
          "",

        shouldCallAI:
          true,

        shouldNavigate:
          false,

        semanticTopic:
          backendResponse?.semanticTopic ||
          null,

        booking:
          backendResponse?.booking ||
          null,

        execution:
          null,

      }

    );

  }


  /*
   * =======================================================
   * STEP 9
   *
   * Backend explicitly requested a valid navigation action.
   * Execute it.
   * =======================================================
   */

  const plan =
    getExecutionPlan(
      finalDecision
    );


  const execution =
    await assistantExecutor.execute(

      finalDecision.action,

      {

        navigate,

        currentPath,

        params:
          finalDecision.params ||
          backendResponse?.params ||
          backendResponse?.booking,

        booking:
          backendResponse?.booking,

      }

    );


  const executionSucceeded =
    execution?.success !==
    false;


  return controllerResult(

    executionSucceeded
      ? CONTROLLER_TYPES.NAVIGATION
      : CONTROLLER_TYPES.ERROR,

    executionSucceeded
      ? CONTROLLER_STATUS.SUCCESS
      : CONTROLLER_STATUS.FAILED,

    {

      decision:
        finalDecision,

      action:
        finalDecision.action,

      reply:
        finalDecision.reply ||
        backendResponse?.reply ||
        "",

      shouldCallAI:
        true,

      shouldNavigate:
        true,

      plan,

      execution,

      semanticTopic:
        backendResponse?.semanticTopic ||
        null,

      booking:
        backendResponse?.booking ||
        null,

    }

  );

}


/* =========================================================
   SIMPLE ASK API
========================================================= */

/*
 * This function is convenient for VoiceAssistant.jsx.
 *
 * It returns only the data the UI generally needs while
 * preserving the complete controller result.
 */

export async function askAssistant(
  message,
  options = {}
) {

  const result =
    await handleAssistantCommand(
      message,
      options
    );


  return result;

}


/* =========================================================
   EXECUTE EXISTING DECISION
========================================================= */

export async function executeDecision(
  decision,
  options = {}
) {

  const normalized =
    normalizeOptions(
      options
    );


  if (
    !decision
  ) {

    return controllerResult(

      CONTROLLER_TYPES.NONE,

      CONTROLLER_STATUS.SKIPPED,

      {

        action:
          "NONE",

        execution:
          null,

      }

    );

  }


  return executeLocalDecision(

    decision,

    normalized

  );

}


/* =========================================================
   CONFIRM PENDING ACTION
========================================================= */

export async function confirmPendingAction(
  options = {}
) {

  const pending =
    loadPendingAction();


  if (
    !pending
  ) {

    return controllerResult(

      CONTROLLER_TYPES.NONE,

      CONTROLLER_STATUS.SKIPPED,

      {

        action:
          "NONE",

        reply:
          "",

        reason:
          "No pending action exists.",

      }

    );

  }


  const decision = {

    type:
      "CONFIRM",

    action:
      pending.action,

    confidence:
      0.99,

    reply:
      null,

    userText:
      "yes",

    params:
      pending.booking ||
      pending.params ||
      null,

    pendingAction:
      pending,

    shouldCallAI:
      false,

    shouldNavigate:
      true,

    clearPending:
      true,

  };


  const normalized =
    normalizeOptions(
      options
    );


  return executeDecision(

    decision,

    normalized

  );

}


/* =========================================================
   CANCEL PENDING ACTION
========================================================= */

export function cancelPendingAction(
  options = {}
) {

  const pending =
    loadPendingAction();


  clearPendingAction();


  return controllerResult(

    CONTROLLER_TYPES.CANCELLATION,

    CONTROLLER_STATUS.CANCELLED,

    {

      action:
        "NONE",

      pendingAction:
        pending,

      reply:
        options.language ===
          "hi"
          ? "ठीक है, मैंने वह कार्रवाई रद्द कर दी।"
          : options.language ===
              "te"
            ? "సరే, ఆ చర్యను రద్దు చేశాను."
            : "Okay, I cancelled that action.",

    }

  );

}


/* =========================================================
   BUILD REQUEST PREVIEW
========================================================= */

export function previewAssistantRequest(
  message,
  options = {}
) {

  const normalized =
    normalizeOptions({

      ...options,

      message,

    });


  const local =
    routeLocalCommand(

      normalized.message,

      normalized

    );


  const request =
    createBackendRequest(
      normalized
    );


  return {

    localDecision:
      local.decision,

    pendingAction:
      local.pending,

    backendRequest:
      request,

  };

}


/* =========================================================
   GET CONTROLLER STATE
========================================================= */

export function getControllerState(
  options = {}
) {

  const normalized =
    normalizeOptions(
      options
    );


  const {
    context,
    serverContext,
    pending,
  } =
    createControllerContext(
      normalized
    );


  return {

    currentPath:
      normalized.currentPath,

    language:
      normalized.language,

    pendingAction:
      pending,

    context,

    serverContext,

  };

}


/* =========================================================
   CONTROLLER VALIDATION
========================================================= */

export function validateControllerAction(
  action,
  options = {}
) {

  const normalized =
    normalizeOptions(
      options
    );


  const context =
    buildAssistantContext({

      pathname:
        normalized.currentPath,

      language:
        normalized.language,

      history:
        normalized.history,

      message:
        normalized.message,

    });


  return validateActionForContext(

    action,

    context

  );

}


/* =========================================================
   CONTROLLER DESCRIPTION
========================================================= */

export function getControllerInfo() {

  return {

    name:
      "KrishiSetu AI Assistant Controller",

    architecture: [

      "VoiceAssistant",

      "assistantController",

      "assistantRouter",

      "assistantContext",

      "assistantService",

      "assistantExecutor",

    ],

    responsibilities: [

      "orchestrate assistant request",

      "route local commands",

      "manage pending actions",

      "call backend AI",

      "merge backend decisions",

      "validate actions",

      "execute approved actions",

    ],

  };

}


/* =========================================================
   CONTROLLER OBJECT
========================================================= */

export const assistantController = {

  ask:
    askAssistant,

  handle:
    handleAssistantCommand,

  routeLocal:
    routeLocalCommand,

  requestAI,

  createContext:
    createControllerContext,

  createBackendRequest,

  processBackendDecision,

  executeDecision,

  confirm:
    confirmPendingAction,

  cancel:
    cancelPendingAction,

  preview:
    previewAssistantRequest,

  state:
    getControllerState,

  validate:
    validateControllerAction,

  info:
    getControllerInfo,

  router:
    assistantRouter,

  service:
    assistantService,

  executor:
    assistantExecutor,

};


/* =========================================================
   DEVELOPMENT TESTS
========================================================= */

if (
  typeof import.meta !==
    "undefined" &&
  import.meta.env?.DEV
) {

  const tests = [

    {
      text:
        "open help",

      path:
        "/farmer/home",
    },

    {
      text:
        "opee heeelp",

      path:
        "/farmer/home",
    },

    {
      text:
        "open home",

      path:
        "/farmer/help",
    },

    {
      text:
        "book page can you take me",

      path:
        "/farmer/home",
    },

    {
      text:
        "take me back",

      path:
        "/farmer/book",
    },

    {
      text:
        "where are we now",

      path:
        "/farmer/home",
    },

    {
      text:
        "what is my payment status?",

      path:
        "/farmer/home",
    },

  ];


  for (
    const test of
    tests
  ) {

    try {

      const result =
        routeLocalCommand(

          test.text,

          {

            currentPath:
              test.path,

            language:
              "en",

          }

        );


      debugLog(

        `Controller test: ${test.text}`,

        {

          type:
            result.decision?.type,

          action:
            result.decision?.action,

        }

      );

    } catch (
      error
    ) {

      console.warn(

        "[KrishiSetu AI] Controller test failed:",

        test.text,

        error

      );

    }

  }

}


/* =========================================================
   DEFAULT EXPORT
========================================================= */

export default assistantController;