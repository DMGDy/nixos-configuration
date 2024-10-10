{
  programs.nixvim.plugins = {
    airline = {
      enable = true;
      settings = {
        powerline_fonts = 0;
      };
    };


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
    transparent.enable = true;

    treesitter = {
      enable = true;
      nixvimInjections = true;
      folding = true;
      settings.indent.enabled= true;

      settings = {
        ensure_installed = "all";
        highlight.enable = true;
      };
    };

    treesitter-refactor = {
      enable = true;
      highlightDefinitions = {
        enable = true;
      };
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
    };

    noice = {
      enable = true;
      lsp = {
        hover.enabled = true;
        message.enabled = true;
        progress.enabled = true;
      };
    };
  };
}
