import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  MessageCircle,
  ChevronDown,
  LoaderCircle,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router";

import {
  useLanguage,
} from "../translations/LanguageContext";


const LANGUAGE_CONFIG = {
  en: {
    recognition: "en-IN",

    title:
      "KrishiSetu Voice Assistant",

    subtitle:
      "Speak naturally. I will help you navigate.",

    listening:
      "Listening...",

    processing:
      "Understanding...",

    ready:
      "Tap the microphone and speak.",

    unsupported:
      "Voice recognition is not supported on this browser.",

    permission:
      "Microphone permission is required.",

    notUnderstood:
      "I couldn't understand that. Please try again.",

    noSpeech:
      "I didn't hear anything. Please try again.",

    error:
      "Something went wrong with voice recognition.",

    microphone:
      "Microphone",

    close:
      "Close",

    stop:
      "Stop listening",

    start:
      "Start listening",

    mute:
      "Mute voice",

    unmute:
      "Enable voice",

    youSaid:
      "You said",

    assistant:
      "KrishiSetu",

    examples: [
      "Book a procurement slot",
      "Show my token",
      "Open notifications",
      "Go to help",
    ],
  },

  hi: {
    recognition: "hi-IN",

    title:
      "कृषि सेतु वॉइस सहायक",

    subtitle:
      "स्वाभाविक रूप से बोलें। मैं आपकी मदद करूंगा।",

    listening:
      "सुन रहा हूँ...",

    processing:
      "समझ रहा हूँ...",

    ready:
      "माइक्रोफोन दबाकर बोलें।",

    unsupported:
      "इस ब्राउज़र में वॉइस रिकग्निशन उपलब्ध नहीं है।",

    permission:
      "माइक्रोफोन की अनुमति आवश्यक है।",

    notUnderstood:
      "मैं समझ नहीं पाया। कृपया फिर से बोलें।",

    noSpeech:
      "मुझे आपकी आवाज़ नहीं सुनाई दी। फिर से बोलें।",

    error:
      "वॉइस रिकग्निशन में समस्या हुई।",

    microphone:
      "माइक्रोफोन",

    close:
      "बंद करें",

    stop:
      "सुनना बंद करें",

    start:
      "सुनना शुरू करें",

    mute:
      "आवाज़ बंद करें",

    unmute:
      "आवाज़ चालू करें",

    youSaid:
      "आपने कहा",

    assistant:
      "कृषि सेतु",

    examples: [
      "बुकिंग करना है",
      "मेरा टोकन दिखाओ",
      "नोटिफिकेशन खोलो",
      "मदद चाहिए",
    ],
  },

  te: {
    recognition: "te-IN",

    title:
      "కృషిసేతు వాయిస్ అసిస్టెంట్",

    subtitle:
      "సహజంగా మాట్లాడండి. నేను మీకు సహాయం చేస్తాను.",

    listening:
      "వింటున్నాను...",

    processing:
      "అర్థం చేసుకుంటున్నాను...",

    ready:
      "మైక్రోఫోన్ నొక్కి మాట్లాడండి.",

    unsupported:
      "ఈ బ్రౌజర్‌లో వాయిస్ రికగ్నిషన్ అందుబాటులో లేదు.",

    permission:
      "మైక్రోఫోన్ అనుమతి అవసరం.",

    notUnderstood:
      "నేను అర్థం చేసుకోలేకపోయాను. మళ్లీ ప్రయత్నించండి.",

    noSpeech:
      "మీ మాట వినిపించలేదు. మళ్లీ మాట్లాడండి.",

    error:
      "వాయిస్ రికగ్నిషన్‌లో సమస్య ఏర్పడింది.",

    microphone:
      "మైక్రోఫోన్",

    close:
      "మూసివేయండి",

    stop:
      "వినడం ఆపండి",

    start:
      "వినడం ప్రారంభించండి",

    mute:
      "వాయిస్ ఆపండి",

    unmute:
      "వాయిస్ ప్రారంభించండి",

    youSaid:
      "మీరు చెప్పారు",

    assistant:
      "కృషిసేతు",

    examples: [
      "బుకింగ్ చేయాలి",
      "నా టోకెన్ చూపించు",
      "నోటిఫికేషన్స్ తెరువు",
      "సహాయం కావాలి",
    ],
  },
};


