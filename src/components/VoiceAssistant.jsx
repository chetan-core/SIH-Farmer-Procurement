
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


/* =========================================================
   KRISHISETU AI
   =========================================================

   DESIGN PRINCIPLES

   1. Local navigation commands are resolved before the AI.
   2. Information questions never become navigation commands.
   3. Backend actions are treated as secondary suggestions.
   4. Typos and casual speech are tolerated.
   5. "Do it / okay / yes" can confirm a pending action.
   6. Booking parameters can travel to FarmerBook through
      router state.
   7. Direct navigation continues to work even if the backend
      is temporarily unavailable.

========================================================= */


/* =========================================================
   CONFIGURATION
========================================================= */

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";


const ASSISTANT_ENDPOINT =
  `${API_URL}/assistant`;


const STORAGE_KEY =
  "krishisetu_ai_conversation";


const VOICE_STORAGE_KEY =
  "krishisetu_ai_voice_enabled";


const PENDING_ACTION_STORAGE_KEY =
  "krishisetu_ai_pending_action";


const MAX_INPUT_LENGTH =
  1500;


const MAX_HISTORY_MESSAGES =
  12;


const MAX_STORED_MESSAGES =
  50;


const ACTION_DELAY =
  650;


const PENDING_ACTION_TTL =
  5 * 60 * 1000;


const SCROLL_BOTTOM_THRESHOLD =
  80;


/* =========================================================
   ROUTES
========================================================= */

const ACTION_ROUTES = {

  OPEN_HOME:
    "/farmer/home",

  OPEN_BOOKING:
    "/farmer/book",

  OPEN_TOKEN:
    "/farmer/token",

  OPEN_HISTORY:
    "/farmer/history",

  OPEN_PAYMENTS:
    "/farmer/payments",

  OPEN_SETTINGS:
    "/farmer/settings",

  OPEN_HELP:
    "/farmer/help",

  OPEN_NOTIFICATIONS:
    "/farmer/home",

};


/* =========================================================
   SUPPORTED ACTIONS
========================================================= */

const SUPPORTED_ACTIONS = [

  "OPEN_HOME",

  "OPEN_BOOKING",

  "OPEN_TOKEN",

  "OPEN_HISTORY",

  "OPEN_PAYMENTS",

  "OPEN_NOTIFICATIONS",

  "OPEN_SETTINGS",

  "OPEN_HELP",

  "GO_BACK",

  "SHOW_CURRENT_PAGE",

  "NONE",

];


/* =========================================================
   CONFIRMATION WORDS
========================================================= */

const CONFIRMATION_WORDS = [

  "yes",
  "yeah",
  "yep",
  "yup",
  "ok",
  "okay",
  "k",
  "sure",
  "do it",
  "do that",
  "go ahead",
  "continue",
  "continue please",
  "open it",
  "open that",
  "show me",
  "take me there",
  "take me",
  "please do",
  "yes please",
  "go for it",
  "lets go",
  "let's go",

  "हाँ",
  "हां",
  "हां करो",
  "हाँ करो",
  "करो",
  "कर दीजिए",
  "ठीक है",
  "ठीक",
  "खोलो",
  "दिखाओ",
  "आगे बढ़ो",

  "అవును",
  "సరే",
  "చేయండి",
  "తెరవండి",
  "చూపించండి",
  "ముందుకు వెళ్దాం",

];


/* =========================================================
   NEGATIVE WORDS
========================================================= */

const NEGATIVE_WORDS = [

  "no",
  "nope",
  "nah",
  "cancel",
  "cancel it",
  "stop",
  "don't",
  "do not",
  "never mind",
  "forget it",
  "leave it",
  "not now",

  "नहीं",
  "रद्द",
  "रद्द करो",
  "मत करो",
  "छोड़ो",
  "रहने दो",

  "లేదు",
  "వద్దు",
  "ఆపండి",
  "రద్దు",
  "వదిలేయండి",

];


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
   LANGUAGE
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

    ready:
      "Speak or type naturally",

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
      "I’m having trouble reaching the assistant right now.",

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
      "I can help you find things, understand your bookings, check payments, explain the portal, and guide you through KrishiSetu.",

    privacy:
      "Your conversation stays in this browser unless sent to the assistant service.",

    latest:
      "Latest message",

    confirmationExpired:
      "That previous action has expired. Please tell me again what you would like to do.",

    cancelled:
      "Okay, I cancelled that action.",

    currentPagePrefix:
      "You are currently on",

    back:
      "Going back to the previous page.",

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

    ready:
      "स्वाभाविक रूप से बोलें या लिखें",

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
      "अभी सहायक सेवा से कनेक्ट करने में समस्या आ रही है।",

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
      "मैं आपकी बुकिंग, टोकन, भुगतान, नोटिफिकेशन और कृषि सेतु पोर्टल को समझने में मदद कर सकता हूँ।",

    privacy:
      "जब तक बातचीत सहायक सेवा को नहीं भेजी जाती, यह इस ब्राउज़र में रहती है।",

    latest:
      "नवीनतम संदेश",

    confirmationExpired:
      "पिछली कार्रवाई की पुष्टि का समय समाप्त हो गया है। कृपया फिर से बताएं कि आप क्या करना चाहते हैं।",

    cancelled:
      "ठीक है, मैंने वह कार्रवाई रद्द कर दी।",

    currentPagePrefix:
      "आप अभी इस पेज पर हैं",

    back:
      "मैं आपको पिछले पेज पर वापस ले जा रहा हूँ।",

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

    ready:
      "సహజంగా మాట్లాడండి లేదా టైప్ చేయండి",

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
      "ప్రస్తుతం అసిస్టెంట్ సేవకు కనెక్ట్ చేయడంలో సమస్య ఉంది.",

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
      "మీ బుకింగ్, టోకెన్, చెల్లింపులు, నోటిఫికేషన్లు మరియు కృషిసేతు పోర్టల్‌ను అర్థం చేసుకోవడంలో నేను సహాయం చేస్తాను.",

    privacy:
      "అసిస్టెంట్ సేవకు పంపే వరకు ఈ సంభాషణ మీ బ్రౌజర్‌లోనే ఉంటుంది.",

    latest:
      "తాజా సందేశం",

    confirmationExpired:
      "మునుపటి చర్య నిర్ధారణ సమయం ముగిసింది. మీరు ఏమి చేయాలనుకుంటున్నారో మళ్లీ చెప్పండి.",

    cancelled:
      "సరే, ఆ చర్యను రద్దు చేశాను.",

    currentPagePrefix:
      "మీరు ప్రస్తుతం ఈ పేజీలో ఉన్నారు",

    back:
      "మిమ్మల్ని మునుపటి పేజీకి తీసుకెళ్తున్నాను.",

    examples:
      QUICK_PROMPTS.te,

  },

};


/* =========================================================
   BASIC TEXT HELPERS
========================================================= */

function cleanText(
  value
) {

  return String(
    value || ""
  )
    .trim()
    .replace(
      /\s+/g,
      " "
    );

}


