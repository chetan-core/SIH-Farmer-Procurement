import crypto from "crypto";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import {
  GoogleGenAI,
  Type,
} from "@google/genai";
import db, {
  query,
  get,
  all,
  transaction,
  initializeDatabase,
} from "./db.js";

import {
  query as dbQuery,
} from "./db.js";

dotenv.config();

const app =
  express();

const PORT =
  process.env.PORT ||
  5000;

const SMS_ENABLED =
  String(
    process.env.SMS_ENABLED ||
    ""
  ).toLowerCase() ===
  "true";

const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY;

const GEMINI_MODEL =
  process.env.GEMINI_MODEL ||
  "gemini-2.5-flash";

const gemini =
  GEMINI_API_KEY
    ? new GoogleGenAI({
        apiKey:
          GEMINI_API_KEY,
      })
    : null;
/* =========================================================
   MIDDLEWARE
========================================================= */

app.use(
  cors()
);

app.use(
  express.json()
);
/* =========================================================
   TEMP DATABASE DEBUG
========================================================= */

app.get(
  "/api/debug/database",
  async (
    req,
    res
  ) => {

    try {

      const farmers =
        await dbQuery(
          "SELECT id, name, phone, created_at FROM farmers ORDER BY created_at DESC"
        );

      const bookings =
        await dbQuery(
          "SELECT id, token, farmer_id, center_id, status, created_at FROM bookings ORDER BY created_at DESC"
        );

      const centers =
        await dbQuery(
          "SELECT id, name, active FROM centers ORDER BY id"
        );

      const notifications =
        await dbQuery(
          "SELECT id, farmer_id, booking_id, type, channel, status, created_at FROM notifications ORDER BY created_at DESC"
        );

      const transporters =
        await dbQuery(
          "SELECT id, name, phone, vehicle_type, vehicle_number, capacity_kg, is_online, current_lat, current_lng, location_updated_at, total_trips, total_earnings, rating FROM transporters ORDER BY updated_at DESC, id DESC"
        );

      const transportRequests =
        await dbQuery(
          "SELECT id, booking_id, farmer_id, center_id, crop, quantity_kg, pickup_address, requested_date, requested_slot_start, requested_slot_end, transporter_id, status, estimated_fare, final_fare, created_at, updated_at FROM transport_requests ORDER BY created_at DESC, id DESC"
        );

      res.json({

        success:
          true,

        counts: {
          farmers:
            farmers.rowCount,

          bookings:
            bookings.rowCount,

          centers:
            centers.rowCount,

          notifications:
            notifications.rowCount,

          transporters:
            transporters.rowCount,

          transportRequests:
            transportRequests.rowCount,
        },

        farmers:
          farmers.rows,

        bookings:
          bookings.rows,

        centers:
          centers.rows,

        notifications:
          notifications.rows,

        transporters:
          transporters.rows,

        transportRequests:
          transportRequests.rows,

      });

    } catch (
      error
    ) {

      console.error(
        "Database debug error:",
        error
      );

      res
        .status(500)
        .json({

          success:
            false,

          message:
            error?.message ||
            "Database debug failed.",

        });

    }

  }
);

app.use(
  (req, res, next) => {

    console.log(
      `${req.method} ${req.originalUrl}`
    );

    next();

  }
);


/* =========================================================
   SETTINGS
========================================================= */

const DEFAULT_SETTINGS = {

  bookingEnabled:
    true,

  maxQuantity:
    5000,

  defaultCapacity:
    20,

  slotDuration:
    30,

  advanceBookingDays:
    7,

  requireActualWeight:
    true,

  smsEnabled:
    false,

  bookingConfirmationSms:
    true,

  lateArrivalSms:
    true,

  procurementSms:
    true,

  paymentSms:
    true,

  defaultLanguage:
    "en",

  maintenanceMode:
    false,

  transportEnabled:
    true,

};


async function getSettings() {

  const rows =
    await all(`
      SELECT
        key,
        value
      FROM settings
      ORDER BY key ASC
    `);


  const settings = {
    ...DEFAULT_SETTINGS,
  };


  for (
    const row
    of rows
  ) {

    try {

      settings[row.key] =
        JSON.parse(
          row.value
        );

    } catch {

      settings[row.key] =
        row.value;

    }

  }


  return settings;

}


async function saveSettings(
  settings
) {

  await transaction(
    async (
      client
    ) => {

      for (
        const [
          key,
          value,
        ]
        of Object.entries(
          settings
        )
      ) {

        await client.query(
          `
            INSERT INTO settings (
              key,
              value,
              updated_at
            )
            VALUES (
              $1,
              $2,
              CURRENT_TIMESTAMP
            )

            ON CONFLICT (
              key
            )

            DO UPDATE SET
              value =
                EXCLUDED.value,

              updated_at =
                CURRENT_TIMESTAMP
          `,
          [
            key,
            JSON.stringify(
              value
            ),
          ]
        );

      }

    }
  );

}


/* =========================================================
   BOOKING CHANGE AUDIT TABLE
========================================================= */

async function ensureBookingChangesTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS booking_changes (
      id BIGSERIAL PRIMARY KEY,
      booking_id TEXT NOT NULL,
      farmer_id TEXT NOT NULL,
      change_type TEXT NOT NULL,
      reason TEXT,
      before_json TEXT NOT NULL,
      after_json TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}



/* =========================================================
   TRANSPORT & LOGISTICS TABLES
========================================================= */

async function ensureTransportTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS transporters (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      password_hash TEXT,
      password_salt TEXT,
      vehicle_type TEXT NOT NULL DEFAULT 'TRUCK',
      vehicle_number TEXT,
      capacity_kg NUMERIC NOT NULL DEFAULT 1000,
      village TEXT,
      village_id TEXT,
      mandal TEXT,
      mandal_id TEXT,
      district TEXT,
      district_id TEXT,
      state TEXT,
      state_id TEXT,
      pincode TEXT,
      service_radius_km NUMERIC NOT NULL DEFAULT 0,
      is_verified BOOLEAN NOT NULL DEFAULT FALSE,
      verification_status TEXT NOT NULL DEFAULT 'PENDING',
      is_online BOOLEAN NOT NULL DEFAULT FALSE,
      current_lat DOUBLE PRECISION,
      current_lng DOUBLE PRECISION,
      location_updated_at TIMESTAMPTZ,
      total_trips INTEGER NOT NULL DEFAULT 0,
      total_earnings NUMERIC NOT NULL DEFAULT 0,
      rating NUMERIC,
      total_ratings INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const transporterColumns = [
    ['password_hash', 'TEXT'],
    ['password_salt', 'TEXT'],
    ['village', 'TEXT'],
    ['village_id', 'TEXT'],
    ['mandal', 'TEXT'],
    ['mandal_id', 'TEXT'],
    ['district', 'TEXT'],
    ['district_id', 'TEXT'],
    ['state', 'TEXT'],
    ['state_id', 'TEXT'],
    ['pincode', 'TEXT'],
    ['service_radius_km', 'NUMERIC NOT NULL DEFAULT 0'],
    ['is_verified', 'BOOLEAN NOT NULL DEFAULT FALSE'],
    ['verification_status', "TEXT NOT NULL DEFAULT 'PENDING'"],
    ['total_ratings', 'INTEGER NOT NULL DEFAULT 0'],
  ];

  for (const [column, definition] of transporterColumns) {
    await query(`ALTER TABLE transporters ADD COLUMN IF NOT EXISTS ${column} ${definition}`);
  }

  await query(`
    CREATE TABLE IF NOT EXISTS transport_requests (
      id TEXT PRIMARY KEY,
      booking_id TEXT,
      farmer_id TEXT NOT NULL,
      center_id TEXT,
      crop TEXT NOT NULL,
      quantity_kg NUMERIC NOT NULL,
      pickup_address TEXT NOT NULL,
      pickup_lat DOUBLE PRECISION,
      pickup_lng DOUBLE PRECISION,
      pickup_note TEXT,
      farmer_village TEXT,
      farmer_village_id TEXT,
      farmer_mandal TEXT,
      farmer_mandal_id TEXT,
      farmer_district TEXT,
      farmer_district_id TEXT,
      farmer_state TEXT,
      farmer_state_id TEXT,
      farmer_pincode TEXT,
      requested_date TEXT,
      requested_slot_start TEXT,
      requested_slot_end TEXT,
      transporter_id TEXT,
      status TEXT NOT NULL DEFAULT 'REQUESTED',
      estimated_fare NUMERIC,
      final_fare NUMERIC,
      notes TEXT,
      cancellation_reason TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      accepted_at TIMESTAMPTZ,
      picked_up_at TIMESTAMPTZ,
      delivered_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ,
      cancelled_at TIMESTAMPTZ
    )
  `);

  const requestColumns = [
    ['farmer_village', 'TEXT'],
    ['farmer_village_id', 'TEXT'],
    ['farmer_mandal', 'TEXT'],
    ['farmer_mandal_id', 'TEXT'],
    ['farmer_district', 'TEXT'],
    ['farmer_district_id', 'TEXT'],
    ['farmer_state', 'TEXT'],
    ['farmer_state_id', 'TEXT'],
    ['farmer_pincode', 'TEXT'],
    ['cancellation_reason', 'TEXT'],
    ['cancelled_at', 'TIMESTAMPTZ'],
  ];

  for (const [column, definition] of requestColumns) {
    await query(`ALTER TABLE transport_requests ADD COLUMN IF NOT EXISTS ${column} ${definition}`);
  }

  await query(`
    CREATE TABLE IF NOT EXISTS transport_request_events (
      id BIGSERIAL PRIMARY KEY,
      request_id TEXT NOT NULL,
      status TEXT NOT NULL,
      actor_type TEXT NOT NULL DEFAULT 'SYSTEM',
      actor_id TEXT,
      note TEXT,
      metadata_json TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS transport_request_rejections (
      id BIGSERIAL PRIMARY KEY,
      request_id TEXT NOT NULL,
      transporter_id TEXT NOT NULL,
      reason TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (request_id, transporter_id)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS transporter_location_history (
      id BIGSERIAL PRIMARY KEY,
      transporter_id TEXT NOT NULL,
      request_id TEXT,
      lat DOUBLE PRECISION NOT NULL,
      lng DOUBLE PRECISION NOT NULL,
      recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS transport_ratings (
      id BIGSERIAL PRIMARY KEY,
      request_id TEXT NOT NULL,
      farmer_id TEXT NOT NULL,
      transporter_id TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
      review TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (request_id, farmer_id)
    )
  `);

  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_transporters_vehicle_number
    ON transporters (LOWER(vehicle_number))
    WHERE vehicle_number IS NOT NULL
      AND TRIM(vehicle_number) <> ''
  `);

  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_transporters_phone
    ON transporters (phone)
    WHERE phone IS NOT NULL
      AND TRIM(phone) <> ''
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_transporters_online_capacity
    ON transporters (is_online, capacity_kg)
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_transporters_region
    ON transporters (LOWER(COALESCE(state,'')), LOWER(COALESCE(district,'')), LOWER(COALESCE(mandal,'')), LOWER(COALESCE(village,'')), is_online)
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_transport_requests_status
    ON transport_requests (status, created_at DESC)
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_transport_requests_farmer
    ON transport_requests (farmer_id, created_at DESC)
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_transport_requests_transporter
    ON transport_requests (transporter_id, status, created_at DESC)
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_transport_requests_booking
    ON transport_requests (booking_id, created_at DESC)
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_transport_requests_region
    ON transport_requests (LOWER(COALESCE(farmer_state,'')), LOWER(COALESCE(farmer_district,'')), LOWER(COALESCE(farmer_mandal,'')), LOWER(COALESCE(farmer_village,'')), status, created_at DESC)
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_transport_request_events_request
    ON transport_request_events (request_id, created_at ASC, id ASC)
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_transport_rejections_transporter
    ON transport_request_rejections (transporter_id, created_at DESC)
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_transporter_location_history
    ON transporter_location_history (transporter_id, recorded_at DESC)
  `);

  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_transport_active_booking
    ON transport_requests (booking_id)
    WHERE booking_id IS NOT NULL
      AND status NOT IN (
        'CANCELLED',
        'REJECTED',
        'COMPLETED'
      )
  `);
}

/* =========================================================
   COMMON HELPERS
========================================================= */

function normalisePhone(
  value
) {

  return String(
    value ||
    ""
  ).replace(
    /\D/g,
    ""
  );

}


function getIndianRecipient(
  value
) {

  const cleaned =
    normalisePhone(
      value
    );


  if (
    cleaned.length ===
    10
  ) {

    return `+91${cleaned}`;

  }


  if (
    cleaned.length ===
      12 &&
    cleaned.startsWith(
      "91"
    )
  ) {

    return `+${cleaned}`;

  }


  return cleaned;

}


function generateFarmerId() {

  return (
    `F${Date.now()}${Math.floor(
      Math.random() * 1000
    )}`
  );
}


/* =========================================================
   FARMER LOOKUP HELPERS
   ========================================================= */

async function findFarmerById(farmerId) {
  const id = String(farmerId || "").trim();

  if (!id) {
    return null;
  }

  return await get(
    `
      SELECT *
      FROM farmers
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  );
}


async function findFarmerByPhone(phone) {
  const normalizedPhone = normalisePhone(phone);

  if (!normalizedPhone) {
    return null;
  }

  return await get(
    `
      SELECT *
      FROM farmers
      WHERE regexp_replace(COALESCE(phone, ''), '\\D', '', 'g') = $1
      ORDER BY created_at DESC, id DESC
      LIMIT 1
    `,
    [normalizedPhone]
  );
}


async function resolveFarmer({
  farmerId = "",
  phone = "",
} = {}) {
  const requestedId = String(
    farmerId || ""
  ).trim();

  const normalizedPhone = normalisePhone(
    phone
  );

  /* First try the farmer ID */
  if (requestedId) {
    const farmerById =
      await findFarmerById(
        requestedId
      );

    if (farmerById) {
      return farmerById;
    }
  }

  /* Then try the phone number */
  if (normalizedPhone) {
    const farmerByPhone =
      await findFarmerByPhone(
        normalizedPhone
      );

    if (farmerByPhone) {
      return farmerByPhone;
    }
  }

  return null;
}

/* =========================================================
   BOOKING LOOKUP HELPER
   ========================================================= */

async function getBookingById(bookingId) {
  const id = String(bookingId || "").trim();

  if (!id) {
    return null;
  }

  return await get(
    `
      SELECT
        b.*,

        f.name AS farmer_name,
        f.phone AS farmer_phone,
        f.state_id AS farmer_state_id,
        f.district_id AS farmer_district_id,
        f.mandal_id AS farmer_mandal_id,
        f.village AS farmer_village,
        f.language AS farmer_language,

        c.name AS center_name,
        c.address AS center_address

      FROM bookings b

      LEFT JOIN farmers f
        ON f.id = b.farmer_id

      LEFT JOIN centers c
        ON c.id = b.center_id

      WHERE b.id = $1

      LIMIT 1
    `,
    [id]
  );
}
/* =========================================================
   BOOKING LOOKUP HELPER
   ========================================================= */

/* =========================================================
   TRANSPORT HELPERS
========================================================= */

const TRANSPORT_STATUSES = new Set([
  "REQUESTED",
  "ASSIGNED",
  "EN_ROUTE_TO_FARMER",
  "CROP_PICKED_UP",
  "EN_ROUTE_TO_CENTER",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
]);


const TRANSPORT_TERMINAL_STATUSES = new Set([
  "COMPLETED",
  "CANCELLED",
]);


const TRANSPORT_ACTIVE_STATUSES = new Set([
  "REQUESTED",
  "ASSIGNED",
  "EN_ROUTE_TO_FARMER",
  "CROP_PICKED_UP",
  "EN_ROUTE_TO_CENTER",
  "DELIVERED",
]);


const TRANSPORT_ALLOWED_TRANSITIONS = {
  REQUESTED: [
    "ASSIGNED",
    "CANCELLED",
  ],

  ASSIGNED: [
    "EN_ROUTE_TO_FARMER",
    "CANCELLED",
  ],

  EN_ROUTE_TO_FARMER: [
    "CROP_PICKED_UP",
    "CANCELLED",
  ],

  CROP_PICKED_UP: [
    "EN_ROUTE_TO_CENTER",
    "CANCELLED",
  ],

  EN_ROUTE_TO_CENTER: [
    "DELIVERED",
  ],

  DELIVERED: [
    "COMPLETED",
  ],

  COMPLETED: [],

  CANCELLED: [],
};


function generateTransporterId() {
  return (
    `T${Date.now()}${Math.floor(
      Math.random() * 1000
    )}`
  );
}


function generateTransportRequestId() {
  return (
    `TR${Date.now()}${Math.floor(
      Math.random() * 1000
    )}`
  );
}


function normalizeTransportStatus(
  value
) {
  return String(
    value ||
    ""
  )
    .trim()
    .toUpperCase()
    .replace(
      /\s+/g,
      "_"
    );
}


function isValidTransportStatus(
  status
) {
  return TRANSPORT_STATUSES.has(
    normalizeTransportStatus(
      status
    )
  );
}


function getAllowedTransportTransitions(
  status
) {
  return (
    TRANSPORT_ALLOWED_TRANSITIONS[
      normalizeTransportStatus(
        status
      )
    ] ||
    []
  );
}


function isTransportActiveStatus(
  status
) {
  return TRANSPORT_ACTIVE_STATUSES.has(
    normalizeTransportStatus(
      status
    )
  );
}


function parseCoordinate(
  value,
  min,
  max
) {
  if (
    value ===
      null ||
    value ===
      undefined ||
    String(
      value
    ).trim() ===
      ""
  ) {
    return null;
  }

  const number =
    Number(
      value
    );

  if (
    !Number.isFinite(
      number
    ) ||
    number < min ||
    number > max
  ) {
    return null;
  }

  return number;
}


function calculateDistanceKm(
  lat1,
  lng1,
  lat2,
  lng2
) {
  if (
    ![
      lat1,
      lng1,
      lat2,
      lng2,
    ].every(
      value =>
        Number.isFinite(
          Number(
            value
          )
        )
    )
  ) {
    return null;
  }

  const earthRadiusKm =
    6371;

  const toRadians =
    degrees =>
      Number(
        degrees
      ) *
      Math.PI /
      180;

  const dLat =
    toRadians(
      Number(
        lat2
      ) -
      Number(
        lat1
      )
    );

  const dLng =
    toRadians(
      Number(
        lng2
      ) -
      Number(
        lng1
      )
    );

  const a =
    Math.sin(
      dLat / 2
    ) ** 2 +
    Math.cos(
      toRadians(
        lat1
      )
    ) *
    Math.cos(
      toRadians(
        lat2
      )
    ) *
    Math.sin(
      dLng / 2
    ) ** 2;

  const c =
    2 *
    Math.atan2(
      Math.sqrt(
        a
      ),
      Math.sqrt(
        1 - a
      )
    );

  return (
    earthRadiusKm *
    c
  );
}


function normalizeTransporterBoolean(
  value,
  fallback = false
) {
  if (
    value ===
      undefined ||
    value ===
      null
  ) {
    return fallback;
  }

  if (
    typeof value ===
    "boolean"
  ) {
    return value;
  }

  const text =
    String(
      value
    )
      .trim()
      .toLowerCase();

  if (
    [
      "true",
      "1",
      "yes",
      "on",
    ].includes(
      text
    )
  ) {
    return true;
  }

  if (
    [
      "false",
      "0",
      "no",
      "off",
    ].includes(
      text
    )
  ) {
    return false;
  }

  return fallback;
}


function sanitizeTransporter(transporter) {
  if (!transporter) return transporter;
  const { password_hash, password_salt, ...safe } = transporter;
  return safe;
}


async function findTransporterById(
  transporterId
) {
  const id =
    String(
      transporterId ||
      ""
    ).trim();

  if (
    !id
  ) {
    return null;
  }

  return await get(
    `
      SELECT *
      FROM transporters
      WHERE id = $1
    `,
    [
      id,
    ]
  );
}


async function resolveRequesterTransporter(
  req
) {
  const candidate =
    String(
      req.body?.transporterId ||
      req.body?.transporter?.id ||
      req.query?.transporterId ||
      req.headers?.[
        "x-transporter-id"
      ] ||
      ""
    ).trim();

  if (
    !candidate
  ) {
    return null;
  }

  return await findTransporterById(
    candidate
  );
}


async function getTransportRequestById(
  requestId
) {
  const id =
    String(
      requestId ||
      ""
    ).trim();

  if (
    !id
  ) {
    return null;
  }

  return await get(
    `
      SELECT
        tr.*,

        f.name AS farmer_name,
        f.phone AS farmer_phone,
        f.village AS farmer_village,
        f.mandal_id AS farmer_mandal_id,
        f.district_id AS farmer_district_id,
        f.state_id AS farmer_state_id,
        f.language AS farmer_language,

        c.name AS center_name,
        c.address AS center_address,

        t.name AS transporter_name,
        t.phone AS transporter_phone,
        t.vehicle_type AS transporter_vehicle_type,
        t.vehicle_number AS transporter_vehicle_number,
        t.capacity_kg AS transporter_capacity_kg,
        t.is_online AS transporter_is_online,
        t.current_lat AS transporter_lat,
        t.current_lng AS transporter_lng,
        t.location_updated_at AS transporter_location_updated_at

      FROM transport_requests tr

      LEFT JOIN farmers f
        ON f.id = tr.farmer_id

      LEFT JOIN centers c
        ON c.id = tr.center_id

      LEFT JOIN transporters t
        ON t.id = tr.transporter_id

      WHERE tr.id = $1
    `,
    [
      id,
    ]
  );
}


async function getTransportRequestEvents(
  requestId
) {
  return await all(
    `
      SELECT
        id,
        request_id,
        status,
        actor_type,
        actor_id,
        note,
        metadata_json,
        created_at
      FROM transport_request_events
      WHERE request_id = $1
      ORDER BY
        created_at ASC,
        id ASC
    `,
    [
      requestId,
    ]
  );
}


async function recordTransportEvent({
  requestId,
  status,
  actorType = "SYSTEM",
  actorId = null,
  note = null,
  metadata = null,
  client = null,
}) {
  const executor =
    client ||
    {
      query,
    };

  await executor.query(
    `
      INSERT INTO transport_request_events (
        request_id,
        status,
        actor_type,
        actor_id,
        note,
        metadata_json
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6
      )
    `,
    [
      requestId,
      normalizeTransportStatus(
        status
      ),
      actorType,
      actorId,
      note ||
        null,
      metadata
        ? JSON.stringify(
            metadata
          )
        : null,
    ]
  );
}


async function getActiveTransportRequestForBooking(
  bookingId
) {
  return await get(
    `
      SELECT *
      FROM transport_requests
      WHERE booking_id = $1
        AND status NOT IN (
          'CANCELLED',
          'REJECTED',
          'COMPLETED'
        )
      ORDER BY
        created_at DESC,
        id DESC
      LIMIT 1
    `,
    [
      bookingId,
    ]
  );
}


function normaliseRegion(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function sameTransportRegion(transporter, request) {
  const villageIdA = normaliseRegion(transporter?.village_id);
  const villageIdB = normaliseRegion(request?.farmer_village_id);
  const districtIdA = normaliseRegion(transporter?.district_id);
  const districtIdB = normaliseRegion(request?.farmer_district_id);
  const stateIdA = normaliseRegion(transporter?.state_id);
  const stateIdB = normaliseRegion(request?.farmer_state_id);

  if (villageIdA && villageIdB && villageIdA === villageIdB && districtIdA === districtIdB && stateIdA === stateIdB) {
    return true;
  }

  const tv = normaliseRegion(transporter?.village);
  const td = normaliseRegion(transporter?.district);
  const ts = normaliseRegion(transporter?.state);
  const rv = normaliseRegion(request?.farmer_village || request?.village);
  const rd = normaliseRegion(request?.farmer_district || request?.district);
  const rs = normaliseRegion(request?.farmer_state || request?.state);

  return Boolean(tv && td && ts && rv && rd && rs && tv === rv && td === rd && ts === rs);
}

async function getTransportRegionForFarmer(farmerId) {
  const farmer = await findFarmerById(farmerId);
  if (!farmer) return null;
  return {
    village: String(farmer.village || '').trim(),
    mandal: String(farmer.mandal_id || '').trim(),
    district: String(farmer.district_id || '').trim(),
    state: String(farmer.state_id || '').trim(),
    pincode: String(farmer.pincode || '').trim(),
  };
}

async function getTransportRejectionIds(transporterId, requestIds = []) {
  if (!transporterId || !requestIds.length) return new Set();
  const placeholders = requestIds.map((_, index) => `$${index + 2}`).join(', ');
  const rows = await all(
    `
      SELECT request_id
      FROM transport_request_rejections
      WHERE transporter_id = $1
        AND request_id IN (${placeholders})
    `,
    [transporterId, ...requestIds]
  );
  return new Set(rows.map(row => String(row.request_id)));
}

async function assertTransportRegionMatch(transporter, request) {
  const transporterRegion = {
    village: transporter?.village,
    village_id: transporter?.village_id,
    district: transporter?.district,
    district_id: transporter?.district_id,
    state: transporter?.state,
    state_id: transporter?.state_id,
  };
  const requestRegion = {
    farmer_village: request?.farmer_village || request?.village,
    farmer_village_id: request?.farmer_village_id,
    farmer_district: request?.farmer_district || request?.district,
    farmer_district_id: request?.farmer_district_id,
    farmer_state: request?.farmer_state || request?.state,
    farmer_state_id: request?.farmer_state_id,
  };

  if (!sameTransportRegion(transporterRegion, requestRegion)) {
    const error = new Error('Transporter and farmer are outside the allowed service village/region.');
    error.code = 'TRANSPORT_REGION_MISMATCH';
    throw error;
  }
}

async function hashTransporterPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const value = String(password || '');
  if (value.length < 6) throw new Error('Password must contain at least 6 characters.');
  const hash = crypto.scryptSync(value, salt, 64).toString('hex');
  return { hash, salt };
}

