import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);
const repositoryRoot = resolve(import.meta.dirname, "..");
const packageJson = JSON.parse(await readFile(join(repositoryRoot, "package.json"), "utf8"));

test("prepares a signed installer and static updater manifest", async () => {
  const temporaryRoot = await mkdtemp(join(tmpdir(), "graphite-forge-updater-"));
  const bundleDirectory = join(temporaryRoot, "bundle", "nsis");
  const outputDirectory = join(temporaryRoot, "release");
  const sourceInstaller = join(bundleDirectory, `Graphite Forge_${packageJson.version}_x64-setup.exe`);

  try {
    await mkdir(bundleDirectory, { recursive: true });
    await writeFile(sourceInstaller, "installer-payload");
    await writeFile(`${sourceInstaller}.sig`, "signed-installer-payload\n");

    await execFileAsync(
      process.execPath,
      [
        join(repositoryRoot, "scripts", "prepare-updater-release.mjs"),
        "--bundle-dir",
        bundleDirectory,
        "--output-dir",
        outputDirectory,
      ],
      { cwd: repositoryRoot },
    );

    const normalizedName = `Graphite.Forge_${packageJson.version}_x64-setup.exe`;
    const manifest = JSON.parse(await readFile(join(outputDirectory, "latest.json"), "utf8"));
    const platform = manifest.platforms["windows-x86_64"];

    assert.equal(manifest.version, packageJson.version);
    assert.equal(platform.signature, "signed-installer-payload");
    assert.equal(
      platform.url,
      `https://github.com/soundtrackgeek/animation_studio/releases/download/v${packageJson.version}/${normalizedName}`,
    );
    assert.equal(await readFile(join(outputDirectory, normalizedName), "utf8"), "installer-payload");
    assert.match(
      await readFile(join(outputDirectory, `${normalizedName}.sha256`), "utf8"),
      new RegExp(`^[a-f0-9]{64}  ${normalizedName}\\n$`),
    );
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});