function normalizeCommandText(
  value
) {

  return String(
    value || ""
  )
    .toLowerCase()
    .normalize(
      "NFKC"
    )
    .replace(
      /[^\p{L}\p{N}\s]/gu,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();

}


function createId() {

  if (
    typeof crypto !==
      "undefined" &&
    crypto.randomUUID
  ) {

    return crypto.randomUUID();

  }

  return (
    `ai-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`
  );

}


/* =========================================================
   LEVENSHTEIN
========================================================= */

function levenshteinDistance(
  firstValue,
  secondValue
) {

  const first =
    String(
      firstValue || ""
    )
      .toLowerCase();


  const second =
    String(
      secondValue || ""
    )
      .toLowerCase();


  if (
    first ===
    second
  ) {

    return 0;

  }


  if (
    !first
  ) {

    return second.length;

  }


  if (
    !second
  ) {

    return first.length;

  }


  let previous =
    Array.from(
      {
        length:
          second.length + 1,
      },
      (
        _,
        index
      ) =>
        index
    );


  for (
    let i = 1;
    i <= first.length;
    i += 1
  ) {

    const current = [
      i,
    ];


    for (
      let j = 1;
      j <= second.length;
      j += 1
    ) {

      const substitutionCost =
        first[i - 1] ===
        second[j - 1]
          ? 0
          : 1;


      current[j] =
        Math.min(

          current[j - 1] + 1,

          previous[j] + 1,

          previous[j - 1] +
            substitutionCost

        );

    }


    previous =
      current;

  }


  return previous[
    second.length
  ];

}


/* =========================================================
   CONTROLLED FUZZY MATCHING
=========================================================

   IMPORTANT:

   Do not use extremely permissive fuzzy matching for
   ordinary English words such as:

   "show"
   "take"
   "go"
   "status"

   because they can accidentally match unrelated phrases.

========================================================= */

function fuzzyWordMatch(
  word,
  candidates
) {

  const cleanWord =
    normalizeCommandText(
      word
    );


  if (
    !cleanWord
  ) {

    return false;

  }


  return candidates.some(
    candidate => {

      const target =
        normalizeCommandText(
          candidate
        );


      if (
        !target
      ) {

        return false;

      }


      if (
        cleanWord ===
        target
      ) {

        return true;

      }


      /*
       * Short command words need
       * much stricter matching.
       */

      if (
        target.length <= 4
      ) {

        return (
          levenshteinDistance(
            cleanWord,
            target
          ) <= 1
        );

      }


      if (
        target.length <= 7
      ) {

        return (
          levenshteinDistance(
            cleanWord,
            target
          ) <= 2
        );

      }


      return (
        levenshteinDistance(
          cleanWord,
          target
        ) <= 3
      );

    }
  );

}


function fuzzyPhraseMatch(
  text,
  phrases
) {

  const normalized =
    normalizeCommandText(
      text
    );


  if (
    !normalized
  ) {

    return false;

  }


  /*
   * Exact phrase occurrence.
   */

  for (
    const phrase of phrases
  ) {

    const target =
      normalizeCommandText(
        phrase
      );


    if (
      !target
    ) {

      continue;

    }


    if (
      normalized.includes(
        target
      )
    ) {

      return true;

    }

  }


  const words =
    normalized.split(
      " "
    );


  /*
   * Word-level typo detection.
   */

  for (
    const phrase of phrases
  ) {

    const target =
      normalizeCommandText(
        phrase
      );


    if (
      !target
    ) {

      continue;

    }


    const targetWords =
      target.split(
        " "
      );


    if (
      targetWords.length >
      1
    ) {

      for (
        let index = 0;
        index <=
          words.length -
            targetWords.length;
        index += 1
      ) {

        const candidate =
          words
            .slice(
              index,
              index +
                targetWords.length
            )
            .join(
              " "
            );


        const distance =
          levenshteinDistance(
            candidate,
            target
          );


        const threshold =
          target.length <= 8
            ? 1
            : 2;


        if (
          distance <=
          threshold
        ) {

          return true;

        }

      }

      continue;

    }


    if (
      fuzzyWordMatch(
        target,
        words
      )
    ) {

      return true;

    }

  }


  return false;

}


/* =========================================================
   RECOGNITION
========================================================= */

function getRecognition() {

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
   LANGUAGE PREFIX
========================================================= */

function getLanguagePrefix(
  language
) {

  if (
    language ===
    "hi"
  ) {

    return "hi";

  }


  if (
    language ===
    "te"
  ) {

    return "te";

  }


  return "en";

}


/* =========================================================
   FARMER STORAGE
========================================================= */

function getStoredFarmer() {

  const empty = {

    farmerId:
      "",

    phone:
      "",

  };


  if (
    typeof window ===
    "undefined"
  ) {

    return empty;

  }


  const objectKeys = [

    "farmer",

    "farmerData",

    "loggedInFarmer",

    "currentFarmer",

    "krishisetuFarmer",

    "krishisetu_farmer",

    "farmerUser",

  ];


  for (
    const key of objectKeys
  ) {

    try {

      const raw =
        localStorage.getItem(
          key
        );


      if (
        !raw
      ) {

        continue;

      }


      const parsed =
        JSON.parse(
          raw
        );


      if (
        !parsed ||
        typeof parsed !==
          "object"
      ) {

        continue;

      }


      const farmerId =
        parsed.id ??
        parsed.farmerId ??
        parsed.farmer_id ??
        "";


      const phone =
        parsed.phone ??
        parsed.mobile ??
        parsed.mobileNumber ??
        parsed.farmerPhone ??
        "";


      if (
        farmerId ||
        phone
      ) {

        return {

          farmerId:
            String(
              farmerId
            ),

          phone:
            String(
              phone
            ),

        };

      }

    } catch {
    }

  }


  const farmerIdKeys = [

    "farmerId",
    "farmer_id",
    "currentFarmerId",

  ];


  const phoneKeys = [

    "farmerPhone",
    "farmer_phone",
    "phone",

  ];


  let farmerId =
    "";


  let phone =
    "";


  for (
    const key of farmerIdKeys
  ) {

    const value =
      localStorage.getItem(
        key
      );


    if (
      value
    ) {

      farmerId =
        value;

      break;

    }

  }


  for (
    const key of phoneKeys
  ) {

    const value =
      localStorage.getItem(
        key
      );


    if (
      value
    ) {

      phone =
        value;

      break;

    }

  }


  return {

    farmerId:
      String(
        farmerId ||
        ""
      ),

    phone:
      String(
        phone ||
        ""
      ),

  };

}


/* =========================================================
   TIME
========================================================= */

function formatMessageTime(
  timestamp,
  language
) {

  if (
    !timestamp
  ) {

    return "";

  }


  const date =
    new Date(
      timestamp
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "";

  }


  const locale =
    language ===
      "hi"
      ? "hi-IN"
      : language ===
        "te"
        ? "te-IN"
        : "en-IN";


  return date.toLocaleTimeString(
    locale,
    {
      hour:
        "numeric",

      minute:
        "2-digit",
    }
  );

}


/* =========================================================
   PAGE NAME
========================================================= */

function getPageName(
  pathname
) {

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
      pathname
    ] ||
    pathname
  );

}


/* =========================================================
   INFORMATION QUESTION DETECTION
========================================================= */

function isInformationQuestion(
  message
) {

  const text =
    normalizeCommandText(
      message
    );


  if (
    !text
  ) {

    return false;

  }


  const questionPhrases = [

    "what is",
    "what are",
    "what's",
    "whats",
    "when is",
    "when will",
    "where is",
    "where are",
    "where was",
    "how much",
    "how many",
    "how do",
    "how does",
    "how can",
    "why",
    "who",
    "tell me",
    "can you tell me",

    "क्या है",
    "क्या हैं",
    "कब है",
    "कब होगा",
    "कहाँ है",
    "कहाँ हैं",
    "कितना",
    "कितने",
    "कैसे",
    "क्यों",
    "बताओ",
    "बताइए",

    "ఏమిటి",
    "ఎప్పుడు",
    "ఎంత",
    "ఎందుకు",
    "ఎలా",
    "చెప్పండి",
    "చెప్పు",

  ];


  if (
    fuzzyPhraseMatch(
      text,
      questionPhrases
    )
  ) {

    return true;

  }


  /*
   * Explicit question mark is useful for
   * English/Hindi/Telugu typed questions.
   */

  if (
    /[?؟]$/.test(
      String(
        message || ""
      ).trim()
    )
  ) {

    return true;

  }


  /*
   * Status questions are questions unless
   * the user explicitly says to open the page.
   */

  if (
    fuzzyPhraseMatch(
      text,
      [
        "payment status",
        "booking status",
        "token status",
        "what is my payment status",
        "what is my booking status",
        "what is my token status",

        "मेरी भुगतान स्थिति",
        "मेरी बुकिंग स्थिति",

        "నా చెల్లింపు స్థితి",
        "నా బుకింగ్ స్థితి",
      ]
    )
  ) {

    return true;

  }


  return false;

}


/* =========================================================
   EXPLICIT NAVIGATION INTENT
========================================================= */

