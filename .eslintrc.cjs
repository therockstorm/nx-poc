module.exports = {
  root: true,
  ignorePatterns: ["**/*"],
  plugins: ["@nrwl/nx", "simple-import-sort"],
  overrides: [
    {
      extends: ["plugin:@nrwl/nx/typescript"],
      files: ["*.ts", "*.tsx", "*.mjs"],
      rules: {
        "@nrwl/nx/enforce-module-boundaries": [
          "error",
          {
            allow: [],
            allowCircularSelfDependency: false,
            banTransitiveDependencies: true,
            depConstraints: [
              {
                sourceTag: "scope:api",
                onlyDependOnLibsWithTags: ["scope:shared", "scope:domain"],
              },
              {
                sourceTag: "scope:client",
                onlyDependOnLibsWithTags: ["scope:shared", "scope:domain"],
              },
              {
                sourceTag: "scope:domain",
                onlyDependOnLibsWithTags: ["scope:domain"],
              },
              {
                sourceTag: "scope:shared",
                onlyDependOnLibsWithTags: ["scope:shared"],
              },
            ],
            enforceBuildableLibDependency: true,
          },
        ],
        "no-await-in-loop": "warn",
        "no-return-await": "warn",
        "require-await": "warn",
        "simple-import-sort/imports": "warn",
      },
    },
    {
      files: ["*.yaml", "*.yml"],
      plugins: ["yaml"],
      extends: ["plugin:yaml/recommended"],
    },
  ],
};
