type DividerVariant = "arch" | "open-book" | "learning-path";

export default function SectionArcDivider({
  variant,
  topColor,
  bottomColor,
  accentColor = "#F97316",
}: {
  variant: DividerVariant;
  topColor: string;
  bottomColor: string;
  accentColor?: string;
}) {
  return (
    <div className="pointer-events-none h-14 overflow-hidden sm:h-20" style={{ backgroundColor: topColor }} aria-hidden="true">
      <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="block h-full w-full">
        {variant === "arch" ? (
          <path d="M0 80V58 Q720 -18 1440 58V80Z" fill={bottomColor} />
        ) : variant === "open-book" ? (
          <>
            <path d="M0 80V45 Q355 20 720 57 Q1085 20 1440 45V80Z" fill={bottomColor} />
            <path d="M0 45 Q355 20 720 57 Q1085 20 1440 45" fill="none" stroke={accentColor} strokeWidth="1.5" opacity=".7" />
            <circle cx="720" cy="57" r="3.5" fill={accentColor} />
          </>
        ) : (
          <>
            <path d="M0 80V54H270Q300 54 300 40V31H660Q690 31 690 45V60H1035Q1065 60 1065 46V35H1440V80Z" fill={bottomColor} />
            <path d="M0 54H270Q300 54 300 40V31H660Q690 31 690 45V60H1035Q1065 60 1065 46V35H1440" fill="none" stroke={accentColor} strokeWidth="1.5" opacity=".65" />
            <circle cx="300" cy="31" r="3.5" fill={accentColor} />
            <circle cx="690" cy="60" r="3.5" fill={accentColor} />
            <circle cx="1065" cy="35" r="3.5" fill={accentColor} />
          </>
        )}
      </svg>
    </div>
  );
}