function isExplicitNavigationRequest(
  message
) {

  const text =
    normalizeCommandText(
      message
    );


  if (
    !text
  ) {

    return false;

  }


  /*
   * Very explicit phrases.
   */

  const explicitPhrases = [

    "open",
    "open page",
    "open it",
    "show me the page",
    "take me to",
    "take me there",
    "bring me to",
    "go to",
    "visit",
    "navigate to",
    "send me to",
    "lead me to",
    "put me on",

    "खोलो",
    "खोलें",
    "पेज खोलो",
    "वहाँ ले चलो",
    "वहां ले चलो",
    "ले चलो",
    "जाओ",
    "दिखाओ",

    "తెరవండి",
    "పేజీని తెరవండి",
    "తీసుకెళ్లండి",
    "తీసుకుపో",
    "వెళ్ళండి",
    "చూపించండి",

  ];


  return fuzzyPhraseMatch(
    text,
    explicitPhrases
  );

}


/* =========================================================
   ACTION INTENT WORDS
========================================================= */

function hasNavigationVerb(
  message
) {

  return isExplicitNavigationRequest(
    message
  );

}


/* =========================================================
   LOCAL ACTION DETECTION
========================================================= */

function detectLocalAction(
  message
) {

  const text =
    normalizeCommandText(
      message
    );


  if (
    !text
  ) {

    return "NONE";

  }


  /*
   * -------------------------------------------------------
   * BACK
   * -------------------------------------------------------
   */

  if (
    fuzzyPhraseMatch(
      text,
      [

        "go back",
        "take me back",
        "previous page",
        "go to previous page",
        "back to previous page",
        "return to previous page",
        "previous screen",
        "last page",

        "वापस जाओ",
        "पिछले पेज पर",
        "पिछले पेज पर वापस",
        "वापस ले चलो",

        "వెనక్కి వెళ్ళు",
        "మునుపటి పేజీకి",
        "వెనక్కి తీసుకెళ్లండి",

      ]
    )
  ) {

    return "GO_BACK";

  }


  /*
   * -------------------------------------------------------
   * CURRENT PAGE
   * -------------------------------------------------------
   */

  if (
    fuzzyPhraseMatch(
      text,
      [

        "where are we now",
        "where am i",
        "where am i now",
        "what page is this",
        "which page is this",
        "what page are we on",
        "which page are we on",
        "where are we",
        "current page",
        "what is the current page",

        "मैं अभी कहाँ हूँ",
        "मैं किस पेज पर हूँ",
        "यह कौन सा पेज है",
        "अभी कौन सा पेज है",

        "నేను ఇప్పుడు ఎక్కడ ఉన్నాను",
        "ఇది ఏ పేజీ",
        "మనం ఏ పేజీలో ఉన్నాం",

      ]
    )
  ) {

    return "SHOW_CURRENT_PAGE";

  }


  /*
   * -------------------------------------------------------
   * IMPORTANT RULE
   *
   * Normal questions should not navigate.
   * -------------------------------------------------------
   */

  if (
    isInformationQuestion(
      text
    )
  ) {

    return "NONE";

  }


  const navigation =
    hasNavigationVerb(
      text
    );


  /*
   * -------------------------------------------------------
   * HELP
   * -------------------------------------------------------
   */

  const helpMatch =
    fuzzyPhraseMatch(
      text,
      [

        "help",
        "helpp",
        "heeelp",
        "heeeelp",
        "hepl",
        "hlp",
        "helo",
        "help page",
        "faq",
        "faqs",
        "support",
        "assistance",

        "हेल्प",
        "सहायता",
        "मदद",
        "सहायता पेज",
        "एफएक्यू",

        "హెల్ప్",
        "సహాయం",
        "faq",

      ]
    );


  if (
    helpMatch &&
    (
      navigation ||
      text.length <= 35
    )
  ) {

    return "OPEN_HELP";

  }


  /*
   * -------------------------------------------------------
   * PAYMENTS
   * -------------------------------------------------------
   */

  const paymentMatch =
    fuzzyPhraseMatch(
      text,
      [

        "payment",
        "payments",
        "paymant",
        "paymet",
        "paymnt",
        "payment history",
        "payment page",
        "payments page",

        "पेमेंट",
        "भुगतान",
        "पेमेन्ट",
        "भुगतान पेज",

        "చెల్లింపు",
        "పేమెంట్",
        "చెల్లింపు పేజీ",

      ]
    );


  if (
    paymentMatch &&
    (
      navigation ||
      fuzzyPhraseMatch(
        text,
        [
          "payment page",
          "payments page",
          "open payments",
          "open payment history",
          "show payment history",
          "show payments",

          "मेरी पेमेंट हिस्ट्री खोलो",
          "मेरी भुगतान हिस्ट्री खोलो",

          "నా పేమెంట్ హిస్టరీ తెరవండి",
        ]
      )
    )
  ) {

    return "OPEN_PAYMENTS";

  }


  /*
   * -------------------------------------------------------
   * HISTORY
   * -------------------------------------------------------
   */

  const historyMatch =
    fuzzyPhraseMatch(
      text,
      [

        "history",
        "histroy",
        "histry",
        "histoty",
        "hisotry",
        "procurement history",
        "booking history",
        "purchase history",
        "history page",

        "इतिहास",
        "हिस्ट्री",
        "खरीद इतिहास",
        "इतिहास पेज",

        "చరిత్ర",
        "హిస్టరీ",
        "కొనుగోలు చరిత్ర",

      ]
    );


  if (
    historyMatch &&
    (
      navigation ||
      fuzzyPhraseMatch(
        text,
        [
          "my history",
          "show my history",
          "open my history",
          "open history",
          "history page",

          "मेरी हिस्ट्री खोलो",
          "खरीद इतिहास खोलो",

          "నా హిస్టరీ తెరవండి",
          "కొనుగోలు చరిత్ర తెరవండి",
        ]
      )
    )
  ) {

    return "OPEN_HISTORY";

  }


  /*
   * -------------------------------------------------------
   * TOKEN
   * -------------------------------------------------------
   */

  const tokenMatch =
    fuzzyPhraseMatch(
      text,
      [

        "token",
        "tokken",
        "tokan",
        "tocken",
        "tokenn",
        "token page",
        "latest token",
        "my token",

        "टोकन",
        "मेरा टोकन",
        "टोकन पेज",

        "టోకెన్",
        "నా టోకెన్",
        "టోకెన్ పేజీ",

      ]
    );


  if (
    tokenMatch &&
    (
      navigation ||
      fuzzyPhraseMatch(
        text,
        [
          "open my token",
          "show my token",
          "show latest token",
          "latest token",
          "token page",

          "मेरा टोकन दिखाओ",
          "मेरा टोकन खोलो",

          "నా టోకెన్ చూపించు",
          "నా టోకెన్ తెరవండి",
        ]
      )
    )
  ) {

    return "OPEN_TOKEN";

  }


  /*
   * -------------------------------------------------------
   * SETTINGS
   * -------------------------------------------------------
   */

  const settingsMatch =
    fuzzyPhraseMatch(
      text,
      [

        "settings",
        "setting",
        "seting",
        "settng",
        "preferences",
        "account settings",
        "profile settings",
        "settings page",

        "सेटिंग",
        "सेटिंग्स",
        "प्रेफरेंस",

        "సెట్టింగ్",
        "సెట్టింగ్స్",

      ]
    );


  if (
    settingsMatch &&
    (
      navigation ||
      text.length <= 30
    )
  ) {

    return "OPEN_SETTINGS";

  }


  /*
   * -------------------------------------------------------
   * NOTIFICATIONS
   * -------------------------------------------------------
   */

  const notificationMatch =
    fuzzyPhraseMatch(
      text,
      [

        "notification",
        "notifications",
        "notificaton",
        "notifictions",
        "notif",
        "alerts",
        "notification page",
        "updates",

        "नोटिफिकेशन",
        "सूचनाएं",
        "अलर्ट",

        "నోటిఫికేషన్",
        "సూచనలు",
        "అప్‌డేట్",

      ]
    );


  if (
    notificationMatch &&
    (
      navigation ||
      fuzzyPhraseMatch(
        text,
        [
          "my notifications",
          "show notifications",
          "open notifications",
          "notification page",

          "मेरे नोटिफिकेशन",
          "नोटिफिकेशन खोलो",

          "నా నోటిఫికేషన్స్",
          "నోటిఫికేషన్స్ తెరవండి",
        ]
      )
    )
  ) {

    return "OPEN_NOTIFICATIONS";

  }


  /*
   * -------------------------------------------------------
   * HOME
   * -------------------------------------------------------
   */

  const homeMatch =
    fuzzyPhraseMatch(
      text,
      [

        "home",
        "homepage",
        "home page",
        "dashboard",
        "dashbord",
        "dashboad",
        "farmer home",
        "main page",

        "मुख्य पेज",
        "होम",
        "डैशबोर्ड",

        "హోమ్",
        "డ్యాష్‌బోర్డ్",

      ]
    );


  if (
    homeMatch &&
    (
      navigation ||
      text === "home" ||
      text === "homepage" ||
      text === "dashboard" ||
      text === "farmer home"
    )
  ) {

    return "OPEN_HOME";

  }


  /*
   * -------------------------------------------------------
   * BOOKING
   * -------------------------------------------------------
   */

  const bookingMatch =
    fuzzyPhraseMatch(
      text,
      [

        "booking",
        "bookings",
        "book",
        "bok",
        "boook",
        "bokking",
        "booking page",
        "book page",
        "book slot",
        "book a slot",
        "procurement booking",
        "procurement slot",
        "slot",

        "बुकिंग",
        "बुक",
        "बुकिंग पेज",
        "स्लॉट",

        "బుకింగ్",
        "బుక్",
        "బుకింగ్ పేజీ",
        "స్లాట్",

      ]
    );


  /*
   * Booking is intentionally a little
   * more tolerant because users naturally
   * say:
   *
   * "book 300 kg wheat"
   * "book page can you take me"
   * "I want to book"
   */

  if (
    bookingMatch &&
    (
      navigation ||
      fuzzyPhraseMatch(
        text,
        [
          "book",
          "book page",
          "booking page",
          "book slot",
          "book a slot",
          "procurement slot",
          "I want to book",
          "need to book",
          "want to book",

          "बुक",
          "बुकिंग",
          "बुकिंग पेज",
          "बुक करना है",

          "బుక్",
          "బుకింగ్",
          "బుకింగ్ పేజీ",
          "బుక్ చేయాలి",
        ]
      )
    )
  ) {

    return "OPEN_BOOKING";

  }


  return "NONE";

}


