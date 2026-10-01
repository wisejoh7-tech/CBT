# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY --from=build /app/dist ./dist

# Create logs directory and set ownership
RUN mkdir -p logs && chown -R node:node logs

USER node

EXPOSE 5001
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
