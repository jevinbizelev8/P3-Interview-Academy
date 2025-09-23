FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm ci && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

# Copy production node_modules and built assets
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app .

CMD ["node", "server/index.js"]


