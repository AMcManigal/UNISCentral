/**
 * @author: Adam McManigal
 * @class: The interface for the builder objects.
 */

var ClusterBuilder2 = new Class({

    requestData: function(clusterCache, url){},
    storeData: function(clusterCache, data){},


    /**
     * @author Adam McManigal
     * @description Removes needless redundancy by removing older versions of retrieved objects.
     * @param data Object[] An array of parsed JSON objects
     * @param key string The path to the object id (i.e. configuration.name)
     * @param compare string The property to use for comparisons (i.e. ts)
     */
    findNewest: function(data, key, compare){

        //Stores the newest entry for each category
        var newest = {}; //data[spot] of newest

        //Determine the newest measurements object for each category.
        for ( var i = 0; i < data.length; i++ )
        {
            var measureType = eval("data[i]." + key);

            if( !newest[measureType] )
            {
                //If the dictionary is empty, store the first reference.
                newest[measureType] = data[i];
            }
            else
            {
                var currentNewest = eval("newest[measureType]." + compare);
                var possibleNewest = eval("data[i]." + compare);

                //Compare the times and replace the reference if the new time is lower.
                if(currentNewest < possibleNewest)
                    newest[measureType] = data[i];
            }
        }

        return newest;
    }.protect(),

    /**
     * @author Adam McManigal
     * @description Loads data using a local proxy server
     * @param clusterCache ClusterCache The current cache the ClusterDirector is using to store and cache server data.
     * @param url string The url to the data being requested
     * @param callbackMethod function The method in the specific builder that processes the data.
     * @param finalCallback function Returns the requested data to a PageState. Because data is a standard object there
     *        are no dependencies between the PageState and ClusterBuilder.
     */
    JsonLoader: function(clusterCache, url, callbackMethod, finalCallback){

        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.setRequestHeader('Accept', 'application/perfsonar+json');
        xhr.onload = function(){

            if(xhr.status >= 200 && xhr.status < 300){

                var data = JSON.parse(xhr.responseText);
                callbackMethod(clusterCache, data, finalCallback);
            }
            else{
                console.log("Request " + url + " failed\n\t" + "Error: " + xhr.getAllResponseHeaders());
            }
        }
        xhr.send();
    }.protect()


});

/**
 * @author Adam McManigal
 * @class Responsible for loading all the Nodes for a UNIS instance into a ClusterCache.
 * @augments ClusterBuilder2
 */

var NodesBuilder = new Class({

    Extends: ClusterBuilder2,

    //The keys used to retrieve desired information from the retrieved node objects.
    nodesKey: 'selfRef',
    portToNodeKeyLoc: 'properties',
    portToNodeKey: 'client_id',
    nodeMeasurements: 'measurements',

    //Data to store in the lookup.
    dataOptions: ['client_id', 'name', 'ports'],

    /**
     * @author Adam McManigal
     * @description Loads all the nodes for a given url and stores them in a ClusterCache.
     * @param {ClusterCache} clusterCache The cache being used by the ClusterDirector.
     * @param {String} server_url The host url for the UNIS instance.
     * @param {Function} finalCallback Alerts the ClusterDirector that the nodes have been loaded.
     */
    requestData: function( clusterCache, server_url, finalCallback ){

        var query = server_url + '/nodes';

        this.JsonLoader( clusterCache, query, this.storeData.bind(this), finalCallback );
    },

    /**
     * @author Adam McManigal
     * @description Stores node data in the ClusterCache
     * @param {ClusterCache} clusterCache The cache being used by the constructor
     * @param {Object[]} data An array of all the nodes on the server.
     * @param {Function} finalCallback Alerts the ClusterDirector that the nodes have been loaded.
     */
    storeData: function( clusterCache, data, finalCallback ){


        //Removes duplicate database entries.
        var newest = this.findNewest(data, this.nodesKey, 'ts');
        var temp;

        //For all the nodes retrieved
        for( var n in newest ){

            //Create a container for the node data.
            temp = clusterCache.nodes[n] = {};

            //Create a container for the services.
            temp.services = [];

            //Allows the program to determine whether the nodes measurements have been loaded
            temp.measurementsLoaded = false;

            //Create a container for the node measurement data to be used when loading measurements
            clusterCache.nodes[n][this.nodeMeasurements] = {};


            //Copies the data that will be used locally, if the data exists in the object
            for(var i = 0; i < this.dataOptions.length; i++)
            {
                var opPath = newest[n][this.dataOptions[i]];
                if(opPath)
                    temp[this.dataOptions[i]] = opPath;
            }

            //Create a lookup that maps ports to nodes to facilitate adjacency list creation for nodes.
            if(newest[n].ports){

                newest[n].ports.forEach(function(port){

                    //The path to the key value
                    var loc = port['href'];
                    clusterCache.portsToNode[loc] = n;
                });
            }
        }

        //Alert the director that the nodes have been loaded.
        finalCallback();
    }


});

