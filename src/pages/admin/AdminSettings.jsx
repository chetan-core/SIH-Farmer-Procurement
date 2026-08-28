import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  AlertTriangle,
  Bell,
  CalendarClock,
  CheckCircle2,
  Database,
  Globe2,
  RefreshCw,
  RotateCcw,
  Save,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Wheat,
  X,
} from "lucide-react";

import AdminLayout from "../../components/admin/AdminLayout";


const API_URL =
  "http://localhost:5000/api";


const DEFAULT_SETTINGS = {
  bookingEnabled: true,

  maxQuantity: 5000,

  defaultCapacity: 20,

  slotDuration: 30,

  advanceBookingDays: 7,

  requireActualWeight: true,

  smsEnabled: false,

  bookingConfirmationSms: true,

  lateArrivalSms: true,

  procurementSms: true,

  paymentSms: true,

  defaultLanguage: "en",

  maintenanceMode: false,

};


function AdminSettings() {

  const [
    settings,
    setSettings,
  ] =
    useState(
      DEFAULT_SETTINGS
    );


  const [
    originalSettings,
    setOriginalSettings,
  ] =
    useState(
      DEFAULT_SETTINGS
    );


  const [
    loading,
    setLoading,
  ] =
    useState(true);


  const [
    saving,
    setSaving,
  ] =
    useState(false);


  const [
    resetting,
    setResetting,
  ] =
    useState(false);


  const [
    error,
    setError,
  ] =
    useState("");


  const [
    success,
    setSuccess,
  ] =
    useState("");


  const [
    language,
    setLanguage
  ] =
    useState(
      () =>
        localStorage.getItem(
          "krishisetu-language"
        ) || "en"
    );


  const text =
    getSettingsCopy(
      language
    );


  const hasChanges =
    JSON.stringify(
      settings
    ) !==
    JSON.stringify(
      originalSettings
    );


  const loadSettings =
    useCallback(
      async () => {

        setLoading(
          true
        );

        setError("");


        try {

          const response =
            await fetch(
              `${API_URL}/settings`
            );


          let data =
            null;


          try {

            data =
              await response.json();

          } catch {

            data =
              null;

          }


          if (
            !response.ok
          ) {

            throw new Error(
              data?.message ||
              "Unable to load system settings."
            );

          }


          const serverSettings =
            normalizeSettings(
              data?.settings
            );


          setSettings(
            serverSettings
          );


          setOriginalSettings(
            serverSettings
          );


        } catch (
          loadError
        ) {

          /*
           * During development, if the settings
           * endpoint has not yet been added, keep
           * the admin UI usable with safe defaults.
           */

          console.warn(
            "Settings API unavailable:",
            loadError
          );


          setSettings(
            DEFAULT_SETTINGS
          );


          setOriginalSettings(
            DEFAULT_SETTINGS
          );


          setError(
            loadError?.message ||
            "System settings API is unavailable. Showing defaults."
          );

        } finally {

          setLoading(
            false
          );

        }

      },
      []
    );


  useEffect(() => {

    loadSettings();


    function handleLanguageChange() {

      setLanguage(
        localStorage.getItem(
          "krishisetu-language"
        ) || "en"
      );

    }


    window.addEventListener(
      "storage",
      handleLanguageChange
    );


    return () => {

      window.removeEventListener(
        "storage",
        handleLanguageChange
      );

    };

  }, [
    loadSettings,
  ]);


  function updateSetting(
    key,
    value
  ) {

    setSettings(
      (
        current
      ) => ({

        ...current,

        [key]:
          value,

      })
    );


    setSuccess("");


    setError("");

  }


  async function saveSettings() {

    setSaving(
      true
    );

    setError("");

    setSuccess("");


    try {

      const response =
        await fetch(
          `${API_URL}/settings`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                settings
              ),

          }
        );


      let data =
        null;


      try {

        data =
          await response.json();

      } catch {

        data =
          null;

      }


      if (
        !response.ok
      ) {

        throw new Error(
          data?.message ||
          text.saveError
        );

      }


      const saved =
        normalizeSettings(
          data?.settings ||
          settings
        );


      setSettings(
        saved
      );


      setOriginalSettings(
        saved
      );


      setSuccess(
        text.saved
      );


    } catch (
      saveError
    ) {

      console.error(
        "Save settings error:",
        saveError
      );


      setError(
        saveError?.message ||
        text.saveError
      );

    } finally {

      setSaving(
        false
      );

    }

  }


  async function resetSettings() {

    const confirmed =
      window.confirm(
        text.resetConfirm
      );


    if (
      !confirmed
    ) {
      return;
    }


    setResetting(
      true
    );

    setError("");

    setSuccess("");


    try {

      const response =
        await fetch(
          `${API_URL}/settings/reset`,
          {
            method:
              "POST",
          }
        );


      let data =
        null;


      try {

        data =
          await response.json();

      } catch {

        data =
          null;

      }


      if (
        !response.ok
      ) {

        throw new Error(
          data?.message ||
          text.resetError
        );

      }


      const reset =
        normalizeSettings(
          data?.settings ||
          DEFAULT_SETTINGS
        );


      setSettings(
        reset
      );


      setOriginalSettings(
        reset
      );


      setSuccess(
        text.resetSuccess
      );


    } catch (
      resetError
    ) {

      console.error(
        "Reset settings error:",
        resetError
      );


      /*
       * Safe client fallback during prototype
       * development.
       */

      setSettings(
        DEFAULT_SETTINGS
      );


      setOriginalSettings(
        DEFAULT_SETTINGS
      );


      setError(
        resetError?.message ||
        text.resetError
      );

    } finally {

      setResetting(
        false
      );

    }

  }


  function discardChanges() {

    setSettings(
      originalSettings
    );

    setError("");

    setSuccess("");

  }


  return (

    <AdminLayout
      title={
        text.title
      }
      subtitle={
        text.subtitle
      }
    >

      <div className="admin-settings-page">


        {/* =====================================================
            HERO
        ====================================================== */}

        <section className="admin-settings-hero">


          <div>

            <span className="admin-page-eyebrow">

              {text.eyebrow}

            </span>


            <h2>
              {text.heading}
            </h2>


            <p>
              {text.description}
            </p>

          </div>


          <div className="admin-settings-hero-status">

            <div className="admin-settings-live">

              <Database
                size={14}
              />

              {text.systemControl}

            </div>

          </div>

        </section>



        {/* =====================================================
            FEEDBACK
        ====================================================== */}

        {error && (

          <div className="admin-settings-error">

            <AlertTriangle
              size={17}
            />


            <div>

              <strong>
                {text.configurationIssue}
              </strong>


              <span>
                {error}
              </span>

            </div>


            <button
              type="button"
              onClick={() =>
                setError("")
              }
            >

              <X
                size={14}
              />

            </button>

          </div>

        )}


        {success && (

          <div className="admin-settings-success">

            <CheckCircle2
              size={17}
            />


            <span>
              {success}
            </span>


            <button
              type="button"
              onClick={() =>
                setSuccess("")
              }
            >

              <X
                size={14}
              />

            </button>

          </div>

        )}



        {loading ? (

          <SettingsLoading />

        ) : (

          <>


            {/* =================================================
                STATUS
            ================================================== */}

            <section className="admin-settings-status-card">


              <div className="admin-settings-status-icon">

                <Settings2
                  size={20}
                />

              </div>


              <div className="admin-settings-status-copy">

                <span className="admin-page-eyebrow">
                  {text.systemStatus}
                </span>


                <h3>

                  {
                    settings.maintenanceMode
                      ? text.maintenanceOn
                      : settings.bookingEnabled
                        ? text.systemOperational
                        : text.bookingPaused
                  }

                </h3>


                <p>

                  {
                    settings.maintenanceMode
                      ? text.maintenanceDescription
                      : settings.bookingEnabled
                        ? text.operationalDescription
                        : text.bookingPausedDescription
                  }

                </p>

              </div>


              <div
                className={
                  `admin-settings-status-badge ${
                    settings.maintenanceMode
                      ? "warning"
                      : settings.bookingEnabled
                        ? "active"
                        : "paused"
                  }`
                }
              >

                <span />

                {
                  settings.maintenanceMode
                    ? text.maintenance
                    : settings.bookingEnabled
                      ? text.active
                      : text.paused
                }

              </div>

            </section>



            {/* =================================================
                MAIN GRID
            ================================================== */}

            <div className="admin-settings-grid">


              {/* =================================================
                  BOOKING RULES
              ================================================== */}

              <SettingsSection
                icon={
                  <CalendarClock
                    size={18}
                  />
                }
                tone="blue"
                eyebrow={
                  text.bookingRules
                }
                title={
                  text.bookingRulesTitle
                }
                description={
                  text.bookingRulesDescription
                }
              >


                <SettingToggle
                  label={
                    text.bookingEnabled
                  }
                  description={
                    text.bookingEnabledDescription
                  }
                  checked={
                    settings.bookingEnabled
                  }
                  onChange={(value) =>
                    updateSetting(
                      "bookingEnabled",
                      value
                    )
                  }
                />


                <SettingsDivider />


                <SettingNumber
                  label={
                    text.maxQuantity
                  }
                  description={
                    text.maxQuantityDescription
                  }
                  value={
                    settings.maxQuantity
                  }
                  min="1"
                  suffix="kg"
                  onChange={(value) =>
                    updateSetting(
                      "maxQuantity",
                      Number(value)
                    )
                  }
                />


                <SettingNumber
                  label={
                    text.defaultCapacity
                  }
                  description={
                    text.defaultCapacityDescription
                  }
                  value={
                    settings.defaultCapacity
                  }
                  min="1"
                  suffix={
                    text.farmers
                  }
                  onChange={(value) =>
                    updateSetting(
                      "defaultCapacity",
                      Number(value)
                    )
                  }
                />


                <SettingNumber
                  label={
                    text.slotDuration
                  }
                  description={
                    text.slotDurationDescription
                  }
                  value={
                    settings.slotDuration
                  }
                  min="5"
                  suffix={
                    text.minutes
                  }
                  onChange={(value) =>
                    updateSetting(
                      "slotDuration",
                      Number(value)
                    )
                  }
                />


                <SettingNumber
                  label={
                    text.advanceBookingDays
                  }
                  description={
                    text.advanceBookingDaysDescription
                  }
                  value={
                    settings.advanceBookingDays
                  }
                  min="0"
                  suffix={
                    text.days
                  }
                  onChange={(value) =>
                    updateSetting(
                      "advanceBookingDays",
                      Number(value)
                    )
                  }
                />

              </SettingsSection>



              {/* =================================================
                  PROCUREMENT
              ================================================== */}

              <SettingsSection
                icon={
                  <Wheat
                    size={18}
                  />
                }
                tone="green"
                eyebrow={
                  text.procurement
                }
                title={
                  text.procurementTitle
                }
                description={
                  text.procurementDescription
                }
              >


                <SettingToggle
                  label={
                    text.requireActualWeight
                  }
                  description={
                    text.requireActualWeightDescription
                  }
                  checked={
                    settings.requireActualWeight
                  }
                  onChange={(value) =>
                    updateSetting(
                      "requireActualWeight",
                      value
                    )
                  }
                />


                <SettingsDivider />


                <div className="admin-settings-info-card">

                  <div className="admin-settings-info-icon">

                    <ShieldCheck
                      size={17}
                    />

                  </div>


                  <div>

                    <strong>
                      {text.qualityControl}
                    </strong>


                    <span>
                      {text.qualityControlDescription}
                    </span>

                  </div>

                </div>


                <div className="admin-settings-info-card">

                  <div className="admin-settings-info-icon">

                    <SlidersHorizontal
                      size={17}
                    />

                  </div>


                  <div>

                    <strong>
                      {text.paymentControl}
                    </strong>


                    <span>
                      {text.paymentControlDescription}
                    </span>

                  </div>

                </div>

              </SettingsSection>



              {/* =================================================
                  NOTIFICATIONS
              ================================================== */}

              <SettingsSection
                icon={
                  <Bell
                    size={18}
                  />
                }
                tone="gold"
                eyebrow={
                  text.notifications
                }
                title={
                  text.notificationsTitle
                }
                description={
                  text.notificationsDescription
                }
              >


                <SettingToggle
                  label={
                    text.smsEnabled
                  }
                  description={
                    text.smsEnabledDescription
                  }
                  checked={
                    settings.smsEnabled
                  }
                  onChange={(value) =>
                    updateSetting(
                      "smsEnabled",
                      value
                    )
                  }
                />


                <SettingsDivider />


                <SettingToggle
                  label={
                    text.bookingSms
                  }
                  description={
                    text.bookingSmsDescription
                  }
                  checked={
                    settings.bookingConfirmationSms
                  }
                  disabled={
                    !settings.smsEnabled
                  }
                  onChange={(value) =>
                    updateSetting(
                      "bookingConfirmationSms",
                      value
                    )
                  }
                />


                <SettingToggle
                  label={
                    text.lateSms
                  }
                  description={
                    text.lateSmsDescription
                  }
                  checked={
                    settings.lateArrivalSms
                  }
                  disabled={
                    !settings.smsEnabled
                  }
                  onChange={(value) =>
                    updateSetting(
                      "lateArrivalSms",
                      value
                    )
                  }
                />


                <SettingToggle
                  label={
                    text.procurementSms
                  }
                  description={
                    text.procurementSmsDescription
                  }
                  checked={
                    settings.procurementSms
                  }
                  disabled={
                    !settings.smsEnabled
                  }
                  onChange={(value) =>
                    updateSetting(
                      "procurementSms",
                      value
                    )
                  }
                />


                <SettingToggle
                  label={
                    text.paymentSms
                  }
                  description={
                    text.paymentSmsDescription
                  }
                  checked={
                    settings.paymentSms
                  }
                  disabled={
                    !settings.smsEnabled
                  }
                  onChange={(value) =>
                    updateSetting(
                      "paymentSms",
                      value
                    )
                  }
                />

              </SettingsSection>



              {/* =================================================
                  SYSTEM
              ================================================== */}

              <SettingsSection
                icon={
                  <Globe2
                    size={18}
                  />
                }
                tone="purple"
                eyebrow={
                  text.system
                }
                title={
                  text.systemTitle
                }
                description={
                  text.systemDescription
                }
              >


                <div className="admin-settings-language-row">

                  <div>

                    <strong>
                      {text.defaultLanguage}
                    </strong>


                    <span>
                      {text.defaultLanguageDescription}
                    </span>

                  </div>


                  <select
                    value={
                      settings.defaultLanguage
                    }
                    onChange={(event) =>
                      updateSetting(
                        "defaultLanguage",
                        event.target.value
                      )
                    }
                  >

                    <option value="en">
                      English
                    </option>

                    <option value="hi">
                      हिन्दी
                    </option>

                    <option value="te">
                      తెలుగు
                    </option>

                  </select>

                </div>


                <SettingsDivider />


                <SettingToggle
                  label={
                    text.maintenanceMode
                  }
                  description={
                    text.maintenanceModeDescription
                  }
                  checked={
                    settings.maintenanceMode
                  }
                  onChange={(value) =>
                    updateSetting(
                      "maintenanceMode",
                      value
                    )
                  }
                />


                <div className="admin-settings-warning-card">

                  <AlertTriangle
                    size={17}
                  />


                  <div>

                    <strong>
                      {text.maintenanceWarningTitle}
                    </strong>


                    <span>
                      {text.maintenanceWarningDescription}
                    </span>

                  </div>

                </div>

              </SettingsSection>

            </div>



            {/* =================================================
                SAVE BAR
            ================================================== */}

            <section
              className={
                `admin-settings-save-bar ${
                  hasChanges
                    ? "has-changes"
                    : ""
                }`
              }
            >

              <div>

                <div className="admin-settings-save-icon">

                  {hasChanges ? (
                    <SlidersHorizontal
                      size={16}
                    />
                  ) : (
                    <CheckCircle2
                      size={16}
                    />
                  )}

                </div>


                <div>

                  <strong>

                    {
                      hasChanges
                        ? text.unsavedChanges
                        : text.allSaved
                    }

                  </strong>


                  <span>

                    {
                      hasChanges
                        ? text.unsavedDescription
                        : text.allSavedDescription
                    }

                  </span>

                </div>

              </div>


              <div className="admin-settings-save-actions">


                {hasChanges && (

                  <button
                    type="button"
                    className="admin-settings-discard"
                    onClick={
                      discardChanges
                    }
                    disabled={
                      saving
                    }
                  >

                    <RotateCcw
                      size={14}
                    />

                    {text.discard}

                  </button>

                )}


                <button
                  type="button"
                  className="admin-settings-save"
                  onClick={
                    saveSettings
                  }
                  disabled={
                    saving ||
                    !hasChanges
                  }
                >

                  {saving ? (

                    <RefreshCw
                      size={15}
                      className="admin-refresh-spin"
                    />

                  ) : (

                    <Save
                      size={15}
                    />

                  )}


                  {
                    saving
                      ? text.saving
                      : text.saveChanges
                  }

                </button>


                <button
                  type="button"
                  className="admin-settings-reset"
                  onClick={
                    resetSettings
                  }
                  disabled={
                    resetting ||
                    saving
                  }
                >

                  <RotateCcw
                    size={14}
                  />

                  {
                    resetting
                      ? text.resetting
                      : text.resetDefaults
                  }

                </button>

              </div>

            </section>


          </>

        )}

      </div>

    </AdminLayout>

  );
}


