//========== TYPES ==========
// PANDORAE is a data exploration tool. Once the user's data has been loaded through Flux
// and potentially curated through Zotero and/or rekindled in Chaeros, it is to be sent
// to one of the available Types. Types are simple data visualisation frameworks designed to
// support certain types of data. Each focuses on a certain perspective, and helps the user
// discover patterns on potentially larger datasets.

// =========== NODE MODULES ===========
const { remote, ipcRenderer, shell } = require("electron");
const fs = require("fs");
const d3 = require("d3");
const THREE = require("three");
const userDataPath = remote.app.getPath("userData");
const Dexie = require("dexie");
const csv = require("csv-parser");
const versor = require("versor");
const rpn = require("request-promise-native"); // RPN enables to generate requests to various APIs


var field = document.getElementById("field");

// =========== LOADTYPE ===========
// LoadType is the process that removes the main display canvas and then displays
// the xtype div and xtype SVG element. It is usually called when the data has been
// loaded and rekindled by the type function, i.e. when the visualisation is (almost)
// ready to show
const loadType = () => {
  xtypeDisplay();
  purgeCore();
  xtypeExists = true;
  coreExists = false;
  field.value = "";
};

// =========== XTYPE ===========
const xtype = document.getElementById("xtype"); // xtype is a div containing each (-type) visualisation
const width = xtype.clientWidth; // Fetching client width
const height = xtype.clientHeight; // Fetching client height
const toolWidth = 0.3 * width + 20; // The tooltip is around a third of total available screen width

// ========== TIME ===========
const currentTime = new Date(); // Precise time when the page has loaded
const Past = d3.timeYear.offset(currentTime, -1); // Precise time minus one year
const Future = d3.timeYear.offset(currentTime, 1); // Precise time plus one year

// =========== TIME MANAGEMENT ===========
//Parsing and formatting dates
const parseTime = d3.timeParse("%Y-%m-%d");
const formatTime = d3.timeFormat("%d/%m/%Y");

//locales
const locale = d3.timeFormatLocale({
  dateTime: "%A, le %e %B %Y, %X",
  date: "%d/%m/%Y",
  time: "%H:%M:%S",
  periods: ["AM", "PM"],
  days: [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ],
  shortDays: ["Sun.", "Mon.", "Tue.", "Wed.", "Thu.", "Fri.", "Sat."],
  months: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ],
  shortMonths: [
    "Jan.",
    "Feb.",
    "Mar",
    "Avr.",
    "May",
    "June",
    "Jul.",
    "Aug.",
    "Sept.",
    "Oct.",
    "Nov.",
    "Dec."
  ]
});

const localeFR = d3.timeFormatLocale({
  dateTime: "%A, le %e %B %Y, %X",
  date: "%d/%m/%Y",
  time: "%H:%M:%S",
  periods: ["AM", "PM"],
  days: [
    "dimanche",
    "lundi",
    "mardi",
    "mercredi",
    "jeudi",
    "vendredi",
    "samedi"
  ],
  shortDays: ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."],
  months: [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre"
  ],
  shortMonths: [
    "Janv.",
    "Févr.",
    "Mars",
    "Avr.",
    "Mai",
    "Juin",
    "Juil.",
    "Août",
    "Sept.",
    "Oct.",
    "Nov.",
    "Déc."
  ]
});

const localeEN = d3.timeFormatLocale({
  dateTime: "%A, le %e %B %Y, %X",
  date: "%d/%m/%Y",
  time: "%H:%M:%S",
  periods: ["AM", "PM"],
  days: [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ],
  shortDays: ["Sun.", "Mon.", "Tue.", "Wed.", "Thu.", "Fri.", "Sat."],
  months: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ],
  shortMonths: [
    "Jan.",
    "Feb.",
    "Mar",
    "Avr.",
    "May",
    "June",
    "Jul.",
    "Aug.",
    "Sept.",
    "Oct.",
    "Nov.",
    "Dec."
  ]
});

const localeZH = d3.timeFormatLocale({
  dateTime: "%A, le %e %B %Y, %X",
  date: "%d/%m/%Y",
  time: "%H:%M:%S",
  periods: ["AM", "PM"],
  days: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"],
  shortDays: [
    "星期日",
    "星期一",
    "星期二",
    "星期三",
    "星期四",
    "星期五",
    "星期六"
  ],
  months: [
    "一月",
    "二月",
    "三月",
    "四月",
    "五月",
    "六月",
    "七月",
    "八月",
    "九月",
    "十月",
    "十一月",
    "十二月"
  ],
  shortMonths: [
    "一月",
    "二月",
    "三月",
    "四月",
    "五月",
    "六月",
    "七月",
    "八月",
    "九月",
    "十月",
    "十一月",
    "十二月"
  ]
});

const formatMillisecond = locale.format(".%L"),
  formatSecond = locale.format(":%S"),
  formatMinute = locale.format("%I:%M"),
  formatHour = locale.format("%H"),
  formatDay = locale.format("%d/%m/%Y"),
  formatWeek = locale.format("%d %b %Y"),
  formatMonth = locale.format("%m/%Y"),
  formatYear = locale.format("%Y");

const multiFormat = date =>
  (d3.timeSecond(date) < date
    ? formatMillisecond
    : d3.timeMinute(date) < date
    ? formatSecond
    : d3.timeHour(date) < date
    ? formatMinute
    : d3.timeDay(date) < date
    ? formatHour
    : d3.timeMonth(date) < date
    ? d3.timeWeek(date) < date
      ? formatDay
      : formatWeek
    : d3.timeYear(date) < date
    ? formatMonth
    : formatYear)(date);




// ========= ANTHROPOTYPE =========
const anthropotype = datasetAT => {  // When called, draw the anthropotype

//========== SVG VIEW =============
  var svg = d3.select(xtype)
    .append("svg")
    .attr("id", "xtypeSVG"); // Creating the SVG DOM node

  svg.attr("width", width).attr("height", height); // Attributing width and height to svg

  var view = svg
    .append("g") // Appending a group to SVG
    .attr("class", "view"); // CSS viewfinder properties

  //zoom extent
  var zoom = d3.zoom() // Zoom ability
    .scaleExtent([0.2, 15]) // To which extent do we allow to zoom forward or zoom back
    .translateExtent([[-width * 2, -height * 2], [width * 3, height * 3]])
    .on("zoom", zoomed); // Trigger the "zoomed" function on "zoom" behaviour

    

//======== DATA CALL & SORT =========
  pandodb.anthropotype
    .get(datasetAT)
    .then(datajson => {
      const docData = datajson.content[0].items;

      var criteriaList = [];

      docData.forEach(d => criteriaList.push(d.title));

      var currentCriteria = [];

      const menuBuilder = () => {
        criteriaList.forEach(d => {
          let crit = document.createElement("div");
          crit.className = "criteriaTab";
          crit.id = d;
          crit.innerHTML = d;
          crit.onclick = function() {
            cartoSorter(d);
          };
          document.getElementById("tooltip").appendChild(crit);
        });
      };

      //========== FORCE GRAPH ============
      var simulation = d3.forceSimulation() // Start the force graph
        .alphaMin(0.1) // Each action starts at 1 and decrements "Decay" per Tick
        .alphaDecay(0.01) // "Decay" value
        .force("link",d3.forceLink() // Links has specific properties
            .strength(0.08) // Defining non-standard strength value
            .id(d => d.id)
        ) // Defining an ID (used to compute link data)
        .force("collision", d3.forceCollide(5).iterations(5)) // Nodes collide with each other (they don't overlap)
        .force(
          "charge",
          d3.forceManyBody().strength(d => {
            let str = -70;
            if (d.hasOwnProperty("author")) {
              str = str - d.author.length * 35;
            }
            return str;
          })
        ) // Adding ManyBody to repel nodes from each other
        .force("center", d3.forceCenter(width / 2, height / 2)); // The graph tends towards the center of the svg

      var nodeImage = view.selectAll("nodeImage");
          nodeImage.append("title").text(d => d.name);
      var link = view.selectAll("link");
      var masks = view.selectAll("masks");
      var sortInfo = view.selectAll("sortInfo");
      var name = view.selectAll("name");

      const ticked = () => {
        nodeImage.attr("x", d => d.x).attr("y", d => d.y);
        masks.attr("cx", d => d.x).attr("cy", d => d.y);
        name.attr("x", d => d.x).attr("y", d => d.y);
        sortInfo.attr("x", d => d.x).attr("y", d => d.y);

        link
          .attr("x1", d => d.source.x)
          .attr("y1", d => d.source.y)
          .attr("x2", d => d.target.x)
          .attr("y2", d => d.target.y);
      };

      const cartoSorter = criteria => {
        nodeImage.remove();
        masks.remove();
        name.remove();
        sortInfo.remove();
        link.remove();
        simulation.alpha(1).restart();

        let criteriaIndex = currentCriteria.indexOf(criteria);

        if (criteriaIndex < 0) {
          currentCriteria.push(criteria);
          document.getElementById(criteria).style.backgroundColor = "black";
          document.getElementById(criteria).style.color = "white";
          var newCriteria = { given: "" };
          newCriteria.family = criteria;
        } else {
          currentCriteria.splice(criteriaIndex, 1);
          document.getElementById(criteria).style.backgroundColor = "white";
          document.getElementById(criteria).style.color = "black";
        }

        let data = [];
        let dataCheck = [];
        let links = [];

        currentCriteria.forEach(criteria => {
          docData.forEach(doc => {
            if (doc.title === criteria) {
              doc.id = doc.title;
              doc.author.forEach(auth => {
                let checkCode = auth.family + auth.given;
                if (dataCheck.indexOf(checkCode) < 0) {
                  dataCheck.push(checkCode);
                  auth.crit = [];
                  auth.crit.push(doc.title);
                  data.push(auth);
                } else {
                  for (let j = 0; j < data.length; j++) {
                    if (
                      data[j].family === auth.family &&
                      data[j].given === auth.given
                    ) {
                      data[j].crit.push(doc.title);
                    }
                  }
                }
              });
            }
          });
        });

        data.forEach(d => {
          d.id = d.given + " " + d.family;
          d.crit.forEach(crit => {
            let link = {};
            link.source = d.id;
            link.target = crit;
            links.push(link);
          });
        });

        docData.forEach(doc => {
          for (let i = 0; i < currentCriteria.length; i++) {
            if (currentCriteria[i] === doc.title) {
              data.push(doc);
            }
          }
        });

        nodeImage = view.selectAll("nodeImage") // Create nodeImage variable
          .exit()
          .remove()
          .data(data) // Using the "humans" variable data
          .enter()
          .append("image") // Append images
          .attr("class", "nodeImage") // This class contains the circular clip path
          .attr("height", 40) // Image height
          .attr("width", 40); // Image width

        nodeImage.append("title").text(d => d.name);

        link = view.selectAll("link") // Creatin the link variable
          .exit().remove()
          .data(links) // Link data is stored in the "links" variable
          .enter()
            .append("line")
            .style("fill", "none");

        masks = view.selectAll("masks")
          .exit().remove()
          .data(data)
          .enter()
            .append("circle")
            .attr("r", d => {
              let r = 7;
              if (d.hasOwnProperty("author")) {
                r = r + d.author.length * 4;
              }
              return r;
            })
            .attr("fill", "rgba(63, 191, 191, 0.20)")
            .attr("stroke", "white")
            .attr("stroke-width", 2)
            .call(
              d3.drag()
                .on("start", forcedragstarted)
                .on("drag", forcedragged)
                .on("end", forcedragended)
            );

        sortInfo = view.selectAll("sortInfo")
          .exit().remove()
          .data(data)
            .enter()
            .append("text")
            .attr("pointer-events", "none")
            .attr("dx", 0)
            .attr("dy", 0)
            .style("fill", "black");

        name = view.selectAll("name")
          .exit().remove()
          .data(data)
          .enter()
            .append("text")
            .attr("class", "humans")
            .attr("dx", 7)
            .attr("dy", -5)
            .style("fill", "black")
            .style("cursor", "pointer")
            .style("font-size", "15px")
            .on("click", d => {
              name.filter(e => e === d).style("fill", "DeepSkyBlue");
            })
            .on("dblclick", d => {
              name.filter(e => e === d).style("fill", "black");
            })
            .text(d => d.id);

        simulation.nodes(data).on("tick", ticked);
        simulation.force("link").links(links);
        simulation.alpha(1).restart();
      };

      function forcedragstarted(d) {
        if (!d3.event.active) simulation.alpha(1).restart();
        d.fx = d.x;
        d.fy = d.y;
      }

      function forcedragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
      }

      function forcedragended(d) {
        if (!d3.event.active) simulation.alpha(1).restart();
        d.fx = null;
        d.fy = null;
      }

      loadType();
      menuBuilder();
      cartoSorter(docData[0].title);
    })
    .catch(error => {
      field.value = "error - invalid dataset";
      ipcRenderer.send(
        "console-logs",
        "Anthropotype error: dataset " + datasetAT + " is invalid."
      );
    });

  //======== ZOOM & RESCALE ===========
  svg.call(zoom).on("dblclick.zoom", null);

  function zoomed() {
    view.attr("transform", d3.event.transform);
  }
  ipcRenderer.send("console-logs", "Starting anthropotype");
};



