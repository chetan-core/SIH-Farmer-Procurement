import {
  useMemo,
  useState,
} from "react";


import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Coins,
  HelpCircle,
  Info,
  MapPin,
  MessageSquareText,
  Phone,
  Scale,
  ShieldCheck,
  Smartphone,
  TicketCheck,
  Wheat,
} from "lucide-react";


import {
  Link,
} from "react-router";


import Header from "../../components/Header";


import {
  useLanguage,
} from "../../translations/LanguageContext";


function FarmerHelp() {

  const {
    language,
  } =
    useLanguage();


  const copy =
    getHelpCopy(
      language
    );


  const [
    openFaq,
    setOpenFaq,
  ] =
    useState(
      0
    );


  const faqGroups =
    useMemo(
      () =>
        getFaqGroups(
          language
        ),
      [
        language,
      ]
    );


  return (

    <div className="farmer-help-page">

      <Header />


      <main className="help-container">


        {/* =====================================================
            HERO
        ====================================================== */}

        <section className="help-hero">


          <div className="help-hero-copy">


            <Link
              to="/farmer/home"
              className="back-link"
            >

              <ArrowLeft
                size={16}
              />

              {copy.back}

            </Link>


            <div className="help-eyebrow-row">

              <span className="page-eyebrow">
                {copy.eyebrow}
              </span>


              <span className="help-support-pill">

                <span />

                {copy.supportAvailable}

              </span>

            </div>


            <h1>

              {copy.titleOne}

              <span>
                {copy.titleTwo}
              </span>

            </h1>


            <p>
              {copy.description}
            </p>


            <div className="help-hero-actions">


              <Link
                to="/farmer/book"
                className="help-primary-action"
              >

                <CalendarClock
                  size={18}
                />

                {copy.bookSlot}

                <ArrowRight
                  size={16}
                />

              </Link>


              <a
                href="tel:1800123456"
                className="help-secondary-action"
              >

                <Phone
                  size={17}
                />

                {copy.callCenter}

              </a>

            </div>

          </div>



          <div className="help-hero-card">


            <div className="help-hero-card-top">

              <div className="help-hero-card-icon">

                <HelpCircle
                  size={22}
                />

              </div>


              <div>

                <span>
                  {copy.quickHelp}
                </span>


                <strong>
                  {copy.quickHelpTitle}
                </strong>

              </div>

            </div>



            <div className="help-hero-check-list">


              <HelpCheck
                text={copy.quickOne}
              />


              <HelpCheck
                text={copy.quickTwo}
              />


              <HelpCheck
                text={copy.quickThree}
              />


              <HelpCheck
                text={copy.quickFour}
              />

            </div>

          </div>

        </section>



        {/* =====================================================
            QUICK HELP
        ====================================================== */}

        <section className="help-quick-section">


          <div className="help-section-heading">

            <div>

              <span className="page-eyebrow">
                {copy.quickTopics}
              </span>


              <h2>
                {copy.quickTitle}
              </h2>


              <p>
                {copy.quickDescription}
              </p>

            </div>

          </div>



          <div className="help-topic-grid">


            <HelpTopicCard
              icon={
                <CalendarClock
                  size={22}
                />
              }
              tone="green"
              title={copy.topicBooking}
              text={copy.topicBookingText}
              onClick={() =>
                document
                  .getElementById(
                    "booking-help"
                  )
                  ?.scrollIntoView({
                    behavior:
                      "smooth",
                  })
              }
            />


            <HelpTopicCard
              icon={
                <TicketCheck
                  size={22}
                />
              }
              tone="blue"
              title={copy.topicToken}
              text={copy.topicTokenText}
              onClick={() =>
                document
                  .getElementById(
                    "token-help"
                  )
                  ?.scrollIntoView({
                    behavior:
                      "smooth",
                  })
              }
            />


            <HelpTopicCard
              icon={
                <MapPin
                  size={22}
                />
              }
              tone="orange"
              title={copy.topicArrival}
              text={copy.topicArrivalText}
              onClick={() =>
                document
                  .getElementById(
                    "arrival-help"
                  )
                  ?.scrollIntoView({
                    behavior:
                      "smooth",
                  })
              }
            />


            <HelpTopicCard
              icon={
                <Scale
                  size={22}
                />
              }
              tone="purple"
              title={copy.topicWeighing}
              text={copy.topicWeighingText}
              onClick={() =>
                document
                  .getElementById(
                    "weighing-help"
                  )
                  ?.scrollIntoView({
                    behavior:
                      "smooth",
                  })
              }
            />


            <HelpTopicCard
              icon={
                <Coins
                  size={22}
                />
              }
              tone="gold"
              title={copy.topicPayment}
              text={copy.topicPaymentText}
              onClick={() =>
                document
                  .getElementById(
                    "payment-help"
                  )
                  ?.scrollIntoView({
                    behavior:
                      "smooth",
                  })
              }
            />


            <HelpTopicCard
              icon={
                <Smartphone
                  size={22}
                />
              }
              tone="teal"
              title={copy.topicSms}
              text={copy.topicSmsText}
              onClick={() =>
                document
                  .getElementById(
                    "connectivity-help"
                  )
                  ?.scrollIntoView({
                    behavior:
                      "smooth",
                  })
              }
            />

          </div>

        </section>



        {/* =====================================================
            DETAILED GUIDES
        ====================================================== */}

        <section className="help-guide-section">


          <div className="help-section-heading">

            <div>

              <span className="page-eyebrow">
                {copy.guidesEyebrow}
              </span>


              <h2>
                {copy.guidesTitle}
              </h2>


              <p>
                {copy.guidesDescription}
              </p>

            </div>

          </div>



          <div className="help-guides-grid">


            {/* BOOKING */}

            <GuideCard
              id="booking-help"
              icon={
                <CalendarClock
                  size={21}
                />
              }
              tone="green"
              number="01"
              title={copy.bookingGuideTitle}
              intro={copy.bookingGuideIntro}
              items={[
                copy.bookingStepOne,
                copy.bookingStepTwo,
                copy.bookingStepThree,
                copy.bookingStepFour,
                copy.bookingStepFive,
              ]}
            />



            {/* TOKEN */}

            <GuideCard
              id="token-help"
              icon={
                <TicketCheck
                  size={21}
                />
              }
              tone="blue"
              number="02"
              title={copy.tokenGuideTitle}
              intro={copy.tokenGuideIntro}
              items={[
                copy.tokenStepOne,
                copy.tokenStepTwo,
                copy.tokenStepThree,
                copy.tokenStepFour,
              ]}
            />



            {/* ARRIVAL */}

            <GuideCard
              id="arrival-help"
              icon={
                <MapPin
                  size={21}
                />
              }
              tone="orange"
              number="03"
              title={copy.arrivalGuideTitle}
              intro={copy.arrivalGuideIntro}
              items={[
                copy.arrivalStepOne,
                copy.arrivalStepTwo,
                copy.arrivalStepThree,
                copy.arrivalStepFour,
                copy.arrivalStepFive,
              ]}
            />



            {/* WEIGHING */}

            <GuideCard
              id="weighing-help"
              icon={
                <Scale
                  size={21}
                />
              }
              tone="purple"
              number="04"
              title={copy.weighingGuideTitle}
              intro={copy.weighingGuideIntro}
              items={[
                copy.weighingStepOne,
                copy.weighingStepTwo,
                copy.weighingStepThree,
                copy.weighingStepFour,
              ]}
            />



            {/* PAYMENT */}

            <GuideCard
              id="payment-help"
              icon={
                <Coins
                  size={21}
                />
              }
              tone="gold"
              number="05"
              title={copy.paymentGuideTitle}
              intro={copy.paymentGuideIntro}
              items={[
                copy.paymentStepOne,
                copy.paymentStepTwo,
                copy.paymentStepThree,
                copy.paymentStepFour,
              ]}
            />



            {/* CONNECTIVITY */}

            <GuideCard
              id="connectivity-help"
              icon={
                <Smartphone
                  size={21}
                />
              }
              tone="teal"
              number="06"
              title={copy.connectivityGuideTitle}
              intro={copy.connectivityGuideIntro}
              items={[
                copy.connectivityStepOne,
                copy.connectivityStepTwo,
                copy.connectivityStepThree,
                copy.connectivityStepFour,
              ]}
            />

          </div>

        </section>
                {/* =====================================================
            FAQ
        ====================================================== */}

        <section className="help-faq-section">


          <div className="help-section-heading">

            <div>

              <span className="page-eyebrow">
                {copy.faqEyebrow}
              </span>


              <h2>
                {copy.faqTitle}
              </h2>


              <p>
                {copy.faqDescription}
              </p>

            </div>

          </div>



          <div className="help-faq-layout">


            <div className="help-faq-list">


              {faqGroups.map(
                (
                  faq,
                  index
                ) => (

                  <div
                    key={
                      faq.id
                    }
                    className={
                      `help-faq-item ${
                        openFaq ===
                        index
                          ? "open"
                          : ""
                      }`
                    }
                  >

                    <button
                      type="button"
                      className="help-faq-question"
                      onClick={() =>
                        setOpenFaq(
                          openFaq ===
                            index
                            ? -1
                            : index
                        )
                      }
                    >

                      <div>

                        <span>
                          {faq.number}
                        </span>


                        <strong>
                          {faq.question}
                        </strong>

                      </div>


                      <ChevronDown
                        size={18}
                      />

                    </button>


                    {openFaq ===
                      index && (

                      <div className="help-faq-answer">

                        <p>
                          {faq.answer}
                        </p>

                      </div>

                    )}

                  </div>

                )
              )}

            </div>



            <aside className="help-faq-side">


              <div className="help-faq-side-card">

                <div className="help-faq-side-icon">

                  <Info
                    size={20}
                  />

                </div>


                <span>
                  {copy.faqTipLabel}
                </span>


                <h3>
                  {copy.faqTipTitle}
                </h3>


                <p>
                  {copy.faqTipText}
                </p>

              </div>



              <div className="help-faq-side-card secondary">

                <div className="help-faq-side-icon blue">

                  <ShieldCheck
                    size={20}
                  />

                </div>


                <span>
                  {copy.faqSecurityLabel}
                </span>


                <h3>
                  {copy.faqSecurityTitle}
                </h3>


                <p>
                  {copy.faqSecurityText}
                </p>

              </div>

            </aside>

          </div>

        </section>



        {/* =====================================================
            WHAT TO BRING
        ====================================================== */}

        <section className="help-arrival-section">


          <div className="help-section-heading">

            <div>

              <span className="page-eyebrow">
                {copy.arrivalChecklistEyebrow}
              </span>


              <h2>
                {copy.arrivalChecklistTitle}
              </h2>


              <p>
                {copy.arrivalChecklistDescription}
              </p>

            </div>

          </div>



          <div className="help-checklist-grid">


            <ChecklistCard
              icon={
                <TicketCheck
                  size={20}
                />
              }
              number="01"
              tone="blue"
              title={
                copy.checklistTokenTitle
              }
              text={
                copy.checklistTokenText
              }
            />


            <ChecklistCard
              icon={
                <Wheat
                  size={20}
                />
              }
              number="02"
              tone="green"
              title={
                copy.checklistProduceTitle
              }
              text={
                copy.checklistProduceText
              }
            />


            <ChecklistCard
              icon={
                <Scale
                  size={20}
                />
              }
              number="03"
              tone="purple"
              title={
                copy.checklistQuantityTitle
              }
              text={
                copy.checklistQuantityText
              }
            />


            <ChecklistCard
              icon={
                <MapPin
                  size={20}
                />
              }
              number="04"
              tone="orange"
              title={
                copy.checklistCenterTitle
              }
              text={
                copy.checklistCenterText
              }
            />

          </div>

        </section>



        {/* =====================================================
            LOW CONNECTIVITY
        ====================================================== */}

        <section
          id="connectivity-help"
          className="help-connectivity-section"
        >


          <div className="help-connectivity-main">


            <div className="help-connectivity-icon">

              <Smartphone
                size={25}
              />

            </div>


            <div>

              <span className="page-eyebrow">
                {copy.connectivityEyebrow}
              </span>


              <h2>
                {copy.connectivityTitle}
              </h2>


              <p>
                {copy.connectivityDescription}
              </p>

            </div>

          </div>



          <div className="help-connectivity-points">


            <ConnectivityPoint
              icon={
                <CheckCircle2
                  size={17}
                />
              }
              title={
                copy.connectivityPointOneTitle
              }
              text={
                copy.connectivityPointOneText
              }
            />


            <ConnectivityPoint
              icon={
                <MessageSquareText
                  size={17}
                />
              }
              title={
                copy.connectivityPointTwoTitle
              }
              text={
                copy.connectivityPointTwoText
              }
            />


            <ConnectivityPoint
              icon={
                <TicketCheck
                  size={17}
                />
              }
              title={
                copy.connectivityPointThreeTitle
              }
              text={
                copy.connectivityPointThreeText
              }
            />

          </div>

        </section>



        {/* =====================================================
            SMS EXAMPLE
        ====================================================== */}

        <section className="help-sms-section">


          <div className="help-sms-copy">


            <span className="page-eyebrow">
              {copy.smsEyebrow}
            </span>


            <h2>
              {copy.smsTitle}
            </h2>


            <p>
              {copy.smsDescription}
            </p>


            <div className="help-sms-feature-list">


              <div>

                <CheckCircle2
                  size={16}
                />

                <span>
                  {copy.smsFeatureOne}
                </span>

              </div>


              <div>

                <CheckCircle2
                  size={16}
                />

                <span>
                  {copy.smsFeatureTwo}
                </span>

              </div>


              <div>

                <CheckCircle2
                  size={16}
                />

                <span>
                  {copy.smsFeatureThree}
                </span>

              </div>

            </div>

          </div>



          <div className="help-phone-mockup">


            <div className="help-phone-top">

              <span>
                {copy.smsMockupTitle}
              </span>


              <span>
                {copy.smsMockupTime}
              </span>

            </div>


            <div className="help-sms-message">

              <strong>
                KrishiSetu
              </strong>


              <p>
                {copy.smsExampleText}
              </p>


              <span>
                {copy.smsMockupTime}
              </span>

            </div>

          </div>

        </section>



        {/* =====================================================
            CONTACT CENTER
        ====================================================== */}

        <section className="help-contact-section">


          <div className="help-section-heading">

            <div>

              <span className="page-eyebrow">
                {copy.contactEyebrow}
              </span>


              <h2>
                {copy.contactTitle}
              </h2>


              <p>
                {copy.contactDescription}
              </p>

            </div>

          </div>



          <div className="help-contact-grid">


            <div className="help-center-card">


              <div className="help-center-heading">


                <div className="help-center-icon">

                  <MapPin
                    size={22}
                  />

                </div>


                <div>

                  <span>
                    {copy.centerLabel}
                  </span>


                  <h3>
                    {copy.centerName}
                  </h3>

                </div>

              </div>



              <div className="help-center-details">


                <div>

                  <MapPin
                    size={16}
                  />


                  <div>

                    <span>
                      {copy.addressLabel}
                    </span>


                    <strong>
                      {copy.centerAddress}
                    </strong>

                  </div>

                </div>


                <div>

                  <Phone
                    size={16}
                  />


                  <div>

                    <span>
                      {copy.phoneLabel}
                    </span>


                    <strong>
                      {copy.centerPhone}
                    </strong>

                  </div>

                </div>


                <div>

                  <Clock3
                    size={16}
                  />


                  <div>

                    <span>
                      {copy.hoursLabel}
                    </span>


                    <strong>
                      {copy.centerHours}
                    </strong>

                  </div>

                </div>

              </div>



              <a
                href="tel:1800123456"
                className="help-call-button"
              >

                <Phone
                  size={16}
                />

                {copy.callCenter}

                <ArrowRight
                  size={15}
                />

              </a>

            </div>



            <div className="help-contact-right">


              <div className="help-contact-use-card">

                <div className="help-contact-use-icon">

                  <HelpCircle
                    size={20}
                  />

                </div>


                <div>

                  <span>
                    {copy.whenToContactLabel}
                  </span>


                  <h3>
                    {copy.whenToContactTitle}
                  </h3>

                </div>


                <div className="help-contact-reasons">


                  <ContactReason
                    text={
                      copy.contactReasonOne
                    }
                  />


                  <ContactReason
                    text={
                      copy.contactReasonTwo
                    }
                  />


                  <ContactReason
                    text={
                      copy.contactReasonThree
                    }
                  />


                  <ContactReason
                    text={
                      copy.contactReasonFour
                    }
                  />

                </div>

              </div>



              <div className="help-emergency-note">

                <ShieldCheck
                  size={18}
                />


                <p>
                  {copy.emergencyNote}
                </p>

              </div>

            </div>

          </div>

        </section>



        {/* =====================================================
            LANGUAGE SUPPORT
        ====================================================== */}

        <section className="help-language-section">


          <div className="help-language-icon">

            <MessageSquareText
              size={23}
            />

          </div>


          <div className="help-language-copy">


            <span className="page-eyebrow">
              {copy.languageEyebrow}
            </span>


            <h2>
              {copy.languageTitle}
            </h2>


            <p>
              {copy.languageDescription}
            </p>

          </div>



          <div className="help-language-list">


            <div
              className={
                language === "en"
                  ? "help-language-option active"
                  : "help-language-option"
              }
            >

              <strong>
                English
              </strong>


              <span>
                English
              </span>

            </div>


            <div
              className={
                language === "hi"
                  ? "help-language-option active"
                  : "help-language-option"
              }
            >

              <strong>
                हिन्दी
              </strong>


              <span>
                Hindi
              </span>

            </div>


            <div
              className={
                language === "te"
                  ? "help-language-option active"
                  : "help-language-option"
              }
            >

              <strong>
                తెలుగు
              </strong>


              <span>
                Telugu
              </span>

            </div>

          </div>

        </section>



        {/* =====================================================
            FINAL CTA
        ====================================================== */}

        <section className="help-final-card">


          <div>

            <span className="page-eyebrow">
              {copy.finalEyebrow}
            </span>


            <h2>
              {copy.finalTitle}
            </h2>


            <p>
              {copy.finalDescription}
            </p>

          </div>


          <div className="help-final-actions">


            <Link
              to="/farmer/book"
              className="help-primary-action"
            >

              <CalendarClock
                size={17}
              />

              {copy.bookSlot}

              <ArrowRight
                size={16}
              />

            </Link>


            <Link
              to="/farmer/home"
              className="help-secondary-action"
            >

              {copy.backHome}

            </Link>

          </div>

        </section>



      </main>



      <footer className="help-page-footer">


        <div>

          <strong>
            KrishiSetu
          </strong>


          <span>
            {copy.footerTagline}
          </span>

        </div>


        <span>
          {copy.footerText}
        </span>

      </footer>


    </div>
  );
}


