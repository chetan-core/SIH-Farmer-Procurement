import { useLanguage } from "../translations/LanguageContext";

function Logo({
  size = 40,
  showName = false,
}) {
  const { t } = useLanguage();

  return (
    <div
      className={
        showName
          ? "krishisetu-logo krishisetu-logo-with-name"
          : "krishisetu-logo krishisetu-logo-mark-only"
      }
    >
      <svg
        className="krishisetu-logo-mark"
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="KrishiSetu"
      >
        <rect
          x="2"
          y="2"
          width="44"
          height="44"
          rx="14"
          fill="var(--primary)"
        />

        <path
          d="M25.8 11.5C19.2 14.2 15.4 19.5 15.4 25.9C15.4 29.5 17.7 32.1 21 32.1C25.8 32.1 29.2 27.8 29.2 21.8C29.2 17.7 27.6 14 25.8 11.5Z"
          fill="var(--text-on-primary)"
        />

        <path
          d="M17.9 29.7C21.2 25.7 24.1 20.8 25.8 15"
          stroke="var(--primary)"
          strokeWidth="1.8"
          strokeLinecap="round"
        />

        <path
          d="M12.5 35.5C17.1 31.9 23.1 30.5 29.1 31.4C32 31.8 34.5 33 36 35.5"
          stroke="var(--text-on-primary)"
          strokeWidth="2.6"
          strokeLinecap="round"
        />

        <path
          d="M13.5 38C19.7 35.5 26.8 35.5 34.8 38"
          stroke="var(--text-on-primary)"
          strokeOpacity="0.55"
          strokeWidth="1.8"
          strokeLinecap="round"
        />

        <circle
          cx="13"
          cy="35.5"
          r="1.7"
          fill="var(--text-on-primary)"
        />

        <circle
          cx="36"
          cy="35.5"
          r="1.7"
          fill="var(--text-on-primary)"
        />
      </svg>

      {showName && (
        <div className="krishisetu-logow-ordmark">
          <strong>
            KrishiSetu
          </strong>

          <span>
            {t("Smart Procurment")}
          </span>
        </div>
      )}
    </div>
  );
}

export default Logo;