// ========= HYPHOTYPE =========
const hyphotype = id => {
  
 //  SVG VIEW 
  var svg = d3.select(xtype)
    .append("svg")
    .attr("id", "xtypeSVG"); // Creating the SVG DOM node

  svg.attr("width", width).attr("height", height); // Attributing width and height to svg

  var view = svg.append("g") // Appending a group to SVG
    .attr("class", "view"); // CSS viewfinder properties

  //zoom extent
  
  var zoom = d3.zoom()                                      // Zoom ability
      .scaleExtent([0.2, 15])                               // To which extent do we allow to zoom forward or zoom back
      .translateExtent([[-width*2,-height*2],[width*3,height*3]])
      .on("zoom", zoomed);                                  // Trigger the "zoomed" function on "zoom" behaviour

  
      var color =  d3.scaleOrdinal()
      .domain([0, 1])    
      .range([
          "#623500",
          "#970ccd",
          "#53fa4d",
          "#0040bd",
          "#d2d400",
          "#c00092",
          "#2d9300",
          "#ff0d8a",
          "#66ffbf",
          "#ff432f",
          "#01ab6d",
          "#c58eff",
          "#3b5a00",
          "#bfb5ff",
          "#b06500",
          "#0079bf",
          "#fffa94",
          "#200026",
          "#f4ffc7",
          "#a40045",
          "#01a9a4",
          "#ff6e56",
          "#0093b5",
          "#ffb373",
          "#005c77",
          "#7b6100",
          "#d1daff",
          "#0a3500",
          "#ffb8cc",
          "#00392b"
    ]);
   

  //======== DATA CALL & SORT =========

  pandodb.hyphotype.get(id).then(datajson => {

      var corpusRequests = [];

      var tooltipTop =
        "<strong>" +
        datajson.name.toUpperCase() +
        "</strong></br>" +
        "<span>" +
        datajson.content.endpoint +
        "</span></br>";

      var startCorpus = {
        method: "POST",
        uri: datajson.content.endpoint + "/api/", // URI to be accessed
        headers: { "User-Agent": "Request-Promise" }, // User agent to access is Request-promise
        body: {
          method: "start_corpus",
          params: [datajson.content.corpus, datajson.content.password]
        },
        json: true // Automatically parses the JSON string in the response
      };

     Promise.all([rpn(startCorpus)]).then(startingCorpus => {

      let corpusStatus = startingCorpus[0][0].result;


      var getCorpusStats = {
        method: "POST",
        uri: datajson.content.endpoint + "/api/", // URI to be accessed
        headers: { "User-Agent": "Request-Promise" }, // User agent to access is Request-promise
        body: {
          method: "store.get_webentities_stats",
          params: [datajson.content.corpus]
        },
        json: true
      };

      corpusRequests.push(rpn(getCorpusStats));

      var getWebEntities = {
        method: "POST",
        uri: datajson.content.endpoint + "/api/", // URI to be accessed
        headers: { "User-Agent": "Request-Promise" }, // User agent to access is Request-promise
        body: {
          method: "store.get_webentities_by_status",
          params: {corpus:datajson.content.corpus,status:"in", count:100000}
        },
        json: true
      };

      corpusRequests.push(rpn(getWebEntities));

      var getNetwork = {
        method: "POST",
        uri: datajson.content.endpoint + "/api/", // URI to be accessed
        headers: { "User-Agent": "Request-Promise" }, // User agent to access is Request-promise
        body: {
          method: "store.get_webentities_network",
          params: {corpus:datajson.content.corpus}
        },
        json: true
      };

      corpusRequests.push(rpn(getNetwork));

      var getTags = {
        method: "POST",
        uri: datajson.content.endpoint + "/api/", // URI to be accessed
        headers: { "User-Agent": "Request-Promise" }, // User agent to access is Request-promise
        body: {
          method: "store.get_tags",
          params: {namespace:null,corpus:datajson.content.corpus}
        },
        json: true
      };

      corpusRequests.push(rpn(getTags));

    Promise.all(corpusRequests).then(status => {
   
      var links = [];


      let weStatus = status[0][0].result;

      let nodeData = status[1][0].result.webentities;
   

      let networkLinks = status[2][0].result;

      let tags = status[3][0].result.USER;
      
       for (var subTag in tags) {
         let taggedNodes=0;
      
        for (let tagVal in tags[subTag]) {
         
          taggedNodes = taggedNodes+ tags[subTag][tagVal]
        }
       tags[subTag].NA = parseInt(nodeData.length-taggedNodes);
      }
 
      var tagDiv= "<select id='tagDiv'>"

      for (var prop in tags) {
        tagDiv = tagDiv +  '<option value="'+prop+'">'+prop+'</option>';

      }
      tagDiv = tagDiv +  "</select>"


      for (let j = 0; j < nodeData.length; j++) {
        for (let i = 0; i < networkLinks.length; i++) {
          let link = {}
          if(nodeData[j].id===networkLinks[i][0]){
            for (let f = 0; f < nodeData.length; f++) {
              if(nodeData[f].id===networkLinks[i][1]){
                link.source = networkLinks[i][0];
                link.target = networkLinks[i][1];
                link.weight = networkLinks[i][2];
                links.push(link);
              }
            } 
           } 
      }
    }
     
      weStatus = weStatus[weStatus.length-1];
      
      tooltipTop = tooltipTop + 
      "<br> Corpus ID: "+ corpusStatus.corpus_id +
      "<br> Corpus status: " + corpusStatus.status +
      "<li> Total: " + weStatus.total + "</li>"+
      "<li> Discovered: " + weStatus.discovered + "</li>"+
      "<li> Undecided: " + weStatus.undecided + "</li>"+
      "<li> Out: " + weStatus.out + "</li>"+
      "<li> In: " + weStatus.in + "</li>"+
      "</ul><br><br>"+tagDiv+"<br><div id='tagList'></div>" ;

    // network graph starts here

      var arrows = view.append("svg:defs").selectAll("marker")
      .data(["end"])                                         // Different link/path types can be defined here
    .enter().append("svg:marker")                            // This section adds in the arrows
      .attr("id", String)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 150)
      .attr("refY", 0)
      .attr("markerWidth", 12)
      .attr("markerHeight", 12)
      .attr("orient", "auto")
      .attr("stroke-width",0.5)
      .attr("fill","grey")
      .attr("fill-opacity",.8)
    .append("svg:path")
      .attr("d", "M0,-5L10,0L0,5");


      multiThreader.port.postMessage({ type: "hy", nodeData:nodeData,links:links, tags:tags});

      multiThreader.port.onmessage = workerAnswer => {

        if (workerAnswer.data.type==="tick") {
          ipcRenderer.send("chaeros-notification", "ticking ("+workerAnswer.data.current+"/"+workerAnswer.data.target+")"); // send new total to main display
        } else if (workerAnswer.data.type === "hy") {

      nodeData = workerAnswer.data.nodeData;
      links = workerAnswer.data.links;


    var nodes = view.selectAll("circle")
                    .data(nodeData)
                    .enter().append("circle")
                        .style('fill',d=>color(d.tags.USER))
                        .style('opacity',.45)
                        .attr('stroke',"black")
                        .attr('cx',d=>d.x)
                        .attr('cy',d=>d.y)
                        .attr('stroke-width',.2)
                        .attr("r", d=> 1+Math.log(d.indegree+1))
                        .attr("id", d => d.id);
                 
           var nodelinks = view.selectAll("line")
                        .data(links)
                   .enter().append("line")
                   .attr("x1",d=>d.source.x)
                   .attr("y1",d=>d.source.y)
                   .attr("x2",d=>d.target.x)
                   .attr("y2",d=>d.target.y)
                 
                      .attr("stroke-width", .25)
                      .attr("marker-end", "url(#arrow)");
 
                      nodes.raise()   


      const showTags = (tag) =>{

          let tagList = document.getElementById('tagList');
          tagList.innerHTML="";
          let thisTagList = "<ul>";
    
          for (var prop in tags) {
            if(prop === tag) {
            
              for (let thisTag in tags[prop]) {
                
                thisTagList = thisTagList + "<li style='color:"+color(thisTag)+"'>"+thisTag+":"+tags[prop][thisTag]+"</li>"
              }
    
            }
    
          }
          thisTagList = thisTagList + "</ul>"
          tagList.innerHTML = thisTagList;
          nodes.style('fill',d=>color(d.tags.USER[tag][0]))
        }
    
    
    setTimeout(()=> document.getElementById('tagDiv').addEventListener("change",e=>{
            showTags(e.srcElement.value)
          }),200)
    
 //============ NARRATIVE ============
 function narrative() {
  // Experimental narrative function
  d3.select("#xtypeSVG")
    .transition()
    .duration(2000)
    .call(
      zoom.transform,
      d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(8)
        .translate(width / 2,height / 2)
    );
}
//narrative();
}
} // end of worker answer
loadType();

document.getElementById("tooltip").innerHTML = tooltipTop;
      })  // end of get webentities data

      }) // end of start corpus
    })
    .catch(error => {
      console.log(error);
      field.value = "error - Cannot start corpus";
      ipcRenderer.send(
        "console-logs",
        "Hyphotype error: cannot start corpus " + id + "."
      );
    });


  //======== ZOOM & RESCALE ===========

  svg.call(zoom).on("dblclick.zoom", null);
  
  function zoomed() {
     view.attr("transform", d3.event.transform);
  }
  
  ipcRenderer.send("console-logs", "Starting Hyphotype");
};

