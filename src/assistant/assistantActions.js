/* =========================================================
   KRISHISETU ASSISTANT ACTION REGISTRY
=========================================================

   This file is the single source of truth for actions
   the KrishiSetu AI assistant can perform.

   FLOW:

   User message
        ↓
   intentEngine.js
        ↓
   ACTIONS[action]
        ↓
   action metadata
        ↓
   VoiceAssistant.jsx
        ↓
   React Router / page interaction


   IMPORTANT:

   - Do not hard-code assistant routes in multiple files.
   - Add new assistant actions here first.
   - intentEngine.js should detect the action.
   - VoiceAssistant.jsx should execute the action.
   - Page-specific behavior can use router state.

========================================================= */


/* =========================================================
   ACTION DEFINITIONS
========================================================= */

export const ACTIONS = {


  /* =======================================================
     HOME
  ======================================================= */

  OPEN_HOME: {

    id:
      "OPEN_HOME",

    route:
      "/farmer/home",

    label:
      "Farmer Home",

    description:
      "Open the farmer dashboard.",

    category:
      "navigation",

    type:
      "route",

    requiresConfirmation:
      false,

    acceptsParams:
      false,

    aliases: [

      "home",
      "homepage",
      "home page",
      "farmer home",
      "farmer dashboard",
      "dashboard",
      "dash board",
      "main page",
      "main screen",
      "start page",

      "होम",
      "होम पेज",
      "किसान होम",
      "किसान डैशबोर्ड",
      "डैशबोर्ड",
      "मुख्य पेज",
      "मुख्य स्क्रीन",

      "హోమ్",
      "హోమ్ పేజ్",
      "రైతు హోమ్",
      "రైతు డ్యాష్‌బోర్డ్",
      "డ్యాష్‌బోర్డ్",
      "ప్రధాన పేజీ",

    ],

  },


  /* =======================================================
     BOOKING
  ======================================================= */

  OPEN_BOOKING: {

    id:
      "OPEN_BOOKING",

    route:
      "/farmer/book",

    label:
      "Book Procurement Slot",

    description:
      "Open the procurement booking page.",

    category:
      "navigation",

    type:
      "route",

    requiresConfirmation:
      false,

    acceptsParams:
      true,

    parameterType:
      "booking",

    aliases: [

      "book",
      "booking",
      "booking page",
      "book page",
      "book slot",
      "book a slot",
      "booking slot",
      "new booking",
      "new slot",
      "procurement",
      "procurement booking",
      "procurement slot",
      "procurement page",
      "sell crop",
      "sell my crop",
      "sell produce",
      "sell my produce",
      "procurement center booking",

      "बुक",
      "बुकिंग",
      "बुकिंग पेज",
      "बुक स्लॉट",
      "नया स्लॉट",
      "नई बुकिंग",
      "खरीद",
      "खरीद बुकिंग",
      "फसल बेचने",
      "फसल बेचने की बुकिंग",

      "బుక్",
      "బుకింగ్",
      "బుకింగ్ పేజీ",
      "స్లాట్",
      "కొత్త బుకింగ్",
      "కొత్త స్లాట్",
      "కొనుగోలు బుకింగ్",
      "పంట అమ్మకం",

    ],

  },


  /* =======================================================
     TOKEN
  ======================================================= */

  OPEN_TOKEN: {

    id:
      "OPEN_TOKEN",

    route:
      "/farmer/token",

    label:
      "Token / Booking Tracking",

    description:
      "Open the farmer's active token and booking tracking page.",

    category:
      "navigation",

    type:
      "route",

    requiresConfirmation:
      false,

    acceptsParams:
      false,

    aliases: [

      "token",
      "my token",
      "latest token",
      "token page",
      "token details",
      "booking token",
      "booking details",
      "my booking",
      "active token",
      "current token",
      "tracking",
      "booking tracking",
      "track booking",

      "टोकन",
      "मेरा टोकन",
      "लेटेस्ट टोकन",
      "टोकन पेज",
      "टोकन विवरण",
      "बुकिंग विवरण",
      "मेरी बुकिंग",
      "बुकिंग ट्रैकिंग",

      "టోకెన్",
      "నా టోకెన్",
      "లేటెస్ట్ టోకెన్",
      "టోకెన్ పేజీ",
      "టోకెన్ వివరాలు",
      "బుకింగ్ వివరాలు",
      "నా బుకింగ్",
      "బుకింగ్ ట్రాకింగ్",

    ],

  },


  /* =======================================================
     PROCUREMENT HISTORY
  ======================================================= */

  OPEN_HISTORY: {

    id:
      "OPEN_HISTORY",

    route:
      "/farmer/history",

    label:
      "Procurement History",

    description:
      "Open previous procurement and booking records.",

    category:
      "navigation",

    type:
      "route",

    requiresConfirmation:
      false,

    acceptsParams:
      false,

    aliases: [

      "history",
      "my history",
      "booking history",
      "procurement history",
      "purchase history",
      "past bookings",
      "old bookings",
      "previous bookings",
      "previous booking",
      "records",
      "my records",
      "history page",
      "past procurement",
      "procurement records",

      "इतिहास",
      "मेरी हिस्ट्री",
      "हिस्ट्री",
      "बुकिंग हिस्ट्री",
      "खरीद इतिहास",
      "पुरानी बुकिंग",
      "पिछली बुकिंग",
      "रिकॉर्ड",
      "खरीद रिकॉर्ड",

      "చరిత్ర",
      "నా హిస్టరీ",
      "హిస్టరీ",
      "బుకింగ్ హిస్టరీ",
      "కొనుగోలు చరిత్ర",
      "పాత బుకింగ్‌లు",
      "మునుపటి బుకింగ్‌లు",
      "రికార్డులు",

    ],

  },


  /* =======================================================
     PAYMENTS
  ======================================================= */

  OPEN_PAYMENTS: {

    id:
      "OPEN_PAYMENTS",

    route:
      "/farmer/payments",

    label:
      "Payment History",

    description:
      "Open payment records and payment history.",

    category:
      "navigation",

    type:
      "route",

    requiresConfirmation:
      false,

    acceptsParams:
      false,

    aliases: [

      "payment",
      "payments",
      "payment history",
      "payment page",
      "payments page",
      "payment record",
      "payment records",
      "my payment",
      "my payments",
      "my payment history",
      "paid payments",
      "payment details",
      "payment information",
      "payment transactions",
      "money received",
      "money paid",
      "payment section",

      "पेमेंट",
      "भुगतान",
      "भुगतान इतिहास",
      "पेमेंट हिस्ट्री",
      "पेमेंट पेज",
      "भुगतान रिकॉर्ड",
      "भुगतान विवरण",
      "पेमेंट डिटेल",
      "भुगतान जानकारी",
      "भुगतान लेनदेन",
      "पैसे का रिकॉर्ड",

      "చెల్లింపు",
      "పేమెంట్",
      "పేమెంట్ హిస్టరీ",
      "పేమెంట్ పేజీ",
      "చెల్లింపు చరిత్ర",
      "చెల్లింపు వివరాలు",
      "చెల్లింపు రికార్డులు",
      "పేమెంట్ డీటెయిల్స్",
      "చెల్లింపు సమాచారం",

    ],

  },


  /* =======================================================
     NOTIFICATIONS
  ======================================================= */

  OPEN_NOTIFICATIONS: {

    id:
      "OPEN_NOTIFICATIONS",

    /*
     * Notifications currently live inside Farmer Home.
     *
     * VoiceAssistant.jsx can use this action's `route`
     * together with `routeState` to tell Farmer Home
     * which interface should open.
     *
     * Recommended future route:
     *     /farmer/notifications
     */

    route:
      "/farmer/home",

    routeState: {

      openNotifications:
        true,

    },

    label:
      "Notifications",

    description:
      "Open the farmer notification interface.",

    category:
      "navigation",

    type:
      "route-state",

    requiresConfirmation:
      false,

    acceptsParams:
      false,

    aliases: [

      "notification",
      "notifications",
      "my notifications",
      "notification page",
      "notification center",
      "notification area",
      "latest notification",
      "alerts",
      "alert",
      "updates",
      "latest updates",
      "messages",
      "announcements",
      "my alerts",

      "नोटिफिकेशन",
      "मेरे नोटिफिकेशन",
      "नोटिफिकेशन पेज",
      "नोटिफिकेशन सेंटर",
      "सूचनाएं",
      "अलर्ट",
      "अपडेट",
      "नवीनतम अपडेट",
      "संदेश",
      "घोषणाएं",
      "मेरे अलर्ट",

      "నోటిఫికేషన్",
      "నోటిఫికేషన్స్",
      "నా నోటిఫికేషన్స్",
      "నోటిఫికేషన్ పేజీ",
      "సూచనలు",
      "అలర్ట్స్",
      "అప్‌డేట్స్",
      "తాజా అప్‌డేట్స్",
      "సందేశాలు",

    ],

  },


  /* =======================================================
     SETTINGS
  ======================================================= */

  OPEN_SETTINGS: {

    id:
      "OPEN_SETTINGS",

    route:
      "/farmer/settings",

    label:
      "Farmer Settings",

    description:
      "Open farmer account and preference settings.",

    category:
      "navigation",

    type:
      "route",

    requiresConfirmation:
      false,

    acceptsParams:
      false,

    aliases: [

      "settings",
      "setting",
      "preferences",
      "account settings",
      "profile settings",
      "my settings",
      "settings page",
      "account preferences",
      "profile preferences",
      "app settings",
      "language settings",

      "सेटिंग",
      "सेटिंग्स",
      "प्रेफरेंस",
      "अकाउंट सेटिंग्स",
      "प्रोफाइल सेटिंग्स",
      "मेरी सेटिंग्स",
      "सेटिंग पेज",
      "भाषा सेटिंग",

      "సెట్టింగ్",
      "సెట్టింగ్స్",
      "ప్రాధాన్యతలు",
      "అకౌంట్ సెట్టింగ్స్",
      "ప్రొఫైల్ సెట్టింగ్స్",
      "నా సెట్టింగ్స్",
      "సెట్టింగ్స్ పేజీ",
      "భాషా సెట్టింగ్స్",

    ],

  },


  /* =======================================================
     HELP
  ======================================================= */

  OPEN_HELP: {

    id:
      "OPEN_HELP",

    route:
      "/farmer/help",

    label:
      "Farmer Help",

    description:
      "Open Help, support information and frequently asked questions.",

    category:
      "navigation",

    type:
      "route",

    requiresConfirmation:
      false,

    acceptsParams:
      false,

    aliases: [

      "help",
      "help page",
      "help center",
      "help section",
      "faq",
      "faqs",
      "frequently asked questions",
      "support",
      "support page",
      "assistance",
      "help me",
      "help please",

      "hepl",
      "helpp",
      "heeelp",
      "heeeelp",
      "heeeelp",
      "hlp",
      "helo",
      "halp",

      "मदद",
      "सहायता",
      "हेल्प",
      "हेल्प पेज",
      "सहायता पेज",
      "एफएक्यू",
      "सपोर्ट",
      "मदद पेज",

      "సహాయం",
      "హెల్ప్",
      "హెల్ప్ పేజీ",
      "ఎఫ్ఏక్యూ",
      "సపోర్ట్",
      "సహాయ పేజీ",

    ],

  },


  /* =======================================================
     GO BACK
  ======================================================= */

  GO_BACK: {

    id:
      "GO_BACK",

    route:
      null,

    label:
      "Previous Page",

    description:
      "Return to the previous browser history entry.",

    category:
      "navigation",

    type:
      "history-back",

    requiresConfirmation:
      false,

    acceptsParams:
      false,

    aliases: [

      "back",
      "go back",
      "take me back",
      "previous page",
      "previous screen",
      "last page",
      "return",
      "return back",
      "go to previous page",
      "back to previous page",
      "return to previous page",
      "previous",

      "वापस",
      "वापस जाओ",
      "वापस ले चलो",
      "पीछे",
      "पिछला",
      "पिछला पेज",
      "पिछले पेज",
      "पिछले पेज पर",
      "पिछले पेज पर वापस",
      "वापस पिछले पेज पर",

      "వెనక్కి",
      "వెనక్కి వెళ్ళు",
      "వెనక్కి తీసుకెళ్లండి",
      "వెనుకకు",
      "మునుపటి",
      "మునుపటి పేజీ",
      "మునుపటి పేజీకి",
      "వెనక్కి మునుపటి పేజీకి",

    ],

  },


  /* =======================================================
     CURRENT PAGE
  ======================================================= */

  SHOW_CURRENT_PAGE: {

    id:
      "SHOW_CURRENT_PAGE",

    route:
      null,

    label:
      "Current Page",

    description:
      "Tell the farmer which page is currently open.",

    category:
      "information",

    type:
      "information",

    requiresConfirmation:
      false,

    acceptsParams:
      false,

    aliases: [

      "where am i",
      "where am i now",
      "where are we",
      "where are we now",
      "what page is this",
      "which page is this",
      "what page am i on",
      "which page am i on",
      "what page are we on",
      "which page are we on",
      "current page",
      "current screen",
      "which screen is this",
      "what screen is this",

      "मैं कहाँ हूँ",
      "मैं अभी कहाँ हूँ",
      "हम कहाँ हैं",
      "अभी हम कहाँ हैं",
      "मैं किस पेज पर हूँ",
      "यह कौन सा पेज है",
      "कौन सा पेज है",
      "कौन सी स्क्रीन है",
      "वर्तमान पेज",

      "నేను ఎక్కడ ఉన్నాను",
      "నేను ఇప్పుడు ఎక్కడ ఉన్నాను",
      "మనం ఎక్కడ ఉన్నాం",
      "మనం ఇప్పుడు ఎక్కడ ఉన్నాం",
      "ఇది ఏ పేజీ",
      "నేను ఏ పేజీలో ఉన్నాను",
      "ప్రస్తుత పేజీ",
      "ఇది ఏ స్క్రీన్",

    ],

  },


  /* =======================================================
     NONE
  ======================================================= */

  NONE: {

    id:
      "NONE",

    route:
      null,

    label:
      "No Action",

    description:
      "No local assistant action was detected.",

    category:
      "none",

    type:
      "none",

    requiresConfirmation:
      false,

    acceptsParams:
      false,

    aliases: [],

  },

};


