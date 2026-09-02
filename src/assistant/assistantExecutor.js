/* =========================================================
   KRISHISETU AI ASSISTANT EXECUTOR
========================================================= */

import {
  ACTIONS,
} from "./assistantActions";

import {
  sanitizeActionParams,
} from "./assistantUtils";


/* =========================================================
   CONSTANTS
========================================================= */

const DEFAULT_ROUTE =
  "/farmer/home";


const NAVIGATION_DELAY =
  450;


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


  /*
   * -------------------------------------------------------
   * INVALID ACTION
   * -------------------------------------------------------
   */

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

      reason:
        "No action provided.",

    };

  }


  /*
   * -------------------------------------------------------
   * CURRENT PAGE
   * -------------------------------------------------------
   */

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

    };

  }


  /*
   * -------------------------------------------------------
   * GO BACK
   * -------------------------------------------------------
   */

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


    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          NAVIGATION_DELAY
        )
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


  /*
   * -------------------------------------------------------
   * ACTION DEFINITION
   * -------------------------------------------------------
   */

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


  /*
   * -------------------------------------------------------
   * ROUTE
   * -------------------------------------------------------
   */

  let route =
    definition.route;


  /*
   * Notifications currently belong
   * to the farmer home page.
   */

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


  /*
   * -------------------------------------------------------
   * ALREADY THERE
   *
   * Important:
   *
   * If this is OPEN_BOOKING and parameters exist,
   * we MUST still send the state even when already
   * on /farmer/book.
   * -------------------------------------------------------
   */

  const safeParams =
    sanitizeActionParams(
      params ||
      booking ||
      null
    );


  /*
   * -------------------------------------------------------
   * ROUTE STATE
   * -------------------------------------------------------
   */

  const navigationState = {};


  if (
    safeParams
  ) {

    navigationState.assistantAction =
      action;

    navigationState.assistantParams =
      safeParams;


    if (
      action ===
      "OPEN_BOOKING"
    ) {

      navigationState.assistantBooking =
        safeParams;

    }

  }


  /*
   * -------------------------------------------------------
   * NAVIGATION
   * -------------------------------------------------------
   */

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
        safeParams,

      reason:
        "navigate function is unavailable.",

    };

  }


  /*
   * If already on the same route:
   *
   * - still push state when booking parameters exist
   * - otherwise do nothing
   */

  if (
    currentPath ===
      route &&
    !safeParams
  ) {

    return {

      success:
        true,

      action,

      navigated:
        false,

      route,

      params:
        null,

    };

  }


  await new Promise(
    resolve =>
      setTimeout(
        resolve,
        NAVIGATION_DELAY
      )
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


  return {

    success:
      true,

    action,

    navigated:
      true,

    route,

    params:
      safeParams,

  };

}


/* =========================================================
   EXECUTOR OBJECT
========================================================= */

export const assistantExecutor = {

  execute:
    executeAssistantAction,

};


/* =========================================================
   DEFAULT EXPORT
========================================================= */

export default assistantExecutor;