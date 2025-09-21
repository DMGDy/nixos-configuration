{ config, pkgs, inputs, lib, ... }:

{
  imports = [
    inputs.nixvim.homeManagerModules.nixvim
    inputs.stylix.homeManagerModules.stylix
    ./../../modules/home-manager/tofi.nix
    ./../../modules/home-manager/hyprland.nix
    ../../modules/home-manager/nixvim.nix
    ../../modules/home-manager/stylix.nix
#    ../../modules/home-manager/eww.nix
    ../../modules/home-manager/tmux.nix
    ../../modules/home-manager/ghostty.nix
  ];

  stylix.enable = true;
  home.username = "dylandy";
  home.homeDirectory = "/home/dylandy";
  home.preferXdgDirectories = true;
  home.sessionPath = 
    [
      "$HOME/.cargo/bin/"
      "$HOME/Scripts/"
    ];

  xdg = {
    configHome = /home/dylandy/.config;
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

    dotDir = ".zshdir/";
    autosuggestion.enable = true;
    enableCompletion = true;
    syntaxHighlighting.enable = false;

    shellAliases = {
      ls = "ls --color=auto";
      shutdown = "sudo shutdown -h now";
      nix-reflake= "nix-reflake() { sudo nixos-rebuild switch --flake .#$1 };nix-reflake";
      yoctobuilder = "docker run -it --rm -v $PWD:/home/worker/building -v $HOME/.ssh:/home/worker/.ssh -v /var/www/html:/var/www/html gop-docker-stable-local.artifactory.softwaretools.resideo.com/yoctobuilder:22.04.8";
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
      '';

    initExtraFirst = ''
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
