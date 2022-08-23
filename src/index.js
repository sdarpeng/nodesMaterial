import * as THREE from 'three' //r143
import * as Nodes from './nodes/Nodes.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { uv, mix, mul } from './nodes/Nodes.js'
import { GLTFLoader } from './GLTFLoader.js'
import { nodeFrame } from './nodes/WebGLNodes.js'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
//import './styles.css'

let container, stats, clock, mixer, blendColor
let camera, scene, renderer, model, face

init()
animate()

function init() {
  container = document.createElement('div')
  document.body.appendChild(container)

  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.25,
    100
  )
  camera.position.set(0, 0, 5)
  camera.lookAt(new THREE.Vector3(0, 0, 0))

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xe0e0e0)
  scene.fog = new THREE.Fog(0xe0e0e0, 20, 100)

  clock = new THREE.Clock()
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.outputEncoding = THREE.sRGBEncoding

  var controls = new OrbitControls(camera, renderer.domElement)
  container.appendChild(renderer.domElement)

  // lights

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x0044ff)
  hemiLight.position.set(0, 5, 0)
  scene.add(hemiLight)

  const dirLight = new THREE.DirectionalLight(0xffffff)
  dirLight.position.set(5, 5, 5)
  scene.add(dirLight)

  // ground

  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2000, 2000),
    new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false })
  )
  mesh.rotation.x = -Math.PI / 2
  scene.add(mesh)

  const grid = new THREE.GridHelper(200, 40, 0x000000, 0x000000)
  grid.material.opacity = 0.2
  grid.material.transparent = true
  scene.add(grid)

  // model
  const loader = new GLTFLoader()
  loader.load(
    './testbox.glb',
    function (gltf) {
      model = gltf.scene
      scene.add(model)
      mixer = new THREE.AnimationMixer(model)
      const action = mixer.clipAction(gltf.animations[0])
      action.play()
      face = model.getObjectByName('Cube')

      const myUV = mul(uv(), 1)
      //const mtl = new Nodes.MeshStandardNodeMaterial();
      const mtl = new Nodes.NodeMaterial.fromMaterial(face.material)

      const alphaTexture = new THREE.TextureLoader().load('testcube.png')
      alphaTexture.wrapT = THREE.RepeatWrapping
      alphaTexture.wrapS = THREE.RepeatWrapping
      alphaTexture.encoding = THREE.sRGBEncoding
      const alphaNode = new Nodes.TextureNode(alphaTexture, myUV)

      const textureA = new THREE.TextureLoader().load('brick_diffuse.jpg')
      textureA.wrapT = THREE.RepeatWrapping
      textureA.wrapS = THREE.RepeatWrapping
      textureA.encoding = THREE.sRGBEncoding
      const textureANode = new Nodes.TextureNode(textureA, myUV)
      blendColor = new THREE.Color(0x00ff00)
      const textureCNode = new Nodes.OperatorNode(
        '*',
        textureANode,
        new Nodes.UniformNode(blendColor)
      )

      const textureB = new THREE.TextureLoader().load('kandao3.jpg')
      textureB.wrapT = THREE.RepeatWrapping
      textureB.wrapS = THREE.RepeatWrapping
      textureB.encoding = THREE.sRGBEncoding
      const textureBNode = new Nodes.TextureNode(textureB, myUV)

      mtl.colorNode = mix(textureCNode, textureBNode, alphaNode)

      //mtl.colorNode = textureANode;

      console.log(mtl)
      /* 
              var tex1 = new Nodes.TextureNode( getTexture( "cubeA" ) );
              var tex2 = new Nodes.TextureNode( getTexture( "brick" ) ); */
      /*                 var offset = new Nodes.FloatNode( 0 );
              var scale = new Nodes.FloatNode( 1 ); */
      //var uv = face.geometry.attributes.uv;
      /*                 console.log(uv);

              var uvOffset = new Nodes.OperatorNode(
                  offset,
                  uv,
                  Nodes.OperatorNode.ADD
              );

              var uvScale = new Nodes.OperatorNode(
                  uvOffset,
                  scale,
                  Nodes.OperatorNode.MUL
              );  */

      // var mask = new Nodes.TextureNode( getTexture( "alpha_mixer"));
      //var maskAlphaChannel = new Nodes.SwitchNode( mask, 'w' );

      /*                     var blend = new Nodes.MathNode(
                  tex1,
                  tex2,
                  mask,
                  Nodes.MathNode.MIX
              );
              mtl.color = blend; */

      face.material = mtl
      console.log(face)
    },
    undefined,
    function (e) {
      console.error(e)
    }
  )

  const gui = new GUI()
  var palette = {
    color: 0xff0000, // CSS string
  }

  gui.addColor(palette, 'color').onChange(function (val) {
    blendColor.set(val)
  })
  window.addEventListener('resize', onWindowResize)
  stats = new Stats()
  container.appendChild(stats.dom)
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

function animate() {
  const dt = clock.getDelta()
  nodeFrame.update()
  if (mixer) mixer.update(dt)
  requestAnimationFrame(animate)
  renderer.render(scene, camera)
  stats.update()
}
