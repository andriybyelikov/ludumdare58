const attributes = [
    {
        name: 'position',
        type: 'vector',
        mutable: true,
    },
    {
        name: 'normal',
        type: 'vector',
        mutable: true,
    },
    {
        name: 'radius',
        type: 'scalar',
        mutable: false,
    },
    {
        name: 'emission_spd',
        type: 'vector',
        mutable: false,
    },
    {
        name: 'emission_range_squared',
        type: 'scalar',
        mutable: false,
    },
    {
        name: 'reflectance_spd',
        type: 'vector',
        mutable: false,
    },
];

const scene = {
    objects: [
        {
            name: "Camera",
            position: [15, 1.75, 15, 1],
        },
        {
            name: "Red Light",
            position: [1, 1, 1, 1],
            emission_spd: [1, 0, 0, 1],
            radius: 0.05,
            emission_range_squared: 4 ** 2,
        },
        {
            name: "Green Light",
            position: [15, 1, 1, 1],
            emission_spd: [0, 1, 0, 1],
            radius: 0.05,
            emission_range_squared: 4 ** 2,
        },
        {
            name: "Blue Light",
            position: [1, 1, 15, 1],
            emission_spd: [0, 0, 1, 1],
            radius: 0.05,
            emission_range_squared: 4 ** 2,
        },
        {
            name: "White Light",
            position: [8, 3.95, 8, 1],
            emission_spd: [1, 1, 1, 1],
            radius: 0.05,
            emission_range_squared: 4 ** 2,
        },
        {
            name: "Floor",
            position: [0, 0, 0, 1],
            normal: [0, 1, 0, 0],
            reflectance_spd: [0.8, 0.2, 0.2, 1],
        },
        {
            name: "Ceiling",
            position: [0, 4, 0, 1],
            normal: [0, -1, 0, 0],
            reflectance_spd: [1, 1, 0.85, 1],
        },
        {
            name: "Terminal",
            position: [8, 0, 8, 1],
            reflectance_spd: [1, 1, 1, 1],
            radius: 1,
        },
        {
            name: "Terminal Button",
            position: [10, -1.75, 10, 1],
            reflectance_spd: [1, 0.54, 0, 1],
            radius: 2,
        },
    ],
};

export function computeSceneData(additionalObjects = [])
{
    const camera = scene.objects.find((x) => x.name === "Camera");
    const objects = [...scene.objects.filter((x) => x !== camera), ...additionalObjects];
    const objectCount = objects.length;
    const lightCount = objects.filter((x) => 'emission_spd' in x).length;

    //

    const scalars = coolfunction(
        objects,
        attributes.filter((x) => x.type === 'scalar'),
        (x) => [...new Set(x)],
        (a, b) => a === b
    );

    const vectors = coolfunction(
        objects,
        attributes.filter((x) => x.type === 'vector'),
        (vectors) => {
            let objectAttributeValuesDistinctVector = [];
            for (const vector of vectors)
            {
                if (!objectAttributeValuesDistinctVector.some((x) => x.every((s, i) => s === vector[i])))
                {
                    objectAttributeValuesDistinctVector.push(vector);
                }
            }
            return objectAttributeValuesDistinctVector;
        },
        (a, b) => b.every((s, i) => s === a[i])
    );

    const vectorsMutable = coolfunction(
        objects,
        attributes.filter((x) => x.type === 'vector' && x.mutable),
        (vectors) => vectors,
        (a, b) => b.every((s, i) => s === a[i])
    );

    return {
        camera: camera,
        objectCount: objectCount,
        lightCount: lightCount,
        scalars: scalars,
        vectors: vectors,
        vectorsMutable: vectorsMutable,
    };
}

function coolfunction(objects, attributes, getDistinct, findIndexPredicate)
{
    const attributeNames = attributes.map((x) => x.name);

    //

    let objectAttributeMasks = [];
    for (const object of objects)
    {
        let mask = 0;

        for (const attribute of attributes)
        {
            const hasAttribute = attribute.name in object;
            const attributePosition = attributes.indexOf(attribute);
            mask |= hasAttribute << attributePosition;
        }

        objectAttributeMasks.push(mask);
    }

    //

    let objectAttributePointerLists = [];
    let objectAttributeCount = 0;
    for (const object of objects)
    {
        objectAttributePointerLists.push(objectAttributeCount);
        for (const attribute of attributes)
        {
            objectAttributeCount += attribute.name in object;
        }
    }

    //

    let objectAttributes = {};
    for (const attribute of attributes)
    {
        objectAttributes[attribute.name] = objects.filter((x) => attribute.name in x).map((x) => x[attribute.name]);
    }

    const objectAttributeValues = Object.values(objectAttributes).flat();
    
    const objectAttributeValuesDistinct = getDistinct(objectAttributeValues);

    //

    const cursorsForValues = objectAttributeValues.map(
        (x) => objectAttributeValuesDistinct.findIndex((y) => findIndexPredicate(x, y))
    );

    let objectAttributeCursors = [];

    for (const object of objects)
    {
        for (const attribute of attributes)
        {
            if (attribute.name in object)
            {
                const index0 = objectAttributeValues.indexOf(object[attribute.name]);
                const cursor = cursorsForValues[index0];
                objectAttributeCursors.push(cursor);
            }
        }
    }

    //

    return {
        attributeNames: attributeNames,
        objectAttributeMasks: objectAttributeMasks,
        objectAttributePointerLists: objectAttributePointerLists,
        objectAttributePointers: objectAttributeCursors,
        objectAttributeValues: objectAttributeValuesDistinct,
    };
}
