#!/bin/bash
# fibby — публикация лендинга на GitHub Pages.
# Запусти этот файл один раз. Дальше сайт будет обновляться сам при каждом коммите.

set -e
cd "$(dirname "$0")"

REPO="galofhfhfhg/fibby"

echo "→ 1/4. Отправляю коммиты в GitHub…"
git push origin main

echo "→ 2/4. Делаю репозиторий публичным (нужно для бесплатного Pages)…"
gh repo edit "$REPO" --visibility public --accept-visibility-change-consequences

echo "→ 3/4. Включаю GitHub Pages…"
gh api -X POST "repos/$REPO/pages" -f "build_type=workflow" 2>/dev/null \
  || gh api -X PUT "repos/$REPO/pages" -f "build_type=workflow"

echo "→ 4/4. Запускаю публикацию…"
gh workflow run pages.yml --repo "$REPO" >/dev/null 2>&1 || true

echo
echo "Готово. Сборка идёт 1–2 минуты."
echo "Адрес сайта:  https://galofhfhfhg.github.io/fibby/"
echo "Ход сборки:   https://github.com/$REPO/actions"
