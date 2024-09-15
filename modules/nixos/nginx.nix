{ config, ... }:
{
  # Enable the Nginx service
  services.nginx = {
    enable = true;
    
    # Configure a virtual host using the default server
    virtualHosts."_" = {
      default = true;
      root = "/var/www/test/";  # Replace with actual path
      
      locations."/" = {
        index = "index.html";
        tryFiles = "$uri $uri/ =404";
      };
      
      # Configure proper MIME types and caching for Wasm and JS files
      locations."~ \\.(wasm|js)$".extraConfig = ''
        types {
          application/wasm wasm;
          application/javascript js;
        }
        add_header Cache-Control "public, max-age=31536000";
      '';
      
      # Configure caching for static assets
      locations."~ \\.(ico|css|png|jpg|jpeg|gif|svg)$".extraConfig = ''
        expires max;
        add_header Cache-Control "public, max-age=31536000";
      '';
    };
  };
  # Open firewall port
  networking = {
    firewall= {
      allowedTCPPorts = [ 80  444 ];
      allowedUDPPorts = [ 5353 ];
    };
  };

}

