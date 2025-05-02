#!/bin/bash

# Configuration variables
PROJECT_ID="speakup-backend"  # Updated with your actual project ID
SERVICE_NAME="speakup-node"
REGION="asia-southeast1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# Step 1: Authenticate with Google Cloud
echo "Authenticating with Google Cloud..."
gcloud auth login
gcloud auth configure-docker

# Step 2: Build the Docker image
echo "Building Docker image..."
docker build -t ${IMAGE_NAME}:latest .

# Step 3: Push the image to Google Container Registry
echo "Pushing image to Google Container Registry..."
docker push ${IMAGE_NAME}:latest

# Step 4: Deploy to Cloud Run
echo "Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --image=${IMAGE_NAME}:latest \
  --platform=managed \
  --region=${REGION} \
  --allow-unauthenticated

# Step 5: Set IAM policy for public access (to fix the warning)
echo "Setting IAM policy for public access..."
gcloud beta run services add-iam-policy-binding \
  --region=${REGION} \
  --member=allUsers \
  --role=roles/run.invoker \
  ${SERVICE_NAME}

echo "Deployment completed successfully!"