/* =========================================================
   BOOKING EXTRACTION
========================================================= */

function extractBookingDetails(
  message
) {

  const text =
    normalizeCommandText(
      message
    );


  const quantityMatch =
    text.match(
      /(\d+(?:\.\d+)?)\s*(kg|kgs|kilo|kilos|kilogram|kilograms|కిలో|కిలోలు|किलो)/
    );


  let quantity =
    null;


  if (
    quantityMatch
  ) {

    quantity =
      Number(
        quantityMatch[1]
      );

  }


  const aliases = {

    wheat: [

      "wheat",
      "गेहूं",
      "गहूं",
      "gehu",
      "गहू",
      "గోధుమ",

    ],

    paddy: [

      "paddy",
      "rice",
      "धान",
      "चावल",
      "dhan",
      "వరి",
      "బియ్యం",

    ],

    maize: [

      "maize",
      "corn",
      "मक्का",
      "maka",
      "మొక్కజొన్న",

    ],

    cotton: [

      "cotton",
      "कपास",
      "kapas",
      "పత్తి",

    ],

  };


  let crop =
    null;


  for (
    const [
      cropId,
      cropAliases,
    ]
    of Object.entries(
      aliases
    )
  ) {

    if (
      fuzzyPhraseMatch(
        text,
        cropAliases
      )
    ) {

      crop =
        cropId;

      break;

    }

  }


  if (
    !quantity &&
    !crop
  ) {

    return null;

  }


  return {

    crop,

    quantity,

  };

}


/* =========================================================
   ACTION REPLIES
========================================================= */

function getActionReply(
  action,
  language
) {

  const replies = {

    en: {

      OPEN_HOME:
        "Opening your farmer dashboard.",

      OPEN_BOOKING:
        "Opening the procurement booking page.",

      OPEN_TOKEN:
        "Opening your token and booking details.",

      OPEN_HISTORY:
        "Opening your procurement history.",

      OPEN_PAYMENTS:
        "Opening your payment history.",

      OPEN_NOTIFICATIONS:
        "Opening your notifications.",

      OPEN_SETTINGS:
        "Opening your account settings.",

      OPEN_HELP:
        "Opening Help & FAQ for you.",

      GO_BACK:
        "Going back to the previous page.",

    },


    hi: {

      OPEN_HOME:
        "मैं आपका किसान डैशबोर्ड खोल रहा हूँ।",

      OPEN_BOOKING:
        "मैं खरीद स्लॉट बुकिंग पेज खोल रहा हूँ।",

      OPEN_TOKEN:
        "मैं आपका टोकन और बुकिंग विवरण खोल रहा हूँ।",

      OPEN_HISTORY:
        "मैं आपकी खरीद हिस्ट्री खोल रहा हूँ।",

      OPEN_PAYMENTS:
        "मैं आपकी भुगतान हिस्ट्री खोल रहा हूँ।",

      OPEN_NOTIFICATIONS:
        "मैं आपके नोटिफिकेशन खोल रहा हूँ।",

      OPEN_SETTINGS:
        "मैं आपकी अकाउंट सेटिंग्स खोल रहा हूँ।",

      OPEN_HELP:
        "मैं आपके लिए सहायता और FAQ खोल रहा हूँ।",

      GO_BACK:
        "मैं आपको पिछले पेज पर वापस ले जा रहा हूँ।",

    },


    te: {

      OPEN_HOME:
        "మీ రైతు డ్యాష్‌బోర్డ్‌ను తెరుస్తున్నాను.",

      OPEN_BOOKING:
        "కొనుగోలు బుకింగ్ పేజీని తెరుస్తున్నాను.",

      OPEN_TOKEN:
        "మీ టోకెన్ మరియు బుకింగ్ వివరాలను తెరుస్తున్నాను.",

      OPEN_HISTORY:
        "మీ కొనుగోలు చరిత్రను తెరుస్తున్నాను.",

      OPEN_PAYMENTS:
        "మీ చెల్లింపు చరిత్రను తెరుస్తున్నాను.",

      OPEN_NOTIFICATIONS:
        "మీ నోటిఫికేషన్‌లను తెరుస్తున్నాను.",

      OPEN_SETTINGS:
        "మీ అకౌంట్ సెట్టింగ్స్‌ను తెరుస్తున్నాను.",

      OPEN_HELP:
        "మీ కోసం సహాయం మరియు FAQ తెరుస్తున్నాను.",

      GO_BACK:
        "మిమ్మల్ని మునుపటి పేజీకి తీసుకెళ్తున్నాను.",

    },

  };


  return (
    replies[
      language
    ]?.[
      action
    ] ||
    null
  );

}


/* =========================================================
   BOOKING INTENT REPLY
========================================================= */

function getBookingIntentReply(
  bookingData,
  language
) {

  const crop =
    bookingData?.crop;


  const quantity =
    bookingData?.quantity;


  const cropLabel =
    crop ===
      "wheat"
      ? language ===
        "hi"
        ? "गेहूं"
        : language ===
          "te"
          ? "గోధుమ"
          : "wheat"
      : crop ===
          "paddy"
        ? language ===
          "hi"
          ? "धान"
          : language ===
            "te"
            ? "వరి"
            : "paddy"
        : crop ===
            "maize"
          ? language ===
            "hi"
            ? "मक्का"
            : language ===
              "te"
              ? "మొక్కజొన్న"
              : "maize"
          : crop ===
              "cotton"
            ? language ===
              "hi"
              ? "कपास"
              : language ===
                "te"
                ? "పత్తి"
                : "cotton"
            : null;


  if (
    language ===
    "hi"
  ) {

    if (
      cropLabel &&
      quantity
    ) {

      return `मैं ${cropLabel} की ${quantity} kg बुकिंग शुरू कर सकता हूँ। आगे बढ़ने के लिए "हाँ" या "करो" कहें।`;

    }


    if (
      cropLabel
    ) {

      return `मैं ${cropLabel} की बुकिंग शुरू कर सकता हूँ। आगे बढ़ने के लिए "हाँ" कहें।`;

    }


    if (
      quantity
    ) {

      return `मैं ${quantity} kg की बुकिंग शुरू कर सकता हूँ। आगे बढ़ने के लिए "हाँ" कहें।`;

    }

  }


  if (
    language ===
    "te"
  ) {

    if (
      cropLabel &&
      quantity
    ) {

      return `${cropLabel} ${quantity} kg బుకింగ్‌ను ప్రారంభించగలను. కొనసాగించడానికి "అవును" లేదా "చేయండి" అని చెప్పండి.`;

    }


    if (
      cropLabel
    ) {

      return `${cropLabel} బుకింగ్‌ను ప్రారంభించగలను. కొనసాగించడానికి "అవును" అని చెప్పండి.`;

    }


    if (
      quantity
    ) {

      return `${quantity} kg బుకింగ్‌ను ప్రారంభించగలను. కొనసాగించడానికి "అవును" అని చెప్పండి.`;

    }

  }


  if (
    cropLabel &&
    quantity
  ) {

    return `I can start a booking for ${quantity} kg of ${cropLabel}. Say "yes" or "do it" and I'll open the booking page with those details.`;

  }


  if (
    cropLabel
  ) {

    return `I can start a ${cropLabel} booking. Say "yes" and I'll open the booking page.`;

  }


  return `I can start a ${quantity} kg booking. Say "yes" and I'll open the booking page.`;

}


