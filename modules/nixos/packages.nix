{ config, pkgs, ... }:
# system packages 
{
  environment.systemPackages = with pkgs; [
    kitty
    git
    tree
    home-manager
    xdg-desktop-portal-hyprland
    openssh
    xwayland
    tmux
    dunst
    eww
    pipewire
    rtkit
    firefox
    gtk3
    mako
    wl-clipboard
    alacritty
    wezterm
    zsh
    mako
    foot
    discord
    pavucontrol
    tig
    powerline
    powerline-fonts
    oh-my-zsh
    fzf
    fzf-zsh
    silver-searcher
    ripgrep
    nerdfonts
    nerdfetch
    neovide
    wpgtk
    wallust
    swww
    dash
    pfetch-rs
    hyprshot
    catppuccin-sddm
    bat
    python3Full
    gccgo
    libgcc
    gnumake
    clang
    cmake
    go
    nodejs_22
    brightnessctl
    coreutils-full
    file
    tofi
    catppuccin-sddm-corners
    rustc
    cargo
    unicode-paracode
    man-pages
    iw
    pulseaudioFull
    spotify
    spotifyd
    libinput
    btop
    blueman
    dconf
    whatsapp-for-linux
    whatsapp-emoji-font
    nchat
    socat
    gdb
    valgrind
    xournalpp
    perf-tools
    wayfarer
    stm32cubemx
    stm32flash
  ];

}
