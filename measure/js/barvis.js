class BarVis {

    constructor (_parentElement, _data){
    this.parentElement = _parentElement;
    this.data = _data;

    console.log("raw data for BARCHART:", this.data);

    this.initVis();
}

/*
 * Initialize visualization (static content, e.g. SVG area or axes)
 */

initVis(){
    let vis = this;

    vis.margin = { top: 20, right: 0, bottom: 200, left: 140 };

    vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right,
        vis.height = 500 - vis.margin.top - vis.margin.bottom;

    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    // Scales and axes
    vis.x = d3.scaleBand()
        .rangeRound([0, vis.width])
        .paddingInner(0.2);

    vis.y = d3.scaleLinear()
        .range([vis.height,0]);

    vis.xAxis = d3.axisBottom()
        .scale(vis.x);

    vis.yAxis = d3.axisLeft()
        .scale(vis.y);

    vis.svg.append("g")
        .attr("class", "x-axis axis")
        .attr("transform", "translate(0," + vis.height + ")");

    vis.svg.append("g")
        .attr("class", "y-axis axis");

    // append tooltip
    vis.tooltip = d3.select("body").append('div')
        .attr('class', "tooltip")
        .attr('id', 'barTooltip')

    // (Filter, aggregate, modify data)
    vis.wrangleData();
}

/*
 * Data wrangling
 */

wrangleData(){
	let vis = this;

	let filteredData = [];

    // if there is a region selected
    if (selectedTimeRange.length !== 0){
        //console.log('region selected', vis.selectedTimeRange, vis.selectedTimeRange[0].getTime() )

        // iterate over all rows the csv (dataFill)
        vis.data.forEach( row => {
            // and push rows with proper dates into filteredData
            if (selectedTimeRange[0].getTime() <= vis.parseDate(row['DATE_IMPLEMENTED']).getTime() && vis.parseDate(row['DATE_IMPLEMENTED']).getTime() <= selectedTimeRange[1].getTime() ){
                filteredData.push(row);
            }
        });
    } else {
        filteredData = vis.data;
        console.log('filtered data',filteredData)
    }

    //filter data based on multiple conditions
    let condition = {};
    let filter=(condition,data)=>{
        return data.filter( item => {
            return Object.keys( condition ).every( key => {
                return String( item[ key ] ).toLowerCase().includes(
                    String( condition[ key ] ).trim().toLowerCase() )
            } )
        } )
    }

    //generate condition
    if (selected_region != 'select'){condition['REGION'] = selected_region;}
    if (selected_country != 'select'){condition['COUNTRY'] = selected_country;}
    if (selected_category != 'select'){condition['CATEGORY'] = selected_category;}
    if (selected_stage != 'select'){condition['LOG_TYPE'] = selected_stage;}

    let selectedData = filter(condition,filteredData)
    console.log('selected data',selectedData)


    // prepare covid data by grouping all rows by category
    if (condition.length !=0 ){
        vis.dataByMeasure = Array.from(d3.group(selectedData, d =>d['MEASURE']), ([measure, value]) => ({measure, value}))
    }else{
        vis.dataByMeasure = Array.from(d3.group(filteredData, d =>d['MEASURE']), ([measure, value]) => ({measure, value}))
    }

    vis.measureCount = vis.dataByMeasure.length;

	// Create a sequence of values from 0 - length
	vis.countsPerMeasure = d3.range(0, vis.measureCount).map(function() {
        return 0;
    });

    vis.measureGroup = [];
    //populate final data structure
    vis.dataByMeasure.forEach(function(i){
        vis.measureGroup.push(
            {
                'measure': i['measure'],
                'count':i['value'].length
            }
        )
    })

    //sort data
    function compare(prop){
        return function(a,b){
            let value1 = a[prop];
            let value2 = b[prop];
            return value2 - value1;
        }
    }
    vis.measureGroup.sort(compare('count'));

    //check the final data structure(top15)
	vis.displayData = vis.measureGroup.slice(0,15);
    console.log('barChart-displayData:',vis.displayData);

	// Update the visualization
	vis.updateVis();
}

/*
 * The drawing function
 */

updateVis(){
	let vis = this;

    // Update domains
    vis.x.domain(vis.displayData.map(d=>d['measure']))
    vis.y.domain([0, vis.displayData[0]['count']]).nice();

    // Call axis function with the new domain
    vis.svg.select(".y-axis").call(vis.yAxis);

    vis.svg.select(".x-axis").call(vis.xAxis)
        .selectAll("text")
        .data(vis.displayData)
        .enter()
        .text( d=> d['measure'])
        .style("text-anchor", "start")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(45)");

    // gridlines function
    function make_x_gridlines() {
        return d3.axisBottom(vis.x);
    }

    function make_y_gridlines() {
        return d3.axisRight(vis.y);
    }

    // // add the X gridlines
    // let xgrid =  vis.svg.append("g")
    //     .attr("id", "xgrid")
    //     .attr("transform", "translate("+ vis.x.bandwidth()/2 +"," + vis.height + ")")
    //     .call(make_x_gridlines()
    //         .tickSize(-vis.height)
    //         .tickFormat("")
    //     )
    //
    // // add the Y gridlines
    // let ygrid =  vis.svg.append("g")
    //     .attr("id", "ygrid")
    //     .call(make_y_gridlines()
    //         .tickSize(vis.width)
    //         .tickFormat("")
    //     )

    //draw bars
    let bars = vis.svg.selectAll(".bar")
        .data(vis.displayData)

    bars.enter().append("rect")
        .attr("class", "bar")

        .merge(bars)
        .transition()
        .attr("width", vis.x.bandwidth())
        .attr("height", (d,i) => vis.height - vis.y(vis.displayData[i]['count']))
        .attr("x", (d, i) => vis.x(vis.displayData[i]['measure']))
        .attr("y", (d, i) => vis.y(vis.displayData[i]['count']))
        //tooltip
        // .on('mouseover', function(event, d){
        //     d3.select(this)
        //         .attr('stroke-width', '2px')
        //         .attr('fill', 'rgb(255,89,0)')
        //
        //     vis.tooltip
        //         .style("opacity", 1)
        //         .style("left", event.pageX + 20 + "px")
        //         .style("top", event.pageY + "px")
        //         .html(`
        //             <div style="border: thin solid grey; border-radius: 5px; background: lightgrey; padding: 20px">
        //      <h3>${vis.displayData['measure']}</h3>
        //      <h4> Count: ${vis.displayData['count']}</h4>
        //      </div>
        //                 `)
        // })
        // .on('mouseout', function(event, d){
        //     d3.select(this)
        //         .attr('stroke-width', '0px')
        //         .attr("fill","#ffb100")
        //
        //     vis.tooltip
        //         .style("opacity", 0)
        //         .style("left", 0)
        //         .style("top", 0)
        //         .html(``);
        // });

    bars.exit().remove();


}


onSelectionChange (selectionStart, selectionEnd){
	let vis = this;

	// Filter data depending on selected time period (brush)
    vis.filteredData = vis.data.filter(function(d){
        return d['time']> selectionStart && d['time']<selectionEnd;
    })

	vis.wrangleData();
}
}
