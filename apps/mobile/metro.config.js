const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const monorepoRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
]

config.resolver.extraNodeModules = {
  '@naligrid/shared': path.resolve(monorepoRoot, 'packages/shared/src'),
}

config.watchFolders = [
  path.resolve(monorepoRoot, 'packages'),
]

module.exports = config