/* =========================================================
   SECTION
========================================================= */

function SettingsSection({
  icon,
  tone,
  eyebrow,
  title,
  description,
  children,
}) {

  return (

    <section className="admin-settings-section">


      <div className="admin-settings-section-header">


        <div
          className={
            `admin-settings-section-icon ${tone}`
          }
        >

          {icon}

        </div>


        <div>

          <span>
            {eyebrow}
          </span>


          <h3>
            {title}
          </h3>


          <p>
            {description}
          </p>

        </div>

      </div>


      <div className="admin-settings-section-body">

        {children}

      </div>

    </section>

  );
}


/* =========================================================
   TOGGLE
========================================================= */

function SettingToggle({
  label,
  description,
  checked,
  disabled = false,
  onChange,
}) {

  return (

    <label
      className={
        `admin-setting-toggle ${
          disabled
            ? "disabled"
            : ""
        }`
      }
    >

      <input
        type="checkbox"
        checked={
          checked
        }
        disabled={
          disabled
        }
        onChange={(event) =>
          onChange(
            event.target.checked
          )
        }
      />


      <span className="admin-setting-toggle-track">

        <span />

      </span>


      <div>

        <strong>
          {label}
        </strong>


        <span>
          {description}
        </span>

      </div>

    </label>

  );
}


