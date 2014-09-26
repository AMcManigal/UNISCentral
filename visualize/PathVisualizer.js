/**
 * Created with JetBrains WebStorm.
 * User: arzan
 * Date: 7/12/13
 * Time: 11:22 AM
 * To change this template use File | Settings | File Templates.
 */

var PathVisualizer = new Class({

    scene: new THREE.Scene(),
    camera: new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000),
    rendererCSS: new THREE.CSS3DRenderer(),
    renderer: new THREE.WebGLRenderer({antialias: true}),

    initialize: function(){


        //Sets initial camera position
        this.camera.position.set(0, 0, 65);

        //Sets up the WebGL renderer
        var renderCont = document.getElementById('renderer');
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        renderCont.appendChild(this.renderer.domElement);

        //Sets up the CSS3D renderer
        var renderCSSCont = document.getElementById('rendererCSS');
        this.rendererCSS.setSize(window.innerWidth, window.innerHeight);
        this.rendererCSS.domElement.style.position = 'absolute';
        renderCSSCont.appendChild(this.rendererCSS.domElement);


        window.addEventListener('resize', this.onWindowResize.bind(this), false);
    },

    onWindowResize: function() {

        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.rendererCSS.setSize(window.innerWidth, window.innerHeight);
    },

    animate: function() {

        requestAnimationFrame(this.animate);
        this.render();
    //controls.update();
    },

    render: function() {

        this.camera.lookAt(this.scene.position);
        this.rendererCSS.render(this.scene, this.camera);
        this.renderer.render(this.scene, this.camera);
    }
});

var PrimaryNode = Class({

    name: undefined,
    threeObj: undefined,
    posVec: undefined,
    secondaryNodes: [],
    tertiaryNodes: [],

    initialize: function(nodeName, threeObj, startVec){

        this.name = nodeName;
        this.threeObj = threeObj;
        this.posVec = startVec;

    },

    addSecondaryNodes: function(nodes){

        if(nodes instanceof Array){

            nodes.forEach(function(node){
                this.secondaryNodes.push(node);
            })
        } else{

            this.secondaryNodes.push(nodes);
        }
    },

    addTertiaryNodes: function(nodes){

        if(nodes instanceof Array){

            nodes.forEach(function(node){
                this.tertiaryNodes.push(node);
            })
        } else{

            this.tertiaryNodes.push(nodes);
        }
    },

    calculatePositions: function(){

    },

    draw: function(scene){

        scene.add(this.threeObj);

        this.secondaryNodes.forEach(function(obj, scene){
            obj.draw(scene);
        });

        this.tertiaryNodes.forEach(function(obj, scene){
            obj.draw(scene);
        });

    }
});

