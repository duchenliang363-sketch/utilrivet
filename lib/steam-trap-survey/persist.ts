import {
  CALCULATION_VERSION,
  DEFAULT_SETTINGS,
  PROJECT_SCHEMA_VERSION,
  STORE_KEY,
  type KeyValueStore,
  type SurveyProject,
  type SurveySettings,
  type SurveyStoreState,
} from "./types.ts";

export class MemoryStore implements KeyValueStore {
  private data = new Map<string, string>();

  getItem(key: string): string | null {
    return this.data.has(key) ? this.data.get(key)! : null;
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }
}

export function browserStore(): KeyValueStore {
  return {
    getItem: (key) => window.localStorage.getItem(key),
    setItem: (key, value) => window.localStorage.setItem(key, value),
    removeItem: (key) => window.localStorage.removeItem(key),
  };
}

function nowIso(): string {
  return new Date().toISOString();
}

function newId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

function emptyState(): SurveyStoreState {
  return {
    schemaVersion: PROJECT_SCHEMA_VERSION,
    calculationVersion: CALCULATION_VERSION,
    activeProjectId: null,
    projects: {},
  };
}

function readState(kv: KeyValueStore): SurveyStoreState {
  const raw = kv.getItem(STORE_KEY);
  if (!raw) return emptyState();
  try {
    const parsed = JSON.parse(raw) as SurveyStoreState;
    if (!parsed || typeof parsed !== "object" || !parsed.projects) return emptyState();
    return {
      schemaVersion: PROJECT_SCHEMA_VERSION,
      calculationVersion: CALCULATION_VERSION,
      activeProjectId: parsed.activeProjectId ?? null,
      projects: parsed.projects,
    };
  } catch {
    return emptyState();
  }
}

function writeState(kv: KeyValueStore, state: SurveyStoreState): void {
  kv.setItem(STORE_KEY, JSON.stringify(state));
}

export function createEmptyProject(settings: SurveySettings = DEFAULT_SETTINGS): SurveyProject {
  const stamp = nowIso();
  return {
    schemaVersion: PROJECT_SCHEMA_VERSION,
    id: newId("proj"),
    createdAt: stamp,
    updatedAt: stamp,
    lastSavedAt: stamp,
    settings: { ...DEFAULT_SETTINGS, ...settings },
    traps: [],
    nextTagNumber: 1,
  };
}

export function nextTag(nextTagNumber: number): string {
  return `T-${String(nextTagNumber).padStart(3, "0")}`;
}

export interface SurveyStore {
  listProjects(): SurveyProject[];
  getActive(): SurveyProject | null;
  createProject(settings?: SurveySettings): SurveyProject;
  setActiveProject(id: string): SurveyProject;
  updateActive(mutator: (project: SurveyProject) => SurveyProject): SurveyProject;
  deleteProject(id: string): void;
  importProject(project: SurveyProject): SurveyProject;
  replaceActive(project: SurveyProject): SurveyProject;
}

export function createSurveyStore(kv: KeyValueStore): SurveyStore {
  const persist = (state: SurveyStoreState) => writeState(kv, state);

  return {
    listProjects() {
      return Object.values(readState(kv).projects).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },

    getActive() {
      const state = readState(kv);
      if (!state.activeProjectId) return null;
      return state.projects[state.activeProjectId] ?? null;
    },

    createProject(settings = DEFAULT_SETTINGS) {
      const state = readState(kv);
      const project = createEmptyProject(settings);
      state.projects[project.id] = project;
      state.activeProjectId = project.id;
      persist(state);
      return project;
    },

    setActiveProject(id: string) {
      const state = readState(kv);
      if (!state.projects[id]) throw new Error("Project not found.");
      state.activeProjectId = id;
      persist(state);
      return state.projects[id];
    },

    updateActive(mutator) {
      const state = readState(kv);
      if (!state.activeProjectId || !state.projects[state.activeProjectId]) {
        throw new Error("No active project.");
      }
      const stamp = nowIso();
      const next = mutator(state.projects[state.activeProjectId]);
      const saved: SurveyProject = { ...next, updatedAt: stamp, lastSavedAt: stamp };
      state.projects[saved.id] = saved;
      state.activeProjectId = saved.id;
      persist(state);
      return saved;
    },

    deleteProject(id: string) {
      const state = readState(kv);
      delete state.projects[id];
      if (state.activeProjectId === id) {
        const remaining = Object.keys(state.projects);
        state.activeProjectId = remaining[0] ?? null;
      }
      persist(state);
    },

    importProject(project: SurveyProject) {
      const state = readState(kv);
      const stamp = nowIso();
      const copy: SurveyProject = {
        ...project,
        id: newId("proj"),
        createdAt: stamp,
        updatedAt: stamp,
        lastSavedAt: stamp,
        schemaVersion: PROJECT_SCHEMA_VERSION,
      };
      state.projects[copy.id] = copy;
      state.activeProjectId = copy.id;
      persist(state);
      return copy;
    },

    replaceActive(project: SurveyProject) {
      const state = readState(kv);
      if (!state.activeProjectId) throw new Error("No active project.");
      const stamp = nowIso();
      const saved: SurveyProject = {
        ...project,
        id: state.activeProjectId,
        updatedAt: stamp,
        lastSavedAt: stamp,
      };
      state.projects[saved.id] = saved;
      persist(state);
      return saved;
    },
  };
}
