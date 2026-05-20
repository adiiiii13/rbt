// All mock data removed. Admin adds courses via /admin/courses → saves to Firestore.
const defaultCourses = [];

export function getCourses() { return []; }
export function saveCourses(_courses) { /* noop */ }
export function resetCourses() { /* noop */ }
export { defaultCourses };