/* =========================================================
   PENDING ACTION
========================================================= */

function loadPendingAction() {

  try {

    const raw =
      localStorage.getItem(
        PENDING_ACTION_STORAGE_KEY
      );


    if (
      !raw
    ) {

      return null;

    }


    const parsed =
      JSON.parse(
        raw
      );


    if (
      !parsed ||
      typeof parsed !==
        "object"
    ) {

      return null;

    }


    const createdAt =
      Number(
        parsed.createdAt ||
        0
      );


    if (
      createdAt &&
      Date.now() -
        createdAt >
        PENDING_ACTION_TTL
    ) {

      localStorage.removeItem(
        PENDING_ACTION_STORAGE_KEY
      );


      return null;

    }


    return parsed;

  } catch {

    return null;

  }

}


function savePendingAction(
  action
) {

  try {

    if (
      !action
    ) {

      localStorage.removeItem(
        PENDING_ACTION_STORAGE_KEY
      );


      return;

    }


    localStorage.setItem(
      PENDING_ACTION_STORAGE_KEY,
      JSON.stringify(
        action
      )
    );

  } catch {
  }

}


function clearPendingAction() {

  try {

    localStorage.removeItem(
      PENDING_ACTION_STORAGE_KEY
    );

  } catch {
  }

}


/* =========================================================
   CONFIRMATION
========================================================= */

function isConfirmation(
  message
) {

  const text =
    normalizeCommandText(
      message
    );


  if (
    !text
  ) {

    return false;

  }


  /*
   * Keep confirmation conservative.
   *
   * "yes" / "okay" / "do it"
   * should confirm.
   *
   * A normal question should not.
   */

  if (
    isInformationQuestion(
      text
    )
  ) {

    return false;

  }


  return fuzzyPhraseMatch(
    text,
    CONFIRMATION_WORDS
  );

}


function isNegative(
  message
) {

  return fuzzyPhraseMatch(
    message,
    NEGATIVE_WORDS
  );

}


/* =========================================================
   FRIENDLY FALLBACK
========================================================= */

function getFriendlyFallback(
  language
) {

  if (
    language ===
    "hi"
  ) {

    return "मैं आपकी मदद करने के लिए यहाँ हूँ। आप बुकिंग, टोकन, भुगतान, हिस्ट्री, नोटिफिकेशन या कृषि सेतु की किसी भी सुविधा के बारे में पूछ सकते हैं।";

  }


  if (
    language ===
    "te"
  ) {

    return "నేను మీకు సహాయం చేయడానికి ఇక్కడ ఉన్నాను. బుకింగ్, టోకెన్, చెల్లింపులు, హిస్టరీ, నోటిఫికేషన్లు లేదా కృషిసేతు గురించి ఏదైనా అడగండి.";

  }


  return "I’m here to help. You can ask me about bookings, tokens, payments, history, notifications, or anything else in KrishiSetu.";

}


/* =========================================================
   CONNECTION FALLBACK
========================================================= */

function getConnectionFallback(
  language
) {

  if (
    language ===
    "hi"
  ) {

    return "मैं आपकी बात समझ रहा हूँ, लेकिन अभी AI सेवा तक पहुँच नहीं पा रही है। आप फिर से कोशिश कर सकते हैं।";

  }


  if (
    language ===
    "te"
  ) {

    return "నేను మీ ప్రశ్నను అర్థం చేసుకున్నాను, కానీ ప్రస్తుతం AI సేవను చేరుకోలేకపోతున్నాను. మీరు మళ్లీ ప్రయత్నించవచ్చు.";

  }


  return "I understand what you’re asking, but I can’t reach the AI service right now. You can try again.";

}


/* =========================================================
   SUGGESTIONS
========================================================= */

function getSuggestions(
  language,
  message
) {

  const text =
    normalizeCommandText(
      message
    );


  if (
    fuzzyPhraseMatch(
      text,
      [
        "payment",
        "payments",
        "payment history",
        "payment status",
        "पेमेंट",
        "भुगतान",
        "చెల్లింపు",
        "పేమెంట్",
      ]
    )
  ) {

    if (
      language ===
      "hi"
    ) {

      return [

        "मेरी पेमेंट हिस्ट्री खोलो",

        "मेरा पेमेंट स्टेटस क्या है?",

      ];

    }


    if (
      language ===
      "te"
    ) {

      return [

        "నా పేమెంట్ హిస్టరీ తెరవండి",

        "నా పేమెంట్ స్టేటస్ ఏమిటి?",

      ];

    }


    return [

      "Open my payment history",

      "What is my payment status?",

    ];

  }


  if (
    fuzzyPhraseMatch(
      text,
      [
        "notification",
        "notifications",
        "नोटिफिकेशन",
        "नोटिफिकेशन",
        "నోటిఫికేషన్",
      ]
    )
  ) {

    if (
      language ===
      "hi"
    ) {

      return [

        "मेरी बुकिंग का स्टेटस बताओ",

        "मेरी आखिरी नोटिफिकेशन क्या है?",

      ];

    }


    if (
      language ===
      "te"
    ) {

      return [

        "నా బుకింగ్ స్టేటస్ చెప్పండి",

        "నా చివరి నోటిఫికేషన్ ఏమిటి?",

      ];

    }


    return [

      "What is my booking status?",

      "What is my latest notification?",

    ];

  }


  if (
    fuzzyPhraseMatch(
      text,
      [
        "token",
        "tokken",
        "tokan",
        "tocken",
        "टोकन",
        "టోకెన్",
      ]
    )
  ) {

    if (
      language ===
      "hi"
    ) {

      return [

        "मेरा टोकन खोलो",

        "मेरी बुकिंग कब है?",

      ];

    }


    if (
      language ===
      "te"
    ) {

      return [

        "నా టోకెన్ తెరవండి",

        "నా బుకింగ్ ఎప్పుడు ఉంది?",

      ];

    }


    return [

      "Open my token",

      "When is my booking?",

    ];

  }


  return (
    LANGUAGE_CONFIG[
      language
    ] ||
    LANGUAGE_CONFIG.en
  )
    .examples
    .slice(
      0,
      2
    );

}


/* =========================================================
   HISTORY SANITIZATION
========================================================= */

