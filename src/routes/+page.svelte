<!--suppress ES6UnusedImports -->
<script>
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';

	/** @type {import('./$types').PageData} */
	export let data;
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Pinpointer home" />
</svelte:head>

<div style="padding: 20px;">
	<section>
		<h1 class="scroll-m-20 text-3xl font-extrabold tracking-tight">
			Welcome, {data.username}!
		</h1>

		<br>
		<Button href="/quick">Create a quick match</Button>

		<br><br>
		<hr>

		<br>
		<Button href="/competitions/new">Create a new competition</Button>
		<br><br>

		{#if data.myCompetitions.length !== 0}
			Owned competitions:

			<div style="height: 7px"></div>

			<div class="grid grid-cols-4 gap-4">
				{#each data.myCompetitions as competition}
					<Card.Root>
						<Card.Header>
							<Card.Title>{competition.title}</Card.Title>
							<Card.Description>{competition.description}</Card.Description>
						</Card.Header>
						<Card.Footer>
							<Button variant="outline" href="/competition/{competition.id}">Vstopi</Button>
						</Card.Footer>
					</Card.Root>
				{/each}
			</div>

			<div style="height: 15px;"></div>
		{/if}

		{#if data.enrolledCompetitions.length !== 0}
			Enrolled competitions:

			<div style="height: 7px"></div>

			<div class="grid grid-cols-4 gap-4">
				{#each data.enrolledCompetitions as competition}
					<Card.Root>
						<Card.Header>
							<Card.Title>{competition.title}</Card.Title>
							<Card.Description>{competition.description}</Card.Description>
						</Card.Header>
						<Card.Footer>
							<Button variant="outline" href="/competition/{competition.id}">Vstopi</Button>
						</Card.Footer>
					</Card.Root>
				{/each}
			</div>

			<div style="height: 15px;"></div>
		{/if}

		{#if data.publicCompetitions.length !== 0}
			Public competitions:

			<div style="height: 7px"></div>

			<div class="grid grid-cols-4 gap-4">
				{#each data.publicCompetitions as competition}
					<Card.Root>
						<Card.Header>
							<Card.Title>{competition.title}</Card.Title>
							<Card.Description>{competition.description}</Card.Description>
						</Card.Header>
						<Card.Footer>
							<form action="/competition/{competition.id}/enroll" method="POST">
								<Button type="submit">Enroll into competition</Button>
							</form>
						</Card.Footer>
					</Card.Root>
				{/each}
			</div>

			<div style="height: 15px;"></div>
		{/if}

	</section>
</div>

<style>

</style>
