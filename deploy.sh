#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Configuration variables
IMAGE_PROJECT_ID="speakup-gemini"  # Project hosting the container image
DEPLOY_PROJECT_ID="speakup-backend" # Project where Cloud Run service is deployed
SERVICE_NAME="speakup-backend"
REGION="asia-southeast1"
IMAGE_NAME="gcr.io/${IMAGE_PROJECT_ID}/${SERVICE_NAME}:latest"

echo "Building Docker image: $IMAGE_NAME"

# Build the Docker image from the Dockerfile in the current directory
docker build -t "$IMAGE_NAME" .

echo "Pushing Docker image: $IMAGE_NAME"

# Push the image to the registry
docker push "$IMAGE_NAME"

# Step 4: Deploy to Cloud Run
echo "Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --image=${IMAGE_NAME} \
  --platform=managed \
  --region=${REGION} \
  --allow-unauthenticated \
  --project=${DEPLOY_PROJECT_ID} # Explicitly set the deployment project

echo "Deployment completed successfully!"