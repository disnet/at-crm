<script lang="ts">
  import Avatar from './Avatar.svelte';
  import SourceChip from './SourceChip.svelte';
  import ReminderChip from './ReminderChip.svelte';
  import NoteEntryCard from './NoteEntry.svelte';
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
  import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
  import MapPinIcon from '@lucide/svelte/icons/map-pin';
  import LinkIcon from '@lucide/svelte/icons/link';
  import BriefcaseIcon from '@lucide/svelte/icons/briefcase';
  import GraduationCapIcon from '@lucide/svelte/icons/graduation-cap';
  import HammerIcon from '@lucide/svelte/icons/hammer';
  import BookIcon from '@lucide/svelte/icons/book';
  import SparklesIcon from '@lucide/svelte/icons/sparkles';
  import GlobeIcon from '@lucide/svelte/icons/globe';
  import LanguagesIcon from '@lucide/svelte/icons/languages';
  import HandshakeIcon from '@lucide/svelte/icons/handshake';
  import BuildingIcon from '@lucide/svelte/icons/building';
  import {
    isNote,
    formatRange,
    formatAddress,
    decodeOpenTo,
    decodeWorkplace,
    decodeEmployment,
    decodeSkillCategory,
    decodePlatform,
    decodeLang,
    type Contact,
    type NoteEntry,
    type SifaSkill
  } from '$lib/data';

  type Props = {
    contact: Contact;
    onBack: () => void;
  };
  let { contact, onBack }: Props = $props();

  let notes = $derived.by(() => {
    const all: NoteEntry[] = [];
    for (const entries of Object.values(contact.threads)) {
      if (!entries) continue;
      for (const e of entries) if (isNote(e)) all.push(e);
    }
    return all;
  });

  let sifa = $derived(contact.sifa);
  let self = $derived(sifa?.self ?? null);

  let bsky = $derived(contact.bio?.trim() || null);
  let about = $derived(self?.about?.trim() || null);

  let skillsByCategory = $derived.by(() => {
    const groups: Record<string, SifaSkill[]> = {};
    for (const s of sifa?.skills ?? []) {
      const k = s.category ?? '__other';
      (groups[k] ??= []).push(s);
    }
    return Object.entries(groups);
  });

  function tryHostname(u: string): string {
    try {
      return new URL(u).hostname.replace(/^www\./, '');
    } catch {
      return u;
    }
  }
</script>

