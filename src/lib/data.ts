export type SourceKey = 'bluesky' | 'email' | 'telegram' | 'signal' | 'notes';

export type SourceConfig = {
  label: string;
  color: string;
  bg: string;
};

export const SOURCES: Record<SourceKey, SourceConfig> = {
  bluesky: { label: 'Bluesky', color: 'var(--src-bluesky)', bg: 'var(--src-bluesky-bg)' },
  email: { label: 'Email', color: 'var(--src-email)', bg: 'var(--src-email-bg)' },
  telegram: { label: 'Telegram', color: 'var(--src-telegram)', bg: 'var(--src-telegram-bg)' },
  signal: { label: 'Signal', color: 'var(--src-signal)', bg: 'var(--src-signal-bg)' },
  notes: { label: 'Notes', color: 'var(--src-notes)', bg: 'var(--src-notes-bg)' }
};

/**
 * Atmosphere platforms a contact may be a mutual on. Distinct from `SourceKey`,
 * which describes message channels — a person can be a Bluesky mutual without
 * us ever exchanging a Bluesky DM.
 */
export type AtmoSource = 'bluesky' | 'sifa' | 'tangled';

export type AtmoSourceConfig = {
  label: string;
  color: string;
  bg: string;
};

export const ATMO_SOURCES: Record<AtmoSource, AtmoSourceConfig> = {
  bluesky: { label: 'Bluesky', color: 'var(--src-bluesky)', bg: 'var(--src-bluesky-bg)' },
  sifa: { label: 'Sifa', color: 'var(--src-sifa)', bg: 'var(--src-sifa-bg)' },
  tangled: { label: 'Tangled', color: 'var(--src-tangled)', bg: 'var(--src-tangled-bg)' }
};

export type Message = {
  id: string;
  dir: 'in' | 'out';
  text: string;
  ts: string;
  date?: string;
  subject?: string;
};

export type NoteEntry = {
  id: string;
  type: 'note' | 'call' | 'reminder' | 'meeting';
  text: string;
  ts: string;
  isPinned?: boolean;
};

export type ContactReminder = {
  text: string;
  due: string;
};

/* sifa.id lexicon shapes (subset; only the fields we surface) */

export type SifaAddress = {
  name?: string;
  locality?: string;
  region?: string;
  country?: string;
};

export type SifaSelfData = {
  about?: string;
  langs?: string[];
  openTo?: string[];
  headline?: string;
  industry?: string;
  location?: SifaAddress;
  preferredWorkplace?: string[];
};

export type SifaPosition = {
  title: string;
  company: string;
  companyDid?: string;
  startedAt: string;
  endedAt?: string;
  location?: SifaAddress;
  isPrimary?: boolean;
  description?: string;
  workplaceType?: string;
  employmentType?: string;
};

export type SifaEducation = {
  institution: string;
  institutionDid?: string;
  degree?: string;
  fieldOfStudy?: string;
  grade?: string;
  startedAt?: string;
  endedAt?: string;
  location?: SifaAddress;
  activities?: string;
  description?: string;
};

export type SifaProject = {
  name: string;
  url?: string;
  startedAt?: string;
  endedAt?: string;
  description?: string;
};

export type SifaPublicationAuthor = {
  did?: string;
  name: string;
};

export type SifaPublication = {
  title: string;
  url?: string;
  authors?: SifaPublicationAuthor[];
  publisher?: string;
  description?: string;
  publishedAt?: string;
};

export type SifaSkill = {
  name: string;
  category?: string;
};

export type SifaExternalAccount = {
  url: string;
  platform: string;
  label?: string;
  feedUrl?: string;
  isPrimary?: boolean;
};

export type SifaProfileData = {
  self: SifaSelfData | null;
  positions: SifaPosition[];
  education: SifaEducation[];
  projects: SifaProject[];
  publications: SifaPublication[];
  skills: SifaSkill[];
  externalAccounts: SifaExternalAccount[];
  fetchedAt: string;
};

export type Contact = {
  id: string;
  order: number;
  did: string;
  handle: string;
  name: string;
  initials: string;
  avatarColor: string;
  avatarUrl?: string;
  bio?: string;
  tagline: string;
  location?: string;
  url?: string;
  sources: SourceKey[];
  lastMsg: string;
  lastActive: string;
  unread: number;
  reminder: ContactReminder | null;
  threads: Partial<Record<SourceKey, (Message | NoteEntry)[]>>;
  sifa: SifaProfileData | null;
  /** Atmosphere platforms this person is a mutual on. */
  mutualSources: AtmoSource[];
  /** Whether we found this contact through manual lookup or mutual sync. */
  discoveredVia: 'manual' | 'mutual';
};

