{ username ? "dylandy" }:
{ config, pkgs, inputs, lib, ... }:

{
  imports = [
    inputs.nixvim.homeModules.nixvim
    inputs.stylix.homeModules.stylix
    ../../modules/home-manager/fuzzel.nix
    ../../modules/home-manager/hyprland.nix
    ../../modules/home-manager/nixvim.nix
    ../../modules/home-manager/stylix.nix
    ../../modules/home-manager/tmux.nix
    ../../modules/home-manager/ghostty.nix
    ../../modules/home-manager/kitty.nix
  ];

  stylix.enable = true;

  # Autumn Dark: dark counterpart of the shared Autumn Light palette in
  # modules/home-manager/kitty.nix — warm brown base, lightened fall accents.
  programs.kitty.settings = lib.mapAttrs (_: lib.mkForce) {
    background = "#1d1411";
    foreground = "#ecdcd2";
    cursor = "#e0675a";
    cursor_text_color = "#1d1411";
    selection_background = "#5a3426";
    selection_foreground = "#ecdcd2";
    url_color = "#e5845e";
    active_border_color = "#e0675a";
    inactive_border_color = "#8a6a5c";
    bell_border_color = "#e0a458";
    active_tab_background = "#5a3426";
    active_tab_foreground = "#ecdcd2";
    inactive_tab_background = "#2a1d18";
    inactive_tab_foreground = "#b89a8c";
    tab_bar_background = "#1d1411";

    color0 = "#2a1d18";
    color1 = "#e0675a";
    color2 = "#9cb86a";
    color3 = "#e0a458";
    color4 = "#e5845e";
    color5 = "#d0708f";
    color6 = "#c99a5b";
    color7 = "#d8c3b8";
    color8 = "#6e5146";
    color9 = "#f08070";
    color10 = "#b2cc80";
    color11 = "#f0bb70";
    color12 = "#f29a74";
    color13 = "#e08aa6";
    color14 = "#ddb276";
    color15 = "#f7ebe4";
  };

  # Same Autumn Dark palette for Stylix, which colors the adw-gtk3 GTK theme.
  stylix.polarity = lib.mkForce "dark";
  stylix.base16Scheme = lib.mkForce {
    base00 = "1d1411"; # background
    base01 = "2a1d18"; # lighter background
    base02 = "5a3426"; # selection
    base03 = "8a6a5c"; # comments
    base04 = "b89a8c"; # dark foreground
    base05 = "ecdcd2"; # foreground
    base06 = "f2e6df"; # light foreground
    base07 = "f7ebe4"; # lightest foreground
    base08 = "e0675a"; # red
    base09 = "c97b4a"; # orange
    base0A = "e0a458"; # yellow
    base0B = "9cb86a"; # green
    base0C = "c99a5b"; # cyan (ochre)
    base0D = "e5845e"; # blue (rust; GTK accent)
    base0E = "d0708f"; # purple (rose)
    base0F = "a8553c"; # brown
  };

  # Run the 1080p monitor at its 144Hz mode instead of the 60Hz default.
  wayland.windowManager.hyprland.settings.monitor = lib.mkBefore [
    {
      output = "DP-1";
      mode = "1920x1080@143.85";
      position = "auto";
      scale = 1.0;
    }
  ];

  home.username = username;
  home.homeDirectory = "/home/${username}";
  home.preferXdgDirectories = true;
  home.sessionPath = 
    [
      "$HOME/.cargo/bin/"
      "$HOME/Scripts/"
    ];

  xdg = {
    configHome = "/home/${username}/.config";
    userDirs = {
      enable = true;
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
    syntaxHighlighting.enable = false;

    shellAliases = {
      ls = "ls --color=auto";
      shutdown = "sudo shutdown -h now";
      nix-reflake= "nix-reflake() { sudo nixos-rebuild switch --flake .#$1 };nix-reflake";
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
          "zsh-users/zsh-autosuggestions"
          "zsh-users/zsh-syntax-highlighting"
          "unixorn/fzf-zsh-plugin"
          "Aloxaf/fzf-tab"
          "zsh-users/zsh-history-substring-search"
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
