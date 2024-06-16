{ config, pkgs, lib, inputs, ... }:

{
  environment.systemPackages = with pkgs; [
    fire-code-nerdfont
    ubuntu_font_family
  ];
}