// ========== CHRONOTYPE ==========
const chronotype = (bibliography, links) => { // When called, draw the chronotype

//========== SVG VIEW =============
  var svg = d3.select(xtype)
    .append("svg")
    .attr("id", "xtypeSVG"); 

  svg.attr("width", width - toolWidth).attr("height", height); // Attributing width and height to svg

  var view = svg.append("g") // Appending a group to SVG
                .attr("class", "view"); // CSS viewfinder properties

  var zoom = d3.zoom()
                .scaleExtent([0.1, 20]) // Extent to which one can zoom in or out
                .translateExtent([[0, 0], [width - toolWidth, height * height]]) // Extent to which one can go up/down/left/right
                .on("zoom", zoomed); // Trigger the actual zooming function

  //============ RESET ============
  d3.select("#reset").on("click", resetted); // Clicking the button "reset" triggers the "resetted" function

  function resetted() {
    // Going back to origin position function
    d3.select("#xtypeSVG") // Selecting the relevant svg element in webpage
      .transition()
      .duration(2000) // Resetting takes some time
      .call(zoom.transform, d3.zoomIdentity); // Using "zoomIdentity", go back to initial position
    ipcRenderer.send(
      "console-logs",
      "Resetting chronotype to initial position."
    ); // Send message in the "console"
  }

  //========== X & Y AXIS  ============
  var x = d3.scaleLinear() // X axis scale (each area has its own attributed value)
    .domain([-0.3, 1.3])
    .range([0, width - toolWidth]); // Graph size is 0.7 times the client width (0.3 -> tooltip)

  var xAxis = d3.axisBottom(x) // Actual X axis
    .scale(x) // Scale has been declared just above
    .ticks(12) // Amount of ticks displayed
    .tickSize(0) // 0 = no vertical lines ; height = vertical lines
    .tickFormat(""); // No legend

  var y = d3.scaleTime() // Y axis scale
    .domain([Past, Future]) // First shows a range from minus one year to plus one year
    .range([height, 0]); // Size on screen is full height of client

  var yAxis = d3.axisRight(y) // Actual Y axis
    .scale(y) // Scale is declared just above
    .ticks(20) // 20 ticks are displayed
    .tickSize(width) // Ticks are horizontal lines
    .tickPadding(10 - width) // Ticks start and end out of the screen
    .tickFormat(multiFormat); // Custom legend declared in a different file

  //========= LINES & INFO ============
  var chrono = d3.line() // Each zone is represented by a curve, or a "line"
    .x(d => x(d.zone)) // The X value of each point is defined by "zone" (stable)
    .y(d => y(d.date)); // The Y value of each point is defined by "date" (changing)

  svg
    .append("rect") // Putting a rectangle above the grid to make dates easier to read
    .attr("x", 0)
    .attr("y", 0) // Rectangle starts at top left
    .attr("width", 110)
    .attr("height", 9999) // Rectangle dimensions
    .style("fill", "white")
    .style("opacity", 0.8) // Rectangle background color and opacity
    .style("stroke-width", "0"); // Invisible borders

  var color = d3.scaleOrdinal() // Line colors
    .domain([0, 1])
    .range([
      "#08154a",
      "#490027",
      "#5c7a38",
      "#4f4280",
      "#6f611b",
      "#5b7abd",
      "#003f13",
      "#b479a9",
      "#3a2e00",
      "#017099",
      "#845421",
      "#008b97",
      "#460d00",
      "#62949e",
      "#211434",
      "#af8450",
      "#30273c",
      "#bd7b70",
      "#005b5c",
      "#c56883",
      "#a68199"
    ]);

  //======== DATA CALL & SORT =========
  pandodb.chronotype
    .get(bibliography)
    .then(datajson => {
      var docs = datajson.content; // Second array is the documents (docs)
      const clusters = [];
      const links = []; // Declaring links as empty array
      const nodeDocs = [];
      var codeFreq = {};
      const csl_material = {
        "paper-conference": "event",
        NA2: "dns",
        personal_communication: "mail",
        "article-magazine": "chrome_reader_mode",
        report: "tab",
        broadcast: "radio",
        chapter: "list",
        webpage: "web",
        map: "map",
        manuscript: "receipt",
        "entry-dictionary": "format_list_numbered",
        "entry-encyclopedia": "art_track",
        NA5: "add_to_queue",
        NA4: "video_label",
        NA3: "question_answer",
        NA1: "markunread_mailbox",
        interview:"speaker_notes",
        legal_case: "announcement",
        thesis: "note",
        graphic: "edit",
        motion_picture: "videocam",
        "article-journal": "timeline",
        "article-newspaper": "dashboard",
        article: "description",
        "post-weblog": "content_paste",
        speech: "subtitles",
        patent: "card_membership",
        song: "mic",
        book: "developer_board",
        legislation: "assignment",
        bill: "account_balance"
      };

      const dataSorter = () => {
        for (let i = 0; i < docs.length; i++) {
          // loop on main array

          let doc = docs[i].items;

          doc.forEach(d => {
            if (d.issued) {
              if (
                d.issued.hasOwnProperty("date-parts") &&
                d.issued["date-parts"][0].length === 3
              ) {
                d.date =
                  d.issued["date-parts"][0][0] +
                  "-" +
                  d.issued["date-parts"][0][1] +
                  "-" +
                  d.issued["date-parts"][0][2];
                d.date = parseTime(d.date);
                d.category = docs[i].name;
                d.clusterDate =
                  d.issued["date-parts"][0][0] +
                  "-" +
                  d.issued["date-parts"][0][1] +
                  "-" +
                  "15";
                d.code = d.category + "-" + d.clusterDate;
                d.type = csl_material[d.type];
                d.authors = [];

                if (d.author) {
                  for (let j = 0; j < d.author.length; j++) {
                    let element = d.author[j].given + " " + d.author[j].family;
                    d.authors.push(element);
                  }
                }

                codeFreq[d.code] = codeFreq[d.code] || 0;
                codeFreq[d.code] += 1;

                let clusterItem = {};
                clusterItem.date = d.clusterDate;
                clusterItem.code = d.code;
                clusterItem.category = d.category;

                if (
                  clusters.findIndex(
                    clusterItem => clusterItem.code === d.code
                  ) < 0
                ) {
                  clusters.push(clusterItem);
                }

                d.clusterDate = parseTime(d.clusterDate);

                nodeDocs.push(d);
              }
            } else {
              d.toPurge = true;
            }
          });
        }
      };

      dataSorter();

      const clustersNest = d3.nest() // Sorting clusters
        .key(d => d.category) // Sorting them by category
        .entries(clusters); // Selecting relevant data

      const clusterData = [];

      const clusterSorter = () => {
        for (let i = 0; i < clustersNest.length; i++) {
          let zone = i * (1 / clustersNest.length);
          clustersNest[i].zone = zone;
          clustersNest[i].values.forEach(d => {
            d.zone = zone;
            d.date = parseTime(d.date);
          });
          clusterData.push(clustersNest[i]);
        }
      };
      clusterSorter();

      const zonePropagation = () => {
        nodeDocs.forEach(d => {
          for (let i = 0; i < clusterData.length; i++) {
            if (clusterData[i].key === d.category) {
              d.zone = clusterData[i].zone;
            }
          }
        });
      };
      zonePropagation();

      //Generate the list of items (titles) contained in each circle, i.e. sharing the same code
      const titleList = [];

      const docTitleLister = () => {
        for (let i = 0; i < docs.length; i++) {
          // loop on main array
          for (let j = 0; j < docs[i].items.length; j++) {
            // loop
            let doc = {};
            doc.title = docs[i].items[j].title;
            doc.code = docs[i].items[j].code;
            if (docs[i].items[j].hasOwnProperty("enrichement")) {
              doc.OA = docs[i].items[j].enrichment.OA;
            } else {
              doc.OA = false;
            }
            titleList.push(doc);
          }
        }
      };

      docTitleLister();

      var titlesIndex = {};

      var titleNest = d3.nest()
        .key(d => d.code)
        .entries(titleList);
      titleNest.forEach(d => {
        d.titles = d.values.map(d => d.title);
      });
      titleNest.forEach(d => {
        titlesIndex[d.key] = d.titles;
      });

      //========= CHART DISPLAY ===========
      var now = view.append("line") // Red line indicating current time
        .attr("x1", -1) // X coordinate of point of origin
        .attr("y1", d => y(currentTime)) // Y -> current time, declared above
        .attr("x2", 99999) // X coordinate of point of destination
        .attr("y2", d => y(currentTime)) // Y -> current time, declared above
        .style("stroke", "DarkRed") // Line color
        .style("stroke-width", 0.5); // Line thickness

      var displayDate = view.append("text") // Precise date (page loading timestamp)
        .attr("x", width / 1.7) // X coordinate, centre-right
        .attr("y", d => y(currentTime)) // Y coordinate, current time
        .attr("dy", -5) // Place it above the "now" line
        .style("fill", "darkred") // Font color
        .style("font-size", "0.3em") // Font size
        .text(d => currentTime); // Actual date string

      var lines = view.selectAll("lines") // Lines by category
        .data(clusterData) // Loading relevant data, ie nested clusters
        .enter()
        .append("path") // Lines are paths
        .attr("class", "line") // CSS style of the lines
        .attr("d", d => chrono(d.values)) //Values of each point/cluster of the lines
        .style("stroke", d => color(d.zone)) // Color according to key
        .style("stroke-width", 1.5); // Stroke width

      var shadowLineData = Array.from(clusterData);

      shadowLineData.forEach(d => {
        let shadowTop = {};
        shadowTop.date = parseTime("2100-01-01");
        shadowTop.zone = d.zone;

        let shadowBot = {};
        shadowBot.date = parseTime("1800-01-01");
        shadowBot.zone = d.zone;

        d.values.push(shadowTop);
        d.values.push(shadowBot);
      });

      var shadowLines = view.selectAll("shadowLines") // Lines by category
        .data(shadowLineData) // Loading relevant data, ie nested clusters
        .enter()
        .append("path") // Lines are paths
        .attr("class", "shadowLines") // CSS style of the lines
        .attr("d", d => chrono(d.values)) //Values of each point/cluster of the lines
        .style("opacity", 0.5)
        .style("stroke", "grey") // Color according to key
        .style("stroke-width", 0.5); // Stroke width

      var categories = view.selectAll("categoriesText") // Display category name
        .data(clusterData) // Loading relevant data, ie nested clusters
        .enter()
        .append("text") // Lines are paths
        .attr("class", "categories") // CSS style of the lines
        .attr("y", d => -x(d.zone)) // The X value of each category is defined by "zone"
        .attr("x", d => y(currentTime)) // Y coordinate, current time
        .attr("fill", d => color(d.zone)) // Color according to key
        .attr("transform", "translate(12,5) rotate(90)")
        .text(d => d.key); // Category content

      d3.select(lines).lower();

      //======== CIRCLES/CLUSTERS =========
      var circle = view.selectAll("circle") // Clusters are represented as circles
        .data(clusters) // From the "clusters" array of objects
        .enter()
        .append("circle") // Clusters are circles
        .attr("class", "dot") // They have a css class
        .attr("r", d => {
          // Their radius is computed as follows
          var n = codeFreq[d.code],
            k = 10;
          return Math.log((k * n) / Math.PI);
        })
        .attr("cx", d => x(d.zone)) // Their relative X positions are by zone
        .attr("cy", d => y(d.date)) // Their relative Y positions are by date
        .attr("id", d => d.code) // Their ID are their codes
        .style("fill", d => color(d.zone)) // Their color is by zone
        .each(d => d.circleexpanded === false) // Their are by default NOT expanded
        .on("click", CellSelect); // Clicking one circle triggers CellSelect

      var circleContent = view.selectAll("textAmount") // Clusters are represented as circles
        .data(clusters) // From the "clusters" array of objects
        .enter()
        .append("text") // Clusters are circles
        .attr("x", d => x(d.zone)) // Their relative X positions are by zone
        .attr("y", d => y(d.date)) // Their relative Y positions are by date
        .attr(
          "dx",
          d => "-" + JSON.stringify(codeFreq[d.code]).length / 2 + "px"
        )
        .attr("dy", "1px")
        .style("fill", "white") // Their color is by zone
        .style("font-size", "2px")
        .text(d => codeFreq[d.code]);

      //======== DOC LIST =========
      function listDisplay(d) {
        // Expanding a cluster displays the list of docs it contains

        function listToNode() {} // Hovering a title highlights the corresponding node
        function listToDoc() {
          // Clicking a title displays the doc's info in tooltip
          for (var i = nodeData.length - 1; i >= 0; i--) {
            // Iterating on the potential docs' data
            if (this.id === nodeData[i].title) {
              // Looking for the index of the relevant title
              d3.select("#tooltip")
                .transition() // Once found, display the tooltip
                .duration(200)
                .style("display", "block");
              d3.select("#tooltip").html(
                "<strong>" +
                  nodeData[i].title +
                  "</strong> <br/>" +
                  nodeData[i].authors +
                  "<br/>" +
                  formatTime(nodeData[i].date) +
                  "<br/>" +
                  nodeData[i].category +
                  " | " +
                  nodeData[i].type +
                  '<br/><i class="material-icons">' +
                  nodeData[i].num +
                  "</i><br/>" // +
                //  '<img src="././svg/OAlogo.svg" height="16px"/>'
                //  nodeData[i].desc + '<br/><br/>' +
                //  nodeData[i].DOI + '<br/>' +
                //  'Source: <a target="_blank" href="'+
                //  nodeData[i].URL+'">'+
                //  nodeData[i].URL+'</a>'
              );
            }
          }
        }

        var docTitles = titlesIndex[d.code];

       
         d3.select("#tooltip")
          .style("display", "block")
          .html(
            "<ul>" +
              docTitles
                .map(
                  title =>
                    '<li id="' + title + '" class="doc">' + title + "</li>"
                )
                .join("\n") +
              "</ul>"
          ); 
        for (var i = 0; i < docTitles.length; i++) {
          document
            .getElementById(docTitles[i])
            .addEventListener("mouseover", listToNode);
          document
            .getElementById(docTitles[i])
            .addEventListener("click", listToDoc);
        }
      }

      function CellSelect(d) {
        if (d.circleexpanded) {
          // Check if expanded, and if it is, regroup
          let thisCluster = d3.select(this);
          thisCluster // Apply the following to this selected object
            .each(d => (d.circleexpanded = false)) // Circle isn't considered expanded anymore
            .transition()
            .duration(500) // Circle reduction isn't instantaneous
            .attr("r", d => {
              // Circle reduction = its radius reduction
              var n = codeFreq[d.code],
                k = 10; // Variables used to determine radius
              return Math.log((k * n) / Math.PI);
            }); // Formula used to compute radius
          regroup(d); // Trigger node regrouping function
          setTimeout(function() {
            thisCluster.raise();
            circleContent.raise();
          }, 500); // Put it above the rest (links)
          ipcRenderer.send(
            "console-logs",
            "Closing chronotype cluster " + d.code
          ); // Send message in the "console"
        } else {
          // Else expand the node
          d3.select(this) // Apply the following to this selected object
            //.lower()                                                      // Put it below other objects
            .each(d => (d.circleexpanded = true)) // Circle is considered expanded
            .transition()
            .duration(100) // Circle expansion is fast
            .attr("r", d => {
              // Circle expands as its radius rises
              var n = codeFreq[d.code],
                k = 18; // Variables used to determine radiu
              return Math.sqrt((k * n) / Math.PI);
            }); // Formula used to compute radius
          expand(d); // Trigger node expanding funciton
          listDisplay(d); // Opening cluster lists all its nodes' titles
          d3.select(this).on("mouseover", listDisplay); // Hovering cluster does the same
          ipcRenderer.send(
            "console-logs",
            "Opening chronotype cluster " + d.code
          ); // Send message in the "console"
        }
      }

      //==========  NODE SUB-GRAPHS =======
      // Each cluster contains documents, i.e. each "circle" contains "nodes" which are force graphs
      var simulation = d3.forceSimulation() // starting simulation
        .alphaMin(0.1) // Each action starts at 1 and decrements "Decay" per Tick
        .alphaDecay(0.035) // "Decay" value
        .force(
          "link",
          d3.forceLink()
            .distance(0)
            .strength(0)
            .id(d => d.title)
        )
        .force(
          "collision",
          d3.forceCollide() // nodes can collide
            .radius(d => (d.expanded ? 1.8 : 0)) // if expanded is true, they collide with a force superior to 0
            .iterations(3)
        )
        .force(
          "x",
          d3.forceX()
            .strength(d => (d.expanded ? 0.03 : 0.15)) // nodes are attracted to their X origin
            .x(d => x(d.zone))
        ) // X origin data
        .force(
          "y",
          d3.forceY()
            .strength(d => (d.expanded ? 0.03 : 0.15)) // nodes are attracted to their Y origin
            .y(d => y(d.clusterDate))
        ); // Y origin data

      //Declaring node variables
      var node = view.selectAll("nodes").append("g"),
        nodetext = view.selectAll("nodetext").append("g"),
        nodeData = [];

      //=============  EXPAND  ============
      // When a shrinked circle is clicked, its nodes come appear and then it expands

      const expand = d => {
        simulation.alpha(1).restart();

        // First the relevant nodes in the data, i.e. those whose code is exactly the same as the clicked circle.
        var focusNodes = nodeDocs.filter(item => item.code === d.code);

        // Then, add those nodes to the group of nodes which are to be displayed by the graph
        nodeData.push.apply(nodeData, focusNodes);

        //Nodes
        node = node
          .data(nodeData, item => item) // Select all relevant nodes
          .exit()
          .remove() // Remove them all
          .data(nodeData, item => item) // Reload the data
          .enter()
          .append("circle") // Append the nodes
          .attr("r", 1) // Node radius
          .attr("fill", "#bfbfbf") // Node color
          .attr("cx", d => x(d.zone)) // Node X coordinate
          .attr("cy", d => y(d.clusterDate)) // Node Y coordinate
          .attr("id", d => d.code) // Node ID (based on code)
          .style("stroke", d => color(d.zone)) // Node stroke color
          .style("stroke-width", 0.1) // Node stroke width
          .style("cursor", "context-menu") // Type of cursor on node hover
          .style("opacity", 0.9) // Node opacity
          .each(d => (d.expanded = true)) // All those nodes are "expanded"
          .raise() // Nodes are displayed above the rest
          .merge(node); // Merge the nodes

        //Node icons are nodes displayed on top of Nodes
        nodetext = nodetext
          .data(nodeData, item => item) // Select all relevant nodes
          .exit()
          .remove() // Remove them all
          .data(nodeData, item => item) // Reload the data
          .enter()
          .append("text") // Append the text
          .attr("class", "material-icons") // Icons are material-icons
          .attr("dy", 0.7) // Relative Y position to each node
          .attr("dx", -0.7) // Relative X position to each node
          .attr("id", d => d.code) // ID
          .style("fill", "white") // Icon color
          .style("font-size", "1.4px") // Icon size
          .text(d => d.type) // Icon
          .on("click", d => {
            shell.openExternal("https://dx.doi.org/" + d.DOI);
          }) // On click, open url in new tab
          .on("mouseover", HighLightandDisplay(0.2)) // On hover, HighLightandDisplay
          .on("mouseout", mouseOut) // On mouseout, mouseOute
          .raise() // Display above nodes and the rest
          .merge(nodetext) // Merge the nodes
          .call(
            d3.drag() // Dragging behaviour
              .on("start", forcedragstarted)
              .on("drag", forcedragged)
              .on("end", forcedragended)
          );

        nodetext.append("title").text(d => d.title); // Hovering a node displays its title as "alt"

        simulation.nodes(nodeData); // Load new simulation data
      };

      //============  REGROUP  ============
      // When an expanded circle is clicked, its nodes regroup and then disappear

      const regroup = d => {
        simulation.alpha(1).restart();

        node
          .filter(function() {
            return d3.select(this).attr("id") === d.code;
          }) // Find relevant nodes
          .each(d => (d.expanded = false)) // Remove colliding
          .transition()
          .delay(450)
          .remove(); // Delay then remove nodes
        nodetext
          .filter(function() {
            return d3.select(this).attr("id") === d.code;
          }) // Find relevant nodetext
          .transition()
          .delay(450)
          .remove(); // Delay dans remove nodetexts

        // First move the nodes either at the end of the array in order not to change any onther nodes'
        // index as the D3 simulation properties are attributed by index then injected to svg
        nodeData.sort(
          // Literally sorts arrays
          function nodeSort(a, b) {
            // Comparing values to each other
            return b.expanded - a.expanded; // Place expanded = false at the end
          }
        );

        // Splicing out removed nodes from nodeData just after they've been removed
        setTimeout(
          // Delay erasal to allow regrouping
          function nodeEraser(i, d) {
            // Call the function
            for (var i = nodeData.length - 1; i >= 0; i--) {
              // Iterate through all elements
              if (nodeData[i].expanded === false) {
                // Everytime one is not expanded
                nodeData.splice(i, 1); // It gets removed from data
              }
            }
          },
          500
        ); // Delay value in milliseconds

        simulation.nodes(nodeData); // Simulation with updated data
      };

  
      var link = view.selectAll("link") // Create links
        .data(links) // With data created above
        .enter()
        .append("line") // Links are SVG lines
        .attr("stroke-width", 0.15) // Links stroke width
        .attr("stroke", "grey") // Links color
        .style("opacity", 0.5); // Links opacity

      circle.raise(); // Circles are raised above links
      circleContent.raise();

      simulation
        .nodes(nodeDocs) // Start the force graph with "docs" as data
        .on("tick", ticked); // Start the "tick" for the first time

      simulation
        .force("link") // Create the links
        .links(links); // Data for those links is "links"

      function ticked() {
        // Actual force function
        link // Links coordinates
          .attr("x1", d => d.source.x)
          .attr("y1", d => d.source.y)
          .attr("x2", d => d.target.x)
          .attr("y2", d => d.target.y);

        node // Node coordinates
          .attr("cx", d => d.x)
          .attr("cy", d => d.y);

        nodetext // Nodetext (material icons) coordinates
          .attr("x", d => d.x)
          .attr("y", d => d.y);
      }

      function forcedragstarted(d) {
        // On drag, start dragging behaviour
        if (!d3.event.active) simulation.alpha(1).restart(); // Reheat all force graph
        d.fx = d.x;
        d.fy = d.y;
      }

      function forcedragged(d) {
        // When dragged, the coordinates of the
        d.fx = d3.event.x; // dragged node is relatively modified
        d.fy = d3.event.y; // based on pointer position
      }

      function forcedragended(d) {
        if (!d3.event.active) simulation.alpha(1).restart(); // When dragging stops, reheat force graph
        d.fx = null;
        d.fy = null;
      }

      //============ NARRATIVE ============
      function narrative(focused) {
        // Experimental narrative function
        d3.select("#xtypeSVG")
          .transition()
          .duration(5000)
          .call(
            zoom.transform,
            d3.zoomIdentity
              .translate(width / 2, height / 2)
              .scale(8)
              .translate(-x(focused.zone), -y(focused.date))
          );
      }

      //============== HOVER ==============
      var linkedByIndex = {}; // No links are highlight by default

      links.forEach(d => {
        linkedByIndex[d.source.index + "," + d.target.index] = 1;
      }); //

      // Check the dictionary to see if nodes are linked
      function isConnected(a, b) {
        return (
          linkedByIndex[a.index + "," + b.index] ||
          linkedByIndex[b.index + "," + a.index] ||
          a.index == b.index
        );
      }

      // Fade nodes on hover
      var HighLightandDisplay = opacity => {
        return function(d) {
          // Display tooltip
          d3.select("#tooltip")
            .transition()
            .duration(200)
            .style("display", "block");
          d3.select("#tooltip").html(
            "<strong>" +
              d.title +
              "</strong> <br/>" +
              d.authors +
              "<br/>" +
              formatTime(d.date) +
              "<br/>" +
              d.category +
              " | " +
              d.type +
              '<br/><i class="material-icons">' +
              d.num +
              "</i><br/>" //+
            //d.desc + '<br/><br/>' +
            // d.DOI + '<br/>'
            // +
            //'Source: <a target="_blank" href="'+
            //d.URL+'">'+
            //d.URL+'</a>'
          );

          ipcRenderer.send("console-logs", "Hovering " + JSON.stringify(d)); // Send message in the "console"

          // check all other nodes to see if they're connected
          node.style("opacity", function(o) {
            thisOpacity = isConnected(d, o) ? 1 : opacity;
            return thisOpacity;
          });
          nodetext.style("opacity", function(o) {
            thisOpacity = isConnected(d, o) ? 1 : opacity;
            return thisOpacity;
          });
          link.style("stroke-opacity", function(o) {
            return o.source === d || o.target === d ? 1 : opacity;
          });
        };
      };

      const mouseOut = () => {
        node.style("stroke-opacity", 1);
        node.style("opacity", 1);
        link.style("stroke-opacity", 1);
        link.style("stroke", "#ddd");
        nodetext.style("opacity", 1);
        d3.select("#tooltip").style("display", "none");
      };

      loadType();
    })
    .catch(error => {
      field.value = "error - invalid dataset";
      ipcRenderer.send(
        "console-logs",
        "Chronotype error: dataset " + datasetAT + " is invalid."
      );
    }); //======== END OF DATA CALL (PROMISES) ===========

  //======== ZOOM & RESCALE ===========
  var gX = svg
    .append("g") // Make X axis rescalable
    .attr("class", "axis axis--x")
    .call(xAxis);

  var gY = svg
    .append("g") // Make Y axis rescalable
    .attr("class", "axis axis--y")
    .call(yAxis);

  svg.call(zoom).on("dblclick.zoom", null); // Zoom and deactivate doubleclick zooming

  function zoomed() {
    view.attr("transform", d3.event.transform);
    gX.call(xAxis.scale(d3.event.transform.rescaleX(x)));
    gY.call(yAxis.scale(d3.event.transform.rescaleY(y)));
  }

  ipcRenderer.send("console-logs", "Starting chronotype"); // Starting Chronotype
}; // Close Chronotype function

