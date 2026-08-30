
import {
  demoAdmin,
  demoBookings,
  demoCenters,
  demoCrops,
  demoFarmer,
  demoFarmers,
  demoSmsNotifications,
} from "./demoData";

import {
  createPrototypeBooking,
} from "./prototypeStore";


const STORAGE_KEY =
  "krishisetu_prototype_state";


const initialState = {
  /*
   * Do not start a real farmer session as the demo farmer.
   * The logged-in farmer is established by FarmerLogin.
   */
  currentUser: {
    role: null,
    farmerId: null,
    phone: null,
  },

  farmers:
    Array.isArray(demoFarmers)
      ? demoFarmers
      : [],

  centers:
    Array.isArray(demoCenters)
      ? demoCenters
      : [],

  crops:
    Array.isArray(demoCrops)
      ? demoCrops
      : [],

  bookings:
    Array.isArray(demoBookings)
      ? demoBookings
      : [],

  smsNotifications:
    Array.isArray(
      demoSmsNotifications
    )
      ? demoSmsNotifications
      : [],

  admin:
    demoAdmin,
};


function cloneState(
  value
) {
  return JSON.parse(
    JSON.stringify(value)
  );
}


function normalisePhone(
  value
) {
  return String(
    value || ""
  ).replace(
    /\D/g,
    ""
  );
}


function loadState() {

  try {

    const stored =
      localStorage.getItem(
        STORAGE_KEY
      );


    if (
      !stored
    ) {

      return cloneState(
        initialState
      );

    }


    const parsed =
      JSON.parse(
        stored
      );


    const base =
      cloneState(
        initialState
      );


    const merged = {
      ...base,
      ...parsed,

      currentUser: {
        ...base.currentUser,
        ...(parsed?.currentUser || {}),
      },

      farmers:
        Array.isArray(
          parsed?.farmers
        )
          ? parsed.farmers
          : base.farmers,

      centers:
        Array.isArray(
          parsed?.centers
        )
          ? parsed.centers
          : base.centers,

      crops:
        Array.isArray(
          parsed?.crops
        )
          ? parsed.crops
          : base.crops,

      bookings:
        Array.isArray(
          parsed?.bookings
        )
          ? parsed.bookings
          : base.bookings,

      smsNotifications:
        Array.isArray(
          parsed?.smsNotifications
        )
          ? parsed.smsNotifications
          : base.smsNotifications,
    };


    /*
     * Never allow malformed localStorage data
     * to create a fake logged-in farmer.
     */
    if (
      !merged.currentUser?.farmerId
    ) {

      merged.currentUser = {
        role: null,
        farmerId: null,
        phone: null,
      };

    }


    return merged;

  } catch (
    error
  ) {

    console.error(
      "Could not load prototype state:",
      error
    );


    return cloneState(
      initialState
    );

  }

}


let state =
  loadState();


const listeners =
  new Set();


function saveState() {

  try {

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        state
      )
    );

  } catch (
    error
  ) {

    console.error(
      "Could not save prototype state:",
      error
    );

  }

}


function notify() {

  listeners.forEach(
    listener => {

      try {

        listener(
          state
        );

      } catch (
        error
      ) {

        console.error(
          "Prototype state listener error:",
          error
        );

      }

    }
  );

}


function updateState(
  updater
) {

  const nextState =
    updater(
      cloneState(
        state
      )
    );


  state =
    nextState;


  saveState();


  notify();


  return state;

}


/* =========================================================
   STATE
========================================================= */

export function getState() {

  return state;

}


export function subscribe(
  listener
) {

  listeners.add(
    listener
  );


  return () => {

    listeners.delete(
      listener
    );

  };

}


export function resetPrototypeState() {

  state =
    cloneState(
      initialState
    );


  saveState();


  notify();


  return state;

}


/* =========================================================
   CURRENT USER
========================================================= */

export function setCurrentUser(
  user
) {

  const incoming =
    user || {};


  const farmerId =
    incoming.farmerId ??
    state.currentUser?.farmerId ??
    null;


  const phone =
    incoming.phone ??
    state.currentUser?.phone ??
    null;


  return updateState(
    currentState => ({
      ...currentState,

      currentUser: {
        role:
          incoming.role ??
          currentState.currentUser?.role ??
          null,

        farmerId:
          farmerId || null,

        phone:
          normalisePhone(
            phone
          ) || null,
      },

    })
  );

}