function verifyTransporterPassword(password, salt, expectedHash) {
  if (!password || !salt || !expectedHash) return false;
  const actual = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expectedHash, 'hex'));
}

async function getTransportCandidates({
  pickupLat,
  pickupLng,
  quantityKg,
  request = null,
  excludeTransporterId = null,
}) {
  const rows = await all(
    `
      SELECT
        id,
        name,
        phone,
        vehicle_type,
        vehicle_number,
        capacity_kg,
        village,
        mandal,
        district,
        state,
        pincode,
        service_radius_km,
        is_verified,
        verification_status,
        is_online,
        current_lat,
        current_lng,
        location_updated_at,
        total_trips,
        total_earnings,
        rating,
        total_ratings
      FROM transporters
      WHERE is_online = TRUE
        AND capacity_kg >= $1
        AND (
          (
            NULLIF($2, '') IS NOT NULL
            AND LOWER(COALESCE(village_id,'')) = LOWER($2)
            AND LOWER(COALESCE(district_id,'')) = LOWER($3)
            AND LOWER(COALESCE(state_id,'')) = LOWER($4)
          )
          OR
          (
            NULLIF($2, '') IS NULL
            AND LOWER(COALESCE(village,'')) = LOWER($5)
            AND LOWER(COALESCE(district,'')) = LOWER($6)
            AND LOWER(COALESCE(state,'')) = LOWER($7)
          )
        )
        AND (
          $8::text IS NULL
          OR id != $8
        )
    `,
    [
      Number(quantityKg),
      String(request?.farmer_village_id || '').trim(),
      String(request?.farmer_district_id || '').trim(),
      String(request?.farmer_state_id || '').trim(),
      String(request?.farmer_village || '').trim(),
      String(request?.farmer_district || '').trim(),
      String(request?.farmer_state || '').trim(),
      excludeTransporterId ? String(excludeTransporterId) : null,
    ]
  );

  return rows
    .map(transporter => ({
      ...transporter,
      distanceKm: calculateDistanceKm(
        pickupLat,
        pickupLng,
        transporter.current_lat,
        transporter.current_lng
      ),
    }))
    .sort((a, b) => {
      const ad = a.distanceKm ?? Number.POSITIVE_INFINITY;
      const bd = b.distanceKm ?? Number.POSITIVE_INFINITY;
      if (ad !== bd) return ad - bd;
      const ar = Number(a.rating || 0);
      const br = Number(b.rating || 0);
      if (ar !== br) return br - ar;
      return Number(b.total_trips || 0) - Number(a.total_trips || 0);
    });
}


/* =========================================================
   TWILIO SMS
========================================================= */

const TWILIO_TRIAL_TEMPLATE =
  "sms_event_notifications";


async function sendSms(
  number
) {

  const accountSid =
    process.env.TWILIO_ACCOUNT_SID;

  const apiKey =
    process.env.TWILIO_API_KEY;

  const apiSecret =
    process.env.TWILIO_API_SECRET;

  const from =
    process.env.TWILIO_PHONE_NUMBER;


  const recipient =
    getIndianRecipient(
      number
    );


  console.log(
    ""
  );

  console.log(
    "=========================================="
  );

  console.log(
    "             TWILIO SMS"
  );

  console.log(
    "=========================================="
  );

  console.log(
    "SMS_ENABLED:",
    SMS_ENABLED
  );

  console.log(
    "Recipient:",
    recipient
  );

  console.log(
    "Twilio trial template:",
    TWILIO_TRIAL_TEMPLATE
  );


  if (
    !SMS_ENABLED
  ) {

    return {

      sent:
        false,

      status:
        "NOT_SENT",

      reason:
        "SMS is disabled.",

    };

  }


  if (
    !accountSid ||
    !apiKey ||
    !apiSecret ||
    !from
  ) {

    return {

      sent:
        false,

      status:
        "NOT_SENT",

      reason:
        "Twilio credentials are missing.",

    };

  }


  const normalizedPhone =
    normalisePhone(
      number
    );


  if (
    ![
      10,
      12,
    ].includes(
      normalizedPhone.length
    )
  ) {

    return {

      sent:
        false,

      status:
        "FAILED",

      reason:
        "Invalid recipient phone number.",

    };

  }


  try {

    const twilio =
      (
        await import(
          "twilio"
        )
      ).default;


    const client =
      twilio(
        apiKey,
        apiSecret,
        {
          accountSid,
        }
      );


    /*
      For your current Twilio trial setup,
      use the predefined template name exactly
      as required by the trial account.
    */

    const response =
      await client.messages.create({

        to:
          recipient,

        from:
          from,

        body:
          TWILIO_TRIAL_TEMPLATE,

      });


    console.log(
      "Twilio SMS response:",
      {

        sid:
          response.sid,

        status:
          response.status,

        to:
          recipient,

      }
    );


    console.log(
      "=========================================="
    );


    return {

      sent:
        true,

      status:
        "SENT",

      data: {

        sid:
          response.sid,

        twilioStatus:
          response.status,

        to:
          recipient,

        template:
          TWILIO_TRIAL_TEMPLATE,

      },

    };


  } catch (
    error
  ) {

    console.error(
      "=========================================="
    );

    console.error(
      "             TWILIO SMS ERROR"
    );

    console.error(
      "=========================================="
    );

    console.error(
      "Code:",
      error?.code
    );

    console.error(
      "Status:",
      error?.status
    );

    console.error(
      "Message:",
      error?.message
    );

    console.error(
      "More info:",
      error?.moreInfo
    );

    console.error(
      "=========================================="
    );


    return {

      sent:
        false,

      status:
        "FAILED",

      reason:
        error?.message ||
        "Twilio SMS failed.",

      data: {

        code:
          error?.code ||
          null,

        status:
          error?.status ||
          null,

        message:
          error?.message ||
          null,

        moreInfo:
          error?.moreInfo ||
          null,

      },

    };

  }

}


/* =========================================================
   NOTIFICATIONS
========================================================= */

async function createNotification({
  farmerId,
  bookingId = null,
  type,
  title,
  message,
  sms = false,
  phone = null,
}) {

  console.log(
    ""
  );

  console.log(
    "========== CREATE NOTIFICATION =========="
  );

  console.log({

    farmerId,

    bookingId,

    type,

    sms,

    phone,

  });


  const channel =
    sms
      ? "SMS"
      : "IN_APP";


  const initialStatus =
    sms
      ? "PENDING"
      : "DELIVERED";


  const inserted =
    await get(
      `
        INSERT INTO notifications (
          farmer_id,
          booking_id,
          type,
          title,
          message,
          channel,
          status
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7
        )
        RETURNING id
      `,
      [

        farmerId,

        bookingId,

        type,

        title,

        message,

        channel,

        initialStatus,

      ]
    );


  let status =
    initialStatus;


  let sentAt =
    null;


  let providerResponse =
    null;


  if (
    sms
  ) {

    if (
      !phone
    ) {

      status =
        "FAILED";

      providerResponse =
        "SMS requested but farmer phone number is missing.";

    } else {

      const smsResult =
        await sendSms(
          phone
        );


      status =
        smsResult?.status ||
        "FAILED";


      if (
        status ===
        "SENT"
      ) {

        sentAt =
          new Date().toISOString();

      }


      providerResponse =
        smsResult?.data
          ? JSON.stringify(
              smsResult.data
            )
          : smsResult?.reason ||
            null;

    }

  }


  await query(
    `
      UPDATE notifications
      SET
        status = $1,
        sent_at = $2,
        provider_response = $3
      WHERE id = $4
    `,
    [

      status,

      sentAt,

      providerResponse,

      inserted.id,

    ]
  );


  console.log(
    "Notification result:",
    {

      id:
        inserted.id,

      channel,

      status,

      sentAt,

    }
  );


  console.log(
    "=========================================="
  );


  return {

    id:
      inserted.id,

    status,

    sentAt,

    channel,

  };

}


/* =========================================================
   HEALTH
========================================================= */

app.get(
  "/api/health",
  (
    req,
    res
  ) => {

    res.json({

      success:
        true,

      message:
        "KrishiSetu backend is running",

      timestamp:
        new Date().toISOString(),

    });

  }
);


/* =========================================================
   FARMERS
========================================================= */

app.post(
  "/api/farmers",
  async (
    req,
    res
  ) => {

    try {

      const incoming =
        req.body ||
        {};


      const requestedId =
        String(
          incoming.id ||
          ""
        ).trim();


      const name =
        String(
          incoming.name ||
          ""
        ).trim();


      const phone =
        normalisePhone(
          incoming.phone
        );


      if (
        !name ||
        phone.length !==
        10
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            message:
              "Farmer name and valid 10-digit phone are required.",

          });

      }


      let farmer =
        await resolveFarmer({

          farmerId:
            requestedId,

          phone,

        });


      const farmerId =
        farmer?.id ||
        requestedId ||
        generateFarmerId();


      if (
        farmer
      ) {

        await query(
          `
            UPDATE farmers
            SET
              name = $1,
              phone = $2,
              state_id = $3,
              district_id = $4,
              mandal_id = $5,
              village = $6,
              language = $7,
              preferred_center_id = $8,
              primary_crop = $9,
              estimated_quantity = $10
            WHERE id = $11
          `,
          [

            name,

            phone,

            incoming.stateId ??
              farmer.state_id ??
              null,

            incoming.districtId ??
              farmer.district_id ??
              null,

            incoming.mandalId ??
              farmer.mandal_id ??
              null,

            incoming.village ??
              farmer.village ??
              null,

            incoming.language ||
              farmer.language ||
              "en",

            incoming.preferredCenterId ??
              farmer.preferred_center_id ??
              null,

            incoming.primaryCrop ??
              farmer.primary_crop ??
              null,

            Number(
              incoming.estimatedQuantity ??
              farmer.estimated_quantity ??
              0
            ),

            farmer.id,

          ]
        );

      } else {

        await query(
          `
            INSERT INTO farmers (
              id,
              name,
              phone,
              state_id,
              district_id,
              mandal_id,
              village,
              language,
              preferred_center_id,
              primary_crop,
              estimated_quantity
            )
            VALUES (
              $1,
              $2,
              $3,
              $4,
              $5,
              $6,
              $7,
              $8,
              $9,
              $10,
              $11
            )
          `,
          [

            farmerId,

            name,

            phone,

            incoming.stateId ??
              null,

            incoming.districtId ??
              null,

            incoming.mandalId ??
              null,

            incoming.village ??
              null,

            incoming.language ||
              "en",

            incoming.preferredCenterId ??
              null,

            incoming.primaryCrop ??
              null,

            Number(
              incoming.estimatedQuantity ||
              0
            ),

          ]
        );

      }


      const saved =
        await findFarmerById(
          farmerId
        );


      console.log(
        "FARMER SAVED:",
        {

          id:
            saved?.id,

          phone:
            saved?.phone,

          name:
            saved?.name,

        }
      );


      return res.json({

        success:
          true,

        message:
          "Farmer saved.",

        farmer:
          saved,

      });

    } catch (
      error
    ) {

      console.error(
        "Create/update farmer error:",
        error
      );


      if (
        error?.code ===
        "23505"
      ) {

        return res
          .status(409)
          .json({

            success:
              false,

            message:
              "A farmer with this phone number already exists.",

          });

      }


      return res
        .status(500)
        .json({

          success:
            false,

          message:
            "Failed to save farmer.",

        });

    }

  }
);


app.get(
  "/api/farmers",
  async (
    req,
    res
  ) => {

    try {

      const farmers =
        await all(
          `
            SELECT *
            FROM farmers
            ORDER BY created_at DESC, id DESC
          `
        );


      res.json({

        success:
          true,

        farmers,

      });

    } catch (
      error
    ) {

      console.error(
        "Get farmers error:",
        error
      );


      res.status(500).json({

        success:
          false,

        message:
          "Failed to load farmers.",

      });

    }

  }
);


/* =========================================================
   FARMER BY PHONE
========================================================= */

app.get(
  "/api/farmers/by-phone/:phone",
  async (
    req,
    res
  ) => {

    try {

      const phone =
        normalisePhone(
          req.params.phone
        );


      if (
        phone.length !==
        10
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            message:
              "A valid 10-digit phone number is required.",

          });

      }


      const farmer =
        await findFarmerByPhone(
          phone
        );


      if (
        !farmer
      ) {

        return res
          .status(404)
          .json({

            success:
              false,

            message:
              "Farmer not found.",

          });

      }


      res.json({

        success:
          true,

        farmer,

      });

    } catch (
      error
    ) {

      console.error(
        "Farmer phone lookup error:",
        error
      );


      res.status(500).json({

        success:
          false,

        message:
          "Failed to find farmer.",

      });

    }

  }
);


/* =========================================================
   FARMER BY ID
========================================================= */

app.get(
  "/api/farmers/:id",
  async (
    req,
    res
  ) => {

    try {

      const farmer =
        await findFarmerById(
          String(
            req.params.id ||
            ""
          ).trim()
        );


      if (
        !farmer
      ) {

        return res
          .status(404)
          .json({

            success:
              false,

            message:
              "Farmer not found.",

          });

      }


      res.json({

        success:
          true,

        farmer,

      });

    } catch (
      error
    ) {

      console.error(
        "Get farmer error:",
        error
      );


      res.status(500).json({

        success:
          false,

        message:
          "Failed to load farmer.",

      });

    }

  }
);


/* =========================================================
   FARMER SETTINGS
========================================================= */

app.patch(
  "/api/farmers/:id",
  async (
    req,
    res
  ) => {

    try {

      const requestedId =
        String(
          req.params.id ||
          ""
        ).trim();


      const existing =
        await resolveFarmer({

          farmerId:
            requestedId,

          phone:
            req.body?.phone ||
            "",

        });


      if (
        !existing
      ) {

        return res
          .status(404)
          .json({

            success:
              false,

            message:
              "Farmer not found.",

          });

      }


      const name =
        String(
          req.body?.name ??
          existing.name ??
          ""
        ).trim();


      const phone =
        normalisePhone(
          req.body?.phone ??
          existing.phone
        );


      const village =
        String(
          req.body?.village ??
          existing.village ??
          ""
        ).trim();


      const language =
        String(
          req.body?.language ??
          existing.language ??
          "en"
        ).trim();


      const preferredCenterId =
        req.body?.preferredCenterId ??
        existing.preferred_center_id ??
        null;


      const primaryCrop =
        String(
          req.body?.primaryCrop ??
          existing.primary_crop ??
          ""
        ).trim();


      const estimatedQuantity =
        Number(
          req.body?.estimatedQuantity ??
          existing.estimated_quantity ??
          0
        );


      if (
        !name
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            message:
              "Farmer name is required.",

          });

      }


      if (
        phone.length !==
        10
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            message:
              "A valid 10-digit phone number is required.",

          });

      }


      if (
        ![
          "en",
          "hi",
          "te",
        ].includes(
          language
        )
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            message:
              "Invalid language.",

          });

      }


      if (
        !Number.isFinite(
          estimatedQuantity
        ) ||
        estimatedQuantity <
        0
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            message:
              "Quantity cannot be negative.",

          });

      }


      const otherFarmer =
        await findFarmerByPhone(
          phone
        );


      if (
        otherFarmer &&
        otherFarmer.id !==
        existing.id
      ) {

        return res
          .status(409)
          .json({

            success:
              false,

            message:
              "This mobile number is already registered to another farmer.",

          });

      }


      await query(
        `
          UPDATE farmers
          SET
            name = $1,
            phone = $2,
            village = $3,
            language = $4,
            preferred_center_id = $5,
            primary_crop = $6,
            estimated_quantity = $7
          WHERE id = $8
        `,
        [

          name,

          phone,

          village ||
            null,

          language,

          preferredCenterId,

          primaryCrop ||
            null,

          estimatedQuantity,

          existing.id,

        ]
      );


      const updated =
        await findFarmerById(
          existing.id
        );


      res.json({

        success:
          true,

        message:
          "Farmer settings updated.",

        farmer:
          updated,

      });

    } catch (
      error
    ) {

      console.error(
        "Update farmer settings error:",
        error
      );


      res.status(500).json({

        success:
          false,

        message:
          "Failed to update farmer settings.",

      });

    }

  }
);


/* =========================================================
   CENTERS
========================================================= */

app.get(
  "/api/centers",
  async (
    req,
    res
  ) => {

    try {

      const centers =
        await all(
          `
            SELECT *
            FROM centers
            ORDER BY name ASC
          `
        );


      res.json({

        success:
          true,

        centers,

      });

    } catch (
      error
    ) {

      console.error(
        "Get centers error:",
        error
      );


      res.status(500).json({

        success:
          false,

        message:
          "Failed to load procurement centers.",

      });

    }

  }
);


/* =========================================================
   PHASE 2 READ-ONLY CENTER ALIAS
   Existing /api/centers remains the source of truth.
========================================================= */

app.get(
  "/api/procurement/centers",
  async (req, res) => {
    try {
      const centers = await all(
        `
          SELECT *
          FROM centers
          WHERE active = 1
          ORDER BY name ASC
        `
      );

      return res.json({
        success: true,
        centers,
      });
    } catch (error) {
      console.error(
        "Phase 2 procurement centers alias error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Failed to load procurement centers.",
      });
    }
  }
);


/* =========================================================
   CREATE CENTER
========================================================= */

app.post(
  "/api/centers",
  async (
    req,
    res
  ) => {

    try {

      const center =
        req.body ||
        {};


      const id =
        String(
          center.id ||
          ""
        ).trim();


      const name =
        String(
          center.name ||
          ""
        ).trim();


      const stateId =
        String(
          center.stateId ??
          center.state_id ??
          ""
        ).trim();


      const districtId =
        String(
          center.districtId ??
          center.district_id ??
          ""
        ).trim();


      const mandalId =
        String(
          center.mandalId ??
          center.mandal_id ??
          ""
        ).trim();


      const village =
        String(
          center.village ||
          ""
        ).trim();


      const address =
        String(
          center.address ||
          ""
        ).trim();


      const managerName =
        String(
          center.managerName ??
          center.manager_name ??
          ""
        ).trim();


      const managerPhone =
        String(
          center.managerPhone ??
          center.manager_phone ??
          ""
        ).trim();


      const capacity =
        Number(
          center.capacity
        );


      const openingTime =
        String(
          center.openingTime ??
          center.opening_time ??
          "09:00"
        ).trim();


      const closingTime =
        String(
          center.closingTime ??
          center.closing_time ??
          "17:00"
        ).trim();


      const active =
        center.active ===
        false
          ? 0
          : Number(
              center.active ??
              1
            ) === 1
            ? 1
            : 0;


      if (
        !id
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            message:
              "Center ID is required.",

          });

      }


      if (
        !name
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            message:
              "Center name is required.",

          });

      }


      if (
        !Number.isFinite(
          capacity
        ) ||
        capacity <=
        0
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            message:
              "Center capacity must be greater than zero.",

          });

      }


      const existing =
        await get(
          `
            SELECT *
            FROM centers
            WHERE id = $1
          `,
          [
            id,
          ]
        );


      if (
        existing
      ) {

        return res
          .status(409)
          .json({

            success:
              false,

            message:
              "A center with this ID already exists.",

          });

      }


      await query(
        `
          INSERT INTO centers (
            id,
            name,
            state_id,
            district_id,
            mandal_id,
            village,
            address,
            manager_name,
            manager_phone,
            capacity,
            opening_time,
            closing_time,
            active
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9,
            $10,
            $11,
            $12,
            $13
          )
        `,
        [

          id,

          name,

          stateId ||
            null,

          districtId ||
            null,

          mandalId ||
            null,

          village ||
            null,

          address ||
            null,

          managerName ||
            null,

          managerPhone ||
            null,

          capacity,

          openingTime,

          closingTime,

          active,

        ]
      );


      const created =
        await get(
          `
            SELECT *
            FROM centers
            WHERE id = $1
          `,
          [
            id,
          ]
        );


      return res
        .status(201)
        .json({

          success:
            true,

          message:
            "Center created successfully.",

          center:
            created,

        });

    } catch (
      error
    ) {

      console.error(
        "Create center error:",
        error
      );


      if (
        error?.code ===
        "23505"
      ) {

        return res
          .status(409)
          .json({

            success:
              false,

            message:
              "A center with this ID already exists.",

          });

      }


      return res
        .status(500)
        .json({

          success:
            false,

          message:
            "Failed to create procurement center.",

        });

    }

  }
);


/* =========================================================
   UPDATE CENTER
========================================================= */

app.patch(
  "/api/centers/:id",
  async (
    req,
    res
  ) => {

    try {

      const centerId =
        String(
          req.params.id ||
          ""
        ).trim();


      const existing =
        await get(
          `
            SELECT *
            FROM centers
            WHERE id = $1
          `,
          [
            centerId,
          ]
        );


      if (
        !existing
      ) {

        return res
          .status(404)
          .json({

            success:
              false,

            message:
              "Procurement center not found.",

          });

      }


      const name =
        String(
          req.body?.name ??
          existing.name ??
          ""
        ).trim();


      const stateId =
        String(
          req.body?.stateId ??
          req.body?.state_id ??
          existing.state_id ??
          ""
        ).trim();


      const districtId =
        String(
          req.body?.districtId ??
          req.body?.district_id ??
          existing.district_id ??
          ""
        ).trim();


      const mandalId =
        String(
          req.body?.mandalId ??
          req.body?.mandal_id ??
          existing.mandal_id ??
          ""
        ).trim();


      const village =
        String(
          req.body?.village ??
          existing.village ??
          ""
        ).trim();


      const address =
        String(
          req.body?.address ??
          existing.address ??
          ""
        ).trim();


      const managerName =
        String(
          req.body?.managerName ??
          req.body?.manager_name ??
          existing.manager_name ??
          ""
        ).trim();


      const managerPhone =
        String(
          req.body?.managerPhone ??
          req.body?.manager_phone ??
          existing.manager_phone ??
          ""
        ).trim();


      const capacity =
        Number(
          req.body?.capacity ??
          existing.capacity ??
          20
        );


      const openingTime =
        String(
          req.body?.openingTime ??
          req.body?.opening_time ??
          existing.opening_time ??
          "09:00"
        ).trim();


      const closingTime =
        String(
          req.body?.closingTime ??
          req.body?.closing_time ??
          existing.closing_time ??
          "17:00"
        ).trim();


      const active =
        req.body?.active ===
        false
          ? 0
          : Number(
              req.body?.active ??
              existing.active ??
              1
            ) === 1
            ? 1
            : 0;


      if (
        !name
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            message:
              "Center name is required.",

          });

      }


      if (
        !Number.isFinite(
          capacity
        ) ||
        capacity <=
        0
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            message:
              "Center capacity must be greater than zero.",

          });

      }


      await query(
        `
          UPDATE centers
          SET
            name = $1,
            state_id = $2,
            district_id = $3,
            mandal_id = $4,
            village = $5,
            address = $6,
            manager_name = $7,
            manager_phone = $8,
            capacity = $9,
            opening_time = $10,
            closing_time = $11,
            active = $12,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $13
        `,
        [

          name,

          stateId ||
            null,

          districtId ||
            null,

          mandalId ||
            null,

          village ||
            null,

          address ||
            null,

          managerName ||
            null,

          managerPhone ||
            null,

          capacity,

          openingTime,

          closingTime,

          active,

          centerId,

        ]
      );


      const updated =
        await get(
          `
            SELECT *
            FROM centers
            WHERE id = $1
          `,
          [
            centerId,
          ]
        );


      return res.json({

        success:
          true,

        message:
          "Center updated successfully.",

        center:
          updated,

      });

    } catch (
      error
    ) {

      console.error(
        "Update center error:",
        error
      );


      return res
        .status(500)
        .json({

          success:
            false,

          message:
            "Failed to update procurement center.",

        });

    }

  }
);



/* =========================================================
   TRANSPORTERS
========================================================= */

