/** Subpage callout: rubric alignment notes per flow. */
export function FlowTrackAside({ flow }: { flow: "sealed" | "dutch" }) {
  const sealed = (
    <ul className="mt-3 list-inside list-disc space-y-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
      <li>
        <span className="font-medium text-zinc-800 dark:text-zinc-200">Technology:</span> SHA-256
        commitments in the browser; MagicBlock deposit and private transfer after settlement.
      </li>
      <li>
        <span className="font-medium text-zinc-800 dark:text-zinc-200">Impact:</span> Bidders do not
        expose amounts during bidding; settlement stays off a plain public SPL graph.
      </li>
      <li>
        <span className="font-medium text-zinc-800 dark:text-zinc-200">UX:</span> Phases, table, reveal,
        then pay seller — the guided sequence at the bottom mirrors this path.
      </li>
    </ul>
  );

  const dutch = (
    <ul className="mt-3 list-inside list-disc space-y-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
      <li>
        <span className="font-medium text-zinc-800 dark:text-zinc-200">Technology:</span> Same Private
        Payments transfer as sealed-bid; price schedule runs locally with a timer.
      </li>
      <li>
        <span className="font-medium text-zinc-800 dark:text-zinc-200">Impact:</span> Public descending
        ask for discovery; private rail for the actual payment to the seller.
      </li>
      <li>
        <span className="font-medium text-zinc-800 dark:text-zinc-200">UX:</span> One prominent price
        and a single buy action; guided sequence below explains the API steps.
      </li>
    </ul>
  );

  return (
    <aside
      className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-5 dark:border-zinc-800 dark:bg-zinc-950/40"
      aria-label="What this flow demonstrates for the hackathon"
    >
      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
        {flow === "sealed" ? "Sealed-bid" : "Private Dutch"} — rubric alignment
      </p>
      {flow === "sealed" ? sealed : dutch}
    </aside>
  );
}
