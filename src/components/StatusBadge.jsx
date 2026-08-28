import { useLanguage } from "../translations/LanguageContext";

const statusConfig = {
  CONFIRMED: {
    translationKey: "status.confirmed",
    className: "status-confirmed",
  },

  ARRIVED: {
    translationKey: "status.arrived",
    className: "status-arrived",
  },

  LATE: {
    translationKey: "status.late",
    className: "status-late",
  },

  WEIGHING: {
    translationKey: "status.weighing",
    className: "status-weighing",
  },

  PROCURED: {
    translationKey: "status.procured",
    className: "status-procured",
  },

  PAYMENT_PENDING: {
    translationKey: "status.paymentPending",
    className: "status-payment-pending",
  },

  PAYMENT_SENT: {
    translationKey: "status.paymentSent",
    className: "status-payment-sent",
  },
};

function StatusBadge({ status }) {
  const { t } = useLanguage();

  const config =
    statusConfig[status] || {
      translationKey: "status.unknown",
      className: "status-unknown",
    };

  return (
    <span
      className={`status-badge ${config.className}`}
    >
      <span className="status-dot"></span>

      {t(config.translationKey)}
    </span>
  );
}

export default StatusBadge;