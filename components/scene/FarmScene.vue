<script setup lang="ts">
/**
 * « Écran du haut » : la vallée vivante. SVG en couches (parallax léger au pointeur), couleurs pilotées par
 * les tokens saisonniers, ciel teinté selon l'heure réelle, particules de saison et lutins qui se baladent.
 * Tout est décoratif (aria-hidden) ; les informations utiles sont dans le contenu.
 */
import type { Season } from '#shared/schemas'

const props = withDefaults(
  defineProps<{
    season: Season
    /** Couleurs des lutins trouvés qui se promènent (6 au maximum affichés). */
    walkers?: string[]
    compact?: boolean
  }>(),
  { walkers: () => [], compact: false },
)

const daytime = useDaytime()
const reduced = useReducedMotion()
const root = ref<HTMLElement | null>(null)

const shownWalkers = computed(() => props.walkers.slice(0, props.compact ? 3 : 6))

/** Positions pseudo-aléatoires mais déterministes (pas d'écart d'hydratation SSR/client). */
const particles = computed(() =>
  Array.from({ length: props.compact ? 10 : 18 }, (_, i) => ({
    left: (i * 37 + 11) % 100,
    delay: -((i * 1.7) % 9),
    duration: 7 + ((i * 2.3) % 6),
    size: 0.7 + ((i * 7) % 5) / 10,
    drift: ((i % 5) - 2) * 18,
  })),
)

const stars = Array.from({ length: 26 }, (_, i) => ({
  x: (i * 173 + 40) % 1200,
  y: 18 + ((i * 89) % 150),
  d: (i % 4) * 0.6,
}))

function onPointer(event: PointerEvent) {
  if (reduced.value || !root.value || event.pointerType !== 'mouse') return
  const rect = root.value.getBoundingClientRect()
  const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  root.value.style.setProperty('--px', x.toFixed(3))
}
function resetPointer() {
  root.value?.style.setProperty('--px', '0')
}
</script>

