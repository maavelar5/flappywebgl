#version 300 es

precision highp float;

in vec2  tex_coords;
out vec4 color;

uniform vec4      u_offset;
uniform vec4      u_color;
uniform sampler2D u_image;

void main ()
{
    color = texture (u_image, tex_coords * u_offset.zw + u_offset.xy) * 1.0;
}
