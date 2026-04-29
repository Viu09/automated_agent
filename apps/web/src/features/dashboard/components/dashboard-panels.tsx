import type { AgentListItem, AgentRunRead } from "@/types/api";

import { getIconNameForAgent } from "../helpers";
import { IconGlyph } from "./icon-glyph";
import { RobotAvatar } from "./robot-avatar";

export function PersonalAssistantCard({ operatorName }: { operatorName: string }) {
  return (
    <section className="assistant-card">
      <div className="section-head">
        <span className="section-kicker">ASSISTANT PERSONNEL</span>
        <div className="status-mini status-active">Actif</div>
      </div>
      <div className="assistant-stage">
        <div className="assistant-rings" />
        <RobotAvatar accent="cyan" family="social" large />
      </div>
      <p>Je suis la pour vous aider, {operatorName}. Que souhaitez-vous faire ?</p>
      <div className="assistant-grid-actions">
        {["Planifier ma journee", "Resumer mes emails", "Preparer une reunion", "Analyser mes donnees"].map((item) => (
          <button className="assistant-action" key={item} type="button">
            {item}
          </button>
        ))}
      </div>
      <div className="assistant-composer">
        <input className="search-field" placeholder="Parlez ou ecrivez ici..." type="text" />
      </div>
    </section>
  );
}

export function DayCard({ runs }: { runs: AgentRunRead[] }) {
  const items = runs.slice(0, 4).map((run) => ({
    label: run.agent_key,
    time: run.started_at ? new Date(run.started_at).toLocaleTimeString() : run.status,
  }));

  return (
    <section className="schedule-card">
      <div className="section-head">
        <span className="section-kicker">APERCU DE VOTRE JOURNEE</span>
      </div>
      {items.length > 0 ? (
        <div className="schedule-list">
          {items.map((item) => (
            <div className="schedule-row" key={`${item.label}-${item.time}`}>
              <span>{item.label}</span>
              <small>{item.time}</small>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-block compact">
          <strong>Aucune donnee de calendrier</strong>
          <span>Connectez un agenda ou lancez des agents pour afficher une timeline reelle.</span>
        </div>
      )}
      <button className="ghost-button wide" type="button">
        Voir le journal d'execution
      </button>
    </section>
  );
}

export function FocusCard({
  selectedAgent,
  selectedRun,
}: {
  selectedAgent: AgentListItem | null;
  selectedRun: AgentRunRead | null;
}) {
  return (
    <section className="focus-card">
      <div className="section-head">
        <span className="section-kicker">FOCUS DU JOUR</span>
      </div>
      <div className="focus-grid">
        <div className="focus-copy">
          <strong>{selectedAgent?.name ?? "Aucun module actif"}</strong>
          <span>{selectedRun?.summary ?? "Aucune mission prioritaire calculee."}</span>
          <span>{selectedRun?.status ? `Etat: ${selectedRun.status}` : "Declenchez un agent pour demarrer."}</span>
        </div>
        <div className="focus-clock">
          <div className="focus-clock-ring" />
          <strong>{selectedRun?.results?.length ? String(selectedRun.results.length).padStart(2, "0") : "00"}</strong>
        </div>
      </div>
      <button className="primary-button wide" type="button">
        Ouvrir le module
      </button>
    </section>
  );
}

export function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-tile">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

export function GlobalBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="global-badge">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function FooterIndicator({ label, value }: { label: string; value: string }) {
  return (
    <div className="footer-indicator">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function ScenarioNodes({ agents }: { agents: AgentListItem[] }) {
  if (agents.length === 0) {
    return (
      <div className="empty-block">
        <strong>Aucun scenario source</strong>
        <span>Connectez des agents avec un planning pour voir une chaine reelle.</span>
      </div>
    );
  }

  return (
    <>
      {agents.slice(0, 5).map((agent) => (
        <div className="scenario-node" key={agent.key}>
          <div className="scenario-icon">
            <IconGlyph name={getIconNameForAgent(agent.key)} />
          </div>
          <strong>{agent.schedule ?? "manuel"}</strong>
          <span>{agent.name}</span>
        </div>
      ))}
    </>
  );
}

export function RecentAutomationTiles({ runs }: { runs: AgentRunRead[] }) {
  if (runs.length === 0) {
    return (
      <div className="empty-block compact">
        <strong>Aucune automatisation recente</strong>
        <span>Declenchez un agent pour peupler cette zone.</span>
      </div>
    );
  }

  return (
    <>
      {runs.slice(0, 4).map((run) => (
        <div className="automation-tile" key={run.id}>
          <strong>{run.agent_key}</strong>
          <span>{run.summary ?? run.status}</span>
        </div>
      ))}
    </>
  );
}
