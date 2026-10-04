# Stage 1: Build Frontend and Backend
FROM node:20-alpine AS build

WORKDIR /app

# Copy package manifests
COPY package*.json ./
COPY server/package*.json ./server/

# Install dependencies
RUN npm install
RUN cd server && npm install

# Copy all source files
COPY . .

# Build frontend and backend
RUN npm run build
RUN cd server && npx tsc

# Stage 2: Production Runtime
FROM node:20-alpine

WORKDIR /app

# Copy package manifests
COPY package*.json ./
COPY server/package*.json ./server/

# Install production dependencies for server
RUN cd server && npm install --omit=dev

# Copy build artifacts
COPY --from=build /app/dist ./dist
COPY --from=build /app/server/dist ./server/dist

# Set environment variables
ENV NODE_ENV=production
ENV PORT=10000

EXPOSE 10000 80

WORKDIR /app/server

CMD ["node", "dist/index.js"]
