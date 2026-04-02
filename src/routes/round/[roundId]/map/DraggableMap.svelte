<script lang="ts">
	/* eslint-disable no-undef */
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import type { RoundResult } from './types';
	import { env } from '$env/dynamic/public';
	import type { Readable } from 'svelte/store';

	interface MyProps {
		guess: { lat: number; lng: number };
		roundId: string;
		roundResults: Readable<RoundResult[]>;
		boundaryBox: number[];
		roundType: number;
		showGeojson: boolean;
	}

	let { guess, roundId, roundResults, boundaryBox, roundType, showGeojson }: MyProps = $props();

	let locked = $state(false);

	const ZOOM_TO = 8;
	const ZOOM_ENABLED = false;

	let posX = $state(-1);
	let posY = $state(0);
	let style = $state('bottom: 0.75rem; right: 0.75rem;');
	let isMapHovered = $state(false);
	let cornerPosition = $state<'left' | 'right'>('right');
	let canHover = $state(false);
	let isDragging = false;

	let draggableEl: HTMLDivElement;

	function handlePointerMove(event: PointerEvent) {
		if (isDragging) {
			const rect = draggableEl.getBoundingClientRect();
			posX = event.clientX - rect.width / 2;
			posY = event.clientY - rect.height / 2;
		}
	}

	function handlePointerUp() {
		if (!isDragging) return;
		isDragging = false;

		const rect = draggableEl.getBoundingClientRect();
		const currentWindowWidth = window.innerWidth;
		const currentWindowHeight = window.innerHeight;
		const middlePoint = currentWindowWidth / 2;

		// Determine snap position based on current x position
		if (posX + rect.width / 2 < middlePoint) {
			// Snap to bottom-left
			posX = -1;
			style = 'bottom: 0.75rem; left: 0.75rem;';
			cornerPosition = 'left';
		} else {
			// Snap to bottom-right
			posX = -1;
			style = 'bottom: 0.75rem; right: 0.75rem;';
			cornerPosition = 'right';
		}

		// Always snap to the bottom of the screen
		posY = currentWindowHeight - rect.height;
	}

	function handlePointerDown(event: PointerEvent) {
		(event.currentTarget as HTMLElement)?.setPointerCapture?.(event.pointerId);
		isDragging = true;
	}

	let marker: google.maps.marker.AdvancedMarkerElement | null = null;
	let map: google.maps.Map | undefined;

	onMount(async () => {
		canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

		const { AdvancedMarkerElement } = await google.maps.importLibrary('marker') as google.maps.MarkerLibrary;
		map = new google.maps.Map(document.getElementById('map') as HTMLElement, {
			center: { lat: 0.000, lng: 0.000 },
			zoom: 1,
			mapId: env.PUBLIC_GOOGLE_MAPS_MARKER_MAP_ID,
			mapTypeControl: false,
			streetViewControl: false,
			fullscreenControl: true,
			zoomControl: true
		});
		if (roundType === 1 && showGeojson) {
			map.data.loadGeoJson('/OB.geojson');
			map.data.setStyle({ clickable: false });
		}
		fitToBBox();

		// Keep timer card visible both in and outside fullscreen map mode.
		const mapChild = document.getElementById('map')!.firstChild;
		mapChild?.addEventListener('fullscreenchange', () => {
			const isExiting = document.fullscreenElement === null;
			const timer = document.getElementById('map-results-timer-child');
			const nonFS = document.getElementById('map-results-timer');
			if (timer === null) return;
			if (isExiting) {
				nonFS!.appendChild(timer);
			} else {
				mapChild.appendChild(timer);
			}
		});

		map.addListener('click', async (e: google.maps.MapMouseEvent) => {
			if (locked) return;
			if (marker == null) {
				marker = new AdvancedMarkerElement({
					map,
					position: e.latLng
				});
			} else {
				marker.position = e.latLng;
			}
			map!.panTo(e.latLng!);
			if (map!.getZoom()! < ZOOM_TO && ZOOM_ENABLED) {
				map!.setZoom(ZOOM_TO);
			}
			let fd = new FormData();
			fd.append('lat', e.latLng!.lat().toString());
			fd.append('lng', e.latLng!.lng().toString());
			await fetch(`/round/${roundId}/guess`, { body: fd, method: 'POST' });
		});
	});

	$effect(() => {
		if (map === undefined || marker === null) return;
		console.log('guess', guess);
		marker.position = guess;
		map.panTo(guess);
		if (map.getZoom()! < ZOOM_TO && ZOOM_ENABLED) {
			map.setZoom(ZOOM_TO);
		}
	});

	function fitToBBox() {
		const bounds = new google.maps.LatLngBounds();
		console.log('bbox', boundaryBox);
		bounds.extend({ lat: boundaryBox[1], lng: boundaryBox[0] });
		bounds.extend({ lat: boundaryBox[3], lng: boundaryBox[2] });
		map!.fitBounds(bounds);
	}

	// reset za novo rundo
	roundResults.subscribe((value) => {
		console.log('round results draggable', value, map, marker);
		if (map === undefined || marker === null) return;
		fitToBBox();
		marker.map = null;
		marker = null;
		locked = false;
	});