<template>
  <div
    ref="root"
    class="scene"
    :class="[`scene--${season}`, `scene--${daytime}`, { 'scene--compact': compact }]"
    aria-hidden="true"
    @pointermove="onPointer"
    @pointerleave="resetPointer"
  >
    <svg class="scene__svg" viewBox="0 0 1200 360" preserveAspectRatio="xMidYMax slice">
      <defs>
        <linearGradient id="scene-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style="stop-color: var(--season-sky-top)" />
          <stop offset="1" style="stop-color: var(--season-sky-bottom)" />
        </linearGradient>
        <radialGradient id="scene-glow">
          <stop offset="0" stop-color="#fff6c4" stop-opacity="0.9" />
          <stop offset="1" stop-color="#fff6c4" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="scene-window">
          <stop offset="0" stop-color="#ffe680" stop-opacity="0.85" />
          <stop offset="1" stop-color="#ffb84a" stop-opacity="0" />
        </radialGradient>
      </defs>

      <!-- Ciel + teinte de l'heure -->
      <rect width="1200" height="360" fill="url(#scene-sky)" />
      <rect width="1200" height="360" class="scene__tint" />

      <!-- Étoiles (nuit) -->
      <g class="scene__stars">
        <rect
          v-for="(s, i) in stars"
          :key="i"
          :x="s.x"
          :y="s.y"
          width="4"
          height="4"
          :style="{ animationDelay: `${s.d}s` }"
        />
      </g>

      <!-- Soleil / lune -->
      <g class="scene__sun">
        <circle cx="190" cy="92" r="70" fill="url(#scene-glow)" />
        <circle cx="190" cy="92" r="34" fill="#ffe27a" stroke="#f2b52c" stroke-width="5" />
      </g>
      <g class="scene__moon">
        <circle cx="990" cy="74" r="26" fill="#fdf6d8" />
        <circle cx="1002" cy="66" r="24" class="scene__moon-cut" />
      </g>

      <!-- Nuages pixelisés -->
      <g class="scene__clouds">
        <g class="scene__cloud" style="--cloud-delay: 0s">
          <path d="M0 0h60v-12h28v-10h40v10h22v12h30v16H0z" transform="translate(260 70)" />
        </g>
        <g class="scene__cloud" style="--cloud-delay: -28s">
          <path d="M0 0h40v-10h34v-8h30v8h16v10h24v14H0z" transform="translate(660 48)" />
        </g>
        <g class="scene__cloud" style="--cloud-delay: -52s">
          <path d="M0 0h30v-10h40v10h20v12H0z" transform="translate(940 120)" />
        </g>
      </g>

      <!-- Collines lointaines -->
      <g class="scene__layer scene__layer--far">
        <path
          d="M-40 236C110 176 250 196 380 214c130-52 290-50 430-12 120-34 250-36 430-6V360H-40z"
          class="fill-far"
        />
        <g class="scene__pines">
          <path
            d="M140 205l14-34 14 34z M168 211l12-28 12 28z M1010 196l14-36 14 36z M1038 202l11-28 11 28z"
          />
        </g>
      </g>

      <!-- Collines du milieu + arbres -->
      <g class="scene__layer scene__layer--mid">
        <path d="M-40 278C120 230 300 248 470 262c190-36 420-34 770-6V360H-40z" class="fill-mid" />
        <g class="scene__tree" transform="translate(110 232)">
          <rect x="-5" y="0" width="10" height="26" rx="3" class="scene__trunk" />
          <circle cx="0" cy="-12" r="26" class="scene__crown" />
          <circle cx="-14" cy="-2" r="16" class="scene__crown" />
          <circle cx="15" cy="-4" r="17" class="scene__crown-dark" />
        </g>
        <g class="scene__tree" transform="translate(380 238) scale(0.85)">
          <rect x="-5" y="0" width="10" height="26" rx="3" class="scene__trunk" />
          <circle cx="0" cy="-12" r="26" class="scene__crown" />
          <circle cx="15" cy="-4" r="17" class="scene__crown-dark" />
        </g>
        <g class="scene__tree" transform="translate(1080 236)">
          <rect x="-5" y="0" width="10" height="26" rx="3" class="scene__trunk" />
          <circle cx="0" cy="-12" r="26" class="scene__crown" />
          <circle cx="-15" cy="-3" r="16" class="scene__crown-dark" />
          <circle cx="14" cy="-1" r="15" class="scene__crown" />
        </g>
      </g>

      <!-- La ferme -->
      <g class="scene__layer scene__layer--farm">
        <!-- silo -->
        <rect
          x="508"
          y="186"
          width="44"
          height="96"
          rx="4"
          fill="#c9c2b4"
          stroke="#3b2616"
          stroke-width="4"
        />
        <path
          d="M504 190q26-34 52 0z"
          fill="#9c2a2a"
          stroke="#3b2616"
          stroke-width="4"
          stroke-linejoin="round"
        />
        <path d="M512 214h36M512 238h36M512 262h36" stroke="#a49b8b" stroke-width="3" />
        <!-- grange -->
        <path
          d="M560 222l70-52 70 52v62H560z"
          fill="#d8433b"
          stroke="#3b2616"
          stroke-width="4"
          stroke-linejoin="round"
        />
        <path
          d="M548 228l82-64 82 64"
          fill="none"
          stroke="#fffcf4"
          stroke-width="9"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M548 228l82-64 82 64"
          fill="none"
          stroke="#3b2616"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
          opacity="0.4"
        />
        <rect x="604" y="236" width="52" height="48" fill="#fffcf4" stroke="#3b2616" stroke-width="4" />
        <path d="M604 236l52 48M656 236l-52 48" stroke="#9c2a2a" stroke-width="5" />
        <rect
          x="616"
          y="192"
          width="28"
          height="22"
          rx="3"
          class="scene__window"
          stroke="#3b2616"
          stroke-width="4"
        />
        <!-- maison -->
        <path
          d="M722 236l58-40 58 40v48H722z"
          fill="#f3dfb5"
          stroke="#3b2616"
          stroke-width="4"
          stroke-linejoin="round"
        />
        <path
          d="M712 240l68-50 68 50"
          fill="none"
          stroke="#7a4a26"
          stroke-width="12"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M712 240l68-50 68 50"
          fill="none"
          stroke="#3b2616"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
          opacity="0.45"
        />
        <rect x="806" y="186" width="16" height="26" fill="#a8703c" stroke="#3b2616" stroke-width="4" />
        <rect
          x="766"
          y="248"
          width="28"
          height="36"
          rx="3"
          fill="#925b2f"
          stroke="#3b2616"
          stroke-width="4"
        />
        <circle cx="788" cy="267" r="2.5" fill="#ffd54a" />
        <rect
          x="736"
          y="244"
          width="22"
          height="20"
          rx="2"
          class="scene__window"
          stroke="#3b2616"
          stroke-width="4"
        />
        <rect
          x="804"
          y="244"
          width="22"
          height="20"
          rx="2"
          class="scene__window"
          stroke="#3b2616"
          stroke-width="4"
        />
        <!-- fumée de cheminée -->
        <g class="scene__smoke">
          <circle cx="814" cy="176" r="7" />
          <circle cx="820" cy="160" r="9" />
          <circle cx="812" cy="142" r="11" />
        </g>
      </g>

      <!-- Premier plan : prairie, chemin, clôture -->
      <g class="scene__layer scene__layer--near">
        <path d="M-40 300C260 282 900 280 1240 298V360H-40z" class="fill-near" />
        <path d="M600 360c10-30 40-58 30-80l40 0c10 22-10 50 30 80z" class="scene__path" />
        <g class="scene__fence">
          <path d="M120 306h440M120 322h440M700 306h420M700 322h420" />
          <path
            d="M128 296v34M188 296v34M248 296v34M308 296v34M368 296v34M428 296v34M488 296v34M548 296v34M712 296v34M772 296v34M832 296v34M892 296v34M952 296v34M1012 296v34M1072 296v34"
            class="scene__posts"
          />
        </g>
        <g class="scene__flowers">
          <circle cx="70" cy="336" r="5" />
          <circle cx="92" cy="344" r="4" />
          <circle cx="300" cy="346" r="5" />
          <circle cx="890" cy="342" r="5" />
          <circle cx="1140" cy="338" r="4" />
          <circle cx="1160" cy="350" r="5" />
        </g>
      </g>
      <!-- Pénombre sur tout le paysage la nuit / au crépuscule -->
      <rect width="1200" height="360" class="scene__dim" />
      <g class="scene__layer scene__layer--farm">
        <circle cx="747" cy="254" r="36" fill="url(#scene-window)" class="scene__halo" />
        <circle cx="815" cy="254" r="36" fill="url(#scene-window)" class="scene__halo" />
        <circle cx="630" cy="203" r="30" fill="url(#scene-window)" class="scene__halo" />
      </g>
    </svg>

    <!-- Particules de saison -->
    <div v-if="!reduced" class="scene__particles">
      <span
        v-for="(p, i) in particles"
        :key="i"
        class="particle"
        :style="{
          left: `${p.left}%`,
          animationDelay: `${p.delay}s`,
          animationDuration: `${p.duration}s`,
          '--size': p.size,
          '--drift': `${p.drift}px`,
        }"
      />
    </div>

    <!-- Lutins trouvés qui se baladent -->
    <div class="scene__walkers">
      <div
        v-for="(color, i) in shownWalkers"
        :key="i"
        class="walker"
        :style="{
          '--start': `${8 + ((i * 29) % 80)}%`,
          animationDelay: `${-i * 3.3}s`,
          animationDuration: `${16 + (i % 3) * 4}s`,
        }"
      >
        <SpriteFigure :color="color" :size="compact ? 22 : 30" />
      </div>
    </div>

    <div class="scene__overlay"><slot /></div>
  </div>
