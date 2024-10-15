{
  description = "Nixos config flake";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    hyprland.url = "git+https://github.com/hyprwm/Hyprland?submodules=1";
    home-manager = {
      url = "github:nix-community/home-manager";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    stylix.url = "github:danth/stylix";
    
    nixvim = {
      url = "github:nix-community/nixvim";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    nix-environments.url = "github:nix-community/nix-environments";
  };
  outputs = { self, nixpkgs, ... }@inputs: 
  let 
    system = "x86_64-linux";
    pkgs = import nixpkgs {
      inherit system;
      config = {
        allowUnfree = true;
      };
    };
  in
  {
    nixosConfigurations = {
      default = nixpkgs.lib.nixosSystem {
        specialArgs = { 
          inherit inputs system; 
        };
        modules = [
          inputs.home-manager.nixosModules.default
          ./hosts/default/configuration.nix
          # Custom Modules
          inputs.nixvim.nixosModules.nixvim
          ./modules/nixos/hardware.nix
        ];
      };
    };
  };
}
