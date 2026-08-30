
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  Info,
  Leaf,
  LoaderCircle,
  MapPin,
  Scale,
  ShieldCheck,
  Wheat,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router";

import Header from "../../components/Header";
import Button from "../../components/Button";
import CropIcon from "../../components/CropIcon";

import {
  useLanguage,
} from "../../translations/LanguageContext";

import {
  getCurrentFarmer,
  getState,
} from "../../data/appStore";

import {
  syncBookingToPrototype,
} from "../../data/bookingBridge";


const API_URL =
  import.meta.env.VITE_API_URL;


const languageCopy = {

  en: {

    bookingEyebrow:
      "FARMER BOOKING",

    liveAvailability:
      "Live availability",

    title:
      "Plan your procurement visit.",

    description:
      "Tell us what you are bringing, choose your procurement center and reserve a time window that works for you.",

    secureTitle:
      "Secure booking record",

    secureText:
      "Your booking is linked to your farmer account.",

    reserveTitle:
      "Reserve your arrival window",

    reserveText:
      "Choose from currently available slots.",

    tokenTitle:
      "Get a digital token",

    tokenText:
      "The token is generated after confirmation.",

    stepOne:
      "STEP 1",

    produceTitle:
      "What are you bringing?",

    produceDescription:
      "Select your crop and enter the approximate quantity you expect to bring.",

    crop:
      "Crop / Produce",

    cropSelected:
      "Produce selected for this visit",

    agriculturalProduce:
      "Agricultural produce",

    quantity:
      "Estimated quantity",

    quantityHelp:
      "Approximate weight is enough. Final weight is recorded at the center.",

    quantityTip:
      "You do not need to know the exact weight now. Give us your best estimate; the procurement team will record the actual quantity during weighing.",

    stepTwo:
      "STEP 2",

    whereTitle:
      "Where will you bring it?",

    whereDescription:
      "Select the procurement center where you plan to deliver your produce.",

    center:
      "Procurement center",

    selectCenter:
      "Select procurement center",

    chooseCenter:
      "Choose a center for your booking",

    openWindows:
      "Open procurement windows",

    produceIntake:
      "Produce intake",

    bookingsSlot:
      "bookings / slot",

    near:
      "Near",

    preferredDate:
      "Preferred arrival date",

    chooseDate:
      "Choose a date",

    readyCheck:
      "READY TO CHECK?",

    findWindow:
      "Find an available arrival window",

    checkText:
      "We'll check the latest bookings for your selected center and date.",

    checking:
      "Checking...",

    review:
      "Review details",

    yourBooking:
      "YOUR BOOKING",

    estimated:
      "estimated",

    notEntered:
      "Not entered",

    chooseWindow:
      "Choose a window below",

    bookingStatus:
      "BOOKING STATUS",

    readyConfirm:
      "Ready to confirm",

    chooseArrival:
      "Choose an arrival window",

    detailsProgress:
      "Details in progress",

    finalSecurity:
      "Your final token is generated only after the booking is successfully saved.",

    needHelp:
      "Need help choosing a slot?",

    helpText:
      "Pick a window you can comfortably reach. Avoid arriving significantly earlier than your assigned time.",

    bookingHelp:
      "Booking help",

    windowsAvailable:
      "Windows available",

    chooseArrivalWindow:
      "Choose your arrival window",

    availabilityText:
      "Select a time when you can reach the procurement center comfortably. Your token will be tied to this window.",

    availableWindows:
      "Available windows",

    openCapacity:
      "Open capacity",

    placesRemaining:
      "places remaining",

    selectedDate:
      "SELECTED DATE",

    limitedAvailability:
      "Limited availability",

    nearlyFull:
      "Nearly full",

    goodAvailability:
      "Good availability",

    full:
      "Full",

    noPlaces:
      "No places remaining",

    selectedWindow:
      "SELECTED ARRIVAL WINDOW",

    change:
      "Change",

    finalStep:
      "FINAL STEP",

    checkEverything:
      "Check everything before confirming.",

    finalText:
      "Once confirmed, your booking will be saved and a unique token will be generated.",

    whatHappens:
      "What happens after confirmation?",

    afterText:
      "Your booking is saved to KrishiSetu, assigned a unique token, and made available to the procurement team. You can then open the token page to follow the booking status.",

    arriveText:
      "Please arrive during your selected window and keep your produce ready.",

    saving:
      "Saving booking...",

    confirm:
      "Confirm booking",

    traceable:
      "Your booking is traceable",

    traceableText:
      "A unique token connects your booking with the procurement workflow.",

    arriveDuring:
      "Arrive during your window",

    arriveDuringText:
      "Choosing a suitable time helps keep the procurement queue organised.",

    assistance:
      "Need assistance?",

    assistanceText:
      "Read booking guidance and common questions.",

    statusReady:
      "Ready to confirm",

  },


  hi: {

    bookingEyebrow:
      "किसान बुकिंग",

    liveAvailability:
      "लाइव उपलब्धता",

    title:
      "अपनी खरीद यात्रा की योजना बनाएं।",

    description:
      "बताएं कि आप क्या लेकर आ रहे हैं, खरीद केंद्र चुनें और अपने लिए सही समय बुक करें।",

    secureTitle:
      "सुरक्षित बुकिंग रिकॉर्ड",

    secureText:
      "आपकी बुकिंग आपके किसान खाते से जुड़ी है।",

    reserveTitle:
      "आने का समय सुरक्षित करें",

    reserveText:
      "उपलब्ध समय स्लॉट में से चुनें।",

    tokenTitle:
      "डिजिटल टोकन प्राप्त करें",

    tokenText:
      "पुष्टि के बाद टोकन बनाया जाएगा।",

    stepOne:
      "चरण 1",

    produceTitle:
      "आप क्या लेकर आ रहे हैं?",

    produceDescription:
      "अपनी फसल चुनें और अनुमानित मात्रा दर्ज करें।",

    crop:
      "फसल / उपज",

    cropSelected:
      "इस यात्रा के लिए चुनी गई उपज",

    agriculturalProduce:
      "कृषि उपज",

    quantity:
      "अनुमानित मात्रा",

    quantityHelp:
      "अनुमानित वजन पर्याप्त है। अंतिम वजन केंद्र पर दर्ज होगा।",

    quantityTip:
      "अभी सटीक वजन जानना जरूरी नहीं है। अनुमानित मात्रा दें; अंतिम मात्रा वजन के समय दर्ज की जाएगी।",

    stepTwo:
      "चरण 2",

    whereTitle:
      "आप इसे कहाँ लाएंगे?",

    whereDescription:
      "वह खरीद केंद्र चुनें जहाँ आप अपनी उपज लाना चाहते हैं।",

    center:
      "खरीद केंद्र",

    selectCenter:
      "खरीद केंद्र चुनें",

    chooseCenter:
      "अपनी बुकिंग के लिए केंद्र चुनें",

    openWindows:
      "खुले खरीद समय",

    produceIntake:
      "उपज स्वीकार",

    bookingsSlot:
      "बुकिंग / स्लॉट",

    near:
      "पास",

    preferredDate:
      "पसंदीदा आने की तारीख",

    chooseDate:
      "तारीख चुनें",

    readyCheck:
      "जाँच के लिए तैयार?",

    findWindow:
      "उपलब्ध समय खोजें",

    checkText:
      "हम आपके चुने हुए केंद्र और तारीख की नवीनतम बुकिंग जाँचेंगे।",

    checking:
      "जाँच हो रही है...",

    review:
      "विवरण की समीक्षा करें",

    yourBooking:
      "आपकी बुकिंग",

    estimated:
      "अनुमानित",

    notEntered:
      "दर्ज नहीं किया गया",

    chooseWindow:
      "नीचे समय चुनें",

    bookingStatus:
      "बुकिंग स्थिति",

    readyConfirm:
      "पुष्टि के लिए तैयार",

    chooseArrival:
      "आने का समय चुनें",

    detailsProgress:
      "विवरण प्रगति में",

    finalSecurity:
      "बुकिंग सफलतापूर्वक सेव होने के बाद आपका टोकन बनाया जाएगा।",

    needHelp:
      "समय चुनने में सहायता चाहिए?",

    helpText:
      "ऐसा समय चुनें जब आप आसानी से केंद्र पहुँच सकें। अपने समय से बहुत पहले आने से बचें।",

    bookingHelp:
      "बुकिंग सहायता",

    windowsAvailable:
      "उपलब्ध समय",

    chooseArrivalWindow:
      "अपना आने का समय चुनें",

    availabilityText:
      "ऐसा समय चुनें जब आप आराम से खरीद केंद्र पहुँच सकें। आपका टोकन इसी समय से जुड़ा होगा।",

    availableWindows:
      "उपलब्ध समय",

    openCapacity:
      "उपलब्ध क्षमता",

    placesRemaining:
      "स्थान शेष",

    selectedDate:
      "चयनित तारीख",

    limitedAvailability:
      "सीमित उपलब्धता",

    nearlyFull:
      "लगभग पूरा",

    goodAvailability:
      "अच्छी उपलब्धता",

    full:
      "पूरा",

    noPlaces:
      "कोई स्थान शेष नहीं",

    selectedWindow:
      "चयनित आने का समय",

    change:
      "बदलें",

    finalStep:
      "अंतिम चरण",

    checkEverything:
      "पुष्टि से पहले सभी विवरण जाँचें।",

    finalText:
      "पुष्टि के बाद आपकी बुकिंग सेव होगी और एक विशेष टोकन बनाया जाएगा।",

    whatHappens:
      "पुष्टि के बाद क्या होगा?",

    afterText:
      "आपकी बुकिंग KrishiSetu में सेव होगी, एक टोकन दिया जाएगा और खरीद टीम को उपलब्ध कराई जाएगी।",

    arriveText:
      "चयनित समय के दौरान आएं और अपनी उपज तैयार रखें।",

    saving:
      "बुकिंग सेव हो रही है...",

    confirm:
      "बुकिंग की पुष्टि करें",

    traceable:
      "आपकी बुकिंग ट्रैक की जा सकती है",

    traceableText:
      "एक अद्वितीय टोकन आपकी बुकिंग को खरीद प्रक्रिया से जोड़ता है।",

    arriveDuring:
      "अपने समय पर आएं",

    arriveDuringText:
      "उपयुक्त समय चुनने से खरीद कतार व्यवस्थित रहती है।",

    assistance:
      "सहायता चाहिए?",

    assistanceText:
      "बुकिंग मार्गदर्शन और सामान्य प्रश्न देखें।",

    statusReady:
      "पुष्टि के लिए तैयार",

  },


  te: {

    bookingEyebrow:
      "రైతు బుకింగ్",

    liveAvailability:
      "లైవ్ అందుబాటు",

    title:
      "మీ కొనుగోలు సందర్శనను ప్లాన్ చేసుకోండి.",

    description:
      "మీరు తీసుకువచ్చే పంటను తెలియజేసి, కొనుగోలు కేంద్రాన్ని ఎంచుకుని, మీకు అనుకూలమైన సమయాన్ని బుక్ చేసుకోండి.",

    secureTitle:
      "సురక్షిత బుకింగ్ రికార్డు",

    secureText:
      "మీ బుకింగ్ మీ రైతు ఖాతాతో అనుసంధానించబడింది.",

    reserveTitle:
      "రాక సమయాన్ని రిజర్వ్ చేయండి",

    reserveText:
      "అందుబాటులో ఉన్న సమయాల్లో ఎంచుకోండి.",

    tokenTitle:
      "డిజిటల్ టోకెన్ పొందండి",

    tokenText:
      "నిర్ధారణ తర్వాత టోకెన్ రూపొందించబడుతుంది.",

    stepOne:
      "దశ 1",

    produceTitle:
      "మీరు ఏమి తీసుకువస్తున్నారు?",

    produceDescription:
      "మీ పంటను ఎంచుకుని అంచనా పరిమాణాన్ని నమోదు చేయండి.",

    crop:
      "పంట / ఉత్పత్తి",

    cropSelected:
      "ఈ సందర్శన కోసం ఎంచుకున్న పంట",

    agriculturalProduce:
      "వ్యవసాయ ఉత్పత్తి",

    quantity:
      "అంచనా పరిమాణం",

    quantityHelp:
      "అంచనా బరువు సరిపోతుంది. తుది బరువు కేంద్రంలో నమోదు చేయబడుతుంది.",

    quantityTip:
      "ఇప్పుడే ఖచ్చితమైన బరువు తెలుసుకోవాల్సిన అవసరం లేదు. అంచనా పరిమాణాన్ని నమోదు చేయండి.",

    stepTwo:
      "దశ 2",

    whereTitle:
      "మీరు దీనిని ఎక్కడికి తీసుకువస్తారు?",

    whereDescription:
      "మీ పంటను తీసుకురావాలనుకునే కొనుగోలు కేంద్రాన్ని ఎంచుకోండి.",

    center:
      "కొనుగోలు కేంద్రం",

    selectCenter:
      "కొనుగోలు కేంద్రాన్ని ఎంచుకోండి",

    chooseCenter:
      "మీ బుకింగ్ కోసం కేంద్రాన్ని ఎంచుకోండి",

    openWindows:
      "అందుబాటులో ఉన్న కొనుగోలు సమయాలు",

    produceIntake:
      "ఉత్పత్తి స్వీకరణ",

    bookingsSlot:
      "బుకింగ్ / స్లాట్",

    near:
      "సమీపంలో",

    preferredDate:
      "ఇష్టమైన రాక తేదీ",

    chooseDate:
      "తేదీని ఎంచుకోండి",

    readyCheck:
      "తనిఖీ చేయడానికి సిద్ధంగా ఉన్నారా?",

    findWindow:
      "అందుబాటులో ఉన్న సమయాన్ని కనుగొనండి",

    checkText:
      "మీరు ఎంచుకున్న కేంద్రం మరియు తేదీకి సంబంధించిన తాజా బుకింగ్‌లను తనిఖీ చేస్తాము.",

    checking:
      "తనిఖీ చేస్తోంది...",

    review:
      "వివరాలను పరిశీలించండి",

    yourBooking:
      "మీ బుకింగ్",

    estimated:
      "అంచనా",

    notEntered:
      "నమోదు కాలేదు",

    chooseWindow:
      "క్రింద సమయాన్ని ఎంచుకోండి",

    bookingStatus:
      "బుకింగ్ స్థితి",

    readyConfirm:
      "నిర్ధారించడానికి సిద్ధంగా ఉంది",

    chooseArrival:
      "రాక సమయాన్ని ఎంచుకోండి",

    detailsProgress:
      "వివరాలు ప్రగతిలో ఉన్నాయి",

    finalSecurity:
      "బుకింగ్ విజయవంతంగా సేవ్ అయిన తర్వాత మీ టోకెన్ రూపొందించబడుతుంది.",

    needHelp:
      "సమయాన్ని ఎంచుకోవడంలో సహాయం కావాలా?",

    helpText:
      "మీరు సులభంగా కేంద్రానికి చేరుకోగల సమయాన్ని ఎంచుకోండి.",

    bookingHelp:
      "బుకింగ్ సహాయం",

    windowsAvailable:
      "అందుబాటులో ఉన్న సమయాలు",

    chooseArrivalWindow:
      "మీ రాక సమయాన్ని ఎంచుకోండి",

    availabilityText:
      "మీరు సౌకర్యంగా కొనుగోలు కేంద్రానికి చేరుకోగల సమయాన్ని ఎంచుకోండి.",

    availableWindows:
      "అందుబాటులో ఉన్న సమయాలు",

    openCapacity:
      "అందుబాటులో ఉన్న సామర్థ్యం",

    placesRemaining:
      "స్థానాలు మిగిలి ఉన్నాయి",

    selectedDate:
      "ఎంచుకున్న తేదీ",

    limitedAvailability:
      "పరిమిత అందుబాటు",

    nearlyFull:
      "దాదాపు నిండింది",

    goodAvailability:
      "మంచి అందుబాటు",

    full:
      "పూర్తి",

    noPlaces:
      "స్థానాలు మిగల్లేదు",

    selectedWindow:
      "ఎంచుకున్న రాక సమయం",

    change:
      "మార్చండి",

    finalStep:
      "చివరి దశ",

    checkEverything:
      "నిర్ధారించే ముందు అన్ని వివరాలను తనిఖీ చేయండి.",

    finalText:
      "నిర్ధారించిన తర్వాత మీ బుకింగ్ సేవ్ చేయబడుతుంది మరియు ప్రత్యేక టోకెన్ రూపొందించబడుతుంది.",

    whatHappens:
      "నిర్ధారణ తర్వాత ఏమి జరుగుతుంది?",

    afterText:
      "మీ బుకింగ్ KrishiSetuలో సేవ్ చేయబడుతుంది, ప్రత్యేక టోకెన్ కేటాయించబడుతుంది మరియు కొనుగోలు బృందానికి అందుబాటులో ఉంటుంది.",

    arriveText:
      "ఎంచుకున్న సమయానికి చేరుకుని మీ పంటను సిద్ధంగా ఉంచండి.",

    saving:
      "బుకింగ్ సేవ్ చేస్తోంది...",

    confirm:
      "బుకింగ్ నిర్ధారించండి",

    traceable:
      "మీ బుకింగ్ ట్రాక్ చేయవచ్చు",

    traceableText:
      "ఒక ప్రత్యేక టోకెన్ మీ బుకింగ్‌ను కొనుగోలు ప్రక్రియతో అనుసంధానిస్తుంది.",

    arriveDuring:
      "మీ సమయానికి రండి",

    arriveDuringText:
      "సరైన సమయాన్ని ఎంచుకోవడం కొనుగోలు క్యూను సక్రమంగా ఉంచుతుంది.",

    assistance:
      "సహాయం కావాలా?",

    assistanceText:
      "బుకింగ్ మార్గదర్శకాలు మరియు సాధారణ ప్రశ్నలను చూడండి.",

    statusReady:
      "నిర్ధారించడానికి సిద్ధంగా ఉంది",

  },

};


