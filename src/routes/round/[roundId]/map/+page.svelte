<script lang="ts">
	/* eslint-disable no-undef */
	import DraggableMap from './DraggableMap.svelte';
	import StreetView from './StreetView.svelte';
	import { source } from 'sveltekit-sse';
	import { Button } from '$lib/components/ui/button';
	import { writable } from 'svelte/store';
	import ResultsMap from './ResultsMap.svelte';
	import { onMount } from 'svelte';
	import { Loader } from '@googlemaps/js-api-loader';
	import { env } from '$env/dynamic/public';

	/** @type {import('./$types').PageData} */
	let { data } = $props();

	const audio = new Audio('/beep.mp3');
	const audio1 = new Audio('/beep1.mp3');

	const s = source(`/round/${data.roundId}/client`);
	const clients = s.select('clients').json(
		function or({ previous }) {
			//console.error(`Could not parse "${raw}" as json.`, error);
			return previous;  // This will be the new value of the store
		}
	);
	const roundDetails = s.select('newLocation').json(
		function or({ previous }) {
			return previous;  // This will be the new value of the store
		}
	);
	const newFlag = s.select('newFlag').json(
		function or({ previous }) {
			return previous;  // This will be the new value of the store
		}
	);
	const locationName = s.select('locationName');
	//const roundDetails = writable({ lat: 46.822498228533284, lng: 16.08066758727155 });
	const time = s.select('countdown').json(
		function or({ previous }) {
			return previous;  // This will be the new value of the store
		}
	);
	const guess = s.select('guess').json(
		function or({ previous }) {
			return previous;  // This will be the new value of the store
		}
	);
	const roundResults = s.select('roundResults').json(
		function or({ previous }) {
			return previous;  // This will be the new value of the store
		}
	);

	let hideRoundDetails: boolean = $state(true);
	let showPlayers = $state(true);
	let isMobile = $state(false);
	let initializedDesktopDefaults = false;
	let previousRoundForDefaults = $state(0);

	time.subscribe((value) => {
		if (value === null) return;
		if (value.time <= 0) return;
		if (value.time <= 5) audio.play();
		if (value.time == 15) audio1.play();
	})

	function newRound(value: any) {
		if (value === null) return false;
		console.log('Clearing details');
		if (value.round > value.totalRounds) {
			// konec turnirja
			if (data.competitionId === "") {
				window.location.href = `/`;
				return;
			}
			window.location.href = `/competition/${data.competitionId}`;
			return false;
		}
		return true;
	}

	let roundNumber = $state(0);
	let totalRounds = $state(0);

	function applyResultsDefaults(forRoundStart: boolean) {
		if (isMobile) {
			showPlayers = false;
			return;
		}
		if (forRoundStart) return;
		if (initializedDesktopDefaults) return;
		showPlayers = true;
		initializedDesktopDefaults = true;
	}

	roundDetails.subscribe((value) => {
		console.log("Round details");
		if (!newRound(value)) return;
		hideRoundDetails = true;
		roundNumber = value.round;
		totalRounds = value.totalRounds;
	});

	newFlag.subscribe((value) => {
		console.log("New flag", value);
		if (!newRound(value)) return;
		hideRoundDetails = true;
		roundNumber = value.round;
		totalRounds = value.totalRounds;
	});

	roundResults.subscribe((value) => {
		try {
			document.exitFullscreen();
		} catch { /* empty */ }
		hideRoundDetails = false;
		console.log(value);
	});

	let loadedGoogleMaps = $state(false);
	let reset = writable<number>(0);

	function resetStreetView() {
		reset.set($reset + 1);
	}

	onMount(() => {
		const mobileQuery = window.matchMedia('(max-width: 768px)');
		const applyMobileState = (matches: boolean) => {
			isMobile = matches;
			applyResultsDefaults(false);
		};
		applyMobileState(mobileQuery.matches);
		const onMobileChange = (event: MediaQueryListEvent) => applyMobileState(event.matches);
		mobileQuery.addEventListener('change', onMobileChange);

		const loadMaps = async () => {
			const loader = new Loader({
				apiKey: env.PUBLIC_GOOGLE_MAPS_SDK_KEY ?? '',
				version: 'weekly'
			});
			await loader.importLibrary('maps') as google.maps.MapsLibrary;
			await loader.importLibrary('marker') as google.maps.MarkerLibrary;
			loadedGoogleMaps = true;
		};

		void loadMaps();

		return () => {
			mobileQuery.removeEventListener('change', onMobileChange);
		};
	});

	$effect(() => {
		if (roundNumber === 0) return;
		if (previousRoundForDefaults === roundNumber) return;
		previousRoundForDefaults = roundNumber;
		applyResultsDefaults(true);
	});
