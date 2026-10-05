#!/usr/bin/env bash
# Build a fresh image and (re)start the app container.
#
#   ./setup.sh
#
# 1. Refuses to run without a .env next to this script.
# 2. Parses .env (quote-aware, without `source`-ing it) to validate it and read PORT.
# 3. Tears down any running stack, rebuilds the image, starts it and waits for the healthcheck.
#
# Works with the macOS system bash (3.2).
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

ENV_FILE=.env
HEALTH_TIMEOUT=120 # seconds

die() {
  printf 'setup: error: %s\n' "$*" >&2
  exit 1
}
warn() { printf 'setup: warning: %s\n' "$*" >&2; }
info() { printf '==> %s\n' "$*"; }

# ---------------------------------------------------------------------------------------------
# .env parsing
#
# Mirrors the dotenv rules Next.js and Compose v2 use, so the values seen here match what the app
# receives:
#   KEY=value              unquoted; trailing whitespace and ` # inline comments` are dropped
#   KEY="value"            double-quoted; \" \\ and \n escapes; `#` inside quotes is literal
#   KEY='value'            single-quoted; fully literal
#   export KEY=value       `export ` prefix is allowed
#   # comment / blank      ignored; CRLF line endings are tolerated
# Multi-line quoted values are rejected rather than half-parsed.
# Parsed values are stored as DOTENV_<KEY> shell variables; nothing is exported implicitly.
# ---------------------------------------------------------------------------------------------

