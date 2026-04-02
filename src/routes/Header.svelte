<script>
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import { toggleMode } from 'mode-watcher';
	import Sun from 'lucide-svelte/icons/sun';
	import Moon from 'lucide-svelte/icons/moon';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import { LogOut } from 'lucide-svelte';

  const isActive = (/** @type {string} */ href) => {
    if (href === '/') return $page.url.pathname === '/';
    return $page.url.pathname.startsWith(href);
  };
</script>

<header class="border-b">
  <div class="mx-auto flex w-full max-w-screen-2xl flex-wrap items-center gap-2 px-3 py-2 sm:px-4">
    <a href="/" class="flex min-w-0 items-center gap-2">
      <MapPin class="h-6 w-6 shrink-0" />
      <span class="truncate text-xl font-semibold sm:text-2xl">Pinpointer</span>
      <span class="hidden text-sm text-muted-foreground sm:inline">v1.0.2</span>
    </a>

    <div class="ml-auto flex items-center gap-2">
      <Button onclick={toggleMode} variant="outline" size="icon">
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
          <LogOut class="h-[1.2rem] w-[1.2rem]" />
          <span class="sr-only">Logout</span>
        </Button>
      </form>
    </div>

    <nav class="order-3 flex w-full items-center gap-2 text-sm font-medium sm:order-none sm:ml-6 sm:w-auto">
      <a
        href="/"
        class={`rounded-md px-3 py-2 transition-colors ${isActive('/') ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-primary'}`}
      >
        Home
      </a>
      <a
        href="/about"
        class={`rounded-md px-3 py-2 transition-colors ${isActive('/about') ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-primary'}`}
      >
        About
      </a>
    </nav>
  </div>
</header>