</script>

<svelte:head>
	<title>Map</title>
	<meta name="description" content="Pinpointer map" />
</svelte:head>

{#if !loadedGoogleMaps}
	<div class="p-4 sm:p-6">
		<section>
			<h2 class="scroll-m-20 text-3xl font-bold tracking-tight">Google Maps SDK is loading... This shouldn't take more than a few seconds.</h2>
		</section>
	</div>
{:else}
{#if $roundDetails !== null || $newFlag !== null}
	<ResultsMap isOwner={data.isOwner} roundResults={$roundResults} hideRoundDetails={hideRoundDetails}
							roundId={data.roundId} roundNumber={roundNumber} roundCount={totalRounds} roundType={data.roundType} />
	<div class="map-page">
		<div class="map-top-navbar">
			<Button variant="outline" size="sm" onclick={() => (showPlayers = !showPlayers)}>
				{#if showPlayers}Hide results{:else}Show results{/if}
			</Button>
			{#if data.roundType !== 1}
				<Button variant="outline" size="sm" onclick={resetStreetView}>Return to the starting position</Button>
			{/if}
		</div>
		{#if showPlayers}
			<div class="page-results">
				{#each $clients as client}
					<b style={client.locked ? 'color: green;' : ''}>@{client.username}</b> - {client.score}<br>
				{/each}
			</div>
		{/if}
		<StreetView roundDetails={roundDetails} newFlag={newFlag} roundType={data.roundType} reset={reset} canMove={data.canMove} canRotate={data.canRotate} canZoom={data.canZoom} locationName={locationName} />
		<DraggableMap
			roundId={data.roundId}
			guess={$guess}
			roundResults={roundResults}
			boundaryBox={data.boundaryBox}
			roundType={data.roundType}
			showGeojson={data.showGeojson}
			time={time}
			isTournament={data.isTournament}
			startTime={data.startTime}
			roundNumber={roundNumber}
			totalRounds={totalRounds}
		/>
	</div>
{:else}
	<div class="p-4 sm:p-6">
		<section class="mx-auto w-full max-w-screen-lg">
			<h2 class="scroll-m-20 text-3xl font-bold tracking-tight">Waiting for start</h2>
			{#if !data.isTournament}
				Invite your friends with this code: <span class="text-2xl font-bold text-muted-foreground sm:text-3xl">{data.roundId}</span>
				<br><br>
			{/if}
			{#each $clients as client}
				{client.username}<br>
			{/each}
			<br>
			{#if data.isOwner}
				<Button onclick={async () => {
					console.log("Začenjam rundo");
					await fetch(`/round/${data.roundId}/nextRound`, {method: "POST"})
				}}>Start the competition
				</Button>
			{/if}
		</section>
	</div>
{/if}
{/if}

<style>
    .map-page {
        flex: 1;
		height: 100%;
        display: flex;
        flex-direction: column;
		position: relative;
		min-height: 0;
		overflow: hidden;
	}

	/* Route-scoped viewport lock: prevent vertical page growth from header + map overlays. */
	:global(.app) {
		height: 100dvh;
		min-height: 100dvh;
		overflow: hidden;
	}

	:global(main) {
		overflow: hidden;
	}

	.map-top-navbar {
		position: absolute;
		top: 0.5rem;
		left: 0.5rem;
		right: 0.5rem;
		z-index: 12;
		display: flex;
		gap: 0.5rem;
		justify-content: space-between;
		flex-wrap: wrap;
	}

	.page-results {
		position: absolute;
		top: 3.5rem;
		left: 0.5rem;
		right: auto;
		z-index: 16;
		max-height: 110px;
		overflow: auto;
		width: fit-content;
		max-width: min(360px, 40vw);
		min-width: 180px;
		padding: 0.9rem 1rem;
		border-radius: 0.5rem;
		background: hsl(var(--background) / 0.98);
		border: 1px solid hsl(var(--border));
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
		color: hsl(var(--foreground));
	}

	@media (max-width: 768px) {
		.map-top-navbar {
			position: absolute;
			top: 0.5rem;
			left: 0.5rem;
			right: 0.5rem;
			z-index: 14;
		}

		.page-results {
			position: absolute;
			top: 3.5rem;
			left: 0.5rem;
			right: 0.5rem;
			z-index: 16;
			max-height: 100px;
			width: auto;
			padding: 0.75rem;
		}
    }
</style>