// Plugin System Core 
class PluginManager { 
  constructor() { this.plugins = new Map(); } 
  register(name, plugin) { 
    this.plugins.set(name, plugin); 
    plugin.init(); 
  } 
  execute(pluginName, method, ...args) { 
    const plugin = this.plugins.get(pluginName); 
    return plugin?.[method]?.(...args); 
  } 
} 
module.exports = PluginManager; 

