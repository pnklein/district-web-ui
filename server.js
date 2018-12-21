/////   SET UP EXPRESS   //////
var express = require('express');
var app = express();
var https = require('https');

// For config files
var fs = require('fs');
var path = require('path');

// ASYNC dependencies
var async = require('async');
const fetch = require("node-fetch");
const util = require('util');
const readFile = util.promisify(fs.readFile);

// For executing python script
var spawnSync = require("child_process").spawnSync;

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

var engines = require('consolidate');
app.engine('html', engines.hogan); // tell Express to run .html files through Hogan
app.set('views', __dirname); // tell Express where to find templates, in this case the '/templates' directory
app.set('view engine', 'html'); // register .html extension as template engine so we can render .html pages 

app.use(express.static(__dirname + '/public')); // client-side js & css files

var stateCodes = {
			    "AL": {
				    	"name": "Alabama",
				    	"single_district": false
			    	},
			    "AK": {
			    		"name": "Alaska", 
			    		"single_district": true
			    	},
			    "AZ": {
			    		"name": "Arizona", 
			    		"single_district": false
			    	},
			    "AR": {
			    		"name": "Arkansas", 
			    		"single_district": false
			    	},
			    "CA": {
			    		"name": "California", 
			    		"single_district": false
			    	},
			    "CO": {
			    		"name": "Colorado", 
			    		"single_district": false
			    	},
			    "CT": {
			    		"name": "Connecticut", 
			    		"single_district": false
			    	},
			    "DE": {
			    		"name": "Delaware", 
			    		"single_district": true
			    	},
			    "FL": {
			    		"name": "Florida", 
			    		"single_district": false
			    	},
			    "GA": {
			    		"name": "Georgia", 
			    		"single_district": false
			    	},
			    "HI": {
			    		"name": "Hawaii", 
			    		"single_district": false
			    	},
			    "ID": {
			    		"name": "Idaho", 
			    		"single_district": false
			    	},
			    "IL": {
			    		"name": "Illinois", 
			    		"single_district": false
			    	},
			    "IN": {
			    		"name": "Indiana", 
			    		"single_district": false
			    	},
			    "IA": {
			    	"name": "Iowa", 
			    		"single_district": false
			    	},
			    "KS": {
			    		"name": "Kansas", 
			    		"single_district": false
			    	},
			    "KY": {
			    		"name": "Kentucky", 
			    		"single_district": false
			    	},
			    "LA": {
			    		"name": "Louisiana", 
			    		"single_district": false
			    	},
			    "ME": {
			    		"name": "Maine", 
			    		"single_district": false
			    	},
			    "MD": {
			    		"name": "Maryland", 
			    		"single_district": false
			    	},
			    "MA": {
			    		"name": "Massachusetts", 
			    		"single_district": false
			    	},
			    "MI": {
			    		"name": "Michigan", 
			    		"single_district": false
			    	},
			    "MN": {
			    		"name": "Minnesota", 
			    		"single_district": false
			    	},
			    "MS": {
			    		"name": "Mississippi", 
			    		"single_district": true
			    	},
			    "MO": {
			    		"name": "Missouri", 
			    		"single_district": false
			    	},
			    "MT": {
			    		"name": "Montana", 
			    		"single_district": true
			    	},
			    "NE": {
			    		"name": "Nebraska", 
			    		"single_district": false
			    	},
			    "NV": {
			    		"name": "Nevada", 
			    		"single_district": false
			    	},
			    "NH": {
			    		"name": "New Hampshire", 
			    		"single_district": false
			    	},
			    "NJ": {
			    		"name": "New Jersey", 
			    		"single_district": true
			    	},
			    "NM": {
			    		"name": "New Mexico", 
			    		"single_district": false
			    	},
			    "NY": {
			    		"name": "New York", 
			    		"single_district": false
			    	},
			    "NC": {
			    		"name": "North Carolina", 
			    		"single_district": false
			    	},
			    "ND": {
			    		"name": "North Dakota", 
			    		"single_district": true 
			    	},
			    "OH": {
			    		"name": "Ohio", 
			    		"single_district": false 
			    	},
			    "OK": {
			    		"name": "Oklahoma", 
			    		"single_district": false 
			    	},
			    "OR": {
			    		"name": "Oregon", 
			    		"single_district": false 
			    	},
			    "PA": {
			    		"name": "Pennsylvania", 
			    		"single_district": false 
			    	},
			    "RI": {
			    		"name": "Rhode Island", 
			    		"single_district": false 
			    	},
			    "SC": {
			    		"name": "South Carolina", 
			    		"single_district": false 
			    	},
			    "SD": {
			    		"name": "South Dakota", 
			    		"single_district": true 
			    	},
			    "TN": {
			    		"name": "Tennessee", 
			    		"single_district": false 
			    	},
			    "TX": {
			    		"name": "Texas", 
			    		"single_district": false 
			    	},
			    "UT": {
			    		"name": "Utah", 
			    		"single_district": false 
			    	},
			    "VT": {
			    		"name": "Vermont", 
			    		"single_district": true 
			    	},
			    "VA": {
			    		"name": "Virginia", 
			    		"single_district": false 
			    	},
			    "WA": {
			    		"name": "Washington", 
			    		"single_district": false 
			    	},
			    "WV": {
			    		"name": "West Virginia", 
			    		"single_district": true 
			    	},
			    "WI": {
			    		"name": "Wisconsin", 
			    		"single_district": false 
			    	},
			    "WY": {
			    		"name": "Wyoming", 
			    		"single_district": true 
			    	}
				}

