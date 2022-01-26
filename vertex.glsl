#version 300 es

precision highp float;

in vec2  a_position;
out vec2 tex_coords;

uniform mat4 u_model;
uniform mat4 u_projection;

void main ()
{
    tex_coords = a_position;

    gl_Position = u_projection * u_model * vec4 (a_position, 0.0, 1.0);
}