function sanitizeHistory(
  history
) {

  return (
    Array.isArray(
      history
    )
      ? history
      : []
  )
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
      -MAX_HISTORY_MESSAGES
    )
    .map(
      item => ({

        role:
          item.role,

        content:
          cleanText(
            item.content
          ),

      })
    );

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
  useState(
    false
  );


  const [
    listening,
    setListening,
  ] =
  useState(
    false
  );


  const [
    processing,
    setProcessing,
  ] =
  useState(
    false
  );


  const [
    input,
    setInput,
  ] =
  useState(
    ""
  );


  const [
    transcript,
    setTranscript,
  ] =
  useState(
    ""
  );


  const [
    chatHistory,
    setChatHistory,
  ] =
  useState(
    []
  );


  const [
    voiceEnabled,
    setVoiceEnabled,
  ] =
  useState(
    true
  );


  const [
    error,
    setError,
  ] =
  useState(
    ""
  );


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
    speaking,
    setSpeaking,
  ] =
  useState(
    false
  );


  const [
    copiedMessageId,
    setCopiedMessageId,
  ] =
  useState(
    null
  );


  const [
    voiceIntensity,
    setVoiceIntensity,
  ] =
  useState(
    0
  );


  const [
    showScrollToBottom,
    setShowScrollToBottom,
  ] =
  useState(
    false
  );


  /* =======================================================
     REFS
  ======================================================= */

  const bodyRef =
    useRef(
      null
    );


  const recognitionRef =
    useRef(
      null
    );


  const requestRef =
    useRef(
      false
    );


  const inputRef =
    useRef(
      null
    );


  const audioContextRef =
    useRef(
      null
    );


  const analyserRef =
    useRef(
      null
    );


  const audioStreamRef =
    useRef(
      null
    );


  const audioFrameRef =
    useRef(
      null
    );


  const speechRequestTextRef =
    useRef(
      ""
    );


  const shouldStickToBottomRef =
    useRef(
      true
    );


  const scrollFrameRef =
    useRef(
      null
    );


  /* =======================================================
     LOAD STORAGE
  ======================================================= */

  useEffect(
    () => {

      try {

        const raw =
          localStorage.getItem(
            STORAGE_KEY
          );


        if (
          raw
        ) {

          const saved =
            JSON.parse(
              raw
            );


          if (
            Array.isArray(
              saved
            )
          ) {

            setChatHistory(
              saved.slice(
                -MAX_STORED_MESSAGES
              )
            );

          }

        }

      } catch (
        storageError
      ) {

        console.warn(
          "Could not load assistant conversation:",
          storageError
        );

      }


      try {

        const storedVoice =
          localStorage.getItem(
            VOICE_STORAGE_KEY
          );


        if (
          storedVoice !==
          null
        ) {

          setVoiceEnabled(
            storedVoice !==
            "false"
          );

        }

      } catch {
      }

    },
    []
  );


  /* =======================================================
     SAVE STORAGE
  ======================================================= */

  useEffect(
    () => {

      try {

        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(
            chatHistory.slice(
              -MAX_STORED_MESSAGES
            )
          )
        );

      } catch (
        storageError
      ) {

        console.warn(
          "Could not save assistant conversation:",
          storageError
        );

      }

    },
    [
      chatHistory,
    ]
  );


  /* =======================================================
     ONLINE / OFFLINE
  ======================================================= */

  useEffect(
    () => {

      function handleOnline() {

        setIsOnline(
          true
        );

      }


      function handleOffline() {

        setIsOnline(
          false
        );

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
     LOCK BACKGROUND WHILE ASSISTANT IS OPEN
  ======================================================= */

  useEffect(
    () => {

      if (
        !open
      ) {

        return;

      }


      const originalBodyOverflow =
        document.body.style.overflow;


      const originalBodyTouchAction =
        document.body.style.touchAction;


      const originalHtmlOverflow =
        document.documentElement.style.overflow;


      document.body.style.overflow =
        "hidden";


      document.body.style.touchAction =
        "none";


      document.documentElement.style.overflow =
        "hidden";


      return () => {

        document.body.style.overflow =
          originalBodyOverflow;


        document.body.style.touchAction =
          originalBodyTouchAction;


        document.documentElement.style.overflow =
          originalHtmlOverflow;

      };

    },
    [
      open,
    ]
  );


  /* =======================================================
     CLEANUP
  ======================================================= */

  useEffect(
    () => {

      return () => {

        try {

          recognitionRef.current?.stop();

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
          scrollFrameRef.current
        ) {

          cancelAnimationFrame(
            scrollFrameRef.current
          );

        }

      };

    },
    []
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
          "Escape"
        ) {

          closeAssistant();

          return;

        }


        if (
          event.altKey &&
          event.key.toLowerCase() ===
            "a"
        ) {

          event.preventDefault();


          setOpen(
            true
          );


          window.setTimeout(
            () => {

              inputRef.current?.focus();

            },
            100
          );

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
      open,
    ]
  );


  /* =======================================================
     SCROLL
  ======================================================= */

  function scrollToBottom(
    behavior = "smooth"
  ) {

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
              Math.max(
                0,
                body.scrollHeight
              ),

            behavior,

          });


          shouldStickToBottomRef.current =
            true;


          setShowScrollToBottom(
            false
          );


          scrollFrameRef.current =
            null;

        }
      );

  }


  function handleBodyScroll() {

    const body =
      bodyRef.current;


    if (
      !body
    ) {

      return;

    }


    const distanceFromBottom =
      body.scrollHeight -
      body.scrollTop -
      body.clientHeight;


    const nearBottom =
      distanceFromBottom <=
      SCROLL_BOTTOM_THRESHOLD;


    shouldStickToBottomRef.current =
      nearBottom;


    setShowScrollToBottom(
      !nearBottom
    );

  }


  /* =======================================================
     INITIAL OPEN SCROLL
  ======================================================= */

  useEffect(
    () => {

      if (
        !open
      ) {

        return;

      }


      shouldStickToBottomRef.current =
        true;


      setShowScrollToBottom(
        false
      );


      const frameOne =
        requestAnimationFrame(
          () => {

            scrollToBottom(
              "auto"
            );

          }
        );


      const frameTwo =
        requestAnimationFrame(
          () => {

            requestAnimationFrame(
              () => {

                scrollToBottom(
                  "auto"
                );

              }
            );

          }
        );


      return () => {

        cancelAnimationFrame(
          frameOne
        );

        cancelAnimationFrame(
          frameTwo
        );

      };

    },
    [
      open,
    ]
  );


  /* =======================================================
     AUTO SCROLL
  ======================================================= */

  useEffect(
    () => {

      if (
        !open
      ) {

        return;

      }


      if (
        !shouldStickToBottomRef.current
      ) {

        return;

      }


      scrollToBottom(
        "smooth"
      );

    },
    [
      open,
      chatHistory,
      processing,
      transcript,
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
     VOICE METER
  ======================================================= */

  function stopVoiceMeter() {

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


    setVoiceIntensity(
      0
    );

  }


  async function startVoiceMeter() {

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
          let index = 0;
          index <
            data.length;
          index += 1
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
        "Voice intensity meter unavailable:",
        meterError
      );

    }

  }


  /* =======================================================
     SPEECH OUTPUT
  ======================================================= */

  function stopSpeech() {

    if (
      typeof window !==
        "undefined" &&
      window.speechSynthesis
    ) {

      window.speechSynthesis.cancel();

    }


    setSpeaking(
      false
    );

  }


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


    stopSpeech();


    const utterance =
      new SpeechSynthesisUtterance(
        text
      );


    utterance.lang =
      config.recognition;


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
      getLanguagePrefix(
        language
      );


    const voices =
      window.speechSynthesis
        .getVoices();


    const matchingVoice =
      voices.find(
        voice =>
          voice.lang
            ?.toLowerCase()
            .startsWith(
              prefix
            )
      );


    if (
      matchingVoice
    ) {

      utterance.voice =
        matchingVoice;

    }


    utterance.onstart =
      () => {

        setSpeaking(
          true
        );

      };


    utterance.onend =
      () => {

        setSpeaking(
          false
        );

      };


    utterance.onerror =
      () => {

        setSpeaking(
          false
        );

      };


    window.speechSynthesis.speak(
      utterance
    );

  }


  /* =======================================================
     LISTENING
  ======================================================= */

  function stopListening() {

    try {

      recognitionRef.current?.stop();

    } catch {
    }


    recognitionRef.current =
      null;


    speechRequestTextRef.current =
      "";


    stopVoiceMeter();


    setListening(
      false
    );

  }


  function startListening() {

    const Recognition =
      getRecognition();


    if (
      !Recognition
    ) {

      setOpen(
        true
      );


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


    setOpen(
      true
    );


    setError(
      ""
    );


    setTranscript(
      ""
    );


    speechRequestTextRef.current =
      "";


    stopSpeech();


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

          setListening(
            true
          );


          setError(
            ""
          );


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

            speechRequestTextRef.current =
              cleanText(
                finalText
              );

          }

        };


      recognition.onerror =
        event => {

          setListening(
            false
          );


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

          setListening(
            false
          );


          recognitionRef.current =
            null;


          stopVoiceMeter();


          const spokenText =
            cleanText(
              speechRequestTextRef.current
            );


          speechRequestTextRef.current =
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
        "Recognition error:",
        recognitionError
      );


      recognitionRef.current =
        null;


      stopVoiceMeter();


      setListening(
        false
      );


      setError(
        config.microphoneError
      );

    }

  }


  /* =======================================================
     LOCAL NAVIGATION
  ======================================================= */

  function performLocalNavigation(
    action,
    pending = null
  ) {

    if (
      action ===
      "GO_BACK"
    ) {

      window.setTimeout(
        () => {

          navigate(
            -1
          );

        },
        ACTION_DELAY
      );


      return;

    }


    if (
      action ===
      "SHOW_CURRENT_PAGE"
    ) {

      return;

    }


    const route =
      ACTION_ROUTES[
        action
      ];


    if (
      !route
    ) {

      return;

    }


    const destinationState =
      pending?.params
        ? {
            state: {
              assistantBooking:
                pending.params,
            },
          }
        : undefined;


    window.setTimeout(
      () => {

        navigate(
          route,
          destinationState
        );

      },
      ACTION_DELAY
    );

  }


  /* =======================================================
     ASK AI
  ======================================================= */

  async function askAssistant(
    message,
    {
      retryMessageId = null,
    } = {}
  ) {

    const text =
      cleanText(
        message
      );


    if (
      !text ||
      requestRef.current
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


      const userMessage = {

        id:
          createId(),

        role:
          "user",

        content:
          text,

        timestamp:
          Date.now(),

      };


      const assistantMessage = {

        id:
          createId(),

        role:
          "assistant",

        content:
          reply,

        timestamp:
          Date.now(),

      };


      setChatHistory(
        history => [

          ...history,
          userMessage,
          assistantMessage,

        ]
      );


      speak(
        reply
      );


      return;

    }


    requestRef.current =
      true;


    setProcessing(
      true
    );


    setError(
      ""
    );


    setCopiedMessageId(
      null
    );


    shouldStickToBottomRef.current =
      true;


    setShowScrollToBottom(
      false
    );


    stopSpeech();


    const farmer =
      getStoredFarmer();


    const currentHistory =
      sanitizeHistory(
        chatHistory
      );


    const userMessage =
      retryMessageId
        ? null
        : {

            id:
              createId(),

            role:
              "user",

            content:
              text,

            timestamp:
              Date.now(),

          };


    if (
      userMessage
    ) {

      setChatHistory(
        history => [

          ...history,

          userMessage,

        ]
      );

    }


    try {

      const result =
        await fetch(
          ASSISTANT_ENDPOINT,
          {

            method:
              "POST",

            headers: {

              "Content-Type":
                "application/json",

            },

            body:
              JSON.stringify({

                text,

                language,

                currentPath:
                  location.pathname,

                currentPage:
                  getPageName(
                    location.pathname
                  ),

                farmerId:
                  farmer.farmerId,

                phone:
                  farmer.phone,

                history:
                  currentHistory,

              }),

          }
        );


      let data =
        {};


      try {

        data =
          await result.json();

      } catch {

        data =
          {};

      }


      if (
        !result.ok
      ) {

        throw new Error(
          data?.message ||
          `Assistant returned HTTP ${result.status}.`
        );

      }


      /*
       * =====================================================
       * ACTION PROTECTION
       * =====================================================
       *
       * A backend response may contain:
       *
       * action: OPEN_PAYMENTS
       *
       * but that does NOT automatically mean the user
       * wants navigation.
       *
       * Example:
       *
       * "What is my payment status?"
       *
       * must remain an information request.
       */

      const backendAction =
        SUPPORTED_ACTIONS.includes(
          data?.action
        )
          ? data.action
          : "NONE";


      const localAction =
        detectLocalAction(
          text
        );


      const explicitNavigation =
        isExplicitNavigationRequest(
          text
        );


      const informationQuestion =
        isInformationQuestion(
          text
        );


      let action =
        "NONE";


      if (
        localAction !==
        "NONE"
      ) {

        action =
          localAction;

      } else if (
        backendAction !==
        "NONE" &&
        explicitNavigation &&
        !informationQuestion
      ) {

        action =
          backendAction;

      }


      if (
        informationQuestion
      ) {

        action =
          "NONE";

      }


      /*
       * AI reply is used for ordinary questions.
       * Navigation replies are used for direct commands.
       */

      const actionReply =
        getActionReply(
          action,
          language
        );


      const reply =
        actionReply ||
        cleanText(
          data?.reply
        ) ||
        getFriendlyFallback(
          language
        );


      const assistantMessage = {

        id:
          createId(),

        role:
          "assistant",

        content:
          reply,

        timestamp:
          Date.now(),

        action,

      };


      setChatHistory(
        history => [

          ...history,

          assistantMessage,

        ]
      );


      setTranscript(
        ""
      );


      setProcessing(
        false
      );


      setError(
        ""
      );


      speak(
        reply
      );


      /*
       * Navigation happens ONLY after the reply has been
       * added to the conversation.
       */

      if (
        action !==
        "NONE"
      ) {

        clearPendingAction();


        performLocalNavigation(
          action
        );

      }

    } catch (
      assistantError
    ) {

      console.error(
        "AI assistant request error:",
        assistantError
      );


      setProcessing(
        false
      );


      /*
       * Even when AI is down, direct navigation
       * must still work locally.
       */

      const localAction =
        detectLocalAction(
          text
        );


      if (
        localAction ===
        "SHOW_CURRENT_PAGE"
      ) {

        const pageName =
          getPageName(
            location.pathname
          );


        const reply =
          language ===
            "hi"
            ? `${config.currentPagePrefix}: ${pageName}.`
            : language ===
              "te"
              ? `${config.currentPagePrefix}: ${pageName}.`
              : `${config.currentPagePrefix}: ${pageName}.`;


        setChatHistory(
          history => [

            ...history,

            {
              id:
                createId(),

              role:
                "assistant",

              content:
                reply,

              timestamp:
                Date.now(),

            },

          ]
        );


        speak(
          reply
        );


        return;

      }


      if (
        localAction !==
        "NONE"
      ) {

        const reply =
          getActionReply(
            localAction,
            language
          );


        const assistantMessage = {

          id:
            createId(),

          role:
            "assistant",

          content:
            reply ||
            getFriendlyFallback(
              language
            ),

          timestamp:
            Date.now(),

          action:
            localAction,

        };


        setChatHistory(
          history => [

            ...history,

            assistantMessage,

          ]
        );


        setError(
          ""
        );


        speak(
          reply
        );


        performLocalNavigation(
          localAction
        );


        return;

      }


      /*
       * Normal AI question failed.
       */

      const reply =
        getConnectionFallback(
          language
        );


      const assistantMessage = {

        id:
          createId(),

        role:
          "assistant",

        content:
          reply,

        timestamp:
          Date.now(),

        failed:
          true,

      };


      setChatHistory(
        history => [

          ...history,

          assistantMessage,

        ]
      );


      setError(
        ""
      );


      speak(
        reply
      );

    } finally {

      requestRef.current =
        false;

    }

  }


  /* =======================================================
     COMMAND ROUTER
  ======================================================= */

  function handleCommand(
    message
  ) {

    const text =
      cleanText(
        message
      );


    if (
      !text ||
      processing
    ) {

      return;

    }


    setInput(
      ""
    );


    setError(
      ""
    );


    setTranscript(
      text
    );


    shouldStickToBottomRef.current =
      true;


    setShowScrollToBottom(
      false
    );


    /*
     * =====================================================
     * PENDING ACTION
     * =====================================================
     */

    const pending =
      loadPendingAction();


    if (
      pending &&
      isConfirmation(
        text
      )
    ) {

      clearPendingAction();


      const action =
        pending.action;


      const userMessage = {

        id:
          createId(),

        role:
          "user",

        content:
          text,

        timestamp:
          Date.now(),

      };


      let confirmationReply;


      if (
        action ===
        "OPEN_BOOKING"
      ) {

        confirmationReply =
          language ===
            "hi"
            ? "ठीक है। मैं आपकी जानकारी के साथ बुकिंग पेज खोल रहा हूँ।"
            : language ===
              "te"
              ? "సరే. మీ వివరాలతో బుకింగ్ పేజీని తెరుస్తున్నాను."
              : "Okay. I’m opening the booking page with those details.";

      } else {

        confirmationReply =
          getActionReply(
            action,
            language
          ) ||
          getFriendlyFallback(
            language
          );

      }


      const assistantMessage = {

        id:
          createId(),

        role:
          "assistant",

        content:
          confirmationReply,

        timestamp:
          Date.now(),

        action,

      };


      setChatHistory(
        history => [

          ...history,

          userMessage,
          assistantMessage,

        ]
      );


      speak(
        confirmationReply
      );


      performLocalNavigation(
        action,
        pending
      );


      return;

    }


    /*
     * -----------------------------------------------------
     * EXPIRED / MISSING CONFIRMATION
     * -----------------------------------------------------
     */

    if (
      pending &&
      isNegative(
        text
      )
    ) {

      clearPendingAction();


      const reply =
        config.cancelled;


      setChatHistory(
        history => [

          ...history,

          {
            id:
              createId(),

            role:
              "user",

            content:
              text,

            timestamp:
              Date.now(),

          },

          {
            id:
              createId(),

            role:
              "assistant",

            content:
              reply,

            timestamp:
              Date.now(),

          },

        ]
      );


      speak(
        reply
      );


      return;

    }


    /*
     * -----------------------------------------------------
     * CURRENT PAGE
     * -----------------------------------------------------
     */

    const localAction =
      detectLocalAction(
        text
      );


    if (
      localAction ===
      "SHOW_CURRENT_PAGE"
    ) {

      const pageName =
        getPageName(
          location.pathname
        );


      const reply =
        language ===
          "hi"
          ? `${config.currentPagePrefix}: ${pageName}.`
          : language ===
            "te"
            ? `${config.currentPagePrefix}: ${pageName}.`
            : `${config.currentPagePrefix}: ${pageName}.`;


      setChatHistory(
        history => [

          ...history,

          {
            id:
              createId(),

            role:
              "user",

            content:
              text,

            timestamp:
              Date.now(),

          },

          {
            id:
              createId(),

            role:
              "assistant",

            content:
              reply,

            timestamp:
              Date.now(),

          },

        ]
      );


      speak(
        reply
      );


      return;

    }


    /*
     * -----------------------------------------------------
     * DIRECT LOCAL NAVIGATION
     * -----------------------------------------------------
     */

    if (
      localAction !==
      "NONE"
    ) {

      /*
       * BOOKING WITH DETAILS
       */

      if (
        localAction ===
        "OPEN_BOOKING"
      ) {

        const bookingData =
          extractBookingDetails(
            text
          );


        if (
          bookingData
        ) {

          savePendingAction({

            action:
              "OPEN_BOOKING",

            params:
              bookingData,

            createdAt:
              Date.now(),

          });


          const bookingReply =
            getBookingIntentReply(
              bookingData,
              language
            );


          setChatHistory(
            history => [

              ...history,

              {
                id:
                  createId(),

                role:
                  "user",

                content:
                  text,

                timestamp:
                  Date.now(),

              },

              {
                id:
                  createId(),

                role:
                  "assistant",

                content:
                  bookingReply,

                timestamp:
                  Date.now(),

                action:
                  "OPEN_BOOKING",

              },

            ]
          );


          speak(
            bookingReply
          );


          return;

        }

      }


      /*
       * Normal navigation command.
       */

      clearPendingAction();


      const reply =
        getActionReply(
          localAction,
          language
        );


      const assistantReply =
        reply ||
        getFriendlyFallback(
          language
        );


      setChatHistory(
        history => [

          ...history,

          {
            id:
              createId(),

            role:
              "user",

            content:
              text,

            timestamp:
              Date.now(),

          },

          {
            id:
              createId(),

            role:
              "assistant",

            content:
              assistantReply,

            timestamp:
              Date.now(),

            action:
              localAction,

          },

        ]
      );


      speak(
        assistantReply
      );


      performLocalNavigation(
        localAction
      );


      return;

    }


    /*
     * -----------------------------------------------------
     * NORMAL AI QUESTION
     * -----------------------------------------------------
     */

    askAssistant(
      text
    );

  }


  /* =======================================================
     SUBMIT
  ======================================================= */

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
      cleanText(
        input
      );


    if (
      !text
    ) {

      return;

    }


    handleCommand(
      text
    );

  }


  /* =======================================================
     QUICK PROMPT
  ======================================================= */

  function useExample(
    example
  ) {

    if (
      processing
    ) {

      return;

    }


    handleCommand(
      example
    );

  }


  /* =======================================================
     RETRY
  ======================================================= */

  function retryMessage(
    messageId
  ) {

    const failed =
      chatHistory.find(
        message =>
          message.id ===
          messageId
      );


    if (
      !failed
    ) {

      return;

    }


    const index =
      chatHistory.findIndex(
        message =>
          message.id ===
          messageId
      );


    let previousUserMessage =
      null;


    for (
      let cursor =
        index - 1;
      cursor >=
        0;
      cursor -= 1
    ) {

      if (
        chatHistory[
          cursor
        ]?.role ===
        "user"
      ) {

        previousUserMessage =
          chatHistory[
            cursor
          ];

        break;

      }

    }


    if (
      !previousUserMessage
    ) {

      return;

    }


    setChatHistory(
      history =>
        history.filter(
          message =>
            message.id !==
            messageId
        )
    );


    shouldStickToBottomRef.current =
      true;


    setShowScrollToBottom(
      false
    );


    window.setTimeout(
      () => {

        askAssistant(
          previousUserMessage.content
        );

      },
      0
    );

  }


  /* =======================================================
     COPY
  ======================================================= */

  async function copyMessage(
    message
  ) {

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
        "Could not copy assistant message:",
        copyError
      );

    }

  }


  /* =======================================================
     CLEAR
  ======================================================= */

  function clearConversation() {

    stopSpeech();

    stopListening();

    clearPendingAction();


    setChatHistory(
      []
    );


    setTranscript(
      ""
    );


    setInput(
      ""
    );


    setError(
      ""
    );


    setCopiedMessageId(
      null
    );


    shouldStickToBottomRef.current =
      true;


    setShowScrollToBottom(
      false
    );


    try {

      localStorage.removeItem(
        STORAGE_KEY
      );

    } catch {
    }

  }


  /* =======================================================
     VOICE TOGGLE
  ======================================================= */

  function toggleVoice() {

    setVoiceEnabled(
      current => {

        const next =
          !current;


        try {

          localStorage.setItem(
            VOICE_STORAGE_KEY,
            String(
              next
            )
          );

        } catch {
        }


        if (
          !next
        ) {

          stopSpeech();

        }


        return next;

      }
    );

  }


  /* =======================================================
     CLOSE
  ======================================================= */

  function closeAssistant() {

    stopListening();

    stopSpeech();


    setOpen(
      false
    );


    setShowScrollToBottom(
      false
    );

  }


  /* =======================================================
     COMPUTED
  ======================================================= */

  const currentPage =
    useMemo(
      () =>
        getPageName(
          location.pathname
        ),
      [
        location.pathname,
      ]
    );


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
          lastAssistant
        ) {

          return getSuggestions(
            language,
            lastAssistant.content
          );

        }


        return config.examples.slice(
          0,
          2
        );

      },
      [
        chatHistory,
        language,
        config.examples,
      ]
    );


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

      {/* ===================================================
          FLOATING ASSISTANT
      =================================================== */}

      <button
        type="button"
        className={`
          voice-assistant-floating
          ${
            listening
              ? "listening"
              : ""
          }
          ${
            input.trim()
              ? "typing"
              : ""
          }
          ${
            open
              ? "panel-open"
              : ""
          }
        `}
        onClick={() => {

          if (
            listening
          ) {

            stopListening();

            return;

          }


          setOpen(
            true
          );

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


      {/* ===================================================
          BACKDROP
      =================================================== */}

      {open && (

        <div
          className="
            voice-assistant-backdrop
          "
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

          {/* =================================================
              PANEL
          ================================================= */}

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

            {/* ===============================================
                HEADER
            =============================================== */}

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


            {/* ===============================================
                BODY
            =============================================== */}

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
                onPointerDown={
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


                {/* TRANSCRIPT */}

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


              {/* DOWN BUTTON */}

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


            {/* ===============================================
                COMPOSER
            =============================================== */}

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