/* =========================================================
   NUMBER
========================================================= */

function SettingNumber({
  label,
  description,
  value,
  min,
  suffix,
  onChange,
}) {

  return (

    <div className="admin-setting-number-row">


      <div>

        <strong>
          {label}
        </strong>


        <span>
          {description}
        </span>

      </div>


      <div className="admin-setting-number">

        <input
          type="number"
          value={
            value
          }
          min={
            min
          }
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
        />


        {suffix && (

          <span>
            {suffix}
          </span>

        )}

      </div>

    </div>

  );
}


/* =========================================================
   DIVIDER
========================================================= */

function SettingsDivider() {

  return (
    <div className="admin-settings-divider" />
  );

}


/* =========================================================
   LOADING
========================================================= */

function SettingsLoading() {

  return (

    <div className="admin-settings-loading">

      <div className="admin-settings-loading-status" />


      <div className="admin-settings-loading-grid">

        {[
          1,
          2,
          3,
          4,
        ].map(
          (
            item
          ) => (

            <div
              key={
                item
              }
              className="admin-settings-loading-card"
            >

              <span />
              <span />
              <span />
              <span />
              <span />

            </div>

          )
        )}

      </div>

    </div>

  );
}


/* =========================================================
   NORMALIZE
========================================================= */

function normalizeSettings(
  value
) {

  const incoming =
    value &&
    typeof value ===
      "object"
      ? value
      : {};


  return {

    ...DEFAULT_SETTINGS,

    ...incoming,

    bookingEnabled:
      incoming.bookingEnabled ??
      DEFAULT_SETTINGS.bookingEnabled,

    maxQuantity:
      Number(
        incoming.maxQuantity ??
        DEFAULT_SETTINGS.maxQuantity
      ),

    defaultCapacity:
      Number(
        incoming.defaultCapacity ??
        DEFAULT_SETTINGS.defaultCapacity
      ),

    slotDuration:
      Number(
        incoming.slotDuration ??
        DEFAULT_SETTINGS.slotDuration
      ),

    advanceBookingDays:
      Number(
        incoming.advanceBookingDays ??
        DEFAULT_SETTINGS.advanceBookingDays
      ),

    requireActualWeight:
      Boolean(
        incoming.requireActualWeight ??
        DEFAULT_SETTINGS.requireActualWeight
      ),

    smsEnabled:
      Boolean(
        incoming.smsEnabled ??
        DEFAULT_SETTINGS.smsEnabled
      ),

    bookingConfirmationSms:
      Boolean(
        incoming.bookingConfirmationSms ??
        DEFAULT_SETTINGS.bookingConfirmationSms
      ),

    lateArrivalSms:
      Boolean(
        incoming.lateArrivalSms ??
        DEFAULT_SETTINGS.lateArrivalSms
      ),

    procurementSms:
      Boolean(
        incoming.procurementSms ??
        DEFAULT_SETTINGS.procurementSms
      ),

    paymentSms:
      Boolean(
        incoming.paymentSms ??
        DEFAULT_SETTINGS.paymentSms
      ),

    defaultLanguage:
      incoming.defaultLanguage ||
      DEFAULT_SETTINGS.defaultLanguage,

    maintenanceMode:
      Boolean(
        incoming.maintenanceMode ??
        DEFAULT_SETTINGS.maintenanceMode
      ),

  };

}


