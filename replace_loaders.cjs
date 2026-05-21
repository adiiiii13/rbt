const fs = require('fs');
const path = require('path');

const studentGridPages = [
  'TestPapersMock.jsx',
  'TestPapersDownloadable.jsx',
  'student/Videos.jsx',
  'student/StudyMaterial.jsx',
  'student/MockResults.jsx',
  'student/Invoices.jsx',
  'student/Doubts.jsx',
  'student/Counselling.jsx'
];

const adminTablePages = [
  'admin/ManageVideos.jsx',
  'admin/ManageTestimonials.jsx',
  'admin/ManageStudyMaterial.jsx',
  'admin/ManageStudents.jsx',
  'admin/ManagePdfs.jsx',
  'admin/ManagePayments.jsx',
  'admin/ManageOffers.jsx',
  'admin/ManageNotifications.jsx',
  'admin/ManageNotices.jsx',
  'admin/ManageMockTests.jsx',
  'admin/ManageInvoices.jsx',
  'admin/ManageInquiries.jsx',
  'admin/ManageGallery.jsx',
  'admin/ManageDoubts.jsx',
  'admin/ManageCourses.jsx',
  'admin/ManageCounselling.jsx',
  'admin/ManageAchievements.jsx'
];

function processFile(filePath, type) {
  const fullPath = path.join(__dirname, 'src/pages', filePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`Skipping ${fullPath} - does not exist`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let changed = false;

  // Add import if missing
  const importStatement = type === 'student' 
    ? "import { GridSkeleton } from '../components/ui/Skeleton';\n"
    : "import { TableSkeleton } from '../../components/ui/Skeleton';\n";

  if (!content.includes('Skeleton')) {
    const importRegex = /import\s+.*?from\s+['"].*?['"];?\n/g;
    let match;
    let lastImportIndex = 0;
    while ((match = importRegex.exec(content)) !== null) {
      lastImportIndex = match.index + match[0].length;
    }
    content = content.slice(0, lastImportIndex) + importStatement + content.slice(lastImportIndex);
    changed = true;
  }

  // Replace loaders
  const loaderPatterns = [
    /\{loading\s*&&\s*<p className="text-slate-400 text-center py-8">Loading\.\.\.<\/p>\}/g,
    /\{loading\s*&&\s*<div className="text-slate-400 text-sm mb-4">Loading\.\.\.<\/div>\}/g,
    /\{loading\s*&&\s*<div className="text-center py-8 text-slate-400">Loading\.\.\.<\/div>\}/g,
    /\{loading\s*&&\s*<p className="text-slate-400 text-sm mb-4">Loading\.\.\.<\/p>\}/g,
  ];

  const replacement = type === 'student'
    ? '{loading && <GridSkeleton count={6} type={type === "card" ? "card" : "list"} /> /* FIXME: adjust type */}'
    : '{loading && <TableSkeleton />}';

  loaderPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      changed = true;
    }
  });

  // Handle ternary loader replacements
  const ternaryPattern = /\{loading \? <p className="text-slate-400 text-center py-8">Loading\.\.\.<\/p> : /g;
  if (ternaryPattern.test(content)) {
    const ternaryReplacement = type === 'student'
      ? '{loading ? <GridSkeleton count={6} /> : '
      : '{loading ? <TableSkeleton /> : ';
    content = content.replace(ternaryPattern, ternaryReplacement);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(fullPath, content);
    console.log(`Updated ${filePath}`);
  }
}

studentGridPages.forEach(file => processFile(file, 'student'));
adminTablePages.forEach(file => processFile(file, 'admin'));

