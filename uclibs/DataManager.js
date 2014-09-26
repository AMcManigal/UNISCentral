/**
 * Created with JetBrains WebStorm.
 * User: arzan
 * Date: 7/10/13
 * Time: 2:35 PM
 * To change this template use File | Settings | File Templates.
 */





var DataManager = new Class({

    director: undefined,
    cluster: undefined,
    cPaths: undefined,

    initialize: function(){

        this.director = new ClusterDirector();
        this.cluster = this.director.cluster;
        this.cPaths = ClusterPaths();
    },

    query: function(path_string){

    }

});
