<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';

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

			<br>

			<Button variant="outline" type="submit">Create</Button>
		</form>
	</section>
</div>
