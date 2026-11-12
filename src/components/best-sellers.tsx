"use client";
import { useState, type ReactNode } from "react";

type Tab = { id: string; label: string };

/** Category tabs over pre-rendered product grids; switching tabs never refetches. */
export function BestSellers({ tabs, panels }: { tabs: Tab[]; panels: Record<string, ReactNode> }) {
  const [active, setActive] = useState(tabs[0]?.id ?? "all");
  return <>
    {tabs.length > 1 && <div className="tab-chips" role="tablist" aria-label="বিভাগ অনুযায়ী">
      {tabs.map(tab => <button key={tab.id} type="button" role="tab" id={`best-tab-${tab.id}`} aria-selected={tab.id === active} aria-controls={`best-panel-${tab.id}`} onClick={() => setActive(tab.id)}>{tab.label}</button>)}
    </div>}
    {tabs.map(tab => <div key={tab.id} role="tabpanel" id={`best-panel-${tab.id}`} aria-labelledby={`best-tab-${tab.id}`} hidden={tab.id !== active}>{panels[tab.id]}</div>)}
  </>;
}
