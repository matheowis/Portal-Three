import {
  Color, LinearFilter, MathUtils, Matrix4, Mesh, PerspectiveCamera, Plane, Quaternion, RGBFormat,
  ShaderMaterial, UniformsUtils, Vector3, Vector4, WebGLRenderTarget, Geometry, BufferGeometry, WebGLRenderer, Scene, Camera
} from "three";

import PortalVertexShader from '../shaders/Portal.vs'
import PortalFragmentShader from '../shaders/Portal.fs'

interface IPortalOptions {
  color?: string | Color | number,
  textureWidth?: number;
  textureHeight?: number;
  clipBias?: number;
}

const getDefaultPortalUniforms = () => ({
  uniforms: {
    'color': {
      value: null
    },
    'tDiffuse': {
      value: null
    },
    'textureMatrix': {
      value: null
    }
  },
})

const shader = {
  uniforms: getDefaultPortalUniforms(),
  vertexShader: PortalVertexShader,
  fragmentShader: PortalFragmentShader,
};

class Portal extends Mesh {
  public type = 'Portal';
  public color: Color = new Color(0x7f7f7f);
  public textureWidth = 512;
  public textureHeight = 512;
  public clipBias = 0;
  public virtualCamera = new PerspectiveCamera();
  public refractorPlane = new Plane();
  public textureMatrix = new Matrix4();
  public parameters = {
    minFilter: LinearFilter,
    magFilter: LinearFilter,
    format: RGBFormat
  };
  public renderTarget = new WebGLRenderTarget(this.textureWidth, this.textureHeight, this.parameters);
  // public shader = options.shader || Refractor.RefractorShader;



  material = new ShaderMaterial({
    uniforms: UniformsUtils.clone(shader.uniforms),
    vertexShader: shader.vertexShader,
		fragmentShader: shader.fragmentShader,
		transparent: true // ensures, refractors are drawn from farthest to closest
  })

	private customVisible = ( () => {

		var refractorWorldPosition = new Vector3();
		var cameraWorldPosition = new Vector3();
		var rotationMatrix = new Matrix4();

		var view = new Vector3();
		var normal = new Vector3();

		return ( camera:Camera ) => {

			refractorWorldPosition.setFromMatrixPosition( this.matrixWorld );
			cameraWorldPosition.setFromMatrixPosition( camera.matrixWorld );

			view.subVectors( refractorWorldPosition, cameraWorldPosition );

			rotationMatrix.extractRotation( this.matrixWorld );

			normal.set( 0, 0, 1 );
			normal.applyMatrix4( rotationMatrix );

			return view.dot( normal ) < 0;

		};
  } )();
  
  private updateRefractorPlane = ( () => {

		var normal = new Vector3();
		var position = new Vector3();
		var quaternion = new Quaternion();
		var scale = new Vector3();

		return () => {
      
			this.matrixWorld.decompose( position, quaternion, scale );
			normal.set( 0, 0, 1 ).applyQuaternion( quaternion ).normalize();

			// flip the normal because we want to cull everything above the plane

			normal.negate();

			this.refractorPlane.setFromNormalAndCoplanarPoint( normal, position );

		};
  } )();
  
  private updateVirtualCamera = ( () => {

		var clipPlane = new Plane();
		var clipVector = new Vector4();
		var q = new Vector4();

		return  ( camera:Camera ) =>{

			this.virtualCamera.matrixWorld.copy( camera.matrixWorld );
			this.virtualCamera.matrixWorldInverse.getInverse( this.virtualCamera.matrixWorld );
			this.virtualCamera.projectionMatrix.copy( camera.projectionMatrix );
			this.virtualCamera.far = (camera as PerspectiveCamera).far; // used in WebGLBackground

			// The following code creates an oblique view frustum for clipping.
			// see: Lengyel, Eric. “Oblique View Frustum Depth Projection and Clipping”.
			// Journal of Game Development, Vol. 1, No. 2 (2005), Charles River Media, pp. 5–16

			clipPlane.copy( this.refractorPlane );
			clipPlane.applyMatrix4( this.virtualCamera.matrixWorldInverse );

			clipVector.set( clipPlane.normal.x, clipPlane.normal.y, clipPlane.normal.z, clipPlane.constant );

			// calculate the clip-space corner point opposite the clipping plane and
			// transform it into camera space by multiplying it by the inverse of the projection matrix

			var projectionMatrix = this.virtualCamera.projectionMatrix;

			q.x = ( Math.sign( clipVector.x ) + projectionMatrix.elements[ 8 ] ) / projectionMatrix.elements[ 0 ];
			q.y = ( Math.sign( clipVector.y ) + projectionMatrix.elements[ 9 ] ) / projectionMatrix.elements[ 5 ];
			q.z = - 1.0;
			q.w = ( 1.0 + projectionMatrix.elements[ 10 ] ) / projectionMatrix.elements[ 14 ];

			// calculate the scaled plane vector

			clipVector.multiplyScalar( 2.0 / clipVector.dot( q ) );

			// replacing the third row of the projection matrix

			projectionMatrix.elements[ 2 ] = clipVector.x;
			projectionMatrix.elements[ 6 ] = clipVector.y;
			projectionMatrix.elements[ 10 ] = clipVector.z + 1.0 - this.clipBias;
			projectionMatrix.elements[ 14 ] = clipVector.w;

		};

  } )();
  
