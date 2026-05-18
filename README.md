# RBT MISSION LEARNING 🎓

> **"Mission Hai Toh Perfect Learning Chahiye"**

A premium, modern coaching institute website built with React.js, Tailwind CSS, Framer Motion, and Anime.js. This is a **frontend-only** platform with all data managed via React state and localStorage — ready to connect to any backend later.

---

## ✨ Features

### Public Pages
- **Home** — Hero section with animated visuals, stats, courses preview, achievements, testimonials, and CTA
- **About** — Institute story, features, and values
- **Courses** — All 7 course programs (Classes 8-12, IIT-JEE, NEET)
- **Demo Videos & Testimonials** — Video lecture cards and student/parent reviews
- **Achievements** — Student results and success stories
- **Contact** — Contact info, WhatsApp button, map placeholder, and inquiry form

### Student Portal
- **Student Login** — Registered and Anonymous (Guest) access modes
- **Dashboard** — Stats, available courses, latest PDFs, notices
- **My Courses** — Browse all courses
- **Test PDFs** — Download test papers (demo)
- **Demo Videos** — Watch video lectures
- **Notices** — Latest announcements with priority levels
- **Achievements** — View student achievements

### Admin Panel
- **Admin Login** — Secure admin access
- **Dashboard** — Complete overview with stats
- **Manage Courses** — CRUD operations
- **Manage PDFs** — Add/edit/delete test papers with fake upload
- **Manage Videos** — CRUD for demo videos
- **Manage Testimonials** — CRUD for reviews
- **Manage Achievements** — CRUD for student results
- **Manage Students** — CRUD for registered students
- **Generate Guest Access** — Generate anonymous access codes
- **Manage Notices** — CRUD for announcements

---

## 🛠 Tech Stack

| Technology | Purpose |
|---|---|
| React.js | UI framework |
| Tailwind CSS v4 | Styling |
| Framer Motion | Animations & transitions |
| Anime.js | Floating icon animations |
| React Router DOM | Client-side routing |
| localStorage | Data persistence (demo) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### Installation

```bash
# Clone or navigate to project
cd "RBT Mission Learning"

# Install dependencies
npm install

# Start dev server
npm run dev
```

The app will open at `http://localhost:5173`

---

## 🔐 Demo Credentials

### Student Login
| Mode | ID | Password |
|---|---|---|
| Registered | `STUDENT001` | `student123` |
| Guest Access | `GUEST001` | `guest123` |

### Admin Login
| ID | Password |
|---|---|
| `ADMIN001` | `admin123` |

---

## 📁 Project Structure

```
src/
├── components/          # Reusable components
│   ├── Navbar.jsx       # Sticky responsive navbar
│   ├── Footer.jsx       # Professional footer
│   ├── DashboardLayout.jsx  # Dashboard sidebar layout
│   ├── Modal.jsx        # Reusable modal component
│   └── LoadingScreen.jsx    # Branded loading screen
├── context/
│   └── AuthContext.jsx  # Authentication context
├── data/                # Dummy data (easy to replace with API)
│   ├── courses.js
│   ├── pdfs.js
│   ├── videos.js
│   ├── testimonials.js
│   ├── achievements.js
│   ├── students.js
│   ├── notices.js
│   └── admin.js
├── pages/
│   ├── Home.jsx
│   ├── About.jsx
│   ├── Courses.jsx
│   ├── Videos.jsx
│   ├── Achievements.jsx
│   ├── Contact.jsx
│   ├── StudentLogin.jsx
│   ├── AdminLogin.jsx
│   ├── student/         # Student dashboard pages
│   │   ├── Dashboard.jsx
│   │   ├── Courses.jsx
│   │   ├── Pdfs.jsx
│   │   ├── Videos.jsx
│   │   ├── Notices.jsx
│   │   └── Achievements.jsx
│   └── admin/           # Admin dashboard pages
│       ├── Dashboard.jsx
│       ├── ManageCourses.jsx
│       ├── ManagePdfs.jsx
│       ├── ManageVideos.jsx
│       ├── ManageTestimonials.jsx
│       ├── ManageAchievements.jsx
│       ├── ManageStudents.jsx
│       ├── AnonymousAccess.jsx
│       └── ManageNotices.jsx
├── App.jsx              # Main app with routing
├── main.jsx             # Entry point
└── index.css            # Tailwind + design system
```

---

## 🎨 Design System

| Token | Value |
|---|---|
| Navy | `#0a1628` |
| Green (Primary) | `#16a34a` |
| Green Light | `#22c55e` |
| Accent Gold | `#fbbf24` |
| Font Body | Inter |
| Font Heading | Poppins |

---

## 🔌 Backend Integration Guide

When ready to connect a backend:

1. **Replace data files** (`src/data/*.js`) with API calls
2. **Update AuthContext** to use real authentication
3. **Replace localStorage** calls with API endpoints
4. **Add file upload** functionality for PDFs
5. **Connect video** hosting (YouTube/Vimeo embeds)

Each data file exports standardized `get`, `save`, and `reset` functions — making API migration straightforward.

---

## 📱 Responsive Design

- ✅ Mobile (320px+)
- ✅ Tablet (768px+)
- ✅ Desktop (1024px+)
- ✅ Wide (1280px+)

---

## 📄 License

This project is for educational and demonstration purposes.

---

Built with ❤️ for **RBT Mission Learning**
