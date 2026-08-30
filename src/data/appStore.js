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

const STORAGE_KEY = "krishisetu_prototype_state";

const initialState = {
  currentUser: {
    role: "farmer",
    farmerId: demoFarmer.id,
  },

  farmers: demoFarmers,

  centers: demoCenters,

  crops: demoCrops,

  bookings: demoBookings,

  smsNotifications: demoSmsNotifications,

  admin: demoAdmin,
};

function cloneState(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return cloneState(initialState);
    }

    const parsed = JSON.parse(stored);

    return {
      ...cloneState(initialState),
      ...parsed,
    };
  } catch (error) {
    console.error("Could not load prototype state:", error);

    return cloneState(initialState);
  }
}

let state = loadState();

const listeners = new Set();

function saveState() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(state)
    );
  } catch (error) {
    console.error("Could not save prototype state:", error);
  }
}

function notify() {
  listeners.forEach((listener) => {
    listener(state);
  });
}

function updateState(updater) {
  state = updater(state);

  saveState();

  notify();

  return state;
}

export function getState() {
  return state;
}

export function subscribe(listener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function resetPrototypeState() {
  state = cloneState(initialState);

  saveState();

  notify();

  return state;
}

export function setCurrentUser(user) {
  return updateState((currentState) => ({
    ...currentState,

    currentUser: {
      ...currentState.currentUser,
      ...user,
    },
  }));
}
export function logoutUser() {
  return updateState((currentState) => ({
    ...currentState,

    currentUser: {
      role: null,
      farmerId: null,
    },
  }));
}

export function getCurrentFarmer() {
  const farmerId = state.currentUser?.farmerId;

  return (
    state.farmers.find(
      (farmer) => farmer.id === farmerId
    ) || state.farmers[0]
  );
}

export function getFarmerById(farmerId) {
  return state.farmers.find(
    (farmer) => farmer.id === farmerId
  );
}

export function getCenterById(centerId) {
  return state.centers.find(
    (center) => center.id === centerId
  );
}

export function getCropById(cropId) {
  return state.crops.find(
    (crop) => crop.id === cropId
  );
}

export function getBookingById(bookingId) {
  return state.bookings.find(
    (booking) => booking.id === bookingId
  );
}

export function getFarmerBookings(farmerId) {
  return state.bookings.filter(
    (booking) => booking.farmerId === farmerId
  );
}

export function getActiveFarmerBooking(farmerId) {
  const bookings = getFarmerBookings(farmerId);

  const activeStatuses = [
    "CONFIRMED",
    "ARRIVED",
    "LATE",
    "WEIGHING",
    "PROCURED",
    "PAYMENT_PENDING",
  ];

  return bookings.find((booking) =>
    activeStatuses.includes(booking.status)
  );
}

export function updateFarmer(farmerId, updates) {
  return updateState((currentState) => ({
    ...currentState,

    farmers: currentState.farmers.map((farmer) =>
      farmer.id === farmerId
        ? {
            ...farmer,
            ...updates,
          }
        : farmer
    ),
  }));
}

function generateBookingId(existingBookings) {
  const highest = existingBookings.reduce(
    (maximum, booking) => {
      const match = booking.id?.match(/^B(\d+)$/);

      if (!match) {
        return maximum;
      }

      return Math.max(
        maximum,
        Number(match[1])
      );
    },
    0
  );

  return `B${String(highest + 1).padStart(3, "0")}`;
}

function generateToken(existingBookings) {
  const highest = existingBookings.reduce(
    (maximum, booking) => {
      const number = Number(booking.token);

      if (Number.isNaN(number)) {
        return maximum;
      }

      return Math.max(maximum, number);
    },
    0
  );

  return String(highest + 1);
}

function generateEventId(existingBookings) {
  let highest = 0;

  existingBookings.forEach((booking) => {
    booking.statusEvents?.forEach((event) => {
      const match = event.id?.match(/^E(\d+)$/);

      if (!match) {
        return;
      }

      highest = Math.max(
        highest,
        Number(match[1])
      );
    });
  });

  return `E${String(highest + 1).padStart(3, "0")}`;
}

function getNow() {
  return new Date().toISOString();
}

export function addStatusEvent(
  bookingId,
  status,
  actorType = "SYSTEM",
  actorId = "SYSTEM",
  note = "",
  changedFields = null
) {
  return updateState((currentState) => {
    const timestamp = getNow();

    const event = {
      id: generateEventId(
        currentState.bookings
      ),
      bookingId,
      status,
      actorType,
      actorId,
      timestamp,
      note,
    };

    if (changedFields) {
      event.changedFields = changedFields;
    }

    return {
      ...currentState,

      bookings: currentState.bookings.map(
        (booking) =>
          booking.id === bookingId
            ? {
                ...booking,
                statusEvents: [
                  ...(booking.statusEvents || []),
                  event,
                ],
              }
            : booking
      ),
    };
  });
}

export function createBooking({
  farmerId,
  centerId,
  crop,
  quantity,
  date,
  slotStart,
  slotEnd,
}) {
  const timestamp = getNow();

  const booking = {
    id: generateBookingId(state.bookings),

    farmerId,

    centerId,

    token: generateToken(state.bookings),

    date,

    slotStart,

    slotEnd,

    crop,

    estimatedQuantity: Number(quantity),

    actualQuantity: null,

    status: "CONFIRMED",

    payment: {
      amount: null,
      status: "NOT_CREATED",
      reference: null,
      sentAt: null,
    },

    createdAt: timestamp,

    statusEvents: [
      {
        id: generateEventId(state.bookings),

        status: "CONFIRMED",

        actorType: "SYSTEM",

        actorId: "SYSTEM",

        timestamp,

        note:
          "Booking confirmed and token assigned.",
      },
    ],
  };

  updateState((currentState) => ({
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
        type: "BOOKING_CONFIRMED",
      }),
    ],
  }));

  return booking;
}

