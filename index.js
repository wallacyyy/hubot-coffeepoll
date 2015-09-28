var fs = require('fs')
var path = require('path')

module.exports = function (robot) {
  var scriptsPath = path.resolve(__dirname, 'scripts')

  return fs.exists(scriptsPath, function (exists) {
    if (exists) {
      var files = fs.readdirSync(scriptsPath)

      for (var i = 0; i < files.length; i++) {
        robot.loadFile(scriptsPath, files[i])
      }
    }
  })
}
