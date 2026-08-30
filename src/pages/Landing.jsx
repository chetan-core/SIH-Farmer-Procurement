
import {
  ArrowDown,
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  Coins,
  Leaf,
  MapPin,
  Menu,
  Scale,
  ShieldCheck,
  Smartphone,
  Wheat,
  X,
} from "lucide-react";

import {
  Link,
} from "react-router";

import {
  useState,
} from "react";

import Logo from "../components/Logo";


function Landing() {

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false);


  function closeMenu() {
    setMobileMenuOpen(false);
  }


  return (

    <div className="landing-page">


      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="landing-header">

        <Link
          to="/"
          className="landing-brand"
          onClick={closeMenu}
        >

          <Logo
            size={72}
            showName
          />

        </Link>


        <nav className="landing-nav">

          <a href="#purpose">
            Our Purpose
          </a>

          <a href="#how-it-works">
            How It Works
          </a>

          <a href="#portals">
            Portals
          </a>

          <a href="#features">
            Features
          </a>

        </nav>


        <div className="landing-header-actions">

          <Link
            to="/farmer/login"
            className="landing-nav-farmer"
          >
            Farmer Portal
          </Link>


          <Link
            to="/admin/login"
            className="landing-nav-admin"
          >
            Operations
          </Link>

        </div>


        <button
          type="button"
          className="landing-mobile-menu-button"
          onClick={() =>
            setMobileMenuOpen(
              !mobileMenuOpen
            )
          }
          aria-label="Toggle navigation"
        >

          {mobileMenuOpen ? (
            <X size={24} />
          ) : (
            <Menu size={24} />
          )}

        </button>

      </header>


      {/* =====================================================
          MOBILE MENU
      ====================================================== */}

      {mobileMenuOpen && (

        <div className="landing-mobile-menu">

          <a
            href="#purpose"
            onClick={closeMenu}
          >
            Our Purpose
          </a>


          <a
            href="#how-it-works"
            onClick={closeMenu}
          >
            How It Works
          </a>


          <a
            href="#portals"
            onClick={closeMenu}
          >
            Portals
          </a>


          <a
            href="#features"
            onClick={closeMenu}
          >
            Features
          </a>


          <Link
            to="/farmer/login"
            onClick={closeMenu}
          >
            Farmer Portal
          </Link>


          <Link
            to="/admin/login"
            onClick={closeMenu}
          >
            Operations Portal
          </Link>

        </div>

      )}


      <main>


        {/* =====================================================
            HERO
        ====================================================== */}

        <section className="landing-hero">


          {/* BACKGROUND */}

          <div className="landing-hero-background">

            <div className="landing-glow landing-glow-one" />

            <div className="landing-glow landing-glow-two" />

            <div className="landing-grid-pattern" />

          </div>


          {/* =================================================
              LARGE BACKGROUND JOURNEY
          ================================================== */}

          <div className="landing-hero-visual">

            <div className="landing-visual-glow" />

            <div className="landing-journey-illustration">


              <div className="journey-orbit orbit-main" />

              <div className="journey-orbit orbit-inner" />


              {/* CENTER */}

              <div className="journey-center">

                <div className="journey-center-icon">

                  <Wheat
                    size={54}
                  />

                </div>


                <strong>
                  KrishiSetu
                </strong>


                <span>
                  FARM → MARKET
                </span>

              </div>


              {/* FARM */}

              <div className="journey-node journey-farm">

                <div className="journey-node-icon">

                  <Wheat
                    size={22}
                  />

                </div>


                <div>

                  <span>
                    FARM
                  </span>

                  <strong>
                    Produce
                  </strong>

                </div>

              </div>


              {/* TOKEN */}

              <div className="journey-node journey-token">

                <div className="journey-node-icon">

                  <ShieldCheck
                    size={22}
                  />

                </div>


                <div>

                  <span>
                    TOKEN
                  </span>

                  <strong>
                    #B018
                  </strong>

                </div>

              </div>


              {/* WEIGHING */}

              <div className="journey-node journey-weighing">

                <div className="journey-node-icon">

                  <Scale
                    size={22}
                  />

                </div>


                <div>

                  <span>
                    WEIGHING
                  </span>

                  <strong>
                    248 kg
                  </strong>

                </div>

              </div>


              {/* CENTER */}

              <div className="journey-node journey-center-node">

                <div className="journey-node-icon">

                  <MapPin
                    size={22}
                  />

                </div>


                <div>

                  <span>
                    CENTER
                  </span>

                  <strong>
                    Arrival
                  </strong>

                </div>

              </div>


              {/* PAYMENT */}

              <div className="journey-node journey-payment">

                <div className="journey-node-icon">

                  <Coins
                    size={22}
                  />

                </div>


                <div>

                  <span>
                    PAYMENT
                  </span>

                  <strong>
                    Tracked
                  </strong>

                </div>

              </div>


              {/* PULSES */}

              <div className="journey-pulse pulse-one" />

              <div className="journey-pulse pulse-two" />

              <div className="journey-pulse pulse-three" />

            </div>

          </div>


          {/* =================================================
              HERO CONTENT
          ================================================== */}

          <div className="landing-hero-content">


            <div className="landing-hero-badge">

              <Leaf
                size={17}
              />

              <span>
                DIGITAL PROCUREMENT FOR AGRICULTURE
              </span>

            </div>


            <div className="landing-hero-logo">

              <Logo
                size={118}
                showName
              />

            </div>


            <h1>

              A simpler bridge

              <span>
                from farm to market.
              </span>

            </h1>


            <p className="landing-hero-description">

              KrishiSetu helps farmers book procurement
              slots, receive digital tokens, know when
              to arrive, follow procurement status and
              track payment from one connected system.

            </p>


            <div className="landing-hero-actions">

              <Link
                to="/farmer/login"
                className="landing-primary-button"
              >

                <Wheat
                  size={21}
                />

                Enter Farmer Portal

                <ArrowRight
                  size={18}
                />

              </Link>


              <a
                href="#how-it-works"
                className="landing-secondary-button"
              >

                See How It Works

                <ArrowDown
                  size={18}
                />

              </a>

            </div>


            <div className="landing-hero-points">


              <div>

                <CheckCircle2
                  size={18}
                />

                <span>
                  Schedule your arrival
                </span>

              </div>


              <div>

                <CheckCircle2
                  size={18}
                />

                <span>
                  Get a digital token
                </span>

              </div>


              <div>

                <CheckCircle2
                  size={18}
                />

                <span>
                  Follow your payment
                </span>

              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            TRUST STRIP
        ====================================================== */}

        <section className="landing-trust-strip">


          <div>

            <ShieldCheck
              size={20}
            />

            <span>
              Clear procurement status
            </span>

          </div>


          <div>

            <CalendarCheck2
              size={20}
            />

            <span>
              Scheduled arrival windows
            </span>

          </div>


          <div>

            <Smartphone
              size={20}
            />

            <span>
              SMS-ready communication
            </span>

          </div>


          <div>

            <Wheat
              size={20}
            />

            <span>
              Farmer-first experience
            </span>

          </div>

        </section>


        {/* =====================================================
            PURPOSE
        ====================================================== */}

        <section
          id="purpose"
          className="landing-purpose-section"
        >

          <div className="landing-section-heading">

            <span>
              OUR PURPOSE
            </span>


            <h2>

              Procurement should feel

              <em>
                simple.
              </em>

            </h2>


            <p>

              Farmers should know where to go,
              when to arrive, what happens next
              and when their payment is complete.

            </p>

          </div>


          <div className="landing-purpose-grid">


            <div className="purpose-card purpose-green">

              <div className="purpose-card-number">
                01
              </div>


              <div className="purpose-card-icon">

                <Leaf
                  size={30}
                />

              </div>


              <span>
                FOR FARMERS
              </span>


              <h3>
                Less uncertainty
              </h3>


              <p>

                Book a suitable procurement window
                and arrive with a clear digital token
                instead of waiting without knowing
                when your turn will come.

              </p>

            </div>


            <div className="purpose-card purpose-gold">

              <div className="purpose-card-number">
                02
              </div>


              <div className="purpose-card-icon">

                <Scale
                  size={30}
                />

              </div>


              <span>
                FOR PROCUREMENT
              </span>


              <h3>
                Better visibility
              </h3>


              <p>

                Give operators a clear view of the
                queue, weighing stage, procurement
                status and payment journey.

              </p>

            </div>


            <div className="purpose-card purpose-blue">

              <div className="purpose-card-number">
                03
              </div>


              <div className="purpose-card-icon">

                <Smartphone
                  size={30}
                />

              </div>


              <span>
                ONE CONNECTED SYSTEM
              </span>


              <h3>
                Information in one place
              </h3>


              <p>

                Connect the farmer's booking with
                operational actions so every important
                step follows the same record.

              </p>

            </div>

          </div>

        </section>


        {/* =====================================================
            FLOW
        ====================================================== */}

        <section className="landing-stats-strip">


          <div>
            <strong>
              01
            </strong>

            <span>
              Book
            </span>
          </div>


          <div className="stats-arrow">

            <ArrowRight
              size={20}
            />

          </div>


          <div>
            <strong>
              02
            </strong>

            <span>
              Token
            </span>
          </div>


          <div className="stats-arrow">

            <ArrowRight
              size={20}
            />

          </div>


          <div>
            <strong>
              03
            </strong>

            <span>
              Arrive
            </span>
          </div>


          <div className="stats-arrow">

            <ArrowRight
              size={20}
            />

          </div>


          <div>
            <strong>
              04
            </strong>

            <span>
              Weigh
            </span>
          </div>


          <div className="stats-arrow">

            <ArrowRight
              size={20}
            />

          </div>


          <div>
            <strong>
              05
            </strong>

            <span>
              Procure
            </span>
          </div>


          <div className="stats-arrow">

            <ArrowRight
              size={20}
            />

          </div>


          <div>
            <strong>
              06
            </strong>

            <span>
              Payment
            </span>
          </div>

        </section>


        {/* =====================================================
            HOW IT WORKS
        ====================================================== */}

        <section
          id="how-it-works"
          className="landing-process-section"
        >

          <div className="landing-section-heading centered">

            <span>
              HOW IT WORKS
            </span>


            <h2>

              From booking to payment,

              <em>
                every step is visible.
              </em>

            </h2>


            <p>
              One connected journey for the farmer
              and procurement team.
            </p>

          </div>


          <div className="landing-process-track">


            <ProcessStep
              number="01"
              icon={<UserIcon />}
              title="Register"
              text="Create your farmer account with basic details and location."
              tone="green"
            />


            <ProcessConnector />


            <ProcessStep
              number="02"
              icon={
                <CalendarCheck2
                  size={28}
                />
              }
              title="Book a slot"
              text="Choose your crop, quantity, center and available arrival window."
              tone="gold"
            />


            <ProcessConnector />


            <ProcessStep
              number="03"
              icon={
                <ShieldCheck
                  size={28}
                />
              }
              title="Receive token"
              text="Get a digital token that identifies your procurement booking."
              tone="blue"
            />


            <ProcessConnector />


            <ProcessStep
              number="04"
              icon={
                <MapPin
                  size={28}
                />
              }
              title="Arrive"
              text="Come to your selected procurement center during your assigned window."
              tone="orange"
            />


            <ProcessConnector />


            <ProcessStep
              number="05"
              icon={
                <Scale
                  size={28}
                />
              }
              title="Weigh"
              text="The procurement team records actual produce weight and quality."
              tone="green"
            />


            <ProcessConnector />


            <ProcessStep
              number="06"
              icon={
                <CheckCircle2
                  size={28}
                />
              }
              title="Procure"
              text="Your produce moves through a recorded procurement workflow."
              tone="blue"
            />


            <ProcessConnector />


            <ProcessStep
              number="07"
              icon={
                <Coins
                  size={28}
                />
              }
              title="Payment"
              text="Follow the payment stage after procurement is completed."
              tone="gold"
              last
            />

          </div>

        </section>


        {/* =====================================================
            PORTALS
        ====================================================== */}

        <section
          id="portals"
          className="landing-portals-section"
        >

          <div className="landing-portals-intro">

            <span>
              CHOOSE YOUR PATH
            </span>


            <h2>

              One platform.

              <br />

              <em>
                Two connected experiences.
              </em>

            </h2>


            <p>

              Farmers and procurement teams work from
              different sides of the same system.

            </p>

          </div>


          <div className="landing-portal-grid">


            <Link
              to="/farmer/login"
              className="landing-portal-card farmer"
            >

              <div className="portal-card-top">

                <div className="portal-number">
                  01
                </div>


                <div className="portal-card-icon">

                  <Wheat
                    size={35}
                  />

                </div>

              </div>


              <div className="portal-card-content">

                <span>
                  FARMER PORTAL
                </span>


                <h3>

                  Bring your produce.
                  <br />
                  We'll help plan the visit.

                </h3>


                <p>

                  Register, choose what you're bringing,
                  reserve a procurement window, receive
                  a token and follow the journey from
                  arrival to payment.

                </p>


                <div className="portal-card-features">


                  <span>

                    <CheckCircle2
                      size={16}
                    />

                    Book a procurement slot

                  </span>


                  <span>

                    <CheckCircle2
                      size={16}
                    />

                    Get a digital token

                  </span>


                  <span>

                    <CheckCircle2
                      size={16}
                    />

                    Track your status

                  </span>


                  <span>

                    <CheckCircle2
                      size={16}
                    />

                    Follow payment

                  </span>

                </div>

              </div>


              <div className="portal-card-action">

                <span>
                  Enter Farmer Portal
                </span>


                <div>

                  <ArrowRight
                    size={21}
                  />

                </div>

              </div>

            </Link>


            <Link
              to="/admin/login"
              className="landing-portal-card operations"
            >

              <div className="portal-card-top">

                <div className="portal-number">
                  02
                </div>


                <div className="portal-card-icon">

                  <ShieldCheck
                    size={35}
                  />

                </div>

              </div>


              <div className="portal-card-content">

                <span>
                  OPERATIONS PORTAL
                </span>


                <h3>

                  See the queue.
                  <br />
                  Control the workflow.

                </h3>


                <p>

                  Monitor incoming bookings, manage the
                  arrival queue, record weighing, complete
                  procurement and maintain payment records.

                </p>


                <div className="portal-card-features">


                  <span>

                    <CheckCircle2
                      size={16}
                    />

                    Monitor live queue

                  </span>


                  <span>

                    <CheckCircle2
                      size={16}
                    />

                    Record actual weighing

                  </span>


                  <span>

                    <CheckCircle2
                      size={16}
                    />

                    Complete procurement

                  </span>


                  <span>

                    <CheckCircle2
                      size={16}
                    />

                    Track payments and reports

                  </span>

                </div>

              </div>


              <div className="portal-card-action">

                <span>
                  Enter Operations Portal
                </span>


                <div>

                  <ArrowRight
                    size={21}
                  />

                </div>

              </div>

            </Link>

          </div>

        </section>


        {/* =====================================================
            FEATURES
        ====================================================== */}

        <section
          id="features"
          className="landing-features-section"
        >

          <div className="landing-section-heading centered">

            <span>
              THE KRISHISETU DIFFERENCE
            </span>


            <h2>

              Built around the

              <em>
                real journey.
              </em>

            </h2>


            <p>

              Important information stays visible from
              booking through payment.

            </p>

          </div>


          <div className="landing-feature-grid">


            <FeatureCard
              icon={
                <CalendarCheck2
                  size={29}
                />
              }
              title="Scheduled arrivals"
              text="Give farmers a clear procurement date and arrival window."
              tone="green"
            />


            <FeatureCard
              icon={
                <ShieldCheck
                  size={29}
                />
              }
              title="Digital identity"
              text="Each booking receives a unique token for quick identification."
              tone="blue"
            />


            <FeatureCard
              icon={
                <Scale
                  size={29}
                />
              }
              title="Transparent weighing"
              text="Keep estimated quantity and actual weight clearly separated."
              tone="orange"
            />


            <FeatureCard
              icon={
                <Coins
                  size={29}
                />
              }
              title="Payment visibility"
              text="Continue the journey into a visible payment stage."
              tone="gold"
            />


            <FeatureCard
              icon={
                <Smartphone
                  size={29}
                />
              }
              title="Status updates"
              text="Keep farmers informed as their procurement status changes."
              tone="purple"
            />


            <FeatureCard
              icon={
                <MapPin
                  size={29}
                />
              }
              title="Location-aware booking"
              text="Connect farmers with the relevant procurement center."
              tone="teal"
            />

          </div>

        </section>


        {/* =====================================================
            SUPPORT
        ====================================================== */}

        <section className="landing-support-section">

          <div className="landing-support-card">

            <div className="landing-support-icon">

              <Smartphone
                size={32}
              />

            </div>


            <div>

              <span>
                BUILT FOR REAL FARMERS
              </span>


              <h2>

                Important updates should never
                depend on remembering a website.

              </h2>


              <p>

                KrishiSetu is designed around clear
                on-screen status and SMS-ready
                communication, making the procurement
                journey easier to follow.

              </p>

            </div>

          </div>

        </section>


        {/* =====================================================
            FINAL CTA
        ====================================================== */}

        <section className="landing-final-cta">


          <div className="landing-final-cta-content">


            <span>
              READY TO GET STARTED?
            </span>


            <h2>

              Choose your

              <em>
                KrishiSetu journey.
              </em>

            </h2>


            <p>

              Start from the portal built for you.
              Farmers can plan their visit; operations
              teams can manage the journey behind it.

            </p>


            <div className="landing-final-cta-actions">


              <Link
                to="/farmer/login"
                className="landing-final-farmer-button"
              >

                <Wheat
                  size={21}
                />

                Farmer Portal

                <ArrowRight
                  size={18}
                />

              </Link>


              <Link
                to="/admin/login"
                className="landing-final-admin-button"
              >

                <ShieldCheck
                  size={21}
                />

                Operations Portal

                <ArrowRight
                  size={18}
                />

              </Link>

            </div>

          </div>


          <div className="landing-final-cta-decoration">


            <div>

              <Wheat
                size={105}
              />

            </div>


            <div>

              <Scale
                size={82}
              />

            </div>


            <div>

              <Coins
                size={74}
              />

            </div>

          </div>

        </section>

      </main>


      {/* =====================================================
          FOOTER
      ====================================================== */}

      <footer className="landing-footer">


        <div className="landing-footer-main">


          <div className="landing-footer-brand">


            <Link
              to="/"
              className="landing-footer-logo"
            >

              <Logo
                size={58}
                showName
              />

            </Link>


            <p>

              A digital bridge between farmers
              and agricultural procurement.

            </p>

          </div>


          <div className="landing-footer-column">


            <strong>
              PLATFORM
            </strong>


            <a href="#purpose">
              Our Purpose
            </a>


            <a href="#how-it-works">
              How It Works
            </a>


            <a href="#features">
              Features
            </a>

          </div>


          <div className="landing-footer-column">


            <strong>
              FARMERS
            </strong>


            <Link
              to="/farmer/login"
            >
              Farmer Login
            </Link>


            <Link
              to="/farmer/register"
            >
              Create Account
            </Link>


            <Link
              to="/farmer/help"
            >
              Farmer Help
            </Link>

          </div>


          <div className="landing-footer-column">


            <strong>
              OPERATIONS
            </strong>


            <Link
              to="/admin/login"
            >
              Operations Login
            </Link>


            <Link
              to="/admin/dashboard"
            >
              Dashboard
            </Link>


            <Link
              to="/admin/reports"
            >
              Reports
            </Link>

          </div>

        </div>


        <div className="landing-footer-bottom">


          <span>

            © {new Date().getFullYear()} KrishiSetu

          </span>


          <span>
            Smart Procurement System
          </span>


          <span>
            SIH Prototype
          </span>

        </div>

      </footer>

    </div>

  );
}


