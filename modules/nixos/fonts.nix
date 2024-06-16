{ config, pkgs, lib, inputs, ... }:

{
  environment.systemPackages = with pkgs; [
    fira-code-nerdfont
    ubuntu_font_family
  ];
}

