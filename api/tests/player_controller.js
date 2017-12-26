'use strict';

const path = require('path');
const fs = require('fs');
const childProcess = require('child_process');
const { promisify } = require('util');
const tmp = require('tmp');

const accessCheck = promisify(fs.access);
const writeFile = promisify(fs.writeFile);
const symlink = promisify(fs.symlink);

const mkdirp = promisify(require('mkdirp'));
const rimraf = promisify(require('rimraf'));

const pluginFileName = 'beefweb.so'
const rootPath = path.dirname(path.dirname(__dirname));

function tmpDir(args)
{
    return new Promise((resolve, reject) => {
        tmp.dir(args, (err, path) => {
            if (err)
                reject(err);
            else
                resolve(path);
        });
    });
}

class PlayerController
{
    constructor(config)
    {
        this.paths = {};
        this.config = config;
    }

    async start()
    {
        if (!this.paths.playerBinary)
            await this.findPlayerBinary();

        if (!this.paths.profileDir)
            await this.initProfile();

        await this.writePlayerConfig();
        await this.installPlugin();

        this.startProcess();
    }

    async stop()
    {
        this.stopProcess();
        await this.cleanUpProfile();
    }

    async findPlayerBinary()
    {
        const prefixes = [
            path.join(rootPath, 'tools/deadbeef'),
            '/opt/deadbeef',
            '/usr/local',
            '/usr'
        ];

        for (let prefix of prefixes)
        {
            const fullPath = path.join(prefix, 'bin/deadbeef');

            try
            {
                await accessCheck(fullPath, fs.constants.X_OK);
                this.paths.playerBinary = fullPath;
                return;
            }
            catch(e)
            {
            }
        }

        throw Error('Unable to find deadbeef executable');
    }

    async initProfile()
    {
        const profileDir = await tmpDir({ prefix: 'api-tests-' });
        const configDir = path.join(profileDir, '.config/deadbeef');
        const libDir = path.join(profileDir, '.local/lib/deadbeef');
        const configFile = path.join(configDir, 'config');

        const pluginFile = path.join(
            rootPath,
            'server/build',
            this.config.buildType,
            'src/plugin_deadbeef',
            pluginFileName);

        const installedPluginFile = path.join(libDir, pluginFileName);

        Object.assign(this.paths, {
            profileDir,
            configDir,
            configFile,
            libDir,
            pluginFile,
            installedPluginFile,
        });
    }

    async writePlayerConfig()
    {
        const settings = {
            'output_plugin': 'Null output plugin',
            'beefweb.allow_remote': 0,
            'beefweb.music_dirs': '',
            'beefweb.port': this.config.port,
        };

        await mkdirp(this.paths.configDir);
        await writeFile(this.paths.configFile, this.generatePlayerConfig(settings));
    }

    generatePlayerConfig(settings)
    {
        return Object
            .getOwnPropertyNames(settings)
            .map(key => `${key} ${settings[key]}\n`)
            .join('');
    }

    async installPlugin()
    {
        await mkdirp(this.paths.libDir);
        await symlink(this.paths.pluginFile, this.paths.installedPluginFile);
    }

    async cleanUpProfile()
    {
        if (this.paths.profileDir)
            await rimraf(this.paths.profileDir);
    }

    startProcess()
    {
        const env = Object.assign({}, process.env, { HOME: this.paths.profileDir });

        this.process = childProcess.spawn(this.paths.playerBinary, [], {
            cwd: this.paths.profileDir,
            env,
            stdio: 'ignore',
            detached: true,
        });

        this.process.unref();
    }

    stopProcess()
    {
        if (this.process)
            this.process.kill();
    }
}

module.exports = PlayerController;