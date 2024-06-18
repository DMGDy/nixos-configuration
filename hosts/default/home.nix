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
      # monitor scaling down since default is 2
      monitor = "eDP-1,2256x1504@59.999,0x0,1.175";

      "$mod" = "Alt";
      "debug:disable_logs" = "false";

      bind = [
	# open kitty
        "SHIFT_ALT, Return, exec, kitty"

	# close focused client
	"SHIFT_ALT, C, killactive"

	# close hyprland session
	"SHIFT_ALT, Q, exit"

	# move focused client
	"Alt, J, movefocus, l"
	"Alt, K, movefocus, r"
	"Alt, H, movefocus, d"
	"Alt, L, movefocus, u"

	# switch workspaces
	"Alt, 1, workspace, 1"
	"Alt, 2, workspace, 2"
	"Alt, 3, workspace, 3"
	"Alt, 4, workspace, 4"
	"Alt, 5, workspace, 5"
	"Alt, 6, workspace, 6"
	"Alt, 7, workspace, 7"
	"Alt, 8, workspace, 8"
	"Alt, 9, workspace, 9"

	# switch between previous workspace
	"Alt, Tab,workspace, previous"

	# toggle floating client
	"Alt, F, togglefloating" 

	# move focused client to workspace
	"SHIFT_ALT, 1, movetoworkspace, 1"
	"SHIFT_ALT, 2, movetoworkspace, 2"
	"SHIFT_ALT, 3, movetoworkspace, 3"
	"SHIFT_ALT, 4, movetoworkspace, 4"
	"SHIFT_ALT, 5, movetoworkspace, 5"
	"SHIFT_ALT, 6, movetoworkspace, 6"
	"SHIFT_ALT, 7, movetoworkspace, 7"
	"SHIFT_ALT, 8, movetoworkspace, 8"
	"SHIFT_ALT, 9, movetoworkspace, 9"

	# make current client fullscreen
	"Alt, Space, fullscreen"

	# make focused client to master
	"Alt, Return, movewindow, l"

	# TODO resize focused client
	"SHIFT_ALT, H, resizeactive, -15 0"
	"SHIFT_ALT, L, resizeactive, 15 0"
	"SHIFT_ALT, K, resizeactive, 0 15"
	"SHIFT_ALT, J, resizeactive, 0 -15"

      ];
      bindm = [
        "ALT, mouse:272, movewindow"
	"ALT, mouse:273, resizewindow"
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

  programs.zsh = {
    enable = true;

    autosuggestion.enable = true;
    enableCompletion = true;
    syntaxHighlighting.enable;

    shellAliases = {
      ls = "ls --color=auto";
      shutdown = "sudo shutdown -h now";
    };

    history = {
      size  = 50000;
      path = "/home/dylandy/.zsh_history";
    };

    oh-my-zsh = {
      enable = true;
      plugins = [
        "git";
        "colored-man-pages";
        "fzf"
      ];
        theme = "agnoster";
      };
    };
    
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