// =========== GEOTYPE =========

const geotype = locations => {
  // ========== SVG VIEW ==========
  var svg = d3.select(xtype)
    .append("svg")
    .attr("id", "xtypeSVG");

  svg.attr("width", width - toolWidth).attr("height", height); // Attributing width and height to svg

  var view = svg
    .append("g") // Appending a group to SVG
    .attr("class", "view")
    .attr("id", "view"); // CSS viewfinder properties

  //globe properties and beginning aspect
  const projection = d3.geoOrthographic()
    .scale(800)
    .translate([width - toolWidth * 2, height / 2])
    .clipAngle(90)
    .precision(0.01)
    .rotate([-20, -40, 0]);

  //globe, as well as surface projects
  var path = d3.geoPath().projection(projection);

  //graticule
  const graticule = d3.geoGraticule();

  var velocity = 0.02;

  var zoom = d3.zoom()
    .scaleExtent([0, 50])
    .translateExtent([[0, 0], [1200, 900]])
    .extent([[0, 0], [1200, 900]])
    .on("zoom", zoomed);

  //globe outline and background
  view.append("circle")
    .attr("class", "graticule-outline")
    .attr("cx", width - toolWidth * 2)
    .attr("cy", height / 2)
    .attr("r", projection.scale());

  //Calling data
  pandodb.geotype
    .get(locations)
    .then(locations => {
      var data = [];

      for (let i = 0; i < locations.content.length; i++) {
        locations.content[i].items.forEach(d => data.push(d));
      }

      Promise.all([d3.json("json/world-countries.json")]).then(geo => {
        var geoData = geo[0];

        const links = [];

        var brushContent;

        var linksBuffer = [];

        const dataArray = [];

        data.forEach(d => {
          if (
            d.hasOwnProperty("enrichment") &&
            d.enrichment.hasOwnProperty("affiliations")
          ) {
            if (d.hasOwnProperty("issued")) {
              d.date =
                JSON.stringify(d.issued["date-parts"][0][0]) +
                "," +
                d.issued["date-parts"][0][1];
            }

            d.authors = [];
            if (d.hasOwnProperty("author")) {
              for (let j = 0; j < d.author.length; j++) {
                let element = d.author[j].given + " " + d.author[j].family;
                d.authors.push(element);
              }
            }
            let link = { DOI: "", points: [] };
            link.DOI = d.DOI;
            for (var k = 0; k < d.enrichment.affiliations.length; k++) {
              if (d.enrichment.affiliations[k].lon != undefined) {
                d.enrichment.affiliations[k].affilId =
                  d.enrichment.affiliations[k]["affiliation-city"] +
                  "-" +
                  d.enrichment.affiliations[k]["affiliation-country"];

                dataArray.push(d.enrichment.affiliations[k]);

                let thisCity = { cityname: "", lon: "", lat: "", affilId: "" };
                thisCity.cityname =
                  d.enrichment.affiliations[k]["affiliation-city"];
                thisCity.lon = d.enrichment.affiliations[k].lon;
                thisCity.lat = d.enrichment.affiliations[k].lat;
                thisCity.affilId = d.enrichment.affiliations[k].affilId;
                link.points.push(thisCity);
              }
            }
            linksBuffer.push(link);
          } else {
            data.splice(d.index, 1);
          }
        });

        for (var i = 0; i < linksBuffer.length; i++) {
          if (linksBuffer[i].points.length > 1) {
            links.push(linksBuffer[i]);
          }
        }

        links.forEach(d => {
          if (d.points.length < 3) {
            d.type = "LineString";
            d.coordinates = [[], []];
            d.coordinates[0].push(d.points[0].lon, d.points[0].lat);
            d.coordinates[1].push(d.points[1].lon, d.points[1].lat);
          } else {
            d.type = "MultiLineString";
            d.coordinates = [];
            for (var i = 0; i < d.points.length - 1; i++) {
              let indexCoord = [];
              let subarrayOne = [];
              subarrayOne.push(d.points[i].lon, d.points[i].lat);
              let subarrayTwo = [];
              subarrayTwo.push(d.points[i + 1].lon, d.points[i + 1].lat);
              indexCoord.push(subarrayOne, subarrayTwo);
              d.coordinates.push(indexCoord);
            }
          }
        });

        for (var i = 0; i < data.length; i++) {
          data[i].index = i;
        } // id = item index

        var cities = d3.nest()
          .key(d => d.affilId)
          .entries(dataArray);

        cities.forEach(d => {
          d.lon = d.values[0].lon;
          d.lat = d.values[0].lat;
          d.country = d.values[0]["affiliation-country"];
          d.city = d.values[0]["affiliation-city"];
          d.affiliations = [];
          d.values = [];

          for (var j = 0; j < data.length; j++) {
            if (
              data[j].hasOwnProperty("enrichment") &&
              data[j].enrichment.hasOwnProperty("affiliations")
            ) {
              for (var k = 0; k < data[j].enrichment.affiliations.length; k++) {
                if (data[j].enrichment.affiliations[k].affilId === d.key) {
                  d.affiliations.push(
                    data[j].enrichment.affiliations[k].affilname
                  );
                  d.values.push(data[j]);
                }
              }
            }
          }
        });

        for (var i = 0; i < cities.length; i++) {
          cities[i].id = i;
        } // id = item index

        const affilFinder = city => {
          // purge existing tooltip content
          let geoToolTip = document.getElementById('tooltip');
          while (geoToolTip.firstChild) {
            geoToolTip.removeChild(geoToolTip.firstChild);
          }

          let cityTitle = document.createElement("h2")
          cityTitle.innerText = city.city;

          let country = document.createElement("h3")
          country.innerText = city.country;
          
          geoToolTip.appendChild(cityTitle)
          geoToolTip.appendChild(country)


          let institutions = [];

          for (var j = 0; j < city.affiliations.length; j++) {
            let institution = { name: "", papers: [] };

            institution.name = city.affiliations[j];

            for (var k = 0; k < city.values.length; k++) {
              for (
                var l = 0;
                l < city.values[k].enrichment.affiliations.length;
                l++
              ) {
                if (
                  city.values[k].enrichment.affiliations[l].affilname ===
                  city.affiliations[j]
                ) {
                  let link = {};
                  if (
                    institution.papers.findIndex(
                      paper => paper.title === city.values[k].title
                    ) < 0
                  ) {
                    institution.papers.push({
                      title: city.values[k].title,
                      DOI: city.values[k].DOI,
                      OA: city.values[k].enrichment.OA,
                      visibility: city.values[k].visibility
                    });
                  }
                }
              }
            }
            if (
              institutions.findIndex(f => f.name === city.affiliations[j]) < 0
            ) {
              institutions.push(institution);
            }
          }

          institutions.forEach(e => {

            var list = document.createElement('UL')
            let inst =document.createElement("SPAN");
            
            for (var i = 0; i < e.papers.length; i++) {
              if (e.papers[i].visibility){     
                inst.innerHTML="<strong>"+e.name+"</strong>";
                break;
              }
            }

            for (var i = 0; i < e.papers.length; i++) {
          
              let url = "https://dx.doi.org/" + e.papers[i].DOI;
              let docDOM = document.createElement('LI');

              if (e.papers[i].visibility) {
                if (e.papers[i].OA) {
                  docDOM.innerHTML = "<img src='././svg/OAlogo.svg' height='16px'/>&nbsp;"+e.papers[i].title;
                  list.appendChild(docDOM);
                } else {
                  docDOM.innerHTML = e.papers[i].title;
                  list.appendChild(docDOM);
                }
              }
             
              docDOM.addEventListener("click",e=>{
                shell.openExternal(url)
              });
            
              
            }
            document.getElementById('tooltip').appendChild(inst);
            document.getElementById('tooltip').appendChild(list);
            
          });
       

        };

        // countries
        var countryMap = view.append("g").attr("id", "countryMap");

        countryMap
          .selectAll("path")
          .data(geoData.features)
          .enter()
          .append("path")
          .attr("class", "boundary")
          .attr("id", d => d.id)
          .attr("d", path);

        //graticule
        countryMap
          .append("path")
          .datum(graticule)
          .attr("class", "graticule")
          .attr("d", path);

        var locGroup = view.append("g").attr("id", "cityLocations"); // Create a group for cities + links (circles + arcs)

        cities.forEach(city =>
          city.values.forEach(paper => (paper.visibility = true))
        ); // Make all cities visible at first
        links.forEach(link => (link.visibility = true)); // Make all links visibile at first

const linkLoc = () => {
          // generate links and cities

          document
            .getElementById("view")
            .removeChild(document.getElementById("cityLocations")); // remove all cities & links

          var locGroup = view.append("g").attr("id", "cityLocations"); // recreate the cities & links svg group

          cities.forEach(city => {
            // for each city
            let radius = 1; // base radius is 1
            for (let i = 0; i < city.values.length; i++) {
              // for each article in each city
              if (city.values[i].visibility) {
                // if the article has been published in this timeframe
                radius = radius + 1; // add a unit to the radius
              }
            }
            if (radius === 1) {
              city.radius = 0;
            } // if it stays at 1, no articles published
            else {
              city.radius = Math.log(radius) + 1.5;
            } // else, the radius is log(article number) + 1
          });

          var affilLinks = locGroup
            .selectAll("lines") // add the links
            .data(links)
            .enter()
            .append("path")
            .attr("class", "arc")
            .style("stroke", d => {
              if (d.visibility) {
                return "red";
              } else {
                return "transparent";
              }
            }) // links always exist, they just become transparent if the articles are not in the timeframe
            .attr("d", path);

          var locNames = locGroup
            .selectAll("text")
            .data(cities)
            .enter()
            .append("text")
            .style("fill", "black")
            .style("fond-style", "Noto Sans")
            .style("user-select", "none")
            //.style("font-weight", "bolder")
            .style("font-size", d => {
              if (d.radius > 0) {
                return d.radius + 0.1 + "px";
              } else {
                return "0";
              }
            })
            .attr("transform", d => {
              var loc = projection([d.lon, d.lat]),
                x = loc[0];
              y = loc[1];
              return "translate(" + (x + d.radius) + "," + y + ")";
            })
            .text(d => d.city);

          // ADDING THE CITIES

          var locations = locGroup
            .selectAll(".locations")
            .data(cities)
            .enter()
            .append("path")
            .attr("id", d => d.id)
            .attr("class", "locations");
          locations
            .datum(d =>
              d3.geoCircle()
                .center([d.lon, d.lat])
                .radius(d.radius * 0.05)()
            )
            .attr("d", path);

          locations.on("mouseover", d => {

            d3.selectAll(".arc").style("opacity",".15"); 
            d3.selectAll(".locations").style("opacity",".4"); 

            for (var i = 0; i < locations._groups[0].length; i++) {
              if (
                d.coordinates[0][0] ===
                locations._groups[0][i].__data__.coordinates[0][0]
              ) {
               d3.select(locations._groups[0][i]).style("opacity","1");
               affilFinder(cities[i])   
              
       
                
                  d3.selectAll(".arc")._groups[0].forEach(lk=>{
                    if(lk.__data__.points[0].cityname===cities[i].city){
                        d3.select(lk).style("opacity","1")
                    }

                    if(lk.__data__.points[1].cityname===cities[i].city){
                      d3.select(lk).style("opacity","1")
                  }
                 

                })

              }
           
            }
          });

          locations.on("mouseout", () => {
            d3.selectAll(".arc").style("opacity","1");
            d3.selectAll(".locations").style("opacity","1")
        });

        };

        linkLoc(); // start it a first time
        // Brush Data

        // === Bar Range Slider ===
        // adapted from https://observablehq.com/@bumbeishvili/data-driven-range-sliders

        const barRangeSlider = (
          initialDataArray,
          accessorFunction,
          aggregatorFunction,
          paramsObject
        ) => {
          const chartWidth = width - toolWidth - 40;
          let chartHeight = 100;
          let startSelection = 100;

          const argumentsArr = [...arguments];

          const initialData = initialDataArray;
          const accessor = accessorFunction;
          const aggregator = aggregatorFunction;
          let params = argumentsArr.filter(isPlainObj)[0];
          if (!params) {
            params = {};
          }
          params.minY = params.yScale ? 0.0001 : 0;
          params.yScale = params.yScale || d3.scaleLinear();
          chartHeight = params.height || chartHeight;
          params.yTicks = params.yTicks || 4;
          params.freezeMin = params.freezeMin || false;

          var accessorFunc = d => d;
          if (initialData[0].value != null) {
            accessorFunc = d => d.value;
          }
          if (typeof accessor == "function") {
            accessorFunc = accessor;
          }

          const grouped = d3.nest()
            .key(d => d.date)
            .entries(initialData);

          for (let i = 0; i < grouped.length; i++) {
            grouped[i].date = new Date(grouped[i].key);
          }

          for (let i = 0; i < grouped.length; i++) {
            if (grouped[i].key === "undefined") {
              grouped.splice(i, 1);
            }
          }

          const isDate = true;
          var dateExtent,
            dateScale,
            scaleTime,
            dateRangesCount,
            dateRanges,
            scaleTime;
          if (isDate) {
            dateExtent = d3.extent(grouped.map(d => d.date));

            dateExtent[0].setFullYear(dateExtent[0].getFullYear() - 1);
            dateExtent[1].setFullYear(dateExtent[1].getFullYear() + 1);

            dateRangesCount = Math.round(width / 5);
            dateScale = d3.scaleTime()
              .domain(dateExtent)
              .range([0, dateRangesCount]);
            scaleTime = d3.scaleTime()
              .domain(dateExtent)
              .range([0, chartWidth]);
            dateRanges = d3.range(dateRangesCount)
              .map(d => [dateScale.invert(d), dateScale.invert(d + 1)]);
          }

          d3.selection.prototype.patternify = function(params) {
            var container = this;
            var selector = params.selector;
            var elementTag = params.tag;
            var data = params.data || [selector];

            // Pattern in action
            var selection = container
              .selectAll("." + selector)
              .data(data, (d, i) => {
                if (typeof d === "object") {
                  if (d.id) {
                    return d.id;
                  }
                }
                return i;
              });
            selection.exit().remove();
            selection = selection
              .enter()
              .append(elementTag)
              .merge(selection);
            selection.attr("class", selector);
            return selection;
          };

          const handlerWidth = 2,
            handlerFill = "#E1E1E3",
            middleHandlerWidth = 10,
            middleHandlerStroke = "#8E8E8E",
            middleHandlerFill = "#EFF4F7";

          const svg = d3.select(xtypeSVG);

          let sliderOffsetHeight = document.body.offsetHeight - 120;

          const chart = svg
            .append("g")
            .attr("transform", "translate(30," + sliderOffsetHeight + ")");

          grouped.forEach(d => {
            d.key = d.date;
            d.value = d.values.length;
          });

          const values = grouped.map(d => d.value);
          const min = d3.min(values);
          const max = d3.max(values);
          const maxX = grouped[grouped.length - 1].key;
          const minX = grouped[0].key;

          var minDiff = d3.min(grouped, (d, i, arr) => {
            if (!i) return Infinity;
            return d.key - arr[i - 1].key;
          });

          let eachBarWidth = chartWidth / minDiff / (maxX - minX);

          if (eachBarWidth > 20) {
            eachBarWidth = 20;
          }

          if (minDiff < 1) {
            eachBarWidth = eachBarWidth * minDiff;
          }

          if (eachBarWidth < 1) {
            eachBarWidth = 1;
          }

          const scale = params.yScale
            .domain([params.minY, max])
            .range([0, chartHeight - 25]);

          const scaleY = scale
            .copy()
            .domain([max, params.minY])
            .range([0, chartHeight - 25]);

          const scaleX = d3.scaleLinear()
            .domain([minX, maxX])
            .range([0, chartWidth]);

          var axis = d3.axisBottom(scaleX);
          if (isDate) {
            axis = d3.axisBottom(scaleTime);
          }
          const axisY = d3.axisLeft(scaleY)
            .tickSize(-chartWidth - 20)
            .ticks(max == 1 ? 1 : params.yTicks)
            .tickFormat(d3.format(".2s"));

          const bars = chart
            .selectAll(".bar")
            .data(grouped)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("width", eachBarWidth)
            .attr("height", d => scale(d.value))
            .attr("fill", "steelblue")
            .attr("y", d => -scale(d.value) + (chartHeight - 25))
            .attr("x", (d, i) => scaleX(d.key) - eachBarWidth / 2)
            .attr("opacity", 0.9);

          const xAxisWrapper = chart
            .append("g")
            .attr("id","brushXAxis")
            .attr("transform", `translate(${0},${chartHeight - 25})`)
            .call(axis);

          const yAxisWrapper = chart
            .append("g")
            .attr("transform", `translate(${-10},${0})`)
            .call(axisY);

          const brush = chart
            .append("g")
            .attr("id", "selectionBrush")
            .attr("class", "brush")
            .call(
              d3.brushX()
                .extent([[0, 0], [chartWidth, chartHeight]])
                .on("start", brushStarted)
                .on("end", brushEnded)
                .on("brush", brushed)
            );

          chart.selectAll(".selection").attr("fill-opacity", 0.1);

          var handle = brush
            .patternify({
              tag: "g",
              selector: "custom-handle",
              data: [
                {
                  left: true
                },
                {
                  left: false
                }
              ]
            })
            .attr("cursor", "ew-resize")
            .attr("pointer-events", "all");

          handle
            .patternify({
              tag: "rect",
              selector: "custom-handle-rect",
              data: d => [d]
            })
            .attr("width", handlerWidth)
            .attr("height", 100)
            .attr("fill", handlerFill)
            .attr("stroke", handlerFill)
            .attr("y", -50)
            .attr("pointer-events", "none");

          handle
            .patternify({
              tag: "rect",
              selector: "custom-handle-rect-middle",
              data: d => [d]
            })
            .attr("width", middleHandlerWidth)
            .attr("height", 30)
            .attr("fill", middleHandlerFill)
            .attr("stroke", middleHandlerStroke)
            .attr("y", -16)
            .attr("x", -middleHandlerWidth / 4)
            .attr("pointer-events", "none")
            .attr("rx", 3);

          handle
            .patternify({
              tag: "rect",
              selector: "custom-handle-rect-line-left",
              data: d => [d]
            })
            .attr("width", 0.7)
            .attr("height", 20)
            .attr("fill", middleHandlerStroke)
            .attr("stroke", middleHandlerStroke)
            .attr("y", -100 / 6 + 5)
            .attr("x", -middleHandlerWidth / 4 + 3)
            .attr("pointer-events", "none");

          handle
            .patternify({
              tag: "rect",
              selector: "custom-handle-rect-line-right",
              data: d => [d]
            })
            .attr("width", 0.7)
            .attr("height", 20)
            .attr("fill", middleHandlerStroke)
            .attr("stroke", middleHandlerStroke)
            .attr("y", -100 / 6 + 5)
            .attr("x", -middleHandlerWidth / 4 + middleHandlerWidth - 3)
            .attr("pointer-events", "none");

          handle.attr("display", "none");

          function brushStarted() {
            if (d3.event.selection) {
              startSelection = d3.event.selection[0];
            }
          }

          function brushEnded() {
          
            if (!d3.event.selection) {
              handle.attr("display", "none");

              output({
                range: [minX, maxX]
              });
              return;
            }
            if (d3.event.sourceEvent.type === "brush") return;

            var d0 = d3.event.selection.map(scaleX.invert),
              d1 = d0.map(d3.timeDay.round);

            if (d1[0] >= d1[1]) {
              d1[0] = d3.timeDay.floor(d0[0]);
              d1[1] = d3.timeDay.offset(d1[0]);
            }

            brushContent = d1;
            let visArticleAmnt = 0;

            links.forEach(link => (link.visibility = false)); // Make all links invisible


            cities.forEach(city => {
              city.values.forEach(paper => {
                paper.date = new Date(paper.date);
                var linkIndex = links.findIndex(link => link.DOI === paper.DOI);

                if (
                  paper.date >= brushContent[0] &&
                  paper.date <= brushContent[1]
                ) {
                  paper.visibility = true;
                  visArticleAmnt = visArticleAmnt + 1;
                  if (linkIndex > -1 && links[linkIndex].DOI!=undefined) {
                    links[linkIndex].visibility = true;
                  }
                } else {
                  paper.visibility = false;
                //  if (linkIndex > -1) {
                //    links[linkIndex].visibility = false;
                //  }
                }
                
              });
            });

            document.getElementById("docCountDiv").innerHTML =
              visArticleAmnt + " articles";
            linkLoc();
            d3.select("#tooltip").html("");
          }

          function brushed(d) {
            if (d3.event.sourceEvent.type === "brush") return;
          
            if (params.freezeMin) {
              if (d3.event.selection[0] < startSelection) {
                d3.event.selection[1] = Math.min(
                  d3.event.selection[0],
                  d3.event.selection[1]
                );
              }
              if (d3.event.selection[0] >= startSelection) {
                d3.event.selection[1] = Math.max(
                  d3.event.selection[0],
                  d3.event.selection[1]
                );
              }

              d3.event.selection[0] = 0;
           
              d3.select(this).call(d3.event.target.move, d3.event.selection);
            }

            var d0 = d3.event.selection.map(scaleX.invert);
            const s = d3.event.selection;
           
            handle.attr("display", null).attr("transform", function(d, i) {
            
              return "translate(" + (s[i] - 2) + "," + chartHeight / 2 + ")";
            });
            output({
              range: d0
            });
          }

          yAxisWrapper.selectAll(".domain").remove();
          xAxisWrapper.selectAll(".domain").attr("opacity", 0.1);

          chart.selectAll(".tick line").attr("opacity", 0.1);

          function isPlainObj(o) {
            return typeof o == "object" && o.constructor == Object;
          }

          function output(value) {
            const node = svg.node();
            node.value = value;
            node.value.data = getData(node.value.range);
            if (isDate) {
              node.value.range = value.range.map(d => dateScale.invert(d));
            }
            node.dispatchEvent(new CustomEvent("input"));
          }

          function getData(range) {
            const dataBars = bars
              .attr("fill", "steelblue")
              .filter(d => {
                return d.key >= range[0] && d.key <= range[1];
              })
              .attr("fill", "red")
              .nodes()
              .map(d => d.__data__)
              .map(d => d.values)
              .reduce((a, b) => a.concat(b), []);

            return dataBars;
          }

          const returnValue = Object.assign(svg.node(), {
            value: {
              range: [minX, maxX],
              data: initialData
            }
          });

          if (isDate) {
            returnValue.value.range = returnValue.value.range.map(d =>
              dateScale.invert(d)
            );
          }

          return returnValue;
        };

        var docCountDiv = document.createElement("div");
        docCountDiv.id = "docCountDiv";
        docCountDiv.style.position = "absolute";
        docCountDiv.style.fontSize = "10px";
        docCountDiv.style.top = document.body.offsetHeight - 15 + "px";
        docCountDiv.style.left = parseInt(width - toolWidth) / 2 + "px";
        docCountDiv.innerHTML = data.length + " articles";
        xtype.appendChild(docCountDiv);

        barRangeSlider(data);

        loadType();
      });
    })
    .catch(error => {
      field.value = "error - invalid dataset";
      ipcRenderer.send(
        "console-logs",
        "Geotype error: dataset " + datasetAT + " is invalid."
      );
    });

  function drag() {
    let v0, q0, r0;

    function dragstarted() {
      v0 = versor.cartesian(projection.invert(d3.mouse(this)));
      q0 = versor((r0 = projection.rotate()));
    }

    function dragged() {
      const v1 = versor.cartesian(projection.rotate(r0).invert(d3.mouse(this)));
      const q1 = versor.multiply(q0, versor.delta(v0, v1));
      projection.rotate(versor.rotation(q1)); // rotate projection

      view.selectAll("text")
        .attr("transform", d => {
          //redraw text
          var loc = projection([d.lon, d.lat]),
            x = loc[0],
            y = loc[1];
          return "translate(" + (x + d.radius) + "," + y + ")";
        })
        .text(d => d.city);

      view.selectAll("path").attr("d", path);
    }

    return d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged);
  }

  view.call(drag());

  view.style("transform-origin", "50% 50% 0");
  view.call(zoom);

  function zoomed() {
    view.style("transform", "scale(" + d3.event.transform.k + ")");
  }
 

  ipcRenderer.send("console-logs", "Starting geotype");
};