function createDemoSmsNotification({
  booking,
  farmerId,
  type,
  amount = null,
  reference = null,
}) {
  const farmer = getFarmerById(farmerId);

  const center = getCenterById(
    booking.centerId
  );

  let message = "";

  if (type === "BOOKING_CONFIRMED") {
    message =
      `KrishiSetu: Token #${booking.token} confirmed. ` +
      `Arrive ${booking.date}, ` +
      `${booking.slotStart}-${booking.slotEnd} ` +
      `at ${center?.name || "your procurement center"}.`;
  }

  if (type === "LATE") {
    message =
      `KrishiSetu: Token #${booking.token} is marked late. ` +
      `Please contact the procurement center for guidance.`;
  }

  if (type === "PROCURED") {
    message =
      `KrishiSetu: Token #${booking.token} procurement completed. ` +
      `Actual quantity: ${booking.actualQuantity} kg.`;
  }

  if (type === "PAYMENT_SENT") {
    message =
      `KrishiSetu: Payment of Rs. ${amount} for ` +
      `Token #${booking.token} has been sent. ` +
      `Ref: ${reference}.`;
  }

  return {
    id: `SMS-${Date.now()}-${Math.floor(
      Math.random() * 1000
    )}`,

    bookingId: booking.id,

    farmerId,

    phone: farmer?.phone || "",

    templateType: type,

    status: "SENT",

    message,

    providerMessageId: `DEMO-${Date.now()}`,

    attemptCount: 1,

    lastAttemptAt: getNow(),

    createdAt: getNow(),
  };
}

export function addFarmer(farmer) {
  return updateState((currentState) => ({
    ...currentState,

    farmers: [
      ...currentState.farmers,
      farmer,
    ],
  }));
}

export function createBookingAndSetFarmer(
  bookingData
) {
  const booking = createBooking(
    bookingData
  );

  setCurrentUser({
    role: "farmer",
    farmerId: bookingData.farmerId,
  });

  return booking;
}

export function updateBooking(
  bookingId,
  updates
) {
  return updateState((currentState) => ({
    ...currentState,

    bookings: currentState.bookings.map(
      (booking) =>
        booking.id === bookingId
          ? {
              ...booking,
              ...updates,
            }
          : booking
    ),
  }));
}

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
  return updateState((currentState) => {
    const booking = currentState.bookings.find(
      (item) => item.id === bookingId
    );

    if (!booking) {
      throw new Error(
        "Booking not found."
      );
    }

    const timestamp = getNow();

    const event = {
      id: generateEventId(
        currentState.bookings
      ),

      bookingId,

      status: newStatus,

      actorType,

      actorId,

      timestamp,

      note,
    };

    if (changedFields) {
      event.changedFields = changedFields;
    }

    return {
      ...currentState,

      bookings: currentState.bookings.map(
        (item) =>
          item.id === bookingId
            ? {
                ...item,

                status: newStatus,

                statusEvents: [
                  ...(item.statusEvents || []),
                  event,
                ],
              }
            : item
      ),
    };
  });
}

export function markArrived(bookingId) {
  return transitionBooking(
    bookingId,
    "ARRIVED",
    {
      actorType: "ADMIN",
      actorId: state.admin.id,
      note:
        "Farmer arrived and token verified.",
    }
  );
}

export function markLate(
  bookingId,
  note = "Arrival window missed."
) {
  const result = transitionBooking(
    bookingId,
    "LATE",
    {
      actorType: "ADMIN",
      actorId: state.admin.id,
      note,
    }
  );

  const booking = getBookingById(
    bookingId
  );

  if (booking) {
    updateState((currentState) => ({
      ...currentState,

      smsNotifications: [
        ...currentState.smsNotifications,
        createDemoSmsNotification({
          booking,
          farmerId: booking.farmerId,
          type: "LATE",
        }),
      ],
    }));
  }

  return result;
}

