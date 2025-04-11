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
    # epic status bar i made
    epic-bar-rs.url = "github:DMGDy/epic-bar-rs";
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

      framework = nixpkgs.lib.nixosSystem {
        specialArgs = { 
          inherit inputs system; 
        };
        modules = [
          inputs.home-manager.nixosModules.default
          ./hosts/framework/configuration.nix
          # Custom Modules
          inputs.nixvim.nixosModules.nixvim
          ./modules/nixos/hardware.nix
        ];
      };

      t7910= nixpkgs.lib.nixosSystem {
        specialArgs = { 
          inherit inputs system; 
        };
        modules = [
          inputs.home-manager.nixosModules.default
          ./hosts/t7910/configuration.nix
          # Custom Modules
          inputs.nixvim.nixosModules.nixvim
          #./modules/nixos/hardware.nix
          ./modules/nixos/nvidia.nix
        ];
      };

    };
  };
}