/* =========================================================
   ACTION HELPERS
========================================================= */


/*
 * Return an action definition.
 */

export function getAction(
  action
) {

  return (
    ACTIONS[
      action
    ] ||
    ACTIONS.NONE
  );

}


/*
 * Check whether an action exists.
 */

export function hasAction(
  action
) {

  return Boolean(
    ACTIONS[
      action
    ]
  );

}


/*
 * Return the action route.
 *
 * Returns null for:
 *
 * - GO_BACK
 * - SHOW_CURRENT_PAGE
 * - NONE
 */

export function getActionRoute(
  action
) {

  return (
    ACTIONS[
      action
    ]?.route ||
    null
  );

}


/*
 * Return optional router state.
 */

export function getActionRouteState(
  action
) {

  return (
    ACTIONS[
      action
    ]?.routeState ||
    null
  );

}


/*
 * Return all action IDs.
 */

export function getActionIds() {

  return Object.keys(
    ACTIONS
  );

}


/*
 * Return all registered actions.
 */

export function getAllActions() {

  return Object.values(
    ACTIONS
  );

}


/*
 * Return all navigation actions.
 */

export function getNavigationActions() {

  return Object.values(
    ACTIONS
  )
    .filter(
      action =>
        action.category ===
          "navigation"
    );

}