app.post(
  "/api/transporters",
  async (
    req,
    res
  ) => {
    try {
      const body =
        req.body ||
        {};

      const requestedId =
        String(
          body.id ||
          ""
        ).trim();

      const name =
        String(
          body.name ||
          ""
        ).trim();

      const phone =
        normalisePhone(
          body.phone
        );

      const vehicleType =
        String(
          body.vehicleType ||
          body.vehicle_type ||
          "TRUCK"
        ).trim().toUpperCase();

      const vehicleNumber =
        String(
          body.vehicleNumber ||
          body.vehicle_number ||
          ""
        ).trim().toUpperCase();

      const capacityKg =
        Number(
          body.capacityKg ??
          body.capacity_kg ??
          1000
        );

      const isOnline =
        normalizeTransporterBoolean(
          body.isOnline ??
          body.is_online,
          false
        );

      const village = String(body.village || body.region?.village || '').trim();
      const villageId = String(body.villageId || body.village_id || body.region?.villageId || body.region?.village_id || '').trim();
      const mandal = String(body.mandal || body.mandalName || body.region?.mandal || '').trim();
      const mandalId = String(body.mandalId || body.mandal_id || body.region?.mandalId || body.region?.mandal_id || '').trim();
      const district = String(body.district || body.districtName || body.region?.district || '').trim();
      const districtId = String(body.districtId || body.district_id || body.region?.districtId || body.region?.district_id || '').trim();
      const state = String(body.state || body.stateName || body.region?.state || '').trim();
      const stateId = String(body.stateId || body.state_id || body.region?.stateId || body.region?.state_id || '').trim();
      const pincode = String(body.pincode || body.pinCode || body.region?.pincode || '').trim();
      const serviceRadiusKm = Number(body.serviceRadiusKm ?? body.service_radius_km ?? 0);
      const password = String(body.password || '').trim();

      const currentLat =
        parseCoordinate(
          body.currentLat ??
          body.current_lat,
          -90,
          90
        );

      const currentLng =
        parseCoordinate(
          body.currentLng ??
          body.current_lng,
          -180,
          180
        );

      if (
        !name
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Transporter name is required.",
          });
      }

      if (
        !vehicleType
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Vehicle type is required.",
          });
      }

      if (
        !Number.isFinite(
          capacityKg
        ) ||
        capacityKg <= 0
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Vehicle capacity must be greater than zero.",
          });
      }

      if (!Number.isFinite(serviceRadiusKm) || serviceRadiusKm < 0 || serviceRadiusKm > 250) {
        return res.status(400).json({
          success: false,
          message: "Service radius must be between 0 and 250 km.",
        });
      }

      let transporter =
        await findTransporterById(
          requestedId
        );

      const transporterId =
        transporter?.id ||
        requestedId ||
        generateTransporterId();

      const resolvedIsOnline =
        transporter
          ? normalizeTransporterBoolean(
              body.isOnline ??
              body.is_online,
              transporter.is_online === true
            )
          : isOnline;

      let passwordHash = transporter?.password_hash || null;
      let passwordSalt = transporter?.password_salt || null;

      if (password) {
        const hashed = await hashTransporterPassword(password);
        passwordHash = hashed.hash;
        passwordSalt = hashed.salt;
      }

      if (
        transporter
      ) {
        await query(
          `
            UPDATE transporters
            SET
              name = $1,
              phone = $2,
              vehicle_type = $3,
              vehicle_number = $4,
              capacity_kg = $5,
              village = $6,
              village_id = $7,
              mandal = $8,
              mandal_id = $9,
              district = $10,
              district_id = $11,
              state = $12,
              state_id = $13,
              pincode = $14,
              service_radius_km = $15,
              password_hash = COALESCE($16, password_hash),
              password_salt = COALESCE($17, password_salt),
              is_online = $18,
              current_lat = COALESCE($19, current_lat),
              current_lng = COALESCE($20, current_lng),
              location_updated_at =
                CASE
                  WHEN $19 IS NOT NULL
                    OR $20 IS NOT NULL
                  THEN CURRENT_TIMESTAMP
                  ELSE location_updated_at
                END,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $21
          `,
          [
            name,
            phone ||
              null,
            vehicleType,
            vehicleNumber ||
              null,
            capacityKg,
            village || null,
            villageId || null,
            mandal || null,
            mandalId || null,
            district || null,
            districtId || null,
            state || null,
            stateId || null,
            pincode || null,
            serviceRadiusKm,
            passwordHash,
            passwordSalt,
            resolvedIsOnline,
            currentLat,
            currentLng,
            transporterId,
          ]
        );
      } else {
        await query(
          `
            INSERT INTO transporters (
              id,
              name,
              phone,
              vehicle_type,
              vehicle_number,
              capacity_kg,
              village,
              village_id,
              mandal,
              mandal_id,
              district,
              district_id,
              state,
              state_id,
              pincode,
              service_radius_km,
              password_hash,
              password_salt,
              is_online,
              current_lat,
              current_lng,
              location_updated_at
            )
            VALUES (
              $1,
              $2,
              $3,
              $4,
              $5,
              $6,
              $7,
              $8,
              $9,
              $10,
              $11,
              $12,
              $13,
              $14,
              $15,
              $16,
              $17,
              $18,
              CASE
                WHEN $17 IS NOT NULL
                  OR $18 IS NOT NULL
                THEN CURRENT_TIMESTAMP
                ELSE NULL
              END
            )
          `,
          [
            transporterId,
            name,
            phone ||
              null,
            vehicleType,
            vehicleNumber ||
              null,
            capacityKg,
            village || null,
            villageId || null,
            mandal || null,
            mandalId || null,
            district || null,
            districtId || null,
            state || null,
            stateId || null,
            pincode || null,
            serviceRadiusKm,
            passwordHash,
            passwordSalt,
            isOnline,
            currentLat,
            currentLng,
          ]
        );
      }

      const saved =
        await findTransporterById(
          transporterId
        );

      return res.json({
        success: true,
        message:
          "Transporter saved successfully.",
        transporter:
          sanitizeTransporter(saved),
      });
    } catch (
      error
    ) {
      console.error(
        "Save transporter error:",
        error
      );

      if (
        error?.code ===
        "23505"
      ) {
        return res
          .status(409)
          .json({
            success: false,
            message:
              "This vehicle number is already registered.",
          });
      }

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Failed to save transporter.",
        });
    }
  }
);


app.post(
  "/api/transporters/register",
  async (req, res) => {
    try {
      const body = req.body || {};
      const name = String(body.name || '').trim();
      const phone = normalisePhone(body.phone);
      const password = String(body.password || '').trim();
      const vehicleType = String(body.vehicleType || body.vehicle_type || 'TRUCK').trim().toUpperCase();
      const vehicleNumber = String(body.vehicleNumber || body.vehicle_number || '').trim().toUpperCase();
      const capacityKg = Number(body.capacityKg ?? body.capacity_kg ?? 1000);
      const village = String(body.village || body.region?.village || '').trim();
      const villageId = String(body.villageId || body.village_id || body.region?.villageId || body.region?.village_id || '').trim();
      const mandal = String(body.mandal || body.region?.mandal || '').trim();
      const mandalId = String(body.mandalId || body.mandal_id || body.region?.mandalId || body.region?.mandal_id || '').trim();
      const district = String(body.district || body.region?.district || '').trim();
      const districtId = String(body.districtId || body.district_id || body.region?.districtId || body.region?.district_id || '').trim();
      const state = String(body.state || body.region?.state || '').trim();
      const stateId = String(body.stateId || body.state_id || body.region?.stateId || body.region?.state_id || '').trim();
      const pincode = String(body.pincode || body.region?.pincode || '').trim();
      const serviceRadiusKm = Number(body.serviceRadiusKm ?? body.service_radius_km ?? 0);

      if (!name) return res.status(400).json({ success: false, message: 'Transporter name is required.' });
      if (phone.length !== 10) return res.status(400).json({ success: false, message: 'A valid 10-digit mobile number is required.' });
      if (password.length < 6) return res.status(400).json({ success: false, message: 'Password must contain at least 6 characters.' });
      if (!vehicleType) return res.status(400).json({ success: false, message: 'Vehicle type is required.' });
      if (!Number.isFinite(capacityKg) || capacityKg <= 0) return res.status(400).json({ success: false, message: 'Vehicle capacity must be greater than zero.' });
      if ((!village && !villageId) || (!district && !districtId) || (!state && !stateId)) return res.status(400).json({ success: false, message: 'Village, district and state are required for transporter registration.' });
      if (!Number.isFinite(serviceRadiusKm) || serviceRadiusKm < 0 || serviceRadiusKm > 250) return res.status(400).json({ success: false, message: 'Service radius must be between 0 and 250 km.' });

      if (await get(`SELECT id FROM transporters WHERE phone = $1`, [phone])) return res.status(409).json({ success: false, message: 'A transporter account already exists for this mobile number.' });
      if (vehicleNumber && await get(`SELECT id FROM transporters WHERE LOWER(vehicle_number) = LOWER($1)`, [vehicleNumber])) return res.status(409).json({ success: false, message: 'This vehicle number is already registered.' });

      const hashed = await hashTransporterPassword(password);
      const transporterId = generateTransporterId();
      const result = await query(
        `
          INSERT INTO transporters (
            id, name, phone, password_hash, password_salt, vehicle_type,
            vehicle_number, capacity_kg, village, village_id, mandal, mandal_id,
            district, district_id, state, state_id, pincode, service_radius_km, is_online
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,FALSE)
          RETURNING *
        `,
        [transporterId, name, phone, hashed.hash, hashed.salt, vehicleType, vehicleNumber || null, capacityKg, village || null, villageId || null, mandal || null, mandalId || null, district || null, districtId || null, state || null, stateId || null, pincode || null, serviceRadiusKm]
      );

      return res.status(201).json({ success: true, message: 'Transporter account created successfully.', transporter: result.rows[0] });
    } catch (error) {
      console.error('Transporter registration error:', error);
      if (error?.code === '23505') return res.status(409).json({ success: false, message: 'This mobile number or vehicle number is already registered.' });
      return res.status(500).json({ success: false, message: 'Failed to register transporter.' });
    }
  }
);

app.post(
  "/api/transporters/login",
  async (req, res) => {
    try {
      const phone = normalisePhone(req.body?.phone);
      const password = String(req.body?.password || "");
      const transporter = await get(`SELECT * FROM transporters WHERE phone = $1`, [phone]);
      if (!transporter || !verifyTransporterPassword(password, transporter.password_salt, transporter.password_hash)) {
        return res.status(401).json({ success: false, message: "Invalid transporter mobile number or password." });
      }
      return res.json({ success: true, message: "Transporter login successful.", transporter: sanitizeTransporter(transporter) });
    } catch (error) {
      console.error("Transporter login error:", error);
      return res.status(500).json({ success: false, message: "Failed to login transporter." });
    }
  }
);

app.get(
  "/api/transporters/:id/profile",
  async (req, res) => {
    try {
      const transporter = await findTransporterById(req.params.id);
      if (!transporter) return res.status(404).json({ success: false, message: "Transporter not found." });
      const { password_hash, password_salt, ...safe } = transporter;
      return res.json({ success: true, transporter: safe });
    } catch (error) {
      console.error("Get transporter profile error:", error);
      return res.status(500).json({ success: false, message: "Failed to load transporter profile." });
    }
  }
);

app.get(
  "/api/transporters",
  async (
    req,
    res
  ) => {
    try {
      const onlineOnly =
        String(
          req.query?.online ||
          ""
        ).trim().toLowerCase();

      const params =
        [];
      let where =
        "";

      if (
        [
          "true",
          "1",
          "yes",
        ].includes(
          onlineOnly
        )
      ) {
        where =
          "WHERE is_online = TRUE";
      }

      const transporters =
        await all(
          `
            SELECT *
            FROM transporters
            ${where}
            ORDER BY
              is_online DESC,
              COALESCE(rating, 0) DESC,
              total_trips DESC,
              name ASC
          `,
          params
        );

      return res.json({
        success: true,
        transporters: transporters.map(sanitizeTransporter),
      });
    } catch (
      error
    ) {
      console.error(
        "Get transporters error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Failed to load transporters.",
        });
    }
  }
);


app.get(
  "/api/transporters/:id",
  async (
    req,
    res
  ) => {
    try {
      const transporter =
        await findTransporterById(
          req.params.id
        );

      if (
        !transporter
      ) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Transporter not found.",
          });
      }

      const activeTrips =
        await all(
          `
            SELECT *
            FROM transport_requests
            WHERE transporter_id = $1
              AND status IN (
                'ASSIGNED',
                'EN_ROUTE_TO_FARMER',
                'CROP_PICKED_UP',
                'EN_ROUTE_TO_CENTER',
                'DELIVERED'
              )
            ORDER BY
              created_at DESC,
              id DESC
          `,
          [
            transporter.id,
          ]
        );

      return res.json({
        success: true,
        transporter: sanitizeTransporter(transporter),
        activeTrips,
      });
    } catch (
      error
    ) {
      console.error(
        "Get transporter error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Failed to load transporter.",
        });
    }
  }
);


app.patch(
  "/api/transporters/:id/availability",
  async (
    req,
    res
  ) => {
    try {
      const transporter =
        await findTransporterById(
          req.params.id
        );

      if (
        !transporter
      ) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Transporter not found.",
          });
      }

      const isOnline =
        normalizeTransporterBoolean(
          req.body?.isOnline ??
          req.body?.is_online,
          transporter.is_online ===
            true
        );

      const currentLat =
        parseCoordinate(
          req.body?.currentLat ??
          req.body?.current_lat,
          -90,
          90
        );

      const currentLng =
        parseCoordinate(
          req.body?.currentLng ??
          req.body?.current_lng,
          -180,
          180
        );

      await query(
        `
          UPDATE transporters
          SET
            is_online = $1,
            current_lat = COALESCE($2, current_lat),
            current_lng = COALESCE($3, current_lng),
            location_updated_at =
              CASE
                WHEN $2 IS NOT NULL
                  OR $3 IS NOT NULL
                THEN CURRENT_TIMESTAMP
                ELSE location_updated_at
              END,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $4
        `,
        [
          isOnline,
          currentLat,
          currentLng,
          transporter.id,
        ]
      );

      const updated =
        await findTransporterById(
          transporter.id
        );

      return res.json({
        success: true,
        message:
          isOnline
            ? "You are now online and visible for transport jobs."
            : "You are now offline.",
        transporter:
          updated,
      });
    } catch (
      error
    ) {
      console.error(
        "Transporter availability error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Failed to update transporter availability.",
        });
    }
  }
);


app.patch(
  "/api/transporters/:id/location",
  async (
    req,
    res
  ) => {
    try {
      const transporter =
        await findTransporterById(
          req.params.id
        );

      if (
        !transporter
      ) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Transporter not found.",
          });
      }

      const lat =
        parseCoordinate(
          req.body?.lat ??
          req.body?.currentLat ??
          req.body?.current_lat,
          -90,
          90
        );

      const lng =
        parseCoordinate(
          req.body?.lng ??
          req.body?.currentLng ??
          req.body?.current_lng,
          -180,
          180
        );

      if (
        lat === null ||
        lng === null
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Valid latitude and longitude are required.",
          });
      }

      await query(
        `
          UPDATE transporters
          SET
            current_lat = $1,
            current_lng = $2,
            location_updated_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $3
        `,
        [
          lat,
          lng,
          transporter.id,
        ]
      );

      const activeTrip = await get(`SELECT id FROM transport_requests WHERE transporter_id = $1 AND status IN ('ASSIGNED','EN_ROUTE_TO_FARMER','CROP_PICKED_UP','EN_ROUTE_TO_CENTER','DELIVERED') ORDER BY created_at DESC LIMIT 1`, [transporter.id]);
      await query(`INSERT INTO transporter_location_history (transporter_id, request_id, lat, lng) VALUES ($1,$2,$3,$4)`, [transporter.id, activeTrip?.id || null, lat, lng]);

      return res.json({
        success: true,
        location: {
          lat,
          lng,
          updatedAt:
            new Date().toISOString(),
        },
      });
    } catch (
      error
    ) {
      console.error(
        "Transporter location error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Failed to update transporter location.",
        });
    }
  }
);


/* =========================================================
   TRANSPORT REQUESTS
========================================================= */

async function createTransportRequestHandler(
  req,
  res
) {
    try {
      const settings =
        await getSettings();

      if (
        settings.transportEnabled ===
        false
      ) {
        return res
          .status(409)
          .json({
            success: false,
            message:
              "Transport requests are currently disabled by the administrator.",
          });
      }

      const body =
        req.body ||
        {};

      const farmer =
        await resolveFarmer({
          farmerId:
            String(
              body.farmerId ||
              body.farmer?.id ||
              ""
            ).trim(),
          phone:
            normalisePhone(
              body.phone ||
              body.farmer?.phone ||
              ""
            ),
        });

      if (
        !farmer
      ) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Farmer account not found. Please login again.",
          });
      }

      const bookingId =
        String(
          body.bookingId ||
          ""
        ).trim();

      let booking =
        null;

      if (
        bookingId
      ) {
        booking =
          await get(
            `
              SELECT *
              FROM bookings
              WHERE id = $1
            `,
            [
              bookingId,
            ]
          );

        if (
          !booking
        ) {
          return res
            .status(404)
            .json({
              success: false,
              message:
                "Linked booking not found.",
            });
        }

        if (
          !bookingBelongsToFarmer(
            booking,
            farmer
          )
        ) {
          return res
            .status(403)
            .json({
              success: false,
              message:
                "You are not authorised to request transport for this booking.",
            });
        }

        if (
          [
            "CANCELLED",
            "REJECTED",
            "EXPIRED",
            "PAYMENT_SENT",
          ].includes(
            String(
              booking.status ||
              ""
            ).toUpperCase()
          )
        ) {
          return res
            .status(409)
            .json({
              success: false,
              message:
                "Transport cannot be requested for this booking in its current status.",
            });
        }

        const existing =
          await getActiveTransportRequestForBooking(
            bookingId
          );

        if (
          existing
        ) {
          const existingRequest =
            await getTransportRequestById(
              existing.id
            );

          return res.json({
            success: true,
            alreadyExists:
              true,
            message:
              "An active transport request already exists for this booking.",
            request:
              existingRequest,
          });
        }
      }

      const centerId =
        String(
          body.centerId ||
          booking?.center_id ||
          ""
        ).trim();

      const crop =
        String(
          body.crop ||
          booking?.crop ||
          ""
        ).trim();

      const quantityKg =
        Number(
          body.quantityKg ??
          body.quantity_kg ??
          booking?.actual_quantity ??
          booking?.estimated_quantity ??
          0
        );

      const pickupAddress =
        String(
          body.pickupAddress ||
          body.pickup_address ||
          ""
        ).trim();

      const requestedDate =
        String(
          body.requestedDate ||
          body.requested_date ||
          booking?.date ||
          ""
        ).trim();

      if (
        requestedDate &&
        !normalizeBookingDate(
          requestedDate
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "A valid requested transport date is required.",
          });
      }

      const requestedSlotStart =
        String(
          body.requestedSlotStart ||
          body.requested_slot_start ||
          booking?.slot_start ||
          ""
        ).trim();

      const requestedSlotEnd =
        String(
          body.requestedSlotEnd ||
          body.requested_slot_end ||
          booking?.slot_end ||
          ""
        ).trim();

      const pickupLat =
        parseCoordinate(
          body.pickupLat ??
          body.pickup_lat,
          -90,
          90
        );

      const pickupLng =
        parseCoordinate(
          body.pickupLng ??
          body.pickup_lng,
          -180,
          180
        );

      const pickupNote =
        String(
          body.pickupNote ||
          body.pickup_note ||
          ""
        ).trim();

      const notes =
        String(
          body.notes ||
          ""
        ).trim();

      if (
        (requestedSlotStart && !requestedSlotEnd) ||
        (!requestedSlotStart && requestedSlotEnd)
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Both transport pickup start and end times are required.",
          });
      }

      if (
        requestedSlotStart &&
        requestedSlotEnd
      ) {
        const slotStartMinutes =
          parseBookingTimeMinutes(
            requestedSlotStart
          );

        const slotEndMinutes =
          parseBookingTimeMinutes(
            requestedSlotEnd
          );

        if (
          slotStartMinutes === null ||
          slotEndMinutes === null ||
          slotEndMinutes <= slotStartMinutes
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "A valid transport pickup time window is required.",
            });
        }
      }

      const estimatedFare =
        Number(
          body.estimatedFare ??
          body.estimated_fare
        );

      if (
        !centerId
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Procurement center is required.",
          });
      }

      const center =
        await get(
          `
            SELECT *
            FROM centers
            WHERE id = $1
          `,
          [
            centerId,
          ]
        );

      if (
        !center
      ) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Procurement center not found.",
          });
      }

      if (
        !crop
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Crop is required for transport.",
          });
      }

      if (
        !Number.isFinite(
          quantityKg
        ) ||
        quantityKg <= 0
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "A positive crop quantity is required.",
          });
      }

      if (
        !pickupAddress
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Pickup address is required.",
          });
      }

      let safeEstimatedFare =
        null;

      if (
        Number.isFinite(
          estimatedFare
        ) &&
        estimatedFare >= 0
      ) {
        safeEstimatedFare =
          estimatedFare;
      }

      const farmerRegion = {
        village: String(farmer.village || '').trim(),
        villageId: String(farmer.village_id || '').trim(),
        mandal: String(farmer.mandal || farmer.mandal_name || farmer.mandal_id || '').trim(),
        mandalId: String(farmer.mandal_id || '').trim(),
        district: String(farmer.district || farmer.district_name || farmer.district_id || '').trim(),
        districtId: String(farmer.district_id || '').trim(),
        state: String(farmer.state || farmer.state_name || farmer.state_id || '').trim(),
        stateId: String(farmer.state_id || '').trim(),
        pincode: String(farmer.pincode || '').trim(),
      };

      if (!farmerRegion.village || !farmerRegion.district || !farmerRegion.state) {
        return res.status(409).json({
          success: false,
          message: "Your farmer profile must have village, district and state before transport can be requested.",
        });
      }

      const requestId =
        generateTransportRequestId();

      await transaction(
        async (
          client
        ) => {
          await client.query(
            `
              INSERT INTO transport_requests (
                id,
                booking_id,
                farmer_id,
                center_id,
                crop,
                quantity_kg,
                pickup_address,
                pickup_lat,
                pickup_lng,
                pickup_note,
                farmer_village,
                farmer_village_id,
                farmer_mandal,
                farmer_mandal_id,
                farmer_district,
                farmer_district_id,
                farmer_state,
                farmer_state_id,
                farmer_pincode,
                requested_date,
                requested_slot_start,
                requested_slot_end,
                status,
                estimated_fare,
                notes
              )
              VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8,
                $9,
                $10,
                $11,
                $12,
                $13,
                $14,
                $15,
                $16,
                $17,
                $18,
                $19,
                $20,
                $21,
                $22,
                'REQUESTED',
                $23,
                $24
              )
            `,
            [
              requestId,
              bookingId ||
                null,
              farmer.id,
              centerId,
              crop,
              quantityKg,
              pickupAddress,
              pickupLat,
              pickupLng,
              pickupNote ||
                null,
              farmerRegion.village,
              farmerRegion.villageId || null,
              farmerRegion.mandal,
              farmerRegion.mandalId || null,
              farmerRegion.district,
              farmerRegion.districtId || null,
              farmerRegion.state,
              farmerRegion.stateId || null,
              farmerRegion.pincode || null,
              requestedDate ||
                null,
              requestedSlotStart ||
                null,
              requestedSlotEnd ||
                null,
              safeEstimatedFare,
              notes ||
                null,
            ]
          );

          await recordTransportEvent({
            requestId,
            status:
              "REQUESTED",
            actorType:
              "FARMER",
            actorId:
              farmer.id,
            note:
              "Transport request created.",
            client,
          });
        }
      );

      const created =
        await getTransportRequestById(
          requestId
        );

      const candidates =
        await getTransportCandidates({
          pickupLat,
          pickupLng,
          quantityKg,
          request: created,
        });

      await createNotification({
        farmerId:
          farmer.id,
        bookingId:
          bookingId ||
          null,
        type:
          "TRANSPORT_REQUESTED",
        title:
          "Transport request created",
        message:
          `Your KrishiSetu transport request for ${quantityKg} kg of ${crop} is waiting for a transporter.`,
        sms:
          false,
      });

      return res
        .status(201)
        .json({
          success: true,
          message:
            "Transport request created successfully.",
          request:
            created,
          candidates:
            candidates.slice(
              0,
              10
            ),
        });
    } catch (
      error
    ) {
      console.error(
        "Create transport request error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Failed to create transport request.",
        });
    }
  }



app.post(
  "/api/transport/requests",
  createTransportRequestHandler
);


app.post(
  "/api/bookings/:id/transport-request",
  async (
    req,
    res
  ) => {
    try {
      req.body = {
        ...(req.body || {}),
        bookingId:
          req.params.id,
      };

      return await createTransportRequestHandler(
        req,
        res
      );
    } catch (
      error
    ) {
      console.error(
        "Booking transport shortcut error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Failed to create transport request for booking.",
        });
    }
  }
);


