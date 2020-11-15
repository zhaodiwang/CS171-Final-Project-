let myDataTable, myBarVis;

// Function to convert date objects to strings or reverse
let dateFormatter = d3.timeFormat("%Y-%m-%d");
let dateParser = d3.timeParse("%Y-%m-%d");

let selectedTimeRange = [];

// (1) Load data with promises
let promises = [
    d3.json("data/measure_cleaned.json")
];

Promise.all(promises)
    .then( function(data){ createVis(data)})
    .catch( function (err){console.log(err)} );


	function createVis(data){
		let measureData = data[0];
		// log data
		console.log('check out the data', measureData);
		// init visualizations
		myDataTable = new DataTable('tableDiv', measureData);
		myBarVis = new BarVis('barvis',measureData);
}

//Enable category selection via bootstrap select
let selected_region = $('#regionSelector').val();
let selected_category = $('#categorySelector').val();
let selected_country = $('#countrySelector').val();
let selected_stage = $('#stageSelector').val();

function categoryChange() {
	selected_category = $('#categorySelector').val();
	selected_region = $('#regionSelector').val();
	selected_country = $('#countrySelector').val();
	selected_stage = $('#stageSelector').val();

	myBarVis.wrangleData();
	myDataTable.wrangleData();
}