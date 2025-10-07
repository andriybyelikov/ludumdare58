uniform sampler2D uTextureDataValuesVector;

uniform mat4 uViewMatrix;

flat in int i;

out vec4 transformedVector;

void main()
{
    transformedVector = uViewMatrix * texelFetch(uTextureDataValuesVector, ivec2(i, 0), 0);
}
