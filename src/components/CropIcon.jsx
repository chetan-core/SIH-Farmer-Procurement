function CropIcon({
  crop,
  size = 42,
}) {
  const commonProps = {
    width: size,
    height: size,
    viewBox: "0 0 48 48",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": "true",
  };

  if (crop === "wheat") {
    return (
      <svg {...commonProps}>
        <path
          d="M24 40V13"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        <path
          d="M24 18C20 18 17 15.3 17 12"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        <path
          d="M24 23C19 23 15 20 15 16"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        <path
          d="M24 28C19 28 16 25 16 21"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        <path
          d="M24 18C28 18 31 15.3 31 12"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        <path
          d="M24 23C29 23 33 20 33 16"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        <path
          d="M24 28C29 28 32 25 32 21"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (crop === "paddy") {
    return (
      <svg {...commonProps}>
        <path
          d="M19 40C20 31 24 24 29 18"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        <path
          d="M29 18C34 20 37 24 37 29"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        <path
          d="M29 18C24 18 20 15 19 10"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        <circle
          cx="34"
          cy="13"
          r="2.1"
          fill="currentColor"
        />

        <circle
          cx="38"
          cy="17"
          r="2.1"
          fill="currentColor"
        />

        <circle
          cx="40"
          cy="22"
          r="2.1"
          fill="currentColor"
        />

        <circle
          cx="20"
          cy="13"
          r="2.1"
          fill="currentColor"
        />

        <circle
          cx="24"
          cy="16"
          r="2.1"
          fill="currentColor"
        />
      </svg>
    );
  }

  if (crop === "maize") {
    return (
      <svg {...commonProps}>
        <path
          d="M24 40V13"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        <path
          d="M18 21C13 24 14 32 20 35"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        <path
          d="M30 19C36 22 37 30 31 34"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        <path
          d="M19 13C21 10 27 10 29 13"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        <path
          d="M21 17H27"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        <path
          d="M20 21H28"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        <path
          d="M20 25H28"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (crop === "cotton") {
    return (
      <svg {...commonProps}>
        <path
          d="M24 40V21"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        <path
          d="M24 27C18 27 14 23 14 18"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        <path
          d="M24 30C30 30 34 26 34 21"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        <path
          d="M20 20C17 18 17 13 20 11C23 9 27 10 28 13C31 13 33 16 32 19C31 22 27 23 24 21"
          fill="currentColor"
          fillOpacity="0.18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        <circle
          cx="21"
          cy="15"
          r="3"
          fill="currentColor"
          fillOpacity="0.32"
        />

        <circle
          cx="27"
          cy="15"
          r="3"
          fill="currentColor"
          fillOpacity="0.32"
        />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <circle
        cx="24"
        cy="24"
        r="13"
        stroke="currentColor"
        strokeWidth="2.5"
      />

      <path
        d="M24 16V32M16 24H32"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default CropIcon;