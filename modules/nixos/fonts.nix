{ config, pkgs, lib, inputs, ... }:

{
  fonts.packages = with pkgs; [
    nerd-fonts.fira-code
    nerd-fonts.ubuntu
    nerd-fonts.ubuntu-sans
    nerd-fonts.ubuntu-mono
    nerd-fonts.iosevka
    nerd-fonts.iosevka-term
    ubuntu_font_family
    noto-fonts
    noto-fonts-cjk-sans
    noto-fonts-emoji
    cascadia-code
    source-sans-pro
    ubuntu-sans
    ubuntu-classic
    nerd-font-patcher
    fira-sans
  ];
}

