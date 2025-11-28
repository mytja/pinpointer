<script lang="ts">
	/* eslint-disable no-undef */
	import { onMount } from 'svelte';
	import type { Readable } from 'svelte/store';

	interface MyProps {
		roundDetails: Readable<{ lat: number, lng: number }>;
		newFlag: Readable<string>;
		locationName: Readable<string>;
		reset: Readable<number>;
		roundType: number;
		canMove: boolean;
		canRotate: boolean;
		canZoom: boolean;
	};
	let { roundDetails, newFlag, locationName, roundType, reset, canMove, canRotate, canZoom }: MyProps = $props();

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
		if (roundType !== 1) return; // Slovenian municipalities
		console.log('novi round flag detailsi');
		flagLink = value.flag;
	});

	reset.subscribe(() => {
		if (panorama === undefined) return;
		panorama.setPosition($roundDetails);
	});
</script>

{#if roundType === 1}
	<div style="display: inline-flex; align-items: center; justify-content: center; flex-direction: column;">
		<div style="height: 40px;"></div>
		<span class="text-3xl" style="text-align: center;">Poišči občinsko hišo slovenske občine<br>z naslednjim grbom</span>
		<div style="height: 50px;"></div>
		{#if $locationName !== undefined && $locationName !== ""}
			<span class="text-5xl font-bold" style="text-align: center;">{$locationName}</span>
		{/if}
		<div style="height: 50px;"></div>
		<img src={flagLink} alt="Občinski grb" style="height: 400px;">
	</div>
{/if}
<div id="street-view-map"></div>

<style>
    #street-view-map {
        flex: 1;
        height: auto;
        width: 100%; /* The width is the width of the web page */
    }
</style>
