#! /usr/bin/env node

import { exit } from "process";
import * as fs from "fs" 
import * as kicad_parser from "../index"
import { SchematicData } from "../kicad/schematic_data";

if (process.argv.length < 3) {
    console.error("Expected usage: kicad_svg_parser <path to schematic file>")
    exit(1)
}

const schematic_file_name = process.argv[2]
const output_file_name = process.argv.length >= 4 ? process.argv[3] : schematic_file_name+".html"

// Read schematic file
// Schematic file path needs to be passed as the first argument of the script
const schematic_txt = fs.readFileSync(schematic_file_name, 'utf-8');
// parse the schematic file contents
const schematic = kicad_parser.readSchematic(schematic_txt)
const data = new SchematicData(schematic)
// log schematic version
console.info(`Loaded schematic '${schematic_file_name}'`)
console.info(`- version: ${schematic.version}`)
console.info(`- symbols: ${schematic.$symbol?.length ?? 0}`)
console.info(`- wires: ${schematic.$wire?.length ?? 0}`)


// create a generator with default settings
const generator = new kicad_parser.SVGGenerator()
// generate html file contents
console.info(`Generating html for schematic...`)
const html = generator.generateKicadStyleHTML(data)
console.info(`Saving file '${output_file_name}'...`)
// save html file
fs.writeFileSync(output_file_name, html)
console.info(`Done.`)