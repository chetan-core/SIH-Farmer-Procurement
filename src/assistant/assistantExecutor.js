/* =========================================================
   KRISHISETU AI ASSISTANT EXECUTOR
=========================================================

   PURPOSE

   This is the final action execution layer.

   It connects verified assistant decisions to the React
   application.

   IMPORTANT

   Ordinary navigation and booking execution are separate.

   BOOKING FLOW

      user message
          ↓
      router
          ↓
      BOOKING
          ↓
      booking controller
          ↓
      FarmerBook

   OPEN_BOOKING is used only when the application actually
   needs to open/update the FarmerBook page.

   CONFIRM_BOOKING is NOT converted into ordinary navigation.
========================================================= */

import {
  ACTIONS,
} from "./assistantActions";


/* =========================================================
   CONSTANTS
========================================================= */

const DEFAULT_ROUTE =
  "/farmer/home";

const BOOKING_ROUTE =
  "/farmer/book";

const NAVIGATION_DELAY =
  250;


/* =========================================================
   BASIC HELPERS
========================================================= */

function cleanString(
  value
) {

  return String(
    value ?? ""
  )
    .trim();

}


function isObject(
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


/* =========================================================
   BOOKING PARAMETER SANITIZATION
========================================================= */

export function sanitizeBookingParams(
  booking
) {

  if (
    !isObject(
      booking
    )
  ) {

    return null;

  }


  const result = {};


  /* -------------------------------------------------------
     CROP
  ------------------------------------------------------- */

  if (
    typeof booking.crop ===
      "string" &&
    cleanString(
      booking.crop
    )
  ) {

    result.crop =
      cleanString(
        booking.crop
      );

  }


  /* -------------------------------------------------------
     QUANTITY
  ------------------------------------------------------- */

  const quantity =
    Number(
      booking.quantity ??
      booking.estimatedQuantity
    );

  if (
    Number.isFinite(
      quantity
    ) &&
    quantity > 0 &&
    quantity <= 50000
  ) {

    result.quantity =
      quantity;

  }


  /* -------------------------------------------------------
     CENTER
  ------------------------------------------------------- */

  if (
    booking.centerId !==
      undefined &&
    booking.centerId !==
      null &&
    cleanString(
      booking.centerId
    )
  ) {

    result.centerId =
      booking.centerId;

  }


  if (
    typeof booking.centerName ===
      "string" &&
    cleanString(
      booking.centerName
    )
  ) {

    result.centerName =
      cleanString(
        booking.centerName
      );

  }


  /* -------------------------------------------------------
     DATE
  ------------------------------------------------------- */

  if (
    typeof booking.date ===
      "string" &&
    cleanString(
      booking.date
    )
  ) {

    result.date =
      cleanString(
        booking.date
      );

  }


  if (
    typeof booking.dateLabel ===
      "string" &&
    cleanString(
      booking.dateLabel
    )
  ) {

    result.dateLabel =
      cleanString(
        booking.dateLabel
      );

  }


  /* -------------------------------------------------------
     SLOT
  ------------------------------------------------------- */

  if (
    typeof booking.slotId ===
      "string" &&
    cleanString(
      booking.slotId
    )
  ) {

    result.slotId =
      cleanString(
        booking.slotId
      );

  }


  if (
    typeof booking.slotStart ===
      "string" &&
    cleanString(
      booking.slotStart
    )
  ) {

    result.slotStart =
      cleanString(
        booking.slotStart
      );

  }


  if (
    typeof booking.slotEnd ===
      "string" &&
    cleanString(
      booking.slotEnd
    )
  ) {

    result.slotEnd =
      cleanString(
        booking.slotEnd
      );

  }


  if (
    typeof booking.slotDisplay ===
      "string" &&
    cleanString(
      booking.slotDisplay
    )
  ) {

    result.slotDisplay =
      cleanString(
        booking.slotDisplay
      );

  }


  /* -------------------------------------------------------
     BOOKING STEP
  ------------------------------------------------------- */

  if (
    typeof booking.step ===
      "string" &&
    cleanString(
      booking.step
    )
  ) {

    result.step =
      cleanString(
        booking.step
      );

  }


  /* -------------------------------------------------------
     BOOKING STATE
  ------------------------------------------------------- */

  if (
    typeof booking.readyForConfirmation ===
      "boolean"
  ) {

    result.readyForConfirmation =
      booking.readyForConfirmation;

  }


  if (
    typeof booking.awaitingConfirmation ===
      "boolean"
  ) {

    result.awaitingConfirmation =
      booking.awaitingConfirmation;

  }


  if (
    typeof booking.active ===
      "boolean"
  ) {

    result.active =
      booking.active;

  }


  /* -------------------------------------------------------
     TOKEN / BOOKING REFERENCE
  ------------------------------------------------------- */

  if (
    booking.token !==
      undefined &&
    booking.token !==
      null &&
    cleanString(
      booking.token
    )
  ) {

    result.token =
      cleanString(
        booking.token
      );

  }


  if (
    booking.bookingId !==
      undefined &&
    booking.bookingId !==
      null &&
    cleanString(
      booking.bookingId
    )
  ) {

    result.bookingId =
      cleanString(
        booking.bookingId
      );

  }


  return Object.keys(
    result
  ).length > 0
    ? result
    : null;

}


/* =========================================================
   BOOKING PARAMETER SOURCE
========================================================= */

function getBookingParameters(
  params,
  booking
) {

  const source =
    isObject(
      booking
    )
      ? booking
      : isObject(
          params
        )
        ? params
        : null;


  return sanitizeBookingParams(
    source
  );

}


/* =========================================================
   WAIT
========================================================= */

function wait(
  milliseconds
) {

  return new Promise(
    resolve =>
      setTimeout(
        resolve,
        milliseconds
      )
  );

}


/* =========================================================
   ACTION HELPERS
========================================================= */

function isBookingAction(
  action
) {

  const normalized =
    cleanString(
      action
    ).toUpperCase();


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


/* =========================================================
   NAVIGATION STATE
========================================================= */

function buildNavigationState(
  action,
  params,
  bookingParameters
) {

  const state = {

    assistantAction:
      action,

  };


  if (
    params &&
    isObject(
      params
    )
  ) {

    state.assistantParams =
      params;

  }


  if (
    bookingParameters
  ) {

    state.assistantBooking =
      bookingParameters;

  }


  return state;

}


/* =========================================================
   ORDINARY ACTION EXECUTION
========================================================= */

export async function executeAssistantAction(
  action,
  options = {}
) {

  const {

    navigate =
      null,

    currentPath =
      "",

    params =
      null,

    booking =
      null,

  } =
    options;


  const normalizedAction =
    cleanString(
      action
    ).toUpperCase();


  /* =======================================================
     INVALID
  ======================================================= */

  if (
    !normalizedAction ||
    normalizedAction ===
      "NONE"
  ) {

    return {

      success:
        false,

      action:
        "NONE",

      navigated:
        false,

      reason:
        "No action provided.",

    };

  }


  /* =======================================================
     CURRENT PAGE
  ======================================================= */

  if (
    normalizedAction ===
    "SHOW_CURRENT_PAGE"
  ) {

    return {

      success:
        true,

      action:
        normalizedAction,

      navigated:
        false,

      route:
        null,

    };

  }


  /* =======================================================
     GO BACK
  ======================================================= */

  if (
    normalizedAction ===
    "GO_BACK"
  ) {

    if (
      typeof navigate !==
      "function"
    ) {

      return {

        success:
          false,

        action:
          normalizedAction,

        navigated:
          false,

        reason:
          "navigate function is unavailable.",

      };

    }


    await wait(
      NAVIGATION_DELAY
    );


    if (
      typeof window !==
        "undefined" &&
      window.history.length >
        1
    ) {

      navigate(
        -1
      );

    } else {

      navigate(
        DEFAULT_ROUTE
      );

    }


    return {

      success:
        true,

      action:
        normalizedAction,

      navigated:
        true,

      route:
        null,

    };

  }


  /* =======================================================
     BOOKING ACTIONS
  ======================================================= */

  /*
   * IMPORTANT
   *
   * BOOKING / CONFIRM_BOOKING must NOT be sent through
   * the generic route executor.
   *
   * The booking controller / FarmerBook owns the actual
   * booking submission.
   *
   * The executor only opens FarmerBook when required.
   */

  if (
    isBookingAction(
      normalizedAction
    )
  ) {

    const bookingParameters =
      getBookingParameters(
        params,
        booking
      );


    /*
     * CONFIRM_BOOKING must return an execution description
     * rather than navigating.
     *
     * assistantController can then dispatch the booking
     * confirmation event to FarmerBook.
     */

    if (
      normalizedAction ===
      "CONFIRM_BOOKING"
    ) {

      return {

        success:
          true,

        action:
          normalizedAction,

        navigated:
          false,

        route:
          null,

        params:
          bookingParameters,

        booking:
          bookingParameters,

        executeBooking:
          true,

        requiresBookingController:
          true,

      };

    }


    /*
     * CANCEL_BOOKING is also handled by the booking
     * controller. Nothing should navigate here.
     */

    if (
      normalizedAction ===
      "CANCEL_BOOKING"
    ) {

      return {

        success:
          true,

        action:
          normalizedAction,

        navigated:
          false,

        route:
          null,

        params:
          bookingParameters,

        booking:
          bookingParameters,

        cancelBooking:
          true,

        requiresBookingController:
          true,

      };

    }


    /*
     * OPEN_BOOKING
     *
     * This action opens FarmerBook with whatever booking
     * information has already been extracted.
     */

    if (
      normalizedAction ===
      "OPEN_BOOKING"
    ) {

      if (
        typeof navigate !==
        "function"
      ) {

        return {

          success:
            false,

          action:
            normalizedAction,

          navigated:
            false,

          route:
            BOOKING_ROUTE,

          params:
            bookingParameters,

          reason:
            "navigate function is unavailable.",

        };

      }


      const state =
        buildNavigationState(
          normalizedAction,
          bookingParameters ||
            params,
          bookingParameters
        );


      /*
       * If already inside FarmerBook, we still send state
       * through navigate so the page receives a fresh
       * location.state update.
       */

      await wait(
        NAVIGATION_DELAY
      );


      navigate(

        BOOKING_ROUTE,

        {

          state,

        }

      );


      return {

        success:
          true,

        action:
          normalizedAction,

        navigated:
          true,

        route:
          BOOKING_ROUTE,

        params:
          bookingParameters,

        booking:
          bookingParameters,

        continueBooking:
          true,

      };

    }


    /*
     * Generic BOOK alias.
     */

    if (
      normalizedAction ===
      "BOOK"
    ) {

      return executeAssistantAction(

        "OPEN_BOOKING",

        {

          ...options,

          booking:
            bookingParameters,

          params:
            bookingParameters,

        }

      );

    }

  }


  /* =======================================================
     ORDINARY ACTION DEFINITION
  ======================================================= */

  const definition =
    ACTIONS[
      normalizedAction
    ];


  if (
    !definition
  ) {

    return {

      success:
        false,

      action:
        normalizedAction,

      navigated:
        false,

      reason:
        "Action does not exist.",

    };

  }


  /* =======================================================
     ROUTE
  ======================================================= */

  let route =
    definition.route;


  if (
    normalizedAction ===
    "OPEN_NOTIFICATIONS"
  ) {

    route =
      "/farmer/home";

  }


  if (
    !route
  ) {

    return {

      success:
        false,

      action:
        normalizedAction,

      navigated:
        false,

      reason:
        "Action has no route.",

    };

  }


  /* =======================================================
     NAVIGATE VALIDATION
  ======================================================= */

  if (
    typeof navigate !==
    "function"
  ) {

    return {

      success:
        false,

      action:
        normalizedAction,

      navigated:
        false,

      route,

      params:
        params ||
        null,

      reason:
        "navigate function is unavailable.",

    };

  }


  /* =======================================================
     SAME ROUTE
  ======================================================= */

  const sameRoute =
    currentPath ===
    route;


  /*
   * Ordinary actions should not perform meaningless
   * navigation when already on the destination page.
   */

  if (
    sameRoute
  ) {

    return {

      success:
        true,

      action:
        normalizedAction,

      navigated:
        false,

      route,

      params:
        params ||
        null,

      alreadyOnRoute:
        true,

    };

  }


  /* =======================================================
     BUILD STATE
  ======================================================= */

  const navigationState =
    buildNavigationState(
      normalizedAction,
      params,
      null
    );


  await wait(
    NAVIGATION_DELAY
  );


  navigate(

    route,

    Object.keys(
      navigationState
    ).length > 0
      ? {
          state:
            navigationState,
        }
      : undefined

  );


  /* =======================================================
     RESULT
  ======================================================= */

  return {

    success:
      true,

    action:
      normalizedAction,

    navigated:
      true,

    route,

    params:
      params ||
      null,

  };

}


/* =========================================================
   DEDICATED BOOKING EXECUTION
========================================================= */

/*
 * This function NEVER directly POSTs a booking.
 *
 * It returns the booking information to the controller,
 * which is responsible for dispatching the confirmation
 * event to FarmerBook.
 */

export async function executeBooking(
  booking,
  options = {}
) {

  const safeBooking =
    sanitizeBookingParams(
      booking
    );


  if (
    !safeBooking
  ) {

    return {

      success:
        false,

      action:
        "CONFIRM_BOOKING",

      navigated:
        false,

      reason:
        "No valid booking information was provided.",

      executeBooking:
        false,

    };

  }


  return {

    success:
      true,

    action:
      "CONFIRM_BOOKING",

    navigated:
      false,

    route:
      null,

    params:
      safeBooking,

    booking:
      safeBooking,

    executeBooking:
      true,

    requiresBookingController:
      true,

  };

}


/* =========================================================
   OPEN BOOKING PAGE WITH STATE
========================================================= */

export async function openBooking(
  booking,
  options = {}
) {

  const safeBooking =
    sanitizeBookingParams(
      booking
    );


  if (
    !safeBooking
  ) {

    return {

      success:
        false,

      action:
        "OPEN_BOOKING",

      navigated:
        false,

      route:
        BOOKING_ROUTE,

      reason:
        "No valid booking information was provided.",

    };

  }


  return executeAssistantAction(

    "OPEN_BOOKING",

    {

      ...options,

      booking:
        safeBooking,

      params:
        safeBooking,

    }

  );

}


/* =========================================================
   BOOKING PARAMETER CHECK
========================================================= */

export function hasBookingParameters(
  booking
) {

  const safe =
    sanitizeBookingParams(
      booking
    );


  return Boolean(

    safe &&
    (
      safe.crop ||
      safe.quantity ||
      safe.centerId ||
      safe.date ||
      safe.slotStart ||
      safe.slotId
    )

  );

}


/* =========================================================
   RESULT NORMALIZER
========================================================= */

export function normalizeExecutionResult(
  result
) {

  if (
    !result ||
    typeof result !==
      "object"
  ) {

    return {

      success:
        false,

      action:
        "NONE",

      navigated:
        false,

      reason:
        "Invalid executor result.",

    };

  }


  return {

    success:
      Boolean(
        result.success
      ),

    action:
      result.action ||
      "NONE",

    navigated:
      Boolean(
        result.navigated
      ),

    route:
      result.route ||
      null,

    params:
      result.params ||
      null,

    booking:
      result.booking ||
      null,

    continueBooking:
      Boolean(
        result.continueBooking
      ),

    executeBooking:
      Boolean(
        result.executeBooking
      ),

    cancelBooking:
      Boolean(
        result.cancelBooking
      ),

    requiresBookingController:
      Boolean(
        result.requiresBookingController
      ),

    alreadyOnRoute:
      Boolean(
        result.alreadyOnRoute
      ),

    reason:
      result.reason ||
      null,

  };

}


/* =========================================================
   EXECUTOR OBJECT
========================================================= */

export const assistantExecutor = {

  execute:
    executeAssistantAction,

  booking:
    executeBooking,

  openBooking,

  sanitizeBooking:
    sanitizeBookingParams,

  hasBooking:
    hasBookingParameters,

  normalizeResult:
    normalizeExecutionResult,

};


/* =========================================================
   DEVELOPMENT TESTS
========================================================= */

if (
  typeof import.meta !==
    "undefined" &&
  import.meta.env?.DEV
) {

  const sampleBooking = {

    crop:
      "paddy",

    quantity:
      50,

    centerId:
      "1",

    centerName:
      "Main Procurement Center",

    date:
      "2026-09-03",

    dateLabel:
      "Thursday, 03 SEP",

    slotId:
      "10-00",

    slotStart:
      "10:00",

    slotEnd:
      "10:30",

    slotDisplay:
      "10:00 AM – 10:30 AM",

    step:
      "review",

    readyForConfirmation:
      true,

    awaitingConfirmation:
      false,

  };


  const sanitized =
    sanitizeBookingParams(
      sampleBooking
    );


  if (
    !sanitized?.crop ||
    sanitized.quantity !==
      50 ||
    sanitized.date !==
      "2026-09-03" ||
    sanitized.slotStart !==
      "10:00"
  ) {

    console.warn(
      "[KrishiSetu AI] Booking executor parameter test failed."
    );

  } else {

    console.debug(
      "[KrishiSetu AI] Booking executor parameter test passed."
    );

  }


  /*
   * Confirming a booking must NEVER produce a route.
   */

  executeBooking(
    sampleBooking
  )
    .then(
      result => {

        if (
          result.route !==
            null ||
          result.navigated
        ) {

          console.warn(
            "[KrishiSetu AI] Booking execution test failed: confirmation attempted navigation."
          );

        } else {

          console.debug(
            "[KrishiSetu AI] Booking confirmation execution test passed."
          );

        }

      }
    )
    .catch(
      error => {

        console.warn(
          "[KrishiSetu AI] Booking executor test error:",
          error
        );

      }
    );

}


/* =========================================================
   DEFAULT EXPORT
========================================================= */

export default assistantExecutor;