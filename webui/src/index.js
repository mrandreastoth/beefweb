import React from 'react'
import ReactDom from 'react-dom'
import Navigo from 'navigo'
import App from './app'
import Client from './client'
import SettingsStore from './settings_store'
import AppModel, { ViewId } from './app_model'
import MediaSizeController from './media_size_controller'
import WindowController from './window_controller'
import CssSettingsController from './css_settings_controller'
import TouchSupport from './touch_support'
import urls, { getPathFromUrl } from './urls'

const client = new Client();
const settingsStore = new SettingsStore();
const appModel = new AppModel(client, settingsStore);

const { playerModel, playlistModel, fileBrowserModel, settingsModel } = appModel;

const mediaSizeController = new MediaSizeController(playlistModel);
const windowController = new WindowController(playerModel);
const cssSettingsController = new CssSettingsController(settingsModel);
const touchSupport = new TouchSupport(settingsModel);

var router = new Navigo(null, true);

function navigateToCurrentPlaylist()
{
    if (appModel.currentView != ViewId.playlist)
        return;

    router.pause();

    if (playlistModel.currentPlaylistId)
        router.navigate(urls.viewPlaylist(playlistModel.currentPlaylistId));
    else
        router.navigate(urls.viewCurrentPlaylist);

    router.resume();
}

router.on({
    '/': () => {
        router.navigate(urls.viewCurrentPlaylist);
    },

    '/playlists': () => {
        appModel.setCurrentView(ViewId.playlist);
        navigateToCurrentPlaylist();
    },

    '/playlists/:id': params => {
        playlistModel.setCurrentPlaylistId(params.id);
        appModel.setCurrentView(ViewId.playlist);
    },

    '/files': () => {
        fileBrowserModel.reload();
        appModel.setCurrentView(ViewId.fileBrowser);
        router.pause();
        router.navigate(urls.browsePath(fileBrowserModel.currentPath));
        router.resume();
    },

    '/files/!*': params => {
        appModel.setCurrentView(ViewId.fileBrowser);
        var path = getPathFromUrl(router.lastRouteResolved().url);
        fileBrowserModel.browse(path);
    },

    '/settings': () => {
        appModel.setCurrentView(ViewId.settings);
    },
});

router.notFound(() => {
    appModel.setCurrentView(ViewId.notFound);
});

playlistModel.on('playlistsChange', navigateToCurrentPlaylist);

mediaSizeController.start();
appModel.start();
windowController.start();
cssSettingsController.start();
touchSupport.start();
router.resolve();

ReactDom.render(
    <App appModel={appModel} touchSupport={touchSupport} />,
    document.getElementById('app-container'));
