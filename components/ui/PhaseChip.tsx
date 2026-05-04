import { CircleDot, Eye, CheckCircle2, type LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/Badge";

type Phase = "bidding" | "revealing" | "settled" | "running" | "sold" | "stopped";

const map: Record<
  Phase,
  { label: string; tone: "violet" | "amber" | "emerald" | "sky" | "neutral" | "rose"; Icon: LucideIcon }
> = {
  bidding: { label: "Bidding", tone: "violet", Icon: CircleDot },
  revealing: { label: "Revealing", tone: "amber", Icon: Eye },
  settled: { label: "Settled", tone: "emerald", Icon: CheckCircle2 },
  running: { label: "Live ticker", tone: "violet", Icon: CircleDot },
  sold: { label: "Sold", tone: "emerald", Icon: CheckCircle2 },
  stopped: { label: "Stopped", tone: "rose", Icon: CircleDot },
};

export function PhaseChip({ phase }: { phase: Phase }) {
  const m = map[phase] ?? map.bidding;
  const { Icon } = m;
  return (
    <Badge tone={m.tone} icon={<Icon size={12} strokeWidth={2.25} />}>
      {m.label}
    </Badge>
  );
}
