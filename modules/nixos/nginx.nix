{ config, ... }:

{
# Enable the Nginx service
  services.nginx = {
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

# Server configuration
        extraConfig = ''
# Directory to serve files from
          root /var/www/html;

# Enable directory listing
        autoindex on;
        autoindex_exact_size off;
        autoindex_localtime on;
        autoindex_format html;

# Security: prevent access to hidden files
        location ~ /\. {
          deny all;
          access_log off;
          log_not_found off;
        }

# Main location block
        location / {
          try_files $uri $uri/ =404;

# Enable downloads
          add_header Content-Disposition 'inline';

# MIME type handling
          location ~* \.(txt|log|md)$ {
            add_header Content-Type text/plain;
          }

          location ~* \.(json)$ {
            add_header Content-Type application/json;
          }
        }

# Optional: Upload endpoint (if you want to allow uploads)
# Uncomment and configure as needed
# location /upload {
#   client_max_body_size 100M;
#   proxy_request_buffering off;
#   # Add your upload handling here
# }
        '';
      };
    };
  };
# Open firewall port
  networking = {
    firewall= {
      allowedTCPPorts = [ 80  444 8080 8000 ];
      allowedUDPPorts = [ 5353 ];
    };
  };
}
