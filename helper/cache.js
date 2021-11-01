const NodeCache = require( "node-cache" );
const subjectCache = new NodeCache();
const teacherCache = new NodeCache()
module.exports = {
    subjectCache,
    teacherCache
}