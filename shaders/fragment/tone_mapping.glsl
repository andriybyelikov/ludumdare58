vec4 tmClip(vec4 radiance)
{
    return vec4(clamp(radiance.rgb, 0.0, 1.0), 1);
}

vec4 tmReinhard(vec4 radiance)
{
    return vec4(radiance.rgb / (radiance.rgb + 1.0), 1);
}

vec4 tmReinhardLog(vec4 radiance)
{
    return vec4(radiance.rgb / (radiance.rgb + 1.0 - log2(radiance.rgb) * M_INVERSE_LOG2_10), 1);
}

#define TM_REINHARD_LOG_HSV_A 0.93
#define TM_REINHARD_LOG_HSV_K 2.0

vec4 tmReinhardLogHSV(vec4 radiance)
{
    vec3 c = max(radiance.rgb, vec3(1e-20, 1e-19, 1e-20));

    float cmax = max(c.r, max(c.g, c.b));
    float cmin = min(c.r, min(c.g, c.b));
    float chroma = cmax - cmin;

    vec3 dominanceMask = vec3(cmax == c.r, cmax == c.g, cmax == c.b);

    float h = dot(cross(c, vec3(1)) / chroma + vec3(-2, 0, 2), dominanceMask);
    float s = chroma / cmax;
    float v = cmax;

    float a = TM_REINHARD_LOG_HSV_A;
    float k = TM_REINHARD_LOG_HSV_K;
    v /= v + 1.0 - a * log2(v + k) * M_INVERSE_LOG2_10;

    vec3 rgbTriangles = sign(h) * (h + vec3(-1, 0, +1)) * vec3(1, -1, 1) + vec3(-1, 2, -1);
    vec3 rgbAmplitude = clamp(rgbTriangles, 0.0, 1.0);

    return vec4(v * (1.0 + s * (rgbAmplitude - 1.0)), 1);
}
