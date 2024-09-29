<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
</script>

<div style="padding: 20px">
	<section>
		<form method="POST">
			<h1 class="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
				Create a competition
			</h1>

			<br>

			<Input type="text" name="name" placeholder="Competition name" class="max-w-xl" />
			<div style="height: 7px;"></div>

			<Textarea name="description" placeholder="Competition description" class="max-w-xl" />
			<div style="height: 15px;"></div>

			<div class="flex items-center space-x-2">
				<Switch name="private" id="private" />
				<Label for="airplane-mode">Is competition private?</Label>
			</div>

			<br>

			<Button variant="outline" type="submit">Create</Button>
		</form>
	</section>
</div>
