<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import * as Select from "$lib/components/ui/select/index.js";
	import { Switch } from '$lib/components/ui/switch';

	const ROUND_TYPES = [
		"Normal round",
		"Slovenian municipalities",
	];
	let value = "0";

	/** @type {import('./$types').PageData} */
	export let data;
</script>

<div style="padding: 20px">
	<section>
		<form method="POST">
			<h1 class="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
				Create a round for competition {data.competition.title}
			</h1>

			<br>

			<Input type="number" name="number" placeholder="Round number" value={data.roundNumber} class="max-w-xl" />
			<Label for="number">Round number</Label>
			<div style="height: 10px;"></div>

			<Input type="number" name="numberOfRounds" placeholder="Number of rounds" value=15 class="max-w-xl" />
			<Label for="numberOfRounds">Number of rounds</Label>
			<div style="height: 10px;"></div>

			<Input type="number" name="startTime" placeholder="Time per round (seconds)" value=90 class="max-w-xl" />
			<Label for="startTime">Time per round (seconds)</Label>
			<div style="height: 10px;"></div>

			<Input type="number" name="countdown" placeholder="Countdown (seconds; -1 = no countdown)" value=-1
						 class="max-w-xl" />
			<Label for="countdown">Countdown (seconds; -1 = no countdown)</Label>
			<div style="height: 10px;"></div>

			<Input type="text" name="location" placeholder="Round location" class="max-w-xl" />
			<Label for="location">Round location</Label>
			<div style="height: 15px;"></div>

			<Select.Root type="single" name="roundType" bind:value>
				<Select.Trigger class="max-w-xl">
					{ROUND_TYPES[+value]}
				</Select.Trigger>
				<Select.Content>
					<Select.Group>
						<Select.Item
							value="0"
							label="Normal round"
						>
							Normal round
						</Select.Item>
						<Select.Item
							value="1"
							label="Slovenian municipalities"
						>
							Slovenian municipalities
						</Select.Item>
					</Select.Group>
				</Select.Content>
			</Select.Root>
			<div style="height: 15px;"></div>

			<div class="flex items-center space-x-2">
				<Switch name="municipalityLetters" id="municipalityLetters" checked={false} />
				<Label for="municipalityLetters">Slowly reveal municipality letters?</Label>
			</div>
			<div style="height: 10px;"></div>

			<div class="flex items-center space-x-2">
				<Switch name="showGeojson" id="showGeojson" checked />
				<Label for="showGeojson">Show GeoJSON?<sup>1</sup></Label>
			</div>
			<span style="color: lightgrey; font-size: 0.8em;"><sup>1</sup>GeoJSON is a feature that aids by showing an additional map to the user. It is currently only in use within the Slovenian municipalities gamemode, where it overlays municipality borders over the map.</span>
			<div style="height: 10px;"></div>

			<br>

			<Button variant="outline" type="submit">Create</Button>
		</form>
	</section>
</div>
