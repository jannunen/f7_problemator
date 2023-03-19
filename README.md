# Problemator Mobile PWA

Problemator is an app which is used as a tool for routesetters, but there's also
a mobile version for climbers to track their climbing.

## Features

- Change gyms
- Search for problems
- See problem info (author, attributes, ascents, grade opinions etc.)
- Take part into competitions
- Supports both iOS and MD (Material Design) themes
- Progressive Web App (PWA), app can be installed to the home screen, and uses service workers to cache all static assets.
- State management with VueX
- Tailwind for additional styling



## Install Dependencies

First of all we need to install dependencies, run in terminal

```
npm install
```

## .env file

You need some configuration options in order to make the mobile version work

```
  VITE_API_HOST=https://api3.problemator.fi
  VITE_AUTH0_DOMAIN=auth.problemator.fi
  VITE_AUTH0_CLIENT_ID=9w5hh6NwrSZoQiLDRCoNHf7j3C9GGelz
  VITE_AUTH0_AUDIENCE=https://api.problemator.fi
  VITE_REDIRECT_URI=https://localhost:3000`
```

## NPM Scripts

- 🔥 `start` - run development server
- 🔧 `dev` - run development server
- 🔧 `build` - build web app for production

## Vite

There is a [Vite](https://vitejs.dev) bundler setup. It compiles and bundles all "front-end" resources. You should work only with files located in `/src` folder. Vite config located in `vite.config.js`.

## PWA

This is a PWA. Don't forget to check what is inside of your `service-worker.js`. It is also recommended that you disable service worker (or enable "Update on reload") in browser dev tools during development.

## Assets

Assets (icons, splash screens) source images located in `assets-src` folder. To generate your own icons and splash screen images, you will need to replace all assets in this directory with your own images (pay attention to image size and format), and run the following command in the project directory:

```
framework7 assets
```

Or launch UI where you will be able to change icons and splash screens:

```
framework7 assets --ui
```


## Documentation & Resources

- [Framework7 Core Documentation](https://framework7.io/docs/)
- [Framework7 Icons Reference](https://framework7.io/icons/)
- [Community Forum](https://forum.framework7.io)
- [VueX](https://vuex.vuejs.org/)
- [Tailwind](https://tailwindcss.com/)

## Support Framework7

Love Framework7? Support project by donating or pledging on:

- Patreon: https://patreon.com/framework7
- OpenCollective: https://opencollective.com/framework7
