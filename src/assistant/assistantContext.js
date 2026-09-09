/* =========================================================
   KRISHISETU AI ASSISTANT CONTEXT

   Central runtime context for the assistant.

   This module describes:
   - current page
   - farmer identity/profile
   - crops
   - bookings
   - current/latest token
   - booking history
   - payments
   - conversation
   - pending actions
   - booking draft
   - available assistant capabilities

   It does NOT submit bookings, cancel bookings, or navigate.
   Those responsibilities stay in the controller/executor.
========================================================= */

import {
  ACTIONS,
  getAction,
  getActionIds,
  getNavigationActions,
} from "./assistantActions";

import {
  getCurrentFarmer,
  getState,
} from "../data/appStore";

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

const BOOKING_STATE_STORAGE_KEY =
  "krishisetu_ai_booking_state";

const BOOKING_STORAGE_KEY =
  "krishisetu_ai_booking_draft";

const BOOKING_AVAILABILITY_STORAGE_KEY =
  "krishisetu_ai_booking_availability";

const PENDING_ACTION_TTL =
  5 * 60 * 1000;

const BOOKING_STATE_TTL =
  15 * 60 * 1000;

const AVAILABILITY_TTL =
  5 * 60 * 1000;

const MAX_CONTEXT_HISTORY =
  12;

const MAX_CONTEXT_MESSAGES =
  20;

const MAX_BOOKINGS_IN_CONTEXT =
  25;

const MAX_PAYMENTS_IN_CONTEXT =
  25;

/* =========================================================
   PAGE DEFINITIONS
========================================================= */

const PAGE_METADATA = {
  "/farmer/home": {
    id: "FARMER_HOME",
    name: "Farmer Home",
    section: "farmer",
    capabilities: [
      "view dashboard",
      "view notifications",
      "view farmer overview",
      "view procurement summary",
      "view booking summary",
      "view current token",
      "view recent payment",
    ],
  },

  "/farmer/book": {
    id: "FARMER_BOOKING",
    name: "Book Procurement Slot",
    section: "farmer",
    capabilities: [
      "create booking",
      "select crop",
      "enter quantity",
      "select procurement center",
      "select procurement date",
      "select procurement slot",
      "review booking",
      "confirm booking",
      "cancel booking draft",
    ],
  },

  "/farmer/token": {
    id: "FARMER_TOKEN",
    name: "Token / Booking Tracking",
    section: "farmer",
    capabilities: [
      "view token",
      "view booking",
      "track booking",
      "view booking status",
      "download booking qr",
      "download booking receipt",
      "view booking payment",
      "cancel eligible booking",
    ],
  },

  "/farmer/history": {
    id: "FARMER_HISTORY",
    name: "Procurement History",
    section: "farmer",
    capabilities: [
      "view procurement history",
      "view previous bookings",
      "view previous procurement records",
      "find booking by date",
      "find booking by token",
    ],
  },

  "/farmer/payments": {
    id: "FARMER_PAYMENTS",
    name: "Payment History",
    section: "farmer",
    capabilities: [
      "view payment history",
      "view payment records",
      "view payment status",
      "find payment by booking",
      "find payment by token",
    ],
  },

  "/farmer/settings": {
    id: "FARMER_SETTINGS",
    name: "Farmer Settings",
    section: "farmer",
    capabilities: [
      "view account settings",
      "edit preferences",
      "manage account settings",
    ],
  },

  "/farmer/help": {
    id: "FARMER_HELP",
    name: "Farmer Help",
    section: "farmer",
    capabilities: [
      "view help",
      "view frequently asked questions",
      "find support information",
    ],
  },

  "/farmer/login": {
    id: "FARMER_LOGIN",
    name: "Farmer Login",
    section: "authentication",
    capabilities: [
      "login",
      "authenticate farmer",
    ],
  },

  "/farmer/register": {
    id: "FARMER_REGISTER",
    name: "Farmer Registration",
    section: "authentication",
    capabilities: [
      "register farmer",
      "create farmer account",
    ],
  },
};

