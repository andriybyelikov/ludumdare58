uniform int uObjectCount;
uniform int uLightCount;

uniform usampler2D uTextureDataPointersScalar;
uniform sampler2D uTextureDataValuesScalar;

uniform usampler2D uTextureDataPointersVector;
uniform sampler2D uTextureDataValuesVector;

uniform usampler2D uTextureDataPointersVectorMutable;
uniform sampler2D uTextureDataValuesVectorMutable;

int bitCount(uint x)
{
    int count = 0;

    while (x != 0u)
    {
        x &= x - 1u;
        count++;
    }

    return count;
}

uint getPointerData(usampler2D pointerTexture, int ptr)
{
    return texelFetch(pointerTexture, ivec2(ptr, 0), 0).r;
}

uint getObjectAttributeMask(usampler2D pointerTexture, int objectID)
{
    return getPointerData(pointerTexture, 0 * uObjectCount + objectID);
}

uint getObjectAttributeList(usampler2D pointerTexture, int objectID)
{
    return getPointerData(pointerTexture, 1 * uObjectCount + objectID);
}

bool doesObjectHaveAttribute(usampler2D pointerTexture, int objectID, int attributeID)
{
    uint attributeMask = getObjectAttributeMask(pointerTexture, objectID);
    uint queryMask = 1u << uint(attributeID);
    uint result = attributeMask & queryMask;

    return bool(result);
}

uint getPointerToObjectAttribute(usampler2D pointerTexture, int objectID, int attributeID)
{
    uint attributeMask = getObjectAttributeMask(pointerTexture, objectID);
    uint queryMask = (1u << uint(attributeID) + 1u) - 1u;
    uint result = attributeMask & queryMask;

    int base = int(getObjectAttributeList(pointerTexture, objectID));
    int offset = bitCount(result) - 1;

    return getPointerData(pointerTexture, 2 * uObjectCount + base + offset);
}

bool doesObjectHaveAttributeScalar(int objectID, int attributeID)
{
    return doesObjectHaveAttribute(uTextureDataPointersScalar, objectID, attributeID);
}

float getObjectAttributeScalar(int objectID, int attributeID)
{
    uint ptr = getPointerToObjectAttribute(uTextureDataPointersScalar, objectID, attributeID);
    return texelFetch(uTextureDataValuesScalar, ivec2(int(ptr), 0), 0).r;
}

bool doesObjectHaveAttributeVector(int objectID, int attributeID)
{
    return doesObjectHaveAttribute(uTextureDataPointersVector, objectID, attributeID);
}

vec4 getObjectAttributeVector(int objectID, int attributeID)
{
    uint ptr = getPointerToObjectAttribute(uTextureDataPointersVector, objectID, attributeID);
    return texelFetch(uTextureDataValuesVector, ivec2(int(ptr), 0), 0);
}

bool doesObjectHaveAttributeVectorMutable(int objectID, int attributeID)
{
    return doesObjectHaveAttribute(uTextureDataPointersVectorMutable, objectID, attributeID);
}

uniform vec4 uProgress;

vec4 getObjectAttributeVectorMutable(int objectID, int attributeID)
{
    if (attributeID == ATTRIBUTE_POSITION)
    {
        switch (objectID)
        {
            case 0:
                if (uProgress.r == 1.0)
                {
                    return vec4(-0.3333333, -0.5, -2.0, 1.0);
                }
                break;
            case 1:
                if (uProgress.g == 1.0)
                {
                    return vec4(0.0, -0.5, -2.0, 1.0);
                }
                break;
            case 2:
                if (uProgress.b == 1.0)
                {
                    return vec4(0.3333333, -0.5, -2.0, 1.0);
                }
                break;
        }
    }

    uint ptr = getPointerToObjectAttribute(uTextureDataPointersVectorMutable, objectID, attributeID);
    return texelFetch(uTextureDataValuesVectorMutable, ivec2(int(ptr), 0), 0);
}
