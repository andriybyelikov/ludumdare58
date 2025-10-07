#version 300 es

uniform int uVectorCount;

flat out int i;

void main()
{
    i = gl_VertexID;
    gl_Position = vec4(2.0 * vec2(float(i) + 0.5, 0.5) / float(uVectorCount) - vec2(1, 1), 0, 1);
    gl_PointSize = 1.0;
}
