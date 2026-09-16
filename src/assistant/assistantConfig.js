/* =========================================================
   KRISHISETU AI ASSISTANT CONFIGURATION
=========================================================

   This file contains configuration only.

   Keep business logic, navigation logic, voice logic and
   React UI logic out of this file.

========================================================= */


/* =========================================================
   API
========================================================= */

export const API_CONFIG = {

  baseUrl:
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api",

  endpoint:
    "/assistant",

  requestTimeout:
    30000,

};


/* =========================================================
   STORAGE
========================================================= */

export const STORAGE_KEYS = {

  conversation:
    "krishisetu_ai_conversation",

  voiceEnabled:
    "krishisetu_ai_voice_enabled",

  pendingAction:
    "krishisetu_ai_pending_action",

};


/* =========================================================
   ASSISTANT LIMITS
========================================================= */

export const ASSISTANT_LIMITS = {

  maxInputLength:
    1500,

  maxHistoryMessages:
    12,

  maxStoredMessages:
    50,

  pendingActionTTL:
    5 * 60 * 1000,

};


/* =========================================================
   TIMING
========================================================= */

export const ASSISTANT_TIMING = {

  navigationDelay:
    650,

  inputFocusDelay:
    180,

  scrollDelay:
    20,

  scrollBottomThreshold:
    80,

  copiedMessageDuration:
    1400,

};


/* =========================================================
   SHORTCUTS
========================================================= */

export const ASSISTANT_SHORTCUTS = {

  openAssistant: {

    alt:
      true,

    key:
      "a",

  },

  closeAssistant:
    "Escape",

};


/* =========================================================
   SUPPORTED LANGUAGES
========================================================= */

export const SUPPORTED_LANGUAGES = {

  en: {

    code:
      "en",

    name:
      "English",

    recognition:
      "en-IN",

    locale:
      "en-IN",

    voicePrefix:
      "en",

  },

  hi: {

    code:
      "hi",

    name:
      "Hindi",

    recognition:
      "hi-IN",

    locale:
      "hi-IN",

    voicePrefix:
      "hi",

  },

  te: {

    code:
      "te",

    name:
      "Telugu",

    recognition:
      "te-IN",

    locale:
      "te-IN",

    voicePrefix:
      "te",

  },

};


/* =========================================================
   DEFAULT LANGUAGE
========================================================= */

export const DEFAULT_LANGUAGE =
  "en";


/* =========================================================
   QUICK PROMPTS
========================================================= */

export const QUICK_PROMPTS = {

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
   ASSISTANT UI TEXT
========================================================= */

export const LANGUAGE_CONFIG = {

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

    examples:
      QUICK_PROMPTS.te,

  },

};


/* =========================================================
   FARMER STORAGE KEYS
=========================================================

   Different parts of the prototype may currently use
   different localStorage names. Keep compatibility here.

========================================================= */

export const FARMER_STORAGE_KEYS = {

  objectKeys: [

    "farmer",

    "farmerData",

    "loggedInFarmer",

    "currentFarmer",

    "krishisetuFarmer",

    "krishisetu_farmer",

    "farmerUser",

  ],

  farmerIdKeys: [

    "farmerId",

    "farmer_id",

    "currentFarmerId",

  ],

  phoneKeys: [

    "farmerPhone",

    "farmer_phone",

    "phone",

  ],

  prototypeState:
    "krishisetu_prototype_state",

};


/* =========================================================
   PAGE DEFINITIONS
========================================================= */

export const PAGE_DEFINITIONS = {

  "/farmer/home": {

    name:
      "Farmer Home",

    description:
      "Farmer dashboard",

  },

  "/farmer/book": {

    name:
      "Book Procurement Slot",

    description:
      "Procurement booking page",

  },

  "/farmer/token": {

    name:
      "Token / Booking Tracking",

    description:
      "Token and booking tracking",

  },

  "/farmer/history": {

    name:
      "Procurement History",

    description:
      "Previous procurement records",

  },

  "/farmer/payments": {

    name:
      "Payment History",

    description:
      "Payment records and history",

  },

  "/farmer/settings": {

    name:
      "Farmer Settings",

    description:
      "Account and preference settings",

  },

  "/farmer/help": {

    name:
      "Farmer Help",

    description:
      "Help and frequently asked questions",

  },

  "/farmer/login": {

    name:
      "Farmer Login",

    description:
      "Farmer login page",

  },

  "/farmer/register": {

    name:
      "Farmer Registration",

    description:
      "Farmer registration page",

  },

};


/* =========================================================
   ASSISTANT BEHAVIOUR
========================================================= */