export function startWeighing(bookingId) {
  return transitionBooking(
    bookingId,
    "WEIGHING",
    {
      actorType: "ADMIN",
      actorId: state.admin.id,
      note: "Weighing started.",
    }
  );
}

export function saveWeight(
  bookingId,
  actualQuantity,
  notes = ""
) {
  if (Number(actualQuantity) < 0) {
    throw new Error(
      "Actual weight cannot be negative."
    );
  }

  updateState((currentState) => {
    const booking = currentState.bookings.find(
      (item) => item.id === bookingId
    );

    if (!booking) {
      throw new Error(
        "Booking not found."
      );
    }

    const timestamp = getNow();

    const event = {
      id: generateEventId(
        currentState.bookings
      ),

      bookingId,

      status: "WEIGHING",

      actorType: "ADMIN",

      actorId: currentState.admin.id,

      timestamp,

      note:
        notes ||
        "Produce weight recorded.",

      changedFields: {
        actualQuantity: Number(
          actualQuantity
        ),
      },
    };

    return {
      ...currentState,

      bookings: currentState.bookings.map(
        (item) =>
          item.id === bookingId
            ? {
                ...item,

                status: "WEIGHING",

                actualQuantity:
                  Number(actualQuantity),

                statusEvents: [
                  ...(item.statusEvents || []),
                  event,
                ],
              }
            : item
      ),
    };
  });

  return getBookingById(
    bookingId
  );
}

export function markProcured(
  bookingId,
  rate,
  adjustment = 0
) {
  const numericRate = Number(rate);

  const numericAdjustment =
    Number(adjustment) || 0;

  if (numericRate < 0) {
    throw new Error(
      "Rate cannot be negative."
    );
  }

  const booking = getBookingById(
    bookingId
  );

  if (!booking) {
    throw new Error(
      "Booking not found."
    );
  }

  if (
    booking.status === "PROCURED" ||
    booking.status === "PAYMENT_PENDING" ||
    booking.status === "PAYMENT_SENT"
  ) {
    throw new Error(
      "This booking has already been finalized."
    );
  }

  if (
    booking.actualQuantity === null ||
    booking.actualQuantity === undefined
  ) {
    throw new Error(
      "Actual quantity must be recorded before procurement."
    );
  }

  const amount =
    booking.actualQuantity * numericRate +
    numericAdjustment;

  updateState((currentState) => {
    const timestamp = getNow();

    const event = {
      id: generateEventId(
        currentState.bookings
      ),

      bookingId,

      status: "PROCURED",

      actorType: "ADMIN",

      actorId: currentState.admin.id,

      timestamp,

      note:
        "Procurement completed.",

      changedFields: {
        actualQuantity:
          booking.actualQuantity,

        rate: numericRate,

        adjustment: numericAdjustment,

        payableAmount: amount,
      },
    };

    return {
      ...currentState,

      bookings: currentState.bookings.map(
        (item) =>
          item.id === bookingId
            ? {
                ...item,

                status: "PROCURED",

                payment: {
                  ...item.payment,

                  amount,

                  status:
                    "PAYMENT_PENDING",
                },

                statusEvents: [
                  ...(item.statusEvents || []),
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

          farmerId: booking.farmerId,

          type: "PROCURED",
        }),
      ],
    };
  });

  return getBookingById(
    bookingId
  );
}

export function markPaymentSent(
  bookingId,
  reference
) {
  const booking = getBookingById(
    bookingId
  );

  if (!booking) {
    throw new Error(
      "Booking not found."
    );
  }

  if (
    booking.payment.status ===
    "PAYMENT_SENT"
  ) {
    throw new Error(
      "Payment is already marked as sent."
    );
  }

  if (!reference?.trim()) {
    throw new Error(
      "Payment reference is required."
    );
  }

  if (
    booking.payment.status !==
    "PAYMENT_PENDING"
  ) {
    throw new Error(
      "Payment is not ready to be marked as sent."
    );
  }

  const timestamp = getNow();

  updateState((currentState) => {
    const event = {
      id: generateEventId(
        currentState.bookings
      ),

      bookingId,

      status: "PAYMENT_SENT",

      actorType: "ADMIN",

      actorId: currentState.admin.id,

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

      status: "PAYMENT_SENT",

      payment: {
        ...booking.payment,

        status: "PAYMENT_SENT",

        reference: reference.trim(),

        sentAt: timestamp,
      },

      statusEvents: [
        ...(booking.statusEvents || []),
        event,
      ],
    };

    return {
      ...currentState,

      bookings: currentState.bookings.map(
        (item) =>
          item.id === bookingId
            ? updatedBooking
            : item
      ),

      smsNotifications: [
        ...currentState.smsNotifications,

        createDemoSmsNotification({
          booking: updatedBooking,
          farmerId:
            updatedBooking.farmerId,
          type: "PAYMENT_SENT",
          amount:
            updatedBooking.payment.amount,
          reference:
            updatedBooking.payment.reference,
        }),
      ],
    };
  });

  return getBookingById(
    bookingId
  );
}
