# Social Media Post Scheduler

A responsive social media post scheduling dashboard built using React, TypeScript, Vite and Ant Design.

## Live Demo

https://delicate-piroshki-1719cd.netlify.app

## GitHub Repository

https://github.com/vireshbangargi1998/flintzy-social-media-scheduler

## Features

- Dashboard displaying social media posts grouped by date.
- Supports Facebook, Instagram, X and TikTok.
- Post search by content.
- Filter posts by platform and status.
- URL query parameters to preserve filters.
- Create and schedule posts across multiple platforms.
- Live platform-wise character counter.
- Character limit validation.
- Future date and time validation.
- UTC date storage and local time display.
- Retry functionality for failed posts.
- Optimistic UI updates with rollback on failure.
- Mock API with a one-second delay and simulated failure.
- Loading, empty and error states.
- Responsive design for desktop and mobile devices.

## Technology Stack

- React.js
- TypeScript
- Vite
- Ant Design
- Day.js
- Axios
- CSS

## Installation and Setup

### Prerequisites

- Node.js
- npm

### Clone the repository

```bash
git clone https://github.com/vireshbangargi1998/flintzy-social-media-scheduler.git
```

### Navigate to the project

```bash
cd flintzy-social-media-scheduler
```

### Install dependencies

```bash
npm install
```

### Start the development server

```bash
npm run dev
```

### Create production build

```bash
npm run build
```

## Key Technical Decisions

1. Used React functional components and hooks for UI development and state management.
2. Used TypeScript interfaces to maintain type safety.
3. Used reusable components to improve maintainability.
4. Used mock JSON data to simulate social media posts.
5. Used URL query parameters to preserve filter selections after refresh.
6. Used UTC for storing scheduled dates and local time for display.
7. Implemented optimistic updates for retry functionality with rollback on failure.
8. Used Ant Design for consistent and responsive UI components.

## Assignment Details

Frontend-only Social Media Post Scheduler assignment for Flintzy.

No real social media integration or publishing is performed. All data and API operations are simulated.
