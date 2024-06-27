{
  imports = [
    ./nixvim/default.nix
  ];

  programs.nixvim = {
    enable = true;
    defaultEditor = true;
  };
}
