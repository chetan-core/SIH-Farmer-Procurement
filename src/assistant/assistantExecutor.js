/* =========================================================
   KRISHISETU AI ASSISTANT EXECUTOR
=========================================================

   PURPOSE

   This is the final action execution layer.

   It is responsible for taking a verified assistant action
   and actually connecting it to the React application.

   BOOKING EXAMPLE

      AI knows:

      crop       = paddy
      quantity   = 50
      centerId   = 2
      date       = 2026-09-03
      slotStart  = 10:00
      slotEnd    = 10:30

              ↓

      executor

              ↓

      navigate("/farmer/book", {
        state: {
          assistantAction: "OPEN_BOOKING",
          assistantBooking: {
            ...
          }
        }
      })

              ↓

      FarmerBook reads location.state

              ↓

      form is populated

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
  450;


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


/* =========================================================
   BOOKING PARAMETER SANITIZATION
========================================================= */

/*
 * IMPORTANT
 *
 * We do NOT use the generic sanitizeActionParams()
 * here because booking needs more information than
 * crop + quantity.
 *
 * The booking form may receive:
 *
 * crop
 * quantity
 * centerId
 * centerName
 * date
 * dateLabel
 * slotId
 * slotStart
 * slotEnd
 * slotDisplay
 * step
 * readyForConfirmation
 */

export function sanitizeBookingParams(
  booking
) {

  if (
    !booking ||
    typeof booking !==
      "object"
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
     SLOT ID
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


  /* -------------------------------------------------------
     SLOT START
  ------------------------------------------------------- */

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


  /* -------------------------------------------------------
     SLOT END
  ------------------------------------------------------- */

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


  /* -------------------------------------------------------
     SLOT DISPLAY
  ------------------------------------------------------- */

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
     STEP
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
     READY STATE
  ------------------------------------------------------- */

  if (
    typeof booking.readyForConfirmation ===
      "boolean"
  ) {

    result.readyForConfirmation =
      booking.readyForConfirmation;

  }


  /* -------------------------------------------------------
     ACTIVE
  ------------------------------------------------------- */

  if (
    typeof booking.active ===
      "boolean"
  ) {

    result.active =
      booking.active;

  }


  return Object.keys(
    result
  ).length > 0
    ? result
    : null;

}


/* =========================================================
   NORMALIZE PARAMETER SOURCE
========================================================= */

function getBookingParameters(
  params,
  booking
) {

  /*
   * booking is preferred because it normally contains
   * the complete conversational booking state.
   */

  const source =
    booking &&
    typeof booking ===
      "object"
      ? booking
      : params &&
        typeof params ===
          "object"
        ? params
        : null;


  return sanitizeBookingParams(
    source
  );

}


/* =========================================================
   NAVIGATION DELAY
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
   EXECUTOR
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


  /* =======================================================
     INVALID ACTION
  ======================================================= */

  if (
    !action ||
    action ===
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
    action ===
    "SHOW_CURRENT_PAGE"
  ) {

    return {

      success:
        true,

      action,

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
    action ===
    "GO_BACK"
  ) {

    if (
      typeof navigate !==
      "function"
    ) {

      return {

        success:
          false,

        action,

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

      action,

      navigated:
        true,

      route:
        null,

    };

  }


  /* =======================================================
     ACTION DEFINITION
  ======================================================= */

  const definition =
    ACTIONS[
      action
    ];


  if (
    !definition
  ) {

    return {

      success:
        false,

      action,

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
    action ===
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

      action,

      navigated:
        false,

      reason:
        "Action has no route.",

    };

  }


  /* =======================================================
     BOOKING PARAMETERS
  ======================================================= */

  const bookingParameters =
    action ===
    "OPEN_BOOKING"
      ? getBookingParameters(
          params,
          booking
        )
      : null;


  /* =======================================================
     ROUTE STATE
  ======================================================= */

  const navigationState = {};


  navigationState.assistantAction =
    action;


  /*
   * Store generic parameters.
   */

  if (
    params &&
    typeof params ===
      "object"
  ) {

    navigationState.assistantParams =
      params;

  }


  /*
   * Store COMPLETE booking state.
   *
   * This is the important part.
   */

  if (
    action ===
      "OPEN_BOOKING" &&
    bookingParameters
  ) {

    navigationState.assistantBooking =
      bookingParameters;

  }


  /* =======================================================
     NAVIGATE FUNCTION
  ======================================================= */

  if (
    typeof navigate !==
    "function"
  ) {

    return {

      success:
        false,

      action,

      navigated:
        false,

      route,

      params:
        bookingParameters ||
        params ||
        null,

      reason:
        "navigate function is unavailable.",

    };

  }


  /* =======================================================
     SAME ROUTE
  ======================================================= */

  /*
   * Even if already inside FarmerBook,
   * push the booking state again.
   *
   * This allows:

      user is already on /farmer/book

      "book 50kg paddy"

   * to update the current form.
   */

  const sameRoute =
    currentPath ===
    route;


  if (
    sameRoute &&
    action !==
      "OPEN_BOOKING"
  ) {

    return {

      success:
        true,

      action,

      navigated:
        false,

      route,

      params:
        params ||
        null,

    };

  }


  /* =======================================================
     NAVIGATION
  ======================================================= */

  await wait(
    NAVIGATION_DELAY
  );


  /*
   * Re-check action-specific state immediately
   * before navigation.
   */

  if (
    action ===
      "OPEN_BOOKING" &&
    bookingParameters
  ) {

    navigate(

      BOOKING_ROUTE,

      {

        state: {

          assistantAction:
            "OPEN_BOOKING",

          assistantParams:
            bookingParameters,

          assistantBooking:
            bookingParameters,

        },

      }

    );

  } else {

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

  }


  /* =======================================================
     RESULT
  ======================================================= */

  return {

    success:
      true,

    action,

    navigated:
      true,

    route:
      action ===
        "OPEN_BOOKING"
        ? BOOKING_ROUTE
        : route,

    params:
      bookingParameters ||
      params ||
      null,

  };

}


/* =========================================================
   BOOKING EXECUTOR
========================================================= */

/*
 * Dedicated helper for booking execution.
 *
 * This makes the booking flow explicit and keeps future
 * booking logic easy to extend.
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
        "OPEN_BOOKING",

      navigated:
        false,

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
   CHECK WHETHER BOOKING DATA EXISTS
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
      safe.slotStart
    )
  );

}


/* =========================================================
   EXECUTOR OBJECT
========================================================= */

export const assistantExecutor = {

  execute:
    executeAssistantAction,

  booking:
    executeBooking,

  sanitizeBooking:
    sanitizeBookingParams,

  hasBooking:
    hasBookingParameters,

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

}


/* =========================================================
   DEFAULT EXPORT
========================================================= */

export default assistantExecutor;