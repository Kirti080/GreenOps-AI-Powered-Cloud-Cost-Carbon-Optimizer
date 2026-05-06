# GreenOps — Cloud Sustainability Dashboard 🌿

> **AI-powered cloud infrastructure management with carbon tracking, predictive scaling, and real-time analytics.**

![GreenOps Dashboard](https://img.shields.io/badge/GreenOps-v1.0-10b981?style=for-the-badge&logo=leaf)
![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=flat&logo=node.js)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)
![Three.js](https://img.shields.io/badge/Three.js-WebGL-black?style=flat&logo=three.js)

---

## 🚀 Quick Start

### Option 1 — Double-click launcher (Windows)
```
Double-click START.bat
```
This will install dependencies, start both servers, and open your browser.

### Option 2 — Manual
```bash
# Terminal 1: Backend
cd backend
npm install
npm start

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**

---

## 🏗️ Architecture

```
Green-Ops/
├── backend/           ← Node.js + Express API server
│   ├── src/
│   │   ├── index.js           ← HTTP + WebSocket server
│   │   ├── routes/            ← API endpoints
│   │   ├── services/
│   │   │   ├── metricsGenerator.js  ← Realistic traffic simulation
│   │   │   └── dataStore.js         ← JSON file persistence
│   │   └── data/              ← Auto-generated JSON storage
│   └── package.json
└── frontend/          ← React + Vite + TypeScript
    ├── src/
    │   ├── components/3d/     ← Three.js WebGL globe
    │   ├── components/layout/ ← Sidebar, AppLayout
    │   ├── pages/             ← 4 dashboard pages
    │   ├── hooks/             ← WebSocket hook
    │   ├── store/             ← Zustand global state
    │   └── api/               ← Axios client
    └── package.json
```

---

## 📊 Features

| Feature | Description |
|---|---|
| **🌐 3D WebGL Globe** | Real-time rotating globe with 12,000 dot-matrix sphere, server node markers, connection arcs, and particle field |
| **📡 Live Monitoring** | WebSocket-powered real-time metrics updating every 2 seconds |
| **🤖 AI Forecast** | LSTM-simulated 12-hour traffic prediction with confidence intervals |
| **🌱 Green Score** | Animated gauge with CO₂ tracking, trees saved, carbon heatmap |
| **⚡ Optimization** | Cost savings analysis with one-click scale/terminate actions |
| **🔔 Smart Alerts** | Predictive alerts before problems occur |

---

## 🔌 API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/metrics` | Live server metrics snapshot |
| `GET /api/forecast` | 12-hour AI traffic prediction |
| `GET /api/sustainability` | Carbon footprint & green score |
| `GET /api/history?hours=N` | Historical time-series data |
| `GET /api/alerts` | Active system alerts |
| `GET /api/servers` | Server fleet status |
| `POST /api/servers/:id/scale` | Simulate scale action |
| `WS ws://localhost:3001` | Real-time metrics stream |

---

## 🎨 Tech Stack

- **Frontend**: React 18, Vite, TypeScript
- **3D**: Three.js (pure, no extra wrappers)
- **Charts**: Recharts
- **State**: Zustand
- **Styling**: Custom CSS (glassmorphism dark theme)
- **Backend**: Node.js, Express
- **Real-time**: WebSocket (ws library)
- **Storage**: JSON files (no database needed)
