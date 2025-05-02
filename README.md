# SpeakUp Backend

## Overview
SpeakUp is a robust backend API service designed to power voice-based English learning applications. This backend is used for handling audio for AI models


## Technology Stack
- **Language**: Node.js with TypeScript
- **Framework**: Express.js
- **Deployment**: Docker

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- Docker (optional)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/speakup-backend.git
   cd speakup-backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   ```
   cp .env.example .env
   ```
   Edit the `.env` file with your configuration values.

4. Start the development server:
   ```
   npm run dev
   ```

### Docker Deployment

1. Build the Docker image:
   ```
   docker build -t speakup-backend .
   ```

2. Run the container:
   ```
   docker run -p 3000:3000 speakup-backend
   ```

### Google Cloud Run Deployment

1. Install the Google Cloud SDK if you haven't already:
   ```
   # Download and install the Google Cloud SDK
   curl https://sdk.cloud.google.com | bash
   
   # Restart your shell
   exec -l $SHELL
   
   # Initialize gcloud
   gcloud init
   ```

2. Authenticate with Google Cloud:
   ```
   gcloud auth login
   ```

3. Set your project ID:
   ```
   gcloud config set project YOUR_PROJECT_ID
   ```

4. Build your container image using Cloud Build:
   ```
   gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/speakup-node
   ```

5. Deploy to Cloud Run:
   ```
   gcloud run deploy speakup-node \
     --image gcr.io/YOUR_PROJECT_ID/speakup-node \
     --platform managed \
     --region asia-southeast1 \
     --allow-unauthenticated
   ```

### Redeploying to Existing Service

To redeploy to the existing service (`speakup-node` in asia-southeast1):

1. Build a new container image:
   ```
   gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/speakup-node
   ```

2. Update the existing Cloud Run service:
   ```
   gcloud run services update speakup-node \
     --image gcr.io/YOUR_PROJECT_ID/speakup-node \
     --region asia-southeast1
   ```

3. Verify deployment status:
   ```
   gcloud run services describe speakup-node --region asia-southeast1
   ```

4. Access your application at:
   https://speakup-node-689756285639.asia-southeast1.run.app

## API Documentation

#### Upload Audio

## Project Structure
```
speakup-backend/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Request handlers
│   ├── middleware/     # Express middlewares
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── utils/          # Helper functions
│   └── app.ts          # Application entry point
├── tests/              # Test files
├── .env.example        # Example environment variables
├── package.json        # Project dependencies
├── tsconfig.json       # TypeScript configuration
└── README.md           # Project documentation
```

## Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Support
If you encounter any issues or have questions, please file an issue on the GitHub repository or contact the maintainers.