export function setCurrentFarmer(
  farmer
) {

  if (
    !farmer ||
    !farmer.id
  ) {

    return logoutUser();

  }


  const normalizedFarmer = {
    ...farmer,

    id:
      String(
        farmer.id
      ),

    phone:
      normalisePhone(
        farmer.phone
      ),
  };


  return updateState(
    currentState => {

      const existingIndex =
        currentState.farmers.findIndex(
          item =>
            String(
              item?.id
            ) ===
            String(
              normalizedFarmer.id
            )
        );


      let farmers;


      if (
        existingIndex >=
        0
      ) {

        farmers =
          currentState.farmers.map(
            (
              item,
              index
            ) =>
              index ===
              existingIndex
                ? {
                    ...item,
                    ...normalizedFarmer,
                  }
                : item
          );

      } else {

        farmers = [
          ...currentState.farmers,
          normalizedFarmer,
        ];

      }


      return {

        ...currentState,

        currentUser: {

          role:
            "farmer",

          farmerId:
            normalizedFarmer.id,

          phone:
            normalizedFarmer.phone ||
            null,

        },

        farmers,

      };

    }
  );

}


export function logoutUser() {

  return updateState(
    currentState => ({

      ...currentState,

      currentUser: {

        role:
          null,

        farmerId:
          null,

        phone:
          null,

      },

    })
  );

}


/* =========================================================
   FARMERS
========================================================= */

export function getCurrentFarmer() {

  const farmerId =
    state.currentUser?.farmerId;


  if (
    !farmerId
  ) {

    return null;

  }


  return (
    state.farmers.find(
      farmer =>
        String(
          farmer?.id
        ) ===
        String(
          farmerId
        )
    ) ||
    null
  );

}


export function getFarmerById(
  farmerId
) {

  if (
    !farmerId
  ) {

    return undefined;

  }


  return state.farmers.find(
    farmer =>
      String(
        farmer?.id
      ) ===
      String(
        farmerId
      )
  );

}


export function getFarmerByPhone(
  phone
) {

  const normalized =
    normalisePhone(
      phone
    );


  if (
    !normalized
  ) {

    return undefined;

  }


  return state.farmers.find(
    farmer =>
      normalisePhone(
        farmer?.phone
      ) ===
      normalized
  );

}


export function updateFarmer(
  farmerId,
  updates
) {

  if (
    !farmerId
  ) {

    return state;

  }


  return updateState(
    currentState => {

      const normalizedId =
        String(
          farmerId
        );


      const updatedFarmers =
        currentState.farmers.map(
          farmer =>
            String(
              farmer?.id
            ) ===
            normalizedId
              ? {
                  ...farmer,
                  ...updates,

                  phone:
                    updates?.phone !==
                    undefined
                      ? normalisePhone(
                          updates.phone
                        )
                      : farmer.phone,
                }
              : farmer
        );


      const isCurrentFarmer =
        String(
          currentState.currentUser?.farmerId ||
          ""
        ) ===
        normalizedId;


      const currentFarmer =
        updatedFarmers.find(
          farmer =>
            String(
              farmer?.id
            ) ===
            normalizedId
        );


      return {

        ...currentState,

        farmers:
          updatedFarmers,

        currentUser:
          isCurrentFarmer &&
          currentFarmer
            ? {

                ...currentState.currentUser,

                role:
                  "farmer",

                farmerId:
                  currentFarmer.id,

                phone:
                  normalisePhone(
                    currentFarmer.phone
                  ) ||
                  null,

              }
            : currentState.currentUser,

      };

    }
  );

}


export function addFarmer(
  farmer
) {

  if (
    !farmer ||
    !farmer.id
  ) {

    return state;

  }


  const existing =
    getFarmerById(
      farmer.id
    );


  if (
    existing
  ) {

    return updateFarmer(
      existing.id,
      farmer
    );

  }


  return updateState(
    currentState => ({

      ...currentState,

      farmers: [
        ...currentState.farmers,

        {
          ...farmer,

          id:
            String(
              farmer.id
            ),

          phone:
            normalisePhone(
              farmer.phone
            ),

        },
      ],

    })
  );

}


