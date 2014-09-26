/**
 * @author Adam McManigal
 * @class A lookup that stores the id's of the different HTML elements, thereby removing major dependencies between the
 * PageState and HTML Elements that must be manipulated by the PageStates.
 */
/*Allows the html element ids to be loosely coupled to the PageStates. So if someone wants
  to change the html ids the code only has to be altered in one place (the IDs lookup).*/
var IDs = {


    first_select_id: 'hierarchy_selection',
    second_select_id: 'sub_hierarchy_selection',
    third_select_id: 'subject_selection',
    fourth_select_id: 'measurement_selection',

    hierarchy_menu_id: "nav_menu",
    topology_menu_id: "topology_menu",
    subject_menu_id: "node_list_container",
    measurement_menu_id: "measurement_list_container",
    type_menu_id: "type_list_container",

    subject_list_id: "node_list",
    subject_list_container: "node_list_container",
    measurement_list_id: "measurement_list",
    type_list_id: "type_list",

    topology_button_id: "topologies",
    network_button_id: "networks",
    view_3D_button_id: "view3d",

    unis_server_id: "unis_server",
    chart_id: "chart"

}

/**
 * @author Adam McManigal
 * @class Defines the interface for a PageState
 */
var PageState = new Class({

    pageControl: undefined,
    name: undefined,

    selectHierarchy: function( event ){ console.log("Not Implemented") },

    selectSubHierarchy: function( event ){ console.log("Not Implemented") },

    selectSubject: function( event ){ console.log("Not Implemented") },

    selectMeasurement: function( event ){console.log("Not Implemented")},

    selectMeasurementView: function( event ){ console.log("Not Implemented") },

    reselectHierarchy: function( event ){ console.log("Not Implemented") },

    reselectSubHierarchy: function( event ){ console.log("Not Implemented") },

    reselectSubject: function( event ){ console.log("Not Implemented") },

    reselectMeasurement: function( event ){ console.log ("Not Implemented")},

    reselectMeasurementsView: function( event ){console.log ("Not Implemented")},

    displayClusterData: function(cluster){ console.log("Not Implemented") },

    /**
     * @author Adam McManigal
     * @description Fades out an HTML element before rendering it invisible.
     * @param element HTMLElement The menu to hide.
     */
    hideElement: function( element_name ){

        var el = $(element_name);
        if( el && el.getStyle('visibility') === "visible"){

            var vanish = new Fx.Tween( el, {

                duration: 400,
                fps: 40,
                link: 'ignore',
                onComplete: (function(){

                    el.setStyle('visibility', 'hidden');
                })
            });

            vanish.start('opacity', [1.0, 0]);
        }
    },

    /**
     * @author Adam McManigal
     * @description Fades in an HTML element.
     * @param element HTMLElement The element to to fade into view.
     */
    showElement: function( element_name ){

        var el = $(element_name);
        if( el && el.getStyle('visibility') === 'hidden'){

            el.setStyles({visibility: 'visible',
                          opacity: 0});

            var appear = new Fx.Tween( el, {

                duration: 600,
                fps: 40,
                link: 'ignore'
            });

            appear.start('opacity', [0, 1.0]);
        }
    },

    /**
     * @author Adam McManigal
     * @description Removes a list of data being displayed and replaces it with an empty element.
     * @param {String} id ID of the list to remove.
     * @param {String} container ID of the container that holds the list.
     * @param {String} element The type of element to create.
     */
    clearListData: function(id, container, element){

        var list = $(id);
        if(list){

            list.destroy();

            var newList = new Element( element,{

                id: id
            });
            newList.inject(container);

        }
    }
});

/**
 * @author Adam McManigal
 * @class Allows the user to select between list views or 3D views.
 */