export function isNote(entry: Message | NoteEntry): entry is NoteEntry {
  return 'type' in entry;
}

export function isMessage(entry: Message | NoteEntry): entry is Message {
  return 'dir' in entry;
}

/* sifa enum decoders (knownValues from id.sifa.defs) */

export const OPEN_TO_LABELS: Record<string, string> = {
  'id.sifa.defs#fullTimeRoles': 'Full-time roles',
  'id.sifa.defs#partTimeRoles': 'Part-time roles',
  'id.sifa.defs#contractRoles': 'Contract',
  'id.sifa.defs#boardPositions': 'Board positions',
  'id.sifa.defs#mentoringOthers': 'Mentoring others',
  'id.sifa.defs#beingMentored': 'Being mentored',
  'id.sifa.defs#collaborations': 'Collaborations'
};

export const WORKPLACE_LABELS: Record<string, string> = {
  'id.sifa.defs#onSite': 'On-site',
  'id.sifa.defs#remote': 'Remote',
  'id.sifa.defs#hybrid': 'Hybrid'
};

export const EMPLOYMENT_LABELS: Record<string, string> = {
  'id.sifa.defs#fullTime': 'Full-time',
  'id.sifa.defs#partTime': 'Part-time',
  'id.sifa.defs#contract': 'Contract',
  'id.sifa.defs#freelance': 'Freelance',
  'id.sifa.defs#internship': 'Internship',
  'id.sifa.defs#apprenticeship': 'Apprenticeship',
  'id.sifa.defs#volunteer': 'Volunteer',
  'id.sifa.defs#selfEmployed': 'Self-employed'
};

export const SKILL_CATEGORY_LABELS: Record<string, string> = {
  'id.sifa.defs#technical': 'Technical',
  'id.sifa.defs#business': 'Business',
  'id.sifa.defs#creative': 'Creative',
  'id.sifa.defs#interpersonal': 'Interpersonal',
  'id.sifa.defs#language': 'Language',
  'id.sifa.defs#industry': 'Industry'
};

export const PLATFORM_LABELS: Record<string, string> = {
  'id.sifa.defs#platformRss': 'RSS',
  'id.sifa.defs#platformFediverse': 'Fediverse',
  'id.sifa.defs#platformTwitter': 'Twitter',
  'id.sifa.defs#platformInstagram': 'Instagram',
  'id.sifa.defs#platformGithub': 'GitHub',
  'id.sifa.defs#platformYoutube': 'YouTube',
  'id.sifa.defs#platformLinkedin': 'LinkedIn',
  'id.sifa.defs#platformWebsite': 'Website',
  'id.sifa.defs#platformOther': 'Other'
};

export function decodeOpenTo(v: string): string {
  return OPEN_TO_LABELS[v] ?? v;
}
export function decodeWorkplace(v: string): string {
  return WORKPLACE_LABELS[v] ?? v;
}
export function decodeEmployment(v: string): string {
  return EMPLOYMENT_LABELS[v] ?? v;
}
export function decodeSkillCategory(v: string): string {
  return SKILL_CATEGORY_LABELS[v] ?? v;
}
export function decodePlatform(v: string): string {
  return PLATFORM_LABELS[v] ?? v;
}

export function formatAddress(addr: SifaAddress | undefined): string | undefined {
  if (!addr) return undefined;
  if (addr.name) return addr.name;
  const parts = [addr.locality, addr.region, addr.country].filter(Boolean) as string[];
  return parts.length ? parts.join(', ') : undefined;
}

let langDisplay: Intl.DisplayNames | null = null;
function getLangDisplay(): Intl.DisplayNames | null {
  if (langDisplay) return langDisplay;
  if (typeof Intl === 'undefined' || !('DisplayNames' in Intl)) return null;
  try {
    langDisplay = new Intl.DisplayNames(['en'], { type: 'language' });
  } catch {
    langDisplay = null;
  }
  return langDisplay;
}
export function decodeLang(code: string): string {
  const disp = getLangDisplay();
  const out = disp?.of(code);
  return out && out !== code ? out : code.toUpperCase();
}

export function yearOf(dt: string | undefined): string | null {
  if (!dt) return null;
  const m = /^(\d{4})/.exec(dt);
  return m ? m[1] : null;
}

export function formatRange(startedAt: string | undefined, endedAt: string | undefined): string {
  const a = yearOf(startedAt);
  const b = endedAt ? yearOf(endedAt) : null;
  if (!a && !b) return '';
  if (a && !endedAt) return `${a} – Present`;
  if (a && b) return a === b ? a : `${a} – ${b}`;
  return a ?? b ?? '';
}
