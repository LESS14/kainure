#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
PROJECT_ROOT="$(readlink -f "$SCRIPT_DIR/../../")"
OUTPUT_DIR="$PROJECT_ROOT/compiled/Linux"

mkdir -p "$OUTPUT_DIR"

echo "Building Docker image..."
docker build --no-cache -t kainure-builder-x86 "$SCRIPT_DIR"

echo "Compiling..."
docker run --rm \
    -v "$PROJECT_ROOT":/workspace \
    -w /workspace \
    kainure-builder-x86 \
    /bin/bash -c "
        rm -rf compiled/Linux/build_temp && \
        cmake -S src -B compiled/Linux/build_temp -DCMAKE_BUILD_TYPE=Release -Wno-dev && \
        cmake --build compiled/Linux/build_temp -j\$(nproc) && \
        rm -rf compiled/Linux/build_temp
    "

echo "Cleaning Docker..."
docker rmi -f kainure-builder-x86 > /dev/null 2>&1
docker builder prune -f --filter "until=1m" > /dev/null 2>&1

echo "Completed: compiled/Linux/Kainure.so"