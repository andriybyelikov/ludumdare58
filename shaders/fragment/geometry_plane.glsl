float tRayIntersectsPlane(
    vec4 rayOrigin, vec4 rayDirection,
    vec4 position, vec4 normal)
{
    float determinant = dot(rayDirection, normal);

    if (determinant == 0.0)
    {
        return -1.0;
    }

    vec4 toRayOrigin = rayOrigin - position;

    return -dot(toRayOrigin, normal) / determinant;
}

vec4 getNormalAtPlane(vec4 p, vec4 normal)
{
    return normal;
}