var MainHierarchyPS = new Class({

    Extends: PageState,

    /**
     * @author Adam McManigal
     * @param {MainPageControl} pageControl The MainPageControl instance that will act as the Context for the states.
     * @constructor
     */
    initialize: function(pageControl){

        this.pageControl = pageControl;
        this.name = "Main_Hierarchy_State";

        //The elements that need to be made invisible
        var clear_el = [ IDs.topology_menu_id,
                         IDs.subject_menu_id,
                         IDs.measurement_menu_id,
                         IDs.first_select_id,
                         IDs.second_select_id,
                         IDs.third_select_id,
                         IDs.fourth_select_id,
                         IDs.type_menu_id ];

        var show_el = IDs.hierarchy_menu_id;

        //Sets elements to their proper state
        clear_el.forEach(this.hideElement);
        this.showElement(show_el);

        this.resetChoices();

        var nodeHeader = $(IDs.unis_server_id);
        nodeHeader.set('html', 'UNIS Server: ' + pageControl.unis_server);

    },

    /**
     * @author Adam McManigal
     * @description Transitions to a SubHierarchy state of the users choice.
     * @param {HTMLEvent} event The event triggered by selecting a button from the hierarchy.
     */
    selectHierarchy: function( event ){

        var select = $( IDs.first_select_id );
        select.set('html', event.target.get( 'html' ));
        this.pageControl.hierarchy_choice = this.chooseHierarchyPath( event.target.get( 'id' ));
        this.chooseHierarchyPath( event.target.get( 'id' ));

    },

    /**
     * @author Adam McManigal
     * @description Determines the next state to transition to based on the user's choice.
     * @param {String} target_id ID of the button the user selected.
     */
    chooseHierarchyPath: function(target_id){

        switch (target_id){
            case IDs.topology_button_id:
                this.pageControl.hierarcy_choice = IDs.topology_button_id;
                this.pageControl.currentState = new TopologyPS( this.pageControl );
                break;
            case IDs.network_button_id:
                this.pageControl.hierarchy_choice = IDs.network_button_id;
                this.pageControl.currentState = new NetworkPS( this.pageControl );
                break;
            case IDs.view_3D_button_id:
                this.pageControl.hierarchy_choice = IDs.view_3D_button_id;
                this.pageControl.currentState = new View3DPS( this.pageControl);
        }
        return target_id;
    },

    /**
     * @author Adam McManigal
     * @description Resets the previous user selections that were stored in the MainPageControl
     */
    resetChoices: function(){

        this.pageControl.hierarchy_choice = "";
        this.pageControl.sub_hierarchy_choice = "";
        this.pageControl.subject_choice = "";
    }
});

/**
 * @author Adam McManigal
 * @class The state for viewing topology data.
 */
var TopologyPS = new Class({

    Extends: PageState,
    /**
     * @author Adam McManigal
     * @description Allows the user to select between list views or 3D views.
     * @param {MainPageControl} pageControl The MainPageControl instance that will act as the Context for the states.
     * @constructor
     */
    initialize: function(pageControl){


        this.pageControl = pageControl;
        this.name = "Topology_State";

        //The elements that need to be made visible
        var hide_el = [ IDs.hierarchy_menu_id,
                        IDs.subject_menu_id,
                        IDs.measurement_menu_id,
                        IDs.second_select_id,
                        IDs.third_select_id,
                        IDs.fourth_select_id,
                        IDs.type_menu_id ];

        //The elements to make invisible
        var show_el = [IDs.topology_menu_id,
                       IDs.first_select_id];

        hide_el.forEach(this.hideElement);
        show_el.forEach(this.showElement);

        //Ensures previous choices have been reset.
        pageControl.sub_hierarchy_choice = "";
        pageControl.subject_choice = "";

    },

    /**
     *
     * @param event
     */
    selectSubHierarchy: function(event){

        var select = $(IDs.second_select_id);
        select.set('html', event.target.get('html'));
        this.pageControl.sub_hierarchy_choice = event.target.get('id');
        this.pageControl.currentState = new SubjectPS(this.pageControl);

    },

    reselectHierarchy: function( event ){

        this.pageControl.currentState = new MainHierarchyPS(this.pageControl);
    },

    displayClusterData: function(){


    }

});


var NetworkPS = new Class({

    Extends: PageState,

    initialize: function( pageControl ){

        this.pageControl = pageControl;
        this.name = "Network_State";
    }


});

var View3DPS = new Class({

    Extends: PageState,

    initialize: function( pageControl ){

        this.pageControl = pageControl;
        this.name = "View_3D";
    }

})

var SubjectPS = new Class({

    Extends: PageState,

    initialize: function(pageControl){

        this.pageControl = pageControl;
        this.name = "Subject_State";

        //The elements that need to be invisible
        var hide_el = [ IDs.hierarchy_menu_id,
                        IDs.topology_menu_id,
                        IDs.measurement_menu_id,
                        IDs.third_select_id,
                        IDs.fourth_select_id,
                        IDs.type_menu_id ];

        //The elements that need to be made visible
        var show_el = [ IDs.subject_menu_id,
                        IDs.first_select_id,
                        IDs.second_select_id ];

        hide_el.forEach(this.hideElement);
        show_el.forEach(this.showElement);

        //Clears the existing node list
        this.clearListData( IDs.subject_list_id, IDs.subject_list_container, 'ul' );

        //Clears the user's previous subject choice.
        pageControl.subject_choice = "";

        //Loads the requested data type
        this.displayRequestedData( this.pageControl.getNodes() );
    },

    selectSubject: function( event ){

        var select = $( IDs.third_select_id );
        select.set('html', event.target.get( 'html' ));
        this.pageControl.subject_choice = event.target.get( 'id' );
        this.pageControl.currentState = new MeasurementsPS( this.pageControl );
    },

    reselectHierarchy: function( event ){

        this.pageControl.currentState = new MainHierarchyPS( this.pageControl );
    },

    reselectSubHierarchy: function( event ){

        this.pageControl.currentState = new TopologyPS( this.pageControl );
    },

    displayRequestedData: function( nodes ){

        var ul = $( IDs.subject_list_id );
        var subject_button;

        for( var n in nodes )
        {
            subject_button = new Element('button',{

                html: nodes[n].name,
                id: n,
                class: 'button'
            });

            subject_button.inject(ul);
        }
    }
});

