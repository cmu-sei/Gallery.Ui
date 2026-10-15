# GalleryUi
This project is intended to be a functioning UI that can be used within the Crucible Framework.

## Documentation

[Gallery Documentation](https://cmu-sei.github.io/crucible/gallery/)

## Color Theming

Gallery uses a monochrome gray Material 3 SCSS palette (`src/styles/_theme-colors.scss`, `src/styles/_dark-theme-colors.scss`) with runtime top bar and primary color overrides from the settings.

### Changing the top bar and primary colors

| File | Field / Value | Purpose |
|------|---------------|---------|
| `src/assets/config/settings.json` | `"AppTopBarHexColor": "#008740"` | Runtime config -- top bar background color |
| `src/assets/config/settings.json` | `"AppTopBarHexTextColor": "#FFFFFF"` | Runtime config -- top bar text color |
| `src/assets/config/settings.json` | `"AppLightModePrimaryHexColor": "#008740"` / `"AppLightModePrimaryHexTextColor": "#FFFFFF"` | Runtime config -- primary color and its text color in light mode |
| `src/assets/config/settings.json` | `"AppDarkModePrimaryHexColor": "#00A34D"` / `"AppDarkModePrimaryHexTextColor": "#000000"` | Runtime config -- primary color and its text color in dark mode (falls back to the light-mode value) |
| `src/app/app.module.ts` | `provideCrucibleTheme({ brand: { color: '#008740', text: '#FFFFFF' } })` | Fallbacks when a top bar or light-mode key is not set |

The app loads `settings.json`, then `settings.shared.json` and `settings.env.json` from `src/assets/config/` when they exist, and merges them in that order, so later files override earlier ones. To change the colors for a deployment, set these keys in `settings.env.json`.

# Generate code to get data from the API
With the API running on port 4722, run `npm run swagger-gen`. It downloads `http://host.docker.internal:4722/swagger/v1/swagger.json` to `swagger.json` and regenerates the client in `src/app/generated/api`. `npm run swagger-gen-docker` does the same with the `openapitools/openapi-generator-cli:v7.2.0` Docker image.
# Angular
This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 21 (Angular 21.2). Node `^20.19.0 || ^22.12.0 || >=24.0.0` is required.

## Development server

Run `npm start` (`ng serve`) for a dev server. Navigate to `http://localhost:4723/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `npm run build` (`ng build`) to build the project. The build artifacts will be stored in the `dist/browser` directory. Without `--configuration`, `ng build` uses the unoptimized base options in `angular.json`; use `--configuration production` for a production build.

## Running unit tests

Unit tests run on Vitest (jsdom) through Angular's `@angular/build:unit-test` builder, with zone change detection like the app.

```bash
npm test                 # run every spec once (ng test --watch=false)
npm run test:watch       # watch mode (ng test)
npm run test:coverage    # run once with coverage and the thresholds in angular.json
```

Run a subset with `npx ng test --watch=false --include='src/app/data/card/**/*.spec.ts'`.

Shared test helpers (default providers, API and SignalR stubs, permission providers, render helper) live in `src/app/test-utils/`. They are copied from the shared Crucible UI test standard; only `default-test-providers.ts` and `mock-permission-data.service.ts` are specific to Gallery.

## Running end-to-end tests

End-to-end tests for Gallery are in the Playwright suite in [crucible-tests](https://github.com/cmu-sei/crucible-tests), which runs against a running Crucible stack.



