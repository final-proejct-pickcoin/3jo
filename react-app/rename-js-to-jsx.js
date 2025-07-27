// rename-js-to-jsx.js
const fs = require("fs")
const path = require("path")

function renameRecursively(dir) {
  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file)
    const stat = fs.statSync(fullPath)

    if (stat.isDirectory()) {
      renameRecursively(fullPath)
    } else if (fullPath.endsWith(".js")) {
      const newPath = fullPath.replace(/\.js$/, ".jsx")
      fs.renameSync(fullPath, newPath)
    }
  })
}

renameRecursively("./dist")