function Button({
  children,
  variant = "primary",
  type = "button",
  onClick,
  disabled = false,
  fullWidth = false,
}) {
  return (
    <button
      type={type}
      className={`app-button app-button-${variant} ${
        fullWidth ? "app-button-full" : ""
      }`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export default Button;