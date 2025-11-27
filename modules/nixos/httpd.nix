{
  services.httpd = {
    enable = true;
    documentRoot = "/home/dylandy/GOP/pancake-combo/build/tmp/deploy/images/rezi-touchscreen-imx8/";
    extraConfig = ''
      <Directory "/home/dylandy/GOP/pancake-combo/build/tmp/deploy/images/rezi-touchscreen-imx8/ostree_repo">
          Options Indexes FollowSymLinks
          AllowOverride None
          Require all granted
      </Directory>
    '';
  };
  # Optional: open port 80 if using firewall
  networking.firewall.allowedTCPPorts = [ 80 ];
}
