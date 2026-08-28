import {
  ArrowLeft,
  ArrowRight,
  Check,
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
  setCurrentUser,
} from "../../data/appStore";


const API_URL =
  "http://localhost:5000/api";


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
    useState(
      ""
    );


  const [
    error,
    setError,
  ] =
    useState(
      ""
    );


  const [
    loading,
    setLoading,
  ] =
    useState(
      false
    );


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


  async function handleSubmit(
    event
  ) {

    event.preventDefault();


    if (
      phone.length !== 10
    ) {

      setError(
        "Please enter a valid 10-digit mobile number."
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
          `${API_URL}/farmers`
        );


      if (
        !response.ok
      ) {

        throw new Error(
          "Unable to connect to the server."
        );
      }


      const data =
        await response.json();


      const farmers =
        Array.isArray(
          data?.farmers
        )
          ? data.farmers
          : [];


      const farmer =
        farmers.find(
          (item) =>
            String(
              item?.phone ||
              ""
            ).replace(
              /\D/g,
              ""
            ) ===
            phone
        );


      if (!farmer) {

        throw new Error(
          "No farmer account was found for this mobile number."
        );
      }


      /*
       * Convert database field names into
       * the format used by appStore.
       */

      setCurrentUser({
        role:
          "farmer",

        farmerId:
          farmer.id,
      });


      navigate(
        "/farmer/home"
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
        "Unable to login. Please try again."
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
              size={16}
            />

            {t(
              "common.back"
            )}

          </Link>

        </div>



        <section className="login-layout">


          <div className="login-intro">


            <span className="page-eyebrow">
              FARMER PORTAL
            </span>


            <h1>

              Welcome to

              <span>
                KrishiSetu
              </span>

            </h1>


            <p>

              Login with your registered
              mobile number to view bookings,
              procurement status and payments.

            </p>



            <div className="login-feature-list">


              <div className="login-feature">

                <div className="login-feature-icon">

                  <ShieldCheck
                    size={18}
                  />

                </div>


                <div>

                  <strong>
                    Secure access
                  </strong>


                  <span>
                    Your farmer account stays protected.
                  </span>

                </div>

              </div>



              <div className="login-feature">

                <div className="login-feature-icon">

                  <Check
                    size={18}
                  />

                </div>


                <div>

                  <strong>
                    Live booking status
                  </strong>


                  <span>
                    Track your procurement journey.
                  </span>

                </div>

              </div>



              <div className="login-feature">

                <div className="login-feature-icon">

                  <UserRound
                    size={18}
                  />

                </div>


                <div>

                  <strong>
                    Farmer account
                  </strong>


                  <span>
                    Your registered details are reused.
                  </span>

                </div>

              </div>


            </div>

          </div>



          <div className="login-form-card">


            <div className="login-form-heading">

              <div className="login-form-icon">

                <Phone
                  size={21}
                />

              </div>


              <div>

                <span className="page-eyebrow">
                  MOBILE LOGIN
                </span>


                <h2>
                  Login to your account
                </h2>


                <p>
                  Enter your registered
                  mobile number.
                </p>

              </div>

            </div>



            <form
              onSubmit={
                handleSubmit
              }
            >


              <div className="login-field">

                <label htmlFor="farmer-phone">

                  Mobile Number

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
                    placeholder="9876543210"
                    onChange={
                      handlePhoneChange
                    }
                  />


                  {phone.length === 10 && (

                    <Check
                      size={17}
                      className="login-phone-check"
                    />

                  )}

                </div>


                <small>
                  Use the same number used during registration.
                </small>

              </div>



              {error && (

                <div className="login-error">

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

                {
                  loading
                    ? "Checking account..."
                    : "Continue"
                }


                {!loading && (

                  <ArrowRight
                    size={18}
                  />

                )}

              </Button>


            </form>



            <div className="login-divider">

              <span>
                New to KrishiSetu?
              </span>

            </div>



            <Link
              to="/farmer/register"
              className="login-register-link"
            >

              Create Farmer Account

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