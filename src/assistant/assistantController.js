/* =========================================================
   KRISHISETU AI ASSISTANT CONTROLLER
=========================================================

   PURPOSE

   Central orchestration layer for the KrishiSetu assistant.

   FLOW

      VoiceAssistant
           ↓
      assistantController
           ↓
      assistantBooking
      assistantRouter
      assistantContext
           ↓
      assistantService
           ↓
      backend AI
           ↓
      assistantExecutor
           ↓
      WEBSITE

   BOOKING FLOW

      "book 50 kg paddy"
              ↓
      save crop + quantity
              ↓
      ask for missing details
              ↓
      dates
              ↓
      time slots
              ↓
      review
              ↓
      confirmation
              ↓
      executor
              ↓
      FarmerBook

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
  assistantBooking,
  BOOKING_INTENTS,
  BOOKING_STEPS,
} from "./assistantBooking";


import {
  cleanText,
  normalizeLanguageCode,
  sanitizeActionParams,
  getStoredFarmer,
  debugLog,
  readStorageJson,
  writeStorageJson,
  removeStorage,
} from "./assistantUtils";


/* =========================================================
   CONSTANTS
========================================================= */

const DEFAULT_LANGUAGE =
  "en";


const DEFAULT_PATH =
  "/";


const BOOKING_STATE_STORAGE_KEY =
  "krishisetu_ai_booking_state";


const BOOKING_STATE_TTL =
  15 * 60 * 1000;


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

  BOOKING:
    "BOOKING",

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
   RESULT
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
   OPTIONS
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

    bookingState =
      undefined,

    bookingContext =
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

    bookingState,

    bookingContext,

  };

}


/* =========================================================
   BOOKING STATE STORAGE
========================================================= */

function loadBookingState() {

  const stored =
    readStorageJson(
      BOOKING_STATE_STORAGE_KEY,
      null
    );


  if (
    !stored ||
    typeof stored !==
      "object"
  ) {

    return assistantBooking.createEmpty();

  }


  const updatedAt =
    Number(
      stored.updatedAt ||
      0
    );


  if (
    updatedAt &&
    Date.now() -
      updatedAt >
      BOOKING_STATE_TTL
  ) {

    removeStorage(
      BOOKING_STATE_STORAGE_KEY
    );


    return assistantBooking.createEmpty();

  }


  return assistantBooking.normalize(
    stored
  );

}


function saveBookingState(
  state
) {

  const normalized =
    assistantBooking.normalize(
      state
    );


  writeStorageJson(
    BOOKING_STATE_STORAGE_KEY,
    normalized
  );


  return normalized;

}


function clearBookingState() {

  removeStorage(
    BOOKING_STATE_STORAGE_KEY
  );

}


function getEffectiveBookingState(
  explicitState
) {

  if (
    explicitState !==
    undefined
  ) {

    return assistantBooking.normalize(
      explicitState
    );

  }


  return loadBookingState();

}


/* =========================================================
   BOOKING RESPONSE TEXT
========================================================= */

