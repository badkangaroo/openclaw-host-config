#!/bin/bash

# OpenClaw Icon Generation Script
# This script converts a source image to the correct RGBA formats required by Tauri.

SOURCE_IMAGE="IconSource.webp"
TEMP_PNG="icon_temp.png"

# Check if source exists
if [ ! -f "$SOURCE_IMAGE" ]; then
    echo "Error: $SOURCE_IMAGE not found!"
    exit 1
fi

# Check for ffmpeg
if ! command -v ffmpeg &> /dev/null; then
    echo "Error: ffmpeg is not installed. Please install it to convert webp to png."
    exit 1
fi

echo "🎨 Converting $SOURCE_IMAGE to temporary PNG..."
ffmpeg -i "$SOURCE_IMAGE" -y "$TEMP_PNG" -loglevel error

echo "🚀 Running tauri-cli icon generation..."
# Using npx to ensure the tauri cli is available without global install
npx tauri icon "$TEMP_PNG"

echo "🧹 Cleaning up..."
rm "$TEMP_PNG"

echo "✅ Icons generated successfully in src-tauri/icons/"
echo "   Don't forget to commit your changes!"
