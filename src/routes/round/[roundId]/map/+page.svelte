<script lang="ts">
	/* eslint-disable no-undef */
	import DraggableMap from './DraggableMap.svelte';
	import StreetView from './StreetView.svelte';
	import { source } from 'sveltekit-sse';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Progress } from '$lib/components/ui/progress';
	import { writable } from 'svelte/store';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import ResultsMap from './ResultsMap.svelte';
	import type { RoundResult } from './types';
	import { onMount } from 'svelte';
	import { Loader } from '@googlemaps/js-api-loader';
	import { env } from '$env/dynamic/public';

	/** @type {import('./$types').PageData} */
	let { data } = $props();

	const audio = new Audio('/beep.mp3');

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
	let results: RoundResult[] = $state([]);

	time.subscribe((value) => {
		if (value === null) return;
		if (value.time <= 0) return;
		if (value.time <= 10) audio.play();
	})

	roundDetails.subscribe((value) => {
		console.log('Clearing details');
		if (value === null) return;
		if (value.round > value.totalRounds) {
			// konec turnirja
			if (data.competitionId === "") {
				window.location.href = `/`;
				return;
			}
			window.location.href = `/competition/${data.competitionId}`;
			return;
		}
		hideRoundDetails = true;
	});

	roundResults.subscribe((value) => {
		try {
			document.exitFullscreen();
		} catch { /* empty */ }
		hideRoundDetails = false;
		results = value;
		console.log(value);
	});

	let loadedGoogleMaps = $state(false);
	let reset = writable<number>(0);

	onMount(async () => {
		const loader = new Loader({
			apiKey: env.PUBLIC_GOOGLE_MAPS_SDK_KEY,
			version: 'weekly'
		});
		await loader.load();
		await google.maps.importLibrary('maps') as google.maps.MapsLibrary;
		await google.maps.importLibrary('marker') as google.maps.MarkerLibrary;
		loadedGoogleMaps = true;
	});
</script>

<svelte:head>
	<title>Map</title>
	<meta name="description" content="Pinpointer map" />
</svelte:head>

{#if !loadedGoogleMaps}
	<div style="padding: 20px;">
		<section>
			<h2 class="scroll-m-20 text-3xl font-bold tracking-tight">Google Maps SDK is loading... This shouldn't take more than a few seconds.</h2>
		</section>
	</div>
{:else}
{#if $roundDetails !== null}
	<ResultsMap isOwner={data.isOwner} roundResults={$roundResults} hideRoundDetails={hideRoundDetails}
							roundId={data.roundId} />
	<div class="map-page">
		<div id="map-results-timer">
			<div id="map-results-timer-child" style="position: absolute; top: 50px; right: 5px; z-index: 10; width: 300px;">
				{#if $time !== null}
					<Card.Root style={($time.time * 100) / data.startTime <= 15 ? "border-color: red; border-width: 5px;" : ""}>
						<Card.Header>
							<Card.Title>Time remaining ({$time.time}s) – {$roundDetails.round}/{$roundDetails.totalRounds}</Card.Title>
							<Card.Description>
								{#if data.isTournament}Tournament game{:else}Friendly game{/if}
								<Progress value={($time.time * 100) / data.startTime} />
							</Card.Description>
							<Card.Content>
								{#each $clients as client}
										<b style={client.locked ? "color: green;" : ""}>@{client.username}</b> – {client.score}<br>
								{/each}
								<br>
								<Button on:click={() => reset.set($reset++)}>Pojdi nazaj na prvotno pozicijo</Button>
							</Card.Content>
						</Card.Header>
					</Card.Root>
				{/if}
			</div>
		</div>
		<StreetView roundDetails={roundDetails} reset={reset} />
		<DraggableMap roundId={data.roundId} guess={$guess} roundResults={roundResults} />
	</div>
{:else}
	<div style="padding: 20px;">
		<section>
			<h2 class="scroll-m-20 text-3xl font-bold tracking-tight">Waiting for start</h2>
			{#if !data.isTournament}
				Invite your friends with this code: <span style="font-size: 32px; font-weight: bold; color: darkgrey;">{data.roundId}</span>
				<br><br>
			{/if}
			{#each $clients as client}
				{client.username}<br>
			{/each}
			<br>
			{#if data.isOwner}
				<Button on:click={async () => {
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
        height: auto;
        display: flex;
        flex-direction: column;
    }
</style>