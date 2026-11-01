export type SkillId = 'center' | 'development' | 'king' | 'threats' | 'safety' | 'tactics';
export type LessonStep = {
  move: string; alternatives?: string[]; reply?: string; title: string; question: string;
  hint: string; why: string; skill: SkillId; short: string; goal?: 'mate' | 'promotion';
};
export type BoardLesson = { id:string; title:string; detail:string; fen:string; focus:string; tip:string };
export type StudyLesson = BoardLesson & {
  kind:'opening' | 'scenario'; skill:SkillId; level:'Start' | 'Build' | 'Stretch';
  steps:LessonStep[]; completion:string;
};
