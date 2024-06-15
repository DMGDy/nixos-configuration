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
	# open kitty
        "SUPER_SHIFT, Return, exec, kitty"

	# close focused client
	"SUPER_SHIFT, C, killactive"

	# close hyprland session
	"SUPER_SHIFT, Q, exit"

	# move focused client
	"SUPER, J, movefocus, l"
	"SUPER, K, movefocus, r"
	"SUPER, H, movefocus, d"
	"SUPER, L, movefocus, u"

	# switch workspaces
	"SUPER, 1, workspace, 1"
	"SUPER, 2, workspace, 2"
	"SUPER, 3, workspace, 3"
	"SUPER, 4, workspace, 4"
	"SUPER, 5, workspace, 5"
	"SUPER, 6, workspace, 6"
	"SUPER, 7, workspace, 7"
	"SUPER, 8, workspace, 8"
	"SUPER, 9, workspace, 9"

	# cycle through client layouts
	"SUPER, Tab, cyclenext"

	# move focused client to workspace
	"SUPER_SHIFT, 1, movetoworkspace, 1"
	"SUPER_SHIFT, 2, movetoworkspace, 2"
	"SUPER_SHIFT, 3, movetoworkspace, 3"
	"SUPER_SHIFT, 4, movetoworkspace, 4"
	"SUPER_SHIFT, 5, movetoworkspace, 5"
	"SUPER_SHIFT, 6, movetoworkspace, 6"
	"SUPER_SHIFT, 7, movetoworkspace, 7"
	"SUPER_SHIFT, 8, movetoworkspace, 8"
	"SUPER_SHIFT, 9, movetoworkspace, 9"

	# toggle floating clients
	"SUPER, Space, togglefloating"

	# make focused client to master
	"SUPER, Return, swapwithmaster"

	# TODO resize focused client
	
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
