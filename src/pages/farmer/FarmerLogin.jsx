import {
  ArrowLeft,
  ArrowRight,
  Check,
  LockKeyhole,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router";

import {
  useState,
} from "react";

import Header from "../../components/Header";
import Button from "../../components/Button";

import {
  useLanguage,
} from "../../translations/LanguageContext";

import {
  setCurrentFarmer,
} from "../../data/appStore";


const API_URL =
  String(
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api"
  ).replace(
    /\/+$/,
    ""
  );


function FarmerLogin() {

  const navigate =
    useNavigate();


  const {
    t,
  } =
    useLanguage();


  const [
    phone,
    setPhone,
  ] =
    useState("");


  const [
    password,
    setPassword,
  ] =
    useState("");


  const [
    showPassword,
    setShowPassword,
  ] =
    useState(false);


  const [
    error,
    setError,
  ] =
    useState("");


  const [
    loading,
    setLoading,
  ] =
    useState(false);


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


    setPhone(
      value
    );


    setError(
      ""
    );

  }


  function handlePasswordChange(
    event
  ) {

    setPassword(
      event.target.value
    );


    setError(
      ""
    );

  }


  async function handleSubmit(
    event
  ) {

    event.preventDefault();


    if (
      phone.length !==
      10
    ) {

      setError(
        t(
          "auth.invalidPhone"
        )
      );

      return;

    }


    if (
      password.length <
      6
    ) {

      setError(
        "Please enter your password."
      );

      return;

    }


    setLoading(
      true
    );


    setError(
      ""
    );


    try {

      const response =
        await fetch(
          `${API_URL}/farmers/login`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                phone,
                password,
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
        !response.ok ||
        data?.success === false
      ) {

        throw new Error(
          data?.message ||
          "Invalid mobile number or password."
        );

      }


      const farmer =
        data?.farmer;


      if (
        !farmer?.id
      ) {

        throw new Error(
          "Farmer account data is incomplete."
        );

      }


      /*
        Store the actual farmer returned
        by the backend, including the
        production GPS/location fields.
      */
      setCurrentFarmer(
        farmer
      );


      navigate(
        "/farmer/home",
        {
          replace:
            true,
        }
      );


    } catch (
      loginError
    ) {

      console.error(
        "Farmer login error:",
        loginError
      );


      setError(
        loginError?.message ||
        t(
          "common.error"
        )
      );


    } finally {

      setLoading(
        false
      );

    }

  }


  return (

    <div className="farmer-login-page">

      <Header
        showHelp={false}
      />


      <main className="login-container">


        <div className="login-back-row">

          <Link
            to="/"
            className="back-link"
          >

            <ArrowLeft
              size={17}
            />

            {t(
              "common.back"
            )}

          </Link>

        </div>


        <section className="login-layout">


          <div className="login-intro">

            <span className="page-eyebrow">

              {t(
                "common.farmer"
              )}

            </span>


            <h1>

              {t(
                "auth.welcome"
              )}

            </h1>


            <p>

              {t(
                "auth.loginDescription"
              )}

            </p>


            <div className="login-feature-list">


              <div className="login-feature">

                <div className="login-feature-icon">

                  <ShieldCheck
                    size={19}
                  />

                </div>


                <div>

                  <strong>

                    {t(
                      "auth.secureAccess"
                    )}

                  </strong>


                  <span>

                    {t(
                      "auth.secureAccessDescription"
                    )}

                  </span>

                </div>

              </div>


              <div className="login-feature">

                <div className="login-feature-icon">

                  <Check
                    size={19}
                  />

                </div>


                <div>

                  <strong>

                    {t(
                      "auth.liveStatus"
                    )}

                  </strong>


                  <span>

                    {t(
                      "auth.liveStatusDescription"
                    )}

                  </span>

                </div>

              </div>


              <div className="login-feature">

                <div className="login-feature-icon">

                  <UserRound
                    size={19}
                  />

                </div>


                <div>

                  <strong>

                    {t(
                      "auth.farmerAccount"
                    )}

                  </strong>


                  <span>

                    {t(
                      "auth.farmerAccountDescription"
                    )}

                  </span>

                </div>

              </div>


            </div>

          </div>


          <div className="login-form-card">


            <div className="login-form-heading">

              <div className="login-form-icon">

                <Phone
                  size={22}
                />

              </div>


              <div>

                <span className="page-eyebrow">

                  {t(
                    "auth.mobileLogin"
                  )}

                </span>


                <h2>

                  {t(
                    "auth.loginTitle"
                  )}

                </h2>


                <p>

                  Use your registered mobile number and password.

                </p>

              </div>

            </div>


            <form
              onSubmit={
                handleSubmit
              }
            >

              <div className="login-field">

                <label
                  htmlFor="farmer-phone"
                >

                  {t(
                    "auth.mobileNumber"
                  )}

                </label>


                <div className="login-phone-input">

                  <span className="login-country">

                    +91

                  </span>


                  <input
                    id="farmer-phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={
                      phone
                    }
                    placeholder={
                      t(
                        "auth.phonePlaceholder"
                      )
                    }
                    onChange={
                      handlePhoneChange
                    }
                    autoComplete="tel"
                  />


                  {phone.length ===
                    10 && (

                    <Check
                      size={18}
                      className="login-phone-check"
                    />

                  )}

                </div>


                <small>

                  {t(
                    "auth.numberHint"
                  )}

                </small>

              </div>


              <div className="login-field">

                <label
                  htmlFor="farmer-password"
                >

                  Password

                </label>


                <div
                  className="login-phone-input"
                >

                  <span className="login-country">

                    <LockKeyhole
                      size={17}
                    />

                  </span>


                  <input
                    id="farmer-password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={
                      password
                    }
                    onChange={
                      handlePasswordChange
                    }
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />


                  <button
                    type="button"
                    className="login-password-toggle"
                    onClick={() =>
                      setShowPassword(
                        value =>
                          !value
                      )
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >

                    {showPassword
                      ? "Hide"
                      : "Show"}

                  </button>

                </div>

              </div>


              {error && (

                <div
                  className="login-error"
                  role="alert"
                >

                  {error}

                </div>

              )}


              <Button
                fullWidth
                type="submit"
                disabled={
                  loading
                }
              >

                {loading
                  ? "Signing in..."
                  : t(
                      "common.continue"
                    )}


                {!loading && (

                  <ArrowRight
                    size={18}
                  />

                )}

              </Button>


            </form>


            <div className="login-divider">

              <span>

                {t(
                  "auth.newToKrishiSetu"
                )}

              </span>

            </div>


            <Link
              to="/farmer/register"
              className="login-register-link"
            >

              {t(
                "auth.createFarmerAccount"
              )}

              <ArrowRight
                size={15}
              />

            </Link>


          </div>

        </section>

      </main>

    </div>

  );

}


export default FarmerLogin;
