#!/bin/bash
set +e
pkill -9 -f "next-server" >/dev/null 2>&1
pkill -9 -f "next/dist/bin/next" >/dev/null 2>&1
pkill -9 -f ".next/dev" >/dev/null 2>&1
sleep 2
cd /home/user/PortfolioProjects/surplus-flooring-marketplace || exit 1
rm -rf .next
LOG=/tmp/claude-0/-home-user-PortfolioProjects/91641102-a8f3-5451-9b4c-3259c5422d3d/scratchpad/nextdev.log
: > "$LOG"
setsid nohup npx next dev -p 3000 > "$LOG" 2>&1 < /dev/null &
disown
for i in $(seq 1 20); do
  sleep 1
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null)
  if [ "$code" = "200" ]; then
    echo "READY after ${i}s"
    exit 0
  fi
done
echo "NOT READY, log tail:"
tail -30 "$LOG"
exit 1
