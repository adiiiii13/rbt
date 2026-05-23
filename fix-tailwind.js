const fs = require('fs');

const replacements = [
  { file: 'src/components/DashboardLayout.jsx', replace: [
    ['w-[80px]', 'w-20'], ['w-[260px]', 'w-65'], ['min-w-[260px]', 'min-w-65'], ['min-w-[80px]', 'min-w-20'], ['min-w-[228px]', 'min-w-57'], ['bg-[#0a1628]', 'bg-navy'], ['w-[180px]', 'w-45'], ['sm:w-[240px]', 'sm:w-60'], ['w-[240px]', 'w-60'], ['sm:w-[300px]', 'sm:w-75'], ['max-h-[300px]', 'max-h-75'], ['w-[280px]', 'w-70']
  ]},
  { file: 'src/components/ProfilePopup.jsx', replace: [
    ['z-[300]', 'z-300'], ['bg-gradient-to-r', 'bg-linear-to-r']
  ]},
  { file: 'src/pages/basic/Dashboard.jsx', replace: [
    ['bg-gradient-to-br', 'bg-linear-to-br']
  ]},
  { file: 'src/pages/MockTestRunner.jsx', replace: [
    ['flex-[2]', 'flex-2'], ['bg-[#0a1628]', 'bg-navy'], ['flex-shrink-0', 'shrink-0']
  ]},
  { file: 'src/pages/student/Counselling.jsx', replace: [
    ['bg-gradient-to-br', 'bg-linear-to-br']
  ]},
  { file: 'src/pages/student/Dashboard.jsx', replace: [
    ['bg-gradient-to-br', 'bg-linear-to-br'], ['blur-[40px]', 'blur-2xl'], ['bg-white/[0.03]', 'bg-white/3'], ['border-white/[0.06]', 'border-white/6'], ['hover:bg-white/[0.06]', 'hover:bg-white/6'], ['!py-2', 'py-2!'], ['!px-4', 'px-4!']
  ]},
  { file: 'src/pages/StudentLogin.jsx', replace: [
    ['z-[210]', 'z-210'], ['blur-[40px]', 'blur-2xl'], ['bg-gradient-to-r', 'bg-linear-to-r'], ['flex-grow', 'grow'], ['flex-shrink-0', 'shrink-0'], ['z-[200]', 'z-200'], ['w-[500px]', 'w-125'], ['h-[500px]', 'h-125'], ['w-[300px]', 'w-75'], ['h-[300px]', 'h-75']
  ]}
];

replacements.forEach(({ file, replace }) => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    replace.forEach(([search, replacement]) => {
      content = content.split(search).join(replacement);
    });
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  } catch (e) {
    console.error(`Error updating ${file}:`, e);
  }
});
