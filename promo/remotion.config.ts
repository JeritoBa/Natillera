import path from 'node:path'
import { Config } from '@remotion/cli/config'

Config.setVideoImageFormat('jpeg')
Config.setOverwriteOutput(true)

// Reuse two small files from the app without modifying it (alias @app -> Natillera.Frontend/src)
// and force a single React copy (the frontend folder has its own node_modules).
const appSrc = path.resolve(process.cwd(), '../Natillera.Frontend/src')
const nm = (name: string) => path.resolve(process.cwd(), 'node_modules', name)

Config.overrideWebpackConfig((config) => ({
  ...config,
  resolve: {
    ...config.resolve,
    alias: {
      ...(config.resolve?.alias ?? {}),
      '@app': appSrc,
      react: nm('react'),
      'react-dom': nm('react-dom'),
      'react/jsx-runtime': nm('react/jsx-runtime.js'),
      'react/jsx-dev-runtime': nm('react/jsx-dev-runtime.js'),
    },
  },
}))
