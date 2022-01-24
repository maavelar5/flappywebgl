let won = 0;
const won_tag = document.getElementById('won')
const canvas = document.querySelector('#glcanvas');
const gl = canvas.getContext('webgl2');

const W = 640;
const H = 480;

const gravity = Vec2.new(0, 100)

if (!gl) throw new Error('Unable to initialize WebGL.');

const time_data = {
    fps: 0,
    step: 0.01,
    frame: 0,
    frames: 1,
    current: 0,
    previous: (performance.now() / 1000.0),
    acumulator: 0,
    interpolation: 0,
};

const NONE = 0

const Timer = {
    new: function (delay, config) {
        return {config, delay, current: 0}
    }
}

function update_time_data (data, current) {
    const time = current / 1000.0

    data.current  = time;
    data.frame    = data.current - data.previous;
    data.previous = data.current;

    if (data.frame > 0.25) data.frame = 0.25;

    data.acumulator += data.frame;

    data.fps = data.frames / time;
    data.frames++;
}

const Shader = {
    load: function (type, code) {
        const shader = gl.createShader(type);

        gl.shaderSource(shader, code);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw new Error('An error occurred compiling the shaders: ' +
                            gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    },

    create: function (vs_code, fs_code) {
        const data = {
            id: gl.createProgram(),
            attribs: {},
            uniforms: {},
        };

        const vertex = this.load(gl.VERTEX_SHADER, vs_code);
        const fragment = this.load(gl.FRAGMENT_SHADER, fs_code);

        gl.attachShader(data.id, vertex);
        gl.attachShader(data.id, fragment);

        gl.linkProgram(data.id);

        if (!gl.getProgramParameter(data.id, gl.LINK_STATUS))
            throw new Error('shader error: ' + gl.getProgramInfoLog(data.id));

        return data;
    }
}

function init_default_shader() {
    //vs_src & vf_src server side
    const shader = Shader.create(vs_src, fs_src)

    gl.useProgram(shader.id)

    shader.attribs = {
        position: gl.getAttribLocation(shader.id, 'a_position'),
    }

    shader.uniforms = {
        projection: gl.getUniformLocation(shader.id, 'u_projection'),
        model: gl.getUniformLocation(shader.id, 'u_model'),
        color: gl.getUniformLocation(shader.id, 'u_color'),
    }

    shader.buffer = gl.createBuffer();

    const projection = Mat4.ortho(640, 480)

    gl.uniformMatrix4fv(
        shader.uniforms.projection,
        true,
        mat4_to_array(projection));


    gl.bindBuffer(gl.ARRAY_BUFFER, shader.buffer);

    const positions = [
        0.0, 1.0,    //
        1.0, 0.0,    //
        0.0, 0.0,    //

        0.0, 1.0,    //
        1.0, 1.0,    //
        1.0, 0.0,    //
    ];

    gl.bindBuffer(gl.ARRAY_BUFFER, shader.buffer);

    gl.vertexAttribPointer(shader.attribs.position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(shader.attribs.position);

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    return shader;
}

const camera = Vec2.new(0, 0)

const shader = init_default_shader()
const bodies = []

function get_body () {
    return {
        pos: Vec2.new(0, 0),
        size: Vec2.new(0, 0),
        angle: 0,
    }
}

const WS = 5120

let obstacles = [
    [0, 0, WS - 32, 32],
    [0, 0, 32, H],
    [WS - 32, 0, 32, H],
    [0, H - 32, WS - 32, 32],
]

function random(min, max) {
  return Math.floor(Math.random() * (max - min) ) + min;
}

function collision () {
    const a = {
        x: bird.pos.x, y: bird.pos.y,
        w: bird.pos.x + bird.size.x, h: bird.pos.y + bird.size.y,
    }

    for (let i = 0; i < obstacles.length; i++) {
        const b = {
            x: obstacles[i][0], y: obstacles[i][1],
            w: obstacles[i][0] + obstacles[i][2],
            h: obstacles[i][1] + obstacles[i][3],
        }

        if (a.x < b.w && a.w > b.x && a.y < b.h && a.h > b.y)
        {
            alert('Yu Lews')
            bird = init_game();

            break;
        }
    }
}

function init_game () {
    camera.x = 0;

    obstacles = obstacles.slice(0, 4)

    for (let i = 0; i < 50; i++) {
        const x = random(100, WS - 50);
        const y = random(32, H - 32);
        const w = random(100, 128);
        const h = random(32, 64);

        obstacles.push([x, y, w, h])
    }

    return {
        pos: Vec2.new(34, H / 3),
        vel: Vec2.new(0, 0),
        prev: Vec2.new(0, 0),
        size: Vec2.new(16,16),
        angle: 0,

        move: function () {
            if (bird.pos.x >= WS - 132) {
                bird = init_game();
                alert('Yu Wong')
                won_tag.innerHTML = ++won
                return;
            }

            bird.prev = {x: bird.pos.x, y: bird.pos.y};

            bird.pos.x += 50.0 * time_data.step;
            bird.vel.y += gravity.y * time_data.step
            bird.pos.y += bird.vel.y * time_data.step;

            if (bird.pos.x >= W / 2) {
                camera.x += bird.pos.x - bird.prev.x
            }

        }
    }
}

let bird = init_game()

function get_model (body) {
    let model = Mat4.identity();

    model = Mat4.translate(model, Vec2.sub(body.pos, camera));
    model = Mat4.translate(model, Vec2.mul(body.size, 0.5))

    model = Mat4.rotate(model, body.angle)
    model = Mat4.translate(model, Vec2.mul(body.size, -0.5))

    model = Mat4.scale(model, body.size)

    return model;
}

const bindings = {
    ' ': function () {
        bird.vel.y -= 150;

        if (bird.vel.y < -100) bird.vel.y = -100;
    },
}

document.addEventListener('keydown', (event) => {
    if (event.repeat == 1) return;

    event.preventDefault()

    const key = event.key;

    if (bindings[key]) bindings[key]()

    if (key === 'Escape') {
        bird = init_game()
    }

}, false);

function draw_object (model, color) {
    gl.uniform4fv(shader.uniforms.color, color);

    gl.uniformMatrix4fv(
        shader.uniforms.model,
        true,
        mat4_to_array(model));

    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function draw_scene() {
    bird.move();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    bird.angle = performance.now() / 100

    while (time_data.acumulator >= time_data.step)
    {
        bird.move();
        collision();
        time_data.acumulator -= time_data.step;
    }

    gl.useProgram(shader.id);

    draw_object(get_model(bird), [0.0, 1.0, 1.0, 1.0])

    obstacles.forEach(val => {
        let object = {
            pos: Vec2.new(val[0], val[1]),
            size: Vec2.new(val[2], val[3]),
            angle: 0,
        }

        draw_object(get_model(object), [1, 0, 0, 1])
    })

    update_time_data(time_data, performance.now())

    window.requestAnimationFrame(draw_scene)
}

window.requestAnimationFrame(draw_scene);
