#!/usr/bin/env node
const { create, extract } = require('./index')
const fs = require('fs-extra')

const argv = require('yargs')
  .command('create', 'create a powfile')
  .option('image', {
    alias: 'i',
    description:`The png image you'd like to encode the data into`
  })
  .option('output', {
    alias: 'o',
    description: 'The output file name (should also be a png)'
   })
  .command('extract <input png>')
  .option('dir', {
    alias: 'd',
    description: 'The output directory'
  })
  .argv

const run = async() => {
  if (argv._[0] === 'create') {
    // powfile create -i example/floppy.png -o floppy-with-data.png example/*
    const png = await create({ image: argv.image, files: argv._.slice(1) })
    fs.writeFile(argv.output, png)
  } else if (argv._[0] === 'extract') {
    // powfile extract floppy-with-data.png -d test-extract
    extract({ image: argv.inputpng, dir: argv.dir })
  }
}

run()

