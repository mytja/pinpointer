<script lang="ts">
	/* eslint-disable no-undef */
	import { onMount } from 'svelte';
	import type { RoundResult } from './types';
	import { Button } from '$lib/components/ui/button';
	import sanitizeHtml from 'sanitize-html';
	import { env } from '$env/dynamic/public';

	interface MyProps {
		isOwner: boolean;
		roundResults: RoundResult[] | null;
		hideRoundDetails: boolean;
		roundId: string;
		roundNumber: number;
		roundCount: number;
		roundType: number;
	}

	let { isOwner, roundResults, hideRoundDetails, roundId, roundNumber, roundCount, roundType }: MyProps = $props();

	let markers: google.maps.marker.AdvancedMarkerElement[] = [];
	let map: google.maps.Map | undefined;
	let results = $state<RoundResult[] | null>([]); // svelte 5 fucking hackery

	onMount(async () => {
		map = new google.maps.Map(document.getElementById('results-map') as HTMLElement, {
			center: { lat: 0.000, lng: 0.000 },
			zoom: 1,
			mapId: env.PUBLIC_GOOGLE_MAPS_MARKER_MAP_ID,
			mapTypeControl: false,
			streetViewControl: false,
			fullscreenControl: true,
			zoomControl: true
		});
		if (roundType === 1) {
			map.data.loadGeoJson('/OB.geojson');
		}
	});

	let munSol = $state("");
	$effect(() => {
		console.log("Updating markers", roundResults, map);
		roundResults = roundResults;
		results = JSON.parse(JSON.stringify(roundResults));

		if (map === undefined || roundResults === null) return;

		for (let m = 0; m < markers.length; m++) {
			const marker = markers[m];
			marker.map = null;
		}
		markers = [];

		for (let m = 0; m < roundResults.length; m++) {
			const roundResult = roundResults[m];
			console.log('Round results', roundResult);
			if (roundResult.userId === 'solution') {
				munSol = roundResult.municipality;
				const pinBackground = new google.maps.marker.PinElement({
					background: '#FBBC04'
				});
				const infowindow = new google.maps.InfoWindow({
					content: `<div class="username">Solution</div>`,
				});
				const marker = new google.maps.marker.AdvancedMarkerElement({
					map,
					position: roundResult.latLng,
					title: `Solution`,
					content: pinBackground.element
				});
				infowindow.open({
					anchor: marker,
					map,
				});
				marker.addListener("click", () => {
					infowindow.open({
						anchor: marker,
						map,
					});
				});
				map!.panTo(roundResult.latLng!);
				map!.setZoom(7);
				markers.push(marker);
				continue;
			}
			if (roundResult.latLng === null) continue;
			const infowindow = new google.maps.InfoWindow({
				content: `<div class="username">` + sanitizeHtml(`${roundResult.username}`) + `</div>` + sanitizeHtml(`<b>${Math.round(roundResult.distance / 100) / 10}km</b><br><b>${roundResult.addedScore}</b> points</div>`),
			});
			const marker = new google.maps.marker.AdvancedMarkerElement({
				map,
				position: roundResult.latLng,
				title: `${roundResult.username}; ${roundResult.distance}km, ${roundResult.addedScore} points`
			});
			infowindow.open({
				anchor: marker,
				map,
			});
			marker.addListener("click", () => {
				infowindow.open({
					anchor: marker,
					map,
				});
			});
			markers.push(marker);
		}
		const bounds = new google.maps.LatLngBounds();
		for (let m = 0; m < markers.length; m++) {
			const marker = markers[m];
			if (marker.position === null) continue;
			if (marker.position === undefined) continue;
			bounds.extend(marker.position);
		}
		map!.fitBounds(bounds);
	});
</script>

<style>
	table {
      table-layout: fixed;
			text-align: center;
	}

	.results-shell {
		display: flex;
		justify-content: center;
		align-items: center;
		flex-direction: column;
	}

	.results-overlay {
		width: 100%;
		height: 100%;
		z-index: 50;
		position: absolute;
		top: 0;
		left: 0;
		overflow: auto;
		padding: 12px;
	}

	.results-content {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	#results-map {
		height: 50vh;
		width: 100%;
	}

	.results-table {
		overflow-x: auto;
	}

	@media (min-width: 1024px) {
		.results-overlay {
			padding: 20px;
		}

		.results-content {
			flex-direction: row;
			gap: 20px;
		}

		#results-map {
			height: 85vh;
			min-width: 60vw;
		}

		.results-side {
			height: 85vh;
		}
	}
</style>

<div class="results-shell" style:visibility={hideRoundDetails ? 'hidden' : 'visible'}>
	<div class="results-overlay bg-card">
		<div style="height: 12px;"></div>
		<div class="results-content">
			<div id="results-map"></div>
			<div class="results-side flex-grow lg:pl-5">
				<span class="text-2xl sm:text-3xl">Results ({roundNumber}/{roundCount})</span>
				{#if roundType === 1}
					<br>
					<span class="text-xl font-bold sm:text-2xl">Občina {munSol}</span>
				{/if}
				<br><br>
				<div class="results-table">
					<table class="striped w-full min-w-[700px]">
					<thead>
					<tr>
						<th scope="col">Username</th>
						<th scope="col">Distance</th>
						{#if roundType === 1}
							<th scope="col">Municipality</th>
						{/if}
						<th scope="col">Score before</th>
						<th scope="col">Points received</th>
						<th scope="col">Total points</th>
					</tr>
					</thead>
					<tbody>
					{#if results !== null}
						{#each results as roundResult}
							{#if roundResult.userId !== 'solution'}
								<tr>
									<th scope="row">@{roundResult.username}</th>
									<td>{#if roundResult.distance === -1}❌{:else}{Math.round(roundResult.distance * 100) / 100} m{/if}</td>
									{#if roundType === 1}
										<td>{roundResult.municipality}</td>
									{/if}
									<td>{roundResult.scoreBefore}</td>
									<td>{roundResult.addedScore}</td>
									<td>{roundResult.newScore}</td>
								</tr>
							{/if}
						{/each}
					{/if}
					</tbody>
					</table>
				</div>
			</div>
		</div>
		{#if isOwner}
			<div style="height: 12px;"></div>
			<Button onclick={async () => {
				await fetch(`/round/${roundId}/nextRound`, {method: "POST"})
			}}>Next round
			</Button>
		{:else}
			<div style="height: 12px;"></div>
			Waiting for host to start new round!
		{/if}
	</div>
</div>
