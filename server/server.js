import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import db from "./db.js";

dotenv.config();

const app = express();

const PORT =
  process.env.PORT ||
  5000;

const SMS_ENABLED =
  String(
    process.env.SMS_ENABLED || ""
  ).toLowerCase() === "true";


/* =========================================================
   MIDDLEWARE
========================================================= */

app.use(
  cors()
);

app.use(
  express.json()
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
   DATABASE HELPERS
========================================================= */

function addColumnIfMissing(
  table,
  column,
  definition
) {

  const columns =
    db
      .prepare(
        `PRAGMA table_info(${table})`
      )
      .all();

  const exists =
    columns.some(
      item =>
        item.name ===
        column
    );

  if (
    !exists
  ) {

    db.exec(
      `ALTER TABLE ${table}
       ADD COLUMN ${column} ${definition}`
    );

    console.log(
      `Added ${table}.${column}`
    );

  }

}


function ensurePaymentIssuesTable() {

  db.exec(`
    CREATE TABLE IF NOT EXISTS payment_issues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farmer_id TEXT NOT NULL,
      booking_id TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'OPEN',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

}


function ensureNotificationsTable() {

  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      farmer_id TEXT NOT NULL,
      booking_id TEXT,

      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,

      channel TEXT NOT NULL DEFAULT 'IN_APP',

      status TEXT NOT NULL DEFAULT 'DELIVERED',

      read_at TEXT,
      sent_at TEXT,

      provider_response TEXT,

      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

}


function ensureFarmerIdentityColumns() {

  addColumnIfMissing(
    "farmers",
    "state_id",
    "TEXT"
  );

  addColumnIfMissing(
    "farmers",
    "district_id",
    "TEXT"
  );

  addColumnIfMissing(
    "farmers",
    "mandal_id",
    "TEXT"
  );

  addColumnIfMissing(
    "farmers",
    "village",
    "TEXT"
  );

  addColumnIfMissing(
    "farmers",
    "language",
    "TEXT"
  );

  addColumnIfMissing(
    "farmers",
    "preferred_center_id",
    "TEXT"
  );

  addColumnIfMissing(
    "farmers",
    "primary_crop",
    "TEXT"
  );

  addColumnIfMissing(
    "farmers",
    "estimated_quantity",
    "REAL"
  );

}


try {

  ensureFarmerIdentityColumns();

  addColumnIfMissing(
    "payments",
    "rate_per_kg",
    "REAL"
  );

  addColumnIfMissing(
    "payments",
    "notes",
    "TEXT"
  );

  addColumnIfMissing(
    "payments",
    "updated_at",
    "TEXT"
  );

  addColumnIfMissing(
    "payments",
    "sms_status",
    "TEXT"
  );

  addColumnIfMissing(
    "payments",
    "sms_sent_at",
    "TEXT"
  );

  ensurePaymentIssuesTable();

  ensureNotificationsTable();

} catch (
  error
) {

  console.error(
    "Database migration error:",
    error
  );

}


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

};


function getSettings() {

  const rows =
    db
      .prepare(`
        SELECT key, value
        FROM settings
        ORDER BY key ASC
      `)
      .all();

  const settings = {
    ...DEFAULT_SETTINGS,
  };

  for (
    const row of rows
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


function saveSettings(
  settings
) {

  const now =
    new Date().toISOString();

  const statement =
    db.prepare(`
      INSERT INTO settings (
        key,
        value,
        updated_at
      )
      VALUES (?, ?, ?)
      ON CONFLICT(key)
      DO UPDATE SET
        value = excluded.value,
        updated_at = excluded.updated_at
    `);

  const transaction =
    db.transaction(
      () => {

        for (
          const [
            key,
            value,
          ]
            of Object.entries(
              settings
            )
        ) {

          statement.run(
            key,
            JSON.stringify(
              value
            ),
            now
          );

        }

      }
    );

  transaction();

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


function findFarmerById(
  farmerId
) {

  if (
    !farmerId
  ) {

    return null;

  }

  return db.prepare(`
    SELECT *
    FROM farmers
    WHERE id = ?
  `).get(
    farmerId
  );

}


function findFarmerByPhone(
  phone
) {

  const normalized =
    normalisePhone(
      phone
    );

  if (
    normalized.length !==
    10
  ) {

    return null;

  }

  return db.prepare(`
    SELECT *
    FROM farmers
    WHERE REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(phone, '+', ''),
          ' ', ''
        ),
        '-', ''
      ),
      '(', ''
    ) = ?
    OR phone = ?
  `).get(
    normalized,
    normalized
  );

}


function resolveFarmer({
  farmerId = "",
  phone = "",
}) {

  let farmer =
    findFarmerById(
      farmerId
    );

  if (
    farmer
  ) {

    return farmer;

  }

  farmer =
    findFarmerByPhone(
      phone
    );

  return (
    farmer ||
    null
  );

}


function getBookingById(
  id
) {

  return db.prepare(`
    SELECT
      b.*,

      f.name AS farmer_name,
      f.phone AS farmer_phone,
      f.village AS farmer_village,

      p.amount AS payment_amount,
      p.method AS payment_method,
      p.reference AS payment_reference,
      p.status AS payment_record_status,
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
        SELECT p2.id
        FROM payments p2
        WHERE p2.booking_id = b.id
        ORDER BY p2.id DESC
        LIMIT 1
      )

    WHERE b.id = ?
  `).get(
    id
  );

}


function isValidStatus(
  status
) {

  return [

    "CONFIRMED",
    "ARRIVED",
    "LATE",
    "WEIGHING",
    "PROCURED",
    "PAYMENT_PENDING",
    "PAYMENT_SENT",

  ].includes(
    status
  );

}


function getAllowedNextStatuses(
  status
) {

  const transitions = {

    CONFIRMED: [
      "ARRIVED",
      "LATE",
    ],

    ARRIVED: [
      "WEIGHING",
      "LATE",
    ],

    LATE: [
      "ARRIVED",
      "WEIGHING",
    ],

    WEIGHING: [
      "PROCURED",
    ],

    PROCURED: [
      "PAYMENT_PENDING",
    ],

    PAYMENT_PENDING: [
      "PAYMENT_SENT",
    ],

    PAYMENT_SENT: [],

  };

  return (
    transitions[
      status
    ] ||
    []
  );

}


function getStatusSms(
  token,
  status
) {

  const messages = {

    ARRIVED:
      `KrishiSetu update: token ${token} has been marked arrived.`,

    LATE:
      `KrishiSetu update: token ${token} has been marked late.`,

    WEIGHING:
      `KrishiSetu update: token ${token} is now being weighed.`,

    PROCURED:
      `KrishiSetu update: token ${token} has completed procurement.`,

    PAYMENT_PENDING:
      `KrishiSetu update: payment for token ${token} is being processed.`,

    PAYMENT_SENT:
      `KrishiSetu update: payment for token ${token} has been sent.`,

  };

  return (
    messages[
      status
    ] ||
    null
  );

}


function getNotificationTitle(
  status
) {

  const titles = {

    BOOKING_CONFIRMED:
      "Booking confirmed",

    ARRIVED:
      "Arrival recorded",

    LATE:
      "Late arrival recorded",

    WEIGHING:
      "Weighing started",

    PROCUREMENT_COMPLETED:
      "Procurement completed",

    PROCURED:
      "Procurement completed",

    PAYMENT_PENDING:
      "Payment processing started",

    PAYMENT_SENT:
      "Payment sent",

  };

  return (
    titles[
      status
    ] ||
    "Booking update"
  );

}


/* =========================================================
   TWILIO SMS
========================================================= */

/*
   IMPORTANT FOR TWILIO TRIAL:

   Trial accounts cannot use arbitrary SMS text.

   We therefore ALWAYS send the predefined
   Twilio trial template:

       sms_event_notifications

   The application's own notification message is still
   stored in the database, but is NOT used as the SMS body.
*/

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

    console.log(
      "SMS disabled."
    );

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

    console.error(
      "Twilio credentials are missing."
    );

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

    console.error(
      "Invalid recipient:",
      number
    );

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
       DO NOT replace this body with your
       KrishiSetu custom message.

       Twilio trial requires its predefined
       template string.
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


    /*
       Twilio normally returns "queued" first.

       For compatibility with your current frontend,
       we return SENT after Twilio accepted the message.

       This means:
       "Twilio accepted the SMS request."

       It does NOT guarantee the carrier/device delivered it.
    */

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


    /*
       NEVER throw.

       SMS failure must NEVER make the
       booking/payment request fail.
    */

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


  const result =
    db.prepare(`
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
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?
      )
    `).run(

      farmerId,

      bookingId,

      type,

      title,

      message,

      channel,

      initialStatus

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

      try {

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


      } catch (
        error
      ) {

        /*
           Extra protection:
           even if sendSms somehow throws,
           notification/booking must continue.
        */

        console.error(
          "Notification SMS failed, but operation continues:",
          error
        );


        status =
          "FAILED";


        sentAt =
          null;


        providerResponse =
          JSON.stringify({

            code:
              error?.code ||
              null,

            status:
              error?.status ||
              null,

            message:
              error?.message ||
              "Unknown SMS error.",

            moreInfo:
              error?.moreInfo ||
              null,

          });

      }

    }

  }


  db.prepare(`
    UPDATE notifications
    SET
      status = ?,
      sent_at = ?,
      provider_response = ?
    WHERE id = ?
  `).run(

    status,

    sentAt,

    providerResponse,

    result.lastInsertRowid

  );


  console.log(
    "Notification result:",
    {

      id:
        result.lastInsertRowid,

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
      result.lastInsertRowid,

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
  (
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
        resolveFarmer({

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

        db.prepare(`
          UPDATE farmers
          SET
            name = ?,
            phone = ?,
            state_id = ?,
            district_id = ?,
            mandal_id = ?,
            village = ?,
            language = ?,
            preferred_center_id = ?,
            primary_crop = ?,
            estimated_quantity = ?
          WHERE id = ?
        `).run(

          name,

          phone,

          incoming.stateId ||
            farmer.state_id ||
            null,

          incoming.districtId ||
            farmer.district_id ||
            null,

          incoming.mandalId ||
            farmer.mandal_id ||
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

          farmer.id

        );

      } else {

        db.prepare(`
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
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?
          )
        `).run(

          farmerId,

          name,

          phone,

          incoming.stateId ||
            null,

          incoming.districtId ||
            null,

          incoming.mandalId ||
            null,

          incoming.village ||
            null,

          incoming.language ||
            "en",

          incoming.preferredCenterId ||
            null,

          incoming.primaryCrop ||
            null,

          Number(
            incoming.estimatedQuantity ||
            0
          )

        );

      }


      const saved =
        findFarmerById(
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
        "SQLITE_CONSTRAINT_UNIQUE"
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
  (
    req,
    res
  ) => {

    try {

      const farmers =
        db.prepare(`
          SELECT *
          FROM farmers
          ORDER BY datetime(created_at) DESC
        `).all();


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
  (
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
        findFarmerByPhone(
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
  (
    req,
    res
  ) => {

    try {

      const farmer =
        findFarmerById(
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
  (
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
        resolveFarmer({

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
        findFarmerByPhone(
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


      db.prepare(`
        UPDATE farmers
        SET
          name = ?,
          phone = ?,
          village = ?,
          language = ?,
          preferred_center_id = ?,
          primary_crop = ?,
          estimated_quantity = ?
        WHERE id = ?
      `).run(

        name,

        phone,

        village ||
          null,

        language,

        preferredCenterId,

        primaryCrop ||
          null,

        estimatedQuantity,

        existing.id

      );


      const updated =
        findFarmerById(
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
  (
    req,
    res
  ) => {

    try {

      const centers =
        db.prepare(`
          SELECT *
          FROM centers
          ORDER BY name ASC
        `).all();


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
   CREATE CENTER
========================================================= */

app.post(
  "/api/centers",
  (
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
        db.prepare(`
          SELECT *
          FROM centers
          WHERE id = ?
        `).get(
          id
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


      db.prepare(`
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
          @id,
          @name,
          @state_id,
          @district_id,
          @mandal_id,
          @village,
          @address,
          @manager_name,
          @manager_phone,
          @capacity,
          @opening_time,
          @closing_time,
          @active
        )
      `).run({

        id,

        name,

        state_id:
          stateId ||
          null,

        district_id:
          districtId ||
          null,

        mandal_id:
          mandalId ||
          null,

        village:
          village ||
          null,

        address:
          address ||
          null,

        manager_name:
          managerName ||
          null,

        manager_phone:
          managerPhone ||
          null,

        capacity,

        opening_time:
          openingTime,

        closing_time:
          closingTime,

        active,

      });


      const created =
        db.prepare(`
          SELECT *
          FROM centers
          WHERE id = ?
        `).get(
          id
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
        "SQLITE_CONSTRAINT_UNIQUE"
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
  (
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
        db.prepare(`
          SELECT *
          FROM centers
          WHERE id = ?
        `).get(
          centerId
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


      db.prepare(`
        UPDATE centers
        SET
          name = ?,
          state_id = ?,
          district_id = ?,
          mandal_id = ?,
          village = ?,
          address = ?,
          manager_name = ?,
          manager_phone = ?,
          capacity = ?,
          opening_time = ?,
          closing_time = ?,
          active = ?
        WHERE id = ?
      `).run(

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

      );


      const updated =
        db.prepare(`
          SELECT *
          FROM centers
          WHERE id = ?
        `).get(
          centerId
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
   BOOKINGS - LIST
========================================================= */

app.get(
  "/api/bookings",
  (
    req,
    res
  ) => {

    try {

      const bookings =
        db.prepare(`
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
            datetime(
              b.created_at
            ) DESC,
            b.id DESC
        `).all();


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
        db.prepare(`
          SELECT *
          FROM bookings
          WHERE id = ?
        `).get(
          id
        );


      if (
        existingBooking
      ) {

        return res.json({

          success:
            true,

          booking:
            getBookingById(
              id
            ),

          alreadyExists:
            true,

          smsStatus:
            "ALREADY_EXISTS",

        });

      }


      const farmer =
        resolveFarmer({

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
        getSettings();


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
        db.prepare(`
          SELECT *
          FROM centers
          WHERE id = ?
        `).get(
          centerId
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
          center.capacity_per_slot ||
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
        db.prepare(`
          SELECT COUNT(*) AS count
          FROM bookings
          WHERE
            center_id = ?
            AND date = ?
            AND slot_start = ?
            AND slot_end = ?
            AND status != 'PAYMENT_SENT'
        `).get(

          centerId,

          date,

          slotStart,

          slotEnd

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


      const transaction =
        db.transaction(
          () => {

            db.prepare(`
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
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                NULL,
                ?,
                ?,
                ?,
                'CONFIRMED',
                NULL
              )
            `).run(

              id,

              token,

              farmer.id,

              centerId,

              crop,

              estimatedQuantity,

              date,

              slotStart,

              slotEnd

            );


            db.prepare(`
              INSERT INTO status_events (
                booking_id,
                status
              )
              VALUES (
                ?,
                'CONFIRMED'
              )
            `).run(
              id
            );

          }
        );


      transaction();


      console.log(
        "BOOKING DATABASE INSERTED:",
        id
      );


      const settingsAfterInsert =
        getSettings();


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


      /*
         SMS failure can never break this request.
      */

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


      const created =
        getBookingById(
          id
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
        "SQLITE_CONSTRAINT_UNIQUE"
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
  (
    req,
    res
  ) => {

    try {

      const booking =
        getBookingById(
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
        db.prepare(`
          SELECT
            id,
            booking_id,
            status,
            created_at
          FROM status_events
          WHERE booking_id = ?
          ORDER BY
            datetime(created_at) ASC,
            id ASC
        `).all(
          req.params.id
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
        db.prepare(`
          SELECT
            b.*,
            f.phone AS farmer_phone
          FROM bookings b
          LEFT JOIN farmers f
            ON f.id = b.farmer_id
          WHERE b.id = ?
        `).get(
          bookingId
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
            getBookingById(
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


      db.prepare(`
        UPDATE bookings
        SET status = ?
        WHERE id = ?
      `).run(

        nextStatus,

        bookingId

      );


      db.prepare(`
        INSERT INTO status_events (
          booking_id,
          status
        )
        VALUES (?, ?)
      `).run(

        bookingId,

        nextStatus

      );


      const settings =
        getSettings();


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
          getBookingById(
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
        db.prepare(`
          SELECT
            b.*,
            f.phone AS farmer_phone
          FROM bookings b
          LEFT JOIN farmers f
            ON f.id = b.farmer_id
          WHERE b.id = ?
        `).get(
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


      db.prepare(`
        UPDATE bookings
        SET
          actual_quantity = ?,
          quality = ?,
          status = 'WEIGHING'
        WHERE id = ?
      `).run(

        actualQuantity,

        quality,

        req.params.id

      );


      db.prepare(`
        INSERT INTO status_events (
          booking_id,
          status
        )
        VALUES (?, 'WEIGHING')
      `).run(
        req.params.id
      );


      const settings =
        getSettings();


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
          getBookingById(
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
        db.prepare(`
          SELECT
            b.*,
            f.phone AS farmer_phone
          FROM bookings b
          LEFT JOIN farmers f
            ON f.id = b.farmer_id
          WHERE b.id = ?
        `).get(
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


      const transaction =
        db.transaction(
          () => {

            db.prepare(`
              UPDATE bookings
              SET status = 'PAYMENT_PENDING'
              WHERE id = ?
            `).run(
              req.params.id
            );


            db.prepare(`
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
                ?,
                ?,
                NULL,
                NULL,
                'PAYMENT_PENDING',
                ?,
                ?,
                CURRENT_TIMESTAMP,
                'NOT_SENT',
                NULL
              )
            `).run(

              req.params.id,

              payableAmount,

              rate,

              notes ||
                `Procurement rate: ₹${rate}/kg. Adjustment: ₹${adjustment}.`

            );


            db.prepare(`
              INSERT INTO status_events (
                booking_id,
                status
              )
              VALUES (?, 'PROCURED')
            `).run(
              req.params.id
            );


            db.prepare(`
              INSERT INTO status_events (
                booking_id,
                status
              )
              VALUES (?, 'PAYMENT_PENDING')
            `).run(
              req.params.id
            );

          }
        );


      transaction();


      const settings =
        getSettings();


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
          getBookingById(
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
        db.prepare(`
          SELECT
            b.*,
            f.name AS farmer_name,
            f.phone AS farmer_phone
          FROM bookings b
          LEFT JOIN farmers f
            ON f.id = b.farmer_id
          WHERE b.id = ?
        `).get(
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
        db.prepare(`
          SELECT *
          FROM payments
          WHERE booking_id = ?
          ORDER BY id DESC
          LIMIT 1
        `).get(
          req.params.id
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


      const transaction =
        db.transaction(
          () => {

            if (
              existingPayment
            ) {

              db.prepare(`
                UPDATE payments
                SET
                  amount = ?,
                  method = ?,
                  reference = ?,
                  status = 'PAYMENT_SENT',
                  notes = ?,
                  updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
              `).run(

                amount,

                method,

                reference,

                notes ||
                  null,

                existingPayment.id

              );

            } else {

              db.prepare(`
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
                  ?,
                  ?,
                  ?,
                  ?,
                  'PAYMENT_SENT',
                  NULL,
                  ?,
                  CURRENT_TIMESTAMP,
                  'NOT_SENT',
                  NULL
                )
              `).run(

                req.params.id,

                amount,

                method,

                reference,

                notes ||
                  null

              );

            }


            db.prepare(`
              UPDATE bookings
              SET status = 'PAYMENT_SENT'
              WHERE id = ?
            `).run(
              req.params.id
            );


            db.prepare(`
              INSERT INTO status_events (
                booking_id,
                status
              )
              VALUES (?, 'PAYMENT_SENT')
            `).run(
              req.params.id
            );

          }
        );


      transaction();


      const settings =
        getSettings();


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


      /*
         This message is kept for
         KrishiSetu notification storage.

         It is NOT passed to Twilio.
      */

      const paymentMessage =
        `KrishiSetu payment of ₹${amount} for token ${booking.token} has been sent. Reference: ${reference}.`;


      console.log(
        "PAYMENT SMS PREPARATION:",
        {

          bookingId:
            req.params.id,

          farmerId:
            booking.farmer_id,

          phone:
            booking.farmer_phone,

          paymentSmsSetting:
            settings.paymentSms,

          smsEnabled:
            settings.smsEnabled,

          SMS_ENABLED,

          shouldSendSms,

        }
      );


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
        db.prepare(`
          SELECT *
          FROM payments
          WHERE booking_id = ?
          ORDER BY id DESC
          LIMIT 1
        `).get(
          req.params.id
        );


      if (
        savedPaymentBeforeSmsUpdate
      ) {

        db.prepare(`
          UPDATE payments
          SET
            sms_status = ?,
            sms_sent_at = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(

          notification.status,

          notification.sentAt,

          savedPaymentBeforeSmsUpdate.id

        );

      }


      const savedPayment =
        db.prepare(`
          SELECT *
          FROM payments
          WHERE booking_id = ?
          ORDER BY id DESC
          LIMIT 1
        `).get(
          req.params.id
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
  (
    req,
    res
  ) => {

    try {

      const booking =
        db.prepare(`
          SELECT id
          FROM bookings
          WHERE id = ?
        `).get(
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


      const payments =
        db.prepare(`
          SELECT *
          FROM payments
          WHERE booking_id = ?
          ORDER BY id DESC
        `).all(
          req.params.id
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
  (
    req,
    res
  ) => {

    try {

      const booking =
        db.prepare(`
          SELECT id
          FROM bookings
          WHERE id = ?
        `).get(
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


      const events =
        db.prepare(`
          SELECT
            id,
            booking_id,
            status,
            created_at
          FROM status_events
          WHERE booking_id = ?
          ORDER BY
            datetime(created_at) ASC,
            id ASC
        `).all(
          req.params.id
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
  (
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
        resolveFarmer({

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
        db.prepare(`
          SELECT
            id,
            farmer_id,
            token,
            status
          FROM bookings
          WHERE id = ?
        `).get(
          bookingId
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


      const result =
        db.prepare(`
          INSERT INTO payment_issues (
            farmer_id,
            booking_id,
            message,
            status
          )
          VALUES (
            ?,
            ?,
            ?,
            'OPEN'
          )
        `).run(

          farmer.id,

          bookingId,

          message

        );


      res.status(201).json({

        success:
          true,

        message:
          "Payment issue reported successfully.",

        issue: {

          id:
            result.lastInsertRowid,

          farmerId:
            farmer.id,

          bookingId,

          status:
            "OPEN",

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
  (
    req,
    res
  ) => {

    try {

      const issues =
        db.prepare(`
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

            datetime(
              pi.created_at
            ) DESC,

            pi.id DESC
        `).all();


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
  (
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
        db.prepare(`
          SELECT *
          FROM payment_issues
          WHERE id = ?
        `).get(
          issueId
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


      db.prepare(`
        UPDATE payment_issues
        SET status = ?
        WHERE id = ?
      `).run(

        status,

        issueId

      );


      const updated =
        db.prepare(`
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

          WHERE pi.id = ?
        `).get(
          issueId
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
  (
    req,
    res
  ) => {

    try {

      const total =
        db.prepare(`
          SELECT COUNT(*) AS count
          FROM bookings
        `).get().count;


      const confirmed =
        db.prepare(`
          SELECT COUNT(*) AS count
          FROM bookings
          WHERE status = 'CONFIRMED'
        `).get().count;


      const arrived =
        db.prepare(`
          SELECT COUNT(*) AS count
          FROM bookings
          WHERE status = 'ARRIVED'
        `).get().count;


      const late =
        db.prepare(`
          SELECT COUNT(*) AS count
          FROM bookings
          WHERE status = 'LATE'
        `).get().count;


      const weighing =
        db.prepare(`
          SELECT COUNT(*) AS count
          FROM bookings
          WHERE status = 'WEIGHING'
        `).get().count;


      const procured =
        db.prepare(`
          SELECT COUNT(*) AS count
          FROM bookings
          WHERE status IN (
            'PROCURED',
            'PAYMENT_PENDING',
            'PAYMENT_SENT'
          )
        `).get().count;


      const paymentPending =
        db.prepare(`
          SELECT COUNT(*) AS count
          FROM bookings
          WHERE status = 'PAYMENT_PENDING'
        `).get().count;


      const paymentSent =
        db.prepare(`
          SELECT COUNT(*) AS count
          FROM bookings
          WHERE status = 'PAYMENT_SENT'
        `).get().count;


      const totalPaid =
        db.prepare(`
          SELECT
            COALESCE(
              SUM(amount),
              0
            ) AS amount
          FROM payments
          WHERE status = 'PAYMENT_SENT'
        `).get().amount;


      const pendingAmount =
        db.prepare(`
          SELECT
            COALESCE(
              SUM(amount),
              0
            ) AS amount
          FROM payments
          WHERE status = 'PAYMENT_PENDING'
        `).get().amount;


      const openPaymentIssues =
        db.prepare(`
          SELECT COUNT(*) AS count
          FROM payment_issues
          WHERE status = 'OPEN'
        `).get().count;


      res.json({

        success:
          true,

        summary: {

          total,

          confirmed,

          arrived,

          late,

          weighing,

          procured,

          paymentPending,

          paymentSent,

          totalPaid,

          pendingAmount,

          openPaymentIssues,

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
  (
    req,
    res
  ) => {

    try {

      res.json({

        success:
          true,

        settings:
          getSettings(),

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
  (
    req,
    res
  ) => {

    try {

      const current =
        getSettings();


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


      saveSettings(
        next
      );


      res.json({

        success:
          true,

        message:
          "System settings saved.",

        settings:
          getSettings(),

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
  (
    req,
    res
  ) => {

    try {

      saveSettings(
        DEFAULT_SETTINGS
      );


      res.json({

        success:
          true,

        message:
          "System settings reset to defaults.",

        settings:
          getSettings(),

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
  (
    req,
    res
  ) => {

    try {

      const events =
        db.prepare(`
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
            datetime(
              se.created_at
            ) DESC,
            se.id DESC
        `).all();


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
   FARMER NOTIFICATIONS
========================================================= */

app.get(
  "/api/farmers/:id/notifications",
  (
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
        findFarmerById(
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
          findFarmerByPhone(
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
        db.prepare(`
          SELECT *
          FROM notifications
          WHERE farmer_id = ?
          ORDER BY
            datetime(
              created_at
            ) DESC,
            id DESC
        `).all(
          farmer.id
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
  (
    req,
    res
  ) => {

    try {

      const result =
        db.prepare(`
          UPDATE notifications
          SET read_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(
          req.params.id
        );


      res.json({

        success:
          true,

        updated:
          result.changes >
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
   START SERVER
========================================================= */

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