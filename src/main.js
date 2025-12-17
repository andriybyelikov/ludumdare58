import shaderSourceScreenFillingTriangle from '../shaders/vertex/screen_filling_triangle.glsl?raw';
import shaderSourceHeader         from '../shaders/fragment/0_header.glsl?raw';
import shaderSourcePrecision      from '../shaders/fragment/1_precision.glsl?raw';
import shaderSourceConstants      from '../shaders/fragment/2_constants.glsl?raw';
import shaderSourceData           from '../shaders/fragment/3_data.glsl?raw';
import shaderSourceGeometrySphere from '../shaders/fragment/geometry_sphere.glsl?raw';
import shaderSourceGeometryPlane  from '../shaders/fragment/geometry_plane.glsl?raw';
import shaderSourceGeometryScene  from '../shaders/fragment/geometry_scene.glsl?raw';
import shaderSourceToneMapping    from '../shaders/fragment/tone_mapping.glsl?raw';
import shaderSourceRayTracing     from '../shaders/fragment/ray_tracing.glsl?raw';

import shaderSourceVertexTransformVectors from '../shaders/vertex/transform_vectors.glsl?raw';
import shaderSourceFragmentTransformVectors from '../shaders/fragment/transform_vectors.glsl?raw';

import shaderSourceVertexLowRes from '../shaders/vertex/low_res.glsl?raw';
import shaderSourceFragmentLowRes from '../shaders/fragment/low_res.glsl?raw';

const PIXEL_SCALE = 4;

main();

