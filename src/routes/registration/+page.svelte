<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button';
</script>

<div style="padding: 20px">
	<section>
		<form method="POST">
			<h1 class="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
				Pinpointer Registration
			</h1>

			<br>

			<Input type="name" name="username" placeholder="Username" class="max-w-xl" />
			<div style="height: 7px;"></div>
			<Input type="password" name="password" placeholder="Password" class="max-w-xl" />

			<br>

			<Button variant="outline" type="submit">Register</Button>
		</form>

		<br><br>

		Already have an account? <a href="/login" class="text-blue-600">Login instead!</a>

	</section>
</div>
