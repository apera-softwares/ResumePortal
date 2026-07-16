# ==========================================
# Stage 1: Build the application
# ==========================================
FROM --platform=linux/amd64 node:20-bookworm-slim AS builder

# Install build tools for native npm dependencies (like bcrypt)
RUN apt-get update && apt-get install -y \
    openssl \
    python3 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Copy package files and Prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Skip Puppeteer browser download during npm install to avoid network failures
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_SKIP_DOWNLOAD=true

# Install all dependencies (including devDependencies)
RUN npm install

# Copy the rest of the source code
COPY . .

# Generate Prisma client and compile the NestJS application
# We provide a dummy DATABASE_URL for prisma generate step to run during build
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npm run build

# Prune devDependencies to keep the production node_modules light
RUN npm prune --omit=dev

# ==========================================
# Stage 2: Production Image
# ==========================================
FROM --platform=linux/amd64 node:20-bookworm-slim AS production

ENV DEBIAN_FRONTEND=noninteractive

# Install OpenSSL for Prisma, LibreOffice, Chromium, and standard fonts
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    libreoffice-core \
    libreoffice-writer \
    chromium \
    fonts-liberation \
    fonts-dejavu \
    fonts-noto \
    fonts-noto-cjk \
    fonts-noto-color-emoji \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Copy package.json
COPY package*.json ./

# Copy node_modules from builder
COPY --from=builder /usr/src/app/node_modules ./node_modules

# Copy dist build and prisma files
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma

# Ensure upload directories exist
RUN mkdir -p uploads

# Define default environment variables
ENV DATABASE_URL=""
ENV JWT_SECRET=""
ENV PORT=8094
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV POSTGRES_USER=""
ENV POSTGRES_PASSWORD=""
ENV POSTGRES_DB=""
ENV USE_S3=""
ENV SMTP_USER=""
ENV SMTP_PASSWORD=""
ENV S3_ENDPOINT=""
ENV ACCESS_KEY_ID=""
ENV SECRET_ACCESS_KEY=""
ENV S3_BUCKET=""
ENV S3_ACCOUNT_ID=""

EXPOSE 8094

# Run prisma migrations and start the NestJS application in production mode
CMD sh -c "npx prisma migrate deploy && npm run start:prod"
