#!/usr/bin/env bash
set -euo pipefail

is_compatible_node() {
  node -e "process.exit(typeof require('node:util').styleText === 'function' ? 0 : 1)"
}

if ! is_compatible_node; then
  if [ -s "${HOME}/.nvm/nvm.sh" ]; then
    # nvm can reference MANPATH; define it to avoid nounset failures.
    export MANPATH="${MANPATH-}"
    # Use the app's expected Node version if current Node is too old.
    # shellcheck disable=SC1090
    . "${HOME}/.nvm/nvm.sh"
    nvm use 22.11.0 >/dev/null 2>&1 || nvm install 22.11.0 >/dev/null 2>&1
  fi
fi

if ! is_compatible_node; then
  echo "Error: Incompatible Node.js version."
  echo "Use Node >=20.19.4 (recommended: 22.11.0)."
  exit 1
fi

"$@"
