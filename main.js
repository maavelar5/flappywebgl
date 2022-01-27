class Vec2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  static sum(a, b) {
    return new Vec2(a.x + b.x, a.y + b.x);
  }

  static sub(a, b) {
    return new Vec2(a.x - b.x, a.y - b.y);
  }

  static mul(a, scalar) {
    return new Vec2(a.x * scalar, a.y * scalar);
  }
}

class Mat4 extends Array {
  constructor() {
    super();

    this.push([1, 0, 0, 0]);
    this.push([0, 1, 0, 0]);
    this.push([0, 0, 1, 0]);
    this.push([0, 0, 0, 1]);
  }

  static ortho(w, h) {
    let r = w,
      t = 0;
    let l = 0,
      b = h;
    let f = 1,
      n = -1;

    let matrix = new Mat4();

    matrix[0][0] = 2 / (r - l);
    matrix[0][3] = -(r + l) / (r - l);

    matrix[1][1] = 2 / (t - b);
    matrix[1][3] = -(t + b) / (t - b);

    matrix[2][2] = -2 / (f - n);
    matrix[2][3] = -(f + n) / (f - n);

    return matrix;
  }

  static identity() {
    return [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ];
  }

  static mul(m1, m2) {
    const result = new Mat4();

    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        let val = 0;

        for (let k = 0; k < 4; k++) {
          val += m1[i][k] * m2[k][j];
        }

        result[i][j] = val;
      }
    }

    return result;
  }

  static translate(matrix, pos) {
    const trans_matrix = new Mat4();

    // {1, 0, 0, pos.x}
    // {0, 1, 0, pos.y}
    // {0, 0, 1, 0    }
    // {0, 0, 0, 1    }

    trans_matrix[0][3] = pos.x;
    trans_matrix[1][3] = pos.y;

    return Mat4.mul(matrix, trans_matrix);
  }

  static scale(matrix, size) {
    const scale_matrix = new Mat4();

    // {size.x, 0,      0, 0}
    // {0,      size.y, 0, 0}
    // {0,      0,      1, 0}
    // {0,      0,      0, 1}

    scale_matrix[0][0] = size.x;
    scale_matrix[1][1] = size.y;

    return Mat4.mul(matrix, scale_matrix);
  }

  static rotate(matrix, angle) {
    // {cos(angle),    -sin(angle), 0, 0}
    // {sin(angle),     cos(angle), 0, 0}
    // {0,              0,          1, 0}
    // {0,              0,          0, 1}

    angle = angle * (3.1415 / 180);

    const rotation_matrix = new Mat4();

    rotation_matrix[0][0] = Math.cos(angle);
    rotation_matrix[0][1] = -Math.sin(angle);

    rotation_matrix[1][0] = Math.sin(angle);
    rotation_matrix[1][1] = Math.cos(angle);

    return Mat4.mul(matrix, rotation_matrix);
  }
}

function mat4_to_array(matrix) {
  let result = [];

  matrix.forEach((array) => {
    array.forEach((val) => result.push(val));
  });

  return result;
}

let won = 0;

const fps_tag = document.getElementById("fps");
const won_tag = document.getElementById("won");
const canvas = document.querySelector("#canvas");
const gl = canvas.getContext("webgl2");

const W = 640;
const H = 480;

const gravity = new Vec2(0, 800);

if (!gl) throw new Error("Unable to initialize WebGL.");

class Texture {
  constructor(url) {
    const id = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, id);

    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]);

    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      internalFormat,
      width,
      height,
      border,
      srcFormat,
      srcType,
      pixel
    );

    const image = new Image();

    image.onload = function () {
      gl.bindTexture(gl.TEXTURE_2D, id);
      gl.texImage2D(
        gl.TEXTURE_2D,
        level,
        internalFormat,
        srcFormat,
        srcType,
        image
      );

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    };

    image.src = url;

    this.id = id;
    this.image = image;
  }
}

