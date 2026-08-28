export const locationData = [
  {
    stateId: "ts",
    stateName: "Telangana",

    districts: [
      {
        districtId: "hyd",
        districtName: "Hyderabad",

        mandals: [
          {
            mandalId: "serilingampally",
            mandalName: "Serilingampally",

            villages: [
              "Gachibowli",
              "Nanakramguda",
              "Kondapur",
              "Miyapur",
            ],
          },

          {
            mandalId: "rajendranagar",
            mandalName: "Rajendranagar",

            villages: [
              "Attapur",
              "Budvel",
              "Hyderguda",
              "Narsingi",
            ],
          },
        ],
      },

      {
        districtId: "nalgonda",
        districtName: "Nalgonda",

        mandals: [
          {
            mandalId: "nalgonda",
            mandalName: "Nalgonda",

            villages: [
              "Nalgonda",
              "Cherlapally",
              "Kannekal",
              "Annaram",
            ],
          },
        ],
      },
    ],
  },

  {
    stateId: "ap",
    stateName: "Andhra Pradesh",

    districts: [
      {
        districtId: "guntur",
        districtName: "Guntur",

        mandals: [
          {
            mandalId: "tadikonda",
            mandalName: "Tadikonda",

            villages: [
              "Tadikonda",
              "Ponnekallu",
              "Ponugupadu",
              "Lalapuram",
            ],
          },

          {
            mandalId: "mangalagiri",
            mandalName: "Mangalagiri",

            villages: [
              "Mangalagiri",
              "Nowlur",
              "Atmakur",
              "Undavalli",
            ],
          },
        ],
      },
    ],
  },

  {
    stateId: "mh",
    stateName: "Maharashtra",

    districts: [
      {
        districtId: "pune",
        districtName: "Pune",

        mandals: [
          {
            mandalId: "haveli",
            mandalName: "Haveli",

            villages: [
              "Kharadi",
              "Wagholi",
              "Mundhwa",
              "Lohgaon",
            ],
          },
        ],
      },
    ],
  },
];

export const procurementCenters = [
  {
    id: "main",
    name: "Main Procurement Center",

    stateId: "ts",
    districtId: "hyd",
    mandalId: "serilingampally",

    villages: [
      "Gachibowli",
      "Nanakramguda",
      "Kondapur",
      "Miyapur",
    ],

    address:
      "Main Road, Serilingampally",

    landmark:
      "Near Main Market Yard",

    phone:
      "+91 98765 43210",

    emergencyPhone:
      "+91 98765 43211",

    openingTime:
      "08:00 AM",

    closingTime:
      "05:00 PM",

    workingDays:
      "Monday – Saturday",

    slotDuration:
      30,

    capacityPerSlot:
      20,

    instructions: [
      "Bring your produce and booking token.",
      "Arrive during your assigned window.",
      "Keep your registered mobile number available.",
      "Final quantity is determined during weighing.",
    ],

    languages: [
      "en",
      "hi",
      "te",
    ],
  },

  {
    id: "north",
    name: "North Procurement Center",

    stateId: "ts",
    districtId: "hyd",
    mandalId: "rajendranagar",

    villages: [
      "Attapur",
      "Budvel",
      "Hyderguda",
      "Narsingi",
    ],

    address:
      "North Market Yard, Rajendranagar",

    landmark:
      "Opposite Farmers Market",

    phone:
      "+91 98765 43310",

    emergencyPhone:
      "+91 98765 43311",

    openingTime:
      "08:00 AM",

    closingTime:
      "05:00 PM",

    workingDays:
      "Monday – Saturday",

    slotDuration:
      30,

    capacityPerSlot:
      15,

    instructions: [
      "Bring your booking token.",
      "Arrive during the assigned window.",
      "Follow the center operator's queue instructions.",
    ],

    languages: [
      "en",
      "hi",
      "te",
    ],
  },

  {
    id: "east",
    name: "East Procurement Center",

    stateId: "ap",
    districtId: "guntur",
    mandalId: "mangalagiri",

    villages: [
      "Mangalagiri",
      "Nowlur",
      "Atmakur",
      "Undavalli",
    ],

    address:
      "East Collection Point, Mangalagiri",

    landmark:
      "Near East Collection Yard",

    phone:
      "+91 98765 43410",

    emergencyPhone:
      "+91 98765 43411",

    openingTime:
      "09:00 AM",

    closingTime:
      "04:00 PM",

    workingDays:
      "Monday – Saturday",

    slotDuration:
      30,

    capacityPerSlot:
      12,

    instructions: [
      "Bring the crop mentioned in your booking.",
      "Keep your token ready.",
      "Contact the center if you expect to arrive late.",
    ],

    languages: [
      "en",
      "hi",
      "te",
    ],
  },
];

export function getStates() {
  return locationData;
}

export function getStateById(
  stateId
) {
  return locationData.find(
    (state) =>
      state.stateId === stateId
  );
}

export function getDistricts(
  stateId
) {
  const state =
    getStateById(stateId);

  return state?.districts || [];
}

export function getDistrictById(
  stateId,
  districtId
) {
  const districts =
    getDistricts(stateId);

  return districts.find(
    (district) =>
      district.districtId === districtId
  );
}

export function getMandals(
  stateId,
  districtId
) {
  const district =
    getDistrictById(
      stateId,
      districtId
    );

  return district?.mandals || [];
}

export function getMandalById(
  stateId,
  districtId,
  mandalId
) {
  const mandals =
    getMandals(
      stateId,
      districtId
    );

  return mandals.find(
    (mandal) =>
      mandal.mandalId === mandalId
  );
}

export function getVillages(
  stateId,
  districtId,
  mandalId
) {
  const mandal =
    getMandalById(
      stateId,
      districtId,
      mandalId
    );

  return mandal?.villages || [];
}

export function getCenterById(
  centerId
) {
  return procurementCenters.find(
    (center) =>
      center.id === centerId
  );
}

export function getCentersForVillage(
  village
) {
  return procurementCenters.filter(
    (center) =>
      center.villages.includes(
        village
      )
  );
}

export function getCentersForMandal(
  mandalId
) {
  return procurementCenters.filter(
    (center) =>
      center.mandalId === mandalId
  );
}

export function getNearestCenterForFarmer(
  farmer
) {
  const matchingCenters =
    procurementCenters.filter(
      (center) =>
        center.stateId ===
          farmer.stateId &&
        center.districtId ===
          farmer.districtId
    );

  if (!matchingCenters.length) {
    return procurementCenters[0];
  }

  const villageMatch =
    matchingCenters.find(
      (center) =>
        center.villages.includes(
          farmer.village
        )
    );

  return (
    villageMatch ||
    matchingCenters[0]
  );
}