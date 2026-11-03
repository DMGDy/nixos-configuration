{ config, pkgs, ... }:

{
  # Enable the Nginx service
  services.nginx = {
    user = "dylandy";
    group = "users";
    enable = true;
    additionalModules = [ pkgs.nginxModules.fancyindex ];

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
          fancyindex on;
          fancyindex_exact_size off;
          fancyindex_localtime on;
          fancyindex_default_sort date_desc;
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

        # Not for HTTP: AllProjects symlinks expose every repo in ~; build-diff
        # reads them from disk. Same for its SQLite DBs and ask logs.
        # (2026-11-03: access logs showed only local hits on these paths.)
        locations."^~ /AllProjects".extraConfig = "deny all;";
        locations."^~ /build-diff_logs".extraConfig = "deny all;";
        locations."~ \\.db(-wal|-shm|-journal)?$".extraConfig = "deny all;";
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