/* =========================================================
   SMALL COMPONENTS
========================================================= */

function HelpCheck({
  text,
}) {

  return (

    <div className="help-check-row">

      <CheckCircle2
        size={15}
      />

      <span>
        {text}
      </span>

    </div>

  );
}


function HelpTopicCard({
  icon,
  tone,
  title,
  text,
  onClick,
}) {

  return (

    <button
      type="button"
      className={
        `help-topic-card ${tone}`
      }
      onClick={
        onClick
      }
    >

      <div className="help-topic-icon">

        {icon}

      </div>


      <div>

        <strong>
          {title}
        </strong>


        <p>
          {text}
        </p>

      </div>


      <ArrowRight
        size={16}
      />

    </button>

  );
}


function GuideCard({
  id,
  icon,
  tone,
  number,
  title,
  intro,
  items,
}) {

  return (

    <article
      id={id}
      className={
        `help-guide-card ${tone}`
      }
    >

      <div className="help-guide-top">


        <div className="help-guide-icon">

          {icon}

        </div>


        <span className="help-guide-number">

          {number}

        </span>

      </div>


      <h3>
        {title}
      </h3>


      <p className="help-guide-intro">
        {intro}
      </p>


      <div className="help-guide-list">

        {items.map(
          (
            item,
            index
          ) => (

            <div
              key={
                index
              }
              className="help-guide-item"
            >

              <CheckCircle2
                size={14}
              />

              <span>
                {item}
              </span>

            </div>

          )
        )}

      </div>

    </article>

  );
}


