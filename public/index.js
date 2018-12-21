$(document).ready(function(){

			var map, districtLayers, boundlayer;
			let districtColors = {};
			// create a zoom variable, change it when new state is selected, do not change
			// when new toggle is selected

			setupmap('RI');// default state

			///////////////////
			//  STATE LIST   //
			///////////////////
			$.get('/states', function(data, status){
				makeStateList(JSON.parse(data));
			});

			// Dynamically loads the list of states
			function makeStateList(states){
				for (var i in states){
					var para = document.createElement("p");
					// if state has only one district, indicate
					if (states[i]['single_district'] == true) {
						$(para).html(states[i]["name"] + "*");
					} else {
						$(para).html(states[i]["name"]);
					}
					$(para).prop("code", i);
					$('#state-list').append(para);
				}
			}

			// Functionality for searching thru states
			$('#state-search').on('keyup search', function(e){
				var letters = $('#state-search').val();
				var states = $('#state-list').children();

				for (var i in states){
					var state = states[i].innerHTML;
					console.log(states[i].innerHTML);
					if (!state.startsWith(letters)){
						$(states[i]).css('display','none');
					}
					else {
						$(states[i]).css('display','block');
					}

				}

			});


			///////////////////////////
			//FORM/EVENT HANDLERS ///////////
			///////////////////////////

			$('#detail-option').on('change', toggleDetail);
			$('#bound-option').on('change', toggleBorder);


			// adds or removes census block detailing on boundaries
			function toggleDetail(event){
				showLoadAnimation();

				var detail_option = $('#detail-option').prop('checked');
				var border_option = $('#bound-option').prop('checked');
				console.log(detail_option);
				var state = $('#state-input').val();

				$.get('/state/'+state+'/'+detail_option,  function(res){
					
					drawDistricts(state, res, border_option); // redraws districts, which causes refresh
					// add parameter that is toggle, T or F
					hideLoadAnimation();

				});
				event.preventDefault();
			}

			function toggleBorder(event){
				showLoadAnimation();

				var border_option = $('#bound-option').prop('checked');

				strokestyle = boundlayer.getStyle().getStroke();

				if (border_option) {
					strokestyle.setWidth(3);
					strokestyle.setColor('black');

				}
				else {
					strokestyle.setWidth(0);
					strokestyle.setColor([0,0,0,0]);
				}

				boundlayer.getSource().refresh();// updates layers with style changes
				hideLoadAnimation();

				event.preventDefault();
			}


			$(document).on('click', 'p', function(){
				var code = $(this).prop("code");

				$('#state-input').val(code);
				showLoadAnimation();
				panToState(code);
				hideLoadAnimation();
			});


			///////////////
			//DRAWING MAP//
			///////////////

			// Pans to clicked state
			function panToState(state){
				var detail_option = $('#detail-option').prop('checked');
				$.get('/state/'+state+'/'+detail_option, function(data, status){
					var border_option = $('#bound-option').prop('checked');
					drawDistricts(state, data, border_option);
				})
			}

			// Redraws district boundaries at center of state
			function drawDistricts(state, data, border_option){
				var json = JSON.parse(data);
				var stateData = json.geometry;
				var districts = json.polygons;
				var blocks = json.blocks;
				var zoom = json.zoom;

				map.getView().setCenter(ol.proj.fromLonLat(stateData.center));
				map.removeLayer(boundlayer);
				for (var i in districtLayers){ // global var
					map.removeLayer(districtLayers[i]);
				}
				var newlayers = formLayers(state, stateData.type, stateData.coordinates, stateData.center, districts, blocks, border_option);

				for (var j in newlayers){
					map.addLayer(newlayers[j]);
					console.log(map.getLayers());
				}
				map.getView().setZoom(zoom);
				console.log(status);
			}

			// Initial drawing of map
			function setupmap(state){
				$.get('/state/'+state+'/true', function(data, status){

					var json = JSON.parse(data);

					var stateData = json.geometry;
					var districts = json.polygons;
					var zoom = json.zoom;
					var blocks = json.blocks;

					console.log(districts);

					createmap(state, stateData.type, stateData.coordinates, stateData.center, zoom, districts, blocks, true);
				})
			}

			// Returns the ol map object... only on page reload. 'blocks' is polygons of census block boundaries
			function createmap(state, type, coords, center, zoom, districts, blocks, border_option) {
				var layers = formLayers(state, type, coords, center, districts, blocks, border_option);

				var osm = new ol.layer.Tile({
					source: new ol.source.OSM(),
					opacity: 0.75
				})

				map = new ol.Map({
					target: 'map',
		        	layers: [osm].concat(layers),
		        	view: new ol.View({
		        		center: ol.proj.fromLonLat(center),
		          		zoom: zoom
		        	})
		      	});
			}

			// Forms the layers and their geometries but doesn't draw layers. 'blocks' is census block boundaries
			function formLayers(state, type, coords, center, districts, blocks, border_option) {
				var bound_geometry;
				var boundfeature = new ol.Feature({});

				if (type == 'Polygon'){
					bound_geometry = new ol.geom.Polygon(coords);
				}

				else if (type == 'MultiPolygon'){
					bound_geometry = new ol.geom.MultiPolygon(coords);
				}

				bound_geometry.transform('EPSG:4326', 'EPSG:3857');
				boundfeature.setGeometry(bound_geometry);

				districtLayers = drawDistrictLayers(state, districts, bound_geometry, blocks);

				// reset border option
				if (border_option) {
					stroke_style = new ol.style.Stroke({
						width: 3,
						color: 'black'
				    })
				} else {
					stroke_style = new ol.style.Stroke({
						width: 0,
						color: [0,0,0,0]
				    })
				}

				boundlayer = new ol.layer.Vector({
				    source: new ol.source.Vector({
				        features: [boundfeature]
				    }),
				    style: new ol.style.Style({
						stroke: stroke_style,
				    	fill: new ol.style.Fill({
				    		color: 'white'
				    	})
				    }),
				    opacity: 0.5
				})

				return (districtLayers.concat([boundlayer]));
			}

			// Forms vector drawings of district layers, doesn't add to map yet
			// change coords to be district
			function drawDistrictLayers(state, coords, geometry, blocks){
				var layers = [];
				var colors = [];

				// check if state already has colors loaded in
				// if not, generate random colors
				if (state in districtColors) {
					colors = districtColors[state];
				} else {
					for (var l in coords) {
						color = getRandomColor().toString();
						colors.push(color)
					}
					districtColors[state] = colors;
				}

				// district vectors
				for (var i in coords) {
					var geom;
					if (dimension(coords[i]) == 2) {
						var geom = new ol.geom.Polygon([coords[i]]);
					}
					else {
						var geom = new ol.geom.MultiPolygon([coords[i]]);
					}

					geom.transform('EPSG:4326', 'EPSG:3857');

					var vector = new ol.layer.Vector({
				    	source: new ol.source.Vector({
				        	features: [new ol.Feature({
				        		geometry: geom
				        	})]
				    	}),
				    	style: new ol.style.Style({

				    		fill: new ol.style.Fill({
				    			color: colors[i]
				    		})
				    	}),
				    	opacity: 0.5
					});

					clipPolygon(vector, geometry);

					layers.push(vector);
				}

				// census block vectors to clip district vectors
				for (var j in Object.keys(blocks)){
					console.log(blocks[j]);

					var blocks_geom = new ol.geom.MultiPolygon([blocks[j]]);
					blocks_geom.transform('EPSG:4326', 'EPSG:3857');

					// This is to correct an alpha problem when overlaying census blocks over districts. we clip the district with the block clipVector using xor 
					// for globalCompositeOperation, then draw another layer colorVector with the actual block. Inefficient but must be done to achieve desired result.
					var clipVector = new ol.layer.Vector({
			    	source: new ol.source.Vector({
			        	features: [new ol.Feature({
			        		geometry: blocks_geom
			        	})]
				    }),
				   	style: new ol.style.Style({
				   		fill: new ol.style.Fill({
				   			color: colors[j]
				   		})
				   	}),
					   	opacity: 1
					});

					var colorVector = new ol.layer.Vector({
			    	source: new ol.source.Vector({
			        	features: [new ol.Feature({
			        		geometry: blocks_geom
			        	})]
				    }),
				   	style: new ol.style.Style({
				   		fill: new ol.style.Fill({
				   			color: colors[j]
				   		})
				   	}),
					   	opacity: 0.5
					});

					clipVector.on('precompose', function(event){
						var ctx = event.context;
						ctx.save();

						ctx.globalCompositeOperation = 'xor';

					});

					clipVector.on('postcompose', function(event){
						var ctx = event.context;
						ctx.globalCompositeOperation = 'source-over';

						ctx.restore();

					});

					// https://gist.github.com/elemoine/b95420de2db3707f2e89
					// clipPolygon(vector, geometry);

					layers.push(clipVector);
					layers.push(colorVector);
				}
				return layers;
			}


///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
////////////////////////////      HELPERS      ////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

			function showLoadAnimation(){
				$('#loading-gif').css('display', 'block');

				var center_coords = map.getView().getCenter();
				var loading = new ol.Overlay({
  					element: document.getElementById('loading-gif'),
  					position: center_coords,
  					positioning: 'center-center'
				});
				// loading.setPosition(center_coords);
				map.addOverlay(loading);
				map.renderSync();
			};

			function hideLoadAnimation(){
				$('#loading-gif').css('display', 'none');

			}

			// clips polygon vector layer (vector) to stay within the outline of the state (geometry)
			function clipPolygon(vector, geometry){
				// https://gist.github.com/elemoine/b95420de2db3707f2e89
					vector.on('precompose', function(event) {
				        var ctx = event.context;
          				var vecCtx = event.vectorContext;
				        ctx.save();

				        var fillStyle = new ol.style.Style({fill: new ol.style.Fill({color: [0, 0, 0, 0]})});

				        vecCtx.setStyle(fillStyle);
				        vecCtx.drawGeometry(geometry);
				        
				        ctx.clip();
				        
				      });

				    vector.on('postcompose', function(event) {
				        var ctx = event.context;
				        ctx.restore();
				      });
			}


			function dimension(list){
				console.log(list[0][0]);
				console.log(typeof(list[0][0]));
				if (typeof(list[0][0]) == "number") {
					return 2
				}
				else {
					return 3
				}
			}

			// https://stackoverflow.com/questions/1484506/random-color-generator
			function getRandomColor() {
  				var letters = '0123456789ABCDEF';
  				var color = '#';
  				for (var i = 0; i < 6; i++) {
    				color += letters[Math.floor(Math.random() * 16)];
  				}
  				color += ''
  				return color;
			}
		   
		});