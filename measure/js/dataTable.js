
class DataTable {

    // constructor method to initialize Timeline object
    constructor(parentElement, data) {
        this.parentElement = parentElement;
        this.data = data;
        this.displayData = [];

        // parse date method
        this.parseDate = d3.timeParse("%Y-%m-%d");
        this.dateFormatter = d3.timeFormat("%Y-%m-%d");

        this.initTable()
    }

    initTable(){
        let tableObject = this
        tableObject.table = d3.select(`#${tableObject.parentElement}`)
            .append("table")
            .attr("class", "table table-hover")

        // append table head
        tableObject.thead = tableObject.table.append("thead")
        tableObject.thead.html(
            `<tr>
                <th scope="col">Lockdown</th>
                <th scope="col">Movement Restriction</th>
                <th scope="col">Social Distancing</th>
                <th scope="col">Government & Social-Economics</th>
                <th scope="col">Public Health</th>
            </tr>`
        )
        // append table body
        tableObject.tbody = tableObject.table.append("tbody")

        // wrangleData
        tableObject.wrangleData()
    }

    wrangleData(){
        let tableObject = this

        // check out the data
        console.log('tableObject',tableObject.data)

        // first, filter according to selectedTimeRange, init empty array
        let filteredData = [];

        // if there is a region selected
        if (selectedTimeRange.length !== 0){
            //console.log('region selected', vis.selectedTimeRange, vis.selectedTimeRange[0].getTime() )

            // iterate over all rows the csv (dataFill)
            tableObject.data.forEach( row => {
                // and push rows with proper dates into filteredData
                if (selectedTimeRange[0].getTime() <= tableObject.parseDate(row['DATE_IMPLEMENTED']).getTime() && tableObject.parseDate(row['DATE_IMPLEMENTED']).getTime() <= selectedTimeRange[1].getTime() ){
                    filteredData.push(row);
                }
            });
        } else {
            filteredData = tableObject.data;
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

        if (selected_region != 'select'){
            condition['REGION'] = selected_region;
        }
        if (selected_country != 'select'){
            condition['COUNTRY'] = selected_country;
        }
        if (selected_stage != 'select'){
            condition['LOG_TYPE'] = selected_stage;
        }

        let selectedData = filter(condition,filteredData)

        // prepare covid data by grouping all rows by category
        if (condition.length !=0 ){
            tableObject.dataByCategory = Array.from(d3.group(selectedData, d =>d['CATEGORY']), ([category, value]) => ({category, value}))
        }else{
            tableObject.dataByCategory = Array.from(d3.group(filteredData, d =>d['CATEGORY']), ([category, value]) => ({category, value}))
        }

        tableObject.categoryGroup = [];
        //populate final data structure
        tableObject.dataByCategory.forEach(function(i){
            tableObject.categoryGroup.push(
                {
                    'category': i['category'],
                    'count':i['value'].length
                }
            )
        })

        //once select one category, set others to 0
        if (selected_category != 'select'){
            tableObject.categoryGroup.forEach(function(i){
                if (i['category']!=selected_category){
                    i['count']=0;
                }
            })
        }
        // have a look
        console.log('categoryGroup',tableObject.categoryGroup)

        tableObject.updateTable()

    }

    updateTable() {
        let tableObject = this;

        let lockDown = tableObject.categoryGroup[0]['count'];
        let movementRestriction = tableObject.categoryGroup[1]['count'];
        let socialDistance = tableObject.categoryGroup[2]['count'];
        let governmentSocio = tableObject.categoryGroup[3]['count'];
        let publicHealth = tableObject.categoryGroup[4]['count'];

        tableObject.tbody.html('');

        let row = tableObject.tbody.append("tr")
        row.html(
            `<td>${publicHealth}</td>
        <td>${movementRestriction}</td>
        <td>${governmentSocio}</td>
        <td>${socialDistance}</td>
        <td>${lockDown}</td>`
        )
    }

}