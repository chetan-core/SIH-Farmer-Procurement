const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function getDateKey(date) {
  return new Date(date).toISOString().split("T")[0];
}

function parseTime(value) {
  if (!value) return null;

  const [hours, minutes] = String(value).split(":").map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
}

function formatTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}`;
}

function addDays(date, amount) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function createDates(numberOfDays) {
  const dates = [];

  for (let i = 0; i < numberOfDays; i += 1) {
    const current = addDays(new Date(), i + 1);

    dates.push({
      date: getDateKey(current),
      day: current.toLocaleDateString("en-IN", {
        weekday: "long",
      }),
      label: current.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    });
  }

  return dates;
}

function createSlots(center, slotDuration) {
  const opening =
    center?.openingTime ||
    center?.openTime ||
    center?.opening_time ||
    "09:00";

  const closing =
    center?.closingTime ||
    center?.closeTime ||
    center?.closing_time ||
    "17:00";

  const start = parseTime(opening);
  const end = parseTime(closing);

  if (start === null || end === null || end <= start) {
    return [];
  }

  const slots = [];

  for (
    let current = start;
    current + slotDuration <= end;
    current += slotDuration
  ) {
    slots.push({
      start: formatTime(current),
      end: formatTime(current + slotDuration),
    });
  }

  return slots;
}

function getBookingCenterId(booking) {
  return (
    booking?.centerId ||
    booking?.center?.id ||
    booking?.center_id ||
    null
  );
}

function getBookingDate(booking) {
  return (
    booking?.date ||
    booking?.bookingDate ||
    booking?.booking_date ||
    null
  );
}

function getBookingSlotStart(booking) {
  return (
    booking?.slotStart ||
    booking?.slot?.start ||
    booking?.slot_start ||
    null
  );
}

function getBookingSlotEnd(booking) {
  return (
    booking?.slotEnd ||
    booking?.slot?.end ||
    booking?.slot_end ||
    null
  );
}

function isBlockingBooking(booking) {
  const status = String(booking?.status || "").toUpperCase();

  return status !== "PAYMENT_SENT";
}

function getCapacity(center, settings) {
  return Number(
    center?.capacity ??
      center?.dailyCapacity ??
      center?.slotCapacity ??
      settings?.defaultCapacity ??
      20
  );
}

function countBookings(bookings, centerId, date, slot) {
  return bookings.filter((booking) => {
    if (!isBlockingBooking(booking)) return false;

    const bookingCenterId = String(getBookingCenterId(booking) ?? "");
    const bookingDate = getDateKey(getBookingDate(booking));

    const sameCenter = bookingCenterId === String(centerId);
    const sameDate = bookingDate === String(date);

    const bookingStart = getBookingSlotStart(booking);
    const bookingEnd = getBookingSlotEnd(booking);

    const sameSlot =
      String(bookingStart || "") === String(slot.start || "") &&
      String(bookingEnd || "") === String(slot.end || "");

    return sameCenter && sameDate && sameSlot;
  }).length;
}

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}

export async function loadBookingAvailability() {
  const [centersResult, settingsResult, bookingsResult] =
    await Promise.all([
      fetchJson(`${API_URL}/centers`),
      fetchJson(`${API_URL}/settings`),
      fetchJson(`${API_URL}/bookings`),
    ]);

  const centers = Array.isArray(centersResult)
    ? centersResult
    : Array.isArray(centersResult?.centers)
      ? centersResult.centers
      : [];

  const settings = settingsResult?.settings || settingsResult || {};

  const bookings = Array.isArray(bookingsResult)
    ? bookingsResult
    : Array.isArray(bookingsResult?.bookings)
      ? bookingsResult.bookings
      : [];

  const activeCenters = centers.filter(
    (center) => center?.active !== false
  );

  const advanceBookingDays = Number(
    settings?.advanceBookingDays ?? 7
  );

  const slotDuration = Number(
    settings?.slotDuration ?? 30
  );

  const dates = createDates(advanceBookingDays);

  const availableDates = [];

  for (const dateInfo of dates) {
    const centersForDate = [];

    for (const center of activeCenters) {
      const centerId =
        center?.id ||
        center?._id ||
        center?.centerId;

      if (!centerId) continue;

      const capacity = getCapacity(center, settings);

      const slots = createSlots(center, slotDuration);

      const availableSlots = slots.filter((slot) => {
        const booked = countBookings(
          bookings,
          centerId,
          dateInfo.date,
          slot
        );

        return booked < capacity;
      });

      if (availableSlots.length > 0) {
        centersForDate.push({
          center,
          centerId,
          availableSlots,
        });
      }
    }

    if (centersForDate.length > 0) {
      availableDates.push({
        ...dateInfo,
        centers: centersForDate,
      });
    }
  }

  return {
    dates,
    availableDates,
    centers: activeCenters,
    bookings,
    settings,
  };
}

export async function getAvailableDates() {
  const result = await loadBookingAvailability();

  return result.availableDates.map((item) => ({
    date: item.date,
    day: item.day,
    label: item.label,
    centers: item.centers.map((entry) => ({
      centerId: entry.centerId,
      centerName:
        entry.center?.name ||
        entry.center?.centerName ||
        "Collection Center",
      slots: entry.availableSlots,
    })),
  }));
}

export async function getAvailableSlots(date, centerId = null) {
  const result = await loadBookingAvailability();

  const selectedDate = result.availableDates.find(
    (item) => item.date === date
  );

  if (!selectedDate) {
    return [];
  }

  let centers = selectedDate.centers;

  if (centerId) {
    centers = centers.filter(
      (entry) => String(entry.centerId) === String(centerId)
    );
  }

  return centers.map((entry) => ({
    centerId: entry.centerId,
    centerName:
      entry.center?.name ||
      entry.center?.centerName ||
      "Collection Center",
    slots: entry.availableSlots,
  }));
}