function ChecklistCard({
  icon,
  number,
  tone,
  title,
  text,
}) {

  return (

    <div
      className={
        `help-checklist-card ${tone}`
      }
    >

      <div className="help-checklist-top">

        <div className="help-checklist-icon">

          {icon}

        </div>


        <span>
          {number}
        </span>

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


function ConnectivityPoint({
  icon,
  title,
  text,
}) {

  return (

    <div className="help-connectivity-point">

      <div>
        {icon}
      </div>


      <span>

        <strong>
          {title}
        </strong>


        <small>
          {text}
        </small>

      </span>

    </div>

  );
}


function ContactReason({
  text,
}) {

  return (

    <div>

      <CheckCircle2
        size={14}
      />

      <span>
        {text}
      </span>

    </div>

  );
}
function getFaqGroups(
  language
) {

  const groups = {

    en: [
      {
        id: "booking",
        number: "01",
        question:
          "How do I book a procurement slot?",
        answer:
          "Open Book a New Slot from the farmer dashboard. Select the crop you are bringing, enter an estimated quantity, choose a procurement center, select a preferred date and then check the available arrival windows. Select a suitable window and review all details before confirming.",
      },

      {
        id: "quantity",
        number: "02",
        question:
          "Does the quantity have to be exact?",
        answer:
          "No. The quantity entered during booking is only an estimate. The actual quantity is recorded by the procurement center during weighing. Enter the closest practical estimate so the center can plan its capacity.",
      },

      {
        id: "slot",
        number: "03",
        question:
          "What does an arrival window mean?",
        answer:
          "An arrival window is the period during which you should reach the procurement center. It helps the center organise farmers and reduce unnecessary waiting. Choose a window that gives you enough time to travel to the center.",
      },

      {
        id: "late",
        number: "04",
        question:
          "What happens if I arrive late?",
        answer:
          "Do not leave without speaking to the center team. Your booking can be marked late so that your updated position is visible to the operator. The center team can then guide you about the next available processing position.",
      },

      {
        id: "token",
        number: "05",
        question:
          "What is my procurement token used for?",
        answer:
          "Your token is the unique reference for your booking. Show it to the procurement team when you arrive. It helps the center identify your booking and connect your arrival, weighing, procurement and payment records.",
      },

      {
        id: "internet",
        number: "06",
        question:
          "What if I do not have internet at the center?",
        answer:
          "Keep your booking information and SMS confirmation available. Your token, date, arrival window and center details are the important information needed to identify your booking. Important updates can also be communicated through SMS.",
      },

      {
        id: "change",
        number: "07",
        question:
          "Can I change my booking after confirming it?",
        answer:
          "For this prototype, booking changes are handled with the procurement center. Contact the center team if your crop, date or arrival plans change before your scheduled window.",
      },

      {
        id: "weighing",
        number: "08",
        question:
          "What happens during weighing?",
        answer:
          "The center operator records the actual weight of your produce using the weighing process at the center. The actual quantity can differ from your estimate. The recorded quantity becomes part of your procurement record.",
      },

      {
        id: "payment",
        number: "09",
        question:
          "When will my payment status change?",
        answer:
          "After weighing and procurement are completed, the booking moves through the payment process. You may first see Payment Pending and then Payment Sent once the operator records the payment reference.",
      },

      {
        id: "wrong",
        number: "10",
        question:
          "What should I do if my booking details look wrong?",
        answer:
          "Check the token page and compare the crop, quantity, date, time and procurement center with your confirmation. If something is incorrect, contact the procurement center before arriving so the operator can guide you.",
      },

    ],


    hi: [
      {
        id: "booking",
        number: "01",
        question:
          "मैं खरीद स्लॉट कैसे बुक करूं?",
        answer:
          "किसान डैशबोर्ड से नया स्लॉट बुक करें। अपनी फसल चुनें, अनुमानित मात्रा दर्ज करें, खरीद केंद्र चुनें, पसंदीदा तारीख चुनें और उपलब्ध समय देखें। उपयुक्त समय चुनने के बाद सभी विवरणों की जाँच करके बुकिंग की पुष्टि करें।",
      },

      {
        id: "quantity",
        number: "02",
        question:
          "क्या मात्रा बिल्कुल सही होनी चाहिए?",
        answer:
          "नहीं। बुकिंग के समय दर्ज की गई मात्रा केवल अनुमान है। वास्तविक मात्रा खरीद केंद्र पर वजन के समय दर्ज की जाएगी। केंद्र की तैयारी के लिए यथासंभव सही अनुमान दर्ज करें।",
      },

      {
        id: "slot",
        number: "03",
        question:
          "आने का समय क्या होता है?",
        answer:
          "आने का समय वह अवधि है जिसमें आपको खरीद केंद्र पहुंचना चाहिए। इससे केंद्र किसानों को व्यवस्थित करने और अनावश्यक इंतजार कम करने में मदद करता है। ऐसा समय चुनें जिसमें आप आसानी से केंद्र पहुंच सकें।",
      },

      {
        id: "late",
        number: "04",
        question:
          "अगर मैं देर से पहुंचूं तो क्या होगा?",
        answer:
          "बिना केंद्र टीम से बात किए वापस न जाएं। आपकी बुकिंग को देर से आने के रूप में दर्ज किया जा सकता है, जिससे ऑपरेटर आपकी स्थिति देख सकता है। केंद्र टीम आपको अगली प्रक्रिया के बारे में मार्गदर्शन देगी।",
      },

      {
        id: "token",
        number: "05",
        question:
          "मेरे खरीद टोकन का उपयोग किस लिए होता है?",
        answer:
          "टोकन आपकी बुकिंग की पहचान है। केंद्र पहुंचने पर इसे खरीद टीम को दिखाएं। इससे केंद्र आपकी बुकिंग, पहुंच, वजन, खरीद और भुगतान रिकॉर्ड को सही किसान से जोड़ सकता है।",
      },

      {
        id: "internet",
        number: "06",
        question:
          "अगर केंद्र पर इंटरनेट न हो तो क्या होगा?",
        answer:
          "अपनी बुकिंग जानकारी और SMS पुष्टि अपने पास रखें। टोकन, तारीख, आने का समय और केंद्र की जानकारी आपकी बुकिंग पहचानने में मदद करती है। महत्वपूर्ण अपडेट SMS से भी दिए जा सकते हैं।",
      },

      {
        id: "change",
        number: "07",
        question:
          "क्या पुष्टि के बाद बुकिंग बदली जा सकती है?",
        answer:
          "इस प्रोटोटाइप में बुकिंग में बदलाव खरीद केंद्र के माध्यम से किया जाता है। अगर आपकी फसल, तारीख या आने की योजना बदलती है तो केंद्र टीम से संपर्क करें।",
      },

      {
        id: "weighing",
        number: "08",
        question:
          "वजन के समय क्या होता है?",
        answer:
          "केंद्र ऑपरेटर आपकी उपज का वास्तविक वजन दर्ज करता है। वास्तविक मात्रा आपके अनुमान से अलग हो सकती है। दर्ज की गई मात्रा आपके खरीद रिकॉर्ड का हिस्सा बन जाती है।",
      },

      {
        id: "payment",
        number: "09",
        question:
          "भुगतान की स्थिति कब बदलेगी?",
        answer:
          "वजन और खरीद पूरी होने के बाद बुकिंग भुगतान प्रक्रिया में जाती है। पहले Payment Pending दिखाई दे सकता है और भुगतान संदर्भ दर्ज होने के बाद Payment Sent दिखाई देगा।",
      },

      {
        id: "wrong",
        number: "10",
        question:
          "अगर मेरी बुकिंग की जानकारी गलत दिख रही हो तो क्या करूं?",
        answer:
          "टोकन पेज पर फसल, मात्रा, तारीख, समय और खरीद केंद्र की जानकारी जाँचें। अगर कुछ गलत है तो निर्धारित समय से पहले खरीद केंद्र से संपर्क करें।",
      },

    ],


    te: [
      {
        id: "booking",
        number: "01",
        question:
          "నేను కొనుగోలు స్లాట్‌ను ఎలా బుక్ చేయాలి?",
        answer:
          "రైతు డ్యాష్‌బోర్డ్‌లో కొత్త స్లాట్‌ను బుక్ చేయండి. మీరు తీసుకువచ్చే పంటను ఎంచుకుని, అంచనా పరిమాణాన్ని నమోదు చేసి, కొనుగోలు కేంద్రం మరియు తేదీని ఎంచుకుని అందుబాటులో ఉన్న రాక సమయాలను చూడండి. అనుకూలమైన సమయాన్ని ఎంచుకుని అన్ని వివరాలను తనిఖీ చేసి బుకింగ్‌ను నిర్ధారించండి.",
      },

      {
        id: "quantity",
        number: "02",
        question:
          "పరిమాణం ఖచ్చితంగా ఉండాలా?",
        answer:
          "లేదు. బుకింగ్ సమయంలో నమోదు చేసే పరిమాణం అంచనా మాత్రమే. వాస్తవ పరిమాణం కొనుగోలు కేంద్రంలో తూకం సమయంలో నమోదు చేయబడుతుంది. కేంద్రం ముందస్తు ఏర్పాట్ల కోసం సాధ్యమైనంత దగ్గరగా ఉన్న అంచనాను నమోదు చేయండి.",
      },

      {
        id: "slot",
        number: "03",
        question:
          "రాక సమయం అంటే ఏమిటి?",
        answer:
          "రాక సమయం అంటే మీరు కొనుగోలు కేంద్రానికి చేరుకోవాల్సిన నిర్దిష్ట సమయ వ్యవధి. ఇది రైతులను క్రమబద్ధీకరించడానికి మరియు అవసరం లేని వేచి ఉండటాన్ని తగ్గించడానికి కేంద్రానికి సహాయపడుతుంది. మీరు సులభంగా చేరుకోగల సమయాన్ని ఎంచుకోండి.",
      },

      {
        id: "late",
        number: "04",
        question:
          "నేను ఆలస్యంగా చేరితే ఏమవుతుంది?",
        answer:
          "కేంద్ర బృందంతో మాట్లాడకుండా తిరిగి వెళ్లవద్దు. మీ బుకింగ్‌ను ఆలస్యంగా వచ్చినట్లు నమోదు చేయవచ్చు. ఆ తర్వాత కేంద్ర బృందం మీ తదుపరి ప్రాసెసింగ్ స్థానం గురించి మార్గదర్శనం చేస్తుంది.",
      },

      {
        id: "token",
        number: "05",
        question:
          "నా కొనుగోలు టోకెన్ దేనికి ఉపయోగపడుతుంది?",
        answer:
          "టోకెన్ మీ బుకింగ్‌కు ప్రత్యేక గుర్తింపు. మీరు కేంద్రానికి చేరుకున్నప్పుడు కొనుగోలు బృందానికి దాన్ని చూపించండి. ఇది మీ రాక, తూకం, కొనుగోలు మరియు చెల్లింపు రికార్డులను సరైన బుకింగ్‌తో అనుసంధానించడానికి సహాయపడుతుంది.",
      },

      {
        id: "internet",
        number: "06",
        question:
          "కేంద్రంలో ఇంటర్నెట్ లేకపోతే ఏమి చేయాలి?",
        answer:
          "మీ బుకింగ్ సమాచారం మరియు SMS నిర్ధారణను దగ్గర ఉంచుకోండి. టోకెన్, తేదీ, రాక సమయం మరియు కేంద్ర వివరాలు మీ బుకింగ్‌ను గుర్తించడానికి ఉపయోగపడతాయి. ముఖ్యమైన అప్‌డేట్‌లు SMS ద్వారా కూడా అందవచ్చు.",
      },

      {
        id: "change",
        number: "07",
        question:
          "నిర్ధారించిన తర్వాత బుకింగ్‌ను మార్చవచ్చా?",
        answer:
          "ఈ ప్రోటోటైప్‌లో బుకింగ్ మార్పులు కొనుగోలు కేంద్రం ద్వారా నిర్వహించబడతాయి. మీ పంట, తేదీ లేదా రాక ప్రణాళిక మారితే కేంద్ర బృందాన్ని సంప్రదించండి.",
      },

      {
        id: "weighing",
        number: "08",
        question:
          "తూకం సమయంలో ఏమి జరుగుతుంది?",
        answer:
          "కేంద్ర ఆపరేటర్ మీ పంట యొక్క వాస్తవ బరువును నమోదు చేస్తారు. వాస్తవ పరిమాణం మీ అంచనా కంటే భిన్నంగా ఉండవచ్చు. నమోదు చేసిన పరిమాణం మీ కొనుగోలు రికార్డులో భాగమవుతుంది.",
      },

      {
        id: "payment",
        number: "09",
        question:
          "చెల్లింపు స్థితి ఎప్పుడు మారుతుంది?",
        answer:
          "తూకం మరియు కొనుగోలు పూర్తైన తర్వాత బుకింగ్ చెల్లింపు ప్రక్రియలోకి వెళుతుంది. ముందుగా Payment Pending కనిపించవచ్చు. చెల్లింపు సూచన నమోదు చేసిన తర్వాత Payment Sent కనిపిస్తుంది.",
      },

      {
        id: "wrong",
        number: "10",
        question:
          "నా బుకింగ్ వివరాలు తప్పుగా కనిపిస్తే ఏమి చేయాలి?",
        answer:
          "టోకెన్ పేజీలో పంట, పరిమాణం, తేదీ, సమయం మరియు కొనుగోలు కేంద్రాన్ని తనిఖీ చేయండి. ఏదైనా తప్పుగా ఉంటే నిర్ణయించిన సమయానికి ముందే కొనుగోలు కేంద్రాన్ని సంప్రదించండి.",
      },

    ],

  };


  return (
    groups[
      language
    ] ||
    groups.en
  );

}


/* =========================================================
   HELP COPY
========================================================= */

function getHelpCopy(
  language
) {

  const copy = {

    en: {

      back:
        "Back",

      supportAvailable:
        "Support available",

      eyebrow:
        "FARMER SUPPORT",

      titleOne:
        "How can we",

      titleTwo:
        "help you?",

      description:
        "Everything you need to understand your booking, token, arrival, weighing, payment and SMS updates before you visit the procurement center.",

      callCenter:
        "Call Center",

      bookSlot:
        "Book a Slot",

      quickHelp:
        "QUICK HELP",

      quickHelpTitle:
        "Start with the answer you need.",

      quickOne:
        "Understand your booking",

      quickTwo:
        "Find your token information",

      quickThree:
        "Know what to do at the center",

      quickFour:
        "Understand payment and SMS updates",

      quickTopics:
        "HELP TOPICS",

      quickTitle:
        "Find help quickly.",

      quickDescription:
        "Choose a topic to jump directly to the information you need.",

      topicBooking:
        "Booking",

      topicBookingText:
        "How to choose a crop, quantity, center, date and slot.",

      topicToken:
        "Token",

      topicTokenText:
        "What your token means and how the center uses it.",

      topicArrival:
        "Arrival",

      topicArrivalText:
        "When to arrive, what to bring and what happens next.",

      topicWeighing:
        "Weighing",

      topicWeighingText:
        "How estimated and actual quantities are handled.",

      topicPayment:
        "Payment",

      topicPaymentText:
        "Understand pending and completed payment stages.",

      topicSms:
        "SMS & Internet",

      topicSmsText:
        "Stay informed even when connectivity is limited.",

      guidesEyebrow:
        "STEP-BY-STEP GUIDES",

      guidesTitle:
        "Know what happens at every stage.",

      guidesDescription:
        "These guides explain the complete journey from creating a booking to receiving payment.",

      bookingGuideTitle:
        "How booking works",

      bookingGuideIntro:
        "Create a booking that matches your crop and the time you can realistically reach the center.",

      bookingStepOne:
        "Select the crop or produce you plan to bring.",

      bookingStepTwo:
        "Enter an approximate quantity in kilograms.",

      bookingStepThree:
        "Choose the procurement center serving your location.",

      bookingStepFour:
        "Select a preferred date and check available windows.",

      bookingStepFive:
        "Review the details and confirm only after everything is correct.",

      tokenGuideTitle:
        "Understanding your token",

      tokenGuideIntro:
        "Your token is the unique reference connecting your farmer booking to the procurement process.",

      tokenStepOne:
        "Keep the token available after confirmation.",

      tokenStepTwo:
        "Show the token to the center team when you arrive.",

      tokenStepThree:
        "The same booking is used for arrival, weighing and procurement updates.",

      tokenStepFour:
        "Your token page also shows the current procurement status.",

      arrivalGuideTitle:
        "Before you arrive",

      arrivalGuideIntro:
        "A little preparation can make the procurement visit smoother and reduce unnecessary waiting.",

      arrivalStepOne:
        "Check your token, center and arrival window before leaving.",

      arrivalStepTwo:
        "Plan enough travel time to reach the center during your window.",

      arrivalStepThree:
        "Bring the produce you booked and keep the estimated quantity in mind.",

      arrivalStepFour:
        "Show your token to the procurement team when you arrive.",

      arrivalStepFive:
        "If you are late, speak to the center team instead of leaving without an update.",

      weighingGuideTitle:
        "At the weighing desk",

      weighingGuideIntro:
        "The center records the actual quantity and completes the procurement checks.",

      weighingStepOne:
        "The operator identifies your booking using the token.",

      weighingStepTwo:
        "Your produce is weighed and the actual quantity is recorded.",

      weighingStepThree:
        "The operator can record a quality assessment when required.",

      weighingStepFour:
        "After verification, the booking moves to procurement completion.",

      paymentGuideTitle:
        "How payment works",

      paymentGuideIntro:
        "Payment status becomes visible after the procurement process is completed.",

      paymentStepOne:
        "Your actual quantity is recorded during weighing.",

      paymentStepTwo:
        "After procurement, the booking can move to Payment Pending.",

      paymentStepThree:
        "The operator processes the payable amount and payment reference.",

      paymentStepFour:
        "Once recorded as sent, the payment status appears on your booking.",

      connectivityGuideTitle:
        "Low connectivity support",

      connectivityGuideIntro:
        "You can still keep important booking information when internet access is limited.",

      connectivityStepOne:
        "Keep your confirmation and token information saved.",

      connectivityStepTwo:
        "Your SMS can contain the token, date, time and center.",

      connectivityStepThree:
        "Use those details to identify your booking at the center.",

      connectivityStepFour:
        "Important procurement and payment updates can also be sent through SMS.",

      faqEyebrow:
        "FREQUENTLY ASKED QUESTIONS",

      faqTitle:
        "Answers to common questions.",

      faqDescription:
        "Open a question to read the complete guidance.",

      faqTipLabel:
        "BOOKING TIP",

      faqTipTitle:
        "Choose a realistic arrival time.",

      faqTipText:
        "The best slot is not always the earliest one. Choose a window that gives you enough time to safely reach the procurement center.",

      faqSecurityLabel:
        "YOUR INFORMATION",

      faqSecurityTitle:
        "Keep your token available.",

      faqSecurityText:
        "Your token connects your booking to the center's procurement workflow. It is the fastest way for the team to identify your record.",

      arrivalChecklistEyebrow:
        "ARRIVAL CHECKLIST",

      arrivalChecklistTitle:
        "Before leaving for the center.",

      arrivalChecklistDescription:
        "Keep these four things ready before you begin your journey.",

      checklistTokenTitle:
        "Your token",

      checklistTokenText:
        "Keep your token available on your phone or in your confirmation message.",

      checklistProduceTitle:
        "Your produce",

      checklistProduceText:
        "Bring the crop you selected while booking and keep it ready for procurement.",

      checklistQuantityTitle:
        "Quantity estimate",

      checklistQuantityText:
        "Remember the approximate quantity you entered. The final weight is recorded at the center.",

      checklistCenterTitle:
        "Center details",

      checklistCenterText:
        "Check the procurement center name, location and arrival window before leaving.",

      connectivityEyebrow:
        "LOW CONNECTIVITY SUPPORT",

      connectivityTitle:
        "No internet? You can still stay informed.",

      connectivityDescription:
        "Your booking is designed around a token and clear confirmation information, so you do not have to continuously keep the website open.",

      connectivityPointOneTitle:
        "Booking confirmation",

      connectivityPointOneText:
        "Keep your confirmation details after booking.",

      connectivityPointTwoTitle:
        "SMS updates",

      connectivityPointTwoText:
        "Important status information can reach your registered mobile number.",

      connectivityPointThreeTitle:
        "Token access",

      connectivityPointThreeText:
        "Your token, date, time and center details identify your booking.",

      smsEyebrow:
        "SMS EXAMPLE",

      smsTitle:
        "Your important booking details can also reach your phone.",

      smsDescription:
        "SMS support is useful when mobile data is weak or you temporarily cannot open the web application.",

      smsFeatureOne:
        "Booking confirmation",

      smsFeatureTwo:
        "Token and arrival window",

      smsFeatureThree:
        "Procurement and payment updates",

      smsMockupTitle:
        "Messages",

      smsMockupTime:
        "10:42 AM",

      smsExampleText:
        "KrishiSetu: Booking confirmed. Token B021. Wheat, 250 kg estimated. Arrival: 30 Aug, 10:00–10:30 AM. Center: Main Procurement Center.",

      contactEyebrow:
        "CONTACT CENTER",

      contactTitle:
        "Need direct assistance?",

      contactDescription:
        "The procurement center can help when your plans change or when you need clarification about your booking.",

      centerLabel:
        "YOUR PROCUREMENT CENTER",

      centerName:
        "Main Procurement Center",

      centerAddress:
        "Primary procurement center",

      addressLabel:
        "Location",

      phoneLabel:
        "Phone",

      centerPhone:
        "1800 123 456",

      hoursLabel:
        "Operating hours",

      centerHours:
        "10:00 AM – 5:00 PM",

      whenToContactLabel:
        "CONTACT THE CENTER WHEN",

      whenToContactTitle:
        "A situation needs operator guidance.",

      contactReasonOne:
        "You may arrive late.",

      contactReasonTwo:
        "Your crop or booking details need correction.",

      contactReasonThree:
        "You have a question about weighing or procurement.",

      contactReasonFour:
        "Your payment status needs clarification.",

      emergencyNote:
        "For this prototype, the center team is the main support point for booking changes, late arrivals and procurement-specific issues.",

      languageEyebrow:
        "LANGUAGE SUPPORT",

      languageTitle:
        "Use the farmer portal in your preferred language.",

      languageDescription:
        "KrishiSetu supports English, Hindi and Telugu across the farmer journey.",

      finalEyebrow:
        "READY TO CONTINUE?",

      finalTitle:
        "Go back to your farmer dashboard.",

      finalDescription:
        "Review your booking, track your token or create a new procurement booking.",

      footerTagline:
        "Smart agricultural procurement",

      footerText:
        "Farmer support · Booking · Token · Procurement · Payment",

    },


    hi: {

      back:
        "वापस",

      supportAvailable:
        "सहायता उपलब्ध",

      eyebrow:
        "किसान सहायता",

      titleOne:
        "हम आपकी",

      titleTwo:
        "कैसे सहायता करें?",

      description:
        "बुकिंग, टोकन, केंद्र पर पहुंचने, वजन, भुगतान और SMS अपडेट से जुड़ी जरूरी जानकारी यहां मिलेगी।",

      callCenter:
        "कॉल सेंटर",

      bookSlot:
        "स्लॉट बुक करें",

      quickHelp:
        "त्वरित सहायता",

      quickHelpTitle:
        "जिस जानकारी की जरूरत है, वहीं से शुरू करें।",

      quickOne:
        "अपनी बुकिंग समझें",

      quickTwo:
        "टोकन की जानकारी देखें",

      quickThree:
        "केंद्र पर क्या करना है जानें",

      quickFour:
        "भुगतान और SMS समझें",

      quickTopics:
        "सहायता विषय",

      quickTitle:
        "जल्दी सहायता पाएं।",

      quickDescription:
        "जिस विषय की जानकारी चाहिए उसे चुनें।",

      topicBooking:
        "बुकिंग",

      topicBookingText:
        "फसल, मात्रा, केंद्र, तारीख और समय चुनने की जानकारी।",

      topicToken:
        "टोकन",

      topicTokenText:
        "टोकन का अर्थ और केंद्र पर इसका उपयोग।",

      topicArrival:
        "पहुंचना",

      topicArrivalText:
        "कब पहुंचना है, क्या लाना है और आगे क्या होगा।",

      topicWeighing:
        "वजन",

      topicWeighingText:
        "अनुमानित और वास्तविक मात्रा कैसे दर्ज होती है।",

      topicPayment:
        "भुगतान",

      topicPaymentText:
        "लंबित और पूर्ण भुगतान की स्थिति समझें।",

      topicSms:
        "SMS और इंटरनेट",

      topicSmsText:
        "कम इंटरनेट में भी जरूरी जानकारी प्राप्त करें।",

      guidesEyebrow:
        "चरण-दर-चरण मार्गदर्शन",

      guidesTitle:
        "हर चरण में क्या होता है जानें।",

      guidesDescription:
        "बुकिंग बनाने से लेकर भुगतान तक पूरी प्रक्रिया यहां समझें।",

      bookingGuideTitle:
        "बुकिंग कैसे काम करती है",

      bookingGuideIntro:
        "अपनी फसल और केंद्र तक पहुंचने के लिए वास्तविक समय के अनुसार बुकिंग बनाएं।",

      bookingStepOne:
        "वह फसल चुनें जिसे आप लेकर आने वाले हैं।",

      bookingStepTwo:
        "किलोग्राम में अनुमानित मात्रा दर्ज करें।",

      bookingStepThree:
        "अपने स्थान के अनुसार खरीद केंद्र चुनें।",

      bookingStepFour:
        "पसंदीदा तारीख चुनें और उपलब्ध समय देखें।",

      bookingStepFive:
        "सभी जानकारी जाँचने के बाद ही बुकिंग की पुष्टि करें।",

      tokenGuideTitle:
        "अपने टोकन को समझें",

      tokenGuideIntro:
        "आपका टोकन आपकी किसान बुकिंग को खरीद प्रक्रिया से जोड़ने वाला अद्वितीय संदर्भ है।",

      tokenStepOne:
        "पुष्टि के बाद टोकन अपने पास रखें।",

      tokenStepTwo:
        "केंद्र पहुंचने पर टोकन टीम को दिखाएं।",

      tokenStepThree:
        "इसी बुकिंग से पहुंच, वजन और खरीद की जानकारी जुड़ी रहती है।",

      tokenStepFour:
        "टोकन पेज पर वर्तमान खरीद स्थिति भी दिखाई देती है।",

      arrivalGuideTitle:
        "केंद्र पर जाने से पहले",

      arrivalGuideIntro:
        "थोड़ी तैयारी आपकी यात्रा को आसान बना सकती है और अनावश्यक इंतजार कम कर सकती है।",

      arrivalStepOne:
        "निकलने से पहले टोकन, केंद्र और आने का समय जाँचें।",

      arrivalStepTwo:
        "केंद्र तक पहुंचने के लिए पर्याप्त यात्रा समय रखें।",

      arrivalStepThree:
        "बुक की गई फसल लाएं और अनुमानित मात्रा याद रखें।",

      arrivalStepFour:
        "केंद्र पहुंचने पर खरीद टीम को टोकन दिखाएं।",

      arrivalStepFive:
        "देर होने पर बिना जानकारी के वापस न जाएं; केंद्र टीम से बात करें।",

      weighingGuideTitle:
        "वजन केंद्र पर",

      weighingGuideIntro:
        "केंद्र वास्तविक मात्रा दर्ज करता है और खरीद की जांच पूरी करता है।",

      weighingStepOne:
        "ऑपरेटर टोकन से आपकी बुकिंग पहचानता है।",

      weighingStepTwo:
        "आपकी उपज का वजन करके वास्तविक मात्रा दर्ज की जाती है।",

      weighingStepThree:
        "जरूरत होने पर गुणवत्ता भी दर्ज की जा सकती है।",

      weighingStepFour:
        "सत्यापन के बाद बुकिंग खरीद पूरी होने की स्थिति में जाती है।",

      paymentGuideTitle:
        "भुगतान कैसे काम करता है",

      paymentGuideIntro:
        "खरीद प्रक्रिया पूरी होने के बाद भुगतान की स्थिति दिखाई देती है।",

      paymentStepOne:
        "वजन के समय वास्तविक मात्रा दर्ज की जाती है।",

      paymentStepTwo:
        "खरीद पूरी होने के बाद भुगतान लंबित स्थिति आ सकती है।",

      paymentStepThree:
        "ऑपरेटर भुगतान राशि और संदर्भ दर्ज करता है।",

      paymentStepFour:
        "भुगतान भेजे जाने के बाद स्थिति दिखाई देती है।",

      connectivityGuideTitle:
        "कम इंटरनेट सहायता",

      connectivityGuideIntro:
        "कम इंटरनेट में भी महत्वपूर्ण बुकिंग जानकारी अपने पास रखी जा सकती है।",

      connectivityStepOne:
        "अपनी पुष्टि और टोकन की जानकारी सुरक्षित रखें।",

      connectivityStepTwo:
        "SMS में टोकन, तारीख, समय और केंद्र की जानकारी मिल सकती है।",

      connectivityStepThree:
        "केंद्र पर इन्हीं विवरणों से अपनी बुकिंग पहचानें।",

      connectivityStepFour:
        "खरीद और भुगतान के महत्वपूर्ण अपडेट SMS से भी मिल सकते हैं।",

      faqEyebrow:
        "अक्सर पूछे जाने वाले प्रश्न",

      faqTitle:
        "सामान्य प्रश्नों के उत्तर।",

      faqDescription:
        "पूरा मार्गदर्शन पढ़ने के लिए किसी प्रश्न को खोलें।",

      faqTipLabel:
        "बुकिंग टिप",

      faqTipTitle:
        "वास्तविक पहुंचने का समय चुनें।",

      faqTipText:
        "सबसे पहला स्लॉट हमेशा सबसे अच्छा नहीं होता। ऐसा समय चुनें जिसमें आप आराम से केंद्र पहुंच सकें।",

      faqSecurityLabel:
        "आपकी जानकारी",

      faqSecurityTitle:
        "अपना टोकन पास रखें।",

      faqSecurityText:
        "टोकन आपकी बुकिंग को केंद्र की खरीद प्रक्रिया से जोड़ता है और रिकॉर्ड पहचानने का सबसे आसान तरीका है।",

      arrivalChecklistEyebrow:
        "केंद्र जाने की चेकलिस्ट",

      arrivalChecklistTitle:
        "केंद्र जाने से पहले।",

      arrivalChecklistDescription:
        "यात्रा शुरू करने से पहले इन चार चीजों को तैयार रखें।",

      checklistTokenTitle:
        "आपका टोकन",

      checklistTokenText:
        "टोकन को फोन या पुष्टि संदेश में उपलब्ध रखें।",

      checklistProduceTitle:
        "आपकी उपज",

      checklistProduceText:
        "बुकिंग में चुनी गई फसल लेकर आएं और उसे खरीद के लिए तैयार रखें।",

      checklistQuantityTitle:
        "मात्रा का अनुमान",

      checklistQuantityText:
        "बुक की गई अनुमानित मात्रा याद रखें। अंतिम वजन केंद्र पर दर्ज होगा।",

      checklistCenterTitle:
        "केंद्र की जानकारी",

      checklistCenterText:
        "निकलने से पहले केंद्र का नाम, स्थान और आने का समय जाँचें।",

      connectivityEyebrow:
        "कम इंटरनेट सहायता",

      connectivityTitle:
        "इंटरनेट नहीं है? फिर भी जानकारी मिल सकती है।",

      connectivityDescription:
        "आपकी बुकिंग टोकन और पुष्टि जानकारी पर आधारित है, इसलिए आपको लगातार वेबसाइट खुली रखने की जरूरत नहीं है।",

      connectivityPointOneTitle:
        "बुकिंग पुष्टि",

      connectivityPointOneText:
        "बुकिंग के बाद पुष्टि की जानकारी सुरक्षित रखें।",

      connectivityPointTwoTitle:
        "SMS अपडेट",

      connectivityPointTwoText:
        "महत्वपूर्ण स्थिति जानकारी आपके पंजीकृत मोबाइल पर आ सकती है।",

      connectivityPointThreeTitle:
        "टोकन जानकारी",

      connectivityPointThreeText:
        "टोकन, तारीख, समय और केंद्र आपकी बुकिंग की पहचान करते हैं।",

      smsEyebrow:
        "SMS उदाहरण",

      smsTitle:
        "बुकिंग की जरूरी जानकारी आपके फोन पर भी आ सकती है।",

      smsDescription:
        "कम मोबाइल डेटा या इंटरनेट उपलब्ध न होने पर SMS उपयोगी है।",

      smsFeatureOne:
        "बुकिंग पुष्टि",

      smsFeatureTwo:
        "टोकन और आने का समय",

      smsFeatureThree:
        "खरीद और भुगतान अपडेट",

      smsMockupTitle:
        "संदेश",

      smsMockupTime:
        "10:42 AM",

      smsExampleText:
        "KrishiSetu: बुकिंग की पुष्टि हुई। टोकन B021। गेहूं, 250 किलो अनुमानित। समय: 30 अगस्त, 10:00–10:30 AM। केंद्र: Main Procurement Center।",

      contactEyebrow:
        "केंद्र से संपर्क",

      contactTitle:
        "सीधी सहायता चाहिए?",

      contactDescription:
        "योजना बदलने या बुकिंग से जुड़ी जानकारी चाहिए तो खरीद केंद्र आपकी सहायता कर सकता है।",

      centerLabel:
        "आपका खरीद केंद्र",

      centerName:
        "Main Procurement Center",

      centerAddress:
        "मुख्य खरीद केंद्र",

      addressLabel:
        "स्थान",

      phoneLabel:
        "फोन",

      centerPhone:
        "1800 123 456",

      hoursLabel:
        "समय",

      centerHours:
        "10:00 AM – 5:00 PM",

      whenToContactLabel:
        "केंद्र से संपर्क करें जब",

      whenToContactTitle:
        "ऑपरेटर की सहायता आवश्यक हो।",

      contactReasonOne:
        "आप देर से पहुंच सकते हैं।",

      contactReasonTwo:
        "फसल या बुकिंग विवरण में सुधार चाहिए।",

      contactReasonThree:
        "वजन या खरीद से जुड़ा प्रश्न है।",

      contactReasonFour:
        "भुगतान की स्थिति समझनी है।",

      emergencyNote:
        "इस प्रोटोटाइप में बुकिंग बदलाव, देर से आने और खरीद से जुड़ी समस्याओं के लिए केंद्र टीम मुख्य सहायता बिंदु है।",

      languageEyebrow:
        "भाषा सहायता",

      languageTitle:
        "किसान पोर्टल अपनी पसंदीदा भाषा में उपयोग करें।",

      languageDescription:
        "KrishiSetu किसान यात्रा में English, Hindi और Telugu का समर्थन करता है।",

      finalEyebrow:
        "आगे बढ़ने के लिए तैयार?",

      finalTitle:
        "किसान डैशबोर्ड पर वापस जाएं।",

      finalDescription:
        "अपनी बुकिंग देखें, टोकन ट्रैक करें या नई खरीद बुकिंग बनाएं।",

      footerTagline:
        "स्मार्ट कृषि खरीद",

      footerText:
        "किसान सहायता · बुकिंग · टोकन · खरीद · भुगतान",

    },


    te: {

      back:
        "వెనుకకు",

      supportAvailable:
        "సహాయం అందుబాటులో ఉంది",

      eyebrow:
        "రైతు సహాయం",

      titleOne:
        "మేము మీకు",

      titleTwo:
        "ఎలా సహాయం చేయాలి?",

      description:
        "మీ బుకింగ్, టోకెన్, కేంద్రానికి రాక, తూకం, చెల్లింపు మరియు SMS అప్‌డేట్‌లకు సంబంధించిన ముఖ్యమైన సమాచారం ఇక్కడ ఉంది.",

      callCenter:
        "కాల్ సెంటర్",

      bookSlot:
        "స్లాట్ బుక్ చేయండి",

      quickHelp:
        "త్వరిత సహాయం",

      quickHelpTitle:
        "మీకు అవసరమైన సమాధానంతో ప్రారంభించండి.",

      quickOne:
        "మీ బుకింగ్‌ను అర్థం చేసుకోండి",

      quickTwo:
        "మీ టోకెన్ సమాచారాన్ని చూడండి",

      quickThree:
        "కేంద్రంలో ఏమి చేయాలో తెలుసుకోండి",

      quickFour:
        "చెల్లింపు మరియు SMS అప్‌డేట్‌లను అర్థం చేసుకోండి",

      quickTopics:
        "సహాయ అంశాలు",

      quickTitle:
        "త్వరగా సహాయం పొందండి.",

      quickDescription:
        "మీకు అవసరమైన సమాచారానికి నేరుగా వెళ్లడానికి ఒక అంశాన్ని ఎంచుకోండి.",

      topicBooking:
        "బుకింగ్",

      topicBookingText:
        "పంట, పరిమాణం, కేంద్రం, తేదీ మరియు సమయాన్ని ఎలా ఎంచుకోవాలి.",

      topicToken:
        "టోకెన్",

      topicTokenText:
        "మీ టోకెన్ అర్థం మరియు కేంద్రంలో దాని ఉపయోగం.",

      topicArrival:
        "రాక",

      topicArrivalText:
        "ఎప్పుడు రావాలి, ఏమి తీసుకురావాలి మరియు తర్వాత ఏమి జరుగుతుంది.",

      topicWeighing:
        "తూకం",

      topicWeighingText:
        "అంచనా మరియు వాస్తవ పరిమాణాలు ఎలా నమోదు చేయబడతాయి.",

      topicPayment:
        "చెల్లింపు",

      topicPaymentText:
        "పెండింగ్ మరియు పూర్తైన చెల్లింపు దశలను అర్థం చేసుకోండి.",

      topicSms:
        "SMS & ఇంటర్నెట్",

      topicSmsText:
        "ఇంటర్నెట్ పరిమితంగా ఉన్నా సమాచారం పొందండి.",

      guidesEyebrow:
        "దశల వారీ మార్గదర్శకాలు",

      guidesTitle:
        "ప్రతి దశలో ఏమి జరుగుతుందో తెలుసుకోండి.",

      guidesDescription:
        "బుకింగ్ సృష్టించడం నుండి చెల్లింపు వరకు పూర్తి ప్రయాణాన్ని అర్థం చేసుకోండి.",

      bookingGuideTitle:
        "బుకింగ్ ఎలా పనిచేస్తుంది",

      bookingGuideIntro:
        "మీ పంట మరియు మీరు వాస్తవంగా కేంద్రానికి చేరుకోగల సమయానికి సరిపోయే బుకింగ్‌ను సృష్టించండి.",

      bookingStepOne:
        "మీరు తీసుకురాబోయే పంటను ఎంచుకోండి.",

      bookingStepTwo:
        "కిలోగ్రాముల్లో అంచనా పరిమాణాన్ని నమోదు చేయండి.",

      bookingStepThree:
        "మీ ప్రాంతానికి సంబంధించిన కొనుగోలు కేంద్రాన్ని ఎంచుకోండి.",

      bookingStepFour:
        "ఇష్టమైన తేదీని ఎంచుకుని అందుబాటులో ఉన్న సమయాలను చూడండి.",

      bookingStepFive:
        "అన్ని వివరాలు సరిగ్గా ఉన్న తర్వాత మాత్రమే బుకింగ్‌ను నిర్ధారించండి.",

      tokenGuideTitle:
        "మీ టోకెన్‌ను అర్థం చేసుకోండి",

      tokenGuideIntro:
        "మీ టోకెన్ మీ రైతు బుకింగ్‌ను కొనుగోలు ప్రక్రియతో అనుసంధానించే ప్రత్యేక గుర్తింపు.",

      tokenStepOne:
        "నిర్ధారణ తర్వాత టోకెన్‌ను భద్రంగా ఉంచుకోండి.",

      tokenStepTwo:
        "కేంద్రానికి చేరుకున్నప్పుడు టోకెన్‌ను బృందానికి చూపించండి.",

      tokenStepThree:
        "అదే బుకింగ్‌కు రాక, తూకం మరియు కొనుగోలు అప్‌డేట్‌లు అనుసంధానించబడతాయి.",

      tokenStepFour:
        "మీ టోకెన్ పేజీలో ప్రస్తుత కొనుగోలు స్థితి కనిపిస్తుంది.",

      arrivalGuideTitle:
        "కేంద్రానికి వెళ్లే ముందు",

      arrivalGuideIntro:
        "కొద్దిగా ముందస్తు సిద్ధత మీ సందర్శనను సులభంగా చేసి అనవసరమైన వేచి ఉండటాన్ని తగ్గిస్తుంది.",

      arrivalStepOne:
        "వెళ్లే ముందు టోకెన్, కేంద్రం మరియు రాక సమయాన్ని తనిఖీ చేయండి.",

      arrivalStepTwo:
        "కేంద్రానికి చేరుకోవడానికి తగిన ప్రయాణ సమయం ఉంచుకోండి.",

      arrivalStepThree:
        "బుక్ చేసిన పంటను తీసుకువచ్చి అంచనా పరిమాణాన్ని గుర్తుంచుకోండి.",

      arrivalStepFour:
        "కేంద్రానికి చేరుకున్నప్పుడు కొనుగోలు బృందానికి టోకెన్ చూపించండి.",

      arrivalStepFive:
        "ఆలస్యమైతే ఎలాంటి సమాచారం లేకుండా వెళ్లిపోకుండా కేంద్ర బృందంతో మాట్లాడండి.",

      weighingGuideTitle:
        "తూకం కేంద్రంలో",

      weighingGuideIntro:
        "కేంద్రం వాస్తవ పరిమాణాన్ని నమోదు చేసి కొనుగోలు తనిఖీలను పూర్తి చేస్తుంది.",

      weighingStepOne:
        "ఆపరేటర్ టోకెన్ ద్వారా మీ బుకింగ్‌ను గుర్తిస్తారు.",

      weighingStepTwo:
        "మీ పంటను తూకం వేసి వాస్తవ పరిమాణాన్ని నమోదు చేస్తారు.",

      weighingStepThree:
        "అవసరమైతే నాణ్యతను కూడా నమోదు చేయవచ్చు.",

      weighingStepFour:
        "ధృవీకరణ తర్వాత బుకింగ్ కొనుగోలు పూర్తయిన దశకు వెళుతుంది.",

      paymentGuideTitle:
        "చెల్లింపు ఎలా పనిచేస్తుంది",

      paymentGuideIntro:
        "కొనుగోలు ప్రక్రియ పూర్తైన తర్వాత చెల్లింపు స్థితి కనిపిస్తుంది.",

      paymentStepOne:
        "తూకం సమయంలో వాస్తవ పరిమాణం నమోదు చేయబడుతుంది.",

      paymentStepTwo:
        "కొనుగోలు పూర్తైన తర్వాత చెల్లింపు పెండింగ్ స్థితి రావచ్చు.",

      paymentStepThree:
        "ఆపరేటర్ చెల్లింపు మొత్తం మరియు సూచనను నమోదు చేస్తారు.",

      paymentStepFour:
        "చెల్లింపు పంపిన తర్వాత దాని స్థితి కనిపిస్తుంది.",

      connectivityGuideTitle:
        "తక్కువ కనెక్టివిటీ సహాయం",

      connectivityGuideIntro:
        "ఇంటర్నెట్ పరిమితంగా ఉన్నా ముఖ్యమైన బుకింగ్ సమాచారాన్ని మీ వద్ద ఉంచుకోవచ్చు.",

      connectivityStepOne:
        "మీ నిర్ధారణ మరియు టోకెన్ సమాచారాన్ని భద్రపరచండి.",

      connectivityStepTwo:
        "SMSలో టోకెన్, తేదీ, సమయం మరియు కేంద్ర వివరాలు రావచ్చు.",

      connectivityStepThree:
        "కేంద్రంలో మీ బుకింగ్‌ను గుర్తించడానికి ఆ వివరాలను ఉపయోగించండి.",

      connectivityStepFour:
        "ముఖ్యమైన కొనుగోలు మరియు చెల్లింపు అప్‌డేట్‌లు SMS ద్వారా కూడా రావచ్చు.",

      faqEyebrow:
        "తరచుగా అడిగే ప్రశ్నలు",

      faqTitle:
        "సాధారణ ప్రశ్నలకు సమాధానాలు.",

      faqDescription:
        "పూర్తి మార్గదర్శకాన్ని చదవడానికి ఒక ప్రశ్నను తెరవండి.",

      faqTipLabel:
        "బుకింగ్ సూచన",

      faqTipTitle:
        "వాస్తవిక రాక సమయాన్ని ఎంచుకోండి.",

      faqTipText:
        "మొదటి స్లాట్ ఎల్లప్పుడూ ఉత్తమం కాదు. మీరు సౌకర్యంగా కేంద్రానికి చేరుకోగల సమయాన్ని ఎంచుకోండి.",

      faqSecurityLabel:
        "మీ సమాచారం",

      faqSecurityTitle:
        "మీ టోకెన్‌ను సిద్ధంగా ఉంచుకోండి.",

      faqSecurityText:
        "మీ టోకెన్ మీ బుకింగ్‌ను కేంద్ర కొనుగోలు ప్రక్రియతో అనుసంధానిస్తుంది.",

      arrivalChecklistEyebrow:
        "రాక చెక్‌లిస్ట్",

      arrivalChecklistTitle:
        "కేంద్రానికి బయలుదేరే ముందు.",

      arrivalChecklistDescription:
        "మీ ప్రయాణం ప్రారంభించే ముందు ఈ నాలుగు విషయాలను సిద్ధంగా ఉంచుకోండి.",

      checklistTokenTitle:
        "మీ టోకెన్",

      checklistTokenText:
        "మీ ఫోన్ లేదా నిర్ధారణ సందేశంలో టోకెన్‌ను అందుబాటులో ఉంచుకోండి.",

      checklistProduceTitle:
        "మీ పంట",

      checklistProduceText:
        "బుకింగ్‌లో ఎంచుకున్న పంటను తీసుకువచ్చి కొనుగోలుకు సిద్ధంగా ఉంచండి.",

      checklistQuantityTitle:
        "పరిమాణ అంచనా",

      checklistQuantityText:
        "మీరు నమోదు చేసిన అంచనా పరిమాణాన్ని గుర్తుంచుకోండి. తుది బరువు కేంద్రంలో నమోదు చేయబడుతుంది.",

      checklistCenterTitle:
        "కేంద్ర వివరాలు",

      checklistCenterText:
        "బయలుదేరే ముందు కేంద్రం పేరు, స్థానం మరియు రాక సమయాన్ని తనిఖీ చేయండి.",

      connectivityEyebrow:
        "తక్కువ కనెక్టివిటీ సహాయం",

      connectivityTitle:
        "ఇంటర్నెట్ లేకపోయినా సమాచారం పొందవచ్చు.",

      connectivityDescription:
        "మీ బుకింగ్ టోకెన్ మరియు నిర్ధారణ సమాచారంపై ఆధారపడి ఉంటుంది కాబట్టి మీరు వెబ్‌సైట్‌ను నిరంతరం తెరిచి ఉంచాల్సిన అవసరం లేదు.",

      connectivityPointOneTitle:
        "బుకింగ్ నిర్ధారణ",

      connectivityPointOneText:
        "బుకింగ్ తర్వాత నిర్ధారణ వివరాలను భద్రపరచండి.",

      connectivityPointTwoTitle:
        "SMS అప్‌డేట్‌లు",

      connectivityPointTwoText:
        "ముఖ్యమైన స్థితి సమాచారం మీ రిజిస్టర్డ్ మొబైల్‌కు రావచ్చు.",

      connectivityPointThreeTitle:
        "టోకెన్ సమాచారం",

      connectivityPointThreeText:
        "టోకెన్, తేదీ, సమయం మరియు కేంద్ర వివరాలు మీ బుకింగ్‌ను గుర్తిస్తాయి.",

      smsEyebrow:
        "SMS ఉదాహరణ",

      smsTitle:
        "మీ ముఖ్యమైన బుకింగ్ వివరాలు మీ ఫోన్‌కు కూడా రావచ్చు.",

      smsDescription:
        "మొబైల్ డేటా బలహీనంగా ఉన్నప్పుడు లేదా వెబ్ యాప్‌ను తెరవలేని సమయంలో SMS ఉపయోగకరంగా ఉంటుంది.",

      smsFeatureOne:
        "బుకింగ్ నిర్ధారణ",

      smsFeatureTwo:
        "టోకెన్ మరియు రాక సమయం",

      smsFeatureThree:
        "కొనుగోలు మరియు చెల్లింపు అప్‌డేట్‌లు",

      smsMockupTitle:
        "సందేశాలు",

      smsMockupTime:
        "10:42 AM",

      smsExampleText:
        "KrishiSetu: బుకింగ్ నిర్ధారించబడింది. టోకెన్ B021. గోధుమ, 250 kg అంచనా. రాక: 30 ఆగస్టు, 10:00–10:30 AM. కేంద్రం: Main Procurement Center.",

      contactEyebrow:
        "కేంద్రాన్ని సంప్రదించండి",

      contactTitle:
        "నేరుగా సహాయం కావాలా?",

      contactDescription:
        "మీ ప్రణాళికలు మారితే లేదా మీ బుకింగ్ గురించి వివరణ కావాలంటే కొనుగోలు కేంద్రం సహాయం చేయగలదు.",

      centerLabel:
        "మీ కొనుగోలు కేంద్రం",

      centerName:
        "Main Procurement Center",

      centerAddress:
        "ప్రధాన కొనుగోలు కేంద్రం",

      addressLabel:
        "స్థానం",

      phoneLabel:
        "ఫోన్",

      centerPhone:
        "1800 123 456",

      hoursLabel:
        "పని సమయం",

      centerHours:
        "10:00 AM – 5:00 PM",

      whenToContactLabel:
        "కేంద్రాన్ని సంప్రదించండి ఎప్పుడు",

      whenToContactTitle:
        "ఆపరేటర్ మార్గదర్శనం అవసరమైనప్పుడు.",

      contactReasonOne:
        "మీరు ఆలస్యంగా చేరవచ్చు.",

      contactReasonTwo:
        "పంట లేదా బుకింగ్ వివరాల్లో మార్పు అవసరం.",

      contactReasonThree:
        "తూకం లేదా కొనుగోలు గురించి ప్రశ్న ఉంది.",

      contactReasonFour:
        "చెల్లింపు స్థితి గురించి వివరణ కావాలి.",

      emergencyNote:
        "ఈ ప్రోటోటైప్‌లో బుకింగ్ మార్పులు, ఆలస్య రాక మరియు కొనుగోలు సంబంధిత సమస్యలకు కేంద్ర బృందమే ప్రధాన సహాయ కేంద్రం.",

      languageEyebrow:
        "భాషా సహాయం",

      languageTitle:
        "మీకు ఇష్టమైన భాషలో రైతు పోర్టల్‌ను ఉపయోగించండి.",

      languageDescription:
        "KrishiSetu రైతు ప్రయాణంలో English, Hindi మరియు Telugu భాషలకు మద్దతు ఇస్తుంది.",

      finalEyebrow:
        "కొనసాగించడానికి సిద్ధంగా ఉన్నారా?",

      finalTitle:
        "రైతు డ్యాష్‌బోర్డ్‌కు తిరిగి వెళ్లండి.",

      finalDescription:
        "మీ బుకింగ్‌ను చూడండి, టోకెన్‌ను ట్రాక్ చేయండి లేదా కొత్త కొనుగోలు బుకింగ్‌ను సృష్టించండి.",

      footerTagline:
        "స్మార్ట్ వ్యవసాయ కొనుగోలు",

      footerText:
        "రైతు సహాయం · బుకింగ్ · టోకెన్ · కొనుగోలు · చెల్లింపు",

    },

  };


  return (
    copy[
      language
    ] ||
    copy.en
  );

}


export default FarmerHelp;