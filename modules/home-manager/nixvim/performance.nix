{
  programs.nixvim.performance = {
      byteCompileLua = {
      enable = true;
      configs = true;
      initLua = true;
      nvimRuntime = true;
      plugins = true;
    };

    # increase load time by combining plugins
    combinePlugins = {
      enable = true;

      # collisions
      standalonePlugins = [
        "nvim-treesitter"
        "nvim-treesitter-textobjects"
        "vimplugin-treesitter-grammar-nix"
      ];
    };
  };
}