// ======== PHARMACOTYPE ==========
const pharmacotype = trials => {
  //========== SVG VIEW =============
  var svg = d3.select(xtype)
    .append("svg")
    .attr("id", "xtypeSVG");

  svg.attr("width", width).attr("height", height); // Attributing width and height to svg

  var view = svg
    .append("g") // Appending a viewroup to SVG
    .attr("class", "view"); // CSS viewfinder properties

  var zoom = d3.zoom()
    .scaleExtent([0.5, 10]) // Extent to which one can zoom in or out
    .on("zoom", zoomed); // Trigger the actual zooming function

  //============ RESET ============
  d3.select("#reset").on("click", resetted); // Clicking the button "reset" triggers the "resetted" function

  function resetted() {
    // viewoing back to origin position function
    d3.select("#xtypeSVG") // Selecting the relevant svg element in webpage
      .transition()
      .duration(2000) // Resetting takes some time
      .call(zoom.transform, d3.zoomIdentity); // Using "zoomIdentity", view.ack to initial position
  }

  //========== X & Y AXIS  ============
  //Y axis (timeline)
  var x = d3.scaleTime() // Y axis scale
    .domain([d3.timeYear.offset(currentTime, -10), Future])
    .range([0, width]); // Size on screen is full height of client

  //Format of the Y axis
  var xAxis = d3.axisBottom(x) // Actual Y axis
    .scale(x) // Scale is declared just above
    .tickSize(height - 20)
    .ticks(20) // 20 ticks are displayed
    .tickFormat(multiFormat); // Custom legend declared in a different file

  var y = d3.scaleLinear() // X axis scale (each area has its own attributed value)
    .domain([0, 20])
    .range([height, 0]); // Screen size is 1.2 times bigger than client width

  //Format of the X axis
  var yAxis = d3.axisRight(y) // Actual X axis
    .scale(y) // Scale has been declared just above
    .ticks(12) // Amount of ticks displayed
    .tickSize(3);

  var parseClinTime = d3.timeParse("%B %e, %Y");

  //======== DATA CALL & SORT =========
  Promise.all([
    // Loading data through promises
    d3.csv(trials, { credentials: "include" })
  ]) // Loading clinicalTrials
    .then(datacsv => {
      const clinicalTrials = datacsv[0];

      clinicalTrials.forEach(d => {
        d.postDate = parseClinTime(d.FirstPosted); // Parsing the date
        d.lastDate = parseClinTime(d.LastUpdatePosted);
        d.rank = +d.Rank; // Parsing the date
        d.title = d.Title;
      });

      var trials = view.selectAll("lines")
        .data(clinicalTrials) // Loading relevant data, ie nested clusters
        .enter()
        .append("line") // Lines are paths
        .attr("y1", d => y(d.rank))
        .attr("y2", d => y(d.rank))
        .attr("x1", d => x(d.postDate))
        .attr("x2", d => x(d.lastDate))
        .style("stroke", "lightblue") // Node stroke color
        .style("stroke-width", 15)
        .style("stroke-linecap", "round") // Node stroke width
        .style("cursor", "context-menu"); // Type of cursor on node hover

      var trialTitle = view.selectAll("text")
        .data(clinicalTrials) // Loading relevant data, ie nested clusters
        .enter()
        .append("text") // Lines are paths
        .attr("class", "trialTitles")
        .attr("y", d => y(d.rank))
        .attr("dy", -12)
        .attr("x", d => x(d.postDate))
        .attr("dx", 5)
        .text(d => d.title)
        .style("cursor", "context-menu") // Type of cursor on node hover
        .on("mouseover", HighLightandDisplay(0.2)); // On hover, HighLightandDisplay

      trialTitle.on("mouseout", mouseOut);

      function HighLightandDisplay(opacity) {
        return function(d) {
          //Display tooltip
          d3.select("#tooltip")
            .transition()
            .duration(200)
            .style("display", "block");
          d3.select("#tooltip").html(
            "<strong>" +
              d.title +
              "</strong> <br/> posted on : " +
              formatTime(d.postDate) +
              "<br/>" +
              'Source: <a target="_blank" href="' +
              d.URL +
              '">' +
              d.URL +
              "</a>"
          );
        };
      }
      function mouseOut() {
        d3.select("#tooltip").style("display", "none");
      }

      loadType();
    });

  //Make X axis rescalable
  var gX = svg
    .append("g")
    .attr("class", "axis axis--x")
    .call(xAxis);

  //Make Y axis rescalable
  var gY = svg
    .append("g")
    .attr("class", "axis axis--y")
    .attr("display", "none")
    .call(yAxis);

  //Zoom
  svg.call(zoom).on("dblclick.zoom", null);

  function zoomed() {
    view.attr("transform", d3.event.transform);
    gX.call(xAxis.scale(d3.event.transform.rescaleX(x)));
    gY.call(yAxis.scale(d3.event.transform.rescaleY(y)));
  }

  ipcRenderer.send("console-logs", "Starting pharmacotype");
};

