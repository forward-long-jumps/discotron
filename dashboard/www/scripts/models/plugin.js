/**
 * Represents a plugin, dashboard side
 */
window.discotron.Plugin = class extends window.discotron.PluginModel {
    /**
     * @class
     * @param {object} options Args
     * @param {string} options.id Id of the plugin
     * @param {string} options.name Displayed name of the plugin
     * @param {string} options.description Short description of the plugin
     * @param {string} options.version Version of the plugin (format x.y.z)
     * @param {string} options.prefix Prefix set by the owner for all servers
     * @param {object} options.commands Object containing arrays of Command objects, grouped by trigger type
     * @param {string} options.defaultPermission Who can access the command if no permissions are set by the server owner, can be *everyone*, *admin*
     * @param {boolean} options.enabled True if plugin is enabled by the bot owner
     * @param {Array} options.logs List of logs the plugin can output to
     */
    constructor({id, name, description, version, prefix, commands, defaultPermission, enabled, logs}) {
        super({id, name, description, version, prefix, commands, defaultPermission, enabled, logs});
    }

    /**
     * Creates and registers a new plugin.
     * @param {object} options Args
     * @param {string} options.id Id of the plugin
     * @param {string} options.name Displayed name of the plugin
     * @param {string} options.description Short description of the plugin
     * @param {string} options.version Version of the plugin (format x.y.z)
     * @param {string} options.prefix Prefix set by the owner for all servers
     * @param {object} options.commands Object containing arrays of Command objects, grouped by trigger type
     * @param {string} options.defaultPermission Who can access the command if no permissions are set by the server owner, can be *everyone*, *admin*
     * @param {boolean} options.enabled True if plugin is enabled by the bot owner
     * @param {Array} options.logs List of logs the plugin can output to
     * @returns {object} New plugin instance
     */
    static create(options) {
        const plugin = new discotron.Plugin(options);
        discotron.Plugin._plugins[options.id] = plugin;
        return plugin;
    }

    /**
     * Returns all the plugins of the bot
     * @returns {object} {pluginId: Plugin} 
     */
    static getAll() {
        return new Promise((resolve, reject) => {
            if (Object.keys(discotron.Plugin._plugins).length === 0) {
                discotron.WebAPI.queryBot("discotron-dashboard", "get-plugins").then((data) => {
                    for (let i = 0; i < data.length; i++) {
                        const plugin = data[i];
                        discotron.Plugin.create({
                            id: plugin.id,
                            name: plugin.name,
                            description: plugin.description,
                            version: plugin.version,
                            prefix: plugin.prefix,
                            commands: plugin.commands,
                            defaultPermission: plugin.defaultPermission,
                            enabled: plugin.enabled,
                            logs: plugin.logs
                        });
                    }
                    resolve(discotron.Plugin._plugins);
                }).catch(console.error);
            } else {
                resolve(discotron.Plugin._plugins);
            }
        });
    }

    /**
     * Clear cache, forcing plugin reloading when get is called
     * @static
     */
    static clearCache() {
        discotron.Plugin._plugins = {};
    }

    /**
     * Update prefix for this plugin in the database (owner only)
     * @param {string} prefix New prefix for the plugin
     */
    set prefix(prefix) {
        this._prefix = prefix;
        discotron.WebAPI.queryBot("discotron-dashboard", "set-plugin-prefix", {
            prefix: prefix,
            pluginId: this._id
        });
    }

    /**
     * @returns {string} prefix for this plugin
     */
    get prefix() {
        return super.prefix;
    }

    /**
     * Update enabled for this plugin in the database (owner only)
     * @param {boolean} enabled True if the plugin is to be enabled
     */
    set enabled(enabled) {
        this._enabled = enabled;
        discotron.WebAPI.queryBot("discotron-dashboard", "set-enabled", {
            enabled: enabled,
            pluginId: this._id
        });
    }

    /**
     * @returns {boolean} is plugin enabled
     */
    get enabled() {
        return super.enabled;
    }

    /**
     * @param {Array} logs array of string
     */
    set logs(logs) {
        this._logs = logs;
    }

    /**
     * @returns {Array} array of string
     */
    get logs() {
        return super.logs;
    }
};

window.discotron.Plugin._plugins = {};