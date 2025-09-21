{
  programs.nixvim.performance = {
      byteCompileLua = {
      enable = false;
      configs = false;
      initLua = true;
      nvimRuntime = true;
      plugins = false;
    };

    # increase load time by combining plugins
    combinePlugins = {
      enable = false;

      # collisions
      standalonePlugins = [
        "nvim-treesitter"
        "nvim-treesitter-textobjects"
        "vimplugin-treesitter-grammar-nix"
        "copilot.lua"
        "fuzzy"
      ];
    };
  };
}
