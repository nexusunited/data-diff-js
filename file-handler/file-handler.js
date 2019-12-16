const fs = require('fs');
const readline = require('readline');

function createFileHandler(file) {
    return readline.createInterface({
        input: fs.createReadStream(file),
        console: false
    });
}

function writeFile(content, fileName) {
    fs.writeFileSync(fileName, content);
}

module.exports = {
    createFileHandler,
    writeFile
};
