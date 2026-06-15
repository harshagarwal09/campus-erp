# 🎓 Campus ERP — Student Activity Management System

<div align="center">

![Campus ERP Banner](https://img.shields.io/badge/Campus-ERP-4F46E5?style=for-the-badge&logo=graduation-cap&logoColor=white)

[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.x-4479A1?style=flat-square&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![JWT](https://img.shields.io/badge/Auth-JWT-000000?style=flat-square&logo=json-web-tokens&logoColor=white)](https://jwt.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

**A full-stack Student Activity Management System built with Next.js 14 — managing campus clubs, hackathons, fests, and student activities all in one place.**

[Features](#-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Project Structure](#-project-structure) • [API Docs](#-api-endpoints) • [Screenshots](#-screenshots)

</div>

---

## 📖 Overview

Campus ERP is a comprehensive **Student Activity Management System** built for college administrators, club heads, and students. Rebuilt from the ground up using **Next.js 14 App Router with TypeScript**, it centralizes the entire lifecycle of campus activities — from student registration and club formation to hackathon management, fest coordination, and real-time analytics.

Whether you're an admin overseeing the full campus ecosystem or a student exploring clubs and tracking your participation, Campus ERP delivers a tailored, role-specific experience with an intuitive dashboard and seamless workflows.

> 🔁 This is the **Next.js rewrite** of the original Express + React version, now using serverless API routes, the App Router, and full TypeScript support.

---

## 📑 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Project Structure](#-project-structure)
- [API Endpoints](#-api-endpoints)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [Roadmap](#-roadmap)
- [License](#-license)

---

## ✨ Features

### 🔐 Authentication & Access Control
- Secure JWT-based login with **access + refresh token** strategy using the `jose` library
- Passwords hashed with **bcrypt**
- **First-login forced password change** for new users created by admin
- Role-based access control with five distinct roles:
  - **ADMIN** — Full system access and oversight
  - **STUDENT** — Explore and apply to clubs, fests, and hackathons
  - **CLUB_HEAD** — Manage club members and activity
  - **HACKATHON_LEAD** — Oversee hackathon teams and registrations
  - **FEST_COORDINATOR** — Handle fest planning and participation

### 🛠️ Admin Dashboard
- Manage all students, clubs, hackathons, and fests from a unified interface
- Assign and modify user roles and credentials
- Review, approve, or reject submitted applications with one click
- Real-time analytics powered by **Recharts**:
  - Student registrations over time
  - Members per club
  - Role distribution
  - Hackathon participation breakdown
- Full CRUD across all entities

### 👤 Student Portal
- Personalized dashboard based on role and membership
- Browse and apply to clubs, fests, and hackathons via the **Explore** page
- Track application status in real time
- View membership history across all activities
- Edit profile (contact info, skills, interests, LinkedIn, GitHub)

### 🏛️ Club Management
- Create, edit, and delete clubs with faculty coordinator info
- Assign presidents, coordinators, and members
- Auto-generates login credentials for club heads on assignment
- Member roster with role and join date

### 💻 Hackathon & Fest Management
- Create and manage hackathons with dates, venues, and registration deadlines
- Assign leads, coordinators, volunteers, and participants
- Coordinate fests with multi-role support
- Auto-generates login credentials for fest coordinators and hackathon leads

### 📊 Analytics Dashboard
- Visual charts for student registration trends (last 12 months)
- Club membership statistics (bar chart)
- Hackathon participation breakdown by role
- User role distribution pie/bar chart

### ⚙️ Settings Page
- Update application name and support email
- Toggle maintenance mode
- Manage security policy text
- Configure password age policy (days)
- Change password from the settings panel

### 🔔 UX Enhancements
- Toast notifications for all user actions (success, error, info)
- Confirm dialogs before destructive actions
- Responsive sidebar navigation with role-aware links
- Loading states and error boundaries throughout

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript 5.x |
| **Frontend** | React 18, Custom CSS (globals.css) |
| **Backend** | Next.js API Routes (serverless) |
| **Database** | MySQL 8.x via `mysql2/promise` |
| **Authentication** | JWT (`jose`), bcrypt, refresh tokens |
| **Charts** | Recharts |
| **Styling** | Custom CSS Modules / globals.css |

---

## 📋 Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js** v18 or higher → [Download](https://nodejs.org/)
- **npm** v9 or higher (comes with Node.js)
- **MySQL** v8 or higher → [Download](https://dev.mysql.com/downloads/)

> 💡 Verify your installations:
> ```bash
> node -v
> npm -v
> mysql --version
> ```

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/harshagarwal09/campus-erp.git
cd campus-erp
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your MySQL credentials and JWT secrets (see [Environment Variables](#-environment-variables) below).

### 4. Seed the Database

The seed script auto-creates the database, tables, and sample data:

```bash
npm run seed
```

> This runs `scripts/seed.js` which creates all tables, inserts 200 sample students, clubs, hackathons, fests, and creates the default admin user.

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Default Login Credentials

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `Admin@123` |

> ⚠️ You will be prompted to change the password on first login.

---

## 🔧 Environment Variables

Create a `.env.local` file in the root directory with the following:

```env
# .env.example

# ── Database ──────────────────────────────────────
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=student_app

# ── Authentication ────────────────────────────────
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_REFRESH_SECRET=your_refresh_secret_key

# ── Environment ───────────────────────────────────
NODE_ENV=development
```

> ⚠️ Never commit `.env.local` to version control. Use `.env.example` as a reference template.

---

## 🏗️ Project Structure

```
campus-erp/
│
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Login, Unauthorized pages
│   ├── (dashboard)/              # All protected dashboard routes
│   │   ├── admin/                # Admin management
│   │   │   ├── clubs/            # Club CRUD + member assignment
│   │   │   ├── fests/            # Fest CRUD + participant assignment
│   │   │   ├── hackathons/       # Hackathon CRUD + team management
│   │   │   ├── students/         # Student CRUD with detailed profiles
│   │   │   ├── users/            # User account management
│   │   │   └── applications/     # Approve/reject student applications
│   │   ├── student/              # Student portal
│   │   │   ├── explore/          # Browse clubs, fests, hackathons
│   │   │   ├── profile/          # View and edit personal profile
│   │   │   └── activities/       # View memberships and applications
│   │   ├── clubs/[id]/           # Club head dashboard
│   │   ├── fests/[id]/           # Fest coordinator dashboard
│   │   ├── hackathons/[id]/      # Hackathon lead dashboard
│   │   ├── dashboard/            # Main analytics dashboard
│   │   └── settings/             # App settings and password change
│   └── api/                      # All API routes (serverless)
│       ├── auth/                 # Login, logout, refresh, /me
│       ├── clubs/                # Club CRUD + members
│       ├── fests/                # Fest CRUD + members
│       ├── hackathons/           # Hackathon CRUD + members
│       ├── students/             # Student CRUD + activities
│       ├── users/                # User management
│       ├── applications/         # Submit, approve, reject
│       ├── analytics/            # Dashboard analytics endpoints
│       ├── profile/              # Student profile view/edit
│       └── settings/             # App settings endpoints
│
├── components/                   # Reusable UI components
│   ├── Sidebar.tsx               # Role-aware sidebar navigation
│   ├── Toast.tsx                 # Notification system
│   ├── Charts/                   # Recharts wrappers
│   ├── Tables/                   # Data tables with actions
│   └── Forms/                    # Form components with validation
│
├── context/
│   └── AuthContext.tsx           # Global auth state (user, role, tokens)
│
├── lib/
│   ├── db.ts                     # MySQL connection pool
│   ├── auth.ts                   # JWT helpers (sign, verify, refresh)
│   └── validations.ts            # Shared input validation utilities
│
├── types/
│   └── index.ts                  # Shared TypeScript interfaces
│
├── scripts/
│   ├── seed.js                   # Database seed script
│   └── seed.json                 # 200 sample student records
│
├── .env.example                  # Environment variable template
├── .gitignore
├── next.config.js
├── tsconfig.json
├── package.json
└── README.md
```

---

## 📡 API Endpoints

All API routes live under `/api/`. Protected routes require a valid JWT via `Authorization: Bearer <token>` header or HTTP-only cookie.

### 🔑 Authentication
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/auth/login` | Login and receive tokens | ❌ |
| `POST` | `/api/auth/logout` | Invalidate session | ✅ |
| `POST` | `/api/auth/refresh` | Refresh access token | ✅ |
| `GET` | `/api/auth/me` | Get current user info | ✅ |

### 👥 Users & Students
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/users` | List all users | ADMIN |
| `PATCH` | `/api/users/:id` | Update username/password | ADMIN |
| `GET` | `/api/students` | List all students | ADMIN |
| `POST` | `/api/students` | Create student | ADMIN |
| `PUT` | `/api/students/:id` | Update student | ADMIN |
| `DELETE` | `/api/students/:id` | Soft delete student | ADMIN |
| `GET` | `/api/students/my-activities` | My clubs/fests/hackathons | STUDENT |

### 🏛️ Clubs
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/clubs` | List all clubs | ✅ |
| `POST` | `/api/clubs` | Create a club | ADMIN |
| `PUT` | `/api/clubs/:id` | Update club | ADMIN |
| `DELETE` | `/api/clubs/:id` | Delete club | ADMIN |
| `GET` | `/api/clubs/:id` | Club detail + members | ADMIN / CLUB_HEAD / STUDENT |
| `GET` | `/api/clubs/:id/members` | List members | ADMIN / CLUB_HEAD |
| `POST` | `/api/clubs/:id/members` | Add member | ADMIN / CLUB_HEAD |
| `PUT` | `/api/clubs/:id/members/:mid` | Update member role | ADMIN / CLUB_HEAD |
| `DELETE` | `/api/clubs/:id/members/:mid` | Remove member | ADMIN / CLUB_HEAD |

### 💻 Hackathons & Fests
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/hackathons` | List all hackathons | ✅ |
| `POST` | `/api/hackathons` | Create hackathon | ADMIN |
| `GET` | `/api/hackathons/:id/members` | List participants | ADMIN / HACKATHON_LEAD |
| `POST` | `/api/hackathons/:id/members` | Add participant | ADMIN / HACKATHON_LEAD |
| `GET` | `/api/fests` | List all fests | ✅ |
| `POST` | `/api/fests` | Create fest | ADMIN |
| `GET` | `/api/fests/:id/members` | List participants | ADMIN / FEST_COORDINATOR |
| `POST` | `/api/fests/:id/members` | Add participant | ADMIN / FEST_COORDINATOR |

### 📝 Applications
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/applications` | Submit application | STUDENT |
| `GET` | `/api/applications/my` | My applications | STUDENT |
| `GET` | `/api/applications/admin` | All applications | ADMIN |
| `PUT` | `/api/applications/:id/approve` | Approve | ADMIN |
| `PUT` | `/api/applications/:id/reject` | Reject | ADMIN |

### 📊 Analytics
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/analytics/student-registrations` | Monthly registrations | ADMIN |
| `GET` | `/api/analytics/members-per-club` | Club membership counts | ADMIN |
| `GET` | `/api/analytics/role-distribution` | User role breakdown | ADMIN |
| `GET` | `/api/analytics/hackathon-participation` | Hackathon stats | ADMIN |

---

## 🖼️ Screenshots

### 🔐 Login Page
> Clean, minimal login screen with JWT-secured authentication and first-login password change flow.

<img width="2558" height="1316" alt="image" src="https://github.com/user-attachments/assets/fea9a229-5c65-4efa-bc75-9640cf63132e" />


---

### 📊 Admin Analytics Dashboard
> High-level overview with live charts for student registrations, role distribution, and club membership.

<img width="2539" height="1296" alt="image" src="https://github.com/user-attachments/assets/1ea3affd-fbc8-4073-bbea-f35f027c2994" />


---

### 👤 Student Profile
> Role-specific student dashboard with personal info, academic details, and editable contact fields.

<img width="2542" height="1363" alt="image" src="https://github.com/user-attachments/assets/996089fa-40ff-42f1-9946-3eba92423eb7" />


---

### 🏛️ Club Detail View
> Detailed club view showing president, member count, description, and the full member roster with roles.
<img width="2558" height="1305" alt="image" src="https://github.com/user-attachments/assets/38f4261e-8e5d-4e9f-9982-987ad31dd81b" />

<img width="2546" height="1359" alt="image" src="https://github.com/user-attachments/assets/ccb8a0df-47e3-4d25-a475-5d0027d2e8eb" />


---

### 📝 Application Review Board
> Admin view for reviewing pending applications with one-click approve/reject actions.

*<img width="2535" height="1303" alt="image" src="https://github.com/user-attachments/assets/51b06049-5df8-4048-a9fa-645f1e2f8979" />


---

## 🧑‍💻 Running in Production

```bash
# Build the app
npm run build

# Start production server
npm start
```

**Recommended hosting:**
- **App:** [Vercel](https://vercel.com) (native Next.js support), [Railway](https://railway.app), [Render](https://render.com)
- **Database:** [PlanetScale](https://planetscale.com), [Railway MySQL](https://railway.app), [Amazon RDS](https://aws.amazon.com/rds/)

> ⚠️ Set all environment variables in your hosting platform's secrets manager — never use a plain `.env` file in production.

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes with clear messages
4. Push and open a Pull Request

Please keep PRs focused — one feature or fix per PR. For major changes, open an issue first.

---

## 🗺️ Roadmap

- [ ] Email notifications for application status updates
- [ ] Student attendance tracking module
- [ ] File upload for student documents and resumes
- [ ] Export data to CSV / PDF
- [ ] Dark mode support
- [ ] Mobile app (React Native)
- [ ] WebSocket real-time notifications
- [ ] Swagger / OpenAPI documentation
- [ ] E2E tests with Playwright

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 📬 Contact

**Harsh Agarwal**

- 💼 LinkedIn: [linkedin.com/in/harsh-agarwal09](https://www.linkedin.com/in/harsh-agarwal09/)
- 📧 Email: harshagwl06@gmail.com
- 🐙 GitHub: [github.com/harshagarwal09](https://github.com/harshagarwal09)

If you find this project helpful, please give it a ⭐ on GitHub — it means a lot!

---

<div align="center">

Built with ❤️ for the campus community

</div>
