export type DividerVariant =
  | "soft-wave"
  | "scallop"
  | "arch"
  | "open-book"
  | "ribbon"
  | "constellation"
  | "learning-path"
  | "steps"
  | "pencil"
  | "orbit"
  | "skyline"
  | "footer-rise";

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
        {variant === "soft-wave" && (
          <>
            <path d="M0 80V42C220 70 420 12 690 38C940 62 1160 72 1440 30V80Z" fill={bottomColor} />
            <path d="M0 42C220 70 420 12 690 38C940 62 1160 72 1440 30" fill="none" stroke={accentColor} strokeWidth="1.5" opacity=".45" />
          </>
        )}

        {variant === "scallop" && (
          <>
            <rect y="43" width="1440" height="37" fill={bottomColor} />
            {Array.from({ length: 13 }, (_, index) => <circle key={index} cx={index * 120} cy="43" r="61" fill={bottomColor} />)}
            <path d="M0 43Q60 -18 120 43T240 43T360 43T480 43T600 43T720 43T840 43T960 43T1080 43T1200 43T1320 43T1440 43" fill="none" stroke={accentColor} strokeWidth="1.25" opacity=".32" />
          </>
        )}

        {variant === "arch" && (
          <>
            <path d="M0 80V58Q720 -18 1440 58V80Z" fill={bottomColor} />
            <path d="M0 58Q720 -18 1440 58" fill="none" stroke={accentColor} strokeWidth="1.5" opacity=".55" />
          </>
        )}

        {variant === "open-book" && (
          <>
            <path d="M0 80V45Q355 20 720 57Q1085 20 1440 45V80Z" fill={bottomColor} />
            <path d="M0 45Q355 20 720 57Q1085 20 1440 45" fill="none" stroke={accentColor} strokeWidth="1.5" opacity=".65" />
            <circle cx="720" cy="57" r="3.5" fill={accentColor} />
          </>
        )}

        {variant === "ribbon" && (
          <>
            <path d="M0 80V38H480L540 54L600 38H930L995 23L1060 38H1440V80Z" fill={bottomColor} />
            <path d="M0 38H480L540 54L600 38H930L995 23L1060 38H1440" fill="none" stroke={accentColor} strokeWidth="1.5" opacity=".55" />
          </>
        )}

        {variant === "constellation" && (
          <>
            <path d="M0 80V36C260 48 435 25 690 40C930 54 1190 24 1440 38V80Z" fill={bottomColor} />
            <path d="M165 37L385 31L610 38L835 42L1070 33L1285 36" fill="none" stroke={accentColor} strokeWidth="1" strokeDasharray="5 10" opacity=".5" />
            {[165, 385, 610, 835, 1070, 1285].map((cx, index) => <circle key={cx} cx={cx} cy={[37, 31, 38, 42, 33, 36][index]} r={index % 2 ? 3 : 2.5} fill={accentColor} opacity=".75" />)}
          </>
        )}

        {variant === "learning-path" && (
          <>
            <path d="M0 80V54H270Q300 54 300 40V31H660Q690 31 690 45V60H1035Q1065 60 1065 46V35H1440V80Z" fill={bottomColor} />
            <path d="M0 54H270Q300 54 300 40V31H660Q690 31 690 45V60H1035Q1065 60 1065 46V35H1440" fill="none" stroke={accentColor} strokeWidth="1.5" opacity=".65" />
            {[300, 690, 1065].map((cx, index) => <circle key={cx} cx={cx} cy={[31, 60, 35][index]} r="3.5" fill={accentColor} />)}
          </>
        )}

        {variant === "steps" && (
          <>
            <path d="M0 80V54H180V43H390V31H620V45H850V25H1090V42H1260V33H1440V80Z" fill={bottomColor} />
            <path d="M0 54H180V43H390V31H620V45H850V25H1090V42H1260V33H1440" fill="none" stroke={accentColor} strokeWidth="1.25" opacity=".55" />
          </>
        )}

        {variant === "pencil" && (
          <>
            <path d="M0 80V50L1110 28L1190 40L1440 35V80Z" fill={bottomColor} />
            <path d="M0 50L1110 28L1190 40L1440 35" fill="none" stroke={accentColor} strokeWidth="1.5" opacity=".6" />
            <path d="M1110 28L1150 47L1190 40Z" fill={accentColor} opacity=".72" />
          </>
        )}

        {variant === "orbit" && (
          <>
            <path d="M0 80V43Q360 67 720 42T1440 43V80Z" fill={bottomColor} />
            <path d="M220 44Q720 -2 1220 44" fill="none" stroke={accentColor} strokeWidth="1.25" opacity=".48" />
            <circle cx="465" cy="24" r="4" fill={accentColor} />
            <circle cx="1010" cy="25" r="2.8" fill={accentColor} opacity=".75" />
          </>
        )}

        {variant === "skyline" && (
          <>
            <path d="M0 80V49H145V32H235V44H380V21H470V48H630V35H755V50H900V28H990V45H1160V23H1260V42H1440V80Z" fill={bottomColor} />
            <path d="M0 49H145V32H235V44H380V21H470V48H630V35H755V50H900V28H990V45H1160V23H1260V42H1440" fill="none" stroke={accentColor} strokeWidth="1.1" opacity=".42" />
          </>
        )}

        {variant === "footer-rise" && (
          <>
            <path d="M0 80V60Q360 25 720 54Q1080 78 1440 36V80Z" fill={bottomColor} opacity=".45" />
            <path d="M0 80V69Q360 40 720 63Q1080 82 1440 50V80Z" fill={bottomColor} />
            <path d="M0 69Q360 40 720 63Q1080 82 1440 50" fill="none" stroke={accentColor} strokeWidth="1.3" opacity=".58" />
          </>
        )}
      </svg>
    </div>
  );
}
