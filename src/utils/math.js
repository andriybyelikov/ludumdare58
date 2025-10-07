const scalar = {
    clamp: (value, min, max) => Math.min(Math.max(value, min), max),
    mod: (x, m) => ((x % m) + m) % m,
};

const vec3 = {
    crossProduct: function (a, b) {
        return [
            a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0],
        ];
    },
};

const vec4 = {
    length: (v) => Math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2 + v[3] ** 2),
    normalized: (v) =>
    {
        const l = vec4.length(v);
        return [v[0] / l, v[1] / l, v[2] / l, v[3] / l];
    },
    sum:        (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2], a[3] + b[3]],
    difference: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2], a[3] - b[3]],
    scaled: (v, s) => [v[0] * s, v[1] * s, v[2] * s, v[3] * s],
    dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3],
};

const mat4 = {
    translation: (t) =>
    {
        return [
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            t,
        ];
    },
    transposed: function (m) {
        return [
            [m[0][0], m[1][0], m[2][0], m[3][0]],
            [m[0][1], m[1][1], m[2][1], m[3][1]],
            [m[0][2], m[1][2], m[2][2], m[3][2]],
            [m[0][3], m[1][3], m[2][3], m[3][3]],
        ];
    },
    product: function (a, b) {
        let columns = [];
        for (let c = 0; c < 4; c++) {
            let column = [];
            for (let r = 0; r < 4; r++) {
                column.push(vec4.dot([a[0][r], a[1][r], a[2][r], a[3][r]], b[c]));
            }
            columns.push(column);
        }
        return columns;
    },
    lookAt: function(eye, center, up) {
        const forward = vec4.normalized(vec4.difference(center, eye));
        const right = vec4.normalized([...vec3.crossProduct(forward, up), 0]);
        const newUp = vec4.normalized([...vec3.crossProduct(right, forward), 0]);
        const negativeForward = vec4.difference([0, 0, 0, 0], forward);

        const M = [
            right,
            newUp,
            negativeForward,
            [0, 0, 0, 1],
        ];

        return mat4.product(mat4.transposed(M), mat4.translation(vec4.sum([0, 0, 0, 1], vec4.difference([0, 0, 0, 1], eye))));
    },
};
