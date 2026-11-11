#!/usr/bin/env bash
# Compila Rust -> WebAssembly y deja los archivos en ./wasm
# Requisitos (una sola vez):
#   curl https://sh.rustup.rs -sSf | sh
#   rustup target add wasm32-unknown-unknown
#   cargo install wasm-pack        (o: npm i -g wasm-pack)
set -euo pipefail
cd "$(dirname "$0")"
wasm-pack build rust --release --target web --out-dir ../wasm --out-name sitio_wasm
rm -f wasm/.gitignore wasm/package.json wasm/README.md
ls -lh wasm
echo "Listo. Prueba local:  python3 -m http.server 8080  ->  http://localhost:8080/wasm-demo.html"