</template>

<style scoped>
.scene {
  --px: 0;
  position: relative;
  overflow: hidden;
  isolation: isolate;
  background: var(--season-sky-bottom);
}
.scene__svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.fill-far {
  fill: var(--season-hill-far);
}
.fill-mid {
  fill: var(--season-hill-mid);
}
.fill-near {
  fill: var(--season-hill-near);
}
.scene__tint {
  fill: var(--sky-tint);
  mix-blend-mode: multiply;
}
.scene--night .scene__tint {
  mix-blend-mode: normal;
}
.scene__dim {
  fill: #141a4a;
  opacity: 0;
  pointer-events: none;
  transition: opacity 2s ease;
}
.scene--dusk .scene__dim {
  fill: #6a2a3a;
  opacity: 0.16;
}
.scene--night .scene__dim {
  opacity: 0.38;
}

.scene__layer {
  transition: transform 600ms var(--ease-soft);
}
.scene__layer--far {
  transform: translateX(calc(var(--px) * -6px));
}
.scene__layer--mid {
  transform: translateX(calc(var(--px) * -12px));
}
.scene__layer--farm {
  transform: translateX(calc(var(--px) * -16px));
}
.scene__layer--near {
  transform: translateX(calc(var(--px) * -24px));
}

.scene__pines {
  fill: var(--season-foliage-dark);
  opacity: 0.75;
}
.scene__trunk {
  fill: var(--wood-700);
  stroke: var(--wood-950);
  stroke-width: 3;
}
.scene__crown {
  fill: var(--season-foliage);
  stroke: var(--wood-950);
  stroke-width: 3;
}
.scene__crown-dark {
  fill: var(--season-foliage-dark);
  stroke: var(--wood-950);
  stroke-width: 3;
}
.scene--summer .scene__crown,
.scene--summer .scene__crown-dark {
  stroke: #1d4a1f;
}

.scene__path {
  fill: #d9b878;
  opacity: 0.85;
}
.scene--winter .scene__path {
  fill: #e4ebf6;
}
.scene__fence {
  fill: none;
  stroke: var(--wood-500);
  stroke-width: 6;
  stroke-linecap: round;
}
.scene__posts {
  stroke: var(--wood-700);
  stroke-width: 9;
}
.scene__flowers {
  fill: var(--season-accent);
  stroke: var(--wood-950);
  stroke-width: 2;
}
.scene--winter .scene__flowers {
  display: none;
}

