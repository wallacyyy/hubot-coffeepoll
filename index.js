var fs = require('fs')
var path = require('path')

module.exports = function (robot) {
  var scriptsPath = path.resolve(__dirname, 'src')

  fs.exists(scriptsPath, function (exists) {
    if (exists) {
      var ref = fs.readdirSync(scriptsPath)

      for (var i = 0; i < ref.length; i++) {
        var script = ref[i]
        robot.loadFile(scriptsPath, script)
      }
    }
  })
}
