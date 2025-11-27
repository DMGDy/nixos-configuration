{
  programs.nixvim.plugins = {

    airline = {
      enable = true;
      settings = {
        powerline_fonts = 0;
        excluse_preview = 1;
      };
    };

    web-devicons.enable = true;
    
    nvim-autopairs.enable  = true;

    indent-blankline.enable = true;

    markdown-preview= {
      enable = true;
      settings = {
        autostart = 1;
        auto_start = 1;
        browser = "chromium";
      };
    };

    transparent.enable = false;

    treesitter = {
      enable = true;
      nixvimInjections = true;
      folding = true;
      settings.indent.enabled= true;

      settings = {
        highlight= {
          enable = true;
          disable = [
            "scss"
            "ipkg"
          ];
        };
      };
    };

    treesitter-refactor = {
      enable = true;
      settings.highlight_definitions = {
        enable = true;
      };
    };

    ts-autotag = {
      enable = false;
    };

    hmts.enable = true;

    clangd-extensions.enable = true;
    nix.enable = true;

    lspkind.enable = true;
    luasnip.enable = true;

    neo-tree = {

      enable = true;
      settings = {
        enable_refresh_on_write = true;
        use_popups_for_input = false;
        filesystem = {
          group_empty_dirs = true;
          follow_current_file.enabled = true;
          use_libuv_file_watcher = true;
          filtered_items = {
            hide_dot_files = false;
            hide_by_name = [".git"];
          };
        };
        window = {
          position = "left";
          popup.position = "35%";
        };
      };

    };

    noice = {
      enable = false;
    };
    
    vim-css-color = {
      enable = true;
    };

  };
}