.scene__window {
  fill: #9fd8f2;
  transition: fill 1.5s ease;
}
.scene__halo {
  opacity: 0;
  transition: opacity 1.5s ease;
}
.scene--night .scene__window,
.scene--dusk .scene__window {
  fill: #ffd76a;
}
.scene--night .scene__halo,
.scene--dusk .scene__halo {
  opacity: 1;
}

.scene__smoke circle {
  fill: rgb(255 255 255 / 0.6);
  transform-box: fill-box;
  transform-origin: center;
  animation: smoke 4s ease-in-out infinite;
}
.scene__smoke circle:nth-child(2) {
  animation-delay: -1.3s;
}
.scene__smoke circle:nth-child(3) {
  animation-delay: -2.6s;
}
@keyframes smoke {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
    opacity: 0.7;
  }
  50% {
    transform: translate(6px, -6px) scale(1.15);
    opacity: 0.35;
  }
}

/* Soleil, lune, étoiles selon l'heure */
.scene__sun {
  transition:
    transform 2s var(--ease-soft),
    opacity 2s ease;
}
.scene--dawn .scene__sun {
  transform: translateY(90px);
}
.scene--dusk .scene__sun {
  transform: translate(820px, 100px);
}
.scene--night .scene__sun {
  opacity: 0;
}
.scene__moon {
  opacity: 0;
  transition: opacity 2s ease;
}
.scene--night .scene__moon {
  opacity: 1;
}
.scene__moon-cut {
  /* couleur du ciel nocturne une fois teinté */
  fill: #1f2659;
}
.scene__stars rect {
  fill: #fff8d6;
  opacity: 0;
  transition: opacity 2s ease;
}
.scene--night .scene__stars rect {
  opacity: 1;
  animation: twinkle 2.4s steps(2) infinite;
}
@keyframes twinkle {
  50% {
    opacity: 0.35;
  }
}

.scene__clouds {
  fill: rgb(255 255 255 / 0.92);
}
.scene--night .scene__clouds {
  fill: rgb(200 210 240 / 0.25);
}
.scene__cloud {
  animation: drift 90s linear infinite;
  animation-delay: var(--cloud-delay);
}
@keyframes drift {
  from {
    transform: translateX(-700px);
  }
  to {
    transform: translateX(900px);
  }
}

/* Particules */
.scene__particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.particle {
  position: absolute;
  top: -6%;
  width: calc(10px * var(--size));
  height: calc(7px * var(--size));
  border-radius: 60% 0 60% 0;
  background: #ffc3d5;
  border: 1px solid rgb(168 52 94 / 0.4);
  animation: fall linear infinite;
  opacity: 0.95;
}
.scene--summer .particle {
  top: auto;
  bottom: 18%;
  width: 6px;
  height: 6px;
  border: 0;
  border-radius: 50%;
  background: #fff8a8;
  box-shadow: 0 0 10px 3px rgb(255 238 120 / 0.8);
  animation-name: firefly;
  opacity: 0;
}
.scene--autumn .particle {
  background: #e8742c;
  border-color: #9c3a12;
  border-radius: 0 70% 0 70%;
}
.scene--autumn .particle:nth-child(3n) {
  background: #d9a62c;
}
.scene--autumn .particle:nth-child(3n + 1) {
  background: #c8424a;
}
.scene--winter .particle {
  width: calc(6px * var(--size));
  height: calc(6px * var(--size));
  border: 0;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 0 3px rgb(120 140 200 / 0.6);
  animation-name: snow;
}
@keyframes fall {
  0% {
    transform: translate(0, 0) rotate(0);
  }
  100% {
    transform: translate(calc(var(--drift) * 3), 340px) rotate(540deg);
  }
}
@keyframes snow {
  0% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(var(--drift), 170px);
  }
  100% {
    transform: translate(0, 340px);
  }
}
@keyframes firefly {
  0%,
  100% {
    opacity: 0;
    transform: translate(0, 0);
  }
  30% {
    opacity: 0.9;
  }
  50% {
    transform: translate(var(--drift), -60px);
    opacity: 0.4;
  }
  70% {
    opacity: 1;
  }
}

/* Lutins promeneurs */
.scene__walkers {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 5%;
  height: 40px;
  pointer-events: none;
}
.walker {
  position: absolute;
  bottom: 0;
  left: var(--start);
  animation: wander linear infinite;
}
.walker :deep(svg) {
  animation: hop 0.5s ease-in-out infinite alternate;
}
@keyframes wander {
  0%,
  100% {
    transform: translateX(0) scaleX(1);
  }
  45% {
    transform: translateX(110px) scaleX(1);
  }
  50% {
    transform: translateX(110px) scaleX(-1);
  }
  95% {
    transform: translateX(0) scaleX(-1);
  }
}
@keyframes hop {
  to {
    transform: translateY(-3px);
  }
}

.scene__overlay {
  position: relative;
  z-index: 2;
  height: 100%;
}
</style>
