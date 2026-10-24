<template>
  <div class="auroraBackground" :style="parallaxStyle" aria-hidden="true">
    <span class="auroraBlob blobA" />
    <span class="auroraBlob blobB" />
    <span class="auroraBlob blobC" />
    <span class="auroraVeil" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{ scrollTop: number }>();

// 背景随页面滚动做轻微视差，幅度远小于滚动量，避免喧宾夺主。
const parallaxStyle = computed(() => ({ transform: `translate3d(0, ${-(props.scrollTop * 0.06).toFixed(1)}px, 0)` }));
</script>

<style lang="scss" scoped>
.auroraBackground {
  position: absolute;
  inset: 0;
  overflow: hidden;
  contain: strict;
  will-change: transform;

  // 极光色板：默认暗色；亮色主题在下方覆盖为浅色粉彩。
  --auroraA: rgba(59, 130, 246, 0.66);
  --auroraB: rgba(139, 92, 246, 0.55);
  --auroraC: rgba(45, 212, 191, 0.42);
  --auroraVeil: linear-gradient(160deg, rgba(2, 6, 23, 0) 55%, rgba(2, 6, 23, 0.3) 100%);
}

:global(html.dark) .auroraBackground {
  --auroraA: rgba(59, 130, 246, 0.66);
  --auroraB: rgba(139, 92, 246, 0.55);
  --auroraC: rgba(45, 212, 191, 0.42);
  --auroraVeil: linear-gradient(160deg, rgba(2, 6, 23, 0) 55%, rgba(2, 6, 23, 0.3) 100%);
}

:global(html:not(.dark)) .auroraBackground {
  --auroraA: rgba(147, 197, 253, 0.6);
  --auroraB: rgba(196, 181, 253, 0.46);
  --auroraC: rgba(153, 246, 228, 0.44);
  --auroraVeil: linear-gradient(160deg, rgba(255, 255, 255, 0) 55%, rgba(255, 255, 255, 0.36) 100%);
}

.auroraBlob {
  position: absolute;
  border-radius: 50%;
  filter: blur(56px);
  will-change: transform, opacity;
}

.blobA {
  width: 58vmax;
  height: 58vmax;
  top: -18vmax;
  inset-inline-start: -12vmax;
  background: radial-gradient(closest-side, var(--auroraA), transparent 72%);
  animation: auroraDriftA 34s ease-in-out infinite alternate;
}

.blobB {
  width: 52vmax;
  height: 52vmax;
  top: 6vmax;
  inset-inline-end: -16vmax;
  background: radial-gradient(closest-side, var(--auroraB), transparent 72%);
  animation: auroraDriftB 46s ease-in-out infinite alternate;
}

.blobC {
  width: 44vmax;
  height: 44vmax;
  bottom: -20vmax;
  inset-inline-start: 24%;
  background: radial-gradient(closest-side, var(--auroraC), transparent 72%);
  animation: auroraDriftC 58s ease-in-out infinite alternate;
}

// 轻微压暗右下角，保证项目列表文字可读。
.auroraVeil {
  position: absolute;
  inset: 0;
  background: var(--auroraVeil);
}

@keyframes auroraDriftA {
  0% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.9; }
  50% { transform: translate3d(9vmax, 5vmax, 0) scale(1.12); opacity: 1; }
  100% { transform: translate3d(-4vmax, 12vmax, 0) scale(0.96); opacity: 0.82; }
}

@keyframes auroraDriftB {
  0% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.8; }
  50% { transform: translate3d(-11vmax, 7vmax, 0) scale(1.08); opacity: 0.95; }
  100% { transform: translate3d(-3vmax, -8vmax, 0) scale(1.18); opacity: 0.78; }
}

@keyframes auroraDriftC {
  0% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.75; }
  50% { transform: translate3d(7vmax, -6vmax, 0) scale(1.14); opacity: 0.92; }
  100% { transform: translate3d(-6vmax, -3vmax, 0) scale(0.94); opacity: 0.7; }
}

@media (prefers-reduced-motion: reduce) {
  .auroraBlob { animation: none; }
}
</style>
