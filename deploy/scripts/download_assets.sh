#!/bin/bash

echo
echo "⬇️  Downloading external assets..."

# Check if the number of arguments provided is correct
if [ "$#" -ne 1 ]; then
  echo "🛑 Error: incorrect amount of arguments. Usage: $0 <ASSETS_DIR>."
  exit 1
fi

# Define the directory to save the downloaded assets
ASSETS_DIR="$1"

# Define a list of environment variables containing URLs of external assets
ASSETS_ENVS=(
    "NEXT_PUBLIC_MARKETPLACE_CONFIG_URL"
    "NEXT_PUBLIC_FEATURED_NETWORKS"
    "NEXT_PUBLIC_FOOTER_LINKS"
    "NEXT_PUBLIC_NETWORK_LOGO"
    "NEXT_PUBLIC_NETWORK_LOGO_DARK"
    "NEXT_PUBLIC_NETWORK_ICON"
    "NEXT_PUBLIC_NETWORK_ICON_DARK"
    "NEXT_PUBLIC_OG_IMAGE_URL"
    "NEXT_PUBLIC_AD_CUSTOM_CONFIG_URL"
)

# Create the assets directory if it doesn't exist
mkdir -p "$ASSETS_DIR"

# Function to determine the target file name based on the environment variable
get_target_filename() {
    local env_var="$1"
    local url="${!env_var}"

    # Extract the middle part of the variable name (between "NEXT_PUBLIC_" and "_URL") in lowercase
    local name_prefix="${env_var#NEXT_PUBLIC_}"
    local name_suffix="${name_prefix%_URL}"
    local name_lc="$(echo "$name_suffix" | tr '[:upper:]' '[:lower:]')"

    # Extract the extension from the URL
    local extension="${url##*.}"

    # Construct the custom file name
    echo "$name_lc.$extension"
}

# Function to download and save an asset
download_and_save_asset() {
    local env_var="$1"
    local url="$2"
    local filename="$3"
    local destination="$ASSETS_DIR/$filename"

    # 检查 NEXT_PUBLIC_DISABLE_DOWNLOAD_AT_RUN_TIME 环境变量是否设置为 true
    if [ "$NEXT_PUBLIC_DISABLE_DOWNLOAD_AT_RUN_TIME" = "true" ]; then
        echo "   [.] Download disabled at runtime. Skipping download."
        return 1
    fi

    # Check if the environment variable is set
    if [ -z "${!env_var}" ]; then
        echo "   [.] Environment variable $env_var is not set. Skipping download."
        return 1
    fi

    # Download the asset using curl
    curl -s -o "$destination" "$url"

    # Check if the download was successful
    if [ $? -eq 0 ]; then
        echo "   [+] Downloaded $env_var to $destination successfully."
        return 0
    else
        echo "   [-] Failed to download $env_var from $url."
        return 1
    fi
}

# Iterate through the list and download assets
for env_var in "${ASSETS_ENVS[@]}"; do
    url="${!env_var}"
    filename=$(get_target_filename "$env_var")
    download_and_save_asset "$env_var" "$url" "$filename"
done

echo "✅ Done."
echo
