const fs = require('fs')

const guiFilename = "./scratch-gui/src/components/gui/gui.jsx"

const linesToReplace = [
    {
        src: "<Box className={styles.bodyWrapper}>",
        dest: "<DismissableBanner />"
    },
    {
        src: "import Loader from '../loader/loader.jsx';",
        dest: "import {DismissableBanner} from '../dismissable-banner/dismissable-banner.jsx';"
    }

];

fs.cpSync("./scripts/add-banner/dismissable-banner/", "./scratch-gui/src/components/dismissable-banner/", {recursive: true});


linesToReplace.forEach((replacement) => {
    const data = fs.readFileSync(guiFilename, 'utf8');
    const result = data.replace(replacement.src, `${replacement.dest}\n${replacement.src}`);        
       
    fs.writeFileSync(guiFilename, result, 'utf8');
})