!function(definition) {
	window.geoZip = definition(jQuery);
}(function($) {
	
	var   map, toolbar, symbol, geomTask
		, Map, Draw, Graphic, Color, SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, TextSymbol, Font, parser, registry, Query, QueryTask, Extent, SpatialReference, on, query, all,connect
		, ZIP_SERVICE = "http://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_ZIP_Codes/FeatureServer/0"
		, CHAR = 65 // ASCII "A"
		, GEOMETRIES = {}
		;
	
	
	// the Geometry object
	function Geometry(label,evt) {		
		var   symbol = evt.geometry.type=="point" ? null : new SimpleFillSymbol()
			, midpoint = evt.geometry.type=="point" ? evt.geometry : evt.geometry.getExtent().getCenter()
	  		, textSymbol = new TextSymbol(label)
										.setColor(new Color([255,0,0]))
										.setAlign(Font.ALIGN_START)
										.setFont(new Font("14pt").setWeight(Font.WEIGHT_BOLD))
			;
		toolbar.deactivate();
		map.showZoomSlider();
		
		this.label = label;
		this.data = [];
		this.symbol = new Graphic(evt.geometry, symbol);
		this.text = new Graphic(midpoint, textSymbol)
				
		map.graphics.add(this.symbol);
		map.graphics.add(this.text);
		
		this.getZipCodes();
	}
	Geometry.prototype.getZipCodes = function() {
		var   qTask = new QueryTask(ZIP_SERVICE)
			, q = new Query()
			, self = this
			;
		// specify proxy for request with URL lengths > 2k characters
		esriConfig.defaults.io.proxyUrl = "/proxy/";
		
		q.returnGeometry = false;
		q.outFields = ["ZIP","PO_NAME","STATE"];
		q.geometry = this.symbol.geometry;
		
		//qTask.execute(q, showResults);
		qTask.execute(q, function(results) { 
			results.features.forEach(function(z) { 
				  var attr = z.attributes;
				  self.data.push([attr.ZIP, attr.PO_NAME, attr.STATE]);
			});
			
			var $widget = self.html().appendTo('#results');
			
			$widget.on('click','input[value=Remove]', function() { 
				var label = $(this).closest('.mk-geometry').data('label');
				geoZip.removeGeometry(label); 
			});
		});
	}
	Geometry.prototype.html = function() {
		var html = [
				'<div class="mk-geometry" data-label="'+this.label+'">',
				'	<h3>Geometry-'+this.label+' <input type="button" value="Remove"/></h3>',
				'	<table/>',
				'</div>'
				]
			, $widget = $(html.join("\n"))
			, $table = $widget.find('table')
			;		
		this.data.forEach(function(z) { 
			  $('<tr><td>'+z[0]+'</td><td>'+z[1]+'</td><td>'+z[2]+'</td></tr>').appendTo($table);
		});
		return $widget;
	}
	
	// other utilities	
	
	function activateTool() {
	  var tool = this.label.toUpperCase().replace(/ /g, "_");
	  toolbar.activate(Draw[tool]);
	  map.hideZoomSlider();
	}

	function createToolbar(themap) {
	  toolbar = new Draw(map);
	  toolbar.on("draw-end", addToMap);
	}

	function addToMap(evt) {
		var label = String.fromCharCode(CHAR++);
		GEOMETRIES[label] = new Geometry(label,evt);
	}
	
	
	
	pub = {
		init : function(xMap, xDraw, xGraphic, xColor, xSimpleMarkerSymbol, xSimpleLineSymbol, xSimpleFillSymbol, xTextSymbol, xFont, xQuery, xQueryTask, xExtent, xSpatialReference, 
			xparser, xregistry, xon, xquery, xall,xconnect) {
			
			// turn arguments into global variables for the geoZip namespace
			Map = xMap;
			Draw = xDraw;
			Graphic = xGraphic;
			Color = xColor;
			
			SimpleMarkerSymbol = xSimpleMarkerSymbol;
			SimpleLineSymbol = xSimpleLineSymbol;
			SimpleFillSymbol = xSimpleFillSymbol;
			TextSymbol = xTextSymbol;
			Font = xFont;
			parser = xparser;
			registry = xregistry;
			Query = xQuery;
			QueryTask = xQueryTask;
			Extent = xExtent;
			SpatialReference = xSpatialReference, 
			on = xon;
			query = xquery;
			all = xall;
			connect = xconnect;
															
			parser.parse();
	
			map = new Map("map", {
			  basemap: "streets",
			  //center: [-15.469, 36.428],
			  center:[-98.877,39.814],  // middle of US
			  zoom: 4
			});
			
			map.on("load", createToolbar);
	
			// loop through all dijits, connect onClick event
			// listeners for buttons to activate drawing tools
			registry.forEach(function(d) {
			  // d is a reference to a dijit
			  // could be a layout container or a button
			  if ( d.declaredClass === "dijit.form.Button" ) {
				d.on("click", activateTool);
			  }
			});
			
			var self = this;
			$('input[value=Submit]').on('click', function() { self.createMailingList(); });		
		},
		
		removeGeometry : function(label) {
			var geom = GEOMETRIES[label];
			
			// remove from the map
			map.graphics.remove(geom.text);
			map.graphics.remove(geom.symbol);
			
			// remove this Geometry object from GEOMETRIES	
			delete GEOMETRIES[label];
			
			// remove from sidebar
			$('div.mk-geometry[data-label='+label+']').remove();
		},
		
		createMailingList : function() {
			
			// build a list of zipcodes from GEOMETRIES
			var zips = [];
			for ( var g in GEOMETRIES ) {
				GEOMETRIES[g].data.forEach(function(z) { zips.push(z[0]);});
				//GEOMETRIES[g].data.forEach(function(z) { alert(JSON.stringify(z))});
			}
			alert(JSON.stringify(zips));
			
			// get a mailing list name
			// POST to backend
		}
		
	}	

	return pub;

})