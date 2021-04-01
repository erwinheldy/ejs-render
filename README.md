# ejs-render
Simple ejs template compiler with --watch support

## Installation
`npm i ejs-render -g`

## Features
- watch support
- fast, only render changed files

## Example
`ejs-render --input=src/ejs --data=src/ejs/data.json --output=dist/html`

`ejs-render --input=src/ejs --data=src/ejs/data.json --output=dist/html --watch`

## Options
- `--input=[dir]`       Input directory
- `--data=[file.json]`  Data file
- `--output=[dir]`      Output directory
- `--watch`             Enable watch
- `--delay`             The millisecond delay between a file change and task execution. Default: `200`