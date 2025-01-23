{
  programs.nixvim.plugins = {

    airline = {
      enable = true;
      settings = {
        powerline_fonts = 1;
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
      folding = false;
      settings.indent.enabled= true;

      settings = {
        ensure_installed = "all";
        highlight= {
          enable = true;
          disable = [
            "scss"
          ];
        };
      };
    };

    treesitter-refactor = {
      enable = true;
      highlightDefinitions = {
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

    chadtree = {
      enable = false;
      keymap.windowManagement = {
        bigger = ["+"];
        smaller = ["-"];
        refresh = ["<c-r>"];

      };
    };

    neo-tree = {

      enable = true;
      enableRefreshOnWrite = true;
      usePopupsForInput = false;

      filesystem = {

        groupEmptyDirs = true;
        followCurrentFile.enabled = true;
        useLibuvFileWatcher = true;

        filteredItems = {
          hideDotfiles = false;
          hideByName = [".git"];
        };
        
      };
      window = {
        position = "float";
        popup.position = "35%";
      };
    };

    noice = {
      enable = false;
      #lsp = {
      #  hover.enabled = true;
      #  message.enabled = true;
      #  progress.enabled = true;
      #};
    };
    
    vim-css-color = {
      enable = true;
    };

  };
}
