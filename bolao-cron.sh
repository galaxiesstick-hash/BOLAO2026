#!/bin/bash
CRON_SECRET='HAPj7iYMc5MVJRk0i6h6BMa2rZV11TryCLGZ16cx+os='
APP='http://127.0.0.1:3005'
ACTION=$1

curl -sf -X POST "$APP/api/cron/${ACTION}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  >> /var/log/bolao-cron.log 2>&1

echo "[$(date '+%Y-%m-%d %H:%M:%S')] ${ACTION}: exit=$?" >> /var/log/bolao-cron.log
