const handler = require('../../comparator/json-handler');
const fileHandler = require('../../file-handler');
const testConstants = require('../constants.test')

const testHandlerObj = new handler.JsonHandler('id');

const fileA = fileHandler.createFileHandler(testConstants.dataPath('time_registrations.json'));

testHandlerObj.consume(fileA)
    .then(() => {
            const fileB = fileHandler.createFileHandler(testConstants.dataPath('time_registrations-2.json'));
            return testHandlerObj.compare(fileB).then(() => {
                const diff = testHandlerObj.getOutput();

                console.log(
                    `Inserts: ${diff.insert.length}`,
                    `Update: ${diff.update.length}`,
                    `Header new: ${diff.headerNew ? 'yes' : 'no'}`
                );
            })
        }
    );
