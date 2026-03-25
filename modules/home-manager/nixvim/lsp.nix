{
  programs.nixvim.plugins.lsp = {
    enable = true;

    keymaps = {
      # Show hover documentation
      lspBuf = {
        K = "hover";
        gd = "definition";
        gD = "declaration";
        gi = "implementation";
        gr = "references";
        "<leader>rn" = "rename";
        "<leader>ca" = "code_action";
      };
      diagnostic = {
        "[d" = "goto_prev";
        "]d" = "goto_next";
        "<leader>e" = "open_float";
      };
    };

    servers = {

      clangd = {
        enable = true;
        autostart = true;
      };

      pyright = {
        enable = true;
        autostart = true;
      };

#      pylsp = {
#        enable = true;
#        autostart = true;
#      };

      bashls = {
        enable = true;
        autostart = true;
      };

      gopls = {
        enable = true;
        autostart = true;
      };

      texlab = {
        enable = true;
        autostart = true;
      };

      rust_analyzer = {
        enable = true;
        autostart = true;
        installCargo = true;
        installRustc = true;
      };

      html = {
        enable = true;
        autostart = true;
      };

      jdtls = {
        enable = true;
        autostart = true;
      };

      # Nix language server
      nil_ls = {
        enable = true;
        autostart = true;
      };

      # Lua (for neovim config editing)
      lua_ls = {
        enable = true;
        autostart = true;
      };

      # TypeScript/JavaScript
      ts_ls = {
        enable = true;
        autostart = true;
      };

      # CSS
      cssls = {
        enable = true;
        autostart = true;
      };

      # JSON
      jsonls = {
        enable = true;
        autostart = true;
      };

      # YAML
      yamlls = {
        enable = true;
        autostart = true;
      };

    };
  };
}
