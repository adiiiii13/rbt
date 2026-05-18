const adminCredentials = {
  id: 'ADMIN001',
  password: 'admin123',
  name: 'Admin',
  role: 'Super Admin',
};

export function verifyAdmin(id, password) {
  return id === adminCredentials.id && password === adminCredentials.password;
}

export function getInquiries() {
  const stored = localStorage.getItem('rbt_inquiries');
  return stored ? JSON.parse(stored) : [];
}

export function saveInquiry(inquiry) {
  const inquiries = getInquiries();
  inquiries.push({ ...inquiry, id: `inq_${Date.now()}`, date: new Date().toISOString().split('T')[0] });
  localStorage.setItem('rbt_inquiries', JSON.stringify(inquiries));
}

export { adminCredentials };
