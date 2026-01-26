# DSA Grinders

A competitive learning platform for Data Structures & Algorithms (DSA) practice that integrates with LeetCode to help users track their progress, compete with friends on a leaderboard, and stay motivated through daily reminders via email and WhatsApp.

## 📱 Mobile App (PWA)

**DSA Grinders is now a Progressive Web App!** Install it on your phone for a native app experience:

- ✅ **Installable** - Add to home screen on iOS/Android
- ✅ **Offline Support** - Works without internet connection
- ✅ **Native Feel** - Smooth animations, gestures, and transitions
- ✅ **Fast Loading** - Service worker caching
- ✅ **No App Store** - Install directly from the web

**How to Install:**
- **Android:** Visit the site in Chrome → Menu → "Install app"
- **iOS:** Visit in Safari → Share (⬆️) → "Add to Home Screen"

[See detailed PWA documentation](./PWA_SETUP.md)

## Features

- 🏆 **LeetCode Integration**: Automatic sync with LeetCode profiles
- 📊 **Leaderboard**: Compete with friends using weighted scoring (Easy=1pt, Medium=3pts, Hard=6pts)
- 📧 **Email Reminders**: Daily motivational "roast" emails to encourage practice
- 📱 **WhatsApp Integration**: Send daily reminders via WhatsApp using RPay Connect API
- 🔥 **Streak Tracking**: Monitor daily coding streaks
- 📈 **Progress Analytics**: Track improvement over time
- 🎯 **Gamification**: Points system and rankings to stay motivated

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS, Radix UI
- **Backend**: Next.js API Routes, MongoDB (Mongoose)
- **Authentication**: JWT tokens with bcrypt password hashing
- **External APIs**: LeetCode GraphQL API, RPay Connect WhatsApp API
- **Email**: Nodemailer with Gmail SMTP
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB database
- Gmail account for SMTP
- RPay Connect account for WhatsApp API

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd dsa-grinders
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/dsa-grinders

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Email (Gmail SMTP)
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password

# WhatsApp API (RPay Connect)
RPAY_API_KEY=your-rpay-api-key-from-rpayconnect.com

# Cron Job Security
CRON_SECRET=your-cron-secret-for-vercel
```

### Setting up WhatsApp Integration

1. **Get RPay Connect API Key**:
   - Visit [rpayconnect.com](https://rpayconnect.com)
   - Sign up for an account
   - Navigate to API section and get your API key
   - Add the API key to your `.env.local` file as `RPAY_API_KEY`

2. **WhatsApp API Endpoint**:
   - The integration uses RPay Connect's text message API
   - Endpoint: `https://rpayconnect.com/api/send-text`
   - Required parameters: `api_key`, `mobile`, `msg`

3. **Phone Number Format**:
   - Use international format (e.g., +1234567890)
   - Include country code without spaces

### Setting up Email Integration

1. **Gmail SMTP Setup**:
   - Enable 2-factor authentication on your Gmail account
   - Generate an App Password: Google Account → Security → App passwords
   - Use the app password (not your regular password) in `SMTP_PASSWORD`

### Running the Application

1. Start the development server:
```bash
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

### API Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user (with optional phone number)
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

#### Users
- `PUT /api/users/profile` - Update user profile (including phone number)
- `POST /api/users/refresh` - Refresh LeetCode stats

#### WhatsApp
- `POST /api/whatsapp/send` - Send WhatsApp message
- `POST /api/whatsapp/test` - Test WhatsApp integration

#### Leaderboard
- `GET /api/leaderboard` - Get ranked leaderboard

#### Cron Jobs
- `GET /api/cron` - Daily stats update and reminder sending

### Testing WhatsApp Integration

You can test the WhatsApp integration using the test endpoint:

```bash
curl -X POST http://localhost:3000/api/whatsapp/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "phoneNumber": "+1234567890",
    "type": "roast"
  }'
```

### Deployment

1. **Vercel Deployment**:
   - Connect your GitHub repository to Vercel
   - Add environment variables in Vercel dashboard
   - Deploy automatically on push to main branch

2. **Cron Job Setup**:
   - Add a Vercel Cron job to trigger `/api/cron` daily
   - Set the `CRON_SECRET` environment variable for security

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please open an issue on GitHub.
