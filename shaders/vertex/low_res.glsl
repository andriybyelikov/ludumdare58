#version 300 es

out vec2 p;

void main()
{
    const vec2 positions[3] = vec2[3]
    (
        vec2(-1.0, -1.0),
        vec2(+3.0, -1.0),
        vec2(-1.0, +3.0)
    );

    gl_Position = vec4(positions[gl_VertexID], 0.0, 1.0);
    p = (gl_Position.xy + vec2(1)) / 2.0;
}