ltrim() { printf '%s' "${1#"${1%%[![:space:]]*}"}"; }
rtrim() { printf '%s' "${1%"${1##*[![:space:]]}"}"; }

# parse_value RAW  ->  sets PARSED_VALUE and PARSED_QUOTE (", ' or empty); returns 1 + PARSE_ERROR
parse_value() {
  local raw trimmed quote char next rest out="" i=1 closed=0
  raw=$1
  trimmed=$(ltrim "$raw")
  PARSED_QUOTE=""

  case $trimmed in
    \"* | \'*)
      quote=${trimmed:0:1}
      while ((i < ${#trimmed})); do
        char=${trimmed:i:1}
        if [[ $quote == '"' && $char == '\' ]] && ((i + 1 < ${#trimmed})); then
          next=${trimmed:i+1:1}
          case $next in
            n) out+=$'\n' ;;
            '"' | '\') out+=$next ;;
            *) out+="\\$next" ;;
          esac
          i=$((i + 2))
          continue
        fi
        if [[ $char == "$quote" ]]; then
          closed=1
          i=$((i + 1))
          break
        fi
        out+=$char
        i=$((i + 1))
      done
      if ((!closed)); then
        PARSE_ERROR="unterminated $quote quote (multi-line values are not supported)"
        return 1
      fi
      rest=$(ltrim "${trimmed:i}")
      if [[ -n $rest && $rest != \#* ]]; then
        PARSE_ERROR="unexpected text after closing quote: $rest"
        return 1
      fi
      PARSED_QUOTE=$quote
      ;;
    *)
      # Strip an inline comment (whitespace followed by #) before trimming, so `KEY= # note` is empty.
      out=${raw%%[[:space:]]#*}
      out=$(rtrim "$(ltrim "$out")")
      ;;
  esac

  PARSED_VALUE=$out
}

parse_env_file() {
  local file=$1 line lineno=0 key value
  local line_re='^[[:space:]]*(export[[:space:]]+)?([A-Za-z_][A-Za-z0-9_]*)[[:space:]]*=(.*)$'
  local errors=0

  while IFS= read -r line || [[ -n $line ]]; do
    lineno=$((lineno + 1))
    line=${line%$'\r'}
    [[ -z $(ltrim "$line") || $(ltrim "$line") == \#* ]] && continue

    if [[ ! $line =~ $line_re ]]; then
      warn "$file:$lineno: not a KEY=value line: $line"
      errors=$((errors + 1))
      continue
    fi
    key=${BASH_REMATCH[2]}
    value=${BASH_REMATCH[3]}

    if ! parse_value "$value"; then
      warn "$file:$lineno ($key): $PARSE_ERROR"
      errors=$((errors + 1))
      continue
    fi

    # Compose (and Next's dotenv-expand) substitute $VAR / ${VAR} in unquoted and double-quoted
    # values, which silently mangles secrets such as passwords containing `$`.
    if [[ $PARSED_QUOTE != "'" && $PARSED_VALUE == *'$'* ]]; then
      warn "$file:$lineno ($key): contains '\$', which will be expanded as a variable; wrap the value in single quotes if it is meant literally"
    fi

    printf -v "DOTENV_$key" '%s' "$PARSED_VALUE"
  done <"$file"

  ((errors == 0)) || die "$file has $errors invalid line(s); fix them and re-run"
}

# dotenv_get KEY  ->  prints the parsed value (empty if unset)
dotenv_get() {
  local var="DOTENV_$1"
  printf '%s' "${!var-}"
}

# ---------------------------------------------------------------------------------------------
# Docker helpers
# ---------------------------------------------------------------------------------------------

detect_compose() {
  if docker compose version >/dev/null 2>&1; then
    COMPOSE=(docker compose)
  elif command -v docker-compose >/dev/null 2>&1 &&
    docker-compose version --short 2>/dev/null | grep -Eq '^v?2\.'; then
    COMPOSE=(docker-compose)
  else
    # Compose v1 passes quotes in env_file values through literally, so it is not supported.
    die "Docker Compose v2 is required (the 'docker compose' plugin or a v2 'docker-compose' binary)"
  fi
}

# ---------------------------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------------------------

[[ -f $ENV_FILE ]] || die "$ENV_FILE not found. Create it from the template first:  cp .env.example .env"
[[ -r $ENV_FILE ]] || die "$ENV_FILE is not readable"

info "Parsing $ENV_FILE"
parse_env_file "$ENV_FILE"

[[ -n $(dotenv_get DATABASE_URL) ]] || die "DATABASE_URL is missing or empty in $ENV_FILE"

PORT=$(dotenv_get PORT)
if [[ -z $PORT ]]; then
  PORT=3000
  info "PORT not set in $ENV_FILE; using $PORT"
fi
[[ $PORT =~ ^[0-9]{1,5}$ ]] && ((10#$PORT >= 1 && 10#$PORT <= 65535)) ||
  die "PORT must be an integer between 1 and 65535 (got '$PORT')"
PORT=$((10#$PORT)) # normalise e.g. 08080 -> 8080
# Shell env takes precedence over .env in Compose interpolation, so the published port is exactly
# the value parsed above.
export PORT

command -v docker >/dev/null 2>&1 || die "docker is not installed"
docker info >/dev/null 2>&1 || die "the Docker daemon is not running"
detect_compose

info "Tearing down any existing stack"
"${COMPOSE[@]}" down --remove-orphans

info "Building image"
"${COMPOSE[@]}" build --pull

info "Starting container on port $PORT"
"${COMPOSE[@]}" up -d

# Drop the previous build's image, which is now untagged.
docker image prune --force --filter "label=org.opencontainers.image.title=capella" >/dev/null

info "Waiting for the healthcheck (up to ${HEALTH_TIMEOUT}s)"
container=$("${COMPOSE[@]}" ps -q app)
[[ -n $container ]] || die "container did not start"
elapsed=0
while :; do
  status=$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container" 2>/dev/null || echo missing)
  case $status in
    healthy) break ;;
    unhealthy | exited | dead | missing)
      "${COMPOSE[@]}" logs --tail 50 app >&2 || true
      die "container is $status (logs above)"
      ;;
  esac
  ((elapsed < HEALTH_TIMEOUT)) || {
    "${COMPOSE[@]}" logs --tail 50 app >&2 || true
    die "container not healthy after ${HEALTH_TIMEOUT}s (status: $status)"
  }
  sleep 2
  elapsed=$((elapsed + 2))
done

info "Capella is up at http://localhost:$PORT"
