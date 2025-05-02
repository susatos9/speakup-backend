FROM node:23-slim AS builder

# Install ffmpeg in builder stage
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY src/ ./src/
COPY arkavidia-speakup-firebase-adminsdk-fbsvc-8fbef0197a.json ./

# Compile TypeScript
RUN npx tsc

# Final image
FROM node:23-slim

# Install ffmpeg in final stage
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/speakup-final-firebase-adminsdk-fbsvc-6b947e7304.json ./

# Create a non-root user
RUN useradd -m nodeuser && \
    mkdir -p dist/uploads dist/temp && \
    chown -R nodeuser:nodeuser /app

USER nodeuser

EXPOSE 3000

CMD ["node", "dist/src/server.js"]
