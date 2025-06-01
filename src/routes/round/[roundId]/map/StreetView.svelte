<script lang="ts">
	/* eslint-disable no-undef */
	import { onMount } from 'svelte';
	import type { Readable } from 'svelte/store';

	interface MyProps {
		roundDetails: Readable<{ lat: number, lng: number }>;
		reset: Readable<number>;
		canMove: boolean;
		canRotate: boolean;
		canZoom: boolean;
	};
	let { roundDetails, reset, canMove, canRotate, canZoom }: MyProps = $props();

	let panorama: google.maps.StreetViewPanorama | undefined;

	onMount(async () => {
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
		if (panorama === undefined) return;
		console.log('novi round detailsi');
		panorama.setPosition(value);
	});

	reset.subscribe(() => {
		if (panorama === undefined) return;
		panorama.setPosition($roundDetails);
	});
</script>

<div id="street-view-map"></div>

<style>
    #street-view-map {
        flex: 1;
        height: auto;
        width: 100%; /* The width is the width of the web page */
    }
</style>