/*
 * Return all actions that actually use a route.
 */

export function getRouteActions() {

  return Object.values(
    ACTIONS
  )
    .filter(
      action =>
        Boolean(
          action.route
        )
    );

}


/*
 * Return all informational actions.
 */

export function getInformationActions() {

  return Object.values(
    ACTIONS
  )
    .filter(
      action =>
        action.category ===
        "information"
    );

}


/*
 * Return aliases for an action.
 */

export function getActionAliases(
  action
) {

  return (
    ACTIONS[
      action
    ]?.aliases ||
    []
  );

}


/*
 * Return whether an action accepts parameters.
 */

export function actionAcceptsParams(
  action
) {

  return Boolean(
    ACTIONS[
      action
    ]?.acceptsParams
  );

}


/*
 * Return an action parameter type.
 */

export function getActionParameterType(
  action
) {

  return (
    ACTIONS[
      action
    ]?.parameterType ||
    null
  );

}


/*
 * Return the action type.
 */

export function getActionType(
  action
) {

  return (
    ACTIONS[
      action
    ]?.type ||
    "none"
  );

}


/* =========================================================
   EXACT ALIAS LOOKUP
========================================================= */

/*
 * Exact lookup only.
 *
 * Fuzzy command interpretation belongs in
 * intentEngine.js.
 */

