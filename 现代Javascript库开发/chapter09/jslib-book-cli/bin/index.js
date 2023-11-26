#!/usr/bin/env node
console.log('hello');
var yargs = require('yargs');
console.log(process.argv);
console.log(yargs.argv);

const argv = yargs.option('name', {
    alias: 'N',
    type: 'string'
}).argv;

console.log(argv);

yargs.alias('v', 'version').argv;

yargs.usage('usage: jslib-book-cli [options]')
    .usage('usage: jslib-book-cli <command> [options]')
    .example('jsblib-book-cli new mylib', 'add new lib')
    .alias('h', 'help')
    .alias('v', 'version')
    .epilog('copyright 2023')
    .demandCommand()
    .argv;

// 子命令

yargs.usage('usage: jslib-book-cli [options]')
    .usage('usage: jslib-book-cli <command> [options]')
    .example('jsblib-book-cli new mylib', 'add new lib')
    .alias('h', 'help')
    .alias('v', 'version')
    .command(['new', 'n'], '新建一个项目', function(argv) {
        return yargs.option('name', {
            alias: 'n',
            default: 'mylib',
            describe: 'your library name',
            type: 'string'
        })
    }, function (argv) {
        console.log(argv);
        // TODO
    })
    .epilog('copyright 2023')
    .demandCommand()
    .argv;