var MeasurementsPS = new Class({

    Extends: PageState,

    initialize: function( pageControl ){

        this.pageControl = pageControl;
        this.name = "Measurement_State";

        this.clearListData();

        //The elements that need to be invisible
        var hide_el = [ IDs.hierarchy_menu_id,
                        IDs.topology_menu_id,
                        IDs.subject_menu_id,
                        IDs.fourth_select_id,
                        IDs.type_menu_id ];

        //The elements that need to be visible
        var show_el = [ IDs.first_select_id,
                        IDs.second_select_id,
                        IDs.third_select_id,
                        IDs.measurement_menu_id ];

        hide_el.forEach(this.hideElement);
        show_el.forEach(this.showElement);

        this.clearListData( IDs.measurement_list_id, IDs.measurement_menu_id, 'div');

        this.pageControl.getMeasurements(this.displayMeasurements);

    },

    selectMeasurement: function( event ){

        var select = $( IDs.fourth_select_id );
        select.set('html', event.target.get( 'html' ));
        this.pageControl.measurement_choice = event.target.get( 'id' );
        this.pageControl.currentState = new EventPS( this.pageControl );
    },

    reselectHierarchy: function( event ){

        this.pageControl.currentState = new MainHierarchyPS( this.pageControl );
    },

    reselectSubHierarchy: function( event ){

        this.pageControl.currentState = new TopologyPS( this.pageControl );
    },

    reselectSubject: function( event ){

        this.pageControl.currentState = new SubjectPS( this.pageControl );
    },

    displayMeasurements: function(measurement){

        var el_list = $(IDs.measurement_list_id);
        var subject_button;

        for( var n in measurement ){

            subject_button = new Element('button',{

                html: n,
                id: measurement[n],
                class: 'measure_button'
            });

            subject_button.inject(el_list);
        }
    }
});



var EventPS = new Class({

   Extends: PageState,

   initialize: function(pageControl){

       this.pageControl = pageControl;
       this.name = "Event_State";

       this.clearListData(IDs.type_list_id, IDs.type_menu_id, 'select');

       //The elements that need to be invisible
       var hide_el = [ IDs.hierarchy_menu_id,
                       IDs.topology_menu_id,
                       IDs.subject_menu_id,
                       IDs.measurement_menu_id ];

       //The elements that need to be visible
       var show_el = [ IDs.first_select_id,
                       IDs.second_select_id,
                       IDs.third_select_id,
                       IDs.fourth_select_id,
                       IDs.type_menu_id ];

       hide_el.forEach(this.hideElement);
       show_el.forEach(this.showElement);

       this.pageControl.getEvents(this.displayMeasurements.bind(this));

   },

    selectMeasurementView: function( event ){

        this.pageControl.currentState = new EventPS( this.pageControl );
    },

    reselectHierarchy: function( event ){

        this.pageControl.currentState = new MainHierarchyPS( this.pageControl );
    },

    reselectSubHierarchy: function( event ){

        this.pageControl.currentState = new TopologyPS( this.pageControl );
    },

    reselectSubject: function( event ){

        this.pageControl.currentState = new SubjectPS( this.pageControl );
    },

    reselectMeasurement: function( event ){

        this.pageControl.currentState = new MeasurementsPS( this.pageControl );
    },

    displayMeasurements: function( unisEvents ){

        this.clearListData(IDs.type_list_id, IDs.type_menu_id, 'select');

        var dropdown = $(IDs.type_menu_id);

        for( var n in unisEvents ){

            var el = new Element( 'option', {

                html: n,
                value: unisEvents[n]
            });

            el.inject($(IDs.type_list_id));
        }

        //Add the event listener again.
        $(IDs.type_list_id).addEvent('change', this.pageControl.activateMGraph.bind(this.pageControl));

        this.pageControl.activateMGraph();
    }
});

var MeasurementGraph = new Class({

    pageControl: undefined,

    initialize: function( pageControl ){

        this.pageControl = pageControl;
        var container = d3.select("#chartp");
        console.log("Data Array");
        console.log(pageControl.eventData);

        container.datum(pageControl.eventData)
        var c = new Chart(container, {contextPoints: 250, cBarWidth : 1});
    }

});