  // This will update the texture matrix that is used for projective texture mapping in the shader.
	// see: http://developer.download.nvidia.com/assets/gamedev/docs/projective_texture_mapping.pdf

	public updateTextureMatrix = ( camera:Camera ) =>{

		// this matrix does range mapping to [ 0, 1 ]

		this.textureMatrix.set(
			0.5, 0.0, 0.0, 0.5,
			0.0, 0.5, 0.0, 0.5,
			0.0, 0.0, 0.5, 0.5,
			0.0, 0.0, 0.0, 1.0
		);

		// we use "Object Linear Texgen", so we need to multiply the texture matrix T
		// (matrix above) with the projection and view matrix of the virtual camera
		// and the model matrix of the refractor

		this.textureMatrix.multiply( camera.projectionMatrix );
		this.textureMatrix.multiply( camera.matrixWorldInverse );
		this.textureMatrix.multiply( this.matrixWorld );

  }
  

  public render( renderer:WebGLRenderer, scene:Scene, camera:Camera ) {

		this.visible = false;

		var currentRenderTarget = renderer.getRenderTarget();
		var currentXrEnabled = renderer.xr.enabled;
		var currentShadowAutoUpdate = renderer.shadowMap.autoUpdate;

		renderer.xr.enabled = false; // avoid camera modification
		renderer.shadowMap.autoUpdate = false; // avoid re-computing shadows

		renderer.setRenderTarget( this.renderTarget );
		if ( renderer.autoClear === false ) renderer.clear();
		renderer.render( scene, this.virtualCamera );

		renderer.xr.enabled = currentXrEnabled;
		renderer.shadowMap.autoUpdate = currentShadowAutoUpdate;
		renderer.setRenderTarget( currentRenderTarget );

		// restore viewport

		var viewport = (camera as any).viewport ;

		if ( viewport !== undefined ) {

			renderer.state.viewport( viewport );

		}

		this.visible = true;

  }

  onBeforeRender = (renderer:WebGLRenderer,scene:Scene,camera:Camera) => {
    		// Render

		this.renderTarget.texture.encoding = renderer.outputEncoding;

		// ensure refractors are rendered only once per frame

		if ( camera.userData.refractor === true ) return;

		// avoid rendering when the refractor is viewed from behind

		if ( ! this.customVisible( camera ) === true ) return;

		// update

		this.updateRefractorPlane();

		this.updateTextureMatrix( camera );

		this.updateVirtualCamera( camera );

		this.render( renderer, scene, camera );
  }

  public getRenderTarget = () => this.renderTarget;

  constructor(geometry: Geometry | BufferGeometry, options: IPortalOptions) {
    super(geometry);
    const { clipBias, color, textureHeight, textureWidth } = options;

    this.textureWidth = textureWidth || this.textureWidth;
    this.textureHeight = textureHeight || this.textureHeight;
    this.renderTarget.setSize(this.textureWidth, this.textureHeight);
    this.color.set(color || this.color);
    this.clipBias = clipBias || this.clipBias;

    this.virtualCamera.matrixAutoUpdate = false;
    this.virtualCamera.userData.refractor = true;

    if (!MathUtils.isPowerOfTwo(this.textureWidth) || !MathUtils.isPowerOfTwo(this.textureHeight)) {
      this.renderTarget.texture.generateMipmaps = false;
    }

    this.material.uniforms[ "color" ].value = this.color;
    this.material.uniforms[ "tDiffuse" ].value = this.renderTarget.texture;
    this.material.uniforms[ "textureMatrix" ].value = this.textureMatrix;
  }

}

export {Portal}