export function syncCurrentFarmer(
  farmer
) {

  if (
    !farmer
  ) {

    return null;

  }


  setCurrentFarmer(
    farmer
  );


  return getCurrentFarmer();

}


/* =========================================================
   CENTERS / CROPS
========================================================= */

export function getCenterById(
  centerId
) {

  if (
    !centerId
  ) {

    return undefined;

  }


  return state.centers.find(
    center =>
      String(
        center?.id
      ) ===
      String(
        centerId
      )
  );

}


export function getCropById(
  cropId
) {

  if (
    !cropId
  ) {

    return undefined;

  }


  return state.crops.find(
    crop =>
      String(
        crop?.id
      ) ===
      String(
        cropId
      )
  );

}


/* =========================================================
   BOOKINGS
========================================================= */

export function getBookingById(
  bookingId
) {

  if (
    !bookingId
  ) {

    return undefined;

  }


  return state.bookings.find(
    booking =>
      String(
        booking?.id
      ) ===
      String(
        bookingId
      )
  );

}


export function getFarmerBookings(
  farmerId
) {

  if (
    !farmerId
  ) {

    return [];

  }


  return state.bookings.filter(
    booking =>
      String(
        booking?.farmerId
      ) ===
      String(
        farmerId
      )
  );

}


export function getActiveFarmerBooking(
  farmerId
) {

  const bookings =
    getFarmerBookings(
      farmerId
    );


  const activeStatuses = [

    "CONFIRMED",

    "ARRIVED",

    "LATE",

    "WEIGHING",

    "PROCURED",

    "PAYMENT_PENDING",

  ];


  return bookings.find(
    booking =>
      activeStatuses.includes(
        booking?.status
      )
  );

}


function generateBookingId(
  existingBookings
) {

  const highest =
    existingBookings.reduce(
      (
        maximum,
        booking
      ) => {

        const match =
          String(
            booking?.id ||
            ""
          ).match(
            /^B(\d+)$/
          );


        if (
          !match
        ) {

          return maximum;

        }


        return Math.max(
          maximum,
          Number(
            match[1]
          )
        );

      },
      0
    );


  return `B${String(
    highest + 1
  ).padStart(
    3,
    "0"
  )}`;

}


function generateToken(
  existingBookings
) {

  const highest =
    existingBookings.reduce(
      (
        maximum,
        booking
      ) => {

        const number =
          Number(
            booking?.token
          );


        if (
          Number.isNaN(
            number
          )
        ) {

          return maximum;

        }


        return Math.max(
          maximum,
          number
        );

      },
      0
    );


  return String(
    highest + 1
  );

}


function generateEventId(
  existingBookings
) {

  let highest =
    0;


  existingBookings.forEach(
    booking => {

      (
        booking?.statusEvents ||
        []
      ).forEach(
        event => {

          const match =
            String(
              event?.id ||
              ""
            ).match(
              /^E(\d+)$/
            );


          if (
            !match
          ) {

            return;

          }


          highest =
            Math.max(
              highest,
              Number(
                match[1]
              )
            );

        }
      );

    }
  );


  return `E${String(
    highest + 1
  ).padStart(
    3,
    "0"
  )}`;

}


function getNow() {

  return new Date().toISOString();

}


/* =========================================================
   STATUS EVENTS
========================================================= */

export function addStatusEvent(
  bookingId,
  status,
  actorType = "SYSTEM",
  actorId = "SYSTEM",
  note = "",
  changedFields = null
) {

  return updateState(
    currentState => {

      const timestamp =
        getNow();


      const event = {

        id:
          generateEventId(
            currentState.bookings
          ),

        bookingId:
          String(
            bookingId
          ),

        status,

        actorType,

        actorId,

        timestamp,

        note,

      };


      if (
        changedFields
      ) {

        event.changedFields =
          changedFields;

      }


      return {

        ...currentState,

        bookings:
          currentState.bookings.map(
            booking =>
              String(
                booking?.id
              ) ===
              String(
                bookingId
              )
                ? {

                    ...booking,

                    statusEvents: [
                      ...(booking.statusEvents ||
                        []),
                      event,
                    ],

                  }
                : booking
          ),

      };

    }
  );

}


