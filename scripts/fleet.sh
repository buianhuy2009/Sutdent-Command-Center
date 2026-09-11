#!/bin/zsh
# Fleet controls for the opencode commander/worker chain.
# Usage: ./scripts/fleet.sh {start|stop|status|logs|merge}
cd "$(dirname "$0")/.." || exit 1

DIRECTIVE="Run continuous open-ended improvement focused on anything users and judges can see and feel - new features and sections first, plus UI, UX, and polish. Fix security issues only if critical (remote code execution, auth bypass, exposure of real user data); skip hardening and non-critical security work. Keep up to 5 orders active at all times, rolling: as each completes, ideate and dispatch the next. Track all in .opencode/ORDERS.md. Stop only if .opencode/STOP exists."

case "$1" in
  start)
    rm -f .opencode/STOP
    caffeinate -i nohup opencode run --auto --agent commander "$DIRECTIVE" > commander.log 2>&1 &
    echo "commander launched, pid $!"
    echo "monitor: ./scripts/fleet.sh logs"
    ;;
  stop)
    touch .opencode/STOP
    pkill -f "opencode run --agent commander" 2>/dev/null
    echo "stop signal sent (ledger: .opencode/ORDERS.md)"
    ;;
  status)
    echo "--- process ---"
    ps aux | grep "[o]pencode run" || echo "not running"
    echo "--- ledger ---"
    tail -12 .opencode/ORDERS.md
    echo "--- worktrees ---"
    git worktree list
    ;;
  logs)
    tail -f commander.log
    ;;
  merge)
    opencode run --agent merger "merge this session"
    ;;
  *)
    echo "usage: ./scripts/fleet.sh {start|stop|status|logs|merge}"
    exit 1
    ;;
esac
