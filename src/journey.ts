import { studies } from './curriculum';
import type { StudyResults } from './study';
import { skills } from './learning';
import type { SavedLesson } from './progress';

/** Count positions, not repeated attempts. These are records of practice, not mastery. */
export function journeyProgress(saved: SavedLesson[], practiced: string[], results:StudyResults={}) {
  return skills.map(skill => {
    const positions = saved.filter(item => item.skill === skill.id);
    const tried = positions.filter(item => (item.practice?.attempts || 0) > 0).length;
    const solved = positions.filter(item => (item.practice?.solved || 0) > 0).length;
    const independent = positions.filter(item => (item.practice?.independent || 0) > 0).length;
    const curriculum=studies.filter(lesson=>lesson.skill===skill.id || lesson.steps.some(step=>step.skill===skill.id));
    const completed=curriculum.filter(lesson=>results[lesson.id]?.solved).length;
    const clean=curriculum.filter(lesson=>results[lesson.id]?.independent).length;
    return {...skill, positions, tried, solved, independent, curriculum, completed, clean,
      revisit: positions.filter(item => !item.practice?.solved).length,
      explored: practiced.includes(skill.id) || tried > 0 || completed>0};
  });
}
