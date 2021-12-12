const NodeCache = require("node-cache");

const subjectCache = new NodeCache({ stdTTL: 30 * 60 });

module.exports = {
    subjectCache
}