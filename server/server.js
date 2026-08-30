import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import db from "./db.js";

dotenv.config();


const app =
  express();


const PORT =
  process.env.PORT ||
  5000;


const SMS_ENABLED =
  process.env.SMS_ENABLED ===
  "true";


app.use(cors());
app.use(
  express.json()
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


try {

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
    const row
    of rows
  ) {

    try {

      settings[
        row.key
      ] =
        JSON.parse(
          row.value
        );

    } catch {

      settings[
        row.key
      ] =
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
    value || ""
  ).replace(
    /\D/g,
    ""
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
    ] || []
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

    ARRIVED:
      "Arrival recorded",

    LATE:
      "Late arrival recorded",

    WEIGHING:
      "Weighing started",

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

async function sendSms(
  number,
  message
) {

  const accountSid =
    process.env.TWILIO_ACCOUNT_SID;


  const apiKey =
    process.env.TWILIO_API_KEY;


  const apiSecret =
    process.env.TWILIO_API_SECRET;


  const from =
    process.env.TWILIO_PHONE_NUMBER;


  if (
    !SMS_ENABLED ||
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
        "SMS disabled or Twilio credentials missing.",

    };

  }


  const twilio =
    (
      await import("twilio")
    ).default;


  const client =
    twilio(
      apiKey,
      apiSecret,
      {
        accountSid,
      }
    );


  const cleanedNumber =
    String(
      number || ""
    )
      .replace(
        /\D/g,
        ""
      );


  let recipient =
    cleanedNumber;


  if (
    cleanedNumber.length ===
    10
  ) {

    recipient =
      `+91${cleanedNumber}`;

  } else if (
    cleanedNumber.length ===
      12 &&
    cleanedNumber.startsWith(
      "91"
    )
  ) {

    recipient =
      `+${cleanedNumber}`;

  }


  let template =
    "sms_event_notifications";


  const lowerMessage =
    String(
      message || ""
    ).toLowerCase();


  if (
    lowerMessage.includes(
      "booking"
    )
  ) {

    template =
      "sms_order_confirmation";

  } else if (
    lowerMessage.includes(
      "payment"
    )
  ) {

    template =
      "sms_account_alerts";

  } else if (
    lowerMessage.includes(
      "arrived"
    ) ||
    lowerMessage.includes(
      "weigh"
    ) ||
    lowerMessage.includes(
      "procurement"
    )
  ) {

    template =
      "sms_delivery_updates";

  }


  const response =
    await client.messages.create({

      to:
        recipient,

      from:
        from,

      body:
        template,

    });


  return {

    sent:
      true,

    status:
      "SENT",

    data: {

      sid:
        response.sid,

      status:
        response.status,

      template,

    },

  };

}


/* =========================================================
   NOTIFICATIONS
========================================================= */

async function createNotification({

  farmerId,

  bookingId =
    null,

  type,

  title,

  message,

  sms =
    false,

  phone =
    null,

}) {

  const initialStatus =
    sms
      ? "CREATED"
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

      sms
        ? "SMS"
        : "IN_APP",

      initialStatus,

    );


  let smsStatus =
    sms
      ? "NOT_SENT"
      : "DELIVERED";


  let sentAt =
    null;


  let providerResponse =
    null;


  if (
    sms &&
    phone
  ) {

    try {

      const smsResult =
        await sendSms(
          phone,
          message
        );


      smsStatus =
        smsResult.status ||
        "SENT";


      sentAt =
        smsStatus ===
        "SENT"
          ? new Date().toISOString()
          : null;


      providerResponse =
        smsResult.data
          ? JSON.stringify(
              smsResult.data
            )
          : null;


    } catch (
      error
    ) {

      console.warn(
        "Notification SMS failed:",
        error
      );


      smsStatus =
        "FAILED";


      providerResponse =
        error?.message ||
        null;

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

    smsStatus,

    sentAt,

    providerResponse,

    result.lastInsertRowid,

  );


  return {

    id:
      result.lastInsertRowid,

    status:
      smsStatus,

    sentAt,

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

      const farmer =
        req.body ||
        {};


      const id =
        String(
          farmer.id ||
          ""
        ).trim();


      const name =
        String(
          farmer.name ||
          ""
        ).trim();


      const phone =
        normalisePhone(
          farmer.phone
        );


      if (
        !id ||
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
              "Farmer id, name and valid 10-digit phone are required.",

          });

      }


      const existingByPhone =
        db.prepare(`
          SELECT *
          FROM farmers
          WHERE phone = ?
        `).get(
          phone
        );


      if (
        existingByPhone &&
        existingByPhone.id !==
          id
      ) {

        db.prepare(`
          UPDATE farmers
          SET
            name = ?,
            state_id = ?,
            district_id = ?,
            mandal_id = ?,
            village = ?,
            language = ?,
            preferred_center_id = ?,
            primary_crop = ?,
            estimated_quantity = ?
          WHERE phone = ?
        `).run(

          name,

          farmer.stateId ||
            null,

          farmer.districtId ||
            null,

          farmer.mandalId ||
            null,

          farmer.village ||
            null,

          farmer.language ||
            "en",

          farmer.preferredCenterId ||
            null,

          farmer.primaryCrop ||
            null,

          Number(
            farmer.estimatedQuantity ||
            0
          ),

          phone,

        );


        const saved =
          db.prepare(`
            SELECT *
            FROM farmers
            WHERE phone = ?
          `).get(
            phone
          );


        return res.json({

          success:
            true,

          message:
            "Farmer already existed and was updated.",

          farmer:
            saved,

        });

      }


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
          @id,
          @name,
          @phone,
          @state_id,
          @district_id,
          @mandal_id,
          @village,
          @language,
          @preferred_center_id,
          @primary_crop,
          @estimated_quantity
        )
        ON CONFLICT(id)
        DO UPDATE SET
          name = excluded.name,
          phone = excluded.phone,
          state_id = excluded.state_id,
          district_id = excluded.district_id,
          mandal_id = excluded.mandal_id,
          village = excluded.village,
          language = excluded.language,
          preferred_center_id = excluded.preferred_center_id,
          primary_crop = excluded.primary_crop,
          estimated_quantity = excluded.estimated_quantity
      `).run({

        id,

        name,

        phone,

        state_id:
          farmer.stateId ||
          null,

        district_id:
          farmer.districtId ||
          null,

        mandal_id:
          farmer.mandalId ||
          null,

        village:
          farmer.village ||
          null,

        language:
          farmer.language ||
          "en",

        preferred_center_id:
          farmer.preferredCenterId ||
          null,

        primary_crop:
          farmer.primaryCrop ||
          null,

        estimated_quantity:
          Number(
            farmer.estimatedQuantity ||
            0
          ),

      });


      const saved =
        db.prepare(`
          SELECT *
          FROM farmers
          WHERE id = ?
        `).get(
          id
        );


      res.status(201).json({

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
        "Create farmer error:",
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


      res.status(500).json({

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
   FARMER SETTINGS UPDATE
========================================================= */

app.patch(
  "/api/farmers/:id",
  (
    req,
    res
  ) => {

    try {

      const farmerId =
        String(
          req.params.id ||
          ""
        ).trim();


      const existing =
        db.prepare(`
          SELECT *
          FROM farmers
          WHERE id = ?
        `).get(
          farmerId
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
        db.prepare(`
          SELECT id
          FROM farmers
          WHERE phone = ?
            AND id != ?
        `).get(
          phone,
          farmerId
        );


      if (
        otherFarmer
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

        farmerId,

      );


      const updated =
        db.prepare(`
          SELECT *
          FROM farmers
          WHERE id = ?
        `).get(
          farmerId
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


app.get(
  "/api/farmers/:id",
  (
    req,
    res
  ) => {

    try {

      const farmer =
        db.prepare(`
          SELECT *
          FROM farmers
          WHERE id = ?
        `).get(
          req.params.id
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

          ORDER BY datetime(b.created_at) DESC
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


      const farmerId =
        String(
          farmerData.id ||
          ""
        ).trim();


      const phone =
        normalisePhone(
          farmerData.phone
        );


      if (
        !id ||
        !token ||
        (
          !farmerId &&
          phone.length !==
            10
        )
      ) {

        return res
          .status(400)
          .json({

            success:
              false,

            message:
              "Booking id, token and farmer identity are required.",

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

        });

      }


      let farmer =
        null;


      if (
        farmerId
      ) {

        farmer =
          db.prepare(`
            SELECT *
            FROM farmers
            WHERE id = ?
          `).get(
            farmerId
          );

      }


      if (
        !farmer &&
        phone.length ===
          10
      ) {

        farmer =
          db.prepare(`
            SELECT *
            FROM farmers
            WHERE phone = ?
          `).get(
            phone
          );

      }


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

          slotEnd,

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
                @id,
                @token,
                @farmer_id,
                @center_id,
                @crop,
                @estimated_quantity,
                NULL,
                @date,
                @slot_start,
                @slot_end,
                'CONFIRMED',
                NULL
              )
            `).run({

              id,

              token,

              farmer_id:
                farmer.id,

              center_id:
                centerId,

              crop,

              estimated_quantity:
                estimatedQuantity,

              date,

              slot_start:
                slotStart,

              slot_end:
                slotEnd,

            });


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


      const created =
        getBookingById(
          id
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
            settings.bookingConfirmationSms &&
            settings.smsEnabled &&
            SMS_ENABLED,

          phone:
            farmer.phone,

        });


      res.status(201).json({

        success:
          true,

        booking:
          created,

        smsStatus:
          notification.status,

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


      res.status(500).json({

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
        req.params.id;


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


      const transaction =
        db.transaction(
          () => {

            db.prepare(`
              UPDATE bookings
              SET status = ?
              WHERE id = ?
            `).run(

              nextStatus,

              bookingId,

            );


            db.prepare(`
              INSERT INTO status_events (
                booking_id,
                status
              )
              VALUES (?, ?)
            `).run(

              bookingId,

              nextStatus,

            );

          }
        );


      transaction();


      const settings =
        getSettings();


      let notification =
        null;


      if (
        nextStatus !==
        "PAYMENT_SENT"
      ) {

        notification =
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
              settings.smsEnabled &&
              SMS_ENABLED &&
              Boolean(
                booking.farmer_phone
              ),

            phone:
              booking.farmer_phone,

          });

      }


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
          notification?.status ||
          "NOT_SENT",

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


      const transaction =
        db.transaction(
          () => {

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

              req.params.id,

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

          }
        );


      transaction();


      const settings =
        getSettings();


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
            settings.smsEnabled &&
            SMS_ENABLED &&
            Boolean(
              booking.farmer_phone
            ),

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
                `Procurement rate: ₹${rate}/kg. Adjustment: ₹${adjustment}.`,

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
            settings.procurementSms !==
              false &&
            settings.smsEnabled &&
            SMS_ENABLED &&
            Boolean(
              booking.farmer_phone
            ),

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

                existingPayment.id,

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
                  null,

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
            `KrishiSetu payment of ₹${amount} for token ${booking.token} has been sent. Reference: ${reference}.`,

          sms:
            settings.paymentSms !==
              false &&
            settings.smsEnabled &&
            SMS_ENABLED &&
            Boolean(
              booking.farmer_phone
            ),

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

        savedPaymentBeforeSmsUpdate.id,

      );


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
        db.prepare(`
          SELECT id
          FROM farmers
          WHERE id = ?
        `).get(
          farmerId
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
          farmerId
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
          VALUES (?, ?, ?, 'OPEN')
        `).run(

          farmerId,

          bookingId,

          message,

        );


      res.status(201).json({

        success:
          true,

        message:
          "Payment issue reported successfully.",

        issue: {

          id:
            result.lastInsertRowid,

          farmerId,

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
            datetime(pi.created_at) DESC,
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

        issueId,

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
   SYSTEM SETTINGS
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

      const incoming =
        req.body ||
        {};


      const current =
        getSettings();


      const next = {

        ...current,

        ...incoming,

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
            datetime(se.created_at) DESC,
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

      const notifications =
        db.prepare(`
          SELECT *
          FROM notifications
          WHERE farmer_id = ?
          ORDER BY
            datetime(created_at) DESC,
            id DESC
        `).all(
          req.params.id
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


app.patch(
  "/api/notifications/:id/read",
  (
    req,
    res
  ) => {

    try {

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
      `KrishiSetu backend running on port ${PORT}`
    );


    console.log(
      `SMS mode: ${
        SMS_ENABLED
          ? "ENABLED"
          : "DEMO / DISABLED"
      }`
    );

  }
);