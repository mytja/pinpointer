<!--suppress ES6UnusedImports -->
<script>
	import { MapPin } from 'lucide-svelte';
</script>

<svelte:head>
	<title>About Pinpointer</title>
	<meta name="description" content="About Pinpointer" />
</svelte:head>

<div class="p-4 sm:p-6">
	<section class="mx-auto w-full max-w-screen-lg">
		<div class="mb-4 flex items-center gap-2 px-1">
			<MapPin class="h-9 w-9 rotate-0 scale-100 transition-all sm:h-12 sm:w-12" />
			<span class="text-3xl font-semibold sm:text-5xl">Pinpointer</span>
		</div>
		<p class="text-base sm:text-lg">A system for geoguessing tournament organization.</p>
		<p class="mt-4 text-sm sm:text-base">
			Copyright 2024-2026 Mitja Ševerkar. All rights reserved. Licensed under AGPLv3.
			Source code is available on <a href="https://github.com/mytja/pinpointer" class="text-cyan-600 underline underline-offset-2">GitHub</a>.
		</p>
	</section>
</div>

<style>

</style>
