<script lang="ts">
	/* eslint-disable no-undef */
	import { onMount } from 'svelte';
	import type { RoundResult } from './types';
	import { Button } from '$lib/components/ui/button';
	import sanitizeHtml from 'sanitize-html';

	interface MyProps {
		isOwner: boolean;
		roundResults: RoundResult[] | null;
		hideRoundDetails: boolean;
		roundId: string;
	}

	let { isOwner, roundResults, hideRoundDetails, roundId }: MyProps = $props();

	let markers: google.maps.AdvancedMarkerElement[] = [];

	let map: google.maps.Map | undefined;

	onMount(async () => {
		const {
			AdvancedMarkerElement,
			PinElement
		} = await google.maps.importLibrary('marker') as google.maps.MarkerLibrary;
		map = new google.maps.Map(document.getElementById('results-map') as HTMLElement, {
			center: { lat: 0.000, lng: 0.000 },
			zoom: 1,
			mapId: import.meta.env.VITE_GOOGLE_MAPS_MARKER_MAP_ID,
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

		if (map === undefined || roundResults === null) return;

		for (let m = 0; m < markers.length; m++) {
			const marker = markers[m];
			marker.setMap(null);
		}
		markers = [];

		google.maps.importLibrary('marker').then(({AdvancedMarkerElement, PinElement}) => {
			for (let m = 0; m < roundResults.length; m++) {
				const roundResult = roundResults[m];
				console.log('Round results', roundResult);
				if (roundResult.userId === 'solution') {
					const pinBackground = new PinElement({
						background: '#FBBC04'
					});
					const infowindow = new google.maps.InfoWindow({
						content: `<div class="username">Solution</div>`,
					});
					const marker = new AdvancedMarkerElement({
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
				const marker = new AdvancedMarkerElement({
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
				bounds.extend(marker);
			}
			map!.fitBounds(bounds);
		});
	});
</script>

<div style="display:flex; justify-content:center; align-items:center; flex-direction: column; visibility: {hideRoundDetails ? 'hidden' : 'visible'}">
	<div
		style="width: 100vw; height: 100%; z-index: 50; position: absolute; top: 0; left: 0; overflow: hidden; padding: 20px;"
		class="bg-card">
		<h1 style="font-size: 2em;">Results</h1>
		<div style="height: 12px;"></div>
		<div id="results-map" style="height: 80vh; width: 80vw;"></div>
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