function getBookingText(
  language,
  key,
  data = {}
) {

  const {

    crop =
      null,

    quantity =
      null,

    center =
      null,

    date =
      null,

    slot =
      null,

  } =
    data;


  const cropNames = {

    en: {

      wheat:
        "wheat",

      paddy:
        "paddy",

      maize:
        "maize",

      cotton:
        "cotton",

    },

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
    crop
      ? (
          cropNames[
            language
          ]?.[
            crop
          ] ||
          crop
        )
      : null;


  if (
    key ===
    "detailsUpdated"
  ) {

    if (
      language ===
      "hi"
    ) {

      if (
        displayCrop &&
        quantity
      ) {

        return `मैंने ${displayCrop} की ${quantity} kg मात्रा रख ली है। अभी तारीख और आने का समय चुनना बाकी है।`;

      }


      if (
        displayCrop
      ) {

        return `मैंने ${displayCrop} चुन लिया है। अब अनुमानित मात्रा बताएं।`;

      }


      if (
        quantity
      ) {

        return `मैंने ${quantity} kg मात्रा रख ली है। अब फसल बताएं।`;

      }

      return "बुकिंग की जानकारी अपडेट हो गई है।";

    }


    if (
      language ===
      "te"
    ) {

      if (
        displayCrop &&
        quantity
      ) {

        return `${displayCrop} ${quantity} kg వివరాలను నమోదు చేశాను. ఇంకా తేదీ మరియు రాక సమయం ఎంచుకోవాలి.`;

      }


      if (
        displayCrop
      ) {

        return `${displayCrop} ఎంపిక చేశాను. ఇప్పుడు అంచనా పరిమాణం చెప్పండి.`;

      }


      if (
        quantity
      ) {

        return `${quantity} kg పరిమాణాన్ని నమోదు చేశాను. ఇప్పుడు పంటను చెప్పండి.`;

      }

      return "బుకింగ్ వివరాలు నవీకరించబడ్డాయి.";

    }


    if (
      displayCrop &&
      quantity
    ) {

      return `I have saved ${quantity} kg of ${displayCrop}. We still need your date and arrival time.`;

    }


    if (
      displayCrop
    ) {

      return `I have selected ${displayCrop}. Now tell me the estimated quantity.`;

    }


    if (
      quantity
    ) {

      return `I have saved ${quantity} kg. Now tell me which crop you are bringing.`;

    }


    return "Your booking details have been updated.";

  }


  if (
    key ===
    "dateSelected"
  ) {

    if (
      language ===
      "hi"
    ) {

      return `ठीक है। ${date || "यह तारीख"} चुन ली गई है। अब मैं इस तारीख के उपलब्ध आने के समय देख सकता हूँ।`;

    }


    if (
      language ===
      "te"
    ) {

      return `సరే. ${date || "ఈ తేదీ"} ఎంచుకున్నాను. ఇప్పుడు ఈ తేదీకి అందుబాటులో ఉన్న రాక సమయాలను చూడవచ్చు.`;

    }


    return `Okay. ${date || "That date"} is selected. I can now check the available arrival times for this date.`;

  }


  if (
    key ===
    "slotSelected"
  ) {

    if (
      language ===
      "hi"
    ) {

      return `समय ${slot || "चुन लिया गया"}। अब बुकिंग की सारी जानकारी तैयार है। क्या मैं पुष्टि कर दूँ?`;

    }


    if (
      language ===
      "te"
    ) {

      return `సమయం ${slot || "ఎంచుకున్నాము"}. ఇప్పుడు బుకింగ్ వివరాలన్నీ సిద్ధంగా ఉన్నాయి. నిర్ధారించనా?`;

    }


    return `The ${slot || "arrival time"} is selected. Your booking details are complete. Shall I confirm it?`;

  }


  if (
    key ===
    "needDate"
  ) {

    return assistantBooking.nextPrompt(
      {
        ...assistantBooking.normalize(
          data.state
        ),
      },
      language
    );

  }


  if (
    key ===
    "needSlot"
  ) {

    if (
      language ===
      "hi"
    ) {

      return "तारीख चुन ली गई है। अब पूछें “उपलब्ध समय बताओ” या कोई उपलब्ध समय चुनें।";

    }


    if (
      language ===
      "te"
    ) {

      return "తేదీ ఎంచుకున్నారు. ఇప్పుడు “అందుబాటులో ఉన్న సమయాలు చెప్పు” అని అడగండి లేదా ఒక సమయాన్ని ఎంచుకోండి.";

    }


    return "Your date is selected. Ask me for the available times, or choose an available time.";

  }


  if (
    key ===
    "state"
  ) {

    const summary =
      assistantBooking.getStateSummary(
        data.state,
        language
      );


    if (
      language ===
      "hi"
    ) {

      return `अभी आपकी बुकिंग में: ${summary}`;

    }


    if (
      language ===
      "te"
    ) {

      return `ప్రస్తుతం మీ బుకింగ్‌లో: ${summary}`;

    }


    return `Here is what I currently have for your booking: ${summary}`;

  }


  if (
    key ===
    "dates"
  ) {

    if (
      language ===
      "hi"
    ) {

      return data.dateText
        ? `उपलब्ध तारीखें हैं: ${data.dateText}। इनमें से कोई तारीख चुन सकते हैं।`
        : "अभी उपलब्ध तारीखें नहीं मिलीं।";

    }


    if (
      language ===
      "te"
    ) {

      return data.dateText
        ? `అందుబాటులో ఉన్న తేదీలు: ${data.dateText}. వీటిలో ఒక తేదీ ఎంచుకోండి.`
        : "ప్రస్తుతం అందుబాటులో ఉన్న తేదీలు లేవు.";

    }


    return data.dateText
      ? `The available dates are: ${data.dateText}. You can choose one of these dates.`
      : "I couldn't find any available dates right now.";

  }


  if (
    key ===
    "slots"
  ) {

    if (
      language ===
      "hi"
    ) {

      return data.slotText
        ? `उपलब्ध समय हैं: ${data.slotText}। इनमें से कोई एक चुनें।`
        : "इस तारीख के लिए कोई उपलब्ध समय नहीं मिला।";

    }


    if (
      language ===
      "te"
    ) {

      return data.slotText
        ? `అందుబాటులో ఉన్న సమయాలు: ${data.slotText}. వీటిలో ఒకదాన్ని ఎంచుకోండి.`
        : "ఈ తేదీకి అందుబాటులో ఉన్న సమయాలు లేవు.";

    }


    return data.slotText
      ? `The available arrival times are: ${data.slotText}. Choose one of them.`
      : "There are no available arrival times for this date.";

  }


  if (
    key ===
    "ready"
  ) {

    if (
      language ===
      "hi"
    ) {

      return "आपकी बुकिंग की सारी जानकारी तैयार है। अंतिम पुष्टि करने से पहले मैं आपको सभी विवरण दिखाऊँगा।";

    }


    if (
      language ===
      "te"
    ) {

      return "మీ బుకింగ్ వివరాలన్నీ సిద్ధంగా ఉన్నాయి. చివరి నిర్ధారణకు ముందు పూర్తి వివరాలను చూపిస్తాను.";

    }


    return "All booking details are ready. I’ll show you the complete booking details before the final confirmation.";

  }


  if (
    key ===
    "confirmed"
  ) {

    if (
      language ===
      "hi"
    ) {

      return "बुकिंग की पुष्टि हो गई।";

    }


    if (
      language ===
      "te"
    ) {

      return "బుకింగ్ నిర్ధారించబడింది.";

    }


    return "Booking confirmed.";

  }


  return "";

}


/* =========================================================
   BOOKING STATE PROCESSOR
========================================================= */

function processBookingConversation(
  text,
  options
) {

  const {

    language,
    bookingState: explicitBookingState,
    bookingContext,

  } =
    options;


  const bookingState =
    getEffectiveBookingState(
      explicitBookingState
    );


  /*
   * The FarmerBook page can provide real dates and slots
   * through bookingContext.
   */

  const availableDates =
    Array.isArray(
      bookingContext?.availableDates
    )
      ? bookingContext.availableDates
      : undefined;


  const availableSlots =
    Array.isArray(
      bookingContext?.availableSlots
    )
      ? bookingContext.availableSlots
      : undefined;


  const result =
    assistantBooking.process(
      bookingState,
      text,
      {

        language,

        availableDates,

        availableSlots,

      }
    );


  if (
    result?.state
  ) {

    saveBookingState(
      result.state
    );

  }


  return result;

}


/* =========================================================
   BUILD BOOKING RESULT
========================================================= */

function buildBookingControllerResult(
  bookingResult,
  originalText,
  language
) {

  const intent =
    bookingResult?.intent;


  const state =
    bookingResult?.state ||
    assistantBooking.createEmpty();


  /*
   * START / UPDATE
   */

  if (
    intent ===
      BOOKING_INTENTS.START ||
    intent ===
      BOOKING_INTENTS.UPDATE
  ) {

    const missing =
      bookingResult.missing ||
      assistantBooking.getMissingDetails(
        state
      );


    let reply =
      "";


    if (
      missing.includes(
        "crop"
      )
    ) {

      reply =
        assistantBooking.nextPrompt(
          state,
          language
        );

    } else if (
      missing.includes(
        "quantity"
      )
    ) {

      reply =
        assistantBooking.nextPrompt(
          state,
          language
        );

    } else if (
      missing.includes(
        "date"
      )
    ) {

      reply =
        getBookingText(
          language,
          "needDate",
          {
            state,
          }
        );

    } else if (
      missing.includes(
        "slot"
      )
    ) {

      reply =
        getBookingText(
          language,
          "needSlot",
          {
            state,
          }
        );

    } else {

      reply =
        getBookingText(
          language,
          "ready"
        );

    }


    return controllerResult(

      CONTROLLER_TYPES.BOOKING,

      CONTROLLER_STATUS.SUCCESS,

      {

        decision:
          null,

        bookingIntent:
          intent,

        action:
          "OPEN_BOOKING",

        reply,

        userText:
          originalText,

        bookingState:
          state,

        bookingStep:
          bookingResult.nextStep,

        missing:
          missing,

        shouldCallAI:
          false,

        shouldNavigate:
          false,

        shouldUpdateBookingForm:
          true,

        bookingCommand:
          true,

      }

    );

  }


  /*
   * SHOW STATE
   */

  if (
    intent ===
    BOOKING_INTENTS.SHOW_STATE
  ) {

    return controllerResult(

      CONTROLLER_TYPES.BOOKING,

      CONTROLLER_STATUS.SUCCESS,

      {

        bookingIntent:
          intent,

        action:
          "OPEN_BOOKING",

        reply:
          getBookingText(
            language,
            "state",
            {
              state,
            }
          ),

        bookingState:
          state,

        bookingStep:
          bookingResult.nextStep,

        shouldCallAI:
          false,

        shouldNavigate:
          false,

        bookingCommand:
          true,

      }

    );

  }


  /*
   * DATES
   */

  if (
    intent ===
    BOOKING_INTENTS.ASK_DATES
  ) {

    return controllerResult(

      CONTROLLER_TYPES.BOOKING,

      CONTROLLER_STATUS.SUCCESS,

      {

        bookingIntent:
          intent,

        action:
          "OPEN_BOOKING",

        reply:
          getBookingText(
            language,
            "dates",
            bookingResult
          ),

        bookingState:
          state,

        dates:
          bookingResult.dates ||
          [],

        shouldCallAI:
          false,

        shouldNavigate:
          false,

        bookingCommand:
          true,

      }

    );

  }


  /*
   * DATE SELECTED
   */

  if (
    intent ===
    BOOKING_INTENTS.SELECT_DATE
  ) {

    return controllerResult(

      CONTROLLER_TYPES.BOOKING,

      CONTROLLER_STATUS.SUCCESS,

      {

        bookingIntent:
          intent,

        action:
          "OPEN_BOOKING",

        reply:
          getBookingText(
            language,
            "dateSelected",
            {
              date:
                bookingResult.selectedDate
                  ?.label ||
                bookingResult.selectedDate
                  ?.date ||
                state.date,
            }
          ),

        bookingState:
          state,

        selectedDate:
          bookingResult.selectedDate,

        bookingStep:
          BOOKING_STEPS.SLOT,

        shouldCallAI:
          false,

        shouldNavigate:
          false,

        shouldUpdateBookingForm:
          true,

        bookingCommand:
          true,

      }

    );

  }


  /*
   * SLOTS
   */

  if (
    intent ===
    BOOKING_INTENTS.ASK_SLOTS
  ) {

    return controllerResult(

      CONTROLLER_TYPES.BOOKING,

      CONTROLLER_STATUS.SUCCESS,

      {

        bookingIntent:
          intent,

        action:
          "OPEN_BOOKING",

        reply:
          getBookingText(
            language,
            "slots",
            bookingResult
          ),

        bookingState:
          state,

        slots:
          bookingResult.slots ||
          [],

        bookingStep:
          BOOKING_STEPS.SLOT,

        shouldCallAI:
          false,

        shouldNavigate:
          false,

        bookingCommand:
          true,

      }

    );

  }


  /*
   * SLOT SELECTED
   */

  if (
    intent ===
    BOOKING_INTENTS.SELECT_SLOT
  ) {

    const review =
      bookingResult.review ||
      assistantBooking.review(
        state,
        language
      );


    return controllerResult(

      CONTROLLER_TYPES.CONFIRMATION,

      CONTROLLER_STATUS.PENDING,

      {

        bookingIntent:
          intent,

        action:
          "OPEN_BOOKING",

        reply:
          getBookingText(
            language,
            "slotSelected",
            {
              slot:
                bookingResult.selectedSlot
                  ?.display ||
                state.slotDisplay,
            }
          ),

        bookingState:
          state,

        review,

        bookingStep:
          BOOKING_STEPS.REVIEW,

        shouldCallAI:
          false,

        shouldNavigate:
          false,

        shouldUpdateBookingForm:
          true,

        bookingCommand:
          true,

        awaitingConfirmation:
          true,

        pendingAction:
          {
            action:
              "OPEN_BOOKING",

            params:
              sanitizeActionParams({

                crop:
                  state.crop,

                quantity:
                  state.quantity,

              }),

            booking:
              state,

            createdAt:
              Date.now(),

          },

        createPending:
          true,

      }

    );

  }


  /*
   * FINAL CONFIRM
   */

  if (
    intent ===
    BOOKING_INTENTS.CONFIRM
  ) {

    return controllerResult(

      CONTROLLER_TYPES.CONFIRMATION,

      CONTROLLER_STATUS.SUCCESS,

      {

        bookingIntent:
          intent,

        action:
          "OPEN_BOOKING",

        reply:
          getBookingText(
            language,
            "confirmed"
          ),

        bookingState:
          state,

        booking:
          state,

        params:
          sanitizeActionParams({

            crop:
              state.crop,

            quantity:
              state.quantity,

          }),

        shouldCallAI:
          false,

        shouldNavigate:
          false,

        shouldExecuteBooking:
          true,

        bookingCommand:
          true,

      }

    );

  }


  /*
   * REVIEW
   */

  if (
    intent ===
    BOOKING_INTENTS.REVIEW
  ) {

    const review =
      bookingResult.review;


    return controllerResult(

      CONTROLLER_TYPES.BOOKING,

      CONTROLLER_STATUS.SUCCESS,

      {

        bookingIntent:
          intent,

        action:
          "OPEN_BOOKING",

        reply:
          review?.valid
            ? getBookingText(
                language,
                "ready"
              )
            : assistantBooking.nextPrompt(
                state,
                language
              ),

        bookingState:
          state,

        review,

        shouldCallAI:
          false,

        shouldNavigate:
          false,

        bookingCommand:
          true,

      }

    );

  }


  /*
   * CANCEL
   */

  if (
    intent ===
    BOOKING_INTENTS.CANCEL
  ) {

    clearBookingState();


    return controllerResult(

      CONTROLLER_TYPES.CANCELLATION,

      CONTROLLER_STATUS.CANCELLED,

      {

        bookingIntent:
          intent,

        action:
          "NONE",

        reply:
          language ===
            "hi"
            ? "ठीक है, मैंने आपकी Buchking प्रक्रिया रद्द कर दी।"
            : language ===
                "te"
              ? "సరే, బుకింగ్ ప్రక్రియను రద్దు చేశాను."
              : "Okay, I cancelled the booking process.",

        shouldCallAI:
          false,

        shouldNavigate:
          false,

        bookingCommand:
          true,

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
    normalized.pendingAction !==
      undefined
      ? normalized.pendingAction
      : loadPendingAction();


  const bookingState =
    getEffectiveBookingState(
      normalized.bookingState
    );


  /*
   * Once the booking conversation is active,
   * booking questions get first priority.
   *
   * This is what allows:

      "what dates are available?"
      "tomorrow"
      "what times are available?"
      "11 am"
      "yes"

   * to remain inside the booking conversation.
   */

  if (
    bookingState.active ||
    assistantBooking.extractCrop(
      normalized.message
    ) ||
    assistantBooking.extractQuantity(
      normalized.message
    )
  ) {

    const bookingResult =
      processBookingConversation(
        normalized.message,
        normalized
      );


    if (
      bookingResult?.handled &&
      bookingResult.intent !==
        BOOKING_INTENTS.NONE
    ) {

      return {

        decision:
          buildBookingControllerResult(
            bookingResult,
            normalized.message,
            normalized.language
          ),

        pending,

        booking:
          bookingResult.state,

      };

    }

  }


  /*
   * Standard routing.
   */

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

    booking:
      bookingState,

  };

}


/* =========================================================
   CONTEXT
========================================================= */

export function createControllerContext(
  options = {}
) {

  const normalized =
    normalizeOptions(
      options
    );


  const pending =
    normalized.pendingAction !==
      undefined
      ? normalized.pendingAction
      : loadPendingAction();


  const bookingState =
    getEffectiveBookingState(
      normalized.bookingState
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

      pendingAction:
        pending,

    });


  return {

    context,

    serverContext:
      buildServerAssistantContext({

        pathname:
          normalized.currentPath,

        language:
          normalized.language,

        history:
          normalized.history,

        message:
          normalized.message,

        pendingAction:
          pending,

      }),

    pending,

    bookingState,

  };

}


/* =========================================================
   BACKEND REQUEST
========================================================= */

export function createBackendRequest(
  options = {}
) {

  const normalized =
    normalizeOptions(
      options
    );


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
      normalized.message,

    language:
      normalized.language,

    currentPath:
      normalized.currentPath,

    currentPage:
      serverContext.currentPage,

    farmerId:
      farmer.farmerId,

    phone:
      farmer.phone,

    history:
      normalized.history,

    context:
      {

        ...serverContext,

        booking:
          {

            state:
              normalized.bookingState ||
              loadBookingState(),

          },

        bookingConversation:
          true,

      },

  };

}


/* =========================================================
   AI REQUEST
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
   BACKEND RESPONSE
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

  };

}


/* =========================================================
   EXECUTE LOCAL DECISION
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

    language =
      DEFAULT_LANGUAGE,

  } =
    options;


  /*
   * Our booking conversational decisions do not
   * navigate immediately.
   */

  if (
    decision.type ===
      CONTROLLER_TYPES.BOOKING ||
    decision.bookingCommand
  ) {

    return decision;

  }


  /*
   * Current page.
   */

  if (
    decision.type ===
    "CURRENT_PAGE"
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


  /*
   * Cancellation.
   */

  if (
    decision.type ===
    "CANCEL"
  ) {

    clearPendingAction();

    clearBookingState();


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


  /*
   * Navigation.
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

        language,

        history:
          options.history,

        message:
          options.message,

      });


    const validation =
      validateActionForContext(

        decision.action,

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

          action:
            decision.action,

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


    const execution =
      await assistantExecutor.execute(

        decision.action,

        {

          navigate,

          currentPath,

          params:
            decision.params ||
            decision.pendingAction
              ?.params,

          booking:
            decision.booking ||
            decision.pendingAction
              ?.booking ||
            null,

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

        action:
          decision.action,

        reply:
          decision.reply ||
          "",

        shouldNavigate:
          decision.shouldNavigate !==
            false,

        shouldCallAI:
          false,

        execution,

      }

    );

  }


  return null;

}


/* =========================================================
   MAIN COMMAND
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


  /* =======================================================
     1. BOOKING CONVERSATION
  ======================================================= */

  const bookingState =
    getEffectiveBookingState(
      normalized.bookingState
    );


  const bookingLikely =
    bookingState.active ||
    assistantBooking.extractCrop(
      normalized.message
    ) ||
    assistantBooking.extractQuantity(
      normalized.message
    ) ||
    /\b(book|booking|reserve|procurement|sell)\b/i.test(
      normalized.message
    ) ||
    normalized.message.includes(
      "बुक"
    ) ||
    normalized.message.includes(
      "बुकिंग"
    ) ||
    normalized.message.includes(
      "బుక్"
    ) ||
    normalized.message.includes(
      "బుకింగ్"
    );


  if (
    bookingLikely
  ) {

    const bookingResult =
      processBookingConversation(
        normalized.message,
        normalized
      );


    if (
      bookingResult?.handled &&
      bookingResult.intent !==
        BOOKING_INTENTS.NONE
    ) {

      const bookingDecision =
        buildBookingControllerResult(
          bookingResult,
          normalized.message,
          normalized.language
        );


      /*
       * Save confirmation action when the booking
       * reaches the final review state.
       */

      if (
        bookingDecision.createPending &&
        bookingDecision.pendingAction
      ) {

        savePendingAction(
          bookingDecision.pendingAction
        );

      }


      /*
       * Final booking confirmation.
       *
       * Do NOT navigate yet.
       *
       * We execute the dedicated booking action,
       * which sends the booking state to FarmerBook.
       */

      if (
        bookingResult.intent ===
        BOOKING_INTENTS.CONFIRM
      ) {

        clearPendingAction();


        return controllerResult(

          CONTROLLER_TYPES.BOOKING,

          CONTROLLER_STATUS.SUCCESS,

          {

            ...bookingDecision,

            action:
              "OPEN_BOOKING",

            shouldCallAI:
              false,

            shouldNavigate:
              true,

            shouldExecuteBooking:
              true,

            bookingState:
              bookingResult.state,

            booking:
              bookingResult.state,

          }

        );

      }


      /*
       * Pending confirmation.
       */

      if (
        bookingDecision.status ===
          CONTROLLER_STATUS.PENDING
      ) {

        return bookingDecision;

      }


      return bookingDecision;

    }

  }


  /* =======================================================
     2. LOCAL ROUTER
  ======================================================= */

  const local =
    routeLocalCommand(

      normalized.message,

      normalized

    );


  const localDecision =
    local.decision;


  /*
   * Booking controller results were already handled.
   */

  if (
    localDecision?.bookingCommand
  ) {

    return localDecision;

  }


  debugLog(
    "Controller local decision",
    localDecision
  );


  /*
   * Persist newly created pending action.
   */

  if (
    localDecision?.createPending &&
    localDecision?.pendingAction
  ) {

    savePendingAction(
      localDecision.pendingAction
    );


    return controllerResult(

      CONTROLLER_TYPES.CONFIRMATION,

      CONTROLLER_STATUS.PENDING,

      {

        ...localDecision,

        pendingAction:
          localDecision.pendingAction,

        shouldCallAI:
          false,

        shouldNavigate:
          false,

      }

    );

  }


  /*
   * Local navigation/current-page/cancel.
   */

  if (
    localDecision?.type !==
      "ASK_AI"
  ) {

    return executeLocalDecision(

      localDecision,

      normalized

    );

  }


  /* =======================================================
     3. BACKEND AI
  ======================================================= */

  let backendResponse;


  try {

    backendResponse =
      await requestAI(
        normalized
      );

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

      }

    );

  }


  /* =======================================================
     4. MERGE
  ======================================================= */

  const {
    decision:
      finalDecision,
  } =
    processBackendDecision(

      localDecision,

      backendResponse,

      normalized

    );


  /*
   * Backend could theoretically return booking-related
   * semantic data.
   *
   * It is treated as information only unless the local
   * booking engine has already entered a booking flow.
   */

  if (
    finalDecision?.action &&
    finalDecision.action !==
      "NONE"
  ) {

    const finalContext =
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


    const validation =
      validateActionForContext(

        finalDecision.action,

        finalContext

      );


    if (
      !validation.valid
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

          validation,

        }

      );

    }

  }


  /*
   * Normal AI answer.
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

      }

    );

  }


  /* =======================================================
     5. BACKEND NAVIGATION
  ======================================================= */

  const plan =
    getExecutionPlan(
      finalDecision
    );


  const execution =
    await assistantExecutor.execute(

      finalDecision.action,

      {

        navigate:
          normalized.navigate,

        currentPath:
          normalized.currentPath,

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

    }

  );

}


