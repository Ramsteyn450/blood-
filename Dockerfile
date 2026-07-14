# --- Build Client Stage ---
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# --- Build Server Stage ---
FROM node:20-alpine AS server-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npm run build

# --- Production Runner Stage ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Copy server package files and install only production dependencies
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci --only=production

# Copy built server assets
COPY --from=server-builder /app/server/dist ./dist

# Copy built client assets (express server will serve this)
COPY --from=client-builder /app/client/dist ../client/dist

# Expose port and start
EXPOSE 5000
CMD ["npm", "start"]
