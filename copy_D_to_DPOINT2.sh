#!/bin/bash

# Script to copy the entire D folder to DPOINT2
echo "🔄 Copying D folder to DPOINT2..."

# Check if D folder exists
if [ ! -d "D" ]; then
    echo "❌ Error: D folder not found in current directory"
    exit 1
fi

# Remove DPOINT2 if it already exists
if [ -d "DPOINT2" ]; then
    echo "🗑️ Removing existing DPOINT2 folder..."
    rm -rf DPOINT2
fi

# Copy D folder to DPOINT2
echo "📁 Copying D folder to DPOINT2..."
cp -r D DPOINT2

# Check if copy was successful
if [ $? -eq 0 ]; then
    echo "✅ Successfully copied D folder to DPOINT2"
    echo "📊 DPOINT2 folder contents:"
    ls -la DPOINT2/
else
    echo "❌ Error: Failed to copy D folder to DPOINT2"
    exit 1
fi

echo "🎉 Copy operation completed successfully!" 