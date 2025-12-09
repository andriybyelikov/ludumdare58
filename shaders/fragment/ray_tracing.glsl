vec4 L_e(Hit hit)
{
    if (!isObjectALight(hit.objectID))
    {
        return vec4(0);
    }

    vec4 rho_e = getObjectAttributeVector(hit.objectID, ATTRIBUTE_EMISSION_SPD);
    float r0_squared = getObjectAttributeScalar(hit.objectID, ATTRIBUTE_EMISSION_RANGE_SQUARED);

    return rho_e * r0_squared;
}

vec4 L_r(Hit hit)
{
    vec4 radiance = vec4(0);

    if (isObjectALight(hit.objectID))
    {
        return radiance;
    }

    vec4 n = getNormalAt(hit.x, hit.objectID);
    vec4 o = hit.x + n * 0.0001;

    for (int lightID = 0; lightID < uLightCount; lightID++)
    {
        vec4 y = getObjectAttributeVectorMutable(lightID, ATTRIBUTE_POSITION);
        vec4 r = y - hit.x;
        float inv_r = inversesqrt(dot(r, r));
        vec4 d = r * inv_r;

        radiance += L_e(trace(Ray(o, d))) * max(dot(d, n), 0.0) * (inv_r * inv_r);
    }

    vec4 rho_r = getObjectAttributeVector(hit.objectID, ATTRIBUTE_REFLECTANCE_SPD);

    return vec4(rho_r.rgb * radiance.rgb, 1.0);
}

vec4 L_o(Hit hit)
{
    return L_e(hit) + L_r(hit);
}

uniform mat3 uPixelToRayTransform;

out vec4 color;

void main()
{
    vec3 p = uPixelToRayTransform * vec3(gl_FragCoord.xy, 1);
    vec4 d = vec4(normalize(vec3(p.xy, -1)), 0);
    vec4 o = vec4(0, 0, 0, 1);

    vec4 radiance = L_o(trace(Ray(o, d)));

    color = tmReinhardLogHSV(radiance);
}
