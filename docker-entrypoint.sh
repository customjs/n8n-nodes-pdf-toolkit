#!/bin/sh

# Start n8n in background to initialize the database
n8n start &
N8N_PID=$!

# Wait for n8n to be ready
echo "Waiting for n8n to initialize..."
sleep 10

# Create CustomJS API credentials if they don't exist
echo "Setting up CustomJS API credentials..."

# Create a temporary credentials file with the API key from environment variable
if [ -n "$CUSTOMJS_API_KEY" ]; then
  echo "Injecting API key from environment variable..."
  cat > /tmp/customjs-credentials-temp.json <<EOF
[
  {
    "id": "BFGbk0a71fKWY967",
    "name": "CustomJS account",
    "type": "customJsApi",
    "data": {
      "apiKey": "$CUSTOMJS_API_KEY"
    }
  }
]
EOF
  n8n import:credentials --input=/tmp/customjs-credentials-temp.json 2>/dev/null || echo "Credentials already exist or import failed"
  rm -f /tmp/customjs-credentials-temp.json
else
  echo "Error: CUSTOMJS_API_KEY environment variable not set. Please set it in your .env file."
  exit 1
fi

# Import the workflow if it doesn't exist yet
echo "Checking if workflow needs to be imported..."
n8n import:workflow --input=/tmp/workflows/CustomJS_Smoke_Test.json 2>/dev/null || echo "Workflow already exists or import failed"

# Bring n8n back to foreground
wait $N8N_PID
