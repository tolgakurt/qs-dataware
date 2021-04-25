import appRoot from 'app-root-path'
import ParcelBundler, { ParcelOptions } from 'parcel-bundler'

console.log(`Bundling initiated in ${process.env.NODE_ENV} mode.`)

// Define input and output folders
const srcDir = appRoot.resolve('./src')
const outDir = appRoot.resolve('./dist')
const handlerEntryPoint = `${srcDir}/functions/handler.ts`

// Bundler options
const handlerOptions: ParcelOptions = {
  outDir: outDir,
  outFile: 'handler.js',
  publicUrl: './',
  cacheDir: '.cache',
  watch: process.env.NODE_ENV === 'development',
  minify: process.env.NODE_ENV === 'production',
  target: 'node', // browser/node/electron, defaults to browser
  logLevel: 3, // 3 = log everything, 2 = log warnings & errors, 1 = log errors
  sourceMaps: process.env.NODE_ENV === 'development',
  detailedReport: process.env.NODE_ENV === 'production',
}

// Initialises bundlers using the entrypoint locations and options provided
const handlerBundler = new ParcelBundler(handlerEntryPoint, handlerOptions)

// Now do the Harlem Shake
handlerBundler.bundle()