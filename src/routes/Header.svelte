<script>
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import { toggleMode } from 'mode-watcher';
	import Sun from 'lucide-svelte/icons/sun';
	import Moon from 'lucide-svelte/icons/moon';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import { LogOut } from 'lucide-svelte';
</script>

<header class="hidden flex-col md:flex">
	<div class="border-b">
		<div class="flex h-16 items-center px-4">
			<MapPin
				class="h-[28px] w-[28px] rotate-0 scale-100 transition-all"
			/>
			<div style="width: 6px"></div>
			<a style="font-size: 28px;" href="/">Pinpointer</a>
			<div style="width: 6px"></div>
			<span style="font-size: 20px; color: gray;">v1.0.1</span>

			<div class="w-10"></div>

			<nav class="flex items-center space-x-4 lg:space-x-6">
				<a href="/" class="hover:text-primary text-sm font-medium transition-colors">
					Home
				</a>

				<a
					href="/about"
					class="text-muted-foreground hover:text-primary text-sm font-medium transition-colors"
				>
					About
				</a>
			</nav>

			<div class="ml-auto flex items-center space-x-4">
				<Button on:click={toggleMode} variant="outline" size="icon">
					<Sun
						class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
					/>
					<Moon
						class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
					/>
					<span class="sr-only">Toggle theme</span>
				</Button>
				<form action="/logout" method="POST">
					<Button type="submit" variant="outline" size="icon">
						<LogOut
							class="h-[1.2rem] w-[1.2rem]"
						/>
						<span class="sr-only">Logout</span>
					</Button>
				</form>
			</div>
		</div>
	</div>
</header>

<style>
    header {
        display: flex;
        justify-content: space-between;
    }

    .corner {
        padding: 0 8px;
        width: max-content;
        height: 3em;
    }

    .corner a {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
    }

    .corner img {
        width: 2em;
        height: 2em;
        object-fit: contain;
    }

    nav {
        display: flex;
        justify-content: center;
        --background: rgba(255, 255, 255, 0.7);
    }

    svg {
        width: 2em;
        height: 3em;
        display: block;
    }

    path {
        fill: var(--background);
    }

    ul {
        position: relative;
        padding: 0;
        margin: 0;
        height: 3em;
        display: flex;
        justify-content: center;
        align-items: center;
        list-style: none;
        background: var(--background);
        background-size: contain;
    }

    li {
        position: relative;
        height: 100%;
    }

    li[aria-current='page']::before {
        --size: 6px;
        content: '';
        width: 0;
        height: 0;
        position: absolute;
        top: 0;
        left: calc(50% - var(--size));
        border: var(--size) solid transparent;
        border-top: var(--size) solid var(--color-theme-1);
    }

    nav a {
        display: flex;
        height: 100%;
        align-items: center;
        padding: 0 0.5rem;
        color: var(--color-text);
        font-weight: 700;
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        text-decoration: none;
        transition: color 0.2s linear;
    }

    a:hover {
        color: var(--color-theme-1);
    }

    .absolute-center {
        position: absolute;
        left: 0;
        right: 0;
        margin-inline: auto;
    }
</style>
