{ config, pkgs, inputs, lib, ... }:

{

  imports = [
    ./../../modules/home-manager/tofi.nix
    ./../../modules/home-manager/hyprland.nix
    ./../../modules/home-manager/neovim.nix
    ./../../modules/home-manager/zsh.nix
  ];

  home.username = "dylandy";
  home.homeDirectory = "/home/dylandy";
  home.preferXdgDirectories = true;

  xdg = {
    configHome = "~/.config";
    usersDirs = {
      enable = true;
      pictures = "${home.homeDirectory}/Pictures";
      download = "${home.homeDirectory}/Downloads";
    };
  };

  

  qt.enable = true;

  home.pointerCursor = {
    gtk.enable = true;

    package = pkgs.bibata-cursors;
    name = "Bibata-Modern-Classic";
    size = 24;
  };

  gtk = {
    enable = true;
    theme = {
      package = pkgs.sweet;
      name = "sweet";
    };

    iconTheme = {
      package = pkgs.gnome.adwaita-icon-theme;
      name = "Adwaita";
    };

    font ={
      name = "Sans";
      size = 16;
    };
  };

  
  
  home.stateVersion = "24.05"; # Please read the comment before changing.

  home.packages = [
     pkgs.hello

  ];

  # Home Manager is pretty good at managing dotfiles. The primary way to manage
  # plain files is through 'home.file'.
  home.file = {

   };

  home.sessionVariables = {
     EDITOR = "nvim";
  };

  programs.neovim = {
    enable = true;
    defaultEditor = true;
    extraConfig = ''
      syntax on
      set number
      set relativenumber
      let g:airline_theme='deus'
      set tabstop=2
      set shiftwidth=2
      set softtabstop=2
      set expandtab
      
      let g:indentLine_char='|'
    '';

    plugins = with pkgs.vimPlugins; [
      YouCompleteMe
      nerdtree
      nvim-autopairs
      vim-airline
      vim-airline-themes
      vim-nix
      pretty-fold-nvim
      indentLine
      markdown-preview-nvim
    ];
  };

  programs.home-manager.enable = true;
}
