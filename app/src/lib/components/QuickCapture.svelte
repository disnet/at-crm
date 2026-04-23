<script lang="ts">
  import Overlay from './Overlay.svelte';
  import ZapIcon from '@lucide/svelte/icons/zap';
  import PhoneIcon from '@lucide/svelte/icons/phone';
  import HandshakeIcon from '@lucide/svelte/icons/handshake';
  import BellIcon from '@lucide/svelte/icons/bell';
  import StickyNoteIcon from '@lucide/svelte/icons/sticky-note';

  type Props = { onClose: () => void };
  let { onClose }: Props = $props();

  let text = $state('');
  let textareaEl = $state<HTMLTextAreaElement | null>(null);

  $effect(() => {
    textareaEl?.focus();
  });

  let parsed = $derived.by(() => {
    const v = text.toLowerCase();
    if (v.length < 5) return null;
    if (v.includes('called') || v.includes('call '))
      return { type: 'call', label: 'Call log', icon: PhoneIcon };
    if (v.includes('met ') || v.includes('meet ') || v.includes('coffee') || v.includes('lunch'))
      return { type: 'meeting', label: 'Meeting', icon: HandshakeIcon };
    if (v.includes('remind') || v.includes('follow up') || v.includes('next week'))
      return { type: 'reminder', label: 'Reminder', icon: BellIcon };
    return { type: 'note', label: 'Note', icon: StickyNoteIcon };
  });
</script>

<Overlay {onClose} width={480}>
  <div class="capture">
    <header class="head">
      <span class="head-icon"><ZapIcon size={13} strokeWidth={2.2} /></span>
      <span class="head-label">Quick capture</span>
      <span class="head-hint">⌘ + Enter to log</span>
    </header>
    <textarea
      bind:this={textareaEl}
      bind:value={text}
      rows="4"
      placeholder="Describe what happened — &#10;e.g. &ldquo;called Alex yesterday about the workshop&rdquo;"
    ></textarea>
    {#if parsed}
      <div class="parsed" data-type={parsed.type}>
        <span class="parsed-icon"><parsed.icon size={14} strokeWidth={2} /></span>
        <span class="parsed-label">{parsed.label} detected</span>
        <span class="parsed-dest">→ Notes</span>
      </div>
    {/if}
    <div class="actions">
      <button type="button" class="btn btn-ghost" onclick={onClose}>Cancel</button>
      <button type="button" class="btn btn-primary" disabled={!parsed} onclick={onClose}>
        Log it
      </button>
    </div>
  </div>
</Overlay>

<style>
  .capture {
    padding: 18px 20px 20px;
  }
  .head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }
  .head-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--accent-wash);
    color: var(--accent);
  }
  .head-label {
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.11em;
    text-transform: uppercase;
    color: var(--text-muted);
  }
  .head-hint {
    margin-left: auto;
    font-size: 10.5px;
    color: var(--text-subtle);
  }
  textarea {
    width: 100%;
    padding: 12px 14px;
    border-radius: var(--r-md);
    background: var(--bg-dim);
    box-shadow: inset 0 0 0 1px var(--border);
    font-size: var(--fs-base);
    color: var(--text);
    line-height: 1.55;
    resize: none;
    font-family: var(--font-body);
    transition: box-shadow var(--dur-fast);
  }
  textarea::placeholder {
    color: var(--text-subtle);
  }
  textarea:focus {
    box-shadow: inset 0 0 0 2px var(--accent);
  }
  .parsed {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-top: 11px;
    padding: 6px 12px;
    border-radius: 99px;
    background: var(--accent-wash);
    color: var(--accent-ink);
    font-size: var(--fs-xs);
    font-weight: 500;
    animation: rise-in var(--dur-med) var(--ease-out-quart);
  }
  .parsed-icon {
    display: inline-flex;
  }
  .parsed-dest {
    font-size: 10.5px;
    color: var(--text-muted);
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 14px;
  }
  .btn {
    padding: 7px 14px;
    border-radius: var(--r-sm);
    font-size: var(--fs-sm);
    font-weight: 600;
    transition: all var(--dur-fast);
  }
  .btn-ghost {
    color: var(--text-muted);
    box-shadow: inset 0 0 0 1px var(--border);
  }
  .btn-ghost:hover {
    background: var(--bg-dim);
    color: var(--text-strong);
  }
  .btn-primary {
    background: var(--accent);
    color: oklch(99% 0 0);
    box-shadow: 0 1px 2px oklch(50% 0.12 40 / 0.18);
  }
  .btn-primary:hover:not(:disabled) {
    background: var(--accent-deep);
  }
  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  @keyframes rise-in {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