export const ASSISTANT_BEHAVIOUR = {

  allowLocalNavigation:
    true,

  localNavigationBeforeAI:
    true,

  allowBackendActions:
    true,

  requireExplicitBackendNavigation:
    true,

  protectInformationQuestions:
    true,

  allowTypoTolerance:
    true,

  allowConfirmation:
    true,

  allowCancellation:
    true,

  allowBookingParameters:
    true,

  preserveConversation:
    true,

  preserveVoicePreference:
    true,

  closeOnEscape:
    true,

  lockBackgroundWhileOpen:
    true,

};


/* =========================================================
   VOICE CONFIGURATION
========================================================= */

export const VOICE_CONFIG = {

  recognition: {

    continuous:
      false,

    interimResults:
      true,

    maxAlternatives:
      3,

  },

  speech: {

    defaultRate:
      0.95,

    teluguRate:
      0.90,

    pitch:
      1,

    volume:
      1,

  },

  meter: {

    fftSize:
      256,

    smoothingTimeConstant:
      0.78,

    multiplier:
      5.5,

    previousWeight:
      0.72,

    currentWeight:
      0.28,

  },

};


/* =========================================================
   AI REQUEST CONFIGURATION
========================================================= */

export const AI_REQUEST_CONFIG = {

  headers: {

    "Content-Type":
      "application/json",

  },

  method:
    "POST",

};


/* =========================================================
   DEVELOPMENT CONFIGURATION
========================================================= */

export const DEVELOPMENT_CONFIG = {

  logAssistantRequests:
    true,

  logAssistantResponses:
    true,

  logIntentDetection:
    true,

  logNavigation:
    true,

  logVoiceErrors:
    true,

};


/* =========================================================
   HELPERS
========================================================= */


/*
 * Get language configuration safely.
 */

export function getLanguageConfig(
  language
) {

  return (
    LANGUAGE_CONFIG[
      language
    ] ||
    LANGUAGE_CONFIG[
      DEFAULT_LANGUAGE
    ]
  );

}


/*
 * Get voice configuration safely.
 */

export function getLanguageSettings(
  language
) {

  return (
    SUPPORTED_LANGUAGES[
      language
    ] ||
    SUPPORTED_LANGUAGES[
      DEFAULT_LANGUAGE
    ]
  );

}


/*
 * Return full assistant endpoint.
 */

export function getAssistantEndpoint() {

  return (
    `${API_CONFIG.baseUrl}${API_CONFIG.endpoint}`
  );

}


/*
 * Return page definition.
 */

export function getPageDefinition(
  pathname
) {

  return (
    PAGE_DEFINITIONS[
      pathname
    ] ||
    {

      name:
        pathname ||
        "Unknown Page",

      description:
        "Unknown page",

    }
  );

}


/*
 * Return quick prompts for a language.
 */

export function getQuickPrompts(
  language
) {

  return (
    QUICK_PROMPTS[
      language
    ] ||
    QUICK_PROMPTS[
      DEFAULT_LANGUAGE
    ]
  );

}


/*
 * Check whether language is supported.
 */

export function isSupportedLanguage(
  language
) {

  return Boolean(
    SUPPORTED_LANGUAGES[
      language
    ]
  );

}


/*
 * Normalize language.

   Any unsupported language falls back
   to English.
 */

export function normalizeLanguage(
  language
) {

  return isSupportedLanguage(
    language
  )
    ? language
    : DEFAULT_LANGUAGE;

}


/* =========================================================
   DEVELOPMENT VALIDATION
========================================================= */

export function validateAssistantConfig() {

  const errors = [];


  if (
    !API_CONFIG.baseUrl
  ) {

    errors.push(
      "API_CONFIG.baseUrl is missing."
    );

  }


  if (
    !API_CONFIG.endpoint
  ) {

    errors.push(
      "API_CONFIG.endpoint is missing."
    );

  }


  if (
    !DEFAULT_LANGUAGE
  ) {

    errors.push(
      "DEFAULT_LANGUAGE is missing."
    );

  }


  if (
    !LANGUAGE_CONFIG[
      DEFAULT_LANGUAGE
    ]
  ) {

    errors.push(
      "DEFAULT_LANGUAGE has no LANGUAGE_CONFIG entry."
    );

  }


  if (
    !SUPPORTED_LANGUAGES[
      DEFAULT_LANGUAGE
    ]
  ) {

    errors.push(
      "DEFAULT_LANGUAGE has no SUPPORTED_LANGUAGES entry."
    );

  }


  return {

    valid:
      errors.length ===
      0,

    errors,

  };

}


/* =========================================================
   DEVELOPMENT CHECK
========================================================= */

if (
  typeof import.meta !==
    "undefined" &&
  import.meta.env?.DEV
) {

  const validation =
    validateAssistantConfig();


  if (
    !validation.valid
  ) {

    console.warn(
      "[KrishiSetu AI] Configuration errors:",
      validation.errors
    );

  }

}