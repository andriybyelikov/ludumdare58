uniform sampler2D uTextureOutput;

in vec2 p;

out vec4 color;

void main()
{
    color = texture(uTextureOutput, p);
}
