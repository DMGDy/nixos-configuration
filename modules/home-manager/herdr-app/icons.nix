{ pkgs }:

# The discord layout's icons, from FOSS icon sets rather than drawn by hand:
# - Lucide (ISC, https://lucide.dev): the interface's icons under the names
#   the mods use (mods/discord-kit/icons/<name>.svg), and the whole set
#   (lucide/, with index.json) for server pictures.
# - Simple Icons (CC0 project, https://simpleicons.org): brand logos (brands/,
#   with index.json: slug -> { title, hex }, the brand's own color) for server
#   pictures. Some logos carry their owners' terms, so like the avatars they're
#   fetched at build time and not kept in this public repo.
let
  lucide = pkgs.fetchurl {
    url = "https://registry.npmjs.org/lucide-static/-/lucide-static-1.70.0.tgz";
    hash = "sha256-PR8J3xxGir5RLubWWW2w3Hc/pGxhBQ42Xwxf7lEg8Wo=";
  };
  simple = pkgs.fetchurl {
    url = "https://registry.npmjs.org/simple-icons/-/simple-icons-16.36.0.tgz";
    hash = "sha256-IGnY5oLdo6oF+nHeNsCrF5hOYtK9NNcILEqF4GkbQjU=";
  };

  # The mods' icon names -> Lucide's.
  names = {
    archive = "archive"; bell = "bell"; cat = "cat"; check = "check"; chev = "chevron-down";
    compass = "compass"; crown = "crown"; eye = "eye"; fish = "fish"; flower = "flower";
    forum = "messages-square"; gear = "settings"; gift = "gift"; hand = "hand"; hash = "hash";
    headset = "headphones"; heart = "heart"; home = "house"; inbox = "inbox"; members = "users";
    merge = "git-merge"; mic = "mic"; nitro = "gem"; paw = "paw-print"; pin = "pin"; plus = "plus";
    popout = "external-link"; rocket = "rocket"; screen = "monitor"; search = "search"; smile = "smile";
    sparkle = "sparkles"; speaker = "volume-2"; star = "star"; sticker = "sticker";
    terminal = "square-terminal"; thread = "message-square-text"; x = "x"; yarn = "volleyball";
  };

  ui = pkgs.runCommand "discord-icons" { } ''
    tar xzf ${lucide} package/icons
    mkdir -p $out
    ${pkgs.lib.concatStrings (pkgs.lib.mapAttrsToList (mine: theirs: ''
      cp package/icons/${theirs}.svg $out/${mine}.svg
    '') names)}
  '';

  lucideAll = pkgs.runCommand "lucide-icons" { nativeBuildInputs = [ pkgs.jq ]; } ''
    tar xzf ${lucide} package/icons
    mkdir -p $out
    cp package/icons/*.svg $out/
    ls package/icons | sed -n 's/\.svg$//p' | jq -R . | jq -sc . > $out/index.json
  '';

  brands = pkgs.runCommand "simple-icons" { nativeBuildInputs = [ pkgs.jq ]; } ''
    tar xzf ${simple} package/icons package/data
    mkdir -p $out
    cp package/icons/*.svg $out/
    jq -c 'map({ key: .slug, value: { title, hex } }) | from_entries' package/data/simple-icons.json > $out/index.json
  '';
in
{
  "mods/discord-kit/icons" = ui;
  "mods/discord-kit/lucide" = lucideAll;
  "mods/discord-kit/brands" = brands;
}
