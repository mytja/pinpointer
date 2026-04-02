<script lang="ts">
	/* eslint-disable no-undef */
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Progress } from '$lib/components/ui/progress';
	import type { RoundResult } from './types';
	import { env } from '$env/dynamic/public';
	import type { Readable } from 'svelte/store';

	type Countdown = { time: number } | null;

	interface MyProps {
		guess: { lat: number; lng: number };
		roundId: string;
		roundResults: Readable<RoundResult[]>;
		boundaryBox: number[];
		roundType: number;
		showGeojson: boolean;
		time: Readable<Countdown>;
		isTournament: boolean;
		startTime: number;
		roundNumber: number;
		totalRounds: number;
	}

	let { guess, roundId, roundResults, boundaryBox, roundType, showGeojson, time, isTournament, startTime, roundNumber, totalRounds }: MyProps = $props();

	let locked = $state(false);
	let posX = $state(-1);
	let posY = $state(0);
	let style = $state('bottom: 0.75rem; right: 0.75rem;');
	let isMapHovered = $state(false);
	let cornerPosition = $state<'left' | 'right'>('right');
	let canHover = $state(false);
	let isMobile = $state(false);
	let isCollapsed = $state(false);
	let isDragging = false;

	const ZOOM_TO = 8;
	const ZOOM_ENABLED = false;

	let draggableEl: HTMLDivElement;
	let mapEl: HTMLDivElement;
	let marker: google.maps.marker.AdvancedMarkerElement | null = null;
	let map: google.maps.Map | undefined;

	function handlePointerMove(event: PointerEvent) {
		if (!isDragging) return;
		const rect = draggableEl.getBoundingClientRect();
		posX = event.clientX - rect.width / 2;
		posY = event.clientY - rect.height / 2;
	}

	function handlePointerUp() {
		if (!isDragging) return;
		isDragging = false;
		const rect = draggableEl.getBoundingClientRect();
		const middlePoint = window.innerWidth / 2;
		if (posX + rect.width / 2 < middlePoint) {
			posX = -1;
			style = 'bottom: 0.75rem; left: 0.75rem;';
			cornerPosition = 'left';
		} else {
			posX = -1;
			style = 'bottom: 0.75rem; right: 0.75rem;';
			cornerPosition = 'right';
		}
	}

	function handlePointerDown(event: PointerEvent) {
		(event.currentTarget as HTMLElement)?.setPointerCapture?.(event.pointerId);
		isDragging = true;
	}

	function fitToBBox() {
		if (map === undefined) return;
		const bounds = new google.maps.LatLngBounds();
		bounds.extend({ lat: boundaryBox[1], lng: boundaryBox[0] });
		bounds.extend({ lat: boundaryBox[3], lng: boundaryBox[2] });
		map.fitBounds(bounds);
	}

	function toggleCollapsed() {
		if (!isMobile) return;
		isCollapsed = !isCollapsed;
	}

	onMount(() => {
		canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
		const mobileQuery = window.matchMedia('(max-width: 768px)');
		const onMobile = (matches: boolean) => {
			isMobile = matches;
			if (!matches) isCollapsed = false;
		};
		onMobile(mobileQuery.matches);
		const onMobileChange = (event: MediaQueryListEvent) => onMobile(event.matches);
		mobileQuery.addEventListener('change', onMobileChange);

		const initMap = async () => {
			const { AdvancedMarkerElement } = await google.maps.importLibrary('marker') as google.maps.MarkerLibrary;
			map = new google.maps.Map(mapEl, {
				center: { lat: 0, lng: 0 },
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

			map.addListener('click', async (e: google.maps.MapMouseEvent) => {
				if (locked || isCollapsed) return;
				if (marker == null) {
					marker = new AdvancedMarkerElement({ map, position: e.latLng });
				} else {
					marker.position = e.latLng;
				}
				map!.panTo(e.latLng!);
				if (map!.getZoom()! < ZOOM_TO && ZOOM_ENABLED) map!.setZoom(ZOOM_TO);
				const fd = new FormData();
				fd.append('lat', e.latLng!.lat().toString());
				fd.append('lng', e.latLng!.lng().toString());
				await fetch(`/round/${roundId}/guess`, { body: fd, method: 'POST' });
			});
		};

		void initMap();

		return () => {
			mobileQuery.removeEventListener('change', onMobileChange);
		};
	});

	$effect(() => {
		if (map === undefined || marker === null) return;
		marker.position = guess;
		map.panTo(guess);
		if (map.getZoom()! < ZOOM_TO && ZOOM_ENABLED) map.setZoom(ZOOM_TO);
	});

	$effect(() => {
		if (map === undefined || isCollapsed) return;
		setTimeout(() => google.maps.event.trigger(map!, 'resize'), 0);
	});

	roundResults.subscribe(() => {
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
	class:draggable-collapsed={isCollapsed}
	class:draggable-expanded-left={canHover && isMapHovered && cornerPosition === 'left'}
	class:draggable-expanded-right={canHover && isMapHovered && cornerPosition === 'right'}
	style={posX !== -1 ? `left: ${posX}px; top: ${posY}px` : style}
	onpointerup={handlePointerUp}
	onpointermove={handlePointerMove}
	onpointercancel={handlePointerUp}
	id="draggable-element"
	role="button"
	tabindex="0">
	<div class="handle" onpointerdown={handlePointerDown} role="button" tabindex="0">Geolocate</div>

	<div bind:this={mapEl} id="map" class:map-collapsed={isCollapsed} onpointerenter={() => (isMapHovered = true)} onpointerleave={() => (isMapHovered = false)}></div>

	<div class="bottom-row" class:bottom-row-collapsed={isCollapsed}>
		<div class="timer-block">
			<div class="timer-title">{#if $time !== null}Time remaining ({$time.time}s) - {roundNumber}/{totalRounds}{:else}Waiting for timer...{/if}</div>
			<div class="timer-subtitle">{#if isTournament}Tournament game{:else}Friendly game{/if}</div>
			{#if $time !== null}
				<Progress value={($time.time * 100) / startTime} />
			{/if}
		</div>

		<div class="actions">
			{#if !locked}
				<Button onclick={async () => {
					if (marker === null) return;
					locked = true;
					await fetch(`/round/${roundId}/guessLock`, { method: 'POST' });
				}}>Lock in</Button>
			{/if}
			{#if isMobile}
				<Button variant="outline" size="sm" onclick={toggleCollapsed}>{#if isCollapsed}Open map{:else}Collapse{/if}</Button>
			{/if}
		</div>
	</div>
</div>

<style>
	.draggable .handle {
		background-color: darkblue;
		color: white;
		padding: 10px;
		cursor: grab;
		user-select: none;
		touch-action: none;
	}

	.bottom-row {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		padding: 0.5rem;
		border-top: 1px solid rgba(255, 255, 255, 0.14);
		background-color: rgba(24, 28, 36, 0.95);
	}

	.bottom-row-collapsed {
		border-top: none;
	}

	.timer-block {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		min-width: 0;
	}

	.timer-title {
		font-size: 0.85rem;
		font-weight: 600;
		color: #f4f7ff;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.timer-subtitle {
		font-size: 0.75rem;
		color: #c8cfdb;
	}

	.actions {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.5rem;
		flex-wrap: wrap;
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
		cursor: default;
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
		width: 100%;
		min-height: 190px;
	}

	.map-collapsed {
		height: 0 !important;
		min-height: 0 !important;
		flex: 0 0 auto;
		overflow: hidden;
		pointer-events: none;
	}

	@media (max-width: 768px) {
		.draggable {
			left: 0 !important;
			right: 0 !important;
			bottom: 0 !important;
			width: auto;
			max-width: none;
			border-radius: 0;
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

		.draggable.draggable-collapsed {
			height: auto !important;
			min-height: 0;
		}

		.bottom-row {
			flex-direction: column;
			align-items: stretch;
		}

		.actions {
			justify-content: flex-start;
		}
	}
</style>