// ========= GAZOUILLOTYPE =========
const gazouillotype = dataset => {
  // When called, draw the gazouillotype

  //========== SVG VIEW =============
  var svg = d3.select(xtype)
    .append("svg")
    .attr("id", "xtypeSVG"); // Creating the SVG node

  svg.attr("width", width-toolWidth).attr("height", height); // Attributing width and height to svg

  var view = svg
    .append("g") // Appending a group to SVG
    .attr("class", "view")
    .attr("id", "piles");

  var brushHeight = 150; // Hardcoding brush height

  svg
    .append("rect") // Inserting a rectangle below the brush to make it easier to read
    .attr("x", 0)
    .attr("y", height - brushHeight) // Rectangle starts at top left
    .attr("width", width)
    .attr("height", brushHeight) // Rectangle dimensions
    .style("fill", "white") // Rectangle background color
    .style("stroke-width", "0"); // Invisible borders

  var zoom = d3.zoom();

  svg.call(zoom.on("zoom", zoomed));

  var brushXscale;

  //========== X & Y AXIS  ============                                // Creating two arrays of scales (graph + brush)
  var x = d3.scaleTime();
  var y = d3.scaleLinear()
          .range([height - brushHeight, 0])
          .domain([0,210]);

  var xAxis = d3.axisBottom(x).tickFormat(multiFormat);

  var yAxis = d3.axisRight(y).tickFormat(d3.format(".2s"));

  var domainDates = [];
  var bufferData = [];
  let radius = 1;
  var lineData = [];

  const scrapToApiFormat = data => {
    if (data.hasOwnProperty("date")) {
      data.from_user_name = data.username;
      data.created_at = data.date;
      data.retweet_count = data.retweets;
      data.favorite_count = data.favorites;
      delete data.username;
      delete data.date;
      delete data.retweets;
      delete data.favorites;
    }
  };

  // LOADING DATA

  pandodb.gazouillotype.get(dataset).then(datajson => {
    // Load dataset info from pandodb

    datajson.content.tweets = []; // Prepare array to store tweets into

    let tranche = { date: "", tweets: [] }; // A tranche will be a pile on the graph
    let twDate = 0; // Date variable
    let twtAmount = 0; // Tweet amount variable

    fs.createReadStream(datajson.content.path) // Read the flatfile dataset provided by the user
      .pipe(csv()) // pipe buffers to csv parser
      .on("data", data => {
        // each line becomes an object
        scrapToApiFormat(data); // convert the object to the twitter API format
        data.date = new Date(data.created_at); // get the date
        data.stamp = Math.round(data.date.getTime() / 600000) * 600000; // make it part of a 10-min pile in milliseconds
        data.timespan = new Date(data.stamp); // turn that into a proper JS date

        if (data.stamp === twDate) {
          // If a pile already exists
          tranche.tweets.push(data); // add this tweet to the current pile
        } else {
          // else
          twtAmount += tranche.tweets.length; // add the amount of the previous pile to the previous total
          datajson.content.tweets.push(tranche); // push the pile to the main array
          twDate = data.stamp; // change pile date
          tranche = { date: data.timespan, tweets: [] }; // create new pile object
          tranche.tweets.push(data); // add tweet to this new pile
          ipcRenderer.send(
            "chaeros-notification",
            twtAmount + " tweets loaded"
          ); // send new total to main display
        }
      })
      .on("end", () => {
        // Once file has been totally read

        ipcRenderer.send("chaeros-notification", "rebuilding data"); // send new total to main display

        datajson.content.tweets.shift(); // Remove first empty value

        // RE-SORT PILES TO MAKE SURE THEY ARE PAST->FUTURE

        var data = datajson.content.tweets; // Reassign data
        var keywords = datajson.content.keywords;

var requestContent= "Request content :<br><ul>";

keywords.forEach(kw=>{
  requestContent=requestContent+"<li>"+kw+"</li>"
})
requestContent=requestContent+"</ul>"

        // Find out the mean retweet value to attribute color scale
        var meanRetweetsArray = [];

        data.forEach(tweetDataset => {
          tweetDataset.tweets.forEach(d => {
            d.date = new Date(d.created_at);
            d.timespan = new Date(
              Math.round(d.date.getTime() / 600000) * 600000
            );
            if (d.retweet_count > 0) {
              meanRetweetsArray.push(d.retweet_count);
            }
          });
        });

        meanRetweetsArray.sort((a, b) => a - b);
        var median = meanRetweetsArray[parseInt(meanRetweetsArray.length / 2)];

        var color = d3.scaleSequential(d3.interpolateBlues)
          .clamp(true)
          .domain([-median * 2, median * 10]);

        var altColor = d3.scaleSequential(d3.interpolateOranges)
          .clamp(true)
          .domain([-median * 2, median * 10]);

        // Assign each tweet a place in the pile according to their index position
        const piler = () => {
          for (i = 0; i < data.length; i++) {
            let j = data[i].tweets.length + 1;
            for (k = 0; k < data[i].tweets.length; k++) {
              data[i].tweets[k].indexPosition = j - 1;
              j--;
            }
          }
        };

        piler();

        var firstDate = new Date(data[0].date);
        
        function addDays(date, days) {
          var result = new Date(date);
          result.setDate(result.getDate() + days);
          return result;
        }
        var plusDate = addDays(firstDate,2)
        var lastDate = new Date(data[data.length - 1].date);

        domainDates.push(firstDate, lastDate);

        var pileExtent = (lastDate - firstDate) / 600000;

        data.forEach(d => {
          d.tweets.forEach(tweet => bufferData.push(tweet));
        });

        let circleData = [];
        for (let i = 0; i < bufferData.length; i++) {
          circleData.push(bufferData[i]);
        }

        const keywordsDisplay = () => {
          document.getElementById("tooltip").innerHTML = requestContent
        };

        x.domain([firstDate,plusDate]).range([0, width - toolWidth]);
        xAxis.ticks(x.range()[1] / 100);
        zoom.translateExtent([[-width / 3, 0], [Infinity, height]]);
             
        let areaData = [];

        data.forEach(d => {
          let point = {
            timespan: d.tweets[0].timespan,
            indexPosition: +d.tweets[0].indexPosition
          };
          areaData.push(point);
        });

        ipcRenderer.send("chaeros-notification", "generating network"); // send new total to main display


        multiThreader.port.postMessage({ type: "gz", dataset: circleData });

        multiThreader.port.onmessage = workerAnswer => {
         
        if (workerAnswer.data.type==="gz"){
          
          circleData = workerAnswer.data.msg; 
 
          //display only the first day (for testing and dev purpose)
          view.selectAll("circle")
            .data(circleData)
            .enter()
            .append("circle")
            .attr("class", "circle")
            .attr("id", d => d.id)
            .style("fill", d => color(d.retweet_count))
            .style("cursor", "pointer")
            .attr("r", radius)
            .attr("cx", d => x(d.timespan))
            .attr("cy", d => y(d.indexPosition))
            .on("click", d => {
              d3.select("#linktosource").remove();
              lineData = [];
              lineData.push(d);
              circleData.forEach(tweet => {
                document.getElementById(tweet.id).style =
                  "fill :" + color(tweet.retweet_count);

                if (tweet.id === d.retweeted_id) {
                  lineData.push(tweet);
                }

                if (
                  d.retweeted_id.length > 1 &&
                  tweet.retweeted_id === d.retweeted_id
                ) {
                  document.getElementById(tweet.id).style = "fill : salmon";
                }
                if (tweet.from_user_id === d.from_user_id) {
                  document.getElementById(tweet.id).style =
                    "fill : " + altColor(tweet.retweet_count);
                }
              });

              if (parseInt(d.retweeted_id)) {             // if it is a NaN, returns false
                document.getElementById(d.retweeted_id).style = "fill : red";

                var line = (line = d3.line()
                  .x(line => x(line.timespan))
                  .y(line => y(line.indexPosition)));

                view.append("path")
                  .datum(lineData)
                  .attr("id", "linktosource")
                  .style("stroke", "red")
                  .style("stroke-linecap", "round")
                  .style("stroke-width", radius / 3)
                  .attr("d", line);
              }

              keywords
                .reduce((res, val) => res.concat(val.split(/ AND /)), [])
                .forEach(e => {
                  let target = new RegExp("\\b" + e + "\\b", "gi");
                  if (target.test(d.text)) {
                    d.text = d.text.replace(target, "<mark>" + e + "</mark>");
                  }
                  if (target.test(d.from_user_name)) {
                    d.from_user_name = d.from_user_name.replace(
                      target,
                      "<mark>" + e + "</mark>"
                    );
                  }
                  if (target.test(d.links)) {
                    d.links = d.links.replace(target, "<mark>" + e + "</mark>");
                  }
                });
              d3.select("#tooltip").html(
                '<p class="legend"><strong><a target="_blank" href="https://mobile.twitter.com/' +
                  d.from_user_name +
                  '">' +
                  d.from_user_name +
                  '</a></strong> <br/><div style="border:1px solid black;"><p>' +
                  d.text +
                  "</p></div><br><br> Language: " +
                  d.lang +
                  "<br>Date: " +
                  d.date +
                  "<br> Favorite count: " +
                  d.favorite_count +
                  "<br>Reply count: " +
                  d.reply_count +
                  "<br>Retweet count: " +
                  d.retweet_count +
                  "<br>Links: <a target='_blank' href='" +
                  d.links +
                  "'>" +
                  d.links +
                  "</a><br> Hashtags: " +
                  d.hashtags +
                  "<br> Mentionned user names: " +
                  d.mentionned_user_names +
                  "<br> Source: " +
                  d.source_name +
                  "<br>Tweet id: <a target='_blank' href='https://mobile.twitter.com/" +
                  d.from_user_name +
                  "/status/" +
                  d.id +
                  "'>" +
                  d.id +
                  "</a><br> Possibly sensitive: " +
                  d.possibly_sensitive +
                  "<br><br> Embeded media<br><img src='" +
                  d.medias_urls +
                  "' width='300' ><br><br><strong>Location</strong><br/>City: " +
                  d.location +
                  "<br> Latitude:" +
                  d.lat +
                  "<br>Longitude: " +
                  d.lng +
                  "<br><br><strong>User info</strong><br><img src='" +
                  d.from_user_profile_image_url +
                  "' max-width='300'><br><br>Account creation date: " +
                  d.from_user_created_at +
                  "<br> Account name: " +
                  d.from_user_name +
                  "<br> User id: " +
                  d.from_user_id +
                  "<br> User description: " +
                  d.from_user_description +
                  "<br> User follower count: " +
                  d.from_user_followercount +
                  "<br> User friend count: " +
                  d.from_user_friendcount +
                  "<br> User tweet count: " +
                  d.from_user_tweetcount +
                  "" +
                  "<br><br>" +
                  requestContent +
                  "<br><br><br><br><br><br><br><br></p>"
              );
            });

         
  // === Bar Range Slider ===
  // adapted from https://observablehq.com/@bumbeishvili/data-driven-range-sliders

          const barRangeSlider = (
            initialDataArray,
            accessorFunction,
            aggregatorFunction,
            paramsObject
          ) => {
            const chartWidth = width - toolWidth - 40;
            let chartHeight = 100;
            let startSelection = 100;

            const argumentsArr = [...arguments];

            const initialData = initialDataArray;
            const accessor = accessorFunction;
            const aggregator = aggregatorFunction;
            let params = argumentsArr.filter(isPlainObj)[0];
            if (!params) {
              params = {};
            }
            params.minY = params.yScale ? 0.0001 : 0;
            params.yScale = params.yScale || d3.scaleLinear();
            chartHeight = params.height || chartHeight;
            params.yTicks = params.yTicks || 4;
            params.freezeMin = params.freezeMin || false;

            var accessorFunc = d => d;
            if (initialData[0].value != null) {
              accessorFunc = d => d.value;
            }
            if (typeof accessor == "function") {
              accessorFunc = accessor;
            }

            const grouped = initialData;

            const isDate = true;
            var dateExtent,
              dateScale,
              scaleTime,
              dateRangesCount,
              dateRanges,
              scaleTime;

            dateExtent = d3.extent(grouped.map(d => d.timespan));

          

            dateRangesCount = Math.round(width / 5);
            dateScale = d3.scaleTime()
              .domain(dateExtent)
              .range([0, dateRangesCount]);
            scaleTime = d3.scaleTime()
              .domain(dateExtent)
              .range([0, chartWidth]);
          
            dateRanges = d3.range(dateRangesCount)
              .map(d => [dateScale.invert(d), dateScale.invert(d + 1)]);

            d3.selection.prototype.patternify = function(params) {
              var container = this;
              var selector = params.selector;
              var elementTag = params.tag;
              var data = params.data || [selector];

              // Pattern in action
              var selection = container
                .selectAll("." + selector)
                .data(data, (d, i) => {
                  if (typeof d === "object") {
                    if (d.id) {
                      return d.id;
                    }
                  }
                  return i;
                });
              selection.exit().remove();
              selection = selection
                .enter()
                .append(elementTag)
                .merge(selection);
              selection.attr("class", selector);
              return selection;
            };

            const handlerWidth = 2,
              handlerFill = "#E1E1E3",
              middleHandlerWidth = 10,
              middleHandlerStroke = "#8E8E8E",
              middleHandlerFill = "#EFF4F7";

            const svg = d3.select(xtypeSVG);

            let sliderOffsetHeight = document.body.offsetHeight - 120;

            const chart = svg
              .append("g")
              .attr("transform", "translate(30," + sliderOffsetHeight + ")")
              .attr("id", "chart");

            grouped.forEach(d => {
              d.key = d.timespan;
              d.value = d.indexPosition;
            });
            
            const values = grouped.map(d => d.value);
            const min = d3.min(values);
            const max = d3.max(values);
            const maxX = grouped[grouped.length - 1].key;
            const minX = grouped[0].key;

            var minDiff = d3.min(grouped, (d, i, arr) => {
              if (!i) return Infinity;
              return d.key - arr[i - 1].key;
            });

            let eachBarWidth = chartWidth / minDiff / (maxX - minX);

            if (eachBarWidth > 20) {
              eachBarWidth = 20;
            }

            if (minDiff < 1) {
              eachBarWidth = eachBarWidth * minDiff;
            }

            if (eachBarWidth < 1) {
              eachBarWidth = 1;
            }

            const scale = params.yScale
              .domain([params.minY, max])
              .range([0, chartHeight - 25]);

            const scaleY = scale
              .copy()
              .domain([max, params.minY])
              .range([0, chartHeight - 25]);

            const scaleX = d3.scaleLinear()
              .domain([minX, maxX])
              .range([0, chartWidth])
              

              var axis = d3.axisBottom(scaleX);

              if (isDate) {
                axis = d3.axisBottom(scaleTime).tickFormat(d3.timeFormat("%d/%m/%y"));
              }

            const axisY = d3.axisLeft(scaleY)
              .tickSize(-chartWidth - 20)
              .ticks(max == 1 ? 1 : params.yTicks)
              .tickFormat(d3.format(".2s"));

            brushXscale = scaleX;

            const bars = chart
              .selectAll(".bar")
              .data(grouped)
              .enter()
              .append("rect")
              .attr("class", "bar")
              .attr("width", eachBarWidth)
              .attr("height", d => scale(d.value))
              .attr("fill", "steelblue")
              .attr("y", d => -scale(d.value) + (chartHeight - 25))
              .attr("x", (d, i) => scaleX(d.key) - eachBarWidth / 2)
              .attr("opacity", 0.9);

            const xAxisWrapper = chart
              .append("g")
              .attr("id","brushXAxis")
              .attr("transform", `translate(${0},${chartHeight - 25})`)
              .call(axis);

            const yAxisWrapper = chart
              .append("g")
              .attr("transform", `translate(${-10},${0})`)
              .call(axisY);

            const brush = chart
              .append("g")
              .attr("id", "selectionBrush")
              .attr("class", "brush")
              .call(
                d3.brushX()
                  .extent([[0, 0], [chartWidth, chartHeight]])
                  .on("start", brushStarted)
                  .on("end", brushEnded)
                  .on("brush", brushed)
              );

            chart.selectAll(".selection").attr("fill-opacity", 0.1);

            var handle = brush
              .patternify({
                tag: "g",
                selector: "custom-handle",
                data: [
                  {
                    left: true
                  },
                  {
                    left: false
                  }
                ]
              })
              .attr("cursor", "ew-resize")
              .attr("pointer-events", "all");

            handle
              .patternify({
                tag: "rect",
                selector: "custom-handle-rect",
                data: d => [d]
              })
              .attr("width", handlerWidth)
              .attr("height", 100)
              .attr("fill", handlerFill)
              .attr("stroke", handlerFill)
              .attr("y", -50)
              .attr("pointer-events", "none");

            handle
              .patternify({
                tag: "rect",
                selector: "custom-handle-rect-middle",
                data: d => [d]
              })
              .attr("width", middleHandlerWidth)
              .attr("height", 30)
              .attr("fill", middleHandlerFill)
              .attr("stroke", middleHandlerStroke)
              .attr("y", -16)
              .attr("x", -middleHandlerWidth / 4)
              .attr("pointer-events", "none")
              .attr("rx", 3);

            handle
              .patternify({
                tag: "rect",
                selector: "custom-handle-rect-line-left",
                data: d => [d]
              })
              .attr("width", 0.7)
              .attr("height", 20)
              .attr("fill", middleHandlerStroke)
              .attr("stroke", middleHandlerStroke)
              .attr("y", -100 / 6 + 5)
              .attr("x", -middleHandlerWidth / 4 + 3)
              .attr("pointer-events", "none");

            handle
              .patternify({
                tag: "rect",
                selector: "custom-handle-rect-line-right",
                data: d => [d]
              })
              .attr("width", 0.7)
              .attr("height", 20)
              .attr("fill", middleHandlerStroke)
              .attr("stroke", middleHandlerStroke)
              .attr("y", -100 / 6 + 5)
              .attr("x", -middleHandlerWidth / 4 + middleHandlerWidth - 3)
              .attr("pointer-events", "none");

            handle.attr("display", "none");

            function brushStarted() {
              if (d3.event.selection) {
                startSelection = d3.event.selection[0];
              }
            }

            function brushEnded() {
             
              if (!d3.event.selection) {
                handle.attr("display", "none");

                output({
                  range: [minX, maxX]
                });
                return;
              }
              if (d3.event.sourceEvent.type === "brush") return;

              var d0 = d3.event.selection.map(scaleX.invert),
                d1 = d0.map(d3.timeDay.round);

              if (d1[0] >= d1[1]) {
                d1[0] = d3.timeDay.floor(d0[0]);
                d1[1] = d3.timeDay.offset(d1[0]);
              }

              brushContent = d1;

              let midDate;

              midDate = new Date(
                brushContent[0].getTime() +
                  (brushContent[1].getTime() - brushContent[0].getTime()) / 2
              );

              // TO DO
              // COMPUTE ZOOM SCALE ACCORDING TO d1

              d3.select("#xtypeSVG")
                .transition()
                .duration(750)
                .call(
                  zoom.transform,
                  d3.zoomIdentity.translate(-x(d1[0]), -y(200))
                );

              let visibleTweets = 0;

              grouped.forEach(pile => {
                if (
                  pile.key >= brushContent[0] &&
                  pile.key <= brushContent[1]
                ) {
                  visibleTweets =
                    parseInt(visibleTweets) + parseInt(pile.value);
                }
              });

           //   document.getElementById("docCountDiv").innerHTML = visibleTweets + " tweets";
            }

            function brushed(d) {
              if (d3.event.sourceEvent.type === "brush") return;
          

              if (params.freezeMin) {
                if (d3.event.selection[0] < startSelection) {
                  d3.event.selection[1] = Math.min(
                    d3.event.selection[0],
                    d3.event.selection[1]
                  );
                }
                if (d3.event.selection[0] >= startSelection) {
                  d3.event.selection[1] = Math.max(
                    d3.event.selection[0],
                    d3.event.selection[1]
                  );
                }

                d3.event.selection[0] = 0;
              

                d3.select(this).call(d3.event.target.move, d3.event.selection);
              }

              var d0 = d3.event.selection.map(scaleX.invert);
              const s = d3.event.selection;

              handle.attr("display", null).attr("transform", function(d, i) {
              
                return "translate(" + (s[i] - 2) + "," + chartHeight / 2 + ")";
              });
              output({
                range: d0
              });
            }

            yAxisWrapper.selectAll(".domain").remove();
            xAxisWrapper.selectAll(".domain").attr("opacity", 0.1);

            chart.selectAll(".tick line").attr("opacity", 0.1);

            function isPlainObj(o) {
              return typeof o == "object" && o.constructor == Object;
            }

            function output(value) {
              const node = svg.node();
              node.value = value;
              node.value.data = getData(node.value.range);
              if (isDate) {
                node.value.range = value.range.map(d => dateScale.invert(d));
              }
              node.dispatchEvent(new CustomEvent("input"));
            }

            function getData(range) {
              const dataBars = bars
                .attr("fill", "steelblue")
                .filter(d => {
                  return d.key >= range[0] && d.key <= range[1];
                })
                //  .attr("fill", "red")
                .nodes()
                .map(d => d.__data__)
                .map(d => d.values)
                .reduce((a, b) => a.concat(b), []);

              return dataBars;
            }

            const returnValue = Object.assign(svg.node(), {
              value: {
                range: [minX, maxX],
                data: initialData
              }
            });

            if (isDate) {
              returnValue.value.range = returnValue.value.range.map(d =>
                dateScale.invert(d)
              );
            }

            return returnValue;
          };

          var docCountDiv = document.createElement("div");
          docCountDiv.id = "docCountDiv";
          docCountDiv.style.position = "absolute";
          docCountDiv.style.fontSize = "10px";
          docCountDiv.style.top = document.body.offsetHeight - 15 + "px";
          docCountDiv.style.left = parseInt(width - toolWidth) / 2 + "px";
          docCountDiv.innerHTML = circleData.length + " tweets";
          xtype.appendChild(docCountDiv);

          barRangeSlider(areaData);

          /* function narrative(focused) {
            // Experimental narrative function
            d3.select("#xtypeSVG").call(
              zoom.transform,
              d3.zoomIdentity
                .translate(width / 2, height / 2)
                .scale(10 / radius)
                .translate(-x(focused.timespan), -y(focused.indexPosition))
            );
          }

          narrative(circleData[0]);
 */
          loadType();

          keywordsDisplay();
          }
        }; //======== END OF WORKER ANWSER ===========
      });
  }); //======== END OF DATA CALL (PROMISES) ===========

  //======== ZOOM & RESCALE ===========

  svg.append("rect")
      .attr("x","0")
      .attr("y",parseInt(height - 180))
      .attr("width",width)
      .attr("height","40px")
      .attr("fill","rgba(255,255,255,.7)");

  svg.append("rect")
      .attr("x",parseInt(width - toolWidth - 65))
      .attr("y","0")
      .attr("width","80px")
      .attr("height",height)
      .attr("fill","rgba(255,255,255,.7)");

  var gX = svg
    .append("g") // Make X axis rescalable
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + (height - 180) + ")")
    .call(xAxis);

  var gY = svg
    .append("g") // Make Y axis rescalable
    .attr("class", "axis axis--y")
    .attr("transform", "translate(" + (width - toolWidth - 70) + ",0)")
    .call(yAxis);

  svg.call(zoom).on("dblclick.zoom", null); // Zoom and deactivate doubleclick zooming

  function zoomed() {
    
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
    
    var t = d3.event.transform;

    view.attr("transform", t);

    gX.call(xAxis.scale(t.rescaleX(x)));
    gY.call(yAxis.scale(t.rescaleY(y)));
  
    let ext1 = parseInt(brushXscale(x.invert(x.range().map(t.invertX, t)[0])));
    let ext2 = parseInt(brushXscale(x.invert(x.range().map(t.invertX, t)[1])));

    d3.select("#selectionBrush")
      .select(".selection")
      .attr("x",ext1)
      .attr("width",parseInt(ext2-ext1));

    d3.select("#selectionBrush")
      .select("g")
      .attr(
        "transform",
        "translate(" + ext1 + ",50)"
      );

    d3.select("#selectionBrush")
      .selectAll("g")
      .select(function() {
        return this.nextElementSibling;
      })
      .attr(
        "transform",
        "translate(" + ext2 + ",50)"
      );
  }

  ipcRenderer.send("console-logs", "Starting gazouillotype"); // Starting gazouillotype
}; // Close gazouillotype function

