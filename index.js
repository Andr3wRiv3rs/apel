const fs = require('fs')

const args = { } // Command line argument storage

for ( const [key,i] of Object.entries(process.argv) ) if ( /^\-\S/.test(i) ) {
    args[i] = args[i] || []
    const value = process.argv[ Number(key) + 1 ] || null
    if (value) args[i].push(value)

    /*
        Read command line arguments .
        Structure: `-arg value`
    */
}

for ( const i of args['-w'] || [] ) {
    const styles = [] // Individual lines for stylesheet
    const html = [] // Individual HTML lines
    const htmlSuffix = []

    let element = {
        name: null, // Block current element
        text: '', // Element innerText
        indent: '', // Block indentation
        attributes: [], // Attribute lines

        script: {
            lines: [], // Individual lines for inline scripts
            current: false, // Valid script block boolean
            blocks: {} // Storage for block symbols, {}()[]`
        }

        /*
            Element block.
        */
    }

    /*
        Style blocks are not necessary.
        Indentation code blocks are translated to Sass perfectly.
    */

    let root = true

    for ( const [key,line_raw] of Object.entries(fs.readFileSync(i, {
        encoding: 'utf8' 
    }).split( 
        /\r\n|\r|\n/ 

        /* 
            Splits raw code by lines 
        */ 
    ))) {
        const indent = line_raw.match(/^\s*/)[0]
        let line = line_raw.replace(indent, '')

        /* 
            Initiates new line, separate indentation. 
        */


        if ( /<[^<>\s]+>/.test(line) || (!/^<[^<>\s]+>/.test(line) && indent.length === 0 && line.length > 0)) {
            if ( element.name ) {
                const classes = element.name.match(/\.[^\s#\.<>]+/) || []
                const id = element.name.match(/#[^\s#\.<>]+/) || []
                const name = element.name.replace(/((\.|#)[^\s#\.]+|<|>)/g,'')

                html.push(element.indent + `<${name}${
                    classes.length > 0 ? 
                        `\n${element.indent}class="${classes.join(' ').replace(/\./g,'').replace(/^\s/, '')}"` 
                    : ''}${

                    id.length > 0 ? 
                        `\n${element.indent}id="${id[0].replace(/\#/g,'')}"` 
                    : ''}${

                    element.attributes.join(' ')}${

                    element.script.lines.join('')
                }${element.indent}>\n${
                    element.text.replace(/(\s|\n)/g, '').length > 0 ? element.indent + `{{${
                        element.text
                    }}}` : ''
                }`.replace(/(\s|\n)*\"/g, '"'))

                htmlSuffix.push(element.indent + `</${name}>`)

                element.name = ''
                element.attributes = []
            }

            
            if (indent.length <= element.indent.length) html.push(
                htmlSuffix.splice(htmlSuffix.length - 1, 1)
            )
        }


        if ( !/^<[^<>\s]+>/.test(line) && indent.length === 0 && line.length > 0 ) {
            root = true

            /*
                Tests if indent level is at level 0, 
                as long as there is no element tag. 

                Does not count blank lines. 
            */
        }


        // Parse element tags

        if ( /<[^<>\s]+>/.test(line) ) {
            element.name = line.match(/\<[^\<\>\s]+\>/)[0]

            element.indent = indent
            element.text = line.replace(/\<[^\<\>\s]+\>/, '')

            styles.push(indent + element.name.replace(/(<|>)/g,''))

            root = false

            /*
                Tests for element tags and assigns the element to the current block.
                Makes a new entry in the styles array.
            */
        }


        if ( (!/^</.test(line) || element.script.current) && line.length > 0 ) {

            // Parse styles

            if ( !/=/.test(line) && !root && !element.script.current ) {
                styles.push( indent + line )
                
                /* 
                    Appends new styles to the styles array. 
                */

            } 
            

            // Start script block

            else if ( /^@[^@\s]+\s=/.test(line) && indent.length > 0 && !element.script.current ) {
                element.script.current = true

                line = line.replace(/=\s?/, '="')

                /* 
                    Looks for @ scripts (@click, @mousemove, etc),
                    then start a new script block.

                    @ translates to either v-on: (Vue) or on (Native)
                */

                if ( !/({|}|\]|\)|\(|\[|`)/.test(line) ) {
                    element.script.lines.push( '\n' + indent + line )
                    element.script.current = false

                    /* 
                        Ends block if test is unsuccessful for block symbols.
                    */
                }
            }

            else if ( /^[^\s@]+\s?=/.test(line) && !element.script.current) {
                element.attributes.push(
                    `\n${indent}${line.match(/^[^\s@]+\s?=/)[0]}"${line.replace(/^[^\s@]+\s?=\s?/, '')}"`
                )
            }
        }


        // Parse script block

        if ( element.script.current && !root ) { 

            // Add line to script block when block is unclosed.

            element.script.lines.push( '\n' + indent + line )


            // Match and iterate from block symbols

            for ( const i of line.match(/({|}|\]|\)|\(|\[|`)/g) || [] ) {
                switch (i) {
                    case '}': element.script.blocks['{']--; break;
                    case ']': element.script.blocks['[']--; break;
                    case ')': element.script.blocks['(']--; break;

                    default:
                        if (element.script.blocks[i]) element.script.blocks[i]++
                        else element.script.blocks[i] = 1

                        if (i === '`' && element.script.blocks['`'] > 1) element.script.blocks[i] = 0

                    /* 
                        Adds to or subtracts from individual block levels. 
                    */
                }


                // End block if all block symbols closed

                element.script.current = false;

                for ( const i of Object.values(element.script.blocks) ) {
                    if (i > 0) element.script.current = true
                }
            }


            // End script block with a new line

            if ( !element.script.current ) element.script.lines.push('"\n')
        }
    }

    console.log( styles.join('\n') )
}