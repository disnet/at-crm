<script lang="ts">
  import '../app.css';

  let { children } = $props();
</script>

<svelte:head>
  <title>People — Personal CRM</title>
  <meta name="description" content="A quiet place to tend to the people you care about." />
</svelte:head>

{@render children()}