/* =========================================================
   PROTOTYPE BOOKING
========================================================= */

export function createBooking({
  farmerId,
  centerId,
  crop,
  quantity,
  date,
  slotStart,
  slotEnd,
}) {

  const timestamp =
    getNow();


  const bookingId =
    generateBookingId(
      state.bookings
    );


  const token =
    generateToken(
      state.bookings
    );


  const eventId =
    generateEventId(
      state.bookings
    );


  const booking = {

    id:
      bookingId,

    farmerId:
      String(
        farmerId
      ),

    centerId,

    token,

    date,

    slotStart,

    slotEnd,

    crop,

    estimatedQuantity:
      Number(
        quantity
      ),

    actualQuantity:
      null,

    status:
      "CONFIRMED",

    payment: {

      amount:
        null,

      status:
        "NOT_CREATED",

      reference:
        null,

      sentAt:
        null,

    },

    createdAt:
      timestamp,

    statusEvents: [

      {

        id:
          eventId,

        bookingId:
          bookingId,

        status:
          "CONFIRMED",

        actorType:
          "SYSTEM",

        actorId:
          "SYSTEM",

        timestamp,

        note:
          "Booking confirmed and token assigned.",

      },

    ],

  };


  updateState(
    currentState => ({

      ...currentState,

      bookings: [

        ...currentState.bookings,

        booking,

      ],

      smsNotifications: [

        ...currentState.smsNotifications,

        createDemoSmsNotification({

          booking,

          farmerId,

          type:
            "BOOKING_CONFIRMED",

        }),

      ],

    })
  );


  return booking;

}


function createDemoSmsNotification({
  booking,
  farmerId,
  type,
  amount = null,
  reference = null,
}) {

  const farmer =
    getFarmerById(
      farmerId
    );


  const center =
    getCenterById(
      booking?.centerId
    );


  let message =
    "";


  if (
    type ===
    "BOOKING_CONFIRMED"
  ) {

    message =
      `KrishiSetu: Token #${booking.token} confirmed. ` +
      `Arrive ${booking.date}, ` +
      `${booking.slotStart}-${booking.slotEnd} ` +
      `at ${center?.name || "your procurement center"}.`;

  }


  if (
    type ===
    "LATE"
  ) {

    message =
      `KrishiSetu: Token #${booking.token} is marked late. ` +
      `Please contact the procurement center for guidance.`;

  }


  if (
    type ===
    "PROCURED"
  ) {

    message =
      `KrishiSetu: Token #${booking.token} procurement completed. ` +
      `Actual quantity: ${booking.actualQuantity} kg.`;

  }


  if (
    type ===
    "PAYMENT_SENT"
  ) {

    message =
      `KrishiSetu: Payment of Rs. ${amount} for ` +
      `Token #${booking.token} has been sent. ` +
      `Ref: ${reference}.`;

  }


  return {

    id:
      `SMS-${Date.now()}-${Math.floor(
        Math.random() * 1000
      )}`,

    bookingId:
      booking?.id,

    farmerId:
      String(
        farmerId
      ),

    phone:
      farmer?.phone ||
      "",

    templateType:
      type,

    status:
      "SENT",

    message,

    providerMessageId:
      `DEMO-${Date.now()}`,

    attemptCount:
      1,

    lastAttemptAt:
      getNow(),

    createdAt:
      getNow(),

  };

}


/* =========================================================
   BOOKING HELPERS
========================================================= */

export function createBookingAndSetFarmer(
  bookingData
) {

  const booking =
    createBooking(
      bookingData
    );


  setCurrentUser({

    role:
      "farmer",

    farmerId:
      bookingData.farmerId,

    phone:
      getFarmerById(
        bookingData.farmerId
      )?.phone ||
      null,

  });


  return booking;

}


export function updateBooking(
  bookingId,
  updates
) {

  return updateState(
    currentState => ({

      ...currentState,

      bookings:
        currentState.bookings.map(
          booking =>
            String(
              booking?.id
            ) ===
            String(
              bookingId
            )
              ? {
                  ...booking,
                  ...updates,
                }
              : booking
        ),

    })
  );

}


/* =========================================================
   BOOKING TRANSITIONS
========================================================= */

