#!/bin/sh
set -e

cmd="${1:-bot}"
shift 2>/dev/null || true

case "$cmd" in
  bot)
    exec node dist/core/main.js "$@"
    ;;
  worker)
    exec node dist/worker.js "$@"
    ;;
  *)
    echo "Error: unknown command '$cmd'" >&2
    echo "Valid commands: bot, worker" >&2
    exit 1
    ;;
esac