const time_data = {
  fps: 0,
  step: 0.01,
  frame: 0,
  frames: 1,
  current: 0,
  previous: performance.now() / 1000.0,
  acumulator: 0,
  interpolation: 0,

  update: function () {
    const time = performance.now() / 1000.0;

    time_data.current = time;
    time_data.frame = time_data.current - time_data.previous;
    time_data.previous = time_data.current;

    if (time_data.frame > 0.25) time_data.frame = 0.25;

    time_data.acumulator += time_data.frame;

    time_data.fps = time_data.frames / time;
    time_data.frames++;
  },
};

const NONE = 0;

class Timer {
  constructor(config, delay, restart_delay) {
    this.config = config;
    this.delay = delay;
    this.restart_delay = restart_delay;
  }
}

class Shader {
  constructor(vs_code, fs_code) {
    this.id = gl.createProgram();

    const vertex = Shader.compile(gl.VERTEX_SHADER, vs_code);
    const fragment = Shader.compile(gl.FRAGMENT_SHADER, fs_code);

    gl.attachShader(this.id, vertex);
    gl.attachShader(this.id, fragment);

    gl.linkProgram(this.id);

    if (!gl.getProgramParameter(this.id, gl.LINK_STATUS))
      throw new Error("shader error: " + gl.getProgramInfoLog(this.id));

    this.attribs = {};
    this.uniforms = {};
  }

  static compile(type, code) {
    const shader = gl.createShader(type);

    gl.shaderSource(shader, code);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(
        "An error occurred compiling the shaders: " +
          gl.getShaderInfoLog(shader)
      );
    }

    return shader;
  }
}

