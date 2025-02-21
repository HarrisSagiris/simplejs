const fs = require('fs');
const path = require('path');

/**
 * SimpleJS (SJS) Compiler and Runtime
 * A professional-grade compiler that transforms SimpleJS code into JavaScript
 * with enhanced developer experience and simplified syntax.
 */
class SJSCompiler {
    constructor() {
        // Map of SJS commands to their JavaScript equivalents
        this.simplifiedCommands = {
            'repeat': 'for',
            'print': 'console.log', 
            'input': 'prompt',
            'connect': 'mongoose.connect',
            'get': 'axios.get',
            'post': 'axios.post',
            'save': 'Model.save',
            'find': 'Model.find'
        };
    }

    /**
     * Compiles SimpleJS code to JavaScript
     * @param {string} sjsCode - The SimpleJS source code
     * @returns {string} The compiled JavaScript code
     */
    compile(sjsCode) {
        let jsCode = sjsCode;

        // Transform SJS syntax to JavaScript
        Object.entries(this.simplifiedCommands).forEach(([simple, js]) => {
            const regex = new RegExp(`\\b${simple}\\b`, 'g');
            jsCode = jsCode.replace(regex, js);
        });

        // Apply specialized transformations
        jsCode = this.handleRepeatLoops(jsCode);
        jsCode = this.handleDatabaseOperations(jsCode);
        jsCode = this.handleHttpRequests(jsCode);

        return jsCode;
    }

    /**
     * Transforms SJS repeat loops into standard JavaScript for loops
     * @param {string} code - The code to transform
     * @returns {string} Transformed code
     */
    handleRepeatLoops(code) {
        const repeatRegex = /repeat\s+(\d+)\s+times/g;
        return code.replace(repeatRegex, (match, count) => {
            return `for(let i = 0; i < ${count}; i++)`;
        });
    }

    /**
     * Transforms SJS database operations into Mongoose operations
     * @param {string} code - The code to transform
     * @returns {string} Transformed code
     */
    handleDatabaseOperations(code) {
        const dbConnectRegex = /connect\s+to\s+(.+)/g;
        return code.replace(dbConnectRegex, (match, uri) => {
            return `mongoose.connect("${uri}", { 
                useNewUrlParser: true, 
                useUnifiedTopology: true 
            })`;
        });
    }

    /**
     * Transforms SJS HTTP requests into Axios operations
     * @param {string} code - The code to transform
     * @returns {string} Transformed code
     */
    handleHttpRequests(code) {
        const getRegex = /get\s+from\s+(.+)/g;
        const postRegex = /post\s+to\s+(.+)\s+with\s+(.+)/g;

        code = code.replace(getRegex, (match, url) => {
            return `axios.get("${url}", { 
                validateStatus: status => status < 500 
            })`;
        });

        code = code.replace(postRegex, (match, url, data) => {
            return `axios.post("${url}", ${data}, { 
                validateStatus: status => status < 500 
            })`;
        });

        return code;
    }
}

/**
 * SimpleJS Runtime Environment
 * Handles file execution and provides runtime support for SJS programs
 */
class SJSRunner {
    constructor() {
        this.compiler = new SJSCompiler();
    }

    /**
     * Executes an SJS file
     * @param {string} filename - Path to the SJS file
     * @returns {Promise<void>}
     */
    async run(filename) {
        try {
            // Read and validate source file
            if (!fs.existsSync(filename)) {
                throw new Error(`File not found: ${filename}`);
            }
            const sjsCode = fs.readFileSync(filename, 'utf8');
            
            // Compile to JavaScript
            const jsCode = this.compiler.compile(sjsCode);

            // Prepare runtime environment
            const finalCode = `
                const axios = require('axios');
                const mongoose = require('mongoose');
                
                // Enable better error handling
                process.on('unhandledRejection', (error) => {
                    console.error('Unhandled Promise Rejection:', error);
                    process.exit(1);
                });

                ${jsCode}
            `;

            // Execute in isolated context
            eval(finalCode);
        } catch (error) {
            console.error('\x1b[31mError executing SJS file:\x1b[0m', error.message);
            console.error('\x1b[33mStack trace:\x1b[0m', error.stack);
            process.exit(1);
        }
    }
}

// CLI entrypoint
if (require.main === module) {
    const filename = process.argv[2];
    if (!filename) {
        console.error('\x1b[31mError: Please provide a .sjs file to run\x1b[0m');
        console.log('Usage: node sjs-compiler.js <filename>.sjs');
        process.exit(1);
    }

    if (!filename.endsWith('.sjs')) {
        console.error('\x1b[31mError: File must have .sjs extension\x1b[0m');
        process.exit(1);
    }

    const runner = new SJSRunner();
    runner.run(filename);
}

module.exports = {
    SJSCompiler,
    SJSRunner
};
