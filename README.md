
# DSA Grinders 🚀

A premium, competitive learning platform for Data Structures & Algorithms (DSA) that integrates with LeetCode to track progress, compete with friends, and stay motivated through daily syncs and roasts.

## ✨ Features

- 🏆 **LeetCode Integration**: Real-time sync with LeetCode profiles and problem stats.
- 📊 **Premium Leaderboard**: Rank-based icons (Gold, Silver, Bronze), glassmorphism 2.0, and staggered animations.
- 🔐 **Google Authentication**: Secure, one-tap sign-in via Supabase and Google.
- 🛠️ **Mandatory Onboarding**: Streamlined setup for GitHub, LinkedIn, and WhatsApp notifications.
- 📱 **PWA Support**: Native-like installation on iOS and Android for on-the-go tracking.
- 🔥 **Streak Control**: Monitor daily coding streaks with a built-in "Fire" indicator.
- 📉 **Problem Breakdown**: Visual progress bars with difficulty-based gradients (Easy, Medium, Hard).
- 💬 **WhatsApp & Email**: Daily "roasts" and reminders to keep the grind alive.

## 📱 Mobile App (PWA)

Install DSA Grinders on your phone for a native experience:

- ✅ **Installable** - Add to home screen on iOS/Android
- ✅ **Offline Support** - Essential stats available offline
- ✅ **Premium UI** - Smooth Framer Motion transitions and glassmorphism
- ✅ **Fast Loading** - Service worker caching

**How to Install:**
- **Android:** Visit in Chrome → Menu → "Install app"
- **iOS:** Visit in Safari → Share (⬆️) → "Add to Home Screen"

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS, Framer Motion
- **Database**: Supabase PostgreSQL, Drizzle ORM
- **Authentication**: Supabase Auth (Google OAuth)
- **APIs**: LeetCode GraphQL, RPay Connect (WhatsApp), Nodemailer (Gmail)
- **Deployment**: Vercel

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Supabase Project (PostgreSQL + Auth)
- Gmail account (for SMTP)
- RPay Connect API Key (for WhatsApp)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/piyushdhoka/DSA_Dhurandhars.git
   cd dsa-grinders
   ```

2. **Install dependencies:**
   ```bash
   bun install # or npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```

4. **Configuration (`.env`):**
   ```env
   # Database & Supabase
   DATABASE_URL=
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=

   # WhatsApp (RPay Connect)
   RPAY_API_KEY=

   # Email (Gmail SMTP)
   SMTP_EMAIL=
   SMTP_PASSWORD=

   # Security
   CRON_SECRET=
   ADMIN_PASSWORD=
   JWT_SECRET=
   ```

5. **Sync Database Schema:**
   ```bash
   bunx drizzle-kit push
   ```

6. **Run the development server:**
   ```bash
   bun run dev
   ```

## 🏗️ Architecture

- **Auth**: Managed via `AuthContext.tsx`, blocking incomplete profiles with a mandatory onboarding flow.
- **Data Sync**: Immediate LeetCode sync upon profile update and daily cron jobs for leaderboard updates.
- **Admin**: Role-based access control for managing groups and verifying user stats.

## 📄 License

MIT © [Piyush Dhoka](https://github.com/piyushdhoka)