function FarmerBook() {

  const navigate =
    useNavigate();


  const {
    t,
    language,
  } =
    useLanguage();


  const farmer =
    getCurrentFarmer();


  const appState =
    getState();


  const copy =
    languageCopy[
      language
    ] ||
    languageCopy.en;


  const [
    settings,
    setSettings,
  ] =
    useState({
      slotDuration:
        30,

      advanceBookingDays:
        7,

      maxQuantity:
        5000,

      defaultCapacity:
        20,
    });


  const [
    settingsLoading,
    setSettingsLoading,
  ] =
    useState(true);


  const [
    settingsError,
    setSettingsError,
  ] =
    useState("");


  const [
    centers,
    setCenters,
  ] =
    useState([]);


  const [
    centersLoading,
    setCentersLoading,
  ] =
    useState(true);


  const [
    crop,
    setCrop,
  ] =
    useState(
      ""
    );


  const [
    quantity,
    setQuantity,
  ] =
    useState(
      ""
    );


  const [
    centerId,
    setCenterId,
  ] =
    useState(
      ""
    );


  const [
    date,
    setDate,
  ] =
    useState(
      ""
    );


  const [
    openMenu,
    setOpenMenu,
  ] =
    useState(
      null
    );


  const [
    available,
    setAvailable,
  ] =
    useState(
      false
    );


  const [
    selectedSlot,
    setSelectedSlot,
  ] =
    useState(
      null
    );


  const [
    bookings,
    setBookings,
  ] =
    useState(
      []
    );


  const [
    loadingBookings,
    setLoadingBookings,
  ] =
    useState(
      true
    );


  const [
    loadingAvailability,
    setLoadingAvailability,
  ] =
    useState(
      false
    );


  const [
    confirming,
    setConfirming,
  ] =
    useState(
      false
    );


  const [
    error,
    setError,
  ] =
    useState(
      ""
    );


  const [
    centerSwitchMessage,
    setCenterSwitchMessage,
  ] =
    useState(
      ""
    );


  /*
   * ========================================================
   * CROPS
   * ========================================================
   */

  const crops =
    Array.isArray(
      appState?.crops
    ) &&
    appState.crops.length > 0
      ? appState.crops
      : [
          {
            id:
              "wheat",
            name:
              "Wheat",
          },
          {
            id:
              "paddy",
            name:
              "Paddy",
          },
          {
            id:
              "maize",
            name:
              "Maize",
          },
          {
            id:
              "cotton",
            name:
              "Cotton",
          },
        ];


  /*
   * ========================================================
   * ACTIVE CENTERS
   * ========================================================
   *
   * IMPORTANT:
   * Farmers now use the database centers directly.
   * No hardcoded locationData center list is used here.
   */

  const availableCenters =
    useMemo(
      () =>
        centers.filter(
          center =>
            Number(
              center?.active ??
              1
            ) === 1
        ),
      [
        centers,
      ]
    );


  /*
   * ========================================================
   * INITIAL FORM VALUES
   * ========================================================
   */

  useEffect(() => {

    if (
      !crop &&
      crops.length > 0
    ) {

      const preferredCrop =
        farmer?.primaryCrop ||
        farmer?.primary_crop;


      const cropExists =
        crops.some(
          item =>
            String(
              item.id
            ) ===
            String(
              preferredCrop
            )
        );


      setCrop(
        cropExists
          ? preferredCrop
          : crops[0].id
      );

    }

  }, [
    crops,
    crop,
    farmer?.primaryCrop,
    farmer?.primary_crop,
  ]);


  useEffect(() => {

    const farmerQuantity =
      farmer?.estimatedQuantity ??
      farmer?.estimated_quantity ??
      "";


    if (
      quantity === "" &&
      Number(
        farmerQuantity
      ) > 0
    ) {

      setQuantity(
        String(
          farmerQuantity
        )
      );

    }

  }, [
    farmer?.estimatedQuantity,
    farmer?.estimated_quantity,
    quantity,
  ]);


  /*
   * ========================================================
   * LOAD CENTERS
   * ========================================================
   */

  useEffect(() => {

    let cancelled =
      false;


    async function loadCenters() {

      setCentersLoading(
        true
      );


      try {

        const response =
          await fetch(
            `${API_URL}/centers`
          );


        let data =
          null;


        try {

          data =
            await response.json();

        } catch {

          data =
            null;

        }


        if (
          !response.ok
        ) {

          throw new Error(
            data?.message ||
            "Unable to load procurement centers."
          );

        }


        const rows =
          Array.isArray(
            data?.centers
          )
            ? data.centers
            : [];


        const activeRows =
          rows.filter(
            center =>
              Number(
                center?.active ??
                1
              ) === 1
          );


        if (
          !cancelled
        ) {

          setCenters(
            activeRows
          );

        }

      } catch (
        centerError
      ) {

        console.error(
          "FarmerBook center loading error:",
          centerError
        );


        if (
          !cancelled
        ) {

          setCenters(
            []
          );

          setError(
            centerError?.message ||
            "Unable to load procurement centers."
          );

        }

      } finally {

        if (
          !cancelled
        ) {

          setCentersLoading(
            false
          );

        }

      }

    }


    loadCenters();


    return () => {

      cancelled =
        true;

    };

  }, []);


  /*
   * ========================================================
   * SELECT VALID CENTER
   * ========================================================
   */

  useEffect(() => {

    if (
      availableCenters.length ===
      0
    ) {

      setCenterId(
        ""
      );

      return;

    }


    const preferredCenter =
      farmer?.preferredCenterId ||
      farmer?.preferred_center_id ||
      "";


    const preferredExists =
      availableCenters.some(
        center =>
          String(
            center.id
          ) ===
          String(
            preferredCenter
          )
      );


    const currentExists =
      availableCenters.some(
        center =>
          String(
            center.id
          ) ===
          String(
            centerId
          )
      );


    if (
      preferredExists &&
      !currentExists
    ) {

      setCenterId(
        preferredCenter
      );

      return;

    }


    if (
      !currentExists
    ) {

      setCenterId(
        availableCenters[0].id
      );

    }

  }, [
    availableCenters,
    centerId,
    farmer?.preferredCenterId,
    farmer?.preferred_center_id,
  ]);


  /*
   * ========================================================
   * SELECTED CENTER
   * ========================================================
   */

  const selectedCenter =
    useMemo(
      () =>
        availableCenters.find(
          center =>
            String(
              center.id
            ) ===
            String(
              centerId
            )
        ) ||
        availableCenters[0] ||
        null,
      [
        availableCenters,
        centerId,
      ]
    );


  /*
   * ========================================================
   * SETTINGS
   * ========================================================
   */

  useEffect(() => {

    let cancelled =
      false;


    async function loadSettings() {

      setSettingsLoading(
        true
      );


      setSettingsError(
        ""
      );


      try {

        const response =
          await fetch(
            `${API_URL}/settings`
          );


        let data =
          null;


        try {

          data =
            await response.json();

        } catch {

          data =
            null;

        }


        if (
          !response.ok
        ) {

          throw new Error(
            data?.message ||
            "Unable to load booking settings."
          );

        }


        if (
          !cancelled &&
          data?.settings
        ) {

          setSettings(
            current => ({
              ...current,
              ...data.settings,
            })
          );

        }

      } catch (
        settingsErrorValue
      ) {

        console.error(
          "Booking settings error:",
          settingsErrorValue
        );


        if (
          !cancelled
        ) {

          setSettingsError(
            settingsErrorValue?.message ||
            "Unable to load booking settings."
          );

        }

      } finally {

        if (
          !cancelled
        ) {

          setSettingsLoading(
            false
          );

        }

      }

    }


    loadSettings();


    return () => {

      cancelled =
        true;

    };

  }, []);


  /*
   * ========================================================
   * DATES
   * ========================================================
   */

  const dates =
    useMemo(
      () =>
        generateBookingDates(
          Number(
            settings?.advanceBookingDays ??
            7
          )
        ),
      [
        settings?.advanceBookingDays,
      ]
    );


  useEffect(() => {

    if (
      dates.length ===
      0
    ) {

      setDate(
        ""
      );

      return;

    }


    const valid =
      dates.some(
        item =>
          item.id ===
          date
      );


    if (
      !valid
    ) {

      setDate(
        dates[0].id
      );

    }

  }, [
    dates,
    date,
  ]);


  const selectedDate =
    useMemo(
      () =>
        dates.find(
          item =>
            item.id ===
            date
        ) ||
        dates[0] ||
        null,
      [
        dates,
        date,
      ]
    );


  /*
   * ========================================================
   * SELECTED CROP
   * ========================================================
   */

  const selectedCrop =
    useMemo(
      () =>
        crops.find(
          item =>
            String(
              item?.id
            ) ===
            String(
              crop
            )
        ) ||
        crops[0] ||
        null,
      [
        crops,
        crop,
      ]
    );


  /*
   * ========================================================
   * AVAILABILITY TEMPLATE
   * ========================================================
   */

  const availabilityTemplate =
    useMemo(
      () => {

        if (
          !selectedCenter
        ) {

          return [];

        }


        const openingTime =
          selectedCenter.opening_time ||
          selectedCenter.openingTime ||
          "09:00";


        const closingTime =
          selectedCenter.closing_time ||
          selectedCenter.closingTime ||
          "17:00";


        const duration =
          Number(
            settings?.slotDuration ||
            30
          );


        const capacity =
          getCenterCapacity(
            selectedCenter,
            settings
          );


        return generateTimeSlots(
          openingTime,
          closingTime,
          duration,
          capacity
        );

      },
      [
        selectedCenter,
        settings,
      ]
    );


  /*
   * ========================================================
   * QUANTITY
   * ========================================================
   */

  const estimatedQuantity =
    Number(
      quantity ||
      0
    );


  /*
   * ========================================================
   * AVAILABILITY
   * ========================================================
   */

  const availability =
    useMemo(
      () => {

        if (
          !selectedCenter ||
          !selectedDate
        ) {

          return [];

        }


        return availabilityTemplate.map(
          slot => {

            const booked =
              getBookedCount(
                bookings,
                selectedCenter.id,
                selectedDate.date,
                slot.start,
                slot.end
              );


            const capacity =
              Math.max(
                getCenterCapacity(
                  selectedCenter,
                  settings
                ),
                Number(
                  slot.capacity ||
                  0
                )
              );


            const safeBooked =
              Math.min(
                booked,
                capacity
              );


            const remaining =
              Math.max(
                capacity -
                safeBooked,
                0
              );


            let loadClass =
              "normal";


            if (
              remaining ===
              0
            ) {

              loadClass =
                "full";

            } else if (
              remaining <=
              Math.ceil(
                capacity *
                0.25
              )
            ) {

              loadClass =
                "busy";

            } else if (
              remaining <=
              Math.ceil(
                capacity *
                0.5
              )
            ) {

              loadClass =
                "limited";

            }


            return {

              ...slot,

              capacity,

              booked:
                safeBooked,

              remaining,

              loadClass,

            };

          }
        );

      },
      [
        bookings,
        selectedCenter,
        selectedDate,
        availabilityTemplate,
        settings,
      ]
    );


  /*
   * ========================================================
   * SELECTED SLOT
   * ========================================================
   */

  const selectedSlotRecord =
    useMemo(
      () => {

        if (
          !selectedSlot
        ) {

          return null;

        }


        return (
          availability.find(
            slot =>
              slot.id ===
              selectedSlot.id
          ) ||
          null
        );

      },
      [
        availability,
        selectedSlot,
      ]
    );


  const totalRemaining =
    availability.reduce(
      (
        total,
        slot
      ) =>
        total +
        Number(
          slot?.remaining ||
          0
        ),
      0
    );


  /*
   * ========================================================
   * BOOKING LOAD
   * ========================================================
   */

  useEffect(() => {

    if (
      !farmer?.id
    ) {

      setBookings(
        []
      );

      setLoadingBookings(
        false
      );

      return;

    }


    let cancelled =
      false;


    async function loadBookings() {

      setLoadingBookings(
        true
      );


      try {

        const response =
          await fetch(
            `${API_URL}/bookings`
          );


        let data =
          null;


        try {

          data =
            await response.json();

        } catch {

          data =
            null;

        }


        if (
          !response.ok
        ) {

          throw new Error(
            data?.message ||
            "Unable to load bookings."
          );

        }


        const rows =
          Array.isArray(
            data?.bookings
          )
            ? data.bookings
            : [];


        if (
          !cancelled
        ) {

          setBookings(
            rows
          );

        }

      } catch (
        loadError
      ) {

        console.error(
          "FarmerBook booking load error:",
          loadError
        );


        if (
          !cancelled
        ) {

          setBookings(
            []
          );

          setError(
            loadError?.message ||
            "Unable to load bookings."
          );

        }

      } finally {

        if (
          !cancelled
        ) {

          setLoadingBookings(
            false
          );

        }

      }

    }


    loadBookings();


    return () => {

      cancelled =
        true;

    };

  }, [
    farmer?.id,
  ]);


  /*
   * ========================================================
   * RESET WHEN SELECTION CHANGES
   * ========================================================
   */

  useEffect(() => {

    setAvailable(
      false
    );

    setSelectedSlot(
      null
    );

    setCenterSwitchMessage(
      ""
    );

  }, [
    crop,
    quantity,
    centerId,
    date,
  ]);


  /*
   * ========================================================
   * HELPERS
   * ========================================================
   */

  function tr(
    key,
    fallback
  ) {

    const translated =
      t(
        key,
        fallback
      );


    return (
      translated ||
      fallback
    );

  }


  function cropLabel(
    cropId
  ) {

    const key =
      `crops.${cropId}`;


    const translated =
      tr(
        key,
        ""
      );


    if (
      translated &&
      translated !==
      key
    ) {

      return translated;

    }


    const item =
      crops.find(
        cropItem =>
          String(
            cropItem?.id
          ) ===
          String(
            cropId
          )
      );


    return (
      item?.name ||
      cropId ||
      "Produce"
    );

  }


  function validate() {

    if (
      !farmer?.id
    ) {

      return "Farmer account could not be loaded. Please login again.";

    }


    if (
      !selectedCrop
    ) {

      return "Please select a crop.";

    }


    if (
      !quantity ||
      !Number.isFinite(
        estimatedQuantity
      )
    ) {

      return tr(
        "booking.quantityRequired",
        "Enter the estimated quantity."
      );

    }


    if (
      estimatedQuantity <=
      0
    ) {

      return tr(
        "booking.quantityPositive",
        "Quantity must be greater than zero."
      );

    }


    const maximumQuantity =
      Number(
        settings?.maxQuantity ??
        5000
      );


    if (
      estimatedQuantity >
      maximumQuantity
    ) {

      return `${tr(
        "booking.quantityLimit",
        "Quantity cannot exceed"
      )} ${maximumQuantity.toLocaleString()} kg.`;

    }


    if (
      !selectedCenter
    ) {

      return tr(
        "location.noCenter",
        "No procurement center is available."
      );

    }


    if (
      !selectedDate
    ) {

      return "Please choose an arrival date.";

    }


    return "";

  }


  function resetAvailability() {

    setAvailable(
      false
    );

    setSelectedSlot(
      null
    );

    setError(
      ""
    );

    setCenterSwitchMessage(
      ""
    );

  }


  function handleQuantityChange(
    event
  ) {

    const value =
      event.target.value
        .replace(
          /[^0-9.]/g,
          ""
        )
        .slice(
          0,
          8
        );


    setQuantity(
      value
    );


    resetAvailability();

  }


  function handleCropSelect(
    id
  ) {

    setCrop(
      id
    );

    setOpenMenu(
      null
    );

    resetAvailability();

  }


  function handleCenterSelect(
    id
  ) {

    setCenterId(
      id
    );

    setOpenMenu(
      null
    );

    resetAvailability();

  }


  function handleDateSelect(
    id
  ) {

    setDate(
      id
    );

    resetAvailability();

  }


  async function refreshBookings() {

    try {

      const response =
        await fetch(
          `${API_URL}/bookings`
        );


      let data =
        null;


      try {

        data =
          await response.json();

      } catch {

        data =
          null;

      }


      if (
        !response.ok
      ) {

        throw new Error(
          data?.message ||
          "Unable to load bookings."
        );

      }


      const rows =
        Array.isArray(
          data?.bookings
        )
          ? data.bookings
          : [];


      setBookings(
        rows
      );


      return rows;

    } catch (
      loadError
    ) {

      console.error(
        "Refresh bookings error:",
        loadError
      );


      return Array.isArray(
        bookings
      )
        ? bookings
        : [];

    }

  }


  function getFreeSlotForCenter(
    center,
    bookingRows
  ) {

    if (
      !center ||
      !selectedDate
    ) {

      return null;

    }


    const slots =
      generateTimeSlots(
        center.opening_time ||
        center.openingTime ||
        "09:00",

        center.closing_time ||
        center.closingTime ||
        "17:00",

        Number(
          settings?.slotDuration ||
          30
        ),

        getCenterCapacity(
          center,
          settings
        )
      );


    for (
      const slot of slots
    ) {

      const booked =
        getBookedCount(
          bookingRows,
          center.id,
          selectedDate.date,
          slot.start,
          slot.end
        );


      const capacity =
        getCenterCapacity(
          center,
          settings
        );


      if (
        booked <
        capacity
      ) {

        return {
          slot,
          remaining:
            Math.max(
              capacity -
              Math.min(
                booked,
                capacity
              ),
              0
            ),
        };

      }

    }


    return null;

  }


  async function handleCheckAvailability(
    event
  ) {

    event.preventDefault();


    const validationError =
      validate();


    if (
      validationError
    ) {

      setError(
        validationError
      );

      return;

    }


    setLoadingAvailability(
      true
    );

    setError(
      ""
    );

    setCenterSwitchMessage(
      ""
    );

    setSelectedSlot(
      null
    );


    try {

      const latestBookings =
        await refreshBookings();


      /*
       * First try the farmer's selected center.
       */

      const selectedAvailability =
        getFreeSlotForCenter(
          selectedCenter,
          latestBookings
        );


      if (
        selectedAvailability
      ) {

        setAvailable(
          true
        );

        return;

      }


      /*
       * Selected center has no free slot.
       * Search every other active center.
       */

      const alternatives =
        availableCenters.filter(
          center =>
            String(
              center.id
            ) !==
            String(
              selectedCenter?.id
            )
        );


      const alternative =
        alternatives
          .map(
            center => ({
              center,

              availability:
                getFreeSlotForCenter(
                  center,
                  latestBookings
                ),

            })
          )
          .find(
            item =>
              item.availability
          );


      if (
        alternative
      ) {

        setCenterId(
          alternative.center.id
        );


        setAvailable(
          true
        );


        setSelectedSlot(
          null
        );


        setCenterSwitchMessage(
          language === "hi"
            ? `चयनित केंद्र भर गया है। आपको ${alternative.center.name} पर उपलब्ध स्लॉट दिखाए जा रहे हैं।`
            : language === "te"
              ? `ఎంచుకున్న కేంద్రం నిండిపోయింది. ${alternative.center.name}లో అందుబాటులో ఉన్న స్లాట్‌లను చూపిస్తున్నాము.`
              : `The selected center is full. We switched you to ${alternative.center.name}, where slots are available.`
        );


        return;

      }


      /*
       * No active center has an opening.
       */

      setAvailable(
        false
      );


      setError(
        language === "hi"
          ? "इस तारीख के लिए किसी भी सक्रिय खरीद केंद्र में कोई समय उपलब्ध नहीं है। कृपया दूसरी तारीख चुनें।"
          : language === "te"
            ? "ఈ తేదీకి ఏ యాక్టివ్ కొనుగోలు కేంద్రంలోనూ సమయం అందుబాటులో లేదు. దయచేసి మరొక తేదీని ఎంచుకోండి."
            : "No arrival windows are available at any active procurement center for this date. Please choose another date."
      );

    } catch (
      availabilityError
    ) {

      console.error(
        "Check availability error:",
        availabilityError
      );


      setAvailable(
        false
      );


      setError(
        availabilityError?.message ||
        "Unable to check availability."
      );

    } finally {

      setLoadingAvailability(
        false
      );

    }

  }


  function handleSelectSlot(
    slot
  ) {

    if (
      !slot ||
      Number(
        slot.remaining
      ) <=
      0
    ) {

      return;

    }


    setSelectedSlot(
      slot
    );


    setError(
      ""
    );

  }


  async function handleConfirmBooking() {

    if (
      confirming
    ) {

      return;

    }


    if (
      !selectedCenter
    ) {

      setError(
        "Please select a procurement center."
      );

      return;

    }


    if (
      !selectedDate
    ) {

      setError(
        "Please choose an arrival date."
      );

      return;

    }


    if (
      !selectedSlotRecord
    ) {

      setError(
        tr(
          "booking.selectWindowError",
          "Choose an available arrival window."
        )
      );

      return;

    }


    const validationError =
      validate();


    if (
      validationError
    ) {

      setError(
        validationError
      );

      return;

    }


    setConfirming(
      true
    );

    setError(
      ""
    );


    try {

      /*
       * Verify farmer.
       */

      const farmerResponse =
        await fetch(
          `${API_URL}/farmers/${encodeURIComponent(
            farmer.id
          )}`
        );


      let farmerData =
        null;


      try {

        farmerData =
          await farmerResponse.json();

      } catch {

        farmerData =
          null;

      }


      if (
        !farmerResponse.ok ||
        !farmerData?.farmer
      ) {

        throw new Error(
          farmerData?.message ||
          "Your farmer account could not be verified. Please login again."
        );

      }


      const serverFarmer =
        normalizeFarmer(
          farmerData.farmer
        );


      if (
        !serverFarmer?.id
      ) {

        throw new Error(
          "The server returned an invalid farmer account."
        );

      }


      /*
       * Refresh bookings one final time.
       */

      const latestBookings =
        await refreshBookings();


      const matchingBookings =
        getBookedCount(
          latestBookings,
          selectedCenter.id,
          selectedDate.date,
          selectedSlotRecord.start,
          selectedSlotRecord.end
        );


      const capacity =
        getCenterCapacity(
          selectedCenter,
          settings
        );


      if (
        matchingBookings >=
        capacity
      ) {

        /*
         * Current slot is full.
         * Search another center automatically.
         */

        const alternative =
          availableCenters
            .filter(
              center =>
                String(
                  center.id
                ) !==
                String(
                  selectedCenter.id
                )
            )
            .map(
              center => ({
                center,

                availability:
                  getFreeSlotForCenter(
                    center,
                    latestBookings
                  ),

              })
            )
            .find(
              item =>
                item.availability
            );


        setSelectedSlot(
          null
        );


        if (
          alternative
        ) {

          setCenterId(
            alternative.center.id
          );

          setAvailable(
            true
          );


          setCenterSwitchMessage(
            language === "hi"
              ? `यह स्लॉट अभी भर गया। आपको ${alternative.center.name} पर भेज दिया गया है।`
              : language === "te"
                ? `ఈ స్లాట్ ఇప్పుడే నిండిపోయింది. మిమ్మల్ని ${alternative.center.name}కు మార్చాము.`
                : `This slot was just filled. We switched you to ${alternative.center.name}.`
          );


          return;

        }


        setAvailable(
          false
        );


        throw new Error(
          "This arrival window was just filled and no other active center has availability for this date."
        );

      }


      /*
       * Generate temporary client-side identifiers.
       */

      const bookingId =
        `B${Date.now()}${Math.floor(
          Math.random() *
          1000
        )}`;


      const bookingToken =
        String(
          Date.now()
        ).slice(
          -6
        );


      const requestBody = {

        id:
          bookingId,

        token:
          bookingToken,

        farmer: {

          id:
            serverFarmer.id,

          name:
            serverFarmer.name,

          phone:
            serverFarmer.phone,

          stateId:
            serverFarmer.stateId,

          districtId:
            serverFarmer.districtId,

          mandalId:
            serverFarmer.mandalId,

          village:
            serverFarmer.village,

          language:
            serverFarmer.language,

          preferredCenterId:
            serverFarmer.preferredCenterId,

          primaryCrop:
            serverFarmer.primaryCrop,

          estimatedQuantity:
            serverFarmer.estimatedQuantity,

        },

        centerId:
          selectedCenter.id,

        crop:
          selectedCrop.id,

        estimatedQuantity:
          estimatedQuantity,

        date:
          selectedDate.date,

        slotStart:
          selectedSlotRecord.start,

        slotEnd:
          selectedSlotRecord.end,

      };


      const response =
        await fetch(
          `${API_URL}/bookings`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                requestBody
              ),

          }
        );


      let responseData =
        null;


      try {

        responseData =
          await response.json();

      } catch {

        responseData =
          null;

      }


      if (
        !response.ok
      ) {

        throw new Error(
          responseData?.message ||
          "Failed to save your booking."
        );

      }


      const savedBooking =
        responseData?.booking;


      if (
        !savedBooking?.id
      ) {

        throw new Error(
          "Booking was accepted but the server did not return a valid booking record."
        );

      }


      /*
       * Synchronize local prototype state.
       */

      try {

        syncBookingToPrototype(
          {
            id:
              savedBooking.id,

            farmerId:
              serverFarmer.id,

            centerId:
              savedBooking.center_id ||
              selectedCenter.id,

            token:
              String(
                savedBooking.token ||
                bookingToken
              ),

            date:
              savedBooking.date ||
              selectedDate.date,

            slotStart:
              savedBooking.slot_start ||
              selectedSlotRecord.start,

            slotEnd:
              savedBooking.slot_end ||
              selectedSlotRecord.end,

            crop:
              savedBooking.crop ||
              selectedCrop.id,

            estimatedQuantity:
              Number(
                savedBooking.estimated_quantity ??
                estimatedQuantity
              ),

            actualQuantity:
              savedBooking.actual_quantity ??
              null,

            status:
              savedBooking.status ||
              "CONFIRMED",

            payment: {

              amount:
                Number(
                  savedBooking.payment_amount ||
                  0
                ) ||
                null,

              status:
                savedBooking.payment_status ||
                "NOT_CREATED",

              reference:
                savedBooking.payment_reference ||
                null,

              sentAt:
                savedBooking.payment_sms_sent_at ||
                null,

            },

          },

          serverFarmer,

          selectedCenter,

          selectedCrop
        );

      } catch (
        bridgeError
      ) {

        console.warn(
          "Prototype sync warning:",
          bridgeError
        );

      }


      /*
       * Verify exact backend booking.
       */

      const verifyResponse =
        await fetch(
          `${API_URL}/bookings/${encodeURIComponent(
            savedBooking.id
          )}`
        );


      let verifyData =
        null;


      try {

        verifyData =
          await verifyResponse.json();

      } catch {

        verifyData =
          null;

      }


      if (
        !verifyResponse.ok ||
        !verifyData?.booking?.id
      ) {

        throw new Error(
          "Booking was created but could not be verified. Please refresh and check your bookings."
        );

      }


      navigate(
        `/farmer/token?booking=${encodeURIComponent(
          verifyData.booking.id
        )}`,
        {
          replace:
            true,
        }
      );

    } catch (
      bookingError
    ) {

      console.error(
        "Booking error:",
        bookingError
      );


      setError(
        bookingError?.message ||
        "Unable to complete the booking."
      );

    } finally {

      setConfirming(
        false
      );

    }

  }


  /*
   * ========================================================
   * RENDER
   * ========================================================
   */

  return (

    <div className="farmer-book-page">

      <Header />


      <main className="booking-container">

        <div className="booking-top-row">

          <div className="booking-title-area">

            <Link
              to="/farmer/home"
              className="back-link"
            >

              <ArrowLeft
                size={16}
              />

              {
                tr(
                  "common.back",
                  "Back"
                )
              }

            </Link>


            <div className="booking-eyebrow-row">

              <span className="page-eyebrow">

                {
                  copy.bookingEyebrow
                }

              </span>


              <span className="booking-live-pill">

                <span />

                {
                  copy.liveAvailability
                }

              </span>

            </div>


            <h1>
              {
                copy.title
              }
            </h1>


            <p>
              {
                copy.description
              }
            </p>

          </div>


          <div className="booking-process-mini">

            <div className="mini-step active">

              <span>
                1
              </span>

              {
                tr(
                  "booking.details",
                  language === "hi"
                    ? "विवरण"
                    : language === "te"
                      ? "వివరాలు"
                      : "Details"
                )
              }

            </div>


            <div className="mini-step-line" />


            <div
              className={
                `mini-step ${
                  available
                    ? "active"
                    : ""
                }`
              }
            >

              <span>
                2
              </span>

              {
                tr(
                  "booking.availability",
                  language === "hi"
                    ? "उपलब्धता"
                    : language === "te"
                      ? "అందుబాటు"
                      : "Availability"
                )
              }

            </div>


            <div className="mini-step-line" />


            <div
              className={
                `mini-step ${
                  selectedSlot
                    ? "active"
                    : ""
                }`
              }
            >

              <span>
                3
              </span>

              {
                tr(
                  "booking.confirm",
                  language === "hi"
                    ? "पुष्टि"
                    : language === "te"
                      ? "నిర్ధారణ"
                      : "Confirm"
                )
              }

            </div>

          </div>

        </div>


        <section className="booking-info-bar">

          <div>

            <div className="booking-info-icon green">

              <ShieldCheck
                size={19}
              />

            </div>


            <div>

              <strong>
                {
                  copy.secureTitle
                }
              </strong>

              <span>
                {
                  copy.secureText
                }
              </span>

            </div>

          </div>


          <div>

            <div className="booking-info-icon blue">

              <Clock3
                size={19}
              />

            </div>


            <div>

              <strong>
                {
                  copy.reserveTitle
                }
              </strong>

              <span>
                {
                  copy.reserveText
                }
              </span>

            </div>

          </div>


          <div>

            <div className="booking-info-icon gold">

              <CheckCircle2
                size={19}
              />

            </div>


            <div>

              <strong>
                {
                  copy.tokenTitle
                }
              </strong>

              <span>
                {
                  copy.tokenText
                }
              </span>

            </div>

          </div>

        </section>


        <section className="booking-layout">

          <div className="booking-form-column">

            <section className="booking-panel">

              <div className="booking-panel-number">
                01
              </div>


              <div className="booking-panel-heading">

                <div className="panel-icon green">

                  <Wheat
                    size={21}
                  />

                </div>


                <div>

                  <span className="panel-step-label">
                    {
                      copy.stepOne
                    }
                  </span>


                  <h2>
                    {
                      copy.produceTitle
                    }
                  </h2>


                  <p>
                    {
                      copy.produceDescription
                    }
                  </p>

                </div>

              </div>


              <div className="form-grid">

                <div className="booking-form-field">

                  <label>
                    {
                      copy.crop
                    }
                  </label>


                  <div className="custom-select">

                    <button
                      type="button"
                      className="select-control"
                      onClick={() =>
                        setOpenMenu(
                          openMenu ===
                            "crop"
                            ? null
                            : "crop"
                        )
                      }
                    >

                      <div className="select-main">

                        <div
                          className={
                            `crop-visual crop-${
                              selectedCrop?.id ||
                              "wheat"
                            }`
                          }
                        >

                          <CropIcon
                            crop={
                              selectedCrop?.id ||
                              "wheat"
                            }
                            size={24}
                          />

                        </div>


                        <div className="selected-value-stack">

                          <strong>
                            {
                              cropLabel(
                                selectedCrop?.id ||
                                "wheat"
                              )
                            }
                          </strong>


                          <span>
                            {
                              copy.cropSelected
                            }
                          </span>

                        </div>

                      </div>


                      <ChevronDown
                        size={17}
                      />

                    </button>


                    {
                      openMenu ===
                      "crop" && (

                        <div className="select-menu">

                          {
                            crops.map(
                              item => (

                                <button
                                  key={
                                    item.id
                                  }
                                  type="button"
                                  className={
                                    String(
                                      crop
                                    ) ===
                                    String(
                                      item.id
                                    )
                                      ? "select-option selected"
                                      : "select-option"
                                  }
                                  onClick={() =>
                                    handleCropSelect(
                                      item.id
                                    )
                                  }
                                >

                                  <div
                                    className={
                                      `crop-visual crop-${
                                        item.id
                                      } crop-visual-small`
                                    }
                                  >

                                    <CropIcon
                                      crop={
                                        item.id
                                      }
                                      size={20}
                                    />

                                  </div>


                                  <div>

                                    <strong>
                                      {
                                        cropLabel(
                                          item.id
                                        )
                                      }
                                    </strong>


                                    <span>
                                      {
                                        copy.agriculturalProduce
                                      }
                                    </span>

                                  </div>


                                  {
                                    String(
                                      crop
                                    ) ===
                                    String(
                                      item.id
                                    ) && (

                                      <Check
                                        size={16}
                                      />

                                    )
                                  }

                                </button>

                              )
                            )
                          }

                        </div>

                      )
                    }

                  </div>

                </div>


                <div className="booking-form-field">

                  <label htmlFor="booking-quantity">

                    {
                      copy.quantity
                    }

                  </label>


                  <div
                    className={
                      `quantity-input ${
                        error &&
                        (
                          !quantity ||
                          estimatedQuantity <=
                          0
                        )
                          ? "booking-input-error"
                          : ""
                      }`
                    }
                  >

                    <Scale
                      size={19}
                    />


                    <input
                      id="booking-quantity"
                      type="text"
                      inputMode="decimal"
                      value={
                        quantity
                      }
                      placeholder="250"
                      onChange={
                        handleQuantityChange
                      }
                    />


                    <strong>
                      kg
                    </strong>

                  </div>


                  <span className="field-help">
                    {
                      copy.quantityHelp
                    }
                  </span>

                </div>

              </div>


              <div className="booking-tip-card">

                <div>

                  <Info
                    size={16}
                  />

                </div>


                <p>
                  {
                    copy.quantityTip
                  }
                </p>

              </div>

            </section>


            <section className="booking-panel">

              <div className="booking-panel-number">
                02
              </div>


              <div className="booking-panel-heading">

                <div className="panel-icon blue">

                  <MapPin
                    size={21}
                  />

                </div>


                <div>

                  <span className="panel-step-label">

                    {
                      copy.stepTwo
                    }

                  </span>


                  <h2>
                    {
                      copy.whereTitle
                    }
                  </h2>


                  <p>
                    {
                      copy.whereDescription
                    }
                  </p>

                </div>

              </div>


              <div className="booking-form-field">

                <label>
                  {
                    copy.center
                  }
                </label>


                <div className="custom-select">

                  <button
                    type="button"
                    className="select-control"
                    disabled={
                      centersLoading
                    }
                    onClick={() =>
                      setOpenMenu(
                        openMenu ===
                          "center"
                          ? null
                          : "center"
                      )
                    }
                  >

                    <div className="select-main">

                      <div className="center-select-icon large">

                        <MapPin
                          size={18}
                        />

                      </div>


                      <div className="selected-value-stack">

                        <strong>

                          {
                            centersLoading
                              ? "Loading centers..."
                              : selectedCenter?.name ||
                                copy.selectCenter
                          }

                        </strong>


                        <span>

                          {
                            selectedCenter?.address ||
                            copy.chooseCenter
                          }

                        </span>

                      </div>

                    </div>


                    <ChevronDown
                      size={17}
                    />

                  </button>


                  {
                    openMenu ===
                    "center" && (

                      <div className="select-menu center-menu">

                        {
                          centersLoading ? (

                            <div className="booking-menu-empty">

                              {
                                tr(
                                  "location.loadingCenters",
                                  "Loading procurement centers..."
                                )
                              }

                            </div>

                          ) : availableCenters.length ===
                            0 ? (

                            <div className="booking-menu-empty">

                              {
                                tr(
                                  "location.noCenter",
                                  "No active procurement center available."
                                )
                              }

                            </div>

                          ) : (

                            availableCenters.map(
                              center => (

                                <button
                                  key={
                                    center.id
                                  }
                                  type="button"
                                  className={
                                    String(
                                      centerId
                                    ) ===
                                    String(
                                      center.id
                                    )
                                      ? "center-option selected"
                                      : "center-option"
                                  }
                                  onClick={() =>
                                    handleCenterSelect(
                                      center.id
                                    )
                                  }
                                >

                                  <div className="center-option-icon">

                                    <MapPin
                                      size={17}
                                    />

                                  </div>


                                  <div>

                                    <strong>
                                      {
                                        center.name
                                      }
                                    </strong>


                                    <span>
                                      {
                                        center.address ||
                                        [
                                          center.village,
                                          center.mandal_id,
                                          center.district_id,
                                          center.state_id,
                                        ]
                                          .filter(Boolean)
                                          .join(", ")
                                      }
                                    </span>


                                    {
                                      center.landmark && (

                                        <small>

                                          {
                                            copy.near
                                          }

                                          {" "}

                                          {
                                            center.landmark
                                          }

                                        </small>

                                      )
                                    }

                                  </div>


                                  {
                                    String(
                                      centerId
                                    ) ===
                                    String(
                                      center.id
                                    ) && (

                                      <Check
                                        size={16}
                                      />

                                    )
                                  }

                                </button>

                              )
                            )

                          )
                        }

                      </div>

                    )
                  }

                </div>


                {
                  selectedCenter && (

                    <div className="center-detail-card">

                      <div className="center-detail-top">

                        <div className="center-detail-icon">

                          <MapPin
                            size={17}
                          />

                        </div>


                        <div>

                          <strong>
                            {
                              selectedCenter.name
                            }
                          </strong>


                          <span>
                            {
                              selectedCenter.address ||
                              [
                                selectedCenter.village,
                                selectedCenter.mandal_id,
                                selectedCenter.district_id,
                                selectedCenter.state_id,
                              ]
                                .filter(Boolean)
                                .join(", ") ||
                              copy.chooseCenter
                            }
                          </span>

                        </div>

                      </div>


                      <div className="center-detail-meta">

                        <span>

                          <Clock3
                            size={13}
                          />

                          {
                            formatTime(
                              selectedCenter.opening_time ||
                              selectedCenter.openingTime ||
                              "09:00"
                            )
                          }

                          {" – "}

                          {
                            formatTime(
                              selectedCenter.closing_time ||
                              selectedCenter.closingTime ||
                              "17:00"
                            )
                          }

                        </span>


                        <span>

                          <Leaf
                            size={13}
                          />

                          {
                            copy.produceIntake
                          }

                        </span>


                        <span>

                          <Scale
                            size={13}
                          />

                          {
                            getCenterCapacity(
                              selectedCenter,
                              settings
                            )
                          }

                          {" "}

                          {
                            copy.bookingsSlot
                          }

                        </span>

                      </div>

                    </div>

                  )
                }

              </div>


              <div className="booking-form-field booking-date-field">

                <div className="field-heading-row">

                  <label>
                    {
                      copy.preferredDate
                    }
                  </label>


                  <span>
                    {
                      copy.chooseDate
                    }
                  </span>

                </div>


                <div className="date-options">

                  {
                    dates.map(
                      item => (

                        <button
                          key={
                            item.id
                          }
                          type="button"
                          className={
                            date ===
                            item.id
                              ? "date-option selected"
                              : "date-option"
                          }
                          onClick={() =>
                            handleDateSelect(
                              item.id
                            )
                          }
                        >

                          <span className="date-weekday">
                            {
                              item.label
                            }
                          </span>


                          <strong>
                            {
                              item.day
                            }
                          </strong>


                          <small>
                            {
                              item.month
                            }
                          </small>


                          {
                            date ===
                            item.id && (

                              <div className="date-check">

                                <Check
                                  size={13}
                                />

                              </div>

                            )
                          }

                        </button>

                      )
                    )
                  }

                </div>

              </div>

            </section>


            <section className="booking-check-card">

              <div className="booking-check-icon">

                <CalendarDays
                  size={24}
                />

              </div>


              <div className="booking-check-copy">

                <span>
                  {
                    copy.readyCheck
                  }
                </span>


                <h3>
                  {
                    copy.findWindow
                  }
                </h3>


                <p>
                  {
                    copy.checkText
                  }
                </p>

              </div>


              <div className="booking-check-action">

                <Button
                  fullWidth
                  onClick={
                    handleCheckAvailability
                  }
                  disabled={
                    loadingAvailability ||
                    loadingBookings ||
                    settingsLoading ||
                    centersLoading ||
                    !selectedCenter
                  }
                >

                  {
                    loadingAvailability ||
                    loadingBookings ||
                    settingsLoading ||
                    centersLoading ? (

                      <>

                        <LoaderCircle
                          size={18}
                          className="loading-spin"
                        />

                        {
                          copy.checking
                        }

                      </>

                    ) : (

                      <>

                        {
                          tr(
                            "booking.checkAvailability",
                            "Check Available Windows"
                          )
                        }


                        <ArrowRight
                          size={18}
                        />

                      </>

                    )
                  }

                </Button>

              </div>

            </section>


            {
              centerSwitchMessage && (

                <div className="booking-error prominent">

                  <CheckCircle2
                    size={17}
                  />


                  <span>
                    {
                      centerSwitchMessage
                    }
                  </span>

                </div>

              )
            }


            {
              error && (

                <div className="booking-error prominent">

                  <Info
                    size={17}
                  />


                  <span>
                    {
                      error
                    }
                  </span>

                </div>

              )
            }


            {
              settingsError && (

                <div className="booking-error prominent">

                  <Info
                    size={17}
                  />


                  <span>
                    {
                      settingsError
                    }
                  </span>

                </div>

              )
            }

          </div>


          <aside className="booking-summary-column">

            <div className="booking-summary-card">

              <div className="summary-header">

                <div>

                  <span>
                    {
                      copy.yourBooking
                    }
                  </span>


                  <h2>
                    {
                      copy.review
                    }
                  </h2>

                </div>


                <div className="summary-header-icon">

                  <CalendarDays
                    size={19}
                  />

                </div>

              </div>


              <div className="summary-crop">

                <div
                  className={
                    `crop-visual crop-visual-large crop-${
                      selectedCrop?.id ||
                      "wheat"
                    }`
                  }
                >

                  <CropIcon
                    crop={
                      selectedCrop?.id ||
                      "wheat"
                    }
                    size={34}
                  />

                </div>


                <div>

                  <span>
                    {
                      copy.crop
                    }
                  </span>


                  <strong>
                    {
                      cropLabel(
                        selectedCrop?.id ||
                        "wheat"
                      )
                    }
                  </strong>


                  <small>

                    {
                      estimatedQuantity >
                      0
                        ? `${estimatedQuantity.toLocaleString()} kg ${copy.estimated}`
                        : copy.notEntered
                    }

                  </small>

                </div>

              </div>


              <div className="summary-list">

                <SummaryRow
                  icon={
                    <MapPin
                      size={15}
                    />
                  }
                  label={
                    copy.center
                  }
                  value={
                    selectedCenter?.name ||
                    copy.selectCenter
                  }
                />


                <SummaryRow
                  icon={
                    <CalendarDays
                      size={15}
                    />
                  }
                  label={
                    tr(
                      "booking.date",
                      "Date"
                    )
                  }
                  value={
                    selectedDate
                      ? `${selectedDate.label}, ${selectedDate.day} ${selectedDate.month}`
                      : copy.chooseDate
                  }
                />


                <SummaryRow
                  icon={
                    <Clock3
                      size={15}
                    />
                  }
                  label={
                    tr(
                      "booking.arrivalWindow",
                      language === "hi"
                        ? "आने का समय"
                        : language === "te"
                          ? "రాక సమయం"
                          : "Arrival window"
                    )
                  }
                  value={
                    selectedSlotRecord?.display ||
                    copy.chooseWindow
                  }
                />


                <SummaryRow
                  icon={
                    <Scale
                      size={15}
                    />
                  }
                  label={
                    copy.quantity
                  }
                  value={
                    estimatedQuantity >
                    0
                      ? `${estimatedQuantity.toLocaleString()} kg`
                      : copy.notEntered
                  }
                />

              </div>


              <div className="summary-total-row">

                <span>
                  {
                    copy.bookingStatus
                  }
                </span>


                <strong>

                  {
                    selectedSlotRecord
                      ? copy.readyConfirm
                      : available
                        ? copy.chooseArrival
                        : copy.detailsProgress
                  }

                </strong>

              </div>


              <div className="summary-security">

                <ShieldCheck
                  size={16}
                />

                <span>
                  {
                    copy.finalSecurity
                  }
                </span>

              </div>

            </div>


            <div className="booking-help-card">

              <div className="booking-help-icon">

                <CircleHelp
                  size={20}
                />

              </div>


              <div>

                <strong>
                  {
                    copy.needHelp
                  }
                </strong>


                <p>
                  {
                    copy.helpText
                  }
                </p>


                <Link
                  to="/farmer/help"
                >

                  {
                    copy.bookingHelp
                  }


                  <ArrowRight
                    size={14}
                  />

                </Link>

              </div>

            </div>

          </aside>

        </section>


        {
          available && (

            <section className="booking-availability-section">

              <div className="availability-section-top">

                <div>

                  <div className="availability-title-row">

                    <span className="page-eyebrow">

                      {
                        tr(
                          "booking.availableWindows",
                          copy.availableWindows
                        )
                      }

                    </span>


                    <span className="availability-found-pill">

                      <CheckCircle2
                        size={14}
                      />


                      {
                        copy.windowsAvailable
                      }

                    </span>

                  </div>


                  <h2>
                    {
                      copy.chooseArrivalWindow
                    }
                  </h2>


                  <p>
                    {
                      copy.availabilityText
                    }
                  </p>

                </div>


                <div className="availability-date-card">

                  <CalendarDays
                    size={19}
                  />


                  <div>

                    <span>
                      {
                        copy.selectedDate
                      }
                    </span>


                    <strong>

                      {
                        selectedDate?.label
                      }

                      {", "}

                      {
                        selectedDate?.day
                      }

                      {" "}

                      {
                        selectedDate?.month
                      }

                    </strong>

                  </div>

                </div>

              </div>


              <div className="availability-overview">

                <div className="availability-overview-item">

                  <div className="availability-overview-icon blue">

                    <Clock3
                      size={18}
                    />

                  </div>


                  <div>

                    <span>
                      {
                        copy.availableWindows
                      }
                    </span>


                    <strong>

                      {
                        availability.filter(
                          slot =>
                            slot.remaining >
                            0
                        ).length
                      }

                    </strong>

                  </div>

                </div>


                <div className="availability-overview-item">

                  <div className="availability-overview-icon green">

                    <CheckCircle2
                      size={18}
                    />

                  </div>


                  <div>

                    <span>
                      {
                        copy.openCapacity
                      }
                    </span>


                    <strong>
                      {
                        totalRemaining
                      }
                    </strong>


                    <small>
                      {
                        copy.placesRemaining
                      }
                    </small>

                  </div>

                </div>


                <div className="availability-overview-item">

                  <div className="availability-overview-icon gold">

                    <MapPin
                      size={18}
                    />

                  </div>


                  <div>

                    <span>
                      {
                        copy.center
                      }
                    </span>


                    <strong>

                      {
                        selectedCenter?.name ||
                        "-"
                      }

                    </strong>

                  </div>

                </div>

              </div>


              <div className="slot-instruction">

                <div className="slot-instruction-icon">

                  <Info
                    size={16}
                  />

                </div>


                <p>

                  {
                    language ===
                    "hi"
                      ? "हर समय स्लॉट में सीमित बुकिंग उपलब्ध हैं। अपनी यात्रा के अनुसार सबसे उपयुक्त समय चुनें।"
                      : language ===
                        "te"
                        ? "ప్రతి సమయ స్లాట్‌లో పరిమిత బుకింగ్‌లు ఉంటాయి. మీ ప్రయాణానికి అనుకూలమైన సమయాన్ని ఎంచుకోండి."
                        : "Each window has a limited number of bookings. Select the slot that best fits your travel time."
                  }

                </p>

              </div>


              <div className="slot-grid">

                {
                  availability.map(
                    slot => {

                      const isSelected =
                        selectedSlot?.id ===
                        slot.id;


                      const isFull =
                        slot.remaining <=
                        0;


                      let availabilityLabel =
                        copy.goodAvailability;


                      if (
                        isFull
                      ) {

                        availabilityLabel =
                          copy.full;

                      } else if (
                        slot.loadClass ===
                        "busy"
                      ) {

                        availabilityLabel =
                          copy.nearlyFull;

                      } else if (
                        slot.loadClass ===
                        "limited"
                      ) {

                        availabilityLabel =
                          copy.limitedAvailability;

                      }


                      return (

                        <button
                          key={
                            slot.id
                          }
                          type="button"
                          disabled={
                            isFull
                          }
                          className={
                            `slot-card ${
                              isSelected
                                ? "selected"
                                : ""
                            } ${
                              isFull
                                ? "slot-full"
                                : ""
                            } ${
                              slot.loadClass
                            }`
                          }
                          onClick={() =>
                            handleSelectSlot(
                              slot
                            )
                          }
                        >

                          <div className="slot-card-header">

                            <div className="slot-card-clock">

                              <Clock3
                                size={19}
                              />

                            </div>


                            {
                              isSelected && (

                                <div className="slot-card-selected">

                                  <Check
                                    size={14}
                                  />

                                </div>

                              )
                            }

                          </div>


                          <div className="slot-card-time">

                            <strong>
                              {
                                slot.display
                              }
                            </strong>

                          </div>


                          <div className="slot-capacity-label">

                            <span
                              className={
                                isFull
                                  ? "slot-full-label"
                                  : slot.loadClass ===
                                    "busy"
                                    ? "slot-busy-label"
                                    : slot.loadClass ===
                                      "limited"
                                      ? "slot-limited-label"
                                      : "slot-normal-label"
                              }
                            >

                              {
                                availabilityLabel
                              }

                            </span>

                          </div>


                          <div className="slot-capacity-bar">

                            <div
                              style={{
                                width:
                                  `${Math.min(
                                    100,
                                    (
                                      Math.min(
                                        slot.booked,
                                        slot.capacity
                                      ) /
                                      Math.max(
                                        slot.capacity,
                                        1
                                      )
                                    ) *
                                    100
                                  )}%`,
                              }}
                            />

                          </div>


                          <div className="slot-card-footer">

                            <span>

                              {
                                isFull
                                  ? copy.noPlaces
                                  : `${Math.max(
                                      0,
                                      Math.min(
                                        slot.remaining,
                                        slot.capacity
                                      )
                                    )} ${copy.placesRemaining}`
                              }

                            </span>


                            {
                              !isFull && (

                                <ArrowRight
                                  size={16}
                                />

                              )
                            }

                          </div>

                        </button>

                      );

                    }
                  )
                }

              </div>


              {
                selectedSlotRecord && (

                  <div className="selected-slot-banner">

                    <div className="selected-slot-check">

                      <Check
                        size={18}
                      />

                    </div>


                    <div>

                      <span>
                        {
                          copy.selectedWindow
                        }
                      </span>


                      <strong>
                        {
                          selectedSlotRecord.display
                        }
                      </strong>

                    </div>


                    <button
                      type="button"
                      onClick={() =>
                        setSelectedSlot(
                          null
                        )
                      }
                    >

                      {
                        copy.change
                      }

                    </button>

                  </div>

                )
              }

            </section>

          )
        }


        {
          available &&
          selectedSlotRecord && (

            <section className="booking-confirm-section">

              <div className="confirm-section-heading">

                <div>

                  <span className="page-eyebrow">
                    {
                      copy.finalStep
                    }
                  </span>


                  <h2>
                    {
                      copy.checkEverything
                    }
                  </h2>


                  <p>
                    {
                      copy.finalText
                    }
                  </p>

                </div>


                <span className="confirm-ready-pill">

                  <CheckCircle2
                    size={15}
                  />


                  {
                    copy.readyConfirm
                  }

                </span>

              </div>


              <div className="confirm-review-grid">

                <ConfirmCard
                  icon={
                    <Wheat
                      size={21}
                    />
                  }
                  tone="green"
                  title={
                    copy.crop
                  }
                  value={
                    cropLabel(
                      selectedCrop?.id
                    )
                  }
                  detail={
                    estimatedQuantity >
                    0
                      ? `${estimatedQuantity.toLocaleString()} kg`
                      : copy.notEntered
                  }
                />


                <ConfirmCard
                  icon={
                    <MapPin
                      size={21}
                    />
                  }
                  tone="blue"
                  title={
                    copy.center
                  }
                  value={
                    selectedCenter?.name ||
                    "-"
                  }
                  detail={
                    selectedCenter?.address ||
                    ""
                  }
                />


                <ConfirmCard
                  icon={
                    <CalendarDays
                      size={21}
                    />
                  }
                  tone="gold"
                  title={
                    tr(
                      "booking.date",
                      language === "hi"
                        ? "तारीख"
                        : language === "te"
                          ? "తేదీ"
                          : "Date"
                    )
                  }
                  value={
                    selectedDate?.label ||
                    "-"
                  }
                  detail={
                    selectedDate
                      ? `${selectedDate.day} ${selectedDate.month}`
                      : ""
                  }
                />


                <ConfirmCard
                  icon={
                    <Clock3
                      size={21}
                    />
                  }
                  tone="orange"
                  title={
                    copy.selectedWindow
                  }
                  value={
                    selectedSlotRecord.display
                  }
                  detail={
                    `${Math.max(
                      0,
                      Math.min(
                        selectedSlotRecord.remaining,
                        selectedSlotRecord.capacity
                      )
                    )} ${copy.placesRemaining}`
                  }
                />

              </div>


              <div className="confirm-notice">

                <div className="confirm-notice-icon">

                  <ShieldCheck
                    size={20}
                  />

                </div>


                <div>

                  <strong>
                    {
                      copy.whatHappens
                    }
                  </strong>


                  <p>
                    {
                      copy.afterText
                    }
                  </p>

                </div>

              </div>


              {
                error && (

                  <div className="booking-error prominent">

                    <Info
                      size={17}
                    />

                    <span>
                      {
                        error
                      }
                    </span>

                  </div>

                )
              }


              <div className="confirm-bottom">

                <div className="confirm-arrival-reminder">

                  <Clock3
                    size={17}
                  />

                  <span>
                    {
                      copy.arriveText
                    }
                  </span>

                </div>


                <Button
                  onClick={
                    handleConfirmBooking
                  }
                  disabled={
                    confirming
                  }
                >

                  {
                    confirming ? (

                      <>

                        <LoaderCircle
                          size={18}
                          className="loading-spin"
                        />

                        {
                          copy.saving
                        }

                      </>

                    ) : (

                      <>

                        {
                          copy.confirm
                        }

                        <ArrowRight
                          size={18}
                        />

                      </>

                    )
                  }

                </Button>

              </div>

            </section>

          )
        }


        <section className="booking-bottom-information">

          <div className="booking-bottom-card green">

            <div className="bottom-card-icon">

              <ShieldCheck
                size={21}
              />

            </div>


            <div>

              <strong>
                {
                  copy.traceable
                }
              </strong>


              <span>
                {
                  copy.traceableText
                }
              </span>

            </div>

          </div>


          <div className="booking-bottom-card blue">

            <div className="bottom-card-icon">

              <Clock3
                size={21}
              />

            </div>


            <div>

              <strong>
                {
                  copy.arriveDuring
                }
              </strong>


              <span>
                {
                  copy.arriveDuringText
                }
              </span>

            </div>

          </div>


          <Link
            to="/farmer/help"
            className="booking-bottom-card gold"
          >

            <div className="bottom-card-icon">

              <CircleHelp
                size={21}
              />

            </div>


            <div>

              <strong>
                {
                  copy.assistance
                }
              </strong>


              <span>
                {
                  copy.assistanceText
                }
              </span>

            </div>


            <ArrowRight
              size={17}
            />

          </Link>

        </section>

      </main>


      <footer className="booking-page-footer">

        <div>

          <strong>
            KrishiSetu
          </strong>


          <span>

            {
              language ===
                "hi"
                ? "स्मार्ट कृषि खरीद"
                : language ===
                    "te"
                  ? "స్మార్ట్ వ్యవసాయ కొనుగోలు"
                  : "Smart agricultural procurement"
            }

          </span>

        </div>


        <span>

          {
            language ===
              "hi"
              ? "बुकिंग जानकारी आपके खरीद रिकॉर्ड में सुरक्षित रूप से संग्रहीत है।"
              : language ===
                  "te"
                ? "బుకింగ్ సమాచారం మీ కొనుగోలు రికార్డులో సురక్షితంగా నిల్వ చేయబడుతుంది."
                : "Booking information is stored securely in your procurement record."
          }

        </span>

      </footer>

    </div>

  );

}


