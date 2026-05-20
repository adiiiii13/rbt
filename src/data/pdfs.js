// All mock data removed. Admin uploads PDFs via /admin/pdfs → Firestore.
const defaultPdfs = [];

export function getPdfs() { return []; }
export function savePdfs(_pdfs) { /* noop */ }
export function resetPdfs() { /* noop */ }
export { defaultPdfs };
