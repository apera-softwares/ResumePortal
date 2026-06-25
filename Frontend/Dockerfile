# ==========================================
# Stage 1: Build the application
# ==========================================
FROM --platform=linux/amd64 node:20-bookworm-slim AS builder

WORKDIR /app

# Accept build args for Next.js public environment variables
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm install

# Copy the rest of the source code
COPY . .

# Build the Next.js application
RUN npm run build

# ==========================================
# Stage 2: Production Image
# ==========================================
FROM --platform=linux/amd64 node:20-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy built Next.js assets
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000

# Run the Next.js application in production mode
CMD [ "npm", "run", "start" ]
