attribute vec2 a_position;
uniform mat4 u_model;
uniform mat4 u_projection;

void main() {
  gl_Position = u_projection * u_model * vec4(a_position, 0.0, 1.0);
}
