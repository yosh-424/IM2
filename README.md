NEU Library Visitor Management System

A web application to track and manage library visitors, monitor visitor statistics, and manage access control.

## Features

- **Visitor Tracking** - Log and monitor library visitors
- **Statistics Dashboard** - View visitor trends over time and by college
- **Search & Filter** - Find visitors by email, name, or college
- **Admin Panel** - Manage visitor records and access permissions
- **Visitor Access** - Check personal visit history
- **Google OAuth Sign-In** - Authenticate with Google using NEU institutional email
- **Visitor Blocking** - Block or unblock visitors with reason tracking
- **Real-Time Clock** - Live UTC+8 clock display on the hero page

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Database**: MongoDB
- **Authentication**: Google OAuth 2.0
- **Deployment**: Vercel (Full-Stack)

## Accessing the System

- Production Deployment: https://im-2-tau.vercel.app
- Development: http://localhost:5000

## Security

- NEU institutional email validation (@neu.edu.ph)
- Role-based access control (Visitor/Staff/Admin)
- Google token verification on the server
- Block/unblock functionality for access control