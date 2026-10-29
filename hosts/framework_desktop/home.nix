{ username ? "dylandy" }:
{ config, pkgs, inputs, lib, ... }:

let
  colors = config.programs.kitty.settings;
in
{
  imports = [
    inputs.nixvim.homeModules.nixvim
    inputs.stylix.homeModules.stylix
    ./../../modules/home-manager/fuzzel.nix
    ./../../modules/home-manager/hyprland.nix
    ./../../modules/home-manager/xdg-apps.nix
    ./../../modules/home-manager/epic-bar.nix
    ../../modules/home-manager/nixvim.nix
    ../../modules/home-manager/stylix.nix
#    ../../modules/home-manager/eww.nix
    ../../modules/home-manager/tmux.nix
    ../../modules/home-manager/ghostty.nix
    ../../modules/home-manager/kitty.nix
    ../../modules/home-manager/fzf-tab.nix
  ];

  hyprland = {
    modifier = "SUPER";
    monitors.fallbackMode = "highres";
    scratchpadCommand = lib.escapeShellArgs [
      "${config.programs.tmux.package}/bin/tmux"
      "new-session" "-A" "-s" "jira-scratchpad"
      "-c" "${config.home.homeDirectory}/Other/jira-tui"
      "./target/release/jira-tui"
    ];
  };

  stylix.enable = true;
  stylix.polarity = lib.mkForce "light";
  stylix.base16Scheme = lib.mkForce (lib.mapAttrs (_: lib.removePrefix "#") {
    base00 = colors.background;
    base01 = colors.inactive_tab_background;
    base02 = colors.selection_background;
    base03 = colors.inactive_border_color;
    base04 = colors.color8;
    base05 = colors.foreground;
    base06 = colors.color7;
    base07 = colors.color15;
    base08 = colors.color1;
    base09 = "#c57339";
    base0A = colors.color3;
    base0B = colors.color2;
    base0C = colors.color6;
    base0D = colors.url_color;
    base0E = colors.color5;
    base0F = colors.inactive_tab_foreground;
  });
  dconf.settings."org/gnome/desktop/interface".color-scheme = "prefer-light";

  home.username = username;
  home.homeDirectory = "/home/${username}";
  home.preferXdgDirectories = true;
  home.sessionPath =
    [
      "$HOME/.cargo/bin/"
      "$HOME/Scripts/"
      "$HOME/.local/bin"
    ];

  xdg = {
    configHome = "/home/${username}/.config";
    userDirs = {
      enable = true;
      setSessionVariables = true;
      pictures = "$~/Pictures";
      download = "$~/Downloads";
    };
  };

  programs.starship = { 
    enable = true;
    settings = {
      hostname = {
        ssh_only=false;
        ssh_symbol="🔐 ";
        format="[$ssh_symbol$hostname]($style) in ";
      };
      directory = {
        truncation_length = 0;
        truncate_to_repo = true;
      };
      git_commit= {
        disabled = false;
        only_detached = false;
        commit_hash_length = 8;
        tag_symbol = "󰜘";
      };

      username = {
        disabled = false;
        show_always = true;
        format="[$user]($style) using ";
      };
    };
  };
  programs.zsh = {
    enable = true;

    dotDir = "${config.home.homeDirectory}/.zshdir/";
    autosuggestion.enable = true;
    enableCompletion = true;
    syntaxHighlighting.enable = true;

    shellAliases = {
      ipa="ip -brief -4 a";
      ls = "ls --color=auto";
      shutdown = "sudo shutdown -h now";
      nix-reflake= "nix-reflake() { sudo nixos-rebuild switch --flake .#$1 };nix-reflake";
      yoctobuilder = "docker run -it --rm --dns 10.94.2.200 --dns 10.86.2.200 --dns-search ds.resideo.com --dns-search resideo.com -v $PWD:/home/worker/building -v $HOME/.ssh:/home/worker/.ssh -v /var/www/html:/var/www/html gop-docker-stable-local.artifactory.softwaretools.resideo.com/yoctobuilder:22.04.11";
    };

    history = {
      share = true;
      size  = 50000;
      ignoreDups = true;
      expireDuplicatesFirst = true;
    };
    historySubstringSearch.enable = true;

    initContent = lib.mkBefore ''
      VI_MODE_SET_CURSOR=true
      bindkey '^[[A' history-substring-search-up # or '\eOA'
      bindkey '^[[B' history-substring-search-down # or '\eOB'
      HISTORY_SUBSTRING_SEARCH_ENSURE_UNIQUE=1
      pfetch
      eval "$(starship init zsh)"
      '';

    antidote = {
      enable = true;
      plugins = [
          "jeffreytse/zsh-vi-mode"
          "zpm-zsh/colors"
          "zpm-zsh/figures"
          "unixorn/fzf-zsh-plugin"
      ];
    };

  };
  home.stateVersion = "24.05"; # Please read the comment before changing.

  # Home Manager is pretty good at managing dotfiles. The primary way to manage
  # plain files is through 'home.file'.
  home.file = {

   };

  programs.home-manager.enable = true;
}
