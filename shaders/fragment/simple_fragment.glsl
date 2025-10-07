vec4 L_e(vec4 p, vec4 to, int pObjectID)
{
    if (pObjectID == -1) {
        return vec4(0, 0, 0, 0);
    }

    if (doesObjectHaveAttributeVector(pObjectID, ATTRIBUTE_EMITTED_COLOR)) {
        return getObjectAttributeVector(pObjectID, ATTRIBUTE_EMITTED_COLOR);
    }

    return vec4(0, 0, 0, 0);
}

vec4 f_r_Lambert(vec4 p, vec4 from, vec4 to, int pObjectID)
{
    vec4 surfaceColor = getObjectAttributeVector(
        pObjectID,
        ATTRIBUTE_REFLECTED_COLOR
    );

    return vec4(surfaceColor.xyz / M_PI, 1);
}

vec4 f_r(vec4 p, vec4 from, vec4 to, int pObjectID)
{
    return f_r_Lambert(p, from, to, pObjectID);
}

vec4 L_r_0(vec4 p, vec4 to, int pObjectID)
{
    vec4 color = vec4(0, 0, 0, 0);

    if (pObjectID < 4) // is Light
    {
        return color;
    }

    vec4 n = getNormalAt(p, pObjectID);

    for (int lightID = 0; lightID < 4; lightID++)
    {
        // generate shadow ray
        vec4 lightPosition = getObjectAttributeVectorMutable(lightID, ATTRIBUTE_POSITION);

        vec4 toLight = lightPosition - p;
        vec4 l = normalize(toLight);
        float d = length(toLight);
        
        vec4 rayOrigin = p + n * 0.0001;
        vec4 rayDirection = l;

        RayIntersectionResult r = rayIntersectsObject(rayOrigin, rayDirection);

        vec4 p_i = rayOrigin + rayDirection * r.t;
        int objectID_i = r.objectID;

        vec4 lightColor = L_e(p_i, -rayDirection, objectID_i);

        float lightRadius = getObjectAttributeScalar(lightID, ATTRIBUTE_RADIUS);
        float inverseSquareLightAttenuation = min(16.0 / (d * d + lightRadius), 1.0);

        color += M_PI * f_r(p, l, to, pObjectID) * lightColor * inverseSquareLightAttenuation * max(dot(n, l), 0.0);
    }

    return vec4(clamp(color.xyz, 0.0, 1.0), 1.0);
}

vec4 L_0(vec4 p, vec4 to, int pObjectID)
{
    return L_e(p, to, pObjectID) + L_r_0(p, to, pObjectID);
}

out vec4 color;

uniform ivec2 uResolution;

void main()
{
    float vfov = 90.0 / 180.0 * M_PI;
    float phi = vfov / 2.0;
    float f = tan(phi / 2.0);

    vec2 temp0 = f * (2.0 * (gl_FragCoord.xy + vec2(0.5)) / vec2(uResolution) - vec2(1.0));
    float a = float(uResolution.x) / float(uResolution.y);
    vec3 s = vec3(vec2(a, 1) * temp0, -1);
    vec4 d = vec4(normalize(s), 0);

    vec4 rayOrigin = vec4(0, 0, 0, 1);
    vec4 rayDirection = d;

    RayIntersectionResult r = rayIntersectsObject(rayOrigin, rayDirection);

    vec4 p = rayOrigin + rayDirection * r.t;
    vec4 to = -rayDirection;

    vec4 radiance = L_0(p, to, r.objectID);

    color = vec4(clamp(radiance.xyz, 0.0, 1.0), 1.0);
}
