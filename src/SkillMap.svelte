<script lang="ts">
  import { ArrowUpRight, Check, Target } from '@lucide/svelte';
  import { skills, connections } from './learning';
  let { counts, practiced, onStart }: { counts: Record<string, number>; practiced: string[]; onStart: (lesson: string) => void } = $props();
  let selected = $state('safety');
  let current = $derived(skills.find(skill => skill.id === selected)!);
</script>
<section class="skill-map" aria-label="Connected chess skills">
  <div class="skill-map-heading"><h2>IT ALL CONNECTS.</h2><p>A game shows the gap. A small lesson helps close it.</p></div>
  <div class="skill-network">
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">{#each connections as [from, to]}{@const a = skills.find(skill => skill.id === from)!}{@const b = skills.find(skill => skill.id === to)!}<line x1={a.x} y1={a.y} x2={b.x} y2={b.y} class:connected={from === selected || to === selected}/>{/each}</svg>
    {#each skills as skill}<button class="skill-node" class:active={selected === skill.id} class:needs-work={counts[skill.id] > 0} style={`--x:${skill.x}%;--y:${skill.y}%`} onclick={() => selected = skill.id} aria-pressed={selected === skill.id}><span class="skill-node-symbol">{#if counts[skill.id] > 0}<Target size={17}/>{:else if practiced.includes(skill.id)}<Check size={17}/>{:else}<span class="skill-node-dot"></span>{/if}</span><strong>{skill.name}</strong><span>{counts[skill.id] > 0 ? `${counts[skill.id]} moment${counts[skill.id] === 1 ? '' : 's'} to revisit` : practiced.includes(skill.id) ? 'Practiced · keep building' : 'Ready to explore'}</span></button>{/each}
  </div>
  <div class="skill-detail"><div><span class="club-name">CLUB NAME · {current.nickname}</span><h3>{current.name}</h3><p>{current.text}</p><span class="related-skills">Connects to {current.related.map(id => skills.find(skill => skill.id === id)!.name.toLowerCase()).join(' · ')}</span></div><button class="primary-button" onclick={() => onStart(current.lesson)}>Practice this idea <ArrowUpRight size={17}/></button></div>
</section>