function getSpeechRecognition() {
  if (
    typeof window ===
    "undefined"
  ) {
    return null;
  }

  return (
    window.SpeechRecognition ||
    window.webkitSpeechRecognition ||
    null
  );
}


function normalizeText(
  value
) {
  return String(
    value || ""
  )
    .toLowerCase()
    .trim()
    .replace(
      /[.,!?;:'"।॥]/g,
      " "
    )
    .replace(
      /\s+/g,
      " "
    );
}


function containsAny(
  text,
  words
) {
  return words.some(
    word =>
      text.includes(
        normalizeText(word)
      )
  );
}


function VoiceAssistant() {

  const navigate =
    useNavigate();

  const location =
    useLocation();

  const {
    language,
  } =
    useLanguage();


  const currentLanguage =
    LANGUAGE_CONFIG[
      language
    ] ||
    LANGUAGE_CONFIG.en;


  const [
    open,
    setOpen,
  ] =
    useState(false);


  const [
    listening,
    setListening,
  ] =
    useState(false);


  const [
    processing,
    setProcessing,
  ] =
    useState(false);


  const [
    transcript,
    setTranscript,
  ] =
    useState("");


  const [
    responseText,
    setResponseText,
  ] =
    useState("");


  const [
    voiceEnabled,
    setVoiceEnabled,
  ] =
    useState(true);


  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");


  const recognitionRef =
    useRef(null);


  const speechQueueRef =
    useRef([]);


  const supported =
    useMemo(
      () =>
        Boolean(
          getSpeechRecognition()
        ),
      []
    );


  /*
   * -------------------------------------------------------
   * ONLY SHOW ON FARMER PAGES
   * -------------------------------------------------------
   */

  const isFarmerPage =
    location.pathname.startsWith(
      "/farmer"
    );


  /*
   * -------------------------------------------------------
   * CLEANUP
   * -------------------------------------------------------
   */

  useEffect(() => {

    return () => {

      try {

        recognitionRef.current?.stop();

      } catch {
      }

      window.speechSynthesis?.cancel();

    };

  }, []);


  /*
   * -------------------------------------------------------
   * SPEECH RECOGNITION SETUP
   * -------------------------------------------------------
   */

  function createRecognition() {

    const Recognition =
      getSpeechRecognition();


    if (
      !Recognition
    ) {

      return null;

    }


    const recognition =
      new Recognition();


    recognition.continuous =
      false;


    recognition.interimResults =
      true;


    recognition.lang =
      currentLanguage.recognition;


    recognition.maxAlternatives =
      3;


    recognition.onstart =
      () => {

        setListening(
          true
        );

        setProcessing(
          false
        );

        setErrorMessage(
          ""
        );

        setTranscript(
          ""
        );

      };


    recognition.onresult =
      event => {

        let finalText =
          "";


        let interimText =
          "";


        for (
          let index = 0;
          index <
          event.results.length;
          index++
        ) {

          const result =
            event.results[index];


          const text =
            result[0]?.transcript ||
            "";


          if (
            result.isFinal
          ) {

            finalText +=
              `${text} `;

          } else {

            interimText +=
              `${text} `;

          }

        }


        const displayedText =
          (
            finalText ||
            interimText
          ).trim();


        setTranscript(
          displayedText
        );


        if (
          finalText.trim()
        ) {

          setProcessing(
            true
          );


          handleCommand(
            finalText.trim()
          );

        }

      };


    recognition.onerror =
      event => {

        setListening(
          false
        );

        setProcessing(
          false
        );


        const error =
          event?.error;


        if (
          error ===
          "not-allowed" ||
          error ===
          "service-not-allowed"
        ) {

          setErrorMessage(
            currentLanguage.permission
          );

        } else if (
          error ===
          "no-speech"
        ) {

          setErrorMessage(
            currentLanguage.noSpeech
          );

        } else {

          setErrorMessage(
            currentLanguage.error
          );

        }

      };


    recognition.onend =
      () => {

        setListening(
          false
        );

      };


    return recognition;

  }


  /*
   * -------------------------------------------------------
   * START / STOP LISTENING
   * -------------------------------------------------------
   */

  function startListening() {

    if (
      !supported
    ) {

      setErrorMessage(
        currentLanguage.unsupported
      );

      setOpen(
        true
      );

      return;

    }


    if (
      listening
    ) {

      stopListening();

      return;

    }


    setErrorMessage(
      ""
    );

    setTranscript(
      ""
    );

    setResponseText(
      ""
    );


    try {

      window.speechSynthesis?.cancel();


      const recognition =
        createRecognition();


      if (
        !recognition
      ) {

        setErrorMessage(
          currentLanguage.unsupported
        );

        return;

      }


      recognitionRef.current =
        recognition;


      recognition.start();

    } catch (
      error
    ) {

      console.error(
        "Voice recognition start error:",
        error
      );


      setListening(
        false
      );


      setErrorMessage(
        currentLanguage.error
      );

    }

  }


  function stopListening() {

    try {

      recognitionRef.current?.stop();

    } catch {
    }

    setListening(
      false
    );

  }


  /*
   * -------------------------------------------------------
   * TEXT TO SPEECH
   * -------------------------------------------------------
   */

  function speak(
    text
  ) {

    if (
      !voiceEnabled ||
      !text ||
      typeof window ===
      "undefined" ||
      !window.speechSynthesis
    ) {

      return;

    }


    window.speechSynthesis.cancel();


    const utterance =
      new SpeechSynthesisUtterance(
        text
      );


    utterance.lang =
      currentLanguage.recognition;


    utterance.rate =
      language ===
      "te"
        ? 0.9
        : 0.95;


    utterance.pitch =
      1;


    utterance.volume =
      1;


    speechQueueRef.current =
      [
        utterance,
      ];


    window.speechSynthesis.speak(
      utterance
    );

  }


  /*
   * -------------------------------------------------------
   * COMMAND EXECUTION
   * -------------------------------------------------------
   */

  function reply(
    text,
    path = null
  ) {

    setResponseText(
      text
    );


    setProcessing(
      false
    );


    speak(
      text
    );


    if (
      path
    ) {

      window.setTimeout(
        () => {

          navigate(
            path
          );

        },
        650
      );

    }

  }


  function handleCommand(
    rawText
  ) {

    const text =
      normalizeText(
        rawText
      );


    /*
     * ENGLISH
     */

    if (
      language ===
      "en"
    ) {

      if (
        containsAny(
          text,
          [
            "book",
            "booking",
            "book a slot",
            "reserve",
            "reserve a slot",
            "procurement slot",
            "new booking",
          ]
        )
      ) {

        reply(
          "Opening the booking page.",
          "/farmer/book"
        );

        return;

      }


      if (
        containsAny(
          text,
          [
            "token",
            "my token",
            "show token",
            "digital token",
          ]
        )
      ) {

        reply(
          "Opening your token page.",
          "/farmer/token"
        );

        return;

      }


      if (
        containsAny(
          text,
          [
            "notification",
            "notifications",
            "updates",
            "messages",
          ]
        )
      ) {

        reply(
          "Opening your notifications.",
          "/farmer/notifications"
        );

        return;

      }


      if (
        containsAny(
          text,
          [
            "help",
            "support",
            "need help",
            "how do i",
          ]
        )
      ) {

        reply(
          "Opening farmer help.",
          "/farmer/help"
        );

        return;

      }


      if (
        containsAny(
          text,
          [
            "setting",
            "settings",
            "profile",
            "account",
          ]
        )
      ) {

        reply(
          "Opening your account settings.",
          "/farmer/settings"
        );

        return;

      }


      if (
        containsAny(
          text,
          [
            "home",
            "dashboard",
            "farmer home",
            "go home",
          ]
        )
      ) {

        reply(
          "Opening your farmer home.",
          "/farmer/home"
        );

        return;

      }


      if (
        containsAny(
          text,
          [
            "close",
            "exit",
            "bye",
          ]
        )
      ) {

        reply(
          "Okay.",
          null
        );

        return;

      }

    }


    /*
     * HINDI
     */

    if (
      language ===
      "hi"
    ) {

      if (
        containsAny(
          text,
          [
            "बुक",
            "बुकिंग",
            "स्लॉट",
            "समय बुक",
            "समय लेना",
            "आरक्षित",
          ]
        )
      ) {

        reply(
          "बुकिंग पेज खोल रहा हूँ।",
          "/farmer/book"
        );

        return;

      }


      if (
        containsAny(
          text,
          [
            "टोकन",
            "मेरा टोकन",
            "डिजिटल टोकन",
          ]
        )
      ) {

        reply(
          "आपका टोकन पेज खोल रहा हूँ।",
          "/farmer/token"
        );

        return;

      }


      if (
        containsAny(
          text,
          [
            "नोटिफिकेशन",
            "सूचना",
            "अपडेट",
            "संदेश",
          ]
        )
      ) {

        reply(
          "आपके नोटिफिकेशन खोल रहा हूँ।",
          "/farmer/notifications"
        );

        return;

      }


      if (
        containsAny(
          text,
          [
            "मदद",
            "सहायता",
            "हेल्प",
          ]
        )
      ) {

        reply(
          "किसान सहायता खोल रहा हूँ।",
          "/farmer/help"
        );

        return;

      }


      if (
        containsAny(
          text,
          [
            "सेटिंग",
            "सेटिंग्स",
            "प्रोफाइल",
            "खाता",
          ]
        )
      ) {

        reply(
          "आपकी खाता सेटिंग्स खोल रहा हूँ।",
          "/farmer/settings"
        );

        return;

      }


      if (
        containsAny(
          text,
          [
            "होम",
            "मुख्य पेज",
            "डैशबोर्ड",
          ]
        )
      ) {

        reply(
          "किसान होम खोल रहा हूँ।",
          "/farmer/home"
        );

        return;

      }

    }


    /*
     * TELUGU
     */

    if (
      language ===
      "te"
    ) {

      if (
        containsAny(
          text,
          [
            "బుకింగ్",
            "బుక్",
            "స్లాట్",
            "సమయం బుక్",
            "రిజర్వ్",
          ]
        )
      ) {

        reply(
          "బుకింగ్ పేజీని తెరుస్తున్నాను.",
          "/farmer/book"
        );

        return;

      }


      if (
        containsAny(
          text,
          [
            "టోకెన్",
            "నా టోకెన్",
            "డిజిటల్ టోకెన్",
          ]
        )
      ) {

        reply(
          "మీ టోకెన్ పేజీని తెరుస్తున్నాను.",
          "/farmer/token"
        );

        return;

      }


      if (
        containsAny(
          text,
          [
            "నోటిఫికేషన్",
            "నోటిఫికేషన్స్",
            "అప్‌డేట్స్",
            "సందేశాలు",
          ]
        )
      ) {

        reply(
          "మీ నోటిఫికేషన్స్ తెరుస్తున్నాను.",
          "/farmer/notifications"
        );

        return;

      }


      if (
        containsAny(
          text,
          [
            "సహాయం",
            "హెల్ప్",
            "సపోర్ట్",
          ]
        )
      ) {

        reply(
          "రైతు సహాయ పేజీని తెరుస్తున్నాను.",
          "/farmer/help"
        );

        return;

      }


      if (
        containsAny(
          text,
          [
            "సెట్టింగ్స్",
            "సెట్టింగ్",
            "ప్రొఫైల్",
            "ఖాతా",
          ]
        )
      ) {

        reply(
          "మీ ఖాతా సెట్టింగ్స్ తెరుస్తున్నాను.",
          "/farmer/settings"
        );

        return;

      }


      if (
        containsAny(
          text,
          [
            "హోమ్",
            "ముఖ్య పేజీ",
            "డాష్‌బోర్డ్",
          ]
        )
      ) {

        reply(
          "రైతు హోమ్ పేజీని తెరుస్తున్నాను.",
          "/farmer/home"
        );

        return;

      }

    }


    /*
     * COMMON FALLBACK
     */

    reply(
      currentLanguage.notUnderstood
    );

  }


  /*
   * -------------------------------------------------------
   * QUICK COMMAND
   * -------------------------------------------------------
   */

  function runExample(
    example
  ) {

    setTranscript(
      example
    );


    handleCommand(
      example
    );

  }


  if (
    !isFarmerPage
  ) {

    return null;

  }


  /*
   * -------------------------------------------------------
   * RENDER
   * -------------------------------------------------------
   */

  return (

    <>

      <button
        type="button"
        className={
          listening
            ? "voice-assistant-floating listening"
            : "voice-assistant-floating"
        }
        onClick={() => {

          setOpen(
            true
          );

          startListening();

        }}
        aria-label={
          currentLanguage.start
        }
        title={
          currentLanguage.start
        }
      >

        {listening ? (

          <>

            <span className="voice-assistant-pulse" />

            <MicOff
              size={21}
            />

          </>

        ) : (

          <Mic
            size={21}
          />

        )}

      </button>


      {open && (

        <div className="voice-assistant-panel">

          <div className="voice-assistant-panel-header">

            <div className="voice-assistant-heading">

              <div className="voice-assistant-heading-icon">

                <MessageCircle
                  size={19}
                />

              </div>


              <div>

                <strong>
                  {
                    currentLanguage.title
                  }
                </strong>

                <span>
                  {
                    currentLanguage.subtitle
                  }
                </span>

              </div>

            </div>


            <button
              type="button"
              className="voice-assistant-close"
              onClick={() => {

                stopListening();

                window.speechSynthesis?.cancel();

                setOpen(
                  false
                );

              }}
              aria-label={
                currentLanguage.close
              }
            >

              <X
                size={18}
              />

            </button>

          </div>


          <div className="voice-assistant-body">

            <div
              className={
                listening
                  ? "voice-assistant-orb listening"
                  : "voice-assistant-orb"
              }
            >

              {listening ? (

                <>

                  <span className="voice-orb-wave wave-one" />
                  <span className="voice-orb-wave wave-two" />
                  <span className="voice-orb-wave wave-three" />

                </>

              ) : (

                <Mic
                  size={28}
                />

              )}

            </div>


            <div className="voice-assistant-state">

              <strong>

                {
                  listening
                    ? currentLanguage.listening
                    : processing
                      ? currentLanguage.processing
                      : currentLanguage.ready
                }

              </strong>


              {!supported && (

                <span className="voice-assistant-error">

                  {
                    currentLanguage.unsupported
                  }

                </span>

              )}

            </div>


            {transcript && (

              <div className="voice-assistant-transcript">

                <span>
                  {
                    currentLanguage.youSaid
                  }
                </span>


                <p>
                  “{transcript}”
                </p>

              </div>

            )}


            {responseText && (

              <div className="voice-assistant-response">

                <div className="voice-assistant-response-icon">

                  <MessageCircle
                    size={15}
                  />

                </div>


                <div>

                  <span>
                    {
                      currentLanguage.assistant
                    }
                  </span>


                  <p>
                    {
                      responseText
                    }
                  </p>

                </div>

              </div>

            )}


            {errorMessage && (

              <div className="voice-assistant-error-card">

                {
                  errorMessage
                }

              </div>

            )}


            <button
              type="button"
              className={
                listening
                  ? "voice-assistant-main-button stop"
                  : "voice-assistant-main-button"
              }
              onClick={
                startListening
              }
              disabled={
                processing
              }
            >

              {processing ? (

                <LoaderCircle
                  size={18}
                  className="voice-assistant-spin"
                />

              ) : listening ? (

                <MicOff
                  size={18}
                />

              ) : (

                <Mic
                  size={18}
                />

              )}


              <span>

                {
                  listening
                    ? currentLanguage.stop
                    : currentLanguage.start
                }

              </span>

            </button>


            <div className="voice-assistant-examples">

              <div className="voice-assistant-examples-heading">

                <span>
                  Try saying
                </span>

              </div>


              <div className="voice-assistant-example-list">

                {
                  currentLanguage.examples.map(
                    example => (

                      <button
                        key={
                          example
                        }
                        type="button"
                        onClick={() =>
                          runExample(
                            example
                          )
                        }
                      >
                        {
                          example
                        }
                      </button>

                    )
                  )
                }

              </div>

            </div>

          </div>


          <div className="voice-assistant-footer">

            <button
              type="button"
              onClick={() => {

                setVoiceEnabled(
                  current =>
                    !current
                );

                if (
                  voiceEnabled
                ) {

                  window.speechSynthesis?.cancel();

                }

              }}
              title={
                voiceEnabled
                  ? currentLanguage.mute
                  : currentLanguage.unmute
              }
            >

              {voiceEnabled ? (

                <Volume2
                  size={15}
                />

              ) : (

                <VolumeX
                  size={15}
                />

              )}

              <span>

                {
                  voiceEnabled
                    ? currentLanguage.mute
                    : currentLanguage.unmute
                }

              </span>

            </button>

            <span className="voice-assistant-language">

              {
                currentLanguage.recognition
              }

            </span>

          </div>

        </div>

      )}

    </>

  );

}


export default VoiceAssistant;