function main()
{
    const wallLines = MapUtils.computeMapVertices(DB.map[0]);

    const planes = [];

    for (const wallLine of wallLines) {
        let normal = null;
        switch (wallLine.normalKey) {
        case 'LEFT':
            normal = Geometry.Normals.LEFT;
            break;
        case 'RIGHT':
            normal = Geometry.Normals.RIGHT;
            break;
        case 'UP':
            normal = Geometry.Normals.FORWARD;
            break;
        case 'DOWN':
            normal = Geometry.Normals.BACKWARD;
            break;
        }
        planes.push({
            position: [
                wallLine.line[0][0] + (wallLine.line[1][0] - wallLine.line[0][0]) / 2,
                1.5,
                wallLine.line[0][1] + (wallLine.line[1][1] - wallLine.line[0][1]) / 2,
                1,
            ],
            normal: normal,
            reflectance_spd: [1, 1, 0.85, 1],
        });
    }

    const sceneData = computeSceneData(planes);

    const canvas = document.createElement('canvas');

    const gl = canvas.getContext('webgl2', {
        antialias: false,
        powerPreference: 'high-performance',
    });

    if (gl === null)
    {
        document.body.append(":')");
        return;
    }

    if (!gl.getExtension('EXT_color_buffer_float')) {
        document.body.append(":') EXT_color_buffer_float is not supported");
    }

    loadDataTexture(
        gl, gl.TEXTURE0,
        gl.R8UI, gl.RED_INTEGER, gl.UNSIGNED_BYTE,
        [
            ...sceneData.scalars.objectAttributeMasks,
            ...sceneData.scalars.objectAttributePointerLists,
            ...sceneData.scalars.objectAttributePointers,
        ]
    );
    loadDataTexture(
        gl, gl.TEXTURE1,
        gl.R32F, gl.RED, gl.FLOAT,
        sceneData.scalars.objectAttributeValues
    );

    loadDataTexture(
        gl, gl.TEXTURE2,
        gl.R8UI, gl.RED_INTEGER, gl.UNSIGNED_BYTE,
        [
            ...sceneData.vectors.objectAttributeMasks,
            ...sceneData.vectors.objectAttributePointerLists,
            ...sceneData.vectors.objectAttributePointers,
        ]
    );
    loadDataTexture(
        gl, gl.TEXTURE3,
        gl.RGBA32F, gl.RGBA, gl.FLOAT,
        sceneData.vectors.objectAttributeValues
    );
    
    loadDataTexture(
        gl, gl.TEXTURE4,
        gl.R8UI, gl.RED_INTEGER, gl.UNSIGNED_BYTE,
        [
            ...sceneData.vectorsMutable.objectAttributeMasks,
            ...sceneData.vectorsMutable.objectAttributePointerLists,
            ...sceneData.vectorsMutable.objectAttributePointers,
        ]
    );
    const textureObjectAttributeValuesMutable = loadDataTexture(
        gl, gl.TEXTURE5,
        gl.RGBA32F, gl.RGBA, gl.FLOAT,
        sceneData.vectorsMutable.objectAttributeValues
    );

    //

    const framebufferValuesVectorMutable = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebufferValuesVectorMutable);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textureObjectAttributeValuesMutable, 0);

    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE)
    {
        document.body.append(":') Framebuffer for [framebufferValuesVectorMutable] not complete");
        return;
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    //

    const lowResOutputTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE6);
    gl.bindTexture(gl.TEXTURE_2D, lowResOutputTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, canvas.width / 2, canvas.height / 2, 0, gl.RGBA, gl.FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    const lowResFrameBuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, lowResFrameBuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, lowResOutputTexture, 0);

    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE)
    {
        document.body.append(":') Framebuffer for [lowResFrameBuffer] not complete");
        return;
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    //

    const programRaytracing = loadProgramRaytracing(
        gl,
        sceneData.scalars.attributeNames,
        sceneData.vectors.attributeNames
    );

    if (programRaytracing === null)
    {
        document.body.append(":') Failed to load program [raytracing]");
        return;
    }

    gl.useProgram(programRaytracing);

    gl.uniform1i(gl.getUniformLocation(programRaytracing, 'uObjectCount'), sceneData.objectCount);
    gl.uniform1i(gl.getUniformLocation(programRaytracing, 'uLightCount'), sceneData.lightCount);
    gl.uniform1i(gl.getUniformLocation(programRaytracing, 'uTextureDataPointersScalar'), 0);
    gl.uniform1i(gl.getUniformLocation(programRaytracing, 'uTextureDataValuesScalar'), 1);
    gl.uniform1i(gl.getUniformLocation(programRaytracing, 'uTextureDataPointersVector'), 2);
    gl.uniform1i(gl.getUniformLocation(programRaytracing, 'uTextureDataValuesVector'), 3);
    gl.uniform1i(gl.getUniformLocation(programRaytracing, 'uTextureDataPointersVectorMutable'), 4);
    gl.uniform1i(gl.getUniformLocation(programRaytracing, 'uTextureDataValuesVectorMutable'), 5);

    //

    const programTransformVectors = loadProgramTransformVectors(gl);

    if (programTransformVectors === null)
    {
        document.body.append(":') Failed to load program [transform_vectors]");
        return;
    }

    gl.useProgram(programTransformVectors);

    gl.uniform1i(gl.getUniformLocation(programTransformVectors, 'uVectorCount'), sceneData.vectorsMutable.objectAttributeValues.length);
    gl.uniform1i(gl.getUniformLocation(programTransformVectors, 'uTextureDataValuesVector'), 3);

    //

    const programLowRes = loadProgramLowRes(gl);

    if (programLowRes === null)
    {
        document.body.append(":') Failed to load program [transform_vectors]");
        return;
    }

    gl.useProgram(programLowRes);

    gl.uniform1i(gl.getUniformLocation(programLowRes, 'uTextureOutput'), 6);

    //

    const WebGLAppContext = {
        canvas: canvas,
        gl: gl,
        programs: {
            raytracing: programRaytracing,
            transformVectors: programTransformVectors,
            lowRes: programLowRes,
        },
        framebuffers: {
            framebufferValuesVectorMutable: framebufferValuesVectorMutable,
            lowResFrameBuffer: lowResFrameBuffer,
        },
        textures: {
            lowResOutputTexture: lowResOutputTexture,
        },
        mutableVectorsCount: sceneData.vectorsMutable.objectAttributeValues.length,
        camera: {
            position: sceneData.camera.position,
            azimuthalAngle: 5 * Math.PI / 4,
            polarAngle: Math.PI / 32,
        },
        actions: {
            left: 0,
            right: 0,
            forward: 0,
            backward: 0,
        },
        timestampLastFrame: 0,
        totalFrameCount: 0,
        totalFrameCountLastSecond: 0,
        frameCountLastSecond: 0,
        secondAccumulator: 0,
        movingCamera: false,
        cursorPositionLastTime: [0, 0],
        progress: {
            gotRed: false,
            gotGreen: false,
            gotBlue: false,
            broughtToTerminal: false,
        }
    };

    window.addEventListener('mousedown', (event) =>
    {
        WebGLAppContext.movingCamera = true;
        WebGLAppContext.cursorPositionLastTime = [event.pageX, event.pageY];
    });

    window.addEventListener('mouseup', (event) =>
    {
        WebGLAppContext.movingCamera = false;
    });

    window.addEventListener('mousemove', (event) =>
    {
        if (!WebGLAppContext.movingCamera)
        {
            return;
        }

        const sensibility = [canvas.width / canvas.height, 1]; // hope whoever is playing this does so in portrait
        WebGLAppContext.camera.azimuthalAngle -= sensibility[0] * (event.pageX - WebGLAppContext.cursorPositionLastTime[0]) / canvas.width;
        WebGLAppContext.camera.azimuthalAngle = scalar.mod(WebGLAppContext.camera.azimuthalAngle, 2 * Math.PI);
        WebGLAppContext.camera.polarAngle += sensibility[1] * (event.pageY - WebGLAppContext.cursorPositionLastTime[1]) / canvas.height;

        WebGLAppContext.camera.polarAngle = scalar.clamp(
            WebGLAppContext.camera.polarAngle,
            -Math.round(Math.PI / 2.0 * 100.0) / 100.0,
            +Math.round(Math.PI / 2.0 * 100.0) / 100.0
        );

        WebGLAppContext.cursorPositionLastTime = [event.pageX, event.pageY];
    });

    window.addEventListener('keydown', (event) =>
    {
        if (event.repeat)
        {
            return;
        }

        switch (event.code)
        {
            case 'KeyW':
                WebGLAppContext.actions.forward = 1;
                break;
            case 'KeyA':
                WebGLAppContext.actions.left = 1;
                break;
            case 'KeyS':
                WebGLAppContext.actions.backward = 1;
                break;
            case 'KeyD':
                WebGLAppContext.actions.right = 1;
                break;
        }
    });

    window.addEventListener('keyup', (event) =>
    {
        if (event.repeat)
        {
            return;
        }

        switch (event.code)
        {
            case 'KeyW':
                WebGLAppContext.actions.forward = 0;
                break;
            case 'KeyA':
                WebGLAppContext.actions.left = 0;
                break;
            case 'KeyS':
                WebGLAppContext.actions.backward = 0;
                break;
            case 'KeyD':
                WebGLAppContext.actions.right = 0;
                break;
        }
    });

    window.addEventListener('resize', () =>
    {
        onResize(WebGLAppContext);
    });

    onResize(WebGLAppContext);

    document.body.append(canvas);

    render(WebGLAppContext);

    // const audioCtx = new AudioContext();
    // audioCtx.resume();

    // playSong(audioCtx);

    requestAnimationFrame((timestamp) => gameloop(WebGLAppContext, timestamp));
}

