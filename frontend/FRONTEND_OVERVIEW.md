# Frontend Overview

The frontend is a React single-page application (SPA) built using Create React App. It uses modern React features including hooks and context for state management.

## Key Features

- User authentication with protected routes.
- Pages for user login, registration, password reset, and welcome.
- Dashboard for managing jobs and application tracking.
- ATS (Applicant Tracking System) and Interview Preparation components.
- Job form for adding or editing job listings.
- Calendar integration for scheduling.
- Responsive UI with animations using libraries like Framer Motion and GSAP.
- API communication handled via Axios.

## Project Structure

- `src/` - Main source code directory.
  - `components/` - Reusable UI components.
  - `pages/` - Route components representing different pages.
  - `context/` - React context providers for authentication and UI state.
  - `hooks/` - Custom React hooks.
  - `api/` - API client setup and Axios configuration.
  - `assets/` - Static assets like images and icons.
  - `style.css` - Global styles.
  - `AppNew.jsx` - Main app component with routing and authentication.
  - `index.js` - Entry point rendering the app.

## Running the Frontend

To start the development server:

\`\`\`bash
npm start
\`\`\`

This will launch the app at [http://localhost:3000](http://localhost:3000).
