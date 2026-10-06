<script setup lang="ts">
import { isActive, MAIN_NAV } from '~/utils/navigation'

/** Navigation principale : « charnière » de la DS sur grand écran, barre au pouce sur mobile. */
defineProps<{ variant: 'hinge' | 'bar' }>()
const route = useRoute()
</script>

<template>
  <nav :class="`nav nav--${variant}`" aria-label="Navigation principale">
    <ul class="nav__list">
      <li v-for="item in MAIN_NAV" :key="item.to">
        <NuxtLink
          :to="item.to"
          class="nav__link"
          :aria-current="isActive(route.path, item.to) ? 'page' : undefined"
        >
          <PixelIcon :name="item.icon" :size="variant === 'bar' ? 24 : 28" />
          <span>{{ item.label }}</span>
        </NuxtLink>
      </li>
      <li class="nav__more"><MoreMenu :placement="variant === 'bar' ? 'up' : 'down'" /></li>
    </ul>
  </nav>
</template>

<style scoped>
.nav__list {
  display: flex;
  margin: 0;
  padding: 0;
  list-style: none;
}
.nav__link {
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  font-weight: 800;
  transition:
    transform 160ms var(--ease-bounce),
    background-color 160ms ease;
}

/* — Charnière (grand écran) : onglets en bois — */
.nav--hinge .nav__list {
  gap: var(--space-2);
  align-items: center;
}
.nav--hinge .nav__link {
  gap: var(--space-2);
  min-height: 48px;
  padding: 0.35rem 0.9rem 0.35rem 0.6rem;
  border: 3px solid transparent;
  border-radius: var(--radius-md);
  color: var(--paper-50);
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 1.05rem;
  text-shadow: 0 2px 0 var(--wood-950);
}
.nav--hinge .nav__link:hover {
  background: rgb(255 255 255 / 0.12);
  transform: translateY(-2px);
}
.nav--hinge .nav__link[aria-current='page'] {
  border-color: var(--wood-950);
  background: var(--paper-100);
  color: var(--wood-900);
  text-shadow: none;
  box-shadow: 0 3px 0 var(--wood-950);
}
.nav--hinge .nav__more {
  color: var(--paper-50);
}

/* — Barre du bas (mobile) — */
.nav--bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 50;
  padding: 6px 6px calc(6px + env(safe-area-inset-bottom));
  border-top: var(--border-thick) solid var(--wood-950);
  background: linear-gradient(180deg, var(--wood-400), var(--wood-500));
  box-shadow: 0 -4px 14px rgb(46 27 14 / 0.25);
}
.nav--bar .nav__list {
  justify-content: space-around;
}
.nav--bar li {
  flex: 1;
  display: flex;
  justify-content: center;
}
.nav--bar .nav__link {
  flex-direction: column;
  gap: 2px;
  width: 100%;
  max-width: 5.2rem;
  min-height: 52px;
  padding: 4px 2px;
  border-radius: var(--radius-sm);
  color: var(--paper-50);
  font-size: 0.75rem;
  text-shadow: 0 1px 0 var(--wood-950);
}
.nav--bar .nav__link[aria-current='page'] {
  background: var(--paper-100);
  color: var(--wood-900);
  text-shadow: none;
  box-shadow: inset 0 -3px 0 var(--season-accent);
}
.nav--bar .nav__more {
  color: var(--paper-50);
}
</style>
