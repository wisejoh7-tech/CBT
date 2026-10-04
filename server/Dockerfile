# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx tsc

# Stage 2: Production
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist

# Create logs directory and set ownership
RUN mkdir -p logs && chown -R node:node logs

USER node

ENV PORT=10000
ENV NODE_ENV=production
EXPOSE 10000

CMD ["node", "dist/index.js"]
