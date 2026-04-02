<script lang="ts">
	/* eslint-disable no-undef */
	import { onMount } from 'svelte';
	import type { Readable } from 'svelte/store';

	interface MyProps {
		roundDetails: Readable<{ lat: number, lng: number }>;
		newFlag: Readable<{ flag: string }>;
		locationName: Readable<string>;
		reset: Readable<number>;
		roundType: number;
		canMove: boolean;
		canRotate: boolean;
		canZoom: boolean;
	}
	let { roundDetails, newFlag, locationName, roundType, reset }: MyProps = $props();

	let panorama: google.maps.StreetViewPanorama | undefined;

	onMount(async () => {
		if (roundType === 1) return; // Slovenian municipalities
		panorama = new google.maps.StreetViewPanorama(
			document.getElementById('street-view-map') as HTMLElement,
			{
				position: $roundDetails,
				addressControl: false,
				fullscreenControl: false,
				disableDoubleClickZoom: true,
				showRoadLabels: false,
				motionTrackingControl: false,
				zoomControl: false,
				panControl: true,
			}
		);
		panorama.setPosition($roundDetails);
	});

	roundDetails.subscribe((value) => {
		if (roundType !== 0) return; // Slovenian municipalities
		if (panorama === undefined) return;
		console.log('novi round detailsi');
		panorama.setPosition(value);
	});

	let flagLink = $state("");
	newFlag.subscribe((value) => {
		if (value === null) return;
		if (roundType !== 1) return; // Slovenian municipalities
		console.log('novi round flag detailsi', value);
		flagLink = value.flag;
	});

	reset.subscribe(() => {
		if (panorama === undefined) return;
		panorama.setPosition($roundDetails);
	});
</script>

{#if roundType === 1}
	<div class="municipality-view">
		<span class="text-center text-2xl">Poisci obcinsko hiso slovenske obcine<br>z naslednjim grbom</span>
		{#if $locationName !== undefined && $locationName !== ""}
			<span class="location-name">{$locationName.replaceAll("   ", '\n')}</span>
		{/if}
		<img src={flagLink} alt="Obcinski grb" class="municipality-flag">
	</div>
{:else}
	<div id="street-view-map"></div>
{/if}

<style>
	.municipality-view {
		flex: 1;
		min-height: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		padding: 1rem;
		overflow: auto;
	}

	.location-name {
		font-size: clamp(1.5rem, 5vw, 2.25rem);
		font-weight: 700;
		text-align: center;
		white-space: pre-line;
	}

	.municipality-flag {
		max-height: min(45vh, 350px);
		max-width: min(90vw, 420px);
		width: auto;
		height: auto;
	}

    #street-view-map {
        flex: 1;
        min-height: 0;
        width: 100%; /* The width is the width of the web page */
    }
</style>
