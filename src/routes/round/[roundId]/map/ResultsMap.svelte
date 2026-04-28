<script lang="ts">
	/* eslint-disable no-undef */
	import { onMount, untrack } from 'svelte';
	import type { RoundResult } from './types';
	import { Button } from '$lib/components/ui/button';
	import sanitizeHtml from 'sanitize-html';
	import { env } from '$env/dynamic/public';
	import { flip } from 'svelte/animate';
	import { cubicOut } from 'svelte/easing';

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
	let sortedResults = $state<RoundResult[]>([]);
	const totalScoreValues = $state<Record<string, number>>({});
	const addedScoreValues = $state<Record<string, number>>({});
	const totalScoreRafs = new Map<string, number>();
	const addedScoreRafs = new Map<string, number>();

	function scoreDuration(score: number) {
		const clamped = Math.max(0, Math.min(5000, Math.abs(score)));
		return Math.min(2500, 250 + clamped * 0.30);
	}

	function animateScore(
		valuesStore: Record<string, number>,
		rafStore: Map<string, number>,
		key: string,
		fromValue: number,
		toValue: number,
		duration: number
	) {
		const existing = rafStore.get(key);
		if (existing !== undefined) {
			cancelAnimationFrame(existing);
		}
		if (fromValue === toValue) {
			valuesStore[key] = toValue;
			rafStore.delete(key);
			return;
		}
		const start = performance.now();
		const step = (now: number) => {
			const progress = Math.min(1, (now - start) / duration);
			const eased = cubicOut(progress);
			valuesStore[key] = Math.round(fromValue + (toValue - fromValue) * eased);
			if (progress < 1) {
				rafStore.set(key, requestAnimationFrame(step));
			} else {
				rafStore.delete(key);
			}
		};
		rafStore.set(key, requestAnimationFrame(step));
	}

	function scoreColor(score: number) {
		const clamped = Math.max(0, Math.min(5000, score));
		const ratio = clamped / 5000;
		const hue = Math.round(ratio * 120);
		return `hsl(${hue}, 70%, 45%)`;
	}

	function formatDistance(distance: number) {
		if (distance === -1) return 'No guess';
		if (distance >= 1000) return `${Math.round(distance / 100) / 10} km`;
		return `${Math.round(distance * 100) / 100} m`;
	}

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

		const nextSortedResults = (roundResults ?? [])
			.filter((roundResult) => roundResult.userId !== 'solution')
			.sort((a, b) => b.newScore - a.newScore);
		sortedResults = nextSortedResults;

		untrack(() => {
			for (const roundResult of nextSortedResults) {
				const totalFrom = totalScoreValues[roundResult.userId] ?? roundResult.scoreBefore;
				const totalTo = roundResult.newScore;
				animateScore(
					totalScoreValues,
					totalScoreRafs,
					roundResult.userId,
					totalFrom,
					totalTo,
					scoreDuration(Math.abs(totalTo - totalFrom))
				);
				const addedFrom = addedScoreValues[roundResult.userId] ?? 0;
				const addedTo = roundResult.addedScore;
				animateScore(
					addedScoreValues,
					addedScoreRafs,
					roundResult.userId,
					addedFrom,
					addedTo,
					scoreDuration(Math.abs(addedTo))
				);
			}
		});
	});
</script>

<style>
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
		overflow-y: auto;
		max-height: 55vh;
		padding-right: 6px;
	}

	.result-card {
		border-radius: 14px;
	}

	.rank-badge {
		min-width: 40px;
		height: 40px;
		border-radius: 999px;
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

		.results-table {
			max-height: 75vh;
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
					<div class="grid gap-3">
						{#if sortedResults.length > 0}
							{#each sortedResults as roundResult, index (roundResult.userId)}
								<div
									class="result-card border border-border/60 bg-card/60 p-4 shadow-sm backdrop-blur"
									animate:flip={{ duration: 1000 }}
								>
									<div class="flex flex-wrap items-center justify-between gap-4">
										<div class="flex items-center gap-3">
											<div class="rank-badge grid place-items-center bg-muted text-sm font-semibold text-muted-foreground">
												#{index + 1}
											</div>
											<div>
												<div class="text-lg font-semibold">@{roundResult.username}</div>
												<div class="text-xs text-muted-foreground">Distance: {formatDistance(roundResult.distance)}</div>
											</div>
										</div>
										<div class="text-right">
											<div class="text-xs uppercase tracking-wide text-muted-foreground">Total</div>
											<div class="text-2xl font-bold">
												{Math.round(totalScoreValues[roundResult.userId] ?? roundResult.newScore)}
											</div>
										</div>
									</div>
									<div class="mt-4 grid gap-3 sm:grid-cols-2">
										<div class="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm">
											Score before: <span class="font-semibold">{roundResult.scoreBefore}</span>
										</div>
										<div class="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm">
											Points: <span class="font-semibold" style={`color: ${scoreColor(Math.abs(roundResult.addedScore))}`}>
												{roundResult.addedScore >= 0 ? '+' : ''}{Math.round(addedScoreValues[roundResult.userId] ?? roundResult.addedScore)}
											</span>
										</div>
										{#if roundType === 1}
											<div class="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm sm:col-span-2">
												Municipality: <span class="font-semibold">{roundResult.municipality}</span>
											</div>
										{/if}
									</div>
								</div>
							{/each}
						{:else}
							<div class="rounded-lg border border-border/60 bg-muted/20 px-3 py-4 text-sm text-muted-foreground">
								No results yet.
							</div>
						{/if}
					</div>
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
			Waiting for the host to start new round!
		{/if}
	</div>
</div>
