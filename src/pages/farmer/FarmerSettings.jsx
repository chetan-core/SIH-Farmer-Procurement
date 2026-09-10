
import {
  Bell,
  CheckCircle2,
  ChevronLeft,
  ChevronDown,
  Globe2,
  Leaf,
  LocateFixed,
  LockKeyhole,
  MapPin,
  Navigation,
  Phone,
  Save,
  ShieldCheck,
  User,
  Wheat,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router";

import {
  useEffect,
  useState,
} from "react";

import Header from "../../components/Header";

import {
  getCurrentFarmer,
  setCurrentFarmer,
} from "../../data/appStore";

import {
  useLanguage,
} from "../../translations/LanguageContext";


const API_URL =
  String(
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api"
  ).replace(
    /\/+$/,
    ""
  );


function FarmerSettings() {

  const navigate =
    useNavigate();


  const {
    language,
    setLanguage,
  } =
    useLanguage();


  const [
    farmer,
    setFarmer,
  ] =
    useState(
      () =>
        getCurrentFarmer()
    );


  const [
    form,
    setForm,
  ] =
    useState({
      name: "",
      phone: "",
      alternatePhone: "",
      stateId: "",
      state: "",
      districtId: "",
      district: "",
      mandalId: "",
      mandal: "",
      villageId: "",
      village: "",
      pincode: "",
      farmAddress: "",
      landmark: "",
      currentLat: "",
      currentLng: "",
      locationAccuracyM: "",
      locationSource: "REGISTERED",
      locationUpdatedAt: "",
      farmSizeAcres: "",
      irrigationType: "",
      language: "en",
      preferredCenterId: "main",
      primaryCrop: "wheat",
      estimatedQuantity: "",
    });


  const [
    smsEnabled,
    setSmsEnabled,
  ] =
    useState(true);


  const [
    inAppEnabled,
    setInAppEnabled,
  ] =
    useState(true);


  const [
    centers,
    setCenters,
  ] =
    useState([]);


  const [
    saving,
    setSaving,
  ] =
    useState(false);


  const [
    saved,
    setSaved,
  ] =
    useState(false);


  const [
    error,
    setError,
  ] =
    useState("");

  const [
    states,
    setStates,
  ] =
    useState([]);

  const [
    districts,
    setDistricts,
  ] =
    useState([]);

  const [
    mandals,
    setMandals,
  ] =
    useState([]);

  const [
    villages,
    setVillages,
  ] =
    useState([]);

  const [
    locationLoading,
    setLocationLoading,
  ] =
    useState(false);

  const [
    locationMessage,
    setLocationMessage,
  ] =
    useState("");

  const [
    passwordForm,
    setPasswordForm,
  ] =
    useState({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

  const [
    passwordSaving,
    setPasswordSaving,
  ] =
    useState(false);




  /*
    Refresh the local farmer reference when the
    currently logged-in farmer changes.
  */
  useEffect(() => {

    const current =
      getCurrentFarmer();

    setFarmer(
      current
    );

  }, []);


  useEffect(() => {

    if (
      farmer
    ) {

      setForm({

        name:
          farmer.name ||
          "",

        phone:
          farmer.phone ||
          "",

        alternatePhone:
          farmer.alternate_phone ??
          farmer.alternatePhone ??
          "",

        stateId:
          farmer.state_id ??
          farmer.stateId ??
          "",

        state:
          farmer.state ||
          farmer.state_name ||
          "",

        districtId:
          farmer.district_id ??
          farmer.districtId ??
          "",

        district:
          farmer.district ||
          farmer.district_name ||
          "",

        mandalId:
          farmer.mandal_id ??
          farmer.mandalId ??
          "",

        mandal:
          farmer.mandal ||
          farmer.mandal_name ||
          "",

        villageId:
          farmer.village_id ??
          farmer.villageId ??
          "",

        village:
          farmer.village ||
          "",

        pincode:
          farmer.pincode ||
          "",

        farmAddress:
          farmer.farm_address ??
          farmer.farmAddress ??
          "",

        landmark:
          farmer.landmark ||
          "",

        currentLat:
          farmer.current_lat ??
          farmer.currentLat ??
          "",

        currentLng:
          farmer.current_lng ??
          farmer.currentLng ??
          "",

        locationAccuracyM:
          farmer.location_accuracy_m ??
          farmer.locationAccuracyM ??
          "",

        locationSource:
          farmer.location_source ??
          farmer.locationSource ??
          "REGISTERED",

        locationUpdatedAt:
          farmer.location_updated_at ??
          farmer.locationUpdatedAt ??
          "",

        farmSizeAcres:
          farmer.farm_size_acres ??
          farmer.farmSizeAcres ??
          "",

        irrigationType:
          farmer.irrigation_type ??
          farmer.irrigationType ??
          "",

        language:
          farmer.language ||
          language ||
          "en",

        preferredCenterId:
          farmer.preferred_center_id ||
          farmer.preferredCenterId ||
          "main",

        primaryCrop:
          farmer.primary_crop ||
          farmer.primaryCrop ||
          "wheat",

        estimatedQuantity:
          farmer.estimated_quantity ??
          farmer.estimatedQuantity ??
          "",

      });

    }

  }, [
    farmer,
    language,
  ]);


  useEffect(() => {

    const stored =
      localStorage.getItem(
        "krishisetu-farmer-settings"
      );

    if (!stored) {
      return;
    }

    try {

      const parsed =
        JSON.parse(
          stored
        );

      setSmsEnabled(
        parsed?.smsEnabled !==
          false
      );

      setInAppEnabled(
        parsed?.inAppEnabled !==
          false
      );

    } catch (
      settingsError
    ) {

      console.error(
        "Could not load farmer settings:",
        settingsError
      );

    }

  }, []);


  useEffect(() => {

    async function loadCenters() {

      try {

        const response =
          await fetch(
            `${API_URL}/centers`
          );


        const data =
          await response.json();


        if (
          response.ok &&
          Array.isArray(
            data?.centers
          )
        ) {

          setCenters(
            data.centers
          );

        }

      } catch (
        centerError
      ) {

        console.error(
          "Settings centers error:",
          centerError
        );

      }

    }


    loadCenters();

  }, []);


  useEffect(() => {

    loadStates();

  }, []);


  useEffect(() => {

    if (
      form.stateId
    ) {

      loadDistricts(
        form.stateId
      );

    }

  }, [
    form.stateId,
  ]);


  useEffect(() => {

    if (
      form.districtId
    ) {

      loadMandals(
        form.districtId
      );

    }

  }, [
    form.districtId,
  ]);


  useEffect(() => {

    if (
      form.mandalId
    ) {

      loadVillages(
        form.mandalId
      );

    }

  }, [
    form.mandalId,
  ]);



  function extractRows(data, keys = []) {
    for (const key of keys) {
      if (Array.isArray(data?.[key])) {
        return data[key];
      }
    }

    if (Array.isArray(data?.data)) {
      return data.data;
    }

    if (Array.isArray(data?.results)) {
      return data.results;
    }

    return [];
  }


  function normaliseLocationRow(
    row
  ) {
    return {
      id:
        String(
          row?.id ??
          row?.stateId ??
          row?.state_id ??
          row?.districtId ??
          row?.district_id ??
          row?.mandalId ??
          row?.mandal_id ??
          row?.subDistrictId ??
          row?.sub_district_id ??
          row?.villageId ??
          row?.village_id ??
          ""
        ),

      name:
        String(
          row?.name ??
          row?.stateName ??
          row?.state_name ??
          row?.districtName ??
          row?.district_name ??
          row?.mandalName ??
          row?.mandal_name ??
          row?.subDistrictName ??
          row?.sub_district_name ??
          row?.villageName ??
          row?.village_name ??
          ""
        ),

      code:
        row?.code ??
        row?.stateCode ??
        row?.state_code ??
        row?.districtCode ??
        row?.district_code ??
        row?.mandalCode ??
        row?.mandal_code ??
        row?.villageCode ??
        row?.village_code ??
        "",

      pincode:
        row?.pincode ??
        row?.pinCode ??
        "",
    };
  }


  async function fetchLocationRows(
    endpoint,
    params = {}
  ) {

    const url =
      new URL(
        `${API_URL}${endpoint}`
      );

    Object.entries(
      params
    ).forEach(
      (
        [
          key,
          value,
        ]
      ) => {

        if (
          value !==
          undefined &&
          value !==
          null &&
          String(value) !==
          ""
        ) {

          url.searchParams.set(
            key,
            value
          );

        }

      }
    );


    const response =
      await fetch(
        url.toString()
      );


    const data =
      await response.json()
        .catch(
          () => null
        );


    if (
      !response.ok ||
      data?.success ===
        false
    ) {

      throw new Error(
        data?.message ||
        "Unable to load location data."
      );

    }


    return data;

  }


  async function loadStates() {

    try {

      const data =
        await fetchLocationRows(
          "/locations/states"
        );


      setStates(
        extractRows(
          data,
          [
            "states",
            "locations",
            "items",
          ]
        )
          .map(
            normaliseLocationRow
          )
          .filter(
            row =>
              row.id &&
              row.name
          )
      );

    } catch (
      stateError
    ) {

      console.error(
        "Farmer settings state load error:",
        stateError
      );

      setError(
        stateError?.message ||
        "Unable to load states."
      );

    }

  }


  async function loadDistricts(
    stateId
  ) {

    if (
      !stateId
    ) {

      setDistricts([]);
      setMandals([]);
      setVillages([]);

      return;

    }


    try {

      const data =
        await fetchLocationRows(
          "/locations/districts",
          {
            stateId,
          }
        );


      setDistricts(
        extractRows(
          data,
          [
            "districts",
            "locations",
            "items",
          ]
        )
          .map(
            normaliseLocationRow
          )
          .filter(
            row =>
              row.id &&
              row.name
          )
      );

    } catch (
      districtError
    ) {

      console.error(
        "Farmer settings district load error:",
        districtError
      );

      setError(
        districtError?.message ||
        "Unable to load districts."
      );

    }

  }


  async function loadMandals(
    districtId
  ) {

    if (
      !districtId
    ) {

      setMandals([]);
      setVillages([]);

      return;

    }


    try {

      const data =
        await fetchLocationRows(
          "/locations/mandals",
          {
            districtId,
          }
        );


      setMandals(
        extractRows(
          data,
          [
            "mandals",
            "subDistricts",
            "sub_districts",
            "locations",
            "items",
          ]
        )
          .map(
            normaliseLocationRow
          )
          .filter(
            row =>
              row.id &&
              row.name
          )
      );

    } catch (
      mandalError
    ) {

      console.error(
        "Farmer settings mandal load error:",
        mandalError
      );

      setError(
        mandalError?.message ||
        "Unable to load mandals."
      );

    }

  }


  async function loadVillages(
    mandalId
  ) {

    if (
      !mandalId
    ) {

      setVillages([]);

      return;

    }


    try {

      const data =
        await fetchLocationRows(
          "/locations/villages",
          {
            mandalId,
          }
        );


      setVillages(
        extractRows(
          data,
          [
            "villages",
            "locations",
            "items",
          ]
        )
          .map(
            normaliseLocationRow
          )
          .filter(
            row =>
              row.id &&
              row.name
          )
      );

    } catch (
      villageError
    ) {

      console.error(
        "Farmer settings village load error:",
        villageError
      );

      setError(
        villageError?.message ||
        "Unable to load villages."
      );

    }

  }


  async function useCurrentLocation() {

    if (
      !navigator.geolocation
    ) {

      setError(
        "Location services are not available in this browser."
      );

      return;

    }


    setLocationLoading(
      true
    );

    setLocationMessage(
      "Scanning your current location..."
    );

    setError(
      ""
    );


    try {

      const position =
        await new Promise(
          (
            resolve,
            reject
          ) => {

            navigator.geolocation.getCurrentPosition(
              resolve,
              reject,
              {
                enableHighAccuracy:
                  true,
                timeout:
                  20000,
                maximumAge:
                  0,
              }
            );

          }
        );


      const latitude =
        Number(
          position.coords.latitude
        );

      const longitude =
        Number(
          position.coords.longitude
        );

      const accuracy =
        Number(
          position.coords.accuracy
        );


      const response =
        await fetch(
          `${API_URL}/locations/resolve?lat=${encodeURIComponent(
            latitude
          )}&lng=${encodeURIComponent(
            longitude
          )}&radiusKm=50`
        );


      const data =
        await response.json()
          .catch(
            () => null
          );


      if (
        !response.ok ||
        data?.success ===
          false ||
        !data?.location
      ) {

        throw new Error(
          data?.message ||
          "Your GPS position could not be matched to an official village."
        );

      }


      const location =
        data.location;


      setForm(
        current => ({
          ...current,

          stateId:
            String(
              location.stateId ??
              ""
            ),

          state:
            location.state ||
            "",

          districtId:
            String(
              location.districtId ??
              ""
            ),

          district:
            location.district ||
            "",

          mandalId:
            String(
              location.mandalId ??
              ""
            ),

          mandal:
            location.mandal ||
            "",

          villageId:
            String(
              location.villageId ??
              ""
            ),

          village:
            location.village ||
            "",

          pincode:
            location.pincode ||
            current.pincode ||
            "",

          currentLat:
            latitude,

          currentLng:
            longitude,

          locationAccuracyM:
            accuracy,

          locationSource:
            "GPS",

          locationUpdatedAt:
            new Date().toISOString(),

        })
      );


      setLocationMessage(
        `Location detected${location.village ? `: ${location.village}` : ""}${location.mandal ? `, ${location.mandal}` : ""}${location.district ? `, ${location.district}` : ""}${location.state ? `, ${location.state}` : ""}.`
      );


    } catch (
      locationError
    ) {

      console.error(
        "Farmer settings GPS error:",
        locationError
      );


      const message =
        locationError?.code ===
          1
          ? "Location permission was denied. Allow location access and try again."
          : locationError?.code ===
              2
            ? "Your location could not be determined."
            : locationError?.code ===
                3
              ? "Location request timed out. Please try again."
              : locationError?.message ||
                "Unable to detect your current location.";


      setError(
        message
      );

      setLocationMessage(
        ""
      );

    } finally {

      setLocationLoading(
        false
      );

    }

  }


  function openLocationMap() {

    const lat =
      Number(
        form.currentLat
      );

    const lng =
      Number(
        form.currentLng
      );


    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {

      setError(
        "Current GPS coordinates are not available yet."
      );

      return;

    }


    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${lat},${lng}`
      )}`,
      "_blank",
      "noopener,noreferrer"
    );

  }


  async function handlePasswordChange(
    event
  ) {

    event.preventDefault();


    const currentPassword =
      passwordForm.currentPassword;

    const newPassword =
      passwordForm.newPassword;

    const confirmPassword =
      passwordForm.confirmPassword;


    if (
      currentPassword.length <
      6
    ) {

      setError(
        "Enter your current password."
      );

      return;

    }


    if (
      newPassword.length <
      6
    ) {

      setError(
        "New password must contain at least 6 characters."
      );

      return;

    }


    if (
      newPassword !==
      confirmPassword
    ) {

      setError(
        "New password and confirmation do not match."
      );

      return;

    }


    setPasswordSaving(
      true
    );

    setError(
      ""
    );


    try {

      const response =
        await fetch(
          `${API_URL}/farmers/${encodeURIComponent(
            farmer.id
          )}/change-password`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                currentPassword,
                newPassword,
              }),

          }
        );


      const data =
        await response.json()
          .catch(
            () => null
          );


      if (
        !response.ok ||
        data?.success ===
          false
      ) {

        throw new Error(
          data?.message ||
          "Unable to change your password."
        );

      }


      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setSaved(
        true
      );

    } catch (
      passwordError
    ) {

      console.error(
        "Farmer password change error:",
        passwordError
      );

      setError(
        passwordError?.message ||
        "Unable to change your password."
      );

    } finally {

      setPasswordSaving(
        false
      );

    }

  }


  function updateField(
    field,
    value
  ) {

    setForm(
      current => ({
        ...current,

        [field]:
          value,
      })
    );


    setSaved(
      false
    );


    setError(
      ""
    );

  }


  function normalisePhone(
    value
  ) {

    return String(
      value || ""
    ).replace(
      /\D/g,
      ""
    );

  }


  function normalizeFarmer(
    value
  ) {

    if (
      !value
    ) {

      return null;

    }


    return {

      ...value,

      id:
        value.id,

      name:
        value.name ||
        "",

      phone:
        normalisePhone(
          value.phone
        ),

      stateId:
        value.state_id ??
        value.stateId ??
        null,

      districtId:
        value.district_id ??
        value.districtId ??
        null,

      mandalId:
        value.mandal_id ??
        value.mandalId ??
        null,

      village:
        value.village ||
        "",

      language:
        value.language ||
        "en",

      preferredCenterId:
        value.preferred_center_id ??
        value.preferredCenterId ??
        null,

      primaryCrop:
        value.primary_crop ??
        value.primaryCrop ??
        null,

      estimatedQuantity:
        Number(
          value.estimated_quantity ??
          value.estimatedQuantity ??
          0
        ),

    };

  }


  async function handleSave(
    event
  ) {

    event.preventDefault();


    const currentFarmer =
      getCurrentFarmer();


    if (
      !currentFarmer?.id
    ) {

      setError(
        "Farmer account could not be loaded. Please login again."
      );

      return;

    }


    const name =
      form.name.trim();


    const cleanedPhone =
      normalisePhone(
        form.phone
      );


    const village =
      form.village.trim();


    const estimatedQuantity =
      Number(
        form.estimatedQuantity ||
        0
      );


    if (
      !name
    ) {

      setError(
        "Please enter your name."
      );

      return;

    }


    if (
      cleanedPhone.length !==
      10
    ) {

      setError(
        "Please enter a valid 10-digit mobile number."
      );

      return;

    }


    if (
      !Number.isFinite(
        estimatedQuantity
      ) ||
      estimatedQuantity <
        0
    ) {

      setError(
        "Quantity cannot be negative."
      );

      return;

    }


    const latitude =
      form.currentLat === ""
        ? null
        : Number(
            form.currentLat
          );

    const longitude =
      form.currentLng === ""
        ? null
        : Number(
            form.currentLng
          );

    if (
      latitude !== null &&
      (
        !Number.isFinite(
          latitude
        ) ||
        latitude < -90 ||
        latitude > 90
      )
    ) {

      setError(
        "Current latitude is invalid."
      );

      return;

    }


    if (
      longitude !== null &&
      (
        !Number.isFinite(
          longitude
        ) ||
        longitude < -180 ||
        longitude > 180
      )
    ) {

      setError(
        "Current longitude is invalid."
      );

      return;

    }


    if (
      ![
        "en",
        "hi",
        "te",
      ].includes(
        form.language
      )
    ) {

      setError(
        "Invalid language."
      );

      return;

    }


    setSaving(
      true
    );


    setSaved(
      false
    );


    setError(
      ""
    );


    try {

      /*
        Use the current canonical database ID.
        Never generate or replace it locally.
      */

      const response =
        await fetch(
          `${API_URL}/farmers/${encodeURIComponent(
            currentFarmer.id
          )}`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({

                name,

                phone:
                  cleanedPhone,

                alternatePhone:
                  normalisePhone(
                    form.alternatePhone
                  ) ||
                  null,

                stateId:
                  form.stateId ||
                  null,

                state:
                  form.state ||
                  null,

                districtId:
                  form.districtId ||
                  null,

                district:
                  form.district ||
                  null,

                mandalId:
                  form.mandalId ||
                  null,

                mandal:
                  form.mandal ||
                  null,

                village:
                  village ||
                  null,

                villageId:
                  form.villageId ||
                  null,

                pincode:
                  form.pincode.trim() ||
                  null,

                farmAddress:
                  form.farmAddress.trim() ||
                  null,

                landmark:
                  form.landmark.trim() ||
                  null,

                currentLat:
                  form.currentLat === ""
                    ? null
                    : Number(
                        form.currentLat
                      ),

                currentLng:
                  form.currentLng === ""
                    ? null
                    : Number(
                        form.currentLng
                      ),

                locationAccuracyM:
                  form.locationAccuracyM === ""
                    ? null
                    : Number(
                        form.locationAccuracyM
                      ),

                locationSource:
                  form.locationSource ||
                  "REGISTERED",

                primaryCrop:
                  form.primaryCrop ||
                  null,

                estimatedQuantity,

                farmSizeAcres:
                  form.farmSizeAcres === ""
                    ? null
                    : Number(
                        form.farmSizeAcres
                      ),

                irrigationType:
                  form.irrigationType ||
                  null,

                language:
                  form.language,

                preferredCenterId:
                  form.preferredCenterId ||
                  null,

              }),

          }
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
          "Unable to save settings."
        );

      }


      const savedFarmer =
        normalizeFarmer(
          data?.farmer
        );


      if (
        !savedFarmer?.id
      ) {

        throw new Error(
          "Settings were saved, but the server did not return the updated farmer account."
        );

      }


      /*
        IMPORTANT:

        The backend response is now the
        single source of truth.

        This updates:
        - farmer data
        - current farmer ID
        - current phone number
        - current language
      */

      setCurrentFarmer(
        savedFarmer
      );


      setFarmer(
        savedFarmer
      );


      setForm(
        current => ({
          ...current,

          name:
            savedFarmer.name ||
            "",

          phone:
            savedFarmer.phone ||
            "",

          alternatePhone:
            savedFarmer.alternate_phone ??
            savedFarmer.alternatePhone ??
            "",

          stateId:
            savedFarmer.state_id ??
            savedFarmer.stateId ??
            "",

          state:
            savedFarmer.state ||
            savedFarmer.state_name ||
            "",

          districtId:
            savedFarmer.district_id ??
            savedFarmer.districtId ??
            "",

          district:
            savedFarmer.district ||
            savedFarmer.district_name ||
            "",

          mandalId:
            savedFarmer.mandal_id ??
            savedFarmer.mandalId ??
            "",

          mandal:
            savedFarmer.mandal ||
            savedFarmer.mandal_name ||
            "",

          villageId:
            savedFarmer.village_id ??
            savedFarmer.villageId ??
            "",

          village:
            savedFarmer.village ||
            "",

          pincode:
            savedFarmer.pincode ||
            "",

          farmAddress:
            savedFarmer.farm_address ??
            savedFarmer.farmAddress ??
            "",

          landmark:
            savedFarmer.landmark ||
            "",

          currentLat:
            savedFarmer.current_lat ??
            savedFarmer.currentLat ??
            "",

          currentLng:
            savedFarmer.current_lng ??
            savedFarmer.currentLng ??
            "",

          locationAccuracyM:
            savedFarmer.location_accuracy_m ??
            savedFarmer.locationAccuracyM ??
            "",

          locationSource:
            savedFarmer.location_source ??
            savedFarmer.locationSource ??
            "REGISTERED",

          locationUpdatedAt:
            savedFarmer.location_updated_at ??
            savedFarmer.locationUpdatedAt ??
            "",

          farmSizeAcres:
            savedFarmer.farm_size_acres ??
            savedFarmer.farmSizeAcres ??
            "",

          irrigationType:
            savedFarmer.irrigation_type ??
            savedFarmer.irrigationType ??
            "",

          language:
            savedFarmer.language ||
            "en",

          preferredCenterId:
            savedFarmer.preferredCenterId ||
            savedFarmer.preferred_center_id ||
            "main",

          primaryCrop:
            savedFarmer.primaryCrop ||
            savedFarmer.primary_crop ||
            "wheat",

          estimatedQuantity:
            savedFarmer.estimatedQuantity ??
            savedFarmer.estimated_quantity ??
            "",

        })
      );


      setLanguage(
        savedFarmer.language ||
        form.language
      );


      localStorage.setItem(
        "krishisetu-farmer-settings",
        JSON.stringify({

          smsEnabled,

          inAppEnabled,

        })
      );


      setSaved(
        true
      );


      /*
        Give React/store listeners a moment to
        receive the new farmer, then go home.
      */

      setTimeout(
        () => {

          navigate(
            "/farmer/home",
            {
              replace:
                true,
            }
          );

        },
        500
      );


    } catch (
      saveError
    ) {

      console.error(
        "Farmer settings error:",
        saveError
      );


      setError(
        saveError?.message ||
        "Unable to save settings."
      );

    } finally {

      setSaving(
        false
      );

    }

  }


  if (
    !farmer
  ) {

    return (

      <div className="farmer-settings-page">

        <Header />


        <main className="farmer-settings-container">

          <section className="farmer-settings-empty">

            <ShieldCheck
              size={34}
            />


            <h1>
              Farmer account not found
            </h1>


            <p>
              Please login again to continue.
            </p>


            <Link
              to="/farmer/login"
              className="farmer-settings-primary"
            >

              Go to Login

            </Link>

          </section>

        </main>

      </div>

    );

  }


  return (

    <div className="farmer-settings-page">

      <Header />


      <main className="farmer-settings-container">


        <Link
          to="/farmer/home"
          className="farmer-settings-back"
        >

          <ChevronLeft
            size={17}
          />

          Farmer Home

        </Link>


        <section className="farmer-settings-hero">

          <div>

            <span className="page-eyebrow">

              FARMER PORTAL

            </span>


            <h1>
              Account & preferences
            </h1>


            <p>
              Keep your farmer profile and communication preferences up to date.
            </p>

          </div>


          <div className="farmer-settings-hero-icon">

            <User
              size={29}
            />

          </div>

        </section>


        <form
          className="farmer-settings-layout"
          onSubmit={
            handleSave
          }
        >


          <section className="farmer-settings-card">

            <div className="farmer-settings-section-heading">

              <div className="farmer-settings-section-icon">

                <User
                  size={19}
                />

              </div>


              <div>

                <h2>
                  Personal details
                </h2>

                <p>
                  Information used for your farmer account.
                </p>

              </div>

            </div>


            <div className="farmer-settings-grid">

              <SettingsField
                label="Full name"
                icon={
                  <User
                    size={17}
                  />
                }
              >

                <input
                  value={
                    form.name
                  }
                  onChange={
                    event =>
                      updateField(
                        "name",
                        event.target.value
                      )
                  }
                  placeholder="Enter your name"
                />

              </SettingsField>


              <SettingsField
                label="Mobile number"
                icon={
                  <Phone
                    size={17}
                  />
                }
              >

                <input
                  value={
                    form.phone
                  }
                  onChange={
                    event =>
                      updateField(
                        "phone",
                        event.target.value
                          .replace(
                            /[^0-9]/g,
                            ""
                          )
                          .slice(
                            0,
                            10
                          )
                      )
                  }
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="10-digit mobile number"
                />

              </SettingsField>


              <SettingsField
                label="Registered village"
                icon={
                  <MapPin
                    size={17}
                  />
                }
              >

                <input
                  value={
                    form.village
                  }
                  readOnly
                  placeholder="Select village below"
                />

              </SettingsField>


              <SettingsField
                label="Preferred language"
                icon={
                  <Globe2
                    size={17}
                  />
                }
              >

                <select
                  value={
                    form.language
                  }
                  onChange={
                    event =>
                      updateField(
                        "language",
                        event.target.value
                      )
                  }
                >

                  <option value="en">
                    English
                  </option>

                  <option value="hi">
                    हिन्दी
                  </option>

                  <option value="te">
                    తెలుగు
                  </option>

                </select>

              </SettingsField>

            </div>

          </section>



          <section className="farmer-settings-card">

            <div className="farmer-settings-section-heading">

              <div className="farmer-settings-section-icon">
                <LocateFixed size={19} />
              </div>

              <div>
                <h2>
                  Current & registered location
                </h2>

                <p>
                  GPS location is kept separate from your registered village and is used for transport pickup matching.
                </p>
              </div>

            </div>


            <div className="farmer-settings-location-actions">

              <button
                type="button"
                className="farmer-settings-primary"
                onClick={useCurrentLocation}
                disabled={locationLoading}
              >
                <LocateFixed size={17} />

                {locationLoading
                  ? "Scanning..."
                  : "Use current location"}
              </button>


              <button
                type="button"
                className="farmer-settings-secondary"
                onClick={openLocationMap}
                disabled={!form.currentLat || !form.currentLng}
              >
                <Navigation size={17} />
                View GPS on map
              </button>

            </div>


            {locationMessage && (
              <div className="farmer-settings-location-message">
                <CheckCircle2 size={17} />
                <span>
                  {locationMessage}
                </span>
              </div>
            )}


            <div className="farmer-settings-grid">

              <SettingsField
                label="State"
                icon={<MapPin size={17} />}
              >
                <select
                  value={form.stateId}
                  onChange={event => {
                    const value = event.target.value;
                    const selected =
                      states.find(
                        item =>
                          String(item.id) ===
                          String(value)
                      );

                    updateField(
                      "stateId",
                      value
                    );

                    updateField(
                      "state",
                      selected?.name || ""
                    );

                    updateField(
                      "districtId",
                      ""
                    );

                    updateField(
                      "district",
                      ""
                    );

                    updateField(
                      "mandalId",
                      ""
                    );

                    updateField(
                      "mandal",
                      ""
                    );

                    updateField(
                      "villageId",
                      ""
                    );

                    updateField(
                      "village",
                      ""
                    );
                  }}
                >
                  <option value="">
                    Select state
                  </option>

                  {states.map(
                    state => (
                      <option
                        key={state.id}
                        value={state.id}
                      >
                        {state.name}
                      </option>
                    )
                  )}
                </select>
              </SettingsField>


              <SettingsField
                label="District"
                icon={<MapPin size={17} />}
              >
                <select
                  value={form.districtId}
                  disabled={!form.stateId}
                  onChange={event => {
                    const value =
                      event.target.value;

                    const selected =
                      districts.find(
                        item =>
                          String(item.id) ===
                          String(value)
                      );

                    updateField(
                      "districtId",
                      value
                    );

                    updateField(
                      "district",
                      selected?.name || ""
                    );

                    updateField(
                      "mandalId",
                      ""
                    );

                    updateField(
                      "mandal",
                      ""
                    );

                    updateField(
                      "villageId",
                      ""
                    );

                    updateField(
                      "village",
                      ""
                    );
                  }}
                >
                  <option value="">
                    {form.stateId
                      ? "Select district"
                      : "Select state first"}
                  </option>

                  {districts.map(
                    district => (
                      <option
                        key={district.id}
                        value={district.id}
                      >
                        {district.name}
                      </option>
                    )
                  )}
                </select>
              </SettingsField>


              <SettingsField
                label="Mandal / Sub-district"
                icon={<MapPin size={17} />}
              >
                <select
                  value={form.mandalId}
                  disabled={!form.districtId}
                  onChange={event => {
                    const value =
                      event.target.value;

                    const selected =
                      mandals.find(
                        item =>
                          String(item.id) ===
                          String(value)
                      );

                    updateField(
                      "mandalId",
                      value
                    );

                    updateField(
                      "mandal",
                      selected?.name || ""
                    );

                    updateField(
                      "villageId",
                      ""
                    );

                    updateField(
                      "village",
                      ""
                    );
                  }}
                >
                  <option value="">
                    {form.districtId
                      ? "Select mandal"
                      : "Select district first"}
                  </option>

                  {mandals.map(
                    mandal => (
                      <option
                        key={mandal.id}
                        value={mandal.id}
                      >
                        {mandal.name}
                      </option>
                    )
                  )}
                </select>
              </SettingsField>


              <SettingsField
                label="Village"
                icon={<MapPin size={17} />}
              >
                <select
                  value={form.villageId}
                  disabled={!form.mandalId}
                  onChange={event => {
                    const value =
                      event.target.value;

                    const selected =
                      villages.find(
                        item =>
                          String(item.id) ===
                          String(value)
                      );

                    updateField(
                      "villageId",
                      value
                    );

                    updateField(
                      "village",
                      selected?.name || ""
                    );

                    if (
                      selected?.pincode
                    ) {

                      updateField(
                        "pincode",
                        selected.pincode
                      );

                    }

                  }}
                >
                  <option value="">
                    {form.mandalId
                      ? "Select village"
                      : "Select mandal first"}
                  </option>

                  {villages.map(
                    village => (
                      <option
                        key={village.id}
                        value={village.id}
                      >
                        {village.name}
                      </option>
                    )
                  )}
                </select>
              </SettingsField>


              <SettingsField
                label="Pincode"
                icon={<MapPin size={17} />}
              >
                <input
                  value={form.pincode}
                  onChange={event =>
                    updateField(
                      "pincode",
                      event.target.value
                        .replace(
                          /[^0-9]/g,
                          ""
                        )
                        .slice(
                          0,
                          6
                        )
                    )
                  }
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6-digit pincode"
                />
              </SettingsField>


              <SettingsField
                label="Landmark"
                icon={<MapPin size={17} />}
              >
                <input
                  value={form.landmark}
                  onChange={event =>
                    updateField(
                      "landmark",
                      event.target.value
                    )
                  }
                  placeholder="Nearby landmark"
                />
              </SettingsField>


              <SettingsField
                label="Farm / pickup address"
                icon={<MapPin size={17} />}
                full
              >
                <input
                  value={form.farmAddress}
                  onChange={event =>
                    updateField(
                      "farmAddress",
                      event.target.value
                    )
                  }
                  placeholder="Farm gate, road, hamlet or pickup address"
                />
              </SettingsField>

            </div>


            {form.currentLat &&
              form.currentLng && (
                <div className="farmer-settings-location-meta">
                  <span>
                    GPS: {Number(form.currentLat).toFixed(6)}, {Number(form.currentLng).toFixed(6)}
                  </span>

                  {form.locationAccuracyM && (
                    <span>
                      Accuracy: ±{Math.round(
                        Number(
                          form.locationAccuracyM
                        )
                      )} m
                    </span>
                  )}

                  <span>
                    Source: {form.locationSource}
                  </span>
                </div>
              )}

          </section>


          <section className="farmer-settings-card">

            <div className="farmer-settings-section-heading">

              <div className="farmer-settings-section-icon green">
                <Wheat size={19} />
              </div>

              <div>
                <h2>
                  Farm details
                </h2>

                <p>
                  Keep your farming information ready for procurement and transport planning.
                </p>
              </div>

            </div>


            <div className="farmer-settings-grid">

              <SettingsField
                label="Farm size (acres)"
                icon={<Wheat size={17} />}
              >
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.farmSizeAcres}
                  onChange={event =>
                    updateField(
                      "farmSizeAcres",
                      event.target.value
                    )
                  }
                  placeholder="e.g. 4.5"
                />
              </SettingsField>


              <SettingsField
                label="Irrigation"
                icon={<Leaf size={17} />}
              >
                <select
                  value={form.irrigationType}
                  onChange={event =>
                    updateField(
                      "irrigationType",
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    Select irrigation type
                  </option>
                  <option value="RAINFED">
                    Rainfed
                  </option>
                  <option value="BOREWELL">
                    Borewell
                  </option>
                  <option value="CANAL">
                    Canal
                  </option>
                  <option value="OPEN_WELL">
                    Open well
                  </option>
                  <option value="DRIP">
                    Drip
                  </option>
                  <option value="SPRINKLER">
                    Sprinkler
                  </option>
                  <option value="OTHER">
                    Other
                  </option>
                </select>
              </SettingsField>

            </div>

          </section>


          <section className="farmer-settings-card">

            <div className="farmer-settings-section-heading">

              <div className="farmer-settings-section-icon green">

                <Wheat
                  size={19}
                />

              </div>


              <div>

                <h2>
                  Procurement preferences
                </h2>

                <p>
                  These preferences help speed up future bookings.
                </p>

              </div>

            </div>


            <div className="farmer-settings-grid">

              <SettingsField
                label="Primary crop"
                icon={
                  <Leaf
                    size={17}
                  />
                }
              >

                <select
                  value={
                    form.primaryCrop
                  }
                  onChange={
                    event =>
                      updateField(
                        "primaryCrop",
                        event.target.value
                      )
                  }
                >

                  <option value="wheat">
                    Wheat
                  </option>

                  <option value="paddy">
                    Paddy
                  </option>

                  <option value="maize">
                    Maize
                  </option>

                  <option value="cotton">
                    Cotton
                  </option>

                </select>

              </SettingsField>


              <SettingsField
                label="Typical quantity"
                icon={
                  <Wheat
                    size={17}
                  />
                }
              >

                <div className="farmer-settings-input-with-suffix">

                  <input
                    type="number"
                    min="1"
                    value={
                      form.estimatedQuantity
                    }
                    onChange={
                      event =>
                        updateField(
                          "estimatedQuantity",
                          event.target.value
                        )
                    }
                    placeholder="e.g. 250"
                  />

                  <span>
                    kg
                  </span>

                </div>

              </SettingsField>


              <SettingsField
                label="Preferred procurement center"
                icon={
                  <MapPin
                    size={17}
                  />
                }
                full
              >

                <select
                  value={
                    form.preferredCenterId
                  }
                  onChange={
                    event =>
                      updateField(
                        "preferredCenterId",
                        event.target.value
                      )
                  }
                >

                  <option value="main">
                    Main Procurement Center
                  </option>

                  {
                    centers.map(
                      center => (

                        <option
                          key={
                            center.id
                          }
                          value={
                            center.id
                          }
                        >

                          {
                            center.name
                          }

                        </option>

                      )
                    )
                  }

                </select>

              </SettingsField>

            </div>

          </section>



          <section className="farmer-settings-card">

            <div className="farmer-settings-section-heading">

              <div className="farmer-settings-section-icon">
                <LockKeyhole size={19} />
              </div>

              <div>
                <h2>
                  Account security
                </h2>

                <p>
                  Change your farmer account password securely.
                </p>
              </div>

            </div>


            <form
              className="farmer-settings-grid"
              onSubmit={handlePasswordChange}
            >

              <SettingsField
                label="Current password"
                icon={<LockKeyhole size={17} />}
              >
                <input
                  type="password"
                  value={
                    passwordForm.currentPassword
                  }
                  onChange={event =>
                    setPasswordForm(
                      current => ({
                        ...current,
                        currentPassword:
                          event.target.value,
                      })
                    )
                  }
                  autoComplete="current-password"
                  placeholder="Current password"
                />
              </SettingsField>


              <SettingsField
                label="New password"
                icon={<LockKeyhole size={17} />}
              >
                <input
                  type="password"
                  value={
                    passwordForm.newPassword
                  }
                  onChange={event =>
                    setPasswordForm(
                      current => ({
                        ...current,
                        newPassword:
                          event.target.value,
                      })
                    )
                  }
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                />
              </SettingsField>


              <SettingsField
                label="Confirm new password"
                icon={<LockKeyhole size={17} />}
              >
                <input
                  type="password"
                  value={
                    passwordForm.confirmPassword
                  }
                  onChange={event =>
                    setPasswordForm(
                      current => ({
                        ...current,
                        confirmPassword:
                          event.target.value,
                      })
                    )
                  }
                  autoComplete="new-password"
                  placeholder="Repeat new password"
                />
              </SettingsField>


              <div className="farmer-settings-password-action">

                <button
                  type="submit"
                  className="farmer-settings-secondary"
                  disabled={
                    passwordSaving
                  }
                >
                  <LockKeyhole size={17} />

                  {passwordSaving
                    ? "Changing..."
                    : "Change password"}
                </button>

              </div>

            </form>

          </section>


          <section className="farmer-settings-card">

            <div className="farmer-settings-section-heading">

              <div className="farmer-settings-section-icon gold">

                <Bell
                  size={19}
                />

              </div>


              <div>

                <h2>
                  Notifications
                </h2>

                <p>
                  Choose how you want to receive procurement updates.
                </p>

              </div>

            </div>


            <div className="farmer-settings-preferences">

              <PreferenceRow
                icon={
                  <Bell
                    size={18}
                  />
                }
                title="In-app notifications"
                description="Receive status updates inside KrishiSetu."
                checked={
                  inAppEnabled
                }
                onChange={
                  setInAppEnabled
                }
              />


              <PreferenceRow
                icon={
                  <Phone
                    size={18}
                  />
                }
                title="SMS notifications"
                description="Receive booking and procurement updates on your registered mobile."
                checked={
                  smsEnabled
                }
                onChange={
                  setSmsEnabled
                }
              />

            </div>

          </section>


          {
            error && (

              <div className="farmer-settings-error">

                <ShieldCheck
                  size={17}
                />

                <span>
                  {error}
                </span>

              </div>

            )
          }


          <div className="farmer-settings-save-row">

            <Link
              to="/farmer/home"
              className="farmer-settings-secondary"
            >

              Cancel

            </Link>


            <button
              type="submit"
              className="farmer-settings-primary"
              disabled={
                saving
              }
            >

              {
                saving
                  ? "Saving..."
                  : saved
                    ? "Saved"
                    : "Save changes"
              }


              {
                saved
                  ? (
                    <CheckCircle2
                      size={17}
                    />
                  )
                  : (
                    <Save
                      size={17}
                    />
                  )
              }

            </button>

          </div>


        </form>

      </main>

    </div>

  );

}


/* =========================================================
   FIELD
========================================================= */

function SettingsField({
  label,
  icon,
  children,
  full = false,
}) {

  return (

    <label
      className={
        `farmer-settings-field ${
          full
            ? "full"
            : ""
        }`
      }
    >

      <span className="farmer-settings-label">

        {icon}

        {label}

      </span>


      {children}

    </label>

  );

}


/* =========================================================
   PREFERENCE
========================================================= */

function PreferenceRow({
  icon,
  title,
  description,
  checked,
  onChange,
}) {

  return (

    <div className="farmer-settings-preference">

      <div className="farmer-settings-preference-icon">

        {icon}

      </div>


      <div className="farmer-settings-preference-copy">

        <strong>
          {title}
        </strong>

        <span>
          {description}
        </span>

      </div>


      <button
        type="button"
        className={
          `farmer-settings-toggle ${
            checked
              ? "active"
              : ""
          }`
        }
        onClick={() =>
          onChange(
            current =>
              !current
          )
        }
        aria-pressed={
          checked
        }
      >

        <span />

      </button>

    </div>

  );

}


export default FarmerSettings;
