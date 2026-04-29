"use client";

import type { AgentRunRead } from "@/types/api";

import { getIconNameForAgent, isRealAgentKey } from "../helpers";
import { renderAgentCardBody, renderCompactControls } from "../renderers";
import type { DisplayCard } from "../types";
import { IconGlyph } from "./icon-glyph";
import { RobotAvatar } from "./robot-avatar";

export function HubAgentCard({
  card,
  latestRun,
  config,
  selected,
  onSelect,
  onTrigger,
  onSave,
  onChange,
  styleDelay,
}: {
  card: DisplayCard;
  latestRun: AgentRunRead | null;
  config: Record<string, string>;
  selected: boolean;
  onSelect: () => void;
  onTrigger: () => void;
  onSave: () => void;
  onChange: (agentKey: string, field: string, value: string) => void;
  styleDelay: number;
}) {
  const liveState = latestRun?.status ?? "idle";
  const isRealAgent = isRealAgentKey(card.key);

  return (
    <article
      className={`hub-card accent-${card.accent} ${selected ? "hub-card-selected" : ""} run-${liveState}`}
      data-family={card.family}
      data-live={liveState}
      onClick={onSelect}
      style={{ animationDelay: `${styleDelay}ms` }}
    >
      <div className="hub-card-aura" />
      <div className="hub-card-gridline" />

      <div className="hub-card-header">
        <div className="hub-card-title">
          <IconGlyph name={getIconNameForAgent(card.key)} />
          <strong>{card.title}</strong>
        </div>
        <div className={`status-mini ${card.state === "active" ? "status-active" : "status-standby"}`}>{card.badge}</div>
      </div>

      <div className="hub-card-body">
        <div className="avatar-stage">
          <RobotAvatar accent={card.accent} family={card.family} />
        </div>
        <div className="card-data-block">{renderAgentCardBody(card, latestRun, config)}</div>
      </div>

      <div className="telemetry-strip">
        <span>{latestRun?.summary ?? card.description}</span>
        <small>{latestRun?.started_at ? new Date(latestRun.started_at).toLocaleTimeString() : "Pret"}</small>
      </div>

      {isRealAgent ? <div className="card-controls">{renderCompactControls(card, config, onChange)}</div> : null}

      <div className="hub-card-footer">
        {isRealAgent ? (
          <>
            <button
              className="ghost-button small"
              onClick={(event) => {
                event.stopPropagation();
                onSave();
              }}
              type="button"
            >
              Sauver
            </button>
            <button
              className="primary-button small"
              onClick={(event) => {
                event.stopPropagation();
                onTrigger();
              }}
              type="button"
            >
              {card.cta}
            </button>
          </>
        ) : (
          <>
            <div className="status-mini status-standby">Module scene</div>
            <button className="ghost-button small" type="button">
              {card.cta}
            </button>
          </>
        )}
      </div>
    </article>
  );
}