function gameloop(appContext, timestamp)
{
    // frame statistics

    const deltatime = (timestamp - appContext.timestampLastFrame) / 1000;
    appContext.timestampLastFrame = timestamp;

    appContext.secondAccumulator += deltatime;
    if (1 < appContext.secondAccumulator)
    {
        appContext.frameCountLastSecond = appContext.totalFrameCount - appContext.totalFrameCountLastSecond;
        appContext.totalFrameCountLastSecond = appContext.totalFrameCount;
        appContext.secondAccumulator -= 1;
    }
    appContext.totalFrameCount++;

    document.querySelector('.fps').innerHTML = [
        `FPS: ${appContext.frameCountLastSecond}`,
        ``,
        `PROGRESS`,
        `- [${appContext.progress.gotRed ? 'x' : ' '}] Get red wavelength`,
        `- [${appContext.progress.gotGreen ? 'x' : ' '}] Get green wavelength`,
        `- [${appContext.progress.gotBlue ? 'x' : ' '}] Get blue wavelength`,
        `- [${appContext.progress.broughtToTerminal ? 'x' : ' '}] Bring all three to the terminal (orange button)`,
        ``,
        `<b>${appContext.progress.broughtToTerminal ? "You win! Your reward is to see the cool reflections! :P" : ""}<b>`
    ].join('<br>');

    // physics

    const camera = appContext.camera;

    const forward = vec4.normalized([
        Math.cos(camera.azimuthalAngle),
        0,
        Math.sin(camera.azimuthalAngle),
        0,
    ]);
    const strengthActionForward = appContext.actions.forward - appContext.actions.backward;

    const right = vec4.normalized([
        Math.cos(camera.azimuthalAngle + Math.PI / 2),
        0,
        Math.sin(camera.azimuthalAngle + Math.PI / 2),
        0,
    ]);
    const strengthActionRight = appContext.actions.right - appContext.actions.left;
    

    const impulseDirection = vec4.sum(vec4.scaled(forward, strengthActionForward), vec4.scaled(right, strengthActionRight));
    

    if (!impulseDirection.every((x) => x === 0))
    {
        const impulseMagnitude = 4;
        const impulse = vec4.scaled(vec4.normalized(impulseDirection), impulseMagnitude);

        const newPosition = vec4.sum(appContext.camera.position, vec4.scaled(impulse, deltatime));

        const x = Math.floor(newPosition[0]);
        const z = Math.floor(newPosition[2]);

        const tile = MapUtils.getTileAt(DB.map[0], x, z);

        if ((0 <= x && x < 2) && (0 <= z && z < 2))
        {
            appContext.progress.gotRed = true;
        }

        if ((14 <= x && x < 16) && (0 <= z && z < 2))
        {
            appContext.progress.gotGreen = true;
        }

        if ((0 <= x && x < 2) && (14 <= z && z < 16))
        {
            appContext.progress.gotBlue = true;
        }

        if ((9 <= x && x < 11) && (9 <= z && z < 11))
        {
            appContext.progress.broughtToTerminal =
                appContext.progress.gotRed &&
                appContext.progress.gotGreen &&
                appContext.progress.gotBlue;
        }

        if (tile !== 0)
        {
            appContext.camera.position = newPosition;
        }
    }

    // graphics
    render(appContext);

    requestAnimationFrame((timestamp) => gameloop(appContext, timestamp));
}

