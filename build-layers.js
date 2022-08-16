const fs = require('fs');
const cp = require('child_process');
const os = require('os');
const excludedFolders = ['node_modules']

const checkLayersTree = (baseDir) => {
    const stat = fs.statSync(`${baseDir}`)
    if (!stat.isDirectory()) {
        console.log(`${baseDir} is a file`)
        return
    }
    const dirs = fs.readdirSync(baseDir)
    dirs.map((dir) => {
        const stat = fs.statSync(`${baseDir}/${dir}`)
        if (!excludedFolders.includes(dir) && stat.isDirectory())
            checkLayersTree(`${baseDir}/${dir}`)
    })
    if (fs.existsSync(`${baseDir}/package.json`)) {
        const npmCmd = os.platform().startsWith('win') ? 'npm.cmd' : 'npm';

        // install folder
        cp.spawn(npmCmd, ['i'], {
            env: process.env,
            cwd: baseDir,
            stdio: 'inherit'
        });
    }
}

checkLayersTree('./lambda/layers')
