{ pkgs, config, ... }:

{
  programs.zsh = {
    enable = true;

    dotDir = ".zshdir/";
    autosuggestion.enable = true;
    enableCompletion = true;
    syntaxHighlighting.enable = true;

    shellAliases = {
      ls = "ls --color=auto";
      shutdown = "sudo shutdown -h now";
    };

    history = {
      size  = 50000;
      path = "/home/dylandy/.zshdir/.zsh_history";
    };

    initExtraFirst = ''
        pfetch
        VI_MODE_SET_CURSOR=true
        DISABLE_FZF_AUTO_COMPLETION="false"
    '';
    oh-my-zsh = {
      enable = true;
      plugins = [
        "git"
        "colored-man-pages"
        "fzf"
        "vi-mode"
      ];
      custom = "/home/dylandy/.zshdir/oh-my-zsh/themes";
      theme = "agnoster_custom";

    };
  };
}
