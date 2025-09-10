# Note Taking React Project App

A full-stack notes app with a React + Vite frontend and an Express + SQLite backend. Write notes in **Markdown**, organize with **tags**, **pin** favorites, filter by title/tags, toggle **dark/light** themes, and more. Data is persisted in SQLite through a simple REST API.

---

## Features
- Markdown editing & preview
- Quick hover delete on cards  
- Tagging + filter by title/tags  
- Pin/Unpin notes (pinned sort to top)  
- Dark/Light mode (saved preference)  
- QLite persistence via Express REST API

## Tech Stack
- **Frontend:** React, Vite, TypeScript, React-Bootstrap, React-Router, React-Select  
- **Backend:** Node.js, Express, SQLite3  
- **Dev:** Nodemon (backend), Vite (frontend)

---

## Quick Start

> Requirements: Node 18+ (or 20+), npm

### 1) Backend (API @ `http://localhost:4000`)
```bash
cd backend
npm install
npm run dev