/**
 * @author Adam McManigal
 * @class Responsible for loading all the Services for a UNIS instance into a ClusterCache.
 * @augments ClusterBuilder2
 */
var ServicesBuilder = new Class({

    Extends: ClusterBuilder2,

    //The key to use for the ClusterCache.services lookup.
    servicesKey: 'selfRef',
    serviceToNodeLoc: 'runningOn',
    serviceToNodeKey: 'href',

    dataOptions: [],

    requestData: function( clusterCache, server_url, finalCallback ){

        var query = server_url + '/services';

        this.JsonLoader( clusterCache, query, this.storeData.bind(this), finalCallback );
    },

    storeData: function( clusterCache, data, finalCallback ){

        //Removes duplicate database entries.
        var newest = this.findNewest( data, 'selfRef', 'ts');
        var temp;

        //For all the services retrieved
        for( var n in newest){

            //The node the service is running on
            var node = newest[n][this.serviceToNodeLoc][this.serviceToNodeKey];


            //If the service does not have a node, ignore it.
            var probes = newest[n]['properties']['probes'];

            //Stores the service info in the node's information for easy lookup.
            if(clusterCache.nodes[node])
                clusterCache.nodes[node].services.push(newest[n][this.servicesKey]);

            //Determines whether the service is currently running any probes
            var c = clusterCache.nodes[node];
            if(c && probes)
                clusterCache.nodes[node].probesActive = true;
            else if(c)
                clusterCache.nodes[node].probesActive = false;

            //Indexes the service with its associated node.
            temp = clusterCache.services[ newest[n][this.servicesKey] ] = node;
            temp[this.servicesKey] = node;
        }

        //Alert the director that the nodes have been loaded.
        finalCallback();
    }
});

/**
 * @author Adam McManigal
 * @class Responsible for loading all the Measurements for a Node into a ClusterCache.
 * @augments ClusterBuilder2
 */
