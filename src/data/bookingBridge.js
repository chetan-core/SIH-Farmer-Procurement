import {
  createPrototypeBooking,
} from "./prototypeStore";


export function syncBookingToPrototype(
  booking,
  farmer,
  center,
  crop
) {
  if (!booking) {
    return null;
  }

  const prototypeBooking = {
    id:
      booking.id ||
      `B${Date.now()}`,

    token:
      booking.token ||
      String(
        Math.floor(
          100 +
            Math.random() *
              899
        )
      ),

    farmerId:
      farmer?.id ||
      booking.farmerId ||
      "",

    farmer:
      farmer?.name ||
      booking.farmer ||
      "Farmer",

    phone:
      farmer?.phone ||
      booking.phone ||
      "",

    stateId:
      farmer?.stateId ||
      booking.stateId ||
      "",

    districtId:
      farmer?.districtId ||
      booking.districtId ||
      "",

    mandalId:
      farmer?.mandalId ||
      booking.mandalId ||
      "",

    village:
      farmer?.village ||
      booking.village ||
      "",

    centerId:
      booking.centerId ||
      center?.id ||
      "",

    center:
      center?.name ||
      booking.center ||
      "Procurement Center",

    crop:
      crop?.id ||
      booking.crop ||
      farmer?.primaryCrop ||
      "wheat",

    estimatedQuantity:
      Number(
        booking.estimatedQuantity ??
        farmer?.estimatedQuantity ??
        0
      ),

    actualQuantity:
      booking.actualQuantity ??
      null,

    date:
      booking.date ||
      "",

    slotStart:
      booking.slotStart ||
      "",

    slotEnd:
      booking.slotEnd ||
      "",

    status:
      booking.status ||
      "CONFIRMED",

    quality:
      booking.quality ||
      null,
  };

  return createPrototypeBooking(
    prototypeBooking
  );
}