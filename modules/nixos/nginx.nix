{ config, ... }:

{
  # Enable the Nginx service
  services.nginx = {
    user = "dylandy";
    group = "users";
    enable = true;

    # Configure a virtual host using the default server
    virtualHosts = {
      "fileserver.local" = {
        # Listen on all interfaces
        listen = [
          { addr = "0.0.0.0"; port = 8080; }
          { addr = "[::]"; port = 8080; }
          { addr = "0.0.0.0"; port = 80; }
          { addr = "[::]"; port = 80; }
        ];

        root = "/var/www/html";

        extraConfig = ''
          autoindex on;
          autoindex_exact_size off;
          autoindex_localtime on;
          autoindex_format html;
        '';

        locations."/" = {
          extraConfig = ''
            try_files $uri $uri/ =404;
            add_header Content-Disposition 'inline';
          '';
        };

        # Block hidden files (like .git)
        locations."~ /\\.".extraConfig = ''
          deny all;
          access_log off;
          log_not_found off;
        '';
      };
    };
  };

  # Allow nginx to access home directories (disabled by default for security)
  systemd.services.nginx.serviceConfig.ProtectHome = "false";

  # Open firewall port
  networking = {
    firewall = {
      allowedTCPPorts = [ 80 444 8080 8000 ];
      allowedUDPPorts = [ 5353 ];
    };
  };
}
