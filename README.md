# 📊 Market Data Platform

A full-stack monorepo for real-time market data using NestJS, React, and PostgreSQL.

## 🏗️ Architecture

```
market-data/
├── shared/          # Shared TypeScript types
├── backend/         # NestJS REST API
├── frontend/        # React + Vite frontend
└── docker-compose.yml
```

## 🚀 Tech Stack

- **Backend**: NestJS, Drizzle ORM, PostgreSQL, EventEmitter2
- **Frontend**: React 18, Vite, TanStack Query, Zustand, Tailwind CSS v4
- **Shared**: TypeScript types package
- **DevOps**: Docker, Docker Compose
- **Real-time**: Server-Sent Events (SSE) with RxJS
- **Data Source**: CoinGecko API (free tier)

## 📦 Prerequisites

- Node.js 20+ (for local development)
- Docker & Docker Compose (for containerized deployment)
- npm or yarn

## 🛠️ Local Development Setup

### 1. Install Dependencies

```bash
# Install shared package dependencies
cd shared && npm install

# Install backend dependencies
cd ../backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Set Up Environment Variables

```bash
# Backend environment
cd backend && cp .env.example .env

# Frontend environment
cd ../frontend && cp .env.example .env
```

### 3. Start PostgreSQL (Optional for local dev)

```bash
# Using Docker
docker run -d \
  --name market-data-postgres \
  -e POSTGRES_USER=market_user \
  -e POSTGRES_PASSWORD=market_pass \
  -e POSTGRES_DB=market_data \
  -p 5432:5432 \
  postgres:16-alpine
```

### 4. Run Backend

```bash
cd backend
npm run start:dev
```

Backend will run on `http://localhost:3000`

### 5. Run Frontend

```bash
cd frontend
npm run dev
```

Frontend will run on `http://localhost:5173`

## 🐳 Docker Deployment

### Build and Run All Services

```bash
# Build and start all services
docker-compose up --build

# Run in detached mode
docker-compose up -d --build
```

### Stop Services

```bash
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Access Services

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **PostgreSQL**: localhost:5432

## 📁 Project Structure

### Shared Package (`/shared`)

Contains TypeScript types and interfaces shared between frontend and backend:

- `types/api.types.ts` - API request/response types
- `types/market.types.ts` - Domain types for market data

### Backend (`/backend`)

NestJS modular architecture:

- `src/database/` - Drizzle ORM configuration and schema
- `src/ingestion/` - Market data ingestion service (CoinGecko polling)
- `src/prices/` - REST API for price data
- `src/realtime/` - SSE controller for real-time streaming
- `src/events/` - EventEmitter2 configuration
- `src/main.ts` - Application entry point

### Frontend (`/frontend`)

React application with modern tooling:

- `src/api/` - API client layer (REST + SSE)
- `src/hooks/` - Custom React hooks (useSSE, useInitialPrices)
- `src/components/` - React components (Dashboard, LivePriceCard, Sparkline)
- `src/stores/` - Zustand state management for real-time data
- `src/utils/` - Formatting utilities
- `src/index.css` - Tailwind CSS entry point with dark theme

## 🔗 Shared Package Linking

The shared package uses `file:` protocol for local linking:

**In backend/package.json & frontend/package.json:**
```json
{
  "dependencies": {
    "@market-data/shared": "file:../shared"
  }
}
```

**TypeScript path mapping:**
```json
{
  "compilerOptions": {
    "paths": {
      "@market-data/shared": ["../shared/src"]
    }
  }
}
```

## 📝 Available Scripts

### Root Level

```bash
npm run install:all      # Install all dependencies
npm run build:all        # Build all packages
npm run docker:up        # Start Docker services
npm run docker:down      # Stop Docker services
```

### Backend

```bash
npm run start:dev        # Development mode with hot reload
npm run build            # Build for production
npm run start:prod       # Run production build
```

### Frontend

```bash
npm run dev              # Development server
npm run build            # Build for production
npm run preview          # Preview production build
```

## 🌟 Features

- ✅ Monorepo setup with shared TypeScript types
- ✅ NestJS REST API with modular architecture
- ✅ React frontend with TanStack Query + Zustand
- ✅ Docker multi-stage builds with root context
- ✅ PostgreSQL with Drizzle ORM
- ✅ Type-safe API communication
- ✅ Hot reload for development
- ✅ Production-ready Docker setup
- ✅ Real-time SSE streaming for live price updates
- ✅ Multi-symbol support (BTC, ETH, BNB, SOL)
- ✅ CoinGecko API integration with circuit breaker
- ✅ Sparkline charts with historical data

## 🔮 Next Steps

1. **Authentication**: Add JWT-based auth
2. **WebSocket**: Add bidirectional real-time communication
3. **Testing**: Add comprehensive test coverage
4. **CI/CD**: Set up GitHub Actions or similar
5. **Monitoring**: Add logging and observability
6. **Redis**: Add caching layer for horizontal scaling

## 📄 API Endpoints

### GET `/`
Root endpoint - API health check

### GET `/api/prices`
Returns the latest prices for all tracked symbols with optional historical data for sparklines.

**Query Parameters:**
- `includeHistory` (boolean, default: `true`) - Include historical data
- `historyLimit` (number, default: `20`) - Number of historical points per symbol

**Response:**
```json
{
  "data": {
    "prices": [
      {
        "symbol": "BTCUSDT",
        "price": 42150.50,
        "change": 350.25,
        "changePercent": 0.84,
        "timestamp": "2024-01-21T10:30:00.000Z"
      }
    ],
    "history": {
      "BTCUSDT": [/* last 20 price updates */]
    }
  }
}
```

### GET `/api/prices/:symbol`
Returns the latest price for a specific symbol.

**Response:**
```json
{
  "data": {
    "symbol": "BTCUSDT",
    "price": 42150.50,
    "change": 350.25,
    "changePercent": 0.84,
    "timestamp": "2024-01-21T10:30:00.000Z"
  }
}
```

### GET `/realtime/prices` (SSE)
Server-Sent Events stream for real-time price updates.

**Event Types:**
- `connection` - Initial connection confirmation
- `price_update` - New price data (emitted every ~30 seconds)

**Example Usage:**
```javascript
const es = new EventSource('http://localhost:3000/realtime/prices');
es.addEventListener('price_update', (e) => {
  const data = JSON.parse(e.data);
  console.log(data); // { type: 'PRICE_UPDATE', data: { symbol, price, ... } }
});
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📜 License

MIT

## 👥 Authors

Market Data Platform Team
