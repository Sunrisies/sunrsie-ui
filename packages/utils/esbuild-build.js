
const esbuild = require('esbuild');
const isProduction = process.env.NODE_ENV === 'production';
const minify = isProduction && require('esbuild-minify-plugin').default;
const { dtsPlugin } = require("esbuild-plugin-d.ts");
const buildConfig = {
  bundle: true,
  minify: true,
  keepNames: true,
  plugins: isProduction ? [minify(), dtsPlugin()] : [dtsPlugin()],
  loader: { '.ts': 'ts' }
};
const init = async () => {
  let browserCtx = await esbuild.context({
    ...buildConfig,
    entryPoints: ['src/index.ts'],
    outfile: 'dist/index.esm.js',
    format: 'esm',
    platform: 'browser', // 目标平台为浏览器
  })
  // Node.js 版本
  let nodeCtx = await esbuild.context({
    ...buildConfig,
    entryPoints: ['src/common/index.ts'],
    outfile: 'dist/index.node.js',
    format: 'cjs',
    platform: 'node',
  });
  await Promise.all([
    browserCtx.watch(),
    nodeCtx.watch(),
    // commonCtx.watch()
  ]).then(results => {
    console.log('所有版本构建完成');
  });
  // await browserCtx.watch().then(result => {
  //   console.log(result)
  // })
}
init()



