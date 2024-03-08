const path = require("path");
const fs = require("fs");

const BaseDir = path.resolve(__dirname, "../");

const ExtIds = ["IncludeRobot", "Scratch3Arduino"];
const ExtDirName = "scratch3_arduino";
const ExtDirPath = path.resolve(
  BaseDir,
  "./scratch-vm/src/extensions/",
  ExtDirName,
);

const GuiDir = path.resolve(BaseDir, "../scratch-gui");
const VmExtManagerFile = path.resolve(
  GuiDir,
  "./node_modules/scratch-vm/src/extension-support/extension-manager.js",
);
const VmVirtualMachineFile = path.resolve(
  GuiDir,
  "./node_modules/scratch-vm/src/virtual-machine.js",
);
const VmExtArduinoDir = path.resolve(
  GuiDir,
  "./node_modules/scratch-vm/src/extensions/",
  ExtDirName,
);
const EditorMessagesDir = path.resolve(GuiDir, "./node_modules/scratch-l10n/locales/editor-msgs.js");
const IncludeMessagesPathFile = path.resolve(BaseDir, "./scratch-l10n/locales/include-msgs.json");

if (!fs.existsSync(VmExtArduinoDir)) {
  fs.symlinkSync(ExtDirPath, VmExtArduinoDir, "dir");
  console.log("Set symbolic link to", VmExtArduinoDir);
} else {
  console.log("Symbolic link already set to", VmExtArduinoDir);
}

let managerCode = fs.readFileSync(VmExtManagerFile, "utf-8");
for (const ExtId of ExtIds) {
  if (managerCode.includes(ExtId)) {
    console.log(`Already registered in manager: ${ExtId}`);
  } else {
    fs.copyFileSync(VmExtManagerFile, `${VmExtManagerFile}.orig`);
    managerCode = managerCode.replace(
      /builtinExtensions = {[\s\S]*?};/,
      `$&\n\nbuiltinExtensions.${ExtId} = () => require('../extensions/${ExtDirName}').${ExtId};`,
    );
    fs.writeFileSync(VmExtManagerFile, managerCode);
    console.log(`Registered in manager: ${ExtId}`);
  }
}

// Add the extension as a core extension.
let vmCode = fs.readFileSync(VmVirtualMachineFile, "utf-8");
for (const ExtId of ExtIds) {
  if (vmCode.includes(ExtId)) {
    console.log(`Already added as a core extension: ${ExtId}`);
  } else {
    fs.copyFileSync(VmVirtualMachineFile, `${VmVirtualMachineFile}.orig`);
    vmCode = vmCode.replace(
      /CORE_EXTENSIONS = \[[\s\S]*?\];/,
      `$&\n\nCORE_EXTENSIONS.push('${ExtId}');`,
    );
    fs.writeFileSync(VmVirtualMachineFile, vmCode);
    console.log(`Add as a core extension: ${ExtId}`);
  }
}


// read the editor messages file and include the messages from the include-msgs.json file
let fileContent = fs.readFileSync(EditorMessagesDir, 'utf8');
let match = fileContent.match(/export default (\{.*\});/s);
if (!match) {
    throw new Error('Could not find object in file');
}
let obj = eval('(' + match[1] + ')');

let includeMsgs = JSON.parse(fs.readFileSync(IncludeMessagesPathFile, 'utf8'));
for (let lang in includeMsgs) {
    console.log(`Adding "${lang}" translation`);
    obj[lang] = { ...obj[lang], ...includeMsgs[lang] };
}
let updatedContent = 'export default ' + JSON.stringify(obj, null, 2) + ';';
fs.writeFileSync(EditorMessagesDir, updatedContent);
