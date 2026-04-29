"use client";

import type { FormEvent } from "react";

import type { AgentListItem, AgentRunRead } from "@/types/api";

import { CATEGORY_TABS, NAV_ITEMS } from "../constants";
import { getIconNameForAgent } from "../helpers";
import { AccessCard } from "./access-card";
import { FooterIndicator, GlobalBadge, RecentAutomationTiles, ScenarioNodes, StatTile } from "./dashboard-panels";
import { IconGlyph } from "./icon-glyph";

export function AuthScreen({
  loginError,
  registerError,
  onLogin,
  onRegister,
}: {
  loginError: string | null;
  registerError: string | null;
  onLogin: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  onRegister: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
}) {
  return (
    <section className="access-screen">
      <div className="access-stage">
        <div className="access-copy">
          <span className="micro-tag">AGENTS HUB</span>
          <h1>Pilotez votre vie. Vos agents s&apos;occupent du reste.</h1>
          <p>Une interface de commandement futuriste, riche, animee et personnalisee autour de vos automations.</p>
        </div>

        <div className="access-grid">
          <AccessCard
            buttonLabel="Entrer dans le hub"
            error={loginError}
            fields={[
              { name: "email", type: "email", placeholder: "Email" },
              { name: "password", type: "password", placeholder: "Mot de passe" },
            ]}
            onSubmit={onLogin}
            subtitle="Rouvrez votre hub et retrouvez vos modules."
            title="Connexion"
          />
          <AccessCard
            buttonLabel="Creer le profil"
            error={registerError?.startsWith("Compte cree") ? null : registerError}
            fields={[
              { name: "full_name", type: "text", placeholder: "Nom complet" },
              { name: "email", type: "email", placeholder: "Email" },
              { name: "password", type: "password", placeholder: "Mot de passe", minLength: 8 },
            ]}
            onSubmit={onRegister}
            subtitle="Provisionnez votre identite operateur."
            successMessage={registerError?.startsWith("Compte cree") ? registerError : null}
            title="Creer un profil"
          />
        </div>
      </div>
    </section>
  );
}

