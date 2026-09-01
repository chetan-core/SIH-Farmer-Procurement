import {
Mic,
MicOff,
Volume2,
VolumeX,
X,
MessageCircle,
LoaderCircle,
Send,
} from "lucide-react";

import {
useEffect,
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
title: "KrishiSetu Voice Assistant",
subtitle: "Speak or type naturally.",
listening: "Listening...",
processing: "Understanding...",
ready: "Speak or type your request.",
unsupported: "Voice input is not supported in this browser.",
permission: "Please allow microphone access.",
noSpeech: "I didn't hear anything. Please try again.",
error: "Something went wrong.",
close: "Close",
start: "Start listening",
stop: "Stop listening",
mute: "Mute",
unmute: "Enable voice",
youSaid: "You said",
assistant: "KrishiSetu",
placeholder: "Type your question or request...",
send: "Send",
examples: [
"Book a procurement slot",
"Show my token",
"Open my notifications",
"Go to help",
],
},

hi: {
recognition: "hi-IN",
title: "कृषि सेतु वॉइस सहायक",
subtitle: "स्वाभाविक रूप से बोलें या लिखें।",
listening: "सुन रहा हूँ...",
processing: "समझ रहा हूँ...",
ready: "बोलें या अपना अनुरोध लिखें।",
unsupported: "इस ब्राउज़र में वॉइस इनपुट उपलब्ध नहीं है।",
permission: "कृपया माइक्रोफोन की अनुमति दें।",
noSpeech: "मुझे कुछ सुनाई नहीं दिया। फिर से बोलें।",
error: "कुछ समस्या हुई।",
close: "बंद करें",
start: "सुनना शुरू करें",
stop: "सुनना बंद करें",
mute: "आवाज़ बंद करें",
unmute: "आवाज़ चालू करें",
youSaid: "आपने कहा",
assistant: "कृषि सेतु",
placeholder: "अपना सवाल या अनुरोध लिखें...",
send: "भेजें",
examples: [
"बुकिंग करनी है",
"मेरा टोकन दिखाओ",
"मेरे नोटिफिकेशन खोलो",
"मदद चाहिए",
],
},

te: {
recognition: "te-IN",
title: "కృషిసేతు వాయిస్ అసిస్టెంట్",
subtitle: "సహజంగా మాట్లాడండి లేదా టైప్ చేయండి.",
listening: "వింటున్నాను...",
processing: "అర్థం చేసుకుంటున్నాను...",
ready: "మాట్లాడండి లేదా మీ అభ్యర్థనను టైప్ చేయండి.",
unsupported: "ఈ బ్రౌజర్‌లో వాయిస్ ఇన్‌పుట్ అందుబాటులో లేదు.",
permission: "మైక్రోఫోన్ అనుమతిని ఇవ్వండి.",
noSpeech: "మీ మాట వినిపించలేదు. మళ్లీ ప్రయత్నించండి.",
error: "ఏదో సమస్య ఏర్పడింది.",
close: "మూసివేయండి",
start: "వినడం ప్రారంభించండి",
stop: "వినడం ఆపండి",
mute: "వాయిస్ ఆపండి",
unmute: "వాయిస్ ప్రారంభించండి",
youSaid: "మీరు చెప్పారు",
assistant: "కృషిసేతు",
placeholder: "మీ ప్రశ్న లేదా అభ్యర్థనను టైప్ చేయండి...",
send: "పంపండి",
examples: [
"బుకింగ్ చేయాలి",
"నా టోకెన్ చూపించు",
"నోటిఫికేషన్స్ తెరువు",
"సహాయం కావాలి",
],
},
};

function getRecognition() {
if (
typeof window === "undefined"
) {
return null;
}

const Recognition =
window.SpeechRecognition ||
window.webkitSpeechRecognition;

return Recognition || null;
}

function cleanText(value) {
return String(
value || ""
)
.trim()
.replace(
/\s+/g,
" "
);
}