/////   ROUTING   //////

// main page of the site
app.get('/', function(req, res){
	res.render('index.html');
});

// There is a global variable above called stateCodes, which we send along as a response to a get request in index.js in makeStateList(). 
// This helps form the list of states on the left side of the UI
app.get('/states', async function(req, res){
	res.send(JSON.stringify(stateCodes));
});

// This is to get all data for drawing the map. Takes in a :name parameter (the state code) and a :detailopt (whether or not we should 
// send along the census block detail)
app.get('/state/:name/:detailopt', async function(req, res){

	var statejson = fs.readFileSync('../district-web-data/states.json'); // contains information about each state, including state boundary and census area. take a look in the file for more info

	var state = JSON.parse(statejson).features.find(state => (state.properties.NAME == stateCodes[req.params.name]["name"]));

	var	stateGeom = state.geometry; // get the geometry/coordinates corresponding to the state in question

	if (req.params.name == 'AK') {
		var zoom = (10 - Math.log10(state.properties.CENSUSAREA)); // a cute little equation i experimentally came up with to calculate a reasonable zoom setting for open layers
	} else {
		var zoom = (11.5 - Math.log10(state.properties.CENSUSAREA));
	}
	console.log(zoom);

	// Read in colors for the state
	var colors = [];
	async function fetchColors() {
		return await readFile('../district-web-data/web_data/graph_coloring/colors_'+req.params.name);
	}

	await fetchColors().then(data => {
		colors = JSON.parse(data).colors;
	}).catch(err => {
		console.log('There does not already exist a file with the colors for the districting of this state');
		console.log(err);
	})

	var detail_opt = req.params.detailopt;
	console.log(detail_opt);
	var census_blocks, poly_file;

	// we're about to read in the district_polygons, i.e. power cells, pre-computed for state and stored in web_data
	fs.readFile('../district-web-data/web_data/district_polygons/polygons_'+req.params.name, 'utf8', function(err, data){

		if (err){
			console.log('There does not already exist a file with the polygons for the districting of this state');
			console.log(err);

			// pass in empty data so that server doesn't crash, will just show outline of state
			var json = {"polygons":[], "geometry":stateGeom, "blocks":[], "zoom":zoom, "colors":['#fafafa']}

		}
		else {
			if (detail_opt == 'true'){
				raw_blocks = fs.readFileSync('../district-web-data/web_data/census_polygons/boundary_blocks_'+req.params.name+'.json');
				census_blocks = JSON.parse(raw_blocks);

			}
			else {
				census_blocks = [];
			}
			// string processing because arrays in python are different than arrays in js.
			var polygons = JSON.parse(data.replace(/\(/g, '\[').replace(/\)/g, '\]'));
			var json = {"polygons":polygons, "geometry":stateGeom, "blocks": census_blocks, "zoom":zoom, "colors":colors};
		}

		// send it back to the functions that did a get request to this route in index.js
		res.send(JSON.stringify(json));
	});
});

// SERVER SET UP

app.listen(8080, function(){
	console.log('– Server listening on port 8080');
});

process.on('SIGINT', function(){
	console.log('\nI\'m closing');
	process.exit(0);
});