const STORAGE_KEY =
  "krishisetu-prototype-data";


const defaultData = {
  bookings: [
    {
      id: "B104",
      token: "A104",

      farmerId: "F001",

      farmer: "Ravi Kumar",
      phone: "9876543210",

      stateId: "ts",
      districtId: "hyd",
      mandalId: "serilingampally",
      village: "Gachibowli",

      centerId: "main",
      center: "Main Procurement Center",

      crop: "wheat",

      estimatedQuantity: 250,
      actualQuantity: null,

      date: "2026-08-28",

      slotStart: "10:00",
      slotEnd: "10:30",

      status: "CONFIRMED",

      quality: null,

      payment: {
        status: "NOT_STARTED",
        amount: null,
        method: null,
        reference: null,
        timestamp: null,
      },

      createdAt:
        "2026-08-28T08:00:00",

      statusEvents: [
        {
          status: "CONFIRMED",
          timestamp:
            "2026-08-28T08:00:00",
        },
      ],
    },

    {
      id: "B105",
      token: "A105",

      farmerId: "F002",

      farmer: "Suresh Reddy",
      phone: "9876543211",

      stateId: "ts",
      districtId: "hyd",
      mandalId: "serilingampally",
      village: "Nanakramguda",

      centerId: "main",
      center: "Main Procurement Center",

      crop: "paddy",

      estimatedQuantity: 300,
      actualQuantity: null,

      date: "2026-08-28",

      slotStart: "10:30",
      slotEnd: "11:00",

      status: "ARRIVED",

      quality: null,

      payment: {
        status: "NOT_STARTED",
        amount: null,
        method: null,
        reference: null,
        timestamp: null,
      },

      createdAt:
        "2026-08-28T08:10:00",

      statusEvents: [
        {
          status: "CONFIRMED",
          timestamp:
            "2026-08-28T08:10:00",
        },
        {
          status: "ARRIVED",
          timestamp:
            "2026-08-28T09:20:00",
        },
      ],
    },

    {
      id: "B106",
      token: "A106",

      farmerId: "F003",

      farmer: "Lakshmi Devi",
      phone: "9876543212",

      stateId: "ts",
      districtId: "hyd",
      mandalId: "serilingampally",
      village: "Kondapur",

      centerId: "north",
      center: "North Procurement Center",

      crop: "maize",

      estimatedQuantity: 180,
      actualQuantity: 178,

      date: "2026-08-28",

      slotStart: "11:00",
      slotEnd: "11:30",

      status: "WEIGHING",

      quality: "GOOD",

      payment: {
        status: "NOT_STARTED",
        amount: null,
        method: null,
        reference: null,
        timestamp: null,
      },

      createdAt:
        "2026-08-28T08:15:00",

      statusEvents: [
        {
          status: "CONFIRMED",
          timestamp:
            "2026-08-28T08:15:00",
        },
        {
          status: "ARRIVED",
          timestamp:
            "2026-08-28T09:40:00",
        },
        {
          status: "WEIGHING",
          timestamp:
            "2026-08-28T10:45:00",
        },
      ],
    },
  ],
};


function clone(value) {
  return JSON.parse(
    JSON.stringify(value)
  );
}


export function getPrototypeData() {
  try {
    const raw =
      localStorage.getItem(
        STORAGE_KEY
      );

    if (!raw) {
      return clone(defaultData);
    }

    const parsed =
      JSON.parse(raw);

    return {
      ...clone(defaultData),
      ...parsed,

      bookings:
        Array.isArray(
          parsed.bookings
        )
          ? parsed.bookings
          : clone(
              defaultData.bookings
            ),
    };
  } catch {
    return clone(defaultData);
  }
}


export function savePrototypeData(
  data
) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(data)
  );
}


export function getPrototypeBookings() {
  return getPrototypeData()
    .bookings;
}


export function getPrototypeBookingById(
  id
) {
  return getPrototypeBookings().find(
    (booking) =>
      booking.id === id
  );
}


export function createPrototypeBooking(
  booking
) {
  const data =
    getPrototypeData();

  const existing =
    data.bookings.find(
      (item) =>
        item.id === booking.id
    );

  if (existing) {
    return existing;
  }

  const nextBooking = {
    ...booking,

    status:
      booking.status ||
      "CONFIRMED",

    actualQuantity:
      booking.actualQuantity ??
      null,

    quality:
      booking.quality ??
      null,

    payment:
      booking.payment || {
        status:
          "NOT_STARTED",
        amount: null,
        method: null,
        reference: null,
        timestamp: null,
      },

    createdAt:
      booking.createdAt ||
      new Date().toISOString(),

    statusEvents:
      booking.statusEvents || [
        {
          status:
            booking.status ||
            "CONFIRMED",

          timestamp:
            new Date().toISOString(),
        },
      ],
  };

  data.bookings.push(
    nextBooking
  );

  savePrototypeData(data);

  return nextBooking;
}


export function updatePrototypeBooking(
  id,
  changes
) {
  const data =
    getPrototypeData();

  let updated = null;

  data.bookings =
    data.bookings.map(
      (booking) => {
        if (
          booking.id !== id
        ) {
          return booking;
        }

        updated = {
          ...booking,
          ...changes,
        };

        return updated;
      }
    );

  savePrototypeData(data);

  return updated;
}


export function addPrototypeStatusEvent(
  id,
  status
) {
  const booking =
    getPrototypeBookingById(
      id
    );

  if (!booking) {
    return null;
  }

  const timestamp =
    new Date().toISOString();

  const updatedEvents = [
    ...(booking.statusEvents ||
      []),

    {
      status,
      timestamp,
    },
  ];

  return updatePrototypeBooking(
    id,
    {
      status,

      statusEvents:
        updatedEvents,
    }
  );
}


export function updatePrototypePayment(
  id,
  payment
) {
  return updatePrototypeBooking(
    id,
    {
      payment,
    }
  );
}


export function resetPrototypeData() {
  savePrototypeData(
    clone(defaultData)
  );
}
export function getPrototypeBookingsForDate(
  date
) {
  return getPrototypeBookings().filter(
    (booking) =>
      !date ||
      booking.date === date
  );
}