export function findActionByAlias(
  value
) {

  const text =
    String(
      value || ""
    )
      .trim()
      .toLowerCase();


  if (
    !text
  ) {

    return null;

  }


  for (
    const action of
    Object.values(
      ACTIONS
    )
  ) {

    const aliases =
      Array.isArray(
        action.aliases
      )
        ? action.aliases
        : [];


    const match =
      aliases.some(
        alias =>
          String(
            alias
          )
            .trim()
            .toLowerCase() ===
          text
      );


    if (
      match
    ) {

      return action;

    }

  }


  return null;

}


/* =========================================================
   NORMALIZED ALIAS LOOKUP
========================================================= */

function normalizeAliasText(
  value
) {

  return String(
    value || ""
  )
    .toLowerCase()
    .normalize(
      "NFKC"
    )
    .replace(
      /[^\p{L}\p{N}\s]/gu,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();

}


/*
 * This is useful when another component wants to
 * perform a lightweight alias search without importing
 * the full intent engine.
 */

export function findActionByNormalizedAlias(
  value
) {

  const text =
    normalizeAliasText(
      value
    );


  if (
    !text
  ) {

    return null;

  }


  for (
    const action of
    Object.values(
      ACTIONS
    )
  ) {

    const aliases =
      Array.isArray(
        action.aliases
      )
        ? action.aliases
        : [];


    const match =
      aliases.some(
        alias =>
          normalizeAliasText(
            alias
          ) ===
          text
      );


    if (
      match
    ) {

      return action;

    }

  }


  return null;

}


/* =========================================================
   ACTION SUMMARY
========================================================= */

/*
 * Useful for sending the action registry to a backend
 * or building an assistant capability screen.
 *
 * Deliberately excludes aliases to keep payloads smaller.
 */

export function getActionSummary() {

  return Object.values(
    ACTIONS
  ).map(
    action => ({

      id:
        action.id,

      label:
        action.label,

      description:
        action.description,

      category:
        action.category,

      type:
        action.type,

      route:
        action.route,

      requiresConfirmation:
        Boolean(
          action.requiresConfirmation
        ),

      acceptsParams:
        Boolean(
          action.acceptsParams
        ),

      parameterType:
        action.parameterType ||
        null,

    })
  );

}


/* =========================================================
   CAPABILITY CHECK
========================================================= */

/*
 * Used by future "What can you do?" functionality.
 */

export function getAssistantCapabilities() {

  return Object.values(
    ACTIONS
  )
    .filter(
      action =>
        action.id !==
        "NONE"
    )
    .map(
      action => ({

        id:
          action.id,

        label:
          action.label,

        description:
          action.description,

        category:
          action.category,

        type:
          action.type,

      })
    );

}


/* =========================================================
   DEVELOPMENT VALIDATION
========================================================= */

export function validateActions() {

  const errors = [];


  const ids =
    new Set();


  Object.entries(
    ACTIONS
  )
    .forEach(
      ([
        key,
        action,
      ]) => {


        /* -----------------------------------------------
           Basic object validation
        ----------------------------------------------- */

        if (
          !action ||
          typeof action !==
            "object"
        ) {

          errors.push(
            `${key}: action definition is invalid.`
          );

          return;

        }


        /* -----------------------------------------------
           ID
        ----------------------------------------------- */

        if (
          action.id !==
          key
        ) {

          errors.push(
            `${key}: id does not match action key.`
          );

        }


        if (
          ids.has(
            action.id
          )
        ) {

          errors.push(
            `${key}: duplicate action id.`
          );

        }


        ids.add(
          action.id
        );


        /* -----------------------------------------------
           Label
        ----------------------------------------------- */

        if (
          !action.label ||
          typeof action.label !==
            "string"
        ) {

          errors.push(
            `${key}: missing label.`
          );

        }


        /* -----------------------------------------------
           Description
        ----------------------------------------------- */

        if (
          !action.description ||
          typeof action.description !==
            "string"
        ) {

          errors.push(
            `${key}: missing description.`
          );

        }


        /* -----------------------------------------------
           Category
        ----------------------------------------------- */

        const validCategories = [

          "navigation",
          "information",
          "none",

        ];


        if (
          !validCategories.includes(
            action.category
          )
        ) {

          errors.push(
            `${key}: invalid category.`
          );

        }


        /* -----------------------------------------------
           Type
        ----------------------------------------------- */

        const validTypes = [

          "route",
          "route-state",
          "history-back",
          "information",
          "none",

        ];


        if (
          !validTypes.includes(
            action.type
          )
        ) {

          errors.push(
            `${key}: invalid type.`
          );

        }


        /* -----------------------------------------------
           Route
        ----------------------------------------------- */

        if (
          action.category ===
            "navigation" &&
          action.id !==
            "GO_BACK" &&
          !action.route
        ) {

          errors.push(
            `${key}: navigation action requires a route or special handling.`
          );

        }


        if (
          action.route &&
          typeof action.route !==
            "string"
        ) {

          errors.push(
            `${key}: route must be a string or null.`
          );

        }


        /* -----------------------------------------------
           Aliases
        ----------------------------------------------- */

        if (
          !Array.isArray(
            action.aliases
          )
        ) {

          errors.push(
            `${key}: aliases must be an array.`
          );

        }


        /* -----------------------------------------------
           Parameter configuration
        ----------------------------------------------- */

        if (
          action.acceptsParams &&
          !action.parameterType
        ) {

          errors.push(
            `${key}: parameterType required when acceptsParams is true.`
          );

        }


        /* -----------------------------------------------
           NONE
        ----------------------------------------------- */

        if (
          key ===
          "NONE"
        ) {

          if (
            action.category !==
            "none"
          ) {

            errors.push(
              "NONE: category must be 'none'."
            );

          }

          if (
            action.route
          ) {

            errors.push(
              "NONE: route must be null."
            );

          }

        }


        /* -----------------------------------------------
           SHOW_CURRENT_PAGE
        ----------------------------------------------- */

        if (
          key ===
          "SHOW_CURRENT_PAGE"
        ) {

          if (
            action.category !==
            "information"
          ) {

            errors.push(
              "SHOW_CURRENT_PAGE: category must be 'information'."
            );

          }

          if (
            action.route
          ) {

            errors.push(
              "SHOW_CURRENT_PAGE: route must be null."
            );

          }

        }


        /* -----------------------------------------------
           GO_BACK
        ----------------------------------------------- */

        if (
          key ===
          "GO_BACK"
        ) {

          if (
            action.route
          ) {

            errors.push(
              "GO_BACK: route must be null."
            );

          }

          if (
            action.type !==
            "history-back"
          ) {

            errors.push(
              "GO_BACK: type should be 'history-back'."
            );

          }

        }


        /* -----------------------------------------------
           Route state
        ----------------------------------------------- */

        if (
          action.routeState !==
            undefined &&
          (
            !action.routeState ||
            typeof action.routeState !==
              "object"
          )
        ) {

          errors.push(
            `${key}: routeState must be an object when provided.`
          );

        }

      }
    );


  return {

    valid:
      errors.length ===
      0,

    errors,

  };

}


/* =========================================================
   DEVELOPMENT CHECK
========================================================= */

if (
  typeof import.meta !==
    "undefined" &&
  import.meta.env?.DEV
) {

  const validation =
    validateActions();


  if (
    !validation.valid
  ) {

    console.warn(
      "[KrishiSetu AI] Invalid action registry:",
      validation.errors
    );

  }

}