export function SidebarRail() {
  return (
    <aside className="left-rail">
      <div className="brand-block">
        <div className="brand-glyph">
          <div className="brand-glyph-inner" />
        </div>
        <div>
          <strong>AGENTS HUB</strong>
          <small>Life OS cockpit</small>
        </div>
      </div>

      <nav className="nav-cluster">
        {NAV_ITEMS.map((item, index) => (
          <button className={`nav-chip ${index === 0 ? "nav-chip-active" : ""}`} key={item.label} type="button">
            <IconGlyph name={item.icon} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="spaces-cluster">
        <span className="section-kicker">ESPACES</span>
        {["Personnel", "Projets", "Business", "Sante & Bien-etre", "Apprentissage"].map((item, index) => (
          <div className="space-row" key={item}>
            <span className={`space-node color-${index + 1}`} />
            <span>{item}</span>
          </div>
        ))}
      </div>

      <div className="sync-pod">
        <span className="section-kicker">SYNCHRO TOTALE</span>
        <p>Tous vos agents sont a jour.</p>
        <div className="sync-orbit">
          <div className="sync-ring ring-1" />
          <div className="sync-ring ring-2" />
          <div className="sync-ring ring-3" />
          <div className="sync-core" />
        </div>
        <button className="ghost-button wide" type="button">
          Voir les logs
        </button>
      </div>
    </aside>
  );
}

export function HeroHeader({
  activeTab,
  activeRuns,
  completedRuns,
  connectedCardsCount,
  enabledAgentsCount,
  onActiveTabChange,
  onLaunchSelected,
  onSearchChange,
  operatorName,
  searchQuery,
}: {
  activeTab: string;
  activeRuns: number;
  completedRuns: number;
  connectedCardsCount: number;
  enabledAgentsCount: number;
  onActiveTabChange: (value: string) => void;
  onLaunchSelected: () => void;
  onSearchChange: (value: string) => void;
  operatorName: string;
  searchQuery: string;
}) {
  return (
    <>
      <header className="hero-bar">
        <div className="hero-copy">
          <small>Bonjour {operatorName}</small>
          <h1>Pilotez votre vie. Vos agents s&apos;occupent du reste.</h1>
        </div>

        <div className="hero-actions">
          <label className="search-bar">
            <span className="search-lens" />
            <input
              className="search-field"
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Rechercher un agent, une action, une donnee..."
              type="text"
              value={searchQuery}
            />
          </label>
          <button className="ghost-button" type="button">
            Marketplace d&apos;agents
          </button>
          <button className="primary-button" onClick={onLaunchSelected} type="button">
            + Ajouter un agent
          </button>
          <div className="user-orb" />
        </div>
      </header>

      <section className="stats-ribbon">
        <StatTile label="Agents exposes" value={String(connectedCardsCount)} />
        <StatTile label="Agents backend actifs" value={String(enabledAgentsCount)} />
        <StatTile label="Executions completes" value={String(completedRuns)} />
        <StatTile label="Executions en cours" value={String(activeRuns)} />
      </section>

      <section className="category-ribbon">
        {CATEGORY_TABS.map((tab) => (
          <button
            className={`category-pill ${tab === activeTab ? "category-pill-active" : ""}`}
            key={tab}
            onClick={() => onActiveTabChange(tab)}
            type="button"
          >
            {tab}
          </button>
        ))}
      </section>
    </>
  );
}

export function ScenarioSection({
  agents,
  runs,
}: {
  agents: AgentListItem[];
  runs: AgentRunRead[];
}) {
  return (
    <section className="scenario-card">
      <div className="section-head">
        <div>
          <span className="section-kicker">SCENARIOS AUTOMATISES</span>
          <h2>Votre chaine d&apos;automatisation</h2>
        </div>
        <div className="toggle-chip">ON</div>
      </div>

      <div className="scenario-flow">
        <ScenarioNodes agents={agents} />
      </div>

      <div className="recent-automation">
        <RecentAutomationTiles runs={runs} />
      </div>
    </section>
  );
}

export function GlobalViewSection({
  agentsCount,
  completedRuns,
  domainStatus,
}: {
  agentsCount: number;
  completedRuns: number;
  domainStatus: {
    productivity: string;
    learning: string;
    finance: string;
    health: string;
    social: string;
    creative: string;
  };
}) {
  return (
    <section className="global-view-card">
      <div className="section-head">
        <div>
          <span className="section-kicker">VUE GLOBALE</span>
          <h2>Tous vos domaines en harmonie</h2>
        </div>
      </div>

      <div className="global-stage">
        <div className="badge-column left">
          <GlobalBadge label="Productivite" value={domainStatus.productivity} />
          <GlobalBadge label="Apprentissage" value={domainStatus.learning} />
          <GlobalBadge label="Finances" value={domainStatus.finance} />
        </div>

        <div className="city-diorama">
          <div className="city-platform" />
          <div className="city-haze" />
          <div className="tower tower-1" />
          <div className="tower tower-2" />
          <div className="tower tower-3" />
          <div className="tower tower-4" />
          <div className="tower tower-5" />
          <div className="city-rings" />
          <div className="city-score-badge">
            <span>couverture</span>
            <strong>{`${completedRuns}/${Math.max(agentsCount, 1)}`}</strong>
          </div>
        </div>

        <div className="badge-column right">
          <GlobalBadge label="Sante" value={domainStatus.health} />
          <GlobalBadge label="Relations" value={domainStatus.social} />
          <GlobalBadge label="Creativite" value={domainStatus.creative} />
        </div>
      </div>
    </section>
  );
}

export function FooterStatusBar({
  activeRuns,
  agents,
  latestRunMap,
  now,
  userIsActive,
  runs,
}: {
  activeRuns: number;
  agents: AgentListItem[];
  latestRunMap: Record<string, AgentRunRead>;
  now: Date;
  userIsActive: boolean;
  runs: AgentRunRead[];
}) {
  return (
    <footer className="footer-ribbon">
      <FooterIndicator label="Meteo" value={latestRunMap.weather ? "Sync" : "A connecter"} />
      <FooterIndicator label="Connexions" value={`${agents.filter((agent) => agent.enabled).length} actives`} />
      <FooterIndicator label="Session" value={userIsActive ? "Active" : "Inactive"} />
      <FooterIndicator label="Dernier run" value={runs[0]?.started_at ? new Date(runs[0].started_at).toLocaleTimeString() : "Aucun"} />
      <FooterIndicator label="Rafraichissement" value={activeRuns > 0 ? "12s live" : "30s calme"} />
      <div className="footer-time">
        <strong>{now.toLocaleTimeString()}</strong>
        <span>{now.toLocaleDateString()}</span>
      </div>
    </footer>
  );
}
