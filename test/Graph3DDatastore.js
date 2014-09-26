/**
 * Created with JetBrains WebStorm.
 * User: arzan
 * Date: 6/25/13
 * Time: 11:05 AM
 * To change this template use File | Settings | File Templates.
 */

var Graph3DDatastore = new Class({

    portToNode: {},
    nodeLinks: {},
    numConnect: {},

    buildNodeLookup: function(nodeList){

        var dic = this.portToNode;

        for(var i = 0; i < nodeList.length; i++){

            var nodeRef = nodeList[i].id;
            var ports = nodeList[i].ports;

            for(var j = 0; j < ports.length; j++){

                dic[ports[j].href] = nodeRef;
            }
        }

        return dic;
    },

    buildLinkReference: function(linkList){

        var nodeLinks = this.nodeLinks;
        var ports = this.portToNode;
        var numConnect = this.numConnect;
        var link1, link2;
        var cur;
        var directed;


        for(var i = 0; i < 48; i++){

            cur = linkList[i];
            directed = cur.directed;
            link1 = ports[cur.endpoints[0].href];
            link2 = ports[cur.endpoints[1].href];

            //If the port is not defined in one of the nodes, ignore it.
            if(!link1)
                continue;

            //Assign a link between the two nodes allowing for quick selection later.
            nodeLinks[link1] =  link2;

            //Creates a connection count for the node for sorting purposes.
            if(!numConnect[link1]){
                numConnect[link1] = 1;
            }
            numConnect[link1]++;

            //If the node is not directed, indicate a flow in the other direction.
            if(!directed){

                nodeLinks[link2] =  link1;

                if(!numConnect[link2])
                    numConnect[link2] = 1;

                numConnect[link2]++;
            }
        }

        console.log(i);
        console.log(numConnect);
        console.log(myJSON)
        return nodeLinks;

    },

    incCount: function( node ){

    }
});


