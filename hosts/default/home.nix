{ config, pkgs, inputs, lib, ... }:


{
  home.username = "dylandy";
  home.homeDirectory = "/home/dylandy";

  wayland.windowManager.hyprland = {
    enable = true;
   
    plugins = [
      # inputs.hyprland-plugins.packages."${pkgs.system}".borders-plus-plus
    ];

    settings = {
      "$mod" = "SUPER";
      "debug:disable_logs" = "false";

      bind = [
        "SUPER_SHIFT, Return, exec, foot"
	"SUPER_SHIFT, C, killactive"
	"SUPER_SHIFT, Q, exit"
	"SUPER_SHIFT, F, exec, firefox"
      ];
      # "plugin:borders-plus-plus" = {
      #   add_borders = 1;

      #   # can add up to 9 borders
      #   "col.border_1" = "rgb(ffffff)";
      #   "col.border_2" = "rgb(2222ff)";

      #   border_size_1 = 10;
      #   border_size_2 = -1;

      #   natural_rounding = "no";
      # };
    };
  };

  home.pointerCursor = {
    gtk.enable = true;

    package = pkgs.bibata-cursors;
    name = "Bibata-Modern-Classic";
    size = 16;
  };


  gtk = {
    enable = true;
    theme = {
      package = pkgs.flat-remix-gtk;
      name = "Flat-Remix-GTK-Grey-Darkest";
    };

    iconTheme = {
      package = pkgs.gnome.adwaita-icon-theme;
      name = "Adwaita";
      };

      font = {
        name = "Sans";
        size = 16;
     };
    };

  programs.zsh = {
    enable = true;
    enableAutosuggestions = true;
    enableCompletion = true;
    envExtra = ''
    '';
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

  programs.home-manager.enable = true;
}
