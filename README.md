# Idiomoji - Daily Idiom Puzzle Game

A fun and engaging web game where players guess idioms based on emoji combinations. Built with Next.js 14, Firebase, and Shadcn UI.

## Features

- 🎮 **Daily Puzzles**: A new idiom puzzle every day
- 🏆 **Leaderboard**: Compete with other players and track your progress
- 📊 **Player Stats**: Track your win rate, streaks, and total score
- 🎯 **Multiple Game Modes**:
  - Daily Challenge
  - Time Attack (Coming Soon)
  - Multiplayer Duel (Coming Soon)
- 🎨 **Modern UI**: Built with Shadcn UI components
- 🔒 **Authentication**: Google sign-in integration
- 📱 **Responsive Design**: Works on desktop and mobile

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- Firebase account and project
- Environment variables setup

### Environment Variables

Create a `.env.local` file in the root directory with the following:

```env
# Firebase Config
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_CLIENT_ID=your_client_id
```

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/idiomoji.git
cd idiomoji
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the game.

## Project Structure

- `/src/app` - Next.js app router pages and components
- `/src/app/components` - Reusable UI components
- `/src/app/lib` - Utility functions and Firebase configuration
- `/src/app/api` - API routes for authentication and game logic

## Firebase Setup

1. Create a new Firebase project
2. Enable Authentication with Google provider
3. Create a Firestore database
4. Set up the following collections:
   - `dailyPuzzles`: Daily puzzle data
   - `players`: Player statistics and profiles
   - `idiomSubmissions`: User-submitted puzzles

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Next.js](https://nextjs.org)
- [Firebase](https://firebase.google.com)
- [Shadcn UI](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
