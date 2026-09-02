import {
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Copy,
  LoaderCircle,
  MessageCircle,
  Mic,
  MicOff,
  RefreshCw,
  RotateCcw,
  Send,
  Sparkles,
  StopCircle,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";

import {
  useCallback,
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

import {
  assistantController,
} from "../assistant/assistantController";

import {
  cleanText,
  formatMessageTime,
  limitHistory,
  readStorageJson,
  removeStorage,
  writeStorageJson,
  getSpeechLanguage,
} from "../assistant/assistantUtils";


/* =========================================================
   CONSTANTS
========================================================= */

const CONVERSATION_STORAGE_KEY =
  "krishisetu_ai_conversation";


const VOICE_STORAGE_KEY =
  "krishisetu_ai_voice_enabled";


const MAX_INPUT_LENGTH =
  1500;


const MAX_STORED_MESSAGES =
  50;


const MAX_CONTEXT_MESSAGES =
  12;


const SCROLL_BOTTOM_THRESHOLD =
  80;


/* =========================================================
   QUICK PROMPTS
========================================================= */

const QUICK_PROMPTS = {

  en: [

    "Where is my payment history?",

    "Show my latest token",

    "Where are my notifications?",

    "What is my booking status?",

  ],

  hi: [

    "मेरी पेमेंट हिस्ट्री कहाँ है?",

    "मेरा लेटेस्ट टोकन दिखाओ",

    "मेरे नोटिफिकेशन कहाँ हैं?",

    "मेरी बुकिंग का स्टेटस क्या है?",

  ],

  te: [

    "నా పేమెంట్ హిస్టరీ ఎక్కడ ఉంది?",

    "నా తాజా టోకెన్ చూపించు",

    "నా నోటిఫికేషన్స్ ఎక్కడ ఉన్నాయి?",

    "నా బుకింగ్ స్టేటస్ ఏమిటి?",

  ],

};


/* =========================================================
   LANGUAGE CONFIG
========================================================= */

const LANGUAGE_CONFIG = {

  en: {

    recognition:
      "en-IN",

    title:
      "KrishiSetu AI",

    subtitle:
      "Your personal KrishiSetu assistant",

    listening:
      "Listening...",

    thinking:
      "Thinking...",

    typeHint:
      "Ask me anything about your KrishiSetu journey.",

    unsupported:
      "Voice input is not supported in this browser.",

    permission:
      "Please allow microphone access and try again.",

    noSpeech:
      "I didn't hear anything. You can try again.",

    microphoneError:
      "I couldn't start the microphone. Please try again.",

    connectionError:
      "I can't reach the assistant service right now. Please try again in a moment.",

    close:
      "Close",

    start:
      "Start listening",

    stop:
      "Stop listening",

    mute:
      "Mute voice",

    unmute:
      "Enable voice",

    you:
      "You",

    assistant:
      "KrishiSetu AI",

    send:
      "Send",

    clear:
      "New conversation",

    copy:
      "Copy",

    copied:
      "Copied",

    retry:
      "Try again",

    stopSpeaking:
      "Stop speaking",

    online:
      "Online",

    offline:
      "Offline",

    suggestions:
      "You can also ask",

    currentPage:
      "Current page",

    emptyTitle:
      "What can I help you with?",

    emptyText:
      "I can help you navigate KrishiSetu, understand bookings, check payments, find tokens, explain the portal, and answer your questions.",

    privacy:
      "Your conversation stays in this browser unless sent to the assistant service.",

    latest:
      "Latest message",

    cancelled:
      "Okay, I cancelled that action.",

    examples:
      QUICK_PROMPTS.en,

  },


  hi: {

    recognition:
      "hi-IN",

    title:
      "कृषि सेतु AI",

    subtitle:
      "आपका व्यक्तिगत कृषि सेतु सहायक",

    listening:
      "सुन रहा हूँ...",

    thinking:
      "सोच रहा हूँ...",

    typeHint:
      "कृषि सेतु के बारे में कुछ भी पूछें।",

    unsupported:
      "इस ब्राउज़र में वॉइस इनपुट उपलब्ध नहीं है।",

    permission:
      "कृपया माइक्रोफ़ोन की अनुमति दें और फिर प्रयास करें।",

    noSpeech:
      "मुझे सुनाई नहीं दिया। फिर से प्रयास करें।",

    microphoneError:
      "माइक्रोफ़ोन शुरू नहीं हो सका। फिर से प्रयास करें।",

    connectionError:
      "अभी सहायक सेवा से कनेक्ट नहीं हो पा रहा है। कृपया थोड़ी देर बाद फिर कोशिश करें।",

    close:
      "बंद करें",

    start:
      "सुनना शुरू करें",

    stop:
      "सुनना बंद करें",

    mute:
      "आवाज़ बंद करें",

    unmute:
      "आवाज़ चालू करें",

    you:
      "आप",

    assistant:
      "कृषि सेतु AI",

    send:
      "भेजें",

    clear:
      "नई बातचीत",

    copy:
      "कॉपी",

    copied:
      "कॉपी हो गया",

    retry:
      "फिर कोशिश करें",

    stopSpeaking:
      "बोलना बंद करें",

    online:
      "ऑनलाइन",

    offline:
      "ऑफ़लाइन",

    suggestions:
      "आप यह भी पूछ सकते हैं",

    currentPage:
      "वर्तमान पेज",

    emptyTitle:
      "मैं आपकी कैसे मदद कर सकता हूँ?",

    emptyText:
      "मैं आपकी बुकिंग, टोकन, भुगतान, नोटिफिकेशन और पूरे कृषि सेतु पोर्टल को समझने और इस्तेमाल करने में मदद कर सकता हूँ।",

    privacy:
      "जब तक बातचीत सहायक सेवा को नहीं भेजी जाती, यह इस ब्राउज़र में रहती है।",

    latest:
      "नवीनतम संदेश",

    cancelled:
      "ठीक है, मैंने वह कार्रवाई रद्द कर दी।",

    examples:
      QUICK_PROMPTS.hi,

  },


  te: {

    recognition:
      "te-IN",

    title:
      "కృషిసేతు AI",

    subtitle:
      "మీ వ్యక్తిగత కృషిసేతు సహాయకుడు",

    listening:
      "వింటున్నాను...",

    thinking:
      "ఆలోచిస్తున్నాను...",

    typeHint:
      "కృషిసేతు గురించి ఏదైనా అడగండి.",

    unsupported:
      "ఈ బ్రౌజర్‌లో వాయిస్ ఇన్‌పుట్ అందుబాటులో లేదు.",

    permission:
      "దయచేసి మైక్రోఫోన్‌కు అనుమతి ఇచ్చి మళ్లీ ప్రయత్నించండి.",

    noSpeech:
      "మీ మాట వినిపించలేదు. మళ్లీ ప్రయత్నించండి.",

    microphoneError:
      "మైక్రోఫోన్‌ను ప్రారంభించలేకపోయాము. మళ్లీ ప్రయత్నించండి.",

    connectionError:
      "ప్రస్తుతం అసిస్టెంట్ సేవకు కనెక్ట్ కాలేకపోతున్నాము. కొద్దిసేపటి తర్వాత మళ్లీ ప్రయత్నించండి.",

    close:
      "మూసివేయండి",

    start:
      "వినడం ప్రారంభించండి",

    stop:
      "వినడం ఆపండి",

    mute:
      "వాయిస్ ఆపండి",

    unmute:
      "వాయిస్ ప్రారంభించండి",

    you:
      "మీరు",

    assistant:
      "కృషిసేతు AI",

    send:
      "పంపండి",

    clear:
      "కొత్త సంభాషణ",

    copy:
      "కాపీ",

    copied:
      "కాపీ అయింది",

    retry:
      "మళ్లీ ప్రయత్నించండి",

    stopSpeaking:
      "వాయిస్ ఆపండి",

    online:
      "ఆన్‌లైన్",

    offline:
      "ఆఫ్‌లైన్",

    suggestions:
      "ఇవి కూడా అడగవచ్చు",

    currentPage:
      "ప్రస్తుత పేజీ",

    emptyTitle:
      "నేను మీకు ఎలా సహాయం చేయగలను?",

    emptyText:
      "మీ బుకింగ్, టోకెన్, చెల్లింపులు, నోటిఫికేషన్లు మరియు మొత్తం కృషిసేతు పోర్టల్‌ను ఉపయోగించడంలో నేను సహాయం చేస్తాను.",

    privacy:
      "అసిస్టెంట్ సేవకు పంపే వరకు ఈ సంభాషణ మీ బ్రౌజర్‌లోనే ఉంటుంది.",

    latest:
      "తాజా సందేశం",

    cancelled:
      "సరే, ఆ చర్యను రద్దు చేశాను.",

    examples:
      QUICK_PROMPTS.te,

  },

};


/* =========================================================
   SPEECH RECOGNITION
========================================================= */

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


/* =========================================================
   MESSAGE FACTORY
========================================================= */

function createMessage(
  role,
  content,
  extras = {}
) {

  return {

    id:
      typeof crypto !==
        "undefined" &&
      typeof crypto.randomUUID ===
        "function"
        ? crypto.randomUUID()
        : `ai-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`,

    role,

    content:
      cleanText(
        content
      ),

    timestamp:
      Date.now(),

    ...extras,

  };

}


/* =========================================================
   COMPONENT
========================================================= */

function VoiceAssistant() {

  const navigate =
    useNavigate();


  const location =
    useLocation();


  const {
    language,
  } =
  useLanguage();


  const config =
    LANGUAGE_CONFIG[
      language
    ] ||
    LANGUAGE_CONFIG.en;


  /* =======================================================
     STATE
  ======================================================= */

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
    speaking,
    setSpeaking,
  ] =
  useState(false);


  const [
    input,
    setInput,
  ] =
  useState("");


  const [
    transcript,
    setTranscript,
  ] =
  useState("");


  const [
    chatHistory,
    setChatHistory,
  ] =
  useState([]);


  const [
    voiceEnabled,
    setVoiceEnabled,
  ] =
  useState(true);


  const [
    error,
    setError,
  ] =
  useState("");


  const [
    isOnline,
    setIsOnline,
  ] =
  useState(
    typeof navigator !==
      "undefined"
      ? navigator.onLine
      : true
  );


  const [
    copiedMessageId,
    setCopiedMessageId,
  ] =
  useState(null);

  const [
    failedMessageId,
    setFailedMessageId,
  ] =
  useState(null);
  
  const [
    voiceIntensity,
    setVoiceIntensity,
  ] =
  useState(0);


  const [
    showScrollToBottom,
    setShowScrollToBottom,
  ] =
  useState(false);


  /* =======================================================
     REFS
  ======================================================= */

  const bodyRef =
    useRef(null);


  const inputRef =
    useRef(null);


  const recognitionRef =
    useRef(null);


  const requestInFlightRef =
    useRef(false);


  const speechTextRef =
    useRef("");


  const audioContextRef =
    useRef(null);


  const analyserRef =
    useRef(null);


  const audioStreamRef =
    useRef(null);


  const audioFrameRef =
    useRef(null);


  const scrollFrameRef =
    useRef(null);


  const navigationTimerRef =
    useRef(null);


  const shouldStickToBottomRef =
    useRef(true);


  /* =======================================================
     OPEN
  ======================================================= */

  const openAssistant =
    useCallback(
      () => {

        setOpen(true);

      },
      []
    );


  /* =======================================================
     STOP SPEECH
  ======================================================= */

  const stopSpeech =
    useCallback(
      () => {

        if (
          typeof window !==
            "undefined" &&
          window.speechSynthesis
        ) {

          window.speechSynthesis.cancel();

        }


        setSpeaking(false);

      },
      []
    );


  /* =======================================================
     STOP VOICE METER
  ======================================================= */

  const stopVoiceMeter =
    useCallback(
      () => {

        if (
          audioFrameRef.current
        ) {

          cancelAnimationFrame(
            audioFrameRef.current
          );

          audioFrameRef.current =
            null;

        }


        if (
          audioStreamRef.current
        ) {

          audioStreamRef.current
            .getTracks()
            .forEach(
              track => {

                try {

                  track.stop();

                } catch {
                }

              }
            );

          audioStreamRef.current =
            null;

        }


        if (
          audioContextRef.current
        ) {

          try {

            audioContextRef.current.close();

          } catch {
          }

          audioContextRef.current =
            null;

        }


        analyserRef.current =
          null;


        setVoiceIntensity(0);

      },
      []
    );


  /* =======================================================
     STOP LISTENING
  ======================================================= */

  const stopListening =
    useCallback(
      () => {

        try {

          recognitionRef.current?.abort();

        } catch {
        }


        recognitionRef.current =
          null;


        speechTextRef.current =
          "";


        stopVoiceMeter();


        setListening(false);

        setTranscript("");

      },
      [
        stopVoiceMeter,
      ]
    );


  /* =======================================================
     CLOSE
  ======================================================= */

  const closeAssistant =
    useCallback(
      () => {

        stopListening();

        stopSpeech();


        setOpen(false);

        setShowScrollToBottom(false);

      },
      [
        stopListening,
        stopSpeech,
      ]
    );


  /* =======================================================
     CLEANUP
  ======================================================= */

  useEffect(
    () => {

      return () => {

        try {

          recognitionRef.current?.abort();

        } catch {
        }


        if (
          typeof window !==
            "undefined" &&
          window.speechSynthesis
        ) {

          window.speechSynthesis.cancel();

        }


        if (
          audioFrameRef.current
        ) {

          cancelAnimationFrame(
            audioFrameRef.current
          );

        }


        if (
          audioStreamRef.current
        ) {

          audioStreamRef.current
            .getTracks()
            .forEach(
              track => {

                try {

                  track.stop();

                } catch {
                }

              }
            );

        }


        if (
          audioContextRef.current
        ) {

          try {

            audioContextRef.current.close();

          } catch {
          }

        }


        if (
          scrollFrameRef.current
        ) {

          cancelAnimationFrame(
            scrollFrameRef.current
          );

        }


        if (
          navigationTimerRef.current
        ) {

          window.clearTimeout(
            navigationTimerRef.current
          );

        }

      };

    },
    []
  );


  /* =======================================================
     LOAD STORAGE
  ======================================================= */

  useEffect(
    () => {

      const saved =
        readStorageJson(
          CONVERSATION_STORAGE_KEY,
          []
        );


      if (
        Array.isArray(saved)
      ) {

        setChatHistory(
          saved
            .filter(
              item =>
                item &&
                (
                  item.role ===
                    "user" ||
                  item.role ===
                    "assistant"
                ) &&
                cleanText(
                  item.content
                )
            )
            .slice(
              -MAX_STORED_MESSAGES
            )
        );

      }


      const storedVoice =
        readStorageJson(
          VOICE_STORAGE_KEY,
          true
        );


      if (
        typeof storedVoice ===
        "boolean"
      ) {

        setVoiceEnabled(
          storedVoice
        );

      }

    },
    []
  );


  /* =======================================================
     SAVE STORAGE
  ======================================================= */

  useEffect(
    () => {

      writeStorageJson(
        CONVERSATION_STORAGE_KEY,
        chatHistory.slice(
          -MAX_STORED_MESSAGES
        )
      );

    },
    [
      chatHistory,
    ]
  );


  /* =======================================================
     ONLINE/OFFLINE
  ======================================================= */

  useEffect(
    () => {

      function handleOnline() {

        setIsOnline(true);

      }


      function handleOffline() {

        setIsOnline(false);

      }


      window.addEventListener(
        "online",
        handleOnline
      );


      window.addEventListener(
        "offline",
        handleOffline
      );


      return () => {

        window.removeEventListener(
          "online",
          handleOnline
        );


        window.removeEventListener(
          "offline",
          handleOffline
        );

      };

    },
    []
  );


  /* =======================================================
     LOCK BACKGROUND
  ======================================================= */

  useEffect(
    () => {

      if (
        !open
      ) {

        return;

      }


      const previousOverflow =
        document.body.style.overflow;


      const previousTouchAction =
        document.body.style.touchAction;


      document.body.style.overflow =
        "hidden";


      document.body.style.touchAction =
        "none";


      return () => {

        document.body.style.overflow =
          previousOverflow;


        document.body.style.touchAction =
          previousTouchAction;

      };

    },
    [
      open,
    ]
  );


  /* =======================================================
     KEYBOARD
  ======================================================= */

  useEffect(
    () => {

      function handleKeyDown(
        event
      ) {

        if (
          event.key ===
          "Escape" &&
          open
        ) {

          event.preventDefault();

          closeAssistant();

          return;

        }


        if (
          event.altKey &&
          event.key.toLowerCase() ===
            "a"
        ) {

          event.preventDefault();

          openAssistant();

        }

      }


      window.addEventListener(
        "keydown",
        handleKeyDown
      );


      return () => {

        window.removeEventListener(
          "keydown",
          handleKeyDown
        );

      };

    },
    [
      closeAssistant,
      open,
      openAssistant,
    ]
  );


  /* =======================================================
     FOCUS
  ======================================================= */

  useEffect(
    () => {

      if (
        !open
      ) {

        return;

      }


      const timer =
        window.setTimeout(
          () => {

            inputRef.current?.focus();

          },
          180
        );


      return () => {

        window.clearTimeout(
          timer
        );

      };

    },
    [
      open,
    ]
  );


  /* =======================================================
     SCROLL
  ======================================================= */

  const scrollToBottom =
    useCallback(
      (
        behavior = "smooth"
      ) => {

        const body =
          bodyRef.current;


        if (
          !body
        ) {

          return;

        }


        if (
          scrollFrameRef.current
        ) {

          cancelAnimationFrame(
            scrollFrameRef.current
          );

        }


        scrollFrameRef.current =
          requestAnimationFrame(
            () => {

              body.scrollTo({

                top:
                  body.scrollHeight,

                behavior,

              });


              shouldStickToBottomRef.current =
                true;


              setShowScrollToBottom(false);


              scrollFrameRef.current =
                null;

            }
          );

      },
      []
    );


  const handleBodyScroll =
    useCallback(
      () => {

        const body =
          bodyRef.current;


        if (
          !body
        ) {

          return;

        }


        const distance =
          body.scrollHeight -
          body.scrollTop -
          body.clientHeight;


        const nearBottom =
          distance <=
          SCROLL_BOTTOM_THRESHOLD;


        shouldStickToBottomRef.current =
          nearBottom;


        setShowScrollToBottom(
          !nearBottom
        );

      },
      []
    );


  useEffect(
    () => {

      if (
        !open ||
        !shouldStickToBottomRef.current
      ) {

        return;

      }


      const timer =
        window.setTimeout(
          () => {

            scrollToBottom(
              "smooth"
            );

          },
          20
        );


      return () => {

        window.clearTimeout(
          timer
        );

      };

    },
    [
      chatHistory,
      processing,
      transcript,
      open,
      scrollToBottom,
    ]
  );


  useEffect(
    () => {

      if (
        !open
      ) {

        return;

      }


      const timerOne =
        window.setTimeout(
          () => {

            scrollToBottom(
              "auto"
            );

          },
          30
        );


      const timerTwo =
        window.setTimeout(
          () => {

            scrollToBottom(
              "auto"
            );

          },
          150
        );


      return () => {

        window.clearTimeout(
          timerOne
        );


        window.clearTimeout(
          timerTwo
        );

      };

    },
    [
      open,
      scrollToBottom,
    ]
  );


  /* =======================================================
     VOICE METER
  ======================================================= */

  const startVoiceMeter =
    useCallback(
      async () => {

        if (
          typeof window ===
            "undefined" ||
          !navigator.mediaDevices?.getUserMedia
        ) {

          return;

        }


        try {

          const stream =
            await navigator.mediaDevices.getUserMedia({
              audio:
                true,
            });


          audioStreamRef.current =
            stream;


          const AudioContext =
            window.AudioContext ||
            window.webkitAudioContext;


          if (
            !AudioContext
          ) {

            return;

          }


          const context =
            new AudioContext();


          const analyser =
            context.createAnalyser();


          analyser.fftSize =
            256;


          analyser.smoothingTimeConstant =
            0.78;


          const source =
            context.createMediaStreamSource(
              stream
            );


          source.connect(
            analyser
          );


          audioContextRef.current =
            context;


          analyserRef.current =
            analyser;


          const data =
            new Uint8Array(
              analyser.frequencyBinCount
            );


          function measure() {

            if (
              !analyserRef.current
            ) {

              return;

            }


            analyser.getByteTimeDomainData(
              data
            );


            let sum =
              0;


            for (
              let index =
                0;
              index <
                data.length;
              index +=
                1
            ) {

              const normalized =
                (
                  data[index] -
                  128
                ) /
                128;


              sum +=
                normalized *
                normalized;

            }


            const rms =
              Math.sqrt(
                sum /
                data.length
              );


            const intensity =
              Math.min(
                1,
                rms * 5.5
              );


            setVoiceIntensity(
              previous =>
                previous *
                  0.72 +
                intensity *
                  0.28
            );


            audioFrameRef.current =
              requestAnimationFrame(
                measure
              );

          }


          measure();

        } catch (
          meterError
        ) {

          console.warn(
            "[KrishiSetu AI] Voice meter unavailable:",
            meterError
          );

        }

      },
      []
    );


  /* =======================================================
     SPEECH OUTPUT
  ======================================================= */

  const speak =
    useCallback(
      text => {

        const clean =
          cleanText(
            text
          );


        if (
          !voiceEnabled ||
          !clean ||
          typeof window ===
            "undefined" ||
          !window.speechSynthesis
        ) {

          return;

        }


        stopSpeech();


        const utterance =
          new SpeechSynthesisUtterance(
            clean
          );


        const speechLanguage =
          getSpeechLanguage(
            language
          );


        utterance.lang =
          speechLanguage;


        utterance.rate =
          language ===
            "te"
            ? 0.9
            : 0.95;


        utterance.pitch =
          1;


        utterance.volume =
          1;


        const prefix =
          speechLanguage
            .split("-")[0]
            .toLowerCase();


        const voices =
          window.speechSynthesis
            .getVoices();


        const selectedVoice =
          voices.find(
            voice =>
              voice.lang
                ?.toLowerCase()
                .startsWith(
                  prefix
                )
          );


        if (
          selectedVoice
        ) {

          utterance.voice =
            selectedVoice;

        }


        utterance.onstart =
          () => {

            setSpeaking(true);

          };


        utterance.onend =
          () => {

            setSpeaking(false);

          };


        utterance.onerror =
          () => {

            setSpeaking(false);

          };


        window.speechSynthesis.speak(
          utterance
        );

      },
      [
        language,
        stopSpeech,
        voiceEnabled,
      ]
    );


  /* =======================================================
     ADD CONVERSATION
  ======================================================= */

  const addConversation =
    useCallback(
      (
        userText,
        assistantText,
        extras = {}
      ) => {

        const messages = [];


        const cleanUser =
          cleanText(
            userText
          );


        const cleanAssistant =
          cleanText(
            assistantText
          );


        if (
          cleanUser
        ) {

          messages.push(
            createMessage(
              "user",
              cleanUser
            )
          );

        }


        if (
          cleanAssistant
        ) {

          messages.push(
            createMessage(
              "assistant",
              cleanAssistant,
              extras
            )
          );

        }


        if (
          messages.length ===
          0
        ) {

          return null;

        }


        setChatHistory(
          history => [
            ...history,
            ...messages,
          ]
        );


        setTranscript("");

        setError("");


        shouldStickToBottomRef.current =
          true;


        return (
          messages.find(
            message =>
              message.role ===
              "assistant"
          ) ||
          null
        );

      },
      []
    );


  /* =======================================================
     PROCESS CONTROLLER RESULT
  ======================================================= */

  const processControllerResult =
    useCallback(
      (
        originalText,
        result
      ) => {

        const decision =
          result?.decision ||
          result?.routeDecision ||
          null;


        const action =
          decision?.action ||
          result?.action ||
          "NONE";


        const reply =
          cleanText(
            result?.reply ||
            decision?.reply ||
            ""
          );


        /*
         * Controller already executed navigation.
         *
         * The UI only displays the result.
         */

        const assistantMessage =
          reply
            ? createMessage(
                "assistant",
                reply,
                {
                  action,
                  failed:
                    result?.status ===
                    "FAILED",
                }
              )
            : null;


        setChatHistory(
          history => {

            const currentLastUser =
              [...history]
                .reverse()
                .find(
                  message =>
                    message.role ===
                    "user"
                );


            /*
             * In the normal flow the user message is added
             * immediately before the controller call.
             *
             * This guard prevents accidental duplicate user
             * messages if the controller returns unusually.
             */

            if (
              currentLastUser?.content ===
                originalText &&
              assistantMessage
            ) {

              return [
                ...history,
                assistantMessage,
              ];

            }


            if (
              assistantMessage
            ) {

              return [
                ...history,

                createMessage(
                  "user",
                  originalText
                ),

                assistantMessage,

              ];

            }


            return history;

          }
        );


        setTranscript("");

        setError("");


        if (
          result?.status ===
            "FAILED" &&
          assistantMessage
        ) {

          setError("");

        }


        if (
          reply
        ) {

          speak(reply);

        }


        return assistantMessage;

      },
      [
        speak,
      ]
    );


  /* =======================================================
     CONTROLLER REQUEST
  ======================================================= */

  const sendToController =
    useCallback(
      async (
        text,
        historySnapshot
      ) => {

        return assistantController.ask(

          text,

          {

            currentPath:
              location.pathname,

            language,

            history:
              limitHistory(
                historySnapshot,
                MAX_CONTEXT_MESSAGES
              ),

            message:
              text,

            navigate,

          }

        );

      },
      [
        language,
        location.pathname,
        navigate,
      ]
    );


  /* =======================================================
     HANDLE COMMAND
  ======================================================= */

  const handleCommand =
    useCallback(
      async (
        message
      ) => {

        const text =
          cleanText(
            message
          );


        if (
          !text ||
          processing ||
          requestInFlightRef.current
        ) {

          return;

        }


        if (
          text.length >
          MAX_INPUT_LENGTH
        ) {

          const reply =
            language ===
              "hi"
              ? "कृपया अपना सवाल थोड़ा छोटा करें।"
              : language ===
                  "te"
                ? "దయచేసి మీ ప్రశ్నను కొంచెం చిన్నదిగా చేయండి."
                : "Please make your question a little shorter.";


          addConversation(
            text,
            reply
          );


          speak(reply);


          return;

        }


        setInput("");

        setTranscript("");

        setError("");


        setFailedMessageId(
          null
        );


        shouldStickToBottomRef.current =
          true;


        setShowScrollToBottom(false);


        stopSpeech();


        requestInFlightRef.current =
          true;


        setProcessing(true);


        /*
         * Snapshot history BEFORE adding the current
         * user message.
         *
         * This prevents stale/duplicated history.
         */

        const historySnapshot =
          chatHistory;


        /*
         * Add exactly ONE user message.
         */

        setChatHistory(
          history => [
            ...history,
            createMessage(
              "user",
              text
            ),
          ]
        );


        try {

          const result =
            await sendToController(
              text,
              historySnapshot
            );


          const reply =
            cleanText(
              result?.reply ||
              result?.decision?.reply ||
              ""
            );


          const action =
            result?.action ||
            result?.decision?.action ||
            "NONE";


          /*
           * Add ONLY the assistant response here.
           *
           * The user message was already added above.
           */

          if (
            reply
          ) {

            const failed =
              result?.status ===
              "FAILED";


            const assistantMessage =
              createMessage(
                "assistant",
                reply,
                {
                  action,
                  failed,
                }
              );


            setChatHistory(
              history => [
                ...history,
                assistantMessage,
              ]
            );


            speak(reply);

          }


          setTranscript("");

          setError("");


          /*
           * Controller handles navigation itself.
           *
           * Therefore this component does NOT call navigate()
           * here.
           */

        } catch (
          controllerError
        ) {

          console.error(
            "[KrishiSetu AI] Controller error:",
            controllerError
          );


          const fallback =
            language ===
              "hi"
              ? config.connectionError
              : language ===
                  "te"
                ? config.connectionError
                : config.connectionError;


          const failedMessage =
            createMessage(
              "assistant",
              fallback,
              {
                failed:
                  true,
              }
            );


          setChatHistory(
            history => [
              ...history,
              failedMessage,
            ]
          );


          setFailedMessageId(
            failedMessage.id
          );


          setError("");


          speak(fallback);

        } finally {

          setProcessing(false);

          requestInFlightRef.current =
            false;

        }

      },
      [
        addConversation,
        chatHistory,
        config.connectionError,
        language,
        processing,
        sendToController,
        speak,
        stopSpeech,
      ]
    );


  /* =======================================================
     SUBMIT
  ======================================================= */

  const handleSubmit =
    useCallback(
      event => {

        event.preventDefault();


        const text =
          cleanText(
            input
          );


        if (
          !text ||
          processing
        ) {

          return;

        }


        handleCommand(text);

      },
      [
        handleCommand,
        input,
        processing,
      ]
    );


  /* =======================================================
     QUICK PROMPT
  ======================================================= */

  const useExample =
    useCallback(
      example => {

        if (
          processing
        ) {

          return;

        }


        handleCommand(example);

      },
      [
        handleCommand,
        processing,
      ]
    );


  /* =======================================================
     RETRY
  ======================================================= */

  const retryMessage =
    useCallback(
      messageId => {

        if (
          processing ||
          requestInFlightRef.current
        ) {

          return;

        }


        const index =
          chatHistory.findIndex(
            message =>
              message.id ===
              messageId
          );


        if (
          index < 0
        ) {

          return;

        }


        let userMessage =
          null;


        for (
          let cursor =
            index - 1;
          cursor >= 0;
          cursor -= 1
        ) {

          if (
            chatHistory[
              cursor
            ]?.role ===
            "user"
          ) {

            userMessage =
              chatHistory[
                cursor
              ];

            break;

          }

        }


        if (
          !userMessage
        ) {

          return;

        }


        /*
         * Remove only the failed assistant message.
         *
         * Keep the original user message visible.
         */

        setChatHistory(
          history =>
            history.filter(
              item =>
                item.id !==
                messageId
            )
        );


        setFailedMessageId(null);

        setError("");

        setShowScrollToBottom(false);


        handleCommand(
          userMessage.content
        );

      },
      [
        chatHistory,
        handleCommand,
        processing,
      ]
    );


  /* =======================================================
     COPY
  ======================================================= */

  const copyMessage =
    useCallback(
      async message => {

        if (
          !message?.content
        ) {

          return;

        }


        try {

          await navigator.clipboard.writeText(
            message.content
          );


          setCopiedMessageId(
            message.id
          );


          window.setTimeout(
            () => {

              setCopiedMessageId(
                current =>
                  current ===
                  message.id
                    ? null
                    : current
              );

            },
            1400
          );

        } catch (
          copyError
        ) {

          console.warn(
            "[KrishiSetu AI] Copy failed:",
            copyError
          );

        }

      },
      []
    );


  /* =======================================================
     CLEAR
  ======================================================= */

  const clearConversation =
    useCallback(
      () => {

        stopSpeech();

        stopListening();


        removeStorage(
          CONVERSATION_STORAGE_KEY
        );


        setChatHistory([]);

        setInput("");

        setTranscript("");

        setError("");

        setCopiedMessageId(null);

        setFailedMessageId(null);


        shouldStickToBottomRef.current =
          true;


        setShowScrollToBottom(false);

      },
      [
        stopListening,
        stopSpeech,
      ]
    );


  /* =======================================================
     VOICE TOGGLE
  ======================================================= */

  const toggleVoice =
    useCallback(
      () => {

        setVoiceEnabled(
          current => {

            const next =
              !current;


            writeStorageJson(
              VOICE_STORAGE_KEY,
              next
            );


            if (
              !next
            ) {

              stopSpeech();

            }


            return next;

          }
        );

      },
      [
        stopSpeech,
      ]
    );


  /* =======================================================
     START LISTENING
  ======================================================= */

  const startListening =
    useCallback(
      () => {

        const Recognition =
          getSpeechRecognition();


        if (
          !Recognition
        ) {

          openAssistant();

          setError(
            config.unsupported
          );

          return;

        }


        if (
          processing
        ) {

          return;

        }


        if (
          listening
        ) {

          stopListening();

          return;

        }


        openAssistant();

        stopSpeech();


        setError("");

        setTranscript("");

        speechTextRef.current =
          "";


        try {

          const recognition =
            new Recognition();


          recognition.lang =
            config.recognition;


          recognition.continuous =
            false;


          recognition.interimResults =
            true;


          recognition.maxAlternatives =
            3;


          recognition.onstart =
            () => {

              setListening(true);

              setError("");


              startVoiceMeter();

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
                index += 1
              ) {

                const result =
                  event.results[
                    index
                  ];


                const spoken =
                  result?.[0]
                    ?.transcript ||
                  "";


                if (
                  result.isFinal
                ) {

                  finalText +=
                    `${spoken} `;

                } else {

                  interimText +=
                    `${spoken} `;

                }

              }


              const visible =
                cleanText(
                  finalText ||
                  interimText
                );


              setTranscript(
                visible
              );


              if (
                finalText.trim()
              ) {

                speechTextRef.current =
                  cleanText(
                    finalText
                  );

              }

            };


          recognition.onerror =
            event => {

              setListening(false);

              recognitionRef.current =
                null;


              stopVoiceMeter();


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

              } else if (
                event?.error !==
                "aborted"
              ) {

                setError(
                  config.microphoneError
                );

              }

            };


          recognition.onend =
            () => {

              setListening(false);

              recognitionRef.current =
                null;


              stopVoiceMeter();


              const spokenText =
                cleanText(
                  speechTextRef.current
                );


              speechTextRef.current =
                "";


              if (
                spokenText
              ) {

                handleCommand(
                  spokenText
                );

              }

            };


          recognitionRef.current =
            recognition;


          recognition.start();

        } catch (
          recognitionError
        ) {

          console.error(
            "[KrishiSetu AI] Speech recognition error:",
            recognitionError
          );


          recognitionRef.current =
            null;


          stopVoiceMeter();


          setListening(false);


          setError(
            config.microphoneError
          );

        }

      },
      [
        config,
        handleCommand,
        listening,
        openAssistant,
        processing,
        startVoiceMeter,
        stopListening,
        stopSpeech,
        stopVoiceMeter,
      ]
    );


  /* =======================================================
     CURRENT PAGE
  ======================================================= */

  const currentPage =
    useMemo(
      () => {

        const pages = {

          "/farmer/home":
            "Farmer Home",

          "/farmer/book":
            "Book Procurement Slot",

          "/farmer/token":
            "Token / Booking Tracking",

          "/farmer/history":
            "Procurement History",

          "/farmer/payments":
            "Payment History",

          "/farmer/settings":
            "Farmer Settings",

          "/farmer/help":
            "Farmer Help",

          "/farmer/login":
            "Farmer Login",

          "/farmer/register":
            "Farmer Registration",

        };


        return (
          pages[
            location.pathname
          ] ||
          location.pathname
        );

      },
      [
        location.pathname,
      ]
    );


  /* =======================================================
     SUGGESTIONS
  ======================================================= */

  const suggestions =
    useMemo(
      () => {

        const lastAssistant =
          [...chatHistory]
            .reverse()
            .find(
              message =>
                message.role ===
                  "assistant" &&
                !message.failed
            );


        if (
          !lastAssistant
        ) {

          return config.examples.slice(
            0,
            2
          );

        }


        const text =
          lastAssistant.content
            .toLowerCase();


        if (
          text.includes("payment") ||
          text.includes("पेमेंट") ||
          text.includes("भुगतान") ||
          text.includes("పేమెంట్") ||
          text.includes("చెల్లింపు")
        ) {

          return language ===
            "hi"
            ? [
                "मेरी पेमेंट हिस्ट्री खोलो",
                "मेरा पेमेंट स्टेटस क्या है?",
              ]
            : language ===
                "te"
              ? [
                  "నా పేమెంట్ హిస్టరీ తెరవండి",
                  "నా పేమెంట్ స్టేటస్ ఏమిటి?",
                ]
              : [
                  "Open my payment history",
                  "What is my payment status?",
                ];

        }


        if (
          text.includes("token") ||
          text.includes("टोकन") ||
          text.includes("టోకెన్")
        ) {

          return language ===
            "hi"
            ? [
                "मेरा टोकन खोलो",
                "मेरी बुकिंग कब है?",
              ]
            : language ===
                "te"
              ? [
                  "నా టోకెన్ తెరవండి",
                  "నా బుకింగ్ ఎప్పుడు ఉంది?",
                ]
              : [
                  "Open my token",
                  "When is my booking?",
                ];

        }


        if (
          text.includes("notification") ||
          text.includes("नोटिफिकेशन") ||
          text.includes("నోటిఫికేషన్")
        ) {

          return language ===
            "hi"
            ? [
                "मेरी बुकिंग का स्टेटस बताओ",
                "मेरी आखिरी नोटिफिकेशन क्या है?",
              ]
            : language ===
                "te"
              ? [
                  "నా బుకింగ్ స్టేటస్ చెప్పండి",
                  "నా చివరి నోటిఫికేషన్ ఏమిటి?",
                ]
              : [
                  "What is my booking status?",
                  "What is my latest notification?",
                ];

        }


        return config.examples.slice(
          0,
          2
        );

      },
      [
        chatHistory,
        config.examples,
        language,
      ]
    );


  /* =======================================================
     FARMER ROUTE CHECK
  ======================================================= */

  const pageIsFarmer =
    location.pathname.startsWith(
      "/farmer"
    );


  if (
    !pageIsFarmer
  ) {

    return null;

  }


  /* =======================================================
     RENDER
  ======================================================= */

  return (

    <>

      {/* =================================================
          FLOATING BUTTON
      ================================================= */}

      <button
        type="button"
        className={`
          voice-assistant-floating
          ${listening ? "listening" : ""}
          ${input.trim() ? "typing" : ""}
          ${open ? "panel-open" : ""}
        `}
        onClick={() => {

          if (
            listening
          ) {

            stopListening();

            return;

          }


          openAssistant();

        }}
        aria-label={
          listening
            ? config.stop
            : config.title
        }
      >

        <span
          className="
            voice-assistant-floating-icon
          "
        >

          {listening ? (

            <Mic
              size={25}
            />

          ) : input.trim() ? (

            <MessageCircle
              size={25}
            />

          ) : (

            <Sparkles
              size={25}
            />

          )}

        </span>


        <span
          className="
            voice-assistant-floating-label
          "
        >

          {listening
            ? config.listening
            : input.trim()
              ? "Ask AI"
              : "Ask KrishiSetu"}

        </span>


        {listening && (

          <span
            className="
              voice-assistant-floating-live-dot
            "
          />

        )}

      </button>


      {/* =================================================
          BACKDROP
      ================================================= */}

      {open && (

        <div
          className="
            voice-assistant-backdrop
          "
          role="presentation"
          onPointerDown={
            event => {

              if (
                event.target ===
                event.currentTarget
              ) {

                closeAssistant();

              }

            }
          }
        >

          {/* =============================================
              PANEL
          ============================================== */}

          <div
            className="
              voice-assistant-panel
            "
            role="dialog"
            aria-modal="true"
            aria-label={
              config.title
            }
            onPointerDown={
              event =>
                event.stopPropagation()
            }
          >

            {/* ===========================================
                HEADER
            ============================================ */}

            <header
              className="
                voice-assistant-panel-header
              "
            >

              <div
                className="
                  voice-assistant-heading
                "
              >

                <div
                  className="
                    voice-assistant-heading-icon
                  "
                >

                  <Sparkles
                    size={20}
                  />

                </div>


                <div>

                  <div
                    className="
                      voice-assistant-title-row
                    "
                  >

                    <strong>

                      {
                        config.title
                      }

                    </strong>


                    <span
                      className={`
                        voice-assistant-status-dot
                        ${
                          isOnline
                            ? "online"
                            : "offline"
                        }
                      `}
                    />

                  </div>


                  <span>

                    {
                      config.subtitle
                    }

                  </span>

                </div>

              </div>


              <div
                className="
                  voice-assistant-header-actions
                "
              >

                <button
                  type="button"
                  className="
                    voice-assistant-reset
                  "
                  onClick={
                    clearConversation
                  }
                  disabled={
                    processing ||
                    chatHistory.length ===
                      0
                  }
                  aria-label={
                    config.clear
                  }
                  title={
                    config.clear
                  }
                >

                  <RotateCcw
                    size={17}
                  />

                </button>


                <button
                  type="button"
                  className="
                    voice-assistant-close
                  "
                  onClick={
                    closeAssistant
                  }
                  aria-label={
                    config.close
                  }
                  title={
                    config.close
                  }
                >

                  <X
                    size={19}
                  />

                </button>

              </div>

            </header>


            {/* ===========================================
                BODY
            ============================================ */}

            <div
              className="
                voice-assistant-body-shell
              "
            >

              <div
                ref={
                  bodyRef
                }
                className="
                  voice-assistant-body
                "
                onScroll={
                  handleBodyScroll
                }
                onWheel={
                  event =>
                    event.stopPropagation()
                }
                onTouchMove={
                  event =>
                    event.stopPropagation()
                }
              >

                {/* CONNECTION */}

                {!isOnline && (

                  <div
                    className="
                      voice-assistant-connectivity
                      offline
                    "
                  >

                    <WifiOff
                      size={14}
                    />

                    <span>

                      {
                        config.offline
                      }

                    </span>

                  </div>

                )}


                {isOnline && (

                  <div
                    className="
                      voice-assistant-connectivity
                    "
                  >

                    <Wifi
                      size={13}
                    />

                    <span>

                      {
                        config.online
                      }

                    </span>

                  </div>

                )}


                {/* EMPTY */}

                {chatHistory.length ===
                  0 && (

                  <div
                    className="
                      voice-assistant-welcome
                    "
                    style={{
                      "--voice-intensity":
                        voiceIntensity,
                    }}
                  >

                    <div
                      className="
                        voice-assistant-welcome-glow
                      "
                    />


                    <div
                      className={`
                        voice-assistant-orb
                        ${
                          listening
                            ? "listening"
                            : ""
                        }
                      `}
                      style={{
                        "--voice-intensity":
                          voiceIntensity,
                      }}
                    >

                      {listening ? (

                        <Mic
                          size={30}
                        />

                      ) : (

                        <Sparkles
                          size={30}
                        />

                      )}

                    </div>


                    <div
                      className="
                        voice-assistant-state
                      "
                    >

                      <strong>

                        {
                          listening
                            ? config.listening
                            : processing
                              ? config.thinking
                              : config.emptyTitle
                        }

                      </strong>


                      <span>

                        {
                          listening
                            ? config.typeHint
                            : config.emptyText
                        }

                      </span>

                    </div>


                    {listening && (

                      <div
                        className="
                          voice-assistant-volume-meter
                        "
                      >

                        {Array.from(
                          {
                            length:
                              18,
                          }
                        ).map(
                          (
                            _,
                            index
                          ) => {

                            const threshold =
                              index /
                              18;


                            const active =
                              voiceIntensity >
                              threshold;


                            return (

                              <span
                                key={
                                  index
                                }
                                className={
                                  active
                                    ? "active"
                                    : ""
                                }
                                style={{
                                  transform:
                                    `scaleY(${
                                      active
                                        ? 0.5 +
                                          voiceIntensity *
                                            0.9
                                        : 0.35
                                    })`,
                                }}
                              />

                            );

                          }
                        )}

                      </div>

                    )}

                  </div>

                )}


                {/* CONVERSATION */}

                {chatHistory.length >
                  0 && (

                  <div
                    className="
                      voice-assistant-conversation
                    "
                  >

                    {chatHistory.map(
                      message => {

                        const isUser =
                          message.role ===
                          "user";


                        const failed =
                          message.failed;


                        return (

                          <article
                            key={
                              message.id
                            }
                            className={`
                              voice-assistant-message
                              ${
                                isUser
                                  ? "user"
                                  : "assistant"
                              }
                              ${
                                failed
                                  ? "failed"
                                  : ""
                              }
                            `}
                          >

                            <div
                              className="
                                voice-assistant-message-meta
                              "
                            >

                              <span
                                className="
                                  voice-assistant-message-label
                                "
                              >

                                {
                                  isUser
                                    ? config.you
                                    : config.assistant
                                }

                              </span>


                              <span
                                className="
                                  voice-assistant-message-time
                                "
                              >

                                <Clock3
                                  size={10}
                                />

                                {
                                  formatMessageTime(
                                    message.timestamp,
                                    language
                                  )
                                }

                              </span>

                            </div>


                            <div
                              className="
                                voice-assistant-message-bubble
                              "
                            >

                              {
                                message.content
                              }

                            </div>


                            {!isUser && (

                              <div
                                className="
                                  voice-assistant-message-tools
                                "
                              >

                                <button
                                  type="button"
                                  onClick={() =>
                                    copyMessage(
                                      message
                                    )
                                  }
                                  title={
                                    copiedMessageId ===
                                    message.id
                                      ? config.copied
                                      : config.copy
                                  }
                                >

                                  {copiedMessageId ===
                                  message.id ? (

                                    <Check
                                      size={12}
                                    />

                                  ) : (

                                    <Copy
                                      size={12}
                                    />

                                  )}


                                  <span>

                                    {
                                      copiedMessageId ===
                                      message.id
                                        ? config.copied
                                        : config.copy
                                    }

                                  </span>

                                </button>


                                {failed && (

                                  <button
                                    type="button"
                                    onClick={() =>
                                      retryMessage(
                                        message.id
                                      )
                                    }
                                    title={
                                      config.retry
                                    }
                                  >

                                    <RefreshCw
                                      size={12}
                                    />

                                    <span>

                                      {
                                        config.retry
                                      }

                                    </span>

                                  </button>

                                )}

                              </div>

                            )}

                          </article>

                        );

                      }
                    )}


                    {processing && (

                      <article
                        className="
                          voice-assistant-message
                          assistant
                        "
                      >

                        <div
                          className="
                            voice-assistant-message-meta
                          "
                        >

                          <span
                            className="
                              voice-assistant-message-label
                            "
                          >

                            {
                              config.assistant
                            }

                          </span>

                        </div>


                        <div
                          className="
                            voice-assistant-message-bubble
                            voice-assistant-thinking
                          "
                        >

                          <span
                            className="
                              voice-assistant-thinking-dots
                            "
                          >

                            <i />
                            <i />
                            <i />

                          </span>


                          <span>

                            {
                              config.thinking
                            }

                          </span>

                        </div>

                      </article>

                    )}

                  </div>

                )}


                {/* LIVE TRANSCRIPT */}

                {transcript && listening && (

                  <div
                    className="
                      voice-assistant-live-transcript
                    "
                  >

                    <div>

                      <Mic
                        size={13}
                      />

                      <span>

                        {
                          config.listening
                        }

                      </span>

                    </div>


                    <p>

                      {
                        transcript
                      }

                    </p>

                  </div>

                )}


                {/* ERROR */}

                {error && (

                  <div
                    className="
                      voice-assistant-error-card
                    "
                  >

                    <span>

                      {
                        error
                      }

                    </span>

                  </div>

                )}


                {/* SUGGESTIONS */}

                {!processing &&
                  suggestions.length >
                    0 && (

                  <div
                    className="
                      voice-assistant-suggestions
                    "
                  >

                    <span
                      className="
                        voice-assistant-suggestions-title
                      "
                    >

                      {
                        config.suggestions
                      }

                    </span>


                    <div>

                      {suggestions.map(
                        suggestion => (

                          <button
                            key={
                              suggestion
                            }
                            type="button"
                            onClick={() =>
                              useExample(
                                suggestion
                              )
                            }
                          >

                            {
                              suggestion
                            }

                          </button>

                        )
                      )}

                    </div>

                  </div>

                )}

              </div>


              {showScrollToBottom && (

                <button
                  type="button"
                  className="
                    voice-assistant-scroll-bottom
                  "
                  onClick={() =>
                    scrollToBottom()
                  }
                  aria-label={
                    config.latest
                  }
                  title={
                    config.latest
                  }
                >

                  <ChevronDown
                    size={18}
                  />

                </button>

              )}

            </div>


            {/* ===========================================
                COMPOSER
            ============================================ */}

            <div
              className="
                voice-assistant-composer
              "
            >

              <form
                className="
                  voice-assistant-text-form
                "
                onSubmit={
                  handleSubmit
                }
              >

                <input
                  ref={
                    inputRef
                  }
                  type="text"
                  value={
                    input
                  }
                  onChange={
                    event =>
                      setInput(
                        event.target.value
                      )
                  }
                  placeholder={
                    config.typeHint
                  }
                  disabled={
                    processing
                  }
                  autoComplete="off"
                  spellCheck="true"
                  maxLength={
                    MAX_INPUT_LENGTH
                  }
                  aria-label={
                    config.typeHint
                  }
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
                      className="
                        voice-assistant-spin
                      "
                    />

                  ) : (

                    <Send
                      size={17}
                    />

                  )}

                </button>

              </form>


              {/* VOICE */}

              <button
                type="button"
                className={`
                  voice-assistant-main-button
                  ${
                    listening
                      ? "stop"
                      : ""
                  }
                `}
                onClick={
                  listening
                    ? stopListening
                    : startListening
                }
                disabled={
                  processing
                }
              >

                {listening ? (

                  <MicOff
                    size={18}
                  />

                ) : (

                  <Mic
                    size={18}
                  />

                )}


                <span>

                  {listening
                    ? config.stop
                    : config.start}

                </span>


                {listening && (

                  <span
                    className="
                      voice-assistant-button-pulse
                    "
                  />

                )}

              </button>


              {/* CONTROLS */}

              <div
                className="
                  voice-assistant-control-row
                "
              >

                <button
                  type="button"
                  onClick={
                    toggleVoice
                  }
                  className="
                    voice-assistant-control-button
                  "
                >

                  {voiceEnabled ? (

                    <Volume2
                      size={14}
                    />

                  ) : (

                    <VolumeX
                      size={14}
                    />

                  )}


                  <span>

                    {voiceEnabled
                      ? config.mute
                      : config.unmute}

                  </span>

                </button>


                {speaking && (

                  <button
                    type="button"
                    onClick={
                      stopSpeech
                    }
                    className="
                      voice-assistant-stop-speaking
                    "
                  >

                    <StopCircle
                      size={14}
                    />

                    <span>

                      {
                        config.stopSpeaking
                      }

                    </span>

                  </button>

                )}


                <span
                  className="
                    voice-assistant-page-indicator
                  "
                >

                  {
                    config.currentPage
                  }

                  {" · "}

                  {
                    currentPage
                  }

                </span>

              </div>


              {/* PRIVACY */}

              <div
                className="
                  voice-assistant-privacy
                "
              >

                <CheckCircle2
                  size={11}
                />

                <span>

                  {
                    config.privacy
                  }

                </span>


                <span
                  className="
                    voice-assistant-shortcut
                  "
                >

                  Alt + A

                </span>

              </div>

            </div>

          </div>

        </div>

      )}

    </>

  );

}


export default VoiceAssistant;