# VIR frontend CI hardening

Release gates on pull requests to `main` and post-merge pushes to `main` enforce:

1. deterministic `npm ci` install from the committed lockfile;
2. production dependency audit blocking high/critical findings;
3. menu/route audit;
4. complete frontend regression suite;
5. production build.

Build/test-only tooling belongs in `devDependencies`; unused server-side packages must not be shipped as frontend production dependencies. Breaking dependency upgrades are not applied automatically, and `npm audit fix --force` is not permitted in the release gate.
