
import {
  Bell,
  CheckCircle2,
  ChevronLeft,
  Globe2,
  Leaf,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  User,
  Wheat,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router";

import {
  useEffect,
  useState,
} from "react";

import Header from "../../components/Header";

import {
  getCurrentFarmer,
  setCurrentFarmer,
} from "../../data/appStore";

import {
  useLanguage,
} from "../../translations/LanguageContext";


const API_URL =
  import.meta.env.VITE_API_URL;


function FarmerSettings() {

  const navigate =
    useNavigate();


  const {
    language,
    setLanguage,
  } =
    useLanguage();


  const [
    farmer,
    setFarmer,
  ] =
    useState(
      () =>
        getCurrentFarmer()
    );


  const [
    form,
    setForm,
  ] =
    useState({
      name: "",
      phone: "",
      village: "",
      language: "en",
      preferredCenterId: "main",
      primaryCrop: "wheat",
      estimatedQuantity: "",
    });


  const [
    smsEnabled,
    setSmsEnabled,
  ] =
    useState(true);


  const [
    inAppEnabled,
    setInAppEnabled,
  ] =
    useState(true);


  const [
    centers,
    setCenters,
  ] =
    useState([]);


  const [
    saving,
    setSaving,
  ] =
    useState(false);


  const [
    saved,
    setSaved,
  ] =
    useState(false);


  const [
    error,
    setError,
  ] =
    useState("");


  /*
    Refresh the local farmer reference when the
    currently logged-in farmer changes.
  */
  useEffect(() => {

    const current =
      getCurrentFarmer();

    setFarmer(
      current
    );

  }, []);


  useEffect(() => {

    if (
      farmer
    ) {

      setForm({

        name:
          farmer.name ||
          "",

        phone:
          farmer.phone ||
          "",

        village:
          farmer.village ||
          "",

        language:
          farmer.language ||
          language ||
          "en",

        preferredCenterId:
          farmer.preferred_center_id ||
          farmer.preferredCenterId ||
          "main",

        primaryCrop:
          farmer.primary_crop ||
          farmer.primaryCrop ||
          "wheat",

        estimatedQuantity:
          farmer.estimated_quantity ??
          farmer.estimatedQuantity ??
          "",

      });

    }

  }, [
    farmer,
    language,
  ]);


  useEffect(() => {

    const stored =
      localStorage.getItem(
        "krishisetu-farmer-settings"
      );

    if (!stored) {
      return;
    }

    try {

      const parsed =
        JSON.parse(
          stored
        );

      setSmsEnabled(
        parsed?.smsEnabled !==
          false
      );

      setInAppEnabled(
        parsed?.inAppEnabled !==
          false
      );

    } catch (
      settingsError
    ) {

      console.error(
        "Could not load farmer settings:",
        settingsError
      );

    }

  }, []);


  useEffect(() => {

    async function loadCenters() {

      try {

        const response =
          await fetch(
            `${API_URL}/centers`
          );


        const data =
          await response.json();


        if (
          response.ok &&
          Array.isArray(
            data?.centers
          )
        ) {

          setCenters(
            data.centers
          );

        }

      } catch (
        centerError
      ) {

        console.error(
          "Settings centers error:",
          centerError
        );

      }

    }


    loadCenters();

  }, []);


  function updateField(
    field,
    value
  ) {

    setForm(
      current => ({
        ...current,

        [field]:
          value,
      })
    );


    setSaved(
      false
    );


    setError(
      ""
    );

  }


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


  function normalizeFarmer(
    value
  ) {

    if (
      !value
    ) {

      return null;

    }


    return {

      ...value,

      id:
        value.id,

      name:
        value.name ||
        "",

      phone:
        normalisePhone(
          value.phone
        ),

      stateId:
        value.state_id ??
        value.stateId ??
        null,

      districtId:
        value.district_id ??
        value.districtId ??
        null,

      mandalId:
        value.mandal_id ??
        value.mandalId ??
        null,

      village:
        value.village ||
        "",

      language:
        value.language ||
        "en",

      preferredCenterId:
        value.preferred_center_id ??
        value.preferredCenterId ??
        null,

      primaryCrop:
        value.primary_crop ??
        value.primaryCrop ??
        null,

      estimatedQuantity:
        Number(
          value.estimated_quantity ??
          value.estimatedQuantity ??
          0
        ),

    };

  }


  async function handleSave(
    event
  ) {

    event.preventDefault();


    const currentFarmer =
      getCurrentFarmer();


    if (
      !currentFarmer?.id
    ) {

      setError(
        "Farmer account could not be loaded. Please login again."
      );

      return;

    }


    const name =
      form.name.trim();


    const cleanedPhone =
      normalisePhone(
        form.phone
      );


    const village =
      form.village.trim();


    const estimatedQuantity =
      Number(
        form.estimatedQuantity ||
        0
      );


    if (
      !name
    ) {

      setError(
        "Please enter your name."
      );

      return;

    }


    if (
      cleanedPhone.length !==
      10
    ) {

      setError(
        "Please enter a valid 10-digit mobile number."
      );

      return;

    }


    if (
      !Number.isFinite(
        estimatedQuantity
      ) ||
      estimatedQuantity <
        0
    ) {

      setError(
        "Quantity cannot be negative."
      );

      return;

    }


    if (
      ![
        "en",
        "hi",
        "te",
      ].includes(
        form.language
      )
    ) {

      setError(
        "Invalid language."
      );

      return;

    }


    setSaving(
      true
    );


    setSaved(
      false
    );


    setError(
      ""
    );


    try {

      /*
        Use the current canonical database ID.
        Never generate or replace it locally.
      */

      const response =
        await fetch(
          `${API_URL}/farmers/${encodeURIComponent(
            currentFarmer.id
          )}`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({

                name,

                phone:
                  cleanedPhone,

                village:
                  village ||
                  null,

                language:
                  form.language,

                preferredCenterId:
                  form.preferredCenterId ||
                  null,

                primaryCrop:
                  form.primaryCrop ||
                  null,

                estimatedQuantity,

              }),

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
          "Unable to save settings."
        );

      }


      const savedFarmer =
        normalizeFarmer(
          data?.farmer
        );


      if (
        !savedFarmer?.id
      ) {

        throw new Error(
          "Settings were saved, but the server did not return the updated farmer account."
        );

      }


      /*
        IMPORTANT:

        The backend response is now the
        single source of truth.

        This updates:
        - farmer data
        - current farmer ID
        - current phone number
        - current language
      */

      setCurrentFarmer(
        savedFarmer
      );


      setFarmer(
        savedFarmer
      );


      setForm({

        name:
          savedFarmer.name ||
          "",

        phone:
          savedFarmer.phone ||
          "",

        village:
          savedFarmer.village ||
          "",

        language:
          savedFarmer.language ||
          "en",

        preferredCenterId:
          savedFarmer.preferredCenterId ||
          "main",

        primaryCrop:
          savedFarmer.primaryCrop ||
          "wheat",

        estimatedQuantity:
          savedFarmer.estimatedQuantity ??
          "",

      });


      setLanguage(
        savedFarmer.language ||
        form.language
      );


      localStorage.setItem(
        "krishisetu-farmer-settings",
        JSON.stringify({

          smsEnabled,

          inAppEnabled,

        })
      );


      setSaved(
        true
      );


      /*
        Give React/store listeners a moment to
        receive the new farmer, then go home.
      */

      setTimeout(
        () => {

          navigate(
            "/farmer/home",
            {
              replace:
                true,
            }
          );

        },
        500
      );


    } catch (
      saveError
    ) {

      console.error(
        "Farmer settings error:",
        saveError
      );


      setError(
        saveError?.message ||
        "Unable to save settings."
      );

    } finally {

      setSaving(
        false
      );

    }

  }


  if (
    !farmer
  ) {

    return (

      <div className="farmer-settings-page">

        <Header />


        <main className="farmer-settings-container">

          <section className="farmer-settings-empty">

            <ShieldCheck
              size={34}
            />


            <h1>
              Farmer account not found
            </h1>


            <p>
              Please login again to continue.
            </p>


            <Link
              to="/farmer/login"
              className="farmer-settings-primary"
            >

              Go to Login

            </Link>

          </section>

        </main>

      </div>

    );

  }


  return (

    <div className="farmer-settings-page">

      <Header />


      <main className="farmer-settings-container">


        <Link
          to="/farmer/home"
          className="farmer-settings-back"
        >

          <ChevronLeft
            size={17}
          />

          Farmer Home

        </Link>


        <section className="farmer-settings-hero">

          <div>

            <span className="page-eyebrow">

              FARMER PORTAL

            </span>


            <h1>
              Account & preferences
            </h1>


            <p>
              Keep your farmer profile and communication preferences up to date.
            </p>

          </div>


          <div className="farmer-settings-hero-icon">

            <User
              size={29}
            />

          </div>

        </section>


        <form
          className="farmer-settings-layout"
          onSubmit={
            handleSave
          }
        >


          <section className="farmer-settings-card">

            <div className="farmer-settings-section-heading">

              <div className="farmer-settings-section-icon">

                <User
                  size={19}
                />

              </div>


              <div>

                <h2>
                  Personal details
                </h2>

                <p>
                  Information used for your farmer account.
                </p>

              </div>

            </div>


            <div className="farmer-settings-grid">

              <SettingsField
                label="Full name"
                icon={
                  <User
                    size={17}
                  />
                }
              >

                <input
                  value={
                    form.name
                  }
                  onChange={
                    event =>
                      updateField(
                        "name",
                        event.target.value
                      )
                  }
                  placeholder="Enter your name"
                />

              </SettingsField>


              <SettingsField
                label="Mobile number"
                icon={
                  <Phone
                    size={17}
                  />
                }
              >

                <input
                  value={
                    form.phone
                  }
                  onChange={
                    event =>
                      updateField(
                        "phone",
                        event.target.value
                          .replace(
                            /[^0-9]/g,
                            ""
                          )
                          .slice(
                            0,
                            10
                          )
                      )
                  }
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="10-digit mobile number"
                />

              </SettingsField>


              <SettingsField
                label="Village"
                icon={
                  <MapPin
                    size={17}
                  />
                }
              >

                <input
                  value={
                    form.village
                  }
                  onChange={
                    event =>
                      updateField(
                        "village",
                        event.target.value
                      )
                  }
                  placeholder="Enter village"
                />

              </SettingsField>


              <SettingsField
                label="Preferred language"
                icon={
                  <Globe2
                    size={17}
                  />
                }
              >

                <select
                  value={
                    form.language
                  }
                  onChange={
                    event =>
                      updateField(
                        "language",
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

              </SettingsField>

            </div>

          </section>


          <section className="farmer-settings-card">

            <div className="farmer-settings-section-heading">

              <div className="farmer-settings-section-icon green">

                <Wheat
                  size={19}
                />

              </div>


              <div>

                <h2>
                  Procurement preferences
                </h2>

                <p>
                  These preferences help speed up future bookings.
                </p>

              </div>

            </div>


            <div className="farmer-settings-grid">

              <SettingsField
                label="Primary crop"
                icon={
                  <Leaf
                    size={17}
                  />
                }
              >

                <select
                  value={
                    form.primaryCrop
                  }
                  onChange={
                    event =>
                      updateField(
                        "primaryCrop",
                        event.target.value
                      )
                  }
                >

                  <option value="wheat">
                    Wheat
                  </option>

                  <option value="paddy">
                    Paddy
                  </option>

                  <option value="maize">
                    Maize
                  </option>

                  <option value="cotton">
                    Cotton
                  </option>

                </select>

              </SettingsField>


              <SettingsField
                label="Typical quantity"
                icon={
                  <Wheat
                    size={17}
                  />
                }
              >

                <div className="farmer-settings-input-with-suffix">

                  <input
                    type="number"
                    min="1"
                    value={
                      form.estimatedQuantity
                    }
                    onChange={
                      event =>
                        updateField(
                          "estimatedQuantity",
                          event.target.value
                        )
                    }
                    placeholder="e.g. 250"
                  />

                  <span>
                    kg
                  </span>

                </div>

              </SettingsField>


              <SettingsField
                label="Preferred procurement center"
                icon={
                  <MapPin
                    size={17}
                  />
                }
                full
              >

                <select
                  value={
                    form.preferredCenterId
                  }
                  onChange={
                    event =>
                      updateField(
                        "preferredCenterId",
                        event.target.value
                      )
                  }
                >

                  <option value="main">
                    Main Procurement Center
                  </option>

                  {
                    centers.map(
                      center => (

                        <option
                          key={
                            center.id
                          }
                          value={
                            center.id
                          }
                        >

                          {
                            center.name
                          }

                        </option>

                      )
                    )
                  }

                </select>

              </SettingsField>

            </div>

          </section>


          <section className="farmer-settings-card">

            <div className="farmer-settings-section-heading">

              <div className="farmer-settings-section-icon gold">

                <Bell
                  size={19}
                />

              </div>


              <div>

                <h2>
                  Notifications
                </h2>

                <p>
                  Choose how you want to receive procurement updates.
                </p>

              </div>

            </div>


            <div className="farmer-settings-preferences">

              <PreferenceRow
                icon={
                  <Bell
                    size={18}
                  />
                }
                title="In-app notifications"
                description="Receive status updates inside KrishiSetu."
                checked={
                  inAppEnabled
                }
                onChange={
                  setInAppEnabled
                }
              />


              <PreferenceRow
                icon={
                  <Phone
                    size={18}
                  />
                }
                title="SMS notifications"
                description="Receive booking and procurement updates on your registered mobile."
                checked={
                  smsEnabled
                }
                onChange={
                  setSmsEnabled
                }
              />

            </div>

          </section>


          {
            error && (

              <div className="farmer-settings-error">

                <ShieldCheck
                  size={17}
                />

                <span>
                  {error}
                </span>

              </div>

            )
          }


          <div className="farmer-settings-save-row">

            <Link
              to="/farmer/home"
              className="farmer-settings-secondary"
            >

              Cancel

            </Link>


            <button
              type="submit"
              className="farmer-settings-primary"
              disabled={
                saving
              }
            >

              {
                saving
                  ? "Saving..."
                  : saved
                    ? "Saved"
                    : "Save changes"
              }


              {
                saved
                  ? (
                    <CheckCircle2
                      size={17}
                    />
                  )
                  : (
                    <Save
                      size={17}
                    />
                  )
              }

            </button>

          </div>


        </form>

      </main>

    </div>

  );

}


/* =========================================================
   FIELD
========================================================= */

function SettingsField({
  label,
  icon,
  children,
  full = false,
}) {

  return (

    <label
      className={
        `farmer-settings-field ${
          full
            ? "full"
            : ""
        }`
      }
    >

      <span className="farmer-settings-label">

        {icon}

        {label}

      </span>


      {children}

    </label>

  );

}


/* =========================================================
   PREFERENCE
========================================================= */

function PreferenceRow({
  icon,
  title,
  description,
  checked,
  onChange,
}) {

  return (

    <div className="farmer-settings-preference">

      <div className="farmer-settings-preference-icon">

        {icon}

      </div>


      <div className="farmer-settings-preference-copy">

        <strong>
          {title}
        </strong>

        <span>
          {description}
        </span>

      </div>


      <button
        type="button"
        className={
          `farmer-settings-toggle ${
            checked
              ? "active"
              : ""
          }`
        }
        onClick={() =>
          onChange(
            current =>
              !current
          )
        }
        aria-pressed={
          checked
        }
      >

        <span />

      </button>

    </div>

  );

}


export default FarmerSettings;
