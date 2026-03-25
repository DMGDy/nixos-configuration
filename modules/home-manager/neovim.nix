{ pkgs, config, ... }:

{
  programs.neovim = {
    enable = true;
    defaultEditor = true;
    extraConfig = ''
      syntax on
      set number
      set relativenumber
      let g:airline_theme='deus'
      set tabstop=2
      set shiftwidth=2
      set softtabstop=2
      set expandtab
      
      let g:indentLine_char='|'
    '';
    ];
  };
}