function includesOne(
text,
values
) {
const lower =
text.toLowerCase();

return values.some(
value =>
lower.includes(
String(value).toLowerCase()
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
} = useLanguage();

const config =
LANGUAGE_CONFIG[language] ||
LANGUAGE_CONFIG.en;

const [
open,
setOpen,
] = useState(false);

const [
listening,
setListening,
] = useState(false);

const [
processing,
setProcessing,
] = useState(false);

const [
input,
setInput,
] = useState("");

const [
transcript,
setTranscript,
] = useState("");

const [
response,
setResponse,
] = useState("");

const [
error,
setError,
] = useState("");

const [
voiceEnabled,
setVoiceEnabled,
] = useState(true);

const recognitionRef =
useRef(null);

useEffect(() => {
return () => {
try {
recognitionRef.current?.stop();
} catch {
}


  if (
    typeof window !== "undefined" &&
    window.speechSynthesis
  ) {
    window.speechSynthesis.cancel();
  }
};


}, []);

function speak(text) {
if (
!voiceEnabled ||
!text ||
typeof window === "undefined" ||
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
  config.recognition;

utterance.rate =
  language === "te"
    ? 0.9
    : 0.95;

utterance.pitch = 1;
utterance.volume = 1;

window.speechSynthesis.speak(
  utterance
);


}

function navigateAndReply(
text,
path
) {
setResponse(text);
setProcessing(false);


speak(text);

if (path) {
  window.setTimeout(
    () => {
      navigate(path);
    },
    600
  );
}


}

async function askAssistant(
message
) {
const text =
cleanText(message);


if (!text) {
  return;
}

setProcessing(true);
setError("");

try {
  const result =
    await fetch(
      "/api/assistant",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            message: text,
            language,
            currentPath:
              location.pathname,
          }),
      }
    );

  let data = {};

  try {
    data =
      await result.json();
  } catch {
    data = {};
  }

  if (!result.ok) {
    throw new Error(
      data?.message ||
      "Assistant request failed."
    );
  }

  const reply =
    cleanText(
      data?.reply ||
      data?.message
    );

  if (!reply) {
    throw new Error(
      "The assistant did not return a response."
    );
  }

  setResponse(reply);
  setProcessing(false);

  speak(reply);

  if (
    data?.path
  ) {
    window.setTimeout(
      () => {
        navigate(data.path);
      },
      600
    );
  }

} catch (
  assistantError
) {
  console.error(
    "Assistant error:",
    assistantError
  );

  setProcessing(false);

  setError(
    assistantError?.message ||
    "Unable to reach the assistant."
  );
}


}