function loadProgramRaytracing(gl, attributeNamesScalar, attributeNamesVector)
{
    const shaderVertex = loadShader(gl, gl.VERTEX_SHADER, shaderSourceScreenFillingTriangle);

    if (shaderVertex === null)
    {
        document.body.append(":') Failed to load shaderScreenFillingTriangle");
        return;
    }

    const shaderFragment = loadShader(gl, gl.FRAGMENT_SHADER, [
        shaderSourceHeader,
        shaderSourcePrecision,
        shaderSourceConstants,
        attributeNamesScalar.map((x, i) => `#define ATTRIBUTE_${x.toUpperCase()} ${i}\n`).join(''),
        attributeNamesVector.map((x, i) => `#define ATTRIBUTE_${x.toUpperCase()} ${i}\n`).join(''),
        shaderSourceData,
        shaderSourceGeometrySphere,
        shaderSourceGeometryPlane,
        shaderSourceGeometryScene,
        shaderSourceToneMapping,
        shaderSourceRayTracing,
    ].join("\n"));

    if (shaderFragment === null)
    {
        document.body.append(":') Failed to load shaderRayTracing");
        return;
    }

    return loadProgram(gl, shaderVertex, shaderFragment);
}

function loadProgramTransformVectors(gl)
{
    const shaderVertex = loadShader(gl, gl.VERTEX_SHADER, shaderSourceVertexTransformVectors);

    if (shaderVertex === null)
    {
        document.body.append(":') Failed to load vertex shader for [transform_vectors]");
        return;
    }

    const shaderFragment = loadShader(gl, gl.FRAGMENT_SHADER, [
        shaderSourceHeader,
        shaderSourcePrecision,
        shaderSourceFragmentTransformVectors,
    ].join("\n"));

    if (shaderFragment === null)
    {
        document.body.append(":') Failed to load fragment shader for [transform_vectors]");
        return;
    }

    return loadProgram(gl, shaderVertex, shaderFragment);
}

