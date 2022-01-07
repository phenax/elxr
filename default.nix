{ pkgs ? import <nixpkgs> { } }:
with pkgs;
mkShell rec {
  buildInputs = [
    nodejs-16_x
    yarn
    efm-langserver
    nodePackages.vls
    nodePackages.prettier
    nodePackages.typescript-language-server
  ];
}