export function transitionBooking(
  bookingId,
  newStatus,
  {
    actorType = "ADMIN",
    actorId = "A001",
    note = "",
    changedFields = null,
  } = {}
) {

  return updateState(
    currentState => {

      const booking =
        currentState.bookings.find(
          item =>
            String(
              item?.id
            ) ===
            String(
              bookingId
            )
        );


      if (
        !booking
      ) {

        throw new Error(
          "Booking not found."
        );

      }


      const timestamp =
        getNow();


      const event = {

        id:
          generateEventId(
            currentState.bookings
          ),

        bookingId:
          String(
            bookingId
          ),

        status:
          newStatus,

        actorType,

        actorId,

        timestamp,

        note,

      };


      if (
        changedFields
      ) {

        event.changedFields =
          changedFields;

      }


      return {

        ...currentState,

        bookings:
          currentState.bookings.map(
            item =>
              String(
                item?.id
              ) ===
              String(
                bookingId
              )
                ? {

                    ...item,

                    status:
                      newStatus,

                    statusEvents: [

                      ...(item.statusEvents ||
                        []),

                      event,

                    ],

                  }
                : item
          ),

      };

    }
  );

}


export function markArrived(
  bookingId
) {

  return transitionBooking(
    bookingId,
    "ARRIVED",
    {

      actorType:
        "ADMIN",

      actorId:
        state.admin?.id ||
        "A001",

      note:
        "Farmer arrived and token verified.",

    }
  );

}


export function markLate(
  bookingId,
  note =
    "Arrival window missed."
) {

  const result =
    transitionBooking(
      bookingId,
      "LATE",
      {

        actorType:
          "ADMIN",

        actorId:
          state.admin?.id ||
          "A001",

        note,

      }
    );


  const booking =
    getBookingById(
      bookingId
    );


  if (
    booking
  ) {

    updateState(
      currentState => ({

        ...currentState,

        smsNotifications: [

          ...currentState.smsNotifications,

          createDemoSmsNotification({

            booking,

            farmerId:
              booking.farmerId,

            type:
              "LATE",

          }),

        ],

      })
    );

  }


  return result;

}


export function startWeighing(
  bookingId
) {

  return transitionBooking(
    bookingId,
    "WEIGHING",
    {

      actorType:
        "ADMIN",

      actorId:
        state.admin?.id ||
        "A001",

      note:
        "Weighing started.",

    }
  );

}


export function saveWeight(
  bookingId,
  actualQuantity,
  notes = ""
) {

  if (
    Number(
      actualQuantity
    ) < 0
  ) {

    throw new Error(
      "Actual weight cannot be negative."
    );

  }


  updateState(
    currentState => {

      const booking =
        currentState.bookings.find(
          item =>
            String(
              item?.id
            ) ===
            String(
              bookingId
            )
        );


      if (
        !booking
      ) {

        throw new Error(
          "Booking not found."
        );

      }


      const timestamp =
        getNow();


      const event = {

        id:
          generateEventId(
            currentState.bookings
          ),

        bookingId:
          String(
            bookingId
          ),

        status:
          "WEIGHING",

        actorType:
          "ADMIN",

        actorId:
          currentState.admin?.id ||
          "A001",

        timestamp,

        note:
          notes ||
          "Produce weight recorded.",

        changedFields: {

          actualQuantity:
            Number(
              actualQuantity
            ),

        },

      };


      return {

        ...currentState,

        bookings:
          currentState.bookings.map(
            item =>
              String(
                item?.id
              ) ===
              String(
                bookingId
              )
                ? {

                    ...item,

                    status:
                      "WEIGHING",

                    actualQuantity:
                      Number(
                        actualQuantity
                      ),

                    statusEvents: [

                      ...(item.statusEvents ||
                        []),

                      event,

                    ],

                  }
                : item
          ),

      };

    }
  );


  return getBookingById(
    bookingId
  );

}


