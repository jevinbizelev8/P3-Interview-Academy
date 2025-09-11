# Google Cloud Platform Setup for SeaLion Vertex AI

This guide explains how to set up Google Cloud Vertex AI integration for the SeaLion API.

## Prerequisites

1. Google Cloud Project: `g-4d-bizelev8`
2. Region: `asia-southeast1`
3. Endpoint ID: `2904148858537771008`
4. SeaLion model deployed on Vertex AI

## Setup Steps

### 1. Service Account Credentials

You need to create a service account key file for authentication:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project `g-4d-bizelev8`
3. Navigate to **IAM & Admin > Service Accounts**
4. Create a new service account or use existing one
5. Grant the following permissions:
   - `AI Platform Developer` or `Vertex AI User`
   - `Service Account Token Creator` (if using impersonation)
6. Create and download a JSON key file
7. Save the JSON file as `vt-svc-key.json` in the project root

### 2. Environment Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update the following variables in `.env`:
   ```env
   GOOGLE_APPLICATION_CREDENTIALS=./vt-svc-key.json
   GCP_PROJECT_ID=g-4d-bizelev8
   GCP_REGION=asia-southeast1
   GCP_ENDPOINT_ID=2904148858537771008
   ```

### 3. Verify Setup

You can test the connection using:
```bash
npm run dev
```

The application will attempt to authenticate with Google Cloud on startup.

## Security Notes

- **Never commit `vt-svc-key.json` to version control**
- The service account key file is already added to `.gitignore`
- Keep your service account permissions minimal (principle of least privilege)
- Rotate service account keys regularly

## Troubleshooting

### Authentication Errors
- Verify the service account has proper permissions
- Check that the JSON key file path is correct
- Ensure the project ID matches your GCP project

### API Errors
- Confirm the Vertex AI endpoint is deployed and active
- Verify the endpoint ID is correct
- Check that the model is properly deployed in the specified region

### Network Issues
- Ensure your deployment environment can reach Google Cloud APIs
- Check for firewall rules that might block outbound HTTPS traffic

## Migration Notes

This setup maintains backward compatibility with the original SeaLion API. If Vertex AI authentication fails, the system will fall back to the direct SeaLion API using `SEALION_API_KEY`.