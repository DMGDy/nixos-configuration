#!/usr/bin/env bash
# Fetch the Copland OS boot screen from Serial Experiments Lain and turn it
# into the lain lock screen's background frames. The show's artwork must not
# be committed (this repo is public), so everything lands in ./assets, which
# .gitignore excludes; without it the lock screen uses its generated frames.
#
#   modules/home-manager/hyprlock/lain-assets.sh [image-url]
#
# Run it once per machine. hyprlock picks the frames up on the next lock; no
# rebuild needed.
set -euo pipefail

url=${1:-https://lain.wiki/images/5/53/CoplandOS.png}
dir="$(cd "$(dirname "$0")" && pwd)/assets"
mkdir -p "$dir"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

magick=(magick)
command -v magick >/dev/null || magick=(nix shell nixpkgs#imagemagick -c magick)

curl -fsSL -A 'Mozilla/5.0' -o "$dir/source.png" "$url"
navy=$("${magick[@]}" "$dir/source.png" -crop 1x1+5+5 -format '%[hex:p{0,0}]' info:)

W=1920 H=1080
# Trim the source's dark border, fill the screen height, soften its own
# scanlines so they don't beat against the new ones, and pad the sides with
# the screen's navy.
"${magick[@]}" "$dir/source.png" -shave 3x3 -filter Lanczos -resize x$H \
  -morphology Convolve '1x5:0.2,0.2,0.2,0.2,0.2' \
  -background "#$navy" -gravity center -extent ${W}x$H "$tmp/base.png"
# Native-resolution scanlines and a soft vignette.
"${magick[@]}" -size 1x3 xc:none -fill 'rgba(0,0,0,0.30)' -draw 'point 0,2' \
  -write mpr:s +delete -size ${W}x$H tile:mpr:s "$tmp/scan.png"
"${magick[@]}" -size ${W}x$H radial-gradient:'rgba(0,0,0,0)'-'rgba(0,0,0,0.45)' "$tmp/vig.png"
# The logo's glow, added back at three strengths: hyprlock cross-fades
# between the frames once a second, so the logo breathes.
"${magick[@]}" "$tmp/base.png" -blur 0x28 "$tmp/glow.png"
for i in 0 1 2; do
  "${magick[@]}" "$tmp/base.png" \
    \( "$tmp/glow.png" -alpha set -channel A -evaluate set $((15 + i * 20))% +channel \) \
    -compose screen -composite \
    -seed $((i * 7 + 3)) -attenuate 0.18 +noise Gaussian \
    "$tmp/scan.png" -compose over -composite "$tmp/vig.png" -composite \
    -quality 92 "$dir/frame$i.jpg"
done
echo "wrote $dir/frame{0,1,2}.jpg"
