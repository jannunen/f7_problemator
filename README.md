# Backlogger

Backlogger is a video games tracking app, to keep track of video game backlog, wishlist and archive.

## Features

- Search any video game
- Save games to Backlog, Wishlist or Archive
- Supports both iOS and MD (Material Design) themes
- Progressive Web App (PWA), app can be installed to the home screen, and uses service workers to cache all static assets.
- State management with Framework7 built-in Store.
- There are following screens (views) available:
  - **Onboarding**. Intro overlay to onboard new users.
  - **Discover**. Main page with:
    - search - working video games search functionality
    - upcoming games section
    - recently released games section
    - all time top 25 games section
  - **Backlog**. Page with games saved to backlog.
  - **Wishlist**. Page with games saved to wishlist.
  - **Archive**. Page with games saved to archive.
  - **Game Details**. Page with detailed information about video game, including:
    - banner image
    - title
    - genres
    - platforms
    - release date
    - summary
    - screenshots
    - ratings
    - game developer & publisher
    - link to official website

## Package

In the package you will find:

- fully functional project created with Framework7 CLI (with Vite), with Framework7 Core version
- well structured page and components files, coded in JSX syntax which can be easily ported to Framework7 React, Vue or Svelte
- additional ESLint and Prettier setup
- instructions on how to build, run and preview the project

<!-- STORE_END -->

## Install Dependencies

First of all we need to install dependencies, run in terminal

```
npm install
```

## RAWG API

This demo app uses [RAWG API](https://rawg.io/apidocs) for search functionality.

In order to keep using this API, you need to sign up and obtain API key at [RAWG website](https://rawg.io/apidocs). It has free plan.

After registering your app, you need to put "API key" to the `.env` file:

```bash
# Replace YOUR_API_KEY with your API Key
VITE_APP_KEY=YOUR_API_KEY
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

## Connect to Git

It is possible to connect this project folder to the new repository. For example for GitHub:

1. Create new GitHub repository at https://github.com/new

2. Initialize Git. In terminal run:

   ```
   git init
   ```

3. Add remote origin. Replace $USERNAME and $REPOSITORY with your GitHub username and newly created repository name:
   ```
   git remote add origin https://github.com/$USERNAME/$REPOSITORY.git
   ```

That is all, after that you can track, commit and push/pull to repo, for example:

```
git add .
git commit -m "initial commit"
git push origin master
```

## Documentation & Resources

- [Framework7 Core Documentation](https://framework7.io/docs/)
- [Framework7 Icons Reference](https://framework7.io/icons/)
- [Community Forum](https://forum.framework7.io)

## Support Framework7

Love Framework7? Support project by donating or pledging on:

- Patreon: https://patreon.com/framework7
- OpenCollective: https://opencollective.com/framework7
