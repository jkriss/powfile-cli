const powfile = require('powfile')
const fs = require('fs-extra')
const path = require('path')
const commondir = require('commondir')
const mime = require('mime')
const glob = require('glob-promise')
const { parseResponse } = require('parse-raw-http').parseResponse

const create = async ({ image, files }) => {
  console.log('creating...')
  const imageData = await fs.readFile(image)
  const commonParentDir = commondir(process.cwd(), files)
  const parentPrefix = path.relative(process.cwd(), commonParentDir)+path.sep
  const fileMap = {}
  
  // get *all* the files, recursively
  let allFiles = files.slice(0)
  await Promise.all(files.map(async f => {
    const matches = await glob(`${f}/**`)
    matches.forEach(m => {
      if (!allFiles.includes(m)) allFiles.push(m)
   })
  }))
  allFiles = allFiles.filter(f => !fs.lstatSync(f).isDirectory())

  // if it's a single file, just pack it
  if (allFiles.length === 1) {
    const f = allFiles[0]
    const data = await fs.readFile(f)
    return powfile.create({ image: imageData, data, contentType: mime.getType(f) })
  } else {
    await Promise.all(allFiles.map(async f => {
      console.log("reading", f)
      const fileData = await fs.readFile(f)
      fileMap[f.slice(parentPrefix.length)] = fileData
    }))
    return powfile.create({ image: imageData, files: fileMap }) 
  }
}

const extract = async ({ image, dir='.' }) => {
  await fs.mkdirp(dir)
  const imageData = await fs.readFile(image)
  const extracted = await powfile.parse(imageData, { unzip: true })
  if (extracted instanceof Buffer) {
    const { headers, bodyData } = parseResponse(extracted, { decodeContentEncoding: true })
    const ext = mime.getExtension(headers['content-type'])
    const outputFilename = `index.${ext}`
    console.log("extracting", outputFilename)
    const outputPath = path.join(dir, outputFilename)
    await fs.mkdirp(path.dirname(outputPath))
    await fs.writeFile(outputPath, bodyData)
  } else {
    extracted.forEach(async filepath => {
      if (!filepath.match(/\/$/)) {
        console.log("extracting", filepath)
        const outputPath = path.join(dir, filepath)
        await fs.mkdirp(path.dirname(outputPath))
        const data = await extracted.file(filepath).async("nodebuffer")
        await fs.writeFile(outputPath, data)
      }
    })
  }
}

module.exports = {
  create,
  extract
}
