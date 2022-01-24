const canvas = document.querySelector('#glcanvas');
const gl = canvas.getContext('webgl2');

const gravity = Vec2.new(0, 200)

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

const shader = init_default_shader()
const bodies = []

function get_body () {
    return {
        pos: Vec2.new(0, 0),
        size: Vec2.new(0, 0),
        angle: 0,
    }
}

const bird = {
    pos: Vec2.new(0, 0),
    vel: Vec2.new(0, gravity.y),
    size: Vec2.new(16,16),
    angle: 0,

    move: function () {
        bird.pos.x += 50.0 * time_data.step;
        bird.vel.y += gravity.y * time_data.step
        bird.pos.y += bird.vel.y * time_data.step;
    }
}


function get_model (body) {
    let model = Mat4.identity();

    model = Mat4.translate(model, body.pos);
    model = Mat4.translate(model, Vec2.mul(body.size, 0.5))

    model = Mat4.rotate(model, body.angle)
    model = Mat4.translate(model, Vec2.mul(body.size, -0.5))

    model = Mat4.scale(model, body.size)

    return model;
}

document.addEventListener('keydown', (event) => {
    if (event.repeat == 1) return;

    const key_name = event.key;

    console.log(key_name)

    if (key_name === ' ') {
        bird.vel.y -= 200
        return;
    }
}, false);


function draw_scene() {
    bird.move();

    gl.clearColor(1.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    bird.angle = performance.now() / 100

    while (time_data.acumulator >= time_data.step)
    {
        bird.move();
        time_data.acumulator -= time_data.step;
    }

    let model = get_model(bird)

    gl.useProgram(shader.id);

    gl.uniformMatrix4fv(
        shader.uniforms.model,
        true,
        mat4_to_array(model));

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    update_time_data(time_data, performance.now())

    window.requestAnimationFrame(draw_scene)
}

window.requestAnimationFrame(draw_scene);