/* =========================================================
   GENERIC HELPERS
========================================================= */

function normalizeStatus(value) {
  return String(
    value || ""
  )
    .trim()
    .toUpperCase();
}

function normalizeId(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value);
}

function normalizePhone(value) {
  return String(
    value || ""
  ).replace(
    /\D/g,
    ""
  );
}

function firstValue(
  ...values
) {
  for (
    const value of values
  ) {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      return value;
    }
  }

  return null;
}

function bookingFarmerId(
  booking
) {
  return firstValue(
    booking?.farmerId,
    booking?.farmer_id,
    booking?.farmer?.id
  );
}

function bookingCenterId(
  booking
) {
  return firstValue(
    booking?.centerId,
    booking?.center_id
  );
}

function bookingCrop(
  booking
) {
  return firstValue(
    booking?.crop,
    booking?.cropId,
    booking?.crop_id,
    booking?.cropName
  );
}

function bookingQuantity(
  booking
) {
  return firstValue(
    booking?.estimatedQuantity,
    booking?.estimated_quantity,
    booking?.quantity,
    booking?.actualQuantity,
    booking?.actual_quantity
  );
}

function bookingToken(
  booking
) {
  return firstValue(
    booking?.token,
    booking?.tokenNumber,
    booking?.token_no,
    booking?.token_number
  );
}

function bookingDate(
  booking
) {
  return firstValue(
    booking?.date,
    booking?.bookingDate,
    booking?.booking_date
  );
}

function bookingStatus(
  booking
) {
  return normalizeStatus(
    booking?.status
  );
}

function bookingCreatedAt(
  booking
) {
  return firstValue(
    booking?.createdAt,
    booking?.created_at,
    booking?.timestamp,
    bookingDate(booking)
  );
}

function paymentObject(
  booking
) {
  return (
    booking?.payment ||
    booking?.paymentDetails ||
    booking?.payment_details ||
    null
  );
}

function paymentAmount(
  booking
) {
  const payment =
    paymentObject(
      booking
    );

  return firstValue(
    payment?.amount,
    payment?.paymentAmount,
    booking?.payment_amount,
    booking?.amount
  );
}

function paymentStatus(
  booking
) {
  const payment =
    paymentObject(
      booking
    );

  return firstValue(
    payment?.status,
    booking?.payment_status
  );
}

function paymentReference(
  booking
) {
  const payment =
    paymentObject(
      booking
    );

  return firstValue(
    payment?.reference,
    payment?.paymentReference,
    payment?.payment_reference,
    booking?.payment_reference
  );
}

function sortNewestFirst(
  rows = []
) {
  return (
    Array.isArray(rows)
      ? rows
      : []
  )
    .slice()
    .sort(
      (
        a,
        b
      ) =>
        String(
          bookingCreatedAt(b) ||
          ""
        ).localeCompare(
          String(
            bookingCreatedAt(a) ||
            ""
          )
        )
    );
}

function isExcludedBookingStatus(
  status
) {
  return [
    "CANCELLED",
    "CANCELED",
    "REJECTED",
    "EXPIRED",
  ].includes(
    normalizeStatus(status)
  );
}

function isActiveBooking(
  booking
) {
  return (
    Boolean(
      bookingToken(
        booking
      )
    ) &&
    !isExcludedBookingStatus(
      bookingStatus(
        booking
      )
    )
  );
}

function isPaymentRecord(
  booking
) {
  return Boolean(
    paymentObject(
      booking
    ) ||
    paymentAmount(
      booking
    ) !== null ||
    paymentStatus(
      booking
    ) !== null ||
    paymentReference(
      booking
    )
  );
}

/* =========================================================
   CURRENT PAGE
========================================================= */

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

    capabilities:
      [],

    pathname:
      normalized,

    known:
      false,
  };
}

