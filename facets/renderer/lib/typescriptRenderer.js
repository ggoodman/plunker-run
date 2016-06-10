'use strict';

const Bluebird = require('bluebird');
const Boom = require('boom');
const Crypto = require('crypto');
const Fs = require('fs');
const Path = require('path');
const Typescript = require('typescript');
const _ = require('lodash');


const REQUEST_MATCH = /\.js/;
const SOURCE_EXT = ['.ts'];
const USE_PROGRAM = false; // If we ever wanted to do multi-file compilation, this is a flag away.


module.exports = {
    name: 'typescript',
    getRenderer,
};


function getRenderer(preview, pathname) {
    const tsConfigEntry = preview.get('tsconfig.json');
    const definitions = Fs.readFileSync(require.resolve('typescript/lib/lib.d.ts'), 'utf8');
    let sourcename;
    let entry = preview.get(pathname);
    
    if (entry && REQUEST_MATCH.test(pathname) && tsConfigEntry) {
        return render;
    }
    
    for (const ext of SOURCE_EXT) {
        sourcename = pathname.replace(REQUEST_MATCH, ext);
        entry = REQUEST_MATCH.test(pathname)
            ?   preview.get(sourcename)
            :   undefined;
        
        if (entry) {
            return render;
        }
    }
    
    return;
    
    
    function render(request) {
        const code = entry.content.toString('utf8');
        
        return new Bluebird((resolve, reject) => {
            const compilerOptions = Typescript.getDefaultCompilerOptions();
            const compilerHost = {
                fileExists: (pathname) => {
                    const exists = !!preview.get(pathname.replace(/^\//, ''));
                    
                    console.log('fileExists', pathname, exists);
                    
                    return exists;
                },
                getSourceFile: (pathname, v) => {
                    if (pathname === '/lib.d.ts') {
                        return Typescript.createSourceFile(pathname, definitions, v);
                    }
                    
                    const entry = preview.get(pathname.replace(/^\//, ''));
                    
                    // console.log('getSourceFile', pathname, v, entry);
                    
                    if (!entry) throw Boom.notFound();
                    
                    return Typescript.createSourceFile(pathname, entry.content.toString('utf8'), v);
                },
                writeFile: function (filename, text) {
                    const pathname = filename.split('/').filter(Boolean).join('/');
                    const encoding = 'utf8';
                    const content = new Buffer(text, encoding);
                    const etag = Crypto.createHash('md5').update(content).digest('hex');
                    
                    console.log('writeFile', filename, text);
                    
                    preview.entries[pathname] = {
                        pathname,
                        content,
                        encoding,
                        etag,
                    };
                },
                getDefaultLibFileName: _.constant('/lib.d.ts'),
                useCaseSensitiveFileNames: _.constant(false),
                getCanonicalFileName: _.identity,
                getCurrentDirectory: _.constant('/'),
                getNewLine: _.constant('\n'),
                readDirectory: (baseName, extension, exclude) => {
                    const baseParts = baseName.split('/').filter(Boolean);
                    const files = _(preview.entries)
                        .map(entry => {
                            const parts = entry.pathname.split('/');
                            
                            if (extension && !Typescript.fileExtensionIs(entry.pathname, extension)) return;
                            
                            if (baseParts.length) {
                                for (let i = 0; i < baseParts.length; i++) {
                                    if (baseParts[i] !== parts[i]) return;
                                }
                                
                                parts.splice(0, baseParts.length);
                            }
                            
                            if (exclude && exclude.length) {
                                for (let i = 0; i < exclude.length; i++) {
                                    if (entry.pathname.indexOf(exclude[i]) !== -1) return;
                                }
                            }
                            
                            return parts.length
                                ?   '/' + parts.join('/')
                                :   null;
                        })
                        .filter(Boolean)
                        .valueOf();
                    
                    return files;
                },
            };
            
            if (tsConfigEntry) {
                const json = Typescript.parseConfigFileTextToJson(tsConfigEntry.pathname, tsConfigEntry.content.toString('utf8'));
                const parsed = Typescript.parseJsonConfigFileContent(json.config, compilerHost, '/', compilerOptions);
                
                _.extend(compilerOptions, parsed.options);
            }
            
            if (USE_PROGRAM) {
                compilerOptions.noEmitOnError = true;
                compilerOptions.files = ['/' + entry.filename];
                
                const program = Typescript.createProgram(['/' + entry.pathname], compilerOptions, compilerHost);
                const emitResult = program.emit();
                
                const diagnostics = Typescript.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);
                
                if (diagnostics.length) {
                    logDiagnostics(diagnostics);
                    return reject(new Error('Compilation failed'));
                }
            
                const compiled = preview.get(pathname);
                
                if (!compiled) {
                    throw Boom.notFound();
                }
                
                return resolve(compiled.content);
            } else {
            
                const result = Typescript.transpileModule(code, {
                    compilerOptions,
                    fileName: `/${sourcename}`,
                    reportDiagnostics: true,
                });
                const diagnostics = result.diagnostics;

                if (diagnostics.length) {
                    logDiagnostics(diagnostics);
                    return reject(new Error('Compilation failed'));
                }
            
                return resolve(result.outputText);
            }
            
            function logDiagnostics(diagnostics) {
                _.forEach(diagnostics, diagnostic => {
                    const pos = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
                    
                    preview.log({
                        renderer: 'typescript',
                        level: ['warn', 'error'][diagnostic.category],
                        pathname: diagnostic.file.fileName,
                        row: pos.line,
                        column: pos.character,
                        message: diagnostic.messageText,
                    });
                });
            }
        })
            .catch(e => {
                throw Boom.wrap(e, 400);
            })
            .then(buildReply);
    }
    
    function buildReply(payload) {
        return {
            encoding: 'utf-8',
            etag: Crypto.createHash('md5').update(payload).digest('hex'),
            headers: {
                'Content-Type': 'application/javascript',
            },
            payload,
        };
    }
}
