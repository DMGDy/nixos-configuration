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
in
pkgs.lib.mapAttrs' (name: a: pkgs.lib.nameValuePair "mods/discord-kit/avatars/${name}.png" (avatar name a)) list
