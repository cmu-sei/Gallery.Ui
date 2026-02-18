# GalleryUi
This project is intended to be a functioning UI that can be used within the Crucible Framework.

## Documentation

[Gallery Documentation](https://cmu-sei.github.io/crucible/gallery/)

## Color Theming

Gallery uses the `@cmusei/crucible-common` dynamic theming system. A single primary hex color drives the entire Material 3 color scheme at runtime.

### Changing the theme color

| File | Field / Value | Purpose |
|------|---------------|---------|
| `src/assets/config/settings.json` | `"AppPrimaryThemeColor": "#008740"` | Runtime config -- primary place to change the color for a deployment |
| `src/app/app.module.ts` | `defaultThemeColor: '#008740'` in `provideCrucibleTheme()` | Compile-time fallback when `settings.json` has no `AppPrimaryThemeColor` |
| `src/app/app.component.ts` | `'#008740'` fallback in `setTheme()` | Runtime fallback used during theme switching |
| `src/styles/_theme-colors.scss` | Pre-generated SCSS palette from `#008740` | Baseline CSS before the runtime service applies variables |

To change the theme, update `AppPrimaryThemeColor` in `settings.json`. If changing the default color permanently, also update the fallback values in `app.module.ts` and `app.component.ts`, and regenerate the SCSS palette:

```bash
npx ng generate @angular/material:theme-color --primaryColor=#NEWCOLOR
```

See the [Crucible.Common.Ui README](../../libraries/Crucible.Common.Ui/README.md) for full details on how the theming system works.

# Generate code to get data from the API
Run `npm run swagger:gen`
# Angular
This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 11.1.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4723/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).



