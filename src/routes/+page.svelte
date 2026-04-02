
<!--suppress ES6UnusedImports -->
<script>
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';

	/** @type {import('./$types').PageData} */
	export let data;

	let roundId = '';
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Pinpointer home" />
</svelte:head>

<div class="p-4 sm:p-6">
	<section class="mx-auto flex w-full max-w-screen-2xl flex-col gap-6">
		<h1 class="scroll-m-20 text-3xl font-extrabold tracking-tight">
			Welcome, {data.username}!
		</h1>

		<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
			<Button href="/quick" class="w-full sm:w-auto">Create a quick match</Button>
			<div class="flex w-full flex-col gap-2 sm:max-w-2xl sm:flex-row">
				<Input type="text" bind:value={roundId} name="username" placeholder="Join a quick match with an invite code" class="w-full" on:keydown={(event) => {
				if (event.key !== 'Enter') return;
				document.location.href = `/round/${roundId}/map`;
			}} />
				<Button href="/round/{roundId}/map" class="w-full sm:w-auto">Join a quick match</Button>
			</div>
		</div>

		<hr>

		<Button href="/competitions/new" class="w-full sm:w-fit">Create a new competition</Button>

		{#if data.myCompetitions.length !== 0}
			Owned competitions:

			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

		{/if}

		{#if data.enrolledCompetitions.length !== 0}
			Enrolled competitions:

			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

		{/if}

		{#if data.publicCompetitions.length !== 0}
			Public competitions:

			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

		{/if}

	</section>
</div>

<style>

</style>
