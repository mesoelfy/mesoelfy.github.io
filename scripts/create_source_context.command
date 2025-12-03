#!/bin/bash
# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Change to the project root (assuming script is in /scripts or /docs)
# If script is in root, comment this out. If in /scripts, keep it.
cd "$SCRIPT_DIR/.."

# Define the output file path
OUTPUT_FILE="docs/all_source_code.txt"

# Create docs folder if it doesn't exist
mkdir -p docs

echo "🔮 MESOELFY_OS Context Generator"
echo "=================================="
echo "Working directory: $(pwd)"
echo "Output file: $OUTPUT_FILE"
echo ""

# Step 1: Create the file and write the header
echo "+---------------------------------+" > "$OUTPUT_FILE"
echo "|      M E S O E L F Y _ O S      |" >> "$OUTPUT_FILE"
echo "|   Next.js / R3F Source Context  |" >> "$OUTPUT_FILE"
echo "+---------------------------------+" >> "$OUTPUT_FILE"
echo "Generated on: $(date)" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Step 2: Add directory tree structure
echo "=====================================" >> "$OUTPUT_FILE"
echo "PROJECT DIRECTORY STRUCTURE:" >> "$OUTPUT_FILE"
echo "=====================================" >> "$OUTPUT_FILE"

# IGNORE: node_modules, .next (build), .git, out (export), .DS_Store
if command -v tree >/dev/null 2>&1; then
    tree -I 'node_modules|.next|.git|out|.DS_Store|package-lock.json|yarn.lock' >> "$OUTPUT_FILE"
else
    # Fallback to find if 'tree' isn't installed
    find . -maxdepth 4 -not -path '*/.*' -not -path './node_modules*' -not -path './.next*' -not -path './out*' | sed 's|[^/]*/|  |g; s|  \([^/]*\)$|-- \1/|' >> "$OUTPUT_FILE"
fi

echo "" >> "$OUTPUT_FILE"
echo "📁 Collecting source files..."

# Step 3: Find files and append content
# We look for: TS/TSX (Logic), CSS (Styles), JSON (Data), MD (Docs), JS/MJS (Config)
find . -type f \( \
  -name "*.ts" -o \
  -name "*.tsx" -o \
  -name "*.js" -o \
  -name "*.mjs" -o \
  -name "*.css" -o \
  -name "*.json" -o \
  -name "*.md" \
\) \
-not -path "./node_modules/*" \
-not -path "./.next/*" \
-not -path "./out/*" \
-not -path "./.git/*" \
-not -path "./$OUTPUT_FILE" \
-not -name "package-lock.json" \
-not -name "yarn.lock" \
-not -name ".DS_Store" \
-exec sh -c '
  echo "====================================="
  echo "FILE: $1"
  echo "====================================="
  cat "$1"
  echo ""
  echo ""
' _ {} \; >> "$OUTPUT_FILE"

echo "✅ Success! Context bundle ready."
echo "📄 Location: $(pwd)/$OUTPUT_FILE"