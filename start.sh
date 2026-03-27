#!/bin/bash
cd "/Users/macbook/Claude Code/productivity-tool"
export PATH="$HOME/node/bin:$PATH"
exec /Users/macbook/node/bin/node node_modules/.bin/vite --port 5174 --host
