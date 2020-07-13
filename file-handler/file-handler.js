const fs = require('fs');
const readline = require('readline');

function createFileHandler(file, encoding = 'utf8') {
    return readline.createInterface({
        input: fs.createReadStream(file, { encoding }),
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