app.get(
  "/api/transport/requests",
  async (
    req,
    res
  ) => {
    try {
      const params =
        [];
      const conditions =
        [];

      const farmerId =
        String(
          req.query?.farmerId ||
          ""
        ).trim();

      const transporterId =
        String(
          req.query?.transporterId ||
          ""
        ).trim();

      const status =
        normalizeTransportStatus(
          req.query?.status ||
          ""
        );

      const activeOnly =
        normalizeTransporterBoolean(
          req.query?.activeOnly,
          false
        );

      if (
        farmerId
      ) {
        params.push(
          farmerId
        );
        conditions.push(
          `tr.farmer_id = $${params.length}`
        );
      }

      if (
        transporterId
      ) {
        params.push(
          transporterId
        );
        conditions.push(
          `(tr.transporter_id = $${params.length} OR (
            tr.status = 'REQUESTED'
            AND (
              (
                NULLIF((SELECT village_id FROM transporters WHERE id = $${params.length}), '') IS NOT NULL
                AND LOWER(COALESCE(tr.farmer_village_id,'')) = LOWER((SELECT village_id FROM transporters WHERE id = $${params.length}))
                AND LOWER(COALESCE(tr.farmer_district_id,'')) = LOWER((SELECT district_id FROM transporters WHERE id = $${params.length}))
                AND LOWER(COALESCE(tr.farmer_state_id,'')) = LOWER((SELECT state_id FROM transporters WHERE id = $${params.length}))
              )
              OR
              (
                NULLIF((SELECT village_id FROM transporters WHERE id = $${params.length}), '') IS NULL
                AND LOWER(COALESCE(tr.farmer_village,'')) = LOWER((SELECT village FROM transporters WHERE id = $${params.length}))
                AND LOWER(COALESCE(tr.farmer_district,'')) = LOWER((SELECT district FROM transporters WHERE id = $${params.length}))
                AND LOWER(COALESCE(tr.farmer_state,'')) = LOWER((SELECT state FROM transporters WHERE id = $${params.length}))
              )
            )
          ))`
        );
        conditions.push(`NOT EXISTS (SELECT 1 FROM transport_request_rejections rr WHERE rr.request_id = tr.id AND rr.transporter_id = $${params.length})`);
      }

      if (
        status
      ) {
        if (
          !isValidTransportStatus(
            status
          )
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "Invalid transport status.",
            });
        }

        params.push(
          status
        );
        conditions.push(
          `tr.status = $${params.length}`
        );
      }

      if (
        activeOnly
      ) {
        conditions.push(
          `tr.status IN (
            'REQUESTED',
            'ASSIGNED',
            'EN_ROUTE_TO_FARMER',
            'CROP_PICKED_UP',
            'EN_ROUTE_TO_CENTER',
            'DELIVERED'
          )`
        );
      }

      const where =
        conditions.length
          ? `WHERE ${conditions.join(
              " AND "
            )}`
          : "";

      const requests =
        await all(
          `
            SELECT
              tr.*,

              f.name AS farmer_name,
              f.phone AS farmer_phone,
              f.village AS farmer_village,
              tr.farmer_village AS request_farmer_village,
              tr.farmer_village_id AS request_farmer_village_id,
              tr.farmer_mandal AS request_farmer_mandal,
              tr.farmer_mandal_id AS request_farmer_mandal_id,
              tr.farmer_district AS request_farmer_district,
              tr.farmer_district_id AS request_farmer_district_id,
              tr.farmer_state AS request_farmer_state,
              tr.farmer_state_id AS request_farmer_state_id,
              tr.farmer_mandal AS request_farmer_mandal,
              tr.farmer_district AS request_farmer_district,
              tr.farmer_state AS request_farmer_state,
              tr.farmer_pincode AS request_farmer_pincode,

              c.name AS center_name,
              c.address AS center_address,

              t.name AS transporter_name,
              t.vehicle_type AS transporter_vehicle_type,
              t.vehicle_number AS transporter_vehicle_number,
              t.current_lat AS transporter_lat,
              t.current_lng AS transporter_lng,
              t.location_updated_at AS transporter_location_updated_at

            FROM transport_requests tr

            LEFT JOIN farmers f
              ON f.id = tr.farmer_id

            LEFT JOIN centers c
              ON c.id = tr.center_id

            LEFT JOIN transporters t
              ON t.id = tr.transporter_id

            ${where}

            ORDER BY
              CASE
                WHEN tr.status = 'REQUESTED'
                THEN 0
                WHEN tr.status IN (
                  'ASSIGNED',
                  'EN_ROUTE_TO_FARMER',
                  'CROP_PICKED_UP',
                  'EN_ROUTE_TO_CENTER',
                  'DELIVERED'
                )
                THEN 1
                ELSE 2
              END,
              tr.created_at DESC,
              tr.id DESC
          `,
          params
        );

      return res.json({
        success: true,
        requests,
      });
    } catch (
      error
    ) {
      console.error(
        "Get transport requests error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Failed to load transport requests.",
        });
    }
  }
);


app.get(
  "/api/transport/requests/:id",
  async (
    req,
    res
  ) => {
    try {
      const request =
        await getTransportRequestById(
          req.params.id
        );

      if (
        !request
      ) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Transport request not found.",
          });
      }

      const events =
        await getTransportRequestEvents(
          request.id
        );

      return res.json({
        success: true,
        request,
        events,
      });
    } catch (
      error
    ) {
      console.error(
        "Get transport request error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Failed to load transport request.",
        });
    }
  }
);


app.get(
  "/api/transport/requests/:id/tracking",
  async (req, res) => {
    try {
      const request = await getTransportRequestById(req.params.id);
      if (!request) return res.status(404).json({ success: false, message: "Transport request not found." });

      const farmer = await resolveRequesterFarmer(req);
      const transporterId = String(req.query?.transporterId || req.body?.transporterId || "").trim();
      const allowedFarmer = farmer && String(farmer.id) === String(request.farmer_id);
      const allowedTransporter = transporterId && String(request.transporter_id || "") === transporterId;
      if (!allowedFarmer && !allowedTransporter) return res.status(403).json({ success: false, message: "You are not authorised to view live transport tracking." });

      return res.json({
        success: true,
        tracking: {
          requestId: request.id,
          status: request.status,
          transporterId: request.transporter_id,
          transporterName: request.transporter_name,
          vehicleType: request.transporter_vehicle_type,
          vehicleNumber: request.transporter_vehicle_number,
          isOnline: request.transporter_is_online,
          lat: request.transporter_lat,
          lng: request.transporter_lng,
          locationUpdatedAt: request.transporter_location_updated_at,
          pickupLat: request.pickup_lat,
          pickupLng: request.pickup_lng,
          pickupAddress: request.pickup_address,
          centerName: request.center_name,
          centerAddress: request.center_address,
        },
      });
    } catch (error) {
      console.error("Transport tracking error:", error);
      return res.status(500).json({ success: false, message: "Failed to load live transport tracking." });
    }
  }
);


app.get(
  "/api/transport/requests/:id/events",
  async (
    req,
    res
  ) => {
    try {
      const request =
        await getTransportRequestById(
          req.params.id
        );

      if (
        !request
      ) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Transport request not found.",
          });
      }

      return res.json({
        success: true,
        events:
          await getTransportRequestEvents(
            request.id
          ),
      });
    } catch (
      error
    ) {
      console.error(
        "Transport request events error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Failed to load transport request history.",
        });
    }
  }
);


app.patch(
  "/api/transport/requests/:id/accept",
  async (
    req,
    res
  ) => {
    try {
      const transporter =
        await resolveRequesterTransporter(
          req
        );

      if (
        !transporter
      ) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Transporter account not found.",
          });
      }

      if (
        transporter.is_online !==
        true
      ) {
        return res
          .status(409)
          .json({
            success: false,
            message:
              "Go online before accepting transport jobs.",
          });
      }

      const request =
        await getTransportRequestById(
          req.params.id
        );

      if (
        !request
      ) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Transport request not found.",
          });
      }

      if (
        request.status !==
        "REQUESTED"
      ) {
        return res
          .status(409)
          .json({
            success: false,
            message:
              "This transport request is no longer available.",
          });
      }

      try {
        await assertTransportRegionMatch(transporter, request);
      } catch (error) {
        if (error?.code === "TRANSPORT_REGION_MISMATCH") {
          return res.status(403).json({ success: false, message: error.message });
        }
        throw error;
      }

      const activeAssigned = await get(
        `SELECT id FROM transport_requests WHERE transporter_id = $1 AND status IN ('ASSIGNED','EN_ROUTE_TO_FARMER','CROP_PICKED_UP','EN_ROUTE_TO_CENTER','DELIVERED') LIMIT 1`,
        [transporter.id]
      );

      if (activeAssigned) {
        return res.status(409).json({
          success: false,
          message: "Complete your active transport trip before accepting another job.",
        });
      }

      if (
        Number(
          transporter.capacity_kg
        ) <
        Number(
          request.quantity_kg
        )
      ) {
        return res
          .status(409)
          .json({
            success: false,
            message:
              `Your vehicle capacity is ${transporter.capacity_kg} kg, but this request needs ${request.quantity_kg} kg.`,
          });
      }

      const assignment =
        await transaction(
          async (
            client
          ) => {
            const claimed =
              await client.query(
                `
                  UPDATE transport_requests
                  SET
                    transporter_id = $1,
                    status = 'ASSIGNED',
                    accepted_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                  WHERE id = $2
                    AND status = 'REQUESTED'
                    AND transporter_id IS NULL
                  RETURNING *
                `,
                [
                  transporter.id,
                  request.id,
                ]
              );

            if (
              !claimed.rows.length
            ) {
              return null;
            }

            await recordTransportEvent({
              requestId:
                request.id,
              status:
                "ASSIGNED",
              actorType:
                "TRANSPORTER",
              actorId:
                transporter.id,
              note:
                "Transporter accepted the request.",
              client,
            });

            return claimed.rows[0];
          }
        );

      if (
        !assignment
      ) {
        return res
          .status(409)
          .json({
            success: false,
            message:
              "This transport request was just accepted by another transporter.",
          });
      }

      const updated =
        await getTransportRequestById(
          request.id
        );

      await createNotification({
        farmerId:
          updated.farmer_id,
        bookingId:
          updated.booking_id ||
          null,
        type:
          "TRANSPORT_ASSIGNED",
        title:
          "Transporter assigned",
        message:
          `${updated.transporter_name || "A transporter"} accepted your transport request.`,
        sms:
          false,
      });

      return res.json({
        success: true,
        message:
          "Transport request accepted.",
        request:
          updated,
      });
    } catch (
      error
    ) {
      console.error(
        "Accept transport request error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Failed to accept transport request.",
        });
    }
  }
);


app.patch(
  "/api/transport/requests/:id/reject",
  async (
    req,
    res
  ) => {
    try {
      const transporter =
        await resolveRequesterTransporter(
          req
        );

      if (
        !transporter
      ) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Transporter account not found.",
          });
      }

      const request =
        await getTransportRequestById(
          req.params.id
        );

      if (
        !request
      ) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Transport request not found.",
          });
      }

      if (
        request.status !==
        "REQUESTED"
      ) {
        return res
          .status(409)
          .json({
            success: false,
            message:
              "Only unassigned transport requests can be rejected.",
          });
      }

      const note =
        String(
          req.body?.reason ||
          req.body?.note ||
          "Transporter declined the request."
        ).trim();

      await query(
        `
          INSERT INTO transport_request_rejections (
            request_id, transporter_id, reason
          )
          VALUES ($1, $2, $3)
          ON CONFLICT (request_id, transporter_id)
          DO UPDATE SET reason = EXCLUDED.reason
        `,
        [request.id, transporter.id, note]
      );

      await recordTransportEvent({
        requestId: request.id,
        status: "REQUESTED",
        actorType: "TRANSPORTER",
        actorId: transporter.id,
        note: `Rejected: ${note}`,
        metadata: { event: "REJECTED" },
      });

      await createNotification({
        farmerId:
          request.farmer_id,
        bookingId:
          request.booking_id ||
          null,
        type:
          "TRANSPORT_REJECTED",
        title:
          "Transport request still searching",
        message:
          "A transporter declined your request. KrishiSetu is keeping it open for another transporter.",
        sms:
          false,
      });

      return res.json({
        success: true,
        message:
          "Request declined. It remains open for another transporter.",
        request:
          await getTransportRequestById(
            request.id
          ),
      });
    } catch (
      error
    ) {
      console.error(
        "Reject transport request error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Failed to reject transport request.",
        });
    }
  }
);


app.patch(
  "/api/transport/requests/:id/status",
  async (
    req,
    res
  ) => {
    try {
      const transporter =
        await resolveRequesterTransporter(
          req
        );

      if (
        !transporter
      ) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Transporter account not found.",
          });
      }

      const request =
        await getTransportRequestById(
          req.params.id
        );

      if (
        !request
      ) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Transport request not found.",
          });
      }

      if (
        String(
          request.transporter_id ||
          ""
        ) !==
        String(
          transporter.id
        )
      ) {
        return res
          .status(403)
          .json({
            success: false,
            message:
              "This transport request is assigned to another transporter.",
          });
      }

      const nextStatus =
        normalizeTransportStatus(
          req.body?.status
        );

      if (
        !isValidTransportStatus(
          nextStatus
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid transport status.",
          });
      }

      const allowed =
        getAllowedTransportTransitions(
          request.status
        );

      if (
        !allowed.includes(
          nextStatus
        )
      ) {
        return res
          .status(409)
          .json({
            success: false,
            message:
              `Transport status cannot move from ${request.status} to ${nextStatus}.`,
          });
      }

      const note =
        String(
          req.body?.note ||
          ""
        ).trim();

      const finalFareNumber =
        Number(
          req.body?.finalFare ??
          req.body?.final_fare
        );

      const finalFare =
        Number.isFinite(
          finalFareNumber
        ) &&
        finalFareNumber >= 0
          ? finalFareNumber
          : request.final_fare;

      const updated =
        await transaction(
          async (
            client
          ) => {
            let updateSql = `
              UPDATE transport_requests
              SET
                status = $1,
                final_fare = $2,
                updated_at = CURRENT_TIMESTAMP
            `;

            const updateParams = [
              nextStatus,
              finalFare,
            ];

            if (
              nextStatus ===
              "EN_ROUTE_TO_FARMER"
            ) {
              updateSql +=
                `, accepted_at = COALESCE(accepted_at, CURRENT_TIMESTAMP)`;
            }

            if (
              nextStatus ===
              "CROP_PICKED_UP"
            ) {
              updateSql +=
                `, picked_up_at = CURRENT_TIMESTAMP`;
            }

            if (
              nextStatus ===
              "DELIVERED"
            ) {
              updateSql +=
                `, delivered_at = CURRENT_TIMESTAMP`;
            }

            if (
              nextStatus ===
              "COMPLETED"
            ) {
              updateSql +=
                `, completed_at = CURRENT_TIMESTAMP`;
            }

            updateParams.push(
              request.id,
              transporter.id,
              request.status
            );

            updateSql += `
              WHERE id = $3
                AND transporter_id = $4
                AND status = $5
              RETURNING *
            `;

            const result =
              await client.query(
                updateSql,
                updateParams
              );

            if (
              !result.rows.length
            ) {
              return null;
            }

            if (
              nextStatus ===
              "COMPLETED"
            ) {
              await client.query(
                `
                  UPDATE transporters
                  SET
                    total_trips =
                      total_trips + 1,
                    total_earnings =
                      total_earnings +
                      COALESCE($1, 0),
                    updated_at =
                      CURRENT_TIMESTAMP
                  WHERE id = $2
                `,
                [
                  finalFare,
                  transporter.id,
                ]
              );
            }

            await recordTransportEvent({
              requestId:
                request.id,
              status:
                nextStatus,
              actorType:
                "TRANSPORTER",
              actorId:
                transporter.id,
              note:
                note ||
                `Transport status changed to ${nextStatus}.`,
              metadata: {
                finalFare:
                  finalFare,
              },
              client,
            });

            return result.rows[0];
          }
        );

      if (
        !updated
      ) {
        return res
          .status(409)
          .json({
            success: false,
            message:
              "The transport request changed before this update could be saved.",
          });
      }

      const hydrated =
        await getTransportRequestById(
          request.id
        );

      await createNotification({
        farmerId:
          hydrated.farmer_id,
        bookingId:
          hydrated.booking_id ||
          null,
        type:
          `TRANSPORT_${nextStatus}`,
        title:
          getNotificationTitle(
            nextStatus
          ),
        message:
          getTransportStatusMessage(
            nextStatus,
            hydrated.farmer_language ||
              "en"
          ),
        sms:
          false,
      });

      return res.json({
        success: true,
        message:
          "Transport status updated successfully.",
        request:
          hydrated,
      });
    } catch (
      error
    ) {
      console.error(
        "Update transport status error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Failed to update transport status.",
        });
    }
  }
);


app.patch(
  "/api/transport/requests/:id/cancel",
  async (
    req,
    res
  ) => {
    try {
      const request =
        await getTransportRequestById(
          req.params.id
        );

      if (
        !request
      ) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Transport request not found.",
          });
      }

      const farmer =
        await resolveRequesterFarmer(
          req
        );

      if (
        !farmer ||
        String(
          request.farmer_id ||
          ""
        ) !==
        String(
          farmer.id
        )
      ) {
        return res
          .status(403)
          .json({
            success: false,
            message:
              "You are not authorised to cancel this transport request.",
          });
      }

      if (
        !isTransportActiveStatus(
          request.status
        )
      ) {
        return res
          .status(409)
          .json({
            success: false,
            message:
              "This transport request is already closed.",
          });
      }

      const reason =
        String(
          req.body?.reason ||
          "Cancelled by farmer."
        ).trim();

      const updated =
        await transaction(
          async (
            client
          ) => {
            const result =
              await client.query(
                `
                  UPDATE transport_requests
                  SET
                    status = 'CANCELLED',
                    cancellation_reason = $3,
                    cancelled_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                  WHERE id = $1
                    AND farmer_id = $2
                    AND status NOT IN (
                      'CANCELLED',
                      'COMPLETED'
                    )
                  RETURNING *
                `,
                [
                  request.id,
                  farmer.id,
                  reason,
                ]
              );

            if (
              !result.rows.length
            ) {
              return null;
            }

            await recordTransportEvent({
              requestId:
                request.id,
              status:
                "CANCELLED",
              actorType:
                "FARMER",
              actorId:
                farmer.id,
              note:
                reason,
              client,
            });

            return result.rows[0];
          }
        );

      if (
        !updated
      ) {
        return res
          .status(409)
          .json({
            success: false,
            message:
              "The transport request could not be cancelled.",
          });
      }

      const hydrated =
        await getTransportRequestById(
          request.id
        );

      return res.json({
        success: true,
        message:
          "Transport request cancelled.",
        request:
          hydrated,
      });
    } catch (
      error
    ) {
      console.error(
        "Cancel transport request error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Failed to cancel transport request.",
        });
    }
  }
);


app.patch(
  "/api/transport/requests/:id",
  async (req, res) => {
    try {
      const request = await getTransportRequestById(req.params.id);
      if (!request) return res.status(404).json({ success: false, message: "Transport request not found." });

      const farmer = await resolveRequesterFarmer(req);
      if (!farmer || String(request.farmer_id) !== String(farmer.id)) {
        return res.status(403).json({ success: false, message: "You are not authorised to edit this transport request." });
      }

      if (["CROP_PICKED_UP", "EN_ROUTE_TO_CENTER", "DELIVERED", "COMPLETED", "CANCELLED"].includes(String(request.status))) {
        return res.status(409).json({ success: false, message: "This transport request can no longer be edited." });
      }

      const body = req.body || {};
      const quantityKg = body.quantityKg != null ? Number(body.quantityKg) : Number(request.quantity_kg);
      const pickupAddress = String(body.pickupAddress ?? request.pickup_address).trim();
      const requestedDate = String(body.requestedDate ?? request.requested_date ?? "").trim();
      const requestedSlotStart = String(body.requestedSlotStart ?? request.requested_slot_start ?? "").trim();
      const requestedSlotEnd = String(body.requestedSlotEnd ?? request.requested_slot_end ?? "").trim();
      const pickupNote = String(body.pickupNote ?? request.pickup_note ?? "").trim();
      const notes = String(body.notes ?? request.notes ?? "").trim();

      if (!Number.isFinite(quantityKg) || quantityKg <= 0) return res.status(400).json({ success: false, message: "A positive crop quantity is required." });
      if (!pickupAddress) return res.status(400).json({ success: false, message: "Pickup address is required." });

      const before = { ...request };
      const updated = await transaction(async client => {
        const result = await client.query(
          `
            UPDATE transport_requests
            SET quantity_kg = $1,
                pickup_address = $2,
                requested_date = $3,
                requested_slot_start = $4,
                requested_slot_end = $5,
                pickup_note = $6,
                notes = $7,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $8
              AND farmer_id = $9
              AND status IN ('REQUESTED','ASSIGNED')
            RETURNING *
          `,
          [quantityKg, pickupAddress, requestedDate || null, requestedSlotStart || null, requestedSlotEnd || null, pickupNote || null, notes || null, request.id, farmer.id]
        );
        if (!result.rows.length) return null;
        await recordTransportEvent({
          requestId: request.id,
          status: result.rows[0].status,
          actorType: "FARMER",
          actorId: farmer.id,
          note: "Transport request details updated by farmer.",
          metadata: { before, after: result.rows[0] },
          client,
        });
        return result.rows[0];
      });

      if (!updated) return res.status(409).json({ success: false, message: "The transport request changed before it could be edited." });
      return res.json({ success: true, message: "Transport request updated successfully.", request: await getTransportRequestById(request.id) });
    } catch (error) {
      console.error("Edit transport request error:", error);
      return res.status(500).json({ success: false, message: "Failed to edit transport request." });
    }
  }
);


app.get(
  "/api/transport/match/:id",
  async (
    req,
    res
  ) => {
    try {
      const request =
        await getTransportRequestById(
          req.params.id
        );

      if (
        !request
      ) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Transport request not found.",
          });
      }

      if (
        request.status !==
        "REQUESTED"
      ) {
        return res.json({
          success: true,
          request,
          candidates: [],
          message:
            "This request has already been assigned or closed.",
        });
      }

      const candidates =
        await getTransportCandidates({
          pickupLat:
            request.pickup_lat,
          pickupLng:
            request.pickup_lng,
          quantityKg:
            request.quantity_kg,
          request,
        });

      return res.json({
        success: true,
        request,
        candidates:
          candidates.slice(
            0,
            20
          ),
      });
    } catch (
      error
    ) {
      console.error(
        "Transport matching error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Failed to find transporters.",
        });
    }
  }
);


app.post(
  "/api/transport/requests/:id/rating",
  async (req, res) => {
    try {
      const request = await getTransportRequestById(req.params.id);
      if (!request) return res.status(404).json({ success: false, message: "Transport request not found." });
      const farmer = await resolveRequesterFarmer(req);
      if (!farmer || String(farmer.id) !== String(request.farmer_id)) return res.status(403).json({ success: false, message: "You are not authorised to rate this transport trip." });
      if (request.status !== "COMPLETED") return res.status(409).json({ success: false, message: "Rating is available after the trip is completed." });
      const rating = Number(req.body?.rating);
      const review = String(req.body?.review || "").trim();
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ success: false, message: "Rating must be an integer from 1 to 5." });

      const result = await transaction(async client => {
        const inserted = await client.query(`INSERT INTO transport_ratings (request_id, farmer_id, transporter_id, rating, review) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (request_id, farmer_id) DO UPDATE SET rating=EXCLUDED.rating, review=EXCLUDED.review RETURNING *`, [request.id, farmer.id, request.transporter_id, rating, review || null]);
        const aggregate = await client.query(`SELECT AVG(rating) AS rating, COUNT(*)::int AS total_ratings FROM transport_ratings WHERE transporter_id = $1`, [request.transporter_id]);
        await client.query(`UPDATE transporters SET rating = $1, total_ratings = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`, [Number(aggregate.rows[0].rating || 0), Number(aggregate.rows[0].total_ratings || 0), request.transporter_id]);
        return inserted.rows[0];
      });

      return res.json({ success: true, message: "Transporter rating saved.", rating: result });
    } catch (error) {
      console.error("Transport rating error:", error);
      return res.status(500).json({ success: false, message: "Failed to save transport rating." });
    }
  }
);


/* =========================================================
   BOOKINGS - LIST
========================================================= */