/* =========================================================
   CONFIRM CARD
========================================================= */

function ConfirmCard({
  icon,
  tone,
  title,
  value,
  detail,
}) {

  return (

    <div className="confirm-review-card">

      <div
        className={
          `confirm-review-icon ${tone}`
        }
      >

        {
          icon
        }

      </div>


      <div>

        <span>
          {
            title
          }
        </span>


        <strong>
          {
            value
          }
        </strong>


        <small>
          {
            detail
          }
        </small>

      </div>

    </div>

  );

}


/* =========================================================
   SUMMARY ROW
========================================================= */

function SummaryRow({
  icon,
  label,
  value,
}) {

  return (

    <div className="summary-row">

      <div className="summary-row-label">

        <div className="summary-row-icon">

          {
            icon
          }

        </div>


        <span>
          {
            label
          }
        </span>

      </div>


      <strong>
        {
          value
        }
      </strong>

    </div>

  );

}


/* =========================================================
   CENTER CAPACITY
========================================================= */

function getCenterCapacity(
  center,
  settings
) {

  const capacity =
    Number(
      center?.capacity ??
      center?.capacityPerSlot ??
      center?.capacity_per_slot ??
      settings?.defaultCapacity ??
      20
    );


  if (
    !Number.isFinite(
      capacity
    ) ||
    capacity <=
    0
  ) {

    return Number(
      settings?.defaultCapacity ||
      20
    );

  }


  return capacity;

}


