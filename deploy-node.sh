set -e

PACKAGE_NAME=$(node -p "require('./package.json').name")

if [ -z "$PACKAGE_NAME" ]; then
  echo "Error: Could not read package name from package.json"
  exit 1
fi

TARGET_DIR="/var/lib/docker/volumes/dashboard_n8n_data/_data/node_modules/${PACKAGE_NAME}"

echo "Deploying ${PACKAGE_NAME} to ${TARGET_DIR}..."

# Step 1: build the Node
echo "Building the node..."
npm run build

# Step 2: Copy the built files to the target directory
SOURCE_DIR="./dist"
PACKAGE_JSON="./package.json"

echo "Copying files to ${TARGET_DIR}..."

# Remove any previous deployment and recreate the target directory
sudo rm -rf "${TARGET_DIR}"
sudo mkdir -p "${TARGET_DIR}"

# Copy the built files to the target directory
sudo cp -r "${SOURCE_DIR}" "${TARGET_DIR}/dist"
sudo cp "${PACKAGE_JSON}" "${TARGET_DIR}/package.json"

echo "Deployment of ${PACKAGE_NAME} completed successfully."

#Step 3: Restart n8n to apply changes
echo "Restarting n8n to apply changes..."
docker container restart n8n

# Logging
docker logs -f n8n --tail 100
