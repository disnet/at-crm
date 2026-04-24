<script lang="ts">
  import BellIcon from '@lucide/svelte/icons/bell';
  import XIcon from '@lucide/svelte/icons/x';
  import type { ContactReminder } from '$lib/data';

  type Props = {
    reminder: ContactReminder;
    onDismiss?: () => void;
    variant?: 'standalone' | 'embedded';
  };
  let { reminder, onDismiss, variant = 'standalone' }: Props = $props();
</script>

<div class="chip" class:embedded={variant === 'embedded'}>
  <span class="icon" aria-hidden="true">
    <BellIcon size={13} strokeWidth={2} />
  </span>
  <div class="body">
    <div class="text">{reminder.text}</div>
    <div class="due">{reminder.due}</div>
  </div>
  {#if onDismiss}
    <button class="dismiss" type="button" aria-label="Dismiss reminder" onclick={onDismiss}>
      <XIcon size={13} strokeWidth={2} />
    </button>
  {/if}
</div>

<style>
  .chip {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px 10px 12px;
    border-radius: var(--r-md);
    background: var(--amber-wash);
    box-shadow: inset 0 0 0 1px oklch(82% 0.07 78 / 0.4);
  }
  .chip.embedded {
    background: var(--amber-tint);
    box-shadow: inset 0 0 0 1px oklch(82% 0.08 76 / 0.3);
  }
  .icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--amber-tint);
    color: var(--amber-deep);
    flex-shrink: 0;
  }
  .body {
    flex: 1;
    min-width: 0;
  }
  .text {
    font-size: var(--fs-sm);
    font-weight: 600;
    color: var(--amber-deep);
    letter-spacing: -0.005em;
  }
  .due {
    font-size: var(--fs-2xs);
    color: oklch(58% 0.1 76);
    margin-top: 2px;
    letter-spacing: 0.01em;
  }
  .dismiss {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 6px;
    color: oklch(60% 0.08 76);
    transition:
      background var(--dur-fast),
      color var(--dur-fast);
  }
  .dismiss:hover {
    background: oklch(88% 0.07 76 / 0.5);
    color: var(--amber-deep);
  }
</style>
