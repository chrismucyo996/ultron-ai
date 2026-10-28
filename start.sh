#!/usr/bin/env bash
# Start Ultron AI. Installs the app's parts the first time, then opens it.
set -e
cd "$(dirname "$0")"

if ! command -v bun >/dev/null 2>&1; then
  echo "Bun is not installed yet."
  echo "Install it with:  curl -fsSL https://bun.sh/install | bash"
  echo "Then close and reopen this terminal and run ./start.sh again."
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "First run: downloading the parts Ultron needs (this takes a minute)..."
  bun install
fi

echo "Starting Ultron AI. Open the address printed above in your browser."
exec bun run dev