</script>

<div
	bind:this={draggableEl}
	class="draggable"
	class:draggable-size-m={roundType === 1}
	class:draggable-size-s={roundType !== 1}
	class:draggable-expanded-left={canHover && isMapHovered && cornerPosition === 'left'}
	class:draggable-expanded-right={canHover && isMapHovered && cornerPosition === 'right'}
	style={posX !== -1 ? `left: ${posX}px; top: ${posY}px` : style}
	onpointerup={handlePointerUp}
	onpointermove={handlePointerMove}
	onpointercancel={handlePointerUp}
	id="draggable-element"
	role="button"
	tabindex="0">
	<div
		class="handle"
		onpointerdown={handlePointerDown}
		role="button"
		tabindex="0">
		Geolocate
	</div>
	<div
		id="map"
		onpointerenter={() => (isMapHovered = true)}
		onpointerleave={() => (isMapHovered = false)}></div>
	{#if !locked}
		<Button onclick={async () => {
			if (marker === null) return;
			locked = true;
			await fetch(`/round/${roundId}/guessLock`, {method: "POST"})
		}} class="m-2 w-auto self-end sm:w-auto">Lock in
		</Button>
	{/if}
</div>

<style>
    .draggable .handle {
        background-color: darkblue;
        color: white;
        padding: 10px;
        cursor: grab; /* Indicate draggable area */
        user-select: none; /* Prevent text selection while dragging */
		touch-action: none;
    }

    .draggable-size-s {
		width: min(92vw, 500px);
		height: min(55vh, 400px);
    }

    .draggable-size-m {
		width: min(92vw, 600px);
		height: min(60vh, 500px);
    }

    .draggable-size-s.draggable-expanded-right {
		width: min(95vw, 700px);
		height: min(70vh, 550px);
        transform-origin: bottom right;
    }

    .draggable-size-m.draggable-expanded-right {
		width: min(95vw, 800px);
		height: min(75vh, 650px);
        transform-origin: bottom right;
    }

    .draggable-size-s.draggable-expanded-left {
		width: min(95vw, 700px);
		height: min(70vh, 550px);
        transform-origin: bottom left;
    }

    .draggable-size-m.draggable-expanded-left {
		width: min(95vw, 800px);
		height: min(75vh, 650px);
        transform-origin: bottom left;
    }

    .draggable {
        z-index: 10;
        position: absolute;
        background-color: lightblue;
        cursor: default; /* Default cursor for the whole div */
        display: flex;
        flex-direction: column;
        transition: width 0.2s ease, height 0.2s ease;
		max-width: calc(100vw - 1.5rem);
		max-height: calc(100vh - 1.5rem);
    }

    .draggable .handle:active {
        cursor: grabbing;
    }

    #map {
        flex: 1;
        height: auto;
        width: 100%; /* The width is the width of the web page */
    }

	@media (max-width: 768px) {
		.draggable {
			left: 0.5rem !important;
			right: 0.5rem !important;
			bottom: 0.5rem !important;
			width: auto;
			max-width: none;
		}

		.draggable-size-s,
		.draggable-size-m,
		.draggable-size-s.draggable-expanded-right,
		.draggable-size-m.draggable-expanded-right,
		.draggable-size-s.draggable-expanded-left,
		.draggable-size-m.draggable-expanded-left {
			width: 100%;
			height: min(48vh, 420px);
		}
	}
</style>
