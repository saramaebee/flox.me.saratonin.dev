{
  description = "flox.me.saratonin.dev — making software supply chains understandable";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };

        # node_modules as a fixed-output derivation: the one impure step
        # (resolving the registry) is pinned by hash, so everything built on
        # top of it is hermetic. Bump the hash with `nix build` when bun.lock
        # changes — Nix prints the expected value on mismatch.
        nodeModules = pkgs.stdenv.mkDerivation {
          pname = "flox-me-saratonin-dev-node-modules";
          version = "1.0.0";
          src = pkgs.lib.fileset.toSource {
            root = ./.;
            fileset = pkgs.lib.fileset.unions [ ./package.json ./bun.lock ];
          };
          nativeBuildInputs = [ pkgs.bun ];
          dontConfigure = true;
          buildPhase = ''
            export HOME="$TMPDIR"
            bun install --frozen-lockfile --no-progress --ignore-scripts
          '';
          installPhase = ''
            mkdir -p $out
            cp -R node_modules $out/
          '';
          dontFixup = true;
          outputHashMode = "recursive";
          outputHashAlgo = "sha256";
          # Pinned from the registry resolution; changes only with bun.lock.
          outputHash = "sha256-h8w37t01fEiSv/xoQ8SvC5Jp/280zZsFF8YK4toi6bE=";
        };

        site = pkgs.stdenv.mkDerivation {
          pname = "flox-me-saratonin-dev";
          version = "1.0.0";
          src = pkgs.lib.fileset.toSource {
            root = ./.;
            # The three-ways page imports the benchmark JSON as its single
            # source of truth, so the hermetic build needs that file in scope.
            fileset = pkgs.lib.fileset.unions [
              ./src
              ./CNAME
              ./package.json
              ./bun.lock
              ./three-ways/bench/results/results.json
            ];
          };
          nativeBuildInputs = [ pkgs.bun ];
          configurePhase = ''
            cp -R ${nodeModules}/node_modules ./node_modules
            chmod -R u+w ./node_modules
          '';
          buildPhase = ''
            export HOME="$TMPDIR"
            bun build ./src/index.html --outdir=public --minify --public-path=/
          '';
          installPhase = ''
            mkdir -p $out
            cp -R public/* $out/
            cp CNAME $out/
          '';
        };
      in
      {
        packages.default = site;
        packages.site = site;

        # `nix develop` — same toolchain as `flox activate`, for editors/CI
        # that prefer Nix entrypoints.
        devShells.default = pkgs.mkShell {
          packages = [ pkgs.bun ];
        };
      });
}