/* =========================================================
   COPY
========================================================= */

function getSettingsCopy(
  language
) {

  const copy = {

    en: {

      title:
        "System Settings",

      subtitle:
        "Control global booking, procurement, notification and system behaviour.",

      eyebrow:
        "SYSTEM CONTROL",

      heading:
        "Configure how KrishiSetu operates.",

      description:
        "Centralize the rules that affect farmers, procurement operators, notifications and the overall system.",

      systemControl:
        "SYSTEM CONTROL",

      systemStatus:
        "SYSTEM STATUS",

      systemOperational:
        "System is operational",

      operationalDescription:
        "Farmer booking and administrative operations are currently enabled.",

      bookingPaused:
        "New bookings are paused",

      bookingPausedDescription:
        "Existing operational records remain available, but new farmer bookings are disabled.",

      maintenanceOn:
        "Maintenance mode is active",

      maintenanceDescription:
        "Use this mode when the system should temporarily stop normal farmer-facing operations.",

      active:
        "ACTIVE",

      paused:
        "PAUSED",

      maintenance:
        "MAINTENANCE",

      configurationIssue:
        "Configuration issue",

      bookingRules:
        "BOOKING RULES",

      bookingRulesTitle:
        "Control farmer booking behaviour",

      bookingRulesDescription:
        "Set the limits and timing rules used when farmers create procurement bookings.",

      bookingEnabled:
        "Allow new bookings",

      bookingEnabledDescription:
        "Farmers can create new procurement bookings.",

      maxQuantity:
        "Maximum quantity",

      maxQuantityDescription:
        "Maximum produce quantity allowed in one booking.",

      defaultCapacity:
        "Default slot capacity",

      defaultCapacityDescription:
        "Fallback number of farmers allowed in a slot.",

      slotDuration:
        "Slot duration",

      slotDurationDescription:
        "Default length of each arrival window.",

      advanceBookingDays:
        "Advance booking window",

      advanceBookingDaysDescription:
        "How many days ahead farmers can book.",

      farmers:
        "farmers",

      minutes:
        "minutes",

      days:
        "days",

      procurement:
        "PROCUREMENT",

      procurementTitle:
        "Control procurement verification",

      procurementDescription:
        "Define the minimum information needed before procurement can be completed.",

      requireActualWeight:
        "Require actual weight",

      requireActualWeightDescription:
        "Prevent procurement completion until actual produce weight has been recorded.",

      qualityControl:
        "Quality verification",

      qualityControlDescription:
        "Operators record produce quality during weighing before completing procurement.",

      paymentControl:
        "Payment workflow",

      paymentControlDescription:
        "Payments remain separate from procurement so the operator can review the final amount before sending it.",

      notifications:
        "NOTIFICATIONS",

      notificationsTitle:
        "Control farmer communications",

      notificationsDescription:
        "Choose which operational events can generate SMS notifications.",

      smsEnabled:
        "Enable SMS notifications",

      smsEnabledDescription:
        "Allow the system to send operational notifications through the configured SMS provider.",

      bookingSms:
        "Booking confirmation SMS",

      bookingSmsDescription:
        "Send the farmer their booking token, date, time and center.",

      lateSms:
        "Late-arrival SMS",

      lateSmsDescription:
        "Notify the farmer when their booking is marked late.",

      procurementSms:
        "Procurement completion SMS",

      procurementSmsDescription:
        "Notify the farmer when weighing and procurement are completed.",

      paymentSms:
        "Payment SMS",

      paymentSmsDescription:
        "Notify the farmer after a payment is marked as sent.",

      system:
        "SYSTEM",

      systemTitle:
        "Global system behaviour",

      systemDescription:
        "Configure the default language and emergency operating mode.",

      defaultLanguage:
        "Default language",

      defaultLanguageDescription:
        "Language used when no user-specific preference is available.",

      maintenanceMode:
        "Maintenance mode",

      maintenanceModeDescription:
        "Temporarily pause normal system operations.",

      maintenanceWarningTitle:
        "Use maintenance mode carefully",

      maintenanceWarningDescription:
        "This is a system-wide control. Keep it disabled during normal operations.",

      unsavedChanges:
        "You have unsaved changes",

      unsavedDescription:
        "Review the configuration before saving it to the system.",

      allSaved:
        "All settings are saved",

      allSavedDescription:
        "The current configuration matches the saved system configuration.",

      discard:
        "Discard",

      saveChanges:
        "Save Changes",

      saving:
        "Saving...",

      resetDefaults:
        "Reset Defaults",

      resetting:
        "Resetting...",

      saved:
        "System settings saved successfully.",

      saveError:
        "Unable to save system settings.",

      resetConfirm:
        "Reset all system settings to their default values?",

      resetSuccess:
        "System settings were reset to defaults.",

      resetError:
        "Unable to reset system settings.",

    },


    hi: {

      title:
        "सिस्टम सेटिंग्स",

      subtitle:
        "बुकिंग, खरीद, नोटिफिकेशन और सिस्टम व्यवहार को नियंत्रित करें।",

      eyebrow:
        "सिस्टम नियंत्रण",

      heading:
        "KrishiSetu कैसे काम करता है, कॉन्फ़िगर करें।",

      description:
        "किसान, खरीद ऑपरेटर, नोटिफिकेशन और पूरे सिस्टम को प्रभावित करने वाले नियम एक जगह नियंत्रित करें।",

      systemControl:
        "सिस्टम नियंत्रण",

      systemStatus:
        "सिस्टम स्थिति",

      systemOperational:
        "सिस्टम चालू है",

      operationalDescription:
        "किसान बुकिंग और प्रशासनिक संचालन अभी सक्रिय हैं।",

      bookingPaused:
        "नई बुकिंग रुकी हुई हैं",

      bookingPausedDescription:
        "मौजूदा रिकॉर्ड उपलब्ध रहेंगे, लेकिन नई किसान बुकिंग बंद हैं।",

      maintenanceOn:
        "मेंटेनेंस मोड सक्रिय है",

      maintenanceDescription:
        "जब सामान्य किसान संचालन अस्थायी रूप से रोकना हो तब इसका उपयोग करें।",

      active:
        "सक्रिय",

      paused:
        "रुका हुआ",

      maintenance:
        "मेंटेनेंस",

      configurationIssue:
        "कॉन्फ़िगरेशन समस्या",

      bookingRules:
        "बुकिंग नियम",

      bookingRulesTitle:
        "किसान बुकिंग व्यवहार नियंत्रित करें",

      bookingRulesDescription:
        "किसान बुकिंग बनाते समय उपयोग होने वाली सीमाएं और समय नियम सेट करें।",

      bookingEnabled:
        "नई बुकिंग की अनुमति दें",

      bookingEnabledDescription:
        "किसान नई खरीद बुकिंग बना सकते हैं।",

      maxQuantity:
        "अधिकतम मात्रा",

      maxQuantityDescription:
        "एक बुकिंग में अनुमत अधिकतम उपज।",

      defaultCapacity:
        "डिफ़ॉल्ट स्लॉट क्षमता",

      defaultCapacityDescription:
        "एक स्लॉट में अनुमत किसानों की डिफ़ॉल्ट संख्या।",

      slotDuration:
        "स्लॉट अवधि",

      slotDurationDescription:
        "प्रत्येक आगमन विंडो की डिफ़ॉल्ट अवधि।",

      advanceBookingDays:
        "अग्रिम बुकिंग अवधि",

      advanceBookingDaysDescription:
        "किसान कितने दिन पहले बुक कर सकते हैं।",

      farmers:
        "किसान",

      minutes:
        "मिनट",

      days:
        "दिन",

      procurement:
        "खरीद",

      procurementTitle:
        "खरीद सत्यापन नियंत्रित करें",

      procurementDescription:
        "खरीद पूरी करने से पहले आवश्यक न्यूनतम जानकारी निर्धारित करें।",

      requireActualWeight:
        "वास्तविक वजन आवश्यक",

      requireActualWeightDescription:
        "वास्तविक उपज वजन दर्ज किए बिना खरीद पूरी न होने दें।",

      qualityControl:
        "गुणवत्ता सत्यापन",

      qualityControlDescription:
        "ऑपरेटर वजन के दौरान उपज की गुणवत्ता दर्ज करता है।",

      paymentControl:
        "भुगतान प्रक्रिया",

      paymentControlDescription:
        "भुगतान को खरीद से अलग रखा जाता है ताकि राशि भेजने से पहले समीक्षा की जा सके।",

      notifications:
        "नोटिफिकेशन",

      notificationsTitle:
        "किसान संचार नियंत्रित करें",

      notificationsDescription:
        "चुनें कि कौन से ऑपरेशनल इवेंट SMS भेज सकते हैं।",

      smsEnabled:
        "SMS नोटिफिकेशन सक्षम करें",

      smsEnabledDescription:
        "कॉन्फ़िगर किए गए SMS प्रदाता के माध्यम से नोटिफिकेशन भेजने की अनुमति दें।",

      bookingSms:
        "बुकिंग पुष्टि SMS",

      bookingSmsDescription:
        "किसान को टोकन, तारीख, समय और केंद्र भेजें।",

      lateSms:
        "देर से आने का SMS",

      lateSmsDescription:
        "बुकिंग देर से होने पर किसान को सूचित करें।",

      procurementSms:
        "खरीद पूर्ण SMS",

      procurementSmsDescription:
        "वजन और खरीद पूरी होने पर किसान को सूचित करें।",

      paymentSms:
        "भुगतान SMS",

      paymentSmsDescription:
        "भुगतान भेजे जाने के बाद किसान को सूचित करें।",

      system:
        "सिस्टम",

      systemTitle:
        "सिस्टम व्यवहार",

      systemDescription:
        "डिफ़ॉल्ट भाषा और आपातकालीन संचालन मोड सेट करें।",

      defaultLanguage:
        "डिफ़ॉल्ट भाषा",

      defaultLanguageDescription:
        "जब उपयोगकर्ता की अपनी भाषा सेट न हो तब उपयोग होने वाली भाषा।",

      maintenanceMode:
        "मेंटेनेंस मोड",

      maintenanceModeDescription:
        "सामान्य सिस्टम संचालन को अस्थायी रूप से रोकें।",

      maintenanceWarningTitle:
        "मेंटेनेंस मोड सावधानी से उपयोग करें",

      maintenanceWarningDescription:
        "यह पूरे सिस्टम का नियंत्रण है। सामान्य संचालन में इसे बंद रखें।",

      unsavedChanges:
        "कुछ बदलाव सहेजे नहीं गए हैं",

      unsavedDescription:
        "सेव करने से पहले कॉन्फ़िगरेशन की समीक्षा करें।",

      allSaved:
        "सभी सेटिंग्स सहेजी गई हैं",

      allSavedDescription:
        "वर्तमान कॉन्फ़िगरेशन सिस्टम में सहेजी गई सेटिंग्स से मेल खाता है।",

      discard:
        "हटाएं",

      saveChanges:
        "बदलाव सहेजें",

      saving:
        "सहेजा जा रहा है...",

      resetDefaults:
        "डिफ़ॉल्ट पर रीसेट",

      resetting:
        "रीसेट हो रहा है...",

      saved:
        "सिस्टम सेटिंग्स सफलतापूर्वक सहेजी गईं।",

      saveError:
        "सिस्टम सेटिंग्स सहेजी नहीं जा सकीं।",

      resetConfirm:
        "सभी सिस्टम सेटिंग्स को डिफ़ॉल्ट मानों पर रीसेट करें?",

      resetSuccess:
        "सिस्टम सेटिंग्स डिफ़ॉल्ट पर रीसेट कर दी गईं।",

      resetError:
        "सिस्टम सेटिंग्स रीसेट नहीं की जा सकीं।",

    },


    te: {

      title:
        "సిస్టమ్ సెట్టింగ్స్",

      subtitle:
        "బుకింగ్, కొనుగోలు, నోటిఫికేషన్లు మరియు సిస్టమ్ ప్రవర్తనను నియంత్రించండి.",

      eyebrow:
        "సిస్టమ్ నియంత్రణ",

      heading:
        "KrishiSetu ఎలా పనిచేయాలో కాన్ఫిగర్ చేయండి.",

      description:
        "రైతులు, కొనుగోలు ఆపరేటర్లు, నోటిఫికేషన్లు మరియు మొత్తం సిస్టమ్‌ను ప్రభావితం చేసే నియమాలను ఒకే చోట నియంత్రించండి.",

      systemControl:
        "సిస్టమ్ నియంత్రణ",

      systemStatus:
        "సిస్టమ్ స్థితి",

      systemOperational:
        "సిస్టమ్ పనిచేస్తోంది",

      operationalDescription:
        "రైతు బుకింగ్ మరియు అడ్మిన్ కార్యకలాపాలు ప్రస్తుతం యాక్టివ్‌గా ఉన్నాయి.",

      bookingPaused:
        "కొత్త బుకింగ్‌లు నిలిపివేయబడ్డాయి",

      bookingPausedDescription:
        "ప్రస్తుత రికార్డులు అందుబాటులో ఉంటాయి, కానీ కొత్త రైతు బుకింగ్‌లు నిలిపివేయబడ్డాయి.",

      maintenanceOn:
        "మెయింటెనెన్స్ మోడ్ యాక్టివ్‌గా ఉంది",

      maintenanceDescription:
        "సాధారణ రైతు కార్యకలాపాలను తాత్కాలికంగా నిలిపివేయాల్సినప్పుడు ఉపయోగించండి.",

      active:
        "యాక్టివ్",

      paused:
        "నిలిపివేయబడింది",

      maintenance:
        "మెయింటెనెన్స్",

      configurationIssue:
        "కాన్ఫిగరేషన్ సమస్య",

      bookingRules:
        "బుకింగ్ నియమాలు",

      bookingRulesTitle:
        "రైతు బుకింగ్ ప్రవర్తనను నియంత్రించండి",

      bookingRulesDescription:
        "రైతులు బుకింగ్ సృష్టించే సమయంలో ఉపయోగించే పరిమితులు మరియు సమయ నియమాలను సెట్ చేయండి.",

      bookingEnabled:
        "కొత్త బుకింగ్‌లను అనుమతించండి",

      bookingEnabledDescription:
        "రైతులు కొత్త కొనుగోలు బుకింగ్‌లు సృష్టించవచ్చు.",

      maxQuantity:
        "గరిష్ట పరిమాణం",

      maxQuantityDescription:
        "ఒక బుకింగ్‌లో అనుమతించే గరిష్ట పంట పరిమాణం.",

      defaultCapacity:
        "డిఫాల్ట్ స్లాట్ సామర్థ్యం",

      defaultCapacityDescription:
        "ఒక స్లాట్‌లో అనుమతించే రైతుల డిఫాల్ట్ సంఖ్య.",

      slotDuration:
        "స్లాట్ వ్యవధి",

      slotDurationDescription:
        "ప్రతి రాక సమయ విండో యొక్క డిఫాల్ట్ వ్యవధి.",

      advanceBookingDays:
        "అడ్వాన్స్ బుకింగ్ వ్యవధి",

      advanceBookingDaysDescription:
        "రైతులు ఎన్ని రోజులు ముందుగా బుక్ చేయవచ్చో నిర్ణయిస్తుంది.",

      farmers:
        "రైతులు",

      minutes:
        "నిమిషాలు",

      days:
        "రోజులు",

      procurement:
        "కొనుగోలు",

      procurementTitle:
        "కొనుగోలు ధృవీకరణను నియంత్రించండి",

      procurementDescription:
        "కొనుగోలును పూర్తి చేయడానికి ముందు అవసరమైన కనీస సమాచారాన్ని నిర్ణయించండి.",

      requireActualWeight:
        "వాస్తవ బరువు తప్పనిసరి",

      requireActualWeightDescription:
        "వాస్తవ పంట బరువు నమోదు చేయకుండా కొనుగోలును పూర్తి చేయనివ్వదు.",

      qualityControl:
        "నాణ్యత ధృవీకరణ",

      qualityControlDescription:
        "తూకం సమయంలో ఆపరేటర్ పంట నాణ్యతను నమోదు చేస్తారు.",

      paymentControl:
        "చెల్లింపు ప్రక్రియ",

      paymentControlDescription:
        "పంపే ముందు మొత్తాన్ని సమీక్షించడానికి చెల్లింపును కొనుగోలు నుండి వేరుగా ఉంచుతుంది.",

      notifications:
        "నోటిఫికేషన్లు",

      notificationsTitle:
        "రైతు కమ్యూనికేషన్‌ను నియంత్రించండి",

      notificationsDescription:
        "ఏ కార్యకలాపాలు SMS నోటిఫికేషన్ పంపాలో ఎంచుకోండి.",

      smsEnabled:
        "SMS నోటిఫికేషన్లను ప్రారంభించండి",

      smsEnabledDescription:
        "కాన్ఫిగర్ చేసిన SMS ప్రొవైడర్ ద్వారా నోటిఫికేషన్లు పంపడానికి అనుమతిస్తుంది.",

      bookingSms:
        "బుకింగ్ నిర్ధారణ SMS",

      bookingSmsDescription:
        "రైతుకు టోకెన్, తేదీ, సమయం మరియు కేంద్ర వివరాలను పంపుతుంది.",

      lateSms:
        "ఆలస్య SMS",

      lateSmsDescription:
        "బుకింగ్ ఆలస్యంగా గుర్తించబడినప్పుడు రైతుకు తెలియజేస్తుంది.",

      procurementSms:
        "కొనుగోలు పూర్తి SMS",

      procurementSmsDescription:
        "తూకం మరియు కొనుగోలు పూర్తైనప్పుడు రైతుకు తెలియజేస్తుంది.",

      paymentSms:
        "చెల్లింపు SMS",

      paymentSmsDescription:
        "చెల్లింపు పంపిన తర్వాత రైతుకు తెలియజేస్తుంది.",

      system:
        "సిస్టమ్",

      systemTitle:
        "గ్లోబల్ సిస్టమ్ ప్రవర్తన",

      systemDescription:
        "డిఫాల్ట్ భాష మరియు అత్యవసర ఆపరేషన్ మోడ్‌ను కాన్ఫిగర్ చేయండి.",

      defaultLanguage:
        "డిఫాల్ట్ భాష",

      defaultLanguageDescription:
        "యూజర్‌కు స్వంత భాష ఎంపిక లేకపోతే ఉపయోగించే భాష.",

      maintenanceMode:
        "మెయింటెనెన్స్ మోడ్",

      maintenanceModeDescription:
        "సాధారణ సిస్టమ్ కార్యకలాపాలను తాత్కాలికంగా నిలిపివేయండి.",

      maintenanceWarningTitle:
        "మెయింటెనెన్స్ మోడ్‌ను జాగ్రత్తగా ఉపయోగించండి",

      maintenanceWarningDescription:
        "ఇది మొత్తం సిస్టమ్ నియంత్రణ. సాధారణ సమయంలో దీన్ని ఆఫ్‌లో ఉంచండి.",

      unsavedChanges:
        "సేవ్ చేయని మార్పులు ఉన్నాయి",

      unsavedDescription:
        "సేవ్ చేసే ముందు కాన్ఫిగరేషన్‌ను సమీక్షించండి.",

      allSaved:
        "అన్ని సెట్టింగ్స్ సేవ్ చేయబడ్డాయి",

      allSavedDescription:
        "ప్రస్తుత కాన్ఫిగరేషన్ సేవ్ చేసిన సిస్టమ్ కాన్ఫిగరేషన్‌తో సరిపోతుంది.",

      discard:
        "వదిలివేయండి",

      saveChanges:
        "మార్పులను సేవ్ చేయండి",

      saving:
        "సేవ్ చేస్తోంది...",

      resetDefaults:
        "డిఫాల్ట్‌లకు రీసెట్",

      resetting:
        "రీసెట్ చేస్తోంది...",

      saved:
        "సిస్టమ్ సెట్టింగ్స్ విజయవంతంగా సేవ్ చేయబడ్డాయి.",

      saveError:
        "సిస్టమ్ సెట్టింగ్స్ సేవ్ చేయలేకపోయాము.",

      resetConfirm:
        "అన్ని సిస్టమ్ సెట్టింగ్స్‌ను డిఫాల్ట్ విలువలకు రీసెట్ చేయాలా?",

      resetSuccess:
        "సిస్టమ్ సెట్టింగ్స్ డిఫాల్ట్‌లకు రీసెట్ చేయబడ్డాయి.",

      resetError:
        "సిస్టమ్ సెట్టింగ్స్‌ను రీసెట్ చేయలేకపోయాము.",

    },

  };


  return (
    copy[
      language
    ] ||
    copy.en
  );

}


export default AdminSettings;