<main class="profile">
  <div class="wrap">
    <button type="button" class="back" onclick={onBack}>
      <ArrowLeftIcon size={14} strokeWidth={2} />
      <span>Back to thread</span>
    </button>

    <header class="hero">
      <Avatar
        initials={contact.initials}
        color={contact.avatarColor}
        size={88}
        ring
        imageUrl={contact.avatarUrl}
      />
      <div class="hero-body">
        <h1 class="hero-name">{contact.name}</h1>
        <a
          class="hero-handle"
          href="https://bsky.app/profile/{contact.handle}"
          target="_blank"
          rel="noreferrer"
        >
          @{contact.handle}
        </a>
        {#if self?.headline}
          <p class="hero-tag">{self.headline}</p>
        {:else if contact.tagline && contact.tagline !== `@${contact.handle}`}
          <p class="hero-tag">{contact.tagline}</p>
        {/if}
        <div class="hero-chips">
          {#each contact.sources as src (src)}
            <SourceChip source={src} size="md" />
          {/each}
        </div>
      </div>
    </header>

    {#if self?.openTo && self.openTo.length > 0}
      <section class="open-to">
        <span class="open-to-label">Open to</span>
        <div class="open-chips">
          {#each self.openTo as v (v)}
            <span class="open-chip">{decodeOpenTo(v)}</span>
          {/each}
        </div>
      </section>
    {/if}

    {#if self?.industry || contact.location || (self?.langs && self.langs.length > 0) || (self?.preferredWorkplace && self.preferredWorkplace.length > 0)}
      <section class="meta-row">
        {#if self?.industry}
          <div class="meta">
            <span class="meta-icon"><BuildingIcon size={12} strokeWidth={2} /></span>
            <span class="meta-val">{self.industry}</span>
          </div>
        {/if}
        {#if contact.location}
          <div class="meta">
            <span class="meta-icon"><MapPinIcon size={12} strokeWidth={2} /></span>
            <span class="meta-val">{contact.location}</span>
          </div>
        {/if}
        {#if self?.langs && self.langs.length > 0}
          <div class="meta">
            <span class="meta-icon"><LanguagesIcon size={12} strokeWidth={2} /></span>
            <span class="meta-val">{self.langs.map(decodeLang).join(' · ')}</span>
          </div>
        {/if}
        {#if self?.preferredWorkplace && self.preferredWorkplace.length > 0}
          <div class="meta">
            <span class="meta-icon"><GlobeIcon size={12} strokeWidth={2} /></span>
            <span class="meta-val">
              {self.preferredWorkplace.map(decodeWorkplace).join(' · ')}
            </span>
          </div>
        {/if}
      </section>
    {/if}

    {#if about}
      <section class="section">
        <h2 class="section-title">
          <SparklesIcon size={13} strokeWidth={2} />
          <span>About</span>
        </h2>
        <div class="prose">{about}</div>
      </section>
    {/if}

    {#if bsky && bsky !== about}
      <section class="section">
        <h2 class="section-title">
          <span class="src-mark" style:--c="var(--src-bluesky)"></span>
          <span>From Bluesky</span>
        </h2>
        <div class="prose dim">{bsky}</div>
      </section>
    {/if}

    {#if sifa?.positions && sifa.positions.length > 0}
      <section class="section">
        <h2 class="section-title">
          <BriefcaseIcon size={13} strokeWidth={2} />
          <span>Experience</span>
        </h2>
        <ol class="timeline">
          {#each sifa.positions as p, i (i)}
            <li class="t-item">
              <div class="t-dot" class:current={!p.endedAt}></div>
              <div class="t-body">
                <div class="t-head">
                  <span class="t-title">{p.title}</span>
                  <span class="t-sep">·</span>
                  <span class="t-org">{p.company}</span>
                </div>
                <div class="t-meta">
                  <span class="t-when">{formatRange(p.startedAt, p.endedAt)}</span>
                  {#if p.employmentType}
                    <span class="t-tag">{decodeEmployment(p.employmentType)}</span>
                  {/if}
                  {#if p.workplaceType}
                    <span class="t-tag">{decodeWorkplace(p.workplaceType)}</span>
                  {/if}
                  {#if p.location && formatAddress(p.location)}
                    <span class="t-loc">
                      <MapPinIcon size={10} strokeWidth={2.2} />
                      <span>{formatAddress(p.location)}</span>
                    </span>
                  {/if}
                </div>
                {#if p.description}
                  <p class="t-desc">{p.description}</p>
                {/if}
              </div>
            </li>
          {/each}
        </ol>
      </section>
    {/if}

    {#if sifa?.education && sifa.education.length > 0}
      <section class="section">
        <h2 class="section-title">
          <GraduationCapIcon size={13} strokeWidth={2} />
          <span>Education</span>
        </h2>
        <ol class="timeline">
          {#each sifa.education as e, i (i)}
            <li class="t-item">
              <div class="t-dot" class:current={!e.endedAt}></div>
              <div class="t-body">
                <div class="t-head">
                  <span class="t-title">{e.institution}</span>
                  {#if e.degree || e.fieldOfStudy}
                    <span class="t-sep">·</span>
                    <span class="t-org">
                      {[e.degree, e.fieldOfStudy].filter(Boolean).join(', ')}
                    </span>
                  {/if}
                </div>
                <div class="t-meta">
                  {#if formatRange(e.startedAt, e.endedAt)}
                    <span class="t-when">{formatRange(e.startedAt, e.endedAt)}</span>
                  {/if}
                  {#if e.grade}
                    <span class="t-tag">{e.grade}</span>
                  {/if}
                  {#if e.location && formatAddress(e.location)}
                    <span class="t-loc">
                      <MapPinIcon size={10} strokeWidth={2.2} />
                      <span>{formatAddress(e.location)}</span>
                    </span>
                  {/if}
                </div>
                {#if e.description}
                  <p class="t-desc">{e.description}</p>
                {/if}
                {#if e.activities}
                  <p class="t-desc dim">{e.activities}</p>
                {/if}
              </div>
            </li>
          {/each}
        </ol>
      </section>
    {/if}

    {#if sifa?.projects && sifa.projects.length > 0}
      <section class="section">
        <h2 class="section-title">
          <HammerIcon size={13} strokeWidth={2} />
          <span>Projects</span>
        </h2>
        <div class="cards">
          {#each sifa.projects as proj, i (i)}
            <article class="card">
              <header class="card-head">
                {#if proj.url}
                  <a
                    class="card-title link"
                    href={proj.url}
                    target="_blank"
                    rel="external noreferrer"
                  >
                    <span>{proj.name}</span>
                    <ArrowUpRightIcon size={12} strokeWidth={2} />
                  </a>
                {:else}
                  <span class="card-title">{proj.name}</span>
                {/if}
                {#if formatRange(proj.startedAt, proj.endedAt)}
                  <span class="card-when">{formatRange(proj.startedAt, proj.endedAt)}</span>
                {/if}
              </header>
              {#if proj.description}
                <p class="card-desc">{proj.description}</p>
              {/if}
              {#if proj.url}
                <div class="card-foot">{tryHostname(proj.url)}</div>
              {/if}
            </article>
          {/each}
        </div>
      </section>
    {/if}

    {#if sifa?.publications && sifa.publications.length > 0}
      <section class="section">
        <h2 class="section-title">
          <BookIcon size={13} strokeWidth={2} />
          <span>Publications</span>
        </h2>
        <ul class="pub-list">
          {#each sifa.publications as pub, i (i)}
            <li class="pub">
              <div class="pub-head">
                {#if pub.url}
                  <a
                    class="pub-title link"
                    href={pub.url}
                    target="_blank"
                    rel="external noreferrer"
                  >
                    <span>{pub.title}</span>
                    <ArrowUpRightIcon size={11} strokeWidth={2} />
                  </a>
                {:else}
                  <span class="pub-title">{pub.title}</span>
                {/if}
              </div>
              <div class="pub-meta">
                {#if pub.publisher}<span>{pub.publisher}</span>{/if}
                {#if pub.publishedAt}
                  {#if pub.publisher}<span class="t-sep">·</span>{/if}
                  <span>{pub.publishedAt.slice(0, 10)}</span>
                {/if}
                {#if pub.authors && pub.authors.length > 0}
                  <span class="t-sep">·</span>
                  <span>with {pub.authors.map((a) => a.name).join(', ')}</span>
                {/if}
              </div>
              {#if pub.description}
                <p class="pub-desc">{pub.description}</p>
              {/if}
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    {#if sifa?.skills && sifa.skills.length > 0}
      <section class="section">
        <h2 class="section-title">
          <HandshakeIcon size={13} strokeWidth={2} />
          <span>Skills</span>
        </h2>
        <div class="skill-groups">
          {#each skillsByCategory as [cat, items] (cat)}
            <div class="skill-group">
              {#if cat !== '__other'}
                <div class="skill-cat">{decodeSkillCategory(cat)}</div>
              {/if}
              <div class="skill-cloud">
                {#each items as s, i (i)}
                  <span class="skill">{s.name}</span>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      </section>
    {/if}

    {#if sifa?.externalAccounts && sifa.externalAccounts.length > 0}
      <section class="section">
        <h2 class="section-title">
          <LinkIcon size={13} strokeWidth={2} />
          <span>Links</span>
        </h2>
        <ul class="link-list">
          {#each sifa.externalAccounts as ext, i (i)}
            <li>
              <a class="ext" href={ext.url} target="_blank" rel="external noreferrer">
                <span class="ext-platform">{decodePlatform(ext.platform)}</span>
                <span class="ext-label">{ext.label || tryHostname(ext.url)}</span>
                <ArrowUpRightIcon size={12} strokeWidth={2} />
              </a>
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    {#if contact.reminder}
      <section class="section">
        <h2 class="section-title">Upcoming</h2>
        <ReminderChip reminder={contact.reminder} />
      </section>
    {/if}

    <section class="section">
      <h2 class="section-title">Notes &amp; logs</h2>
      {#if notes.length === 0}
        <p class="empty">No notes yet. Log a call, meeting, or thought after your next chat.</p>
      {:else}
        <div class="notes">
          {#each notes as note (note.id)}
            <NoteEntryCard entry={note} />
          {/each}
        </div>
      {/if}
    </section>
  </div>
</main>

<style>
  .profile {
    flex: 1;
    overflow-y: auto;
    background: var(--bg);
  }
  .wrap {
    max-width: 680px;
    margin: 0 auto;
    padding: 28px 28px 96px;
  }
  .back {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--text-muted);
    font-size: var(--fs-sm);
    padding: 4px 0;
    margin-bottom: 24px;
    transition: color var(--dur-fast);
  }
  .back:hover {
    color: var(--text-strong);
  }

  .hero {
    display: flex;
    gap: 22px;
    align-items: flex-start;
    margin-bottom: 22px;
  }
  .hero-body {
    min-width: 0;
    flex: 1;
  }
  .hero-name {
    font-family: var(--font-display);
    font-size: var(--fs-2xl);
    font-weight: 400;
    color: var(--text-strong);
    letter-spacing: -0.02em;
    line-height: 1.05;
  }
  .hero-handle {
    display: inline-block;
    margin-top: 4px;
    font-size: var(--fs-sm);
    color: var(--text-subtle);
    font-variant-numeric: tabular-nums;
  }
  .hero-handle:hover {
    color: var(--accent-ink);
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .hero-tag {
    margin-top: 8px;
    font-size: var(--fs-base);
    color: var(--text-muted);
  }
  .hero-chips {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-top: 14px;
  }

  /* Open-to band — earned color */
  .open-to {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    padding: 12px 14px;
    border-radius: var(--r-md);
    background: var(--amber-wash);
    box-shadow: inset 0 0 0 1px oklch(86% 0.06 78 / 0.5);
    margin-bottom: 22px;
  }
  .open-to-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--amber-deep);
  }
  .open-chips {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .open-chip {
    font-size: var(--fs-xs);
    font-weight: 500;
    color: var(--amber-deep);
    background: var(--amber-tint);
    padding: 3px 9px;
    border-radius: 99px;
  }

  /* Meta row — quiet detail strip */
  .meta-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 18px;
    padding: 14px 16px;
    background: var(--surface);
    border-radius: var(--r-md);
    box-shadow: var(--elev-1);
    margin-bottom: 28px;
  }
  .meta {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-size: var(--fs-sm);
    color: var(--text);
  }
  .meta-icon {
    display: inline-flex;
    color: var(--text-subtle);
  }

  /* Sections */
  .section {
    margin-bottom: 30px;
  }
  .section-title {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-family: var(--font-display);
    font-size: var(--fs-md);
    font-weight: 400;
    color: var(--text-strong);
    letter-spacing: -0.01em;
    margin-bottom: 14px;
  }
  .section-title :global(svg) {
    color: var(--text-muted);
  }
  .src-mark {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--c);
  }

  .prose {
    font-size: var(--fs-base);
    color: var(--text);
    line-height: 1.65;
    white-space: pre-wrap;
  }
  .prose.dim {
    color: var(--text-muted);
  }

  /* Timeline (positions, education) */
  .timeline {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding-left: 0;
    position: relative;
  }
  .timeline::before {
    content: '';
    position: absolute;
    left: 5px;
    top: 8px;
    bottom: 8px;
    width: 1px;
    background: var(--border);
  }
  .t-item {
    position: relative;
    padding-left: 22px;
  }
  .t-dot {
    position: absolute;
    left: 0;
    top: 6px;
    width: 11px;
    height: 11px;
    border-radius: 50%;
    background: var(--surface);
    box-shadow: inset 0 0 0 2px var(--border);
  }
  .t-dot.current {
    background: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-wash);
  }
  .t-head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 6px;
    font-size: var(--fs-base);
    color: var(--text-strong);
  }
  .t-title {
    font-weight: 600;
    letter-spacing: -0.005em;
  }
  .t-sep {
    color: var(--text-subtle);
  }
  .t-org {
    color: var(--text);
  }
  .t-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 10px;
    margin-top: 4px;
    font-size: var(--fs-xs);
    color: var(--text-muted);
  }
  .t-when {
    font-variant-numeric: tabular-nums;
  }
  .t-tag {
    padding: 2px 8px;
    border-radius: 99px;
    background: var(--bg-dim);
    color: var(--text-muted);
    font-size: 10.5px;
    font-weight: 500;
  }
  .t-loc {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    color: var(--text-subtle);
  }
  .t-desc {
    margin-top: 8px;
    font-size: var(--fs-sm);
    color: var(--text);
    line-height: 1.6;
    white-space: pre-wrap;
  }
  .t-desc.dim {
    color: var(--text-muted);
    margin-top: 4px;
  }

  /* Cards (projects) */
  .cards {
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
  }
  @media (min-width: 560px) {
    .cards {
      grid-template-columns: 1fr 1fr;
    }
  }
  .card {
    padding: 14px 16px 14px;
    border-radius: var(--r-md);
    background: var(--surface);
    box-shadow: var(--elev-1);
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .card-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 10px;
  }
  .card-title {
    font-size: var(--fs-base);
    font-weight: 600;
    color: var(--text-strong);
    letter-spacing: -0.005em;
  }
  .card-title.link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--text-strong);
  }
  .card-title.link:hover {
    color: var(--accent-ink);
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .card-when {
    font-size: 10.5px;
    color: var(--text-subtle);
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
  }
  .card-desc {
    font-size: var(--fs-sm);
    color: var(--text-muted);
    line-height: 1.55;
    white-space: pre-wrap;
  }
  .card-foot {
    font-size: 10.5px;
    color: var(--text-subtle);
    margin-top: 2px;
  }

  /* Publications */
  .pub-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .pub-head {
    display: flex;
    gap: 8px;
    align-items: baseline;
  }
  .pub-title {
    font-size: var(--fs-base);
    font-weight: 600;
    color: var(--text-strong);
    letter-spacing: -0.005em;
  }
  .pub-title.link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--text-strong);
  }
  .pub-title.link:hover {
    color: var(--accent-ink);
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .pub-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 3px;
    font-size: var(--fs-xs);
    color: var(--text-muted);
  }
  .pub-desc {
    margin-top: 6px;
    font-size: var(--fs-sm);
    color: var(--text);
    line-height: 1.55;
  }

  /* Skills */
  .skill-groups {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .skill-cat {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-subtle);
    margin-bottom: 8px;
  }
  .skill-cloud {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .skill {
    font-size: var(--fs-xs);
    color: var(--text);
    background: var(--surface);
    padding: 4px 10px;
    border-radius: 99px;
    box-shadow: inset 0 0 0 1px var(--border);
  }

  /* Links */
  .link-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .ext {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    border-radius: var(--r-sm);
    background: var(--surface);
    box-shadow: var(--elev-1);
    color: var(--text);
    transition: background var(--dur-fast);
  }
  .ext:hover {
    background: var(--bg-dim);
    text-decoration: none;
  }
  .ext-platform {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.11em;
    text-transform: uppercase;
    color: var(--text-subtle);
    min-width: 80px;
  }
  .ext-label {
    flex: 1;
    font-size: var(--fs-sm);
    color: var(--text-strong);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .ext :global(svg) {
    color: var(--text-subtle);
  }

  .notes {
    background: var(--surface);
    border-radius: var(--r-lg);
    padding: 0 20px;
    box-shadow: var(--elev-1);
  }
  .empty {
    font-size: var(--fs-sm);
    color: var(--text-subtle);
    font-style: italic;
  }
</style>
