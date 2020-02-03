const {Runtime, Inspector} = require("@observablehq/runtime");
const rpn = require("request-promise-native"); // RPN enables to generate requests to various APIs

// test importcell
const createObsCell = (slide,id,userName,notebookName) => {
  // Create a DIV in the DOM
  var cell = document.createElement("DIV");
  cell.id = "observablehq-"+id; 
  document.getElementById(slide).append(cell);

  // Create a path for the define script
  let modStorePath = userDataPath + "/flatDatasets/"+userName+"+"+notebookName+".js?v=3";

  // Check if already accessed in the past and hence already available
  if (fs.existsSync(modStorePath)) {
    
    require = require('esm')(module);
    var define = require(modStorePath);
    const inspect = Inspector.into("#observablehq-"+id);
    (new Runtime).module(define, name => (name === "chart") && inspect());
  
  // If not, download it from the Observable API  
  } else {
    
  let optionsRequest = {
    // Prepare options for the Request-Promise-Native Package
    uri:"https://api.observablehq.com/"+userName+"/"+notebookName+".js?v=3", // URI to be accessed
    headers: { "User-Agent": "Request-Promise" }, // User agent to access is Request-promise
    json: false // don't automatically parse as JSON
  };

  rpn(optionsRequest) // RPN stands for Request-promise-native (Request + Promise)
    .then(mod =>{
      // Write the file in the app's user directory
      fs.writeFile(modStorePath, mod, "utf8", err => {
        if (err) throw err;
        require = require('esm')(module);
        var define = require(modStorePath);
        const inspect = Inspector.into("#observablehq-"+id);
        (new Runtime).module(define, name => (name === "chart") && inspect());
      });
    })
  }
}

let activeIndex = 0;

let currentIndex;

let currentMainPresStep={};

var sectionList = document.querySelectorAll("section");

const addPadding = () => {
  for (let sect of sectionList) {
    sect.style.paddingTop = '0px'; //remove all previous padding;
    sect.style.paddingTop=parseInt((document.body.offsetHeight-sect.clientHeight)/2)+"px";
  }       
}
  

function scroller() {
  let container = d3.select("#mainSlideSections"),
    dispatch = d3.dispatch("active", "progress"),
    sections = null,
    sectionPositions = [],
    containerStart = 0;
    currentIndex = -1;
    

  function scroll(els) {
    sections = els;
    d3.select(window)
      .on("scroll.scroller", position)
      .on("resize.scroller", resize);

    resize();

    var timer = d3.timer(function() {
      position();
      timer.stop();
    });
  }

  function resize() {
    sectionPositions = [];
    var startPos;
    sections.each(function(d, i) {
      var top = this.getBoundingClientRect().top;
      if (i === 0) {
        startPos = top;
      }
      sectionPositions.push(top - startPos);
    });
    containerStart =
      d3.select("#mainSlideSections").node().getBoundingClientRect().top + window.pageYOffset;
   
  }

  function position() {
    var pos = window.pageYOffset - containerStart;//+document.body.offsetHeight*.3;
    var sectionIndex = d3.bisect(sectionPositions, pos);    
    sectionIndex = Math.min(sections.size() - 1, sectionIndex)-1;

   

    if (currentIndex !== sectionIndex) {
      dispatch.call("active", this, sectionIndex);
      currentIndex = sectionIndex;
      activeIndex = currentIndex;
    }

    var prevIndex = Math.max(sectionIndex - 1, 0);
    var prevTop = sectionPositions[prevIndex];
    var progress = (pos - prevTop) / (sectionPositions[sectionIndex] - prevTop);

    dispatch.call("progress", this, currentIndex, progress);
  }

  scroll.container = function(value) {
    if (arguments.length === 0) {
      return container;
    }
    container = value;
    return scroll;
  };

  scroll.on = function(action, callback) {
    dispatch.on(action, callback);
  };

  return scroll;
}

var previous = "";

const smoothScrollTo = target => document.getElementById(target) ? document.getElementById(target).scrollIntoView({ block: "start", behavior: "smooth" }) : false; // Scroll smoothly to target

