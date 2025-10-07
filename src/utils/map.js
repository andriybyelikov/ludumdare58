const MapUtils = {
    getTileAt: function (map, x, z) {
        const w = map.size[0];
        const h = map.size[1];
        if ((0 <= x && x < w) && (0 <= z && z < h)) {
            return map.xz[w * z + x];
        }
        return 0;
    },
    getNeighbor: function (map, x, z, normal) {
        return MapUtils.getTileAt(map, x - normal[0], z - normal[1]);
    },
    computeMapVertices: function (map)
    {
        const wallNormals = {
            LEFT: [-1, 0],
            RIGHT: [1, 0],
            DOWN: [0, 1],
            UP: [0, -1],
        };
        const wallsByNormal = {
            LEFT: [],
            RIGHT: [],
            DOWN: [],
            UP: [],
        };
        for (let x = 0; x < map.size[0]; x++)
        {
            for (let z = 0; z < map.size[1]; z++)
            {
                const tile = MapUtils.getTileAt(map, x, z);
                for (const normalKey of Object.keys(wallNormals)) {
                    const normal = wallNormals[normalKey];
                    const neighbor = MapUtils.getNeighbor(map, x, z, normal);
                    if (tile !== neighbor)
                    {
                        wallsByNormal[normalKey].push([x, z]);
                    }
                }
            }
        }

        const axisAlignedWallsZ = Object.keys(wallsByNormal).filter((x) => wallNormals[x][1] === 0);
        const axisAlignedWallsX = Object.keys(wallsByNormal).filter((x) => wallNormals[x][0] === 0);

        let axisAlignedWallLinesZ = [];
        let axisAlignedWallLinesX = [];

        for (const normalKey of axisAlignedWallsZ) {
            const temp0 = Map.groupBy(wallsByNormal[normalKey], (x) => x[0]);
            for (const temp1 of temp0) {
                const fixedX = temp1[0] + (normalKey === "LEFT" ? 1 : 0);
                const pointsZ = temp1[1].map((x) => x[1]); //
                let adjacencyClasses = {};
                for (let indexA = 0; indexA < pointsZ.length; indexA++) {
                    for (let indexB = indexA + 1; indexB < pointsZ.length; indexB++) {
                        const a = pointsZ[indexA];
                        const b = pointsZ[indexB];
                        const distance = Math.abs(a - b);
                        if (distance === 1) {
                            if (a in adjacencyClasses) {
                                adjacencyClasses[b] = adjacencyClasses[a];
                            } else {
                                adjacencyClasses[b] = a;
                            }
                        }
                    }
                }
                const temp2 = Map.groupBy(Object.entries(adjacencyClasses), (x) => x[1]);
                for (const temp3 of temp2) {
                    const adjacentPointsList = [temp3[0], ...temp3[1].map((x) => parseInt(x[0]))];
                    const min = Math.min(...adjacentPointsList);
                    const max = Math.max(...adjacentPointsList);
                    axisAlignedWallLinesZ.push({
                        line: [[fixedX, min], [fixedX, max + 1]],
                        normalKey: normalKey, 
                    });
                }
            }
        }

        for (const normalKey of axisAlignedWallsX) {
            const temp0 = Map.groupBy(wallsByNormal[normalKey], (x) => x[1]); //
            for (const temp1 of temp0) {
                const fixedZ = temp1[0] + (normalKey === "UP" ? 1 : 0); //
                const pointsX = temp1[1].map((x) => x[0]); //
                let adjacencyClasses = {};
                for (let indexA = 0; indexA < pointsX.length; indexA++) {
                    for (let indexB = indexA + 1; indexB < pointsX.length; indexB++) {
                        const a = pointsX[indexA];
                        const b = pointsX[indexB];
                        const distance = Math.abs(a - b);
                        if (distance === 1) {
                            if (a in adjacencyClasses) {
                                adjacencyClasses[b] = adjacencyClasses[a];
                            } else {
                                adjacencyClasses[b] = a;
                            }
                        }
                    }
                }
                const temp2 = Map.groupBy(Object.entries(adjacencyClasses), (x) => x[1]);
                for (const temp3 of temp2) {
                    const adjacentPointsList = [temp3[0], ...temp3[1].map((x) => parseInt(x[0]))];
                    const min = Math.min(...adjacentPointsList);
                    const max = Math.max(...adjacentPointsList);
                    axisAlignedWallLinesX.push({
                        line: [[min, fixedZ], [max + 1, fixedZ]],
                        normalKey: normalKey,
                    });
                }
            }
        }

        return [...axisAlignedWallLinesX, ...axisAlignedWallLinesZ];
    },
};