export function getCurrentPageCapabilities(
  pathname
) {
  return [
    ...getCurrentPageMetadata(
      pathname
    ).capabilities,
  ];
}

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

export function hasPendingAction() {
  return Boolean(
    getPendingAction()
  );
}

/* =========================================================
   BOOKING DRAFT CONTEXT
========================================================= */

function getBookingDraft() {
  const canonical =
    readStorageJson(
      BOOKING_STORAGE_KEY,
      null
    );

  const fallback =
    readStorageJson(
      BOOKING_STATE_STORAGE_KEY,
      null
    );

  const draft =
    canonical &&
    typeof canonical ===
      "object"
      ? canonical
      : fallback;

  if (
    !draft ||
    typeof draft !==
      "object"
  ) {
    return null;
  }

  const updatedAt =
    Number(
      draft.updatedAt ||
      0
    );

  if (
    updatedAt &&
    Date.now() -
      updatedAt >
      BOOKING_STATE_TTL
  ) {
    return null;
  }

  return {
    ...draft,

    active:
      draft.active !==
      false,
  };
}

function getBookingAvailabilityContext() {
  const context =
    readStorageJson(
      BOOKING_AVAILABILITY_STORAGE_KEY,
      null
    );

  if (
    !context ||
    typeof context !==
      "object"
  ) {
    return null;
  }

  const updatedAt =
    Number(
      context.updatedAt ||
      0
    );

  if (
    updatedAt &&
    Date.now() -
      updatedAt >
      AVAILABILITY_TTL
  ) {
    return null;
  }

  return {
    availableDates:
      Array.isArray(
        context.availableDates
      )
        ? context.availableDates
        : [],

    availableSlots:
      Array.isArray(
        context.availableSlots
      )
        ? context.availableSlots
        : [],

    availableCenters:
      Array.isArray(
        context.availableCenters
      )
        ? context.availableCenters
        : [],

    selectedDate:
      context.selectedDate ||
      null,

    selectedCenterId:
      context.selectedCenterId ||
      null,

    updatedAt,
  };
}

/* =========================================================
   ACTION CONTEXT
========================================================= */

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

  if (!definition) {
    return null;
  }

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

export function getAvailableNavigationActions() {
  return getNavigationActions()
    .map(
      action =>
        getActionContext(
          action.id
        )
    )
    .filter(Boolean);
}

export function getAvailableActionIds() {
  return getActionIds();
}

/* =========================================================
   CONVERSATION STATE
========================================================= */

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

