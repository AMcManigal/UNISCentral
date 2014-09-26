/**
 * Created with JetBrains WebStorm.
 * User: arzan
 * Date: 6/17/13
 * Time: 9:53 AM
 * To change this template use File | Settings | File Templates.
 */

var MainPageControl = new Class ({

    //The object that currently defines the state of the page
    currentState: undefined,
    graphState: undefined,

    //Server href
    unis_server: undefined,
    meta_server: undefined,

    //Gives the page states a way to access the ClusterManager
    clusterD: undefined,

    //The user choices that determine what data to display.
    hierarchy_choice: "",
    sub_hierarchy_choice: "",
    subject_choice: "",
    measurement_choice: "",
    eventData: undefined,


    initialize: function( unis_href, ms_href, startState ){

        this.unis_server = unis_href;
        this.clusterD = new ListDirector(unis_href, ms_href);

        this.meta_server = ms_href;

        if(startState)
            this.currentState = startState;
        else
            this.currentState = new MainHierarchyPS(this);

        //Binds action listeners to interactive elements
        $(IDs.first_select_id).addEvent('click', this.reselectHierarchy.bind(this));
        $(IDs.second_select_id).addEvent('click', this.reselectSubHierarchy.bind(this));
        $(IDs.third_select_id).addEvent('click', this.reselectSubject.bind(this));
        $(IDs.fourth_select_id).addEvent('click', this.reselectMeasurement.bind(this));
        $(IDs.hierarchy_menu_id).addEvent('click', this.selectHierarchy.bind(this));
        $(IDs.topology_menu_id).addEvent('click', this.selectSubHierarchy.bind(this));
        $(IDs.subject_menu_id).addEvent('click', this.selectSubject.bind(this));
        $(IDs.measurement_menu_id).addEvent('click', this.selectMeasurement.bind(this));
        $(IDs.type_list_id).addEvent('change', this.activateMGraph.bind(this));
    },

    selectHierarchy: function( event ){

        this.currentState.selectHierarchy( event );
        console.log("Hierarchy clicked");
        console.log(this.currentState.name);
    },

    selectSubHierarchy: function( event ){

        this.currentState.selectSubHierarchy( event );
        console.log("SubHierarchy Clicked");
        console.log(this.currentState.name);
    },

    selectSubject: function( event ){

        this.currentState.selectSubject( event );
        console.log("Subject Clicked");
        console.log(this.currentState.name);
    },

    selectMeasurement: function( event ){

        this.currentState.selectMeasurement( event );
        console.log("Measurement Clicked");
        console.log(this.currentState.name);

    },

    reselectHierarchy: function( event ){

        this.currentState.reselectHierarchy( event );
        console.log("Hierarchy Reset");
        console.log(this.currentState.name);
    },

    reselectSubHierarchy: function( event ){

        this.currentState.reselectSubHierarchy( event );
        console.log("SubHierarchy Reset");
        console.log(this.currentState.name);
    },

    reselectSubject: function( event ){

        this.currentState.reselectSubject( event );
        console.log("Subject Reset");
        console.log(this.currentState.name);
    },

    reselectMeasurement: function ( event ){

        this.currentState.reselectMeasurement( event );
        console.log("Measurement Reset");
        console.log(this.currentState.name);
    },

    reselectMeasurementsView: function( event ){

        this.currentState.reselectMeasurementsView( event );
        console.log("Viewing Measurements");
        console.log(this.currentState.name);
    },

    getNodes: function(){

        return this.clusterD.getNodes();
    },

    getMeasurements: function( finalCallback ){

        this.clusterD.getMeasurements(this.subject_choice, finalCallback);
    },

    getEvents: function( finalCallback ){

        this.clusterD.getEvents(this.measurement_choice, finalCallback);
    },

    getData: function( finalCallback ){

        this.clusterD.getData( finalCallback );
    },

    displayClusterData: function( cluster ){

        this.currentState.displayClusterData( cluster );

    },

    setEventDataSource: function(eventData){

        console.log("Setting new source array.")
        this.eventData = eventData;
        this.graphState = new MeasurementGraph(this);
        console.log(this.clusterD.cluster);

    },

    activateMGraph: function(){

        console.log("Initializing Graph");
        var startDataID = $(IDs.type_list_id).get('value');

        if(startDataID){

            console.log(startDataID);
            this.clusterD.getData(startDataID, this.setEventDataSource.bind(this));
        }



    },

    /**
     * @author Adam McManigal
     * @description Allows display states to make requests for the information they need.
     * @param url_query string The URL of the data being requested.
     * @param callback A callback function provided by the PageState object.
     */
    requestData: function(url_query, callback){

    }
});