var MeasurementsBuilder = new Class({

    Extends: ClusterBuilder2,

    service_key: 'service',
    events_array: 'events',
    node_measure_loc: 'measurements',
    measure_key: 'selfRef',

    measureOpt: ['eventTypes'],

    /**
     * @author Adam McManigal
     * @description In order to do a proper query the server href as well as the
     * service href must be entered. By sending a '?' separated query (server_href?service_href)
     * the builder is able to split the string build a proper query.
     * @param {ClusterCache} clusterCache The cluster that will receive the data.
     * @param {String} query_string string Uses the '?' separated format 'server_url?service_url'
     * @param {Function} finalCallback Alerts a Cluster director that the data has been loaded.
     */
    requestData: function(clusterCache, query_string, finalCallback){

        var split = query_string.split('?');
        var query = split[0] + '/measurements?service=' + split[1];

        console.log("Measurements Query");
        console.log(query);

        this.JsonLoader( clusterCache, query, this.storeData.bind(this), finalCallback);
    },


    /**
     * @author Adam McManigal
     * @description Stores relevant measurement data in a ClusterCache.
     * @param {ClusterCache} clusterCache The cluster to store the data in..
     * @param {Object[]} data A list of Measurements for a specific service.
     * @param {Function} finalCallback Sends the data back to the page state that requested it.
     */
    storeData: function(clusterCache, data, finalCallback){

        console.log(clusterCache);

        var newest = this.findNewest( data, 'selfRef', 'ts');

        for( var n in newest ){

            //Gets the service key
            var s_id = newest[n][this.service_key];

            //Gets the measurement key
            var m_name = newest[n]['configuration']['name'];

            //Gets the metadata key
            var m_id = newest[n][this.measure_key];

            //Uses lookup to find the node the measurement belongs to
            var node_id = clusterCache.services[s_id];

            //Allows the measurement details to be referenced by the measurement types in the node object.
            clusterCache.nodes[node_id][this.node_measure_loc][m_name] = m_id;

            //Adds measurement details to the measurement lookup
            var measureData = clusterCache.measurements[m_id] = {};
            measureData['eventTypes'] = {};
            measureData['ms_url'] = newest[n]['configuration']['ms_url'];

            //Allows the program to determine whether the events have been loaded for the node.
            measureData.eventsLoaded = false;

            //Creates specific event lookups that are tied to metadata in the metadata builder
            var events = newest[n]['eventTypes'];
            events.forEach(function(e){

                //Will be defined by adding a metadata id in the metadata builder.
                measureData['eventTypes'][e] = undefined;
            });
        }

        //Return the Measurements to the MeasurementPS
        if(clusterCache.nodes[node_id]){

            clusterCache.nodes[node_id].measurementsLoaded = true;

            if( finalCallback )
                finalCallback(clusterCache.nodes[node_id].measurements);
        }


    }
});

/**
 * @author Adam McManigal
 * @class Loads all Metadata for a given Measurement.
 * @augments ClusterBuilder2
 */

var MetadataBuilder = new Class({

    Extends: ClusterBuilder2,

    /**
     * @author Adam McManigal
     * @description In order to do a proper query the server href as well as the
     * service href must be entered. By sending a '?' separated query (server_href?service_href)
     * the builder is able to split the string build a proper query.
     * @param {ClusterCache} clusterCache The cluster that will receive the data.
     * @param {String} query_string string Uses the '?' separated format 'server_url?measurement_url'
     * @param {Function} finalCallback Alerts a Cluster director that the data has been loaded.
     */
    requestData: function( clusterCache, query_string, finalCallback ){

        var split = query_string.split('?');
        var query = split[0] + '/metadata?parameters.measurement.href=' + split[1];

        this.JsonLoader( clusterCache, query, this.storeData.bind(this), finalCallback );
    },

    /**
     * @author Adam McManigal
     * @description Callback that stores relevant measurement data in a ClusterCache.
     * @param {ClusterCache} clusterCache The cluster to store the data in..
     * @param {Object[]} data A list of Metadata for a specific Measurement.
     * @param {Function} finalCallback Sends the requested data back to the PageState that requested it.
     */
    storeData: function( clusterCache, data, finalCallback ){

        var newest = this.findNewest( data, 'selfRef', 'ts');
        var measurement, type, id;

        for( var n in newest ){

            measurement = newest[n]['parameters']['measurement']['href'];

            //TODO: This is a temporary fix to compensate for a schema inconsistency in the non-secure server
            if(!measurement)
                measurement = newest[n]['parameters']['measurement'];

            //Event type
            type = newest[n]['eventType'];

            //Metadata id
            id = newest[n]['id'];

            //Store the measurement in the cache if it exists.
            if(clusterCache.measurements[measurement])
            {
                //Add new attributes to the cache.
                var mCache = clusterCache.measurements[measurement];
                mCache.eventTypes[type] = id;
                mCache.eventsLoaded = true;

                //Store the metadata ID in the data cache so the graphing/update classes can quickly manage data.
                var data = clusterCache.data[id] = undefined;


                //Sends the data to the EventPS PageStage.
                finalCallback(clusterCache.measurements[measurement].eventTypes);
            }
        }
    }
});

