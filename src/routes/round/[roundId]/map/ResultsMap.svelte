<script lang="ts">
	/* eslint-disable no-undef */
	import { onMount } from 'svelte';
	import type { RoundResult } from './types';
	import { Button } from '$lib/components/ui/button';
	import sanitizeHtml from 'sanitize-html';
	import { env } from '$env/dynamic/public';
	import type { Readable } from 'svelte/store';

	interface MyProps {
		isOwner: boolean;
		roundResults: RoundResult[] | null;
		hideRoundDetails: boolean;
		roundId: string;
		roundNumber: number;
		roundCount: number;
	}

	let { isOwner, roundResults, hideRoundDetails, roundId, roundNumber, roundCount }: MyProps = $props();

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
		/*	for (let m = 0; m < markers.length; m++) {
				const marker = markers[m];
				marker.setMap(null);
			}
			markers = [];
			for (let m = 0; m < roundResults.length; m++) {
				const roundResult = roundResults[m];
				console.log('Round results', roundResult);
				if (roundResult.userId === 'solution') {
					const pinBackground = new PinElement({
						background: '#FBBC04'
					});
					markers.push(new AdvancedMarkerElement({
						map,
						position: roundResult.latLng,
						title: `Solution`,
						content: pinBackground.element
					}));
					continue;
				}
				markers.push(new AdvancedMarkerElement({
					map,
					position: roundResult.latLng,
					title: `${roundResult.username}; ${roundResult.distance}km, ${roundResult.addedScore} points`
				}));
			}
		});*/
	});

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
</style>

<div style="display:flex; justify-content:center; align-items:center; flex-direction: column; visibility: {hideRoundDetails ? 'hidden' : 'visible'}">
	<div
		style="width: 100vw; height: 100%; z-index: 50; position: absolute; top: 0; left: 0; overflow: hidden; padding: 20px;"
		class="bg-card">
		<div style="height: 12px;"></div>
		<div style="display: flex; flex-direction: row;">
			<div id="results-map" style="height: 85vh; min-width: 60vw;"></div>
			<div style="flex-grow: 1; height: 85vh; padding-left: 20px;">
				<span style="font-size: 2em;">Results ({roundNumber}/{roundCount})</span>
				<br><br>
				<table class="striped" style="width: 100%;">
					<thead>
					<tr>
						<th scope="col">Username</th>
						<th scope="col">Distance</th>
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
		{#if isOwner}
			<div style="height: 12px;"></div>
			<Button on:click={async () => {
				await fetch(`/round/${roundId}/nextRound`, {method: "POST"})
			}}>Next round
			</Button>
		{:else}
			<div style="height: 12px;"></div>
			Waiting for host to start new round!
		{/if}
	</div>
</div>
