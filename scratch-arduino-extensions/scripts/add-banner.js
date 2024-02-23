const fs = require("fs");
const path = require("path");

const guiFilename = "./src/components/gui/gui.jsx";

const linesToReplace = [
  {
    src: "import Loader from '../loader/loader.jsx';",
    dest: "import Loader from '../loader/loader.jsx';\nimport { DismissableBanner } from '../dismissable-banner/dismissable-banner.jsx';",
  },
  {
    src: "<Box className={styles.bodyWrapper}>",
    dest: "<Box className={styles.bodyWrapper}>\n                <DismissableBanner />",
  },
];

console.log(
  `Copying file [${path.resolve(__dirname, "../scratch-gui/src/components/dismissable-banner/")}] to file [${path.resolve(__dirname, "../../scratch-gui/src/components/dismissable-banner/")}]`,
);

fs.cpSync(
  path.resolve(__dirname, "../scratch-gui/src/components/dismissable-banner/"),
  path.resolve(
    __dirname,
    "../../scratch-gui/src/components/dismissable-banner/",
  ),
  { recursive: true },
);

// look for occurrences of DismissableBanner
let guiCode = fs.readFileSync(guiFilename, "utf-8");
if (guiCode.includes("DismissableBanner")) {
  console.log(`DismissableBanner already added in [${guiFilename}]`);
} else {
  linesToReplace.forEach((replacement) => {
    const data = fs.readFileSync(guiFilename, "utf8"); // need to re-read the code
    const result = data.replace(replacement.src, replacement.dest);

    fs.writeFileSync(guiFilename, result, "utf8");
  });
}
