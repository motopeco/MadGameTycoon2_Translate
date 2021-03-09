const util = require('util')
const path = require('path')
const fs = require('fs')
const iconv = require('iconv-lite')
const parser = require('csv-parse/lib/sync')
const _ = require('lodash')
const readFile = util.promisify(fs.readFile)
const writeFile = util.promisify(fs.writeFile)
const mkdir = util.promisify(fs.mkdir)

function getCoding (fileName) {
    switch (fileName) {
        case 'Themes_EN.txt':
            return 'utf16-le'
        default:
            return 'utf-8'
    }
}

async function run () {
    try {
        /** @type {string[]} */
        const files = await fs.readdirSync(__dirname)
        const csvFiles = files.filter(fileName => fileName.match(/\.csv$/))

        for (const csvFile of csvFiles) {
            const folderName = csvFile.replace(/\.csv$/, '')
            await mkdir(path.resolve(__dirname, 'output', folderName))

            const f = await readFile(csvFile)
            const csv = parser(f.toString(), { columns: true })
            csv.shift()

            // ファイル名でグループ化
            const groupData = _.groupBy(csv, 'ファイル名')

            for (const key of Object.keys(groupData)) {
                const datum = groupData[key].map(v => {
                    const values = Object.values(v)
                    const orig = values[2]
                    const trans = values[3]

                    return trans === '' ? orig : trans
                })

                const str = iconv.encode('\uFEFF' + datum.join('\r\n'), getCoding(key))
                await writeFile(path.resolve(__dirname, 'output', folderName, key), str)
            }
        }

    } catch (e) {
        console.log(e)
    }
}

run()
