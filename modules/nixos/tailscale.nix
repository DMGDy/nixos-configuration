{
  services.tailscale = {
    enable = true;
    openFirewall = true;
    # Keep the workstation's corporate split DNS unchanged.
    extraSetFlags = [ "--accept-dns=false" "--ssh" ];
  };
}