function handleCommand(
message
) {
const text =
cleanText(message);


if (!text) {
  return;
}

setTranscript(text);
setInput("");
setError("");

const normalized =
  text.toLowerCase();


if (
  language === "en" &&
  includesOne(
    normalized,
    [
      "book",
      "booking",
      "reserve",
      "procurement slot",
    ]
  )
) {
  navigateAndReply(
    "Opening the booking page.",
    "/farmer/book"
  );

  return;
}


if (
  language === "en" &&
  includesOne(
    normalized,
    [
      "token",
      "my token",
      "digital token",
    ]
  )
) {
  navigateAndReply(
    "Opening your token page.",
    "/farmer/token"
  );

  return;
}


if (
  language === "en" &&
  includesOne(
    normalized,
    [
      "help",
      "support",
    ]
  )
) {
  navigateAndReply(
    "Opening farmer help.",
    "/farmer/help"
  );

  return;
}


if (
  language === "en" &&
  includesOne(
    normalized,
    [
      "setting",
      "settings",
      "profile",
      "account",
    ]
  )
) {
  navigateAndReply(
    "Opening your account settings.",
    "/farmer/settings"
  );

  return;
}


if (
  language === "en" &&
  includesOne(
    normalized,
    [
      "home",
      "dashboard",
    ]
  )
) {
  navigateAndReply(
    "Opening your farmer home.",
    "/farmer/home"
  );

  return;
}


if (
  language === "hi" &&
  includesOne(
    text,
    [
      "बुक",
      "बुकिंग",
      "स्लॉट",
      "आरक्षित",
    ]
  )
) {
  navigateAndReply(
    "बुकिंग पेज खोल रहा हूँ।",
    "/farmer/book"
  );

  return;
}


if (
  language === "hi" &&
  includesOne(
    text,
    [
      "टोकन",
      "मेरा टोकन",
    ]
  )
) {
  navigateAndReply(
    "आपका टोकन पेज खोल रहा हूँ।",
    "/farmer/token"
  );

  return;
}


if (
  language === "hi" &&
  includesOne(
    text,
    [
      "मदद",
      "सहायता",
      "हेल्प",
    ]
  )
) {
  navigateAndReply(
    "किसान सहायता खोल रहा हूँ।",
    "/farmer/help"
  );

  return;
}


if (
  language === "hi" &&
  includesOne(
    text,
    [
      "सेटिंग",
      "प्रोफाइल",
      "खाता",
    ]
  )
) {
  navigateAndReply(
    "आपकी खाता सेटिंग्स खोल रहा हूँ।",
    "/farmer/settings"
  );

  return;
}


if (
  language === "te" &&
  includesOne(
    text,
    [
      "బుక్",
      "బుకింగ్",
      "స్లాట్",
      "రిజర్వ్",
    ]
  )
) {
  navigateAndReply(
    "బుకింగ్ పేజీని తెరుస్తున్నాను.",
    "/farmer/book"
  );

  return;
}


if (
  language === "te" &&
  includesOne(
    text,
    [
      "టోకెన్",
      "నా టోకెన్",
    ]
  )
) {
  navigateAndReply(
    "మీ టోకెన్ పేజీని తెరుస్తున్నాను.",
    "/farmer/token"
  );

  return;
}


if (
  language === "te" &&
  includesOne(
    text,
    [
      "సహాయం",
      "హెల్ప్",
      "సపోర్ట్",
    ]
  )
) {
  navigateAndReply(
    "రైతు సహాయ పేజీని తెరుస్తున్నాను.",
    "/farmer/help"
  );

  return;
}


askAssistant(text);


}

function startListening() {
const Recognition =
getRecognition();


if (!Recognition) {
  setOpen(true);
  setError(
    config.unsupported
  );
  return;
}

if (listening) {
  stopListening();
  return;
}

setError("");
setTranscript("");
setResponse("");

try {
  if (
    typeof window !== "undefined" &&
    window.speechSynthesis
  ) {
    window.speechSynthesis.cancel();
  }

  const recognition =
    new Recognition();

  recognition.lang =
    config.recognition;

  recognition.continuous =
    false;

  recognition.interimResults =
    true;

  recognition.maxAlternatives =
    1;


  recognition.onstart =
    () => {
      setListening(true);
      setProcessing(false);
      setError("");
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

      const displayed =
        cleanText(
          finalText ||
          interimText
        );

      setTranscript(
        displayed
      );

      if (
        finalText.trim()
      ) {
        setListening(false);
        handleCommand(
          finalText
        );
      }
    };


  recognition.onerror =
    event => {
      setListening(false);
      setProcessing(false);

      if (
        event?.error ===
          "not-allowed" ||
        event?.error ===
          "service-not-allowed"
      ) {
        setError(
          config.permission
        );
      } else if (
        event?.error ===
        "no-speech"
      ) {
        setError(
          config.noSpeech
        );
      } else {
        setError(
          config.error
        );
      }
    };


  recognition.onend =
    () => {
      setListening(false);
    };


  recognitionRef.current =
    recognition;

  recognition.start();

} catch (
  recognitionError
) {
  console.error(
    "Recognition error:",
    recognitionError
  );

  setListening(false);
  setError(
    config.error
  );
}


}

function stopListening() {
try {
recognitionRef.current?.stop();
} catch {
}


setListening(false);


}

function handleSubmit(
event
) {
event.preventDefault();


if (
  processing
) {
  return;
}

const text =
  input.trim();

if (!text) {
  return;
}

handleCommand(text);


}

function useExample(
example
) {
handleCommand(example);
}

const isFarmerPage =
location.pathname.startsWith(
"/farmer"
);