// ======== TOPOTYPE =======
/* 
const topotype = (pubdeb,matching,commun) => {                               // When called, draw the topotype

  //========== SVG VIEW =============
  var svg = d3.select(xtype).append("svg").attr("id","xtypeSVG");             // Creating the SVG node
  
  var tooltip = d3.select("tooltip");
  
  var tokenSelected = [];
  
  svg.attr("width", width-toolWidth).attr("height", height);                // Attributing width and height to svg
  
  var view = svg.append("g")                                                  // Appending a group to SVG
                .attr("class", "view");                                       // CSS viewfinder properties
  
  const parseTime = d3.timeParse("%Y-%m-%d");                                 // Parsing time function (data encoded)
  const formatTime = d3.timeFormat("%d/%m/%Y");                               // Formatting time function (metric standard)
  const color = d3.scaleLog()                                                 // Color is determined on a log scale
                .domain(d3.extent(d3.range(1, 15)))                           // Domain ranges from 1 to 15
                .interpolate(d => d3.interpolateYlGnBu);                      // Interpolate is the color spectrum
  
  var x = d3.scaleLinear()                                                    // x is a linear scale
            .domain([-140, 140])                                              // Domain means value range on the graph onload
            .range([0, width-toolWidth]);                                               // Range is pixel display size
  
  var y = d3.scaleLinear()                                                    // y is a linear scale
      .domain([2000,-800])                                                    // Domain is negative to allow contour display
      .range([0, height]);                                                    // Range is total height
  
  var xAxis = d3.axisBottom(x);                                               // xAxis is the abscissa axis
  var xAxis2 = xAxis;                                                         // xAxis2 is its white contour for lisiblity
  var yAxis = d3.axisRight(y);                                                // yAxis is the yordinate axis
  var yAxis2 = yAxis;                                                         // yAxis white contour for lisiblit
  var xGrid = d3.axisBottom(x).tickSize(height);                              // xGrid is actually axis ticks without axis
  var yGrid = d3.axisRight(y).tickSize(width);                                // Same but for horizontal ticks
  
  var zoom = d3.zoom()                                                        // The graph is zoomable
               .scaleExtent([1, 25])                                          // It can be zoomed/unzoomed on this range
               .translateExtent([[-width,-height], [width*2, height*2]])      // The user can zoom/pan on this area only
               .on("zoom", zoomed);
  
  Promise.all([d3.json(pubdeb, {credentials: 'include'}),                     // Load the main datafile
               d3.json(matching, {credentials: 'include'}),
               d3.json(commun, {credentials: 'include'})                    // Load secondary datafile with prop eval
            ]).then(datajson => {                                             // Then with the response array
            var data = datajson[0];                                           // First array/datafile is rawData var
            var links = datajson[1];                                          // Second is opinionData (-> prop eval)
            var commun = datajson[2];                                          // Second is opinionData (-> prop eval)
  
  var tokens=[];
  
  //managing keywords
  
      for(let i = 0; i < commun.length; i++){
        let token = {};
        token.key = commun[i][0];
        token.count = commun[i][1];        //
        tokens.push(
         "<input class='availableTokens' value='"+token.key+"' name='"+token.key+"' type='checkbox'/><label> " +token.count+" - "+ token.key +"</label><br> ");
      }
  
      var tokenList = "" ;                                      // Create the list as a string
        for (var k=0; k< tokens.length; ++k){                   // For each element of the array
            tokenList = tokenList + tokens[k];        // Add it to the string
          }
  
  const interventionBuilder = (inter,type) => {                               // Create tooltip-displayable data
    let intervention = [];
        switch (type) {
          case 'contrib':                                                     // For contributions
            for (let i = 0; i < inter.length; i++) {
              let item = {};
              item.title = inter[i].contributions_title;
              item.type = inter[i].contributions_section_title;
              item.body = inter[i].contributions_bodyText;
              item.url = inter[i].contributions_url;
              item.votes = [inter[i].contributions_votesCountOk,inter[i].contributions_votesCount,inter[i].contributions_votesCountMitige];
  
              intervention.push("<hr><p class='inter'><strong><a href='"+item.url+"' target='_blank'>"+item.title+"</a> ("+item.type+")</strong><br>"
              +item.body+"<br><i> VOTES: FOR ["+item.votes[0]+"] - AGAINST ["+item.votes[1]+"] - UNDECIDED ["+item.votes[2]+"]</i></p>"); // Push the file in the array
            }
              let contribList = "" ;
              for(var i=0; i<intervention.length; ++i){
                  contribList = contribList + intervention[i];
              }
              tokenSelected.forEach(d => {
                if (contribList.indexOf(d)>-1){
                  let target = new RegExp(d,'gi');
                  contribList = contribList.replace(target,'<mark>'+d+'</mark>');
                }
              })
              document.getElementById('contributions').innerHTML = "<hr><h2>Contributions</h2><br> "+contribList;
  
          break;
  
          case 'arg':                                                         // For arguments
            for (let i = 0; i < inter.length; i++) {
              let item = {};
              item.type = inter[i].contributions_arguments_type;
              item.body = inter[i].contributions_arguments_body;
              item.url = inter[i].contributions_arguments_url;
              item.votes = inter[i].contributions_arguments_votesCount;
              intervention.push("<hr><p class='inter'><strong><a href='"+item.url+"' target='_blank'>"+item.type+"</a></strong><br>"
              +item.body+"<br>Votes supporting this argument : "+item.votes+"</p>"); // Push the file in the array
            }
              let argList = "" ;
              for(var i=0; i<intervention.length; ++i){
                  argList = argList + intervention[i];
              }
              tokenSelected.forEach(d => {
                if (argList.indexOf(d)>-1){
                  let target = new RegExp(d,'gi');
                  argList = argList.replace(target,'<mark>'+d+'</mark>');
                }
              })
              document.getElementById('arguments').innerHTML = "<hr><h2>Arguments</h2><br> "+argList;
  
          break;
                      }
  
                }
    view.append("line")                                                      // Grey line indicating Ordinate at origin
          .attr("x1", d => x(0))
          .attr("y1", d => y(99999))
          .attr("x2", d => x(0))
          .attr("y2", d => y(-99999))
          .style('stroke', "darkgrey")
          .style('stroke-width', 1.5);
  
    view.append("line")                                                      // Grey line indicating Ordinate at origin
          .attr("x1", d => x(9999))
          .attr("y1", d => y(0))
          .attr("x2", d => x(-9999))
          .attr("y2", d => y(0))
          .style('stroke', "darkgrey")
          .style('stroke-width', 1.5);
  
  
    var arrows = view.append("svg:defs").selectAll("marker")
                      .data(["end"])                                         // Different link/path types can be defined here
                    .enter().append("svg:marker")                            // This section adds in the arrows
                      .attr("id", String)
                      .attr("viewBox", "0 -5 10 10")
                      .attr("refX", 150)
                      .attr("refY", 0)
                      .attr("markerWidth", 12)
                      .attr("markerHeight", 12)
                      .attr("orient", "auto")
                      .attr("stroke-width",0.5)
                      .attr("fill","grey")
                      .attr("fill-opacity",.8)
                    .append("svg:path")
                      .attr("d", "M0,-5L10,0L0,5");
  
  var simulation = d3.forceSimulation(data)
              .force('link',d3.forceLink(links).id(d=>d.author_id).strength(0))
              .force('collision', d3.forceCollide(0))
              .force('x', d3.forceX().x(d => x(d.opinionSpectrum.score)))
              .force('y', d3.forceY().y(d => y(d.score.totalScore)))
              .stop();
  
  //d3.timeout(function() {
  
  for (let i = 0, n = Math.ceil(Math.log(simulation.alphaMin()) / Math.log(1 - simulation.alphaDecay())); i < n; ++i) {
        simulation.tick();
      }
  
      var nodelinks = view.selectAll("line")
                  .data(links)
             .enter().append("line")
                .attr("class",d=> d.type)
                .attr("opacity", d=> Math.log10(0.2+(d.opacity*2)))
                .attr("stroke-width", 0.2)
                .attr("marker-end", "url(#end)")
                .attr("x1", d=> d.source.x)
                .attr("y1", d=> d.source.y)
                .attr("x2", d=> d.target.x)
                .attr("y2", d=> d.target.y);
  
  
   var linkedByIndex = {};
  
   const isConnected = (a, b) => linkedByIndex[a.index + "," + b.index] || linkedByIndex[b.index + "," + a.index] || a.index == b.index;
  
    links.forEach(d => {linkedByIndex[d.source.index + "," + d.target.index] = 1;});
        // fade nodes on hover
        function HighLight(opacity) {
            return function(d) {
                nodelinks.style("stroke-opacity", function(o) {
                    return o.source === d || o.target === d ? 1 : opacity;
                });
            };
        }
    function mouseOut() {nodelinks.style("stroke-opacity", d=>Math.log10(0.2+(d.opacity*4)));  }
              //        });
  
  loadType();
  
  
  const updateData = (tokens) => {
  
   var focusTokens = [];
  
  if (tokens === 'fullData') { focusTokens = data;}
  else { focusTokens=  data.filter(item => {
      for (var i = 0; i < tokens.length; i++) {
        if (item.topTerms.indexOf(tokens[i])>-1) {return true}
      }
    });
  }
  
  view.selectAll("path").remove();
  
  densityContour = view.insert("g")                                     // Create contour density graph
             .attr("fill", "none")                                          // Start by making it empty/transparent
             .attr("stroke", "GoldenRod")                                   // Separation lines color
             .attr("stroke-width", .5)                                      // Line thickness
             .attr("stroke-linejoin", "round")                              // Join style
           .selectAll("path")
           .data(d3.contourDensity()                                        // Data format is d3.contourDensity
               .x(d => x(d.opinionSpectrum.score))                          // X is based on opinionSpectrum
               .y(d => y(d.score.totalScore))                               // Y is based on totalScore
               .size([width, height])                                       // Size needs to be defined & stable
               .weight(d => Math.pow(d.score.totalScore,1.2))               // Weight is power function of totalScore
               .bandwidth(9)
               .thresholds(d3.range(1, 20).map(i => Math.pow(1.7, i)))
               (focusTokens, item => item))
                .enter().append("path")
                   .attr("fill",d => color(d.value))                        // Color depends on densityContour value
                   .attr("d", d3.geoPath());
  
  simulation.alpha(1).restart();
  
   var nodes = view.selectAll("circle")
               .data(focusTokens, item => item)                          // Select all relevant nodes
               .exit().remove()                                          // Remove them all
               .data(focusTokens, item => item)
                 .enter().append("circle")
                    .style('fill',"darkgray")
                    .attr('stroke',"black")
                    .attr('stroke-width',.5)
                    .attr("r", 2)
                    .attr("id", d => d.author_id)
                    .attr("cx", d => x(d.opinionSpectrum.score))
                    .attr("cy", d => y(d.score.totalScore))
                    .on("mouseenter", HighLight(0.01))
                    .on("mouseout", mouseOut)
                    .on("mouseover", function(d) {
                         d3.select(this).style("fill", "black");
                         d3.select(this).style("cursor", "crosshair");
                         d3.select("#tooltip").html(
                            '<p class="legend"><strong>Author ID:' + d.author_id +
                            '</strong><br> Amount of Contribtions : '+d.contributions.length +
                            '<br> Amount of Arguments : '+d.args.length +
                            '<br> Amount of Votes : '+d.votes.length +
                            '<br><div id="contributions"></div>'+
                            '<br><div id="arguments"></div></p>')
                        interventionBuilder(d.contributions,"contrib");
                        interventionBuilder(d.args,"arg");
                      });
  
  simulation.nodes(focusTokens);
  
  view.selectAll("line").raise();
  nodelinks.raise();
  nodes.raise();
  
  }
  
  
  
  const reloadList = () => {
  document.getElementById("tooltip").innerHTML ="<form style='line-height:1.5'>"+tokenList+"</form>";
  
  var selectedToken = document.getElementsByClassName('availableTokens');
  
  
  
  
  const selectTokens = () => {
    tokenSelected = [];
    for (let i =0; i<selectedToken.length; i++){
      if (selectedToken[i].checked) {
          tokenSelected.push(selectedToken[i].name)
        }
    }
  
    updateData(tokenSelected);
  
  }
  
  Array.from(selectedToken).forEach(d => {
     d.addEventListener('click', selectTokens);
   });
   updateData('fullData');
  }
  reloadList();
  
  document.getElementById("option-icon").addEventListener("click",reloadList);
  
  
  // add event listener on option-icon
  
  
  
  }); // END OF DATA CALL
  
  
  
  
    // Calling Axes, Grid, Legend and Zoom to be displayed over the main group and to be stable relative to svg while rescaling
  
    var svgWidth = document.getElementById("xtypeSVG").width.animVal.value;
  
    var gXGrid = svg.append("g")
                    .attr("class","grid")
                    .call(xGrid);
  
    var gYGrid = svg.append("g")
                    .attr("class","grid")
                    .call(yGrid);
  
    var gX2 = svg.append("g")
                .attr("transform", "translate(0," + height/2 + ")")
                .attr("fill", "white")
                .attr("class","axishadow")
                .attr("stroke", "white")
                .attr("stroke-width", 2)
                .call(xAxis2);
  
    var gY2 = svg.append("g")
                .attr("transform", "translate(" + svgWidth/2 + ",0)")
                .attr("class","axishadow")
                .attr("stroke", "white")
                .attr("stroke-width", 2)
                .call(yAxis2);
  
    var gX = svg.append("g")
                .attr("transform", "translate(0," + height/2 + ")")
                .call(xAxis);
  
    var gY = svg.append("g")
                .attr("transform", "translate(" + svgWidth/2 + ",0)")
                .call(yAxis);
  
    var xLegendLeft = svg.append("text")
                 .attr("x", 10)
                 .attr("y", height/2-5)
                 .attr("stroke", "white")
                 .attr("stroke-width", 2)
                 .attr("text-anchor", "start")
                 .style("font-size","11")
                 .text("← Conservative interventions #");
  
    svg.append("text")
                 .attr("x", 10)
                 .attr("y", height/2-5)
                 .attr("text-anchor", "start")
                 .style("font-size","11")
                 .text("← Conservative interventions #");
  
     var xLegendRight = svg.append("text")
                  .attr("x", width-toolWidth-20)
                  .attr("y", height/2-5)
                  .attr("stroke", "white")
                  .attr("stroke-width", 2)
                  .attr("text-anchor", "end")
                  .style("font-size","11")
                  .text("Liberal interventions # →");
  
              svg.append("text")
                  .attr("x", width-toolWidth-20)
                  .attr("y", height/2-5)
                  .attr("text-anchor", "end")
                  .style("font-size","11")
                  .text("Liberal interventions # →");
  
    var yLegendTop = svg.append("text")
       .attr("x", -10)
       .attr("y", svgWidth/2-5)
       .attr("stroke", "white")
       .attr("stroke-width", 2)
       .attr("text-anchor", "end")
       .style("font-size","11")
       .attr("transform", "rotate(-90)")
       .text("Intervention impact →");
  
     svg.append("text")
                 .attr("x", -10)
                 .attr("y", svgWidth/2-5)
                 .attr("text-anchor", "end")
                 .style("font-size","11")
                 .attr("transform", "rotate(-90)")
                 .text("Intervention impact →");
  
     var yLegendBot = svg.append("text")
                  .attr("x", -height+30)
                  .attr("y", svgWidth/2-5)
                  .attr("stroke", "white")
                  .attr("stroke-width", 2)
                  .attr("text-anchor", "start")
                  .attr("transform", "rotate(-90)")
                  .style("font-size","11")
                  .text("← Intervention trivialness");
  
     svg.append("text")
                  .attr("x", -height+30)
                  .attr("y", svgWidth/2-5)
                  .attr("text-anchor", "start")
                  .attr("transform", "rotate(-90)")
                  .style("font-size","11")
                  .text("← Intervention trivialness");
  
    svg.call(zoom);
  
    function zoomed() {
         view.attr("transform", d3.event.transform);
         gXGrid.call(xGrid.scale(d3.event.transform.rescaleX(x)));
         gYGrid.call(yGrid.scale(d3.event.transform.rescaleY(y)));
         gX2.call(xAxis2.scale(d3.event.transform.rescaleX(x)));
         gY2.call(yAxis2.scale(d3.event.transform.rescaleY(y)));
         gX.call(xAxis.scale(d3.event.transform.rescaleX(x)));
         gY.call(yAxis.scale(d3.event.transform.rescaleY(y)));
       };
  
  ipcRenderer.send('console-logs',"Starting topotype");          
  }
  
 */

//========== typesSwitch ==========
// Switch used to which type to draw/generate

const typeSwitch = (type, id) => {
  field.value = "loading " + type;

  switch (type) {
    case "hyphotype":
      hyphotype(id);
      break;

    case "anthropotype":
      anthropotype(id);
      break;

    case "chronotype":
      chronotype(id);
      break;

    case "gazouillotype":
      gazouillotype(id);
      break;

    case "geotype":
      geotype(id);

      break;

    case "pharmacotype":
      pharmacotype(id);
      break;

    case "topotype":
      topotype(id);
      break;

  }

  ipcRenderer.send(
    "console-logs",
    "typesSwitch started a " +
      type +
      " process using the following dataset(s) : " +
      JSON.stringify(id)
  );

  document.getElementById("source").innerText = "Source: " + id;
};

module.exports = { typeSwitch: typeSwitch }; // Export the switch as a module