{ config, pkgs, inputs, lib, ... }:

{
  imports = [
    inputs.stylix.homeManagerModules.stylix
    ./../../modules/home-manager/tofi.nix
    ./../../modules/home-manager/hyprland.nix
    ./../../modules/home-manager/zsh.nix
#    ../../modules/home-manager/nixvim.nix
    ../../modules/home-manager/stylix.nix
#    ../../modules/home-manager/eww.nix
    ../../modules/home-manager/tmux.nix
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
  home.stateVersion = "24.05"; # Please read the comment before changing.

  # Home Manager is pretty good at managing dotfiles. The primary way to manage
  # plain files is through 'home.file'.
  home.file = {

   };

  programs.home-manager.enable = true;
}
