# Calming Space

A meditation and relaxation application with ambient sounds and Spotify integration.

## Features

- User authentication (local and Spotify)
- Ambient sound mixing
- Mindfulness timer
- Spotify music integration
- Responsive design

## Prerequisites

- Node.js 18.x or higher
- MongoDB
- Spotify Developer Account
- PM2 (for production deployment)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
MONGODB_URI=your_mongodb_uri
SESSION_SECRET=your_session_secret
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/calming-space.git
cd calming-space
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

## Testing

Run the test suite:
```bash
npm test
```

For watch mode:
```bash
npm run test:watch
```

## Production Deployment

1. Install PM2 globally:
```bash
npm install -g pm2
```

2. Start the application with PM2:
```bash
pm2 start ecosystem.config.mjs
```

3. Monitor the application:
```bash
pm2 monit
```

## CI/CD Pipeline

The application uses GitHub Actions for continuous integration and deployment. The pipeline:

1. Runs tests on every push and pull request
2. Deploys to production on successful merge to main branch
3. Automatically restarts the application using PM2

Required GitHub Secrets:
- `MONGODB_URI`
- `SESSION_SECRET`
- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `SERVER_HOST`
- `SERVER_USERNAME`
- `SSH_PRIVATE_KEY`

## License

ISC 