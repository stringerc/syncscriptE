# Environment Variables for Deployment

## Frontend (Vercel)
VITE_API_URL=https://your-render-backend-url.onrender.com/api

## Backend (Render)
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://username:password@host:port/database

# JWT
JWT_SECRET=your-super-secret-jwt-key-here

# Plaid (if using)
PLAID_CLIENT_ID=your-plaid-client-id
PLAID_SECRET=your-plaid-secret
PLAID_ENVIRONMENT=sandbox

# Email (if using)
RESEND_API_KEY=your-resend-key
SENDGRID_API_KEY=your-sendgrid-key

# Calendar (if using)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
OUTLOOK_CLIENT_ID=your-outlook-client-id
OUTLOOK_CLIENT_SECRET=your-outlook-client-secret
