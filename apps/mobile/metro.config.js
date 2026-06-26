const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const config = getDefaultConfig(__dirname)

config.resolver.extraNodeModules = {
  '@naligrid/shared': path.resolve(__dirname, '../../packages/shared/src'),
}

config.watchFolders = [path.resolve(__dirname, '../../packages')]

module.exports = config
