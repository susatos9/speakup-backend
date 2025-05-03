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
RUN npm install && \
    npm install --save-dev @types/fluent-ffmpeg @types/node axios@latest && \
    echo '{ "compilerOptions": { "skipLibCheck": true, "noImplicitAny": false } }' > tsconfig.build.json

# Copy source code
COPY src/ ./src/
COPY speakup-final-firebase-adminsdk-fbsvc-6b947e7304.json ./
COPY src/utils/dummy/dummy-data.json ./src/utils/dummy/dummy-data.json

# Compile TypeScript with relaxed settings
RUN npx tsc --skipLibCheck --noImplicitAny false

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
COPY --from=builder /app/dist/src/utils/dummy/dummy-data.json ./dist/src/utils/dummy/dummy-data.json

# Create a non-root user
RUN useradd -m nodeuser && \
    mkdir -p dist/uploads dist/temp && \
    chown -R nodeuser:nodeuser /app

USER nodeuser

EXPOSE 3000

CMD ["node", "dist/src/main.js"]
