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
    super(Mat4.identity());
    console.log(this);
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
    // {size.x, 0,      0, 0}
    // {0,      size.y, 0, 0}
    // {0,      0,      1, 0}
    // {0,      0,      0, 1}

    angle = angle * (3.1415 / 180);

    let rotation_matrix = new Mat4();

    rotation_matrix[0][0] = Math.cos(angle);
    rotation_matrix[0][1] = -Math.sin(angle);

    rotation_matrix[1][0] = Math.sin(angle);
    rotation_matrix[1][1] = Math.cos(angle);

    return Mat4.mul(matrix, rotation_matrix);
  }
}

/* const Mat4 = {
 *   ortho: function (W, H) {
 *     let r = W,
 *       t = 0;
 *     let l = 0,
 *       b = H;
 *     let f = 1,
 *       n = -1;
 *
 *     let matrix = Mat4.identity();
 *
 *     matrix[0][0] = 2 / (r - l);
 *     matrix[0][3] = -(r + l) / (r - l);
 *
 *     matrix[1][1] = 2 / (t - b);
 *     matrix[1][3] = -(t + b) / (t - b);
 *
 *     matrix[2][2] = -2 / (f - n);
 *     matrix[2][3] = -(f + n) / (f - n);
 *
 *     return matrix;
 *   },
 *
 *   identity: function () {
 *     return [
 *       [1, 0, 0, 0],
 *       [0, 1, 0, 0],
 *       [0, 0, 1, 0],
 *       [0, 0, 0, 1],
 *     ];
 *   },
 *
 *   mul: function (m1, m2) {
 *     let val = 0;
 *     const result = Mat4.identity();
 *
 *     for (let i = 0; i < 4; i++) {
 *       for (let j = 0; j < 4; j++) {
 *         val = 0;
 *
 *         for (let k = 0; k < 4; k++) {
 *           val += m1[i][k] * m2[k][j];
 *         }
 *
 *         result[i][j] = val;
 *       }
 *     }
 *
 *     return result;
 *   },
 *
 *   translate: function (matrix, pos) {
 *     const trans_matrix = Mat4.identity();
 *
 *     // {1, 0, 0, pos.x}
 *     // {0, 1, 0, pos.y}
 *     // {0, 0, 1, 0    }
 *     // {0, 0, 0, 1    }
 *
 *     trans_matrix[0][3] = pos.x;
 *     trans_matrix[1][3] = pos.y;
 *
 *     return Mat4.mul(matrix, trans_matrix);
 *   },
 *
 *   scale: function (matrix, size) {
 *     const scale_matrix = Mat4.identity();
 *
 *     // {size.x, 0,      0, 0}
 *     // {0,      size.y, 0, 0}
 *     // {0,      0,      1, 0}
 *     // {0,      0,      0, 1}
 *
 *     scale_matrix[0][0] = size.x;
 *     scale_matrix[1][1] = size.y;
 *
 *     return Mat4.mul(matrix, scale_matrix);
 *   },
 *
 *   rotate: function (matrix, angle) {
 *     // {size.x, 0,      0, 0}
 *     // {0,      size.y, 0, 0}
 *     // {0,      0,      1, 0}
 *     // {0,      0,      0, 1}
 *
 *     angle = angle * (3.1415 / 180);
 *
 *     let rotation_matrix = Mat4.identity();
 *
 *     rotation_matrix[0][0] = Math.cos(angle);
 *     rotation_matrix[0][1] = -Math.sin(angle);
 *
 *     rotation_matrix[1][0] = Math.sin(angle);
 *     rotation_matrix[1][1] = Math.cos(angle);
 *
 *     return Mat4.mul(matrix, rotation_matrix);
 *   },
 * };
 *  */

function mat4_to_array(matrix) {
  let result = [];

  matrix.forEach((array) => {
    array.forEach((val) => result.push(val));
  });

  return result;
}
