import * as THREE from './build/three.module.js'
import {OrbitControls} from './jsm/controls/OrbitControls.js'
export {Plot2D}
//------------------------------------function code area----------------------------------
class Plot2D{
    init(data,canvasID) {
        this.canvasID = canvasID
        this.data = data
        //console.log(data)
        //----------------------setup camera----------------------
        
        //set default data display range is all the data set
        this.xmax = data.length
        this.xmin = 0
        this.ymax=Math.max(...data)
        this.ymin=Math.min(...data)
        
        let camera = new THREE.OrthographicCamera(this.xmin, this.xmax, this.ymin, this.ymax, -10000, 10000)
        this.camera = camera
        camera.position.z = 0
        let targetCanvas=document.getElementById(canvasID)

        //-----------------------setup renderer-----------------------
        const renderer = new THREE.WebGLRenderer( { antialias: true , canvas: targetCanvas});
        renderer.setPixelRatio( 1 );

        //set the canvas size in the web for displaying the data
        renderer.setSize( 800, 150);

        document.body.appendChild( renderer.domElement );
        this.renderer = renderer

        // //use OrbitControls
        // const orbit = new OrbitControls( camera, renderer.domElement );
        // //let the object can be zoom in and out
        // orbit.enableZoom = true
        // this.orbit = orbit 

        //--------------------------setup scene--------------------------
        const scene = new THREE.Scene();
        scene.background = new THREE.Color( 0xFFFFFFF ); // setup background color
        //let scene can be accessble
        this.scene=scene



        //-----------------------draw data--------------------
        this.draw_data(data)
        //------------------------render view-----------------
        function render() {
            
            requestAnimationFrame( render );
            renderer.render( scene, camera);

        }
        render();
    }
    
    draw_data(data){
        this.data = data
        //create a blue LineBasicMaterial
        const material = new THREE.LineBasicMaterial( { color: 0x2e70ff } );
        const points = []
        //push vertice position into the points
        let start_x=0
        data.forEach(
            function(y){
                points.push( new THREE.Vector3(start_x,y,1))
                start_x+=1
            }
        )
        const geometry = new THREE.BufferGeometry().setFromPoints( points );
        const line = new THREE.Line( geometry, material );
        this.scene.add( line )
        
        //renderer.render( scene, camera )
    }

    //--------------draw verticle marker, by tracing mouse--------------
    add_vertical_marker(wave_type){
        let material_marker = null
        if (wave_type === 'VPC'){  
            material_marker = new THREE.LineBasicMaterial( { color: 0xff2949 } );   
        }else if(wave_type === 'VT'){
            material_marker = new THREE.LineBasicMaterial( { color: 0x32a852 } );
        }else if(wave_type === 'Sinus'){
            material_marker = new THREE.LineBasicMaterial( { color: 0xed7e1c } );
        }
        
        let marker_vertice=[]
        marker_vertice.push(new THREE.Vector3(0,this.ymax,1))
        marker_vertice.push(new THREE.Vector3(0,this.ymin,1))
        const geometry_marker = new THREE.BufferGeometry().setFromPoints( marker_vertice );
        const vertical_marker = new THREE.Line( geometry_marker, material_marker );
        this.scene.add( vertical_marker )
        //let marker position can be accesible from outside
        this.vertical_marker = vertical_marker
    }
    //---------------------add triangle as marker-----------------------------
    add_triangle_marker(marker_size,wave_type){
        let material_marker = null
        if (wave_type === 'VPC'){  
            material_marker = new THREE.LineBasicMaterial( { color: 0xff2949 } );   
        }else if(wave_type === 'VT'){
            material_marker = new THREE.LineBasicMaterial( { color: 0x32a852 } );
        }else if(wave_type === 'Sinus'){
            material_marker = new THREE.LineBasicMaterial( { color: 0xed7e1c } );
        }
        let marker_vertice=[]
        marker_vertice.push(new THREE.Vector3(0,0,0))
        let scaleY = (this.ymax - this.ymin)/150
        let scaleX = 800/(this.xmax - this.xmin)
        console.log(scaleX,scaleY)
        marker_vertice.push(new THREE.Vector3(scaleX*0.5*marker_size,-scaleY*3^0.5/2*marker_size,0))
        marker_vertice.push(new THREE.Vector3(-scaleX*0.5*marker_size,-scaleY*3^0.5/2*marker_size,0))
        marker_vertice.push(new THREE.Vector3(0,0,0))
        const geometry_marker = new THREE.BufferGeometry().setFromPoints( marker_vertice );
        const triangle_marker = new THREE.Line( geometry_marker, material_marker );
        this.scene.add( triangle_marker )
        //let marker position can be accesible from outside
        this.triangle_marker = triangle_marker
    }
    //----------------------add grid------------------------------------------
    add_grid(){
        //add grid
        let num_grid = parseInt((this.xmax-this.xmin)/200)
        const size = num_grid*2*200
        const divisions = num_grid*2
        const colorCenterLine = 0xffffff
        const colorGrid = 0xdadada
        const gridHelper = new THREE.GridHelper( size, divisions , colorCenterLine, colorGrid);
        //the default is grid over xz plain, rotate along x axis to turn grid into xy plain
        gridHelper.rotation.x = Math.PI/2;
        this.scene.add( gridHelper ); 
    }
    //---------------------add vertical line as marker------------------------
    add_V_line(x,wave_type){
        let material_marker = null  
         //create a seg
         if (wave_type === 'VPC'){  
            material_marker = new THREE.LineBasicMaterial( { color: 0xff2949 } );   
        }else if(wave_type === 'VT'){
            material_marker = new THREE.LineBasicMaterial( { color: 0x32a852 } );
        }else if(wave_type === 'Sinus'){
            material_marker = new THREE.LineBasicMaterial( { color: 0xed7e1c } );
        }
        let marker_vertice=[]
        marker_vertice.push(new THREE.Vector3(x,this.ymax,0))
        marker_vertice.push(new THREE.Vector3(x,this.ymin,0))
        const geometry_marker = new THREE.BufferGeometry().setFromPoints( marker_vertice );
        const vertical_marker = new THREE.Line( geometry_marker, material_marker );
        this.scene.add( vertical_marker )
    }
    //-------------------add segment-------------------
    addSeg(seg_head,seg_tail,wave_type){
        let material = null
        //create a seg
        if (wave_type === 'VPC'){  
             material = new THREE.LineBasicMaterial( { color: 0xff2949 } );
            
        }else if(wave_type === 'VT'){
            material = new THREE.LineBasicMaterial( { color: 0x32a852 } );
        }else if(wave_type === 'Sinus'){
            material = new THREE.LineBasicMaterial( { color: 0xed7e1c } );
        }
        //console.log(material)
        const points = []
        //push vertice position into the points
        let seg_data = []
        let start_x = 0
        if (seg_tail <= seg_head){ // if user accidentally click right side first
            
            seg_data = this.data.slice(seg_tail,seg_head)
            start_x = seg_tail
        }else{
        
            seg_data = this.data.slice(seg_head,seg_tail)
            start_x = seg_head
        }
        seg_data.forEach(
            function(y){
                points.push( new THREE.Vector3(start_x,y,1))
                start_x+=1
            }
        )
        const geometry = new THREE.BufferGeometry().setFromPoints( points );
        const line = new THREE.Line( geometry, material );
        this.scene.add( line )
        this.renderer.render( this.scene, this.camera )
    }
    clear_data(){
        //console.log('clear scene')
        while(this.scene.children.length > 0){
            this.scene.remove(this.scene.children[0])
        }
        
        
    }
    
}