import type { CoachingMeta, CoachingMetaFile, HintStep } from './types';

export type CoachingMetaMap = Record<string, CoachingMeta>;

export function indexMeta(list: CoachingMetaFile): CoachingMetaMap {
  const out: CoachingMetaMap = {};
  for (const m of list || []) {
    if (m && m.question_id) out[m.question_id] = m;
  }
  return out;
}

export function getMetaOrNull(map: CoachingMetaMap, questionId: string): CoachingMeta | null {
  return (map && questionId && map[questionId]) ? map[questionId] : null;
}

export function defaultHintLadder(): HintStep[] {
  return [
    { level: 1, title: 'Step 1｜先判斷題型/策略', body: '先想：這題是加減乘除？有沒有需要通分/約分/換成假分數？' },
    { level: 2, title: 'Step 2｜列式', body: '把已知/未知寫清楚，再列出算式。加減先通分；乘法先交叉約分；除法記得乘倒數。' },
    { level: 3, title: 'Step 3｜計算與檢查', body: '算完先約分到最簡；檢查大小合理、單位正確。' },
  ];
}

export function getHintSteps(map: CoachingMetaMap, questionId: string): HintStep[] {
  const m = getMetaOrNull(map, questionId);
  if (m && Array.isArray(m.hint_ladder) && m.hint_ladder.length) return m.hint_ladder;
  return defaultHintLadder();
}
