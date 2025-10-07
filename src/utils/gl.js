function loadShader(gl, type, source)
{
    const shader = gl.createShader(type);

    if (shader === null)
    {
        return null;
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
    {
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

function loadProgram(gl, shaderVertex, shaderFragment)
{
    const program = gl.createProgram();

    gl.attachShader(program, shaderVertex);
    gl.attachShader(program, shaderFragment);

    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    {
        gl.deleteProgram(program);
        program = null;
    }

    gl.deleteShader(shaderVertex);
    gl.deleteShader(shaderFragment);

    return program;
}

function loadDataTexture(gl, activeTexture, internalFormat, format, type, data)
{
    const texture = gl.createTexture();
    gl.activeTexture(activeTexture);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, data.length, 1, 0, format, type, convertTextureData(gl, internalFormat, data));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    return texture;
}

function convertTextureData(gl, internalFormat, data)
{
    switch (internalFormat)
    {
        case gl.R8UI:
            return new Uint8Array(data);
        case gl.R32F:
            return new Float32Array(data);
        case gl.RGBA32F:
            return new Float32Array(data.flat());
        default:
            return null;
    }
}
