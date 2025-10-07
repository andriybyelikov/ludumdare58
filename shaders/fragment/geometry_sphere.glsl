float tRayIntersectsSphere(
    vec4 rayOrigin, vec4 rayDirection,
    vec4 position, float radius)
{
    vec4 toRayOrigin = rayOrigin - position;
    float b = dot(rayDirection, toRayOrigin);
    float bb = b * b;
    float rr = radius * radius;
    float discriminant = bb - dot(toRayOrigin, toRayOrigin) + rr;

    if (discriminant < 0.0)
    {
        return -1.0;
    }

    float sqrtDiscriminant = sqrt(discriminant);
    float t1 = -b - sqrtDiscriminant;
    float t2 = -b + sqrtDiscriminant;

    if (0.0 <= t1)
    {
        return t1;
    }

    if (0.0 <= t2)
    {
        return t2;
    }

    return -1.0;
}

vec4 getNormalAtSphere(vec4 p, vec4 position)
{
    return normalize(p - position);
}
