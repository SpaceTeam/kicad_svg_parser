# Kicad to SVG converter (kicad_svg_parser)

This module parses a `*.kicad_sch` file and translates it to a stylable SVG file. It works with the new [S-Expression](https://dev-docs.kicad.org/en/file-formats/sexpr-schematic/) file format used in KiCad version 6.0 and higher.

# Installation

Install using npm (package is not in npm package registry, will be cloned from this repo by npm)

```
npm install SpaceTeam/kicad_svg_parser
```

# Usage

## Basic (Commandline)

The tool can be run from the command line using `npx`:

```
npx kicad_svg_parser <path to schematic> [output_file]
```

If output file is omitted the parser will output a file in the same folder as the schematic with `.html` appended.

In this configuration the parser generates the svg content with default settings, and embeds it in html with inline styles, producing a standalone viewable file of the KiCad schematic.

## Advanced

For more configuration options, the parser can be used as a module:

```typescript
import * as kicad_parser from "kicad_parser"

//Parse schematic
const schematicTxt = "..."
const schematic = kicad_parser.readSchematic(schematicTxt)
//Create svg generator
const config: SVGConfiguration = {}
const generator = kicad_parser.SVGGenerator(config)
//Generate svg
const out = generator.generateSVG(schematic)
```

See [SVGConfiguration](src/svg/svg_api.ts) for all available generator options, [svg_generator.ts](src/svg/svg_generator.ts) for default settings and [Schematic](src/kicad/kicad_types.ts) for all available schematic properties and data types of KiCad elements.

Example usage as module:

```typescript
import * as fs from "fs" 
import * as kicad_parser from "kicad_parser"

export function convertPNID(schematic_file_name: string, output_file_name?: string) {
    output_file_name = output_file_name ?? schematic_file_name+".svg"

    // Read schematic file
    // Schematic file path needs to be passed as the first argument of the script
    const schematic_txt = fs.readFileSync(schematic_file_name, 'utf-8');
    // parse the schematic file contents
    const schematic = kicad_parser.readSchematic(schematic_txt)
    // log schematic version
    console.info(`Loaded schematic '${schematic_file_name}'`)
    console.info(`- version: ${schematic.version}`)
    console.info(`- symbols: ${schematic.$symbol?.length ?? 0}`)
    console.info(`- wires: ${schematic.$wire?.length ?? 0}`)


    // create a generator with customized settings
    const generator = new kicad_parser.SVGGenerator({
        debug: kicad_parser.DEFAULT_SVG_DEBUG_SETTINGS,
        classes: kicad_parser.DEFAULT_SVG_CLASSES,
        styleVars: kicad_parser.DEFAULT_SVG_STYLEVARS,
        createHiddenTexts: true,
        callbacks: {
            NET_ATTRIBUTES: net => {
                return `data-pnid-net="${net.name}"`
            },
            SYMBOL_ATTRIBUTES: symbol => {
                const unit = symbol.$property?.find(p => p.key === "Unit")?.value
                const sensorTag = ":sensor"
                const sensor = symbol.$property?.find(p => p.key === "Value" && p.value.endsWith(sensorTag))?.value?.slice(0, -sensorTag.length)
                const content = symbol.$property?.find(p => p.key === "Data_Content")?.value
                const type = symbol.lib_id.substring(symbol.lib_id.indexOf(":")+1)

                const typeAttr = `data-pnid-type="${type}"`
                const unitAttr = `data-pnid-unit="${unit ?? ""}"`
                const sensorAttr = sensor ? `data-pnid-sensor="${sensor}"` : ""
                const contentAttr = `data-pnid-content="${content ?? ""}"`

                return `pointer-events="bounding-box" ${typeAttr} ${unitAttr} ${sensorAttr} ${contentAttr}`
            },
            PROPERTY_ATTRIBUTES: property => {
                return `data-pnid-property="${property.key}"`
            }
        }
    })
    // generate svg file contents
    console.info(`Generating html for schematic...`)
    const svg = generator.generateSVG(schematic)
    console.info(`Saving file '${output_file_name}'...`)
    // save svg file
    fs.writeFileSync(output_file_name, svg)
    console.info(`Done.`)
}
```

# Internals

# Build and Test

The package can be built by running `npm build`, which builds the parser from the `.pegjs` grammar and compiles typescript to javascript.

Running `npm test` (after build, because otherwise the parser will not have been generated) compiles typescript and runs the parser on the test schematic file, producing `out.html` in the root folder.