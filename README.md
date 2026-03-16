NEU Library Visitor Management System

A web application to track and manage library visitors, monitor visitor statistics, and manage access control.

## Features

- **Visitor Tracking** - Log and monitor library visitors
- **Statistics Dashboard** - View visitor trends over time and by college
- **Search & Filter** - Find visitors by email, name, or college
- **Admin Panel** - Manage visitor records and access permissions
- **Visitor Access** - Check personal visit history

## Quick Start

### Prerequisites
- Node.js 16+
- MongoDB
- npm

### Installation

```bash
# Install dependencies
npm install
cd client && npm install && cd ..

# Create .env file with your MongoDB URI
# MONGODB_URI=your_connection_string
# PORT=5000

# Start development server
npm run dev
```

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Database**: MongoDB
- **Deployment**: Vercel (Full-Stack)

## Accessing the System

- Production Deployment: https://im-21-rkihu0is1-yosh-424s-projects.vercel.app
- Development: http://localhost:5000

## Default Credentials

- Email: `jcesperanza@neu.edu.ph` or `joshuaandre.tindoy@neu.edu.ph`
- Password: `0000`

## Security

- NEU institutional email validation (@neu.edu.ph)
- Role-based access control (Visitor/Admin)
- Password-protected admin panel
- Block/unblock functionality for access control

## Deployment

This app is configured for Vercel full-stack deployment:

1. Push to GitHub
2. Connect your repo to Vercel
3. Set environment variable: `MONGODB_URI`
4. Vercel will auto-deploy on git push

### Local Development

```bash
npm run dev              # Start backend and client dev servers
npm run build            # Build frontend for production
npm start                # Start backend server only
```