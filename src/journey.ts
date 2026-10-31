import { skills } from './learning';
import type { SavedLesson } from './progress';

/** Count positions, not repeated attempts. These are records of practice, not mastery. */
export function journeyProgress(saved: SavedLesson[], practiced: string[]) {
  return skills.map(skill => {
    const positions = saved.filter(item => item.skill === skill.id);
    const tried = positions.filter(item => (item.practice?.attempts || 0) > 0).length;
    const solved = positions.filter(item => (item.practice?.solved || 0) > 0).length;
    const independent = positions.filter(item => (item.practice?.independent || 0) > 0).length;
    return {...skill, positions, tried, solved, independent,
      revisit: positions.filter(item => !item.practice?.solved).length,
      explored: practiced.includes(skill.id) || tried > 0};
  });
}
