{ config, pkgs, lib, inputs, ... }:

{
  fonts.packages = with pkgs; [
    fira-code-nerdfont
    ubuntu_font_family
    noto-fonts
    noto-fonts-cjk
    noto-fonts-emoji
    cascadia-code
  ];
}

