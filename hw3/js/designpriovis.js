/**
 * Created by Hendrik Strobelt (hendrik.strobelt.com) on 1/28/15.
 */


//TODO: DO IT ! :) Look at agevis.js for a useful structure

PrioVis = function(_parentElement, _data, _metaData){
    this.parentElement = _parentElement;
    this.data = _data;
    this.metaData = _metaData;
    this.displayData = [];

    this.totals = d3.range(16). map(function(){return 0;});
    var that = this;
    this.data
      .forEach(function(d) {
        d.prios.forEach(function(e, c) {
            that.totals[c] += e;
        });
      });
      console.log(this.totals);

    // defines constants
    this.margin = {top: 10, right: 70, bottom: 150, left: 80},
    this.width = 800 - this.margin.left - this.margin.right,
    this.height = 570 - this.margin.top - this.margin.bottom;

    this.initVis();
};


/**
 * Method that sets up the SVG and the variables
 */
PrioVis.prototype.initVis = function(){

  var tmp = this.mData();

  this.colorDomain = tmp[0],
    this.domain = tmp[1];

    // constructs SVG layout
    this.svg = this.parentElement.append("svg")
        .attr("width", this.width + this.margin.left + this.margin.right)
        .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
        .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

    // creates axis and scales
    this.x = d3.scale.ordinal()
      .rangeRoundBands([0, this.width], 0.1);


    this.y = d3.scale.linear()
    .range([this.height , this.margin.top])

    this.color = d3.scale.ordinal().range(this.colorDomain).domain(this.domain);

    this.xAxis = d3.svg.axis()
      .scale(this.x)
      .orient("bottom");

    this.yAxis = d3.svg.axis()
      .scale(this.y)
      .ticks(6)
      .orient("left");

    // Add axes visual elements
    this.svg.append("g")
      .attr("class", "y axis");

    this.svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0,"+this.height+")");


    // filter, aggregate, modify data
    this.wrangleData(null);

    // call the update method
    this.updateVis();
};


/**
 * Method to wrangle the data. In this case it takes an options object
 * @param _filterFunction - a function that filters data or "null" if none
 */
PrioVis.prototype.wrangleData= function(_filterFunction){

    // displayData should hold the data which is visualized
    this.displayData = this.filterAndAggregate(_filterFunction);

    //// you might be able to pass some options,
    //// if you don't pass options -- set the default options
    //// the default is: var options = {filter: function(){return true;} }
    //var options = _options || {filter: function(){return true;}};
};



/**
 * the drawing function - should use the D3 selection, enter, exit
 */
PrioVis.prototype.updateVis = function(){

    // Dear JS hipster,
    // you might be able to pass some options as parameter _option
    // But it's not needed to solve the task.
    // var options = _options || {};

    var that = this;

    // updates scalesfunction(d) { return that.metaData.priorities[d.type]['item-title']; }
    this.y.domain([0, d3.max(that.displayData)]);
    this.x.domain(that.displayData.map(function(d,i) { return that.metaData.priorities[i]['item-title']; }));


    this.color.domain(that.displayData.map(function(d, i) { return i; }));
    // updates axis
    this.svg.select(".y.axis")
        .call(this.yAxis);
    this.svg.select(".x.axis")
        .call(this.xAxis)
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)");
    // updates graph

    // Data join
    var bar = this.svg.selectAll(".bar")
      .data(that.displayData, function(d, i) { return i; });

    // Append new bar groups, if required
    bar.enter().append("g").append("rect");
    // bar_enter.append("text");
    //
    // bar_enter.on("click", function(d) {
    //   volume_vis.onSelectionChange(d.type);
    // });

    // Add attributes (position) to all bars
    bar
      .attr("class", "bar")
      .transition()
      .attr("transform", function(d, i) {
        return "translate(" + that.x(that.domain[i]) + ",0)"
      });
      // .attr("transform", function(d, i) { return "translate(" + that.x(d.type) + ",0)"; });

    // Remove the extra bars
    bar.exit()
      .remove();

    // Update all inner rects and texts (both update and enter sets)

    bar.select("rect")
      .transition()
      .attr("height", function(d) {
          // console.log(d,that.y(d));
          return that.height - that.y(d);
      })
      .style("fill", function(d, i) {
        return that.color(i);
      })
      .attr("width", this.x.rangeBand())
      .attr("x", 0)
      .attr("y", function(d, i) {
          return that.y(d);
      });

    bar.selectAll("text")
      .transition()
      .attr("y", function(d) { return that.height; })
      // .attr("x", function(d,i) { return that.x.rangeBand(i) / 2; })
      .text(function(d,i) { return that.metaData.priorities[i]['item-title']; })
      .attr("class", "type-label")
      .attr("dy", ".35em")
      .attr("text-anchor", function(d) { return that.doesLabelFit(d) ? "end" : "start"; })
      .attr("fill", function(d) { return that.doesLabelFit(d) ? "white" : "black"; });
};


/**
 * Gets called by event handler and should create new aggregated data
 * aggregation is done by the function "aggregate(filter)". Filter has to
 * be defined here.
 * @param selection
 */
PrioVis.prototype.onSelectionChange = function (selectionStart, selectionEnd, empty){

    // TODO: call wrangle function
    if (empty) {
      this.wrangleData(null);
    }
    else {
      var filter = function(t) { return (t.time >= selectionStart && t.time <= selectionEnd); };
      this.wrangleData(filter);
    }

    this.updateVis();
};


/**
 * Helper function that figures if there is sufficient space
 * to fit a label inside its bar in a bar chart
 */
PrioVis.prototype.doesLabelFit = function(datum, label) {
  var pixel_per_character = 6;  // obviously a (rough) approximation

  return datum.type.length * pixel_per_character < this.x(datum.count);
};

/**
 * The aggregate function that creates the counts for each age for a given filter.
 * @param _filter - A filter can be, e.g.,  a function that is only true for data of a given time range
 * @returns {Array|*}
 */
PrioVis.prototype.filterAndAggregate = function(_filter){

    // Set filter to a function that accepts all items
    // ONLY if the parameter _filter is NOT null use this parameter
    var filter = function(){return true;};
    if (_filter != null){
        filter = _filter;
    }
    //Dear JS hipster, a more hip variant of this construct would be:
    // var filter = _filter || function(){return true;}

    var that = this;


    var counts = d3.range(16). map(function(){return 0});

    // Convert data into summary count format
    this.data
      .filter(filter)
      .forEach(function(d) {
        d.prios.forEach(function(e, c) {
            counts[c] += e;
        });
      });

    var outOfTotal = that.totals.map(function(d, i) {
      return that.totals[i] - counts[i];
    });
    var data = [counts, this.totals];

    data = d3.layout.stack()(data.map(function(d) {
      return d.map(function(p, i) {
          return {x:i, y:p};
      });
    }));

    console.log(data);
    return counts;
};

PrioVis.prototype.mData = function(i) {
  var that = this;
  var res = d3.range(16).map(function(d) {
    return that.metaData.priorities[d]["item-title"]
  });
  var colorDomain = d3.range(16).map(function(d) {
    return that.metaData.priorities[d]["item-color"]
  });
  return [colorDomain, res];
}
