<script lang="ts">
	/* eslint-disable no-undef */
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import type { RoundResult } from './types';
	import { env } from '$env/dynamic/public';
	import type { Readable } from 'svelte/store';

	interface MyProps {
		guess: {lat: number; lng: number};
		roundId: string;
		roundResults: Readable<RoundResult[]>;
	}
	let { guess, roundId, roundResults }: MyProps = $props();

	let locked = $state(false);

	const ZOOM_TO = 8;
	const ZOOM_ENABLED = false;

	let posX = $state(0);
	let posY = $state(0);
	let isDragging = false;
	let windowWidth = window.innerWidth;
	let windowHeight = window.innerHeight;

	let draggableEl: HTMLDivElement;

	function handleMouseMove(event: MouseEvent) {
		if (isDragging) {
			const rect = draggableEl.getBoundingClientRect();
			posX = event.clientX - rect.width / 2;
			posY = event.clientY - rect.height / 2;
		}
	}

	function handleMouseUp() {
		isDragging = false;

		const rect = draggableEl.getBoundingClientRect();
		const middlePoint = windowWidth / 2;

		// Determine snap position based on current x position
		if (posX + rect.width / 2 < middlePoint) {
			// Snap to bottom-left
			posX = 0;
		} else {
			// Snap to bottom-right
			posX = windowWidth - rect.width;
		}

		// Always snap to the bottom of the screen
		posY = windowHeight - rect.height;
	}

	function handleMouseDown() {
		isDragging = true;
	}

	// Update window dimensions on resize
	window.addEventListener("resize", () => {
		windowWidth = window.innerWidth;
		windowHeight = window.innerHeight;
		if (posX !== 0) {
			const rect = draggableEl.getBoundingClientRect();
			posX = windowWidth - rect.width;
			posY = windowHeight - rect.height;
			console.log("pos", posX, posY)
		}
	});

	let marker: google.maps.marker.AdvancedMarkerElement | null = null;
	let map: google.maps.Map | undefined;

	onMount(async () => {
		console.log("draggableEl", draggableEl);

		const rect = draggableEl.getBoundingClientRect();
		posX = windowWidth - rect.width;
		posY = windowHeight - rect.height;
		console.log("pos", posX, posY)

		const { AdvancedMarkerElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;
		map = new google.maps.Map(document.getElementById("map") as HTMLElement, {
			center: { lat: 0.000, lng: 0.000 },
			zoom: 1,
			mapId: env.PUBLIC_GOOGLE_MAPS_MARKER_MAP_ID,
			mapTypeControl: false,
			streetViewControl: false,
			fullscreenControl: true,
			zoomControl: true,
		});

		// HACKY AS FUCK
		// FUCK EM BROWSERS
		const mapChild = document.getElementById("map")!.firstChild;
		mapChild?.addEventListener("fullscreenchange", () => {
			const isExiting = document.fullscreenElement === null;
			const timer = document.getElementById("map-results-timer-child");
			const nonFS = document.getElementById("map-results-timer");
			if (timer === null) return;
			if (isExiting) {
				nonFS!.appendChild(timer);
			} else {
				mapChild.appendChild(timer);
			}
		});

		map.addListener("click", async (e: google.maps.MapMouseEvent) => {
			if (locked) return;
			if (marker == null) {
				marker = new AdvancedMarkerElement({
					map,
					position: e.latLng,
				});
			} else {
				marker.position = e.latLng;
			}
			map!.panTo(e.latLng!);
			if (map!.getZoom()! < ZOOM_TO && ZOOM_ENABLED) {
				map!.setZoom(ZOOM_TO);
			}
			let fd = new FormData();
			fd.append("lat", e.latLng!.lat().toString());
			fd.append("lng", e.latLng!.lng().toString());
			await fetch(`/round/${roundId}/guess`, {body: fd, method: "POST"})
		})
	})

	$effect(() => {
		if (map === undefined || marker === null) return;
		console.log("guess", guess);
		marker.position = guess;
		map.panTo(guess);
		if (map.getZoom()! < ZOOM_TO && ZOOM_ENABLED) {
			map.setZoom(ZOOM_TO);
		}
	})

	// reset za novo rundo
	roundResults.subscribe((value) => {
		console.log("round results draggable", value, map, marker);
		if (map === undefined || marker === null) return;
		map!.panTo({ lat: 0.000, lng: 0.000 });
		map!.setZoom(1);
		marker.map = null;
		marker = null;
		locked = false;
	});
</script>

<div
	bind:this={draggableEl}
	class="draggable"
	style="left: {posX}px; top: {posY}px"
	onmouseup={handleMouseUp}
	onmousemove={handleMouseMove}
	id="draggable-element"
	role="button"
	tabindex="0">
	<div
		class="handle"
	 	onmousedown={handleMouseDown}
		role="button"
		tabindex="0">
		Geolocate
	</div>
	<div id="map"></div>
	{#if !locked}
		<Button on:click={async () => {
			if (marker === null) return;
			locked = true;
			await fetch(`/round/${roundId}/guessLock`, {method: "POST"})
		}}>Lock in</Button>
	{/if}
</div>

<style>
		.draggable .handle {
        background-color: darkblue;
        color: white;
        padding: 10px;
        cursor: grab; /* Indicate draggable area */
        user-select: none; /* Prevent text selection while dragging */
		}

    .draggable {
				z-index: 10;
        position: absolute;
        width: 500px;
        height: 400px;
        background-color: lightblue;
        cursor: default; /* Default cursor for the whole div */
        display: flex;
        flex-direction: column;
    }

    .draggable .handle:active {
        cursor: grabbing;
    }

    #map {
        flex: 1;
        height: auto;
        width: 100%; /* The width is the width of the web page */
    }
</style>