function loadProgramLowRes(gl)
{
    const shaderVertex = loadShader(gl, gl.VERTEX_SHADER, shaderSourceVertexLowRes);

    if (shaderVertex === null)
    {
        document.body.append(":') Failed to load vertex shader for [low_res]");
        return;
    }

    const shaderFragment = loadShader(gl, gl.FRAGMENT_SHADER, [
        shaderSourceHeader,
        shaderSourcePrecision,
        shaderSourceFragmentLowRes,
    ].join("\n"));

    if (shaderFragment === null)
    {
        document.body.append(":') Failed to load fragment shader for [low_res]");
        return;
    }

    return loadProgram(gl, shaderVertex, shaderFragment);
}

function render(appContext)
{
    const gl = appContext.gl;
    const canvas = appContext.canvas;

    gl.bindFramebuffer(gl.FRAMEBUFFER, appContext.framebuffers.framebufferValuesVectorMutable);
    gl.viewport(0, 0, appContext.mutableVectorsCount, 1);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(appContext.programs.transformVectors);

    const camera = appContext.camera;

    const forward = vec4.normalized([
        Math.cos(camera.polarAngle) * Math.cos(camera.azimuthalAngle),
        Math.sin(camera.polarAngle),
        Math.cos(camera.polarAngle) * Math.sin(camera.azimuthalAngle),
        0,
    ]);
    const up = [0, 1, 0, 0];
    const viewMatrix = mat4.lookAt(camera.position, vec4.sum(camera.position, forward), up);

    gl.uniformMatrix4fv(
        gl.getUniformLocation(appContext.programs.transformVectors, 'uViewMatrix'),
        false,
        new Float32Array(viewMatrix.flat())
    );

    gl.drawArrays(gl.POINTS, 0, appContext.mutableVectorsCount);

    //

    //gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    gl.bindFramebuffer(gl.FRAMEBUFFER, appContext.framebuffers.lowResFrameBuffer);
    gl.viewport(0, 0, canvas.width / PIXEL_SCALE, canvas.height / PIXEL_SCALE);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(appContext.programs.raytracing);

    const vfovDeg = 45;
    const vfovRad = vfovDeg * Math.PI / 180;
    const w = canvas.width / PIXEL_SCALE;
    const h = canvas.height / PIXEL_SCALE;
    const pixelToRayMatrix = mat4.pixelToRay([w, h], vfovRad);
    
    gl.uniformMatrix3fv(
        gl.getUniformLocation(appContext.programs.raytracing, 'uPixelToRayTransform'),
        false,
        new Float32Array(pixelToRayMatrix.flat()),
    );

    gl.uniform4fv(gl.getUniformLocation(appContext.programs.raytracing, 'uProgress'), new Float32Array([
        appContext.progress.gotRed ? 1 : 0,
        appContext.progress.gotGreen ? 1 : 0,
        appContext.progress.gotBlue ? 1 : 0,
        appContext.progress.broughtToTerminal ? 1 : 0,
    ]));
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    //

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(appContext.programs.lowRes);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
}

function onResize(appContext)
{
    const gl = appContext.gl;
    const canvas = appContext.canvas;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.width = `${canvas.width}px`;
    canvas.style.height = `${canvas.height}px`;

    gl.bindTexture(gl.TEXTURE_2D, appContext.textures.lowResOutputTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, canvas.width / PIXEL_SCALE, canvas.height / PIXEL_SCALE, 0, gl.RGBA, gl.FLOAT, null);
}