/**
 * @author Adam McManigal
 * @class Loads all Data for a given Metadata.
 * @augments ClusterBuilder2
 */
var DataBuilder = new Class({

    Extends: ClusterBuilder2,

    /**
     * @author Adam McManigal
     * @description In order to do a proper query the server href as well as the
     * service href must be entered. By sending a '?' separated query (server_href?metadata_href)
     * the builder is able to split the string build a proper query.
     * @param {ClusterCache} clusterCache The cluster that will receive the data.
     * @param {String} query_string string Uses the '?' separated format 'server_href?metadata_href'
     * @param {Function} finalCallback Alerts a Cluster director that the data has been loaded.
     */
    requestData: function( clusterCache, query_string, finalCallback ){

        var split = query_string.split('?');
        var query = split[0] + '/data/' + split[1];

        //Creates an array to hold the data
        clusterCache.data[split[1]] = [];


        //A shameless hack. I was trying to use object refs to track the data id, but it wasn't working, probably
        // since JavaScript doesn't have true pointers (sigh)..
        this.dataJsonLoader( clusterCache, query, split[1], this.storeData.bind(this), finalCallback );
    },

    /**
     * @author Adam McManigal
     * @description Callback that stores relevant Data in a ClusterCache.
     * @param {ClusterCache} clusterCache The cluster to store the data in..
     * @param {Object[]} data Data array for a specific Metadata.
     * @param {Function} finalCallback Sends the requested data back to the MainPageControl to be drawn as a graph..
     */
    storeData: function( clusterCache, data, dataID, finalCallback ){

        //If there is at least one data point send the data.

        var dCluster = clusterCache.data[dataID];
        if(data.length > 0)
        {
            console.log("Adding Data");
            clusterCache.data[dataID] = dCluster.concat(data);
        }
        //Otherwise send fake data for testing purposes.
        else {
            console.log("Creating Data");
            clusterCache.data[dataID] = dCluster.concat(this.fakeIt());

        }
        console.log(clusterCache);

        finalCallback(clusterCache.data[dataID]);

    },

    /**
     * @author Adam McManigal
     * @description Returns an array of 300 randomly generated data points.
     * @returns {Array}
     */
    fakeIt: function(){

        var time = 1370750400000;
        var value = 300;
        var results = [];
        var temp;

        for(var i = 0; i < 300; i++)
        {
            temp = {};
            temp.ts = time;
            temp.value = value;

            results.push(temp);

            time = time + Math.floor(Math.random()*11);
            value = value + Math.floor(Math.random()*30) - Math.floor(Math.random()*30);

        }

        return results;

    },

    /**
     * @author Adam McManigal
     * @description Like the standard JsonLoader function with support for an extra attribute. Because the Data does
     * not contain an id attribute the id must be stored differently (in this case as a parameter).
     */
    dataJsonLoader: function(clusterCache, url, id, callbackMethod, finalCallback){

        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.setRequestHeader('Accept', 'application/perfsonar+json');
        xhr.onload = function(){

            if(xhr.status >= 200 && xhr.status < 300){

                var data = JSON.parse(xhr.responseText);
                callbackMethod(clusterCache, data, id, finalCallback);
            }
            else{
                console.log("Request " + url + " failed\n\t" + "Error: " + xhr.getAllResponseHeaders());
            }
        }
        xhr.send();
    }.protect()

});


/**
 * @author Adam McManigal
 * @class Serves as storage container for the ClusterDirector class. Attributes are meant to be accessed and altered
 * directly.
 */
var ClusterCache = new Class({

    networks: {},
    domains: {},
    services: {},
    measurements: {},
    data: {},
    nodes: {},
    portsToNode: {}

});