if (!isFarmerPage) {
return null;
}

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
setOpen(true);


      if (listening) {
        stopListening();
      } else {
        startListening();
      }
    }}
    aria-label={
      listening
        ? config.stop
        : config.start
    }
  >
    {listening ? (
      <MicOff size={21} />
    ) : (
      <Mic size={21} />
    )}
  </button>


  {open && (
    <div className="voice-assistant-panel">

      <div className="voice-assistant-panel-header">

        <div className="voice-assistant-heading">

          <div className="voice-assistant-heading-icon">
            <MessageCircle size={19} />
          </div>

          <div>
            <strong>
              {config.title}
            </strong>

            <span>
              {config.subtitle}
            </span>
          </div>

        </div>


        <button
          type="button"
          className="voice-assistant-close"
          onClick={() => {
            stopListening();

            if (
              typeof window !== "undefined" &&
              window.speechSynthesis
            ) {
              window.speechSynthesis.cancel();
            }

            setOpen(false);
          }}
          aria-label={
            config.close
          }
        >
          <X size={18} />
        </button>

      </div>


      <div className="voice-assistant-body">

        <div
          className={
            listening
              ? "voice-assistant-orb listening"
              : processing
                ? "voice-assistant-orb processing"
                : "voice-assistant-orb"
          }
        >
          {processing ? (
            <LoaderCircle
              size={28}
              className="voice-assistant-spin"
            />
          ) : listening ? (
            <MicOff size={28} />
          ) : (
            <Mic size={28} />
          )}
        </div>


        <div className="voice-assistant-state">

          <strong>
            {listening
              ? config.listening
              : processing
                ? config.processing
                : config.ready}
          </strong>

        </div>


        {transcript && (
          <div className="voice-assistant-transcript">

            <span>
              {config.youSaid}
            </span>

            <p>
              "{transcript}"
            </p>

          </div>
        )}


        {response && (
          <div className="voice-assistant-response">

            <div className="voice-assistant-response-icon">
              <MessageCircle size={15} />
            </div>

            <div>
              <span>
                {config.assistant}
              </span>

              <p>
                {response}
              </p>
            </div>

          </div>
        )}


        {error && (
          <div className="voice-assistant-error-card">
            {error}
          </div>
        )}


        <form
          className="voice-assistant-text-form"
          onSubmit={
            handleSubmit
          }
        >

          <input
            type="text"
            value={input}
            onChange={event =>
              setInput(
                event.target.value
              )
            }
            placeholder={
              config.placeholder
            }
            disabled={
              processing
            }
            autoComplete="off"
          />


          <button
            type="submit"
            disabled={
              processing ||
              !input.trim()
            }
            aria-label={
              config.send
            }
          >
            {processing ? (
              <LoaderCircle
                size={17}
                className="voice-assistant-spin"
              />
            ) : (
              <Send size={17} />
            )}
          </button>

        </form>


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

          {listening ? (
            <MicOff size={18} />
          ) : (
            <Mic size={18} />
          )}

          <span>
            {listening
              ? config.stop
              : config.start}
          </span>

        </button>


        <div className="voice-assistant-examples">

          <div className="voice-assistant-examples-heading">
            <span>
              Try saying
            </span>
          </div>


          <div className="voice-assistant-example-list">

            {config.examples.map(
              example => (
                <button
                  key={example}
                  type="button"
                  onClick={() =>
                    useExample(
                      example
                    )
                  }
                >
                  {example}
                </button>
              )
            )}

          </div>

        </div>

      </div>


      <div className="voice-assistant-footer">

        <button
          type="button"
          onClick={() => {
            setVoiceEnabled(
              value => !value
            );

            if (
              voiceEnabled &&
              typeof window !== "undefined" &&
              window.speechSynthesis
            ) {
              window.speechSynthesis.cancel();
            }
          }}
        >

          {voiceEnabled ? (
            <Volume2 size={15} />
          ) : (
            <VolumeX size={15} />
          )}

          <span>
            {voiceEnabled
              ? config.mute
              : config.unmute}
          </span>

        </button>


        <span className="voice-assistant-language">
          {config.recognition}
        </span>

      </div>

    </div>
  )}

</>


);
}

export default VoiceAssistant;
