import {
  useEffect,
  useMemo,
  useState,
} from "react";


import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Globe2,
  MapPin,
  Phone,
  UserRound,
} from "lucide-react";


import {
  Link,
  useNavigate,
} from "react-router";


import Header from "../../components/Header";
import Button from "../../components/Button";


import {
  useLanguage,
} from "../../translations/LanguageContext";


import {
  getStates,
  getDistricts,
  getMandals,
  getVillages,
} from "../../data/locationData";


import {
  addFarmer,
  setCurrentUser,
} from "../../data/appStore";


const API_URL =
  "http://localhost:5000/api";


const languages = [
  {
    id: "en",
    nativeLabel: "English",
  },

  {
    id: "hi",
    nativeLabel: "हिन्दी",
  },

  {
    id: "te",
    nativeLabel: "తెలుగు",
  },
];


function FarmerRegister() {

  const navigate =
    useNavigate();


  const {
    t,
    setLanguage,
  } =
    useLanguage();


  const states =
    getStates();


  const [
    form,
    setForm,
  ] =
    useState({
      name: "",
      phone: "",

      stateId: "ts",
      districtId: "hyd",
      mandalId: "serilingampally",
      village: "Gachibowli",

      language: "en",
    });


  const [
    openMenu,
    setOpenMenu,
  ] =
    useState(null);


  const [
    errors,
    setErrors,
  ] =
    useState({});


  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);


  const selectedState =
    useMemo(
      () =>
        states.find(
          (item) =>
            item.stateId ===
            form.stateId
        ),
      [
        states,
        form.stateId,
      ]
    );


  const districts =
    useMemo(
      () =>
        getDistricts(
          form.stateId
        ),
      [
        form.stateId,
      ]
    );


  const selectedDistrict =
    useMemo(
      () =>
        districts.find(
          (item) =>
            item.districtId ===
            form.districtId
        ),
      [
        districts,
        form.districtId,
      ]
    );


  const mandals =
    useMemo(
      () =>
        getMandals(
          form.stateId,
          form.districtId
        ),
      [
        form.stateId,
        form.districtId,
      ]
    );


  const selectedMandal =
    useMemo(
      () =>
        mandals.find(
          (item) =>
            item.mandalId ===
            form.mandalId
        ),
      [
        mandals,
        form.mandalId,
      ]
    );


  const villages =
    useMemo(
      () =>
        getVillages(
          form.stateId,
          form.districtId,
          form.mandalId
        ),
      [
        form.stateId,
        form.districtId,
        form.mandalId,
      ]
    );


  const selectedLanguage =
    languages.find(
      (item) =>
        item.id ===
        form.language
    ) ||
    languages[0];


  useEffect(() => {

    const valid =
      districts.some(
        (item) =>
          item.districtId ===
          form.districtId
      );


    if (
      districts.length > 0 &&
      !valid
    ) {

      setForm(
        (current) => ({
          ...current,

          districtId:
            districts[0]
              .districtId,

          mandalId:
            "",

          village:
            "",
        })
      );
    }

  }, [
    districts,
    form.districtId,
  ]);


  useEffect(() => {

    const valid =
      mandals.some(
        (item) =>
          item.mandalId ===
          form.mandalId
      );


    if (
      mandals.length > 0 &&
      !valid
    ) {

      setForm(
        (current) => ({
          ...current,

          mandalId:
            mandals[0]
              .mandalId,

          village:
            "",
        })
      );
    }

  }, [
    mandals,
    form.mandalId,
  ]);


  useEffect(() => {

    const valid =
      villages.includes(
        form.village
      );


    if (
      villages.length > 0 &&
      !valid
    ) {

      setForm(
        (current) => ({
          ...current,

          village:
            villages[0],
        })
      );
    }

  }, [
    villages,
    form.village,
  ]);


  function updateField(
    field,
    value
  ) {

    setForm(
      (current) => ({
        ...current,

        [field]:
          value,
      })
    );


    setErrors(
      (current) => ({
        ...current,

        [field]:
          "",
      })
    );
  }


  function handlePhoneChange(
    event
  ) {

    const value =
      event.target.value
        .replace(
          /[^0-9]/g,
          ""
        )
        .slice(
          0,
          10
        );


    updateField(
      "phone",
      value
    );
  }


  function selectState(
    stateId
  ) {

    setForm(
      (current) => ({
        ...current,

        stateId,

        districtId:
          "",

        mandalId:
          "",

        village:
          "",
      })
    );


    setOpenMenu(
      null
    );
  }


  function selectDistrict(
    districtId
  ) {

    setForm(
      (current) => ({
        ...current,

        districtId,

        mandalId:
          "",

        village:
          "",
      })
    );


    setOpenMenu(
      null
    );
  }


  function selectMandal(
    mandalId
  ) {

    setForm(
      (current) => ({
        ...current,

        mandalId,

        village:
          "",
      })
    );


    setOpenMenu(
      null
    );
  }


  function selectVillage(
    village
  ) {

    updateField(
      "village",
      village
    );


    setOpenMenu(
      null
    );
  }


  function validate() {

    const nextErrors =
      {};


    if (
      !form.name.trim()
    ) {

      nextErrors.name =
        "Please enter your name.";

    } else if (
      form.name.trim().length <
      3
    ) {

      nextErrors.name =
        "Name must be at least 3 characters.";
    }


    if (
      form.phone.length !==
      10
    ) {

      nextErrors.phone =
        "Please enter a valid 10-digit mobile number.";
    }


    if (
      !form.stateId
    ) {

      nextErrors.stateId =
        "Please select your state.";
    }


    if (
      !form.districtId
    ) {

      nextErrors.districtId =
        "Please select your district.";
    }


    if (
      !form.mandalId
    ) {

      nextErrors.mandalId =
        "Please select your mandal.";
    }


    if (
      !form.village
    ) {

      nextErrors.village =
        "Please select your village.";
    }


    return nextErrors;
  }


  async function handleSubmit(
    event
  ) {

    event.preventDefault();


    if (
      submitting
    ) {
      return;
    }


    const nextErrors =
      validate();


    setErrors(
      nextErrors
    );


    if (
      Object.keys(
        nextErrors
      ).length > 0
    ) {

      return;
    }


    const farmerId =
      `F${Date.now()}`;


    const farmer = {

      id:
        farmerId,

      name:
        form.name.trim(),

      phone:
        form.phone,

      stateId:
        form.stateId,

      districtId:
        form.districtId,

      mandalId:
        form.mandalId,

      village:
        form.village,

      language:
        form.language,

      preferredCenterId:
        null,

      primaryCrop:
        null,

      estimatedQuantity:
        0,

    };


    setSubmitting(
      true
    );


    try {

      const response =
        await fetch(
          `${API_URL}/farmers`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                farmer
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
          "Unable to create your account."
        );
      }


      /*
       * Save to the existing frontend store
       * only after the backend accepted it.
       */

      addFarmer(
        farmer
      );


      setCurrentUser({
        role:
          "farmer",

        farmerId:
          farmer.id,
      });


      setLanguage(
        form.language
      );


      navigate(
        "/farmer/home"
      );

    } catch (
      registrationError
    ) {

      console.error(
        "Registration error:",
        registrationError
      );


      setErrors({
        submit:
          registrationError?.message ||
          "Unable to create your account.",
      });

    } finally {

      setSubmitting(
        false
      );

    }
  }
    return (
    <div className="farmer-register-page">

      <Header
        showHelp={false}
      />


      <main className="register-container">

        <div className="register-back-row">

          <Link
            to="/farmer/login"
            className="back-link"
          >

            <ArrowLeft
              size={16}
            />

            {t(
              "common.back"
            )}

          </Link>

        </div>


        <section className="register-layout">


          <div className="register-intro">

            <span className="page-eyebrow">

              {t(
                "register.eyebrow"
              )}

            </span>


            <h1>

              {t(
                "register.titleLineOne"
              )}

              <span>
                {" "}
                {t(
                  "register.titleLineTwo"
                )}
              </span>

            </h1>


            <p>

              {t(
                "register.description"
              )}

            </p>


            <div className="register-benefits">

              <Benefit
                icon={
                  <CalendarIcon />
                }
                title={t(
                  "register.fasterBooking"
                )}
                description={t(
                  "register.fasterBookingDescription"
                )}
              />


              <Benefit
                icon={
                  <MessageIcon />
                }
                title={t(
                  "register.smsNotifications"
                )}
                description={t(
                  "register.smsNotificationsDescription"
                )}
              />


              <Benefit
                icon={
                  <ShieldIcon />
                }
                title={t(
                  "register.verifiedAccount"
                )}
                description={t(
                  "register.verifiedAccountDescription"
                )}
              />

            </div>

          </div>



          <form
            className="register-form-card"
            onSubmit={
              handleSubmit
            }
          >


            <div className="register-form-heading">

              <div className="register-form-icon">

                <UserRound
                  size={21}
                />

              </div>


              <div>

                <h2>

                  {t(
                    "register.createAccount"
                  )}

                </h2>


                <p>

                  {t(
                    "register.fieldsRequired"
                  )}

                </p>

              </div>

            </div>



            <div className="register-section">


              <div className="register-section-label">

                {t(
                  "register.personalDetails"
                )}

              </div>



              <div className="register-field">


                <label
                  htmlFor="farmer-name"
                >

                  {t(
                    "register.farmerName"
                  )}

                  {" "}

                  *

                </label>


                <div
                  className={
                    `register-input ${
                      errors.name
                        ? "register-input-error"
                        : ""
                    }`
                  }
                >

                  <UserRound
                    size={17}
                  />


                  <input
                    id="farmer-name"
                    type="text"
                    value={
                      form.name
                    }
                    placeholder={t(
                      "register.fullNamePlaceholder"
                    )}
                    onChange={
                      (event) =>
                        updateField(
                          "name",
                          event.target.value
                        )
                    }
                  />

                </div>


                {errors.name && (

                  <span className="register-error">

                    {
                      errors.name
                    }

                  </span>

                )}

              </div>



              <div className="register-field">


                <label
                  htmlFor="farmer-phone"
                >

                  {t(
                    "register.mobileNumber"
                  )}

                  {" "}

                  *

                </label>


                <div
                  className={
                    `register-input ${
                      errors.phone
                        ? "register-input-error"
                        : ""
                    }`
                  }
                >

                  <Phone
                    size={17}
                  />


                  <span className="verified-country">

                    +91

                  </span>


                  <input
                    id="farmer-phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    maxLength={10}
                    placeholder="9876543210"
                    value={
                      form.phone
                    }
                    onChange={
                      handlePhoneChange
                    }
                  />

                </div>


                <span className="register-hint">

                  Enter your 10-digit mobile number.

                </span>


                {errors.phone && (

                  <span className="register-error">

                    {
                      errors.phone
                    }

                  </span>

                )}

              </div>


            </div>



            <div className="register-section">


              <div className="register-section-label">

                {t(
                  "location.section"
                )}

              </div>



              <div className="register-two-column">


                <LocationSelect
                  label={t(
                    "location.state"
                  )}

                  value={
                    selectedState?.stateName ||
                    ""
                  }

                  placeholder={t(
                    "location.selectState"
                  )}

                  typeLabel={t(
                    "location.stateType"
                  )}

                  icon={
                    <MapPin
                      size={16}
                    />
                  }

                  isOpen={
                    openMenu ===
                    "state"
                  }

                  onToggle={() =>
                    setOpenMenu(
                      openMenu ===
                        "state"
                        ? null
                        : "state"
                    )
                  }

                  error={
                    errors.stateId
                  }
                >

                  {states.map(
                    (item) => (

                      <button
                        key={
                          item.stateId
                        }
                        type="button"
                        onClick={() =>
                          selectState(
                            item.stateId
                          )
                        }
                      >

                        <div className="register-dropdown-icon">

                          <MapPin
                            size={15}
                          />

                        </div>


                        <div>

                          <strong>

                            {
                              item.stateName
                            }

                          </strong>


                          <span>

                            {t(
                              "location.stateType"
                            )}

                          </span>

                        </div>


                        {form.stateId ===
                          item.stateId && (

                          <Check
                            size={15}
                          />

                        )}

                      </button>

                    )
                  )}

                </LocationSelect>



                <LocationSelect
                  label={t(
                    "location.district"
                  )}

                  value={
                    selectedDistrict?.districtName ||
                    ""
                  }

                  placeholder={t(
                    "location.selectDistrict"
                  )}

                  typeLabel={t(
                    "location.districtType"
                  )}

                  icon={
                    <MapPin
                      size={16}
                    />
                  }

                  disabled={
                    !form.stateId
                  }

                  isOpen={
                    openMenu ===
                    "district"
                  }

                  onToggle={() => {

                    if (
                      !form.stateId
                    ) {
                      return;
                    }


                    setOpenMenu(
                      openMenu ===
                        "district"
                        ? null
                        : "district"
                    );

                  }}

                  error={
                    errors.districtId
                  }
                >

                  {districts.map(
                    (item) => (

                      <button
                        key={
                          item.districtId
                        }
                        type="button"
                        onClick={() =>
                          selectDistrict(
                            item.districtId
                          )
                        }
                      >

                        <div className="register-dropdown-icon">

                          <MapPin
                            size={15}
                          />

                        </div>


                        <div>

                          <strong>

                            {
                              item.districtName
                            }

                          </strong>


                          <span>

                            {t(
                              "location.districtType"
                            )}

                          </span>

                        </div>


                        {form.districtId ===
                          item.districtId && (

                          <Check
                            size={15}
                          />

                        )}

                      </button>

                    )
                  )}

                </LocationSelect>

              </div>



              <div className="register-two-column">


                <LocationSelect
                  label={t(
                    "location.mandal"
                  )}

                  value={
                    selectedMandal?.mandalName ||
                    ""
                  }

                  placeholder={t(
                    "location.selectMandal"
                  )}

                  typeLabel={t(
                    "location.mandalType"
                  )}

                  icon={
                    <MapPin
                      size={16}
                    />
                  }

                  disabled={
                    !form.districtId
                  }

                  isOpen={
                    openMenu ===
                    "mandal"
                  }

                  onToggle={() => {

                    if (
                      !form.districtId
                    ) {
                      return;
                    }


                    setOpenMenu(
                      openMenu ===
                        "mandal"
                        ? null
                        : "mandal"
                    );

                  }}

                  error={
                    errors.mandalId
                  }
                >

                  {mandals.map(
                    (item) => (

                      <button
                        key={
                          item.mandalId
                        }
                        type="button"
                        onClick={() =>
                          selectMandal(
                            item.mandalId
                          )
                        }
                      >

                        <div className="register-dropdown-icon">

                          <MapPin
                            size={15}
                          />

                        </div>


                        <div>

                          <strong>

                            {
                              item.mandalName
                            }

                          </strong>


                          <span>

                            {t(
                              "location.mandalType"
                            )}

                          </span>

                        </div>


                        {form.mandalId ===
                          item.mandalId && (

                          <Check
                            size={15}
                          />

                        )}

                      </button>

                    )
                  )}

                </LocationSelect>



                <LocationSelect
                  label={t(
                    "location.village"
                  )}

                  value={
                    form.village
                  }

                  placeholder={t(
                    "location.selectVillage"
                  )}

                  typeLabel={t(
                    "location.villageType"
                  )}

                  icon={
                    <MapPin
                      size={16}
                    />
                  }

                  disabled={
                    !form.mandalId
                  }

                  isOpen={
                    openMenu ===
                    "village"
                  }

                  onToggle={() => {

                    if (
                      !form.mandalId
                    ) {
                      return;
                    }


                    setOpenMenu(
                      openMenu ===
                        "village"
                        ? null
                        : "village"
                    );

                  }}

                  error={
                    errors.village
                  }
                >

                  {villages.map(
                    (village) => (

                      <button
                        key={
                          village
                        }
                        type="button"
                        onClick={() =>
                          selectVillage(
                            village
                          )
                        }
                      >

                        <div className="register-dropdown-icon">

                          <MapPin
                            size={15}
                          />

                        </div>


                        <div>

                          <strong>

                            {
                              village
                            }

                          </strong>


                          <span>

                            {t(
                              "location.villageType"
                            )}

                          </span>

                        </div>


                        {form.village ===
                          village && (

                          <Check
                            size={15}
                          />

                        )}

                      </button>

                    )
                  )}

                </LocationSelect>

              </div>



              <div className="location-path-card">


                <div className="location-path-icon">

                  <MapPin
                    size={16}
                  />

                </div>


                <div>

                  <span>

                    {t(
                      "location.selectedLocation"
                    )}

                  </span>


                  <strong>

                    {[
                      selectedState?.stateName,
                      selectedDistrict?.districtName,
                      selectedMandal?.mandalName,
                      form.village,
                    ]
                      .filter(Boolean)
                      .join(
                        " · "
                      )}

                  </strong>


                  <small>

                    {t(
                      "location.centerUpdates"
                    )}

                  </small>

                </div>

              </div>

            </div>
                        <div className="register-section">

              <div className="register-section-label">

                {t(
                  "register.languageSection"
                )}

              </div>


              <div className="register-field">

                <label>
                  {t(
                    "register.preferredLanguage"
                  )}
                </label>


                <div className="language-options">

                  {languages.map(
                    (item) => (

                      <button
                        key={item.id}
                        type="button"
                        className={
                          form.language ===
                          item.id
                            ? "language-option selected"
                            : "language-option"
                        }
                        onClick={() =>
                          updateField(
                            "language",
                            item.id
                          )
                        }
                      >

                        <Globe2
                          size={15}
                        />

                        <span>
                          {item.nativeLabel}
                        </span>


                        {form.language ===
                          item.id && (

                          <Check
                            size={14}
                          />

                        )}

                      </button>

                    )
                  )}

                </div>


                <span className="register-hint">

                  {t(
                    "register.changeLater"
                  )}

                </span>

              </div>

            </div>



            {errors.submit && (

              <div className="register-submit-error">

                {errors.submit}

              </div>

            )}



            <div className="register-submit-area">

              <div>

                <span>

                  {t(
                    "register.accountLanguage"
                  )}

                </span>


                <strong>

                  {selectedLanguage.nativeLabel}

                </strong>

              </div>


              <Button
                type="submit"
                disabled={submitting}
              >

                {submitting
                  ? "Creating Account..."
                  : t(
                      "register.createAccountButton"
                    )}

                {!submitting && (

                  <ArrowRight
                    size={18}
                  />

                )}

              </Button>

            </div>



            <p className="register-terms">

              {t(
                "register.terms"
              )}

            </p>


          </form>

        </section>

      </main>

    </div>
  );
}