/* =========================================================
   BOOKING COUNT
========================================================= */

function getBookedCount(
  bookingRows,
  centerId,
  date,
  slotStart,
  slotEnd
) {

  if (
    !Array.isArray(
      bookingRows
    )
  ) {

    return 0;

  }


  return bookingRows.filter(
    booking => {

      const bookingCenterId =
        String(
          booking?.center_id ??
          booking?.centerId ??
          ""
        );


      const bookingDate =
        String(
          booking?.date ??
          ""
        );


      const bookingStart =
        String(
          booking?.slot_start ??
          booking?.slotStart ??
          ""
        );


      const bookingEnd =
        String(
          booking?.slot_end ??
          booking?.slotEnd ??
          ""
        );


      const status =
        String(
          booking?.status ??
          ""
        );


      return (

        bookingCenterId ===
        String(
          centerId
        ) &&

        bookingDate ===
        String(
          date
        ) &&

        bookingStart ===
        String(
          slotStart
        ) &&

        bookingEnd ===
        String(
          slotEnd
        ) &&

        status !==
        "PAYMENT_SENT"

      );

    }
  ).length;

}


/* =========================================================
   FARMER NORMALIZATION
========================================================= */

function normalizeFarmer(
  farmer
) {

  if (
    !farmer
  ) {

    return null;

  }


  return {

    ...farmer,

    id:
      String(
        farmer.id ||
        ""
      ),

    name:
      farmer.name ||
      "",

    phone:
      normalisePhone(
        farmer.phone
      ),

    stateId:
      farmer.state_id ??
      farmer.stateId ??
      null,

    districtId:
      farmer.district_id ??
      farmer.districtId ??
      null,

    mandalId:
      farmer.mandal_id ??
      farmer.mandalId ??
      null,

    village:
      farmer.village ||
      "",

    language:
      farmer.language ||
      "en",

    preferredCenterId:
      farmer.preferred_center_id ??
      farmer.preferredCenterId ??
      null,

    primaryCrop:
      farmer.primary_crop ??
      farmer.primaryCrop ??
      null,

    estimatedQuantity:
      Number(
        farmer.estimated_quantity ??
        farmer.estimatedQuantity ??
        0
      ),

  };

}


