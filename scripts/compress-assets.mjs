import { readdir, readFile, writeFile } from "node:fs/promises";
import { gzipSync, brotliCompressSync, constants } from "node:zlib";
for (const name of await readdir("dist/assets")) {
  if (!/\.(js|css|svg|json)$/.test(name)) continue;
  const input = await readFile(`dist/assets/${name}`);
  await writeFile(`dist/assets/${name}.gz`, gzipSync(input, { level: 9 }));
  await writeFile(
    `dist/assets/${name}.br`,
    brotliCompressSync(input, {
      params: { [constants.BROTLI_PARAM_QUALITY]: 9 },
    }),
  );
}
