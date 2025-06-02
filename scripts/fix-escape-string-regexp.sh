#!/bin/bash

# This script fixes the escape-string-regexp issue in mdast-util-find-and-replace
# It ensures the patch file is properly created and configured

PATCH_DIR="./lib/patches"
PATCH_FILE="$PATCH_DIR/escape-string-regexp-fix.js"

# Create the patches directory if it doesn't exist
mkdir -p "$PATCH_DIR"

# Create the patch file
cat > "$PATCH_FILE" << 'EOL'
/**
 * Simple polyfill for escape-string-regexp module
 * This is used to fix issues with mdast-util-find-and-replace
 */

'use strict';

module.exports = function escapeStringRegexp(string) {
  if (typeof string !== 'string') {
    throw new TypeError('Expected a string');
  }

  // Escape characters with special meaning in RegExp
  return string.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&').replace(/-/g, '\\-');
};
EOL

echo "✓ Escape string regexp fix applied successfully"