{ config, pkgs, inputs, lib, ... }:

{
  imports = [
    inputs.stylix.homeManagerModules.stylix
    ./../../modules/home-manager/tofi.nix
    ./../../modules/home-manager/hyprland.nix
    ../../modules/home-manager/stylix.nix
#    ../../modules/home-manager/eww.nix
    ../../modules/home-manager/tmux.nix
#    ../../modules/home-manager/kitty.nix
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
    };

    history = {
      share = true;
      size  = 50000;
      path = "/home/dylandy/.zshdir/.zsh_history";
      ignoreDups = true;
      expireDuplicatesFirst = true;
    };
    historySubstringSearch.enable = true;

    initExtra= ''
      VI_MODE_SET_CURSOR=true
      bindkey '^[[A' history-substring-search-up # or '\eOA'
      bindkey '^[[B' history-substring-search-down # or '\eOB'
      HISTORY_SUBSTRING_SEARCH_ENSURE_UNIQUE=1
      '';

    initExtraFirst = ''
      setopt PROMPT_SUBST
      setopt norcs

# PROMPT='%F{white}┌%f%F{white}[%f%F{magenta}%n%f%F{white}@%f%F{cyan}%m%f%F{white}]%f%F{8}::%f%F{white}[%f%F{blue}%~%f%F{white}]%f%F{8}::$(git_super_status) 
      PROMPT='%F{white}┌%f%F{white}[%f%F{magenta}%n%f%F{white}@%f%F{cyan}%m%f%F{white}]%f%F{8}::%f%F{white}[%f%F{blue}%~%f%F{white}]%f%F{8}
    %F{white}└%f%F{white}[%f%F{yellow}$%f%F{white}]%f%F{green}❯%f '

# Right prompt for additional information (e.g., time)
      RPROMPT='%F{green}$pr_return%f'
      pfetch
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
