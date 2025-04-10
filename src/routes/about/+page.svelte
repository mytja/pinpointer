<!--suppress ES6UnusedImports -->
<script>
	import { MapPin } from 'lucide-svelte';
</script>

<svelte:head>
	<title>About Pinpointer</title>
	<meta name="description" content="About Pinpointer" />
</svelte:head>

<div style="padding: 20px;">
	<section>
		<div class="flex h-16 items-center px-4">
			<MapPin
				class="h-[50px] w-[50px] rotate-0 scale-100 transition-all"
			/>
			<div style="width: 6px"></div>
			<span style="font-size: 50px">Pinpointer</span>
		</div>
		<br>
		A system for geoguessing tournament organization.
		<br><br>
		Copyright 2024-2025 Mitja Ševerkar. All rights reserved. Licensed under AGPLv3.
		Source code is available on <a href="https://github.com/mytja/pinpointer" style="color: cadetblue;">GitHub</a>.
	</section>
</div>

<style>

</style>
