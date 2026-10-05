#!/usr/bin/env bash
# Stop and remove the app container and its network (the opposite of ./setup.sh).
#
#   ./teardown.sh           remove container + network, keep the image for a fast rebuild
#   ./teardown.sh --purge   also remove the capella image
#
# Does not need .env. Works with the macOS system bash (3.2).
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

die() {
  printf 'teardown: error: %s\n' "$*" >&2
  exit 1
}
info() { printf '==> %s\n' "$*"; }

purge=0
case "${1-}" in
  "") ;;
  --purge) purge=1 ;;
  -h | --help)
    sed -n '2,7s/^# \{0,1\}//p' "$0"
    exit 0
    ;;
  *) die "unknown argument: $1 (try --help)" ;;
esac

command -v docker >/dev/null 2>&1 || die "docker is not installed"
docker info >/dev/null 2>&1 || die "the Docker daemon is not running"

if docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose)
elif command -v docker-compose >/dev/null 2>&1 &&
  docker-compose version --short 2>/dev/null | grep -Eq '^v?2\.'; then
  COMPOSE=(docker-compose)
else
  die "Docker Compose v2 is required (the 'docker compose' plugin or a v2 'docker-compose' binary)"
fi

if ((purge)); then
  info "Removing container, network and image"
  "${COMPOSE[@]}" down --remove-orphans --rmi all
  docker image prune --force --filter "label=org.opencontainers.image.title=capella" >/dev/null
else
  info "Removing container and network"
  "${COMPOSE[@]}" down --remove-orphans
fi

info "Capella is down"