export function getConversationRelation(
  history,
  message
) {
  const current =
    cleanText(
      message
    );

  const safeHistory =
    Array.isArray(
      history
    )
      ? history
      : [];

  const lastUser =
    getLastUserMessage(
      safeHistory
    );

  const lastAssistant =
    getLastAssistantMessage(
      safeHistory
    );

  const pending =
    getPendingAction();

  const bookingDraft =
    getBookingDraft();

  if (
    pending &&
    current
  ) {
    return {
      type:
        "PENDING_ACTION_EXISTS",

      pendingAction:
        pending.action,

      pendingParams:
        pending.params ||
        pending.booking ||
        null,
    };
  }

  if (
    bookingDraft?.active &&
    current
  ) {
    return {
      type:
        "ACTIVE_BOOKING_DRAFT",

      bookingStep:
        bookingDraft.step ||
        null,

      bookingDate:
        bookingDraft.date ||
        null,

      bookingCenterId:
        bookingDraft.centerId ||
        null,

      bookingSlot:
        bookingDraft.slotDisplay ||
        null,

      readyForConfirmation:
        Boolean(
          bookingDraft.readyForConfirmation
        ),

      confirmed:
        Boolean(
          bookingDraft.confirmed
        ),
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

  const pronounPattern =
    /\b(it|that|this|there|them|those|same|one)\b/i;

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

  const confirmationPattern =
    /^(yes|yeah|yep|yup|sure|okay|ok|confirm|confirmed|book it|do it|go ahead|haan|हां|हाँ|ठीक|ठीक है|अवश्य|అవును|సరే)\b/i;

  if (
    confirmationPattern.test(
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

export function getFarmerContext() {
  const farmer =
    getStoredFarmer() ||
    {};

  const currentFarmer =
    getCurrentFarmer() ||
    null;

  const appState =
    getState() ||
    {};

  const farmerId =
    normalizeId(
      firstValue(
        farmer.farmerId,
        farmer.farmer_id,
        farmer.id,
        currentFarmer?.id
      )
    );

  const farmerPhone =
    normalizePhone(
      firstValue(
        farmer.phone,
        currentFarmer?.phone
      )
    );

  /*
   * --------------------------------------------------------
   * PROFILE
   * --------------------------------------------------------
   */

  const profile =
    currentFarmer
      ? {
          id:
            currentFarmer.id,

          name:
            currentFarmer.name,

          phone:
            currentFarmer.phone,

          village:
            currentFarmer.village,

          stateId:
            firstValue(
              currentFarmer.stateId,
              currentFarmer.state_id
            ),

          districtId:
            firstValue(
              currentFarmer.districtId,
              currentFarmer.district_id
            ),

          mandalId:
            firstValue(
              currentFarmer.mandalId,
              currentFarmer.mandal_id
            ),

          preferredCenterId:
            firstValue(
              currentFarmer.preferredCenterId,
              currentFarmer.preferred_center_id
            ),

          primaryCrop:
            firstValue(
              currentFarmer.primaryCrop,
              currentFarmer.primary_crop
            ),

          estimatedQuantity:
            firstValue(
              currentFarmer.estimatedQuantity,
              currentFarmer.estimated_quantity
            ),

          language:
            currentFarmer.language ||
            null,
        }
      : null;

  /*
   * --------------------------------------------------------
   * CROPS
   * --------------------------------------------------------
   */

  const crops =
    Array.isArray(
      appState.crops
    )
      ? appState.crops
          .map(
            crop => ({
              id:
                crop?.id,

              name:
                crop?.name,

              code:
                crop?.code ||
                crop?.slug ||
                null,
            })
          )
          .filter(
            crop =>
              crop.id ||
              crop.name
          )
      : [];

  /*
   * --------------------------------------------------------
   * BOOKINGS
   * --------------------------------------------------------
   */

  const allBookings =
    Array.isArray(
      appState.bookings
    )
      ? appState.bookings
      : [];

  const farmerBookings =
    allBookings.filter(
      booking => {
        const id =
          normalizeId(
            bookingFarmerId(
              booking
            )
          );

        const phone =
          normalizePhone(
            firstValue(
              booking?.farmer_phone,
              booking?.phone,
              booking?.farmer?.phone
            )
          );

        /*
         * If booking records contain no farmer id,
         * don't incorrectly hide them from the assistant
         * in a prototype environment.
         */
        if (
          !id &&
          !phone
        ) {
          return true;
        }

        return (
          Boolean(
            farmerId
          ) &&
          id ===
            farmerId
        ) ||
        (
          Boolean(
            farmerPhone
          ) &&
          phone ===
            farmerPhone
        );
      }
    );

  const recentBookings =
    sortNewestFirst(
      farmerBookings
    ).slice(
      0,
      MAX_BOOKINGS_IN_CONTEXT
    );

  /*
   * --------------------------------------------------------
   * BOOKING DERIVED DATA
   * --------------------------------------------------------
   */

  const activeBookings =
    recentBookings.filter(
      booking =>
        isActiveBooking(
          booking
        )
    );

  const latestBooking =
    recentBookings[0] ||
    null;

  const currentTokenBooking =
    activeBookings[0] ||
    null;

  const latestToken =
    bookingToken(
      currentTokenBooking
    ) ||
    bookingToken(
      latestBooking
    ) ||
    null;

  /*
   * --------------------------------------------------------
   * PAYMENT DERIVED DATA
   * --------------------------------------------------------
   */

  const recentPayments =
    sortNewestFirst(
      recentBookings.filter(
        booking =>
          isPaymentRecord(
            booking
          )
      )
    )
      .slice(
        0,
        MAX_PAYMENTS_IN_CONTEXT
      )
      .map(
        booking => ({
          bookingId:
            booking?.id ||
            null,

          token:
            bookingToken(
              booking
            ),

          amount:
            paymentAmount(
              booking
            ),

          status:
            paymentStatus(
              booking
            ),

          reference:
            paymentReference(
              booking
            ),

          date:
            bookingDate(
              booking
            ),

          bookingStatus:
            bookingStatus(
              booking
            ),
        })
      );

  /*
   * --------------------------------------------------------
   * BOOKING HISTORY
   * --------------------------------------------------------
   */

  const bookingHistory =
    recentBookings.map(
      booking => ({
        id:
          booking?.id ||
          null,

        token:
          bookingToken(
            booking
          ),

        date:
          bookingDate(
            booking
          ),

        status:
          bookingStatus(
            booking
          ),

        crop:
          bookingCrop(
            booking
          ),

        quantity:
          bookingQuantity(
            booking
          ),

        centerId:
          bookingCenterId(
            booking
          ),

        centerName:
          firstValue(
            booking?.centerName,
            booking?.center_name
          ),

        slotStart:
          firstValue(
            booking?.slotStart,
            booking?.slot_start
          ),

        slotEnd:
          firstValue(
            booking?.slotEnd,
            booking?.slot_end
          ),

        payment:
          isPaymentRecord(
            booking
          )
            ? {
                amount:
                  paymentAmount(
                    booking
                  ),

                status:
                  paymentStatus(
                    booking
                  ),

                reference:
                  paymentReference(
                    booking
                  ),
              }
            : null,
      })
    );

  /*
   * --------------------------------------------------------
   * DRAFT + AVAILABILITY
   * --------------------------------------------------------
   */

  const bookingDraft =
    getBookingDraft();

  const bookingAvailability =
    getBookingAvailabilityContext();

  return {
    authenticated:
      Boolean(
        farmerId ||
        farmerPhone ||
        currentFarmer?.id
      ),

    farmerId:
      firstValue(
        farmer.farmerId,
        farmer.farmer_id,
        farmer.id,
        currentFarmer?.id,
        ""
      ),

    phone:
      firstValue(
        farmer.phone,
        currentFarmer?.phone,
        ""
      ),

    profile,

    crops,

    latestBooking:
      latestBooking
        ? bookingHistory[0]
        : null,

    currentToken:
      currentTokenBooking
        ? {
            id:
              currentTokenBooking.id ||
              null,

            token:
              bookingToken(
                currentTokenBooking
              ),

            date:
              bookingDate(
                currentTokenBooking
              ),

            status:
              bookingStatus(
                currentTokenBooking
              ),

            centerId:
              bookingCenterId(
                currentTokenBooking
              ),

            centerName:
              firstValue(
                currentTokenBooking?.centerName,
                currentTokenBooking?.center_name
              ),

            crop:
              bookingCrop(
                currentTokenBooking
              ),

            quantity:
              bookingQuantity(
                currentTokenBooking
              ),
          }
        : null,

    latestToken,

    bookings:
      bookingHistory,

    bookingHistory,

    activeBookings:
      activeBookings.map(
        booking => ({
          id:
            booking?.id ||
            null,

          token:
            bookingToken(
              booking
            ),

          date:
            bookingDate(
              booking
            ),

          status:
            bookingStatus(
              booking
            ),

          crop:
            bookingCrop(
              booking
            ),

          quantity:
            bookingQuantity(
              booking
            ),

          centerId:
            bookingCenterId(
              booking
            ),

          centerName:
            firstValue(
              booking?.centerName,
              booking?.center_name
            ),
        })
      ),

    recentPayments,

    bookingDraft,

    bookingAvailability:
      bookingAvailability
        ? {
            availableDates:
              bookingAvailability.availableDates,

            availableSlots:
              bookingAvailability.availableSlots,

            availableCenters:
              bookingAvailability.availableCenters,

            selectedDate:
              bookingAvailability.selectedDate,

            selectedCenterId:
              bookingAvailability.selectedCenterId,

            updatedAt:
              bookingAvailability.updatedAt,
          }
        : null,

    totals: {
      bookings:
        recentBookings.length,

      activeBookings:
        activeBookings.length,

      payments:
        recentPayments.length,
    },
  };
}

/* =========================================================
   USER CAPABILITIES
========================================================= */

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
      "access farmer account",
      "view farmer profile",
      "view crops",
      "view bookings",
      "view booking history",
      "view current token",
      "view latest token",
      "view recent payments",
      "find booking by token",
      "find booking by date"
    );
  }

  if (
    farmer.authenticated &&
    farmer.bookingDraft?.active
  ) {
    capabilities.push(
      "continue booking",
      "modify booking draft",
      "cancel booking draft",
      "review booking draft"
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
   SPECIALIZED TOPIC DETECTION
========================================================= */

function detectFarmerTopics(
  message
) {
  const text =
    cleanText(
      message
    )
      .toLowerCase();

  const topics = [];

  if (
    /\b(crop|crops|produce|धान|गेहूं|मक्का|कपास|పంట|పంటలు)\b/i.test(
      text
    )
  ) {
    topics.push(
      "CROPS"
    );
  }

  if (
    /\b(token|tok[ae]n|टोकन|టోకెన్)\b/i.test(
      text
    )
  ) {
    topics.push(
      "TOKEN"
    );
  }

  if (
    /\b(booking|bookings|booked|my booking|booking details)\b/i.test(
      text
    )
  ) {
    topics.push(
      "BOOKING"
    );
  }

  if (
    /\b(history|previous|yesterday|last booking|old booking|recent booking|procurement history)\b/i.test(
      text
    )
  ) {
    topics.push(
      "HISTORY"
    );
  }

  if (
    /\b(payment|payments|paid|payment status|payment reference)\b/i.test(
      text
    )
  ) {
    topics.push(
      "PAYMENTS"
    );
  }

  if (
    /\b(qr|qr code|scan code)\b/i.test(
      text
    )
  ) {
    topics.push(
      "QR"
    );
  }

  if (
    /\b(receipt|bill|proof of payment|payment receipt)\b/i.test(
      text
    )
  ) {
    topics.push(
      "RECEIPT"
    );
  }

  if (
    /\b(cancel|cancellation|cancel booking|रद्द|रद्द करो|రద్దు)\b/i.test(
      text
    )
  ) {
    topics.push(
      "CANCELLATION"
    );
  }

  if (
    /\b(center|centers|centre|centres|procurement center|location)\b/i.test(
      text
    )
  ) {
    topics.push(
      "CENTERS"
    );
  }

  if (
    /\b(date|dates|tomorrow|today|yesterday|weekday)\b/i.test(
      text
    )
  ) {
    topics.push(
      "DATES"
    );
  }

  if (
    /\b(time|times|timing|timings|timming|timmings|slot|slots)\b/i.test(
      text
    )
  ) {
    topics.push(
      "TIMINGS"
    );
  }

  return [
    ...new Set(
      topics
    ),
  ];
}

/* =========================================================
   ENTITY REFERENCE DETECTION
========================================================= */

function detectEntityReferences(
  message
) {
  const text =
    cleanText(
      message
    )
      .toLowerCase();

  const tokenMatch =
    text.match(
      /\b(?:token|टोकन|टोकन\s*no\.?|token\s*no\.?|token\s*number|token\s*#)\s*([a-z0-9-]+)\b/i
    );

  const dateReference =
    /\b(today|tomorrow|tommorow|tmrw|yesterday|day after tomorrow|last booking|recent booking)\b/i.exec(
      text
    )?.[1] ||
    null;

  return {
    token:
      tokenMatch?.[1] ||
      null,

    dateReference,

    refersToCurrent:
      /\b(this|current|my current|current token|current booking)\b/i.test(
        text
      ),

    refersToLatest:
      /\b(latest|recent|newest|most recent)\b/i.test(
        text
      ),

    refersToPrevious:
      /\b(previous|last|yesterday|older|old)\b/i.test(
        text
      ),
  };
}

/* =========================================================
   ASSISTANT CONTEXT
========================================================= */

export function buildAssistantContext(
  options = {}
) {
  const {
    pathname = "",
    language = "en",
    history = [],
    message = "",
    pendingAction = undefined,
    includeHistory = true,
  } = options;

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

  const topics =
    detectFarmerTopics(
      message
    );

  const references =
    detectEntityReferences(
      message
    );

  return {
    version:
      "2.0",

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

    topics,

    entityReferences:
      references,

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

    timestamp:
      context.timestamp,

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

    topics:
      context.topics,

    entityReferences:
      context.entityReferences,

    farmer: {
      authenticated:
        context.farmer.authenticated,

      farmerId:
        context.farmer.farmerId,

      phone:
        context.farmer.phone,

      profile:
        context.farmer.profile,

      crops:
        context.farmer.crops,

      latestBooking:
        context.farmer.latestBooking,

      latestToken:
        context.farmer.latestToken,

      currentToken:
        context.farmer.currentToken,

      bookings:
        context.farmer.bookings,

      bookingHistory:
        context.farmer.bookingHistory,

      activeBookings:
        context.farmer.activeBookings,

      recentPayments:
        context.farmer.recentPayments,

      bookingDraft:
        context.farmer.bookingDraft,

      bookingAvailability:
        context.farmer.bookingAvailability,

      totals:
        context.farmer.totals,
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

    availableNavigationActions:
      context.availableNavigationActions,

    userCapabilities:
      context.userCapabilities,
  };
}

/* =========================================================
   ACTION VALIDATION
========================================================= */

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
   * Farmer actions require a farmer session.
   *
   * Public navigation remains allowed.
   */
  if (
    definition.category ===
      "FARMER" &&
    !context.farmer?.authenticated
  ) {
    return {
      valid:
        false,

      reason:
        "A farmer account is required for this action.",
    };
  }

  /*
   * Actions requiring a farmer booking can only be
   * considered valid when there is a booking reference,
   * a current booking, or a booking draft.
   */
  const actionText =
    `${definition.id || ""} ${
      definition.description || ""
    }`.toLowerCase();

  const requiresBookingReference =
    /\b(token|booking|receipt|qr|payment|history|cancel)\b/.test(
      actionText
    );

  if (
    requiresBookingReference &&
    !context.farmer?.authenticated
  ) {
    return {
      valid:
        false,

      reason:
        "A farmer account is required to access booking data.",
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

  const topics =
    Array.isArray(
      context.topics
    ) &&
    context.topics.length
      ? context.topics.join(
          ","
        )
      : "NONE";

  const latestToken =
    context.farmer?.latestToken ||
    context.farmer?.currentToken
      ?.token ||
    "NONE";

  const bookingCount =
    context.farmer?.totals
      ?.bookings ??
    0;

  return [
    `page=${page}`,
    `path=${path}`,
    `language=${language}`,
    `pending=${pending}`,
    `lastAction=${lastAction}`,
    `topics=${topics}`,
    `latestToken=${latestToken}`,
    `bookings=${bookingCount}`,
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

export default ASSISTANT_CONTEXT;