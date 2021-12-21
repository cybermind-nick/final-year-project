const path = require('path');
const dir = __dirname;
console.log(dir);
console.log(path.join(dir, 'ibpConnection.json'));
exports.connectionDirectory = async function () {
    return path.join(dir, 'ibpConnection.json');
}