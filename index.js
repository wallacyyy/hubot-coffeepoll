const fs = require('fs');
const path = require('path');

module.exports = (robot) => {
  const scriptsPath = path.resolve(__dirname, 'src');

  fs.exists(scriptsPath, (exists) => {
    if (exists) {
      const ref = fs.readdirSync(scriptsPath);

      for (let i = 0; i < ref.length; i += 1) {
        robot.loadFile(scriptsPath, ref[i]);
      }
    }
  });
};