/* =========================================================
   SIMPLE ASK
========================================================= */

export async function askAssistant(
  message,
  options = {}
) {

  /*
   * IMPORTANT:
   *
   * VoiceAssistant currently calls:
   *
   * assistantController.ask(text, options)
   *
   * Therefore this function accepts the same shape.
   */

  return handleAssistantCommand(
    message,
    options
  );

}


/* =========================================================
   EXECUTE DECISION
========================================================= */

export async function executeDecision(
  decision,
  options = {}
) {

  return executeLocalDecision(

    decision,

    normalizeOptions(
      options
    )

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

    const bookingState =
      loadBookingState();


    if (
      bookingState.readyForConfirmation
    ) {

      return handleAssistantCommand(

        "yes",

        {

          ...options,

          bookingState,

        }

      );

    }


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


  clearPendingAction();


  return executeLocalDecision(

    {

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
        pending.params ||
        pending.booking ||
        null,

      booking:
        pending.booking ||
        null,

      pendingAction:
        pending,

      shouldCallAI:
        false,

      shouldNavigate:
        true,

      clearPending:
        true,

    },

    normalizeOptions(
      options
    )

  );

}


/* =========================================================
   CANCEL
========================================================= */

export function cancelPendingAction(
  options = {}
) {

  const pending =
    loadPendingAction();


  clearPendingAction();

  clearBookingState();


  const language =
    normalizeLanguageCode(
      options.language
    );


  return controllerResult(

    CONTROLLER_TYPES.CANCELLATION,

    CONTROLLER_STATUS.CANCELLED,

    {

      action:
        "NONE",

      pendingAction:
        pending,

      reply:
        language ===
          "hi"
          ? "ठीक है, मैंने वह कार्रवाई रद्द कर दी।"
          : language ===
              "te"
            ? "సరే, ఆ చర్యను రద్దు చేశాను."
            : "Okay, I cancelled that action.",

    }

  );

}


/* =========================================================
   BOOKING STATE API
========================================================= */

export function getBookingState() {

  return loadBookingState();

}


export function setBookingState(
  state
) {

  return saveBookingState(
    state
  );

}


export function resetBookingState() {

  clearBookingState();

  return assistantBooking.createEmpty();

}


/* =========================================================
   BOOKING MESSAGE API
========================================================= */

export function handleBookingMessage(
  message,
  options = {}
) {

  const normalized =
    normalizeOptions({

      ...options,

      message,

    });


  const result =
    processBookingConversation(
      normalized.message,
      normalized
    );


  return buildBookingControllerResult(

    result,

    normalized.message,

    normalized.language

  );

}


/* =========================================================
   BOOKING FORM COMMAND
========================================================= */

export function getBookingFormCommand(
  state =
    loadBookingState()
) {

  const booking =
    assistantBooking.normalize(
      state
    );


  return {

    active:
      booking.active,

    crop:
      booking.crop,

    quantity:
      booking.quantity,

    centerId:
      booking.centerId,

    centerName:
      booking.centerName,

    date:
      booking.date,

    dateLabel:
      booking.dateLabel,

    slotId:
      booking.slotId,

    slotStart:
      booking.slotStart,

    slotEnd:
      booking.slotEnd,

    slotDisplay:
      booking.slotDisplay,

    step:
      booking.step,

    readyForConfirmation:
      booking.readyForConfirmation,

  };

}


/* =========================================================
   PREVIEW
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

    bookingState:
      local.booking,

    backendRequest:
      request,

  };

}


/* =========================================================
   CONTROLLER STATE
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
    bookingState,
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

    bookingState,

    bookingForm:
      getBookingFormCommand(
        bookingState
      ),

    context,

    serverContext,

  };

}


/* =========================================================
   VALIDATE
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
   INFO
========================================================= */

export function getControllerInfo() {

  return {

    name:
      "KrishiSetu AI Assistant Controller",

    architecture: [

      "VoiceAssistant",

      "assistantController",

      "assistantBooking",

      "assistantRouter",

      "assistantContext",

      "assistantService",

      "assistantExecutor",

    ],

    responsibilities: [

      "orchestrate assistant requests",

      "manage conversational booking",

      "maintain booking state",

      "handle dates and slots",

      "handle booking confirmation",

      "route local commands",

      "manage pending actions",

      "call backend AI",

      "validate backend decisions",

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

  booking:
    {

      getState:
        getBookingState,

      setState:
        setBookingState,

      reset:
        resetBookingState,

      handle:
        handleBookingMessage,

      form:
        getBookingFormCommand,

    },

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
   DEVELOPMENT CHECK
========================================================= */

if (
  typeof import.meta !==
    "undefined" &&
  import.meta.env?.DEV
) {

  const tests = [

    "book 50 kg paddy",

    "what have i selected",

    "what dates are available",

    "tomorrow",

    "what times are available",

    "11 am",

  ];


  for (
    const text of
    tests
  ) {

    try {

      const result =
        routeLocalCommand(

          text,

          {

            currentPath:
              "/farmer/book",

            language:
              "en",

          }

        );


      debugLog(

        `Booking controller test: ${text}`,

        {

          type:
            result.decision?.type,

          action:
            result.decision?.action,

          bookingIntent:
            result.decision?.bookingIntent,

          bookingStep:
            result.decision?.bookingStep,

        }

      );

    } catch (
      error
    ) {

      console.warn(

        "[KrishiSetu AI] Booking controller test failed:",

        text,

        error

      );

    }

  }

}


/* =========================================================
   DEFAULT EXPORT
========================================================= */

export default assistantController;