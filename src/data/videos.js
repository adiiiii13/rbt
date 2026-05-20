// All mock data removed. Admin uploads videos via /admin/videos → Firestore.
const defaultVideos = [];

export function getVideos() { return []; }
export function saveVideos(_videos) { /* noop */ }
export function resetVideos() { /* noop */ }
export { defaultVideos };
