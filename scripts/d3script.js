function renderChart(params) {

  // exposed variables
  var attrs = {
    svgWidth: 960,
    svgHeight: 500,
    marginTop: 20,
    marginBottom: 20,
    marginRight: 30,
    marginLeft: 50,
    container: 'body',
    data: null
  };

  /*############### IF EXISTS OVERWRITE ATTRIBUTES FROM PASSED PARAM  #######  */

  var attrKeys = Object.keys(attrs);
  attrKeys.forEach(function (key) {
    if (params && params[key]) {
      attrs[key] = params[key];
    }
  })

  //innerFunctions which will update visuals
  var updateData;

  //main chart object
  var main = function (selection) {
    selection.each(function scope() {

      //calculated properties
      var calc = {}
      calc.chartLeftMargin = attrs.marginLeft;
      calc.chartTopMargin = attrs.marginTop;
      calc.chartWidth = attrs.svgWidth - attrs.marginRight - calc.chartLeftMargin;
      calc.chartHeight = attrs.svgHeight - attrs.marginBottom - calc.chartTopMargin;

      // ################## parsers ##############
      var parsers = {}
      parsers.time = d3.timeParse("%d-%b-%y");

      attrs.data.forEach(function (d) {
        if (!(d.date instanceof Date)) {
          d.date = parsers.time(d.date);
        }
        d.close = +d.close;
      });


      // ###################  scales ##################
      var scales = {}
      scales.x = d3.scaleTime()
        .range([0, calc.chartWidth])
        .domain(d3.extent(attrs.data, function (d) { return d.date; }));
      scales.y = d3.scaleLinear()
        .range([calc.chartHeight, 0])
        .domain([0, d3.max(attrs.data, function (d) { return d.close; })]);


      // #################### axes ###################
      var axes = {}
      axes.bottom = d3.axisBottom(scales.x)
      axes.left = d3.axisLeft(scales.y)


      // ################## layout ###################
      var layouts = {}
      layouts.line = d3.line()
        .x(function (d) { return scales.x(d.date); })
        .y(function (d) { return scales.y(d.close); });

      //drawing containers
      var container = d3.select(this);

      //add svg
      var svg = patternify({ container: container, selector: 'svg-chart-container', elementTag: 'svg' })
      svg.attr('width', attrs.svgWidth)
        .attr('height', attrs.svgHeight)
      // .attr("viewBox", "0 0 " + attrs.svgWidth + " " + attrs.svgHeight)
      // .attr("preserveAspectRatio", "xMidYMid meet")

      //add container g element
      var chart = patternify({ container: svg, selector: 'chart', elementTag: 'g' })
      chart.attr('transform', 'translate(' + (calc.chartLeftMargin) + ',' + calc.chartTopMargin + ')');

      var path = patternify({ container: chart, selector: 'line', elementTag: 'path' })
      path
        .datum(attrs.data)
        .attr("d", layouts.line)
        .attr("fill", "none")
        .attr("stroke", "teal")
        .attr("stroke-width", 2);

      var bottomAxisWrapper = patternify({ container: chart, selector: 'bottom-axis-wrapper', elementTag: 'g' })
      bottomAxisWrapper
        .attr("transform", "translate(0," + calc.chartHeight + ")")
        .call(axes.bottom);

      var leftAxisWrapper = patternify({ container: chart, selector: 'left-axis-wrapper', elementTag: 'g' })
      leftAxisWrapper
        .call(axes.left);

      // smoothly handle data updating
      updateData = function () {


      }
      //#########################################  UTIL FUNCS ##################################

      //enter exit update pattern principle
      function patternify(params) {
        var container = params.container;
        var selector = params.selector;
        var elementTag = params.elementTag;

        // pattern in action
        var selection = container.selectAll('.' + selector).data([selector])
        selection.exit().remove();
        selection = selection.enter().append(elementTag).merge(selection)
        selection.attr('class', selector);
        return selection;
      }


      window.addEventListener("resize", function () {
        var width = container.node().getBoundingClientRect().width;
        main.svgWidth(width);
        main.run();
      });


      function debug() {
        if (attrs.isDebug) {
          //stringify func
          var stringified = scope + "";

          // parse variable names
          var groupVariables = stringified
            //match var x-xx= {};
            .match(/var\s+([\w])+\s*=\s*{\s*}/gi)
            //match xxx
            .map(d => d.match(/\s+\w*/gi).filter(s => s.trim()))
            //get xxx
            .map(v => v[0].trim())

          //assign local variables to the scope
          groupVariables.forEach(v => {
            main['P_' + v] = eval(v)
          })
        }
      }

      debug();
    });
  };

  //dinamic functions
  Object.keys(attrs).forEach(key => {
    // Attach variables to main function
    return main[key] = function (_) {
      var string = `attrs['${key}'] = _`;
      if (!arguments.length) { return eval(` attrs['${key}'];`); }
      eval(string);
      return main;
    };
  });

  //set attrs as property
  main.attrs = attrs;

  //debugging visuals
  main.debug = function (isDebug) {
    attrs.isDebug = isDebug;
    if (isDebug) {
      if (!window.charts) window.charts = [];
      window.charts.push(main);
    }
    return main;
  }

  //exposed update functions
  main.data = function (value) {
    if (!arguments.length) return attrs.data;
    attrs.data = value;
    if (typeof updateData === 'function') {
      updateData();
    }
    return main;
  }

  // run  visual
  main.run = function () {
    d3.selectAll(attrs.container).call(main);
    return main;
  }

  return main;
}