const display = () => {
  var scroll = scroller().container(d3.select("#mainSlideSections"));

  scroll(d3.selectAll(".slideStep"));

  scroll.on("active", function(index) {
    currentMainPresStep.step=sectionList[index].id;
    d3.selectAll(".slideStep").style("opacity", function(d, i) {
      switch (i) {
        case index: return 1
            break;
      
        case index-1: return .3
            break;

        case index+1: return .3
            break;

        default: return 1
            break;
      }
    });
    d3.selectAll(".slideStep").style("filter", function(d, i) {
      switch (i) {
        case index: return 'blur(0px)';
            break;
      
        case index-1: return 'blur(4px)'
            break;

        case index+1: return 'blur(4px)'
            break;
        
            default :return 'blur(0px)'
            break;
      }
    });
    progress(index);
  });
};



const progress = index => {
  var sectionList = document.querySelectorAll("section");
  let progBasis = parseInt(
    (activeIndex / sectionList.length) * window.innerHeight
  );
  let progNext = parseInt((index / sectionList.length) * window.innerHeight);

  var progProc = setInterval(incr, 15);

  function incr() {
    if (progBasis === progNext) {
      clearInterval(progProc);
    } else if (progBasis < progNext) {
      progBasis++;
      //document.getElementById("progressBar").style.height = progBasis + "px";
    } else if (progBasis > progNext) {
      progBasis--;
      //document.getElementById("progressBar").style.height = progBasis + "px";
    }
  }
};

const slideControl = event => {

  switch (event.isComposing || event.code) {
    case "ArrowDown":
    case "ArrowRight":
      event.preventDefault();
      smoothScrollTo(sectionList[currentIndex+1].id)
      break;

      case "ArrowUp":
      case "ArrowLeft":
      event.preventDefault();
      if (sectionList[currentIndex-1]) {
        smoothScrollTo(sectionList[currentIndex-1].id)
      }
        break;
  }
}


const populateSlides = id => {
      currentMainPresStep.id=id;
  pandodb.slider.get(id).then(presentation=>{
    let slides = presentation.content;

    if (mainPresEdit) {
        slideCreator()
        priorDate=presentation.date;
        mainPresContent=slides;
        document.getElementsByClassName("ql-editor")[0].innerHTML=mainPresContent[0].text;
        document.getElementById("slidetitle").value=mainPresContent[0].title;
        document.getElementById("presNamer").value=presentation.name;
    } else {

      slides.forEach(slide=>{
        for (let i = 0; i < (slide.text.match(/\[actionType:/g) || []).length; i++) {
          slide.text=slide.text.replace('[actionType:','<a style="filter:invert(1);cursor:pointer;" onclick=selectOption(')  
          slide.text=slide.text.replace(']',')><i class="material-icons">flip</i></a>');
        }
      })

      slides.push({})
    var nextSlide = i => "<br><i class='material-icons arrowDown'><a class='arrowDown' onclick='smoothScrollTo(\""+slides[i].title+"\")'>arrow_downward</a></i>";

    let section = document.createElement("SECTION");
      section.id = "startPres";
      section.className += "slideStep";
      section.innerHTML="<div> "+nextSlide(0)+"<div>";
      section.style.pointerEvents="all";
      field.value="start presentation";
      field.style.pointerEvents="none";

    document.getElementById("mainSlideSections").appendChild(section);

        for (let i = 0; i < slides.length-1; i++) {
          
          let section = document.createElement("SECTION");
          
            section.style.pointerEvents="all";
            section.className += "slideStep";
          if (slides[i].text) {                     //stop for last slide (empty)
            section.id = slides[i].title;
            section.innerHTML="<div style='background-color:rgba(0, 10, 10, .8);border-radius:4px;padding:10px;color:white'>"+slides[i].text+"</div>"+nextSlide(i+1);
          }

        document.getElementById("mainSlideSections").appendChild(section);

    }
    
    document.querySelectorAll("p").forEach(p=>p.style.fontSize="20px");

  sectionList = document.querySelectorAll("section");

  setTimeout(() => {
    addPadding();
    display();  
    let lastArrow=document.querySelectorAll("i .arrowDown")[document.querySelectorAll("i .arrowDown").length-1];
    lastArrow.innerText="done_outline";
  }, 50);
  
  document.addEventListener("keydown",slideControl);
  document.getElementById('menu-icon').addEventListener("click", ()=>{
    document.body.style.animation = "fadeout 0.1s";
    setTimeout(() => {
      document.body.remove();
      remote.getCurrentWindow().reload();
    }, 100);
  })
}
    })
  
  }