function normalisePhone(
  value
) {

  return String(
    value ||
    ""
  ).replace(
    /\D/g,
    ""
  );

}


/* =========================================================
   TIME HELPERS
========================================================= */

function generateTimeSlots(
  openingTime,
  closingTime,
  duration,
  capacity = 20
) {

  const slots =
    [];


  let current =
    timeToMinutes(
      openingTime
    );


  const end =
    timeToMinutes(
      closingTime
    );


  const safeDuration =
    Math.max(
      5,
      Number(
        duration
      ) ||
      30
    );


  const safeCapacity =
    Math.max(
      1,
      Number(
        capacity
      ) ||
      20
    );


  if (
    end <=
    current
  ) {

    return slots;

  }


  while (
    current +
    safeDuration <=
    end
  ) {

    const start =
      minutesToTime(
        current
      );


    const finish =
      minutesToTime(
        current +
        safeDuration
      );


    slots.push({

      id:
        start.replace(
          ":",
          "-"
        ),

      start,

      end:
        finish,

      display:
        formatTimeRange(
          start,
          finish
        ),

      capacity:
        safeCapacity,

    });


    current +=
      safeDuration;

  }


  return slots;

}


function timeToMinutes(
  value
) {

  const text =
    String(
      value ||
      ""
    )
      .trim()
      .toUpperCase();


  const match =
    text.match(
      /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/
    );


  if (
    !match
  ) {

    return 0;

  }


  let hours =
    Number(
      match[1]
    );


  const minutes =
    Number(
      match[2]
    );


  const period =
    match[3];


  if (
    !Number.isFinite(
      hours
    ) ||
    !Number.isFinite(
      minutes
    ) ||
    minutes >
    59
  ) {

    return 0;

  }


  if (
    period ===
    "AM"
  ) {

    if (
      hours ===
      12
    ) {

      hours =
        0;

    }

  } else if (
    period ===
    "PM"
  ) {

    if (
      hours !==
      12
    ) {

      hours +=
        12;

    }

  }


  if (
    hours >
    23
  ) {

    return 0;

  }


  return (
    hours *
    60 +
    minutes
  );

}