function init_default_shader() {
  //vs_src & vf_src server side
  const shader = new Shader(vs_src, fs_src);

  gl.useProgram(shader.id);

  shader.attribs = {
    position: gl.getAttribLocation(shader.id, "a_position"),
  };

  shader.uniforms = {
    model: gl.getUniformLocation(shader.id, "u_model"),
    color: gl.getUniformLocation(shader.id, "u_color"),
    image: gl.getUniformLocation(shader.id, "u_image"),
    offset: gl.getUniformLocation(shader.id, "u_offset"),
    projection: gl.getUniformLocation(shader.id, "u_projection"),
  };

  shader.buffer = gl.createBuffer();

  const projection = Mat4.ortho(W, H);

  gl.uniformMatrix4fv(
    shader.uniforms.projection,
    true,
    mat4_to_array(projection)
  );

  gl.bindBuffer(gl.ARRAY_BUFFER, shader.buffer);

  gl.uniform1i(shader.uniforms.image, 0);

  const positions = [
    0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0,
  ];

  gl.bindBuffer(gl.ARRAY_BUFFER, shader.buffer);

  gl.vertexAttribPointer(shader.attribs.position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(shader.attribs.position);

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  shader.texture = new Texture("/spritesheet.png");

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  return shader;
}

const camera = new Vec2();

const shader = init_default_shader();
const bodies = [];

class Body {
  constructor() {
    this.pos = new Vec2();
    this.size = new Vec2();
    this.angle = 0;
  }
}

const WS = 5120;

let obstacles = [
  [0, 0, WS - 32, 32],
  [0, 0, 32, H],
  [WS - 32, 0, 32, H],
  [0, H - 32, WS - 32, 32],
];

function random(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function collision() {
  const a = {
    x: bird.pos.x + 3,
    y: bird.pos.y + 3,
    w: bird.pos.x + bird.size.x - 3,
    h: bird.pos.y + bird.size.y - 3,
  };

  for (let i = 0; i < obstacles.length; i++) {
    const b = {
      x: obstacles[i][0],
      y: obstacles[i][1],
      w: obstacles[i][0] + obstacles[i][2],
      h: obstacles[i][1] + obstacles[i][3],
    };

    if (a.x < b.w && a.w > b.x && a.y < b.h && a.h > b.y) {
      return (bird = init_game());
    }
  }
}

function init_game() {
  camera.x = 0;

  obstacles = obstacles.slice(0, 4);

  for (let i = 0; i < 50; i++) {
    const x = random(100, WS - 128);
    const y = random(32, H - 64);
    const w = random(100, 128);
    const h = random(32, 64);

    obstacles.push([x, y, w, h]);
  }

  return {
    pos: new Vec2(34, H / 3),
    vel: new Vec2(0, 0),
    prev: new Vec2(0, 0),
    size: new Vec2(16, 16),
    angle: 0,

    move: function () {
      if (bird.pos.x >= WS - 132) {
        bird = init_game();
        alert("Yu Wong");
        won_tag.innerHTML = ++won;
        return;
      }

      bird.prev = {
        x: bird.pos.x,
        y: bird.pos.y,
      };

      bird.pos.x += 200.0 * time_data.step;
      bird.vel.y += gravity.y * time_data.step;
      bird.pos.y += bird.vel.y * time_data.step;

      if (bird.pos.x >= W / 2) {
        camera.x += bird.pos.x - bird.prev.x;
      }
    },
  };
}

let bird = init_game();

function get_model(body) {
  let model = Mat4.identity();

  model = Mat4.translate(model, Vec2.sub(body.pos, camera));
  model = Mat4.translate(model, Vec2.mul(body.size, 0.5));

  model = Mat4.rotate(model, body.angle);
  model = Mat4.translate(model, Vec2.mul(body.size, -0.5));

  model = Mat4.scale(model, body.size);

  return model;
}

const bindings = {
  " ": function () {
    bird.vel.y -= 600;

    if (bird.vel.y < -220) bird.vel.y = -220;
  },
};

function keydown(event) {
  if (event.repeat == 1) return;

  event.preventDefault();

  const key = event.key;

  if (bindings[key]) bindings[key]();

  if (key === "Escape") {
    bird = init_game();
  }
}

function touchstart(event) {
  event.preventDefault();

  bindings[" "]();
}

document.addEventListener("keydown", keydown, false);
document.addEventListener("touchstart", touchstart, false);

function draw_object(model, color, sprite) {
  gl.uniform4fv(shader.uniforms.color, color);

  gl.uniformMatrix4fv(shader.uniforms.model, true, mat4_to_array(model));

  const offset = [
    sprite[0] / shader.texture.image.width,
    sprite[1] / shader.texture.image.height,
    sprite[2] / shader.texture.image.width,
    sprite[3] / shader.texture.image.height,
  ];

  gl.uniform4fv(shader.uniforms.offset, offset);

  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function resizeCanvasToDisplaySize() {
  var width = gl.canvas.clientWidth;
  var height = gl.canvas.clientHeight;

  if (gl.canvas.width != width || gl.canvas.height != height) {
    gl.canvas.width = width;
    gl.canvas.height = height;

    gl.viewport(0, 0, width, height);
  }
}

function draw_scene() {
  resizeCanvasToDisplaySize();

  time_data.update();

  bird.angle = performance.now() / 100;

  while (time_data.acumulator >= time_data.step) {
    bird.move();
    collision();
    time_data.acumulator -= time_data.step;
  }

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.useProgram(shader.id);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, shader.texture.id);

  draw_object(get_model(bird), [0.0, 1.0, 1.0, 1.0], [0, 0, 12, 12]);

  obstacles.forEach((val) => {
    let object = {
      pos: new Vec2(val[0], val[1]),
      size: new Vec2(val[2], val[3]),
      angle: 0,
    };

    draw_object(get_model(object), [1.0, 0.0, 0.0, 1.0], [12, 0, 12, 12]);
  });

  fps_tag.innerHTML = time_data.fps.toString().split(".")[0];

  window.requestAnimationFrame(draw_scene);
}

window.requestAnimationFrame(draw_scene);
