import { createHash } from "node:crypto";
import { access, copyFile, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const repository = "soundtrackgeek/animation_studio";
const root = process.cwd();

function optionValue(name, fallback) {
  const optionIndex = process.argv.indexOf(name);
  if (optionIndex === -1) return fallback;
  const value = process.argv[optionIndex + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${name} requires a directory path.`);
  }
  return value;
}

const bundleDirectory = path.resolve(
  root,
  optionValue("--bundle-dir", "src-tauri/target/release/bundle/nsis"),
);
const outputDirectory = path.resolve(
  root,
  optionValue("--output-dir", "dist/release"),
);
const packageJson = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
const version = packageJson.version;
const expectedVersionToken = `_${version}_`;

const bundleFiles = await readdir(bundleDirectory);
const installerName = bundleFiles.find(
  (fileName) => fileName.endsWith("-setup.exe") && fileName.includes(expectedVersionToken),
);

if (!installerName) {
  throw new Error(`No NSIS installer for version ${version} was found in ${bundleDirectory}`);
}

const installerPath = path.join(bundleDirectory, installerName);
const signaturePath = `${installerPath}.sig`;
await access(signaturePath);

const releaseInstallerName = `Graphite.Forge_${version}_x64-setup.exe`;
const releaseInstallerPath = path.join(outputDirectory, releaseInstallerName);
const releaseSignatureName = `${releaseInstallerName}.sig`;
const releaseSignaturePath = path.join(outputDirectory, releaseSignatureName);
const releaseChecksumPath = path.join(outputDirectory, `${releaseInstallerName}.sha256`);
const latestJsonPath = path.join(outputDirectory, "latest.json");

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });
await copyFile(installerPath, releaseInstallerPath);
await copyFile(signaturePath, releaseSignaturePath);

const installerBytes = await readFile(releaseInstallerPath);
const checksum = createHash("sha256").update(installerBytes).digest("hex");
await writeFile(releaseChecksumPath, `${checksum}  ${releaseInstallerName}\n`, "utf8");

const signature = (await readFile(releaseSignaturePath, "utf8")).trim();
const latest = {
  version,
  notes: `Graphite Forge ${version}`,
  pub_date: new Date().toISOString(),
  platforms: {
    "windows-x86_64": {
      signature,
      url: `https://github.com/${repository}/releases/download/v${version}/${releaseInstallerName}`,
    },
  },
};

await writeFile(latestJsonPath, `${JSON.stringify(latest, null, 2)}\n`, "utf8");
console.log(`Prepared updater release assets in ${outputDirectory}`);
