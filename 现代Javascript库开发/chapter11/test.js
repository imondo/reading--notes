function parsehtml(html) {
    // 单双引号转义
    html = String(html).replace(/('|')/g, '\\$1')
    const lineList = html.split(/\n/)
    let code = ''
    for (const line of lineList) {
        code += ';__code__ += ("' + line + '")\n'
        console.log(code)
    }
    return code;
}

function parsejs(code) {
    code = String(code);

    const reg = /^=(.*)$/;
    let html;
    let arr;
  
    // =
    // =123 ['=123', '123']
    if ((arr = reg.exec(code))) {
      html = arr[1]; // 输出
      return ';__code__ += (' + html + ')\n';
    }
  
    //原生js
    return ';' + code + '\n';
}

console.log(parsejs(`
<div><%= name %></div>
`))

console.log(parsejs(`
<div>
  <% list.forEach(name => { %>
    <%=name%>
  <% }) %>
<div>`))

const tpl = new Function('__data__', 'b', 'console.log(__data__, b)')

tpl(11, 2)