export function markProcured(
  bookingId,
  rate,
  adjustment = 0
) {

  const numericRate =
    Number(
      rate
    );


  const numericAdjustment =
    Number(
      adjustment
    ) || 0;


  if (
    numericRate < 0
  ) {

    throw new Error(
      "Rate cannot be negative."
    );

  }


  const booking =
    getBookingById(
      bookingId
    );


  if (
    !booking
  ) {

    throw new Error(
      "Booking not found."
    );

  }


  if (
    booking.status ===
      "PROCURED" ||
    booking.status ===
      "PAYMENT_PENDING" ||
    booking.status ===
      "PAYMENT_SENT"
  ) {

    throw new Error(
      "This booking has already been finalized."
    );

  }


  if (
    booking.actualQuantity ===
      null ||
    booking.actualQuantity ===
      undefined
  ) {

    throw new Error(
      "Actual quantity must be recorded before procurement."
    );

  }


  const amount =
    Number(
      booking.actualQuantity
    ) *
      numericRate +
    numericAdjustment;


  updateState(
    currentState => {

      const timestamp =
        getNow();


      const event = {

        id:
          generateEventId(
            currentState.bookings
          ),

        bookingId:
          String(
            bookingId
          ),

        status:
          "PROCURED",

        actorType:
          "ADMIN",

        actorId:
          currentState.admin?.id ||
          "A001",

        timestamp,

        note:
          "Procurement completed.",

        changedFields: {

          actualQuantity:
            booking.actualQuantity,

          rate:
            numericRate,

          adjustment:
            numericAdjustment,

          payableAmount:
            amount,

        },

      };


      return {

        ...currentState,

        bookings:
          currentState.bookings.map(
            item =>
              String(
                item?.id
              ) ===
              String(
                bookingId
              )
                ? {

                    ...item,

                    status:
                      "PROCURED",

                    payment: {

                      ...item.payment,

                      amount,

                      status:
                        "PAYMENT_PENDING",

                    },

                    statusEvents: [

                      ...(item.statusEvents ||
                        []),

                      event,

                    ],

                  }
                : item
          ),

        smsNotifications: [

          ...currentState.smsNotifications,

          createDemoSmsNotification({

            booking: {

              ...booking,

              actualQuantity:
                booking.actualQuantity,

            },

            farmerId:
              booking.farmerId,

            type:
              "PROCURED",

          }),

        ],

      };

    }
  );


  return getBookingById(
    bookingId
  );

}


export function markPaymentSent(
  bookingId,
  reference
) {

  const booking =
    getBookingById(
      bookingId
    );


  if (
    !booking
  ) {

    throw new Error(
      "Booking not found."
    );

  }


  if (
    booking.payment?.status ===
    "PAYMENT_SENT"
  ) {

    throw new Error(
      "Payment is already marked as sent."
    );

  }


  if (
    !reference?.trim()
  ) {

    throw new Error(
      "Payment reference is required."
    );

  }


  if (
    booking.payment?.status !==
    "PAYMENT_PENDING"
  ) {

    throw new Error(
      "Payment is not ready to be marked as sent."
    );

  }


  const timestamp =
    getNow();


  updateState(
    currentState => {

      const event = {

        id:
          generateEventId(
            currentState.bookings
          ),

        bookingId:
          String(
            bookingId
          ),

        status:
          "PAYMENT_SENT",

        actorType:
          "ADMIN",

        actorId:
          currentState.admin?.id ||
          "A001",

        timestamp,

        note:
          "Payment marked as sent.",

        changedFields: {

          paymentReference:
            reference.trim(),

        },

      };


      const updatedBooking = {

        ...booking,

        status:
          "PAYMENT_SENT",

        payment: {

          ...booking.payment,

          status:
            "PAYMENT_SENT",

          reference:
            reference.trim(),

          sentAt:
            timestamp,

        },

        statusEvents: [

          ...(booking.statusEvents ||
            []),

          event,

        ],

      };


      return {

        ...currentState,

        bookings:
          currentState.bookings.map(
            item =>
              String(
                item?.id
              ) ===
              String(
                bookingId
              )
                ? updatedBooking
                : item
          ),

        smsNotifications: [

          ...currentState.smsNotifications,

          createDemoSmsNotification({

            booking:
              updatedBooking,

            farmerId:
              updatedBooking.farmerId,

            type:
              "PAYMENT_SENT",

            amount:
              updatedBooking.payment.amount,

            reference:
              updatedBooking.payment.reference,

          }),

        ],

      };

    }
  );


  return getBookingById(
    bookingId
  );

}


/* =========================================================
   LEGACY EXPORT
========================================================= */

export {
  createPrototypeBooking,
};