app.get(
  "/api/bookings",
  async (
    req,
    res
  ) => {

    try {

      const bookings =
        await all(
          `
            SELECT
              b.*,

              f.name AS farmer_name,
              f.phone AS farmer_phone,
              f.village AS farmer_village,

              p.amount AS payment_amount,
              p.method AS payment_method,
              p.reference AS payment_reference,
              p.status AS payment_status,
              p.rate_per_kg AS payment_rate_per_kg,
              p.notes AS payment_notes,
              p.updated_at AS payment_updated_at,
              p.sms_status AS payment_sms_status,
              p.sms_sent_at AS payment_sms_sent_at

            FROM bookings b

            LEFT JOIN farmers f
              ON f.id = b.farmer_id

            LEFT JOIN payments p
              ON p.id = (
                SELECT MAX(p2.id)
                FROM payments p2
                WHERE p2.booking_id = b.id
              )

            ORDER BY
              b.created_at DESC,
              b.id DESC
          `
        );


      res.json({

        success:
          true,

        bookings,

      });

    } catch (
      error
    ) {

      console.error(
        "Get bookings error:",
        error
      );


      res.status(500).json({

        success:
          false,

        message:
          "Failed to load bookings.",

      });

    }

  }
);


/* =========================================================
   BOOKING AVAILABILITY
========================================================= */

app.get(
  "/api/booking-availability",
  async (req, res) => {
    try {
      const settings = await getSettings();
      const date = String(req.query?.date || "").trim();
      const requestedCenterId = String(req.query?.centerId || "").trim();

      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ success: false, message: "A valid date (YYYY-MM-DD) is required." });
      }

      const centers = await all(`
        SELECT * FROM centers
        WHERE COALESCE(active, 1) = 1
        ${requestedCenterId ? "AND id = $2" : ""}
        ORDER BY name ASC
      `, requestedCenterId ? [date, requestedCenterId] : [date]);

      const bookings = await all(`
        SELECT center_id, date, slot_start, slot_end, status
        FROM bookings
        WHERE date = $1
      `, [date]);

      const ignored = new Set(["CANCELLED", "CANCELED", "REJECTED", "EXPIRED", "PAYMENT_SENT"]);
      const slots = [];

      const toMinutes = value => {
        const m = String(value || "").match(/^(\d{1,2}):(\d{2})$/);
        if (!m) return null;
        const h = Number(m[1]), min = Number(m[2]);
        return Number.isFinite(h) && Number.isFinite(min) && h >= 0 && h <= 23 && min >= 0 && min <= 59
          ? h * 60 + min
          : null;
      };

      for (const center of centers) {
        const capacity = Math.max(1, Number(center.capacity || settings.defaultCapacity || 20));
        const duration = Math.max(5, Number(settings.slotDuration || 30));
        let cursor = toMinutes(center.opening_time || "09:00");
        const closing = toMinutes(center.closing_time || "17:00");
        if (cursor == null || closing == null || closing <= cursor) continue;

        while (cursor + duration <= closing) {
          const fmt = n => `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
          const start = fmt(cursor), end = fmt(cursor + duration);
          const booked = bookings.filter(b =>
            String(b.center_id) === String(center.id) &&
            String(b.date) === date &&
            String(b.slot_start) === start &&
            String(b.slot_end) === end &&
            !ignored.has(String(b.status || "").toUpperCase())
          ).length;
          slots.push({
            id: `${center.id}:${start.replace(":", "-")}`,
            centerId: center.id,
            centerName: center.name,
            start,
            end,
            capacity,
            booked,
            remaining: Math.max(capacity - booked, 0),
          });
          cursor += duration;
        }
      }

      res.json({ success: true, date, centers, slots });
    } catch (error) {
      console.error("Booking availability error:", error);
      res.status(500).json({ success: false, message: "Failed to load booking availability." });
    }
  }
);


/* =========================================================
   CREATE BOOKING
========================================================= */

app.post(
  "/api/bookings",
  async (
    req,
    res
  ) => {

    try {

      const booking =
        req.body ||
        {};


      const farmerData =
        booking.farmer ||
        {};


      const id =
        String(
          booking.id ||
          ""
        ).trim();


      const token =
        String(
          booking.token ||
          ""
        ).trim();


      const suppliedFarmerId =
        String(
          farmerData.id ||
          ""
        ).trim();


      const suppliedPhone =
        normalisePhone(
          farmerData.phone
        );


      console.log(
        "BOOKING REQUEST RECEIVED:",
        {

          id,

          token,

          farmerId:
            suppliedFarmerId,

          phone:
            suppliedPhone,

        }
      );


      if (
        !id ||
        !token
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            message:
              "Booking id and token are required.",

          });

      }


      const existingBooking =
        await get(
          `
            SELECT *
            FROM bookings
            WHERE id = $1
          `,
          [
            id,
          ]
        );


      if (
        existingBooking
      ) {

        return res.json({

          success:
            true,

          booking:
            existingBooking,

          alreadyExists:
            true,

          smsStatus:
            "ALREADY_EXISTS",

        });

      }


      const farmer =
        await resolveFarmer({

          farmerId:
            suppliedFarmerId,

          phone:
            suppliedPhone,

        });


      if (
        !farmer
      ) {

        return res
          .status(404)
          .json({

            success:
              false,

            message:
              "Farmer account not found. Please login again.",

          });

      }


      const centerId =
        String(
          booking.centerId ||
          ""
        ).trim();


      const crop =
        String(
          booking.crop ||
          ""
        ).trim();


      const estimatedQuantity =
        Number(
          booking.estimatedQuantity ||
          0
        );


      const date =
        booking.date ||
        null;


      const slotStart =
        booking.slotStart ||
        null;


      const slotEnd =
        booking.slotEnd ||
        null;


      const settings =
        await getSettings();


      if (
        !settings.bookingEnabled
      ) {

        return res
          .status(409)
          .json({

            success:
              false,

            message:
              "New farmer bookings are currently disabled by the administrator.",

          });

      }


      if (
        settings.maintenanceMode
      ) {

        return res
          .status(503)
          .json({

            success:
              false,

            message:
              "KrishiSetu is currently under maintenance.",

          });

      }


      if (
        estimatedQuantity <=
        0
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            message:
              "Estimated quantity must be greater than zero.",

          });

      }


      if (
        estimatedQuantity >
        Number(
          settings.maxQuantity
        )
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            message:
              `Maximum quantity allowed per booking is ${settings.maxQuantity} kg.`,

          });

      }


      if (
        !centerId ||
        !crop ||
        !date ||
        !slotStart ||
        !slotEnd
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            message:
              "Incomplete booking details.",

          });

      }


      const today =
        new Date();

      today.setHours(
        0,
        0,
        0,
        0
      );


      const requestedDate =
        new Date(
          `${date}T00:00:00`
        );


      if (
        Number.isNaN(
          requestedDate.getTime()
        )
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            message:
              "Invalid booking date.",

          });

      }


      if (
        requestedDate <
        today
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            message:
              "Bookings cannot be created for a past date.",

          });

      }


      const maximumDate =
        new Date(
          today
        );


      maximumDate.setDate(
        maximumDate.getDate() +
        Number(
          settings.advanceBookingDays
        )
      );


      if (
        requestedDate >
        maximumDate
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            message:
              `Bookings can only be made up to ${settings.advanceBookingDays} days in advance.`,

          });

      }


      const center =
        await get(
          `
            SELECT *
            FROM centers
            WHERE id = $1
          `,
          [
            centerId,
          ]
        );


      if (
        !center
      ) {

        return res
          .status(404)
          .json({

            success:
              false,

            message:
              "Procurement center not found.",

          });

      }


      if (
        center.active !==
          undefined &&
        center.active !==
          null &&
        Number(
          center.active
        ) ===
          0
      ) {

        return res
          .status(409)
          .json({

            success:
              false,

            message:
              "This procurement center is currently inactive.",

          });

      }


      const capacity =
        Number(
          center.capacity ||
          settings.defaultCapacity ||
          20
        );


      if (
        !Number.isFinite(
          capacity
        ) ||
        capacity <=
        0
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            message:
              "Invalid slot capacity.",

          });

      }


      const slotConflict =
        await get(
          `
            SELECT COUNT(*)::int AS count
            FROM bookings
            WHERE
              center_id = $1
              AND date = $2
              AND slot_start = $3
              AND slot_end = $4
              AND status NOT IN ('PAYMENT_SENT', 'CANCELLED', 'REJECTED', 'EXPIRED')
          `,
          [

            centerId,

            date,

            slotStart,

            slotEnd,

          ]
        );


      if (
        Number(
          slotConflict?.count ||
          0
        ) >=
        capacity
      ) {

        return res
          .status(409)
          .json({

            success:
              false,

            message:
              "This arrival window is full. Please choose another slot.",

          });

      }


      await transaction(
        async (
          client
        ) => {

          await client.query(
            `
              INSERT INTO bookings (
                id,
                token,
                farmer_id,
                center_id,
                crop,
                estimated_quantity,
                actual_quantity,
                date,
                slot_start,
                slot_end,
                status,
                quality
              )
              VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                NULL,
                $7,
                $8,
                $9,
                'CONFIRMED',
                NULL
              )
            `,
            [

              id,

              token,

              farmer.id,

              centerId,

              crop,

              estimatedQuantity,

              date,

              slotStart,

              slotEnd,

            ]
          );


          await client.query(
            `
              INSERT INTO status_events (
                booking_id,
                status
              )
              VALUES (
                $1,
                'CONFIRMED'
              )
            `,
            [
              id,
            ]
          );

        }
      );


      console.log(
        "BOOKING DATABASE INSERTED:",
        id
      );


      const settingsAfterInsert =
        await getSettings();


      const shouldSendBookingSms =
        settingsAfterInsert.bookingConfirmationSms !==
          false &&
        settingsAfterInsert.smsEnabled ===
          true &&
        SMS_ENABLED ===
          true &&
        Boolean(
          farmer.phone
        );


      console.log(
        "BOOKING SMS CHECK:",
        {

          bookingId:
            id,

          farmerId:
            farmer.id,

          phone:
            farmer.phone,

          bookingConfirmationSms:
            settingsAfterInsert.bookingConfirmationSms,

          smsEnabled:
            settingsAfterInsert.smsEnabled,

          SMS_ENABLED,

          shouldSendSms:
            shouldSendBookingSms,

        }
      );


      const notification =
        await createNotification({

          farmerId:
            farmer.id,

          bookingId:
            id,

          type:
            "BOOKING_CONFIRMED",

          title:
            "Booking confirmed",

          message:
            `Your KrishiSetu booking ${token} is confirmed for ${date} from ${slotStart} to ${slotEnd}.`,

          sms:
            shouldSendBookingSms,

          phone:
            farmer.phone,

        });


      const created = await get(
  `
    SELECT
      *
    FROM bookings
    WHERE id = $1
    LIMIT 1
  `,
  [id]
);

      console.log(
        "BOOKING NOTIFICATION RESULT:",
        notification
      );


      return res
        .status(201)
        .json({

          success:
            true,

          booking:
            created,

          smsStatus:
            notification.status,

          notificationId:
            notification.id,

        });

    } catch (
      error
    ) {

      console.error(
        "Create booking error:",
        error
      );


      if (
        error?.code ===
        "23505"
      ) {

        return res
          .status(409)
          .json({

            success:
              false,

            message:
              "This booking or token already exists.",

          });

      }


      return res
        .status(500)
        .json({

          success:
            false,

          message:
            "Failed to create booking.",

        });

    }

  }
);


/* =========================================================
   BOOKING DETAILS
========================================================= */

app.get(
  "/api/bookings/:id",
  async (
    req,
    res
  ) => {

    try {

      const booking =
        await getBookingById(
          req.params.id
        );


      if (
        !booking
      ) {

        return res
          .status(404)
          .json({

            success:
              false,

            message:
              "Booking not found.",

          });

      }


      const statusEvents =
        await all(
          `
            SELECT
              id,
              booking_id,
              status,
              created_at
            FROM status_events
            WHERE booking_id = $1
            ORDER BY
              created_at ASC,
              id ASC
          `,
          [
            req.params.id,
          ]
        );


      res.json({

        success:
          true,

        booking,

        statusEvents,

      });

    } catch (
      error
    ) {

      console.error(
        "Get booking error:",
        error
      );


      res.status(500).json({

        success:
          false,

        message:
          "Failed to load booking.",

      });

    }

  }
);


/* =========================================================
   BOOKING LIFECYCLE HELPERS
========================================================= */

const FARMER_EDITABLE_BOOKING_STATUSES = new Set([
  "CONFIRMED",
  "LATE",
]);

const FARMER_CANCELLABLE_BOOKING_STATUSES = new Set([
  "CONFIRMED",
  "LATE",
]);


async function resolveRequesterFarmer(req) {
  const farmerIdCandidate =
    String(
      req.body?.farmerId ||
      req.body?.farmer?.id ||
      req.query?.farmerId ||
      req.headers?.["x-farmer-id"] ||
      ""
    ).trim();

  const phoneCandidate =
    normalisePhone(
      req.body?.phone ||
      req.body?.farmer?.phone ||
      req.query?.phone ||
      req.headers?.["x-farmer-phone"] ||
      ""
    );

  if (farmerIdCandidate) {
    const farmerById =
      await findFarmerById(
        farmerIdCandidate
      );

    if (farmerById) {
      return farmerById;
    }
  }

  if (phoneCandidate) {
    return await findFarmerByPhone(
      phoneCandidate
    );
  }

  return null;
}


function bookingBelongsToFarmer(
  booking,
  farmer
) {
  if (
    !booking ||
    !farmer
  ) {
    return false;
  }

  return (
    String(
      booking.farmer_id ||
      ""
    ) ===
    String(
      farmer.id ||
      ""
    )
  );
}


function parseBookingTimeMinutes(
  value
) {
  const text =
    String(
      value ||
      ""
    ).trim().toLowerCase();

  if (!text) {
    return null;
  }

  const amPmMatch =
    text.match(
      /^(\d{1,2})(?::?(\d{2}))?(?::?(\d{2}))?\s*(am|pm)$/i
    );

  if (amPmMatch) {
    let hour =
      Number(
        amPmMatch[1]
      );

    const minute =
      Number(
        amPmMatch[2] ||
        0
      );

    const second =
      Number(
        amPmMatch[3] ||
        0
      );

    if (
      !Number.isInteger(hour) ||
      !Number.isInteger(minute) ||
      !Number.isInteger(second) ||
      hour < 1 ||
      hour > 12 ||
      minute < 0 ||
      minute > 59 ||
      second < 0 ||
      second > 59
    ) {
      return null;
    }

    if (
      amPmMatch[4].toLowerCase() ===
      "pm" &&
      hour !== 12
    ) {
      hour += 12;
    }

    if (
      amPmMatch[4].toLowerCase() ===
      "am" &&
      hour === 12
    ) {
      hour = 0;
    }

    if (second !== 0) {
      return null;
    }

    return (
      hour * 60 +
      minute
    );
  }

  const colonMatch =
    text.match(
      /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/
    );

  if (colonMatch) {
    const hour =
      Number(
        colonMatch[1]
      );

    const minute =
      Number(
        colonMatch[2]
      );

    const second =
      Number(
        colonMatch[3] ||
        0
      );

    if (
      !Number.isInteger(hour) ||
      !Number.isInteger(minute) ||
      !Number.isInteger(second) ||
      hour < 0 ||
      hour > 23 ||
      minute < 0 ||
      minute > 59 ||
      second < 0 ||
      second > 59 ||
      second !== 0
    ) {
      return null;
    }

    return (
      hour * 60 +
      minute
    );
  }

  const compactMatch =
    text.match(
      /^(\d{1,4})$/
    );

  if (!compactMatch) {
    return null;
  }

  const compact =
    compactMatch[1];

  let hour;
  let minute;

  if (compact.length >= 3) {
    hour =
      Number(
        compact.slice(
          0,
          -2
        )
      );

    minute =
      Number(
        compact.slice(-2)
      );
  } else {
    hour =
      Number(
        compact
      );

    minute = 0;
  }

  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  return (
    hour * 60 +
    minute
  );
}


function normalizeBookingTime(
  value
) {
  const minutes =
    parseBookingTimeMinutes(
      value
    );

  if (
    minutes === null
  ) {
    return null;
  }

  const hours =
    Math.floor(
      minutes / 60
    );

  const minute =
    minutes % 60;

  return (
    `${String(
      hours
    ).padStart(
      2,
      "0"
    )}:${String(
      minute
    ).padStart(
      2,
      "0"
    )}`
  );
}


function normalizeBookingDate(
  value
) {
  const text =
    String(
      value ||
      ""
    ).trim();

  const match =
    text.match(
      /^(\d{4})-(\d{1,2})-(\d{1,2})(?:T.*)?$/
    );

  if (!match) {
    return null;
  }

  const year =
    Number(
      match[1]
    );

  const month =
    Number(
      match[2]
    );

  const day =
    Number(
      match[3]
    );

  const date =
    new Date(
      year,
      month - 1,
      day
    );

  if (
    date.getFullYear() !==
      year ||
    date.getMonth() !==
      month - 1 ||
    date.getDate() !==
      day
  ) {
    return null;
  }

  return (
    `${year}-${String(
      month
    ).padStart(
      2,
      "0"
    )}-${String(
      day
    ).padStart(
      2,
      "0"
    )}`
  );
}


function getServerTodayDate() {
  const now =
    new Date();

  return (
    `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(
      2,
      "0"
    )}-${String(
      now.getDate()
    ).padStart(
      2,
      "0"
    )}`
  );
}


function getServerDateAfterDays(
  days
) {
  const date =
    new Date();

  date.setHours(
    0,
    0,
    0,
    0
  );

  date.setDate(
    date.getDate() +
    Number(
      days ||
      0
    )
  );

  return (
    `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    )}-${String(
      date.getDate()
    ).padStart(
      2,
      "0"
    )}`
  );
}


function validateEditableBookingSlot({
  center,
  date,
  slotStart,
  slotEnd,
  settings,
}) {
  if (!center) {
    return "Procurement center not found.";
  }

  const normalizedDate =
    normalizeBookingDate(
      date
    );

  if (!normalizedDate) {
    return "A valid arrival date is required.";
  }

  const today =
    getServerTodayDate();

  const maximumDate =
    getServerDateAfterDays(
      Number(
        settings?.advanceBookingDays ||
        0
      )
    );

  if (
    normalizedDate <
    today
  ) {
    return "The arrival date cannot be in the past.";
  }

  if (
    normalizedDate >
    maximumDate
  ) {
    return `Bookings can only be scheduled up to ${settings.advanceBookingDays} days in advance.`;
  }

  const startMinutes =
    parseBookingTimeMinutes(
      slotStart
    );

  const endMinutes =
    parseBookingTimeMinutes(
      slotEnd
    );

  if (
    startMinutes === null ||
    endMinutes === null ||
    endMinutes <= startMinutes
  ) {
    return "A valid arrival time window is required.";
  }

  const openingMinutes =
    parseBookingTimeMinutes(
      center.opening_time ||
      center.openingTime ||
      "09:00"
    );

  const closingMinutes =
    parseBookingTimeMinutes(
      center.closing_time ||
      center.closingTime ||
      "17:00"
    );

  if (
    openingMinutes === null ||
    closingMinutes === null ||
    closingMinutes <= openingMinutes
  ) {
    return "This procurement center has invalid opening hours.";
  }

  const slotDuration =
    Math.max(
      1,
      Number(
        settings?.slotDuration ||
        30
      )
    );

  const requestedDuration =
    endMinutes -
    startMinutes;

  if (
    requestedDuration !==
    slotDuration
  ) {
    return `Arrival windows must be exactly ${slotDuration} minutes long.`;
  }

  if (
    startMinutes <
    openingMinutes
  ) {
    return "The selected arrival time is before this center opens.";
  }

  if (
    endMinutes >
    closingMinutes
  ) {
    return "The selected arrival time is after this center closes.";
  }

  if (
    (startMinutes -
      openingMinutes) %
      slotDuration !==
    0
  ) {
    return `The selected arrival time must align with this center's ${slotDuration}-minute booking slots.`;
  }

  return null;
}


async function getBookingSlotConflictCount({
  centerId,
  date,
  slotStart,
  slotEnd,
  excludeBookingId = null,
}) {
  const params = [
    centerId,
    date,
    slotStart,
    slotEnd,
  ];

  let sql = `
    SELECT COUNT(*)::int AS count
    FROM bookings
    WHERE
      center_id = $1
      AND date = $2
      AND slot_start = $3
      AND slot_end = $4
      AND status NOT IN (
        'PAYMENT_SENT',
        'CANCELLED',
        'REJECTED',
        'EXPIRED'
      )
  `;

  if (
    excludeBookingId
  ) {
    sql +=
      " AND id != $5";

    params.push(
      excludeBookingId
    );
  }

  const result =
    await query(
      sql,
      params
    );

  return Number(
    result?.rows?.[0]?.count ||
    0
  );
}


async function recordBookingChange({
  bookingId,
  farmerId,
  changeType,
  reason,
  before,
  after,
  client = null,
}) {
  const executor =
    client ||
    {
      query,
    };

  await executor.query(
    `
      INSERT INTO booking_changes (
        booking_id,
        farmer_id,
        change_type,
        reason,
        before_json,
        after_json
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6
      )
    `,
    [
      bookingId,
      farmerId,
      changeType,
      reason ||
        null,
      JSON.stringify(
        before ||
        {}
      ),
      JSON.stringify(
        after ||
        {}
      ),
    ]
  );
}


/* =========================================================
   CANCEL BOOKING
========================================================= */

app.patch(
  "/api/bookings/:id/cancel",
  async (
    req,
    res
  ) => {
    try {
      const bookingId =
        String(
          req.params.id ||
          ""
        ).trim();

      if (!bookingId) {
        return res.status(400).json({
          success: false,
          message: "Booking id is required.",
        });
      }

      const booking =
        await getBookingById(
          bookingId
        );

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found.",
        });
      }

      const farmer =
        await resolveRequesterFarmer(
          req
        );

      if (
        !bookingBelongsToFarmer(
          booking,
          farmer
        )
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You are not authorised to change this booking.",
        });
      }

      const currentStatus =
        String(
          booking.status ||
          "CONFIRMED"
        )
          .trim()
          .toUpperCase();

      if (
        currentStatus ===
        "CANCELLED"
      ) {
        return res.json({
          success: true,
          alreadyCancelled: true,
          message:
            "This booking is already cancelled.",
          booking,
        });
      }

      if (
        !FARMER_CANCELLABLE_BOOKING_STATUSES.has(
          currentStatus
        )
      ) {
        return res.status(409).json({
          success: false,
          code: "BOOKING_LOCKED",
          message:
            `This booking can no longer be cancelled because it is already ${currentStatus.toLowerCase().replace(/_/g, " ")}.`,
          booking,
        });
      }

      const reason =
        String(
          req.body?.reason ||
          "Farmer requested cancellation."
        )
          .trim()
          .slice(
            0,
            500
          );

      const before = {
        id:
          booking.id,
        token:
          booking.token,
        crop:
          booking.crop,
        estimated_quantity:
          booking.estimated_quantity,
        center_id:
          booking.center_id,
        date:
          booking.date,
        slot_start:
          booking.slot_start,
        slot_end:
          booking.slot_end,
        status:
          currentStatus,
      };

      const after = {
        ...before,
        status:
          "CANCELLED",
      };

      await transaction(
        async (
          client
        ) => {
          await client.query(
            `
              UPDATE bookings
              SET status = 'CANCELLED'
              WHERE id = $1
            `,
            [
              bookingId,
            ]
          );

          await client.query(
            `
              INSERT INTO status_events (
                booking_id,
                status
              )
              VALUES (
                $1,
                'CANCELLED'
              )
            `,
            [
              bookingId,
            ]
          );

          await recordBookingChange({
            bookingId,
            farmerId:
              farmer.id,
            changeType:
              "CANCEL",
            reason,
            before,
            after,
            client,
          });
        }
      );

      const settings =
        await getSettings();

      const shouldSendSms =
        settings.smsEnabled ===
          true &&
        settings.bookingConfirmationSms !==
          false &&
        SMS_ENABLED ===
          true &&
        Boolean(
          booking.farmer_phone
        );

      const notification =
        await createNotification({
          farmerId:
            booking.farmer_id,
          bookingId,
          type:
            "CANCELLED",
          title:
            getNotificationTitle(
              "CANCELLED"
            ),
          message:
            getStatusSms(
              booking.token,
              "CANCELLED"
            ),
          sms:
            shouldSendSms,
          phone:
            booking.farmer_phone,
        });

      return res.json({
        success: true,
        message:
          "Booking cancelled successfully.",
        booking:
          await getBookingById(
            bookingId
          ),
        smsStatus:
          notification.status,
        notificationId:
          notification.id,
      });
    } catch (error) {
      console.error(
        "Cancel booking error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to cancel booking.",
      });
    }
  }
);


/* =========================================================
   RESCHEDULE / EDIT BOOKING
========================================================= */

