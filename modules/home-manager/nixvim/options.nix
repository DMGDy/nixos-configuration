{
  programs.nixvim = {
    globals = {
      neovide_transparency = 0.8;
       globals.c_syntax_for_h = 1;
    };
    clipboard = {
      providers.wl-copy.enable = true;
      register="unnamedplus";
    };
    opts = {
      number = true;
      relativenumber = true;
      tabstop = 2;
      shiftwidth = 2;
      autoindent = true;
      expandtab = true;
      signcolumn = "yes";

      foldlevel = 100;
      updatetime = 50;
      completeopt = ["menuone" "noselect" "noinsert"];
    };
  };
}
