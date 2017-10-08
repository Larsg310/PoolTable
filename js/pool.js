var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
var renderer = new THREE.WebGLRenderer();
var clock = new THREE.Clock();

var geometry = new THREE.BoxGeometry(1, 1, 1);
var material = new THREE.MeshBasicMaterial({color: 0x00ff00});
var cube = new THREE.Mesh(geometry, material);

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xCCCCFF, 1);
document.body.appendChild(renderer.domElement);

scene.add(cube);

camera.position.z = 5;

function animate()
{
    requestAnimationFrame(animate);

    var delta = 60 * clock.getDelta();

    cube.rotation.x += 0.05 * delta;
    cube.rotation.y += 0.05 * delta;
    cube.rotation.z += 0.05 * delta;

    renderer.render(scene, camera);
}
animate();