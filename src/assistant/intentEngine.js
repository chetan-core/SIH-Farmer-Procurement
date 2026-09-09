/* =========================================================
   KRISHISETU INTENT ENGINE
========================================================= */

import {
  ACTIONS,
} from "./assistantActions";


/* =========================================================
   NORMALIZATION
========================================================= */

export function normalizeText(
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
      /[^\p{L}\p{N}\s:.-]/gu,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();

}


/* =========================================================
   TOKENIZATION
========================================================= */

function tokenize(
  value
) {

  const text =
    normalizeText(
      value
    );

  if (
    !text
  ) {

    return [];

  }

  return text.split(
    " "
  );

}


/* =========================================================
   RESULT
========================================================= */

function createResult(
  action = "NONE",
  confidence = 0,
  extras = {}
) {

  return {

    action,

    confidence,

    ...extras,

  };

}


/* =========================================================
   LEVENSHTEIN DISTANCE
========================================================= */

export function levenshteinDistance(
  a,
  b
) {

  const first =
    String(
      a || ""
    )
      .toLowerCase();

  const second =
    String(
      b || ""
    )
      .toLowerCase();


  if (
    first ===
    second
  ) {

    return 0;

  }


  if (
    first.length ===
    0
  ) {

    return second.length;

  }


  if (
    second.length ===
    0
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
    i <=
      first.length;
    i += 1
  ) {

    const current = [
      i,
    ];


    for (
      let j = 1;
      j <=
        second.length;
      j += 1
    ) {

      const cost =
        first[i - 1] ===
        second[j - 1]
          ? 0
          : 1;


      current[j] =
        Math.min(

          current[j - 1] +
            1,

          previous[j] +
            1,

          previous[j - 1] +
            cost

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
   FUZZY WORD
========================================================= */

export function fuzzyWord(
  value,
  candidates
) {
  const word =
    normalizeText(
      value
    );

  if (
    !word
  ) {
    return false;
  }

  const words =
    Array.isArray(
      candidates
    )
      ? candidates
      : [];

  return words.some(
    candidate => {
      const target =
        normalizeText(
          candidate
        );

      if (
        !target
      ) {
        return false;
      }

      /*
       * Exact match is always accepted.
       */

      if (
        word ===
        target
      ) {
        return true;
      }

      /*
       * Do not allow very short words to match each other
       * through broad substring/fuzzy rules.
       *
       * This prevents:
       *
       * token ↔ take
       * help  ↔ he
       * home  ↔ some
       */

      if (
        target.length >= 5 &&
        word.length >= 5 &&
        (
          word.includes(
            target
          ) ||
          target.includes(
            word
          )
        )
      ) {
        return true;
      }

      const distance =
        levenshteinDistance(
          word,
          target
        );

      const longest =
        Math.max(
          word.length,
          target.length
        );

      /*
       * Tight fuzzy matching.
       *
       * 1 character:
       *   typo correction
       *
       * 2 characters:
       *   reasonable typo correction for longer words
       *
       * Never use the old distance <= 3 rule for
       * ordinary short navigation words.
       */

      if (
        longest <= 4
      ) {
        return distance <= 1;
      }

      if (
        longest <= 7
      ) {
        return distance <= 1;
      }

      if (
        longest <= 10
      ) {
        return distance <= 2;
      }

      return distance <= 3;
    }
  );
}


/* =========================================================
   FUZZY PHRASE
========================================================= */

export function fuzzyPhrase(
  value,
  phrases
) {

  const text =
    normalizeText(
      value
    );


  if (
    !text
  ) {

    return false;

  }


  const list =
    Array.isArray(
      phrases
    )
      ? phrases
      : [];


  const words =
    tokenize(
      text
    );


  for (
    const phrase of list
  ) {

    const target =
      normalizeText(
        phrase
      );


    if (
      target &&
      text.includes(
        target
      )
    ) {

      return true;

    }

  }


  for (
    const phrase of list
  ) {

    const target =
      normalizeText(
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
      targetWords.length ===
      1
    ) {

      if (
        fuzzyWord(
          target,
          words
        )
      ) {

        return true;

      }

      continue;

    }


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


      if (
        candidate ===
        target
      ) {

        return true;

      }


      const distance =
        levenshteinDistance(
          candidate,
          target
        );


      const threshold =
        target.length <=
          8
          ? 1
          : target.length <=
              15
            ? 2
            : 3;


      if (
        distance <=
        threshold
      ) {

        return true;

      }

    }

  }


  return false;

}


/* =========================================================
   CONTAINS ANY
========================================================= */

function containsAny(
  text,
  values
) {

  return (
    Array.isArray(
      values
    ) &&
    values.some(
      value =>
        fuzzyPhrase(
          text,
          [
            value,
          ]
        )
    )
  );

}


/* =========================================================
   ACTION LANGUAGE
========================================================= */

const ACTION_LANGUAGE = {

  open: [

    "open",
    "show me",
    "show",
    "view",
    "visit",
    "take me",
    "bring me",
    "navigate",
    "navigate to",
    "go",
    "go to",
    "goto",
    "head to",
    "send me",
    "move to",
    "find",
    "access",

    "खोल",
    "खोलो",
    "खोलें",
    "दिखा",
    "दिखाओ",
    "दिखाएं",
    "देखना है",
    "ले चलो",
    "ले चल",
    "पहुंचाओ",
    "जाओ",

    "తెర",
    "తెరవండి",
    "చూపు",
    "చూపించు",
    "చూపించండి",
    "తీసుకెళ్లండి",
    "వెళ్ళు",
    "వెళ్ళండి",

  ],

  back: [

    "back",
    "go back",
    "take me back",
    "previous",
    "previous page",
    "go to previous page",
    "return",
    "return back",
    "last page",
    "previous screen",

    "वापस",
    "वापस जाओ",
    "पीछे",
    "पिछला",
    "पिछले पेज",
    "पिछले पेज पर",
    "पिछले पेज पर वापस",

    "వెనక్కి",
    "వెనక్కి వెళ్ళు",
    "మునుపటి",
    "మునుపటి పేజీ",
    "వెనుకకు",

  ],

};


/* =========================================================
   DESTINATIONS
========================================================= */

const DESTINATIONS = {

  OPEN_HOME: [

    "home",
    "homepage",
    "home page",
    "dashboard",
    "dashbord",
    "dashboad",
    "dash board",
    "farmer home",
    "farmer dashboard",
    "main page",
    "main screen",

    "होम",
    "होम पेज",
    "मुख्य पेज",
    "मुख्य स्क्रीन",
    "डैशबोर्ड",

    "హోమ్",
    "హోమ్ పేజ్",
    "డ్యాష్‌బోర్డ్",
    "ప్రధాన పేజీ",

  ],


  OPEN_BOOKING: [

    "booking",
    "book",
    "book page",
    "booking page",
    "book slot",
    "booking slot",
    "new booking",
    "new slot",
    "procurement",
    "procurement booking",
    "procurement slot",
    "procurement page",
    "sell crop",
    "sell my crop",
    "sell produce",
    "slot",

    "बुकिंग",
    "बुक",
    "बुकिंग पेज",
    "बुक स्लॉट",
    "स्लॉट",
    "खरीद",
    "फसल बेचने",

    "బుకింగ్",
    "బుక్",
    "బుకింగ్ పేజీ",
    "స్లాట్",
    "కొత్త బుకింగ్",
    "పంట అమ్మకం",

  ],


  OPEN_TOKEN: [

    "token",
    "my token",
    "latest token",
    "current token",
    "new token",
    "token page",
    "token details",
    "booking token",

    "टोकन",
    "मेरा टोकन",
    "लेटेस्ट टोकन",
    "वर्तमान टोकन",
    "टोकन पेज",
    "बुकिंग टोकन",
    "बुकिंग विवरण",

    "టోకెన్",
    "నా టోకెన్",
    "లేటెస్ట్ టోకెన్",
    "ప్రస్తుత టోకెన్",
    "టోకెన్ పేజీ",
    "బుకింగ్ వివరాలు",

  ],


  OPEN_HISTORY: [

    "history",
    "my history",
    "booking history",
    "procurement history",
    "purchase history",
    "past bookings",
    "records",
    "old bookings",
    "previous bookings",
    "history page",

    "इतिहास",
    "हिस्ट्री",
    "मेरी हिस्ट्री",
    "खरीद इतिहास",
    "बुकिंग हिस्ट्री",

    "చరిత్ర",
    "హిస్టరీ",
    "నా హిస్టరీ",
    "కొనుగోలు చరిత్ర",

  ],


  OPEN_PAYMENTS: [

    "payment",
    "payments",
    "payment history",
    "payment status",
    "my payment",
    "my payments",
    "payment page",
    "payments page",
    "paid",
    "money received",
    "payment record",
    "money",

    "पेमेंट",
    "भुगतान",
    "भुगतान इतिहास",
    "पेमेंट हिस्ट्री",
    "पेमेंट स्टेटस",
    "पैसे",

    "చెల్లింపు",
    "పేమెంట్",
    "పేమెంట్ హిస్టరీ",
    "పేమెంట్ స్టేటస్",

  ],


  OPEN_SETTINGS: [

    "settings",
    "setting",
    "preferences",
    "account settings",
    "profile settings",
    "my settings",
    "settings page",
    "account",

    "सेटिंग",
    "सेटिंग्स",
    "प्रेफरेंस",
    "अकाउंट सेटिंग्स",

    "సెట్టింగ్",
    "సెట్టింగ్స్",
    "ప్రాధాన్యతలు",

  ],


  OPEN_HELP: [

    "help",
    "helpp",
    "heeelp",
    "heeeelp",
    "hepl",
    "hlp",
    "helo",
    "help page",
    "help center",
    "faq",
    "faqs",
    "frequently asked questions",
    "support",
    "assistance",

    "मदद",
    "सहायता",
    "हेल्प",
    "सहायता पेज",
    "एफएक्यू",

    "సహాయం",
    "హెల్ప్",
    "ఎఫ్ఏక్యూ",

  ],


  OPEN_NOTIFICATIONS: [

    "notification",
    "notifications",
    "notification page",
    "my notifications",
    "alerts",
    "alert",
    "updates",
    "latest notification",
    "messages",
    "announcements",

    "नोटिफिकेशन",
    "नोटिफिकेशन पेज",
    "सूचनाएं",
    "अलर्ट",
    "अपडेट",
    "संदेश",

    "నోటిఫికేషన్",
    "నోటిఫికేషన్స్",
    "సూచనలు",
    "అప్‌డేట్స్",
    "సందేశాలు",

  ],

};


/* =========================================================
   QUESTION PATTERNS
========================================================= */

const QUESTION_PATTERNS = [

  "what",
  "what is",
  "what are",
  "whats",
  "what's",
  "where",
  "where is",
  "where are",
  "when",
  "when is",
  "when will",
  "which",
  "how",
  "how much",
  "how many",
  "how do",
  "how does",
  "how can",
  "why",
  "who",
  "tell me",
  "can you tell me",
  "status",
  "is my",
  "are my",
  "do i have",
  "did i",
  "can i",
  "can we",
  "could you",

  "क्या",
  "क्या है",
  "क्या हैं",
  "कहाँ",
  "कहाँ है",
  "कहाँ हैं",
  "कब",
  "कितना",
  "कितने",
  "कैसे",
  "क्यों",
  "कौन",
  "बताओ",
  "बताइए",
  "मेरी स्थिति",
  "क्या मैं",

  "ఏమిటి",
  "ఎక్కడ",
  "ఎప్పుడు",
  "ఎంత",
  "ఎందుకు",
  "ఎలా",
  "చెప్పండి",
  "స్థితి",
  "నేను చేయగలనా",

];


function looksLikeQuestion(
  message
) {

  const raw =
    String(
      message || ""
    )
      .trim();

  const text =
    normalizeText(
      raw
    );


  if (
    !text
  ) {

    return false;

  }


  if (
    /[?؟]$/.test(
      raw
    )
  ) {

    return true;

  }


  if (
    containsAny(
      text,
      QUESTION_PATTERNS
    )
  ) {

    return true;

  }


  if (
    fuzzyPhrase(
      text,
      [
        "payment status",
        "booking status",
        "token status",
        "my status",
        "payment state",
        "booking state",
        "what is my token",
        "what is my booking",
        "what are my bookings",
      ]
    )
  ) {

    return true;

  }


  return false;

}


/* =========================================================
   NAVIGATION
========================================================= */

function hasNavigationVerb(
  message
) {

  return containsAny(
    normalizeText(
      message
    ),
    ACTION_LANGUAGE.open
  );

}


function isBackRequest(
  message
) {

  return containsAny(
    normalizeText(
      message
    ),
    ACTION_LANGUAGE.back
  );

}


function hasDestination(
  text,
  action
) {

  return fuzzyPhrase(
    text,
    DESTINATIONS[
      action
    ] ||
    []
  );

}


function shouldNavigateToDestination(
  text,
  action
) {

  const navigation =
    hasNavigationVerb(
      text
    );

  const question =
    looksLikeQuestion(
      text
    );


  if (
    navigation
  ) {

    return true;

  }


  const wordCount =
    tokenize(
      text
    ).length;


  if (
    wordCount <=
      3 &&
    !question
  ) {

    if (
      action ===
        "OPEN_NOTIFICATIONS" ||
      action ===
        "OPEN_PAYMENTS" ||
      action ===
        "OPEN_HISTORY" ||
      action ===
        "OPEN_SETTINGS" ||
      action ===
        "OPEN_HELP" ||
      action ===
        "OPEN_HOME" ||
      action ===
        "OPEN_TOKEN"
    ) {

      return true;

    }

  }


  return false;

}


/* =========================================================
   CROP ALIASES
========================================================= */

const CROP_ALIASES = {

  wheat: [

    "wheat",
    "wheat crop",
    "gehu",
    "gehun",
    "gehoo",
    "gahu",

    "गेहूं",
    "गेहू",
    "गहूं",
    "गहू",
    "गेहूँ",

    "గోధుమ",
    "గోధుమలు",

  ],


  paddy: [

    "paddy",
    "rice",
    "dhan",
    "dhan crop",

    "धान",
    "चावल",
    "धान की फसल",

    "వరి",
    "బియ్యం",

  ],


  maize: [

    "maize",
    "corn",
    "maka",

    "मक्का",

    "మొక్కజొన్న",

  ],


  cotton: [

    "cotton",
    "kapas",

    "कपास",

    "పత్తి",

  ],

};


/* =========================================================
   CROP EXTRACTION
========================================================= */

export function extractCrop(
  message
) {

  const text =
    normalizeText(
      message
    );


  if (
    !text
  ) {

    return null;

  }


  for (
    const [
      cropId,
      aliases,
    ] of Object.entries(
      CROP_ALIASES
    )
  ) {

    if (
      fuzzyPhrase(
        text,
        aliases
      )
    ) {

      return cropId;

    }

  }


  return null;

}


/* =========================================================
   QUANTITY EXTRACTION
========================================================= */

export function extractBookingDetails(
  message
) {

  const text =
    normalizeText(
      message
    );


  if (
    !text
  ) {

    return null;

  }


  const explicitQuantity =
    text.match(
      /(\d+(?:\.\d+)?)\s*(kg|kgs|kilo|kilos|kilogram|kilograms|किलो|किलोग्राम|కిలో|కిలోలు)\b/i
    );


  const bareQuantity =
    text.match(
      /\b(\d+(?:\.\d+)?)\b/
    );


  let quantity =
    null;


  if (
    explicitQuantity
  ) {

    quantity =
      Number(
        explicitQuantity[1]
      );

  } else if (
    bareQuantity &&
    (
      hasDestination(
        text,
        "OPEN_BOOKING"
      ) ||
      extractCrop(
        text
      )
    )
  ) {

    quantity =
      Number(
        bareQuantity[1]
      );

  }


  if (
    !Number.isFinite(
      quantity
    ) ||
    quantity <=
      0 ||
    quantity >
      50000
  ) {

    quantity =
      null;

  }


  const crop =
    extractCrop(
      text
    );


  if (
    !crop &&
    !quantity
  ) {

    return null;

  }


  return {

    crop,

    quantity,

  };

}


/* =========================================================
   BOOKING DATE / TIME SIGNALS
========================================================= */

export function hasBookingDateSignal(
  message
) {

  const text =
    normalizeText(
      message
    );


  return Boolean(

    fuzzyPhrase(
      text,
      [
        "today",
        "tomorrow",
        "tommorow",
        "tomorow",
        "day after tomorrow",
        "yesterday",
        "morning",
        "afternoon",
        "evening",
        "tonight",
        "next monday",
        "next tuesday",
        "next wednesday",
        "next thursday",
        "next friday",
        "next saturday",
        "next sunday",

        "आज",
        "कल",
        "सुबह",
        "दोपहर",
        "शाम",

        "ఈరోజు",
        "రేపు",
        "ఉదయం",
        "మధ్యాహ్నం",
        "సాయంత్రం",

      ]
    ) ||

    /\b\d{4}[-/.]\d{1,2}[-/.]\d{1,2}\b/.test(
      text
    ) ||

    /\b\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}\b/.test(
      text
    )

  );

}


export function hasBookingTimeSignal(
  message
) {

  const text =
    normalizeText(
      message
    );


  return Boolean(

    /\b\d{1,2}\s*(?::|[.])\s*\d{1,2}\s*(?:am|pm)?\b/i.test(
      text
    ) ||

    /\b\d{1,2}\s*(?:am|pm)\b/i.test(
      text
    ) ||

    /\b\d{1,2}\s*(?:to|-)\s*\d{1,2}(?::\d{1,2})?\s*(?:am|pm)?\b/i.test(
      text
    ) ||

    fuzzyPhrase(
      text,
      [
        "morning",
        "afternoon",
        "evening",
        "night",
        "सुबह",
        "दोपहर",
        "शाम",
        "ఉదయం",
        "మధ్యాహ్నం",
        "సాయంత్రం",
      ]
    )

  );

}


/* =========================================================
   SEMANTIC KNOWLEDGE TOPICS
========================================================= */

function detectKnowledgeTopic(
  text
) {

  /*
   * CROPS
   */

  if (
    fuzzyPhrase(
      text,
      [
        "available crops",
        "what crops are available",
        "which crops are available",
        "crops available",
        "available crop",
        "which crop can i sell",
        "what can i sell",
        "what crops can i sell",
        "crop list",
        "crop options",
        "crops",

        "उपलब्ध फसल",
        "कौन सी फसल",
        "कौन सी फसल बेच सकते हैं",
        "फसल उपलब्ध",
        "फसलों की सूची",

        "ఏ పంటలు అందుబాటులో ఉన్నాయి",
        "అందుబాటులో ఉన్న పంటలు",
        "ఏ పంట అమ్మవచ్చు",
        "పంటల జాబితా",
      ]
    )
  ) {

    return "crops";

  }


  /*
   * CENTERS
   */

  if (
    fuzzyPhrase(
      text,
      [
        "centers",
        "center",
        "centres",
        "centre",
        "centeers",
        "procurement centers",
        "procurement center",
        "procurement centres",
        "procurement centre",
        "where are the centers",
        "which center",
        "which centers",
        "nearby center",
        "nearest center",

        "केंद्र",
        "केंद्रों",
        "खरीद केंद्र",
        "कौन सा केंद्र",

        "కేంద్రాలు",
        "కొనుగోలు కేంద్రం",
        "ఏ కేంద్రం",
      ]
    )
  ) {

    return "booking-centers";

  }


  /*
   * DATES
   */

  if (
    fuzzyPhrase(
      text,
      [
        "available dates",
        "dates available",
        "which dates",
        "what dates are available",
        "available day",
        "available days",
        "booking dates",
        "procurement dates",

        "उपलब्ध तारीख",
        "उपलब्ध तारीखें",
        "कौन सी तारीख",
        "बुकिंग की तारीख",

        "అందుబాటులో ఉన్న తేదీలు",
        "ఏ తేదీలు",
        "బుకింగ్ తేదీలు",
      ]
    )
  ) {

    return "booking-dates";

  }


  /*
   * TIMINGS / SLOTS
   */

  if (
    fuzzyPhrase(
      text,
      [
        "available timings",
        "available timing",
        "available time",
        "available times",
        "available slots",
        "which slots",
        "what slots",
        "what times are available",
        "timings",
        "timmings",
        "timming",
        "slot timings",
        "booking timings",
        "procurement timings",
        "morning slots",
        "evening slots",

        "उपलब्ध समय",
        "उपलब्ध स्लॉट",
        "कौन सा स्लॉट",
        "बुकिंग समय",
        "समय क्या है",

        "అందుబాటులో ఉన్న సమయాలు",
        "అందుబాటులో ఉన్న స్లాట్లు",
        "ఏ స్లాట్లు",
        "బుకింగ్ సమయం",
      ]
    )
  ) {

    return "booking-timings";

  }


  /*
   * TOKEN
   */

  if (
    fuzzyPhrase(
      text,
      [
        "my token",
        "latest token",
        "current token",
        "last token",
        "show token",
        "token number",
        "what is my token",
        "where is my token",
        "token details",
        "token status",

        "मेरा टोकन",
        "लेटेस्ट टोकन",
        "वर्तमान टोकन",
        "मेरा टोकन नंबर",
        "टोकन नंबर",

        "నా టోకెన్",
        "లేటెస్ట్ టోకెన్",
        "ప్రస్తుత టోకెన్",
        "టోకెన్ నంబర్",
      ]
    )
  ) {

    return "token";

  }


  /*
   * BOOKING
   */

  if (
    fuzzyPhrase(
      text,
      [
        "my booking",
        "my bookings",
        "booking details",
        "booking detail",
        "booking status",
        "latest booking",
        "current booking",
        "last booking",
        "recent booking",
        "what is my booking",
        "show my booking",
        "where is my booking",

        "मेरी बुकिंग",
        "मेरी बुकिंग का विवरण",
        "बुकिंग विवरण",
        "बुकिंग स्थिति",

        "నా బుకింగ్",
        "నా బుకింగ్స్",
        "బుకింగ్ వివరాలు",
        "బుకింగ్ స్థితి",
      ]
    )
  ) {

    return "booking";

  }


  /*
   * HISTORY
   */

  if (
    fuzzyPhrase(
      text,
      [
        "booking history",
        "my booking history",
        "procurement history",
        "my history",
        "past bookings",
        "previous bookings",
        "old bookings",
        "recent bookings",
        "booking records",
        "past procurement",

        "बुकिंग इतिहास",
        "मेरी बुकिंग हिस्ट्री",
        "पिछली बुकिंग",
        "पुरानी बुकिंग",

        "బుకింగ్ చరిత్ర",
        "నా బుకింగ్ హిస్టరీ",
        "గత బుకింగ్స్",
      ]
    )
  ) {

    return "history";

  }


  /*
   * PAYMENTS
   */

  if (
    fuzzyPhrase(
      text,
      [
        "my payment",
        "my payments",
        "payment status",
        "payment history",
        "recent payment",
        "latest payment",
        "payment received",
        "when will i get payment",
        "have i been paid",
        "money received",
        "payment record",
        "payment details",

        "मेरा पेमेंट",
        "मेरी भुगतान स्थिति",
        "भुगतान स्थिति",
        "भुगतान इतिहास",
        "पैसे मिले",
        "भुगतान कब मिलेगा",

        "నా పేమెంట్",
        "చెల్లింపు స్థితి",
        "చెల్లింపు చరిత్ర",
        "పేమెంట్ ఎప్పుడు",
      ]
    )
  ) {

    return "payments";

  }


  /*
   * QR
   */

  if (
    fuzzyPhrase(
      text,
      [
        "qr",
        "qr code",
        "my qr",
        "download qr",
        "download my qr",
        "show qr",
        "booking qr",
        "token qr",
        "qr for this token",
        "qr of this booking",
        "qr code for yesterday",
        "qr code for my booking",

        "क्यूआर",
        "क्यूआर कोड",
        "मेरा क्यूआर",
        "क्यूआर डाउनलोड",
        "टोकन का क्यूआर",

        "క్యూఆర్",
        "క్యూఆర్ కోడ్",
        "నా క్యూఆర్",
      ]
    )
  ) {

    return "qr";

  }


  /*
   * RECEIPT
   */

  if (
    fuzzyPhrase(
      text,
      [
        "receipt",
        "my receipt",
        "download receipt",
        "download my receipt",
        "booking receipt",
        "token receipt",
        "receipt for this booking",
        "receipt of yesterday",
        "receipt for yesterday",
        "show receipt",

        "रसीद",
        "मेरी रसीद",
        "रसीद डाउनलोड",
        "बुकिंग रसीद",

        "రసీదు",
        "నా రసీదు",
        "రసీదు డౌన్లోడ్",
      ]
    )
  ) {

    return "receipt";

  }


  /*
   * CANCELLATION
   */

  if (
    fuzzyPhrase(
      text,
      [
        "cancel booking",
        "cancel my booking",
        "cancel this booking",
        "cancel slot",
        "cancel my slot",
        "can i cancel",
        "want to cancel",
        "delete booking",
        "remove booking",

        "बुकिंग रद्द",
        "मेरी बुकिंग रद्द",
        "स्लॉट रद्द",
        "बुकिंग कैंसल",

        "బుకింగ్ రద్దు",
        "నా బుకింగ్ రద్దు",
        "స్లాట్ రద్దు",
      ]
    )
  ) {

    return "cancellation";

  }


  return null;

}


/* =========================================================
   LOCAL INTENT DETECTION
========================================================= */

export function detectIntent(
  message,
  currentPath = ""
) {

  const text =
    normalizeText(
      message
    );


  if (
    !text
  ) {

    return createResult();

  }


  /*
   * -------------------------------------------------------
   * BACK
   * -------------------------------------------------------
   */

  if (
    isBackRequest(
      text
    )
  ) {

    return createResult(
      "GO_BACK",
      0.99
    );

  }


  /*
   * -------------------------------------------------------
   * CURRENT PAGE
   * -------------------------------------------------------
   */

  if (
    isCurrentPageQuestion(
      text
    )
  ) {

    return createResult(
      "SHOW_CURRENT_PAGE",
      0.99
    );

  }


  /*
   * -------------------------------------------------------
   * BOOKING
   * -------------------------------------------------------
   */

  const bookingMatch =
    hasDestination(
      text,
      "OPEN_BOOKING"
    );


  const extracted =
    extractBookingDetails(
      text
    );


  const bookingDateSignal =
    hasBookingDateSignal(
      text
    );


  const bookingTimeSignal =
    hasBookingTimeSignal(
      text
    );


  /*
   * Any explicit booking phrase.
   */

  if (
    bookingMatch
  ) {

    const navigation =
      hasNavigationVerb(
        text
      );

    const question =
      looksLikeQuestion(
        text
      );


    if (
      extracted ||
      bookingDateSignal ||
      bookingTimeSignal
    ) {

      return createResult(
        "OPEN_BOOKING",
        0.99,
        {

          booking:
            extracted,

          semanticTopic:
            "booking",

          hasBookingDate:
            bookingDateSignal,

          hasBookingTime:
            bookingTimeSignal,

        }
      );

    }


    if (
      navigation
    ) {

      return createResult(
        "OPEN_BOOKING",
        0.97,
        {

          booking:
            extracted,

        }
      );

    }


    if (
      !question
    ) {

      return createResult(
        "OPEN_BOOKING",
        0.96,
        {

          booking:
            extracted,

        }
      );

    }


    return createResult(
      "NONE",
      0,
      {

        semanticTopic:
          "booking",

      }
    );

  }


  /*
   * -------------------------------------------------------
   * BOOKING INFORMATION
   * -------------------------------------------------------
   */

  const knowledgeTopic =
    detectKnowledgeTopic(
      text
    );


  if (
    knowledgeTopic
  ) {

    return createResult(
      "NONE",
      0,
      {

        semanticTopic:
          knowledgeTopic,

        booking:
          extracted,

      }
    );

  }


  /*
   * -------------------------------------------------------
   * NATURAL BOOKING DETAILS WITHOUT "BOOK"
   * -------------------------------------------------------
   *
   * Examples:
   *
   *   300 kg wheat tomorrow
   *   tomorrow
   *   8 to 830
   *   morning
   *
   * The booking controller can combine these with
   * the existing draft.
   * -------------------------------------------------------
   */

  if (
    extracted &&
    (
      bookingDateSignal ||
      bookingTimeSignal
    )
  ) {

    return createResult(
      "OPEN_BOOKING",
      0.97,
      {

        booking:
          extracted,

        semanticTopic:
          "booking",

        hasBookingDate:
          bookingDateSignal,

        hasBookingTime:
          bookingTimeSignal,

      }
    );

  }


  /*
   * -------------------------------------------------------
   * OTHER DESTINATIONS
   * -------------------------------------------------------
   */

  const destinationOrder = [

    "OPEN_HELP",
    "OPEN_NOTIFICATIONS",
    "OPEN_PAYMENTS",
    "OPEN_HISTORY",
    "OPEN_TOKEN",
    "OPEN_SETTINGS",
    "OPEN_HOME",

  ];


  for (
    const action of
    destinationOrder
  ) {

    if (
      !hasDestination(
        text,
        action
      )
    ) {

      continue;

    }


    const question =
      looksLikeQuestion(
        text
      );


    const navigate =
      shouldNavigateToDestination(
        text,
        action
      );


    if (
      question &&
      !navigate
    ) {

      let semanticTopic =
        null;


      if (
        action ===
        "OPEN_PAYMENTS"
      ) {

        semanticTopic =
          "payments";

      } else if (
        action ===
        "OPEN_HISTORY"
      ) {

        semanticTopic =
          "history";

      } else if (
        action ===
        "OPEN_TOKEN"
      ) {

        semanticTopic =
          "token";

      } else if (
        action ===
        "OPEN_NOTIFICATIONS"
      ) {

        semanticTopic =
          "notifications";

      } else if (
        action ===
        "OPEN_BOOKING"
      ) {

        semanticTopic =
          "booking";

      }


      return createResult(
        "NONE",
        0,
        {

          semanticTopic,

          booking:
            extracted,

        }
      );

    }


    if (
      navigate
    ) {

      return createResult(
        action,
        hasNavigationVerb(
          text
        )
          ? 0.99
          : 0.93
      );

    }

  }


  /*
   * -------------------------------------------------------
   * NATURAL BOOKING REQUESTS
   * -------------------------------------------------------
   */

  if (
    fuzzyPhrase(
      text,
      [
        "take me to booking",
        "take me to the booking page",
        "take me to a place where i can book",
        "take me somewhere to book",
        "where i can book a slot",
        "where i can book",
        "place to book a slot",

        "मुझे बुकिंग वाले पेज पर ले चलो",
        "जहाँ से बुकिंग कर सकूँ वहाँ ले चलो",

        "బుకింగ్ చేయగల పేజీకి తీసుకెళ్లండి",

      ]
    )
  ) {

    return createResult(
      "OPEN_BOOKING",
      0.98,
      {

        booking:
          extracted,

      }
    );

  }


  /*
   * -------------------------------------------------------
   * BOOKING DATA + BOOKING WORD
   * -------------------------------------------------------
   */

  if (
    extracted &&
    containsAny(
      text,
      [
        "book",
        "booking",
        "slot",
        "procurement",
        "बुक",
        "बुकिंग",
        "स्लॉट",
        "बिक्री",
        "బుక్",
        "బుకింగ్",
        "స్లాట్",
      ]
    )
  ) {

    return createResult(
      "OPEN_BOOKING",
      0.97,
      {

        booking:
          extracted,

      }
    );

  }


  /*
   * -------------------------------------------------------
   * NO LOCAL ACTION
   * -------------------------------------------------------
   */

  return createResult(
    "NONE",
    0
  );

}


/* =========================================================
   COMMAND CLASSIFICATION
========================================================= */

export function classifyCommand(
  message,
  currentPath = ""
) {

  return {

    text:
      String(
        message || ""
      )
        .trim()
        .replace(
          /\s+/g,
          " "
        ),

    normalized:
      normalizeText(
        message
      ),

    intent:
      detectIntent(
        message,
        currentPath
      ),

    currentPath,

    currentPage:
      getPageContext(
        currentPath
      ),

    timestamp:
      Date.now(),

  };

}


/* =========================================================
   CONFIRMATIONS
========================================================= */

const CONFIRMATIONS = [

  "yes",
  "yeah",
  "yep",
  "yup",
  "okay",
  "ok",
  "k",
  "sure",
  "do it",
  "do that",
  "go ahead",
  "continue",
  "open it",
  "open that",
  "take me there",
  "please do",
  "yes please",
  "go for it",
  "lets go",
  "let's go",
  "proceed",

  "हाँ",
  "हां",
  "हाँ करो",
  "हां करो",
  "करो",
  "कर दीजिए",
  "कर दो",
  "ठीक है",
  "ठीक",
  "आगे बढ़ो",

  "అవును",
  "సరే",
  "చేయండి",
  "చేయి",
  "ముందుకు వెళ్దాం",

];


const NEGATIONS = [

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


export function isConfirmation(
  message
) {

  const text =
    normalizeText(
      message
    );


  if (
    !text
  ) {

    return false;

  }


  if (
    looksLikeQuestion(
      text
    )
  ) {

    return false;

  }


  const wordCount =
    tokenize(
      text
    ).length;


  if (
    wordCount >
    6
  ) {

    return containsAny(
      text,
      [
        "go ahead and do it",
        "yes please do it",
        "okay open it",
        "yes open it",
        "ठीक है खोलो",
        "हाँ खोलो",
        "अवश्य करो",
        "అవును తెరవండి",
      ]
    );

  }


  return containsAny(
    text,
    CONFIRMATIONS
  );

}


export function isNegative(
  message
) {

  const text =
    normalizeText(
      message
    );


  if (
    !text
  ) {

    return false;

  }


  return containsAny(
    text,
    NEGATIONS
  );

}


/* =========================================================
   PAGE CONTEXT
========================================================= */

export function getPageContext(
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
    pathname ||
    "Unknown Page"
  );

}


/* =========================================================
   CURRENT PAGE QUESTION
========================================================= */

export function isCurrentPageQuestion(
  message
) {

  const text =
    normalizeText(
      message
    );


  if (
    !text
  ) {

    return false;

  }


  return containsAny(
    text,
    [

      "where are we now",
      "where are we",
      "where am i",
      "where am i now",
      "what page am i on",
      "which page am i on",
      "which page is this",
      "what page is this",
      "what page are we on",
      "which page are we on",
      "current page",
      "what is current page",
      "what is the current page",

      "मैं अभी कहाँ हूँ",
      "मैं कहाँ हूँ",
      "मैं किस पेज पर हूँ",
      "यह कौन सा पेज है",
      "अभी कौन सा पेज है",
      "हम कहाँ हैं",

      "నేను ఇప్పుడు ఎక్కడ ఉన్నాను",
      "నేను ఎక్కడ ఉన్నాను",
      "ఇది ఏ పేజీ",
      "మనం ఏ పేజీలో ఉన్నాం",
      "ప్రస్తుత పేజీ",

    ]
  );

}


/* =========================================================
   CURRENT PAGE REPLY
========================================================= */

export function getCurrentPageReply(
  pathname,
  language
) {

  const page =
    getPageContext(
      pathname
    );


  if (
    language ===
    "hi"
  ) {

    const pages = {

      "Farmer Home":
        "अभी हम किसान डैशबोर्ड पर हैं।",

      "Book Procurement Slot":
        "अभी हम खरीद स्लॉट बुकिंग पेज पर हैं।",

      "Token / Booking Tracking":
        "अभी हम टोकन और बुकिंग ट्रैकिंग पेज पर हैं।",

      "Procurement History":
        "अभी हम खरीद इतिहास पेज पर हैं।",

      "Payment History":
        "अभी हम भुगतान इतिहास पेज पर हैं।",

      "Farmer Settings":
        "अभी हम किसान सेटिंग्स पेज पर हैं।",

      "Farmer Help":
        "अभी हम किसान सहायता पेज पर हैं।",

      "Farmer Login":
        "अभी हम किसान लॉगिन पेज पर हैं।",

      "Farmer Registration":
        "अभी हम किसान पंजीकरण पेज पर हैं।",

    };


    return (
      pages[
        page
      ] ||
      `अभी हम ${page} पर हैं।`
    );

  }


  if (
    language ===
    "te"
  ) {

    const pages = {

      "Farmer Home":
        "ప్రస్తుతం మనం రైతు డ్యాష్‌బోర్డ్‌లో ఉన్నాము.",

      "Book Procurement Slot":
        "ప్రస్తుతం మనం కొనుగోలు స్లాట్ బుకింగ్ పేజీలో ఉన్నాము.",

      "Token / Booking Tracking":
        "ప్రస్తుతం మనం టోకెన్ మరియు బుకింగ్ ట్రాకింగ్ పేజీలో ఉన్నాము.",

      "Procurement History":
        "ప్రస్తుతం మనం కొనుగోలు చరిత్ర పేజీలో ఉన్నాము.",

      "Payment History":
        "ప్రస్తుతం మనం చెల్లింపు చరిత్ర పేజీలో ఉన్నాము.",

      "Farmer Settings":
        "ప్రస్తుతం మనం రైతు సెట్టింగ్స్ పేజీలో ఉన్నాము.",

      "Farmer Help":
        "ప్రస్తుతం మనం రైతు సహాయ పేజీలో ఉన్నాము.",

      "Farmer Login":
        "ప్రస్తుతం మనం రైతు లాగిన్ పేజీలో ఉన్నాము.",

      "Farmer Registration":
        "ప్రస్తుతం మనం రైతు నమోదు పేజీలో ఉన్నాము.",

    };


    return (
      pages[
        page
      ] ||
      `ప్రస్తుతం మనం ${page}లో ఉన్నాము.`
    );

  }


  return (
    `We’re currently on ${page}.`
  );

}


/* =========================================================
   ACTION REPLIES
========================================================= */

export function getActionReply(
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
        "Taking you back to the previous page.",

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
        "मैं आपको पिछले पेज पर ले जा रहा हूँ।",

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
   ACTION REGISTRY SANITY CHECK
========================================================= */

if (
  typeof ACTIONS !==
  "undefined" &&
  ACTIONS
) {

  /*
   * This intentionally does not throw.
   *
   * A missing action should not crash the whole assistant.
   */

  const expectedActions = [

    "OPEN_HOME",
    "OPEN_BOOKING",
    "OPEN_TOKEN",
    "OPEN_HISTORY",
    "OPEN_PAYMENTS",
    "OPEN_SETTINGS",
    "OPEN_HELP",
    "OPEN_NOTIFICATIONS",

  ];


  for (
    const action of
    expectedActions
  ) {

    if (
      !ACTIONS[action]
    ) {

      console.warn(
        `[KrishiSetu AI] Missing action definition: ${action}`
      );

    }

  }

}