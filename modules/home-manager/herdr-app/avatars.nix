{ pkgs }:

# The discord layout's avatars: anime catgirl art by the artists below, served
# by nekos.best (SFW "neko" endpoint). The repo is public and the art isn't
# ours to redistribute, so only these links are kept here; Nix downloads each
# picture and crops it to a 256px face square (crop: square side, center x and
# top y, as shares of the picture's width/height).
let
  avatar = name: { url, hash, side, x, y, artist, source }:
    pkgs.runCommand "herdr-avatar-${name}.png" {
      src = pkgs.fetchurl { inherit url hash; };
      nativeBuildInputs = [ pkgs.imagemagick ];
      meta.description = "${artist}, ${source}";
    } ''
      magick $src -gravity NorthWest \
        -crop "%[fx:w*${side}]x%[fx:w*${side}]+%[fx:w*${x}-w*${side}/2]+%[fx:h*${y}]" \
        +repage -resize 256x256 $out
    '';
  list = {
    kitten-claude = { url = "https://nekos.best/api/v2/neko/56d6163b-ac0b-4d66-9bde-9f108a3f3947.png"; hash = "sha256-1G+MCUaVU7G/b3aqpab1YypwoQPBLwkqO/aeeNtScns="; side = "0.5"; x = "0.5"; y = "0.06"; artist = "Mauve"; source = "https://www.pixiv.net/en/artworks/94484742"; };
    kitten-pi = { url = "https://nekos.best/api/v2/neko/5f29609b-df6f-48e4-abd1-84208fc7a615.png"; hash = "sha256-x3k/3Ie3ri4dvf4Jct70xf+FxclkzPE1vOTM9Vcro4o="; side = "0.5"; x = "0.5"; y = "0.06"; artist = "おうみやひなり"; source = "https://www.pixiv.net/en/artworks/101956332"; };
    kitten-codex = { url = "https://nekos.best/api/v2/neko/3eafe050-0386-48f9-a2a8-1b3b3dbefd32.png"; hash = "sha256-2lEGMdDXqqy4kRD2Pd7817psiykmsWmYd6BR0wDFdNg="; side = "0.5"; x = "0.5"; y = "0.06"; artist = "球根"; source = "https://www.pixiv.net/en/artworks/87136840"; };
    kitten-copilot = { url = "https://nekos.best/api/v2/neko/ba57884e-44f4-4372-bd8c-9d11d7807117.png"; hash = "sha256-buH/m3yT/Uqu1y0WCt4aOSR1p6ws+QOkomJIUt2RaD4="; side = "0.55"; x = "0.5"; y = "0.03"; artist = "佐伯ソラ"; source = "https://www.pixiv.net/en/artworks/130955927"; };
    kitten-default = { url = "https://nekos.best/api/v2/neko/7bf6d2d0-07a2-4160-bc2f-5fe537711e08.png"; hash = "sha256-W25PXtH4oFaE0ol7xRj93/IaV71V08IA2mp4aPTM5SQ="; side = "0.75"; x = "0.5"; y = "0.0"; artist = "冴之木瑞穂"; source = "https://www.pixiv.net/en/artworks/95839500"; };
    herder = { url = "https://nekos.best/api/v2/neko/0dfe06bb-df73-4f77-8f0a-780b977e006e.png"; hash = "sha256-I9XD2Ng5Wzy5dpiD78ZUy36zsKZj+O8MLYbeaNMm1Jc="; side = "0.55"; x = "0.5"; y = "0.04"; artist = "甘城なつき"; source = "https://www.pixiv.net/en/artworks/73263547"; };
  };
  # Animated portraits for the profile cards (a Nitro perk in Discord): SFW
  # catgirl GIFs from anime, served by nekos.life ("ngif"). Picked one by one,
  # every frame checked: that set mixes in fan service, which is left out.
  # Herdr draws only a GIF's first frame, so each becomes a folder of frames
  # (a centered 128px square, 256 colors; the card shows 80) and frames.json
  # with each frame's milliseconds, which the profile card plays; frame 00 is
  # its kitten's picture everywhere else. Every frame is kept up to 60 (past
  # that, every other one, lasting as long as the two).
  gif = n: hash:
    pkgs.runCommand "herdr-kitten-gif-${n}" {
      src = pkgs.fetchurl { url = "https://cdn.nekos.life/ngif/neko_${n}.gif"; inherit hash; };
      nativeBuildInputs = [ pkgs.imagemagick ];
    } ''
      mkdir -p all $out
      magick $src -coalesce -resize 128x128^ -gravity center -extent 128x128 +repage PNG8:all/%03d.png
      delays=($(magick identify -format "%T " $src))
      count=''${#delays[@]}
      step=$(( (count + 59) / 60 ))
      json="" k=0
      for ((i = 0; i < count; i += step)); do
        ms=0
        for ((j = i; j < i + step && j < count; j++)); do ms=$(( ms + ''${delays[j]} * 10 )); done
        (( ms < 40 )) && ms=$(( step * 60 ))
        name=$(printf "%02d.png" $k)
        cp all/$(printf "%03d" $i).png $out/$name
        json="$json''${json:+,}{\"file\":\"$name\",\"ms\":$ms}"
        k=$(( k + 1 ))
      done
      echo "[$json]" > $out/frames.json
    '';
  gifs = {
    "004" = "sha256-x5x3HA1nnwAc8PRzDQkUenEAoKQrVXwVNqT4etW4SVg=";
    "018" = "sha256-A4I49dyF5pzi6zz9hWubGZMcBo5pDW/sHSicxbLPiZE=";
    "021" = "sha256-u3zeTvs84+Zxn4aPBgi4wQKALJcZOQAzp5VpgILNjFM=";
    "049" = "sha256-+VbSGhEsncBfBsbP09uEBV3ZrwVXSdHDEHy67sZbHdU=";
    "057" = "sha256-YIpizPyb4OOXEcFmA7Xj/Ht3RUa2lDYWaPQ/jDicGho=";
    "058" = "sha256-VM8V3cI9QYRf3xYHtvJyBISJ7D8v7o10LL2wsOz67tQ=";
    "061" = "sha256-1srNGWqYcvAsogY5C5IB7a2Z50EAEJv2RGv30NGZfwM=";
    "064" = "sha256-sVfYq29ic54xV5SUWCJD9YWKuCqvNox1dDiVDnU+Wxg=";
    "081" = "sha256-9NJPxcw/n+uztVuTcj1d4YhJ/MUzVFmayDBv3D1D8Ig=";
    "083" = "sha256-d9sT5VePGt3fKh0iPgs7wSDqP1L4q9NnhJ9GeFjgHDY=";
    "090" = "sha256-h72KyW4IVC8/9Lovs/AmsKtXAI12dyRinI5u/T4HLHE=";
    "091" = "sha256-5j58O2PiQ2p2TB9waUrq6WLQni2UFRZBA82yrqb2sv4=";
    "095" = "sha256-XKsR9Hlb2RoJSLFDBdweAibNRH/nlNSWvZ+UCwnekAU=";
    "109" = "sha256-SfMug+FNevtMq9qoPaoaH6QgKHDD2+zP3ccx281qM4w=";
  };
in
pkgs.lib.mapAttrs' (name: a: pkgs.lib.nameValuePair "mods/discord-kit/avatars/${name}.png" (avatar name a)) list
// pkgs.lib.mapAttrs' (n: hash: pkgs.lib.nameValuePair "mods/discord-kit/gifs/kitten-${n}" (gif n hash)) gifs
