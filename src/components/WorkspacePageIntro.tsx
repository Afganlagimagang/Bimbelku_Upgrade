import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type Metric = { label: string; value: string | number };

type WorkspacePageIntroProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  metrics?: Metric[];
  tone?: "indigo" | "emerald" | "orange";
};

const tones = {
  indigo: "bg-indigo-50 text-indigo-700",
  emerald: "bg-emerald-50 text-emerald-700",
  orange: "bg-orange-50 text-orange-700",
};

export default function WorkspacePageIntro({ eyebrow, title, description, icon: Icon, actions, metrics = [], tone = "indigo" }: WorkspacePageIntroProps) {
  return (
    <header className="border-b border-slate-200 pb-5 sm:pb-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
          {Icon && <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${tones[tone]}`}><Icon size={21} /></span>}
          <div className="min-w-0">
            {eyebrow && <p className="text-[11px] font-black uppercase tracking-[.18em] text-slate-400">{eyebrow}</p>}
            <h1 className={`${eyebrow ? "mt-1.5" : ""} break-words text-2xl font-black tracking-tight text-slate-950 sm:text-3xl`}>{title}</h1>
            {description && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex w-full flex-wrap gap-2 lg:w-auto lg:shrink-0">{actions}</div>}
      </div>
      {metrics.length > 0 && <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-3 border-t border-slate-100 pt-4">{metrics.map((metric) => <div key={metric.label} className="min-w-24"><dt className="text-[10px] font-black uppercase tracking-wider text-slate-400">{metric.label}</dt><dd className="mt-1 text-lg font-black text-slate-900">{metric.value}</dd></div>)}</dl>}
    </header>
  );
}