/* =========================================================
   PROCESS STEP
========================================================= */

function ProcessStep({
  number,
  icon,
  title,
  text,
  tone,
  last = false,
}) {

  return (

    <div
      className={
        `landing-process-step tone-${tone} ${
          last
            ? "last"
            : ""
        }`
      }
    >

      <div className="process-step-top">

        <span>
          {number}
        </span>


        <div className="process-step-icon">

          {icon}

        </div>

      </div>


      <h3>
        {title}
      </h3>


      <p>
        {text}
      </p>

    </div>

  );
}


/* =========================================================
   PROCESS CONNECTOR
========================================================= */

function ProcessConnector() {

  return (

    <div className="landing-process-connector">

      <ArrowRight
        size={20}
      />

    </div>

  );
}


/* =========================================================
   FEATURE CARD
========================================================= */

function FeatureCard({
  icon,
  title,
  text,
  tone,
}) {

  return (

    <div
      className={
        `landing-feature-card tone-${tone}`
      }
    >

      <div className="landing-feature-icon">

        {icon}

      </div>


      <div>

        <h3>
          {title}
        </h3>


        <p>
          {text}
        </p>

      </div>

    </div>

  );
}


/* =========================================================
   USER ICON
========================================================= */

function UserIcon() {

  return (

    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >

      <path
        d="M20 21a8 8 0 0 0-16 0"
      />


      <circle
        cx="12"
        cy="7"
        r="4"
      />

    </svg>

  );
}


export default Landing;
