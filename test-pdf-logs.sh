#!/bin/bash
# Monitorar logs do servidor
echo "Aguardando geração de PDF..."
tail -f /proc/$(pgrep -f "tsx watch server/index.ts" | head -1)/fd/1 2>/dev/null | grep "PDF DEBUG" &
TAIL_PID=$!
sleep 30
kill $TAIL_PID 2>/dev/null
