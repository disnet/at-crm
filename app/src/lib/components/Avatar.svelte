<script lang="ts">
	type Props = {
		initials: string;
		color: string;
		size?: number;
		ring?: boolean;
		imageUrl?: string;
	};

	let { initials, color, size = 36, ring = false, imageUrl }: Props = $props();

	let fontSize = $derived(Math.max(10, Math.round(size * 0.36)));
	let imgFailed = $state(false);
	let showImage = $derived(!!imageUrl && !imgFailed);
</script>

<div
	class="avatar"
	class:ring
	style:--avatar-color={color}
	style:--size="{size}px"
	style:--fs="{fontSize}px"
>
	{#if showImage}
		<img src={imageUrl} alt="" loading="lazy" onerror={() => (imgFailed = true)} />
	{:else}
		<span class="initials">{initials}</span>
	{/if}
</div>

<style>
	.avatar {
		width: var(--size);
		height: var(--size);
		border-radius: 50%;
		background: var(--avatar-color);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: oklch(99% 0 0 / 0.95);
		font-family: var(--font-body);
		font-weight: 600;
		font-size: var(--fs);
		letter-spacing: -0.01em;
		flex-shrink: 0;
		box-shadow: inset 0 0 0 1px oklch(100% 0 0 / 0.1), var(--elev-1);
		position: relative;
	}

	.avatar.ring::after {
		content: '';
		position: absolute;
		inset: -3px;
		border-radius: 50%;
		border: 1.5px solid var(--avatar-color);
		opacity: 0.35;
	}

	.initials {
		text-shadow: 0 1px 1px oklch(0% 0 0 / 0.1);
	}

	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 50%;
		display: block;
	}
</style>
