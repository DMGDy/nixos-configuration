{
  programs.nixvim = {
    clipboard.providers.wl-copy.enable = true;

    opts = {
      number = true;
      relativenumber = true;
      tabstop = 2;
      shiftwidth = 2;
      autoindent = true;
      expandtab = true;
      signcolumn = "yes";
      colorcolumn= "80";

      foldlevel = 100;
      updatetime = 50;
      completeopt = ["menuone" "noselect" "noinsert"];
    };
  };
}
