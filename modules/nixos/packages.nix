{ config, pkgs, ... }:
# system packages 
{
  environment.systemPackages = with pkgs; [
    kitty
    git
    tree
    home-manager
    xdg-desktop-portal-hyprland
    openssh
    xwayland
    tmux
    dunst
    eww
    pipewire
    rtkit
    firefox
    gtk3
    mako
    wl-clipboard
    alacritty
    wezterm
    zsh
    mako
    foot
  ];
}

