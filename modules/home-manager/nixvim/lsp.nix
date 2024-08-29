{
  programs.nixvim.plugins.lsp = {
    enable = true;
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

      nil-ls = {
        enable = true;
        autostart = true;
      };
      rust-analyzer = {
        enable = true;
        autostart = true;
        installCargo = true;
        installRustc = true;
      };
    };
  };
}