app.patch(
  "/api/bookings/:id/reschedule",
  async (
    req,
    res
  ) => {
    try {
      const bookingId =
        String(
          req.params.id ||
          ""
        ).trim();

      if (!bookingId) {
        return res.status(400).json({
          success: false,
          message: "Booking id is required.",
        });
      }

      const booking =
        await getBookingById(
          bookingId
        );

      if (!booking) {
        return res.status(404).json({
          success: false,
          message:
            "Booking not found.",
        });
      }

      const farmer =
        await resolveRequesterFarmer(
          req
        );

      if (
        !bookingBelongsToFarmer(
          booking,
          farmer
        )
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You are not authorised to change this booking.",
        });
      }

      const currentStatus =
        String(
          booking.status ||
          "CONFIRMED"
        )
          .trim()
          .toUpperCase();

      if (
        !FARMER_EDITABLE_BOOKING_STATUSES.has(
          currentStatus
        )
      ) {
        return res.status(409).json({
          success: false,
          code: "BOOKING_LOCKED",
          message:
            `This booking can no longer be edited because it is already ${currentStatus.toLowerCase().replace(/_/g, " ")}.`,
          booking,
        });
      }

      const settings =
        await getSettings();

      if (
        settings.bookingEnabled ===
        false
      ) {
        return res.status(503).json({
          success: false,
          code:
            "BOOKING_DISABLED",
          message:
            "Booking changes are temporarily disabled.",
        });
      }

      if (
        settings.maintenanceMode ===
        true
      ) {
        return res.status(503).json({
          success: false,
          code:
            "MAINTENANCE_MODE",
          message:
            "KrishiSetu is currently under maintenance.",
        });
      }

      const centerId =
        String(
          req.body?.centerId ??
          booking.center_id ??
          ""
        ).trim();

      const crop =
        String(
          req.body?.crop ??
          booking.crop ??
          ""
        ).trim();

      const estimatedQuantity =
        Number(
          req.body?.estimatedQuantity ??
          booking.estimated_quantity ??
          0
        );

      const date =
        normalizeBookingDate(
          req.body?.date ??
          booking.date
        );

      const slotStart =
        normalizeBookingTime(
          req.body?.slotStart ??
          booking.slot_start
        );

      const slotEnd =
        normalizeBookingTime(
          req.body?.slotEnd ??
          booking.slot_end
        );

      const reason =
        String(
          req.body?.reason ||
          "Farmer updated booking."
        )
          .trim()
          .slice(
            0,
            500
          );

      if (!crop) {
        return res.status(400).json({
          success: false,
          message:
            "Crop is required.",
        });
      }

      if (
        !Number.isFinite(
          estimatedQuantity
        ) ||
        estimatedQuantity <=
          0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Estimated quantity must be greater than zero.",
        });
      }

      const maxQuantity =
        Number(
          settings.maxQuantity ||
          5000
        );

      if (
        estimatedQuantity >
        maxQuantity
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Quantity cannot exceed ${maxQuantity.toLocaleString()} kg.`,
        });
      }

      const center =
        await get(
          `
            SELECT *
            FROM centers
            WHERE id = $1
          `,
          [
            centerId,
          ]
        );

      if (!center) {
        return res.status(404).json({
          success: false,
          message:
            "Procurement center not found.",
        });
      }

      if (
        center.active !==
          undefined &&
        center.active !==
          null &&
        Number(
          center.active
        ) === 0
      ) {
        return res.status(409).json({
          success: false,
          message:
            "This procurement center is currently inactive.",
        });
      }

      const validationError =
        validateEditableBookingSlot({
          center,
          date,
          slotStart,
          slotEnd,
          settings,
        });

      if (validationError) {
        return res.status(400).json({
          success: false,
          message:
            validationError,
        });
      }

      const capacity =
        Number(
          center.capacity ||
          settings.defaultCapacity ||
          20
        );

      if (
        !Number.isFinite(
          capacity
        ) ||
        capacity <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid slot capacity.",
        });
      }

      const conflictCount =
        await getBookingSlotConflictCount({
          centerId,
          date,
          slotStart,
          slotEnd,
          excludeBookingId:
            bookingId,
        });

      if (
        conflictCount >=
        capacity
      ) {
        return res.status(409).json({
          success: false,
          code:
            "SLOT_FULL",
          message:
            "This arrival window is full. Please choose another slot.",
        });
      }

      const before = {
        id:
          booking.id,
        token:
          booking.token,
        crop:
          booking.crop,
        estimated_quantity:
          booking.estimated_quantity,
        center_id:
          booking.center_id,
        date:
          booking.date,
        slot_start:
          booking.slot_start,
        slot_end:
          booking.slot_end,
        status:
          currentStatus,
      };

      const after = {
        ...before,
        crop,
        estimated_quantity:
          estimatedQuantity,
        center_id:
          centerId,
        date,
        slot_start:
          slotStart,
        slot_end:
          slotEnd,
        status:
          "CONFIRMED",
      };

      await transaction(
        async (
          client
        ) => {
          await client.query(
            `
              UPDATE bookings
              SET
                crop = $1,
                estimated_quantity = $2,
                center_id = $3,
                date = $4,
                slot_start = $5,
                slot_end = $6,
                status = 'CONFIRMED'
              WHERE id = $7
            `,
            [
              crop,
              estimatedQuantity,
              centerId,
              date,
              slotStart,
              slotEnd,
              bookingId,
            ]
          );

          if (
            currentStatus !==
            "CONFIRMED"
          ) {
            await client.query(
              `
                INSERT INTO status_events (
                  booking_id,
                  status
                )
                VALUES (
                  $1,
                  'CONFIRMED'
                )
              `,
              [
                bookingId,
              ]
            );
          }

          await recordBookingChange({
            bookingId,
            farmerId:
              farmer.id,
            changeType:
              "EDIT",
            reason,
            before,
            after,
            client,
          });
        }
      );

      const updatedBooking =
        await getBookingById(
          bookingId
        );

      const notification =
        await createNotification({
          farmerId:
            booking.farmer_id,
          bookingId,
          type:
            "BOOKING_UPDATED",
          title:
            getNotificationTitle(
              "BOOKING_UPDATED"
            ),
          message:
            `Your KrishiSetu booking ${updatedBooking.token} was updated to ${updatedBooking.date}, ${updatedBooking.slot_start} to ${updatedBooking.slot_end}.`,
          sms:
            settings.smsEnabled ===
              true &&
            settings.bookingConfirmationSms !==
              false &&
            SMS_ENABLED ===
              true &&
            Boolean(
              booking.farmer_phone
            ),
          phone:
            booking.farmer_phone,
        });

      return res.json({
        success: true,
        message:
          "Booking updated successfully.",
        booking:
          updatedBooking,
        smsStatus:
          notification.status,
        notificationId:
          notification.id,
      });
    } catch (error) {
      console.error(
        "Reschedule booking error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update booking.",
      });
    }
  }
);


/* =========================================================
   BOOKING CHANGES / AUDIT
========================================================= */

app.get(
  "/api/bookings/:id/changes",
  async (
    req,
    res
  ) => {
    try {
      const bookingId =
        String(
          req.params.id ||
          ""
        ).trim();

      if (!bookingId) {
        return res.status(400).json({
          success: false,
          message:
            "Booking id is required.",
        });
      }

      const booking =
        await get(
          `
            SELECT
              id,
              farmer_id
            FROM bookings
            WHERE id = $1
          `,
          [
            bookingId,
          ]
        );

      if (!booking) {
        return res.status(404).json({
          success: false,
          message:
            "Booking not found.",
        });
      }

      const farmer =
        await resolveRequesterFarmer(
          req
        );

      if (
        !bookingBelongsToFarmer(
          booking,
          farmer
        )
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You are not authorised to view these changes.",
        });
      }

      const changes =
        await all(
          `
            SELECT
              id,
              booking_id,
              farmer_id,
              change_type,
              reason,
              before_json,
              after_json,
              created_at
            FROM booking_changes
            WHERE booking_id = $1
            ORDER BY
              created_at DESC,
              id DESC
          `,
          [
            bookingId,
          ]
        );

      return res.json({
        success: true,
        changes,
      });
    } catch (error) {
      console.error(
        "Booking changes error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load booking changes.",
      });
    }
  }
);


/* =========================================================
   BOOKING STATUS
========================================================= */

app.patch(
  "/api/bookings/:id/status",
  async (
    req,
    res
  ) => {

    try {

      const bookingId =
        String(
          req.params.id ||
          ""
        ).trim();


      const nextStatus =
        String(
          req.body?.status ||
          ""
        ).trim();


      if (
        !isValidStatus(
          nextStatus
        )
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            message:
              "Invalid booking status.",

          });

      }


      const booking =
        await get(
          `
            SELECT
              b.*,
              f.phone AS farmer_phone
            FROM bookings b
            LEFT JOIN farmers f
              ON f.id = b.farmer_id
            WHERE b.id = $1
          `,
          [
            bookingId,
          ]
        );


      if (
        !booking
      ) {

        return res
          .status(404)
          .json({

            success:
              false,

            message:
              "Booking not found.",

          });

      }


      const currentStatus =
        booking.status ||
        "CONFIRMED";


      if (
        currentStatus ===
        nextStatus
      ) {

        return res.json({

          success:
            true,

          message:
            "Booking is already in this status.",

          booking:
            await getBookingById(
              bookingId
            ),

          smsStatus:
            "NOT_SENT",

        });

      }


      const allowed =
        getAllowedNextStatuses(
          currentStatus
        );


      if (
        !allowed.includes(
          nextStatus
        )
      ) {

        return res
          .status(409)
          .json({

            success:
              false,

            message:
              `Cannot move booking from ${currentStatus} to ${nextStatus}.`,

          });

      }


      if (
        [
          "PAYMENT_PENDING",
          "PAYMENT_SENT",
        ].includes(
          nextStatus
        )
      ) {

        return res
          .status(409)
          .json({

            success:
              false,

            message:
              "Use the payment workflow to update payment status.",

          });

      }


      await transaction(
        async (
          client
        ) => {

          await client.query(
            `
              UPDATE bookings
              SET status = $1
              WHERE id = $2
            `,
            [

              nextStatus,

              bookingId,

            ]
          );


          await client.query(
            `
              INSERT INTO status_events (
                booking_id,
                status
              )
              VALUES ($1, $2)
            `,
            [

              bookingId,

              nextStatus,

            ]
          );

        }
      );


      const settings =
        await getSettings();


      const shouldSendSms =
        settings.smsEnabled ===
          true &&
        SMS_ENABLED ===
          true &&
        Boolean(
          booking.farmer_phone
        );


      const notification =
        await createNotification({

          farmerId:
            booking.farmer_id,

          bookingId:
            bookingId,

          type:
            nextStatus,

          title:
            getNotificationTitle(
              nextStatus
            ),

          message:
            getStatusSms(
              booking.token,
              nextStatus
            ) ||
            `Booking ${booking.token} status updated.`,

          sms:
            shouldSendSms,

          phone:
            booking.farmer_phone,

        });


      res.json({

        success:
          true,

        message:
          "Booking status updated.",

        booking:
          await getBookingById(
            bookingId
          ),

        smsStatus:
          notification.status,

        notificationId:
          notification.id,

      });

    } catch (
      error
    ) {

      console.error(
        "Update status error:",
        error
      );


      res.status(500).json({

        success:
          false,

        message:
          "Failed to update status.",

      });

    }

  }
);


/* =========================================================
   WEIGHING
========================================================= */

app.patch(
  "/api/bookings/:id/weigh",
  async (
    req,
    res
  ) => {

    try {

      const actualQuantity =
        Number(
          req.body?.actualQuantity
        );


      const quality =
        req.body?.quality ||
        null;


      const notes =
        String(
          req.body?.notes ||
          ""
        ).trim();


      if (
        !Number.isFinite(
          actualQuantity
        ) ||
        actualQuantity <=
        0
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            message:
              "Valid actual quantity is required.",

          });

      }


      const booking =
        await get(
          `
            SELECT
              b.*,
              f.phone AS farmer_phone
            FROM bookings b
            LEFT JOIN farmers f
              ON f.id = b.farmer_id
            WHERE b.id = $1
          `,
          [
            req.params.id,
          ]
        );


      if (
        !booking
      ) {

        return res
          .status(404)
          .json({

            success:
              false,

            message:
              "Booking not found.",

          });

      }


      if (
        [
          "PROCURED",
          "PAYMENT_PENDING",
          "PAYMENT_SENT",
        ].includes(
          booking.status
        )
      ) {

        return res
          .status(409)
          .json({

            success:
              false,

            message:
              "This booking has already completed procurement.",

          });

      }


      await transaction(
        async (
          client
        ) => {

          await client.query(
            `
              UPDATE bookings
              SET
                actual_quantity = $1,
                quality = $2,
                status = 'WEIGHING'
              WHERE id = $3
            `,
            [

              actualQuantity,

              quality,

              req.params.id,

            ]
          );


          await client.query(
            `
              INSERT INTO status_events (
                booking_id,
                status
              )
              VALUES (
                $1,
                'WEIGHING'
              )
            `,
            [
              req.params.id,
            ]
          );

        }
      );


      const settings =
        await getSettings();


      const shouldSendSms =
        settings.smsEnabled ===
          true &&
        SMS_ENABLED ===
          true &&
        Boolean(
          booking.farmer_phone
        );


      const notification =
        await createNotification({

          farmerId:
            booking.farmer_id,

          bookingId:
            req.params.id,

          type:
            "WEIGHING",

          title:
            "Weighing started",

          message:
            `KrishiSetu update: token ${booking.token} is now being weighed.`,

          sms:
            shouldSendSms,

          phone:
            booking.farmer_phone,

        });


      res.json({

        success:
          true,

        message:
          "Weight recorded.",

        booking:
          await getBookingById(
            req.params.id
          ),

        notes,

        smsStatus:
          notification.status,

        notificationId:
          notification.id,

      });

    } catch (
      error
    ) {

      console.error(
        "Weighing error:",
        error
      );


      res.status(500).json({

        success:
          false,

        message:
          "Failed to record weighing.",

      });

    }

  }
);


/* =========================================================
   PROCUREMENT
========================================================= */

app.patch(
  "/api/bookings/:id/procure",
  async (
    req,
    res
  ) => {

    try {

      const booking =
        await get(
          `
            SELECT
              b.*,
              f.phone AS farmer_phone
            FROM bookings b
            LEFT JOIN farmers f
              ON f.id = b.farmer_id
            WHERE b.id = $1
          `,
          [
            req.params.id,
          ]
        );


      if (
        !booking
      ) {

        return res
          .status(404)
          .json({

            success:
              false,

            message:
              "Booking not found.",

          });

      }


      if (
        booking.actual_quantity ===
          null ||
        booking.actual_quantity ===
          undefined ||
        Number(
          booking.actual_quantity
        ) <=
        0
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            message:
              "Actual quantity must be recorded before procurement.",

          });

      }


      if (
        [
          "PROCURED",
          "PAYMENT_PENDING",
          "PAYMENT_SENT",
        ].includes(
          booking.status
        )
      ) {

        return res
          .status(409)
          .json({

            success:
              false,

            message:
              "Procurement has already been completed.",

          });

      }


      const rate =
        Number(
          req.body?.rate
        );


      const adjustment =
        Number(
          req.body?.adjustment ||
          0
        );


      const notes =
        String(
          req.body?.notes ||
          ""
        ).trim();


      if (
        !Number.isFinite(
          rate
        ) ||
        rate <=
        0
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            message:
              "A valid procurement rate per kg is required.",

          });

      }


      if (
        !Number.isFinite(
          adjustment
        )
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            message:
              "Invalid adjustment amount.",

          });

      }


      const payableAmount =
        Number(
          booking.actual_quantity
        ) *
        rate +
        adjustment;


      if (
        payableAmount <=
        0
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            message:
              "Payable amount must be greater than zero.",

          });

      }


      await transaction(
        async (
          client
        ) => {

          await client.query(
            `
              UPDATE bookings
              SET status = 'PAYMENT_PENDING'
              WHERE id = $1
            `,
            [
              req.params.id,
            ]
          );


          await client.query(
            `
              INSERT INTO payments (
                booking_id,
                amount,
                method,
                reference,
                status,
                rate_per_kg,
                notes,
                updated_at,
                sms_status,
                sms_sent_at
              )
              VALUES (
                $1,
                $2,
                NULL,
                NULL,
                'PAYMENT_PENDING',
                $3,
                $4,
                CURRENT_TIMESTAMP,
                'NOT_SENT',
                NULL
              )
            `,
            [

              req.params.id,

              payableAmount,

              rate,

              notes ||
                `Procurement rate: ₹${rate}/kg. Adjustment: ₹${adjustment}.`,

            ]
          );


          await client.query(
            `
              INSERT INTO status_events (
                booking_id,
                status
              )
              VALUES (
                $1,
                'PROCURED'
              )
            `,
            [
              req.params.id,
            ]
          );


          await client.query(
            `
              INSERT INTO status_events (
                booking_id,
                status
              )
              VALUES (
                $1,
                'PAYMENT_PENDING'
              )
            `,
            [
              req.params.id,
            ]
          );

        }
      );


      const settings =
        await getSettings();


      const shouldSendSms =
        settings.procurementSms !==
          false &&
        settings.smsEnabled ===
          true &&
        SMS_ENABLED ===
          true &&
        Boolean(
          booking.farmer_phone
        );


      const notification =
        await createNotification({

          farmerId:
            booking.farmer_id,

          bookingId:
            req.params.id,

          type:
            "PROCUREMENT_COMPLETED",

          title:
            "Procurement completed",

          message:
            `Your KrishiSetu procurement for token ${booking.token} is complete. Payment of ₹${payableAmount} is now being processed.`,

          sms:
            shouldSendSms,

          phone:
            booking.farmer_phone,

        });


      res.json({

        success:
          true,

        message:
          "Procurement completed.",

        booking:
          await getBookingById(
            req.params.id
          ),

        smsStatus:
          notification.status,

        notificationId:
          notification.id,

      });

    } catch (
      error
    ) {

      console.error(
        "Complete procurement error:",
        error
      );


      res.status(500).json({

        success:
          false,

        message:
          "Failed to complete procurement.",

      });

    }

  }
);


/* =========================================================
   PAYMENT
========================================================= */

app.patch(
  "/api/bookings/:id/payment",
  async (
    req,
    res
  ) => {

    try {

      const amount =
        Number(
          req.body?.amount
        );


      const method =
        String(
          req.body?.method ||
          "UPI"
        ).trim();


      const reference =
        String(
          req.body?.reference ||
          ""
        ).trim();


      const notes =
        String(
          req.body?.notes ||
          ""
        ).trim();


      if (
        !Number.isFinite(
          amount
        ) ||
        amount <=
        0
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            message:
              "A valid payment amount is required.",

          });

      }


      if (
        !reference
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            message:
              "Payment reference is required.",

          });

      }


      const booking =
        await get(
          `
            SELECT
              b.*,
              f.name AS farmer_name,
              f.phone AS farmer_phone
            FROM bookings b
            LEFT JOIN farmers f
              ON f.id = b.farmer_id
            WHERE b.id = $1
          `,
          [
            req.params.id,
          ]
        );


      if (
        !booking
      ) {

        return res
          .status(404)
          .json({

            success:
              false,

            message:
              "Booking not found.",

          });

      }


      if (
        booking.status ===
        "PAYMENT_SENT"
      ) {

        return res
          .status(409)
          .json({

            success:
              false,

            message:
              "Payment has already been sent for this booking.",

          });

      }


      if (
        ![
          "PROCURED",
          "PAYMENT_PENDING",
        ].includes(
          booking.status
        )
      ) {

        return res
          .status(409)
          .json({

            success:
              false,

            message:
              "This booking is not ready for payment.",

          });

      }


      const existingPayment =
        await get(
          `
            SELECT *
            FROM payments
            WHERE booking_id = $1
            ORDER BY id DESC
            LIMIT 1
          `,
          [
            req.params.id,
          ]
        );


      if (
        existingPayment?.status ===
        "PAYMENT_SENT"
      ) {

        return res
          .status(409)
          .json({

            success:
              false,

            message:
              "A payment has already been recorded for this booking.",

          });

      }


      await transaction(
        async (
          client
        ) => {

          if (
            existingPayment
          ) {

            await client.query(
              `
                UPDATE payments
                SET
                  amount = $1,
                  method = $2,
                  reference = $3,
                  status = 'PAYMENT_SENT',
                  notes = $4,
                  updated_at = CURRENT_TIMESTAMP
                WHERE id = $5
              `,
              [

                amount,

                method,

                reference,

                notes ||
                  null,

                existingPayment.id,

              ]
            );

          } else {

            await client.query(
              `
                INSERT INTO payments (
                  booking_id,
                  amount,
                  method,
                  reference,
                  status,
                  rate_per_kg,
                  notes,
                  updated_at,
                  sms_status,
                  sms_sent_at
                )
                VALUES (
                  $1,
                  $2,
                  $3,
                  $4,
                  'PAYMENT_SENT',
                  NULL,
                  $5,
                  CURRENT_TIMESTAMP,
                  'NOT_SENT',
                  NULL
                )
              `,
              [

                req.params.id,

                amount,

                method,

                reference,

                notes ||
                  null,

              ]
            );

          }


          await client.query(
            `
              UPDATE bookings
              SET status = 'PAYMENT_SENT'
              WHERE id = $1
            `,
            [
              req.params.id,
            ]
          );


          await client.query(
            `
              INSERT INTO status_events (
                booking_id,
                status
              )
              VALUES (
                $1,
                'PAYMENT_SENT'
              )
            `,
            [
              req.params.id,
            ]
          );

        }
      );


      const settings =
        await getSettings();


      const shouldSendSms =
        settings.paymentSms !==
          false &&
        settings.smsEnabled ===
          true &&
        SMS_ENABLED ===
          true &&
        Boolean(
          booking.farmer_phone
        );


      const paymentMessage =
        `KrishiSetu payment of ₹${amount} for token ${booking.token} has been sent. Reference: ${reference}.`;


      const notification =
        await createNotification({

          farmerId:
            booking.farmer_id,

          bookingId:
            req.params.id,

          type:
            "PAYMENT_SENT",

          title:
            "Payment sent",

          message:
            paymentMessage,

          sms:
            shouldSendSms,

          phone:
            booking.farmer_phone,

        });


      const savedPaymentBeforeSmsUpdate =
        await get(
          `
            SELECT *
            FROM payments
            WHERE booking_id = $1
            ORDER BY id DESC
            LIMIT 1
          `,
          [
            req.params.id,
          ]
        );


      if (
        savedPaymentBeforeSmsUpdate
      ) {

        await query(
          `
            UPDATE payments
            SET
              sms_status = $1,
              sms_sent_at = $2,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
          `,
          [

            notification.status,

            notification.sentAt,

            savedPaymentBeforeSmsUpdate.id,

          ]
        );

      }


      const savedPayment =
        await get(
          `
            SELECT *
            FROM payments
            WHERE booking_id = $1
            ORDER BY id DESC
            LIMIT 1
          `,
          [
            req.params.id,
          ]
        );


      res.json({

        success:
          true,

        message:
          "Payment recorded.",

        payment:
          savedPayment,

        smsStatus:
          notification.status,

        smsSentAt:
          notification.sentAt,

        notificationId:
          notification.id,

      });

    } catch (
      error
    ) {

      console.error(
        "Payment error:",
        error
      );


      res.status(500).json({

        success:
          false,

        message:
          "Failed to record payment.",

      });

    }

  }
);


/* =========================================================
   PAYMENT HISTORY
========================================================= */

app.get(
  "/api/bookings/:id/payments",
  async (
    req,
    res
  ) => {

    try {

      const booking =
        await get(
          `
            SELECT id
            FROM bookings
            WHERE id = $1
          `,
          [
            req.params.id,
          ]
        );


      if (
        !booking
      ) {

        return res
          .status(404)
          .json({

            success:
              false,

            message:
              "Booking not found.",

          });

      }


      const payments =
        await all(
          `
            SELECT *
            FROM payments
            WHERE booking_id = $1
            ORDER BY id DESC
          `,
          [
            req.params.id,
          ]
        );


      res.json({

        success:
          true,

        payments,

      });

    } catch (
      error
    ) {

      console.error(
        "Payment history error:",
        error
      );


      res.status(500).json({

        success:
          false,

        message:
          "Failed to load payment history.",

      });

    }

  }
);


/* =========================================================
   STATUS HISTORY
========================================================= */

app.get(
  "/api/bookings/:id/status-history",
  async (
    req,
    res
  ) => {

    try {

      const booking =
        await get(
          `
            SELECT id
            FROM bookings
            WHERE id = $1
          `,
          [
            req.params.id,
          ]
        );


      if (
        !booking
      ) {

        return res
          .status(404)
          .json({

            success:
              false,

            message:
              "Booking not found.",

          });

      }


      const events =
        await all(
          `
            SELECT
              id,
              booking_id,
              status,
              created_at
            FROM status_events
            WHERE booking_id = $1
            ORDER BY
              created_at ASC,
              id ASC
          `,
          [
            req.params.id,
          ]
        );


      res.json({

        success:
          true,

        events,

      });

    } catch (
      error
    ) {

      console.error(
        "Status history error:",
        error
      );


      res.status(500).json({

        success:
          false,

        message:
          "Failed to load status history.",

      });

    }

  }
);


/* =========================================================
   PAYMENT ISSUES
========================================================= */

app.post(
  "/api/payment-issues",
  async (
    req,
    res
  ) => {

    try {

      const farmerId =
        String(
          req.body?.farmerId ||
          ""
        ).trim();


      const bookingId =
        String(
          req.body?.bookingId ||
          ""
        ).trim();


      const message =
        String(
          req.body?.message ||
          ""
        ).trim();


      if (
        !farmerId ||
        !bookingId ||
        !message
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            message:
              "Farmer, booking and issue description are required.",

          });

      }


      if (
        message.length >
        1000
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            message:
              "Payment issue description is too long.",

          });

      }


      const farmer =
        await resolveFarmer({

          farmerId,

          phone:
            req.body?.phone ||
            "",

        });


      if (
        !farmer
      ) {

        return res
          .status(404)
          .json({

            success:
              false,

            message:
              "Farmer account not found.",

          });

      }


      const booking =
        await get(
          `
            SELECT
              id,
              farmer_id,
              token,
              status
            FROM bookings
            WHERE id = $1
          `,
          [
            bookingId,
          ]
        );


      if (
        !booking
      ) {

        return res
          .status(404)
          .json({

            success:
              false,

            message:
              "Booking not found.",

          });

      }


      if (
        String(
          booking.farmer_id
        ) !==
        String(
          farmer.id
        )
      ) {

        return res
          .status(403)
          .json({

            success:
              false,

            message:
              "This booking does not belong to the farmer.",

          });

      }


      const issue =
        await get(
          `
            INSERT INTO payment_issues (
              farmer_id,
              booking_id,
              message,
              status
            )
            VALUES (
              $1,
              $2,
              $3,
              'OPEN'
            )
            RETURNING
              id,
              farmer_id,
              booking_id,
              message,
              status
          `,
          [

            farmer.id,

            bookingId,

            message,

          ]
        );


      res.status(201).json({

        success:
          true,

        message:
          "Payment issue reported successfully.",

        issue: {

          id:
            issue.id,

          farmerId:
            issue.farmer_id,

          bookingId:
            issue.booking_id,

          status:
            issue.status,

        },

      });

    } catch (
      error
    ) {

      console.error(
        "Payment issue error:",
        error
      );


      res.status(500).json({

        success:
          false,

        message:
          "Failed to report payment issue.",

      });

    }

  }
);


/* =========================================================
   PAYMENT ISSUES - LIST
========================================================= */

app.get(
  "/api/payment-issues",
  async (
    req,
    res
  ) => {

    try {

      const issues =
        await all(
          `
            SELECT
              pi.id,
              pi.farmer_id,
              pi.booking_id,
              pi.message,
              pi.status,
              pi.created_at,

              b.token,
              b.status AS booking_status,

              p.amount AS payment_amount,
              p.reference AS payment_reference,

              f.name AS farmer_name,
              f.phone AS farmer_phone

            FROM payment_issues pi

            LEFT JOIN bookings b
              ON b.id = pi.booking_id

            LEFT JOIN farmers f
              ON f.id = pi.farmer_id

            LEFT JOIN payments p
              ON p.id = (
                SELECT MAX(p2.id)
                FROM payments p2
                WHERE p2.booking_id = pi.booking_id
              )

            ORDER BY
              CASE
                WHEN pi.status = 'OPEN'
                THEN 0
                ELSE 1
              END,

              pi.created_at DESC,

              pi.id DESC
          `
        );


      res.json({

        success:
          true,

        issues,

      });

    } catch (
      error
    ) {

      console.error(
        "Get payment issues error:",
        error
      );


      res.status(500).json({

        success:
          false,

        message:
          "Failed to load payment issues.",

      });

    }

  }
);


/* =========================================================
   PAYMENT ISSUE UPDATE
========================================================= */

app.patch(
  "/api/payment-issues/:id",
  async (
    req,
    res
  ) => {

    try {

      const issueId =
        Number(
          req.params.id
        );


      const status =
        String(
          req.body?.status ||
          ""
        )
          .trim()
          .toUpperCase();


      if (
        !Number.isInteger(
          issueId
        )
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            message:
              "Invalid payment issue id.",

          });

      }


      if (
        ![
          "OPEN",
          "RESOLVED",
        ].includes(
          status
        )
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            message:
              "Payment issue status must be OPEN or RESOLVED.",

          });

      }


      const issue =
        await get(
          `
            SELECT *
            FROM payment_issues
            WHERE id = $1
          `,
          [
            issueId,
          ]
        );


      if (
        !issue
      ) {

        return res
          .status(404)
          .json({

            success:
              false,

            message:
              "Payment issue not found.",

          });

      }


      await query(
        `
          UPDATE payment_issues
          SET status = $1
          WHERE id = $2
        `,
        [

          status,

          issueId,

        ]
      );


      const updated =
        await get(
          `
            SELECT
              pi.id,
              pi.farmer_id,
              pi.booking_id,
              pi.message,
              pi.status,
              pi.created_at,

              b.token,
              b.status AS booking_status,

              p.amount AS payment_amount,
              p.reference AS payment_reference,

              f.name AS farmer_name,
              f.phone AS farmer_phone

            FROM payment_issues pi

            LEFT JOIN bookings b
              ON b.id = pi.booking_id

            LEFT JOIN farmers f
              ON f.id = pi.farmer_id

            LEFT JOIN payments p
              ON p.id = (
                SELECT MAX(p2.id)
                FROM payments p2
                WHERE p2.booking_id = pi.booking_id
              )

            WHERE pi.id = $1
          `,
          [
            issueId,
          ]
        );


      res.json({

        success:
          true,

        message:
          status ===
          "RESOLVED"
            ? "Payment issue resolved."
            : "Payment issue reopened.",

        issue:
          updated,

      });

    } catch (
      error
    ) {

      console.error(
        "Update payment issue error:",
        error
      );


      res.status(500).json({

        success:
          false,

        message:
          "Failed to update payment issue.",

      });

    }

  }
);


/* =========================================================
   DASHBOARD SUMMARY
========================================================= */

app.get(
  "/api/dashboard/summary",
  async (
    req,
    res
  ) => {

    try {

      const total =
        await get(
          `
            SELECT COUNT(*)::int AS count
            FROM bookings
          `
        );


      const confirmed =
        await get(
          `
            SELECT COUNT(*)::int AS count
            FROM bookings
            WHERE status = 'CONFIRMED'
          `
        );


      const arrived =
        await get(
          `
            SELECT COUNT(*)::int AS count
            FROM bookings
            WHERE status = 'ARRIVED'
          `
        );


      const late =
        await get(
          `
            SELECT COUNT(*)::int AS count
            FROM bookings
            WHERE status = 'LATE'
          `
        );


      const weighing =
        await get(
          `
            SELECT COUNT(*)::int AS count
            FROM bookings
            WHERE status = 'WEIGHING'
          `
        );


      const procured =
        await get(
          `
            SELECT COUNT(*)::int AS count
            FROM bookings
            WHERE status IN (
              'PROCURED',
              'PAYMENT_PENDING',
              'PAYMENT_SENT'
            )
          `
        );


      const paymentPending =
        await get(
          `
            SELECT COUNT(*)::int AS count
            FROM bookings
            WHERE status = 'PAYMENT_PENDING'
          `
        );


      const paymentSent =
        await get(
          `
            SELECT COUNT(*)::int AS count
            FROM bookings
            WHERE status = 'PAYMENT_SENT'
          `
        );


      const totalPaid =
        await get(
          `
            SELECT
              COALESCE(
                SUM(amount),
                0
              ) AS amount
            FROM payments
            WHERE status = 'PAYMENT_SENT'
          `
        );


      const pendingAmount =
        await get(
          `
            SELECT
              COALESCE(
                SUM(amount),
                0
              ) AS amount
            FROM payments
            WHERE status = 'PAYMENT_PENDING'
          `
        );


      const openPaymentIssues =
        await get(
          `
            SELECT COUNT(*)::int AS count
            FROM payment_issues
            WHERE status = 'OPEN'
          `
        );


      res.json({

        success:
          true,

        summary: {

          total:
            Number(
              total?.count ||
              0
            ),

          confirmed:
            Number(
              confirmed?.count ||
              0
            ),

          arrived:
            Number(
              arrived?.count ||
              0
            ),

          late:
            Number(
              late?.count ||
              0
            ),

          weighing:
            Number(
              weighing?.count ||
              0
            ),

          procured:
            Number(
              procured?.count ||
              0
            ),

          paymentPending:
            Number(
              paymentPending?.count ||
              0
            ),

          paymentSent:
            Number(
              paymentSent?.count ||
              0
            ),

          totalPaid:
            Number(
              totalPaid?.amount ||
              0
            ),

          pendingAmount:
            Number(
              pendingAmount?.amount ||
              0
            ),

          openPaymentIssues:
            Number(
              openPaymentIssues?.count ||
              0
            ),

        },

      });

    } catch (
      error
    ) {

      console.error(
        "Dashboard summary error:",
        error
      );


      res.status(500).json({

        success:
          false,

        message:
          "Failed to load dashboard summary.",

      });

    }

  }
);


/* =========================================================
   SETTINGS
========================================================= */

app.get(
  "/api/settings",
  async (
    req,
    res
  ) => {

    try {

      res.json({

        success:
          true,

        settings:
          await getSettings(),

      });

    } catch (
      error
    ) {

      console.error(
        "Get settings error:",
        error
      );


      res.status(500).json({

        success:
          false,

        message:
          "Failed to load system settings.",

      });

    }

  }
);


app.patch(
  "/api/settings",
  async (
    req,
    res
  ) => {

    try {

      const current =
        await getSettings();


      const next = {

        ...current,

        ...(req.body || {}),

      };


      next.maxQuantity =
        Number(
          next.maxQuantity
        );


      next.defaultCapacity =
        Number(
          next.defaultCapacity
        );


      next.slotDuration =
        Number(
          next.slotDuration
        );


      next.advanceBookingDays =
        Number(
          next.advanceBookingDays
        );


      if (
        !Number.isFinite(
          next.maxQuantity
        ) ||
        next.maxQuantity <=
        0
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            message:
              "Maximum quantity must be greater than zero.",

          });

      }


      if (
        !Number.isFinite(
          next.defaultCapacity
        ) ||
        next.defaultCapacity <=
        0
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            message:
              "Default capacity must be greater than zero.",

          });

      }


      if (
        !Number.isFinite(
          next.slotDuration
        ) ||
        next.slotDuration <=
        0
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            message:
              "Slot duration must be greater than zero.",

          });

      }


      if (
        !Number.isFinite(
          next.advanceBookingDays
        ) ||
        next.advanceBookingDays <
        0
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            message:
              "Advance booking days cannot be negative.",

          });

      }


      if (
        ![
          "en",
          "hi",
          "te",
        ].includes(
          next.defaultLanguage
        )
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            message:
              "Invalid default language.",

          });

      }


      const booleanKeys = [

        "bookingEnabled",

        "requireActualWeight",

        "smsEnabled",

        "bookingConfirmationSms",

        "lateArrivalSms",

        "procurementSms",

        "paymentSms",

        "maintenanceMode",

        "transportEnabled",

      ];


      for (
        const key
        of booleanKeys
      ) {

        next[key] =
          Boolean(
            next[key]
          );

      }


      await saveSettings(
        next
      );


      res.json({

        success:
          true,

        message:
          "System settings saved.",

        settings:
          await getSettings(),

      });

    } catch (
      error
    ) {

      console.error(
        "Update settings error:",
        error
      );


      res.status(500).json({

        success:
          false,

        message:
          "Failed to save system settings.",

      });

    }

  }
);


/* =========================================================
   RESET SETTINGS
========================================================= */

app.post(
  "/api/settings/reset",
  async (
    req,
    res
  ) => {

    try {

      await saveSettings(
        DEFAULT_SETTINGS
      );


      res.json({

        success:
          true,

        message:
          "System settings reset to defaults.",

        settings:
          await getSettings(),

      });

    } catch (
      error
    ) {

      console.error(
        "Reset settings error:",
        error
      );


      res.status(500).json({

        success:
          false,

        message:
          "Failed to reset system settings.",

      });

    }

  }
);


/* =========================================================
   ACTIVITY LOG
========================================================= */

app.get(
  "/api/activity-log",
  async (
    req,
    res
  ) => {

    try {

      const events =
        await all(
          `
            SELECT
              se.id,
              se.booking_id,
              se.status,
              se.created_at,

              b.token,

              f.name AS farmer_name,
              f.phone AS farmer_phone,

              NULL AS actor_type,
              NULL AS actor_id,
              NULL AS note,
              NULL AS changed_fields

            FROM status_events se

            LEFT JOIN bookings b
              ON b.id = se.booking_id

            LEFT JOIN farmers f
              ON f.id = b.farmer_id

            ORDER BY
              se.created_at DESC,
              se.id DESC
          `
        );


      res.json({

        success:
          true,

        events,

      });

    } catch (
      error
    ) {

      console.error(
        "Activity log error:",
        error
      );


      res.status(500).json({

        success:
          false,

        message:
          "Failed to load activity log.",

      });

    }

  }
);

/* =========================================================
   KRISHISETU AI ASSISTANT
========================================================= */

const ASSISTANT_ACTIONS = [
  "OPEN_HOME",
  "OPEN_BOOKING",
  "OPEN_TOKEN",
  "OPEN_HISTORY",
  "OPEN_PAYMENTS",
  "OPEN_NOTIFICATIONS",
  "OPEN_SETTINGS",
  "OPEN_HELP",
  "NONE",
];


const ASSISTANT_PAGES = {
  "/farmer/home": {
    name: "Farmer Home",
    description:
      "Main farmer dashboard showing active procurement, upcoming bookings, recent payments, monthly summary, procurement center, recent bookings, and the notifications bell.",
    capabilities: [
      "view active procurement",
      "view upcoming procurements",
      "view recent payments",
      "view monthly summary",
      "view procurement center",
      "open notifications",
      "open settings",
      "refresh live data",
      "logout",
    ],
    notificationLocation:
      "top-right area beside settings, represented by a bell icon",
  },

  "/farmer/book": {
    name: "Book Procurement Slot",
    description:
      "Page for creating a new procurement booking.",
    capabilities: [
      "select crop",
      "enter estimated quantity",
      "select procurement center",
      "select arrival date",
      "check live slot availability",
      "select arrival window",
      "review booking",
      "confirm booking",
    ],
  },

  "/farmer/token": {
    name: "Token",
    description:
      "Page showing the farmer's procurement token and booking status.",
    capabilities: [
      "view token",
      "view booking information",
      "track procurement status",
      "view procurement progress",
    ],
  },

  "/farmer/history": {
    name: "Procurement History",
    description:
      "Page containing previous and current procurement records.",
    capabilities: [
      "search bookings",
      "filter by crop",
      "filter by month",
      "view completed procurement",
      "view supplied quantity",
      "view received amount",
      "open booking record",
    ],
  },

  "/farmer/payments": {
    name: "Payment History",
    description:
      "Page containing payment records connected to procurement bookings.",
    capabilities: [
      "view total received",
      "view completed payments",
      "view pending payments",
      "view pending amount",
      "search payments",
      "filter paid payments",
      "filter pending payments",
      "view payment reference",
      "report payment issue",
    ],
  },

  "/farmer/settings": {
    name: "Farmer Settings",
    description:
      "Page for managing farmer profile and preferences.",
    capabilities: [
      "change name",
      "change phone",
      "change village",
      "change preferred language",
      "change primary crop",
      "change typical quantity",
      "change preferred procurement center",
      "change in-app notifications",
      "change SMS notifications",
    ],
  },

  "/farmer/help": {
    name: "Farmer Help",
    description:
      "Comprehensive farmer help and FAQ page.",
    capabilities: [
      "booking guidance",
      "token guidance",
      "arrival guidance",
      "weighing guidance",
      "payment guidance",
      "SMS guidance",
      "low connectivity guidance",
      "FAQ",
      "contact center",
    ],
  },
};


const ASSISTANT_INTENTS = {
  BOOKING: [
    "booking",
    "book",
    "slot",
    "reserve",
    "reservation",
    "procurement booking",
    "procurement slot",
    "arrival slot",
    "schedule",
  ],

  TOKEN: [
    "token",
    "token number",
    "digital token",
    "my token",
    "token id",
  ],

  HISTORY: [
    "history",
    "booking history",
    "procurement history",
    "previous booking",
    "past booking",
    "old booking",
    "previous procurement",
    "past procurement",
    "records",
  ],

  PAYMENTS: [
    "payment",
    "payments",
    "payment history",
    "payment record",
    "money",
    "amount received",
    "amount",
    "payment status",
    "payment reference",
    "money received",
    "paid",
  ],

  NOTIFICATIONS: [
    "notification",
    "notifications",
    "alert",
    "alerts",
    "updates",
    "messages",
    "my alerts",
    "notification history",
  ],

  SETTINGS: [
    "settings",
    "setting",
    "profile",
    "account",
    "personal details",
    "language",
    "phone number",
    "mobile number",
    "village",
  ],

  HELP: [
    "help",
    "support",
    "how does this work",
    "how to",
    "what should i do",
    "guide",
  ],

  HOME: [
    "home",
    "dashboard",
    "main page",
    "farmer home",
  ],
};


function cleanAssistantText(
  value
) {
  return String(
    value || ""
  )
    .trim()
    .replace(
      /\s+/g,
      " "
    );
}


function truncateAssistantText(
  value,
  maximum = 6000
) {
  const text =
    String(
      value || ""
    );

  return text.length <= maximum
    ? text
    : `${text.slice(
        0,
        maximum
      )}\n[truncated]`;
}


function normalizeAssistantHistory(
  history
) {
  if (
    !Array.isArray(
      history
    )
  ) {
    return [];
  }

  return history
    .slice(-12)
    .map(
      item => {

        const role =
          item?.role ===
          "assistant"
            ? "assistant"
            : "user";

        const content =
          cleanAssistantText(
            item?.content
          );

        return {
          role,
          content,
        };

      }
    )
    .filter(
      item =>
        item.content
    );
}


function buildAssistantConversationText(
  history
) {
  const rows =
    normalizeAssistantHistory(
      history
    );

  if (
    rows.length ===
    0
  ) {
    return "No previous conversation.";
  }

  return rows
    .map(
      item =>
        `${item.role === "assistant" ? "KrishiSetu AI" : "Farmer"}: ${item.content}`
    )
    .join("\n");
}


function normalizeAssistantLanguage(
  value
) {
  const language =
    String(
      value || "en"
    )
      .trim()
      .toLowerCase();

  return [
    "en",
    "hi",
    "te",
  ].includes(
    language
  )
    ? language
    : "en";
}


function getPageName(
  path
) {
  return (
    ASSISTANT_PAGES[path]?.name ||
    path ||
    "Unknown page"
  );
}


function getActionPath(
  action
) {
  const paths = {
    OPEN_HOME:
      "/farmer/home",

    OPEN_BOOKING:
      "/farmer/book",

    OPEN_TOKEN:
      "/farmer/token",

    OPEN_HISTORY:
      "/farmer/history",

    OPEN_PAYMENTS:
      "/farmer/payments",

    OPEN_SETTINGS:
      "/farmer/settings",

    OPEN_HELP:
      "/farmer/help",

    OPEN_NOTIFICATIONS:
      "/farmer/home",
  };

  return (
    paths[action] ||
    null
  );
}


function getIntentHints() {
  return Object.entries(
    ASSISTANT_INTENTS
  )
    .map(
      (
        [
          intent,
          words,
        ]
      ) =>
        `${intent}: ${words.join(", ")}`
    )
    .join("\n");
}


function buildAssistantKnowledge() {
  const pages =
    Object.entries(
      ASSISTANT_PAGES
    )
      .map(
        (
          [
            path,
            page,
          ]
        ) => {

          const capabilities =
            Array.isArray(
              page.capabilities
            )
              ? page.capabilities.join(
                  ", "
                )
              : "";

          let result =
            `${page.name} (${path})\n${page.description}\nCapabilities: ${capabilities}`;

          if (
            page.notificationLocation
          ) {
            result +=
              `\nNotification location: ${page.notificationLocation}`;
          }

          return result;

        }
      )
      .join("\n\n");

  return pages;
}


async function buildAssistantContext({
  farmer,
  bookings,
  payments,
  notifications,
  centers,
  settings,
}) {

  const safeFarmer =
    farmer
      ? {
          id:
            farmer.id,

          name:
            farmer.name ||
            null,

          phone:
            farmer.phone ||
            null,

          village:
            farmer.village ||
            null,

          language:
            farmer.language ||
            null,

          preferredCenterId:
            farmer.preferred_center_id ||
            null,

          primaryCrop:
            farmer.primary_crop ||
            null,

          estimatedQuantity:
            Number(
              farmer.estimated_quantity ||
              0
            ),
        }
      : null;


  const safeBookings =
    Array.isArray(
      bookings
    )
      ? bookings.map(
          booking => ({
            id:
              booking.id,

            token:
              booking.token,

            centerId:
              booking.center_id,

            crop:
              booking.crop,

            estimatedQuantity:
              booking.estimated_quantity,

            actualQuantity:
              booking.actual_quantity,

            date:
              booking.date,

            slotStart:
              booking.slot_start,

            slotEnd:
              booking.slot_end,

            status:
              booking.status,

            quality:
              booking.quality,

            createdAt:
              booking.created_at,
          })
        )
      : [];


  const safePayments =
    Array.isArray(
      payments
    )
      ? payments.map(
          payment => ({
            id:
              payment.id,

            bookingId:
              payment.booking_id,

            amount:
              payment.amount,

            method:
              payment.method,

            reference:
              payment.reference,

            status:
              payment.status,

            ratePerKg:
              payment.rate_per_kg,

            notes:
              payment.notes,

            updatedAt:
              payment.updated_at,

            createdAt:
              payment.created_at,
          })
        )
      : [];


  const safeNotifications =
    Array.isArray(
      notifications
    )
      ? notifications.map(
          notification => ({
            id:
              notification.id,

            bookingId:
              notification.booking_id,

            type:
              notification.type,

            title:
              notification.title,

            message:
              notification.message,

            channel:
              notification.channel,

            status:
              notification.status,

            read:
              Boolean(
                notification.read_at
              ),

            createdAt:
              notification.created_at,
          })
        )
      : [];


  const safeCenters =
    Array.isArray(
      centers
    )
      ? centers.map(
          center => ({
            id:
              center.id,

            name:
              center.name,

            village:
              center.village,

            address:
              center.address,

            capacity:
              center.capacity,

            active:
              center.active,

            openingTime:
              center.opening_time,

            closingTime:
              center.closing_time,
          })
        )
      : [];


  return {

    farmer:
      safeFarmer,

    bookings:
      safeBookings,

    payments:
      safePayments,

    notifications:
      safeNotifications,

    centers:
      safeCenters,

    settings:
      settings || {},

  };

}


function getAssistantFallback(
  text,
  language,
  farmer
) {
  const lower =
    cleanAssistantText(
      text
    ).toLowerCase();


  const farmerName =
    farmer?.name ||
    "";


  if (
    lower.includes(
      "payment"
    ) ||
    lower.includes(
      "paymnt"
    ) ||
    lower.includes(
      "पेमेंट"
    ) ||
    lower.includes(
      "पैसे"
    ) ||
    lower.includes(
      "చెల్లింపు"
    )
  ) {

    if (
      language ===
      "hi"
    ) {

      return farmerName
        ? `${farmerName}, आपकी payment history Payments पेज पर है।`
        : "आपकी payment history Payments पेज पर है।";

    }


    if (
      language ===
      "te"
    ) {

      return farmerName
        ? `${farmerName}, మీ payment history Payments పేజీలో ఉంది.`
        : "మీ payment history Payments పేజీలో ఉంది.";

    }


    return farmerName
      ? `${farmerName}, your payment history is on the Payments page.`
      : "Your payment history is on the Payments page.";

  }


  if (
    lower.includes(
      "notification"
    ) ||
    lower.includes(
      "notif"
    ) ||
    lower.includes(
      "alert"
    ) ||
    lower.includes(
      "updates"
    ) ||
    lower.includes(
      "नोटिफिकेशन"
    ) ||
    lower.includes(
      "सूचना"
    ) ||
    lower.includes(
      "నోటిఫికేషన్"
    )
  ) {

    if (
      language ===
      "hi"
    ) {

      return "आपके notifications Farmer Home के ऊपर दाईं ओर bell icon में हैं।";

    }


    if (
      language ===
      "te"
    ) {

      return "మీ notifications Farmer Home పేజీ పై కుడివైపు ఉన్న bell iconలో ఉన్నాయి.";

    }


    return "Your notifications are in the bell icon at the top-right of the Farmer Home page.";

  }


  if (
    lower.includes(
      "token"
    ) ||
    lower.includes(
      "टोकन"
    ) ||
    lower.includes(
      "టోకెన్"
    )
  ) {

    if (
      language ===
      "hi"
    ) {

      return "आपका current procurement token Token page पर है।";

    }


    if (
      language ===
      "te"
    ) {

      return "మీ current procurement token Token pageలో ఉంది.";

    }


    return "Your current procurement token is on the Token page.";

  }


  if (
    lower.includes(
      "booking"
    ) ||
    lower.includes(
      "book"
    ) ||
    lower.includes(
      "बुक"
    ) ||
    lower.includes(
      "బుకింగ్"
    )
  ) {

    if (
      language ===
      "hi"
    ) {

      return "नई procurement booking शुरू करने के लिए मैं Booking page खोल सकता हूँ।";

    }


    if (
      language ===
      "te"
    ) {

      return "కొత్త procurement booking ప్రారంభించడానికి నేను Booking pageని తెరవగలను.";

    }


    return "I can open the Booking page so you can start a new procurement booking.";

  }


  if (
    language ===
    "hi"
  ) {

    return "मैं KrishiSetu में booking, token, history, payments, notifications, settings और help में आपकी मदद कर सकता हूँ।";

  }


  if (
    language ===
    "te"
  ) {

    return "నేను KrishiSetuలో booking, token, history, payments, notifications, settings మరియు helpలో మీకు సహాయం చేయగలను.";

  }


  return "I can help you with bookings, tokens, procurement history, payments, notifications, settings, help, and the rest of your KrishiSetu journey.";

}


function repairAssistantAction(
  action,
  reply,
  text
) {
  const normalized =
    cleanAssistantText(
      action
    ).toUpperCase();


  if (
    ASSISTANT_ACTIONS.includes(
      normalized
    )
  ) {
    return normalized;
  }


  const lower =
    cleanAssistantText(
      `${reply} ${text}`
    ).toLowerCase();


  if (
    lower.includes(
      "payment history"
    ) ||
    lower.includes(
      "payment"
    )
  ) {
    return "OPEN_PAYMENTS";
  }


  if (
    lower.includes(
      "notification"
    ) ||
    lower.includes(
      "bell icon"
    )
  ) {
    return "OPEN_NOTIFICATIONS";
  }


  if (
    lower.includes(
      "token"
    )
  ) {
    return "OPEN_TOKEN";
  }


  if (
    lower.includes(
      "booking"
    ) ||
    lower.includes(
      "book a slot"
    )
  ) {
    return "OPEN_BOOKING";
  }


  if (
    lower.includes(
      "history"
    )
  ) {
    return "OPEN_HISTORY";
  }


  if (
    lower.includes(
      "setting"
    ) ||
    lower.includes(
      "profile"
    )
  ) {
    return "OPEN_SETTINGS";
  }


  if (
    lower.includes(
      "help"
    )
  ) {
    return "OPEN_HELP";
  }


  return "NONE";
}


function shouldNavigate(
  action
) {
  return [
    "OPEN_HOME",
    "OPEN_BOOKING",
    "OPEN_TOKEN",
    "OPEN_HISTORY",
    "OPEN_PAYMENTS",
    "OPEN_NOTIFICATIONS",
    "OPEN_SETTINGS",
    "OPEN_HELP",
  ].includes(
    action
  );
}


app.get(
  "/api/assistant/health",
  (
    req,
    res
  ) => {

    res.json({

      success:
        true,

      configured:
        Boolean(
          GEMINI_API_KEY
        ),

      model:
        GEMINI_MODEL,

      route:
        "/api/assistant",

      actions:
        ASSISTANT_ACTIONS,

      pages:
        Object.keys(
          ASSISTANT_PAGES
        ),

    });

  }
);


app.post(
  "/api/assistant",
  async (
    req,
    res
  ) => {

    const requestStartedAt =
      Date.now();


    try {

      if (
        !gemini
      ) {

        return res
          .status(503)
          .json({

            success:
              false,

            message:
              "AI assistant is not configured. Check GEMINI_API_KEY in the backend .env file.",

          });

      }


      const text =
        cleanAssistantText(
          req.body?.text ??
          req.body?.message
        );


      const language =
        normalizeAssistantLanguage(
          req.body?.language
        );


      const currentPath =
        cleanAssistantText(
          req.body?.currentPath ||
          "/farmer/home"
        );


      const farmerId =
        cleanAssistantText(
          req.body?.farmerId
        );


      const phone =
        normalisePhone(
          req.body?.phone
        );


      const history =
        normalizeAssistantHistory(
          req.body?.history
        );


      if (
        !text
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            message:
              "Assistant input is required.",

          });

      }


      if (
        text.length >
        3000
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            message:
              "Assistant input is too long.",

          });

      }


      const farmer =
        await resolveFarmer({

          farmerId,

          phone,

        });


      const bookings =
        farmer
          ? await all(
              `
                SELECT
                  b.id,
                  b.token,
                  b.center_id,
                  b.crop,
                  b.estimated_quantity,
                  b.actual_quantity,
                  b.date,
                  b.slot_start,
                  b.slot_end,
                  b.status,
                  b.quality,
                  b.created_at
                FROM bookings b
                WHERE b.farmer_id = $1
                ORDER BY
                  b.created_at DESC,
                  b.id DESC
                LIMIT 30
              `,
              [
                farmer.id,
              ]
            )
          : [];


      const payments =
        farmer
          ? await all(
              `
                SELECT
                  p.id,
                  p.booking_id,
                  p.amount,
                  p.method,
                  p.reference,
                  p.status,
                  p.rate_per_kg,
                  p.notes,
                  p.updated_at,
                  p.created_at
                FROM payments p
                INNER JOIN bookings b
                  ON b.id = p.booking_id
                WHERE b.farmer_id = $1
                ORDER BY
                  p.created_at DESC,
                  p.id DESC
                LIMIT 30
              `,
              [
                farmer.id,
              ]
            )
          : [];


      const notifications =
        farmer
          ? await all(
              `
                SELECT
                  id,
                  booking_id,
                  type,
                  title,
                  message,
                  channel,
                  status,
                  read_at,
                  sent_at,
                  created_at
                FROM notifications
                WHERE farmer_id = $1
                ORDER BY
                  created_at DESC,
                  id DESC
                LIMIT 30
              `,
              [
                farmer.id,
              ]
            )
          : [];


      const centers =
        await all(
          `
            SELECT
              id,
              name,
              village,
              address,
              capacity,
              active,
              opening_time,
              closing_time
            FROM centers
            WHERE active = 1
            ORDER BY name ASC
          `
        );


      const settings =
        await getSettings();


      const knowledge =
        buildAssistantKnowledge();


      const context =
        await buildAssistantContext({

          farmer,

          bookings,

          payments,

          notifications,

          centers,

          settings,

        });


      const pageInfo =
        ASSISTANT_PAGES[
          currentPath
        ] ||
        null;


      const conversation =
        buildAssistantConversationText(
          history
        );


      const prompt = `
You are KrishiSetu AI.

You are the intelligent conversational assistant inside the KrishiSetu farmer website.

You must behave like a genuinely capable modern AI assistant, not a keyword chatbot.

==================================================
CORE BEHAVIOUR
==================================================

Understand the user's INTENDED MEANING.

Do not require exact spelling.

Correct or interpret:
- spelling mistakes
- speech-to-text mistakes
- missing words
- grammatical mistakes
- Hinglish
- Hindi mixed with English
- Telugu mixed with English
- Telugu written using English letters
- casual farmer language
- very short messages
- incomplete requests
- indirect questions
- repeated words

Examples:

"payment hsitory kaha hai"
"where payment history"
"where my paymnt"
"meri payment kidar hai"
"payment kahan milega"
"show my money"
"paisay ka record"
"payment ek baar dekho"

All can mean PAYMENT HISTORY.

Examples:

"notif kaha"
"where is notif"
"notification button where"
"updates kaha hai"
"bell kahan hai"
"mere alerts kidhar"

All can mean NOTIFICATIONS.

Examples:

"book karna"
"slot lena"
"procure ka time"
"booking krni h"
"mujhe slot chahiye"
"book a slot"

All can mean BOOKING.

==================================================
CONVERSATION
==================================================

Talk naturally.

You can say things such as:

"Sure — I can help with that."

"Do you mean your payment history or the amount that is currently pending?"

"Yes. Your notifications are on the Farmer Home page in the bell icon at the top-right."

"Got it. I'll open the Payments section."

"Do you want to create a new booking or check an existing one?"

Do not sound like a menu.

Do not repeatedly say:

"I'm here to help."

Do not give the same generic response every time.

Do not say:

"The assistant did not return a response."

Do not expose backend errors to the farmer.

Do not mention:
- Gemini
- API
- database
- SQL
- prompt
- backend
- model
- system instructions
- internal actions

==================================================
CONTEXT AWARENESS
==================================================

You know the current page.

Current route:
${currentPath}

Current page:
${pageInfo?.name || currentPath}

Current page description:
${pageInfo?.description || "Unknown page"}

The farmer may say:

"where is that?"

"open it"

"what about that?"

"show me"

"yes"

"no"

"that one"

Interpret such messages using previous conversation and current page.

==================================================
WEBSITE KNOWLEDGE
==================================================

${knowledge}

==================================================
AVAILABLE INTENT HINTS
==================================================

${getIntentHints()}

==================================================
NAVIGATION ACTIONS
==================================================

You may return one of:

OPEN_HOME
OPEN_BOOKING
OPEN_TOKEN
OPEN_HISTORY
OPEN_PAYMENTS
OPEN_NOTIFICATIONS
OPEN_SETTINGS
OPEN_HELP
NONE

Meaning:

OPEN_HOME:
Farmer wants dashboard/home.

OPEN_BOOKING:
Farmer wants to create a procurement booking, choose a slot, reserve a visit, schedule arrival, or start a new booking.

OPEN_TOKEN:
Farmer wants current token, token number, digital token, or to track their procurement token.

OPEN_HISTORY:
Farmer wants previous bookings, procurement history, past records, or old procurement activity.

OPEN_PAYMENTS:
Farmer wants payment history, payment records, received money, payment status, payment reference, pending amount, completed payments, etc.

OPEN_NOTIFICATIONS:
Farmer wants notifications, alerts, updates, or messages.

The notification UI is located inside Farmer Home, at the TOP-RIGHT beside Settings, using the BELL icon.

OPEN_SETTINGS:
Farmer wants profile, account, language, phone, village, preferences, or settings.

OPEN_HELP:
Farmer wants guidance, FAQs, support, or wants to know how the system works.

NONE:
Use when no navigation is needed.

==================================================
VERY IMPORTANT: WHEN TO ASK
==================================================

Ask a clarification question only when there are genuinely multiple plausible meanings.

Example:

Farmer:
"history"

Good answer:
"Sure. Do you mean your procurement history or your payment history?"

Do not ask clarification when the intention is obvious.

Example:

Farmer:
"where is my payment history"

Good:
"Your payment history is in Payments. I'll open it for you."

Example:

Farmer:
"notification button kaha hai"

Good:
"Your notifications are on the Farmer Home page, in the bell icon at the top-right. I'll take you there."

==================================================
PERSONAL DATA
==================================================

Use supplied farmer data.

Never invent:
- token
- payment amount
- payment reference
- booking date
- booking status
- center
- farmer details

If there is no data:

Say that the information is currently unavailable.

Do not fabricate an answer.

==================================================
PAYMENT QUESTIONS
==================================================

If asked about payment history:
Use PAYMENT data.

If asked whether payment was received:
Use payment status and amount.

If asked for a payment reference:
Use the reference from payment data.

If payment is pending:
Say it is pending.

If no payment records exist:
Tell the farmer there are currently no payment records.

==================================================
BOOKING QUESTIONS
==================================================

If asked about current booking status:
Use BOOKINGS.

If asked about upcoming booking:
Use booking date and status.

If asked to create a new booking:
OPEN_BOOKING.

Do not pretend that a booking has been created merely because the farmer asked.

==================================================
TOKEN QUESTIONS
==================================================

If the farmer has bookings:
Use the most relevant/latest booking token.

If there is no token:
Say that no token is currently available.

==================================================
NOTIFICATION QUESTIONS
==================================================

If asked where notifications are:

Explain:
"They are on the Farmer Home page in the bell icon at the top-right."

Then use:
OPEN_NOTIFICATIONS

If asked what their latest notification says:
Use NOTIFICATIONS data.

==================================================
SETTINGS QUESTIONS
==================================================

If asked to change profile information:
OPEN_SETTINGS.

Do not pretend a profile change happened unless an actual application operation was performed.

==================================================
HELP QUESTIONS
==================================================

You understand the help content:

- booking
- crop selection
- quantity estimates
- procurement center
- arrival window
- token
- late arrival
- weighing
- procurement
- payments
- SMS
- low connectivity
- FAQs
- support center

==================================================
LANGUAGE
==================================================

Language preference:
${language}

Respond naturally in the user's language.

English:
English

Hindi:
Hindi

Telugu:
Telugu

Hinglish:
Natural Hinglish

Mixed Hindi-English:
Natural mixed Hindi-English

Mixed Telugu-English:
Natural mixed Telugu-English

Do not force overly formal translations.

==================================================
FARMER
==================================================

${truncateAssistantText(
  JSON.stringify(
    context.farmer,
    null,
    2
  ),
  8000
)}

==================================================
BOOKINGS
==================================================

${truncateAssistantText(
  JSON.stringify(
    context.bookings,
    null,
    2
  ),
  12000
)}

==================================================
PAYMENTS
==================================================

${truncateAssistantText(
  JSON.stringify(
    context.payments,
    null,
    2
  ),
  12000
)}

==================================================
NOTIFICATIONS
==================================================

${truncateAssistantText(
  JSON.stringify(
    context.notifications,
    null,
    2
  ),
  12000
)}

==================================================
PROCUREMENT CENTERS
==================================================

${truncateAssistantText(
  JSON.stringify(
    context.centers,
    null,
    2
  ),
  8000
)}

==================================================
SYSTEM SETTINGS
==================================================

${truncateAssistantText(
  JSON.stringify(
    context.settings,
    null,
    2
  ),
  8000
)}

==================================================
PREVIOUS CONVERSATION
==================================================

${truncateAssistantText(
  conversation,
  9000
)}

==================================================
CURRENT FARMER MESSAGE
==================================================

${text}

==================================================
OUTPUT
==================================================

Return ONLY JSON.

Exactly:

{
  "reply": "natural conversational answer",
  "action": "OPEN_HOME | OPEN_BOOKING | OPEN_TOKEN | OPEN_HISTORY | OPEN_PAYMENTS | OPEN_NOTIFICATIONS | OPEN_SETTINGS | OPEN_HELP | NONE"
}

Rules:

1. reply must be useful.
2. reply must sound human.
3. action must be one of the allowed values.
4. Use action when navigation would help.
5. Use NONE when no navigation is necessary.
6. Never invent personal data.
7. Never mention internal implementation.
8. Do not output markdown outside the JSON.
      `.trim();


      const response =
        await gemini.models.generateContent({

          model:
            GEMINI_MODEL,

          contents:
            prompt,

          config: {

            temperature:
              0.35,

            maxOutputTokens:
              600,

            responseMimeType:
              "application/json",

            responseSchema: {

              type:
                Type.OBJECT,

              properties: {

                reply: {

                  type:
                    Type.STRING,

                  description:
                    "Natural conversational answer to the farmer.",

                },

                action: {

                  type:
                    Type.STRING,

                  description:
                    "Navigation action for the website.",

                  enum:
                    ASSISTANT_ACTIONS,

                },

              },

              required: [
                "reply",
                "action",
              ],

            },

          },

        });


      const raw =
        String(
          response?.text ||
          ""
        ).trim();


      let parsed;


      if (
        raw
      ) {

        try {

          parsed =
            JSON.parse(
              raw
            );

        } catch (
          parseError
        ) {

          console.warn(
            "Assistant JSON parsing warning:",
            parseError
          );

          parsed = {

            reply:
              raw,

            action:
              "NONE",

          };

        }

      } else {

        parsed = {

          reply:
            "",

          action:
            "NONE",

        };

      }


      let reply =
        cleanAssistantText(
          parsed?.reply
        );


      if (
        !reply
      ) {

        reply =
          getAssistantFallback(
            text,
            language,
            farmer
          );

      }


      let action =
        repairAssistantAction(
          parsed?.action,
          reply,
          text
        );


      const lower =
        text.toLowerCase();


      if (
        action ===
        "NONE"
      ) {

        if (
          lower.includes(
            "notification"
          ) ||
          lower.includes(
            "notif"
          ) ||
          lower.includes(
            "bell"
          ) ||
          lower.includes(
            "alert"
          )
        ) {

          action =
            "OPEN_NOTIFICATIONS";

        } else if (
          lower.includes(
            "payment"
          ) ||
          lower.includes(
            "paymnt"
          ) ||
          lower.includes(
            "पेमेंट"
          ) ||
          lower.includes(
            "पैसे"
          )
        ) {

          action =
            "OPEN_PAYMENTS";

        } else if (
          lower.includes(
            "token"
          ) ||
          lower.includes(
            "टोकन"
          ) ||
          lower.includes(
            "టోకెన్"
          )
        ) {

          action =
            "OPEN_TOKEN";

        } else if (
          lower.includes(
            "history"
          ) ||
          lower.includes(
            " हिस्ट्री"
          ) ||
          lower.includes(
            "చరిత్ర"
          )
        ) {

          action =
            "OPEN_HISTORY";

        }

      }


      if (
        shouldNavigate(
          action
        )
      ) {

        const path =
          getActionPath(
            action
          );


        if (
          action ===
          "OPEN_NOTIFICATIONS"
        ) {

          if (
            language ===
            "hi"
          ) {

            reply =
              reply ||
              "आपके notifications Farmer Home के ऊपर दाईं ओर bell icon में हैं।";

          } else if (
            language ===
            "te"
          ) {

            reply =
              reply ||
              "మీ notifications Farmer Home పేజీ పై కుడివైపు bell iconలో ఉన్నాయి.";

          } else {

            reply =
              reply ||
              "Your notifications are in the bell icon at the top-right of the Farmer Home page.";

          }

        }


        return res.json({

          success:
            true,

          reply,

          action,

          path,

          currentPage:
            getPageName(
              currentPath
            ),

          requestTimeMs:
            Date.now() -
            requestStartedAt,

        });

      }


      return res.json({

        success:
          true,

        reply,

        action:
          "NONE",

        path:
          null,

        currentPage:
          getPageName(
            currentPath
          ),

        requestTimeMs:
          Date.now() -
          requestStartedAt,

      });

    } catch (
      error
    ) {

      console.error(
        "=========================================="
      );

      console.error(
        "KRISHISETU AI ASSISTANT ERROR"
      );

      console.error(
        "=========================================="
      );

      console.error(
        error
      );

      console.error(
        "Message:",
        error?.message
      );

      console.error(
        "Status:",
        error?.status
      );

      console.error(
        "Code:",
        error?.code
      );

      console.error(
        "=========================================="
      );


      const text =
        cleanAssistantText(
          req.body?.text ??
          req.body?.message
        );


      const language =
        normalizeAssistantLanguage(
          req.body?.language
        );


      let fallbackAction =
        repairAssistantAction(
          "NONE",
          "",
          text
        );


      if (
        !ASSISTANT_ACTIONS.includes(
          fallbackAction
        )
      ) {

        fallbackAction =
          "NONE";

      }


      return res.json({

        success:
          true,

        reply:
          getAssistantFallback(
            text,
            language,
            null
          ),

        action:
          fallbackAction,

        path:
          getActionPath(
            fallbackAction
          ),

        degraded:
          true,

      });

    }

  }
);
/* =========================================================
   FARMER NOTIFICATIONS
========================================================= */

app.get(
  "/api/farmers/:id/notifications",
  async (
    req,
    res
  ) => {

    try {

      const requestedId =
        String(
          req.params.id ||
          ""
        ).trim();


      let farmer =
        await findFarmerById(
          requestedId
        );


      if (
        !farmer
      ) {

        const possiblePhone =
          normalisePhone(
            req.query?.phone ||
            ""
          );


        farmer =
          await findFarmerByPhone(
            possiblePhone
          );

      }


      if (
        !farmer
      ) {

        return res.json({

          success:
            true,

          notifications:
            [],

        });

      }


      const notifications =
        await all(
          `
            SELECT *
            FROM notifications
            WHERE farmer_id = $1
            ORDER BY
              created_at DESC,
              id DESC
          `,
          [
            farmer.id,
          ]
        );


      res.json({

        success:
          true,

        notifications,

      });

    } catch (
      error
    ) {

      console.error(
        "Get notifications error:",
        error
      );


      res.status(500).json({

        success:
          false,

        message:
          "Failed to load notifications.",

      });

    }

  }
);


/* =========================================================
   MARK NOTIFICATION READ
========================================================= */

app.patch(
  "/api/notifications/:id/read",
  async (
    req,
    res
  ) => {

    try {

      const result =
        await query(
          `
            UPDATE notifications
            SET read_at = CURRENT_TIMESTAMP
            WHERE id = $1
          `,
          [
            req.params.id,
          ]
        );


      res.json({

        success:
          true,

        updated:
          result.rowCount >
          0,

      });

    } catch (
      error
    ) {

      console.error(
        "Read notification error:",
        error
      );


      res.status(500).json({

        success:
          false,

        message:
          "Failed to update notification.",

      });

    }

  }
);


/* =========================================================
   FALLBACK
========================================================= */

app.use(
  (
    req,
    res
  ) => {

    res
      .status(404)
      .json({

        success:
          false,

        message:
          "Route not found.",

      });

  }
);


/* =========================================================
   ERROR HANDLER
========================================================= */

app.use(
  (
    error,
    req,
    res,
    next
  ) => {

    console.error(
      "Unhandled server error:",
      error
    );


    res
      .status(500)
      .json({

        success:
          false,

        message:
          "Internal server error.",

      });

  }
);


/* =========================================================
   PHASE 2 ADMIN TRANSPORT SUMMARY
   Read-only monitoring data for the SIH transport dashboard.
========================================================= */

app.get(
  "/api/admin/transport/summary",
  async (req, res) => {
    try {
      const [requestCounts, transporterCounts, activeTrips] = await Promise.all([
        all(`
          SELECT status, COUNT(*)::int AS count
          FROM transport_requests
          GROUP BY status
          ORDER BY status
        `),
        all(`
          SELECT
            COUNT(*) FILTER (WHERE is_online = TRUE)::int AS online,
            COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE verification_status = 'PENDING')::int AS pending_verification
          FROM transporters
        `),
        all(`
          SELECT
            tr.id, tr.status, tr.crop, tr.quantity_kg, tr.farmer_id,
            tr.transporter_id, tr.requested_date, tr.updated_at,
            f.name AS farmer_name,
            t.name AS transporter_name,
            t.vehicle_type AS transporter_vehicle_type,
            t.vehicle_number AS transporter_vehicle_number
          FROM transport_requests tr
          LEFT JOIN farmers f ON f.id = tr.farmer_id
          LEFT JOIN transporters t ON t.id = tr.transporter_id
          WHERE tr.status IN (
            'ASSIGNED', 'EN_ROUTE_TO_FARMER', 'CROP_PICKED_UP',
            'EN_ROUTE_TO_CENTER', 'DELIVERED'
          )
          ORDER BY tr.updated_at DESC, tr.id DESC
          LIMIT 100
        `),
      ]);

      return res.json({
        success: true,
        requestCounts,
        transporterCounts: transporterCounts[0] || {
          online: 0,
          total: 0,
          pending_verification: 0,
        },
        activeTrips,
      });
    } catch (error) {
      console.error(
        "Admin transport summary error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Failed to load transport summary.",
      });
    }
  }
);


/* =========================================================
   START SERVER
========================================================= */

async function startServer() {

  try {

    await initializeDatabase();


    await ensureBookingChangesTable();

    await ensureTransportTables();


    await db.query(
      "SELECT 1"
    );


    app.listen(
      PORT,
      () => {

        console.log(
          ""
        );

        console.log(
          "=========================================="
        );

        console.log(
          "        KRISHISETU BACKEND STARTED"
        );

        console.log(
          "=========================================="
        );

        console.log(
          `Backend port: ${PORT}`
        );

        console.log(
          `SMS mode: ${
            SMS_ENABLED
              ? "ENABLED"
              : "DEMO / DISABLED"
          }`
        );

        console.log(
          "Database: PostgreSQL"
        );

        console.log(
          "Twilio Account configured:",
          Boolean(
            process.env.TWILIO_ACCOUNT_SID
          )
        );

        console.log(
          "Twilio API key configured:",
          Boolean(
            process.env.TWILIO_API_KEY
          )
        );

        console.log(
          "Twilio API secret configured:",
          Boolean(
            process.env.TWILIO_API_SECRET
          )
        );

        console.log(
          "Twilio sender configured:",
          Boolean(
            process.env.TWILIO_PHONE_NUMBER
          )
        );

        console.log(
          "Twilio trial template:",
          TWILIO_TRIAL_TEMPLATE
        );

        console.log(
          "=========================================="
        );

      }
    );

  } catch (
    error
  ) {

    console.error(
      "Failed to start KrishiSetu backend:",
      error
    );

    process.exit(
      1
    );

  }

}


startServer();