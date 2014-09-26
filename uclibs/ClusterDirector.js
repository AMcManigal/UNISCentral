/**
 * @author Adam McManigal
 * @class Defines the interface for ClusterDirectors.
 */
var ClusterDirector = new Class({

    server_url: '',
    ms_url: '',

    nodeBuild: undefined,
    serviceBuild: undefined,
    measureBuild: undefined,
    metaBuild: undefined,
    dataBuild: undefined,

    cluster: new ClusterCache(),

    buildInitialStages: function(){},
    stageComplete: function(){}
});


/**
 * @author Adam McManigal
 * @class A director used when the user's primary concern is viewing UNIS data in the form of lists.
 * @augments ClusterDirector
 */
var ListDirector = new Class({

    Extends: ClusterDirector,

    building: false,

    initBuilders: undefined,

    stageLoading: 0,

    initialize: function(server_url, ms_url){

        this.nodeBuild = new NodesBuilder();
        this.serviceBuild = new ServicesBuilder();
        this.measureBuild = new MeasurementsBuilder();
        this.metaBuild = new MetadataBuilder();
        this.dataBuild = new DataBuilder();

        this.server_url = server_url;
        this.ms_url = ms_url;

        this.initBuilders = [this.nodeBuild, this.serviceBuild];

        this.building = true;

        this.buildInitialStages();

    },

    /**
     * @author Adam McManigal
     * @description Automatically calls ClusterBuilders needed for initialization.
     */
    buildInitialStages: function(){

        var builder = this.initBuilders[this.stageLoading];

        if(builder){

            builder.requestData(this.cluster, this.server_url, this.stageComplete.bind(this))
            this.stageLoading++;
        }
        else{
            this.building = false;
        }
    }.protect(),

    stageComplete: function(){

        console.log("Stage Complete");
        this.buildInitialStages();
        console.log(this.cluster);
    },

    getNodes: function(){

        return this.cluster.nodes;
    },

    getMeasurements: function(node_id, callback){

        var node = this.cluster.nodes[node_id];

        if(node && !node.measurementsLoaded){

            //Load the measurements for all the Services in the Node
            var services = node.services;

            for(var i = 0; i < services.length; i++){

                var query = this.server_url + '?' + services[i];
                this.measureBuild.requestData(this.cluster, query, callback);
            }

        } else{

            callback( node.measurements );
        }
        console.log(this.cluster);
    },

    getEvents: function( measurement_id, callback ){

        var measurement = this.cluster.measurements[measurement_id];

        if(!measurement.eventsLoaded){

            //Load all the events for this measurement.
            var query = this.server_url + '?' + measurement_id;
            this.metaBuild.requestData(this.cluster, query, callback);

        } else{

            callback( measurement.eventTypes );
        }
        console.log(this.cluster);
    },

    getData: function( metadata_id, callback ){

        console.log(this.cluster);

        var measurement = this.cluster.data[metadata_id];


        if( !measurement ){

            var query = this.ms_url + '?' + metadata_id;

            this.dataBuild.requestData( this.cluster, query, callback );

        } else{

           callback( this.cluster.data[metadata_id] );
        }


    },

    doneLoading: function(){

        console.log("Done");
    }
})