function minutesToTime(
  total
) {

  const hours =
    Math.floor(
      total /
      60
    );


  const minutes =
    total %
    60;


  return (

    String(
      hours
    ).padStart(
      2,
      "0"
    ) +

    ":" +

    String(
      minutes
    ).padStart(
      2,
      "0"
    )

  );

}


function formatTime(
  value
) {

  const minutes =
    timeToMinutes(
      value
    );


  const hours =
    Math.floor(
      minutes /
      60
    );


  const minute =
    minutes %
    60;


  const suffix =
    hours >=
    12
      ? "PM"
      : "AM";


  const displayHour =
    hours %
      12 ||
    12;


  return (

    `${displayHour}:` +

    `${String(
      minute
    ).padStart(
      2,
      "0"
    )} ${suffix}`

  );

}


function formatTimeRange(
  start,
  end
) {

  return (

    `${formatTime(
      start
    )} – ${formatTime(
      end
    )}`

  );

}


/* =========================================================
   BOOKING DATES
========================================================= */

function generateBookingDates(
  days
) {

  const result =
    [];


  const safeDays =
    Math.max(
      0,
      Number(
        days
      ) ||
      7
    );


  const today =
    new Date();


  today.setHours(
    0,
    0,
    0,
    0
  );


  for (
    let index =
      0;
    index <=
    safeDays;
    index++
  ) {

    const date =
      new Date(
        today
      );


    date.setDate(
      today.getDate() +
      index
    );


    const year =
      date.getFullYear();


    const monthNumber =
      String(
        date.getMonth() +
        1
      ).padStart(
        2,
        "0"
      );


    const dayNumber =
      String(
        date.getDate()
      ).padStart(
        2,
        "0"
      );


    const monthName =
      date.toLocaleString(
        "en-US",
        {
          month:
            "short",
        }
      );


    const iso =
      `${year}-${monthNumber}-${dayNumber}`;


    result.push({

      id:
        `${dayNumber}-${monthName.toLowerCase()}`,

      date:
        iso,

      day:
        dayNumber,

      month:
        monthName.toUpperCase(),

      label:
        index ===
        0
          ? "Today"
          : index ===
            1
            ? "Tomorrow"
            : date.toLocaleString(
                "en-US",
                {
                  weekday:
                    "long",
                }
              ),

    });

  }


  return result;

}


export default FarmerBook;
