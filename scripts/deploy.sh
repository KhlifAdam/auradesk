#!/usr/bin/env bash
# Runs on the VPS, started by the deploy workflow from the deploy directory.
# Expects IMAGE_TAG and GHCR_USER, plus .env.new and .ghcr-token uploaded beside it.
set -euo pipefail
cd "$(dirname "$0")"
: "${IMAGE_TAG:?}" "${GHCR_USER:?}"

compose() { docker compose -f docker-compose.prod.yml "$@"; }

docker login ghcr.io -u "$GHCR_USER" --password-stdin < .ghcr-token
rm -f .ghcr-token

# Dump the database before anything can change it. The first deploy has nothing to dump.
mkdir -p backups
if [ -f .env ] && compose ps --status running --services | grep -qx db; then
  compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' \
    | gzip > "backups/pre-deploy-$(date +%F-%H%M%S).sql.gz"
  find backups -name 'pre-deploy-*.sql.gz' -mtime +7 -delete
fi

# The tag lives in .env so a manual `docker compose` run later targets the same version.
mv .env.new .env
echo "IMAGE_TAG=$IMAGE_TAG" >> .env

compose pull
if ! compose up -d --remove-orphans; then
  compose logs --tail 80 migrate
  exit 1
fi

# `up -d` returns before the app is ready: wait for its healthcheck.
for _ in $(seq 1 36); do
  if [ "$(compose ps --format '{{.Health}}' app)" = healthy ]; then
    docker image prune -f > /dev/null
    echo "Deployed $IMAGE_TAG"
    exit 0
  fi
  sleep 5
done
compose logs --tail 80 app
echo "App did not become healthy" >&2
exit 1
