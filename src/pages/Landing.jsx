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


  return (
    <div className="landing-page">


      <header className="landing-header">

        <Link
          to="/"
          className="landing-brand"
        >

          <Logo
            size={58}
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

            Farmer

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


      {mobileMenuOpen && (

        <div className="landing-mobile-menu">

          <a
            href="#purpose"
            onClick={() =>
              setMobileMenuOpen(false)
            }
          >
            Our Purpose
          </a>

          <a
            href="#how-it-works"
            onClick={() =>
              setMobileMenuOpen(false)
            }
          >
            How It Works
          </a>

          <a
            href="#portals"
            onClick={() =>
              setMobileMenuOpen(false)
            }
          >
            Portals
          </a>

          <a
            href="#features"
            onClick={() =>
              setMobileMenuOpen(false)
            }
          >
            Features
          </a>

          <Link
            to="/farmer/login"
            onClick={() =>
              setMobileMenuOpen(false)
            }
          >
            Farmer Portal
          </Link>

          <Link
            to="/admin/login"
            onClick={() =>
              setMobileMenuOpen(false)
            }
          >
            Operations Portal
          </Link>

        </div>

      )}



      <main>


        <section className="landing-hero">


          <div className="landing-hero-content">


            <div className="landing-hero-badge">

              <Leaf size={16} />

              <span>
                DIGITAL PROCUREMENT FOR AGRICULTURE
              </span>

            </div>


            <div className="landing-hero-logo">

              <Logo
                size={112}
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

              KrishiSetu helps farmers book
              procurement slots, receive digital
              tokens, follow their place in the
              queue, complete transparent weighing,
              and track payment from one connected
              system.

            </p>


            <div className="landing-hero-actions">


              <Link
                to="/farmer/login"
                className="landing-primary-button"
              >

                <Wheat size={20} />

                Enter Farmer Portal

                <ArrowRight size={18} />

              </Link>


              <a
                href="#portals"
                className="landing-secondary-button"
              >

                Explore the Platform

                <ArrowDown size={18} />

              </a>

            </div>


            <div className="landing-hero-points">

              <div>

                <CheckCircle2
                  size={18}
                />

                <span>
                  Scheduled procurement
                </span>

              </div>


              <div>

                <CheckCircle2
                  size={18}
                />

                <span>
                  Digital token tracking
                </span>

              </div>


              <div>

                <CheckCircle2
                  size={18}
                />

                <span>
                  Transparent status updates
                </span>

              </div>

            </div>

          </div>



          <div className="landing-hero-visual">


            <div className="landing-orbit landing-orbit-one" />

            <div className="landing-orbit landing-orbit-two" />


            <div className="landing-farm-illustration">


              <div className="landing-sun">

                <span />

              </div>


              <div className="landing-cloud cloud-one" />

              <div className="landing-cloud cloud-two" />



              <div className="landing-field field-one" />

              <div className="landing-field field-two" />

              <div className="landing-field field-three" />


              <div className="landing-farm-tile">

                <Wheat
                  size={72}
                  strokeWidth={1.4}
                />

                <span>
                  FARM
                </span>

              </div>


              <div className="landing-floating-card card-token">

                <div className="floating-card-icon">

                  <ShieldCheck
                    size={20}
                  />

                </div>


                <div>

                  <span>
                    DIGITAL TOKEN
                  </span>

                  <strong>
                    #B018
                  </strong>

                </div>

              </div>


              <div className="landing-floating-card card-weighing">

                <div className="floating-card-icon">

                  <Scale
                    size={20}
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


              <div className="landing-floating-card card-payment">

                <div className="floating-card-icon">

                  <Coins
                    size={20}
                  />

                </div>


                <div>

                  <span>
                    PAYMENT
                  </span>

                  <strong>
                    TRACKED
                  </strong>

                </div>

              </div>

            </div>

          </div>

        </section>



        <section
          id="purpose"
          className="landing-purpose-section"
        >


          <div className="landing-section-heading">

            <span>
              OUR PURPOSE
            </span>

            <h2>
              Procurement should be
              easier to understand.
            </h2>

            <p>
              Farmers should know where to go,
              when to arrive, what happens next,
              and when their payment is complete.
              Operations teams should have the same
              clarity from the other side.
            </p>

          </div>



          <div className="landing-purpose-grid">


            <div className="purpose-card purpose-green">

              <div className="purpose-card-icon">

                <Leaf size={28} />

              </div>


              <span>
                FOR FARMERS
              </span>


              <h3>
                Less uncertainty
              </h3>


              <p>
                Replace crowded, unclear arrival
                processes with a simple scheduled
                booking and digital token.
              </p>

            </div>



            <div className="purpose-card purpose-gold">

              <div className="purpose-card-icon">

                <Scale size={28} />

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

              <div className="purpose-card-icon">

                <Smartphone size={28} />

              </div>


              <span>
                ONE CONNECTED SYSTEM
              </span>


              <h3>
                Information in one place
              </h3>


              <p>
                Connect farmer bookings with
                operational actions so each step
                follows the same record.
              </p>

            </div>

          </div>


        </section>



        <section className="landing-stats-strip">


          <div>

            <strong>
              01
            </strong>

            <span>
              Booking
            </span>

          </div>


          <div>

            <strong>
              02
            </strong>

            <span>
              Token
            </span>

          </div>


          <div>

            <strong>
              03
            </strong>

            <span>
              Weighing
            </span>

          </div>


          <div>

            <strong>
              04
            </strong>

            <span>
              Payment
            </span>

          </div>

        </section>
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
              every step is visible.
            </h2>

            <p>
              KrishiSetu connects the farmer's
              booking with the procurement team's
              operational workflow.
            </p>

          </div>



          <div className="landing-process-track">


            <ProcessStep
              number="01"
              icon={
                <UserIcon />
              }
              title="Register"
              text="Create a farmer account with your basic details and location."
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
              text="Choose your crop, quantity, center, date and available time window."
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
              text="Come to the selected procurement center during your assigned slot."
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
              text="The procurement team records the actual produce weight and quality."
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
              text="The produce moves through the procurement process with a recorded status."
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
              text="The farmer can follow the payment stage after procurement is completed."
              tone="gold"
              last
            />

          </div>


        </section>



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
              Two connected experiences.
            </h2>


            <p>
              Farmers and procurement teams work
              from different sides of the same
              system, with the booking record
              connecting every stage.
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
                    size={32}
                  />

                </div>

              </div>


              <div className="portal-card-content">

                <span>
                  FARMER PORTAL
                </span>


                <h3>
                  Bring your produce.
                  We'll help you plan the visit.
                </h3>


                <p>
                  Register your details, choose
                  what you're bringing, reserve a
                  procurement window, receive a
                  token and follow the journey from
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
                    size={20}
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
                    size={32}
                  />

                </div>

              </div>


              <div className="portal-card-content">

                <span>
                  OPERATIONS PORTAL
                </span>


                <h3>
                  See the queue.
                  Control the workflow.
                </h3>


                <p>
                  Monitor incoming bookings,
                  manage the arrival queue, record
                  weighing, complete procurement and
                  maintain payment records.
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
                    size={20}
                  />

                </div>

              </div>


            </Link>

          </div>

        </section>



        <section
          id="features"
          className="landing-features-section"
        >


          <div className="landing-section-heading centered">

            <span>
              THE KRISHISETU DIFFERENCE
            </span>


            <h2>
              Designed around the real procurement journey.
            </h2>

            <p>
              The platform focuses on making each
              important handoff visible and easy to
              understand.
            </p>

          </div>



          <div className="landing-feature-grid">


            <FeatureCard
              icon={
                <CalendarCheck2
                  size={27}
                />
              }
              title="Scheduled arrivals"
              text="Reduce uncertainty by assigning farmers a clear procurement date and arrival window."
              tone="green"
            />


            <FeatureCard
              icon={
                <ShieldCheck
                  size={27}
                />
              }
              title="Digital identity"
              text="Each booking receives a unique token so the operational team can identify it quickly."
              tone="blue"
            />


            <FeatureCard
              icon={
                <Scale
                  size={27}
                />
              }
              title="Transparent weighing"
              text="Estimated quantity and actual weight can be kept as separate records for clarity."
              tone="orange"
            />


            <FeatureCard
              icon={
                <Coins
                  size={27}
                />
              }
              title="Payment visibility"
              text="The procurement journey can continue into a visible payment stage instead of ending at weighing."
              tone="gold"
            />


            <FeatureCard
              icon={
                <Smartphone
                  size={27}
                />
              }
              title="Status updates"
              text="The farmer-facing experience is designed around clear changes in procurement status."
              tone="purple"
            />


            <FeatureCard
              icon={
                <MapPin
                  size={27}
                />
              }
              title="Location-aware booking"
              text="Farmer location information can be used to connect the booking experience with procurement centers."
              tone="teal"
            />

          </div>


        </section>
                <section className="landing-purpose-final-section">

          <div className="landing-purpose-final-card">

            <div className="landing-purpose-final-mark">

              <Leaf
                size={34}
              />

            </div>


            <div>

              <span>
                OUR GOAL
              </span>


              <h2>
                Make agricultural procurement
                simpler, clearer and more connected.
              </h2>


              <p>
                KrishiSetu is designed to create a
                common digital journey between the
                farmer and the procurement team —
                from the first booking to the final
                payment update.
              </p>

            </div>

          </div>

        </section>



        <section className="landing-final-cta">

          <div className="landing-final-cta-content">

            <span>
              READY TO GET STARTED?
            </span>


            <h2>
              Choose your KrishiSetu journey.
            </h2>


            <p>
              Whether you're bringing produce to a
              procurement center or managing the
              operations behind it, start from the
              portal built for you.
            </p>


            <div className="landing-final-cta-actions">


              <Link
                to="/farmer/login"
                className="landing-final-farmer-button"
              >

                <Wheat
                  size={20}
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
                  size={20}
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
                size={100}
              />
            </div>

            <div>
              <Scale
                size={80}
              />
            </div>

            <div>
              <Coins
                size={72}
              />
            </div>

          </div>

        </section>

      </main>



      <footer className="landing-footer">


        <div className="landing-footer-main">


          <div className="landing-footer-brand">

            <Link
              to="/"
              className="landing-footer-logo"
            >

              <Logo
                size={50}
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



function ProcessConnector() {

  return (

    <div className="landing-process-connector">

      <ArrowRight
        size={20}
      />

    </div>

  );
}



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