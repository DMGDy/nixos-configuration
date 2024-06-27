{
  programs.nixvim.plugins.lsp = {
    enable = true;
    servers = {

      clangd = {
        enable = true;
        autostart = true;
      };

      pylsp = {
        enable = true;
        autostart = true;
      };

      rnix-lsp = {
        enable = true;
        autostart = true;
      };

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

    };
  };
}
