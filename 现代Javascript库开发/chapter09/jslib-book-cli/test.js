const inquirer = require('inquirer');

inquirer.prompt([
    {
        type: 'input',
        name: 'name',
        message: '仓库的名称',
        default: 'mylib'
    },
    {
        type: 'confirm',
        name: 'test',
        message: 'Are you test?',
        default: true
    },
    {
        type: 'list',
        name: 'fruit',
        message: '选择水果',
        choices: ['苹果', '香蕉', '梨子'],
        filter: val => {
            const map = {
                苹果: 'apple',
                香蕉: 'banana',
                梨子: 'pear'
            }
            return map[val]
        },
        default: true
    }
]).then(answers => {
    console.log(answers)
})