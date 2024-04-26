function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function distancia(p1, p2) { return Math.sqrt((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2); }

function initSSSP(grafo, s) {
  let dist = {};
  let pred = {};
  for (let v in grafo) {
    if (v != s) {
      dist[v] = Infinity;
      pred[v] = null;
    }
    else {
      dist[v] = 0;
      pred[v] = " ";
    }
  }
  return [dist, pred]; 
}

function dijkstra(grafo, s) {
  let [dist, pred] = initSSSP(grafo, s);
  let path = {};
  let prioQ = [];
  prioQ.push([dist[s], s]);

  let comms = [];
  let arestas = {};

  while (prioQ.length > 0) {
    let [min_d, index, d, u] = prioQ.reduce((acc, [a, b], i) => {
      if (a < acc[0]) {
        return [a, i, a, b];
      }
      return acc;
    }, [Infinity, null, null, null]);
    
    prioQ.splice(index, 1);
    
    if (!path[u]) {
      path[u] = true;
      comms.push(["Enter", u]);
      if (dist[u] != 0) 
        comms.push(["Fix", [pred[u], u]]);
    }

    for (let vertice in grafo[u]) {
      //console.log(grafo)
      let [w, v] = grafo[u][vertice];
      let alt = w + dist[u];
      
      if (!arestas[[v, u]] && !arestas[[u, v]]) {
        comms.push(["Visit", [u, v]]);
      }

      if (dist[v] > alt) {
        dist[v] = alt;
        
        if (pred[v] != null) {
          comms.push(["Skip", 0]);
          comms.push(["Remove", [pred[v], v]]);
        }
        comms.push(["Accept", [u, v]]);
        
        pred[v] = u;
        prioQ.push([dist[v], v]);
      }
      else if (!arestas[[v, u]] && !arestas[[u, v]]) {
        comms.push(["Remove", [u, v]])
      }
      
      arestas[[u, v]] = true;
    }
  }

  //comms.push(["End", 0]);

  return [dist, pred, comms];
}

function random_grafo(n, comprimento, largura) {
  /*const pos = d3.range(n).map(() => [
    Math.random() * comprimento + 100,
    Math.random() * largura + 100,
  ]);*/
  //console.log(pos);
  
  const pos = [];
  let x; let y; let perto;
  while (pos.length < n) {
    x = Math.random() * comprimento + 100;
    y = Math.random() * largura + 75;
    perto = pos.some( ([a, b]) => {
      const dist = distancia([x - a, y - b], [0, 0]);
      return dist < 50;
    });

    if (!perto) pos.push([x, y]);
  }

  const delaunay = d3.Delaunay.from(pos);
  const { halfedges, triangles, hull } = delaunay;
  
  let ID = 0;
  const nodes = pos.map(() => ({
    id: ID++,
    x: pos[ID-1][0],
    y: pos[ID-1][1]
  }));

  ID = 1;
  const links = [
      ...Array.from(hull, (i, k) => [i, hull[(k + 1) % hull.length]]),
      ...Array.from(halfedges, (i, j) => i > j ? [[triangles[i], triangles[j]]] : []).flat()
    ].map(([i, j]) => ({ id: ID++, source: nodes[i].id, target: nodes[j].id }));
  
  //console.log(nodes);
  //console.log(links);
  
  ID = 0;  
  
  const grafo = {};
  for (let i in links) {
    let source = links[i].source;
    let target = links[i].target;
    let d = distancia(pos[source], pos[target]);
    if (!grafo[source]) grafo[source] = [];
    if (!grafo[target]) grafo[target] = [];
    grafo[source].push([d, target]);
    grafo[target].push([d, source]);
  };

  //console.log(grafo);
  return [nodes, links, grafo];
}

async function visualizar(arestas, comms, delay) {
  
  function find_id(p, ordem, arestas) {
    if (ordem == 'Enter' || ordem == 'Skip') return null;
    else {
      let [s, t] = p;
      let id = 0;
      for (let i in arestas) {
        if ((s == arestas[i].source && t == arestas[i].target) || (t == arestas[i].source && s == arestas[i].target)) {
          id = arestas[i].id;
          break;
        }
      }
      return id;
    } 
  }

  function nos_possiveis(atual, arestas) {
    let res = [];
    for (let i in arestas) {
      if (arestas[i].source == atual) res.push(arestas[i].target);
      else if (arestas[i].target == atual) res.push(arestas[i].source);
    }
    return res;
  }
  
  let atual = null;
  let ordem_ant = null;
  
  let nos_visitados = [];
  let nos_acessiveis = [];
  let nos_possivel = [];
  
  var no; 
  var aresta;
  var linhas;
  
  var no_visitado;
  var no_acessivel;
  var no_aceite;

  var source = svg.selectAll(".node")
    .filter(function(d) {return d.id == comms[0][1];})
    .style("stroke", "#b481f7")
    .style("fill", "#8a3af2");
  
  var nodes = svg.selectAll(".node");
  var links = svg.selectAll(".link");
  var code = pseudo.selectAll(".pseudocode");
  var loop = code.filter(d => { return d.linha == 9;});

  linhas = code.filter(d => { return d.linha >= 3 && d.linha <= 7 })
    .style("fill", "red");
  
  await sleep(delay);

  for (let i in comms) {
    //console.log(comms[i]);
    //console.log(nos_visitados);
    //console.log(nos_acessiveis);

    let [ordem, p] = comms[i];
  
    if (ordem == 'Enter') {
      await sleep(delay);
      if (atual != null) no.attr("r", 10);

      
      if (i != 0) {
        //links.style("opacity", 0.1);
        await sleep(delay);
        nodes.style("fill", "#cfcfcf");
        no_aceite.style("fill", "#ebc934");
        no_visitado.style("fill", '#fa6c61');
        source.style("fill", "#8a3af2");
      } 
      atual = p;
    }

    code.style("fill", "#000000");
    loop.style("fill", "red");
    
    let id_aresta = find_id(p, ordem, arestas);

    no = svg.selectAll(".node")
      .filter(function(d) { return d.id == atual; });

    aresta = svg.selectAll(".link")
      .filter(function(d) { return d.id == id_aresta; });
    
    if (ordem == 'Enter') {
      await sleep(delay);
      no
      .style("fill", '#26c92c')
      .attr("r", 17)
      .style("opacity", 1);
      
      nos_visitados.push(atual);

      linhas = code.filter(d => { return d.linha >= 9 && d.linha <= 12; })
        .style("fill", "red");
      
      await sleep(delay*2);
      
      //links.style("opacity", 1);
      no.attr("r", 12)
      //await sleep(delay);
      
      //nos_acessiveis = nos_possiveis(atual, arestas);
            
      /*no_acessivel = svg.selectAll(".node")
        .filter(function(d) { return nos_acessiveis.includes(d.id) && d.id != comms[0][1] && !nos_visitados.includes(d.id) })
        .style("fill", "#0398fc");*/
    }
    else if (ordem == 'Visit') {
      aresta
        .style("stroke", '#0398fc');
      var target = svg.selectAll(".node")
        .filter(d => { return d.id == p[1]; })
        .style("fill", "#0398fc");
      
      linhas = code.filter(d => { return d.linha >= 14 && d.linha <= 15; })
        .style("fill", "red");
      await sleep(delay);
    }
    else if (ordem == 'Accept') {
      aresta
        .style("stroke", '#ebc934');
        nos_possivel.push(p[1]);
        
      var no_testado = svg.selectAll(".node")
        .filter(function(d) { return d.id == p[1] });
        
      no_testado.style("fill", "#ebc934");

      linhas = code.filter(d => { return d.linha >= 16 && d.linha <= 19 || d.linha == 14; })
        .style("fill", "red");

      await sleep(delay);   
    }
    else if (ordem == 'Fix') {
      //nos_acessiveis = nos_possiveis(atual, arestas);
      aresta
        .style("stroke", '#fa6c61');
     
      /*no_acessivel = svg.selectAll(".node")
        .filter(function(d) { return nos_acessiveis.includes(d.id) && d.id != comms[0][1] && !nos_visitados.includes(d.id) })
        .style("fill", "#0398fc");*/
      
      linhas = code.filter(d => { return d.linha >= 9 && d.linha <= 12; })
        .style("fill", "red"); 

      await sleep(delay+500);
    }
    else if (ordem == 'Remove') {
      aresta
        .style("stroke", '#eeeeee');
      
      linhas = code.filter(d => { return d.linha == 14; })
        .style("fill", "red");

      if (ordem_ant != 'Skip') {
        var no_descartado = svg.selectAll(".node")
          .filter(function(d) { return d.id == p[1] });
          if (nos_possivel.includes(p[1])) no_descartado.style("fill", "#ebc934");
          else no_descartado.style("fill", "#cfcfcf");
        await sleep(delay);
      }
    }
    
    no_visitado = svg.selectAll(".node")
      .filter(function(d) { return nos_visitados.includes(d.id) });

    no_aceite = svg.selectAll(".node")
      .filter(function(d) { return nos_possivel.includes(d.id) && !nos_visitados.includes(d.id)});
    //console.log(ordem_ant);
    //console.log(ordem);
  
    ordem_ant = ordem;
  }
  no.attr("r", 10);
  nodes.style("fill", "#cfcfcf");
  no_visitado.style("fill", '#fa6c61');
  source.style("fill", "#8a3af2");
  code.style("fill", "#000000");
  linhas = code.filter(d => { return d.linha == 21; }).style("fill", "red");
  await sleep(delay+500);
  linhas.style("fill", "black");
}

const [nodes, links, graph] = random_grafo(50, 500, 500)
const [dist0, pred0, comms] = dijkstra(graph, 0);

/* 
 1  function Dijkstra(Graph, source):
 2      
 3      for each vertex v in Graph.Vertices:
 4          dist[v] ← INFINITY
 5          prev[v] ← UNDEFINED
 6      dist[source] ← 0
 7      add source to Q
 8      
 9      while Q is not empty:
10          u ← vertex in Q with min dist[u]   --> Enter and Fix
11          fix u
12          remove u from Q                    --> Enter and Fix
13        
14          for each neighbor v of u not fixed:  --> Visit
15              alt ← dist[u] + Graph.Edges(u, v) --> Visit
16              if alt < dist[v]:                 --> Accept
17                  dist[v] ← alt
18                  prev[v] ← u
19                  add v to Q
20
21      return dist, prev
*/

const pcode = [
  {linha: 1, texto: "function Dijkstra(Graph, source):", frente: 0},
  {linha: 3, texto: "for each vertex v in Graph.Vertices:", frente: 4},
  {linha: 4, texto: "dist[v] ← INFINITY", frente: 8},
  {linha: 5, texto: "prev[v] ← UNDEFINED", frente: 8},
  {linha: 6, texto: "dist[source] ← 0", frente: 4},
  {linha: 7, texto: "add source to Q", frente: 4},
  {linha: 9, texto: "while Q is not empty:", frente: 4},
  {linha: 10, texto: "u ← vertex in Q with min dist[u]", frente: 8},
  {linha: 11, texto: "fix u", frente: 8},
  {linha: 12, texto: "remove u from Q", frente: 8},
  {linha: 14, texto: "for each neighbor v of u not fixed:", frente: 8},
  {linha: 15, texto: "alt ← dist[u] + Graph.Edges(u, v)", frente: 12},
  {linha: 16, texto: "if alt < dist[v]:", frente: 12},
  {linha: 17, texto: "dist[v] ← alt", frente: 16},
  {linha: 18, texto: "prev[v] ← u", frente: 16},
  {linha: 19, texto: "add v to Q", frente: 16},
  {linha: 21, texto: "return dist, prev", frente: 4}
];

var svg = d3.select("#graphContainer")
  .append("svg")
  .attr("width", 650)
  .attr("height", 650);

var pseudo = d3.select("#pseudocode")
  .append("svg")
  .attr("width", 650)
  .attr("height", 650);

var link = svg.selectAll(".link")
  .data(links)
  .enter().append("line")
  .attr("class", "link")
  .attr("x1", d => nodes.find(np => np.id == Math.min(d.source, d.target)).x)
  .attr("y1", d => nodes.find(np => np.id == Math.min(d.source, d.target)).y)
  .attr("x2", d => nodes.find(np => np.id == Math.max(d.source, d.target)).x)
  .attr("y2", d => nodes.find(np => np.id == Math.max(d.source, d.target)).y)
  .style("stroke", d => {
    var degrade = svg.append("linearGradient")
      .attr("id", "gradient-" + d.id)
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", nodes.find(np => np.id == Math.min(d.source, d.target)).x)
      .attr("y1", nodes.find(np => np.id == Math.min(d.source, d.target)).y)
      .attr("x2", nodes.find(np => np.id == Math.max(d.source, d.target)).x)
      .attr("y2", nodes.find(np => np.id == Math.max(d.source, d.target)).y);

    degrade.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#888888");

    degrade.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#dddddd");

    return "url(#gradient-" + d.id + ")";
  });
 
var node = svg.selectAll(".node")
  .data(nodes)
  .enter().append("circle")
  .attr("class", "node")
  .attr("r", 10)
  .attr("cx", d => d.x)
  .attr("cy", d => d.y);

var node_labels = svg.selectAll(".node-labels")
  .data(nodes)
  .enter().append("text")
  .attr("class", "node-labels")
  .attr("x", d => d.x)
  .attr("y", d => d.y + 3)
  .text(d => d.id);

var code = pseudo.selectAll(".pseudocode")
  .data(pcode)
  .enter().append("text")
  .attr("class", "pseudocode")
  .attr("x", d => 100 + d.frente * 10)
  .attr("y", d => ((d.linha - 1) * 25 + 100))
  .text(d => d.texto);

visualizar(links, comms, 600);

/*
Por fazer:

- Timeline(?)
- Degradê tendo em conta distancia dos nós
- Pseudocódigo e passos atuais
- maybe transiçao melhor do atual 

*/