# GalleryUi
This project is intended to be a functioning UI that can be used within the Crucible Framework.

## Documentation

[Gallery Documentation](https://cmu-sei.github.io/crucible/gallery/)

## Color Theming

Gallery uses a monochrome gray Material 3 SCSS palette with runtime top-bar color overrides from `settings.json`.

### Changing the top bar color

| File | Field / Value | Purpose |
|------|---------------|---------|
| `src/assets/config/settings.json` | `"AppTopBarHexColor": "#008740"` | Runtime config -- top bar background color |
| `src/assets/config/settings.json` | `"AppTopBarHexTextColor": "#FFFFFF"` | Runtime config -- top bar text color |

To change the top bar color for a deployment, update `AppTopBarHexColor` and `AppTopBarHexTextColor` in `settings.json`.

# Generate code to get data from the API
Run `npm run swagger-gen`
# Angular
This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 21 (Angular 21.2). Node `^20.19.0 || ^22.12.0 || >=24.0.0` is required.

## Development server

Run `npm start` (`ng serve`) for a dev server. Navigate to `http://localhost:4723/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `npm run build` (`ng build`) to build the project. The build artifacts will be stored in the `dist/browser` directory. The default configuration is `development`; use `--configuration production` for a production build.

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

`npm run e2e` (`ng e2e`) is configured in `angular.json` with the Protractor builder (`@angular-devkit/build-angular:protractor`), but neither that package nor Protractor is a dependency in `package.json`, so the command does not currently work.

## Linting

Run `npm run lint` (`eslint -c .eslintrc.js --ext .ts src/`).