function LocationSelect({
  label,
  value,
  icon,
  isOpen,
  onToggle,
  children,
  disabled = false,
  error = "",
  placeholder,
  typeLabel,
}) {

  const {
    t,
  } =
    useLanguage();


  return (

    <div className="register-field">

      <label>
        {label}
      </label>


      <div className="register-select">

        <button
          type="button"
          disabled={disabled}
          className={
            error
              ? "register-select-button-error"
              : ""
          }
          onClick={onToggle}
        >

          <div className="register-select-main">

            <div className="register-select-icon">

              {icon}

            </div>


            <div>

              <strong>

                {
                  value ||
                  placeholder
                }

              </strong>


              <span>

                {disabled
                  ? t(
                      "location.selectPreviousFirst"
                    )
                  : typeLabel ||
                    label}

              </span>

            </div>

          </div>


          <ChevronDown
            size={16}
          />

        </button>


        {isOpen &&
          !disabled && (

            <div className="register-dropdown">

              {children}

            </div>

          )}

      </div>


      {error && (

        <span className="register-error">

          {error}

        </span>

      )}

    </div>

  );
}


function Benefit({
  icon,
  title,
  description,
}) {

  return (

    <div>

      <div className="register-benefit-icon">

        {icon}

      </div>


      <div>

        <strong>

          {title}

        </strong>


        <span>

          {description}

        </span>

      </div>

    </div>

  );
}


function CalendarIcon() {

  return (

    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >

      <rect
        x="3"
        y="4"
        width="18"
        height="18"
        rx="2"
      />

      <line
        x1="16"
        y1="2"
        x2="16"
        y2="6"
      />

      <line
        x1="8"
        y1="2"
        x2="8"
        y2="6"
      />

      <line
        x1="3"
        y1="10"
        x2="21"
        y2="10"
      />

    </svg>

  );
}


function MessageIcon() {

  return (

    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >

      <path
        d="M21 11.5a8.5 8.5 0 0 1-8.9 8.5A8.6 8.6 0 0 1 8 18.8L3 20l1.3-4.3A8.4 8.4 0 0 1 4.5 11.5A8.5 8.5 0 0 1 21 11.5Z"
      />

    </svg>

  );
}


function ShieldIcon() {

  return (

    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >

      <path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"
      />

      <path
        d="m9 12 2 2 4-4"
      />

    </svg>

  );
}


export default FarmerRegister;