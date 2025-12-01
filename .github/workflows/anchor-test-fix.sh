#!/bin/bash
# Simplified Anchor CLI detection and usage
# Based on best practices: always use direct binary path when available

export PATH="$HOME/.avm/bin:$PATH"

ANCHOR_CMD=""

# Priority 1: Direct binary path (most reliable, doesn't need avm config)
if [ -f "$HOME/.avm/versions/0.30.1/anchor" ]; then
  if "$HOME/.avm/versions/0.30.1/anchor" --version >/dev/null 2>&1; then
    ANCHOR_CMD="$HOME/.avm/versions/0.30.1/anchor"
    echo "✓ Using Anchor binary directly: $ANCHOR_CMD"
  fi
fi

# Priority 2: Try to configure avm if direct binary didn't work
if [ -z "$ANCHOR_CMD" ] && command -v avm >/dev/null 2>&1; then
  echo "Attempting to configure avm..."
  if yes | avm use 0.30.1 >/dev/null 2>&1; then
    if command -v anchor >/dev/null 2>&1 && anchor --version >/dev/null 2>&1; then
      ANCHOR_CMD="anchor"
      echo "✓ Using anchor via avm wrapper"
    fi
  fi
fi

# Priority 3: Fallback to direct binary even if avm config failed
if [ -z "$ANCHOR_CMD" ] && [ -f "$HOME/.avm/versions/0.30.1/anchor" ]; then
  ANCHOR_CMD="$HOME/.avm/versions/0.30.1/anchor"
  echo "✓ Fallback: Using direct binary: $ANCHOR_CMD"
fi

# Verify
if [ -z "$ANCHOR_CMD" ]; then
  echo "ERROR: Cannot find Anchor CLI"
  echo "Debug:"
  ls -la "$HOME/.avm/versions/0.30.1/" 2>&1 || echo "  versions/0.30.1/ not found"
  ls -la "$HOME/.avm/bin/" 2>&1 || echo "  bin/ not found"
  avm list 2>&1 || echo "  avm not available"
  exit 1
fi

echo "Testing: $ANCHOR_CMD --version"
if $ANCHOR_CMD --version; then
  echo "✓ Anchor CLI verified"
  exit 0
else
  echo "ERROR: Anchor CLI failed"
  exit 1
fi

