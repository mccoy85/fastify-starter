#!/bin/bash

set -eo pipefail

export PATH=$PATH:$(pwd)/node_modules/.bin

if ! command -v protoc-gen-es >/dev/null 2>&1; then
    echo "Error: protoc-gen-es not found in PATH. Do you need to run pnpm install?"
    exit 1
fi

protoc -I . \
    --es_out=./lib/msgs \
    --es_opt target=ts \
    protos/*.proto
