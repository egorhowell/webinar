#!/usr/bin/env bash
# Copies images from your existing pages into ./assets so the new site doesn't
# depend on them. Run once BEFORE deploying / switching DNS.
set -e
cd "$(dirname "$0")/assets"

# From webinar.hiredindata.com (current Carrd page)
for f in image01 image02 image03 image04 image05 image06 image13 image14 card; do
  curl -fsSL -o "$f.jpg" "https://webinar.hiredindata.com/assets/images/$f.jpg?v=8bc49f10" && echo "✓ $f.jpg"
done

# From egor.hiredindata.com (logos, client headshots, wins)
grep -o 'data-remote="https://egor.hiredindata.com/assets/[^"]*"' ../index.html \
  | sed 's/data-remote="https:\/\/egor.hiredindata.com\/assets\///; s/"$//' | sort -u \
  | while read -r path; do
      mkdir -p "$(dirname "$path")"
      curl -fsSL -o "$path" "https://egor.hiredindata.com/assets/$path" && echo "✓ $path"
    done
