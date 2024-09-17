{
  programs.nixvim.plugins = {
    airline = {
      enable = true;
      settings = {
        powerline_fonts = false;
      };
    };


    nvim-autopairs.enable  = true;
    indent-blankline.enable = true;
    markdown-preview= {
      enable = true;
      settings = {
        autostart = true;
        auto_start = true;
        browser = "chromium";
      };
    };
    transparent.enable = true;

    treesitter = {
      enable = true;
      nixvimInjections = true;
      folding = true;
      settings.indent.enabled= true;
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
      enable = true;
      keymap.windowManagement = {
        bigger = ["+"];
        smaller = ["-"];
        refresh = ["<c-r>"];

      };
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
