import Database from "better-sqlite3";

const db =
  new Database("krishisetu.db");


db.pragma(
  "journal_mode = WAL"
);


/* =========================================================
   TABLES
========================================================= */

db.exec(`
  CREATE TABLE IF NOT EXISTS farmers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    state_id TEXT,
    district_id TEXT,
    mandal_id TEXT,
    village TEXT,
    language TEXT DEFAULT 'en',
    preferred_center_id TEXT,
    primary_crop TEXT,
    estimated_quantity REAL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );


  CREATE TABLE IF NOT EXISTS centers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    state_id TEXT,
    district_id TEXT,
    mandal_id TEXT,
    village TEXT,
    address TEXT,
    manager_name TEXT,
    manager_phone TEXT,
    capacity INTEGER DEFAULT 20,
    active INTEGER DEFAULT 1,
    opening_time TEXT DEFAULT '09:00',
    closing_time TEXT DEFAULT '17:00',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );


  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    token TEXT NOT NULL UNIQUE,
    farmer_id TEXT NOT NULL,
    center_id TEXT,
    crop TEXT,
    estimated_quantity REAL,
    actual_quantity REAL,
    date TEXT,
    slot_start TEXT,
    slot_end TEXT,
    status TEXT DEFAULT 'CONFIRMED',
    quality TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (farmer_id)
      REFERENCES farmers(id),

    FOREIGN KEY (center_id)
      REFERENCES centers(id)
  );


  CREATE TABLE IF NOT EXISTS status_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (booking_id)
      REFERENCES bookings(id)
  );


  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id TEXT NOT NULL,
    amount REAL,
    method TEXT,
    reference TEXT,
    status TEXT DEFAULT 'NOT_STARTED',
    rate_per_kg REAL,
    notes TEXT,
    updated_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (booking_id)
      REFERENCES bookings(id)
  );


  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);


/* =========================================================
   SAFE MIGRATIONS
========================================================= */

function addColumnIfMissing(
  table,
  column,
  definition
) {

  const columns =
    db.prepare(
      `PRAGMA table_info(${table})`
    ).all();


  const exists =
    columns.some(
      (item) =>
        item.name === column
    );


  if (
    !exists
  ) {

    db.exec(
      `ALTER TABLE ${table}
       ADD COLUMN ${column}
       ${definition}`
    );


    console.log(
      `Added missing column ${table}.${column}`
    );

  }

}


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
/* =========================================================
   SEED PROCUREMENT CENTERS
========================================================= */

const centerSeed = [

  {
    id: "main",
    name: "Main Procurement Center",
    state_id: "ts",
    district_id: "hyd",
    mandal_id: "serilingampally",
    village: "Gachibowli",
    address: "Main Road, Serilingampally",
    manager_name: "Main Center Manager",
    manager_phone: "+91 98765 43210",
    capacity: 20,
    active: 1,
    opening_time: "08:00 AM",
    closing_time: "05:00 PM",
  },

  {
    id: "north",
    name: "North Procurement Center",
    state_id: "ts",
    district_id: "hyd",
    mandal_id: "rajendranagar",
    village: "Attapur",
    address: "North Market Yard, Rajendranagar",
    manager_name: "North Center Manager",
    manager_phone: "+91 98765 43310",
    capacity: 15,
    active: 1,
    opening_time: "08:00 AM",
    closing_time: "05:00 PM",
  },

  {
    id: "east",
    name: "East Procurement Center",
    state_id: "ap",
    district_id: "guntur",
    mandal_id: "mangalagiri",
    village: "Mangalagiri",
    address: "East Collection Point, Mangalagiri",
    manager_name: "East Center Manager",
    manager_phone: "+91 98765 43410",
    capacity: 12,
    active: 1,
    opening_time: "09:00 AM",
    closing_time: "04:00 PM",
  },

];


const insertCenter =
  db.prepare(`
    INSERT OR IGNORE INTO centers (
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
      active,
      opening_time,
      closing_time
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
      @active,
      @opening_time,
      @closing_time
    )
  `);


const seedCenters =
  db.transaction(
    () => {

      for (
        const center
        of centerSeed
      ) {

        insertCenter.run(
          center
        );

      }

    }
  );


seedCenters();

/* =========================================================
   DEFAULT SETTINGS
========================================================= */

const defaultSettings = {

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


const insertSetting =
  db.prepare(`
    INSERT OR IGNORE INTO settings (
      key,
      value
    )
    VALUES (
      ?,
      ?
    )
  `);


const seedSettings =
  db.transaction(
    () => {

      for (
        const [
          key,
          value,
        ]
        of Object.entries(
          defaultSettings
        )
      ) {

        insertSetting.run(
          key,
          JSON.stringify(
            value
          )
        );

      }

    }
  );


seedSettings();


console.log(
  "KrishiSetu database ready."
);


export default db;