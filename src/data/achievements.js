// All mock data removed. Admin adds achievements via /admin/achievements → Firestore.
const defaultAchievements = [];

export function getAchievements() { return []; }
export function saveAchievements(_achievements) { /* noop */ }
export function resetAchievements() { /* noop */ }
export { defaultAchievements };
