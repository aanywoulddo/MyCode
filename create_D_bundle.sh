#!/bin/bash

# This script consolidates all files in the D/ directory into a single text file.
# It excludes the 'lib' directory and the script itself.

# Set the source and output file paths
SOURCE_DIR="D"
OUTPUT_FILE="D_CODE_BUNDLE.txt"
SCRIPT_NAME="create_D_bundle.sh"

# Ensure the source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
  echo "Error: Directory $SOURCE_DIR not found."
  exit 1
fi

# Clear the output file if it exists
> "$OUTPUT_FILE"

# Find all files, excluding the lib directory and this script, then process them
find "$SOURCE_DIR" -type f -not -path "*/lib/*" -not -name "$SCRIPT_NAME" | while read -r file; do
  echo "====================================================================" >> "$OUTPUT_FILE"
  echo "FILE: $file" >> "$OUTPUT_FILE"
  echo "====================================================================" >> "$OUTPUT_FILE"
  cat "$file" >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"
done

echo "✅ All files from '$SOURCE_DIR' (excluding lib/) have been bundled into '$OUTPUT_FILE'." 